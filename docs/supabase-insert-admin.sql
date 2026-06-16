-- Admin inicial — execute no SQL Editor do Supabase (uma vez)
--
-- Login no sistema:
--   E-mail: admin@dalia.com.br
--   Senha:  admin123
--
-- Troque a senha depois em Authentication → Users (admin123 é só para começar).

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

-- Conferência
select id, nome, email, papel, auth_id
from public.usuarios
where lower(email) = 'admin@dalia.com.br';
