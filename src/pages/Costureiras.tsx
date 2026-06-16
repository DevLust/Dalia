import { useMemo, useState } from 'react';
import { useData } from '../contexts/DataContext';
import { pedidoNaCostureira } from '../lib/produtoStatus';
import type { Pedido } from '../types';
import { formatDate } from '../lib/dates';
import './Costureiras.css';

export default function Costureiras() {
  const { pedidos, clientes, produtos, salvarPedido } = useData();
  const [filtroUrgencia, setFiltroUrgencia] = useState<'todos' | 'urgente' | 'normal'>('todos');

  const lista = useMemo(() => {
    return [...pedidos]
      .filter((p) => pedidoNaCostureira(p))
      .filter((p) => {
        if (filtroUrgencia === 'urgente') return (p.prioridadeCostureira ?? 999) <= 1;
        if (filtroUrgencia === 'normal') return (p.prioridadeCostureira ?? 999) > 1;
        return true;
      })
      .sort((a, b) => {
        const pa = a.prioridadeCostureira ?? 999;
        const pb = b.prioridadeCostureira ?? 999;
        if (pa !== pb) return pa - pb;
        return new Date(a.dataRetirada).getTime() - new Date(b.dataRetirada).getTime();
      });
  }, [pedidos, filtroUrgencia]);

  const updatePrioridade = async (pedido: Pedido, urgente: boolean) => {
    await salvarPedido({ ...pedido, prioridadeCostureira: urgente ? 1 : 2 }, pedido);
  };

  const formatMedidas = (p: Pedido) => {
    const cli = clientes.find((c) => c.id === p.clienteId);
    if (!cli?.medidas) return p.notas || '-';
    return Object.entries(cli.medidas)
      .filter(([, v]) => v != null)
      .map(([k, v]) => `${k}: ${v}cm`)
      .join(' · ');
  };

  return (
    <div className="costureiras-page">
      <header className="page-header">
        <h1 className="page-title">Costureiras</h1>
        <p className="page-desc">
          Vestidos a ajustar: prioridade, medidas do cliente e prazo de entrega.
        </p>
      </header>

      <div className="toolbar">
        <select
          value={filtroUrgencia}
          onChange={(e) => setFiltroUrgencia(e.target.value as 'todos' | 'urgente' | 'normal')}
          aria-label="Filtrar por prioridade"
        >
          <option value="todos">Todas as prioridades</option>
          <option value="urgente">Urgente</option>
          <option value="normal">Normal</option>
        </select>
      </div>

      <section className="lista-costureiras tabela-wrap" aria-label="Pedidos para costureira">
        <table className="tabela">
          <thead>
            <tr>
              <th>Prioridade</th>
              <th>Cliente</th>
              <th>Produtos</th>
              <th>Prazo entrega</th>
              <th>Medidas / Notas</th>
            </tr>
          </thead>
          <tbody>
            {lista.length === 0 ? (
              <tr>
                <td colSpan={5}>Nenhum pedido em fase de ajuste.</td>
              </tr>
            ) : (
              lista.map((p) => {
                const cli = clientes.find((c) => c.id === p.clienteId);
                const nomesProd = p.itens
                  .map((i) => produtos.find((x) => x.id === i.produtoId)?.descricao ?? i.produtoId)
                  .join(', ');
                const urgente = (p.prioridadeCostureira ?? 999) <= 1;
                return (
                  <tr key={p.id} className={urgente ? 'row-urgente' : ''}>
                    <td>
                      <select
                        value={urgente ? 'urgente' : 'normal'}
                        onChange={(e) =>
                          void updatePrioridade(p, e.target.value === 'urgente')
                        }
                        aria-label={`Prioridade do pedido ${p.id}`}
                      >
                        <option value="urgente">Urgente</option>
                        <option value="normal">Normal</option>
                      </select>
                    </td>
                    <td>{cli?.nome ?? '-'}</td>
                    <td>{nomesProd || '-'}</td>
                    <td>
                      {p.dataRetirada
                        ? formatDate(p.dataRetirada)
                        : '-'}
                    </td>
                    <td>{formatMedidas(p)}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
