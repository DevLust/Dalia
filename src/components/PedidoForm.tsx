import { useState } from 'react';
import type { FormEvent } from 'react';
import { store, generateId } from '../store';
import type {
  Pedido,
  ItemPedido,
  TipoPagamento,
  TipoPedido,
  StatusPedido,
} from '../types';
import './PedidoForm.css';

const TIPOS_PAGAMENTO: { value: TipoPagamento; label: string }[] = [
  { value: 'vista', label: 'À vista' },
  { value: 'cartao', label: 'Cartão' },
  { value: 'pix', label: 'PIX' },
];

const TIPOS_PEDIDO: { value: TipoPedido; label: string }[] = [
  { value: 'integral', label: 'Pagamento integral' },
  { value: 'metade_metade', label: 'Metade na visita, metade na retirada' },
];

const STATUS_OPCOES: StatusPedido[] = [
  'agendado',
  'em_atendimento',
  'aguardando_retirada',
  'emprestado',
  'devolvido',
  'concluido',
  'cancelado',
];

const STATUS_LABEL: Record<StatusPedido, string> = {
  agendado: 'Agendado',
  em_atendimento: 'Em atendimento',
  aguardando_retirada: 'Aguardando retirada',
  emprestado: 'Emprestado',
  devolvido: 'Devolvido',
  concluido: 'Concluído',
  cancelado: 'Cancelado',
};

export default function PedidoForm({
  pedido,
  onSalvo,
  onCancelar,
}: {
  pedido?: Pedido;
  onSalvo: () => void;
  onCancelar: () => void;
}) {
  const clientes = store.clientes;
  const produtos = store.produtos;

  const [clienteId, setClienteId] = useState(pedido?.clienteId ?? '');
  const [tipoPagamento, setTipoPagamento] = useState<TipoPagamento>(pedido?.tipoPagamento ?? 'vista');
  const [tipoPedido, setTipoPedido] = useState<TipoPedido>(pedido?.tipoPedido ?? 'integral');
  const [dataAgendamento, setDataAgendamento] = useState(
    pedido?.dataAgendamento ? pedido.dataAgendamento.slice(0, 10) : new Date().toISOString().slice(0, 10)
  );
  const [dataRetirada, setDataRetirada] = useState(
    pedido?.dataRetirada ? pedido.dataRetirada.slice(0, 10) : ''
  );
  const [dataEvento, setDataEvento] = useState(
    pedido?.dataEvento ? pedido.dataEvento.slice(0, 10) : ''
  );
  const [status, setStatus] = useState<StatusPedido>(pedido?.status ?? 'agendado');
  const [notas, setNotas] = useState(pedido?.notas ?? '');
  const [pago, setPago] = useState(pedido?.pago ?? false);
  const [prioridadeCostureira, setPrioridadeCostureira] = useState(pedido?.prioridadeCostureira?.toString() ?? '');
  const [itens, setItens] = useState<ItemPedido[]>(pedido?.itens ? [...pedido.itens] : []);
  const [buscaProduto, setBuscaProduto] = useState('');

  const produtosFiltrados = produtos.filter(
    (p) =>
      p.descricao.toLowerCase().includes(buscaProduto.toLowerCase()) ||
      p.tipo.toLowerCase().includes(buscaProduto.toLowerCase())
  );

  const addItem = (produtoId: string) => {
    const exist = itens.find((i) => i.produtoId === produtoId);
    if (exist) {
      setItens((prev) => prev.map((i) => (i.produtoId === produtoId ? { ...i, quantidade: i.quantidade + 1 } : i)));
    } else {
      setItens((prev) => [...prev, { produtoId, quantidade: 1 }]);
    }
  };

  const removeItem = (produtoId: string) => {
    setItens((prev) => prev.filter((i) => i.produtoId !== produtoId));
  };

  const setQuantidade = (produtoId: string, qtd: number) => {
    if (qtd < 1) removeItem(produtoId);
    else setItens((prev) => prev.map((i) => (i.produtoId === produtoId ? { ...i, quantidade: qtd } : i)));
  };

  const valorTotal = itens.reduce((s, item) => {
    const p = produtos.find((x) => x.id === item.produtoId);
    return s + (p?.valorAluguel ?? 0) * item.quantidade;
  }, 0);

  const handleSalvar = (e: FormEvent) => {
    e.preventDefault();
    if (!clienteId) return;
    if (itens.length === 0) {
      alert('Adicione ao menos um produto ao pedido.');
      return;
    }

    const payload: Pedido = {
      id: pedido?.id ?? generateId(),
      clienteId,
      tipoPagamento,
      tipoPedido,
      dataAgendamento: new Date(dataAgendamento).toISOString(),
      dataRetirada: dataRetirada ? new Date(dataRetirada).toISOString() : new Date().toISOString(),
      dataEvento: dataEvento ? new Date(dataEvento).toISOString() : new Date().toISOString(),
      status,
      itens,
      valorTotal,
      valorPago: pago ? valorTotal : pedido?.valorPago ?? 0,
      pago,
      notas: notas.trim() || undefined,
      prioridadeCostureira: prioridadeCostureira ? parseInt(prioridadeCostureira, 10) : undefined,
      createdAt: pedido?.createdAt ?? new Date().toISOString(),
    };

    const lista = [...store.pedidos];
    const idx = lista.findIndex((p) => p.id === payload.id);
    if (idx >= 0) lista[idx] = payload;
    else lista.push(payload);
    store.pedidos = lista;
    onSalvo();
  };

  return (
    <div className="pedido-form-card" role="dialog" aria-labelledby="form-pedido-title">
      <h2 id="form-pedido-title">{pedido ? 'Editar pedido' : 'Novo pedido'}</h2>

      <form onSubmit={handleSalvar} noValidate>
        <div className="form-row">
          <label htmlFor="pedido-cliente">Cliente *</label>
          <select
            id="pedido-cliente"
            value={clienteId}
            onChange={(e) => setClienteId(e.target.value)}
            required
            aria-required="true"
          >
            <option value="">Selecione o cliente</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
        </div>
        <div className="form-row">
          <label htmlFor="pedido-tipo-pag">Tipo de pagamento</label>
          <select
            id="pedido-tipo-pag"
            value={tipoPagamento}
            onChange={(e) => setTipoPagamento(e.target.value as TipoPagamento)}
          >
            {TIPOS_PAGAMENTO.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className="form-row">
          <label htmlFor="pedido-tipo">Tipo de pedido</label>
          <select
            id="pedido-tipo"
            value={tipoPedido}
            onChange={(e) => setTipoPedido(e.target.value as TipoPedido)}
          >
            {TIPOS_PEDIDO.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className="form-row">
          <label htmlFor="pedido-agendamento">Data agendamento (visita)</label>
          <input
            id="pedido-agendamento"
            type="date"
            value={dataAgendamento}
            onChange={(e) => setDataAgendamento(e.target.value)}
          />
        </div>
        <div className="form-row">
          <label htmlFor="pedido-prazo">Prazo entrega (data retirada)</label>
          <input
            id="pedido-prazo"
            type="date"
            value={dataRetirada}
            onChange={(e) => setDataRetirada(e.target.value)}
          />
        </div>
        <div className="form-row">
          <label htmlFor="pedido-evento">Data do evento</label>
          <input
            id="pedido-evento"
            type="date"
            value={dataEvento}
            onChange={(e) => setDataEvento(e.target.value)}
          />
        </div>
        <div className="form-row">
          <label htmlFor="pedido-status">Status</label>
          <select
            id="pedido-status"
            value={status}
            onChange={(e) => setStatus(e.target.value as StatusPedido)}
          >
            {STATUS_OPCOES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </div>
        <div className="form-row">
          <label htmlFor="pedido-notas">Notas</label>
          <textarea
            id="pedido-notas"
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            rows={2}
          />
        </div>
        <div className="form-row checkbox-row">
          <input
            id="pedido-pago"
            type="checkbox"
            checked={pago}
            onChange={(e) => setPago(e.target.checked)}
          />
          <label htmlFor="pedido-pago">Pagamento realizado</label>
        </div>
        <div className="form-row">
          <label htmlFor="pedido-prioridade">Prioridade costureira (1 = maior)</label>
          <input
            id="pedido-prioridade"
            type="number"
            min={1}
            value={prioridadeCostureira}
            onChange={(e) => setPrioridadeCostureira(e.target.value)}
          />
        </div>

        <fieldset className="itens-fieldset">
          <legend>Produtos do pedido</legend>
          <div className="busca-produto">
            <input
              type="search"
              placeholder="Pesquisar produtos no acervo"
              value={buscaProduto}
              onChange={(e) => setBuscaProduto(e.target.value)}
              aria-label="Pesquisar produtos"
            />
          </div>
          <ul className="lista-itens">
            {itens.map((item) => {
              const p = produtos.find((x) => x.id === item.produtoId);
              return (
                <li key={item.produtoId}>
                  <span>{p?.descricao ?? item.produtoId}</span>
                  <div className="qtd-control">
                    <button type="button" onClick={() => setQuantidade(item.produtoId, item.quantidade - 1)} aria-label="Diminuir quantidade">−</button>
                    <span>{item.quantidade}</span>
                    <button type="button" onClick={() => setQuantidade(item.produtoId, item.quantidade + 1)} aria-label="Aumentar quantidade">+</button>
                  </div>
                  <button type="button" className="btn-remove" onClick={() => removeItem(item.produtoId)}>Remover</button>
                </li>
              );
            })}
          </ul>
          <div className="add-produtos">
            {produtosFiltrados.slice(0, 8).map((p) => (
              <button
                key={p.id}
                type="button"
                className="btn-add-prod"
                onClick={() => addItem(p.id)}
              >
                + {p.descricao}
              </button>
            ))}
          </div>
          <p className="valor-total">Valor total: R$ {valorTotal.toFixed(2).replace('.', ',')}</p>
        </fieldset>

        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={onCancelar}>
            Cancelar
          </button>
          <button type="submit" className="btn-primary">
            Salvar
          </button>
        </div>
      </form>
    </div>
  );
}
