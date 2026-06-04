import { Link } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../config/firebase';
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

  return (
    <header className="app-topbar">
      <Link
        className={`app-topbar-wordmark${isSidebarExpanded ? ' is-hidden' : ''}`}
        to="/"
      >
        SoulSync
      </Link>
      <div className="app-topbar-brand-mobile">
        <Brand compact />
      </div>

      <div className="app-topbar-actions">
        <div className="app-chip">
          <AppIcon name="fire" size={16} />
          <span>7 Day Streak</span>
        </div>

        <button className="app-icon-button" type="button">
          <AppIcon name="bell" size={18} />
        </button>

        <div className="app-user-pill">
          {user?.photoURL ? (
            <img alt={user.displayName || 'Profile'} src={user.photoURL} />
          ) : (
            <span className="app-user-fallback">{initials}</span>
          )}
        </div>

        <button className="app-ghost-button" onClick={() => signOut(auth)} type="button">
          Sign out
        </button>
      </div>
    </header>
  );
}
