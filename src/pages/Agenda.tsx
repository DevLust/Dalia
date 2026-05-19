import { useState } from 'react';
import { generateId } from '../store';
import { useData } from '../contexts/DataContext';
import type { AgendaSlot } from '../types';
import DateInput from '../components/DateInput';
import { formatDate, todayIso } from '../lib/dates';
import './Agenda.css';

const HORAS = ['08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00', '18:00'];

export default function Agenda() {
  const { agenda, clientes, pedidos, salvarSlotAgenda, removerSlotAgenda } = useData();
  const [dataSelecionada, setDataSelecionada] = useState(() =>
    todayIso()
  );

  const slotsDoDia = agenda.filter((s) => s.data === dataSelecionada);
  const getSlot = (hora: string) => slotsDoDia.find((s) => s.hora === hora);

  const toggleSlot = async (hora: string) => {
    const exist = getSlot(hora);
    if (exist) await removerSlotAgenda(exist.id);
    else {
      const slot: AgendaSlot = {
        id: generateId(),
        data: dataSelecionada,
        hora,
        ocupado: false,
      };
      await salvarSlotAgenda(slot);
    }
  };

  const atualizarSlot = async (slot: AgendaSlot, patch: Partial<AgendaSlot>) => {
    await salvarSlotAgenda({ ...slot, ...patch });
  };

  return (
    <div className="agenda-page">
      <header className="page-header">
        <h1 className="page-title">Agenda</h1>
        <p className="page-desc">
          Marque visitas, vincule clientes e acompanhe retirada e devolução das vestimentas.
        </p>
      </header>

      <div className="agenda-toolbar">
        <label htmlFor="agenda-data">Data</label>
        <DateInput
          id="agenda-data"
          value={dataSelecionada}
          onChange={setDataSelecionada}
        />
      </div>

      <section className="agenda-grid" aria-label="Horários do dia">
        <h2>
          Horários –{' '}
          {new Date(dataSelecionada + 'T12:00').toLocaleDateString('pt-BR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
          })}
        </h2>
        <div className="slots">
          {HORAS.map((hora) => {
            const slot = getSlot(hora);
            const cliente = slot?.clienteId
              ? clientes.find((c) => c.id === slot.clienteId)
              : null;
            const pedido = slot?.pedidoId
              ? pedidos.find((p) => p.id === slot.pedidoId)
              : null;
            return (
              <div key={hora} className={`slot ${slot?.ocupado ? 'ocupado' : ''}`}>
                <span className="hora">{hora}</span>
                {slot ? (
                  <>
                    <span className="info">
                      {slot.ocupado
                        ? cliente?.nome ?? 'Reservado'
                        : 'Disponível'}
                    </span>
                    {pedido && (
                      <span className="info-sub">
                        Retirada: {formatDate(pedido.dataRetirada)}
                        {pedido.dataDevolucao && ` · Devolução: ${formatDate(pedido.dataDevolucao)}`}
                      </span>
                    )}
                    <select
                      value={slot.clienteId ?? ''}
                      onChange={(e) =>
                        void atualizarSlot(slot, { clienteId: e.target.value || undefined })
                      }
                      aria-label="Cliente do horário"
                    >
                      <option value="">Cliente (opcional)</option>
                      {clientes.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nome}
                        </option>
                      ))}
                    </select>
                    <select
                      value={slot.pedidoId ?? ''}
                      onChange={(e) =>
                        void atualizarSlot(slot, { pedidoId: e.target.value || undefined })
                      }
                      aria-label="Pedido vinculado"
                    >
                      <option value="">Pedido (opcional)</option>
                      {pedidos.map((p) => {
                        const c = clientes.find((x) => x.id === p.clienteId);
                        return (
                          <option key={p.id} value={p.id}>
                            {c?.nome ?? p.id.slice(0, 8)} – {p.status}
                          </option>
                        );
                      })}
                    </select>
                    <button
                      type="button"
                      className="btn-sm"
                      onClick={() => void atualizarSlot(slot, { ocupado: !slot.ocupado })}
                    >
                      {slot.ocupado ? 'Liberar' : 'Ocupar'}
                    </button>
                    <button
                      type="button"
                      className="btn-sm danger"
                      onClick={() => void removerSlotAgenda(slot.id)}
                    >
                      Remover
                    </button>
                  </>
                ) : (
                  <button type="button" className="btn-add-slot" onClick={() => void toggleSlot(hora)}>
                    Adicionar horário
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
