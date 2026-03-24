import { useState, useEffect } from 'react';
import { store, generateId } from '../store';
import type { AgendaSlot } from '../types';
import './Agenda.css';

const HORAS = [
  '08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00', '18:00',
];

export default function Agenda() {
  const [slots, setSlots] = useState<AgendaSlot[]>([]);
  const [dataSelecionada, setDataSelecionada] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );

  useEffect(() => {
    setSlots(store.agenda);
  }, []);

  const slotsDoDia = slots.filter((s) => s.data === dataSelecionada);
  const getSlot = (hora: string) =>
    slotsDoDia.find((s) => s.hora === hora);

  const toggleSlot = (hora: string) => {
    const exist = getSlot(hora);
    let novaLista: AgendaSlot[];
    if (exist) {
      novaLista = store.agenda.filter((s) => !(s.data === dataSelecionada && s.hora === hora));
    } else {
      novaLista = [
        ...store.agenda,
        {
          id: generateId(),
          data: dataSelecionada,
          hora,
          ocupado: false,
        },
      ];
    }
    store.agenda = novaLista;
    setSlots([...novaLista]);
  };

  const marcarOcupado = (slot: AgendaSlot, ocupado: boolean) => {
    const novaLista = store.agenda.map((s) =>
      s.id === slot.id ? { ...s, ocupado } : s
    );
    store.agenda = novaLista;
    setSlots([...novaLista]);
  };

  const clientes = store.clientes;

  return (
    <div className="agenda-page">
      <h1 className="page-title">Agenda</h1>
      <p className="page-desc">
        Acesse os horários disponíveis e marque o cronograma de atendimento.
      </p>

      <div className="agenda-toolbar">
        <label htmlFor="agenda-data">Data</label>
        <input
          id="agenda-data"
          type="date"
          value={dataSelecionada}
          onChange={(e) => setDataSelecionada(e.target.value)}
        />
      </div>

      <section className="agenda-grid" aria-label="Horários do dia">
        <h2>Horários – {new Date(dataSelecionada + 'T12:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</h2>
        <div className="slots">
          {HORAS.map((hora) => {
            const slot = getSlot(hora);
            const cliente = slot?.clienteId
              ? clientes.find((c) => c.id === slot.clienteId)
              : null;
            return (
              <div
                key={hora}
                className={`slot ${slot?.ocupado ? 'ocupado' : ''}`}
              >
                <span className="hora">{hora}</span>
                {slot ? (
                  <>
                    <span className="info">
                      {slot.ocupado
                        ? cliente
                          ? cliente.nome
                          : 'Reservado'
                        : 'Disponível'}
                    </span>
                    <button
                      type="button"
                      className="btn-sm"
                      onClick={() => marcarOcupado(slot, !slot.ocupado)}
                      title={slot.ocupado ? 'Marcar como disponível' : 'Marcar como ocupado'}
                    >
                      {slot.ocupado ? 'Liberar' : 'Ocupar'}
                    </button>
                  </>
                ) : (
                  <button type="button" className="btn-add-slot" onClick={() => toggleSlot(hora)}>
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
