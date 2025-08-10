// src/pages/Aulas.jsx
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState, useCallback, useContext } from 'react';
import api from '../services/api';
import VideoLessons from '../components/VideoLessons';
import { FaPlayCircle, FaRegCommentDots, FaRegStickyNote, FaRegFileAlt } from 'react-icons/fa';
import { IoIosArrowBack } from 'react-icons/io';
import './Video.css';
import { AuthContext } from '../contexts/AuthContext';

/** Helpers YouTube */
function extractYouTubeId(rawUrl = '') {
  try {
    const url = new URL(rawUrl);
    const host = url.hostname.replace(/^www\./, '');
    if ((host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtube-nocookie.com') && url.pathname === '/watch') {
      const v = url.searchParams.get('v'); return v && v.length === 11 ? v : null;
    }
    if (host === 'youtu.be') { const id = url.pathname.split('/')[1]; return id && id.length === 11 ? id : null; }
    if ((host === 'youtube.com' || host === 'youtube-nocookie.com') && url.pathname.startsWith('/embed/')) {
      const id = url.pathname.split('/')[2]; return id && id.length === 11 ? id : null;
    }
    if (host === 'youtube.com' && url.pathname.startsWith('/shorts/')) {
      const id = url.pathname.split('/')[2]; return id && id.length === 11 ? id : null;
    }
    return null;
  } catch {
    const s = (rawUrl || '').trim();
    const m =
      s.match(/[?&]v=([\w-]{11})/) ||
      s.match(/youtu\.be\/([\w-]{11})/) ||
      s.match(/embed\/([\w-]{11})/) ||
      s.match(/shorts\/([\w-]{11})/);
    return m ? m[1] : null;
  }
}
const thumbFrom = (url) => {
  const id = extractYouTubeId(url);
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : '';
};
const embedFrom = (url) => {
  const id = extractYouTubeId(url);
  return id ? `https://www.youtube-nocookie.com/embed/${id}` : '';
};
/** SEMPRE usar a URL da aula: embed_url > url_video */
const pickAulaUrl = (aula) => (aula?.embed_url || aula?.url_video || '').trim();

/** mata qualquer iframe que tenha ficado na tela (só pra garantir) */
function forceStopAllIframes(selector = 'iframe') {
  try {
    document.querySelectorAll(selector).forEach((el) => {
      try { el.src = 'about:blank'; } catch {}
    });
  } catch {}
}

export default function Aulas() {
  const { bibliotecaId, usuarioId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { usuario } = useContext(AuthContext);

  const search = new URLSearchParams(location.search);
  const fromVideoId = search.get('from') || undefined;
  const debugMode = search.get('debug') === '1' && process.env.NODE_ENV !== 'production';

  const finalUsuarioId = usuario?.id || usuarioId;
  const cursoId = Number(bibliotecaId);

  const [debug, setDebug] = useState({
    mountedAt: new Date().toISOString(),
    pathCalled: '',
    fullUrl: '',
    axiosOk: null,
    axiosStatus: null,
    axiosError: null,
    payload: null,
  });

  const [biblioteca, setBiblioteca] = useState(null);
  const [modulos, setModulos] = useState({});
  const [currentAula, setCurrentAula] = useState(null);
  const [expanded, setExpanded] = useState({});
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);

  function chooseInitialAula(all = []) {
    const inProgress = all.find(a => !a.bloqueado && Number(a.progresso || 0) > 0 && Number(a.progresso) < 100);
    if (inProgress) return inProgress;
    const firstUnlocked = all.find(a => !a.bloqueado && Number(a.progresso || 0) < 100);
    if (firstUnlocked) return firstUnlocked;
    return all[0] || null;
  }

  const fetchDetalhes = useCallback(async () => {
    if (!Number.isFinite(cursoId) || cursoId <= 0) {
      setLoading(false);
      setDebug(d => ({ ...d, axiosOk: false, axiosError: 'bibliotecaId inválido' }));
      return;
    }
    setLoading(true);

    const path = `aulas/detalhes/${cursoId}/${finalUsuarioId}`;
    const params = { ...(debugMode ? { debug: 1 } : {}), ...(fromVideoId ? { from: fromVideoId } : {}) };
    const fullUrl = `${api.defaults.baseURL || ''}${path}${Object.keys(params).length ? `?${new URLSearchParams(params).toString()}` : ''}`;
    setDebug(d => ({ ...d, pathCalled: path, fullUrl }));

    try {
      const r = await api.get(path, { params });
      setDebug(d => ({ ...d, axiosOk: true, axiosStatus: r.status, payload: r.data }));
      if (!r.data?.sucesso) throw new Error('Falha ao carregar aulas');

      const { biblioteca: bib, modulos: mods, current_aula_id } = r.data;
      setBiblioteca(bib);
      setModulos(mods || {});
      const all = Object.values(mods || {}).flat();

      if (all.length === 0) {
        setCurrentAula(null);
        setExpanded({});
      } else {
        let initial = null;
        if (current_aula_id) initial = all.find(a => Number(a.id) === Number(current_aula_id)) || null;
        if (!initial) initial = chooseInitialAula(all);
        setCurrentAula(initial || null);

        const modName = initial ? (initial.modulo || initial.modulo_nome) : Object.keys(mods || {})[0];
        if (modName) setExpanded({ [modName]: true });
      }
    } catch (err) {
      setDebug(d => ({
        ...d, axiosOk: false,
        axiosStatus: err?.response?.status ?? null,
        axiosError: err?.message || 'erro',
        payload: err?.response?.data ?? null
      }));
    } finally {
      setLoading(false);
    }
  }, [cursoId, finalUsuarioId, fromVideoId, debugMode]);

  useEffect(() => { fetchDetalhes(); }, [fetchDetalhes]);

  // ao trocar de aula: parar player e limpar iframes antigos deste container
  useEffect(() => {
    setIsPlaying(false);
    return () => {
      // cleanup do player desta página
      forceStopAllIframes('.vl-player iframe');
    };
  }, [currentAula?.id]);

  // ao sair desta página (unmount): mata qq iframe que tenha restado
  useEffect(() => () => forceStopAllIframes('iframe'), []);

  const handleComplete = async () => {
    if (!currentAula?.id) return;
    try {
      const body = { aula_id: currentAula.id, usuario_id: Number(finalUsuarioId), percentual: 100 };
      await api.post('aulas/progresso', body, { params: { ...(debugMode ? { debug: 1 } : {}) } });
      await fetchDetalhes();
    } catch (e) {
      alert('Não foi possível marcar como concluída.');
    }
  };

  // Player/thumbnail – sempre a URL da AULA (embed_url > url_video)
  const rawAulaUrl = pickAulaUrl(currentAula);
  const thumb = thumbFrom(rawAulaUrl);
  const embedUrl = embedFrom(rawAulaUrl);
  const iframeKey = currentAula ? `${currentAula.id}|${embedUrl}` : 'empty';

  const aulasPath    = `/aulas/${cursoId}/${finalUsuarioId}`;
  const commentsBase = `/videos/${fromVideoId || cursoId}/${finalUsuarioId}`;
  const isBlocked = !!currentAula?.bloqueado;

  const DebugBar = () => (debugMode ? (
    <pre style={{
      background: '#0b1220', color: '#cfe3ff', padding: 10, margin: '8px 12px',
      borderRadius: 8, fontSize: 12, overflowX: 'auto'
    }}>
{JSON.stringify({
  route: window.location.pathname + window.location.search,
  bibliotecaId, cursoId, finalUsuarioId, fromVideoId,
  called: debug.pathCalled, axiosFullUrl: debug.fullUrl,
  axiosOk: debug.axiosOk, axiosStatus: debug.axiosStatus, axiosError: debug.axiosError,
  currentAula: currentAula ? {
    id: currentAula.id, titulo: currentAula.titulo,
    url_video: currentAula.url_video, embed_url: currentAula.embed_url
  } : null,
  rawAulaUrl, embedUrl
}, null, 2)}
    </pre>
  ) : null);

  if (loading || !biblioteca) {
    return (
      <div className="vl-container">
        <DebugBar />
        <div className="video-loading">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="vl-container">
      <DebugBar />

      {/* HEADER */}
      <header className="vl-header">
        <button className="vl-btn-back" onClick={() => navigate('/biblioteca')} aria-label="Voltar">
          <IoIosArrowBack size={24} />
        </button>
        <div className="vl-course-info">
          <h2 className="vl-course-title">{biblioteca.titulo}</h2>
          <div className="vl-progress-row">
            <div className="vl-progress-bar">
              <div className="vl-progress-fill" style={{ width: `${Math.round(biblioteca.progresso || 0)}%` }} />
            </div>
            <span className="vl-progress-text">{Math.round(biblioteca.progresso || 0)}%</span>
          </div>
        </div>
      </header>

      {/* PLAYER / PREVIEW */}
      <div className="vl-player" style={{ aspectRatio: '16/9', position: 'relative', zIndex: 1 }}>
        {!currentAula && (
          <div className="video-overlay" style={{ display: 'grid', placeItems: 'center', padding: 24 }}>
            <p style={{ opacity: .85 }}>Nenhuma aula disponível.</p>
          </div>
        )}

        {currentAula && isBlocked && (
          <div className="vl-player-locked" style={{ display: 'grid', placeItems: 'center', padding: 24, textAlign: 'center' }}>
            <p style={{ opacity: .9 }}>Aula bloqueada — conclua a anterior para liberar.</p>
          </div>
        )}

        {currentAula && !isBlocked && !isPlaying && thumb && (
          <>
            <img className="vl-thumb" src={thumb} alt="" />
            <button className="vl-btn-play" onClick={() => setIsPlaying(true)} aria-label="Reproduzir aula">
              <FaPlayCircle />
            </button>
          </>
        )}

        {currentAula && !isBlocked && isPlaying && embedUrl && (
          <iframe
            key={iframeKey} // força REMOUNT ao trocar aula/url
            src={`${embedUrl}?autoplay=1&rel=0&modestbranding=1`}
            title={currentAula?.titulo || 'Aula'}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            loading="lazy"
            style={{ width: '100%', height: '100%', display: 'block' }}
          />
        )}
      </div>

      {/* LISTA/CONTROLES */}
      <VideoLessons
        biblioteca={biblioteca}
        modulos={modulos}
        currentAula={currentAula}
        setCurrentAula={(a) => {
          setCurrentAula(a);
          setIsPlaying(false);
          const modName = a?.modulo || a?.modulo_nome;
          if (modName) setExpanded(p => ({ ...p, [modName]: true }));
        }}
        expanded={expanded}
        toggleModule={(m) => setExpanded((p) => ({ ...p, [m]: !p[m] }))}
        showHeader={false}
        onComplete={handleComplete}
      />

      {/* Footer (tabs) */}
      <footer className="video-footer">
        <div
          className="footer-item active"
          onClick={() =>
            navigate(
              `${aulasPath}${
                debugMode || fromVideoId ? `?${[
                  debugMode ? 'debug=1' : null,
                  fromVideoId ? `from=${encodeURIComponent(fromVideoId)}` : null
                ].filter(Boolean).join('&')}` : ''
              }`
            )
          }
        >
          <FaPlayCircle size={20} />
          <div className="footer-label">Aulas</div>
        </div>
        <div className="footer-item" onClick={() => navigate(`${commentsBase}/comentarios`)}>
          <FaRegCommentDots size={20} />
          <div className="footer-label">Comentários</div>
        </div>
        <div className="footer-item" onClick={() => navigate(`${commentsBase}/anotacoes`)}>
          <FaRegStickyNote size={20} />
          <div className="footer-label">Anotações</div>
        </div>
        <div className="footer-item" onClick={() => navigate(`${commentsBase}/materiais`)}>
          <FaRegFileAlt size={20} />
          <div className="footer-label">Materiais</div>
        </div>
      </footer>
    </div>
  );
}
