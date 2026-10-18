-- First sign-in verifies the invited email before a password can be chosen.
create function private.account_setup_required() returns boolean language sql stable security definer set search_path='' as $$
 select case when exists (
 select 1 from auth.users u join private.allowed_accounts a on a.email=lower(u.email)
 where u.id=auth.uid() and u.email_confirmed_at is not null
 ) then (select coalesce(u.encrypted_password,'')='' from auth.users u where u.id=auth.uid()) else null end;
$$;
revoke all on function private.account_setup_required() from public;
grant execute on function private.account_setup_required() to authenticated;
create function public.account_setup_required() returns boolean language sql stable security invoker set search_path='' as $$select private.account_setup_required();$$;
revoke all on function public.account_setup_required() from public;
grant execute on function public.account_setup_required() to authenticated;

create or replace function private.is_member() returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists (
 select 1 from auth.users u join private.allowed_accounts a on a.email=lower(u.email)
 where u.id=auth.uid() and u.email_confirmed_at is not null and coalesce(u.encrypted_password,'')<>''
 );
$$;
