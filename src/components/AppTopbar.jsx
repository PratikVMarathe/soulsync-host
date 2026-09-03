import { Link } from 'react-router-dom';
import Brand from './Brand';

export default function AppTopbar({
  isSidebarExpanded = false,
}) {
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

      <div className="app-topbar-actions" />
    </header>
  );
}
