// frontend/src/pages/Perfil.jsx
import React, { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { motion } from 'framer-motion';
import {
  FaUserEdit,
  FaLock,
  FaBell,
  FaPowerOff,
  FaSave
} from 'react-icons/fa';
import { AuthContext } from '../contexts/AuthContext';
import './Perfil.css';

export default function Perfil() {
  // agora pegamos do contexto
  const { usuario: authUser, updateUsuario } = useContext(AuthContext);

  // estado local só para controlar o formulário
  const [usuario, setUsuario] = useState(null);
  const [form, setForm]       = useState({});

  // sempre que o contexto muda, atualiza o estado local
  useEffect(() => {
    if (authUser) {
      setUsuario(authUser);
      setForm(authUser);
    }
  }, [authUser]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('config.')) {
      const campo = name.split('.')[1];
      setForm(prev => ({
        ...prev,
        config: {
          ...prev.config,
          [campo]: campo === 'notificacoes' ? value === 'true' : value
        }
      }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const salvarAlteracoes = async () => {
    try {
      const { plano, ...dados } = form;
      await api.put('perfil', dados);
      alert('Dados atualizados com sucesso!');

      // propaga para o contexto também
      const atualizado = { ...usuario, ...dados };
      setUsuario(atualizado);
      updateUsuario(atualizado);
    } catch (err) {
      console.error('Erro ao salvar alterações', err);
      alert('Erro ao salvar alterações.');
    }
  };

  const handleFotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('foto_perfil', file);

    try {
      const res = await api.post('perfil', formData, {
        params: { acao: 'foto' },
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data?.foto_perfil) {
        // atualiza o estado local
        const atualizado = { ...usuario, foto_perfil: res.data.foto_perfil };
        setUsuario(atualizado);
        setForm(prev => ({ ...prev, foto_perfil: res.data.foto_perfil }));

        // **IMPORTANTE**: também atualiza o contexto
        updateUsuario(atualizado);

        alert('Foto atualizada com sucesso!');
      } else {
        throw new Error('Resposta inesperada do upload');
      }
    } catch (err) {
      console.error('Erro ao atualizar foto', err);
      alert('Erro ao atualizar foto.');
    }
  };

  if (!usuario) {
    return <p className="carregando">Carregando perfil...</p>;
  }

  // monta a URL completa da foto (ou usa avatar padrão)
  const fotoURL = usuario.foto_perfil
    ? `http://localhost/clinica-victus/backend/${usuario.foto_perfil}`
    : '/default-avatar.png';

  return (
    <motion.div
      className="perfil-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="perfil-header">
        <h2>Olá, {usuario.nome?.split(' ')[0]} 👋</h2>
        <p>Bem-vindo(a) ao seu painel de perfil</p>
      </div>

      <motion.div
        className="perfil-card"
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.3 }}
      >
        <div className="perfil-foto">
          <img src={fotoURL} alt="Foto de perfil" />
          <label className="botao-edit">
            <FaUserEdit /> Trocar Foto
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={handleFotoChange}
            />
          </label>
        </div>
      </motion.div>

      <motion.div className="perfil-grid">
        {/* Dados pessoais */}
        <motion.div className="card" whileHover={{ scale: 1.02 }}>
          <h3>👤 Dados Pessoais</h3>
          <input
            type="text"
            name="nome"
            value={form.nome || ''}
            onChange={handleChange}
            placeholder="Nome"
          />
          <select
            name="genero"
            value={form.genero || ''}
            onChange={handleChange}
          >
            <option value="">Gênero</option>
            <option value="Feminino">Feminino</option>
            <option value="Masculino">Masculino</option>
            <option value="Outro">Outro</option>
          </select>
          <input
            type="date"
            name="data_nascimento"
            value={form.data_nascimento || ''}
            onChange={handleChange}
          />
          <input
            type="text"
            name="telefone"
            value={form.telefone || ''}
            onChange={handleChange}
            placeholder="Telefone"
          />
          <input
            type="text"
            name="endereco"
            value={form.endereco || ''}
            onChange={handleChange}
            placeholder="Endereço"
          />
        </motion.div>

        {/* Conta */}
        <motion.div className="card" whileHover={{ scale: 1.02 }}>
          <h3><FaLock /> Conta</h3>
          <input
            type="email"
            name="email"
            value={form.email || ''}
            onChange={handleChange}
            placeholder="Email"
          />
          <p><strong>Cadastro:</strong> {usuario.dt_registro}</p>
        </motion.div>

        {/* Plano atual */}
        <motion.div className="card" whileHover={{ scale: 1.02 }}>
          <h3>🎯 Plano Atual</h3>
          <p><strong>Plano:</strong> {usuario.plano?.nome}</p>
          <p><strong>Objetivo:</strong> {usuario.plano?.objetivo}</p>
          <p><strong>Duração:</strong> {usuario.plano?.duracao}</p>
          <p><strong>Progresso:</strong> {usuario.plano?.progresso}%</p>
          <p style={{ fontStyle: 'italic', fontSize: '0.8rem' }}>
            * Esse plano é gerenciado pela clínica.
          </p>
        </motion.div>

        {/* Preferências */}
        <motion.div className="card" whileHover={{ scale: 1.02 }}>
          <h3><FaBell /> Preferências</h3>
          <select
            name="config.notificacoes"
            value={form.config?.notificacoes ? 'true' : 'false'}
            onChange={handleChange}
          >
            <option value="true">Notificações Ativas</option>
            <option value="false">Desativadas</option>
          </select>
          <select
            name="config.idioma"
            value={form.config?.idioma || ''}
            onChange={handleChange}
          >
            <option value="">Idioma</option>
            <option value="pt">Português</option>
            <option value="en">Inglês</option>
          </select>
        </motion.div>
      </motion.div>

      <div className="logout-area">
        <button className="botao-sair">
          <FaPowerOff /> Sair da Conta
        </button>
        <br/>
        <button className="botao-salvar" onClick={salvarAlteracoes}>
          <FaSave /> Salvar Alterações
        </button>
      </div>
    </motion.div>
  );
}
