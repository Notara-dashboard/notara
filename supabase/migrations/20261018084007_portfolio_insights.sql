create function public.portfolio_insights(report_month date) returns jsonb language sql stable security invoker set search_path='' as $$
 with active as(select id,name from public.properties where category='active' and archived_at is null),
 business_day as(select (now() at time zone 'Africa/Johannesburg')::date as d),
 expected as(select r.* from public.turnover_requirements r where archived_at is null and start_date<=(date_trunc('month',report_month)+interval '1 month - 1 day')::date and (end_date is null or end_date>=date_trunc('month',report_month)::date)),
 returns as(select e.id,e.name,t.name as tenant,s.amount,py.amount as previous_amount from expected e join public.tenants t on t.id=e.tenant_id left join public.turnover_submissions s on s.requirement_id=e.id and s.period=date_trunc('month',report_month)::date and s.archived_at is null left join public.turnover_submissions py on py.requirement_id=e.id and py.period=(date_trunc('month',report_month)-interval '1 year')::date and py.archived_at is null),
 snapshots as(select distinct on(as_of) id,as_of from public.arrears_snapshots where status='finalised' and archived_at is null order by as_of desc,created_at desc,id),
 history as(select s.id,s.as_of,coalesce(sum(greatest(b.amount,0)) filter(where b.property_id in(select id from active)),0) as debit,coalesce(sum(abs(least(b.amount,0))) filter(where b.property_id in(select id from active)),0) as credit from snapshots s left join public.arrears_balances b on b.snapshot_id=s.id group by s.id,s.as_of order by s.as_of desc limit 12),
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
