import React, { useEffect, useMemo, useState } from "react";
import { FaLock, FaCheckCircle, FaRegStar, FaHeart, FaPlayCircle } from "react-icons/fa";
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
  onComplete, // callback para marcar aula concluída
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

  const setCurrentAula = (aula) => {
    if (!aula) return;
    if (aula.bloqueado) {
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

  const todasAulas = useMemo(() => Object.values(modulos).flat(), [modulos]);

  // próxima aula (apenas para exibir a pílula; se estiver bloqueada, mostramos alerta ao clicar)
  const proximaAula = useMemo(() => {
    if (!currentAula) return null;
    const idx = todasAulas.findIndex((a) => a.id === currentAula.id);
    return idx >= 0 && idx + 1 < todasAulas.length ? todasAulas[idx + 1] : null;
  }, [todasAulas, currentAula]);

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
          <button className="vl-btn-back" onClick={() => window.history.back()} aria-label="Voltar">
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
          <div className="vl-lesson-icons">
            <button className="vl-icon-btn" aria-label="Favoritar">
              <FaRegStar />
            </button>
            <button className="vl-icon-btn" aria-label="Curtir">
              <FaHeart />
            </button>
            <button
              className={`vl-icon-btn completed ${Number(currentAula.progresso || 0) >= 100 ? "active" : ""}`}
              aria-label="Concluído"
              onClick={onComplete}
              title="Marcar como concluída"
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
          onClick={() =>
            proximaAula.bloqueado
              ? alert("Aula ainda bloqueada. Conclua a anterior para desbloquear.")
              : setCurrentAula(proximaAula)
          }
          aria-label={`Próxima aula ${proximaAula.titulo}`}
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
              placeItems: "center", // camelCase correto
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

                    return (
                      <button
                        key={aula.id}
                        className={`vl-lesson-item ${bloqueada ? "vl-locked" : ""} ${isCurrent ? "vl-current" : ""}`}
                        onClick={() => setCurrentAula(aula)}
                        aria-current={isCurrent ? "true" : undefined}
                        aria-disabled={bloqueada ? "true" : "false"}
                        disabled={bloqueada}
                        title={bloqueada ? "Bloqueada" : aula.titulo}
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
