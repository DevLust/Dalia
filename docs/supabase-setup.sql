alter table usuarios add column if not exists auth_id uuid unique references auth.users(id);
alter table usuarios drop column if exists senha;
alter table produtos add column if not exists imagens jsonb default '[]'::jsonb;
alter table pedidos add column if not exists prioridade_costureira integer;

alter table usuarios enable row level security;

drop policy if exists "usuarios_select_auth" on usuarios;
create policy "usuarios_select_auth" on usuarios
  for select to authenticated using (true);

drop policy if exists "usuarios_update_own" on usuarios;
drop policy if exists "usuarios_update_link_auth" on usuarios;
create policy "usuarios_update_link_auth" on usuarios
  for update to authenticated
  using (auth_id is null or auth_id = auth.uid())
  with check (auth_id = auth.uid());

drop policy if exists "usuarios_insert_admin" on usuarios;
create policy "usuarios_insert_admin" on usuarios
  for insert to authenticated
  with check (
    exists (
      select 1 from usuarios admin
      where admin.auth_id = auth.uid()
      and admin.papel = 'administrador'
    )
  );

drop policy if exists "usuarios_delete_admin" on usuarios;
create policy "usuarios_delete_admin" on usuarios
  for delete to authenticated
  using (
    exists (
      select 1 from usuarios admin
      where admin.auth_id = auth.uid()
      and admin.papel = 'administrador'
    )
  );

create extension if not exists pgcrypto;

do $$
declare
  v_email text := 'admin@dalia.com.br';
  v_senha text := 'admin123';
  v_user_id uuid;
begin
  select id into v_user_id
  from auth.users
  where lower(email) = lower(v_email);

  if v_user_id is null then
    v_user_id := gen_random_uuid();

    insert into auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) values (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      v_email,
      crypt(v_senha, gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"nome":"Administrador"}'::jsonb,
      now(),
      now(),
      '',
      '',
      '',
      ''
    );

    insert into auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) values (
      gen_random_uuid(),
      v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', v_email),
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    );
  else
    update auth.users
    set
      encrypted_password = crypt(v_senha, gen_salt('bf')),
      email_confirmed_at = coalesce(email_confirmed_at, now())
    where id = v_user_id;
  end if;

  update public.usuarios
  set
    auth_id = v_user_id,
    papel = 'administrador',
    nome = 'Administrador'
  where lower(email) = lower(v_email);

  if not found then
    insert into public.usuarios (id, nome, email, papel, auth_id)
    values (v_user_id, 'Administrador', v_email, 'administrador', v_user_id);
  end if;
end $$;

alter table pedidos enable row level security;
alter table produtos enable row level security;
alter table clientes enable row level security;
alter table agenda_slots enable row level security;
alter table notificacoes enable row level security;
alter table empresa_config enable row level security;

drop policy if exists "pedidos_auth" on pedidos;
create policy "pedidos_auth" on pedidos for all to authenticated using (true) with check (true);

drop policy if exists "produtos_auth" on produtos;
create policy "produtos_auth" on produtos for all to authenticated using (true) with check (true);

drop policy if exists "clientes_auth" on clientes;
create policy "clientes_auth" on clientes for all to authenticated using (true) with check (true);

drop policy if exists "agenda_slots_auth" on agenda_slots;
create policy "agenda_slots_auth" on agenda_slots for all to authenticated using (true) with check (true);

drop policy if exists "notificacoes_auth" on notificacoes;
create policy "notificacoes_auth" on notificacoes for all to authenticated using (true) with check (true);

drop policy if exists "empresa_config_auth" on empresa_config;
create policy "empresa_config_auth" on empresa_config for all to authenticated using (true) with check (true);
