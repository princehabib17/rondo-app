-- Refunds use their ledger note as an idempotency key
-- (refund:<game>:<player>:<n>, refund_reversal:<game>:<player>:<n>).
-- A unique index makes overlapping refund requests (a drop-out racing a
-- cancellation, a double tap) insert at most one row; the app treats the
-- conflict as "already refunded". Only the numbered note format is covered,
-- so older refund rows (which may legitimately repeat) can't block it.
-- Safe to re-run.

do $$
begin
  create unique index if not exists wallet_transactions_refund_note_key
    on public.wallet_transactions (note)
    where source = 'refund' and note ~ ':[0-9]+$';
exception when unique_violation then
  raise notice 'wallet_transactions_refund_note_key skipped: duplicate refund notes already exist';
end $$;
