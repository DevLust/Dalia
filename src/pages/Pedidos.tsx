import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { store } from '../store';
import type { Pedido, StatusPedido } from '../types';
import PedidoForm from '../components/PedidoForm';
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
  const [searchParams] = useSearchParams();
  const editarIdParam = searchParams.get('editar');
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [filtro, setFiltro] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<StatusPedido | ''>('');
  const [editarId, setEditarId] = useState<string | null>(editarIdParam || null);
  const [novo, setNovo] = useState(false);

  useEffect(() => {
    setPedidos(store.pedidos);
  }, []);

  useEffect(() => {
    if (editarIdParam) setEditarId(editarIdParam);
  }, [editarIdParam]);

  const clientes = store.clientes;
  const filtrados = pedidos.filter((p) => {
    const cli = clientes.find((c) => c.id === p.clienteId);
    const nome = cli?.nome ?? '';
    const matchText = nome.toLowerCase().includes(filtro.toLowerCase());
    const matchStatus = !filtroStatus || p.status === filtroStatus;
    return matchText && matchStatus;
  });

  const refresh = () => setPedidos([...store.pedidos]);

  const handleExcluir = (id: string) => {
    if (confirm('Excluir este pedido?')) {
      store.pedidos = store.pedidos.filter((p) => p.id !== id);
      refresh();
      if (editarId === id) setEditarId(null);
    }
  };

  const pedidoEmEdicao = editarId ? pedidos.find((p) => p.id === editarId) : null;

  return (
    <div className="pedidos-page">
      <h1 className="page-title">Pedidos</h1>

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
        <button type="button" className="btn-primary" onClick={() => { setNovo(true); setEditarId(null); }}>
          Novo pedido
        </button>
      </div>

      {(novo || pedidoEmEdicao) && (
        <div className="form-overlay">
          <PedidoForm
            pedido={pedidoEmEdicao ?? undefined}
            onSalvo={() => {
              refresh();
              setNovo(false);
              setEditarId(null);
            }}
            onCancelar={() => {
              setNovo(false);
              setEditarId(null);
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
                    <td>{new Date(p.dataRetirada).toLocaleDateString('pt-BR')}</td>
                    <td>{new Date(p.dataEvento).toLocaleDateString('pt-BR')}</td>
                    <td><span className={`badge status-${p.status}`}>{STATUS_LABEL[p.status]}</span></td>
                    <td>{p.pago ? 'Pago' : 'Pendente'}</td>
                    <td>
                      <button type="button" className="btn-sm" onClick={() => { setEditarId(p.id); setNovo(false); }}>
                        Editar
                      </button>
                      <button type="button" className="btn-sm" onClick={() => window.open(`/promissoria/${p.id}`, '_blank')}>
                        Promissória
                      </button>
                      <button type="button" className="btn-sm danger" onClick={() => handleExcluir(p.id)}>
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
