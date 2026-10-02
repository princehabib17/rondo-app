-- Match chat and the pitch-side timer listen for live changes, but neither
-- table was ever added to the realtime publication, so new messages and clock
-- changes only showed up after a refresh. Adding a table twice errors, so
-- guard each statement. Safe to re-run.

do $$
begin
  alter publication supabase_realtime add table public.messages;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.timer_sessions;
exception when duplicate_object then null;
end $$;
