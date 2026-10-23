-- Install only in the project hosting search-hotels. No trip/account migration required.
create table if not exists public.hotel_preview_usage (
  usage_day date primary key,
  requests integer not null check (requests between 1 and 20)
);
alter table public.hotel_preview_usage enable row level security;
revoke all on public.hotel_preview_usage from public, anon, authenticated;

create or replace function public.claim_hotel_preview()
returns boolean language plpgsql security definer set search_path = public as $$
declare claimed integer;
begin
  insert into public.hotel_preview_usage (usage_day, requests)
  values ((now() at time zone 'UTC')::date, 1)
  on conflict (usage_day) do update
    set requests = hotel_preview_usage.requests + 1 where hotel_preview_usage.requests < 20
  returning requests into claimed;
  return claimed is not null;
end;
$$;
revoke all on function public.claim_hotel_preview() from public, anon, authenticated;
grant execute on function public.claim_hotel_preview() to service_role;
