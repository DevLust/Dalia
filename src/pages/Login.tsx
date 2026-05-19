import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Login.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const { login, authLoading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErro('');
    if (!email.trim() || !senha) {
      setErro('Preencha e-mail e senha.');
      return;
    }
    try {
      const ok = await login(email.trim(), senha);
      if (ok) navigate('/', { replace: true });
      else setErro('E-mail ou senha incorretos. Tente novamente.');
    } catch {
      setErro('Não foi possível conectar ao servidor. Verifique a configuração do Supabase.');
    }
  };

  return (
    <div className="login-page" role="main">
      <div className="login-shell">
        <aside className="login-visual" aria-hidden="true">
          <div className="login-visual-inner">
            <img
              src="/logo.jpeg"
              alt=""
              className="login-logo-hero"
            />
            <h1 className="login-brand-title">Dália</h1>
            <p className="login-brand-sub">ateliê de noivas</p>
            <p className="login-tagline">
              Gestão completa de clientes, acervo e pedidos com elegância.
            </p>
          </div>
        </aside>

        <div className="login-card">
          <img
            src="/logo.jpeg"
            alt="Dália Ateliê de Noivas"
            className="login-logo-mobile"
          />
          <h2 id="login-title" className="login-form-title">
            Bem-vinda de volta
          </h2>
          <p className="login-sub">Entre com suas credenciais para acessar o sistema</p>

          <form onSubmit={handleSubmit} noValidate aria-labelledby="login-title">
            <label htmlFor="login-email">E-mail</label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              aria-required="true"
              aria-invalid={!!erro}
              aria-describedby={erro ? 'login-erro' : undefined}
            />

            <label htmlFor="login-senha">Senha</label>
            <input
              id="login-senha"
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              autoComplete="current-password"
              required
              aria-required="true"
            />

            {erro && (
              <p id="login-erro" className="login-erro" role="alert">
                {erro}
              </p>
            )}

            <button type="submit" className="btn-primary" disabled={authLoading}>
              {authLoading ? 'Entrando…' : 'Entrar'}
            </button>
          </form>

          <p className="login-hint">Demonstração: admin@dalia.com.br / admin123</p>
        </div>
      </div>
    </div>
  );
}
