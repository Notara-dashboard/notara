create function private.revise_import(batch_id uuid,expected_version integer,review_rows jsonb,report_date date) returns public.import_batches language plpgsql security definer set search_path='' as $$
declare batch public.import_batches;begin
 if not private.is_member() then raise exception 'Workspace access required';end if;
 select * into batch from public.import_batches where id=batch_id and owner_id=auth.uid() for update;
 if not found or batch.status<>'staged' or batch.version<>expected_version then raise exception 'Import changed or already applied. Reload its status.';end if;
 update public.import_batches set rows=review_rows,as_of=report_date where id=batch_id and owner_id=auth.uid() returning * into batch;return batch;
end $$;
revoke all on function private.revise_import(uuid,integer,jsonb,date) from public;
grant execute on function private.revise_import(uuid,integer,jsonb,date) to authenticated;
create function public.revise_import(batch_id uuid,expected_version integer,review_rows jsonb,report_date date) returns public.import_batches language sql security invoker set search_path='' as $$select private.revise_import(batch_id,expected_version,review_rows,report_date);$$;
revoke all on function public.revise_import(uuid,integer,jsonb,date) from public;
grant execute on function public.revise_import(uuid,integer,jsonb,date) to authenticated;
create function public.resolve_import_matches(source_name text,input_rows jsonb) returns jsonb language sql stable security invoker set search_path='' as $$
 select coalesce(jsonb_agg(jsonb_build_object('external_id',r->>'external_id','tenant_id',coalesce(nullif(r->>'tenant_id','')::uuid,m.tenant_id,t.id))),'[]'::jsonb)
 from jsonb_array_elements(input_rows)r
 left join public.tenant_external_ids m on m.owner_id=auth.uid() and m.source_namespace=source_name and m.external_id=r->>'external_id'
 left join public.tenants t on t.owner_id=auth.uid() and t.external_id=r->>'external_id' and t.archived_at is null
 where private.is_member() and jsonb_array_length(input_rows)<=2000;
$$;
revoke all on function public.resolve_import_matches(text,jsonb) from public;
grant execute on function public.resolve_import_matches(text,jsonb) to authenticated;

-- Portable workspace restores are atomic and only permitted into an empty account.
create function private.restore_workspace(payload jsonb) returns boolean language plpgsql security definer set search_path='' as $$
declare tab text;row jsonb;record_id uuid;original_status text;path text; snapshot jsonb; owner uuid=auth.uid();
begin
 if not private.is_member() then raise exception 'Workspace access required';end if;
 perform pg_advisory_xact_lock(hashtextextended(owner::text,2718));
 foreach tab in array array['properties','premises','tenants','contacts','actions','leases','events','meetings','communications','turnover_requirements','turnover_submissions','arrears_snapshots','arrears_balances','documents','document_versions','tenant_external_ids','import_batches'] loop
 if exists(select 1 from jsonb_array_elements(coalesce(payload->tab,'[]'::jsonb))) then null;end if;
 execute format('select exists(select 1 from public.%I where owner_id=$1)',tab) into strict original_status using owner;
 if original_status::boolean then raise exception 'Restore requires an empty workspace. Export existing data first.';end if;
 if jsonb_typeof(coalesce(payload->tab,'[]'::jsonb))<>'array' or jsonb_array_length(coalesce(payload->tab,'[]'::jsonb))>10000 then raise exception 'Invalid backup collection';end if;
 end loop;
 foreach tab in array array['properties','premises','tenants','contacts','meetings','communications','actions','leases','events','turnover_requirements','turnover_submissions','arrears_snapshots','arrears_balances','documents','document_versions','tenant_external_ids','import_batches'] loop
 for row in select value from jsonb_array_elements(coalesce(payload->tab,'[]'::jsonb)) loop
 row=row||jsonb_build_object('owner_id',owner);
 if tab='arrears_snapshots' then row=row||'{"status":"draft"}'::jsonb;end if;
 if tab in('documents','document_versions') then
 path=row->>'object_path';if split_part(path,'/',1)<>owner::text or not exists(select 1 from storage.objects where bucket_id='notara-private' and name=path) then raise exception 'Backup object missing or belongs to another owner';end if;
 end if;
 if tab='document_versions' then
 execute 'insert into public.document_versions select * from jsonb_populate_record(null::public.document_versions,$1)' using row;
 else execute format('insert into public.%I select * from jsonb_populate_record(null::public.%I,$1)',tab,tab) using row;end if;
 end loop;
 end loop;
 for snapshot in select value from jsonb_array_elements(coalesce(payload->'arrears_snapshots','[]'::jsonb)) loop
 if snapshot->>'status'='finalised' then update public.arrears_snapshots set status='finalised' where owner_id=owner and id=(snapshot->>'id')::uuid;end if;
 end loop;
 for row in select value from jsonb_array_elements(coalesce(payload->'user_preferences','[]'::jsonb)) loop
 insert into public.user_preferences(owner_id,value) values(owner,row->'value') on conflict(owner_id) do update set value=excluded.value;
 end loop;
 return true;
end $$;
revoke all on function private.restore_workspace(jsonb) from public;
grant execute on function private.restore_workspace(jsonb) to authenticated;
create function public.restore_workspace(payload jsonb) returns boolean language sql security invoker set search_path='' as $$select private.restore_workspace(payload);$$;
revoke all on function public.restore_workspace(jsonb) from public;
grant execute on function public.restore_workspace(jsonb) to authenticated;
drop policy notara_cleanup on storage.objects;
create policy notara_cleanup on storage.objects for delete to authenticated using(bucket_id='notara-private' and (storage.foldername(name))[1]=(select auth.uid())::text and (select private.is_member()) and not exists(select 1 from public.documents d where d.owner_id=(select auth.uid()) and d.object_path=name) and not exists(select 1 from public.document_versions v where v.owner_id=(select auth.uid()) and v.object_path=name));
