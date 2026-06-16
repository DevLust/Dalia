import type {
  Usuario,
  Cliente,
  Produto,
  Pedido,
  AgendaSlot,
  Notificacao,
} from './types';
import { devUsersForStore } from './lib/devAuth';
import { isSupabaseConfigured } from './lib/supabase';

const STORAGE_KEYS = {
  usuarios: 'dalia_usuarios',
  clientes: 'dalia_clientes',
  produtos: 'dalia_produtos',
  pedidos: 'dalia_pedidos',
  agenda: 'dalia_agenda',
  notificacoes: 'dalia_notificacoes',
} as const;

function load<T>(key: string, defaultVal: T): T {
  try {
    const s = localStorage.getItem(key);
    if (s) return JSON.parse(s) as T;
  } catch {
    void 0;
  }
  return defaultVal;
}

function save<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

function defaultUsuarios(): Usuario[] {
  if (import.meta.env.PROD || isSupabaseConfigured) return [];
  return devUsersForStore();
}

export const store = {
  get usuarios(): Usuario[] {
    return load(STORAGE_KEYS.usuarios, defaultUsuarios());
  },
  set usuarios(v: Usuario[]) {
    save(STORAGE_KEYS.usuarios, v);
  },

  get clientes(): Cliente[] {
    return load(STORAGE_KEYS.clientes, []);
  },
  set clientes(v: Cliente[]) {
    save(STORAGE_KEYS.clientes, v);
  },

  get produtos(): Produto[] {
    return load(STORAGE_KEYS.produtos, []);
  },
  set produtos(v: Produto[]) {
    save(STORAGE_KEYS.produtos, v);
  },

  get pedidos(): Pedido[] {
    return load(STORAGE_KEYS.pedidos, []);
  },
  set pedidos(v: Pedido[]) {
    save(STORAGE_KEYS.pedidos, v);
  },

  get agenda(): AgendaSlot[] {
    return load(STORAGE_KEYS.agenda, []);
  },
  set agenda(v: AgendaSlot[]) {
    save(STORAGE_KEYS.agenda, v);
  },

  get notificacoes(): Notificacao[] {
    return load(STORAGE_KEYS.notificacoes, []);
  },
  set notificacoes(v: Notificacao[]) {
    save(STORAGE_KEYS.notificacoes, v);
  },
};

export function generateId(): string {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
