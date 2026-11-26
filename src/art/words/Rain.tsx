import { GroundShadow } from "../shared";
import { Gloss, STONE, WATER } from "./parts";

const DROP = "M0 -14 C8 -2 10 4 10 8 A10 10 0 0 1 -10 8 C-10 4 -8 -2 0 -14Z";

export function Rain() {
  const drops: [number, number][] = [[46, 142], [84, 156], [122, 140], [160, 154], [64, 182], [104, 190], [142, 178]];
  return (
    <g>
      <GroundShadow rx={50} />
      <ellipse cx="100" cy="100" rx="82" ry="46" fill={STONE.dark} />
      <circle cx="58" cy="82" r="38" fill={STONE.dark} />
      <circle cx="104" cy="62" r="46" fill={STONE.dark} />
      <circle cx="148" cy="86" r="34" fill={STONE.dark} />
      <ellipse cx="100" cy="94" rx="80" ry="42" fill={STONE.base} />
      <circle cx="56" cy="78" r="36" fill={STONE.base} />
      <circle cx="102" cy="56" r="44" fill={STONE.base} />
      <circle cx="146" cy="80" r="32" fill={STONE.base} />
      <Gloss cx={86} cy={36} rx={22} ry={9} rot={-35} o={0.55} />
      {drops.map(([x, y]) => (
        <g key={`${x}-${y}`} transform={`translate(${x} ${y})`}>
          <path d={DROP} fill={WATER.dark} />
          <ellipse cx="-3" cy="6" rx="2.6" ry="4.4" fill={WATER.light} />
        </g>
      ))}
    </g>
  );
}
