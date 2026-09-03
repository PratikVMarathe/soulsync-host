import { useLocation, useNavigate } from 'react-router-dom';
import AppIcon from './AppIcon';
import Brand from './Brand';

const navigationItems = [
  { key: 'home', label: 'Home', icon: 'home', route: '/', section: 'dashboard-top' },
  { key: 'quiz', label: 'Quiz', icon: 'question', route: '/quiz' },
  { key: 'mandala', label: 'Satsang', icon: 'lotus', route: '/satsang-central' },
];

const mobileItems = navigationItems;

export default function AppSidebar({ isExpanded = false, onExpandedChange = () => { } }) {
  const location = useLocation();
  const navigate = useNavigate();

  const activeKey = location.pathname.startsWith('/quiz')
    ? 'quiz'
    : location.pathname.startsWith('/satsang-central')
      ? 'mandala'
      : 'home';

  const isBottomNavHidden = location.pathname.startsWith('/quiz/') || location.pathname.startsWith('/satsang-central');

  const scrollToSection = (section) => {
    if (section === 'dashboard-top') {
      window.scrollTo({ behavior: 'smooth', top: 0 });
      return;
    }

    document.getElementById(section)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };

  const handleNavigate = (item) => {
    if (item.route === '/' && location.pathname === '/' && item.section) {
      scrollToSection(item.section);
      return;
    }

    if (item.route) {
      navigate(item.route);
      if (item.section && item.route === '/') {
        setTimeout(() => scrollToSection(item.section), 100);
      }
    }
  };

  return (
    <>
      <aside
        className={`app-sidebar${isExpanded ? ' is-expanded' : ''}`}
        onMouseEnter={() => onExpandedChange(true)}
        onMouseLeave={() => onExpandedChange(false)}
      >
        <div className="app-sidebar-header">
          <Brand isCompact />
        </div>

        <nav aria-label="Main navigation" className="app-sidebar-nav">
          {navigationItems.map((item) => (
            <button
              aria-current={activeKey === item.key ? 'page' : undefined}
              className={`app-sidebar-link${activeKey === item.key ? ' is-active' : ''}`}
              key={item.key}
              onClick={() => handleNavigate(item)}
              type="button"
            >
              <AppIcon name={item.icon} size={22} />
              <span className="app-sidebar-label">{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      <nav
        aria-hidden={isBottomNavHidden ? 'true' : undefined}
        aria-label="Mobile navigation"
        className={`app-bottom-nav${isBottomNavHidden ? ' is-hidden' : ''}`}
      >
        {mobileItems.map((item) => (
          <button
            aria-current={activeKey === item.key ? 'page' : undefined}
            className={`app-bottom-link${activeKey === item.key ? ' is-active' : ''}`}
            key={item.key}
            onClick={() => handleNavigate(item)}
            tabIndex={isBottomNavHidden ? -1 : undefined}
            type="button"
          >
            <AppIcon name={item.icon} size={20} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </>
  );
}
