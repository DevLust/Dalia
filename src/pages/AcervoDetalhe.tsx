import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { formatDate } from '../lib/dates';
import { imagensDoProduto } from '../lib/produtoImagens';
import { statusEfetivo } from '../lib/produtoStatus';
import type { StatusProduto } from '../types';
import './AcervoDetalhe.css';

const STATUS_LABEL: Record<StatusProduto, string> = {
  disponivel: 'Disponível',
  reservado: 'Reservado',
  costureira: 'Na costureira',
  emprestado: 'Emprestado',
  danificado: 'Danificado',
  conserto: 'Em conserto',
  fora_estoque: 'Fora de estoque',
};

function formatMoney(v?: number) {
  if (v == null) return '—';
  return `R$ ${v.toFixed(2).replace('.', ',')}`;
}

export default function AcervoDetalhe() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { produtos, pedidos } = useData();
  const produto = produtos.find((p) => p.id === id);
  const fotos = produto ? imagensDoProduto(produto) : [];
  const [fotoAtiva, setFotoAtiva] = useState(0);

  const pedidosComProduto = useMemo(() => {
    if (!produto) return [];
    return pedidos.filter((ped) => ped.itens?.some((i) => i.produtoId === produto.id));
  }, [pedidos, produto]);

  if (!produto) {
    return (
      <div className="acervo-detalhe-page">
        <p className="vazio">Produto não encontrado.</p>
        <Link to="/acervo" className="btn-secondary">
          Voltar ao acervo
        </Link>
      </div>
    );
  }

  const efetivo = statusEfetivo(produto);
  const indiceAtivo = fotos.length ? Math.min(fotoAtiva, fotos.length - 1) : 0;

  return (
    <div className="acervo-detalhe-page">
      <header className="detalhe-header">
        <div>
          <nav className="detalhe-breadcrumb" aria-label="Navegação">
            <Link to="/acervo">Acervo</Link>
            <span>/</span>
            <span>{produto.descricao}</span>
          </nav>
          <h1 className="page-title">{produto.descricao}</h1>
          <p className="page-desc">
            {produto.tipo} · Cadastrado em {formatDate(produto.dataCadastro)}
          </p>
        </div>
        <div className="detalhe-header-actions">
          <button type="button" className="btn-secondary" onClick={() => navigate('/acervo')}>
            Voltar
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={() => navigate(`/acervo?editar=${produto.id}`)}
          >
            Editar produto
          </button>
        </div>
      </header>

      <div className="detalhe-grid">
        <section className="card detalhe-galeria" aria-label="Fotos do produto">
          {fotos.length === 0 ? (
            <div className="detalhe-sem-foto">Nenhuma foto cadastrada</div>
          ) : (
            <>
              <div className="detalhe-foto-principal">
                <img src={fotos[indiceAtivo]} alt={`${produto.descricao} — foto ${indiceAtivo + 1}`} />
              </div>
              {fotos.length > 1 && (
                <div className="detalhe-miniaturas" role="list">
                  {fotos.map((src, i) => (
                    <button
                      key={`${src.slice(0, 32)}-${i}`}
                      type="button"
                      role="listitem"
                      className={i === indiceAtivo ? 'ativa' : ''}
                      onClick={() => setFotoAtiva(i)}
                      aria-label={`Ver foto ${i + 1}`}
                      aria-current={i === indiceAtivo ? 'true' : undefined}
                    >
                      <img src={src} alt="" />
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </section>

        <section className="card detalhe-info">
          <h2>Informações</h2>
          <dl className="detalhe-dl">
            <div>
              <dt>Status</dt>
              <dd>
                <span className={`badge status-${efetivo}`}>{STATUS_LABEL[efetivo]}</span>
              </dd>
            </div>
            <div>
              <dt>Estoque</dt>
              <dd>{produto.quantidade} un.</dd>
            </div>
            <div>
              <dt>Aluguel</dt>
              <dd>{formatMoney(produto.valorAluguel)}</dd>
            </div>
            <div>
              <dt>Calção</dt>
              <dd>{formatMoney(produto.valorCalcao)}</dd>
            </div>
            <div>
              <dt>Fotos</dt>
              <dd>{fotos.length}</dd>
            </div>
          </dl>
        </section>

        {pedidosComProduto.length > 0 && (
          <section className="card detalhe-pedidos">
            <h2>Pedidos com esta peça</h2>
            <ul className="detalhe-pedidos-lista">
              {pedidosComProduto.slice(0, 8).map((ped) => (
                <li key={ped.id}>
                  <Link to={`/pedidos?editar=${ped.id}`}>
                    Pedido · {formatDate(ped.dataRetirada)} · {ped.status}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
