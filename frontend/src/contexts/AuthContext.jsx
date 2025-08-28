// src/contexts/AuthContext.jsx
import React, { createContext, useEffect, useState } from 'react';
import api from '../services/api';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [usuario, setUsuario] = useState(() => {
    const stored = localStorage.getItem('usuario');
    return stored ? JSON.parse(stored) : null;
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function initialize() {
      if (token) {
        // ✅ garante que o token sempre seja enviado
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        localStorage.setItem('token', token);

        try {
          // ✅ remove a barra para compatibilidade com backend
          const res = await api.get('perfil');
          const dados = res.data?.usuario || res.data;

          if (!cancelled && dados) {
            setUsuario(dados);
            localStorage.setItem('usuario', JSON.stringify(dados));
          }
        } catch (e) {
          console.warn('Token inválido ou erro ao buscar perfil', e);

          if (!cancelled && e.response?.status === 401) {
            // ✅ só desloga se for realmente não autorizado
            logout();
          }
        }
      } else {
        delete api.defaults.headers.common['Authorization'];
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        setUsuario(null);
      }

      if (!cancelled) setIsLoading(false);
    }

    initialize();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const login = (dadosUsuario, novoToken) => {
    const usuarioFormatado = dadosUsuario?.usuario || dadosUsuario;
    setUsuario(usuarioFormatado);
    setToken(novoToken);
    localStorage.setItem('usuario', JSON.stringify(usuarioFormatado));

    // ✅ define token no axios imediatamente após login
    api.defaults.headers.common['Authorization'] = `Bearer ${novoToken}`;
    localStorage.setItem('token', novoToken);
  };

  const logout = () => {
    setToken(null);
    setUsuario(null);
    delete api.defaults.headers.common['Authorization'];
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    setIsLoading(false);
  };

  const updateUsuario = (novosDados) => {
    setUsuario(novosDados);
    localStorage.setItem('usuario', JSON.stringify(novosDados));
  };

  const isAuthenticated = !!usuario;

  return (
    <AuthContext.Provider
      value={{
        usuario,
        token,
        login,
        logout,
        updateUsuario,
        isLoading,
        isAuthenticated
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
