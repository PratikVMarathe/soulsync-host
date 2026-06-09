import { useAppNotice } from '../hooks/useAppNotice';

export default function AppNoticeCenter() {
  const { clearNotice, notice } = useAppNotice();

  if (!notice) return null;

  return (
    <div className={`app-notice is-${notice.tone}`} role="status">
      <div className="app-notice-copy">
        <strong>Heads up</strong>
        <span>{notice.message}</span>
      </div>

      <button className="app-notice-dismiss" onClick={clearNotice} type="button">
        Dismiss
      </button>
    </div>
  );
}
