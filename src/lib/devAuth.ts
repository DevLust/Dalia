import type { Usuario } from '../types';

/** Apenas desenvolvimento local sem Supabase — nunca usado em builds de produção. */
const DEV_USERS: Array<Usuario & { senha: string }> = [
  {
    id: '1',
    nome: 'Administrador',
    email: 'admin@dalia.com.br',
    senha: 'admin123',
    papel: 'administrador',
  },
  {
    id: '2',
    nome: 'Gerente',
    email: 'gerente@dalia.com.br',
    senha: 'gerente123',
    papel: 'gerente',
  },
  {
    id: '3',
    nome: 'Atendente',
    email: 'atendente@dalia.com.br',
    senha: 'atendente123',
    papel: 'atendente',
  },
];

export function loginDevLocal(email: string, senha: string): Usuario | null {
  const hit = DEV_USERS.find(
    (u) => u.email.toLowerCase() === email.toLowerCase() && u.senha === senha
  );
  if (!hit) return null;
  const { senha: _omit, ...user } = hit;
  return user;
}

export function devUsersForStore(): Usuario[] {
  return DEV_USERS.map(({ senha: _omit, ...u }) => u);
}

export function isDevLoginHintVisible(): boolean {
  return import.meta.env.DEV;
}
