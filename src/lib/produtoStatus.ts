import type { Pedido, Produto, StatusPedido, StatusProduto } from '../types';

export function statusEfetivo(produto: Produto): StatusProduto {
  if (produto.quantidade <= 0) return 'fora_estoque';
  return produto.status;
}

export function podeAlugar(produto: Produto, qtd = 1): boolean {
  return produto.quantidade >= qtd && statusEfetivo(produto) !== 'fora_estoque';
}

export function statusProdutoPorPedido(
  statusPedido: StatusPedido,
  temPrioridadeCostureira: boolean
): StatusProduto | null {
  switch (statusPedido) {
    case 'agendado':
    case 'em_atendimento':
      return temPrioridadeCostureira ? 'costureira' : 'reservado';
    case 'aguardando_retirada':
      return temPrioridadeCostureira ? 'costureira' : 'reservado';
    case 'emprestado':
      return 'emprestado';
    case 'devolvido':
    case 'concluido':
    case 'cancelado':
      return 'disponivel';
    default:
      return null;
  }
}

export function calcularFaturamentoPedidos(
  pedidos: Pedido[],
  apenasPagos = false
): number {
  return pedidos.reduce((s, p) => {
    if (apenasPagos && !p.pago) return s;
    if (p.status === 'cancelado') return s;
    const base = p.valorPago ?? p.valorTotal ?? 0;
    if (p.status === 'concluido' || p.status === 'devolvido' || p.pago) {
      return s + base;
    }
    return s;
  }, 0);
}
