import { Flower, Mushroom, Pine, RoundTree } from "@/art/scenes/ForestBackdrop";
import type { Decoration } from "@/domain/trail/trail-layout";

function DecorationArt({ d }: { d: Decoration }) {
  switch (d.kind) {
    case "pine":
      return <Pine x={0} y={0} s={d.s ?? 1} />;
    case "round":
      return <RoundTree x={0} y={0} s={d.s ?? 1} />;
    case "mush":
      return <Mushroom x={0} y={0} />;
    case "flower":
      return <Flower x={0} y={0} color="#FF8FA3" />;
    case "pond":
      return (
        <g>
          <ellipse cx="0" cy="4" rx="150" ry="48" fill="#3F9CE6" />
          <ellipse cx="0" cy="-2" rx="150" ry="48" fill="#6FC0FF" />
          <ellipse cx="-40" cy="-16" rx="46" ry="10" fill="#fff" opacity=".35" />
        </g>
      );
  }
}

/**
 * Trees, mushrooms, flowers and ponds over the forest backdrop, in mockup coordinates: x is a share
 * of `width`; y is a share of `height` when given (a full-screen scene), else pixels (the scrolling map).
 */
export function Decorations({ items, width, height }: { items: Decoration[]; width: number; height?: number }) {
  return (
    <>
      {items.map((d, i) => (
        <svg
          key={i}
          className="k-deco"
          style={{ left: `${(d.x / width) * 100}%`, top: height ? `${(d.y / height) * 100}%` : d.y }}
          width="1"
          height="1"
          overflow="visible"
          aria-hidden="true"
        >
          <DecorationArt d={d} />
        </svg>
      ))}
    </>
  );
}
