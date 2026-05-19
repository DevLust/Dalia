import { useState } from 'react';
import { useData } from '../contexts/DataContext';
import ClienteForm from '../components/ClienteForm';
export default function Clientes() {
  const { clientes, excluirCliente } = useData();
  const [filtro, setFiltro] = useState('');
  const [editarId, setEditarId] = useState<string | null>(null);
  const [novo, setNovo] = useState(false);

  const filtrados = clientes.filter(
    (c) =>
      c.nome.toLowerCase().includes(filtro.toLowerCase()) ||
      c.cpf.replace(/\D/g, '').includes(filtro.replace(/\D/g, '')) ||
      c.telefone.replace(/\D/g, '').includes(filtro.replace(/\D/g, ''))
  );

  const handleExcluir = async (id: string) => {
    if (confirm('Excluir este cliente?')) {
      await excluirCliente(id);
      if (editarId === id) setEditarId(null);
    }
  };

  const clienteEmEdicao = editarId ? clientes.find((c) => c.id === editarId) : null;

  return (
    <div className="clientes-page">
      <header className="page-header">
        <h1 className="page-title">Clientes</h1>
        <p className="page-desc">Cadastro e gestão de clientes</p>
      </header>

      <div className="toolbar">
        <input
          type="search"
          placeholder="Pesquisar por nome, CPF ou telefone"
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          className="filtro-input"
          aria-label="Filtrar clientes"
        />
        <button
          type="button"
          className="btn-primary"
          onClick={() => {
            setNovo(true);
            setEditarId(null);
          }}
        >
          Novo cliente
        </button>
      </div>

      {(novo || clienteEmEdicao) && (
        <div className="form-overlay">
          <ClienteForm
            key={novo ? 'novo' : editarId ?? 'novo'}
            cliente={clienteEmEdicao ?? undefined}
            onSalvo={() => {
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
                    <button
                      type="button"
                      className="btn-sm"
                      onClick={() => {
                        setEditarId(c.id);
                        setNovo(false);
                      }}
                    >
                      Editar
                    </button>
                    <button type="button" className="btn-sm danger" onClick={() => void handleExcluir(c.id)}>
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
