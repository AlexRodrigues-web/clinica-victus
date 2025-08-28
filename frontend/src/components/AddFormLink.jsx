// frontend/src/components/AddFormLink.jsx
import React, { useState } from 'react';
import api from '../services/api';

export default function AddFormLink() {
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [urlArquivo, setUrlArquivo] = useState('');
  const [tipo, setTipo] = useState('video');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validações básicas antes de enviar
    if (!titulo.trim() || !urlArquivo.trim()) {
      alert('Preencha título e URL corretamente.');
      return;
    }

    const payload = {
      titulo: titulo.trim(),
      descricao: descricao.trim(),
      url_arquivo: urlArquivo.trim(),
      tipo,
      imagem_capa: '' // Opcional
    };

    try {
      setLoading(true);

     const resposta = await api.post('biblioteca/adicionar', payload);


      console.log('Resposta da API:', resposta.data);

      if (resposta.data?.sucesso) {
        alert('✅ Conteúdo adicionado com sucesso!');
        // Limpa campos
        setTitulo('');
        setDescricao('');
        setUrlArquivo('');
        setTipo('video');
      } else if (resposta.data?.erro) {
        alert(`⚠️ ${resposta.data.erro}`);
      } else {
        alert('❌ Erro inesperado ao adicionar conteúdo.');
      }
    } catch (error) {
      console.error('🚨 Erro na API:', error);

      if (error.response) {
        // Erro retornado pelo backend
        alert(`❌ Erro ${error.response.status}: ${error.response.data.erro || 'Falha no servidor'}`);
      } else if (error.request) {
        // Nenhuma resposta do servidor
        alert('❌ Falha de conexão com o servidor.');
      } else {
        // Erro na configuração do Axios
        alert('❌ Erro interno ao enviar o pedido.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3>Adicionar por Link</h3>

      <input
        type="text"
        placeholder="Título"
        value={titulo}
        onChange={e => setTitulo(e.target.value)}
        required
      />

      <textarea
        placeholder="Descrição"
        value={descricao}
        onChange={e => setDescricao(e.target.value)}
      />

      <input
        type="url"
        placeholder="URL do vídeo ou PDF"
        value={urlArquivo}
        onChange={e => setUrlArquivo(e.target.value)}
        required
      />

      <select value={tipo} onChange={e => setTipo(e.target.value)}>
        <option value="video">Vídeo</option>
        <option value="pdf">PDF</option>
      </select>

      <button type="submit" disabled={loading}>
        {loading ? 'Enviando...' : 'Enviar'}
      </button>
    </form>
  );
}
