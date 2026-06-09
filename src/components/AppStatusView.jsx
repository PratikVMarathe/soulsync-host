export default function AppStatusView({
  actions = [],
  className = '',
  compact = false,
  state,
}) {
  return (
    <section className={`app-status-view${compact ? ' is-compact' : ''}${className ? ` ${className}` : ''}`}>
      <div className="app-status-card" role="alert">
        <span className="app-status-code">{state?.statusCode || 500}</span>
        <h1>{state?.title || 'Unexpected Error'}</h1>
        <p>{state?.message || 'Something unexpected happened while loading SoulSync.'}</p>

        {actions.length ? (
          <div className="app-status-actions">
            {actions.map((action) => (
              <button
                className={action.tone === 'secondary' ? 'secondary-cta' : 'primary-cta'}
                key={action.label}
                onClick={action.onClick}
                type="button"
              >
                {action.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
