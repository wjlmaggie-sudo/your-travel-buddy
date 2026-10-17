-- Independent of trip tables: can be installed in the separate AI project.
create table if not exists public.ai_daily_usage (
  user_id uuid not null,
  usage_day date not null default (now() at time zone 'UTC')::date,
  requests integer not null default 0 check (requests between 0 and 20),
  primary key (user_id, usage_day)
);
alter table public.ai_daily_usage enable row level security;
revoke all on public.ai_daily_usage from anon, authenticated;
create or replace function public.claim_ai_request(request_user uuid)
returns boolean language plpgsql security definer set search_path = public as $$
declare claimed integer;
begin
  insert into public.ai_daily_usage (user_id, usage_day, requests)
  values (request_user, (now() at time zone 'UTC')::date, 1)
  on conflict (user_id, usage_day) do update
    set requests = ai_daily_usage.requests + 1 where ai_daily_usage.requests < 20
  returning requests into claimed;
  return claimed is not null;
end;
$$;
revoke all on function public.claim_ai_request(uuid) from public, anon, authenticated;
grant execute on function public.claim_ai_request(uuid) to service_role;
