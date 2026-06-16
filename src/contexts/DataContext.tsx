import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type {
  Cliente,
  Produto,
  Pedido,
  AgendaSlot,
  Notificacao,
  EmpresaConfig,
  Usuario,
} from '../types';
import { store } from '../store';
import {
  loadAll,
  saveCliente,
  deleteCliente,
  saveProduto,
  deleteProduto,
  savePedido,
  deletePedido,
  saveAgendaSlot,
  removeAgendaSlot,
  saveEmpresa,
  deleteUsuario,
  criarUsuario,
  marcarNotificacaoLida,
  readEmpresa,
} from '../lib/db';
import type { CriarUsuarioInput } from '../lib/db';
import { isSupabaseConfigured } from '../lib/supabase';
import { mensagemErro } from '../lib/validators';

interface DataContextType {
  ready: boolean;
  loading: boolean;
  error: string | null;
  usingSupabase: boolean;
  clientes: Cliente[];
  produtos: Produto[];
  pedidos: Pedido[];
  agenda: AgendaSlot[];
  notificacoes: Notificacao[];
  usuarios: Usuario[];
  empresa: EmpresaConfig;
  refresh: () => Promise<void>;
  salvarCliente: (c: Cliente) => Promise<void>;
  excluirCliente: (id: string) => Promise<void>;
  salvarProduto: (p: Produto) => Promise<void>;
  excluirProduto: (id: string) => Promise<void>;
  salvarPedido: (p: Pedido, anterior?: Pedido) => Promise<void>;
  excluirPedido: (id: string) => Promise<void>;
  salvarSlotAgenda: (s: AgendaSlot) => Promise<void>;
  removerSlotAgenda: (id: string) => Promise<void>;
  salvarEmpresaConfig: (e: EmpresaConfig) => Promise<void>;
  criarUsuario: (actor: Usuario, input: CriarUsuarioInput) => Promise<void>;
  excluirUsuario: (id: string) => Promise<void>;
  marcarNotificacao: (id: string) => Promise<void>;
}

const DataContext = createContext<DataContextType | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await loadAll();
      setTick((t) => t + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar dados.');
    } finally {
      setLoading(false);
      setReady(true);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const wrap =
    <T extends unknown[]>(fn: (...args: T) => Promise<void>) =>
    async (...args: T) => {
      setError(null);
      try {
        await fn(...args);
        setTick((t) => t + 1);
      } catch (e) {
        const msg = mensagemErro(e);
        setError(msg);
        throw e;
      }
    };

  const value = useMemo<DataContextType>(
    () => ({
      ready,
      loading,
      error,
      usingSupabase: isSupabaseConfigured,
      clientes: store.clientes,
      produtos: store.produtos,
      pedidos: store.pedidos,
      agenda: store.agenda,
      notificacoes: store.notificacoes,
      usuarios: store.usuarios,
      empresa: readEmpresa(),
      refresh,
      salvarCliente: wrap(saveCliente),
      excluirCliente: wrap(deleteCliente),
      salvarProduto: wrap(saveProduto),
      excluirProduto: wrap(deleteProduto),
      salvarPedido: wrap(savePedido),
      excluirPedido: wrap(deletePedido),
      salvarSlotAgenda: wrap(saveAgendaSlot),
      removerSlotAgenda: wrap(removeAgendaSlot),
      salvarEmpresaConfig: wrap(saveEmpresa),
      criarUsuario: wrap(criarUsuario),
      excluirUsuario: wrap(deleteUsuario),
      marcarNotificacao: wrap(marcarNotificacaoLida),
    }),
    [ready, loading, error, tick, refresh]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
