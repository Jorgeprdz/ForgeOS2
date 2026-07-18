begin;

alter table public.prospects
  add column if not exists full_name text,
  add column if not exists phone_normalized text,
  add column if not exists whatsapp_normalized text,
  add column if not exists email_normalized text,
  add column if not exists source text,
  add column if not exists referrer_name text,
  add column if not exists referrer_relationship text,
  add column if not exists date_of_birth date,
  add column if not exists age integer,
  add column if not exists marital_status text,
  add column if not exists dependents integer,
  add column if not exists occupation text,
  add column if not exists estimated_income numeric(14,2),
  add column if not exists products_of_interest text[] not null default '{}',
  add column if not exists initial_context text,
  add column if not exists status text,
  add column if not exists next_action_type text,
  add column if not exists next_action_at timestamptz,
  add column if not exists created_by uuid references auth.users(id),
  add column if not exists updated_by uuid references auth.users(id);

update public.prospects
set full_name = coalesce(full_name, nullif(btrim(alias), ''), 'Prospecto legado'),
    source = coalesce(source, 'legacy'),
    initial_context = coalesce(initial_context, 'Registro anterior a 067G17B'),
    status = coalesce(status, 'referred_new'),
    created_by = coalesce(created_by, advisor_id),
    updated_by = coalesce(updated_by, advisor_id)
where full_name is null or source is null or initial_context is null or status is null
   or created_by is null or updated_by is null;

alter table public.prospects
  alter column full_name set not null,
  alter column source set not null,
  alter column initial_context set not null,
  alter column status set default 'referred_new',
  alter column status set not null,
  alter column created_by set not null,
  alter column updated_by set not null;

alter table public.prospects drop constraint if exists prospects_contact_required_ck;
alter table public.prospects add constraint prospects_contact_required_ck check (
  archived_at is not null or phone_normalized is not null or whatsapp_normalized is not null
) not valid;
alter table public.prospects drop constraint if exists prospects_age_ck;
alter table public.prospects add constraint prospects_age_ck check (age is null or age between 0 and 120);
alter table public.prospects drop constraint if exists prospects_dependents_ck;
alter table public.prospects add constraint prospects_dependents_ck check (dependents is null or dependents >= 0);
alter table public.prospects drop constraint if exists prospects_estimated_income_ck;
alter table public.prospects add constraint prospects_estimated_income_ck check (estimated_income is null or estimated_income >= 0);
alter table public.prospects drop constraint if exists prospects_status_ck;
alter table public.prospects add constraint prospects_status_ck check (status in (
  'referred_new','contacted','appointment_scheduled','proposal','decision','client'
));

create unique index if not exists prospects_own_active_phone_uq
  on public.prospects (advisor_id, phone_normalized)
  where archived_at is null and phone_normalized is not null;
create unique index if not exists prospects_own_active_whatsapp_uq
  on public.prospects (advisor_id, whatsapp_normalized)
  where archived_at is null and whatsapp_normalized is not null;
create unique index if not exists prospects_own_active_email_uq
  on public.prospects (advisor_id, email_normalized)
  where archived_at is null and email_normalized is not null;
create index if not exists prospects_active_pipeline_idx
  on public.prospects (advisor_id, status, created_at desc)
  where archived_at is null;

create table if not exists public.prospect_audit_events (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid not null,
  advisor_id uuid not null references auth.users(id) on delete restrict,
  event_type text not null check (event_type in ('prospect_created','prospect_updated','prospect_archived')),
  created_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id) on delete restrict,
  source text not null default 'prospect_service',
  before_state jsonb,
  after_state jsonb,
  metadata jsonb not null default '{}'::jsonb,
  constraint prospect_audit_events_owner_ck check (created_by = advisor_id),
  constraint prospect_audit_events_prospect_fk foreign key (prospect_id, advisor_id)
    references public.prospects (id, advisor_id) on delete restrict
);

create index if not exists prospect_audit_events_timeline_idx
  on public.prospect_audit_events (advisor_id, prospect_id, created_at desc);

create or replace function public.forge_067g17b_guard_prospect_write()
returns trigger language plpgsql security invoker set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    if new.advisor_id is distinct from auth.uid() then raise exception 'FORGED_ADVISOR_ID_DENIED'; end if;
    new.created_by := auth.uid();
    new.updated_by := auth.uid();
    new.created_at := now();
    new.updated_at := now();
    new.status := 'referred_new';
  else
    if new.advisor_id is distinct from old.advisor_id then raise exception 'OWNERSHIP_TRANSFER_DENIED'; end if;
    if new.id is distinct from old.id or new.created_at is distinct from old.created_at or new.created_by is distinct from old.created_by then
      raise exception 'IMMUTABLE_PROSPECT_IDENTITY_DENIED';
    end if;
    new.updated_by := auth.uid();
    new.updated_at := now();
  end if;
  return new;
end;
$$;

create or replace function public.forge_067g17b_audit_prospect_write()
returns trigger language plpgsql security definer set search_path = public as $$
declare event_name text;
begin
  event_name := case when tg_op = 'INSERT' then 'prospect_created'
    when new.archived_at is not null and old.archived_at is null then 'prospect_archived'
    else 'prospect_updated' end;
  insert into public.prospect_audit_events
    (prospect_id, advisor_id, event_type, created_by, before_state, after_state)
  values
    (new.id, new.advisor_id, event_name, new.advisor_id,
     case when tg_op = 'INSERT' then null else to_jsonb(old) end, to_jsonb(new));
  return new;
end;
$$;

drop trigger if exists forge_067g17b_guard_prospect_write on public.prospects;
create trigger forge_067g17b_guard_prospect_write before insert or update on public.prospects
for each row execute function public.forge_067g17b_guard_prospect_write();
drop trigger if exists forge_067g17b_audit_prospect_write on public.prospects;
create trigger forge_067g17b_audit_prospect_write after insert or update on public.prospects
for each row execute function public.forge_067g17b_audit_prospect_write();

alter table public.prospect_audit_events enable row level security;
revoke all on public.prospect_audit_events from anon, authenticated;
grant select on public.prospect_audit_events to authenticated;
drop policy if exists prospect_audit_events_select_own on public.prospect_audit_events;
create policy prospect_audit_events_select_own on public.prospect_audit_events
for select to authenticated using (advisor_id = auth.uid());

revoke delete on public.prospects from authenticated;

commit;
