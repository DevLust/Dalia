import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Layout.css';

const MENU = [
  { to: '/', label: 'Painel', icon: '📊', desc: 'Abre o Painel' },
  { to: '/pedidos', label: 'Pedidos', icon: '📋', desc: 'Página de pedidos' },
  { to: '/clientes', label: 'Clientes', icon: '👥', desc: 'Página de clientes' },
  { to: '/acervo', label: 'Acervo', icon: '👗', desc: 'Produtos no estoque' },
  { to: '/agenda', label: 'Agenda', icon: '📅', desc: 'Horários e cronograma' },
  { to: '/costureiras', label: 'Costureiras', icon: '✂️', desc: 'Ajustes e prioridades' },
  { to: '/relatorios', label: 'Relatórios', icon: '📈', desc: 'Relatórios e filtros' },
  { to: '/configuracoes', label: 'Configurações', icon: '⚙️', desc: 'Conta e segurança' },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [notifOpen, setNotifOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="layout">
      <aside className={`sidebar ${menuOpen ? 'open' : ''}`} aria-label="Menu principal">
        <nav>
          {MENU.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={location.pathname === item.to ? 'active' : ''}
              aria-current={location.pathname === item.to ? 'page' : undefined}
              title={item.desc}
              onClick={() => setMenuOpen(false)}
            >
              <span className="icon" aria-hidden="true">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
          <button
            type="button"
            className="sair"
            onClick={handleLogout}
            title="Sair da aplicação"
            aria-label="Sair da aplicação"
          >
            <span className="icon" aria-hidden="true">🚪</span>
            <span>Sair</span>
          </button>
        </nav>
      </aside>

      <div className="main-wrap">
        <header className="topbar" role="banner">
          <button
            type="button"
            className="menu-toggle"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={menuOpen}
          >
            ☰
          </button>
          <Link to="/" className="logo-link" title="Retorna ao painel">
            Dália Ateliê
          </Link>
          <div className="topbar-right">
            <div className="notif-wrap">
              <button
                type="button"
                className="notif-btn"
                onClick={() => setNotifOpen((o) => !o)}
                aria-label="Mostrar notificações"
                aria-expanded={notifOpen}
                title="Notificações"
              >
                🔔
              </button>
              {notifOpen && (
                <div className="notif-dropdown" role="menu">
                  <p className="notif-title">Notificações</p>
                  <p className="notif-empty">Nenhuma notificação recente.</p>
                </div>
              )}
            </div>
            <span className="user-id" title="Usuário ativo">
              {user?.nome ?? 'Usuário'}
            </span>
          </div>
        </header>

        <main className="container-principal" id="main-content">
          {children}
        </main>
      </div>
    </div>
  );
}
