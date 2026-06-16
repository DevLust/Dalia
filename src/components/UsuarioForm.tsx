import { useState } from 'react';
import type { FormEvent } from 'react';
import type { CriarUsuarioInput } from '../lib/auth';
import type { Papel } from '../types';

const PAPEIS_CRIAVEIS: Papel[] = ['atendente', 'gerente'];

const PAPEL_LABEL: Record<Papel, string> = {
  atendente: 'Atendente',
  gerente: 'Gerente',
  administrador: 'Administrador',
  cliente: 'Cliente',
};

export default function UsuarioForm({
  onCriar,
}: {
  onCriar: (input: CriarUsuarioInput) => Promise<void>;
}) {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [papel, setPapel] = useState<Papel>('atendente');
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErro('');
    setSalvando(true);
    try {
      await onCriar({ nome, email, senha, papel });
      setNome('');
      setEmail('');
      setSenha('');
      setPapel('atendente');
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não foi possível criar o usuário.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <form className="usuario-form" onSubmit={handleSubmit} noValidate>
      <h3>Novo perfil de acesso</h3>
      <p className="hint">O administrador cria contas de atendente ou gerente com login e senha.</p>

      <div className="form-row">
        <label htmlFor="user-nome">Nome</label>
        <input
          id="user-nome"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          required
          aria-required="true"
        />
      </div>
      <div className="form-row">
        <label htmlFor="user-email">E-mail</label>
        <input
          id="user-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          aria-required="true"
        />
      </div>
      <div className="form-row">
        <label htmlFor="user-senha">Senha inicial</label>
        <input
          id="user-senha"
          type="password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          minLength={6}
          required
          aria-required="true"
        />
      </div>
      <div className="form-row">
        <label htmlFor="user-papel">Papel</label>
        <select id="user-papel" value={papel} onChange={(e) => setPapel(e.target.value as Papel)}>
          {PAPEIS_CRIAVEIS.map((p) => (
            <option key={p} value={p}>
              {PAPEL_LABEL[p]}
            </option>
          ))}
        </select>
      </div>

      {erro && (
        <p className="form-erro" role="alert">
          {erro}
        </p>
      )}

      <button type="submit" className="btn-primary" disabled={salvando}>
        {salvando ? 'Criando…' : 'Criar usuário'}
      </button>
    </form>
  );
}

export { PAPEL_LABEL };
