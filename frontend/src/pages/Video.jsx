// src/pages/Video.jsx
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState, useMemo, useContext } from 'react';
import {
  FaPlayCircle,
  FaRegCommentDots,
  FaRegStickyNote,
  FaRegFileAlt,
  FaCheckCircle,
  FaRegStar,
  FaHeart
} from 'react-icons/fa';
import './Video.css';
import api from '../services/api';
import { AuthContext } from '../contexts/AuthContext';

// ==== Helpers YouTube (robustos) ====
function extractYouTubeId(rawUrl = '') {
  if (!rawUrl) return null;
  try {
    const url = new URL(rawUrl);
    const host = url.hostname.replace(/^www\./, '');
    if ((host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtube-nocookie.com') && url.pathname === '/watch') {
      const v = url.searchParams.get('v');
      return v && v.length === 11 ? v : null;
    }
    if (host === 'youtu.be') {
      const id = url.pathname.split('/')[1];
      return id && id.length === 11 ? id : null;
    }
    if ((host === 'youtube.com' || host === 'youtube-nocookie.com') && url.pathname.startsWith('/embed/')) {
      const id = url.pathname.split('/')[2];
      return id && id.length === 11 ? id : null;
    }
    if (host === 'youtube.com' && url.pathname.startsWith('/shorts/')) {
      const id = url.pathname.split('/')[2];
      return id && id.length === 11 ? id : null;
    }
    if (host === 'youtube.com' && url.pathname.startsWith('/live/')) {
      const id = url.pathname.split('/')[2];
      return id && id.length === 11 ? id : null;
    }
    return null;
  } catch {
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
function buildEmbedUrlFromRaw(url) {
  const id = extractYouTubeId(url);
  return id ? `https://www.youtube-nocookie.com/embed/${id}` : '';
}
function buildThumbnailFromRaw(url) {
  const id = extractYouTubeId(url);
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : '';
}
// =====================================

function pickVideoUrl(b = {}) {
  const candidates = [b.url_video, b.url_arquivo, b.url, b.link, b.video_url].filter(Boolean);
  return candidates.length ? String(candidates[0]) : '';
}

export default function Video() {
  const { bibliotecaId, usuarioId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { usuario, isAuthenticated, isLoading } = useContext(AuthContext);

  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [iframeErro, setIframeErro] = useState(false);

  // existe curso/aulas mapeadas?
  const [hasAulas, setHasAulas] = useState(null); // null=carregando
  const [cursoResolvido, setCursoResolvido] = useState(null); // ex.: 4 -> 6

  // usa o user logado quando houver
  const finalUsuarioId = usuario?.id || usuarioId;

  // debug só se ?debug=1 e não for produção
  const search = new URLSearchParams(location.search);
  const debugMode = search.get('debug') === '1' && process.env.NODE_ENV !== 'production';

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, isLoading, navigate]);

  // carrega os metadados do vídeo da BIBLIOTECA
  useEffect(() => {
    let cancel = false;
    async function carregarVideo() {
      try {
        setLoading(true);
        const res = await api.get(`video/detalhes/${bibliotecaId}/${finalUsuarioId}`);
        if (!res.data?.sucesso || !res.data?.biblioteca) {
          if (!cancel) setErro('Vídeo não encontrado.');
          return;
        }
        const b = res.data.biblioteca;
        const urlFonte = pickVideoUrl(b);
        if (!urlFonte) {
          if (!cancel) setErro('Não há URL de vídeo neste item.');
          return;
        }
        if (!cancel) {
          setVideo({
            titulo: b.titulo || 'Vídeo',
            descricao: b.descricao || '',
            url_video: urlFonte,
            embed_url: buildEmbedUrlFromRaw(urlFonte)
          });
        }
      } catch (e) {
        if (!cancel) setErro('Erro ao carregar o vídeo.');
      } finally {
        if (!cancel) setLoading(false);
      }
    }
    carregarVideo();
    return () => { cancel = true; };
  }, [bibliotecaId, finalUsuarioId]);

  // checa se existem AULAS para este bibliotecaId e captura o curso_resolvido
  useEffect(() => {
    let cancel = false;
    async function checarAulas() {
      try {
        setHasAulas(null);
        const params = debugMode ? { debug: 1 } : {};
        const r = await api.get(`aulas/tem/${bibliotecaId}`, { params });
        const tem = !!r.data?.tem;
        const resolved = Number(r.data?.curso_resolvido) || Number(bibliotecaId);
        if (!cancel) {
          setHasAulas(tem);
          setCursoResolvido(resolved);
          if (debugMode) console.debug('[Video.jsx] aulas/tem ->', { bibliotecaId, tem, curso_resolvido: resolved });
        }
      } catch (e) {
        if (!cancel) {
          setHasAulas(false);
          setCursoResolvido(Number(bibliotecaId) || null);
          if (debugMode) console.debug('[Video.jsx] aulas/tem ERROR ->', e?.message || e);
        }
      }
    }
    checarAulas();
    return () => { cancel = true; };
  }, [bibliotecaId, debugMode]);

  const embedUrl = useMemo(() => !video ? '' : (video.embed_url || buildEmbedUrlFromRaw(video.url_video)), [video]);
  const thumbnail = useMemo(() => !video ? '' : buildThumbnailFromRaw(video.url_video), [video]);

  // 🧹 CLEANUP — desmonta qualquer iframe quando SAIR da rota de vídeo
  useEffect(() => {
    return () => {
      try {
        const container = document.querySelector('.video-page');
        const iframes = container ? container.querySelectorAll('iframe') : document.querySelectorAll('.video-page iframe');
        iframes.forEach((el) => {
          try { el.src = 'about:blank'; } catch {}
          try { el.remove(); } catch {}
        });
      } catch {}
    };
  }, []);

  // bases das abas
  const aulasPath    = `/aulas/${(cursoResolvido ?? bibliotecaId)}/${finalUsuarioId}`; // usa curso_resolvido!
  const aulasQuery   = `?from=${encodeURIComponent(bibliotecaId)}`; // preserva origem (biblioteca)
  const commentsBase = `/videos/${bibliotecaId}/${finalUsuarioId}`;
  const isComentarios = location.pathname.startsWith(`${commentsBase}/comentarios`);
  const isAnotacoes   = location.pathname.startsWith(`${commentsBase}/anotacoes`);
  const isMateriais   = location.pathname.startsWith(`${commentsBase}/materiais`);

  if (loading) return <div className="video-loading">Carregando...</div>;
  if (erro) {
    return (
      <div className="video-error">
        <p>{erro}</p>
        <button onClick={() => navigate('/biblioteca')}>Voltar à Biblioteca</button>
      </div>
    );
  }
  if (!video) return <div className="video-loading">Carregando...</div>;

  return (
    <div className="video-page">
      <header className="video-header">
        <span
          className="header-back-btn"
          onClick={() => navigate('/biblioteca')}
          aria-label="Voltar"
        >
          ←
        </span>
        <div className="header-body">
          <h2 className="header-title">{video.titulo}</h2>
        </div>
      </header>

      <div className="video-player">
        {!isPlaying && thumbnail && (
          <div
            className="video-overlay"
            onClick={() => {
              setIsPlaying(true);
              setIframeErro(false);
            }}
            aria-label="Reproduzir vídeo"
          >
            <div
              className="thumbnail-bg"
              style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: `url(${thumbnail})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                filter: 'brightness(0.55)'
              }}
            />
            <FaPlayCircle size={64} color="#FFF" />
          </div>
        )}

        {embedUrl && !iframeErro ? (
          <iframe
            key={embedUrl + (isPlaying ? '?autoplay=1' : '')}
            src={isPlaying ? `${embedUrl}?autoplay=1&rel=0&modestbranding=1` : `${embedUrl}?rel=0&modestbranding=1`}
            title={video.titulo}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
            onError={() => setIframeErro(true)}
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
          />
        ) : (
          <div className="video-no-source">
            <p>Não foi possível carregar o player.</p>
          </div>
        )}
      </div>

      <section className="video-info">
        <div className="intro-section">
          <div className="intro-text">
            <h2 className="intro-title">{video.titulo}</h2>
            <p className="intro-description">{video.descricao}</p>
          </div>
          <div className="action-icons">
            <button aria-label="Favoritar" className="icon-btn"><FaRegStar /></button>
            <button aria-label="Curtir" className="icon-btn"><FaHeart /></button>
            <button aria-label="Concluído" className="icon-btn completed">
              <FaCheckCircle style={{ color: 'rgba(255,255,255,0.4)' }} />
            </button>
          </div>
        </div>
      </section>

      {/* Footer com navegação para as seções */}
<footer className="video-footer">
  {/* Só mostra Aulas se o backend disser que TEM */}
  {hasAulas === true && (
    <div
      className="footer-item"
      onClick={() => {
        // para o vídeo antes de sair
        setIsPlaying(false);
        const to = `${aulasPath}${aulasQuery}`;
        if (debugMode) console.debug('[Video.jsx] indo para Aulas:', to);
        navigate(to);
      }}
    >
      <FaPlayCircle size={20} />
      <div className="footer-label">Aulas</div>
    </div>
  )}

  <div
    className={`footer-item ${isComentarios ? 'active' : ''}`}
    onClick={() => {
      setIsPlaying(false);
      navigate(`${commentsBase}/comentarios`);
    }}
    aria-current={isComentarios ? 'page' : undefined}
  >
    <FaRegCommentDots size={20} />
    <div className="footer-label">Comentários</div>
  </div>

  <div
    className={`footer-item ${isAnotacoes ? 'active' : ''}`}
    onClick={() => {
      setIsPlaying(false);
      navigate(`${commentsBase}/anotacoes`);
    }}
    aria-current={isAnotacoes ? 'page' : undefined}
  >
    <FaRegStickyNote size={20} />
    <div className="footer-label">Anotações</div>
  </div>

  <div
    className={`footer-item ${isMateriais ? 'active' : ''}`}
    onClick={() => {
      setIsPlaying(false);
      navigate(`${commentsBase}/materiais`);
    }}
    aria-current={isMateriais ? 'page' : undefined}
  >
    <FaRegFileAlt size={20} />
    <div className="footer-label">Materiais</div>
  </div>
</footer>

    </div>
  );
}
