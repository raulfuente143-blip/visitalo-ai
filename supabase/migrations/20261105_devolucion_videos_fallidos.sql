-- Aplicado manualmente en Supabase (SQL Editor) el 5 de noviembre de 2026.
-- Devuelve el crédito de un video que ha fallado (máx. 1 hora, sin archivo, 3 al mes por agencia).

begin;

alter table public.videos add column if not exists credit_refunded boolean not null default false;

create or replace function public.refund_failed_video_credit(p_video_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_agency_id uuid;
  v_status text;
  v_output_url text;
  v_refunded boolean;
  v_created_at timestamptz;
  v_recent integer;
  v_start timestamptz;
  v_end timestamptz;
begin
  select v.agency_id, v.status::text, v.output_url, v.credit_refunded, v.created_at
    into v_agency_id, v_status, v_output_url, v_refunded, v_created_at
  from public.videos v
  where v.id = p_video_id;

  if v_agency_id is null then
    return false;
  end if;

  if not public.is_agency_member(v_agency_id) then
    raise exception 'No autorizado' using errcode = '42501';
  end if;

  if v_refunded
     or v_status <> 'failed'
     or v_output_url is not null
     or v_created_at < now() - interval '1 hour' then
    return false;
  end if;

  select count(*) into v_recent
  from public.videos v
  where v.agency_id = v_agency_id
    and v.credit_refunded
    and v.created_at > now() - interval '30 days';

  if v_recent >= 3 then
    return false;
  end if;

  select c.period_start, c.period_end into v_start, v_end
  from public.agency_current_period(v_agency_id) c
  limit 1;

  update public.usage_periods u
     set videos_used = u.videos_used - 1
   where u.agency_id = v_agency_id
     and u.period_start = v_start
     and u.period_end = v_end
     and u.videos_used > 0;

  if not found then
    return false;
  end if;

  update public.videos set credit_refunded = true, updated_at = now() where id = p_video_id;
  return true;
end;
$$;

revoke all on function public.refund_failed_video_credit(uuid) from public, anon;
grant execute on function public.refund_failed_video_credit(uuid) to authenticated;

commit;
