-- Global pilot quota, independent of account/trip storage. Fail closed on errors.
create table if not exists public.flight_search_usage (
 usage_month date primary key,
 requests integer not null check (requests between 1 and 200)
);
alter table public.flight_search_usage enable row level security;
revoke all on public.flight_search_usage from public, anon, authenticated;
create or replace function public.claim_flight_search()
returns boolean language plpgsql security definer set search_path = public as $$
declare claimed integer;
begin
 insert into public.flight_search_usage (usage_month, requests)
 values (date_trunc('month', now() at time zone 'UTC')::date, 1)
 on conflict (usage_month) do update set requests = flight_search_usage.requests + 1
 where flight_search_usage.requests < 200 returning requests into claimed;
 return claimed is not null;
end;
$$;
revoke all on function public.claim_flight_search() from public, anon, authenticated;
grant execute on function public.claim_flight_search() to service_role;
