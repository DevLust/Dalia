-- Correção: permitir vincular auth_id no primeiro login
-- Execute se o login falhar após supabase-production.sql

drop policy if exists "usuarios_update_own" on usuarios;

drop policy if exists "usuarios_update_link_auth" on usuarios;
create policy "usuarios_update_link_auth" on usuarios
  for update to authenticated
  using (auth_id is null or auth_id = auth.uid())
  with check (auth_id = auth.uid());
