create function public.workspace_access() returns boolean language sql stable security invoker set search_path='' as $$ select private.is_member(); $$;
revoke all on function public.workspace_access() from public;
grant execute on function public.workspace_access() to authenticated;
create function public.workspace_summary() returns jsonb language sql stable security invoker set search_path='' as $$
 with active as (select id from public.properties where category='active' and archived_at is null),
 units as (select id from public.premises where archived_at is null and property_id in (select id from active)),
 latest as (select id,as_of from public.arrears_snapshots where status='finalised' and archived_at is null order by as_of desc,created_at desc,id limit 1),
 balances as (select amount from public.arrears_balances where snapshot_id=(select id from latest) and property_id in (select id from active)),
 open_actions as (select * from public.actions where archived_at is null and status='open'),
 day as (select (now() at time zone 'Africa/Johannesburg')::date as d)
 select jsonb_build_object(
 'properties',(select count(*) from active), 'premises',(select count(*) from units),
 'occupied',(select count(distinct premises_id) from public.leases where archived_at is null and premises_id in (select id from units) and start_date<=(select d from day) and end_date>=(select d from day)),
 'open_actions',(select count(*) from open_actions), 'high_priority',(select count(*) from open_actions where priority='High'),
 'overdue',(select count(*) from open_actions where due_date<(select d from day)),
 'expiring',(select count(*) from public.leases where archived_at is null and property_id in (select id from active) and end_date between (select d from day) and (select d+60 from day)),
 'snapshot_date',(select as_of from latest),'debit',(select coalesce(sum(greatest(amount,0)),0) from balances),'credit',(select coalesce(sum(abs(least(amount,0))),0) from balances),
 'events',coalesce((select jsonb_agg(jsonb_build_object('id',id,'name',name,'starts_at',starts_at) order by starts_at) from (select id,name,starts_at from public.events where archived_at is null and (starts_at at time zone 'Africa/Johannesburg')::date=(select d from day) order by starts_at limit 20) t),'[]'::jsonb),
 'actions',coalesce((select jsonb_agg(jsonb_build_object('id',id,'name',name,'due_date',due_date,'priority',priority) order by due_date nulls last) from (select * from open_actions order by due_date nulls last,created_at limit 5) t),'[]'::jsonb)
 ) where private.is_member();
$$;
revoke all on function public.workspace_summary() from public;
grant execute on function public.workspace_summary() to authenticated;
create table public.documents (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null default auth.uid() references auth.users(id),
 name text not null check(length(name) between 1 and 200),object_path text not null unique,content_type text not null,size_bytes bigint not null check(size_bytes between 1 and 20971520),
 property_id uuid,tenant_id uuid, notes text not null default '',archived_at timestamptz,version integer not null default 1,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(owner_id,id),
 foreign key(owner_id,property_id) references public.properties(owner_id,id),foreign key(owner_id,tenant_id) references public.tenants(owner_id,id),
 check(split_part(object_path,'/',1)=owner_id::text)
);
alter table public.documents enable row level security;
revoke all on public.documents from anon,authenticated;
grant select,insert,update on public.documents to authenticated;
create policy owner_select on public.documents for select to authenticated using(owner_id=(select auth.uid()) and (select private.is_member()));
create policy owner_insert on public.documents for insert to authenticated with check(owner_id=(select auth.uid()) and (select private.is_member()));
create policy owner_update on public.documents for update to authenticated using(owner_id=(select auth.uid()) and (select private.is_member())) with check(owner_id=(select auth.uid()) and (select private.is_member()));
create trigger stamp_record before update on public.documents for each row execute function private.stamp_record();
create trigger audit_record after insert or update on public.documents for each row execute function private.audit_record();
create index documents_owner_property on public.documents(owner_id,property_id);
create index documents_owner_tenant on public.documents(owner_id,tenant_id);
create policy notara_cleanup on storage.objects for delete to authenticated using(bucket_id='notara-private' and (storage.foldername(name))[1]=(select auth.uid())::text and (select private.is_member()));
