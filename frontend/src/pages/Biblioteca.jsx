import { useEffect, useState, useContext, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';
import api from '../services/api';
import { AuthContext } from '../contexts/AuthContext';
import './Biblioteca.css';

// ==== Helpers YouTube (adições MINIMAS) ====
function extractYouTubeId(rawUrl = '') {
  if (!rawUrl) return null;
  try {
    const url = new URL(rawUrl);
    const host = url.hostname.replace(/^www\./, '');

    // youtube.com/watch?v=XXXX
    if ((host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtube-nocookie.com') && url.pathname === '/watch') {
      const v = url.searchParams.get('v');
      return v && v.length === 11 ? v : null;
    }

    // youtu.be/XXXX
    if (host === 'youtu.be') {
      const id = url.pathname.split('/')[1];
      return id && id.length === 11 ? id : null;
    }

    // youtube.com/embed/XXXX | youtube-nocookie.com/embed/XXXX
    if ((host === 'youtube.com' || host === 'youtube-nocookie.com') && url.pathname.startsWith('/embed/')) {
      const id = url.pathname.split('/')[2];
      return id && id.length === 11 ? id : null;
    }

    // youtube.com/shorts/XXXX
    if (host === 'youtube.com' && url.pathname.startsWith('/shorts/')) {
      const id = url.pathname.split('/')[2];
      return id && id.length === 11 ? id : null;
    }

    // youtube.com/live/XXXX
    if (host === 'youtube.com' && url.pathname.startsWith('/live/')) {
      const id = url.pathname.split('/')[2];
      return id && id.length === 11 ? id : null;
    }

    return null;
  } catch {
    // fallback p/ URLs sem protocolo ou texto solto
    const s = rawUrl.trim();
    const mWatch = s.match(/[?&]v=([\w-]{11})/);
    if (mWatch) return mWatch[1];
    const mShort = s.match(/youtu\.be\/([\w-]{11})/);
    if (mShort) return mShort[1];
    const mEmbed = s.match(/embed\/([\w-]{11})/);
    if (mEmbed) return mEmbed[1];
    const mShorts = s.match(/shorts\/([\w-]{11})/);
    if (mShorts) return mShorts[1];
    return null;
  }
}

function youTubeThumb(id) {
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : '';
}
// ===========================================

export default function Biblioteca() {
  const [itens, setItens] = useState([]);
  const [erro, setErro] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tipoSelecionado, setTipoSelecionado] = useState(null);
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    url: '',
    imagem: ''
  });
  const [carregando, setCarregando] = useState(false);
  const [submetendo, setSubmetendo] = useState(false);

  const { usuario, isAuthenticated, isLoading } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isLoading, isAuthenticated, navigate]);

  const usuario_id = usuario?.id;

  const carregarBiblioteca = useCallback(async () => {
    try {
      setCarregando(true);
      const rota = usuario_id
        ? `biblioteca/progresso/${usuario_id}`
        : 'biblioteca';

      const resp = await api.get(rota, { params: { _ts: Date.now() } });

      if (resp.data?.sucesso) {
        setItens(resp.data.dados);
        setErro('');
      } else {
        setErro('Erro na resposta da API');
      }
    } catch (e) {
      console.error('Erro ao carregar biblioteca:', e);
      setErro('Erro ao carregar biblioteca');
    } finally {
      setCarregando(false);
    }
  }, [usuario_id]);

  useEffect(() => {
    if (isAuthenticated) {
      carregarBiblioteca();
    }
  }, [carregarBiblioteca, isAuthenticated]);

  const capasFixas = {
    'liberdade alimentar': 'https://yourdomain.com/capas/liberdade-alimentar.jpg',
    olimpo: 'https://yourdomain.com/capas/olimpo.jpg',
    joanaflix: 'https://joanapinho.com/wp-content/uploads/2024/07/capa-link-joanaflix-1-768x432.jpg',
    workshops: 'https://yourdomain.com/capas/workshops.jpg',
    masterclasses: 'https://yourdomain.com/capas/masterclasses.jpg',
    'desafio corpo & mente sã': 'https://yourdomain.com/capas/desafio-corpo-mente-sa.jpg'
  };
  const descricoesFixas = {
    'liberdade alimentar': 'Programa de Libertação Alimentar em 8 Semanas.',
    olimpo: 'Corpo e mente invencíveis.',
    joanaflix: 'Desvenda o poder da nutrição\ncom aulas didáticas.',
    workshops: 'Conteúdos exclusivos e dinâmicos.',
    masterclasses: 'Masterclasses com especialistas.',
    'desafio corpo & mente sã': 'Desafio para transformar corpo e mente.'
  };

  // === Ajuste pontual: geração de capa robusta ===
  const gerarImagemCapa = (item) => {
    const key = item.titulo?.trim().toLowerCase();
    if (key && capasFixas[key]) return capasFixas[key];
    if (item.imagem_capa) return item.imagem_capa;

    const url = item.url_arquivo || item.url_video || '';

    // PDF explícito
    if (/\.(pdf)$/i.test(url)) return '/pdf-icon.png';

    // Tenta extrair ID do YouTube
    const id = extractYouTubeId(url);
    if (id) return youTubeThumb(id);

    return '/placeholder.jpg';
  };

  const gerarDescricao = (item) => {
    const key = item.titulo?.trim().toLowerCase();
    if (item.progresso === 0 && key && descricoesFixas[key]) {
      return descricoesFixas[key];
    }
    return item.descricao || '';
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((fd) => ({ ...fd, [name]: value }));
  };

  const validarYoutubeUrl = (url) => {
    const id = extractYouTubeId(url);
    return !!id;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!tipoSelecionado) {
      alert('Escolha primeiro se é vídeo ou PDF.');
      return;
    }
    if (!formData.titulo.trim() || !formData.url.trim()) {
      alert('Título e URL são obrigatórios.');
      return;
    }

    if (tipoSelecionado === 'video' && !validarYoutubeUrl(formData.url)) {
      alert('Insira um link válido do YouTube.');
      return;
    }

    const payload = {
      titulo: formData.titulo.trim(),
      descricao: formData.descricao.trim(),
      url_arquivo: formData.url.trim(),
      imagem_capa: formData.imagem.trim(),
      tipo: tipoSelecionado
    };

    try {
      setSubmetendo(true);
      const resposta = await api.post('biblioteca/adicionar', payload);

      if (resposta.data?.sucesso) {
        alert('✅ Conteúdo adicionado com sucesso!');

        if (resposta.data.dados && resposta.data.dados.id) {
          setItens((prev) => [
            { ...resposta.data.dados, progresso: 0 },
            ...prev
          ]);
        } else {
          await carregarBiblioteca();
        }

        setFormData({ titulo: '', descricao: '', url: '', imagem: '' });
        setTipoSelecionado(null);
        setIsModalOpen(false);
      } else {
        alert(resposta.data?.erro || 'Erro ao adicionar conteúdo');
      }
    } catch (err) {
      console.error('Erro no submit:', err);
      alert('Erro de conexão com o servidor.');
    } finally {
      setSubmetendo(false);
    }
  };

  const abrirModal = () => {
    setTipoSelecionado(null);
    setFormData({ titulo: '', descricao: '', url: '', imagem: '' });
    setIsModalOpen(true);
  };

  const fecharModal = () => {
    setIsModalOpen(false);
    setTipoSelecionado(null);
  };

  return (
    <>
      <main className="biblioteca-app">
        <h2 className="titulo-biblioteca">Biblioteca</h2>
        {erro && <p className="erro">{erro}</p>}
        {carregando && <p className="info">Carregando...</p>}

        <div className="lista-itens">
          {itens.map((item) => {
            const destino = `/videos/${item.id}/${usuario_id || 'guest'}`;
            return (
              <Link key={item.id} to={destino} className="item-biblioteca">
                <img
                  className="imagem-item"
                  src={gerarImagemCapa(item)}
                  alt={item.titulo}
                  onError={(e) => { e.currentTarget.src = '/placeholder.jpg'; }}
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
                    <p className="descricao-item">{gerarDescricao(item)}</p>
                  )}
                </div>
              </Link>
            );
          })}
          {itens.length === 0 && !carregando && (
            <p className="vazio">Nenhum conteúdo disponível.</p>
          )}
        </div>
      </main>

      {isModalOpen && (
        <div className="modal-overlay" onClick={fecharModal}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <header className="modal-header">
              <h3>Adicionar Conteúdo</h3>
              <button aria-label="Fechar" onClick={fecharModal}>×</button>
            </header>

            <div className="modal-body">
              {!tipoSelecionado && (
                <div className="tipo-selecao">
                  <p>Selecione o tipo:</p>
                  <div className="botoes-tipo">
                    <button type="button" onClick={() => setTipoSelecionado('video')}>Vídeo</button>
                    <button type="button" onClick={() => setTipoSelecionado('pdf')}>PDF</button>
                  </div>
                </div>
              )}

              {tipoSelecionado && (
                <form onSubmit={handleSubmit} className="form-adicionar">
                  <p>Tipo: <strong>{tipoSelecionado === 'video' ? 'Vídeo' : 'PDF'}</strong></p>
                  <label>Título
                    <input name="titulo" value={formData.titulo} onChange={handleChange} required />
                  </label>
                  <label>Descrição
                    <textarea name="descricao" value={formData.descricao} onChange={handleChange} />
                  </label>
                  <label>URL
                    <input name="url" type="url" value={formData.url} onChange={handleChange} required />
                  </label>
                  <label>URL da capa (opcional)
                    <input name="imagem" type="url" value={formData.imagem} onChange={handleChange} />
                  </label>
                  <div className="actions">
                    <button type="submit" disabled={submetendo}>
                      {submetendo ? 'Salvando...' : 'Salvar'}
                    </button>
                    <button type="button" onClick={() => setTipoSelecionado(null)}>Voltar</button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      <Footer onPlusClick={abrirModal} />
    </>
  );
}
