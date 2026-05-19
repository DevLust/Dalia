import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { calcularFaturamentoPedidos } from '../lib/produtoStatus';
import './Dashboard.css';

export default function Dashboard() {
  const { clientes, produtos, pedidos } = useData();

  const totais = useMemo(() => {
    const vendas = calcularFaturamentoPedidos(pedidos);
    const compras = pedidos.filter((p) => p.pago).length;
    const abandonados = pedidos.filter((p) => p.status === 'cancelado').length;
    const emprestados = produtos.filter((p) => p.status === 'emprestado').length;
    return {
      vendas,
      clientes: clientes.length,
      pedidos: pedidos.length,
      produtos: produtos.length,
      compras,
      abandonados,
      emprestados,
    };
  }, [clientes, produtos, pedidos]);

  const recentes = useMemo(
    () =>
      [...pedidos]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5),
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

  const badgeClass = (status: string) => {
    if (status === 'devolvido' || status === 'concluido') return 'badge-success';
    if (status === 'cancelado') return 'badge-danger';
    if (status === 'emprestado' || status === 'aguardando_retirada') return 'badge-warning';
    return 'badge-info';
  };

  const maxChart = Math.max(totais.clientes, totais.pedidos, totais.produtos, 1);

  return (
    <div className="dashboard">
      <header className="page-header">
        <h1 className="page-title">Painel</h1>
        <p className="page-desc">Visão geral do ateliê</p>
      </header>

      <section className="metric-row" aria-label="Resumos">
        <article className="metric-card">
          <span className="metric-icon">💰</span>
          <div>
            <p className="metric-label">Faturamento</p>
            <p className="metric-value">R$ {totais.vendas.toFixed(2).replace('.', ',')}</p>
          </div>
        </article>
        <article className="metric-card">
          <span className="metric-icon">👥</span>
          <div>
            <p className="metric-label">Clientes</p>
            <p className="metric-value">{totais.clientes}</p>
          </div>
        </article>
        <article className="metric-card">
          <span className="metric-icon">📋</span>
          <div>
            <p className="metric-label">Pedidos</p>
            <p className="metric-value">{totais.pedidos}</p>
          </div>
        </article>
      </section>

      <div className="dashboard-grid">
        <div className="dashboard-main">
          <article className="featured-card">
            <p className="featured-label">Total de produtos</p>
            <p className="featured-value">{totais.produtos}</p>
            <p className="featured-sub">Ativos: {totais.produtos - totais.emprestados}</p>
          </article>

          <div className="stats-row">
            <article className="card stat-mini">
              <p className="stat-mini-label">Pagamentos confirmados</p>
              <p className="stat-mini-value">{totais.compras}</p>
            </article>
            <article className="card stat-mini">
              <p className="stat-mini-label">Pedidos cancelados</p>
              <p className="stat-mini-value stat-warn">{totais.abandonados}</p>
            </article>
            <article className="card stat-mini">
              <p className="stat-mini-label">Peças emprestadas</p>
              <p className="stat-mini-value">{totais.emprestados}</p>
            </article>
          </div>

          <article className="card chart-card">
            <h2>Sumário</h2>
            <div className="mini-chart">
              {[
                { label: 'Clientes', val: totais.clientes },
                { label: 'Pedidos', val: totais.pedidos },
                { label: 'Produtos', val: totais.produtos },
              ].map(({ label, val }) => (
                <div key={label} className="chart-col">
                  <div
                    className="chart-bar-bg"
                    style={{ height: `${Math.max(12, (val / maxChart) * 100)}%` }}
                  >
                    <div
                      className="chart-bar"
                      style={{ height: `${Math.max(20, (val / maxChart) * 100)}%` }}
                    />
                  </div>
                  <span className="chart-label">{label}</span>
                </div>
              ))}
            </div>
          </article>
        </div>

        <aside className="card recent-card" aria-label="Pedidos recentes">
          <h2>Pedidos recentes</h2>
          {recentes.length === 0 ? (
            <p className="vazio">Nenhum pedido cadastrado.</p>
          ) : (
            <ul className="recent-list">
              {recentes.map((p) => (
                <li key={p.id}>
                  <div className="recent-thumb" aria-hidden="true">
                    👗
                  </div>
                  <div className="recent-info">
                    <Link to={`/pedidos?editar=${p.id}`} className="recent-title">
                      Pedido #{p.id.slice(0, 8)}
                    </Link>
                    <p className="recent-meta">
                      R$ {(p.valorTotal ?? 0).toFixed(2).replace('.', ',')}
                      {p.pago ? ' · Pago' : ' · Pendente'}
                    </p>
                  </div>
                  <span className={`badge ${badgeClass(p.status)}`}>
                    {statusLabel[p.status] ?? p.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </div>
  );
}
