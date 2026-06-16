import { createClient } from '@supabase/supabase-js';

type ReqBody = {
  nome?: string;
  email?: string;
  senha?: string;
  papel?: string;
};

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
    const msg = createError?.message ?? 'Não foi possível criar o usuário no Auth.';
    return res.status(400).json({ error: msg });
  }

  const row = {
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
