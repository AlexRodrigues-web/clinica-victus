// frontend/src/pages/Biblioteca.jsx
import { useEffect, useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import Footer from '../components/Footer';
import AddModal from '../components/AddModal';
import api from '../services/api';
import { AuthContext } from '../contexts/AuthContext';
import './Biblioteca.css';

export default function Biblioteca() {
  const [itens, setItens] = useState([]);
  const [erro, setErro] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addType, setAddType] = useState(null);
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    url: '',
    imagem: ''
  });

  const { usuario } = useContext(AuthContext);
  const usuario_id = usuario?.id;

  // carrega a biblioteca (com progresso se possível)
  const carregarBiblioteca = async () => {
    try {
      const rota = usuario_id
        ? `biblioteca/progresso/${usuario_id}`
        : 'biblioteca';
      const resp = await api.get(rota);
      if (resp.data?.sucesso) {
        setItens(resp.data.dados);
        setErro('');
      } else {
        setErro('Erro na resposta da API');
      }
    } catch (e) {
      console.error(e);
      setErro('Erro ao carregar biblioteca');
    }
  };

  useEffect(() => {
    carregarBiblioteca();
  }, [usuario_id]);

  // mapas fixos de capas e descrições
  const capasFixas = {
    'liberdade alimentar': 'https://yourdomain.com/capas/liberdade-alimentar.jpg',
    olimpo:                'https://yourdomain.com/capas/olimpo.jpg',
    joanaflix:             'https://joanapinho.com/wp-content/uploads/2024/07/capa-link-joanaflix-1-768x432.jpg',
    workshops:             'https://yourdomain.com/capas/workshops.jpg',
    masterclasses:         'https://yourdomain.com/capas/masterclasses.jpg',
    'desafio corpo & mente sã': 'https://yourdomain.com/capas/desafio-corpo-mente-sa.jpg'
  };
  const descricoesFixas = {
    'liberdade alimentar': 'Programa de Libertação Alimentar em 8 Semanas.',
    olimpo:                'Corpo e mente invencíveis.',
    joanaflix:             'Desvenda o poder da nutrição\ncom aulas didáticas.',
    workshops:             'Lorem Ipsum is simply d text\nLorem Ipsum is simply d text',
    masterclasses:         'Lorem Ipsum is simply d text\nLorem Ipsum is simply d text',
    'desafio corpo & mente sã': 'Lorem Ipsum is simply d text\nLorem Ipsum is simply d text'
  };

  // gera thumbnail
  const gerarImagemCapa = item => {
    const key = item.titulo.trim().toLowerCase();
    if (capasFixas[key]) return capasFixas[key];
    if (item.imagem_capa) return item.imagem_capa;
    const url = item.url_arquivo || item.url_video || '';
    if (url.includes('watch?v=') || url.includes('youtu.be')) {
      const id = url.includes('watch?v=')
        ? url.split('watch?v=')[1].split('&')[0]
        : url.split('youtu.be/')[1].split('?')[0];
      return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
    }
    if (url.endsWith('.pdf')) return '/pdf-icon.png';
    return '/placeholder.jpg';
  };

  // gera descrição
  const gerarDescricao = item => {
    const key = item.titulo.trim().toLowerCase();
    if (item.progresso === 0 && descricoesFixas[key]) {
      return descricoesFixas[key];
    }
    return item.descricao || '';
  };

  // abre o modal de escolha
  const handleSelecionar = tipo => {
    setAddType(tipo);
    setIsAddOpen(false);
    setFormData({ titulo: '', descricao: '', url: '', imagem: '' });
  };

  // controla inputs do formulário inline
  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(fd => ({ ...fd, [name]: value }));
  };

  // submete novo item
  const handleSubmit = async e => {
    e.preventDefault();
    try {
      await api.post('biblioteca/adicionar', {
        titulo: formData.titulo,
        descricao: formData.descricao,
        url_arquivo: formData.url,       // nota: API espera url_arquivo
        imagem_capa: formData.imagem,
        tipo: addType
      });
      await carregarBiblioteca();
      setAddType(null);
    } catch (e) {
      console.error('Falha ao adicionar:', e);
      alert('Erro ao adicionar conteúdo');
    }
  };

  return (
    <>
      <main className="biblioteca-app">
        <h2 className="titulo-biblioteca">Biblioteca</h2>
        {erro && <p className="erro">{erro}</p>}

        <div className="lista-itens">
          {itens.map(item => (
            <Link
              key={item.id}
              to={`/videos/${item.id}/${usuario_id}`}
              className="item-biblioteca"
            >
              <img
                className="imagem-item"
                src={gerarImagemCapa(item)}
                alt={item.titulo}
              />
              <div className="info-item">
                <div className="topo-item">
                  <h3 className="titulo-item">{item.titulo}</h3>
                  {item.progresso > 0 && (
                    <div className="barra-progresso">
                      <div
                        className="barra-preenchida"
                        style={{ width: `${item.progresso}%` }}
                      />
                      <span className="porcentagem">{item.progresso}%</span>
                    </div>
                  )}
                </div>
                {item.progresso === 0 && (
                  <p className="descricao-item">
                    {gerarDescricao(item)}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </main>

      {/* Modal de escolha de tipo */}
      <AddModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSelecionar={handleSelecionar}
      />

      {/* Formulário inline de adição */}
      {addType && (
        <div className="add-inline-modal">
          <form className="add-inline-form" onSubmit={handleSubmit}>
            <h3>Adicionar {addType === 'video' ? 'Vídeo' : 'PDF'}</h3>
            <label>
              Título
              <input
                name="titulo"
                value={formData.titulo}
                onChange={handleChange}
                required
              />
            </label>
            <label>
              Descrição
              <textarea
                name="descricao"
                value={formData.descricao}
                onChange={handleChange}
                required
              />
            </label>
            <label>
              URL {addType === 'video' ? 'do Vídeo' : 'do PDF'}
              <input
                name="url"
                type="url"
                value={formData.url}
                onChange={handleChange}
                required
              />
            </label>
            <label>
              URL da Capa (opcional)
              <input
                name="imagem"
                type="url"
                value={formData.imagem}
                onChange={handleChange}
              />
            </label>
            <div className="add-inline-actions">
              <button type="submit">Salvar</button>
              <button type="button" onClick={() => setAddType(null)}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <Footer onPlusClick={() => setIsAddOpen(true)} />
    </>
  );
}
