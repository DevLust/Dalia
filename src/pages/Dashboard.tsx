import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { store } from '../store';
import './Dashboard.css';

export default function Dashboard() {
  const { clientes, produtos, pedidos } = store;

  const totais = useMemo(() => {
    const vendas = pedidos
      .filter((p) => p.status === 'concluido' || p.status === 'devolvido')
      .reduce((s, p) => s + (p.valorPago ?? p.valorTotal ?? 0), 0);
    const compras = pedidos.filter((p) => p.pago).length;
    const abandonados = pedidos.filter((p) => p.status === 'cancelado').length;
    return {
      vendas,
      clientes: clientes.length,
      pedidos: pedidos.length,
      produtos: produtos.length,
      compras,
      abandonados,
    };
  }, [clientes.length, produtos.length, pedidos]);

  const recentes = useMemo(
    () => [...pedidos].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5),
    [pedidos]
  );

  const statusLabel: Record<string, string> = {
    agendado: 'Agendado',
    em_atendimento: 'Em atendimento',
    aguardando_retirada: 'Aguardando retirada',
    emprestado: 'Emprestado',
    devolvido: 'Devolvido',
    concluido: 'Concluído',
    cancelado: 'Cancelado',
  };

  return (
    <div className="dashboard">
      <h1 className="page-title">Painel</h1>

      <section className="resumos" aria-label="Resumos do negócio">
        <div className="card resumo">
          <h2>Vendas totais</h2>
          <p className="valor">R$ {totais.vendas.toFixed(2).replace('.', ',')}</p>
        </div>
        <div className="card resumo">
          <h2>Clientes</h2>
          <p className="valor">{totais.clientes}</p>
        </div>
        <div className="card resumo">
          <h2>Pedidos</h2>
          <p className="valor">{totais.pedidos}</p>
        </div>
        <div className="card resumo">
          <h2>Produtos</h2>
          <p className="valor">{totais.produtos}</p>
        </div>
      </section>

      <section className="card compras-resumo" aria-label="Resumo de compras">
        <h2>Resumo de compras</h2>
        <p>Pedidos concluídos (pagamentos): {totais.compras}</p>
        <p>Pedidos cancelados: {totais.abandonados}</p>
      </section>

      <section className="card grafico-placeholder" aria-label="Gráfico por categoria">
        <h2>Dados por categoria</h2>
        <div className="mini-chart">
          <div className="barra" style={{ height: `${Math.min(100, (totais.clientes / 20) * 100)}%` }} title="Clientes">
            Clientes
          </div>
          <div className="barra" style={{ height: `${Math.min(100, (totais.pedidos / 20) * 100)}%` }} title="Pedidos">
            Pedidos
          </div>
          <div className="barra" style={{ height: `${Math.min(100, (totais.produtos / 20) * 100)}%` }} title="Produtos">
            Produtos
          </div>
        </div>
      </section>

      <section className="card pedidos-recentes" aria-label="Pedidos recentes">
        <h2>Pedidos recentes</h2>
        {recentes.length === 0 ? (
          <p className="vazio">Nenhum pedido cadastrado.</p>
        ) : (
          <ul>
            {recentes.map((p) => (
              <li key={p.id}>
                <Link to={`/pedidos?editar=${p.id}`}>
                  Pedido #{p.id.slice(0, 8)} – {statusLabel[p.status] ?? p.status}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
