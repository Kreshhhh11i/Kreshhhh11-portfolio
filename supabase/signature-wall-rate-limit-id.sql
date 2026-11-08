-- Run once in the Supabase SQL Editor to make existing rate-limit rows
-- editable in the Table Editor. This preserves all existing rows.
alter table public.signature_wall_rate_limits
  add column if not exists id uuid default gen_random_uuid();

update public.signature_wall_rate_limits set id = gen_random_uuid() where id is null;

alter table public.signature_wall_rate_limits
  alter column id set default gen_random_uuid(),
  alter column id set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.signature_wall_rate_limits'::regclass and contype = 'p'
  ) then
    alter table public.signature_wall_rate_limits
      add constraint signature_wall_rate_limits_pkey primary key (id);
  end if;
end;
$$;
