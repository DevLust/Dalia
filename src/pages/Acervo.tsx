import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { imagemPrincipal } from '../lib/produtoImagens';
import { statusEfetivo } from '../lib/produtoStatus';
import type { StatusProduto } from '../types';
import ProdutoForm from '../components/ProdutoForm';
import './Acervo.css';

const STATUS_LABEL: Record<StatusProduto, string> = {
  disponivel: 'Disponível',
  reservado: 'Reservado',
  costureira: 'Na costureira',
  emprestado: 'Emprestado',
  danificado: 'Danificado',
  conserto: 'Em conserto',
  fora_estoque: 'Fora de estoque',
};

export default function Acervo() {
  const { produtos, excluirProduto } = useData();
  const [searchParams, setSearchParams] = useSearchParams();
  const editarId = searchParams.get('editar');
  const [filtro, setFiltro] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<StatusProduto | ''>('');
  const [novo, setNovo] = useState(false);

  useEffect(() => {
    if (editarId) setNovo(false);
  }, [editarId]);

  const filtrados = produtos.filter((p) => {
    const efetivo = statusEfetivo(p);
    const matchText =
      p.tipo.toLowerCase().includes(filtro.toLowerCase()) ||
      p.descricao.toLowerCase().includes(filtro.toLowerCase());
    const matchStatus = !filtroStatus || efetivo === filtroStatus;
    return matchText && matchStatus;
  });

  const clearEditarNaUrl = () => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('editar');
      return next;
    });
  };

  const handleExcluir = async (id: string) => {
    if (confirm('Excluir este produto do acervo?')) {
      await excluirProduto(id);
      if (editarId === id) clearEditarNaUrl();
    }
  };

  const produtoEmEdicao = editarId ? produtos.find((p) => p.id === editarId) : null;

  return (
    <div className="acervo-page">
      <header className="page-header">
        <h1 className="page-title">Acervo</h1>
        <p className="page-desc">Catálogo de peças e estoque</p>
      </header>

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
        <button
          type="button"
          className="btn-primary"
          onClick={() => {
            setNovo(true);
            clearEditarNaUrl();
          }}
        >
          Novo produto
        </button>
      </div>

      {(novo || produtoEmEdicao) && (
        <div className="form-overlay">
          <ProdutoForm
            produto={produtoEmEdicao ?? undefined}
            onSalvo={() => {
              setNovo(false);
              clearEditarNaUrl();
            }}
            onCancelar={() => {
              setNovo(false);
              clearEditarNaUrl();
            }}
          />
        </div>
      )}

      <section className="acervo-grid" aria-label="Catálogo de produtos">
        {filtrados.length === 0 ? (
          <p className="vazio">Nenhum produto encontrado.</p>
        ) : (
          filtrados.map((p) => {
            const efetivo = statusEfetivo(p);
            const capa = imagemPrincipal(p);
            const qtdFotos = p.imagens?.length ?? (p.imagem ? 1 : 0);
            return (
              <article key={p.id} className="produto-card">
                <Link to={`/acervo/${p.id}`} className="produto-img-link">
                  <div className="produto-img">
                    {capa ? (
                      <img src={capa} alt={p.descricao} />
                    ) : (
                      <span className="sem-img">Sem imagem</span>
                    )}
                    {qtdFotos > 1 && <span className="produto-fotos-badge">{qtdFotos} fotos</span>}
                  </div>
                </Link>
                <div className="produto-info">
                  <span className="produto-tipo">{p.tipo}</span>
                  <Link to={`/acervo/${p.id}`} className="produto-desc-link">
                    <p className="produto-desc">{p.descricao}</p>
                  </Link>
                  <span className="badge">Estoque: {p.quantidade}</span>
                  <span className={`badge status-${efetivo}`}>{STATUS_LABEL[efetivo]}</span>
                  <div className="produto-actions">
                    <Link to={`/acervo/${p.id}`} className="btn-sm btn-ver">
                      Ver
                    </Link>
                    <button
                      type="button"
                      className="btn-sm"
                      onClick={() => {
                        setNovo(false);
                        setSearchParams((prev) => {
                          const next = new URLSearchParams(prev);
                          next.set('editar', p.id);
                          return next;
                        });
                      }}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      className="btn-sm danger"
                      onClick={() => void handleExcluir(p.id)}
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </section>
    </div>
  );
}
