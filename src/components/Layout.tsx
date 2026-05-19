import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import './Layout.css';

const MENU = [
  { to: '/', label: 'Painel', icon: '▦', desc: 'Painel' },
  { to: '/pedidos', label: 'Pedidos', icon: '🛍', desc: 'Pedidos' },
  { to: '/clientes', label: 'Clientes', icon: '👤', desc: 'Clientes' },
  { to: '/acervo', label: 'Acervo', icon: '📁', desc: 'Acervo' },
  { to: '/agenda', label: 'Agenda', icon: '📅', desc: 'Agenda' },
  { to: '/costureiras', label: 'Costureiras', icon: '✂', desc: 'Costureiras' },
  { to: '/relatorios', label: 'Relatórios', icon: '📊', desc: 'Relatórios' },
  { to: '/configuracoes', label: 'Configurações', icon: '⚙', desc: 'Configurações' },
];

const PAGE_NAMES: Record<string, string> = {
  '/': 'Painel',
  '/pedidos': 'Pedidos',
  '/clientes': 'Clientes',
  '/acervo': 'Acervo',
  '/agenda': 'Agenda',
  '/costureiras': 'Costureiras',
  '/relatorios': 'Relatórios',
  '/configuracoes': 'Configurações',
};

function getPageName(pathname: string) {
  if (pathname.startsWith('/promissoria')) return 'Promissória';
  return PAGE_NAMES[pathname] ?? 'Dália';
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { notificacoes, marcarNotificacao, error: dataError, pedidos, usingSupabase } =
    useData();
  const [notifOpen, setNotifOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const naoLidas = notificacoes.filter((n) => !n.lida);
  const pedidosPendentes = pedidos.filter(
    (p) => p.status === 'agendado' || p.status === 'em_atendimento'
  ).length;

  const pageName = getPageName(location.pathname);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const iniciais = user?.nome
    ?.split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() ?? '?';

  return (
    <div className="layout">
      <aside className={`sidebar ${menuOpen ? 'open' : ''}`} aria-label="Menu principal">
        <Link
          to="/"
          className="sidebar-brand"
          title="Dália Ateliê de Noivas"
          onClick={() => setMenuOpen(false)}
        >
          <img src="/logo.jpeg" alt="Dália Ateliê de Noivas" className="brand-logo" />
        </Link>
        <nav>
          {MENU.map((item) => {
            const active =
              location.pathname === item.to ||
              (item.to !== '/' && location.pathname.startsWith(item.to));
            return (
              <Link
                key={item.to}
                to={item.to}
                className={active ? 'active' : ''}
                aria-current={active ? 'page' : undefined}
                title={item.desc}
                onClick={() => setMenuOpen(false)}
              >
                <span className="nav-icon" aria-hidden="true">
                  {item.icon}
                </span>
                <span className="nav-label">{item.label}</span>
                {item.to === '/pedidos' && pedidosPendentes > 0 && (
                  <span className="nav-badge">{pedidosPendentes}</span>
                )}
              </Link>
            );
          })}
        </nav>
        <button
          type="button"
          className="sair"
          onClick={handleLogout}
          title="Sair da aplicação"
          aria-label="Sair da aplicação"
        >
          <span className="nav-icon" aria-hidden="true">
            ⎋
          </span>
          <span className="nav-label">Sair</span>
        </button>
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
          <div className="topbar-title-block">
            <img
              src="/logo.jpeg"
              alt=""
              className="topbar-logo"
              aria-hidden="true"
            />
            <nav className="breadcrumbs" aria-label="Navegação">
              <Link to="/">⌂</Link>
              <span className="bc-sep">/</span>
              <span>{pageName}</span>
            </nav>
          </div>
          <div className="topbar-right">
            <div className="notif-wrap">
              <button
                type="button"
                className="notif-btn"
                onClick={() => setNotifOpen((o) => !o)}
                aria-label="Notificações"
                aria-expanded={notifOpen}
              >
                🔔
                {naoLidas.length > 0 && <span className="notif-badge">{naoLidas.length}</span>}
              </button>
              {notifOpen && (
                <div className="notif-dropdown" role="menu">
                  <p className="notif-title">Notificações</p>
                  {dataError && (
                    <p className="notif-erro" role="alert">
                      {dataError}
                    </p>
                  )}
                  {notificacoes.length === 0 ? (
                    <p className="notif-empty">Nenhuma notificação recente.</p>
                  ) : (
                    <ul className="notif-list">
                      {notificacoes.slice(0, 8).map((n) => (
                        <li key={n.id} className={n.lida ? 'lida' : ''}>
                          <strong>{n.titulo}</strong>
                          <p>{n.mensagem}</p>
                          {!n.lida && (
                            <button
                              type="button"
                              className="btn-sm"
                              onClick={() => void marcarNotificacao(n.id)}
                            >
                              Marcar como lida
                            </button>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
            <div className="user-chip" title={user?.nome}>
              <span className="user-avatar">{iniciais}</span>
              <span className="user-name">{user?.nome?.split(' ')[0] ?? 'Usuário'}</span>
            </div>
          </div>
        </header>

        <main className="container-principal" id="main-content">
          {!usingSupabase && (
            <div className="db-warning" role="alert">
              <strong>Modo offline:</strong> os dados estão sendo salvos apenas neste navegador, não no
              Supabase. Configure <code>VITE_SUPABASE_URL</code> e <code>VITE_SUPABASE_ANON_KEY</code>{' '}
              na Vercel e faça um novo deploy.
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
