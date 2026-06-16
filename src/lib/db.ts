import type {
  Usuario,
  Cliente,
  Produto,
  Pedido,
  AgendaSlot,
  Notificacao,
  EmpresaConfig,
  ItemPedido,
} from '../types';
import { isSupabaseConfigured, supabase } from './supabase';
import {
  criarUsuario as criarUsuarioAuth,
  type CriarUsuarioInput,
} from './auth';
import { imagemPrincipal, imagensDoProduto } from './produtoImagens';
import { statusProdutoPorPedido } from './produtoStatus';
import { store } from '../store';

const LS_EMPRESA = 'dalia_empresa';

type ClienteRow = {
  id: string;
  nome: string;
  cpf: string;
  endereco: string;
  telefone: string;
  email: string | null;
  medidas: Record<string, number> | null;
  created_at: string;
};

type ProdutoRow = {
  id: string;
  tipo: string;
  descricao: string;
  data_cadastro: string;
  imagem: string | null;
  imagens?: string[] | null;
  status: string;
  quantidade: number;
  valor_aluguel: number | null;
  valor_calcao: number | null;
};

type PedidoRow = {
  id: string;
  cliente_id: string;
  tipo_pagamento: string;
  tipo_pedido: string;
  data_agendamento: string;
  data_retirada: string;
  data_evento: string;
  data_devolucao: string | null;
  status: string;
  itens: ItemPedido[];
  valor_total: number | null;
  valor_pago: number | null;
  pago: boolean;
  notas: string | null;
  prioridade_costureira: number | null;
  created_at: string;
};

type AgendaRow = {
  id: string;
  data: string;
  hora: string;
  cliente_id: string | null;
  pedido_id: string | null;
  ocupado: boolean;
};

type UsuarioRow = {
  id: string;
  nome: string;
  email: string;
  papel: string;
  auth_id?: string | null;
};

type NotificacaoRow = {
  id: string;
  titulo: string;
  mensagem: string;
  tipo: string;
  data: string;
  lida: boolean;
};

type EmpresaRow = {
  id: string;
  nome_empresa: string;
  endereco_empresa: string;
};

function fromCliente(r: ClienteRow): Cliente {
  return {
    id: r.id,
    nome: r.nome,
    cpf: r.cpf,
    endereco: r.endereco,
    telefone: r.telefone,
    email: r.email ?? undefined,
    medidas: r.medidas ?? undefined,
    createdAt: r.created_at,
  };
}

function toClienteRow(c: Cliente): Omit<ClienteRow, 'created_at'> & { created_at?: string } {
  return {
    id: c.id,
    nome: c.nome,
    cpf: c.cpf,
    endereco: c.endereco,
    telefone: c.telefone,
    email: c.email ?? null,
    medidas: (c.medidas ?? null) as Record<string, number> | null,
    created_at: c.createdAt,
  };
}

function fromProduto(r: ProdutoRow): Produto {
  const imagens = imagensDoProduto({
    imagem: r.imagem ?? undefined,
    imagens: r.imagens ?? undefined,
  });
  return {
    id: r.id,
    tipo: r.tipo,
    descricao: r.descricao,
    dataCadastro: r.data_cadastro,
    imagem: imagens[0],
    imagens: imagens.length ? imagens : undefined,
    status: r.status as Produto['status'],
    quantidade: r.quantidade ?? 1,
    valorAluguel: r.valor_aluguel != null ? Number(r.valor_aluguel) : undefined,
    valorCalcao: r.valor_calcao != null ? Number(r.valor_calcao) : undefined,
  };
}

function toProdutoRow(p: Produto): ProdutoRow {
  const imagens = imagensDoProduto(p);
  return {
    id: p.id,
    tipo: p.tipo,
    descricao: p.descricao,
    data_cadastro: p.dataCadastro.slice(0, 10),
    imagem: imagemPrincipal(p) ?? null,
    imagens: imagens.length ? imagens : null,
    status: p.quantidade <= 0 ? 'fora_estoque' : p.status,
    quantidade: p.quantidade,
    valor_aluguel: p.valorAluguel ?? null,
    valor_calcao: p.valorCalcao ?? null,
  };
}

function fromPedido(r: PedidoRow): Pedido {
  return {
    id: r.id,
    clienteId: r.cliente_id,
    tipoPagamento: r.tipo_pagamento as Pedido['tipoPagamento'],
    tipoPedido: r.tipo_pedido as Pedido['tipoPedido'],
    dataAgendamento: r.data_agendamento,
    dataRetirada: r.data_retirada,
    dataEvento: r.data_evento,
    dataDevolucao: r.data_devolucao ?? undefined,
    status: r.status as Pedido['status'],
    itens: r.itens ?? [],
    valorTotal: r.valor_total != null ? Number(r.valor_total) : undefined,
    valorPago: r.valor_pago != null ? Number(r.valor_pago) : undefined,
    pago: r.pago,
    notas: r.notas ?? undefined,
    prioridadeCostureira: r.prioridade_costureira ?? undefined,
    createdAt: r.created_at,
  };
}

function toPedidoRow(p: Pedido): PedidoRow {
  return {
    id: p.id,
    cliente_id: p.clienteId,
    tipo_pagamento: p.tipoPagamento,
    tipo_pedido: p.tipoPedido,
    data_agendamento: p.dataAgendamento.slice(0, 10),
    data_retirada: p.dataRetirada.slice(0, 10),
    data_evento: p.dataEvento.slice(0, 10),
    data_devolucao: p.dataDevolucao?.slice(0, 10) ?? null,
    status: p.status,
    itens: p.itens,
    valor_total: p.valorTotal ?? null,
    valor_pago: p.valorPago ?? null,
    pago: p.pago,
    notas: p.notas ?? null,
    prioridade_costureira: p.prioridadeCostureira ?? null,
    created_at: p.createdAt,
  };
}

function fromAgenda(r: AgendaRow): AgendaSlot {
  return {
    id: r.id,
    data: r.data,
    hora: r.hora,
    clienteId: r.cliente_id ?? undefined,
    pedidoId: r.pedido_id ?? undefined,
    ocupado: r.ocupado,
  };
}

function toAgendaRow(s: AgendaSlot): AgendaRow {
  return {
    id: s.id,
    data: s.data,
    hora: s.hora,
    cliente_id: s.clienteId ?? null,
    pedido_id: s.pedidoId ?? null,
    ocupado: s.ocupado,
  };
}

function fromUsuario(r: UsuarioRow): Usuario {
  return {
    id: r.id,
    nome: r.nome,
    email: r.email,
    papel: r.papel as Usuario['papel'],
    authId: r.auth_id ?? undefined,
  };
}

function fromNotificacao(r: NotificacaoRow): Notificacao {
  return {
    id: r.id,
    titulo: r.titulo,
    mensagem: r.mensagem,
    tipo: r.tipo as Notificacao['tipo'],
    data: r.data,
    lida: r.lida,
  };
}

const EMPRESA_DEFAULT: EmpresaConfig = {
  nomeEmpresa: 'Dália Ateliê de Noivas',
  enderecoEmpresa: 'Rua Alberto Giovanini, nº 222, Betânia, Ipatinga - MG',
};

function hydrateStore(data: {
  usuarios: Usuario[];
  clientes: Cliente[];
  produtos: Produto[];
  pedidos: Pedido[];
  agenda: AgendaSlot[];
  notificacoes: Notificacao[];
  empresa: EmpresaConfig;
}) {
  store.usuarios = data.usuarios;
  store.clientes = data.clientes;
  store.produtos = data.produtos;
  store.pedidos = data.pedidos;
  store.agenda = data.agenda;
  store.notificacoes = data.notificacoes;
  localStorage.setItem(LS_EMPRESA, JSON.stringify(data.empresa));
}

export async function loadAll(): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    const [usuRes, cliRes, proRes, pedRes, agRes, notRes, empRes] = await Promise.all([
      supabase.from('usuarios').select('id, nome, email, papel, auth_id'),
      supabase.from('clientes').select('*').order('created_at', { ascending: false }),
      supabase.from('produtos').select('*').order('data_cadastro', { ascending: false }),
      supabase.from('pedidos').select('*').order('created_at', { ascending: false }),
      supabase.from('agenda_slots').select('*'),
      supabase.from('notificacoes').select('*').order('data', { ascending: false }),
      supabase.from('empresa_config').select('*').eq('id', 'default').maybeSingle(),
    ]);

    const err =
      usuRes.error ||
      cliRes.error ||
      proRes.error ||
      pedRes.error ||
      agRes.error ||
      notRes.error;
    if (err) throw err;

    const empresaRow = empRes.data as EmpresaRow | null;
    hydrateStore({
      usuarios: (usuRes.data as UsuarioRow[]).map(fromUsuario),
      clientes: (cliRes.data as ClienteRow[]).map(fromCliente),
      produtos: (proRes.data as ProdutoRow[]).map(fromProduto),
      pedidos: (pedRes.data as PedidoRow[]).map(fromPedido),
      agenda: (agRes.data as AgendaRow[]).map(fromAgenda),
      notificacoes: (notRes.data as NotificacaoRow[]).map(fromNotificacao),
      empresa: empresaRow
        ? {
            nomeEmpresa: empresaRow.nome_empresa,
            enderecoEmpresa: empresaRow.endereco_empresa,
          }
        : EMPRESA_DEFAULT,
    });
    return;
  }

  hydrateStore({
    usuarios: store.usuarios,
    clientes: store.clientes,
    produtos: store.produtos.map((p) => ({ ...p, quantidade: p.quantidade ?? 1 })),
    pedidos: store.pedidos,
    agenda: store.agenda,
    notificacoes: store.notificacoes,
    empresa: readEmpresaLocal(),
  });
}

export function readEmpresa(): EmpresaConfig {
  return readEmpresaLocal();
}

function readEmpresaLocal(): EmpresaConfig {
  try {
    const s = localStorage.getItem(LS_EMPRESA);
    if (s) return JSON.parse(s) as EmpresaConfig;
  } catch {
    void 0;
  }
  return { ...EMPRESA_DEFAULT };
}

async function upsertSupabase<T extends Record<string, unknown>>(
  table: string,
  row: T
): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from(table).upsert(row);
  if (error) throw error;
}

async function deleteSupabase(table: string, id: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from(table).delete().eq('id', id);
  if (error) throw error;
}

export async function saveCliente(cliente: Cliente): Promise<void> {
  const lista = [...store.clientes];
  const idx = lista.findIndex((c) => c.id === cliente.id);
  if (idx >= 0) lista[idx] = cliente;
  else lista.push(cliente);
  store.clientes = lista;

  if (isSupabaseConfigured) {
    await upsertSupabase('clientes', toClienteRow(cliente));
  }
}

export async function deleteCliente(id: string): Promise<void> {
  store.clientes = store.clientes.filter((c) => c.id !== id);
  if (isSupabaseConfigured) await deleteSupabase('clientes', id);
}

export async function saveProduto(produto: Produto): Promise<void> {
  const normalizado: Produto = {
    ...produto,
    quantidade: Math.max(0, produto.quantidade ?? 1),
    status: produto.quantidade <= 0 ? 'fora_estoque' : produto.status,
  };
  const lista = [...store.produtos];
  const idx = lista.findIndex((p) => p.id === normalizado.id);
  if (idx >= 0) lista[idx] = normalizado;
  else lista.push(normalizado);
  store.produtos = lista;

  if (isSupabaseConfigured) {
    const row = toProdutoRow(normalizado);
    try {
      await upsertSupabase('produtos', row);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (row.imagens && /imagens|column/i.test(msg)) {
        const { imagens: _omit, ...semImagens } = row;
        await upsertSupabase('produtos', semImagens as ProdutoRow);
      } else {
        throw e;
      }
    }
  }
}

export async function deleteProduto(id: string): Promise<void> {
  store.produtos = store.produtos.filter((p) => p.id !== id);
  if (isSupabaseConfigured) await deleteSupabase('produtos', id);
}

function validarEstoquePedido(pedido: Pedido, anterior?: Pedido): void {
  const devolver = anterior?.itens ?? [];
  const estoque = new Map<string, number>();
  store.produtos.forEach((p) => {
    const devolvido = devolver
      .filter((i) => i.produtoId === p.id)
      .reduce((s, i) => s + i.quantidade, 0);
    estoque.set(p.id, p.quantidade + devolvido);
  });

  for (const item of pedido.itens) {
    const disp = estoque.get(item.produtoId) ?? 0;
    if (disp < item.quantidade) {
      const prod = store.produtos.find((x) => x.id === item.produtoId);
      throw new Error(
        `Estoque insuficiente para "${prod?.descricao ?? item.produtoId}". Disponível: ${disp}.`
      );
    }
    estoque.set(item.produtoId, disp - item.quantidade);
  }
}

function aplicarEstoquePedido(pedido: Pedido, anterior?: Pedido): Produto[] {
  const produtos = store.produtos.map((p) => ({ ...p }));

  if (anterior) {
    for (const item of anterior.itens) {
      const p = produtos.find((x) => x.id === item.produtoId);
      if (p) {
        p.quantidade += item.quantidade;
        if (p.quantidade > 0 && p.status === 'fora_estoque') p.status = 'disponivel';
      }
    }
  }

  for (const item of pedido.itens) {
    const p = produtos.find((x) => x.id === item.produtoId);
    if (!p) continue;
    p.quantidade = Math.max(0, p.quantidade - item.quantidade);
    if (p.quantidade <= 0) {
      p.status = 'fora_estoque';
    } else {
      const novoStatus = statusProdutoPorPedido(
        pedido.status,
        Boolean(pedido.prioridadeCostureira)
      );
      if (novoStatus) p.status = novoStatus;
    }
  }

  return produtos;
}

export async function savePedido(pedido: Pedido, anterior?: Pedido): Promise<void> {
  validarEstoquePedido(pedido, anterior);
  const produtosAtualizados = aplicarEstoquePedido(pedido, anterior);
  store.produtos = produtosAtualizados;

  const lista = [...store.pedidos];
  const idx = lista.findIndex((p) => p.id === pedido.id);
  if (idx >= 0) lista[idx] = pedido;
  else lista.push(pedido);
  store.pedidos = lista;

  if (isSupabaseConfigured && supabase) {
    await upsertSupabase('pedidos', toPedidoRow(pedido));
    for (const p of produtosAtualizados) {
      await upsertSupabase('produtos', toProdutoRow(p));
    }
  }
}

export async function deletePedido(id: string): Promise<void> {
  const anterior = store.pedidos.find((p) => p.id === id);
  if (anterior) {
    const produtos = store.produtos.map((p) => ({ ...p }));
    for (const item of anterior.itens) {
      const p = produtos.find((x) => x.id === item.produtoId);
      if (p) {
        p.quantidade += item.quantidade;
        if (p.quantidade > 0 && p.status === 'fora_estoque') p.status = 'disponivel';
      }
    }
    store.produtos = produtos;
    if (isSupabaseConfigured && supabase) {
      for (const p of produtos) await upsertSupabase('produtos', toProdutoRow(p));
    }
  }
  store.pedidos = store.pedidos.filter((p) => p.id !== id);
  if (isSupabaseConfigured) await deleteSupabase('pedidos', id);
}

export async function saveAgenda(slots: AgendaSlot[]): Promise<void> {
  store.agenda = slots;
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.from('agenda_slots').upsert(slots.map(toAgendaRow));
    if (error) throw error;
  }
}

export async function saveAgendaSlot(slot: AgendaSlot): Promise<void> {
  const lista = [...store.agenda];
  const idx = lista.findIndex((s) => s.id === slot.id);
  if (idx >= 0) lista[idx] = slot;
  else lista.push(slot);
  await saveAgenda(lista);
}

export async function removeAgendaSlot(id: string): Promise<void> {
  const lista = store.agenda.filter((s) => s.id !== id);
  store.agenda = lista;
  if (isSupabaseConfigured) await deleteSupabase('agenda_slots', id);
}

export async function saveEmpresa(empresa: EmpresaConfig): Promise<void> {
  localStorage.setItem(LS_EMPRESA, JSON.stringify(empresa));
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.from('empresa_config').upsert({
      id: 'default',
      nome_empresa: empresa.nomeEmpresa,
      endereco_empresa: empresa.enderecoEmpresa,
    });
    if (error) throw error;
  }
}

export { loginUsuario, logoutUsuario, type CriarUsuarioInput } from './auth';

export async function criarUsuario(actor: Usuario, input: CriarUsuarioInput): Promise<void> {
  const novo = await criarUsuarioAuth(actor, input);
  if (!store.usuarios.some((u) => u.id === novo.id)) {
    store.usuarios = [...store.usuarios, novo];
  }
}

export async function deleteUsuario(id: string): Promise<void> {
  store.usuarios = store.usuarios.filter((u) => u.id !== id);
  if (isSupabaseConfigured) await deleteSupabase('usuarios', id);
}

export async function marcarNotificacaoLida(id: string): Promise<void> {
  const lista = store.notificacoes.map((n) =>
    n.id === id ? { ...n, lida: true } : n
  );
  store.notificacoes = lista;
  if (isSupabaseConfigured && supabase) {
    await supabase.from('notificacoes').update({ lida: true }).eq('id', id);
  }
}
