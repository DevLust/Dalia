import { useState, useMemo } from 'react';
import { store } from '../store';
import './Relatorios.css';

type Agrupamento = 'cliente' | 'pedido' | 'produto' | 'vendas';

export default function Relatorios() {
  const [agrupamento, setAgrupamento] = useState<Agrupamento>('pedido');
  const [filtroDataInicio, setFiltroDataInicio] = useState('');
  const [filtroDataFim, setFiltroDataFim] = useState('');

  const { clientes, pedidos, produtos } = store;

  const dadosFiltrados = useMemo(() => {
    let lista = [...pedidos];
    if (filtroDataInicio) {
      lista = lista.filter((p) => p.createdAt >= filtroDataInicio);
    }
    if (filtroDataFim) {
      lista = lista.filter((p) => p.createdAt <= filtroDataFim + 'T23:59:59');
    }
    return lista;
  }, [pedidos, filtroDataInicio, filtroDataFim]);

  const relatorio = useMemo(() => {
    if (agrupamento === 'cliente') {
      const porCliente = new Map<string, { nome: string; total: number; qtd: number }>();
      dadosFiltrados.forEach((p) => {
        const cli = clientes.find((c) => c.id === p.clienteId);
        const nome = cli?.nome ?? p.clienteId;
        const prev = porCliente.get(p.clienteId) ?? { nome, total: 0, qtd: 0 };
        prev.total += p.valorPago ?? p.valorTotal ?? 0;
        prev.qtd += 1;
        porCliente.set(p.clienteId, prev);
      });
      return Array.from(porCliente.entries()).map(([id, v]) => ({ id, ...v }));
    }
    if (agrupamento === 'vendas') {
      const total = dadosFiltrados.reduce((s, p) => s + (p.valorPago ?? p.valorTotal ?? 0), 0);
      const pagos = dadosFiltrados.filter((p) => p.pago).length;
      return [{ total, quantidade: dadosFiltrados.length, pagos }];
    }
    if (agrupamento === 'produto') {
      const porProd = new Map<string, { descricao: string; qtd: number }>();
      dadosFiltrados.forEach((p) => {
        (p.itens ?? []).forEach((i) => {
          const prod = produtos.find((x) => x.id === i.produtoId);
          const desc = prod?.descricao ?? i.produtoId;
          const prev = porProd.get(i.produtoId) ?? { descricao: desc, qtd: 0 };
          prev.qtd += i.quantidade;
          porProd.set(i.produtoId, prev);
        });
      });
      return Array.from(porProd.entries()).map(([id, v]) => ({ id, ...v }));
    }
    return dadosFiltrados.map((p) => {
      const cli = clientes.find((c) => c.id === p.clienteId);
      return {
        id: p.id,
        cliente: cli?.nome ?? '-',
        data: p.createdAt,
        valor: p.valorTotal ?? 0,
        status: p.status,
      };
    });
  }, [agrupamento, dadosFiltrados, clientes, produtos]);

  return (
    <div className="relatorios-page">
      <h1 className="page-title">Relatórios</h1>
      <p className="page-desc">
        Relatório por agrupamento, com filtros para personalizar os dados.
      </p>

      <div className="filtros">
        <div className="form-row">
          <label htmlFor="rel-agrupamento">Agrupar por</label>
          <select
            id="rel-agrupamento"
            value={agrupamento}
            onChange={(e) => setAgrupamento(e.target.value as Agrupamento)}
          >
            <option value="pedido">Pedido</option>
            <option value="cliente">Cliente</option>
            <option value="produto">Produto</option>
            <option value="vendas">Vendas (resumo)</option>
          </select>
        </div>
        <div className="form-row">
          <label htmlFor="rel-inicio">Data início</label>
          <input
            id="rel-inicio"
            type="date"
            value={filtroDataInicio}
            onChange={(e) => setFiltroDataInicio(e.target.value)}
          />
        </div>
        <div className="form-row">
          <label htmlFor="rel-fim">Data fim</label>
          <input
            id="rel-fim"
            type="date"
            value={filtroDataFim}
            onChange={(e) => setFiltroDataFim(e.target.value)}
          />
        </div>
      </div>

      <section className="relatorio-resultado" aria-label="Resultado do relatório">
        <table className="tabela">
          <thead>
            <tr>
              {agrupamento === 'vendas' && (
                <>
                  <th>Total (R$)</th>
                  <th>Quantidade pedidos</th>
                  <th>Pagamentos realizados</th>
                </>
              )}
              {agrupamento === 'cliente' && (
                <>
                  <th>Cliente</th>
                  <th>Total (R$)</th>
                  <th>Qtd pedidos</th>
                </>
              )}
              {agrupamento === 'produto' && (
                <>
                  <th>Produto</th>
                  <th>Quantidade alugada</th>
                </>
              )}
              {agrupamento === 'pedido' && (
                <>
                  <th>Pedido</th>
                  <th>Cliente</th>
                  <th>Data</th>
                  <th>Valor</th>
                  <th>Status</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {Array.isArray(relatorio) && relatorio.length === 0 ? (
              <tr>
                <td colSpan={5}>Nenhum dado no período.</td>
              </tr>
            ) : agrupamento === 'vendas' ? (
              (relatorio as { total: number; quantidade: number; pagos: number }[]).map((r, i) => (
                <tr key={i}>
                  <td>R$ {r.total.toFixed(2).replace('.', ',')}</td>
                  <td>{r.quantidade}</td>
                  <td>{r.pagos}</td>
                </tr>
              ))
            ) : agrupamento === 'cliente' ? (
              (relatorio as { id: string; nome: string; total: number; qtd: number }[]).map((r) => (
                <tr key={r.id}>
                  <td>{r.nome}</td>
                  <td>R$ {r.total.toFixed(2).replace('.', ',')}</td>
                  <td>{r.qtd}</td>
                </tr>
              ))
            ) : agrupamento === 'produto' ? (
              (relatorio as { id: string; descricao: string; qtd: number }[]).map((r) => (
                <tr key={r.id}>
                  <td>{r.descricao}</td>
                  <td>{r.qtd}</td>
                </tr>
              ))
            ) : (
              (relatorio as { id: string; cliente: string; data: string; valor: number; status: string }[]).map((r) => (
                <tr key={r.id}>
                  <td>#{r.id.slice(0, 8)}</td>
                  <td>{r.cliente}</td>
                  <td>{new Date(r.data).toLocaleDateString('pt-BR')}</td>
                  <td>R$ {r.valor.toFixed(2).replace('.', ',')}</td>
                  <td>{r.status}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
