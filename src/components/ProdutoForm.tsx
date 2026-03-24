import { useState, useRef } from 'react';
import type { FormEvent } from 'react';
import { store, generateId } from '../store';
import type { Produto, StatusProduto } from '../types';
import './ProdutoForm.css';

const STATUS_OPCOES: StatusProduto[] = [
  'disponivel',
  'reservado',
  'costureira',
  'emprestado',
  'danificado',
  'conserto',
];

const STATUS_LABEL: Record<StatusProduto, string> = {
  disponivel: 'Disponível',
  reservado: 'Reservado',
  costureira: 'Na costureira',
  emprestado: 'Emprestado',
  danificado: 'Danificado',
  conserto: 'Em conserto',
};

export default function ProdutoForm({
  produto,
  onSalvo,
  onCancelar,
}: {
  produto?: Produto;
  onSalvo: () => void;
  onCancelar: () => void;
}) {
  const [tipo, setTipo] = useState(produto?.tipo ?? 'vestido');
  const [descricao, setDescricao] = useState(produto?.descricao ?? '');
  const [dataCadastro, setDataCadastro] = useState(
    produto?.dataCadastro ?? new Date().toISOString().slice(0, 10)
  );
  const [status, setStatus] = useState<StatusProduto>(produto?.status ?? 'disponivel');
  const [imagem, setImagem] = useState(produto?.imagem ?? '');
  const [valorAluguel, setValorAluguel] = useState(produto?.valorAluguel?.toString() ?? '');
  const [valorCalcao, setValorCalcao] = useState(produto?.valorCalcao?.toString() ?? '');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => setImagem(String(r.result));
    r.readAsDataURL(f);
  };

  const handleSalvar = (e: FormEvent) => {
    e.preventDefault();
    if (!descricao.trim()) return;

    const payload: Produto = {
      id: produto?.id ?? generateId(),
      tipo: tipo.trim(),
      descricao: descricao.trim(),
      dataCadastro,
      imagem: imagem || undefined,
      status,
      valorAluguel: valorAluguel ? parseFloat(valorAluguel.replace(',', '.')) : undefined,
      valorCalcao: valorCalcao ? parseFloat(valorCalcao.replace(',', '.')) : undefined,
    };

    const lista = [...store.produtos];
    const idx = lista.findIndex((p) => p.id === payload.id);
    if (idx >= 0) lista[idx] = payload;
    else lista.push(payload);
    store.produtos = lista;
    onSalvo();
  };

  return (
    <div className="produto-form-card" role="dialog" aria-labelledby="form-produto-title">
      <h2 id="form-produto-title">{produto ? 'Editar produto' : 'Cadastrar produto'}</h2>

      <form onSubmit={handleSalvar} noValidate>
        <div className="form-row">
          <label htmlFor="produto-tipo">Tipo de roupa</label>
          <input
            id="produto-tipo"
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            placeholder="ex.: vestido"
          />
        </div>
        <div className="form-row">
          <label htmlFor="produto-desc">Descrição breve *</label>
          <input
            id="produto-desc"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            required
            aria-required="true"
          />
        </div>
        <div className="form-row">
          <label htmlFor="produto-data">Data de cadastro</label>
          <input
            id="produto-data"
            type="date"
            value={dataCadastro}
            onChange={(e) => setDataCadastro(e.target.value)}
          />
        </div>
        <div className="form-row">
          <label htmlFor="produto-status">Status</label>
          <select
            id="produto-status"
            value={status}
            onChange={(e) => setStatus(e.target.value as StatusProduto)}
          >
            {STATUS_OPCOES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </div>
        <div className="form-row">
          <label>Imagem</label>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handleFile}
            aria-label="Inserir imagem do produto"
          />
          {imagem && (
            <div className="preview-img">
              <img src={imagem} alt="Preview do produto" />
            </div>
          )}
        </div>
        <div className="form-row">
          <label htmlFor="produto-aluguel">Valor aluguel (R$)</label>
          <input
            id="produto-aluguel"
            type="text"
            inputMode="decimal"
            value={valorAluguel}
            onChange={(e) => setValorAluguel(e.target.value)}
          />
        </div>
        <div className="form-row">
          <label htmlFor="produto-calcao">Valor calção (R$)</label>
          <input
            id="produto-calcao"
            type="text"
            inputMode="decimal"
            value={valorCalcao}
            onChange={(e) => setValorCalcao(e.target.value)}
          />
        </div>

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
