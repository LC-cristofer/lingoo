import type { ReactNode } from "react";

/** ok: the main action (green); area: coloured by the parent through --tone and --tone-dark; cream: secondary. Never red. */
export type ChunkyTone = "ok" | "area" | "cream";
export type ChunkySize = "md" | "lg" | "round";

type ChunkyButtonProps = {
  onPress: () => void;
  /** Becomes the aria-label: the child does not read, but screen readers need the name. */
  label: string;
  children: ReactNode;
  tone?: ChunkyTone;
  size?: ChunkySize;
  disabled?: boolean;
  className?: string;
  lang?: string;
  data?: Record<`data-${string}`, string | undefined>;
};

/** The pressable of the Ilha-Ninho look: a solid darker edge under it that sinks when pressed. */
export function ChunkyButton({ onPress, label, children, tone = "ok", size = "md", disabled = false, className = "", lang, data }: ChunkyButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      lang={lang}
      disabled={disabled}
      onClick={onPress}
      {...data}
      className={`k-btn k-btn-${tone} k-btn-${size} min-h-16 min-w-16 ${className}`}
    >
      {children}
    </button>
  );
}
