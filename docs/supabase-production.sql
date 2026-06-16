-- Produção: autenticação segura com Supabase Auth
-- Execute no SQL Editor do Supabase (uma vez).

-- 1. Crie cada usuário em Authentication → Users (e-mail + senha forte).
-- 2. Vincule o perfil na tabela usuarios:

alter table usuarios add column if not exists auth_id uuid unique references auth.users(id);

-- Remove senhas em texto (não use mais login por coluna senha)
alter table usuarios drop column if exists senha;

-- Exemplo: vincular admin após criar no Auth (substitua os UUIDs)
-- update usuarios
-- set auth_id = 'UUID-DO-AUTH-USERS'
-- where email = 'admin@dalia.com.br';

-- Políticas mínimas: apenas usuários autenticados leem/escrevem
alter table usuarios enable row level security;

drop policy if exists "usuarios_select_auth" on usuarios;
create policy "usuarios_select_auth" on usuarios
  for select to authenticated using (true);

drop policy if exists "usuarios_update_own" on usuarios;
create policy "usuarios_update_own" on usuarios
  for update to authenticated using (auth_id = auth.uid());

-- Repita RLS nas demais tabelas do sistema conforme sua necessidade.
