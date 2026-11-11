-- Run after signature-wall.sql. Existing drawings remain approved and unchanged.
alter table public.signature_wall
  add column if not exists moderation_status text not null default 'approved',
  add column if not exists preview_path text;
-- Old deployments must not publish new rows before generating a review image.
alter table public.signature_wall alter column moderation_status set default 'processing';
grant update on public.signature_wall to service_role;

do $$
begin
  if not exists (select 1 from pg_constraint where conrelid = 'public.signature_wall'::regclass and conname = 'signature_wall_moderation_status_check') then
    alter table public.signature_wall add constraint signature_wall_moderation_status_check
      check (moderation_status in ('processing', 'pending', 'approved', 'rejected'));
  end if;
end;
$$;

create or replace function public.signature_wall_submit_moderated(
  p_id uuid, p_owner_hash text, p_visitor_hash text, p_drawing jsonb, p_owner_hashes text[], p_preview_path text
)
returns text language plpgsql security invoker set search_path = public as $$
declare existing_owner text;
begin
  perform pg_advisory_xact_lock(hashtextextended('owner:' || p_owner_hash, 0));
  perform pg_advisory_xact_lock(hashtextextended('visitor:' || p_visitor_hash, 0));
  select owner_hash into existing_owner from public.signature_wall where id = p_id;
  if found then
    if existing_owner = p_owner_hash then return 'existing'; end if;
    return 'conflict';
  end if;
  if exists (select 1 from public.signature_wall where moderation_status <> 'rejected' and (owner_hash = p_owner_hash or owner_hash = any(p_owner_hashes))) then
    return 'already_exists';
  end if;
  delete from public.signature_wall_rate_limits where created_at < now() - interval '1 day';
  if (select count(*) from public.signature_wall_rate_limits where visitor_hash = p_visitor_hash and created_at > now() - interval '1 hour') >= 5 then
    return 'rate_limited';
  end if;
  insert into public.signature_wall(id, owner_hash, drawing, moderation_status, preview_path)
    values (p_id, p_owner_hash, p_drawing, 'processing', p_preview_path);
  insert into public.signature_wall_rate_limits(visitor_hash) values (p_visitor_hash);
  return 'created';
end;
$$;
revoke all on function public.signature_wall_submit_moderated(uuid, text, text, jsonb, text[], text) from public, anon, authenticated;
grant execute on function public.signature_wall_submit_moderated(uuid, text, text, jsonb, text[], text) to service_role;
