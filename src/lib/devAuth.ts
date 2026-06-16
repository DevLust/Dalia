import type { Papel, Usuario } from '../types';
import { generateId } from '../store';

const LS_DEV_EXTRA = 'dalia_dev_users_extra';

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

function allDevUsers(): Array<Usuario & { senha: string }> {
  try {
    const extra = JSON.parse(
      localStorage.getItem(LS_DEV_EXTRA) || '[]'
    ) as Array<Usuario & { senha: string }>;
    return [...DEV_USERS, ...extra];
  } catch {
    return [...DEV_USERS];
  }
}

export function loginDevLocal(email: string, senha: string): Usuario | null {
  const hit = allDevUsers().find(
    (u) => u.email.toLowerCase() === email.toLowerCase() && u.senha === senha
  );
  if (!hit) return null;
  const { senha: _omit, ...user } = hit;
  return user;
}

export function devUsersForStore(): Usuario[] {
  return allDevUsers().map(({ senha: _omit, ...u }) => u);
}

export function registerDevUser(
  nome: string,
  email: string,
  senha: string,
  papel: Papel
): Usuario {
  if (allDevUsers().some((u) => u.email.toLowerCase() === email.toLowerCase())) {
    throw new Error('E-mail já cadastrado.');
  }
  const user: Usuario & { senha: string } = {
    id: generateId(),
    nome: nome.trim(),
    email: email.trim().toLowerCase(),
    senha,
    papel,
  };
  const extra = JSON.parse(localStorage.getItem(LS_DEV_EXTRA) || '[]') as Array<
    Usuario & { senha: string }
  >;
  extra.push(user);
  localStorage.setItem(LS_DEV_EXTRA, JSON.stringify(extra));
  const { senha: _omit, ...pub } = user;
  return pub;
}

export function isDevLoginHintVisible(): boolean {
  return import.meta.env.DEV;
}
