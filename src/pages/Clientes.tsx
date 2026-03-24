import { useState, useEffect } from 'react';
import { store } from '../store';
import type { Cliente } from '../types';
import ClienteForm from '../components/ClienteForm';
import './Clientes.css';

export default function Clientes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [filtro, setFiltro] = useState('');
  const [editarId, setEditarId] = useState<string | null>(null);
  const [novo, setNovo] = useState(false);

  useEffect(() => {
    setClientes(store.clientes);
  }, []);

  const filtrados = clientes.filter(
    (c) =>
      c.nome.toLowerCase().includes(filtro.toLowerCase()) ||
      c.cpf.replace(/\D/g, '').includes(filtro.replace(/\D/g, '')) ||
      c.telefone.replace(/\D/g, '').includes(filtro.replace(/\D/g, ''))
  );

  const refresh = () => {
    setClientes([...store.clientes]);
  };

  const handleExcluir = (id: string) => {
    if (confirm('Excluir este cliente?')) {
      store.clientes = store.clientes.filter((c) => c.id !== id);
      refresh();
      if (editarId === id) setEditarId(null);
    }
  };

  const clienteEmEdicao = editarId ? clientes.find((c) => c.id === editarId) : null;

  return (
    <div className="clientes-page">
      <h1 className="page-title">Clientes</h1>

      <div className="toolbar">
        <input
          type="search"
          placeholder="Pesquisar por nome, CPF ou telefone"
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          className="filtro-input"
          aria-label="Filtrar clientes"
        />
        <button type="button" className="btn-primary" onClick={() => { setNovo(true); setEditarId(null); }}>
          Novo cliente
        </button>
      </div>

      {(novo || clienteEmEdicao) && (
        <div className="form-overlay">
          <ClienteForm
            cliente={clienteEmEdicao ?? undefined}
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

      <section className="tabela-wrap" aria-label="Lista de clientes">
        <table className="tabela">
          <thead>
            <tr>
              <th>Nome</th>
              <th>CPF</th>
              <th>Telefone</th>
              <th>Endereço</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.length === 0 ? (
              <tr>
                <td colSpan={5}>Nenhum cliente encontrado.</td>
              </tr>
            ) : (
              filtrados.map((c) => (
                <tr key={c.id}>
                  <td>{c.nome}</td>
                  <td>{c.cpf}</td>
                  <td>{c.telefone}</td>
                  <td>{c.endereco}</td>
                  <td>
                    <button type="button" className="btn-sm" onClick={() => { setEditarId(c.id); setNovo(false); }}>
                      Editar
                    </button>
                    <button type="button" className="btn-sm danger" onClick={() => handleExcluir(c.id)}>
                      Excluir
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
