-- Invite-only workspace. No example business records are inserted.
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;
create table private.allowed_accounts (email text primary key check (email = lower(email)));
insert into private.allowed_accounts values ('notara@mjwgroup.co.za');

create function private.is_member() returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists (
 select 1 from auth.users u join private.allowed_accounts a on a.email=lower(u.email)
 where u.id=auth.uid() and u.email_confirmed_at is not null
 );
$$;
revoke all on function private.is_member() from public;
grant execute on function private.is_member() to authenticated;

create function private.check_signup() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if not exists (select 1 from private.allowed_accounts where email=lower(new.email)) then
 raise exception 'This workspace is invitation only.'; end if;
 return new;
end $$;
revoke all on function private.check_signup() from public;
create trigger notara_invite_only before insert on auth.users for each row execute function private.check_signup();

create table public.properties (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null default auth.uid() references auth.users(id),
 name text not null check (length(trim(name)) between 1 and 160), address text not null default '',
 category text not null default 'active' check(category in ('active','oversight','archived')),
 property_type text not null default 'Commercial', notes text not null default '',
 archived_at timestamptz, version integer not null default 1, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(owner_id,id)
);
create table public.premises (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null default auth.uid() references auth.users(id),
 property_id uuid not null, name text not null check(length(trim(name)) between 1 and 160), area numeric(12,2) check(area>=0), notes text not null default '',
 archived_at timestamptz, version integer not null default 1, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(owner_id,id), unique(owner_id,property_id,name), unique(owner_id,property_id,id), foreign key(owner_id,property_id) references public.properties(owner_id,id)
);
create table public.tenants (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null default auth.uid() references auth.users(id),
 name text not null check(length(trim(name)) between 1 and 160), registration text not null default '', email text not null default '', phone text not null default '', notes text not null default '',
 external_id text, archived_at timestamptz, version integer not null default 1, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(owner_id,id), unique(owner_id,external_id)
);
create table public.contacts (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null default auth.uid() references auth.users(id),
 name text not null check(length(trim(name)) between 1 and 160), tenant_id uuid, email text not null default '', phone text not null default '', role text not null default '', notes text not null default '',
 archived_at timestamptz, version integer not null default 1, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(owner_id,id), foreign key(owner_id,tenant_id) references public.tenants(owner_id,id)
);
create table public.actions (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null default auth.uid() references auth.users(id),
 name text not null check(length(trim(name)) between 1 and 160), property_id uuid, tenant_id uuid, due_date date,
 priority text not null default 'Medium' check(priority in ('High','Medium','Low')), status text not null default 'open' check(status in ('open','done')), notes text not null default '',
 archived_at timestamptz, version integer not null default 1, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(owner_id,id),
 foreign key(owner_id,property_id) references public.properties(owner_id,id), foreign key(owner_id,tenant_id) references public.tenants(owner_id,id)
);
create table public.leases (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null default auth.uid() references auth.users(id),
 name text not null check(length(trim(name)) between 1 and 160), property_id uuid not null, premises_id uuid not null, tenant_id uuid not null,
 start_date date not null, end_date date not null, monthly_rent numeric(18,2) not null check(monthly_rent>=0), currency text not null default 'ZAR' check(currency='ZAR'), notes text not null default '',
 archived_at timestamptz, version integer not null default 1, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(owner_id,id), check(end_date>=start_date),
 foreign key(owner_id,property_id,premises_id) references public.premises(owner_id,property_id,id), foreign key(owner_id,tenant_id) references public.tenants(owner_id,id)
);
create extension if not exists btree_gist with schema extensions;
alter table public.leases add constraint no_overlapping_leases exclude using gist
 (premises_id with =, daterange(start_date,end_date,'[]') with &&) where (archived_at is null);
create table public.events (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null default auth.uid() references auth.users(id),
 name text not null check(length(trim(name)) between 1 and 160), property_id uuid, starts_at timestamptz not null, ends_at timestamptz not null, location text not null default '', notes text not null default '',
 archived_at timestamptz, version integer not null default 1, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(owner_id,id), check(ends_at>starts_at), foreign key(owner_id,property_id) references public.properties(owner_id,id)
);
create table public.turnover_requirements (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null default auth.uid() references auth.users(id), name text not null check(length(trim(name)) between 1 and 160),
 tenant_id uuid not null, start_date date not null, end_date date, notes text not null default '',
 archived_at timestamptz, version integer not null default 1, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(owner_id,id), check(end_date is null or end_date>=start_date), foreign key(owner_id,tenant_id) references public.tenants(owner_id,id)
);
create table public.turnover_submissions (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null default auth.uid() references auth.users(id), name text not null check(length(trim(name)) between 1 and 160),
 requirement_id uuid not null, period date not null check(extract(day from period)=1), amount numeric(18,2) not null check(amount>=0), currency text not null default 'ZAR' check(currency='ZAR'), notes text not null default '',
 archived_at timestamptz, version integer not null default 1, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(owner_id,id), unique(owner_id,requirement_id,period), foreign key(owner_id,requirement_id) references public.turnover_requirements(owner_id,id)
);
create table public.arrears_snapshots (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null default auth.uid() references auth.users(id), name text not null check(length(trim(name)) between 1 and 160),
 as_of date not null, status text not null default 'draft' check(status in ('draft','finalised')), currency text not null default 'ZAR' check(currency='ZAR'), notes text not null default '',
 archived_at timestamptz, version integer not null default 1, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(owner_id,id)
);
create table public.arrears_balances (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null default auth.uid() references auth.users(id), name text not null check(length(trim(name)) between 1 and 160),
 snapshot_id uuid not null, property_id uuid not null, tenant_id uuid not null, amount numeric(18,2) not null, notes text not null default '',
 archived_at timestamptz, version integer not null default 1, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(owner_id,id), unique(owner_id,snapshot_id,property_id,tenant_id),
 foreign key(owner_id,snapshot_id) references public.arrears_snapshots(owner_id,id), foreign key(owner_id,property_id) references public.properties(owner_id,id), foreign key(owner_id,tenant_id) references public.tenants(owner_id,id)
);
create table public.user_preferences (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null default auth.uid() references auth.users(id) unique,
 value jsonb not null default '{}' check(jsonb_typeof(value)='object'), version integer not null default 1, updated_at timestamptz not null default now()
);
create table public.audit_events (
 id bigint generated always as identity primary key, owner_id uuid not null references auth.users(id), actor_id uuid not null,
 table_name text not null, record_id uuid not null, operation text not null, changed_fields text[] not null, occurred_at timestamptz not null default now()
);

create function private.stamp_record() returns trigger language plpgsql set search_path='' as $$
begin
 if TG_OP='UPDATE' then
 if new.owner_id<>old.owner_id or new.id<>old.id then raise exception 'Record ownership cannot change'; end if;
 new.version=old.version+1; new.updated_at=now();
 end if;
 return new;
end $$;
create function private.audit_record() returns trigger language plpgsql security definer set search_path='' as $$
declare changed text[];
begin
 if auth.uid() is null or auth.uid()<>new.owner_id then raise exception 'Authenticated owner required'; end if;
 select array_agg(key) into changed from jsonb_each(to_jsonb(new)) where TG_OP='INSERT' or value is distinct from to_jsonb(old)->key;
 insert into public.audit_events(owner_id,actor_id,table_name,record_id,operation,changed_fields) values(new.owner_id,auth.uid(),TG_TABLE_NAME,new.id,TG_OP,changed);
 return new;
end $$;
revoke all on function private.stamp_record(),private.audit_record() from public;

create function private.protect_financials() returns trigger language plpgsql set search_path='' as $$
declare snapshot uuid;
begin
 if TG_TABLE_NAME='arrears_snapshots' then
 if old.status='finalised' then raise exception 'Finalised snapshots are immutable. Create a new dated snapshot.'; end if;
 else
 snapshot=coalesce(new.snapshot_id,old.snapshot_id);
 perform 1 from public.arrears_snapshots where id=snapshot for update;
 if exists(select 1 from public.arrears_snapshots where id in (snapshot,old.snapshot_id) and status='finalised') then raise exception 'Finalised balances are immutable'; end if;
 end if;
 return new;
end $$;
revoke all on function private.protect_financials() from public;
create trigger protect_snapshot before update on public.arrears_snapshots for each row execute function private.protect_financials();
create trigger protect_balance before insert or update on public.arrears_balances for each row execute function private.protect_financials();

do $$ declare tab text; begin
 foreach tab in array array['properties','premises','tenants','contacts','actions','leases','events','turnover_requirements','turnover_submissions','arrears_snapshots','arrears_balances','user_preferences'] loop
 execute format('alter table public.%I enable row level security',tab);
 execute format('revoke all on public.%I from anon, authenticated',tab);
 execute format('grant select,insert,update on public.%I to authenticated',tab);
 execute format('create policy owner_select on public.%I for select to authenticated using (owner_id=(select auth.uid()) and (select private.is_member()))',tab);
 execute format('create policy owner_insert on public.%I for insert to authenticated with check (owner_id=(select auth.uid()) and (select private.is_member()))',tab);
 execute format('create policy owner_update on public.%I for update to authenticated using (owner_id=(select auth.uid()) and (select private.is_member())) with check (owner_id=(select auth.uid()) and (select private.is_member()))',tab);
 execute format('create index %I on public.%I(owner_id)',tab||'_owner_idx',tab);
 execute format('create trigger stamp_record before update on public.%I for each row execute function private.stamp_record()',tab);
 if tab<>'user_preferences' then execute format('create trigger audit_record after insert or update on public.%I for each row execute function private.audit_record()',tab); end if;
 end loop;
end $$;
alter table public.audit_events enable row level security;
revoke all on public.audit_events from anon,authenticated;
grant select on public.audit_events to authenticated;
create policy owner_audit on public.audit_events for select to authenticated using(owner_id=(select auth.uid()) and (select private.is_member()));
create index audit_owner_date on public.audit_events(owner_id,occurred_at desc);
create index action_owner_due on public.actions(owner_id,status,due_date) where archived_at is null;
create index lease_owner_property on public.leases(owner_id,property_id,end_date);
create index balance_owner_snapshot on public.arrears_balances(owner_id,snapshot_id);
create index contacts_owner_tenant on public.contacts(owner_id,tenant_id);
create index actions_owner_property on public.actions(owner_id,property_id);
create index actions_owner_tenant on public.actions(owner_id,tenant_id);
create index lease_owner_tenant on public.leases(owner_id,tenant_id);
create index event_owner_property on public.events(owner_id,property_id);
create index turnover_owner_tenant on public.turnover_requirements(owner_id,tenant_id);
create index balance_owner_property on public.arrears_balances(owner_id,property_id);
create index balance_owner_tenant on public.arrears_balances(owner_id,tenant_id);
-- File access is private, scoped to a confirmed allowlisted owner.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
 values('notara-private','notara-private',false,20971520,array['application/pdf','image/jpeg','image/png','text/plain','text/csv']);
create policy notara_read on storage.objects for select to authenticated using(bucket_id='notara-private' and (storage.foldername(name))[1]=(select auth.uid())::text and (select private.is_member()));
create policy notara_upload on storage.objects for insert to authenticated with check(bucket_id='notara-private' and (storage.foldername(name))[1]=(select auth.uid())::text and (select private.is_member()));
