import type { ReactNode } from "react";
import { Animal } from "@/art/Animal";
import type { ArtId } from "@/domain/trail/schema";

export type TileState = "idle" | "correct" | "wrong" | "dim" | "hint";

type AnswerTileProps = {
  id: ArtId;
  onPress: () => void;
  state?: TileState;
  disabled?: boolean;
  /** The English word: the tile's accessible name (the picture never carries text). */
  label: string;
  lang?: string;
  /** Nominal size of the drawing; the CSS scales it with the tile. */
  artSize?: number;
  className?: string;
  data?: Record<`data-${string}`, string | undefined>;
};

function Badge() {
  return (
    <span className="k-tile-badge" aria-hidden="true">
      <svg viewBox="-10 -10 20 20" width="22" height="22">
        <path d="M-5 0 l4 4 l7 -8" stroke="#fff" strokeWidth="3.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

/** A picture card: white tile on a flat edge; the hint state makes the drawing glow. */
export function AnswerTile({ id, onPress, state = "idle", disabled = false, label, lang, artSize = 160, className = "", data }: AnswerTileProps) {
  return (
    <button
      type="button"
      data-card={id}
      data-state={state}
      aria-label={label}
      lang={lang}
      disabled={disabled}
      onClick={onPress}
      {...data}
      className={`k-tile is-${state} min-h-[120px] min-w-[120px] ${className}`}
    >
      <Animal id={id} size={artSize} glow={state === "hint"} />
      {state === "correct" ? <Badge /> : null}
    </button>
  );
}

/** Rows of tiles: 2 per row on a phone, up to 4 on a wide landscape screen. `dense` packs 3 per row, `small` keeps 2 per row but smaller, `six` fits six in one wide row. */
export function TileGrid({ children, dense = false, small = false, six = false, ...rest }: { children: ReactNode; dense?: boolean; small?: boolean; six?: boolean } & Record<`data-${string}`, string | undefined>) {
  return (
    <div className={`k-tiles ${dense ? "is-dense" : ""} ${small ? "is-small" : ""} ${six ? "is-six" : ""}`} {...rest}>
      {children}
    </div>
  );
}
