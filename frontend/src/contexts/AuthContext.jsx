// src/contexts/AuthContext.jsx

import React, { createContext, useEffect, useState } from 'react'
import api from '../services/api'

export const AuthContext = createContext()

export function AuthProvider({ children }) {
  // inicializa token e usuário a partir do localStorage
  const [token, setToken] = useState(() => localStorage.getItem('token'))
  const [usuario, setUsuario] = useState(() => {
    const stored = localStorage.getItem('usuario')
    return stored ? JSON.parse(stored) : null
  })

  // sempre que o token mudar, atualiza header, storage e busca /perfil
  useEffect(() => {
    if (token) {
      // guarda token e configura header padrão
      localStorage.setItem('token', token)
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`

      // busca os dados completos do usuário (incluindo foto_perfil)
      api
        .get('perfil')
        .then(res => {
          setUsuario(res.data)
          localStorage.setItem('usuario', JSON.stringify(res.data))
        })
        .catch(() => {
          // se token inválido, desloga
          logout()
        })
    } else {
      // remove header e limpa storage e state
      delete api.defaults.headers.common['Authorization']
      localStorage.removeItem('token')
      localStorage.removeItem('usuario')
      setUsuario(null)
    }
  }, [token])

  // ao logar, salva token e dados iniciais—o useEffect fará o resto
  const login = (dadosUsuario, novoToken) => {
    setUsuario(dadosUsuario)
    setToken(novoToken)
    localStorage.setItem('usuario', JSON.stringify(dadosUsuario))
    // o token será salvo e header definido pelo useEffect
  }

  // desloga limpando apenas o token (o useEffect limpa o restante)
  const logout = () => {
    setToken(null)
  }

  // atualiza user no context e no localStorage (ex: após trocar foto)
  const updateUsuario = novosDados => {
    setUsuario(novosDados)
    localStorage.setItem('usuario', JSON.stringify(novosDados))
  }

  return (
    <AuthContext.Provider
      value={{ usuario, token, login, logout, updateUsuario }}
    >
      {children}
    </AuthContext.Provider>
  )
}
