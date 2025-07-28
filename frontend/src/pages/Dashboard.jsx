// frontend/src/pages/Dashboard.jsx
import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';
import './Dashboard.css';
import { FiUsers, FiBell, FiMessageSquare } from 'react-icons/fi';

export default function Dashboard() {
  const { usuario, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [destaques, setDestaques] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [lembreteDoDia, setLembreteDoDia] = useState('');
  const [eventos, setEventos] = useState([]);
  const [progresso, setProgresso] = useState({ valor: 0, unidade: 'kg', total: 100 });

  // fallback estático para eventos
  const defaultEventos = [
    { id: 1, data: '23/05', titulo: 'Masterclass' },
    { id: 2, data: '12/08', titulo: 'Workshop' },
    { id: 3, data: '01/09', titulo: 'Sessão de Coaching' }
  ];

  useEffect(() => {
    // Carrossel
    setDestaques([
      {
        id: 1,
        titulo: 'Bem-vinda à minha App!',
        subtitulo: 'Clica aqui para iniciares a tua jornada',
        botao: 'Começa aqui',
        link: 'https://joanapinho.pt/'
      },
      {
        id: 2,
        titulo: 'Novo conteúdo disponível!',
        subtitulo: 'Descubra as novidades de hoje',
        botao: 'Ver agora',
        link: 'https://www.victus.pt/#service'
      },
      {
        id: 3,
        titulo: 'Participe do nosso workshop',
        subtitulo: 'Aprenda dicas exclusivas',
        botao: 'Inscreva-se',
        link: 'https://eventos.victus.pt/workshops'
      }
    ]);

    // Lembrete do dia
    fetch('http://localhost/clinica-victus/backend/index.php?rota=lembrete')
      .then(res => res.json())
      .then(data => setLembreteDoDia(data.mensagem || ''))
      .catch(() => setLembreteDoDia(''));

    // Próximos eventos com fallback
    fetch('/api/eventos')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length) {
          setEventos(data);
        } else {
          setEventos(defaultEventos);
        }
      })
      .catch(() => setEventos(defaultEventos));

    // Progresso do usuário
    fetch('/api/progresso')
      .then(res => res.json())
      .then(data => setProgresso(data))
      .catch(() => setProgresso({ valor: 0, unidade: 'kg', total: 100 }));
  }, []);

  useEffect(() => {
    // Auto-avanço do carrossel
    if (destaques.length <= 1) return;
    const interval = setInterval(() => {
      setActiveIndex(i => (i + 1) % destaques.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [destaques]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      <main className="dashboard-container">
        {/* Topo com saudação e botões */}
        <div className="dashboard-top">
          <h2>
            Olá, <span>{usuario?.nome || 'Usuário'}</span>
          </h2>
          <div className="dashboard-icons">
            <a
              className="icon-button"
              href="https://www.instagram.com/victus.clinica/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
            >
              <FiUsers size={20} />
              <span className="badge-top" />
            </a>
            <a
              className="icon-button"
              href="https://www.victus.pt/contactos/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Contactos"
            >
              <FiBell size={20} />
              <span className="badge-top" />
            </a>
            <a
              className="icon-button"
              href="mailto:geral@victus.pt"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Email"
            >
              <FiMessageSquare size={20} />
              <span className="badge-top" />
            </a>
          </div>
        </div>

        {/* Carrossel de Boas-Vindas */}
        <section className="dashboard-card welcome-card">
          <div className="welcome-carousel">
            {destaques.map((item, index) => (
              <div
                key={item.id}
                className={`carousel-item ${index === activeIndex ? 'active' : ''}`}
              >
                <h3>{item.titulo}</h3>
                <p>{item.subtitulo}</p>
                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="welcome-button"
                >
                  {item.botao}
                </a>
              </div>
            ))}
            <div className="carousel-dots">
              {destaques.map((_, i) => (
                <span
                  key={i}
                  className={`dot ${i === activeIndex ? 'active' : ''}`}
                  onClick={() => setActiveIndex(i)}
                />
              ))}
            </div>
          </div>
          <div className="welcome-image">
            <img src="/imagens/boasvindas.png" alt="Imagem da clínica" />
          </div>
        </section>

        {/* Lembrete do Dia */}
       <section className="dashboard-card reminder-card">
  <h4>LEMBRETE DO DIA:</h4>
  <table className="reminder-table">
    <tbody>
      <tr>
        <td>{lembreteDoDia || 'Sem lembrete para hoje.'}</td>
      </tr>
    </tbody>
  </table>
</section>


        {/* Progresso e Próximos Eventos */}
        <section className="dashboard-row">
          {/* Progresso */}
          <div className="dashboard-card progress-card">
            <div className="circle-progress">
              <svg viewBox="0 0 36 36" className="circular-chart">
                <path
                  className="circle-bg"
                  d="M18 2.0845 a 15.9155 15.9155 0 1 1 0 31.831 a 15.9155 15.9155 0 1 1 0 -31.831"
                />
                <path
                  className="circle"
                  strokeDasharray={`${progresso.valor}, ${progresso.total}`}
                  d="M18 2.0845 a 15.9155 15.9155 0 1 1 0 31.831 a 15.9155 15.9155 0 1 1 0 -31.831"
                />
              </svg>
              <div className="progress-text">
                {progresso.valor}
                {progresso.unidade}
                <br />
                perdidos
              </div>
            </div>
          </div>

          {/* Eventos */}
<div className="dashboard-card events-card">
  <h4>Próximos eventos:</h4>
  <div className="events-list">
    <div className="event-row">
      <div className="event-date">23/05</div>
      <div className="event-name">Masterclass</div>
    </div>
    <div className="event-row">
      <div className="event-date">12/08</div>
      <div className="event-name">Workshop</div>
    </div>
    {/* Aqui transformamos em link */}
    <a
      className="event-row event-more"
      href="https://eventos.victus.pt/workshops"
      target="_blank"
      rel="noopener noreferrer"
    >
      +1 evento
    </a>
  </div>
</div>


        </section>

        {/* Botão de Logout */}
        <div className="dashboard-logout">
          <button onClick={handleLogout} className="logout-button">
            Sair
          </button>
        </div>
      </main>

      <Footer />
    </>
  );
}
