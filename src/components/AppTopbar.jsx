import { Link } from 'react-router-dom';
import { signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';
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

export default function AppTopbar({
  isSidebarExpanded = false,
  onSignIn,
  onSignOut,
  user = null,
}) {
  const initials = getInitials(user);
  const { showNotice } = useAppNotice();

  const handleSignIn = async () => {
    try {
      if (onSignIn) {
        await onSignIn();
        return;
      }
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      if (error?.code === 'auth/popup-closed-by-user' || error?.code === 'auth/cancelled-popup-request') {
        showNotice(FEATURE_MESSAGES.LOGIN_CANCELLED, 'info');
      } else {
        console.error('Sign in failed:', error);
        showNotice('We could not start Google sign in. Please try again.', 'error');
      }
    }
  };

  const handleSignOutClick = async () => {
    if (onSignOut) {
      await onSignOut();
      return;
    }
    await signOut(auth);
  };

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
        {user ? (
          <>
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

            <button
              className="app-ghost-button"
              onClick={handleSignOutClick}
              type="button"
            >
              Sign out
            </button>

            <button
              className="app-topbar-signout-mobile"
              onClick={handleSignOutClick}
              type="button"
            >
              Sign out
            </button>
          </>
        ) : (
          <button
            className="primary-cta is-compact"
            onClick={handleSignIn}
            style={{ borderRadius: '12px', minHeight: '38px', padding: '0.45rem 1rem' }}
            type="button"
          >
            Sign in
          </button>
        )}
      </div>
    </header>
  );
}
