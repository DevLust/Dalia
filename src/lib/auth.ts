import { createClient } from '@supabase/supabase-js';
import type { User } from '@supabase/supabase-js';
import type { Papel, Usuario } from '../types';
import { loginDevLocal, registerDevUser } from './devAuth';
import { isSupabaseConfigured, supabase } from './supabase';

export type CriarUsuarioInput = {
  nome: string;
  email: string;
  senha: string;
  papel: Papel;
};

type PerfilRow = {
  id: string;
  nome: string;
  email: string;
  papel: string;
  auth_id?: string | null;
};

const PERFIL_COLS = 'id, nome, email, papel, auth_id';

function mapPerfil(row: PerfilRow): Usuario {
  return {
    id: row.id,
    nome: row.nome,
    email: row.email,
    papel: row.papel as Papel,
    authId: row.auth_id ?? undefined,
  };
}

async function vincularAuthId(perfilId: string, authId: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from('usuarios').update({ auth_id: authId }).eq('id', perfilId);
  if (error && !/auth_id|column/i.test(error.message)) {
    console.warn('Não foi possível vincular auth_id ao perfil:', error.message);
  }
}

async function fetchPerfil(authUser: User): Promise<Usuario | null> {
  if (!supabase) return null;

  const byAuth = await supabase
    .from('usuarios')
    .select(PERFIL_COLS)
    .eq('auth_id', authUser.id)
    .maybeSingle();

  if (!byAuth.error && byAuth.data) {
    return mapPerfil(byAuth.data as PerfilRow);
  }

  if (!authUser.email) return null;

  const byEmail = await supabase
    .from('usuarios')
    .select(PERFIL_COLS)
    .ilike('email', authUser.email)
    .maybeSingle();

  if (byEmail.error) {
    const fallback = await supabase
      .from('usuarios')
      .select('id, nome, email, papel')
      .ilike('email', authUser.email)
      .maybeSingle();
    if (fallback.data) return mapPerfil(fallback.data as PerfilRow);
    return null;
  }

  if (!byEmail.data) return null;

  const perfil = mapPerfil(byEmail.data as PerfilRow);
  if (!perfil.authId) await vincularAuthId(perfil.id, authUser.id);
  return perfil;
}

export async function loginUsuario(email: string, senha: string): Promise<Usuario | null> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: senha,
    });
    if (error || !data.user) return null;
    return fetchPerfil(data.user);
  }

  if (import.meta.env.PROD) return null;
  return loginDevLocal(email, senha);
}

export async function logoutUsuario(): Promise<void> {
  if (supabase) await supabase.auth.signOut();
}

export async function restoreUsuarioFromSession(): Promise<Usuario | null> {
  if (!supabase) return null;
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) return null;
  return fetchPerfil(session.user);
}

export function subscribeAuth(onChange: (user: Usuario | null) => void): () => void {
  if (!supabase) return () => undefined;

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange(async (_event, session) => {
    if (!session?.user) {
      onChange(null);
      return;
    }
    const perfil = await fetchPerfil(session.user);
    onChange(perfil);
  });

  return () => subscription.unsubscribe();
}

export function requiresSupabaseInProduction(): boolean {
  return import.meta.env.PROD && !isSupabaseConfigured;
}

function ephemeralAuthClient() {
  const url = import.meta.env.VITE_SUPABASE_URL as string;
  const key =
    (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ||
    (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined);
  if (!key) throw new Error('Chave Supabase não configurada.');
  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

/** Cria usuário no Supabase Auth + perfil em usuarios (não altera sessão do admin). */
export async function criarUsuarioAuth(input: CriarUsuarioInput): Promise<Usuario> {
  if (!supabase) throw new Error('Supabase não configurado.');

  const email = input.email.trim().toLowerCase();
  const ephemeral = ephemeralAuthClient();
  const { data, error } = await ephemeral.auth.signUp({
    email,
    password: input.senha,
    options: {
      data: { nome: input.nome.trim(), papel: input.papel },
    },
  });

  if (error) throw new Error(error.message);
  if (!data.user) throw new Error('Não foi possível criar o usuário no Auth.');

  const row = {
    id: data.user.id,
    nome: input.nome.trim(),
    email,
    papel: input.papel,
    auth_id: data.user.id,
  };

  const { error: dbError } = await supabase.from('usuarios').insert(row);
  if (dbError) throw new Error(dbError.message);

  return mapPerfil(row as PerfilRow);
}

export async function criarUsuario(
  actor: Usuario,
  input: CriarUsuarioInput
): Promise<Usuario> {
  if (actor.papel !== 'administrador') {
    throw new Error('Apenas administradores podem criar usuários.');
  }
  if (input.papel === 'administrador') {
    throw new Error('Use o Supabase para criar outro administrador.');
  }
  if (input.senha.length < 6) {
    throw new Error('A senha deve ter no mínimo 6 caracteres.');
  }
  if (!input.nome.trim() || !input.email.trim()) {
    throw new Error('Nome e e-mail são obrigatórios.');
  }

  if (isSupabaseConfigured && supabase) {
    return criarUsuarioAuth(input);
  }

  if (import.meta.env.PROD) {
    throw new Error('Supabase é obrigatório em produção.');
  }

  return registerDevUser(input.nome, input.email, input.senha, input.papel);
}
