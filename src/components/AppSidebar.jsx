import { useLocation, useNavigate } from 'react-router-dom';
import AppIcon from './AppIcon';
import Brand from './Brand';

const navigationItems = [
  { key: 'home', label: 'Home', icon: 'home', section: 'dashboard-top' },
  { key: 'learn', label: 'Learn', icon: 'book', section: 'continue-learning' },
  { key: 'quiz', label: 'Quiz', icon: 'question', section: 'active-challenges' },
  { key: 'guide', label: 'AI Guide', icon: 'message', section: 'ai-guide-panel' },
  { key: 'bookmarks', label: 'Bookmarks', icon: 'bookmark', section: 'continue-learning' },
  { key: 'progress', label: 'Progress', icon: 'levels', section: 'progress-overview' },
];

const mobileItems = [
  navigationItems[0],
  navigationItems[1],
  navigationItems[2],
  navigationItems[3],
  { key: 'profile', label: 'Profile', icon: 'profile', section: 'profile-anchor' },
];

function getInitials(user) {
  const source = user?.displayName || user?.email || 'SoulSync';

  return source
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');
}

export default function AppSidebar({ user, isExpanded = false, onExpandedChange = () => {} }) {
  const location = useLocation();
  const navigate = useNavigate();
  const initials = getInitials(user);

  const activeKey = location.pathname.startsWith('/quiz/') ? 'quiz' : 'home';

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
    if (location.pathname === '/' && item.section) {
      scrollToSection(item.section);
      return;
    }

    if (typeof window !== 'undefined' && item.section) {
      window.sessionStorage.setItem('soulsync-scroll-target', item.section);
    }

    navigate('/');
  };

  const handleBlurCapture = (event) => {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      onExpandedChange(false);
    }
  };

  return (
    <>
      <aside
        aria-label="Primary navigation"
        className={`app-sidebar${isExpanded ? ' is-expanded' : ''}`}
        onBlurCapture={handleBlurCapture}
        onFocusCapture={() => onExpandedChange(true)}
        onMouseEnter={() => onExpandedChange(true)}
        onMouseLeave={() => onExpandedChange(false)}
      >
        <div className="app-sidebar-header">
          <Brand compact iconOnly={!isExpanded} />
        </div>

        <nav className="app-sidebar-nav">
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

        <div className="app-sidebar-footer">
          <div className="app-streak-card">
            <strong>
              <AppIcon name="fire" size={18} />
              <span>7</span>
            </strong>
            <small>Day Streak</small>
          </div>

          <button
            className="app-sidebar-profile"
            onClick={() => handleNavigate({ section: 'profile-anchor' })}
            type="button"
          >
            <span className="app-sidebar-avatar">{initials}</span>
            <span className="app-sidebar-profile-copy">
              <strong>{user?.displayName || 'SoulSync Member'}</strong>
              <small>View Profile</small>
            </span>
            <AppIcon className="app-sidebar-profile-arrow" name="chevron" size={16} />
          </button>
        </div>
      </aside>

      <nav className="app-bottom-nav" aria-label="Mobile navigation">
        {mobileItems.map((item) => (
          <button
            aria-current={activeKey === item.key ? 'page' : undefined}
            className={`app-bottom-link${activeKey === item.key ? ' is-active' : ''}`}
            key={item.key}
            onClick={() => handleNavigate(item)}
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
