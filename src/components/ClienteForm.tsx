import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { store, generateId } from '../store';
import type { Cliente, Medidas } from '../types';
import './ClienteForm.css';

function formatCPF(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

function formatTel(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : '';
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}${d.length > 6 ? '-' + d.slice(7) : ''}`;
}

const CAMPOS_MEDIDAS: { key: keyof Medidas; label: string }[] = [
  { key: 'busto', label: 'Busto (cm)' },
  { key: 'cintura', label: 'Cintura (cm)' },
  { key: 'quadril', label: 'Quadril (cm)' },
  { key: 'comprimento', label: 'Comprimento (cm)' },
  { key: 'ombro', label: 'Ombro (cm)' },
];

export default function ClienteForm({
  cliente,
  onSalvo,
  onCancelar,
}: {
  cliente?: Cliente;
  onSalvo: () => void;
  onCancelar: () => void;
}) {
  const [nome, setNome] = useState(cliente?.nome ?? '');
  const [cpf, setCpf] = useState(cliente?.cpf ? formatCPF(cliente.cpf) : '');
  const [identidade, setIdentidade] = useState(cliente?.identidade ?? '');
  const [endereco, setEndereco] = useState(cliente?.endereco ?? '');
  const [telefone, setTelefone] = useState(cliente?.telefone ? formatTel(cliente.telefone) : '');
  const [email, setEmail] = useState(cliente?.email ?? '');
  const [medidas, setMedidas] = useState<Medidas>(cliente?.medidas ?? {});
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (cliente?.medidas) setMedidas({ ...cliente.medidas });
  }, [cliente?.id]);

  const handleSalvar = (e: FormEvent) => {
    e.preventDefault();
    setErro('');
    const cpfLimpo = cpf.replace(/\D/g, '');
    if (cpfLimpo.length !== 11) {
      setErro('CPF deve ter 11 dígitos.');
      return;
    }
    if (!nome.trim()) {
      setErro('Nome é obrigatório.');
      return;
    }
    if (!endereco.trim()) {
      setErro('Endereço é obrigatório.');
      return;
    }
    if (!telefone.replace(/\D/g, '').trim()) {
      setErro('Telefone é obrigatório.');
      return;
    }

    const payload: Cliente = {
      id: cliente?.id ?? generateId(),
      nome: nome.trim(),
      cpf: cpfLimpo,
      identidade: identidade.trim() || undefined,
      endereco: endereco.trim(),
      telefone: telefone.replace(/\D/g, ''),
      email: email.trim() || undefined,
      medidas: Object.keys(medidas).length ? medidas : undefined,
      createdAt: cliente?.createdAt ?? new Date().toISOString(),
    };

    const lista = [...store.clientes];
    const idx = lista.findIndex((c) => c.id === payload.id);
    if (idx >= 0) lista[idx] = payload;
    else lista.push(payload);
    store.clientes = lista;
    onSalvo();
  };

  const updateMedida = (key: keyof Medidas, value: string) => {
    const n = parseFloat(value.replace(',', '.'));
    setMedidas((m) => ({ ...m, [key]: isNaN(n) ? undefined : n }));
  };

  return (
    <div className="cliente-form-card" role="dialog" aria-labelledby="form-cliente-title">
      <h2 id="form-cliente-title">{cliente ? 'Editar cliente' : 'Cadastrar cliente'}</h2>

      <form onSubmit={handleSalvar} noValidate>
        <div className="form-row">
          <label htmlFor="cliente-nome">Nome *</label>
          <input
            id="cliente-nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
            aria-required="true"
          />
        </div>
        <div className="form-row">
          <label htmlFor="cliente-cpf">CPF *</label>
          <input
            id="cliente-cpf"
            value={cpf}
            onChange={(e) => setCpf(formatCPF(e.target.value))}
            placeholder="000.000.000-00"
            maxLength={14}
            required
            aria-required="true"
          />
        </div>
        <div className="form-row">
          <label htmlFor="cliente-identidade">Identidade</label>
          <input id="cliente-identidade" value={identidade} onChange={(e) => setIdentidade(e.target.value)} />
        </div>
        <div className="form-row">
          <label htmlFor="cliente-endereco">Endereço *</label>
          <input
            id="cliente-endereco"
            value={endereco}
            onChange={(e) => setEndereco(e.target.value)}
            required
            aria-required="true"
          />
        </div>
        <div className="form-row">
          <label htmlFor="cliente-telefone">Telefone *</label>
          <input
            id="cliente-telefone"
            value={telefone}
            onChange={(e) => setTelefone(formatTel(e.target.value))}
            placeholder="(00) 00000-0000"
            required
            aria-required="true"
          />
        </div>
        <div className="form-row">
          <label htmlFor="cliente-email">E-mail</label>
          <input
            id="cliente-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <fieldset className="medidas-fieldset">
          <legend>Medidas corporais (opcional)</legend>
          {CAMPOS_MEDIDAS.map(({ key, label }) => (
            <div key={key} className="form-row inline">
              <label htmlFor={`medida-${key}`}>{label}</label>
              <input
                id={`medida-${key}`}
                type="text"
                inputMode="decimal"
                value={medidas[key] ?? ''}
                onChange={(e) => updateMedida(key, e.target.value)}
              />
            </div>
          ))}
        </fieldset>

        {erro && <p className="form-erro" role="alert">{erro}</p>}

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
