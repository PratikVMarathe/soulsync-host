import { Link } from 'react-router-dom';

export default function Brand({ compact = false, iconOnly = false, textOnly = false, to = '/' }) {
  return (
    <Link className={`brand-mark${compact ? ' is-compact' : ''}`} to={to}>
      {!textOnly && (
        <span className="brand-mark-icon">
          <img
            src="/logo-svg1.png"
            alt="SoulSync Logo"
            style={{ width: compact ? 30 : 35, height: compact ? 22 : 26 }}
          />
        </span>
      )}
      {!iconOnly && (
        <span className="brand-mark-text">
          <span className="brand-mark-soul">Soul</span>
          <span className="brand-mark-sync">Sync</span>
        </span>
      )}
    </Link>
  );
}
