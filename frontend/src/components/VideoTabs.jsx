// components/VideoTabs.jsx
import { FaPlayCircle, FaRegCommentDots, FaRegStickyNote, FaRegFileAlt } from 'react-icons/fa';

export default function VideoTabs({ activeTab, setActiveTab }) {
  return (
    <footer className="video-footer">
      <div 
        className={`footer-item ${activeTab === 'aulas' ? 'active' : ''}`} 
        onClick={() => setActiveTab('aulas')}
      >
        <FaPlayCircle size={20} />
        <div>Aulas</div>
      </div>
      <div 
        className={`footer-item ${activeTab === 'comentarios' ? 'active' : ''}`} 
        onClick={() => setActiveTab('comentarios')}
      >
        <FaRegCommentDots size={20} />
        <div>Comentários</div>
      </div>
      <div 
        className={`footer-item ${activeTab === 'anotacoes' ? 'active' : ''}`} 
        onClick={() => setActiveTab('anotacoes')}
      >
        <FaRegStickyNote size={20} />
        <div>Anotações</div>
      </div>
      <div 
        className={`footer-item ${activeTab === 'materiais' ? 'active' : ''}`} 
        onClick={() => setActiveTab('materiais')}
      >
        <FaRegFileAlt size={20} />
        <div>Materiais</div>
      </div>
    </footer>
  );
}
