import React, { useState } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate
} from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Biblioteca from './pages/Biblioteca';
import Video from './pages/Video';
import Plano from './pages/Plano';
import Perfil from './pages/Perfil';
import PrivateRoute from './routes/PrivateRoute';

import AddModal from './components/AddModal';
import Footer from './components/Footer';
import AddVideoForm from './pages/AddVideoForm';

function AppContent() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleSelecionar = (tipo) => {
    setIsAddOpen(false);
    if (tipo === 'video') {
      navigate('/biblioteca/adicionar/video');
    } else if (tipo === 'pdf') {
      navigate('/biblioteca/adicionar/pdf');
    }
  };

  const hideFooter =
    location.pathname === '/login' ||
    location.pathname.startsWith('/videos/');

  return (
    <>
      {/* modal de adicionar */}
      <AddModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSelecionar={handleSelecionar}
      />

      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
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

        <Route
          path="/videos/:bibliotecaId/:usuarioId"
          element={
            <PrivateRoute>
              <Video />
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
      </Routes>

      {/* footer só aparece se NÃO for /login e NÃO for /videos/... */}
      {!hideFooter && (
        <Footer onPlusClick={() => setIsAddOpen(true)} />
      )}
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
