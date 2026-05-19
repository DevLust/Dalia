import { useState, useRef } from 'react';
import type { FormEvent } from 'react';
import { generateId } from '../store';
import { todayIso } from '../lib/dates';
import DateInput from './DateInput';
import { useData } from '../contexts/DataContext';
import type { Produto, StatusProduto } from '../types';
import { statusEfetivo } from '../lib/produtoStatus';
import './forms.css';

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
  fora_estoque: 'Fora de estoque',
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
  const { salvarProduto } = useData();
  const [tipo, setTipo] = useState(produto?.tipo ?? 'vestido');
  const [descricao, setDescricao] = useState(produto?.descricao ?? '');
  const [dataCadastro, setDataCadastro] = useState(
    produto?.dataCadastro?.slice(0, 10) ?? todayIso()
  );
  const [status, setStatus] = useState<StatusProduto>(produto?.status ?? 'disponivel');
  const [quantidade, setQuantidade] = useState(String(produto?.quantidade ?? 1));
  const [imagem, setImagem] = useState(produto?.imagem ?? '');
  const [valorAluguel, setValorAluguel] = useState(produto?.valorAluguel?.toString() ?? '');
  const [valorCalcao, setValorCalcao] = useState(produto?.valorCalcao?.toString() ?? '');
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => setImagem(String(r.result));
    r.readAsDataURL(f);
  };

  const handleSalvar = async (e: FormEvent) => {
    e.preventDefault();
    setErro('');
    if (!descricao.trim()) {
      setErro('Descrição é obrigatória.');
      return;
    }
    const qtd = Math.max(0, parseInt(quantidade, 10) || 0);

    const payload: Produto = {
      id: produto?.id ?? generateId(),
      tipo: tipo.trim(),
      descricao: descricao.trim(),
      dataCadastro,
      imagem: imagem || undefined,
      status: qtd <= 0 ? 'fora_estoque' : status,
      quantidade: qtd,
      valorAluguel: valorAluguel ? parseFloat(valorAluguel.replace(',', '.')) : undefined,
      valorCalcao: valorCalcao ? parseFloat(valorCalcao.replace(',', '.')) : undefined,
    };

    setSalvando(true);
    try {
      await salvarProduto(payload);
      onSalvo();
    } catch {
      setErro('Não foi possível salvar o produto.');
    } finally {
      setSalvando(false);
    }
  };

  const previewStatus = statusEfetivo({
    id: '',
    tipo,
    descricao,
    dataCadastro,
    status,
    quantidade: parseInt(quantidade, 10) || 0,
  });

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
          <DateInput id="produto-data" value={dataCadastro} onChange={setDataCadastro} />
        </div>
        <div className="form-row">
          <label htmlFor="produto-qtd">Quantidade em estoque</label>
          <input
            id="produto-qtd"
            type="number"
            min={0}
            value={quantidade}
            onChange={(e) => setQuantidade(e.target.value)}
          />
          <p className="hint">Status visual: {STATUS_LABEL[previewStatus]}</p>
        </div>
        <div className="form-row">
          <label htmlFor="produto-status">Status</label>
          <select
            id="produto-status"
            value={status}
            onChange={(e) => setStatus(e.target.value as StatusProduto)}
            disabled={(parseInt(quantidade, 10) || 0) <= 0}
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

        {erro && <p className="form-erro" role="alert">{erro}</p>}

        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={onCancelar} disabled={salvando}>
            Cancelar
          </button>
          <button type="submit" className="btn-primary" disabled={salvando}>
            {salvando ? 'Salvando…' : 'Salvar'}
          </button>
        </div>
      </form>
    </div>
  );
}
