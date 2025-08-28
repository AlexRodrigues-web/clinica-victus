import { useContext, useEffect, useMemo, useState } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';
import api from '../services/api';
import './Dashboard.css';
import { FiUsers, FiBell, FiMessageSquare } from 'react-icons/fi';

const LS = {
  lembrete: (u) => `cv:dash:lembrete:${u}`,
  eventos:  (u) => `cv:dash:eventos:${u}`,
  peso:     (u) => `cv:dash:peso:${u}`,
  counts:   (u) => `cv:dash:counts:${u}`,
};

// tenta várias rotas até achar uma que exista (200)
async function tryGET(candidates = [], params = {}) {
  for (const rota of candidates) {
    try {
      const r = await api.get(rota, { params });
      if (r?.status === 200 && r?.data !== undefined) {
        return { ok: true, data: r.data, rota };
      }
    } catch {}
  }
  return { ok: false, data: null, rotaTried: candidates };
}

// normalizadores simples p/ lidar com formatos diferentes do controller
const pickArray = (data) =>
  Array.isArray(data) ? data :
  (Array.isArray(data?.itens) ? data.itens :
  (Array.isArray(data?.dados) ? data.dados : []));

const pickField = (obj, keys = []) => {
  for (const k of keys) if (obj && obj[k] != null) return obj[k];
  return undefined;
};

function formatBR(isoOrBR) {
  if (!isoOrBR) return '';
  const s = String(isoOrBR);
  if (s.includes('/')) return s;                 // já está em BR
  const onlyDate = s.slice(0, 10);               // YYYY-MM-DD (descarta hora)
  const [y, m, d] = onlyDate.split('-');
  return (y && m && d) ? `${d}/${m}` : s;
}

export default function Dashboard() {
  const { usuario, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const usuarioId = useMemo(() => Number(usuario?.id || 0), [usuario]);

  // UI
  const [destaques, setDestaques] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);

  // dados reais
  const [lembreteDoDia, setLembreteDoDia] = useState('');
  const [eventos, setEventos] = useState([]);
  const [peso, setPeso] = useState({ valor: 0, unidade: 'kg', total: 10 });
  const [counts, setCounts] = useState({ grupos: 0, alertas: 0, mensagens: 0 });

  // painéis
  const [openPanel, setOpenPanel] = useState(null); // 'grupos' | 'alertas' | 'mensagens' | null
  const [listaGrupos, setListaGrupos] = useState([]);
  const [listaAlertas, setListaAlertas] = useState([]);
  const [listaMensagens, setListaMensagens] = useState([]);

  // eventos: expandir/contrair inline
  const [mostrarTodosEventos, setMostrarTodosEventos] = useState(false);

  // carrossel (estático, só visual)
  useEffect(() => {
    setDestaques([
      { id: 1, titulo: 'Bem-vinda à minha App!', subtitulo: 'Clica aqui para iniciares a tua jornada', botao: 'Começa aqui', link: '/biblioteca' },
    ]);
  }, []);
  useEffect(() => {
    if (destaques.length <= 1) return;
    const t = setInterval(() => setActiveIndex(i => (i + 1) % destaques.length), 5000);
    return () => clearInterval(t);
  }, [destaques]);

  // ================== FIX: helpers p/ persistir e limpar badges ==================
  const persistCounts = (next) => {
    try { localStorage.setItem(LS.counts(usuarioId), JSON.stringify(next)); } catch {}
  };

  const clearPanelCount = (type) => {
    if (!type) return;
    setCounts(prev => {
      const next = { ...prev, [type]: 0 };
      persistCounts(next); // FIX: persiste zerado
      return next;
    });
  };
  // ==============================================================================

  // ================== LOADERS ==================
  useEffect(() => {
    if (!usuarioId) return;

    // Lembrete do dia
    (async () => {
      const { ok, data } = await tryGET([
        `lembrete/hoje/${usuarioId}`,
        `lembretes/hoje/${usuarioId}`,
      ]);
      if (ok) {
        const msg =
          pickField(data, ['mensagem', 'lembrete']) ??
          pickField(data?.data, ['mensagem']) ??
          '';
        if (msg) {
          setLembreteDoDia(msg);
          try { localStorage.setItem(LS.lembrete(usuarioId), JSON.stringify({ mensagem: msg })); } catch {}
        } else {
          throw new Error('sem mensagem');
        }
      } else {
        try {
          const raw = localStorage.getItem(LS.lembrete(usuarioId));
          const j = raw ? JSON.parse(raw) : null;
          setLembreteDoDia(j?.mensagem || 'Sem lembrete para hoje.');
        } catch {
          setLembreteDoDia('Sem lembrete para hoje.');
        }
      }
    })();

    // Eventos (usa notificações com tipo='evento')
    (async () => {
      const { ok, data } = await tryGET([
        `eventos/proximos/${usuarioId}`,
        `notificacoes/proximos/${usuarioId}`, // alias
      ], { limit: 5 });
      if (ok) {
        const arr = pickArray(data).map(ev => ({
          ...ev,
          data_br: ev.data_br || formatBR(ev.data || ev.inicio),
        }));
        setEventos(arr);
        try { localStorage.setItem(LS.eventos(usuarioId), JSON.stringify(arr)); } catch {}
      } else {
        try {
          const raw = localStorage.getItem(LS.eventos(usuarioId));
          setEventos(raw ? JSON.parse(raw) : []);
        } catch {
          setEventos([]);
        }
      }
    })();

    // Progresso peso
    (async () => {
      const { ok, data } = await tryGET([
        `usuarios/${usuarioId}/progresso-peso`,
        `peso/progresso/${usuarioId}`,
        `dashboard/progresso/${usuarioId}`
      ]);
      if (ok) {
        const base = (data?.dados || data?.data || data) || {};
        const v = Number(base?.valor ?? 0);
        const t = Number(base?.total ?? 10);
        const unidade = base?.unidade || 'kg';
        setPeso({ valor: v, unidade, total: t });
        try { localStorage.setItem(LS.peso(usuarioId), JSON.stringify({ valor: v, unidade, total: t })); } catch {}
      } else {
        try {
          const raw = localStorage.getItem(LS.peso(usuarioId));
          const j = raw ? JSON.parse(raw) : { valor: 0, unidade: 'kg', total: 10 };
          setPeso(j);
        } catch {
          setPeso({ valor: 0, unidade: 'kg', total: 10 });
        }
      }
    })();

    // Contagens (grupos/alertas/mensagens)
    (async () => {
      const { ok, data } = await tryGET([
        `notificacoes/contagens/${usuarioId}`,
        `dashboard/contagens/${usuarioId}`
      ]);
      if (ok) {
        const base = (data?.data || data) || {};
        const next = {
          grupos: Number(base?.grupos ?? 0),
          alertas: Number(base?.alertas ?? 0),
          mensagens: Number(base?.mensagens ?? 0),
        };
        setCounts(next);
        persistCounts(next);
      } else {
        try {
          const raw = localStorage.getItem(LS.counts(usuarioId));
          setCounts(raw ? JSON.parse(raw) : { grupos: 0, alertas: 0, mensagens: 0 });
        } catch {
          setCounts({ grupos: 0, alertas: 0, mensagens: 0 });
        }
      }
    })();
  }, [usuarioId]);

  // Ao abrir painel, carrega lista correspondente (para ficar “real”)
  useEffect(() => {
    if (!usuarioId || !openPanel) return;

    const loadPanel = async () => {
      if (openPanel === 'grupos') {
        const { ok, data } = await tryGET(
          [`notificacoes/listar/${usuarioId}`],
          { tipo: 'grupo', limit: 20 }
        );
        const itens = ok ? pickArray(data).map(i => ({ ...i, data: i.data || formatBR(i.data) })) : [];
        setListaGrupos(itens);
      }

      if (openPanel === 'alertas') {
        const { ok, data } = await tryGET(
          [`notificacoes/listar/${usuarioId}`],
          { tipo: 'alerta', limit: 20 }
        );
        const itens = ok ? pickArray(data).map(i => ({ ...i, data: i.data || formatBR(i.data) })) : [];
        setListaAlertas(itens);
      }

      if (openPanel === 'mensagens') {
        const { ok, data } = await tryGET(
          [
            `comentarios/listar/${usuarioId}`,
            `comentarios/${usuarioId}/listar`,
            `comentarios/usuario/${usuarioId}`,
            `comentarios/${usuarioId}`
          ],
          { limit: 20 }
        );
        const arr = ok ? pickArray(data) : [];
        const itens = arr.map(m => ({
          id: m.id,
          titulo: m.titulo || `Comentário #${m.id}`,
          conteudo: m.conteudo || m.mensagem || '',
          data: m.data || m.criado_em ? formatBR(String(m.criado_em).slice(0,10)) : undefined
        }));
        setListaMensagens(itens);
      }
    };

    loadPanel();
  }, [openPanel, usuarioId]);

  const handleLogout = () => { logout(); navigate('/login'); };

  // ======= valores derivados =======
  const percent = useMemo(() => {
    const t = Number(peso.total || 10);
    const v = Number(peso.valor || 0);
    if (!t) return 0;
    const p = (v / t) * 100;
    return Math.max(0, Math.min(100, Math.round(p)));
  }, [peso]);

  // formatação PT
  const kgFmt = useMemo(
    () => new Intl.NumberFormat('pt-PT', { maximumFractionDigits: 2 }).format(Number(peso.valor || 0)),
    [peso.valor]
  );

  // circunferência calibrada para SVG 120x120
  const R = 52;
  const C = 2 * Math.PI * R;
  const dash = useMemo(() => (percent / 100) * C, [percent]);

  const eventosExtra = useMemo(() => Math.max(0, eventos.length - 2), [eventos]);
  const eventosVisiveis = useMemo(
    () => (mostrarTodosEventos ? eventos : eventos.slice(0, 2)),
    [mostrarTodosEventos, eventos]
  );

  return (
    <>
      <main className="dashboard-container">
        {/* Topo com saudação e botões reais */}
        <div className="dashboard-top">
          <h2>Olá, <span>{usuario?.nome || 'Usuário'}</span></h2>

          <div className="dashboard-icons">
            {/* FIX: zera badge ao abrir */}
            <button
              className="icon-button icon-button--ghost"
              onClick={() => {
                const next = openPanel === 'grupos' ? null : 'grupos';
                setOpenPanel(next);
                if (next === 'grupos' && counts.grupos > 0) clearPanelCount('grupos');
              }}
              aria-label="Grupos"
            >
              <FiUsers size={20} />
              {counts.grupos > 0 && <span className="badge-top">{counts.grupos}</span>}
            </button>

            {/* FIX: zera badge ao abrir */}
            <button
              className="icon-button icon-button--ghost"
              onClick={() => {
                const next = openPanel === 'alertas' ? null : 'alertas';
                setOpenPanel(next);
                if (next === 'alertas' && counts.alertas > 0) clearPanelCount('alertas');
              }}
              aria-label="Lembretes/alertas"
            >
              <FiBell size={20} />
              {counts.alertas > 0 && <span className="badge-top">{counts.alertas}</span>}
            </button>

            {/* FIX: zera badge ao abrir */}
            <button
              className="icon-button icon-button--ghost"
              onClick={() => {
                const next = openPanel === 'mensagens' ? null : 'mensagens';
                setOpenPanel(next);
                if (next === 'mensagens' && counts.mensagens > 0) clearPanelCount('mensagens');
              }}
              aria-label="Mensagens"
            >
              <FiMessageSquare size={20} />
              {counts.mensagens > 0 && <span className="badge-top">{counts.mensagens}</span>}
            </button>
          </div>
        </div>

        {/* Painel flutuante */}
        {openPanel && (
          <div className="dash-panel" role="dialog" aria-modal="true" onClick={() => setOpenPanel(null)}>
            <div className="dash-panel-box" onClick={(e) => e.stopPropagation()}>
              <header className="dash-panel-header">
                <strong>
                  {openPanel === 'grupos' ? 'Grupos' : openPanel === 'alertas' ? 'Alertas' : 'Mensagens'}
                </strong>
                <button className="dash-panel-close" onClick={() => setOpenPanel(null)}>×</button>
              </header>

              <div className="dash-panel-body">
                {openPanel === 'grupos' && (listaGrupos.length ? (
                  listaGrupos.map(n => (
                    <div key={n.id} className="dash-item">
                      <div className="dash-item-title">{n.titulo || n.mensagem}</div>
                      {n.data && <div className="dash-item-sub">{n.data}</div>}
                    </div>
                  ))
                ) : <div className="dash-empty">Sem itens.</div>)}

                {openPanel === 'alertas' && (listaAlertas.length ? (
                  listaAlertas.map(n => (
                    <div key={n.id} className="dash-item">
                      <div className="dash-item-title">{n.titulo || n.mensagem}</div>
                      {n.data && <div className="dash-item-sub">{n.data}</div>}
                    </div>
                  ))
                ) : <div className="dash-empty">Sem alertas.</div>)}

                {openPanel === 'mensagens' && (listaMensagens.length ? (
                  listaMensagens.map(m => (
                    <div key={m.id} className="dash-item">
                      <div className="dash-item-title">{m.titulo || `Comentário #${m.id}`}</div>
                      {m.conteudo && <div className="dash-item-sub">{m.conteudo}</div>}
                    </div>
                  ))
                ) : <div className="dash-empty">Sem mensagens.</div>)}
              </div>
            </div>
          </div>
        )}

        {/* Card de boas-vindas (carrossel) */}
        <section className="dashboard-card welcome-card">
          <div className="welcome-carousel">
            {destaques.map((item, index) => (
              <div key={item.id} className={`carousel-item ${index === activeIndex ? 'active' : ''}`}>
                <h3>{item.titulo}</h3>
                <p>{item.subtitulo}</p>
                <button className="welcome-button" onClick={() => navigate(item.link)}>{item.botao}</button>
              </div>
            ))}
            <div className="carousel-dots">
              {destaques.map((_, i) => (
                <span key={i} className={`dot ${i === activeIndex ? 'active' : ''}`} onClick={() => setActiveIndex(i)} />
              ))}
            </div>
          </div>
          <div className="welcome-image">
            <img src="/imagens/boasvindas.png" alt="Imagem da clínica" />
          </div>
        </section>

        {/* Lembrete do Dia – layout/table como no mock */}
        <section className="dashboard-card reminder-card">
          <h4>LEMBRETE DO DIA:</h4>
          <table className="reminder-table" aria-label="Lembrete do dia">
            <tbody>
              <tr>
                <td>{lembreteDoDia || 'Sem lembrete para hoje.'}</td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* Progresso (anel) + Próximos eventos */}
        <section className="dashboard-row">
          {/* PROGRESSO – anel idêntico ao mock */}
          <div className="dashboard-card progress-card">
            <div className="circle-progress">
              {/* SVG 120x120 com dash baseado na circunferência */}
              <svg viewBox="0 0 120 120" className="circular-chart" aria-hidden="true">
                {/* disco branco interno */}
                <circle cx="60" cy="60" r="46" className="disk" />
                {/* aro branco de fundo */}
                <circle cx="60" cy="60" r={R} className="ring-bg" />
                {/* arco dourado */}
                <circle
                  cx="60"
                  cy="60"
                  r={R}
                  className="ring"
                  strokeLinecap="round"
                  style={{ strokeDasharray: `${dash} ${C - dash}`, stroke: 'var(--vc-gold)' }}
                />
              </svg>

              <div className="progress-text">
                <div className="progress-kg">
                  {kgFmt}<span>kg</span>
                </div>
                <div className="progress-sub">perdidos</div>
              </div>
            </div>
          </div>

          {/* EVENTOS — 2 linhas + “+N evento(s)” com expand/collapse inline */}
          <div className="dashboard-card events-card">
            <h4>Próximos eventos:</h4>
            <div className="events-list">
              {eventosVisiveis.length ? eventosVisiveis.map(ev => (
                <div key={ev.id} className="event-row">
                  <div className="event-date">{ev.data_br}</div>
                  <div className="event-name">{ev.titulo || ev.mensagem || 'Evento'}</div>
                </div>
              )) : <div className="event-empty">Sem eventos.</div>}

              {eventosExtra > 0 && (
                <div
                  className="event-row event-more"
                  role="button"
                  tabIndex={0}
                  onClick={() => setMostrarTodosEventos(v => !v)}
                  onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setMostrarTodosEventos(v => !v)}
                  title={mostrarTodosEventos ? 'Ver menos' : 'Ver mais'}
                >
                  {mostrarTodosEventos
                    ? 'Ver menos'
                    : `+ ${eventosExtra} evento${eventosExtra > 1 ? 's' : ''}`}
                </div>
              )}
            </div>
          </div>
        </section>

        <div className="dashboard-logout">
          <button onClick={handleLogout} className="logout-button">Sair</button>
        </div>
      </main>

      <Footer />
    </>
  );
}
