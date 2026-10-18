begin;
insert into private.allowed_accounts(email) values('workflow-owner@notara.invalid');
insert into auth.users(id,email,email_confirmed_at) values(gen_random_uuid(),'workflow-owner@notara.invalid',now());
select set_config('test.owner',(select id::text from auth.users where email='workflow-owner@notara.invalid'),true);
select set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('test.owner'),'role','authenticated')::text,true);
set local role authenticated;
do $$ declare p uuid;t uuid;b uuid;s uuid;rows jsonb;backup jsonb;d uuid;begin
 insert into public.properties(name) values('Import property') returning id into p;
 insert into public.tenants(name) values('Existing tenant') returning id into t;
 rows=jsonb_build_array(jsonb_build_object('external_id','A1','tenant_name','Existing tenant','tenant_id',t,'property_id',p,'amount',1234.50));
 insert into public.import_batches(name,source_namespace,source_hash,as_of,rows) values('October','Ledger',repeat('a',64),current_date,rows) returning id into b;
 perform public.revise_import(b,1,rows,current_date);
 begin perform public.apply_arrears_import(b,1);raise exception 'Stale import accepted';exception when raise_exception then if sqlerrm='Stale import accepted' then raise;end if;end;
 s=public.apply_arrears_import(b,2);
 if public.apply_arrears_import(b,2)<>s then raise exception 'Import not idempotent';end if;
 if (select count(*) from public.tenants)<>1 or (select count(*) from public.arrears_snapshots)<>1 then raise exception 'Duplicate records created';end if;
 if (select status from public.arrears_snapshots where id=s)<>'finalised' then raise exception 'Import not finalised';end if;
 if (public.resolve_import_matches('Ledger',rows)->0->>'tenant_id')::uuid<>t then raise exception 'Mapping failed';end if;
 update public.tenants set archived_at=now() where id=t;
 insert into public.import_batches(name,source_namespace,source_hash,as_of,rows) values('November','Ledger',repeat('b',64),current_date,rows) returning id into b;
 begin perform public.apply_arrears_import(b,1);raise exception 'Archived match accepted';exception when raise_exception then if sqlerrm='Archived match accepted' then raise;end if;end;
 if (select count(*) from public.arrears_snapshots)<>1 then raise exception 'Failed import leaked snapshot';end if;
 update public.tenants set archived_at=null where id=t;
 insert into public.meetings(name,starts_at) values('Meeting',now());
 insert into public.communications(name,occurred_at) values('Call',now());
 insert into storage.objects(bucket_id,name,owner_id) values('notara-private',auth.uid()::text||'/workflow/old.txt',auth.uid()::text),( 'notara-private',auth.uid()::text||'/workflow/new.txt',auth.uid()::text);
 insert into public.documents(name,object_path,content_type,size_bytes) values('Old',auth.uid()::text||'/workflow/old.txt','text/plain',3) returning id into d;
 update public.documents set name='New',object_path=auth.uid()::text||'/workflow/new.txt' where id=d;
 if (select count(*) from public.document_versions where document_id=d)<>1 then raise exception 'History missing';end if;
 backup=public.workspace_backup();
 if jsonb_array_length(backup->'meetings')<>1 or jsonb_array_length(backup->'document_versions')<>1 then raise exception 'Incomplete backup';end if;
 perform set_config('test.backup',backup::text,true);
 begin perform public.restore_workspace(backup);raise exception 'Nonempty restore accepted';exception when raise_exception then if sqlerrm='Nonempty restore accepted' then raise;end if;end;
end $$;
reset role;
-- Clear only the disposable owner's rows, inside this rollback-only transaction.
do $$ declare tab text;begin
 foreach tab in array array['import_batches','tenant_external_ids','document_versions','documents','arrears_balances','arrears_snapshots','turnover_submissions','turnover_requirements','actions','leases','events','communications','meetings','contacts','premises','tenants','properties'] loop
 execute format('delete from public.%I where owner_id=$1',tab) using current_setting('test.owner')::uuid;
 end loop;
end $$;
set local role authenticated;
do $$ declare payload jsonb=current_setting('test.backup')::jsonb;begin
 begin perform public.restore_workspace(jsonb_set(payload,'{tenants}',jsonb_build_array(jsonb_build_object('id',gen_random_uuid(),'name',null))));raise exception 'Corrupt backup accepted';exception when not_null_violation then null;end;
 if exists(select 1 from public.properties) then raise exception 'Failed restore left partial data';end if;
 perform public.restore_workspace(payload);
 if (select count(*) from public.properties)<>1 or (select count(*) from public.document_versions)<>1 or (select count(*) from public.meetings)<>1 then raise exception 'Restore incomplete';end if;
 if (select count(*) from public.arrears_snapshots where status='finalised')<>1 then raise exception 'Restored snapshot not finalised';end if;
 if (select count(*) from public.arrears_balances where amount=1234.50)<>1 then raise exception 'Restored amount differs';end if;
end $$;
reset role;
rollback;
select 'workflow_import_history_restore_passed' as result;

