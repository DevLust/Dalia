import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import UsuarioForm, { PAPEL_LABEL } from '../components/UsuarioForm';
import './Configuracoes.css';

export default function Configuracoes() {
  const { user, isAdmin } = useAuth();
  const { empresa, usuarios, salvarEmpresaConfig, criarUsuario, excluirUsuario } = useData();
  const [aba, setAba] = useState<'conta' | 'empresa' | 'seguranca' | 'usuarios'>('conta');
  const [nomeEmpresa, setNomeEmpresa] = useState(empresa.nomeEmpresa);
  const [enderecoEmpresa, setEnderecoEmpresa] = useState(empresa.enderecoEmpresa);
  const [msg, setMsg] = useState('');

  const handleSalvarEmpresa = async () => {
    await salvarEmpresaConfig({ nomeEmpresa, enderecoEmpresa });
    setMsg('Dados da empresa salvos.');
  };

  const handleCriarUsuario = async (input: Parameters<typeof criarUsuario>[1]) => {
    if (!user) return;
    await criarUsuario(user, input);
    setMsg('Usuário criado com sucesso.');
  };

  const handleRemoverUsuario = async (id: string) => {
    if (id === user?.id) {
      alert('Você não pode remover seu próprio usuário.');
      return;
    }
    if (confirm('Remover este usuário?')) {
      await excluirUsuario(id);
      setMsg('Usuário removido.');
    }
  };

  return (
    <div className="config-page">
      <header className="page-header">
        <h1 className="page-title">Configurações</h1>
        <p className="page-desc">Conta, empresa e usuários do sistema.</p>
      </header>

      <div className="config-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={aba === 'conta'}
          onClick={() => setAba('conta')}
          className={aba === 'conta' ? 'active' : ''}
        >
          Conta
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={aba === 'empresa'}
          onClick={() => setAba('empresa')}
          className={aba === 'empresa' ? 'active' : ''}
        >
          Empresa
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={aba === 'seguranca'}
          onClick={() => setAba('seguranca')}
          className={aba === 'seguranca' ? 'active' : ''}
        >
          Segurança
        </button>
        {isAdmin && (
          <button
            type="button"
            role="tab"
            aria-selected={aba === 'usuarios'}
            onClick={() => setAba('usuarios')}
            className={aba === 'usuarios' ? 'active' : ''}
          >
            Usuários
          </button>
        )}
      </div>

      <div className="config-panel">
        {msg && (
          <p className="config-msg" role="status">
            {msg}
          </p>
        )}

        {aba === 'conta' && (
          <section aria-label="Dados da conta">
            <p>
              <strong>Nome:</strong> {user?.nome}
            </p>
            <p>
              <strong>E-mail:</strong> {user?.email}
            </p>
            <p>
              <strong>Papel:</strong> {user?.papel ? PAPEL_LABEL[user.papel] ?? user.papel : ''}
            </p>
          </section>
        )}

        {aba === 'empresa' && (
          <section aria-label="Dados da empresa">
            <div className="form-row">
              <label htmlFor="empresa-nome">Nome da empresa</label>
              <input
                id="empresa-nome"
                value={nomeEmpresa}
                onChange={(e) => setNomeEmpresa(e.target.value)}
              />
            </div>
            <div className="form-row">
              <label htmlFor="empresa-end">Endereço</label>
              <input
                id="empresa-end"
                value={enderecoEmpresa}
                onChange={(e) => setEnderecoEmpresa(e.target.value)}
              />
            </div>
            <button type="button" className="btn-primary" onClick={() => void handleSalvarEmpresa()}>
              Salvar
            </button>
          </section>
        )}

        {aba === 'seguranca' && (
          <section aria-label="Segurança">
            <p>
              O login em produção usa <strong>Supabase Auth</strong> (senhas criptografadas).
              O administrador pode criar perfis de atendente e gerente na aba Usuários.
            </p>
            <p className="hint">
              Execute <code>docs/supabase-production.sql</code> no Supabase para políticas de
              segurança e vinculação de perfis.
            </p>
          </section>
        )}

        {aba === 'usuarios' && isAdmin && user && (
          <section aria-label="Gestão de usuários">
            <UsuarioForm onCriar={handleCriarUsuario} />

            <h3 className="usuarios-list-title">Equipe cadastrada</h3>
            <table className="tabela">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>E-mail</th>
                  <th>Papel</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((u) => (
                  <tr key={u.id}>
                    <td>{u.nome}</td>
                    <td>{u.email}</td>
                    <td>{PAPEL_LABEL[u.papel] ?? u.papel}</td>
                    <td>
                      {u.id !== user.id && u.papel !== 'administrador' && (
                        <button
                          type="button"
                          className="btn-sm danger"
                          onClick={() => void handleRemoverUsuario(u.id)}
                        >
                          Remover
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}
      </div>
    </div>
  );
}
