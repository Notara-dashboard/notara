-- Run against a disposable database or in this rollback-only transaction.
-- Creates no persistent users, records or audit history.
begin;
insert into private.allowed_accounts(email) values('security-owner@notara.invalid'),('security-other@notara.invalid');
insert into auth.users(id,email,email_confirmed_at,encrypted_password) values(gen_random_uuid(),'security-owner@notara.invalid',now(),'test-only-hash'),(gen_random_uuid(),'security-other@notara.invalid',now(),'test-only-hash');
update private.account_password_setup set completed_at=now() where owner_id in(select id from auth.users where email in('security-owner@notara.invalid','security-other@notara.invalid'));
select set_config('test.owner',(select id::text from auth.users where email='security-owner@notara.invalid'),true);
select set_config('test.other',(select id::text from auth.users where email='security-other@notara.invalid'),true);
select set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('test.owner'),'role','authenticated')::text,true);
set local role authenticated;
do $$ declare p uuid;u uuid;t uuid;s uuid;a uuid;v int;sum jsonb; begin
 if not public.workspace_access() then raise exception 'Owner membership failed'; end if;
 insert into public.properties(name) values('Security property') returning id into p;
 perform set_config('test.property',p::text,true);
 insert into public.premises(name,property_id) values('Unit',p) returning id into u;
 insert into public.tenants(name,external_id) values('Security tenant','security-external') returning id into t;
 insert into public.leases(name,property_id,premises_id,tenant_id,start_date,end_date,monthly_rent) values('Lease',p,u,t,current_date,current_date+30,1000);
 begin
 insert into public.leases(name,property_id,premises_id,tenant_id,start_date,end_date,monthly_rent) values('Overlapping',p,u,t,current_date,current_date+30,1000);
 raise exception 'Overlapping lease was accepted'; exception when exclusion_violation then null; end;
 begin
 insert into public.tenants(name,external_id) values('Duplicate','security-external');
 raise exception 'Duplicate external ID accepted'; exception when unique_violation then null; end;
 insert into public.actions(name,property_id,tenant_id) values('Follow up',p,t) returning id,version into a,v;
 insert into storage.objects(bucket_id,name,owner_id) values('notara-private',auth.uid()::text||'/security/check.txt',auth.uid()::text);
 update public.actions set status='done' where id=a and version=v;
 if (select version from public.actions where id=a)<>v+1 then raise exception 'Version did not advance'; end if;
 update public.actions set status='open' where id=a and version=v;
 if found then raise exception 'Stale version updated record'; end if;
 update public.actions set status='open',archived_at=now() where id=a;
 update public.actions set archived_at=null where id=a;
 insert into public.arrears_snapshots(name,as_of) values('Snapshot',current_date) returning id into s;
 begin update public.arrears_snapshots set status='finalised' where id=s;raise exception 'Empty snapshot finalised';exception when raise_exception then if sqlerrm<>'Add at least one balance before finalising.' then raise;end if;end;
 insert into public.arrears_balances(name,snapshot_id,property_id,tenant_id,amount) values('Debit',s,p,t,1000);
 insert into public.tenants(name) values('Credit tenant') returning id into t;
 insert into public.arrears_balances(name,snapshot_id,property_id,tenant_id,amount) values('Credit',s,p,t,-400);
 update public.arrears_snapshots set status='finalised' where id=s;
 sum=public.workspace_summary();
 if (sum->>'debit')::numeric<>1000 or (sum->>'credit')::numeric<>400 then raise exception 'Debit and credit netted'; end if;
 if (sum->>'occupied')::int<>1 then raise exception 'Occupancy failed'; end if;
 begin update public.arrears_balances set amount=500 where snapshot_id=s; raise exception 'Finalised balance mutable'; exception when raise_exception then if sqlerrm='Finalised balance mutable' then raise; end if; end;
 begin update public.arrears_snapshots set status='draft' where id=s; raise exception 'Finalised snapshot mutable'; exception when raise_exception then if sqlerrm='Finalised snapshot mutable' then raise; end if; end;
 update public.properties set category='oversight' where id=p;
 sum=public.workspace_summary();
 if (sum->>'properties')::int<>0 or (sum->>'occupied')::int<>0 or (sum->>'debit')::numeric<>0 then raise exception 'Oversight included in aggregates'; end if;
 if (select count(*) from public.audit_events)<10 then raise exception 'Audit entries missing'; end if;
 begin insert into public.audit_events(owner_id,actor_id,table_name,record_id,operation,changed_fields) values(auth.uid(),auth.uid(),'actions',a,'INSERT','{}'); raise exception 'Audit forgery accepted'; exception when insufficient_privilege then null; end;
 begin delete from public.properties where id=p; raise exception 'Hard delete permitted'; exception when insufficient_privilege then null; end;
end $$;
reset role;
select set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('test.other'),'role','authenticated')::text,true);
set local role authenticated;
do $$ begin
 if exists(select 1 from public.properties) or exists(select 1 from public.audit_events) then raise exception 'Cross-owner read leak'; end if;
 if exists(select 1 from storage.objects where bucket_id='notara-private') then raise exception 'Cross-owner file metadata leak'; end if;
 begin insert into storage.objects(bucket_id,name,owner_id) values('notara-private',current_setting('test.owner')||'/security/forged.txt',auth.uid()::text);raise exception 'Cross-owner upload allowed';exception when insufficient_privilege then null;end;
 update public.properties set name='Hijack' where id=current_setting('test.property')::uuid;
 if found then raise exception 'Cross-owner update accepted'; end if;
 begin insert into public.actions(name,property_id) values('Cross-owner link',current_setting('test.property')::uuid);raise exception 'Cross-owner relationship accepted';exception when foreign_key_violation then null;end;
 begin insert into public.properties(name,owner_id) values('Impersonation',current_setting('test.owner')::uuid);raise exception 'Owner impersonation accepted';exception when insufficient_privilege then null;end;
end $$;
reset role;
delete from private.allowed_accounts where email='security-other@notara.invalid';
set local role authenticated;
do $$ begin
 if public.workspace_access() then raise exception 'Uninvited user allowed'; end if;
 begin insert into public.properties(name) values('Uninvited');raise exception 'Uninvited write allowed';exception when insufficient_privilege then null;end;
end $$;
reset role;
set local role anon;
do $$ begin
 begin perform * from public.properties;raise exception 'Anonymous read allowed';exception when insufficient_privilege then null;end;
end $$;
reset role;
rollback;
select 'PASS: owner CRUD, audit integrity, stale versions, external identity, lease overlap, debit/credit, immutable snapshots, active portfolio, RLS isolation, anonymous denial; all fixtures rolled back' as result;


