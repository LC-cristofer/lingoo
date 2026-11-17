import type { ReactNode } from "react";

type UnitHeaderProps = {
  unitLabel: string;
  title: string;
  done?: number;
  total?: number;
  locked?: boolean;
  onPress?: () => void;
  /** Name for screen readers when the header is pressable (its text is split in parts). */
  ariaLabel?: string;
  /** The unit id: its sticker (/art/units/<id>.webp) fills the icon chip. */
  unitId?: string;
  /** The small glyph in the icon chip when there is no unitId; a sprout by default. */
  icon?: ReactNode;
};

function Sprout() {
  return (
    <svg viewBox="-12 -12 24 24" width="22" height="22" aria-hidden="true">
      <path d="M0 10 V-1 M0 2 C-8 2 -9 -5 -9 -7 C-1 -7 0 -1 0 2 M0 -1 C0 -8 3 -10 9 -10 C9 -4 6 -1 0 -1" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Lock() {
  return (
    <svg viewBox="-24 -24 48 48" width="22" height="22" aria-hidden="true">
      <rect x="-11" y="-3" width="22" height="17" rx="5" fill="currentColor" />
      <path d="M-6.5 -3 v-5 a6.5 6.5 0 0 1 13 0 v5" stroke="currentColor" strokeWidth="4.5" fill="none" />
    </svg>
  );
}

/** The unit header, with no card: a small icon chip, "Unidade N", the title and a thin progress line. */
export function UnitHeader({ unitLabel, title, done = 0, total = 1, locked = false, onPress, ariaLabel, unitId, icon }: UnitHeaderProps) {
  const body = (
    <>
      <span className={`k-unit-icon ${unitId ? "has-art" : ""}`} aria-hidden="true">
        {unitId ? (
          // eslint-disable-next-line @next/next/no-img-element -- a small fixed local sticker
          <img src={`/art/units/${unitId}.webp`} alt="" width={48} height={48} decoding="async" />
        ) : (
          (icon ?? <Sprout />)
        )}
      </span>
      <span className="k-unit-text">
        <small>{unitLabel}</small>
        <strong>{title}</strong>
      </span>
      {locked ? (
        <span className="k-unit-lock" aria-hidden="true">
          <Lock />
        </span>
      ) : (
        <span className="k-unit-progress">
          <em>
            {done} de {total}
          </em>
          <span className="k-unit-bar" aria-hidden="true">
            <i style={{ width: `${Math.min(100, (done / Math.max(1, total)) * 100)}%` }} />
          </span>
        </span>
      )}
    </>
  );
  const className = `k-unit ${locked ? "is-locked" : ""}`;
  return onPress ? (
    <button type="button" aria-label={ariaLabel} onClick={onPress} className={`${className} min-h-16`}>
      {body}
    </button>
  ) : (
    <div className={className}>{body}</div>
  );
}
