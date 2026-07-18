-- 067G17B repair: avoid referencing opportunity-only fields on other owned tables.
begin;
create or replace function public.forge_067g17a1_guard_owned_archive_row()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  if new.advisor_id is distinct from old.advisor_id then
    raise exception 'advisor ownership transfer is not allowed';
  end if;
  if old.archived_at is not null and (
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
  if tg_table_name = 'opportunity_status_history' then
    if new.id is distinct from old.id
      or new.opportunity_id is distinct from old.opportunity_id
      or new.from_status is distinct from old.from_status
      or new.to_status is distinct from old.to_status
      or new.change_reason is distinct from old.change_reason
      or new.changed_at is distinct from old.changed_at
      or new.changed_by is distinct from old.changed_by
      or new.created_at is distinct from old.created_at
    then
      raise exception 'opportunity status history is append-only';
    end if;
  end if;
  new.updated_at := now();
  return new;
end;
$$;
commit;
