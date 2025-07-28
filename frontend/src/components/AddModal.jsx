// frontend/src/components/AddModal.jsx
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { FaPlayCircle, FaFilePdf } from 'react-icons/fa';
import AddFormLink from './AddFormLink';
import AddFormUpload from './AddFormUpload';
import './AddModal.css';

export default function AddModal({ isOpen, onClose }) {
  const [modo, setModo] = useState(null); // 'link' ou 'upload'

  if (!isOpen) return null;

  const handleFechar = () => {
    setModo(null); // limpa o modo antes de fechar
    onClose();
  };

  return (
    <div className="add-modal-overlay" onClick={handleFechar}>
      <div
        className="add-modal-content"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="add-modal-title">Adicionar Conteúdo</h2>

        {!modo && (
          <div className="add-modal-options">
            <button
              type="button"
              className="add-modal-btn"
              onClick={() => setModo('link')}
            >
              <FaPlayCircle size={20} className="add-modal-icon" />
              <span>Por Link</span>
            </button>

            <button
              type="button"
              className="add-modal-btn"
              onClick={() => setModo('upload')}
            >
              <FaFilePdf size={20} className="add-modal-icon" />
              <span>Enviar Arquivo</span>
            </button>
          </div>
        )}

        {modo === 'link' && (
          <div className="add-modal-form">
            <AddFormLink />
          </div>
        )}

        {modo === 'upload' && (
          <div className="add-modal-form">
            <AddFormUpload />
          </div>
        )}

        <button
          type="button"
          className="add-modal-cancel"
          onClick={handleFechar}
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

AddModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired
};
