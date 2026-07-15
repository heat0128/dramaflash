alter table public.episodes add column if not exists price_usd numeric(10,2);
alter table public.series add column if not exists season_price_usd numeric(10,2);
alter table public.subscription_plans add column if not exists billing_interval text default 'month';
alter table public.transactions drop constraint if exists transactions_type_check;
alter table public.transactions add constraint transactions_type_check
  check (type in ('coin_pack', 'subscription', 'episode', 'season', 'refund'));

create or replace function public.credit_wallet(
  p_user_id uuid,
  p_amount integer,
  p_entry_type text,
  p_reference_type text,
  p_reference_id text,
  p_idempotency_key text
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_balance integer;
begin
  if p_amount <= 0 then raise exception 'INVALID_AMOUNT'; end if;

  if exists (
    select 1 from public.wallet_ledger
    where user_id = p_user_id and idempotency_key = p_idempotency_key
  ) then
    select coins into v_balance from public.profiles where id = p_user_id;
    return v_balance;
  end if;

  update public.profiles
  set coins = coins + p_amount
  where id = p_user_id
  returning coins into v_balance;

  insert into public.wallet_ledger (
    user_id, amount, balance_after, entry_type, reference_type, reference_id, idempotency_key
  ) values (
    p_user_id, p_amount, v_balance, p_entry_type, p_reference_type, p_reference_id, p_idempotency_key
  );
  return v_balance;
end;
$$;

revoke all on function public.credit_wallet(uuid, integer, text, text, text, text) from public;
grant execute on function public.credit_wallet(uuid, integer, text, text, text, text) to service_role;
