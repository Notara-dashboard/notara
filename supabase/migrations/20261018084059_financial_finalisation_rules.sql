create or replace function private.protect_financials() returns trigger language plpgsql set search_path='' as $$
declare snapshot uuid;
begin
 if TG_TABLE_NAME='arrears_snapshots' then
 if TG_OP='INSERT' then
 if new.status<>'draft' then raise exception 'Create a draft and add balances before finalising.'; end if;
 elsif old.status='finalised' then raise exception 'Finalised snapshots are immutable. Create a new dated snapshot.';
 elsif new.status='finalised' and not exists(select 1 from public.arrears_balances where snapshot_id=new.id and archived_at is null) then
 raise exception 'Add at least one balance before finalising.';
 end if;
 else
 snapshot=coalesce(new.snapshot_id,old.snapshot_id);
 perform 1 from public.arrears_snapshots where id=snapshot for update;
 if exists(select 1 from public.arrears_snapshots where id in (snapshot,old.snapshot_id) and status='finalised') then raise exception 'Finalised balances are immutable'; end if;
 end if;
 return new;
end $$;
drop trigger protect_snapshot on public.arrears_snapshots;
create trigger protect_snapshot before insert or update on public.arrears_snapshots for each row execute function private.protect_financials();
create or replace function public.workspace_summary() returns jsonb language sql stable security invoker set search_path='' as $$
 with active as (select id from public.properties where category='active' and archived_at is null),
 units as (select id from public.premises where archived_at is null and property_id in (select id from active)),
 latest as (select id,as_of from public.arrears_snapshots where status='finalised' and archived_at is null order by as_of desc,created_at desc,id limit 1),
 balances as (select amount from public.arrears_balances where archived_at is null and snapshot_id=(select id from latest) and property_id in (select id from active)),
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
create or replace function public.portfolio_insights(report_month date) returns jsonb language sql stable security invoker set search_path='' as $$
 with active as(select id,name from public.properties where category='active' and archived_at is null),
 business_day as(select (now() at time zone 'Africa/Johannesburg')::date as d),
 expected as(select r.* from public.turnover_requirements r where archived_at is null and start_date<=(date_trunc('month',report_month)+interval '1 month - 1 day')::date and (end_date is null or end_date>=date_trunc('month',report_month)::date)),
 returns as(select e.id,e.name,t.name as tenant,s.amount,py.amount as previous_amount from expected e join public.tenants t on t.id=e.tenant_id left join public.turnover_submissions s on s.requirement_id=e.id and s.period=date_trunc('month',report_month)::date and s.archived_at is null left join public.turnover_submissions py on py.requirement_id=e.id and py.period=(date_trunc('month',report_month)-interval '1 year')::date and py.archived_at is null),
 snapshots as(select distinct on(as_of) id,as_of from public.arrears_snapshots where status='finalised' and archived_at is null order by as_of desc,created_at desc,id),
 history as(select s.id,s.as_of,coalesce(sum(greatest(b.amount,0)) filter(where b.property_id in(select id from active)),0) as debit,coalesce(sum(abs(least(b.amount,0))) filter(where b.property_id in(select id from active)),0) as credit from snapshots s left join public.arrears_balances b on b.snapshot_id=s.id and b.archived_at is null group by s.id,s.as_of order by s.as_of desc limit 12),
 vacancies as(select u.id,u.name,p.name as property,u.area from public.premises u join active p on p.id=u.property_id where u.archived_at is null and not exists(select 1 from public.leases l where l.premises_id=u.id and l.archived_at is null and l.start_date<=(select d from business_day) and l.end_date>=(select d from business_day)))
 select jsonb_build_object(
 'turnover_expected',(select count(*) from returns),'turnover_received',(select count(amount) from returns),'turnover_missing',(select count(*) from returns where amount is null),
 'returns',coalesce((select jsonb_agg(to_jsonb(r) order by name) from (select * from returns order by name limit 100)r),'[]'::jsonb),
 'history',coalesce((select jsonb_agg(to_jsonb(h) order by as_of) from history h),'[]'::jsonb),
 'vacancy_count',(select count(*) from vacancies), 'vacancies',coalesce((select jsonb_agg(to_jsonb(v) order by property,name) from(select * from vacancies order by property,name limit 100)v),'[]'::jsonb)
 ) where private.is_member();
$$;
revoke all on function public.portfolio_insights(date) from public;
grant execute on function public.portfolio_insights(date) to authenticated;

