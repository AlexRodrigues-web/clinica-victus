// frontend/src/pages/Materiais.jsx
import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import {
  FaRegCommentDots,
  FaRegStickyNote,
  FaRegFileAlt,
  FaPlayCircle,
  FaDownload,
  FaLink
} from 'react-icons/fa';
import { IoIosArrowBack } from 'react-icons/io';
import './Video.css';

function detectTipo(url = '', explicit) {
  if (explicit) return explicit;
  const u = (url || '').toLowerCase().split('?')[0];
  if (u.endsWith('.pdf')) return 'PDF';
  if (/\.(doc|docx)$/.test(u)) return 'DOC';
  if (/\.(xls|xlsx|csv)$/.test(u)) return 'Planilha';
  if (/\.(ppt|pptx)$/.test(u)) return 'Apresentação';
  if (/\.(zip|rar|7z)$/.test(u)) return 'Pacote';
  if (/\.(jpg|jpeg|png|gif|webp)$/.test(u)) return 'Imagem';
  if (/\.(mp4|mov|m4v|webm)$/.test(u)) return 'Vídeo';
  return 'Link';
}

// Título mock por curso
function getMockCursoTitulo(bibliotecaId) {
  if (Number(bibliotecaId) === 6) return 'Receitas de pequeno-almoço para emagrecer';
  return 'Curso (mock)';
}

// Lista mock por curso (curso + por aula)
function getMockMateriais(bibliotecaId) {
  if (Number(bibliotecaId) === 6) {
    const curso = [
      { id: 'c-1', aulaTitulo: 'Curso', titulo: 'Plano semanal de pequenos-almoços (PDF)', url: '/materiais/receitas/plano-semanal-pequenos-almocos.pdf', tipo: 'PDF' },
      { id: 'c-2', aulaTitulo: 'Curso', titulo: 'Lista de compras — 7 dias (PDF)', url: '/materiais/receitas/lista-compras-7-dias.pdf', tipo: 'PDF' },
      { id: 'c-3', aulaTitulo: 'Curso', titulo: 'Tabela de substituições inteligentes (PDF)', url: '/materiais/receitas/tabela-substituicoes.pdf', tipo: 'PDF' },
      { id: 'c-4', aulaTitulo: 'Curso', titulo: 'Modelo de cardápio (XLSX)', url: '/materiais/receitas/modelo-cardapio.xlsx', tipo: 'Planilha' },
      { id: 'c-5', aulaTitulo: 'Curso', titulo: 'Checklist de rotina matinal (PDF)', url: '/materiais/receitas/checklist-rotina-matinal.pdf', tipo: 'PDF' },
    ];

    const porAula = [
      { id: 'a-26-1', aulaTitulo: 'Boas-vindas', titulo: 'Resumo da aula (PDF)', url: '/materiais/receitas/boas-vindas-resumo.pdf', tipo: 'PDF' },
      { id: 'a-26-2', aulaTitulo: 'Boas-vindas', titulo: 'Checklist inicial (PDF)', url: '/materiais/receitas/checklist-inicial.pdf', tipo: 'PDF' },

      { id: 'a-27-1', aulaTitulo: 'Métodos e princípios', titulo: 'Slides — Métodos e princípios (PDF)', url: '/materiais/receitas/metodos-principios-slides.pdf', tipo: 'PDF' },
      { id: 'a-27-2', aulaTitulo: 'Métodos e princípios', titulo: 'Ficha de metas (DOCX)', url: '/materiais/receitas/ficha-de-metas.docx', tipo: 'DOC' },

      { id: 'a-28-1', aulaTitulo: 'Guias alimentares', titulo: 'Guia de porções para o pequeno-almoço (PDF)', url: '/materiais/receitas/guia-porcoes.pdf', tipo: 'PDF' },
      { id: 'a-28-2', aulaTitulo: 'Guias alimentares', titulo: 'Tabela de porções ilustrada (PNG)', url: '/materiais/receitas/tabela-porcoes.png', tipo: 'Imagem' },

      { id: 'a-29-1', aulaTitulo: 'Alimentação saudável', titulo: '10 opções de pequeno-almoço (PDF)', url: '/materiais/receitas/10-opcoes-pequeno-almoco.pdf', tipo: 'PDF' },
      { id: 'a-29-2', aulaTitulo: 'Alimentação saudável', titulo: 'Bônus: vídeo de preparo rápido', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', tipo: 'Link' },

      { id: 'a-30-1', aulaTitulo: 'Estratégias de emagrecimento', titulo: 'Estratégias — eBook (PDF)', url: '/materiais/receitas/estrategias-emagrecimento.pdf', tipo: 'PDF' },
      { id: 'a-30-2', aulaTitulo: 'Estratégias de emagrecimento', titulo: 'Diário alimentar (XLSX)', url: '/materiais/receitas/diario-alimentar.xlsx', tipo: 'Planilha' },
      { id: 'a-30-3', aulaTitulo: 'Estratégias de emagrecimento', titulo: 'Calculadora TDEE', url: 'https://tdeecalculator.net', tipo: 'Link' },

      { id: 'a-31-1', aulaTitulo: 'Planeamento alimentar', titulo: 'Planner semanal (PDF)', url: '/materiais/receitas/planner-semanal.pdf', tipo: 'PDF' },
      { id: 'a-31-2', aulaTitulo: 'Planeamento alimentar', titulo: 'Modelo de cardápio — versão 2 (XLSX)', url: '/materiais/receitas/modelo-cardapio-v2.xlsx', tipo: 'Planilha' },
    ];

    return [...curso, ...porAula];
  }

  // genérico
  return [
    { id: 'g-1', aulaTitulo: 'Curso', titulo: 'Guia do participante (PDF)', url: '/materiais/generico/guia.pdf', tipo: 'PDF' },
    { id: 'g-2', aulaTitulo: 'Introdução', titulo: 'Slides de introdução (PDF)', url: '/materiais/generico/intro.pdf', tipo: 'PDF' },
    { id: 'g-3', aulaTitulo: 'Módulo 1', titulo: 'Checklist do módulo 1', url: '/materiais/generico/checklist-mod1.pdf', tipo: 'PDF' },
  ];
}

export default function Materiais() {
  const { bibliotecaId, usuarioId } = useParams();
  const navigate = useNavigate();
  const { usuario } = useContext(AuthContext);
  const finalUsuarioId = usuario?.id || usuarioId;

  const [curso, setCurso] = useState({ id: null, titulo: 'Carregando...' });
  const [materiais, setMateriais] = useState([]);
  const [loading, setLoading] = useState(true);

  // >>> TOTALMENTE MOCKADO (deps FIXAS e de tamanho constante)
  useEffect(() => {
    setLoading(true);
    const titulo = getMockCursoTitulo(bibliotecaId);
    setCurso({ id: Number(bibliotecaId), titulo });

    const data = getMockMateriais(bibliotecaId).map(m => ({
      ...m,
      tipo: detectTipo(m.url, m.tipo),
    }));
    setMateriais(data);
    setLoading(false);
  }, [bibliotecaId]); // <== tamanho do array NUNCA muda

  // Agrupa por aula/curso
  const agrupados = useMemo(() => {
    const map = new Map();
    for (const m of materiais) {
      const k = m.aulaTitulo || 'Curso';
      if (!map.has(k)) map.set(k, []);
      map.get(k).push(m);
    }
    for (const [, arr] of map) {
      arr.sort(
        (a, b) =>
          (a.tipo || '').localeCompare(b.tipo || '') ||
          (a.titulo || '').localeCompare(b.titulo || '')
      );
    }
    return map;
  }, [materiais]);

  const aulasPath = `/aulas/${bibliotecaId}/${finalUsuarioId}`;
  const commentsBase = `/videos/${bibliotecaId}/${finalUsuarioId}`;
  const tem = materiais.length > 0;

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
        <h3 style={{ margin: '0 0 8px' }}>Materiais do curso</h3>

        {!tem && (
          <div
            style={{
              background: '#1e1e1e',
              border: '1px solid #2a2a2a',
              borderRadius: 10,
              padding: 14,
              color: 'rgba(255,255,255,.85)',
            }}
          >
            Nenhum material disponível para este curso.
          </div>
        )}

        {tem && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: '100%' }}>
            {Array.from(agrupados.entries()).map(([grupo, items]) => (
              <div key={grupo} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,.6)', margin: '4px 2px 0' }}>
                  {grupo}
                </div>

                {items.map((m) => {
                  const isFile = m.tipo !== 'Link';
                  const sameOrigin = m.url?.startsWith('/') || m.url?.startsWith(window.location.origin);
                  return (
                    <a
                      key={m.id}
                      href={m.url}
                      target={isFile && sameOrigin ? '_self' : '_blank'}
                      rel="noreferrer"
                      download={isFile ? '' : undefined}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr auto',
                        alignItems: 'center',
                        gap: 12,
                        textDecoration: 'none',
                        color: '#fff',
                        background: '#1e1e1e',
                        border: '1px solid #2a2a2a',
                        borderRadius: 10,
                        padding: '12px 14px',
                        minWidth: 0,
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <div
                          style={{
                            fontWeight: 600,
                            fontSize: 15,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                          title={m.titulo}
                        >
                          {m.titulo}
                        </div>
                        <div style={{ fontSize: 12, opacity: 0.8 }}>{m.tipo}</div>
                      </div>

                      <div
                        aria-hidden
                        style={{
                          display: 'grid',
                          placeItems: 'center',
                          width: 36,
                          height: 36,
                          borderRadius: 999,
                          background: 'rgba(255,255,255,.06)',
                          border: '1px solid rgba(255,255,255,.12)',
                        }}
                        title={isFile ? 'Baixar' : 'Abrir link'}
                      >
                        {isFile ? <FaDownload /> : <FaLink />}
                      </div>
                    </a>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="video-footer">
        <div className="footer-item" onClick={() => navigate(aulasPath)}>
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
        <div className="footer-item active" onClick={() => navigate(`${commentsBase}/materiais`)}>
          <FaRegFileAlt size={20} />
          <div className="footer-label">Materiais</div>
        </div>
      </footer>
    </div>
  );
}
