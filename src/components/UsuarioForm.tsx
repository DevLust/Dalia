import { useState } from 'react';
import type { FormEvent } from 'react';
import type { CriarUsuarioInput } from '../lib/auth';
import { validarEmail } from '../lib/validators';
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
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [papel, setPapel] = useState<Papel>('atendente');
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  const validarFormulario = (): string | null => {
    if (!nome.trim()) return 'Informe o nome.';
    if (!email.trim()) return 'Informe o e-mail.';
    if (!validarEmail(email)) return 'E-mail inválido. Ex.: nome@empresa.com.br';
    if (senha.length < 6) return 'A senha deve ter no mínimo 6 caracteres.';
    if (senha !== confirmarSenha) return 'As senhas não coincidem.';
    return null;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErro('');

    const validacao = validarFormulario();
    if (validacao) {
      setErro(validacao);
      return;
    }

    setSalvando(true);
    try {
      await onCriar({ nome, email, senha, papel });
      setNome('');
      setEmail('');
      setSenha('');
      setConfirmarSenha('');
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
          autoComplete="email"
          required
          aria-required="true"
          aria-invalid={email.length > 0 && !validarEmail(email)}
        />
      </div>
      <div className="form-row">
        <label htmlFor="user-senha">Senha inicial</label>
        <input
          id="user-senha"
          type="password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          autoComplete="new-password"
          minLength={6}
          required
          aria-required="true"
        />
      </div>
      <div className="form-row">
        <label htmlFor="user-confirmar-senha">Confirmar senha</label>
        <input
          id="user-confirmar-senha"
          type="password"
          value={confirmarSenha}
          onChange={(e) => setConfirmarSenha(e.target.value)}
          autoComplete="new-password"
          minLength={6}
          required
          aria-required="true"
          aria-invalid={confirmarSenha.length > 0 && senha !== confirmarSenha}
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
