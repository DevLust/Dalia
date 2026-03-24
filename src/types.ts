// Tipos do sistema Dália Ateliê de Noivas (conforme documento)

export type Papel = 'cliente' | 'atendente' | 'administrador' | 'gerente';

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  senha: string; // em produção seria hash
  papel: Papel;
}

export type StatusProduto =
  | 'disponivel'
  | 'reservado'
  | 'costureira'
  | 'emprestado'
  | 'danificado'
  | 'conserto';

export interface Medidas {
  busto?: number;
  cintura?: number;
  quadril?: number;
  comprimento?: number;
  ombro?: number;
  [key: string]: number | undefined;
}

export interface Cliente {
  id: string;
  nome: string;
  cpf: string;
  identidade?: string;
  endereco: string;
  telefone: string;
  email?: string;
  medidas?: Medidas;
  createdAt: string;
}

export interface Produto {
  id: string;
  tipo: string; // vestido, etc.
  descricao: string;
  dataCadastro: string;
  imagem?: string; // base64 ou URL
  status: StatusProduto;
  valorAluguel?: number;
  valorCalcao?: number;
}

export type TipoPagamento = 'vista' | 'cartao' | 'pix';
export type TipoPedido = 'integral' | 'metade_metade';
export type StatusPedido =
  | 'agendado'
  | 'em_atendimento'
  | 'aguardando_retirada'
  | 'emprestado'
  | 'devolvido'
  | 'concluido'
  | 'cancelado';

export interface ItemPedido {
  produtoId: string;
  quantidade: number;
  observacoes?: string;
}

export interface Pedido {
  id: string;
  clienteId: string;
  tipoPagamento: TipoPagamento;
  tipoPedido: TipoPedido;
  dataAgendamento: string;
  dataRetirada: string;
  dataEvento: string;
  dataDevolucao?: string;
  status: StatusPedido;
  itens: ItemPedido[];
  valorTotal?: number;
  valorPago?: number;
  pago: boolean;
  notas?: string;
  prioridadeCostureira?: number; // 1 = mais prioritário
  createdAt: string;
}

export interface AgendaSlot {
  id: string;
  data: string;
  hora: string;
  clienteId?: string;
  pedidoId?: string;
  ocupado: boolean;
}

export interface Notificacao {
  id: string;
  titulo: string;
  mensagem: string;
  tipo: 'info' | 'alerta' | 'devolucao' | 'visita';
  data: string;
  lida: boolean;
}
