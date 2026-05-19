import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import type { StatusPedido, TipoPagamento } from '../types';
import PedidoForm from '../components/PedidoForm';
import DateInput from '../components/DateInput';
import { formatDate } from '../lib/dates';
import './Pedidos.css';

const STATUS_LABEL: Record<StatusPedido, string> = {
  agendado: 'Agendado',
  em_atendimento: 'Em atendimento',
  aguardando_retirada: 'Aguardando retirada',
  emprestado: 'Emprestado',
  devolvido: 'Devolvido',
  concluido: 'Concluído',
  cancelado: 'Cancelado',
};

export default function Pedidos() {
  const { pedidos, clientes, excluirPedido } = useData();
  const [searchParams, setSearchParams] = useSearchParams();
  const editarId = searchParams.get('editar');
  const [filtro, setFiltro] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<StatusPedido | ''>('');
  const [filtroPagamento, setFiltroPagamento] = useState<'todos' | 'pago' | 'pendente'>('todos');
  const [filtroTipoPag, setFiltroTipoPag] = useState<TipoPagamento | ''>('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [novo, setNovo] = useState(false);

  const clearEditarNaUrl = () => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('editar');
      return next;
    });
  };

  const filtrados = pedidos.filter((p) => {
    const cli = clientes.find((c) => c.id === p.clienteId);
    const nome = cli?.nome ?? '';
    const matchText = nome.toLowerCase().includes(filtro.toLowerCase());
    const matchStatus = !filtroStatus || p.status === filtroStatus;
    const matchPag =
      filtroPagamento === 'todos' ||
      (filtroPagamento === 'pago' && p.pago) ||
      (filtroPagamento === 'pendente' && !p.pago);
    const matchTipoPag = !filtroTipoPag || p.tipoPagamento === filtroTipoPag;
    const retirada = p.dataRetirada.slice(0, 10);
    const matchInicio = !dataInicio || retirada >= dataInicio;
    const matchFim = !dataFim || retirada <= dataFim;
    return matchText && matchStatus && matchPag && matchTipoPag && matchInicio && matchFim;
  });

  const handleExcluir = async (id: string) => {
    if (confirm('Excluir este pedido?')) {
      await excluirPedido(id);
      if (editarId === id) clearEditarNaUrl();
    }
  };

  const pedidoEmEdicao = editarId ? pedidos.find((p) => p.id === editarId) : null;

  return (
    <div className="pedidos-page">
      <header className="page-header">
        <h1 className="page-title">Pedidos</h1>
        <p className="page-desc">Gestão de pedidos e retiradas</p>
      </header>

      <div className="toolbar">
        <input
          type="search"
          placeholder="Pesquisar por cliente"
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          className="filtro-input"
          aria-label="Filtrar pedidos por cliente"
        />
        <select
          value={filtroStatus}
          onChange={(e) => setFiltroStatus((e.target.value || '') as StatusPedido | '')}
          aria-label="Filtrar por status"
        >
          <option value="">Todos os status</option>
          {(Object.keys(STATUS_LABEL) as StatusPedido[]).map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>
        <select
          value={filtroPagamento}
          onChange={(e) => setFiltroPagamento(e.target.value as 'todos' | 'pago' | 'pendente')}
          aria-label="Filtrar por pagamento"
        >
          <option value="todos">Pagamento: todos</option>
          <option value="pago">Pagos</option>
          <option value="pendente">Pendentes</option>
        </select>
        <select
          value={filtroTipoPag}
          onChange={(e) => setFiltroTipoPag((e.target.value || '') as TipoPagamento | '')}
          aria-label="Filtrar por forma de pagamento"
        >
          <option value="">Forma: todas</option>
          <option value="pix">PIX</option>
          <option value="cartao">Cartão</option>
          <option value="vista">À vista</option>
        </select>
        <DateInput
          value={dataInicio}
          onChange={setDataInicio}
          aria-label="Retirada a partir de"
        />
        <DateInput value={dataFim} onChange={setDataFim} aria-label="Retirada até" />
        <button
          type="button"
          className="btn-primary"
          onClick={() => {
            setNovo(true);
            clearEditarNaUrl();
          }}
        >
          Novo pedido
        </button>
      </div>

      {(novo || pedidoEmEdicao) && (
        <div className="form-overlay">
          <PedidoForm
            pedido={pedidoEmEdicao ?? undefined}
            onSalvo={() => {
              setNovo(false);
              clearEditarNaUrl();
            }}
            onCancelar={() => {
              setNovo(false);
              clearEditarNaUrl();
            }}
          />
        </div>
      )}

      <section className="tabela-wrap" aria-label="Lista de pedidos">
        <table className="tabela">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Data retirada</th>
              <th>Data evento</th>
              <th>Status</th>
              <th>Pagamento</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.length === 0 ? (
              <tr>
                <td colSpan={6}>Nenhum pedido encontrado.</td>
              </tr>
            ) : (
              filtrados.map((p) => {
                const cli = clientes.find((c) => c.id === p.clienteId);
                return (
                  <tr key={p.id}>
                    <td>{cli?.nome ?? '-'}</td>
                    <td>{formatDate(p.dataRetirada)}</td>
                    <td>{formatDate(p.dataEvento)}</td>
                    <td>
                      <span className={`badge status-${p.status}`}>{STATUS_LABEL[p.status]}</span>
                    </td>
                    <td>
                      {p.pago ? `Pago (${p.tipoPagamento})` : 'Pendente'}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn-sm"
                        onClick={() => {
                          setNovo(false);
                          setSearchParams((prev) => {
                            const next = new URLSearchParams(prev);
                            next.set('editar', p.id);
                            return next;
                          });
                        }}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        className="btn-sm"
                        onClick={() => window.open(`/promissoria/${p.id}`, '_blank')}
                      >
                        Promissória
                      </button>
                      <button type="button" className="btn-sm danger" onClick={() => void handleExcluir(p.id)}>
                        Excluir
                      </button>
                    </td>
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
