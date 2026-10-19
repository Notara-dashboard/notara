-- Disposable fixtures and every mutation are rolled back together.
begin;
insert into private.allowed_accounts(email) values('daily-operations@notara.invalid');
insert into auth.users(id,email,email_confirmed_at,encrypted_password) values(gen_random_uuid(),'daily-operations@notara.invalid',now(),'test-only-hash');
update private.account_password_setup set completed_at=now() where owner_id=(select id from auth.users where email='daily-operations@notara.invalid');
select set_config('request.jwt.claims',jsonb_build_object('sub',(select id from auth.users where email='daily-operations@notara.invalid'),'role','authenticated')::text,true);
set local role authenticated;
do $$ declare p uuid; report uuid; note uuid; document uuid; result jsonb; request uuid=gen_random_uuid(); payload jsonb; before_count integer; begin
 insert into public.properties(name) values('Daily operations fixture') returning id into p;
 payload=jsonb_build_array(jsonb_build_object('values',jsonb_build_object('name','Imported note','property_id',p,'note_date','2026-10-19','topic','Test','notes','Original','source_url','')));
 result=public.import_collection('general_notes',payload,request);note=(result->0->>'id')::uuid;
 if public.import_collection('general_notes',payload,request)<>result then raise exception 'Retry result changed';end if;
 if (select count(*) from public.general_notes)<>1 then raise exception 'Retry duplicated rows';end if;
 perform public.import_collection('general_notes',jsonb_build_array(jsonb_build_object('id',note,'version',1,'values',jsonb_build_object('name','Updated note'))),gen_random_uuid());
 if (select version from public.general_notes where id=note)<>2 or (select notes from public.general_notes where id=note)<>'Original' then raise exception 'Update lost omitted fields';end if;
 begin
 perform public.import_collection('general_notes',jsonb_build_array(jsonb_build_object('values',jsonb_build_object('name','Must roll back','note_date','2026-10-19')),jsonb_build_object('id',note,'version',1,'values',jsonb_build_object('name','Stale'))),gen_random_uuid());
 raise exception 'Stale batch accepted';exception when raise_exception then if sqlerrm='Stale batch accepted' then raise;end if;end;
 if exists(select 1 from public.general_notes where name='Must roll back') then raise exception 'Partial batch survived';end if;
 begin perform public.import_collection('general_notes',jsonb_build_array(jsonb_build_object('values',jsonb_build_object('name','Bad','note_date','2026-10-19','owner_id',gen_random_uuid()))),gen_random_uuid());raise exception 'Owner injection accepted';exception when raise_exception then if sqlerrm='Owner injection accepted' then raise;end if;end;
 insert into public.security_reports(name,property_id,start_date,end_date,findings) values('Security fixture',p,'2026-10-19','2026-10-25',repeat('report',2000)) returning id into report;
 insert into public.references(name,property_id,source_url) values('Source fixture',p,'https://example.com');
 insert into storage.objects(bucket_id,name,owner_id) values('notara-private',auth.uid()::text||'/daily/metadata.txt',auth.uid()::text);
 insert into public.documents(name,object_path,content_type,size_bytes) values('Metadata fixture',auth.uid()::text||'/daily/metadata.txt','text/plain',5) returning id into document;
 perform public.import_collection('documents',jsonb_build_array(jsonb_build_object('id',document,'version',1,'values',jsonb_build_object('name','Metadata fixture','notes','Imported metadata'))),gen_random_uuid());
 if (select notes from public.documents where id=document)<>'Imported metadata' then raise exception 'Document metadata import failed';end if;
 begin perform public.import_collection('documents',jsonb_build_array(jsonb_build_object('values',jsonb_build_object('name','Missing file'))),gen_random_uuid());raise exception 'Fileless document accepted';exception when raise_exception then if sqlerrm='Fileless document accepted' then raise;end if;end;
 result=public.workspace_backup();
 if jsonb_array_length(result->'general_notes')<>1 or jsonb_array_length(result->'security_reports')<>1 or jsonb_array_length(result->'references')<>1 then raise exception 'New collections absent from backup';end if;
 if not exists(select 1 from public.audit_events where record_id=report and table_name='security_reports') then raise exception 'Audit missing';end if;
 perform set_config('request.jwt.claims',jsonb_build_object('sub',gen_random_uuid(),'role','authenticated')::text,true);
 if exists(select 1 from public.general_notes) or exists(select 1 from public.security_reports) or exists(select 1 from public.references) then raise exception 'Cross-owner data leak';end if;
 end $$;
reset role;
rollback;
select 'Daily operations: atomic import, idempotent retry, stale conflict, field whitelist, audit, backup and RLS checks passed' as result;
