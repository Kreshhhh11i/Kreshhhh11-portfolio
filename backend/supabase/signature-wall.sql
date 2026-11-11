-- Run once in the Supabase SQL Editor. Visitor access is only through the Next.js API.
create table if not exists public.signature_wall (
  id uuid primary key,
  owner_hash text not null,
  drawing jsonb not null,
  created_at timestamptz not null default now()
);
create index if not exists signature_wall_created_idx on public.signature_wall (created_at desc, id desc);
alter table public.signature_wall enable row level security;
revoke all on public.signature_wall from anon, authenticated;
grant select, insert, delete on public.signature_wall to service_role;

create table if not exists public.signature_wall_rate_limits (
  id uuid primary key default gen_random_uuid(),
  visitor_hash text not null,
  created_at timestamptz not null default now()
);
create index if not exists signature_wall_rate_idx on public.signature_wall_rate_limits (visitor_hash, created_at);
alter table public.signature_wall_rate_limits enable row level security;
revoke all on public.signature_wall_rate_limits from anon, authenticated;
grant select, insert, delete on public.signature_wall_rate_limits to service_role;

create or replace function public.signature_wall_submit(p_id uuid, p_owner_hash text, p_visitor_hash text, p_drawing jsonb)
returns text language plpgsql security invoker set search_path = public as $$
declare existing_owner text;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_visitor_hash, 0));
  select owner_hash into existing_owner from public.signature_wall where id = p_id;
  if found then
    if existing_owner = p_owner_hash then return 'existing'; end if;
    return 'conflict';
  end if;
  delete from public.signature_wall_rate_limits where created_at < now() - interval '1 day';
  if (select count(*) from public.signature_wall_rate_limits where visitor_hash = p_visitor_hash and created_at > now() - interval '1 hour') >= 5 then
    return 'rate_limited';
  end if;
  insert into public.signature_wall(id, owner_hash, drawing) values (p_id, p_owner_hash, p_drawing);
  insert into public.signature_wall_rate_limits(visitor_hash) values (p_visitor_hash);
  return 'created';
end;
$$;
revoke all on function public.signature_wall_submit(uuid, text, text, jsonb) from public, anon, authenticated;
grant execute on function public.signature_wall_submit(uuid, text, text, jsonb) to service_role;
