import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DataProvider, useData } from './contexts/DataContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Clientes from './pages/Clientes';
import Acervo from './pages/Acervo';
import AcervoDetalhe from './pages/AcervoDetalhe';
import Pedidos from './pages/Pedidos';
import Agenda from './pages/Agenda';
import Costureiras from './pages/Costureiras';
import Relatorios from './pages/Relatorios';
import Configuracoes from './pages/Configuracoes';
import Promissoria from './pages/Promissoria';

function LoadingScreen({ msg }: { msg: string }) {
  return (
    <div className="app-loading" role="status">
      <p>{msg}</p>
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, authReady } = useAuth();
  const { ready, loading } = useData();
  if (!authReady) return <LoadingScreen msg="Verificando sessão…" />;
  if (!user) return <Navigate to="/login" replace />;
  if (!ready || loading) return <LoadingScreen msg="Carregando dados…" />;
  return <Layout>{children}</Layout>;
}

function LoginRoute() {
  const { user, authReady } = useAuth();
  if (!authReady) return <LoadingScreen msg="Verificando sessão…" />;
  if (user) return <Navigate to="/" replace />;
  return <Login />;
}

export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginRoute />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/clientes"
              element={
                <ProtectedRoute>
                  <Clientes />
                </ProtectedRoute>
              }
            />
            <Route
              path="/acervo"
              element={
                <ProtectedRoute>
                  <Acervo />
                </ProtectedRoute>
              }
            />
            <Route
              path="/acervo/:id"
              element={
                <ProtectedRoute>
                  <AcervoDetalhe />
                </ProtectedRoute>
              }
            />
            <Route
              path="/pedidos"
              element={
                <ProtectedRoute>
                  <Pedidos />
                </ProtectedRoute>
              }
            />
            <Route
              path="/agenda"
              element={
                <ProtectedRoute>
                  <Agenda />
                </ProtectedRoute>
              }
            />
            <Route
              path="/costureiras"
              element={
                <ProtectedRoute>
                  <Costureiras />
                </ProtectedRoute>
              }
            />
            <Route
              path="/relatorios"
              element={
                <ProtectedRoute>
                  <Relatorios />
                </ProtectedRoute>
              }
            />
            <Route
              path="/configuracoes"
              element={
                <ProtectedRoute>
                  <Configuracoes />
                </ProtectedRoute>
              }
            />
            <Route
              path="/promissoria/:id"
              element={
                <ProtectedRoute>
                  <Promissoria />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </DataProvider>
    </AuthProvider>
  );
}
