const base = { viewBox: "0 0 24 24", "aria-hidden": true as const };

export function CheckIcon({ size = 40 }: { size?: number }) {
  return (
    <svg {...base} width={size} height={size}>
      <path d="M4.5 12.5l5 5 10-11" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function MagnifierIcon({ size = 40 }: { size?: number }) {
  return (
    <svg {...base} width={size} height={size}>
      <circle cx="10" cy="10" r="6" fill="none" stroke="currentColor" strokeWidth="3" />
      <path d="M15 15l6 6" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
    </svg>
  );
}

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
