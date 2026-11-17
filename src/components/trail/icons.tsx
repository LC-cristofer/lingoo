const base = { viewBox: "0 0 24 24", "aria-hidden": true as const };

export function CloseIcon({ size = 32 }: { size?: number }) {
  return (
    <svg {...base} width={size} height={size}>
      <path d="M5 5l14 14M19 5L5 19" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function SpeakerIcon({ size = 36 }: { size?: number }) {
  return (
    <svg {...base} width={size} height={size}>
      <path d="M4 9.5h4l5-4v13l-5-4H4z" fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

export function PlayIcon({ size = 56 }: { size?: number }) {
  return (
    <svg {...base} width={size} height={size}>
      <path d="M8 4.5v15l12-7.5z" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

export function PauseIcon({ size = 40 }: { size?: number }) {
  return (
    <svg {...base} width={size} height={size}>
      <path d="M7 5v14M17 5v14" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}

export function ReplayIcon({ size = 36 }: { size?: number }) {
  return (
    <svg {...base} width={size} height={size}>
      <path d="M5 12a7 7 0 1 0 2.2-5.1" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />
      <path d="M4 3.5v5h5" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ArrowIcon({ size = 36 }: { size?: number }) {
  return (
    <svg {...base} width={size} height={size}>
      <path d="M5 12h13M12 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** A music note; with `off`, a slash across it. */
export function MusicIcon({ size = 36, off = false }: { size?: number; off?: boolean }) {
  return (
    <svg {...base} width={size} height={size} data-music={off ? "off" : "on"}>
      <path d="M9 17.5V5.5l10-2v12" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <ellipse cx="6.8" cy="17.6" rx="3.1" ry="2.5" fill="currentColor" />
      <ellipse cx="16.8" cy="15.6" rx="3.1" ry="2.5" fill="currentColor" />
      {off ? (
        <>
          <path d="M4 3.5l16.5 17" stroke="#fff" strokeWidth="5.4" strokeLinecap="round" />
          <path d="M4 3.5l16.5 17" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
        </>
      ) : null}
    </svg>
  );
}
