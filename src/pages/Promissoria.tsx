import { useParams } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { formatDate } from '../lib/dates';
import './Promissoria.css';

export default function Promissoria() {
  const { id } = useParams<{ id: string }>();
  const { pedidos, clientes, produtos, empresa } = useData();
  const pedido = pedidos.find((p) => p.id === id);
  const cliente = pedido ? clientes.find((c) => c.id === pedido.clienteId) : null;

  if (!pedido || !cliente) {
    return (
      <div className="promissoria-page">
        <p>Pedido não encontrado.</p>
      </div>
    );
  }

  const valorTotal = pedido.valorTotal ?? 0;
  const valorCalcao = (pedido.itens ?? []).reduce((s, i) => {
    const p = produtos.find((x) => x.id === i.produtoId);
    return s + (p?.valorCalcao ?? 0) * i.quantidade;
  }, 0);

  const formatCPF = (v: string) => {
    const d = v.replace(/\D/g, '');
    if (d.length < 11) return v;
    return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
  };

  return (
    <div className="promissoria-page" role="document">
      <div className="promissoria-doc">
        <img
          src="/logo.jpeg"
          alt="Dália Ateliê de Noivas"
          className="promissoria-logo"
        />
        <h1>PROMISSÓRIA</h1>
        <p className="empresa">{empresa.nomeEmpresa}</p>
        <p className="endereco-empresa">{empresa.enderecoEmpresa}</p>

        <p className="intro">
          Pelo presente documento, o(a) contratado(a) declara ter ciência das condições de aluguel e se
          compromete a devolver o(s) item(ns) no prazo e estado combinados, sob pena de cobrança do valor
          do calção em caso de danos.
        </p>

        <table className="dados-tabela">
          <tbody>
            <tr>
              <th>Nome</th>
              <td>{cliente.nome}</td>
            </tr>
            <tr>
              <th>CPF</th>
              <td>{formatCPF(cliente.cpf)}</td>
            </tr>
            <tr>
              <th>Endereço</th>
              <td>{cliente.endereco}</td>
            </tr>
            <tr>
              <th>Telefone</th>
              <td>{cliente.telefone}</td>
            </tr>
            <tr>
              <th>Data retirada (prevista)</th>
              <td>{formatDate(pedido.dataRetirada)}</td>
            </tr>
            <tr>
              <th>Data do evento</th>
              <td>{formatDate(pedido.dataEvento)}</td>
            </tr>
            <tr>
              <th>Data devolução</th>
              <td>{pedido.dataDevolucao ? formatDate(pedido.dataDevolucao) : '-'}</td>
            </tr>
            <tr>
              <th>Valor do aluguel</th>
              <td>R$ {valorTotal.toFixed(2).replace('.', ',')}</td>
            </tr>
            <tr>
              <th>Valor do calção (em caso de dano)</th>
              <td>R$ {valorCalcao.toFixed(2).replace('.', ',')}</td>
            </tr>
            <tr>
              <th>Forma de pagamento</th>
              <td>{pedido.tipoPagamento.toUpperCase()}</td>
            </tr>
            <tr>
              <th>Status pagamento</th>
              <td>{pedido.pago ? 'Quitado' : 'Pendente'}</td>
            </tr>
          </tbody>
        </table>

        <p className="assinatura">
          _________________________________________
          <br />
          Assinatura do(a) contratado(a)
        </p>
        <p className="data-doc">Em {formatDate(new Date())}</p>
      </div>
      <button type="button" className="btn-print" onClick={() => window.print()}>
        Imprimir / Salvar PDF
      </button>
    </div>
  );
}
