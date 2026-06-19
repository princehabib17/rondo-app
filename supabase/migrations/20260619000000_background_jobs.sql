-- Background job queue for heavy async work (bracket generation, etc.)
create table background_jobs (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  payload jsonb not null default '{}',
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'done', 'failed')),
  attempts int not null default 0,
  max_attempts int not null default 3,
  run_after timestamptz not null default now(),
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Efficient claim query: only index rows that still need work.
create index background_jobs_pending_idx
  on background_jobs (run_after, id)
  where status = 'pending';

-- Only server-side service role can touch this table.
alter table background_jobs enable row level security;

-- Atomically claim up to `batch_limit` pending jobs, incrementing attempts.
-- Uses SKIP LOCKED so parallel cron invocations don't double-claim.
create or replace function claim_pending_jobs(batch_limit int default 5)
returns setof background_jobs
language sql
security definer
set search_path = public
as $$
  update background_jobs
  set
    status     = 'processing',
    attempts   = attempts + 1,
    updated_at = now()
  where id in (
    select id
    from   background_jobs
    where  status    = 'pending'
      and  run_after <= now()
      and  attempts  <  max_attempts
    order  by run_after, id
    limit  batch_limit
    for update skip locked
  )
  returning *;
$$;
