// frontend/src/pages/AddVideoForm.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './AddVideoForm.css'; // crie o CSS conforme desejar

export default function AddVideoForm({ recarregarBiblioteca }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    titulo: '',
    descricao: '',
    url: '',
    imagem: ''
  });
  const [erro, setErro] = useState('');

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setErro('');
    try {
      const body = {
        titulo: form.titulo,
        descricao: form.descricao,
        url_arquivo: form.url,      // lembre-se que no controller está esperando `url_arquivo`
        imagem_capa: form.imagem,
        tipo: 'video'
      };
      const res = await api.post('biblioteca/adicionar', body);
      if (res.data.sucesso) {
        // opcional: recarregar a lista (se você passar recarregarBiblioteca por prop)
        if (typeof recarregarBiblioteca === 'function') {
          recarregarBiblioteca();
        }
        // volta pra biblioteca
        navigate('/biblioteca');
      } else {
        console.error('Erro ao adicionar:', res.data);
        setErro('Não foi possível adicionar o vídeo.');
      }
    } catch (err) {
      console.error('Falha ao chamar API:', err);
      setErro('Erro de rede ao adicionar.');
    }
  };

  return (
    <main className="add-video-page">
      <h2>Adicionar Vídeo</h2>
      {erro && <p className="erro">{erro}</p>}
      <form onSubmit={handleSubmit} className="add-video-form">
        <label>
          Título*
          <input
            type="text"
            name="titulo"
            value={form.titulo}
            onChange={handleChange}
            required
          />
        </label>
        <label>
          Descrição
          <textarea
            name="descricao"
            value={form.descricao}
            onChange={handleChange}
          />
        </label>
        <label>
          URL do Vídeo*
          <input
            type="url"
            name="url"
            value={form.url}
            onChange={handleChange}
            placeholder="https://..."
            required
          />
        </label>
        <label>
          URL da Imagem de Capa
          <input
            type="url"
            name="imagem"
            value={form.imagem}
            onChange={handleChange}
            placeholder="https://...jpg"
          />
        </label>
        <button type="submit" className="btn-submit">Salvar Vídeo</button>
      </form>
    </main>
  );
}
