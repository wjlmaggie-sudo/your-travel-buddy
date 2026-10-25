-- A separate hard cap below Scrappa's advertised 500 free monthly credits.
-- Every attempted upstream search counts, including failures. No automatic topups.
create table if not exists public.car_search_usage (
 usage_month date primary key,
 requests integer not null check (requests between 1 and 400)
);
alter table public.car_search_usage enable row level security;
revoke all on public.car_search_usage from public, anon, authenticated;
create or replace function public.claim_car_search()
returns boolean language plpgsql security definer set search_path = public as $$
declare claimed integer;
begin
 insert into public.car_search_usage (usage_month, requests)
 values (date_trunc('month', now() at time zone 'UTC')::date, 1)
 on conflict (usage_month) do update set requests = car_search_usage.requests + 1
 where car_search_usage.requests < 400 returning requests into claimed;
 return claimed is not null;
end;
$$;
revoke all on function public.claim_car_search() from public, anon, authenticated;
grant execute on function public.claim_car_search() to service_role;
