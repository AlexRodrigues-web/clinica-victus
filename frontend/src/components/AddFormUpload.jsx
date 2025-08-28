import React, { useState, useRef } from 'react';

export default function AddFormUpload() {
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [arquivo, setArquivo] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const inputFileRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!arquivo) {
      alert('Selecione um vídeo para enviar.');
      return;
    }

    if (!arquivo.type.startsWith('video/')) {
      alert('Envie apenas arquivos de vídeo.');
      return;
    }

    const formData = new FormData();
    formData.append('titulo', titulo);
    formData.append('descricao', descricao);
    formData.append('tipo', 'video'); // fixo: apenas vídeo
    formData.append('arquivo', arquivo);

    setCarregando(true);

    try {
      const resposta = await fetch('http://localhost/backend/index.php?rota=biblioteca/adicionar', {
        method: 'POST',
        body: formData
      });

      const json = await resposta.json();

      if (json.sucesso) {
        alert('✅ Vídeo enviado com sucesso!');
        setTitulo('');
        setDescricao('');
        setArquivo(null);
        if (inputFileRef.current) inputFileRef.current.value = '';
      } else {
        alert('❌ ' + (json.erro || 'Erro ao enviar vídeo.'));
      }
    } catch (erro) {
      console.error('Erro ao enviar:', erro);
      alert('⚠️ Erro de rede. Verifique se o backend está ativo em http://localhost/backend/');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="upload-form" encType="multipart/form-data">
      <h2 className="upload-title">📤 Upload de Vídeo</h2>

      <input
        type="text"
        placeholder="Título"
        value={titulo}
        onChange={e => setTitulo(e.target.value)}
        required
        className="upload-input"
      />

      <textarea
        placeholder="Descrição (opcional)"
        value={descricao}
        onChange={e => setDescricao(e.target.value)}
        className="upload-textarea"
      />

      {/* apenas vídeo */}
      <input
        type="file"
        accept="video/*"
        onChange={e => setArquivo(e.target.files[0])}
        ref={inputFileRef}
        required
        className="upload-file"
      />

      {arquivo && (
        <p className="upload-filename">📎 Vídeo: <strong>{arquivo.name}</strong></p>
      )}

      <button type="submit" className="upload-button" disabled={carregando}>
        {carregando ? '⏳ Enviando...' : '🚀 Enviar'}
      </button>
    </form>
  );
}
