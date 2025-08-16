// frontend/src/pages/Anotacoes.jsx
import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState, useContext, useMemo, useRef } from 'react';
import api from '../services/api';
import { AuthContext } from '../contexts/AuthContext';
import {
  FaRegCommentDots,
  FaRegStickyNote,
  FaRegFileAlt,
  FaPlayCircle,
  FaTrash,
  FaEdit,
  FaSave,
  FaThumbtack,
  FaDownload,
  FaUpload,
  FaCopy,
  FaTimes
} from 'react-icons/fa';
import { IoIosArrowBack } from 'react-icons/io';
import './Video.css';

// duas chaves: por usuário e pública
const LS_KEY_USER   = (bib, uid) => `cv:anotacoes:${bib}:${uid}`;
const LS_KEY_PUBLIC = (bib)      => `cv:anotacoes:${bib}`;

const readLS = (k) => {
  try { const raw = localStorage.getItem(k); return raw ? JSON.parse(raw) : []; }
  catch { return []; }
};
const writeLS = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

// merge + dedup + ordenação (pinned primeiro, depois por data desc)
function normalizeNotes(list) {
  const out = [];
  const seen = new Set();
  for (const n of (list || [])) {
    const id = (n.id ?? '').toString().trim();
    const sig = id ? `id:${id}` : `t:${(n.texto||'').trim()}|d:${n.criado_em||''}`;
    if (!seen.has(sig)) {
      seen.add(sig);
      out.push({
        id,
        texto: String(n.texto || ''),
        criado_em: n.criado_em || new Date().toISOString(),
        pinned: !!n.pinned,
      });
    }
  }
  out.sort((a,b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return new Date(b.criado_em) - new Date(a.criado_em);
  });
  return out;
}

export default function Anotacoes() {
  const { bibliotecaId, usuarioId } = useParams();
  const navigate = useNavigate();
  const { usuario } = useContext(AuthContext);
  const finalUsuarioId = usuario?.id || usuarioId;

  const [curso, setCurso] = useState({ titulo: 'Carregando...' });
  const [notes, setNotes] = useState([]);
  const [texto, setTexto] = useState('');
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fileInputRef = useRef(null);
  const textareaRef  = useRef(null);

  const LS_USER   = useMemo(() => LS_KEY_USER(bibliotecaId, finalUsuarioId), [bibliotecaId, finalUsuarioId]);
  const LS_PUBLIC = useMemo(() => LS_KEY_PUBLIC(bibliotecaId),               [bibliotecaId]);

  // título/curso
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

  // carrega anotações de AMBAS as chaves
  useEffect(() => {
    const localUser   = readLS(LS_USER);
    const localPublic = readLS(LS_PUBLIC);
    setNotes(normalizeNotes([...localUser, ...localPublic]));
  }, [LS_USER, LS_PUBLIC]);

  // textarea auto-grow
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = '0px';
    el.style.height = Math.min(el.scrollHeight, 240) + 'px';
  }, [texto]);

  const persistBoth = (list) => {
    const norm = normalizeNotes(list);
    setNotes(norm);
    writeLS(LS_USER, norm);
    writeLS(LS_PUBLIC, norm);
  };

  const addNote = () => {
    const msg = texto.trim();
    if (!msg) return;
    const novo = { id: `local-${Date.now()}`, texto: msg, criado_em: new Date().toISOString(), pinned: false };
    persistBoth([novo, ...notes]);
    setTexto('');
    textareaRef.current?.focus();
  };

  const removeNote = (id) => {
    if (!window.confirm('Deseja apagar esta anotação?')) return;
    persistBoth(notes.filter(n => n.id !== id));
    if (editId === id) { setEditId(null); setTexto(''); }
  };

  const removeAll = () => {
    if (!window.confirm('Apagar TODAS as anotações deste curso?')) return;
    persistBoth([]);
    setEditId(null); setTexto('');
  };

  const startEdit = (n) => { setEditId(n.id); setTexto(n.texto); textareaRef.current?.focus(); };
  const cancelEdit = () => { setEditId(null); setTexto(''); };
  const confirmEdit = () => {
    const msg = texto.trim(); if (!msg) return;
    persistBoth(notes.map(n => (n.id === editId ? { ...n, texto: msg } : n)));
    setEditId(null); setTexto('');
  };

  const togglePin = (id) => persistBoth(notes.map(n => (n.id === id ? { ...n, pinned: !n.pinned } : n)));

  const copyText = async (txt) => {
    try { await navigator.clipboard.writeText(txt); alert('Copiado.'); }
    catch { alert('Não foi possível copiar.'); }
  };

  const exportJson = () => {
    const data = JSON.stringify(notes, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `anotacoes_${bibliotecaId}_${finalUsuarioId}.json`;
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  };

  const importJson = (e) => {
    const f = e.target.files?.[0]; if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const imported = JSON.parse(reader.result);
        if (!Array.isArray(imported)) throw new Error('Formato inválido');
        persistBoth(normalizeNotes([...(notes || []), ...imported]));
        alert('Importado com sucesso!');
      } catch (err) {
        alert('Falha ao importar: ' + (err?.message || 'erro'));
      } finally { e.target.value = ''; }
    };
    reader.readAsText(f);
  };

  const onTextareaKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      if (editId) confirmEdit(); else addNote();
    }
  };

  const aulasPath    = `/aulas/${bibliotecaId}/${finalUsuarioId}`;
  const commentsBase = `/videos/${bibliotecaId}/${finalUsuarioId}`;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const base = [...notes]; // já vem ordenado no normalize
    return q ? base.filter(n => n.texto.toLowerCase().includes(q)) : base;
  }, [notes, search]);

  if (loading) return <div className="video-loading">Carregando...</div>;

  return (
    <div className="video-page">
      <header className="video-header">
        <button className="header-back-btn" onClick={() => navigate(`/videos/${bibliotecaId}/${finalUsuarioId}`)} aria-label="Voltar">
          <IoIosArrowBack size={22} />
        </button>
        <div className="header-body">
          <h2 className="header-title">{curso.titulo}</h2>
        </div>
      </header>

      <section className="video-info notes-container">
        <div className="notes-toolbar">
          <h3 className="notes-title">Minhas anotações</h3>

          <div className="notes-actions">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pesquisar..."
              className="notes-search"
            />
            <button onClick={exportJson} className="notes-btn">
              <FaDownload /> Exportar
            </button>
            <button onClick={() => fileInputRef.current?.click()} className="notes-btn">
              <FaUpload /> Importar
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json"
              onChange={importJson}
              style={{ display: 'none' }}
            />
            {notes.length > 0 && (
              <button onClick={removeAll} className="notes-btn danger">
                <FaTrash /> Limpar
              </button>
            )}
          </div>
        </div>

        <div className="notes-editor">
          <textarea
            ref={textareaRef}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={onTextareaKeyDown}
            rows={3}
            placeholder={editId ? 'Edite sua anotação… (Ctrl/Cmd + Enter para salvar)' : 'Escreva uma anotação… (Ctrl/Cmd + Enter para salvar)'}
            className="notes-textarea"
          />
          <div className="notes-editor-actions">
            {editId ? (
              <>
                <button onClick={confirmEdit} className="notes-primary"><FaSave /></button>
                <button onClick={cancelEdit} className="notes-btn"><FaTimes /></button>
              </>
            ) : (
              <button onClick={addNote} className="notes-primary">Salvar</button>
            )}
          </div>
        </div>

        <div className="notes-list">
          {filtered.length === 0 && (
            <div className="notes-empty">Sem anotações {search ? 'para este filtro.' : 'ainda.'}</div>
          )}

          {filtered.map(n => (
            <div key={n.id || `${n.texto}-${n.criado_em}`} className={`notes-card ${n.pinned ? 'pinned' : ''}`}>
              <div className="notes-card-head">
                <small className="notes-date">{new Date(n.criado_em).toLocaleString()}</small>
                {n.pinned && <span className="notes-pin-badge">fixada</span>}
                <div className="notes-icon-row">
                  <button onClick={() => togglePin(n.id)} className="notes-icon-btn" title={n.pinned ? 'Desafixar' : 'Fixar'}><FaThumbtack /></button>
                  <button onClick={() => copyText(n.texto)} className="notes-icon-btn" title="Copiar"><FaCopy /></button>
                  <button onClick={() => startEdit(n)} className="notes-icon-btn" title="Editar"><FaEdit /></button>
                  <button onClick={() => removeNote(n.id)} className="notes-icon-btn" title="Excluir"><FaTrash /></button>
                </div>
              </div>
              <div className="notes-text">{n.texto}</div>
            </div>
          ))}
        </div>
      </section>

      <footer className="video-footer">
        <div className="footer-item" onClick={() => navigate(aulasPath)}>
          <FaPlayCircle size={20} /><div className="footer-label">Aulas</div>
        </div>
        <div className="footer-item" onClick={() => navigate(`${commentsBase}/comentarios`)}>
          <FaRegCommentDots size={20} /><div className="footer-label">Comentários</div>
        </div>
        <div className="footer-item active" onClick={() => navigate(`${commentsBase}/anotacoes`)}>
          <FaRegStickyNote size={20} /><div className="footer-label">Anotações</div>
        </div>
        <div className="footer-item" onClick={() => navigate(`${commentsBase}/materiais`)}>
          <FaRegFileAlt size={20} /><div className="footer-label">Materiais</div>
        </div>
      </footer>
    </div>
  );
}
