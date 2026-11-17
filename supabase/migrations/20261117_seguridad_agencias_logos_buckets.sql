-- Aplicado manualmente en Supabase (SQL Editor) el 17 de noviembre de 2026.
-- A1: solo owners/admins añaden miembros (las agencias se crean con create_agency_for_user).
-- Logos: nadie borra ni sustituye logos ajenos. Buckets: límites de tamaño y tipos.

begin;
drop policy if exists "Agency members can be created by authorized members" on public.agency_members;
drop policy if exists "Solo owners y admins añaden miembros" on public.agency_members;
create policy "Solo owners y admins añaden miembros"
on public.agency_members for insert to authenticated
with check (public.can_manage_agency(agency_id));

drop policy if exists "Authenticated users can delete logos" on storage.objects;
drop policy if exists "Authenticated users can update logos" on storage.objects;

update storage.buckets set file_size_limit = 2097152,
  allowed_mime_types = array['image/png','image/jpeg','image/webp'] where id = 'logos';
update storage.buckets set file_size_limit = 10485760,
  allowed_mime_types = array['image/png','image/jpeg','image/webp'] where id in ('floor-plans','property-photos');
update storage.buckets set file_size_limit = 52428800,
  allowed_mime_types = array['video/mp4','video/webm'] where id = 'property-videos';
commit;
