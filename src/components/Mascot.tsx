export type Mood = "idle" | "talking" | "happy" | "encourage";

type MascotProps = { mood: Mood; /** "Sua vez": the ears wiggle, listening. */ listening?: boolean };

export function Mascot({ mood, listening = false }: MascotProps) {
  const happy = mood === "happy";
  return (
    <div
      className="mascot inline-block h-28 w-28"
      data-mood={mood}
      data-listening={listening ? "true" : "false"}
      aria-hidden="true"
    >
      <svg viewBox="0 0 120 120" className="h-full w-full">
        <ellipse cx="60" cy="108" rx="34" ry="8" fill="#2B2D42" opacity="0.08" />
        <path d="M92 92 q22 -4 18 -30" fill="none" stroke="#FF9F43" strokeWidth="9" strokeLinecap="round" />
        <ellipse cx="60" cy="88" rx="30" ry="22" fill="#FF9F43" />
        <polygon className="mascot-ear" points="26,44 30,14 54,32" fill="#FF9F43" />
        <polygon className="mascot-ear" points="94,44 90,14 66,32" fill="#FF9F43" />
        <polygon points="31,38 33,23 45,32" fill="#FFC9A0" />
        <polygon points="89,38 87,23 75,32" fill="#FFC9A0" />
        <circle cx="60" cy="58" r="36" fill="#FF9F43" />
        <ellipse cx="60" cy="70" rx="18" ry="13" fill="#FFF8EC" />
        {happy ? (
          <>
            <path d="M38 54 q8 -9 16 0" fill="none" stroke="#2B2D42" strokeWidth="4" strokeLinecap="round" />
            <path d="M66 54 q8 -9 16 0" fill="none" stroke="#2B2D42" strokeWidth="4" strokeLinecap="round" />
          </>
        ) : (
          <>
            <circle cx="46" cy="55" r="9" fill="#fff" />
            <circle cx="74" cy="55" r="9" fill="#fff" />
            <circle cx="47" cy="57" r="5" fill="#2B2D42" />
            <circle cx="73" cy="57" r="5" fill="#2B2D42" />
            <circle cx="49" cy="54" r="1.8" fill="#fff" />
            <circle cx="75" cy="54" r="1.8" fill="#fff" />
          </>
        )}
        <ellipse cx="60" cy="65" rx="4" ry="3" fill="#FF7A6B" />
        {mood === "talking" || happy ? (
          <path d="M52 72 q8 10 16 0 z" fill="#FF7A6B" />
        ) : mood === "encourage" ? (
          <path d="M53 74 q7 4 14 0" fill="none" stroke="#2B2D42" strokeWidth="2.5" strokeLinecap="round" />
        ) : (
          <path d="M52 72 q4 5 8 0 q4 5 8 0" fill="none" stroke="#2B2D42" strokeWidth="2.5" strokeLinecap="round" />
        )}
      </svg>
    </div>
  );
}
