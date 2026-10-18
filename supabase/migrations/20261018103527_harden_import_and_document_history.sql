create or replace function private.apply_arrears_import(batch_id uuid,expected_version integer) returns uuid language plpgsql security definer set search_path='' as $$
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
 if tenant is not null and not exists(select 1 from public.tenants where owner_id=auth.uid() and id=tenant and archived_at is null) then raise exception 'The matched tenant is archived. Restore it before importing.';end if;
 if tenant is null then insert into public.tenants(owner_id,name) values(auth.uid(),trim(row->>'tenant_name')) returning id into tenant;end if;
 if mapped is null then insert into public.tenant_external_ids(owner_id,source_namespace,external_id,tenant_id) values(auth.uid(),batch.source_namespace,trim(row->>'external_id'),tenant);end if;
 insert into public.arrears_balances(owner_id,name,snapshot_id,property_id,tenant_id,amount) values(auth.uid(),trim(row->>'tenant_name'),snapshot,prop,tenant,amount);
 end loop;
 update public.arrears_snapshots set status='finalised' where id=snapshot and owner_id=auth.uid();
 update public.import_batches set status='applied',snapshot_id=snapshot where id=batch.id and owner_id=auth.uid();
 return snapshot;
end $$;

