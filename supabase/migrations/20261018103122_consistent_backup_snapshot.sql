create function public.workspace_backup() returns jsonb language plpgsql stable security invoker set search_path='' as $$
declare tab text; result jsonb='{}'::jsonb;rows jsonb; n bigint;begin
 if not private.is_member() then raise exception 'Workspace access required';end if;
 foreach tab in array array['properties','premises','tenants','contacts','meetings','communications','actions','leases','events','turnover_requirements','turnover_submissions','arrears_snapshots','arrears_balances','documents','document_versions','tenant_external_ids','import_batches','user_preferences','audit_events'] loop
 execute format('select count(*),coalesce(jsonb_agg(to_jsonb(t)),''[]''::jsonb) from public.%I t where owner_id=$1',tab) into n,rows using auth.uid();
 if n>10000 then raise exception 'This workspace requires a managed backup';end if;
 result=result||jsonb_build_object(tab,rows);
 end loop;return result;
end $$;
revoke all on function public.workspace_backup() from public;
grant execute on function public.workspace_backup() to authenticated;
