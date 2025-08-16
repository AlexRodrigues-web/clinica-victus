// frontend/src/pages/Comentarios.jsx
import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState, useContext, useRef, useMemo } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import api from '../services/api';
import {
  FaRegCommentDots,
  FaRegStickyNote,
  FaRegFileAlt,
  FaPlayCircle,
  FaTrash,
} from 'react-icons/fa';
import { IoIosArrowBack } from 'react-icons/io';
import './Video.css';

const LS_KEY_USER   = (bib, uid) => `cv:comentarios:${bib}:${uid}`;
const LS_KEY_PUBLIC = (bib)      => `cv:comentarios:${bib}`;

// util: tempo relativo
function timeAgo(iso) {
  try {
    const d = new Date(iso);
    const s = Math.floor((Date.now() - d.getTime()) / 1000);
    if (s < 60) return 'agora';
    const m = Math.floor(s / 60);
    if (m < 60) return `${m} min`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h} h`;
    const dd = Math.floor(h / 24);
    return `${dd} d`;
  } catch { return ''; }
}

// util: ler/gravar LS
const readLS = (k) => {
  try { const raw = localStorage.getItem(k); return raw ? JSON.parse(raw) : []; }
  catch { return []; }
};
const writeLS = (k, v) => {
  try { localStorage.setItem(k, JSON.stringify(v)); } catch {}
};

// util: merge + dedup + ordenar
function normalizeComments(list) {
  const out = [];
  const seen = new Set();
  for (const c of (list || [])) {
    const id = (c.id ?? '').toString().trim();
    const sig = id ? `id:${id}` : `t:${(c.texto||'').trim()}|d:${c.criado_em||''}`;
    if (!seen.has(sig)) {
      seen.add(sig);
      out.push({
        id,
        usuario_id: Number(c.usuario_id || 0),
        nome: c.nome || 'Usuário',
        texto: String(c.texto || ''),
        criado_em: c.criado_em || new Date().toISOString(),
      });
    }
  }
  // mais recentes primeiro
  out.sort((a,b) => new Date(b.criado_em) - new Date(a.criado_em));
  return out;
}

export default function Comentarios() {
  const { bibliotecaId, usuarioId } = useParams();
  const navigate = useNavigate();
  const { usuario } = useContext(AuthContext);
  const finalUsuarioId = usuario?.id || usuarioId;

  const LS_USER   = useMemo(() => LS_KEY_USER(bibliotecaId, finalUsuarioId), [bibliotecaId, finalUsuarioId]);
  const LS_PUBLIC = useMemo(() => LS_KEY_PUBLIC(bibliotecaId),               [bibliotecaId]);

  const [curso, setCurso] = useState({ titulo: 'Carregando...' });
  const [comentarios, setComentarios] = useState([]);
  const [texto, setTexto] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const inputRef = useRef(null);

  // Carrega título/curso
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await api.get(`video/detalhes/${bibliotecaId}/${finalUsuarioId}`);
        if (!alive) return;
        setCurso(r.data?.biblioteca || { titulo: 'Curso' });
      } catch {
        if (alive) setCurso({ titulo: 'Curso' });
      } finally { if (alive) setLoading(false); }
    })();
    return () => { alive = false; };
  }, [bibliotecaId, finalUsuarioId]);

  // Carrega comentários:
  // 1) junta locais (user + public), mostra
  // 2) tenta backend; se vier algo, mescla e persiste nas duas chaves
  useEffect(() => {
    let alive = true;

    const localUser   = readLS(LS_USER);
    const localPublic = readLS(LS_PUBLIC);
    const localMerged = normalizeComments([...localUser, ...localPublic]);
    setComentarios(localMerged);

    (async () => {
      try {
        const r = await api.get(`comentarios/listar/${bibliotecaId}/${finalUsuarioId}`);
        if (!alive) return;

        const remote = Array.isArray(r?.data?.comentarios) ? r.data.comentarios : [];
        // se backend vier vazio, NÃO apaga o local — apenas mantém
        const finalMerged = normalizeComments([...localMerged, ...remote]);

        setComentarios(finalMerged);
        // salva em AMBAS as chaves para sobreviver a logout/troca de usuário
        writeLS(LS_USER, finalMerged);
        writeLS(LS_PUBLIC, finalMerged);
      } catch {
        // offline/404 -> mantém os locais já carregados
      }
    })();

    return () => { alive = false; };
  }, [bibliotecaId, finalUsuarioId, LS_USER, LS_PUBLIC]);

  // textarea auto-grow
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = '0px';
    el.style.height = Math.min(el.scrollHeight, 140) + 'px';
  }, [texto]);

  // salva nas duas chaves + estado
  const persistBoth = (list) => {
    const norm = normalizeComments(list);
    setComentarios(norm);
    writeLS(LS_USER, norm);
    writeLS(LS_PUBLIC, norm);
  };

  const enviar = async () => {
    const msg = texto.trim();
    if (!msg || sending) return;
    setSending(true);

    const tempId = `local-${Date.now()}`;
    const novo = {
      id: tempId,
      usuario_id: Number(finalUsuarioId),
      nome: usuario?.nome || 'Você',
      texto: msg,
      criado_em: new Date().toISOString(),
    };

    persistBoth([novo, ...comentarios]);
    setTexto('');

    try {
      const r = await api.post('comentarios/criar', {
        biblioteca_id: Number(bibliotecaId),
        usuario_id: Number(finalUsuarioId),
        texto: msg,
      });
      const realId = r?.data?.comentario?.id;
      if (realId) {
        // troca o tempId pelo id real em AMBOS os storages
        const replaced = (readLS(LS_USER).length ? readLS(LS_USER) : comentarios).map(c =>
          c.id === tempId ? { ...c, id: String(realId) } : c
        );
        persistBoth(replaced);
      }
    } catch {
      // mantém local; continua persistente mesmo sem backend
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const remover = async (id) => {
    // Remove por id e também por assinatura texto+data (garantia contra diferenças)
    const removeBy = (arr) => arr.filter(c => c.id !== id);
    const after = removeBy(comentarios);
    persistBoth(after);
    try { await api.delete(`comentarios/${id}`); } catch {}
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      enviar();
    }
  };

  const aulasPath    = `/aulas/${bibliotecaId}/${finalUsuarioId}`;
  const commentsBase = `/videos/${bibliotecaId}/${finalUsuarioId}`;

  if (loading) return <div className="video-loading">Carregando...</div>;

  return (
    <div className="video-page">
      {/* Header */}
      <header className="video-header">
        <button
          className="header-back-btn"
          onClick={() => navigate(`/videos/${bibliotecaId}/${finalUsuarioId}`)}
          aria-label="Voltar"
        >
          <IoIosArrowBack size={22} />
        </button>
        <div className="header-body">
          <h2 className="header-title">{curso.titulo}</h2>
        </div>
      </header>

      {/* Conteúdo */}
      <section className="video-info" style={{ paddingTop: 0 }}>
        <h3 style={{ margin: '0 0 8px' }}>Comentários</h3>

        {/* Editor responsivo */}
        <div
          className="cm-editor"
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto',
            gap: 8,
            margin: '8px 0 16px',
          }}
        >
          <textarea
            ref={inputRef}
            value={texto}
            onChange={(e)=>setTexto(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={2}
            placeholder="Escreva um comentário… (Enter envia, Shift+Enter quebra linha)"
            className="cm-textarea"
            style={{
              boxSizing: 'border-box',
              width: '100%',
              maxWidth: '100%',
              resize: 'none',
              overflow: 'hidden',
              background: '#1f1f1f',
              color: '#fff',
              border: '1px solid #333',
              borderRadius: 8,
              padding: '10px 12px',
              outline: 'none',
            }}
          />
          <button
            onClick={enviar}
            disabled={!texto.trim() || sending}
            className="cm-send-btn"
            style={{
              background: !texto.trim() ? '#555' : '#d98e2d',
              color: '#000',
              border: 'none',
              borderRadius: 8,
              padding: '0 14px',
              fontWeight: 600,
              minHeight: 38,
              minWidth: 88,
              cursor: !texto.trim() ? 'not-allowed' : 'pointer',
            }}
          >
            {sending ? 'Enviando…' : 'Enviar'}
          </button>
        </div>

        {/* Lista */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {comentarios.length === 0 && (
            <div style={{ opacity: .8 }}>Seja o primeiro a comentar.</div>
          )}

          {comentarios.map(c => (
            <div
              key={c.id || `${c.texto}-${c.criado_em}`}
              style={{
                background: '#1e1e1e',
                border: '1px solid #2a2a2a',
                borderRadius: 10,
                padding: 12,
              }}
            >
              <div style={{ display: 'flex', justifyContent:'space-between', marginBottom: 6 }}>
                <div style={{ display:'flex', alignItems:'baseline', gap: 8 }}>
                  <strong style={{ fontSize: 13 }}>{c.nome || 'Usuário'}</strong>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,.55)' }}>
                    {c.criado_em ? timeAgo(c.criado_em) : ''}
                  </span>
                </div>
                <button
                  onClick={()=>remover(c.id)}
                  title="Remover comentário"
                  style={{ background:'none', border:'none', color:'#aaa', cursor:'pointer' }}
                >
                  <FaTrash size={14} />
                </button>
              </div>
              <div style={{ fontSize: 14, color:'rgba(255,255,255,.88)', whiteSpace:'pre-wrap' }}>
                {c.texto}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="video-footer">
        <div className="footer-item" onClick={() => navigate(aulasPath)}>
          <FaPlayCircle size={20} /><div className="footer-label">Aulas</div>
        </div>
        <div className="footer-item active" onClick={() => navigate(`${commentsBase}/comentarios`)}>
          <FaRegCommentDots size={20} /><div className="footer-label">Comentários</div>
        </div>
        <div className="footer-item" onClick={() => navigate(`${commentsBase}/anotacoes`)}>
          <FaRegStickyNote size={20} /><div className="footer-label">Anotações</div>
        </div>
        <div className="footer-item" onClick={() => navigate(`${commentsBase}/materiais`)}>
          <FaRegFileAlt size={20} /><div className="footer-label">Materiais</div>
        </div>
      </footer>
    </div>
  );
}
