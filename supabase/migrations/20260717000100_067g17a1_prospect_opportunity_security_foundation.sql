-- 067G17A1 PROSPECT / OPPORTUNITY LOCAL SECURITY FOUNDATION
-- Repository preparation only. This file is not authorization to deploy.
-- Ownership: advisor_id = auth.uid(). Deletion model: archive, never frontend DELETE.

begin;

create extension if not exists pgcrypto;

alter table public.prospects
  add column if not exists advisor_id uuid,
  add column if not exists display_name text,
  add column if not exists notes text,
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists archived_at timestamptz,
  add column if not exists archived_by uuid references auth.users(id),
  add column if not exists archive_reason text;

do $$
begin
  if exists (select 1 from public.prospects where advisor_id is null) then
    raise exception '067G17A1 blocked: every existing prospect requires advisor ownership before migration';
  end if;
end;
$$;

alter table public.prospects alter column advisor_id set not null;

do $$
declare
  constraint_name text;
begin
  for constraint_name in
    select c.conname
    from pg_constraint c
    where c.conrelid = 'public.prospects'::regclass
      and c.contype = 'f'
      and c.confrelid = 'auth.users'::regclass
      and c.conkey = array[(select attnum from pg_attribute where attrelid = 'public.prospects'::regclass and attname = 'advisor_id')]
  loop
    execute format('alter table public.prospects drop constraint %I', constraint_name);
  end loop;
end;
$$;

alter table public.prospects
  add constraint prospects_advisor_owner_fk
  foreign key (advisor_id) references auth.users(id) on delete restrict;

create unique index if not exists prospects_id_advisor_uidx
  on public.prospects (id, advisor_id);

create table public.opportunities (
  id uuid primary key default gen_random_uuid(),
  advisor_id uuid not null references auth.users(id) on delete restrict,
  prospect_id uuid not null,
  title text not null,
  status text not null,
  next_action text,
  next_action_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  archived_by uuid references auth.users(id),
  archive_reason text,
  constraint opportunities_prospect_owner_fk
    foreign key (prospect_id, advisor_id)
    references public.prospects (id, advisor_id)
    on delete restrict,
  constraint opportunities_archive_metadata_ck check (
    (archived_at is null and archived_by is null and archive_reason is null)
    or
    (archived_at is not null and archived_by is not null and nullif(btrim(archive_reason), '') is not null)
  ),
  unique (id, advisor_id)
);

create table public.prospect_contact_methods (
  id uuid primary key default gen_random_uuid(),
  advisor_id uuid not null references auth.users(id) on delete restrict,
  prospect_id uuid not null,
  method_type text not null,
  method_value text not null,
  is_primary boolean not null default false,
  consent_status text not null default 'unknown',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  archived_by uuid references auth.users(id),
  archive_reason text,
  constraint prospect_contact_methods_owner_fk
    foreign key (prospect_id, advisor_id)
    references public.prospects (id, advisor_id)
    on delete restrict,
  constraint prospect_contact_methods_archive_metadata_ck check (
    (archived_at is null and archived_by is null and archive_reason is null)
    or
    (archived_at is not null and archived_by is not null and nullif(btrim(archive_reason), '') is not null)
  )
);

create table public.prospect_provenance (
  id uuid primary key default gen_random_uuid(),
  advisor_id uuid not null references auth.users(id) on delete restrict,
  prospect_id uuid not null,
  source_type text not null,
  source_reference text,
  referrer_name text,
  relationship_to_prospect text,
  evidence_reference text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  archived_by uuid references auth.users(id),
  archive_reason text,
  constraint prospect_provenance_owner_fk
    foreign key (prospect_id, advisor_id)
    references public.prospects (id, advisor_id)
    on delete restrict,
  constraint prospect_provenance_archive_metadata_ck check (
    (archived_at is null and archived_by is null and archive_reason is null)
    or
    (archived_at is not null and archived_by is not null and nullif(btrim(archive_reason), '') is not null)
  )
);

create table public.opportunity_status_history (
  id uuid primary key default gen_random_uuid(),
  advisor_id uuid not null references auth.users(id) on delete restrict,
  opportunity_id uuid not null,
  from_status text,
  to_status text not null,
  change_reason text,
  changed_at timestamptz not null default now(),
  changed_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  archived_by uuid references auth.users(id),
  archive_reason text,
  constraint opportunity_status_history_owner_fk
    foreign key (opportunity_id, advisor_id)
    references public.opportunities (id, advisor_id)
    on delete restrict,
  constraint opportunity_status_history_actor_ck check (changed_by = advisor_id),
  constraint opportunity_status_history_archive_metadata_ck check (
    (archived_at is null and archived_by is null and archive_reason is null)
    or
    (archived_at is not null and archived_by is not null and nullif(btrim(archive_reason), '') is not null)
  )
);

alter table public.prospects
  drop constraint if exists prospects_archive_metadata_ck;
alter table public.prospects
  add constraint prospects_archive_metadata_ck check (
    (archived_at is null and archived_by is null and archive_reason is null)
    or
    (archived_at is not null and archived_by is not null and nullif(btrim(archive_reason), '') is not null)
  );

create index if not exists opportunities_advisor_prospect_idx
  on public.opportunities (advisor_id, prospect_id);
create index if not exists opportunities_advisor_status_active_idx
  on public.opportunities (advisor_id, status) where archived_at is null;
create index if not exists prospect_contact_methods_advisor_prospect_idx
  on public.prospect_contact_methods (advisor_id, prospect_id);
create index if not exists prospect_provenance_advisor_prospect_idx
  on public.prospect_provenance (advisor_id, prospect_id);
create index if not exists opportunity_status_history_advisor_opportunity_idx
  on public.opportunity_status_history (advisor_id, opportunity_id, changed_at desc);

create or replace function public.forge_067g17a1_guard_owned_archive_row()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'UPDATE' and new.advisor_id is distinct from old.advisor_id then
    raise exception 'advisor ownership transfer is not allowed';
  end if;
  if tg_op = 'UPDATE' and old.archived_at is not null and (
    new.archived_at is distinct from old.archived_at
    or new.archived_by is distinct from old.archived_by
    or new.archive_reason is distinct from old.archive_reason
  ) then
    raise exception 'archive history is immutable';
  end if;
  if new.archived_at is not null and (
    new.archived_by is distinct from new.advisor_id
    or nullif(btrim(new.archive_reason), '') is null
  ) then
    raise exception 'archive requires the owning advisor and a reason';
  end if;
  if tg_table_name = 'opportunity_status_history' and (
    new.id is distinct from old.id
    or new.opportunity_id is distinct from old.opportunity_id
    or new.from_status is distinct from old.from_status
    or new.to_status is distinct from old.to_status
    or new.change_reason is distinct from old.change_reason
    or new.changed_at is distinct from old.changed_at
    or new.changed_by is distinct from old.changed_by
    or new.created_at is distinct from old.created_at
  ) then
    raise exception 'opportunity status history is append-only';
  end if;
  new.updated_at := now();
  return new;
end;
$$;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'prospects',
    'opportunities',
    'prospect_contact_methods',
    'prospect_provenance',
    'opportunity_status_history'
  ] loop
    execute format('drop trigger if exists forge_067g17a1_owned_archive_guard on public.%I', table_name);
    execute format(
      'create trigger forge_067g17a1_owned_archive_guard before update on public.%I for each row execute function public.forge_067g17a1_guard_owned_archive_row()',
      table_name
    );
  end loop;
end;
$$;

alter table public.prospects enable row level security;
alter table public.opportunities enable row level security;
alter table public.prospect_contact_methods enable row level security;
alter table public.prospect_provenance enable row level security;
alter table public.opportunity_status_history enable row level security;

drop policy if exists "prospects_delete_own_rows" on public.prospects;

do $$
declare
  table_name text;
  policy_name text;
begin
  foreach table_name in array array[
    'prospects',
    'opportunities',
    'prospect_contact_methods',
    'prospect_provenance',
    'opportunity_status_history'
  ] loop
    execute format('revoke all on table public.%I from anon', table_name);
    execute format('revoke all on table public.%I from authenticated', table_name);
    execute format('grant select, insert, update on table public.%I to authenticated', table_name);
    for policy_name in
      select policyname from pg_policies where schemaname = 'public' and tablename = table_name and cmd = 'DELETE'
    loop
      execute format('drop policy if exists %I on public.%I', policy_name, table_name);
    end loop;
    execute format('drop policy if exists %I on public.%I', table_name || '_select_own_rows', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_insert_own_rows', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_update_own_rows', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_archive_metadata_required', table_name);
    execute format(
      'create policy %I on public.%I for select to authenticated using (advisor_id = auth.uid())',
      table_name || '_select_own_rows', table_name
    );
    execute format(
      'create policy %I on public.%I for insert to authenticated with check (advisor_id = auth.uid())',
      table_name || '_insert_own_rows', table_name
    );
    execute format(
      'create policy %I on public.%I for update to authenticated using (advisor_id = auth.uid()) with check (advisor_id = auth.uid())',
      table_name || '_update_own_rows', table_name
    );
    execute format(
      'create policy %I on public.%I as restrictive for update to authenticated using (advisor_id = auth.uid()) with check ((archived_at is null and archived_by is null and archive_reason is null) or (archived_at is not null and archived_by = auth.uid() and nullif(btrim(archive_reason), '''') is not null))',
      table_name || '_archive_metadata_required', table_name
    );
  end loop;
end;
$$;

create or replace view public.active_prospects
with (security_invoker = true)
as select * from public.prospects where archived_at is null;

create or replace view public.active_opportunities
with (security_invoker = true)
as
select o.*
from public.opportunities o
join public.prospects p
  on p.id = o.prospect_id
 and p.advisor_id = o.advisor_id
where o.archived_at is null
  and p.archived_at is null;

revoke all on public.active_prospects from anon;
revoke all on public.active_opportunities from anon;
grant select on public.active_prospects to authenticated;
grant select on public.active_opportunities to authenticated;

commit;
