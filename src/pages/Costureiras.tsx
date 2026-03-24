import { useState, useEffect } from 'react';
import { store } from '../store';
import type { Pedido } from '../types';
import './Costureiras.css';

export default function Costureiras() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);

  useEffect(() => {
    setPedidos(
      store.pedidos.filter(
        (p) =>
          p.status === 'em_atendimento' ||
          p.status === 'aguardando_retirada' ||
          (p.itens?.length && p.dataRetirada)
      )
    );
  }, []);

  const clientes = store.clientes;
  const produtos = store.produtos;

  const lista = [...pedidos]
    .filter((p) => p.dataRetirada)
    .sort((a, b) => {
      const pa = a.prioridadeCostureira ?? 999;
      const pb = b.prioridadeCostureira ?? 999;
      if (pa !== pb) return pa - pb;
      return new Date(a.dataRetirada).getTime() - new Date(b.dataRetirada).getTime();
    });

  const updatePrioridade = (pedidoId: string, prioridade: number) => {
    const novaLista = store.pedidos.map((p) =>
      p.id === pedidoId ? { ...p, prioridadeCostureira: prioridade } : p
    );
    store.pedidos = novaLista;
    setPedidos([...novaLista]);
  };

  return (
    <div className="costureiras-page">
      <h1 className="page-title">Costureiras</h1>
      <p className="page-desc">
        Lista de vestidos a ajustar: prioridade, medidas e prazo de entrega. Altere a ordem de prioridade conforme necessário.
      </p>

      <section className="lista-costureiras" aria-label="Pedidos para costureira">
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
              lista.map((p, idx) => {
                const cli = clientes.find((c) => c.id === p.clienteId);
                const nomesProd = (p.itens ?? [])
                  .map((i) => produtos.find((x) => x.id === i.produtoId)?.descricao ?? i.produtoId)
                  .join(', ');
                return (
                  <tr key={p.id}>
                    <td>
                      <input
                        type="number"
                        min={1}
                        value={p.prioridadeCostureira ?? idx + 1}
                        onChange={(e) =>
                          updatePrioridade(p.id, parseInt(e.target.value, 10) || 1)
                        }
                        className="input-prioridade"
                        aria-label={`Prioridade do pedido ${p.id}`}
                      />
                    </td>
                    <td>{cli?.nome ?? '-'}</td>
                    <td>{nomesProd || '-'}</td>
                    <td>{p.dataRetirada ? new Date(p.dataRetirada).toLocaleDateString('pt-BR') : '-'}</td>
                    <td>{p.notas || (cli?.medidas ? `Medidas: ${JSON.stringify(cli.medidas)}` : '-')}</td>
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
