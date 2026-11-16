import { Flower, Mushroom, Pine, RoundTree } from "@/art/scenes/ForestBackdrop";

export type ScatterItem = {
  kind: "pine" | "round" | "mush" | "flower";
  /** Percent of the parent's width. */
  x: number;
  /** Pixels from the parent's top (number) or any CSS length (string). */
  y: number | string;
  s?: number;
  color?: string;
};

/** Trees, mushrooms and flowers dropped on a scene; each one is anchored at its own point. */
export function Scatter({ items, className = "" }: { items: ScatterItem[]; className?: string }) {
  return (
    <>
      {items.map((it, i) => (
        <svg
          key={i}
          className={`k-deco ${className}`}
          style={{ left: `${it.x}%`, top: it.y }}
          width="1"
          height="1"
          overflow="visible"
          aria-hidden="true"
        >
          {it.kind === "pine" ? (
            <Pine x={0} y={0} s={it.s ?? 1} />
          ) : it.kind === "round" ? (
            <RoundTree x={0} y={0} s={it.s ?? 1} />
          ) : it.kind === "mush" ? (
            <Mushroom x={0} y={0} />
          ) : (
            <Flower x={0} y={0} color={it.color ?? "#fff"} />
          )}
        </svg>
      ))}
    </>
  );
}
