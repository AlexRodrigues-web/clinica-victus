import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState, useContext, useRef } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import api from '../services/api';
import {
  FaRegCommentDots,
  FaRegStickyNote,
  FaRegFileAlt,
  FaPlayCircle,
  FaTrash
} from 'react-icons/fa';
import { IoIosArrowBack } from 'react-icons/io';
import './Video.css';

const LS_KEY = (bib, uid) => `cv:comentarios:${bib}:${uid}`;

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

export default function Comentarios() {
  const { bibliotecaId, usuarioId } = useParams();
  const navigate = useNavigate();
  const { usuario } = useContext(AuthContext);
  const finalUsuarioId = usuario?.id || usuarioId;

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

  // Busca comentários: tenta backend, senão localStorage
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await api.get(`comentarios/listar/${bibliotecaId}/${finalUsuarioId}`);
        if (!alive) return;
        if (r.data?.sucesso && Array.isArray(r.data?.comentarios)) {
          setComentarios(r.data.comentarios);
          localStorage.setItem(LS_KEY(bibliotecaId, finalUsuarioId), JSON.stringify(r.data.comentarios));
          return;
        }
        throw new Error('fallback local');
      } catch {
        const raw = localStorage.getItem(LS_KEY(bibliotecaId, finalUsuarioId));
        setComentarios(raw ? JSON.parse(raw) : []);
      }
    })();
    return () => { alive = false; };
  }, [bibliotecaId, finalUsuarioId]);

  const salvarLocal = (list) => {
    setComentarios(list);
    localStorage.setItem(LS_KEY(bibliotecaId, finalUsuarioId), JSON.stringify(list));
  };

  // textarea auto-grow
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = '0px';
    el.style.height = Math.min(el.scrollHeight, 140) + 'px';
  }, [texto]);

  const enviar = async () => {
    const msg = texto.trim();
    if (!msg || sending) return;
    setSending(true);

    // Otimista
    const novo = {
      id: Date.now(), // até voltar do backend
      usuario_id: Number(finalUsuarioId),
      nome: usuario?.nome || 'Você',
      texto: msg,
      criado_em: new Date().toISOString(),
    };
    salvarLocal([novo, ...comentarios]);
    setTexto('');

    try {
      const r = await api.post('comentarios/criar', {
        biblioteca_id: Number(bibliotecaId),
        usuario_id: Number(finalUsuarioId),
        texto: msg,
      });
      // Se o backend devolver o ID real, substitui
      const realId = r?.data?.comentario?.id;
      if (realId) {
        salvarLocal(prev =>
          (prev || []).map(c => (c.id === novo.id ? { ...c, id: realId } : c))
        );
      }
    } catch {
      // mantém local; opcional: marcar como "pendente"
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const remover = async (id) => {
    // Otimista
    salvarLocal(comentarios.filter(c => c.id !== id));
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
            margin: '8px 0 16px'
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
              outline: 'none'
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
              cursor: !texto.trim() ? 'not-allowed' : 'pointer'
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
              key={c.id}
              style={{
                background: '#1e1e1e',
                border: '1px solid #2a2a2a',
                borderRadius: 10,
                padding: 12
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
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
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,.88)', whiteSpace: 'pre-wrap' }}>
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
