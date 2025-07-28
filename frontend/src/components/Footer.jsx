// frontend/src/components/Footer.jsx
import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { useLocation, useNavigate } from 'react-router-dom';
import { FiHome, FiPlus } from 'react-icons/fi';
import { FaUtensils, FaRegPlayCircle } from 'react-icons/fa';
import { AuthContext } from '../contexts/AuthContext';
import './Footer.css';

export default function Footer({ onPlusClick }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { usuario } = useContext(AuthContext);

  // monta URL completa da foto de perfil, ou usa avatar padrão
  const fotoURL = usuario?.foto_perfil
    ? `http://localhost/clinica-victus/backend/${usuario.foto_perfil}`
    : '/default-avatar.png';

  // itens à esquerda do '+'
  const leftItems = [
    { path: '/dashboard', icon: <FiHome size={20} />,      label: 'Home'   },
    { path: '/plano',     icon: <FaUtensils size={20} />,  label: 'Plano'  },
  ];

  // itens à direita do '+'
  const rightItems = [
    { path: '/biblioteca', icon: <FaRegPlayCircle size={20} />, label: 'Biblioteca' },
    {
      path: '/perfil',
      icon: <img src={fotoURL} alt="Perfil" className="profile-img" />,
      label: 'Perfil'
    },
  ];

  const isActive = (path) => pathname === path;

  return (
    <nav className="footer-container" aria-label="Menu principal">
      {leftItems.map(item => (
        <FooterButton
          key={item.path}
          icon={item.icon}
          label={item.label}
          active={isActive(item.path)}
          onClick={() => navigate(item.path)}
        />
      ))}

      <div className="footer-plus-wrapper">
        <button
          type="button"
          className="plus-button"
          onClick={onPlusClick}
          aria-label="Adicionar conteúdo"
        >
          <FiPlus size={28} />
        </button>
      </div>

      {rightItems.map(item => (
        <FooterButton
          key={item.path}
          icon={item.icon}
          label={item.label}
          active={isActive(item.path)}
          onClick={() => navigate(item.path)}
        />
      ))}
    </nav>
  );
}

Footer.propTypes = {
  onPlusClick: PropTypes.func
};

Footer.defaultProps = {
  onPlusClick: () => {}
};

function FooterButton({ icon, label, active, onClick }) {
  return (
    <button
      type="button"
      className={`footer-item${active ? ' active' : ''}`}
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
    >
      {icon}
      <span className="footer-label">{label}</span>
    </button>
  );
}

FooterButton.propTypes = {
  icon: PropTypes.node.isRequired,
  label: PropTypes.string.isRequired,
  active: PropTypes.bool,
  onClick: PropTypes.func.isRequired
};

FooterButton.defaultProps = {
  active: false
};
