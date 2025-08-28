// src/App.js
import React, { useState, useContext } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
  useParams
} from 'react-router-dom';
import { AuthProvider, AuthContext } from './contexts/AuthContext';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Biblioteca from './pages/Biblioteca';
import Video from './pages/Video';
import Aulas from './pages/Aulas';
import Plano from './pages/Plano';
import Perfil from './pages/Perfil';
import PrivateRoute from './routes/PrivateRoute';

import AddModal from './components/AddModal';
import Footer from './components/Footer';
import AddVideoForm from './pages/AddVideoForm';

//  novas páginas
import Comentarios from './pages/Comentarios';
import Anotacoes from './pages/Anotacoes';
import Materiais from './pages/Materiais';

function HomeRedirect() {
  const { isAuthenticated, isLoading } = useContext(AuthContext);
  if (isLoading) return <div style={{ padding: 20 }}>Carregando...</div>;
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />;
}

function VideoWithUserRedirect() {
  const { bibliotecaId } = useParams();
  const { usuario, isLoading } = useContext(AuthContext);
  const navigate = useNavigate();

  React.useEffect(() => {
    if (isLoading) return;
    if (!usuario?.id) {
      navigate('/login', { replace: true });
      return;
    }
    const to = `/videos/${bibliotecaId}/${usuario.id}`;
    console.debug('[App] VideoWithUserRedirect =>', to);
    navigate(to, { replace: true });
  }, [bibliotecaId, usuario, isLoading, navigate]);

  return <div style={{ padding: 20 }}>Redirecionando...</div>;
}

// Rota legada: mantém o mesmo bibliotecaId/usuarioId
function AulasRedirect() {
  const { bibliotecaId, usuarioId } = useParams();
  const to = `/aulas/${bibliotecaId}/${usuarioId}`;
  console.debug('[App] AulasRedirect =>', to);
  return <Navigate to={to} replace />;
}

function AppContent() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleSelecionar = (tipo) => {
    setIsAddOpen(false);
    if (tipo === 'video') navigate('/biblioteca/adicionar/video');
    else if (tipo === 'pdf') navigate('/biblioteca/adicionar/pdf');
  };

  // Oculta o Footer global em /videos/* e /aulas/*
  const hideFooter =
    location.pathname === '/login' ||
    location.pathname.startsWith('/videos/') ||
    location.pathname.startsWith('/aulas/');

  return (
    <>
      <AddModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSelecionar={handleSelecionar}
      />

      <Routes>
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/login" element={<Login />} />

        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />

        <Route
          path="/biblioteca"
          element={
            <PrivateRoute>
              <Biblioteca />
            </PrivateRoute>
          }
        />
        <Route
          path="/biblioteca/adicionar/video"
          element={
            <PrivateRoute>
              <AddVideoForm />
            </PrivateRoute>
          }
        />
        <Route
          path="/biblioteca/adicionar/pdf"
          element={
            <PrivateRoute>
              <div>Formulário de adicionar PDF (a implementar)</div>
            </PrivateRoute>
          }
        />

        {/* Vídeo da biblioteca */}
        <Route
          path="/videos/:bibliotecaId"
          element={
            <PrivateRoute>
              <VideoWithUserRedirect />
            </PrivateRoute>
          }
        />
        <Route
          path="/videos/:bibliotecaId/:usuarioId"
          element={
            <PrivateRoute>
              <Video />
            </PrivateRoute>
          }
        />

        {/* Aulas — rota fora de /videos, sem ID fixo */}
        <Route
          path="/aulas/:bibliotecaId/:usuarioId"
          element={
            <PrivateRoute>
              <Aulas />
            </PrivateRoute>
          }
        />

        {/* Compat: rota antiga redireciona preservando os params */}
        <Route
          path="/videos/:bibliotecaId/:usuarioId/aulas"
          element={
            <PrivateRoute>
              <AulasRedirect />
            </PrivateRoute>
          }
        />

        {/* Demais abas (seções do vídeo) */}
        <Route
          path="/videos/:bibliotecaId/:usuarioId/comentarios"
          element={
            <PrivateRoute>
              <Comentarios />
            </PrivateRoute>
          }
        />
        <Route
          path="/videos/:bibliotecaId/:usuarioId/anotacoes"
          element={
            <PrivateRoute>
              <Anotacoes />
            </PrivateRoute>
          }
        />
        <Route
          path="/videos/:bibliotecaId/:usuarioId/materiais"
          element={
            <PrivateRoute>
              <Materiais />
            </PrivateRoute>
          }
        />

        <Route
          path="/plano"
          element={
            <PrivateRoute>
              <Plano />
            </PrivateRoute>
          }
        />

        <Route
          path="/perfil"
          element={
            <PrivateRoute>
              <Perfil />
            </PrivateRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {!hideFooter && <Footer onPlusClick={() => setIsAddOpen(true)} />}
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  );
}
