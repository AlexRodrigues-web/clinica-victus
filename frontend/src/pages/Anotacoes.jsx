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

const LS_KEY = (bib, uid) => `cv:anotacoes:${bib}:${uid}`;

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

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await api.get(`video/detalhes/${bibliotecaId}/${finalUsuarioId}`);
        if (!alive) return;
        setCurso(r.data?.biblioteca || { titulo: 'Curso' });
      } catch {
        if (alive) setCurso({ titulo: 'Curso' });
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [bibliotecaId, finalUsuarioId]);

  useEffect(() => {
    const raw = localStorage.getItem(LS_KEY(bibliotecaId, finalUsuarioId));
    setNotes(raw ? JSON.parse(raw) : []);
  }, [bibliotecaId, finalUsuarioId]);

  const saveLocal = (list) => {
    setNotes(list);
    localStorage.setItem(LS_KEY(bibliotecaId, finalUsuarioId), JSON.stringify(list));
  };

  const addNote = () => {
    const msg = texto.trim();
    if (!msg) return;
    const novo = { id: Date.now(), texto: msg, criado_em: new Date().toISOString(), pinned: false };
    saveLocal([novo, ...notes]);
    setTexto('');
  };

  const removeNote = (id) => {
    if (!window.confirm('Deseja apagar esta anotação?')) return;
    saveLocal(notes.filter(n => n.id !== id));
    if (editId === id) { setEditId(null); setTexto(''); }
  };

  const removeAll = () => {
    if (!window.confirm('Apagar TODAS as anotações desta aula/curso?')) return;
    saveLocal([]); setEditId(null); setTexto('');
  };

  const startEdit = (n) => { setEditId(n.id); setTexto(n.texto); };
  const cancelEdit = () => { setEditId(null); setTexto(''); };
  const confirmEdit = () => {
    const msg = texto.trim(); if (!msg) return;
    saveLocal(notes.map(n => (n.id === editId ? { ...n, texto: msg } : n)));
    setEditId(null); setTexto('');
  };

  const togglePin = (id) => saveLocal(notes.map(n => (n.id === id ? { ...n, pinned: !n.pinned } : n)));
  const copyText = async (txt) => {
    try { await navigator.clipboard.writeText(txt); alert('Copiado para a área de transferência.'); }
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
        const byId = new Map(notes.map(n => [n.id, n]));
        imported.forEach(n => { if (n && n.id && n.texto) byId.set(n.id, { pinned: false, ...n }); });
        const merged = Array.from(byId.values()).sort((a, b) => (b.criado_em || '').localeCompare(a.criado_em || ''));
        saveLocal(merged);
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

  const aulasPath = `/aulas/${bibliotecaId}/${finalUsuarioId}`;
  const commentsBase = `/videos/${bibliotecaId}/${finalUsuarioId}`;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const base = [...notes].sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return (b.criado_em || '').localeCompare(a.criado_em || '');
    });
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
              <FaDownload className="mr" /> Exportar
            </button>
            <button onClick={() => fileInputRef.current?.click()} className="notes-btn">
              <FaUpload className="mr" /> Importar
            </button>
            <input ref={fileInputRef} type="file" accept="application/json" onChange={importJson} style={{ display: 'none' }} />
            {notes.length > 0 && (
              <button onClick={removeAll} className="notes-btn danger">
                <FaTrash className="mr" /> Limpar
              </button>
            )}
          </div>
        </div>

        <div className="notes-editor">
          <textarea
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
            <div key={n.id} className={`notes-card ${n.pinned ? 'pinned' : ''}`}>
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
