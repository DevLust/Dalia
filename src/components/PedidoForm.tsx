import { useState } from 'react';
import type { FormEvent } from 'react';
import { generateId } from '../store';
import { todayIso } from '../lib/dates';
import DateInput from './DateInput';
import { useData } from '../contexts/DataContext';
import { podeAlugar } from '../lib/produtoStatus';
import type {
  Pedido,
  ItemPedido,
  TipoPagamento,
  TipoPedido,
  StatusPedido,
} from '../types';
import './forms.css';

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
  const { clientes, produtos, salvarPedido } = useData();

  const [clienteId, setClienteId] = useState(pedido?.clienteId ?? '');
  const [tipoPagamento, setTipoPagamento] = useState<TipoPagamento>(pedido?.tipoPagamento ?? 'vista');
  const [tipoPedido, setTipoPedido] = useState<TipoPedido>(pedido?.tipoPedido ?? 'integral');
  const [dataAgendamento, setDataAgendamento] = useState(
    pedido?.dataAgendamento ? pedido.dataAgendamento.slice(0, 10) : todayIso()
  );
  const [dataRetirada, setDataRetirada] = useState(
    pedido?.dataRetirada ? pedido.dataRetirada.slice(0, 10) : ''
  );
  const [dataEvento, setDataEvento] = useState(
    pedido?.dataEvento ? pedido.dataEvento.slice(0, 10) : ''
  );
  const [dataDevolucao, setDataDevolucao] = useState(
    pedido?.dataDevolucao ? pedido.dataDevolucao.slice(0, 10) : ''
  );
  const [status, setStatus] = useState<StatusPedido>(pedido?.status ?? 'agendado');
  const [notas, setNotas] = useState(pedido?.notas ?? '');
  const [pago, setPago] = useState(pedido?.pago ?? false);
  const [prioridadeUrgente, setPrioridadeUrgente] = useState(
    pedido?.prioridadeCostureira != null && pedido.prioridadeCostureira <= 1
  );
  const [itens, setItens] = useState<ItemPedido[]>(pedido?.itens ? [...pedido.itens] : []);
  const [buscaProduto, setBuscaProduto] = useState('');
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  const produtosFiltrados = produtos.filter(
    (p) =>
      (p.descricao.toLowerCase().includes(buscaProduto.toLowerCase()) ||
        p.tipo.toLowerCase().includes(buscaProduto.toLowerCase())) &&
      podeAlugar(p)
  );

  const addItem = (produtoId: string) => {
    const prod = produtos.find((p) => p.id === produtoId);
    if (!prod || !podeAlugar(prod)) {
      setErro('Produto indisponível ou fora de estoque.');
      return;
    }
    setErro('');
    const exist = itens.find((i) => i.produtoId === produtoId);
    if (exist) {
      if (!podeAlugar(prod, exist.quantidade + 1)) {
        setErro('Quantidade solicitada excede o estoque.');
        return;
      }
      setItens((prev) =>
        prev.map((i) =>
          i.produtoId === produtoId ? { ...i, quantidade: i.quantidade + 1 } : i
        )
      );
    } else {
      setItens((prev) => [...prev, { produtoId, quantidade: 1 }]);
    }
  };

  const removeItem = (produtoId: string) => {
    setItens((prev) => prev.filter((i) => i.produtoId !== produtoId));
  };

  const setQuantidade = (produtoId: string, qtd: number) => {
    const prod = produtos.find((p) => p.id === produtoId);
    if (qtd < 1) removeItem(produtoId);
    else if (prod && podeAlugar(prod, qtd)) {
      setItens((prev) =>
        prev.map((i) => (i.produtoId === produtoId ? { ...i, quantidade: qtd } : i))
      );
    } else setErro('Quantidade indisponível em estoque.');
  };

  const valorTotal = itens.reduce((s, item) => {
    const p = produtos.find((x) => x.id === item.produtoId);
    return s + (p?.valorAluguel ?? 0) * item.quantidade;
  }, 0);

  const valorPagoCalculado = () => {
    if (pago) return valorTotal;
    if (tipoPedido === 'metade_metade') return Math.round((valorTotal / 2) * 100) / 100;
    return pedido?.valorPago ?? 0;
  };

  const handleSalvar = async (e: FormEvent) => {
    e.preventDefault();
    setErro('');
    if (!clienteId) {
      setErro('Selecione um cliente.');
      return;
    }
    if (itens.length === 0) {
      setErro('Adicione ao menos um produto ao pedido.');
      return;
    }

    const payload: Pedido = {
      id: pedido?.id ?? generateId(),
      clienteId,
      tipoPagamento,
      tipoPedido,
      dataAgendamento: dataAgendamento,
      dataRetirada: dataRetirada || todayIso(),
      dataEvento: dataEvento || todayIso(),
      dataDevolucao: dataDevolucao || undefined,
      status,
      itens,
      valorTotal,
      valorPago: valorPagoCalculado(),
      pago,
      notas: notas.trim() || undefined,
      prioridadeCostureira: prioridadeUrgente ? 1 : 2,
      createdAt: pedido?.createdAt ?? new Date().toISOString(),
    };

    setSalvando(true);
    try {
      await salvarPedido(payload, pedido);
      onSalvo();
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não foi possível salvar o pedido.');
    } finally {
      setSalvando(false);
    }
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
          <DateInput
            id="pedido-agendamento"
            value={dataAgendamento}
            onChange={setDataAgendamento}
          />
        </div>
        <div className="form-row">
          <label htmlFor="pedido-prazo">Prazo entrega (data retirada)</label>
          <DateInput id="pedido-prazo" value={dataRetirada} onChange={setDataRetirada} />
        </div>
        <div className="form-row">
          <label htmlFor="pedido-evento">Data do evento</label>
          <DateInput id="pedido-evento" value={dataEvento} onChange={setDataEvento} />
        </div>
        <div className="form-row">
          <label htmlFor="pedido-devolucao">Data devolução</label>
          <DateInput id="pedido-devolucao" value={dataDevolucao} onChange={setDataDevolucao} />
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
          <label htmlFor="pedido-pago">Pagamento realizado (PIX, cartão ou à vista)</label>
        </div>
        <div className="form-row checkbox-row">
          <input
            id="pedido-urgente"
            type="checkbox"
            checked={prioridadeUrgente}
            onChange={(e) => setPrioridadeUrgente(e.target.checked)}
          />
          <label htmlFor="pedido-urgente">Prioridade urgente (costureira)</label>
        </div>

        <fieldset className="itens-fieldset">
          <legend>Produtos do pedido</legend>
          <div className="busca-produto">
            <input
              type="search"
              placeholder="Pesquisar produtos disponíveis"
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
                    <button
                      type="button"
                      onClick={() => setQuantidade(item.produtoId, item.quantidade - 1)}
                      aria-label="Diminuir quantidade"
                    >
                      −
                    </button>
                    <span>{item.quantidade}</span>
                    <button
                      type="button"
                      onClick={() => setQuantidade(item.produtoId, item.quantidade + 1)}
                      aria-label="Aumentar quantidade"
                    >
                      +
                    </button>
                  </div>
                  <button type="button" className="btn-remove" onClick={() => removeItem(item.produtoId)}>
                    Remover
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="add-produtos">
            {produtosFiltrados.slice(0, 8).map((p) => (
              <button key={p.id} type="button" className="btn-add-prod" onClick={() => addItem(p.id)}>
                + {p.descricao} ({p.quantidade} un.)
              </button>
            ))}
          </div>
          <p className="valor-total">
            Valor total: R$ {valorTotal.toFixed(2).replace('.', ',')} — Pago: R{' '}
            {valorPagoCalculado().toFixed(2).replace('.', ',')}
          </p>
        </fieldset>

        {erro && <p className="form-erro" role="alert">{erro}</p>}

        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={onCancelar} disabled={salvando}>
            Cancelar
          </button>
          <button type="submit" className="btn-primary" disabled={salvando}>
            {salvando ? 'Salvando…' : 'Salvar'}
          </button>
        </div>
      </form>
    </div>
  );
}
