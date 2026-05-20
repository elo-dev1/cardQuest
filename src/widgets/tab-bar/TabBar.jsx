import { useLocation, useNavigate } from 'react-router-dom';

const tabs = [
  { icon: '🏠', label: 'Главная', path: '/home' },
  { icon: '✅', label: 'Задачи', path: '/tasks' },
  { icon: '🃏', label: 'Карточки', path: '/collection' },
  { icon: '⚔️', label: 'Битва', path: '/battle' },
  { icon: '👨‍👩‍👧', label: 'Семья', path: '/family' },
];

export const TabBar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path;
  };

  const handleTabClick = (path) => {
    navigate(path);
  };

  return (
    <nav className="tab-bar">
      {tabs.map((tab) => (
        <button
          key={tab.path}
          type="button"
          className={`tab-item ${isActive(tab.path) ? 'active' : ''}`}
          onClick={() => handleTabClick(tab.path)}
        >
          <span className="tab-icon">{tab.icon}</span>
          <span className="tab-label">{tab.label}</span>
        </button>
      ))}
    </nav>
  );
};
