import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';

type ReqBody = {
  nome?: string;
  email?: string;
  senha?: string;
  papel?: string;
};

type UsuarioRow = {
  id: string;
  nome: string;
  email: string;
  papel: string;
  auth_id: string;
};

function traduzirErroAuth(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('already been registered') || m.includes('already exists')) {
    return 'Este e-mail já existe no login (Supabase Auth). O sistema tentará vincular o perfil automaticamente.';
  }
  if (m.includes('invalid email')) return 'E-mail inválido.';
  if (m.includes('password')) return 'Senha inválida. Use no mínimo 6 caracteres.';
  return message;
}

async function buscarAuthUserPorEmail(
  adminClient: SupabaseClient,
  email: string
): Promise<User | null> {
  let page = 1;
  const perPage = 200;
  const alvo = email.toLowerCase();

  while (page <= 10) {
    const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const hit = data.users.find((u) => u.email?.toLowerCase() === alvo);
    if (hit) return hit;
    if (data.users.length < perPage) break;
    page += 1;
  }
  return null;
}

async function vincularPerfilExistente(
  adminClient: SupabaseClient,
  authUser: User,
  nome: string,
  email: string,
  senha: string,
  papel: string
): Promise<UsuarioRow | { error: string; status: number }> {
  const { data: perfilExistente } = await adminClient
    .from('usuarios')
    .select('id, nome, email, papel, auth_id')
    .ilike('email', email)
    .maybeSingle();

  if (perfilExistente) {
    return {
      error: 'Este e-mail já possui perfil cadastrado na equipe.',
      status: 400,
    };
  }

  const { error: updateError } = await adminClient.auth.admin.updateUserById(authUser.id, {
    password: senha,
    email_confirm: true,
    user_metadata: { nome, papel },
  });
  if (updateError) {
    return { error: traduzirErroAuth(updateError.message), status: 400 };
  }

  const row: UsuarioRow = {
    id: authUser.id,
    nome,
    email,
    papel,
    auth_id: authUser.id,
  };

  const { error: dbError } = await adminClient.from('usuarios').insert(row);
  if (dbError) {
    return { error: dbError.message, status: 400 };
  }

  return row;
}

export default async function handler(
  req: { method?: string; headers: Record<string, string | string[] | undefined>; body?: ReqBody },
  res: {
    status: (code: number) => {
      json: (body: unknown) => void;
      end: () => void;
    };
  }
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido.' });
  }

  const url =
    process.env.VITE_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey =
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !anonKey || !serviceKey) {
    return res.status(500).json({
      error:
        'Servidor sem SUPABASE_SERVICE_ROLE_KEY. Adicione em Vercel → Settings → Environment Variables.',
    });
  }

  const authHeader = req.headers.authorization;
  const token = (Array.isArray(authHeader) ? authHeader[0] : authHeader)?.replace(
    /^Bearer\s+/i,
    ''
  );
  if (!token) {
    return res.status(401).json({ error: 'Não autorizado.' });
  }

  const anonClient = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const {
    data: { user },
    error: userError,
  } = await anonClient.auth.getUser(token);

  if (userError || !user) {
    return res.status(401).json({ error: 'Sessão inválida. Faça login novamente.' });
  }

  const adminClient = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: actor } = await adminClient
    .from('usuarios')
    .select('papel')
    .eq('auth_id', user.id)
    .maybeSingle();

  if (!actor || actor.papel !== 'administrador') {
    return res.status(403).json({ error: 'Apenas administradores podem criar usuários.' });
  }

  const nome = req.body?.nome?.trim() ?? '';
  const email = req.body?.email?.trim().toLowerCase() ?? '';
  const senha = req.body?.senha ?? '';
  const papel = req.body?.papel ?? '';

  if (!nome || !email || !senha) {
    return res.status(400).json({ error: 'Nome, e-mail e senha são obrigatórios.' });
  }
  if (senha.length < 6) {
    return res.status(400).json({ error: 'A senha deve ter no mínimo 6 caracteres.' });
  }
  if (papel !== 'atendente' && papel !== 'gerente') {
    return res.status(400).json({ error: 'Papel inválido.' });
  }

  const { data: created, error: createError } = await adminClient.auth.admin.createUser({
    email,
    password: senha,
    email_confirm: true,
    user_metadata: { nome, papel },
  });

  if (createError || !created.user) {
    const dup =
      createError &&
      /already been registered|already exists|duplicate/i.test(createError.message);

    if (dup) {
      try {
        const authUser = await buscarAuthUserPorEmail(adminClient, email);
        if (!authUser) {
          return res.status(400).json({
            error:
              'E-mail já usado no login, mas não foi encontrado no Auth. Remova em Supabase → Authentication → Users.',
          });
        }

        const vinculo = await vincularPerfilExistente(
          adminClient,
          authUser,
          nome,
          email,
          senha,
          papel
        );

        if ('error' in vinculo) {
          return res.status(vinculo.status).json({ error: vinculo.error });
        }

        return res.status(200).json({ usuario: vinculo });
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Erro ao vincular usuário existente.';
        return res.status(400).json({ error: msg });
      }
    }

    const msg = traduzirErroAuth(createError?.message ?? 'Não foi possível criar o usuário no Auth.');
    return res.status(400).json({ error: msg });
  }

  const row: UsuarioRow = {
    id: created.user.id,
    nome,
    email,
    papel,
    auth_id: created.user.id,
  };

  const { error: dbError } = await adminClient.from('usuarios').insert(row);
  if (dbError) {
    await adminClient.auth.admin.deleteUser(created.user.id);
    return res.status(400).json({ error: dbError.message });
  }

  return res.status(200).json({ usuario: row });
}
