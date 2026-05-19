import { useState, useRef } from 'react';
import type { FormEvent } from 'react';
import { generateId } from '../store';
import { todayIso } from '../lib/dates';
import { imagensDoProduto } from '../lib/produtoImagens';
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

const MAX_FOTOS = 8;

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
  const [imagens, setImagens] = useState<string[]>(() => imagensDoProduto(produto ?? {}));
  const [valorAluguel, setValorAluguel] = useState(produto?.valorAluguel?.toString() ?? '');
  const [valorCalcao, setValorCalcao] = useState(produto?.valorCalcao?.toString() ?? '');
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const lerArquivos = (files: FileList | null) => {
    if (!files?.length) return;
    const restante = MAX_FOTOS - imagens.length;
    if (restante <= 0) {
      setErro(`Máximo de ${MAX_FOTOS} fotos por produto.`);
      return;
    }
    const lista = Array.from(files).slice(0, restante);
    lista.forEach((f) => {
      const r = new FileReader();
      r.onload = () => {
        setImagens((prev) => {
          if (prev.length >= MAX_FOTOS) return prev;
          return [...prev, String(r.result)];
        });
      };
      r.readAsDataURL(f);
    });
    setErro('');
    if (fileRef.current) fileRef.current.value = '';
  };

  const removerFoto = (index: number) => {
    setImagens((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSalvar = async (e: FormEvent) => {
    e.preventDefault();
    setErro('');
    if (!descricao.trim()) {
      setErro('Descrição é obrigatória.');
      return;
    }
    const qtd = Math.max(0, parseInt(quantidade, 10) || 0);
    const listaImagens = imagens.filter(Boolean);

    const payload: Produto = {
      id: produto?.id ?? generateId(),
      tipo: tipo.trim(),
      descricao: descricao.trim(),
      dataCadastro,
      imagem: listaImagens[0],
      imagens: listaImagens.length ? listaImagens : undefined,
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
          <label>Fotos do produto</label>
          <p className="hint">Até {MAX_FOTOS} imagens (JPEG/PNG). A primeira é a capa do card.</p>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => lerArquivos(e.target.files)}
            aria-label="Adicionar fotos do produto"
            disabled={imagens.length >= MAX_FOTOS}
          />
          {imagens.length > 0 && (
            <div className="galeria-upload" role="list">
              {imagens.map((src, i) => (
                <div key={`${i}-${src.slice(0, 24)}`} className="galeria-upload-item" role="listitem">
                  <img src={src} alt={`Foto ${i + 1}`} />
                  {i === 0 && <span className="galeria-capa">Capa</span>}
                  <button
                    type="button"
                    className="galeria-remover"
                    onClick={() => removerFoto(i)}
                    aria-label={`Remover foto ${i + 1}`}
                  >
                    ×
                  </button>
                </div>
              ))}
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

        {erro && (
          <p className="form-erro" role="alert">
            {erro}
          </p>
        )}

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
