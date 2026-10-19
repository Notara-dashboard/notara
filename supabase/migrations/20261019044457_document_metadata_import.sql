create or replace function public.import_collection(collection text, input_rows jsonb, request_id uuid) returns jsonb language plpgsql security definer set search_path='' as $$
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
 when 'documents' then allowed=string_to_array('name,property_id,tenant_id,lease_id,meeting_id,notes',',');
 else raise exception 'Unknown collection';end case;
 for row in select value from jsonb_array_elements(input_rows) loop
 n=n+1; vals=row->'values';
 if collection='documents' and row->>'id' is null then raise exception 'Upload files before importing document metadata';end if;
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
