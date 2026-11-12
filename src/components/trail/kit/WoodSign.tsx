type WoodSignProps = {
  unitLabel: string;
  title: string;
  done?: number;
  total?: number;
  locked?: boolean;
  onPress?: () => void;
};

function Lock() {
  return (
    <svg viewBox="-24 -24 48 48" width="30" height="30" aria-hidden="true">
      <rect x="-11" y="-3" width="22" height="17" rx="5" fill="#fff" />
      <path d="M-6.5 -3 v-5 a6.5 6.5 0 0 1 13 0 v5" stroke="#fff" strokeWidth="4.5" fill="none" />
    </svg>
  );
}

/** The wooden unit sign: unit label, title and "n de m" progress, or a lock. */
export function WoodSign({ unitLabel, title, done = 0, total = 1, locked = false, onPress }: WoodSignProps) {
  const body = (
    <>
      <span className="k-sign-post k-sign-post-l" />
      <span className="k-sign-post k-sign-post-r" />
      <span className="k-sign-board">
        <span className="k-sign-text">
          <small>{unitLabel}</small>
          <strong>{title}</strong>
        </span>
        {locked ? (
          <span className="k-sign-lock">
            <Lock />
          </span>
        ) : (
          <span className="k-sign-progress">
            <span className="k-sign-bar">
              <i style={{ width: `${Math.min(100, (done / Math.max(1, total)) * 100)}%` }} />
            </span>
            <em>
              {done} de {total}
            </em>
          </span>
        )}
      </span>
    </>
  );
  const className = `k-sign ${locked ? "is-locked" : ""}`;
  return onPress ? (
    <button type="button" onClick={onPress} className={`${className} min-h-16`}>
      {body}
    </button>
  ) : (
    <div className={className}>{body}</div>
  );
}
