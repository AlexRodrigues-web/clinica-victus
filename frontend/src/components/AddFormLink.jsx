// AddFormLink.jsx
import React, { useState } from 'react';

export default function AddFormLink() {
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [urlArquivo, setUrlArquivo] = useState('');
  const [tipo, setTipo] = useState('video');

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      titulo,
      descricao,
      url_arquivo: urlArquivo,
      tipo,
      imagem_capa: '' // Opcional
    };

    const resposta = await fetch('http://localhost/seu-projeto/biblioteca/adicionar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const json = await resposta.json();
    if (json.sucesso) {
      alert('Conteúdo adicionado com sucesso!');
    } else {
      alert(json.erro || 'Erro ao adicionar conteúdo.');
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

      <button type="submit">Enviar</button>
    </form>
  );
}
