// frontend/src/components/VideoLessons.jsx
import React, { useEffect, useMemo, useState } from "react";
import { FaLock, FaCheckCircle, FaRegStar, FaStar, FaHeart, FaPlayCircle } from "react-icons/fa";
import { IoIosArrowBack } from "react-icons/io";
import "./VideoLessons.css";

export default function VideoLessons({
  biblioteca: propBiblioteca,
  modulos: propModulos,
  currentAula: propCurrentAula,
  setCurrentAula: propSetCurrentAula,
  expanded: propExpanded,
  toggleModule: propToggleModule,
  showHeader = false,
  onComplete,   // callback para marcar aula concluída
  onNext,       // pai avança para a próxima (marca atual 100%, refetch e autoplay)
  // === NOVO: prefs do vídeo + handlers ===
  prefs = {},                      // { favorite, liked, completed }
  onToggleFavorite = () => {},     // handler vindo do pai
  onToggleLiked = () => {},        // handler vindo do pai
  savingPrefs = false,             // bloqueia clique enquanto salva
}) {
  const biblioteca = propBiblioteca || { id: 0, titulo: "Curso", progresso: 0 };
  const modulos = propModulos || {};

  const progressoCurso = Number(biblioteca.progresso || 0);
  const tituloCurso = biblioteca.titulo || "Sem título";

  // estado local (fallback quando não vier controlado por props)
  const [localExpanded, setLocalExpanded] = useState({});
  const [localCurrentAula, setLocalCurrentAula] = useState(null);

  const expanded = propExpanded || localExpanded;
  const currentAula = propCurrentAula || localCurrentAula;

  const todasAulas = useMemo(() => Object.values(modulos).flat(), [modulos]);
  const currentIndex = useMemo(
    () => (currentAula ? todasAulas.findIndex(a => a.id === currentAula.id) : -1),
    [todasAulas, currentAula]
  );

  const setCurrentAula = (aula) => {
    if (!aula) return;

    // Se o usuário clicou na PRÓXIMA aula e ela está bloqueada, delega para onNext
    const isNextOfCurrent = currentIndex >= 0 && todasAulas[currentIndex + 1]?.id === aula.id;
    if (aula.bloqueado) {
      if (onNext && isNextOfCurrent) {
        onNext(aula);
        return;
      }
      alert("Aula ainda bloqueada. Conclua a anterior para desbloquear.");
      return;
    }

    if (propSetCurrentAula) propSetCurrentAula(aula);
    else setLocalCurrentAula(aula);

    const nomeModulo = aula.modulo || aula.modulo_nome;
    if (!nomeModulo) return;

    if (propExpanded) {
      if (propToggleModule && !expanded[nomeModulo]) propToggleModule(nomeModulo);
    } else {
      setLocalExpanded((prev) => ({ ...prev, [nomeModulo]: true }));
    }
  };

  const toggleModule = (mod) => {
    if (propToggleModule) propToggleModule(mod);
    else setLocalExpanded((prev) => ({ ...prev, [mod]: !prev[mod] }));
  };

  // abrir 1º módulo e selecionar 1ª aula se nada selecionado
  useEffect(() => {
    const moduloKeys = Object.keys(modulos || {});
    if (moduloKeys.length === 0) return;

    if (!currentAula) {
      const firstModule = moduloKeys[0];
      const primeira = (modulos[firstModule] || [])[0];
      if (primeira) {
        if (propSetCurrentAula) propSetCurrentAula(primeira);
        else setLocalCurrentAula(primeira);
      }
    }

    const hasExpanded = Object.keys(expanded || {}).some((k) => expanded[k]);
    if (!hasExpanded) {
      const first = moduloKeys[0];
      if (propExpanded) propToggleModule?.(first);
      else setLocalExpanded((prev) => (prev[first] ? prev : { ...prev, [first]: true }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modulos]);

  // próxima aula (para o botão-pílula)
  const proximaAula = useMemo(() => {
    if (currentIndex < 0) return null;
    return currentIndex + 1 < todasAulas.length ? todasAulas[currentIndex + 1] : null;
  }, [todasAulas, currentIndex]);

  const formatPercent = (v) => `${Math.round(Number(v || 0))}%`;

  // badge do módulo (igual ao mock: concluído / aberto / bloqueado)
  const moduleStatus = (moduloNome) => {
    const list = modulos[moduloNome] || [];
    if (!list.length) return "locked";
    const done = list.every((a) => Number(a.progresso || 0) >= 100);
    if (done) return "done";
    const hasUnlocked = list.some((a) => !a.bloqueado);
    return hasUnlocked ? "open" : "locked";
  };

  return (
    <div className="vl-container">
      {/* Header opcional (quando este componente for usado sozinho numa página) */}
      {showHeader && (
        <div className="vl-header">
          <button className="vl-btn-back" onClick={() => window.history.back()} aria-label="Voltar" type="button">
            <IoIosArrowBack size={24} />
          </button>
          <div className="vl-course-info">
            <h2 className="vl-course-title">{tituloCurso}</h2>
            <div className="vl-progress-row">
              <div className="vl-progress-bar">
                <div className="vl-progress-fill" style={{ width: `${progressoCurso}%` }} />
              </div>
              <span className="vl-progress-text">{formatPercent(progressoCurso)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Aula atual (título/descrição/ações) */}
      {currentAula && (
        <div className="vl-lesson-info updated">
          <div className="vl-lesson-text-container">
            <h3 className="vl-lesson-title">{currentAula.titulo}</h3>
            <p className="vl-description">{currentAula.descricao || ""}</p>
          </div>

          {/* === Ícones de ação (com estado + logs de erro) === */}
          <div className="vl-lesson-icons">
            <button
              className={`vl-icon-btn ${prefs?.favorite ? "active" : ""}`}
              aria-label={prefs?.favorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
              title={prefs?.favorite ? "Remover dos favoritos" : "Favoritar"}
              onClick={() => {
                try {
                  onToggleFavorite();
                } catch (e) {
                  console.error("[VideoLessons] Erro ao alternar favorito:", e);
                }
              }}
              disabled={savingPrefs}
              type="button"
            >
              {prefs?.favorite ? <FaStar /> : <FaRegStar />}
            </button>

            <button
              className={`vl-icon-btn ${prefs?.liked ? "active" : ""}`}
              aria-label={prefs?.liked ? "Remover curtida" : "Curtir"}
              title={prefs?.liked ? "Remover curtida" : "Curtir"}
              onClick={() => {
                try {
                  onToggleLiked();
                } catch (e) {
                  console.error("[VideoLessons] Erro ao alternar curtida:", e);
                }
              }}
              disabled={savingPrefs}
              type="button"
            >
              <FaHeart />
            </button>

            <button
              className={`vl-icon-btn completed ${Number(currentAula.progresso || 0) >= 100 ? "active" : ""}`}
              aria-label="Concluído"
              title="Marcar como concluída"
              onClick={() => {
                try {
                  onComplete && onComplete();
                } catch (e) {
                  console.error("[VideoLessons] Erro ao marcar concluído:", e);
                }
              }}
              type="button"
            >
              <FaCheckCircle />
            </button>
          </div>
        </div>
      )}

      {/* Pílula “Próxima aula” */}
      {proximaAula && (
        <button
          className="vl-btn-next updated"
          onClick={() => {
            if (onNext) {
              onNext(proximaAula); // pai conclui a atual, refetch e abre a próxima já desbloqueada
            } else {
              // fallback
              proximaAula.bloqueado
                ? alert("Aula ainda bloqueada. Conclua a anterior para desbloquear.")
                : setCurrentAula(proximaAula);
            }
          }}
          aria-label={`Próxima aula ${proximaAula.titulo}`}
          type="button"
        >
          <div className="vl-next-info">
            <span className="vl-next-label">Próxima aula</span>
            <span className="vl-next-title">{proximaAula.titulo}</span>
          </div>
          <span
            style={{
              width: 30,
              height: 30,
              borderRadius: 999,
              display: "grid",
              placeItems: "center",
              background: "#f0c94b",
            }}
          >
            <FaPlayCircle size={16} />
          </span>
        </button>
      )}

      {/* Lista de módulos e aulas numeradas */}
      <div className="vl-module-list updated">
        {Object.keys(modulos || {}).map((moduloNome) => {
          const status = moduleStatus(moduloNome); // 'done' | 'open' | 'locked'
          return (
            <div key={moduloNome} className="vl-module">
              <button
                className="vl-module-header"
                onClick={() => toggleModule(moduloNome)}
                aria-expanded={!!expanded[moduloNome]}
                aria-controls={`modulo-${moduloNome}`}
                type="button"
              >
                <span className={`vl-module-badge ${status}`}>
                  {status === "done" ? <FaCheckCircle /> : status === "open" ? <FaRegStar /> : <FaLock />}
                </span>
                <span className="vl-module-title">{moduloNome}</span>
                <span className="vl-arrow">{expanded[moduloNome] ? "▲" : "▼"}</span>
              </button>

              {expanded[moduloNome] && (
                <div className="vl-module-body" id={`modulo-${moduloNome}`}>
                  {(modulos[moduloNome] || []).map((aula) => {
                    const isCurrent = currentAula?.id === aula.id;
                    const bloqueada = !!aula.bloqueado;
                    const completa = Number(aula.progresso || 0) >= 100;
                    const progressoAula = Number(aula.progresso || 0);

                    const isNextOfCurrent =
                      currentIndex >= 0 && todasAulas[currentIndex + 1]?.id === aula.id;

                    return (
                      <button
                        key={aula.id}
                        className={`vl-lesson-item ${bloqueada ? "vl-locked" : ""} ${isCurrent ? "vl-current" : ""}`}
                        onClick={() => setCurrentAula(aula)}
                        aria-current={isCurrent ? "true" : undefined}
                        aria-disabled={bloqueada ? "true" : "false"}
                        // se bloqueada mas for a próxima, permitimos o clique p/ acionar onNext
                        disabled={bloqueada && !(onNext && isNextOfCurrent)}
                        title={bloqueada ? "Bloqueada" : aula.titulo}
                        type="button"
                      >
                        <span className={`vl-status-icon ${bloqueada ? "locked" : completa ? "completed" : "incomplete"}`}>
                          {bloqueada ? <FaLock /> : completa ? <FaCheckCircle /> : <FaRegStar />}
                        </span>
                        <div className="vl-lesson-main">
                          <span className="vl-lesson-text">
                            {aula.ordem} | {aula.titulo}
                          </span>
                          {!completa && (
                            <div className="vl-lesson-progress-wrapper">
                              <div className="vl-lesson-progress">
                                <div className="vl-lesson-progress-fill" style={{ width: `${progressoAula}%` }} />
                              </div>
                              <span className="vl-lesson-progress-text">{formatPercent(progressoAula)}</span>
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
