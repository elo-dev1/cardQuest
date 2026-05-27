import { useLocation, useNavigate } from 'react-router-dom';

const tabs = [
  { icon: '/sidebar/home.png', label: 'Главная', path: '/home' },
  { icon: '/sidebar/tasks.png', label: 'Задачи', path: '/tasks' },
  { icon: '/sidebar/collections.png', label: 'Карточки', path: '/collection' },
  { icon: '/sidebar/fight.png', label: 'Битва', path: '/battle' },
  { icon: '/sidebar/family.png', label: 'Семья', path: '/family' },
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
          <span className="tab-icon">
            <img src={tab.icon} alt="" className="h-5 w-5" />
          </span>
          <span className="tab-label">{tab.label}</span>
        </button>
      ))}
    </nav>
  );
};
