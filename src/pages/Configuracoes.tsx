import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { store } from '../store';
import type { Usuario } from '../types';
import './Configuracoes.css';

export default function Configuracoes() {
  const { user, isAdmin } = useAuth();
  const [aba, setAba] = useState<'conta' | 'empresa' | 'seguranca' | 'usuarios'>('conta');
  const [nomeEmpresa, setNomeEmpresa] = useState('Dália Ateliê de Noivas');
  const [enderecoEmpresa, setEnderecoEmpresa] = useState('Rua Alberto Giovanini, nº 222, Betânia, Ipatinga - MG');
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);

  useEffect(() => {
    setUsuarios(store.usuarios);
  }, []);

  useEffect(() => {
    try {
      const s = localStorage.getItem('dalia_empresa');
      if (s) {
        const data = JSON.parse(s);
        if (data.nomeEmpresa) setNomeEmpresa(data.nomeEmpresa);
        if (data.enderecoEmpresa) setEnderecoEmpresa(data.enderecoEmpresa);
      }
    } catch (_) {}
  }, []);

  const handleSalvarEmpresa = () => {
    localStorage.setItem('dalia_empresa', JSON.stringify({ nomeEmpresa, enderecoEmpresa }));
    alert('Dados da empresa salvos.');
  };

  const handleRemoverUsuario = (id: string) => {
    if (id === user?.id) {
      alert('Você não pode remover seu próprio usuário.');
      return;
    }
    if (confirm('Remover este usuário?')) {
      store.usuarios = store.usuarios.filter((u) => u.id !== id);
      setUsuarios([...store.usuarios]);
    }
  };

  return (
    <div className="config-page">
      <h1 className="page-title">Configurações</h1>
      <p className="page-desc">
        Alteração de informações da conta, da empresa e de segurança.
      </p>

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
        {aba === 'conta' && (
          <section aria-label="Dados da conta">
            <p><strong>Nome:</strong> {user?.nome}</p>
            <p><strong>E-mail:</strong> {user?.email}</p>
            <p><strong>Papel:</strong> {user?.papel}</p>
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
            <button type="button" className="btn-primary" onClick={handleSalvarEmpresa}>
              Salvar
            </button>
          </section>
        )}

        {aba === 'seguranca' && (
          <section aria-label="Segurança">
            <p>Alteração de senha e opções de segurança podem ser implementadas aqui.</p>
          </section>
        )}

        {aba === 'usuarios' && isAdmin && (
          <section aria-label="Gestão de usuários">
            <p className="hint">O administrador pode adicionar ou remover usuários do sistema (RF009).</p>
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
                    <td>{u.papel}</td>
                    <td>
                      {u.id !== user?.id && (
                        <button
                          type="button"
                          className="btn-sm danger"
                          onClick={() => handleRemoverUsuario(u.id)}
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
