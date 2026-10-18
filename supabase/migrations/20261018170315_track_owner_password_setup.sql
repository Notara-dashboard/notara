-- GoTrue can generate an unknown temporary password for a magic-link signup.
-- Track the owner's own password choice separately from the mere presence of a hash.
create table private.account_password_setup (
 owner_id uuid primary key references auth.users(id) on delete cascade,
 completed_at timestamptz
);
alter table private.account_password_setup enable row level security;
revoke all on private.account_password_setup from public,anon,authenticated;
insert into private.account_password_setup(owner_id,completed_at)
 select id,case when email_confirmed_at is not null and coalesce(encrypted_password,'')<>'' then now() end from auth.users;
create function private.track_password_setup() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if TG_OP='INSERT' then
 insert into private.account_password_setup(owner_id) values(new.id) on conflict(owner_id) do nothing;
 elsif old.email_confirmed_at is not null and new.email_confirmed_at is not null and coalesce(new.encrypted_password,'')<>'' and new.encrypted_password is distinct from old.encrypted_password then
 insert into private.account_password_setup(owner_id,completed_at) values(new.id,now()) on conflict(owner_id) do update set completed_at=excluded.completed_at;
 end if;
 return new;
end $$;
revoke all on function private.track_password_setup() from public,anon,authenticated;
create trigger notara_password_setup after insert or update of encrypted_password on auth.users for each row execute function private.track_password_setup();
create or replace function private.account_setup_required() returns boolean language sql stable security definer set search_path='' as $$
 select case when exists (
 select 1 from auth.users u join private.allowed_accounts a on a.email=lower(u.email)
 where u.id=auth.uid() and u.email_confirmed_at is not null
 ) then not exists(select 1 from private.account_password_setup p where p.owner_id=auth.uid() and p.completed_at is not null) else null end;
$$;
create or replace function private.is_member() returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists (
 select 1 from auth.users u join private.allowed_accounts a on a.email=lower(u.email)
 join private.account_password_setup p on p.owner_id=u.id and p.completed_at is not null
 where u.id=auth.uid() and u.email_confirmed_at is not null and coalesce(u.encrypted_password,'')<>''
 );
$$;
