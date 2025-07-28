// frontend/src/components/Header.jsx
import { FiUsers, FiBell, FiMessageSquare } from 'react-icons/fi';
import './Header.css';

export default function Header() {
  return (
    <header className="header-container">
      <div className="header-icons">
        <button className="header-button">
          <FiUsers size={22} />
          <span className="badge" />
        </button>
        <button className="header-button">
          <FiBell size={22} />
          <span className="badge" />
        </button>
        <button className="header-button">
          <FiMessageSquare size={22} />
          <span className="badge" />
        </button>
      </div>
    </header>
  );
}
