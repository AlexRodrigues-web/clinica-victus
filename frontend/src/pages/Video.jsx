// src/pages/Video.jsx
import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  FaPlayCircle,
  FaRegCommentDots,
  FaRegStickyNote,
  FaRegFileAlt,
  FaChevronDown,
  FaChevronUp,
  FaLock,
  FaCheckCircle,
  FaRegStar,
  FaHeart
} from 'react-icons/fa';
import './Video.css';

export default function Video() {
  const { bibliotecaId, usuarioId } = useParams();
  const navigate = useNavigate();
  const [dados, setDados] = useState(null);
  const [currentAula, setCurrentAula] = useState(null);
  const [expanded, setExpanded] = useState({});
  const [isPlaying, setIsPlaying] = useState(false);

  const getEmbedUrl = (url) => {
    let id = '';
    if (url.includes('watch?v=')) {
      id = url.split('watch?v=')[1].split('&')[0];
    } else if (url.includes('youtu.be/')) {
      id = url.split('youtu.be/')[1].split('?')[0];
    } else {
      return url;
    }
    return `https://www.youtube.com/embed/${id}`;
  };

  useEffect(() => {
    fetch(
      `http://localhost/clinica-victus/backend/index.php?rota=video/${bibliotecaId}/${usuarioId}`
    )
      .then((r) => r.json())
      .then((data) => {
        if (data.sucesso) {
          setDados(data);
          const modKeys = Object.keys(data.modulos);
          for (let m of modKeys) {
            const next = data.modulos[m].find((a) => !a.bloqueado);
            if (next) {
              setCurrentAula(next);
              break;
            }
          }
        } else {
          navigate('/biblioteca');
        }
      })
      .catch(() => navigate('/biblioteca'));
  }, [bibliotecaId, usuarioId, navigate]);

  if (!dados || !currentAula) {
    return <div className="video-loading">Carregando...</div>;
  }

  const { biblioteca, modulos } = dados;
  const modKeys = Object.keys(modulos);
  const embedUrl = getEmbedUrl(currentAula.url_video);

  const toggleModule = (mod) => {
    setExpanded((prev) => ({ ...prev, [mod]: !prev[mod] }));
  };

  let proximaAula = null;
  for (let m of modKeys) {
    proximaAula = modulos[m].find((a) => !a.bloqueado);
    if (proximaAula) break;
  }

  return (
    <div className="video-page">
      {/* --- Header --- */}
      <header className="video-header">
  <button className="header-back-btn" onClick={() => navigate(-1)}>←</button>
  <div className="header-body">
    <h2 className="header-title">{biblioteca.titulo}</h2>
    <p className="header-subtitle">{currentAula.titulo}</p>
    <div className="header-progress-row">
      <div className="header-progress">
        <div
          className="header-bar"
          style={{ width: `${biblioteca.progresso}%` }}
        />
      </div>
      <span className="header-percent">{biblioteca.progresso}%</span>
    </div>
  </div>
</header>


      {/* --- Player + Overlay --- */}
      <div className="video-player">
        {!isPlaying && (
          <div
            className="video-overlay"
            onClick={() => setIsPlaying(true)}
          >
            <FaPlayCircle size={64} color="rgba(255,255,255,0.9)" />
          </div>
        )}
        <iframe
          src={
            isPlaying
              ? `${embedUrl}?autoplay=1`
              : embedUrl
          }
          title={currentAula.titulo}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
        <div className="embed-fallback">
          <p>Se o player não carregar:</p>
          <a
            href={currentAula.url_video}
            target="_blank"
            rel="noopener noreferrer"
          >
            Assistir no YouTube
          </a>
        </div>
      </div>

      {/* --- Meta & Ações --- */}
      <section className="video-info">
        <div className="video-meta">
          <h3>{currentAula.titulo}</h3>
          <div className="video-actions">
            <FaRegStar className="action-icon" />
            <FaHeart className="action-icon" />
            <FaCheckCircle className="action-icon completed" />
          </div>
        </div>
        <p className="video-description">
          {currentAula.descricao}
        </p>
      </section>

      {/* --- Próxima aula --- */}
      {proximaAula && (
        <div className="next-lesson-pill">
          <span>Próxima aula</span>
          <button
            onClick={() => {
              setCurrentAula(proximaAula);
              setIsPlaying(false);
            }}
          >
            <FaPlayCircle /> {proximaAula.titulo}
          </button>
        </div>
      )}

      {/* --- Accordion de Módulos --- */}
      <section className="video-list">
        {modKeys.map((modulo) => (
          <div key={modulo} className="accordion-item">
            <button
              className="accordion-header"
              onClick={() => toggleModule(modulo)}
            >
              <span>{modulo}</span>
              {expanded[modulo] ? <FaChevronUp /> : <FaChevronDown />}
            </button>
            {expanded[modulo] && (
              <div className="accordion-body">
                {modulos[modulo].map((aula) => (
                  <button
                    key={aula.id}
                    className={`lesson-button ${
                      aula.bloqueado ? 'locked' : ''
                    }`}
                    onClick={() => {
                      if (!aula.bloqueado) {
                        setCurrentAula(aula);
                        setIsPlaying(false);
                      }
                    }}
                  >
                    {aula.bloqueado ? (
                      <FaLock />
                    ) : (
                      <FaCheckCircle />
                    )}
                    <span>
                      {aula.ordem} | {aula.titulo}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </section>

      {/* --- Footer fixo --- */}
      <footer className="video-footer">
        <div className="footer-item active">
          <FaPlayCircle size={20} />
          Aulas
        </div>
        <div className="footer-item">
          <FaRegCommentDots size={20} />
          Comentários
        </div>
        <div className="footer-item">
          <FaRegStickyNote size={20} />
          Anotações
        </div>
        <div className="footer-item">
          <FaRegFileAlt size={20} />
          Materiais
        </div>
      </footer>
    </div>
  );
}
