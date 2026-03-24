import { useState, useEffect } from 'react';
import { store } from '../store';
import type { Produto, StatusProduto } from '../types';
import ProdutoForm from '../components/ProdutoForm';
import './Acervo.css';

const STATUS_LABEL: Record<StatusProduto, string> = {
  disponivel: 'Disponível',
  reservado: 'Reservado',
  costureira: 'Na costureira',
  emprestado: 'Emprestado',
  danificado: 'Danificado',
  conserto: 'Em conserto',
};

export default function Acervo() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [filtro, setFiltro] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<StatusProduto | ''>('');
  const [editarId, setEditarId] = useState<string | null>(null);
  const [novo, setNovo] = useState(false);

  useEffect(() => {
    setProdutos(store.produtos);
  }, []);

  const filtrados = produtos.filter((p) => {
    const matchText =
      p.tipo.toLowerCase().includes(filtro.toLowerCase()) ||
      p.descricao.toLowerCase().includes(filtro.toLowerCase());
    const matchStatus = !filtroStatus || p.status === filtroStatus;
    return matchText && matchStatus;
  });

  const refresh = () => setProdutos([...store.produtos]);

  const handleExcluir = (id: string) => {
    if (confirm('Excluir este produto do acervo?')) {
      store.produtos = store.produtos.filter((p) => p.id !== id);
      refresh();
      if (editarId === id) setEditarId(null);
    }
  };

  const produtoEmEdicao = editarId ? produtos.find((p) => p.id === editarId) : null;

  return (
    <div className="acervo-page">
      <h1 className="page-title">Acervo</h1>

      <div className="toolbar">
        <input
          type="search"
          placeholder="Pesquisar por tipo ou descrição"
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          className="filtro-input"
          aria-label="Pesquisar produtos"
        />
        <select
          value={filtroStatus}
          onChange={(e) => setFiltroStatus((e.target.value || '') as StatusProduto | '')}
          aria-label="Filtrar por status"
        >
          <option value="">Todos os status</option>
          {(Object.keys(STATUS_LABEL) as StatusProduto[]).map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>
        <button type="button" className="btn-primary" onClick={() => { setNovo(true); setEditarId(null); }}>
          Novo produto
        </button>
      </div>

      {(novo || produtoEmEdicao) && (
        <div className="form-overlay">
          <ProdutoForm
            produto={produtoEmEdicao ?? undefined}
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

      <section className="acervo-grid" aria-label="Catálogo de produtos">
        {filtrados.length === 0 ? (
          <p className="vazio">Nenhum produto encontrado.</p>
        ) : (
          filtrados.map((p) => (
            <article key={p.id} className="produto-card">
              <div className="produto-img">
                {p.imagem ? (
                  <img src={p.imagem} alt={p.descricao} />
                ) : (
                  <span className="sem-img">Sem imagem</span>
                )}
              </div>
              <div className="produto-info">
                <span className="produto-tipo">{p.tipo}</span>
                <p className="produto-desc">{p.descricao}</p>
                <span className={`badge status-${p.status}`}>{STATUS_LABEL[p.status]}</span>
                <div className="produto-actions">
                  <button type="button" className="btn-sm" onClick={() => { setEditarId(p.id); setNovo(false); }}>
                    Editar
                  </button>
                  <button type="button" className="btn-sm danger" onClick={() => handleExcluir(p.id)}>
                    Excluir
                  </button>
                </div>
              </div>
            </article>
          ))
        )}
      </section>
    </div>
  );
}
