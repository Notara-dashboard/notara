-- Daily capture with the same owner isolation and audit rules as portfolio records.
create table public.general_notes (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null default auth.uid() references auth.users(id),
 name text not null check(length(trim(name)) between 1 and 160), property_id uuid, note_date date not null, topic text not null default '', notes text not null default '', source_url text not null default '',
 archived_at timestamptz, version integer not null default 1, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(owner_id,id), foreign key(owner_id,property_id) references public.properties(owner_id,id));
create table public.security_reports (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null default auth.uid() references auth.users(id),
 name text not null check(length(trim(name)) between 1 and 160), property_id uuid not null, start_date date not null, end_date date not null check(end_date>=start_date), status text not null default 'draft' check(status in ('draft','review','finalised')), prepared_by text not null default '', findings text not null default '', follow_up text not null default '', notes text not null default '', source_url text not null default '',
 archived_at timestamptz, version integer not null default 1, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(owner_id,id), foreign key(owner_id,property_id) references public.properties(owner_id,id));
create table public.references (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null default auth.uid() references auth.users(id),
 name text not null check(length(trim(name)) between 1 and 160), property_id uuid, source_date date, source_url text not null, notes text not null default '',
 archived_at timestamptz, version integer not null default 1, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(owner_id,id), foreign key(owner_id,property_id) references public.properties(owner_id,id));
do $$ declare tab text; begin
 foreach tab in array array['general_notes','security_reports','references'] loop
 execute format('alter table public.%I enable row level security',tab);
 execute format('revoke all on public.%I from anon, authenticated',tab);
 execute format('grant select,insert,update on public.%I to authenticated',tab);
 execute format('create policy owner_select on public.%I for select to authenticated using (owner_id=(select auth.uid()) and (select private.is_member()))',tab);
 execute format('create policy owner_insert on public.%I for insert to authenticated with check (owner_id=(select auth.uid()) and (select private.is_member()))',tab);
 execute format('create policy owner_update on public.%I for update to authenticated using (owner_id=(select auth.uid()) and (select private.is_member())) with check (owner_id=(select auth.uid()) and (select private.is_member()))',tab);
 execute format('create trigger stamp_record before update on public.%I for each row execute function private.stamp_record()',tab);
 execute format('create trigger audit_record after insert or update on public.%I for each row execute function private.audit_record()',tab);
 execute format('create index on public.%I(owner_id,property_id) where archived_at is null',tab);
 end loop; end $$;
create table private.collection_imports(owner_id uuid not null references auth.users(id),request_id uuid not null,payload jsonb not null,result jsonb,primary key(owner_id,request_id));
create function public.import_collection(collection text, input_rows jsonb, request_id uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare allowed text[]; row jsonb; vals jsonb; cols text; expr text; assignments text; result_row jsonb; result jsonb='[]'; previous private.collection_imports; n integer=0;
begin
 if not private.is_member() then raise exception 'Workspace access required';end if;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,419));
 select * into previous from private.collection_imports i where i.owner_id=auth.uid() and i.request_id=import_collection.request_id;
 if found then
 if previous.payload<>jsonb_build_object('collection',collection,'rows',input_rows) then raise exception 'Import identifier was already used';end if;
 return previous.result;end if;
 if jsonb_typeof(input_rows)<>'array' or jsonb_array_length(input_rows) not between 1 and 500 then raise exception 'Import requires 1 to 500 rows';end if;
 case collection
 when 'properties' then allowed=string_to_array('name,address,category,property_type,notes',',');
 when 'premises' then allowed=string_to_array('name,property_id,area,notes',',');
 when 'tenants' then allowed=string_to_array('name,registration,email,phone,external_id,notes',',');
 when 'contacts' then allowed=string_to_array('name,tenant_id,email,phone,role,notes',',');
 when 'actions' then allowed=string_to_array('name,property_id,tenant_id,due_date,meeting_id,communication_id,priority,status,notes',',');
 when 'leases' then allowed=string_to_array('name,property_id,premises_id,tenant_id,start_date,end_date,monthly_rent,notes',',');
 when 'events' then allowed=string_to_array('name,property_id,starts_at,ends_at,location,notes',',');
 when 'meetings' then allowed=string_to_array('name,property_id,starts_at,participants,consent,notes,decisions',',');
 when 'communications' then allowed=string_to_array('name,property_id,tenant_id,channel,contact,occurred_at,notes',',');
 when 'turnover_requirements' then allowed=string_to_array('name,tenant_id,start_date,end_date,notes',',');
 when 'turnover_submissions' then allowed=string_to_array('name,requirement_id,period,amount,notes',',');
 when 'arrears_snapshots' then allowed=string_to_array('name,as_of,status,notes',',');
 when 'arrears_balances' then allowed=string_to_array('name,snapshot_id,property_id,tenant_id,amount,notes',',');
 when 'general_notes' then allowed=string_to_array('name,property_id,note_date,topic,notes,source_url',',');
 when 'security_reports' then allowed=string_to_array('name,property_id,start_date,end_date,status,prepared_by,findings,follow_up,notes,source_url',',');
 when 'references' then allowed=string_to_array('name,property_id,source_url,source_date,notes',',');
 else raise exception 'Unknown collection';end case;
 for row in select value from jsonb_array_elements(input_rows) loop
 n=n+1; vals=row->'values';
 if jsonb_typeof(vals)<>'object' or not vals ? 'name' or exists(select 1 from jsonb_object_keys(vals) k where not k=any(allowed)) then raise exception 'Invalid import fields on row %',n;end if;
 select string_agg(format('%I',k),','),string_agg(format('(r.v).%I',k),','),string_agg(format('%I=(r.v).%I',k,k),',') into cols,expr,assignments from jsonb_object_keys(vals)k;
 if row->>'id' is not null then
 execute format('update public.%I t set %s from (select jsonb_populate_record(null::public.%I,$1) v) r where t.owner_id=$2 and t.id=$3 and t.version=$4 and t.archived_at is null returning to_jsonb(t)',collection,assignments,collection) into result_row using vals,auth.uid(),(row->>'id')::uuid,(row->>'version')::integer;
 if result_row is null then raise exception 'Row % changed or is unavailable. Export again before updating.',n;end if;
 else
 execute format('insert into public.%I(owner_id,%s) select $2,%s from (select jsonb_populate_record(null::public.%I,$1) v) r returning to_jsonb(%I)',collection,cols,expr,collection,collection) into result_row using vals,auth.uid();
 end if;
 result=result||jsonb_build_array(jsonb_build_object('id',result_row->'id','version',result_row->'version'));
 end loop;
 insert into private.collection_imports values(auth.uid(),request_id,jsonb_build_object('collection',collection,'rows',input_rows),result);
 return result;
end $$;
revoke all on function public.import_collection(text,jsonb,uuid) from public;
grant execute on function public.import_collection(text,jsonb,uuid) to authenticated;
create or replace function private.restore_workspace(payload jsonb) returns boolean language plpgsql security definer set search_path='' as $$
declare tab text;row jsonb;record_id uuid;original_status text;path text; snapshot jsonb; owner uuid=auth.uid();
begin
 if not private.is_member() then raise exception 'Workspace access required';end if;
 perform pg_advisory_xact_lock(hashtextextended(owner::text,2718));
 foreach tab in array array['properties','general_notes','security_reports','references','premises','tenants','contacts','actions','leases','events','meetings','communications','turnover_requirements','turnover_submissions','arrears_snapshots','arrears_balances','documents','document_versions','tenant_external_ids','import_batches'] loop
 if exists(select 1 from jsonb_array_elements(coalesce(payload->tab,'[]'::jsonb))) then null;end if;
 execute format('select exists(select 1 from public.%I where owner_id=$1)',tab) into strict original_status using owner;
 if original_status::boolean then raise exception 'Restore requires an empty workspace. Export existing data first.';end if;
 if jsonb_typeof(coalesce(payload->tab,'[]'::jsonb))<>'array' or jsonb_array_length(coalesce(payload->tab,'[]'::jsonb))>10000 then raise exception 'Invalid backup collection';end if;
 end loop;
 foreach tab in array array['properties','general_notes','security_reports','references','premises','tenants','contacts','meetings','communications','actions','leases','events','turnover_requirements','turnover_submissions','arrears_snapshots','arrears_balances','documents','document_versions','tenant_external_ids','import_batches'] loop
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
create or replace function public.restore_workspace(payload jsonb) returns boolean language sql security invoker set search_path='' as $$select private.restore_workspace(payload);$$;
revoke all on function public.restore_workspace(jsonb) from public;
grant execute on function public.restore_workspace(jsonb) to authenticated;
create or replace function public.workspace_backup() returns jsonb language plpgsql stable security invoker set search_path='' as $$
declare tab text; result jsonb='{}'::jsonb;rows jsonb; n bigint;begin
 if not private.is_member() then raise exception 'Workspace access required';end if;
 foreach tab in array array['properties','general_notes','security_reports','references','premises','tenants','contacts','meetings','communications','actions','leases','events','turnover_requirements','turnover_submissions','arrears_snapshots','arrears_balances','documents','document_versions','tenant_external_ids','import_batches','user_preferences','audit_events'] loop
 execute format('select count(*),coalesce(jsonb_agg(to_jsonb(t)),''[]''::jsonb) from public.%I t where owner_id=$1',tab) into n,rows using auth.uid();
 if n>10000 then raise exception 'This workspace requires a managed backup';end if;
 result=result||jsonb_build_object(tab,rows);
 end loop;return result;
end $$;
revoke all on function public.workspace_backup() from public;
grant execute on function public.workspace_backup() to authenticated;
