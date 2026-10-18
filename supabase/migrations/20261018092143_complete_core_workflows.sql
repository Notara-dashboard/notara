-- Complete owner-operated workflows; external accounts remain disconnected.
create table public.meetings (
 id uuid primary key default gen_random_uuid(),owner_id uuid not null default auth.uid() references auth.users(id),
 name text not null check(length(trim(name)) between 1 and 160),property_id uuid,starts_at timestamptz not null,
 consent text not null default 'not_recording' check(consent in('not_recording','consent_recorded')),
 participants text not null default '',notes text not null default '',decisions text not null default '',
 archived_at timestamptz,version integer not null default 1,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(owner_id,id),
 foreign key(owner_id,property_id) references public.properties(owner_id,id)
);
create table public.communications (
 id uuid primary key default gen_random_uuid(),owner_id uuid not null default auth.uid() references auth.users(id),
 name text not null check(length(trim(name)) between 1 and 160),property_id uuid,tenant_id uuid,
 channel text not null default 'Note' check(channel in('Note','Phone','Email','WhatsApp','Letter')),contact text not null default '',occurred_at timestamptz not null,notes text not null default '',
 archived_at timestamptz,version integer not null default 1,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(owner_id,id),
 foreign key(owner_id,property_id) references public.properties(owner_id,id),foreign key(owner_id,tenant_id) references public.tenants(owner_id,id)
);
alter table public.actions add column meeting_id uuid,add column communication_id uuid;
alter table public.actions add foreign key(owner_id,meeting_id) references public.meetings(owner_id,id),add foreign key(owner_id,communication_id) references public.communications(owner_id,id);
alter table public.documents add column lease_id uuid,add column meeting_id uuid;
alter table public.documents add foreign key(owner_id,lease_id) references public.leases(owner_id,id),add foreign key(owner_id,meeting_id) references public.meetings(owner_id,id);
create table public.document_versions (
 id uuid primary key default gen_random_uuid(),owner_id uuid not null references auth.users(id),document_id uuid not null,
 revision integer not null,name text not null,object_path text not null unique,content_type text not null,size_bytes bigint not null,
 created_at timestamptz not null default now(),unique(owner_id,document_id,revision),foreign key(owner_id,document_id) references public.documents(owner_id,id),
 check(split_part(object_path,'/',1)=owner_id::text)
);
create function private.version_document() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or auth.uid()<>new.owner_id then raise exception 'Authenticated owner required';end if;
 if old.object_path<>new.object_path then
 insert into public.document_versions(owner_id,document_id,revision,name,object_path,content_type,size_bytes)
 values(old.owner_id,old.id,old.version,old.name,old.object_path,old.content_type,old.size_bytes);
 end if;return new;
end $$;
revoke all on function private.version_document() from public;
create trigger document_history before update on public.documents for each row execute function private.version_document();
alter table public.document_versions enable row level security;
revoke all on public.document_versions from anon,authenticated;
grant select on public.document_versions to authenticated;
create policy document_version_owner on public.document_versions for select to authenticated using(owner_id=(select auth.uid()) and (select private.is_member()));

create table public.tenant_external_ids (
 id uuid primary key default gen_random_uuid(),owner_id uuid not null default auth.uid() references auth.users(id),
 source_namespace text not null check(length(source_namespace) between 1 and 80),external_id text not null check(length(external_id) between 1 and 160),tenant_id uuid not null,
 created_at timestamptz not null default now(),unique(owner_id,source_namespace,external_id),foreign key(owner_id,tenant_id) references public.tenants(owner_id,id)
);
create table public.import_batches (
 id uuid primary key default gen_random_uuid(),owner_id uuid not null default auth.uid() references auth.users(id),
 name text not null check(length(name) between 1 and 200),source_hash text not null check(source_hash ~ '^[a-f0-9]{64}$'),source_namespace text not null check(length(source_namespace) between 1 and 80),as_of date not null,
 rows jsonb not null check(jsonb_typeof(rows)='array' and jsonb_array_length(rows) between 1 and 2000),
 status text not null default 'staged' check(status in('staged','applied')),snapshot_id uuid,version integer not null default 1,
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(owner_id,source_namespace,source_hash),foreign key(owner_id,snapshot_id) references public.arrears_snapshots(owner_id,id)
);
do $$ declare tab text;begin
 foreach tab in array array['meetings','communications'] loop
 execute format('alter table public.%I enable row level security',tab);
 execute format('revoke all on public.%I from anon,authenticated',tab);
 execute format('grant select,insert,update on public.%I to authenticated',tab);
 execute format('create policy owner_select on public.%I for select to authenticated using(owner_id=(select auth.uid()) and (select private.is_member()))',tab);
 execute format('create policy owner_insert on public.%I for insert to authenticated with check(owner_id=(select auth.uid()) and (select private.is_member()))',tab);
 execute format('create policy owner_update on public.%I for update to authenticated using(owner_id=(select auth.uid()) and (select private.is_member())) with check(owner_id=(select auth.uid()) and (select private.is_member()))',tab);
 execute format('create trigger stamp_record before update on public.%I for each row execute function private.stamp_record()',tab);
 execute format('create trigger audit_record after insert or update on public.%I for each row execute function private.audit_record()',tab);
 end loop;
end $$;
alter table public.tenant_external_ids enable row level security;
revoke all on public.tenant_external_ids from anon,authenticated;
grant select on public.tenant_external_ids to authenticated;
create policy external_owner on public.tenant_external_ids for select to authenticated using(owner_id=(select auth.uid()) and (select private.is_member()));
alter table public.import_batches enable row level security;
revoke all on public.import_batches from anon,authenticated;
grant select,insert on public.import_batches to authenticated;
create policy import_owner_read on public.import_batches for select to authenticated using(owner_id=(select auth.uid()) and (select private.is_member()));
create policy import_owner_stage on public.import_batches for insert to authenticated with check(owner_id=(select auth.uid()) and (select private.is_member()) and status='staged' and snapshot_id is null and version=1);
create trigger stamp_record before update on public.import_batches for each row execute function private.stamp_record();

create function private.apply_arrears_import(batch_id uuid,expected_version integer) returns uuid language plpgsql security definer set search_path='' as $$
declare batch public.import_batches; row jsonb; tenant uuid; mapped uuid; snapshot uuid; amount numeric; prop uuid;
begin
 if not private.is_member() then raise exception 'Workspace access required';end if;
 select * into batch from public.import_batches where id=batch_id and owner_id=auth.uid() for update;
 if not found then raise exception 'Import not found';end if;
 if batch.status='applied' then return batch.snapshot_id;end if;
 if batch.version<>expected_version then raise exception 'Import changed. Review it again.';end if;
 insert into public.arrears_snapshots(owner_id,name,as_of,notes) values(auth.uid(),batch.name,batch.as_of,'Source: '||batch.source_namespace||'; SHA-256: '||batch.source_hash) returning id into snapshot;
 for row in select value from jsonb_array_elements(batch.rows) loop
 if jsonb_typeof(row)<>'object' or coalesce(length(trim(row->>'external_id')),0) not between 1 and 160 or coalesce(length(trim(row->>'tenant_name')),0) not between 1 and 160 then raise exception 'Each row needs a tenant name and external ID';end if;
 prop=(row->>'property_id')::uuid;
 if not exists(select 1 from public.properties where owner_id=auth.uid() and id=prop and archived_at is null) then raise exception 'Invalid property in import';end if;
 if coalesce(row->>'amount','') !~ '^-?[0-9]{1,12}(\.[0-9]{1,2})?$' then raise exception 'Invalid amount in import';end if;
 amount=(row->>'amount')::numeric;
 select tenant_id into mapped from public.tenant_external_ids where owner_id=auth.uid() and source_namespace=batch.source_namespace and external_id=trim(row->>'external_id');
 tenant=nullif(row->>'tenant_id','')::uuid;
 if tenant is not null and not exists(select 1 from public.tenants where owner_id=auth.uid() and id=tenant and archived_at is null) then raise exception 'Invalid tenant in import';end if;
 if mapped is not null and tenant is not null and mapped<>tenant then raise exception 'External ID maps to another tenant. Review the match.';end if;
 tenant=coalesce(mapped,tenant);
 if tenant is null then insert into public.tenants(owner_id,name) values(auth.uid(),trim(row->>'tenant_name')) returning id into tenant;end if;
 if mapped is null then insert into public.tenant_external_ids(owner_id,source_namespace,external_id,tenant_id) values(auth.uid(),batch.source_namespace,trim(row->>'external_id'),tenant);end if;
 insert into public.arrears_balances(owner_id,name,snapshot_id,property_id,tenant_id,amount) values(auth.uid(),trim(row->>'tenant_name'),snapshot,prop,tenant,amount);
 end loop;
 update public.arrears_snapshots set status='finalised' where id=snapshot and owner_id=auth.uid();
 update public.import_batches set status='applied',snapshot_id=snapshot where id=batch.id and owner_id=auth.uid();
 return snapshot;
end $$;
revoke all on function private.apply_arrears_import(uuid,integer) from public;
grant execute on function private.apply_arrears_import(uuid,integer) to authenticated;
create function public.apply_arrears_import(batch_id uuid,expected_version integer) returns uuid language sql security invoker set search_path='' as $$ select private.apply_arrears_import(batch_id,expected_version); $$;
revoke all on function public.apply_arrears_import(uuid,integer) from public;
grant execute on function public.apply_arrears_import(uuid,integer) to authenticated;

create index meetings_owner_property on public.meetings(owner_id,property_id);
create index communications_owner_property on public.communications(owner_id,property_id);
create index communications_owner_tenant on public.communications(owner_id,tenant_id);
create index actions_owner_meeting on public.actions(owner_id,meeting_id);
create index actions_owner_communication on public.actions(owner_id,communication_id);
create index documents_owner_lease on public.documents(owner_id,lease_id);
create index documents_owner_meeting on public.documents(owner_id,meeting_id);
create index external_owner_tenant on public.tenant_external_ids(owner_id,tenant_id);
create index imports_owner_snapshot on public.import_batches(owner_id,snapshot_id);
