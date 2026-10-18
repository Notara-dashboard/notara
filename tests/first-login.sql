-- Rollback-only first-login access checks. No permanent identities or passwords.
begin;
insert into private.allowed_accounts(email) values('first-login@notara.invalid');
insert into auth.users(id,email,email_confirmed_at,encrypted_password) values(gen_random_uuid(),'first-login@notara.invalid',now(),'temporary-generated-hash');
select set_config('test.owner',(select id::text from auth.users where email='first-login@notara.invalid'),true);
select set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('test.owner'),'role','authenticated')::text,true);
set local role authenticated;
do $$ begin
 if public.account_setup_required() is distinct from true then raise exception 'Missing password not detected';end if;
 if public.workspace_access() then raise exception 'Workspace opened before password setup';end if;
 begin insert into public.properties(name) values('Premature data');raise exception 'Data access before setup accepted';exception when insufficient_privilege then null;end;
end $$;
reset role;
update auth.users set encrypted_password='test-only-hash' where id=current_setting('test.owner')::uuid;
set local role authenticated;
do $$ begin
 if public.account_setup_required() is distinct from false then raise exception 'Setup completion not detected';end if;
 if not public.workspace_access() then raise exception 'Completed account denied';end if;
 insert into public.properties(name) values('Allowed after setup');
end $$;
reset role;
update auth.users set email_confirmed_at=null where id=current_setting('test.owner')::uuid;
set local role authenticated;
do $$ begin
 if public.account_setup_required() is not null or public.workspace_access() then raise exception 'Unverified account allowed';end if;
end $$;
reset role;
rollback;
select 'PASS: first-login verification, password setup and data access gates; all fixtures rolled back' as result;

