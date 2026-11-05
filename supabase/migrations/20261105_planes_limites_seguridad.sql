-- Aplicado manualmente en Supabase (SQL Editor) el 5 de noviembre de 2026.
-- Planes prueba / videos / pro, límites, cierre de escritura de suscripciones y consumo
-- para usuarios, y funciones de consumo de vídeos.

begin;

alter table public.plans add column if not exists max_rooms integer not null default 8 check (max_rooms > 0);
alter table public.plans add column if not exists max_users integer not null default 1 check (max_users > 0);
alter table public.plans add column if not exists is_trial boolean not null default false;
alter table public.plans add column if not exists sort_order integer not null default 0;

insert into public.plans
  (code, name, description, monthly_price_cents, currency, is_active, video_limit, photo_limit, credit_limit, stripe_price_id, max_rooms, max_users, is_trial, sort_order)
values
  ('prueba', 'Prueba', 'Para conocer Visitalo.ai sin compromiso.', 0, 'eur', true, 2, 0, 0, null, 8, 1, true, 0),
  ('videos', 'Vídeos', 'Para equipos que publican con regularidad.', 4000, 'eur', true, 8, 0, 0, null, 8, 2, false, 1),
  ('pro', 'Pro', 'Vídeo y fotografía en un solo plan.', 10000, 'eur', true, 20, 0, 0, null, 10, 5, false, 2)
on conflict (code) do update set
  name = excluded.name,
  description = excluded.description,
  monthly_price_cents = excluded.monthly_price_cents,
  currency = excluded.currency,
  is_active = excluded.is_active,
  video_limit = excluded.video_limit,
  photo_limit = excluded.photo_limit,
  credit_limit = excluded.credit_limit,
  max_rooms = excluded.max_rooms,
  max_users = excluded.max_users,
  is_trial = excluded.is_trial,
  sort_order = excluded.sort_order,
  updated_at = now();

update public.plans set is_active = false, updated_at = now() where code in ('starter', 'agencia');

create unique index if not exists subscriptions_agency_id_key on public.subscriptions (agency_id);

drop policy if exists "Subscriptions can be created by agency members" on public.subscriptions;
drop policy if exists "Subscriptions can be updated by agency members" on public.subscriptions;
drop policy if exists "Subscriptions can be deleted by agency members" on public.subscriptions;
drop policy if exists "Usage periods can be created by agency members" on public.usage_periods;
drop policy if exists "Usage periods can be updated by agency members" on public.usage_periods;
drop policy if exists "Usage periods can be deleted by agency members" on public.usage_periods;
drop policy if exists "Credit purchases can be created by agency members" on public.credit_purchases;
drop policy if exists "Credit purchases can be updated by agency members" on public.credit_purchases;
drop policy if exists "Credit purchases can be deleted by agency members" on public.credit_purchases;

create or replace function public.agency_current_period(p_agency_id uuid)
returns table (
  plan_id uuid,
  period_start timestamptz,
  period_end timestamptz,
  subscription_status text,
  cancel_at_period_end boolean
)
language plpgsql
stable
security definer
set search_path = public
as $$
#variable_conflict use_column
begin
  return query
    select s.plan_id,
           coalesce(s.current_period_start, date_trunc('month', now())),
           coalesce(s.current_period_end, date_trunc('month', now()) + interval '1 month'),
           s.status::text,
           s.cancel_at_period_end
    from public.subscriptions s
    where s.agency_id = p_agency_id
      and s.status in ('active', 'trialing', 'past_due')
    limit 1;

  if not found then
    return query
      select p.id,
             '2000-01-01T00:00:00Z'::timestamptz,
             '2999-12-31T00:00:00Z'::timestamptz,
             null::text,
             false
      from public.plans p
      where p.code = 'prueba';
  end if;
end;
$$;

create or replace function public.get_agency_usage(p_agency_id uuid)
returns table (
  plan_code text,
  plan_name text,
  is_trial boolean,
  video_limit integer,
  videos_used integer,
  max_rooms integer,
  subscription_status text,
  period_end timestamptz,
  cancel_at_period_end boolean
)
language plpgsql
stable
security definer
set search_path = public
as $$
#variable_conflict use_column
begin
  if not public.is_agency_member(p_agency_id) then
    raise exception 'No autorizado' using errcode = '42501';
  end if;

  return query
    select p.code,
           p.name,
           p.is_trial,
           p.video_limit,
           coalesce((
             select u.videos_used
             from public.usage_periods u
             where u.agency_id = p_agency_id
               and u.period_start = c.period_start
               and u.period_end = c.period_end
           ), 0),
           p.max_rooms,
           c.subscription_status,
           case when p.is_trial then null else c.period_end end,
           c.cancel_at_period_end
    from public.agency_current_period(p_agency_id) c
    join public.plans p on p.id = c.plan_id;
end;
$$;

create or replace function public.consume_video_credit(p_agency_id uuid)
returns table (
  allowed boolean,
  videos_used integer,
  video_limit integer,
  is_trial boolean
)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
  v_plan_id uuid;
  v_start timestamptz;
  v_end timestamptz;
  v_limit integer;
  v_trial boolean;
  v_used integer;
begin
  if not public.is_agency_member(p_agency_id) then
    raise exception 'No autorizado' using errcode = '42501';
  end if;

  select c.plan_id, c.period_start, c.period_end
    into v_plan_id, v_start, v_end
  from public.agency_current_period(p_agency_id) c
  limit 1;

  if v_plan_id is null then
    raise exception 'No hay ningún plan disponible';
  end if;

  select p.video_limit, p.is_trial into v_limit, v_trial
  from public.plans p
  where p.id = v_plan_id;

  insert into public.usage_periods (agency_id, plan_id, period_start, period_end)
  values (p_agency_id, v_plan_id, v_start, v_end)
  on conflict (agency_id, period_start, period_end) do nothing;

  update public.usage_periods u
     set videos_used = u.videos_used + 1
   where u.agency_id = p_agency_id
     and u.period_start = v_start
     and u.period_end = v_end
     and u.videos_used < v_limit
  returning u.videos_used into v_used;

  if v_used is null then
    select u.videos_used into v_used
    from public.usage_periods u
    where u.agency_id = p_agency_id
      and u.period_start = v_start
      and u.period_end = v_end;
    return query select false, coalesce(v_used, 0), v_limit, v_trial;
  else
    return query select true, v_used, v_limit, v_trial;
  end if;
end;
$$;

revoke all on function public.agency_current_period(uuid) from public, anon, authenticated;
revoke all on function public.get_agency_usage(uuid) from public, anon;
revoke all on function public.consume_video_credit(uuid) from public, anon;
grant execute on function public.get_agency_usage(uuid) to authenticated;
grant execute on function public.consume_video_credit(uuid) to authenticated;

commit;
