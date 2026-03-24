import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Login.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setErro('');
    if (!email.trim() || !senha) {
      setErro('Preencha e-mail e senha.');
      return;
    }
    if (login(email.trim(), senha)) {
      navigate('/', { replace: true });
    } else {
      setErro('E-mail ou senha incorretos. Tente novamente.');
    }
  };

  return (
    <div className="login-page" role="main">
      <div className="login-card">
        <h1 id="login-title">Dália Ateliê de Noivas</h1>
        <p className="login-sub">Sistema de gestão – faça login com suas credenciais</p>

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

          <button type="submit" className="btn-primary">
            Entrar
          </button>
        </form>

        <p className="login-hint">
          Demonstração: admin@dalia.com.br / admin123
        </p>
      </div>
    </div>
  );
}
