-- Apply only to the project hosting transport-routes; no account/trip changes.
create table if not exists public.transport_route_usage (
  usage_day date primary key,
  requests integer not null check (requests between 1 and 30)
);
alter table public.transport_route_usage enable row level security;
revoke all on public.transport_route_usage from public, anon, authenticated;

create or replace function public.claim_transport_request()
returns boolean language plpgsql security definer set search_path = public as $$
declare claimed integer;
begin
  insert into public.transport_route_usage (usage_day, requests)
  values ((now() at time zone 'UTC')::date, 1)
  on conflict (usage_day) do update
    set requests = transport_route_usage.requests + 1 where transport_route_usage.requests < 30
  returning requests into claimed;
  return claimed is not null;
end;
$$;
revoke all on function public.claim_transport_request() from public, anon, authenticated;
grant execute on function public.claim_transport_request() to service_role;
