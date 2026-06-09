import { Link } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../config/firebase';
import { FEATURE_MESSAGES } from '../constants/featureMessages';
import { useAppNotice } from '../hooks/useAppNotice';
import AppIcon from './AppIcon';
import Brand from './Brand';

function getInitials(user) {
  const source = user?.displayName || user?.email || 'SoulSync';

  return source
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');
}

export default function AppTopbar({ user, isSidebarExpanded = false }) {
  const initials = getInitials(user);
  const { showNotice } = useAppNotice();

  return (
    <header className="app-topbar">
      <Link
        className={`app-topbar-wordmark${isSidebarExpanded ? ' is-hidden' : ''}`}
        to="/"
      >
        <span className="brand-mark-soul">Soul</span>
        <span className="brand-mark-sync">Sync</span>
      </Link>
      <div className="app-topbar-brand-mobile">
        <Brand compact />
      </div>

      <div className="app-topbar-actions">
        <div className="app-chip">
          <AppIcon name="fire" size={16} />
          <span>7 Day Streak</span>
        </div>

        <button
          className="app-icon-button"
          onClick={() => showNotice(FEATURE_MESSAGES.NOTIFICATIONS)}
          type="button"
        >
          <AppIcon name="bell" size={18} />
        </button>

        <Link
          aria-label="Open profile"
          className="app-user-pill app-user-pill-link"
          to="/profile"
        >
            <span className="app-user-fallback">{initials}</span>
        </Link>

        <button className="app-ghost-button" onClick={() => signOut(auth)} type="button">
          Sign out
        </button>

        <button
          className="app-topbar-signout-mobile"
          onClick={() => signOut(auth)}
          type="button"
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
