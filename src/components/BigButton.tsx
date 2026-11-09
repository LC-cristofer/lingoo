import type { ReactNode } from "react";

type BigButtonColor = "sun" | "sky" | "leaf" | "coral";

const COLOR_CLASSES: Record<BigButtonColor, string> = {
  sun: "bg-sun",
  sky: "bg-sky",
  leaf: "bg-leaf",
  coral: "bg-coral",
};

type BigButtonProps = {
  onPress: () => void;
  /** Vira aria-label: a criança não lê, mas leitores de tela precisam do nome. */
  label: string;
  children: ReactNode;
  color?: BigButtonColor;
};

export function BigButton({ onPress, label, children, color = "sun" }: BigButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onPress}
      className={`${COLOR_CLASSES[color]} min-h-16 min-w-16 inline-flex items-center justify-center rounded-3xl px-6 py-3 text-ink shadow-md transition-transform active:scale-95`}
    >
      {children}
    </button>
  );
}
