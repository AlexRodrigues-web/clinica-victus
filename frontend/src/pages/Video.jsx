// src/pages/Video.jsx
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState, useMemo, useContext, useRef } from 'react';
import {
  FaPlayCircle,
  FaRegCommentDots,
  FaRegStickyNote,
  FaRegFileAlt,
  FaCheckCircle,
  FaRegStar,
  FaStar,
  FaHeart
} from 'react-icons/fa';
import './Video.css';
import api, { getPrefs, setPrefs, DEFAULT_VIDEO_PREFS } from '../services/api';
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

// === chaves de storage ===
const LS_KEY = (bib, uid) => `cv:video:prefs:${bib}:${uid}`;
const MAP_B2C_KEY = (bib) => `cv:b2c:${bib}`;         // biblioteca -> curso
const LAST_CURSO_KEY = `cv:aulas:lastCurso`;          // último curso válido global

// ===== CURSO PADRÃO (fallback) =====
const FALLBACK_CURSO_ID = 6;

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
  const [cursoResolvido, setCursoResolvido] = useState(null); // ex.: 19 -> 6

  // Sempre guarda o último curso válido (≠ do vídeo) para navegações futuras
  const lastGoodCursoIdRef = useRef(null);

  // usa o user logado quando houver
  const finalUsuarioId = usuario?.id || usuarioId;

  // debug só se ?debug=1 e não for produção
  const search = new URLSearchParams(location.search);
  const debugMode = search.get('debug') === '1' && process.env.NODE_ENV !== 'production';

  // === preferências persistentes (backend + cache local) ===
  const [prefs, setPrefsState] = useState(DEFAULT_VIDEO_PREFS);
  const [savingPrefs, setSavingPrefs] = useState(false);

  // utilitários de storage
  const readB2C = (bib) => {
    try { return Number(sessionStorage.getItem(MAP_B2C_KEY(bib))) || null; } catch { return null; }
  };
  const writeB2C = (bib, curso) => {
    try { sessionStorage.setItem(MAP_B2C_KEY(bib), String(curso)); } catch {}
  };
  const readLastCurso = () => {
    try { return Number(sessionStorage.getItem(LAST_CURSO_KEY)) || null; } catch { return null; }
  };
  const writeLastCurso = (curso) => {
    try { sessionStorage.setItem(LAST_CURSO_KEY, String(curso)); } catch {}
  };

  // semente inicial do ref a partir do cache (antes de chamar API)
  useEffect(() => {
    const bibNum = Number(bibliotecaId) || 0;
    const cached = readB2C(bibNum) || readLastCurso();
    if (cached && cached !== bibNum) {
      lastGoodCursoIdRef.current = cached;
      if (debugMode) console.debug('[Video.jsx] seed lastGoodCursoIdRef from cache:', cached);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bibliotecaId]);

  // carrega prefs do backend (com fallback ao cache local)
  useEffect(() => {
    let cancel = false;
    async function loadPrefs() {
      try {
        const data = await getPrefs(Number(bibliotecaId), Number(finalUsuarioId));
        if (!cancel) {
          const next = { favorite: !!data.favorite, liked: !!data.liked, completed: !!data.completed };
          setPrefsState(next);
          localStorage.setItem(LS_KEY(bibliotecaId, finalUsuarioId), JSON.stringify(next));
        }
      } catch (e) {
        console.error('[Video] Erro ao carregar prefs:', e);
        try {
          const raw = localStorage.getItem(LS_KEY(bibliotecaId, finalUsuarioId));
          setPrefsState(raw ? JSON.parse(raw) : DEFAULT_VIDEO_PREFS);
        } catch {
          setPrefsState(DEFAULT_VIDEO_PREFS);
        }
      }
    }
    loadPrefs();
    return () => { cancel = true; };
  }, [bibliotecaId, finalUsuarioId]);

  // togglers (otimistas)
  const persist = async (next) => {
    try { localStorage.setItem(LS_KEY(bibliotecaId, finalUsuarioId), JSON.stringify(next)); } catch {}
    try {
      setSavingPrefs(true);
      await setPrefs(Number(bibliotecaId), Number(finalUsuarioId), {
        favorite: next.favorite ? 1 : 0,
        liked: next.liked ? 1 : 0,
        completed: next.completed ? 1 : 0,
      });
    } catch (e) {
      console.error('[Video] Erro ao salvar prefs:', e);
    } finally {
      setSavingPrefs(false);
    }
  };

  const toggleFavorite = async () => {
    const next = { ...prefs, favorite: !prefs.favorite };
    setPrefsState(next);
    await persist(next);
  };
  const toggleLiked = async () => {
    const next = { ...prefs, liked: !prefs.liked };
    setPrefsState(next);
    await persist(next);
  };
  const toggleCompleted = async () => {
    const next = { ...prefs, completed: !prefs.completed };
    setPrefsState(next);
    await persist(next);
  };

  useEffect(() => {
    if (!isLoading && !isAuthenticated) navigate('/login');
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
      const bibNum = Number(bibliotecaId) || 0;
      try {
        setHasAulas(null);
        const params = debugMode ? { debug: 1 } : {};
        const r = await api.get(`aulas/tem/${bibliotecaId}`, { params });
        const tem = !!r.data?.tem;
        const resolved = Number(r.data?.curso_resolvido) || null;
        if (!cancel) {
          setHasAulas(tem);
          setCursoResolvido(resolved);

          // memorize se diferente do vídeo (válido)
          if (resolved && resolved !== bibNum) {
            lastGoodCursoIdRef.current = resolved;
            writeB2C(bibNum, resolved);
            writeLastCurso(resolved);
          }
          if (debugMode) console.debug('[Video.jsx] aulas/tem ->', { bibliotecaId, tem, curso_resolvido: resolved });
        }
      } catch (e) {
        if (!cancel) {
          setHasAulas(false);
          setCursoResolvido(null);
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

  // ==== Navegar SEMPRE para um curso válido (nunca pro ID da biblioteca) ====
  const resolveCursoAlvo = async () => {
    const bibIdNum = Number(bibliotecaId) || 0;

    // 0) cache primeiro
    let target = readB2C(bibIdNum);
    if (target && target !== bibIdNum) return target;

    // 1) ref em memória
    if (lastGoodCursoIdRef.current && lastGoodCursoIdRef.current !== bibIdNum) {
      return lastGoodCursoIdRef.current;
    }

    // 2) resolve on-demand
    try {
      const params = debugMode ? { debug: 1 } : {};
      const r = await api.get(`aulas/tem/${bibliotecaId}`, { params });
      const tem = !!r.data?.tem;
      const resolved = Number(r.data?.curso_resolvido) || 0;
      if (tem && resolved > 0 && resolved !== bibIdNum) {
        writeB2C(bibIdNum, resolved);
        writeLastCurso(resolved);
        lastGoodCursoIdRef.current = resolved;
        return resolved;
      }
    } catch (e) {
      console.error('[Video.jsx] resolveCursoAlvo — erro ao resolver curso:', e);
    }

    // 3) fallback final
    return FALLBACK_CURSO_ID;
  };

  const goToAulas = async () => {
    setIsPlaying(false);
    const alvo = await resolveCursoAlvo();
    // IMPORTANTE: sem ?from= para não haver lógica externa sobrescrevendo
    navigate(`/aulas/${alvo}/${finalUsuarioId}`);
  };

  // Voltar do header: volta para AULAS se houver contexto, senão para Biblioteca
  const goBackSmart = async () => {
    const bibIdNum = Number(bibliotecaId) || 0;
    const cached = readB2C(bibIdNum) || lastGoodCursoIdRef.current || readLastCurso();
    if (cached && cached !== bibIdNum) {
      navigate(`/aulas/${cached}/${finalUsuarioId}`);
    } else {
      navigate('/biblioteca');
    }
  };

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
          onClick={goBackSmart}
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

          {/* Ações persistentes */}
          <div className="action-icons">
            <button
              aria-label={prefs.favorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
              className={`icon-btn ${prefs.favorite ? 'active' : ''}`}
              onClick={toggleFavorite}
              aria-pressed={prefs.favorite}
              title={prefs.favorite ? 'Remover dos favoritos' : 'Favoritar'}
              disabled={savingPrefs}
            >
              {prefs.favorite ? <FaStar /> : <FaRegStar />}
            </button>

            <button
              aria-label={prefs.liked ? 'Remover curtida' : 'Curtir'}
              className={`icon-btn ${prefs.liked ? 'active' : ''}`}
              onClick={toggleLiked}
              aria-pressed={prefs.liked}
              title={prefs.liked ? 'Remover curtida' : 'Curtir'}
              disabled={savingPrefs}
            >
              <FaHeart />
            </button>

            <button
              aria-label={prefs.completed ? 'Desmarcar concluído' : 'Marcar como concluído'}
              className={`icon-btn completed ${prefs.completed ? 'active' : ''}`}
              onClick={toggleCompleted}
              aria-pressed={prefs.completed}
              title={prefs.completed ? 'Concluído' : 'Marcar como concluído'}
              disabled={savingPrefs}
            >
              <FaCheckCircle />
            </button>
          </div>
        </div>
      </section>

      {/* Footer com navegação para as seções */}
      <footer className="video-footer">
        <div className="footer-item" onClick={goToAulas} title="Aulas">
          <FaPlayCircle size={20} />
          <div className="footer-label">Aulas</div>
        </div>

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
