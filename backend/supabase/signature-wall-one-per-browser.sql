-- Run this once in the same Supabase project's SQL Editor.
-- Existing drawings are retained; no rows are removed.
create or replace function public.signature_wall_submit_one(
  p_id uuid, p_owner_hash text, p_visitor_hash text, p_drawing jsonb, p_owner_hashes text[]
)
returns text language plpgsql security invoker set search_path = public as $$
declare existing_owner text;
begin
  -- Serialize simultaneous requests from this browser, including separate tabs.
  perform pg_advisory_xact_lock(hashtextextended('owner:' || p_owner_hash, 0));
  perform pg_advisory_xact_lock(hashtextextended('visitor:' || p_visitor_hash, 0));
  select owner_hash into existing_owner from public.signature_wall where id = p_id;
  if found then
    if existing_owner = p_owner_hash then return 'existing'; end if;
    return 'conflict';
  end if;
  if exists (select 1 from public.signature_wall where owner_hash = p_owner_hash or owner_hash = any(p_owner_hashes)) then
    return 'already_exists';
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
revoke all on function public.signature_wall_submit_one(uuid, text, text, jsonb, text[]) from public, anon, authenticated;
grant execute on function public.signature_wall_submit_one(uuid, text, text, jsonb, text[]) to service_role;
