// frontend/src/components/ModalAdicionar.jsx
import React from 'react';
import PropTypes from 'prop-types';
import { FaVideo, FaFilePdf, FaTimes } from 'react-icons/fa';
import './ModalAdicionar.css';

export default function ModalAdicionar({ isOpen, onClose, onSelecionar }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <header className="modal-header">
          <h3>Adicionar Conteúdo</h3>
          <button className="modal-close-btn" onClick={onClose}>
            <FaTimes size={16} />
          </button>
        </header>

        <div className="modal-body">
          <button
            className="btn-opcao"
            onClick={() => onSelecionar('video')}
          >
            <FaVideo className="btn-icon" />
            <span>Adicionar Vídeo</span>
          </button>

          <button
            className="btn-opcao"
            onClick={() => onSelecionar('pdf')}
          >
            <FaFilePdf className="btn-icon" />
            <span>Adicionar PDF</span>
          </button>
        </div>

        <footer className="modal-footer">
          <button className="btn-fechar" onClick={onClose}>
            Cancelar
          </button>
        </footer>
      </div>
    </div>
  );
}

ModalAdicionar.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSelecionar: PropTypes.func.isRequired
};
