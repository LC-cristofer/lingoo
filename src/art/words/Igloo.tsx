import { GroundShadow } from "../shared";
import { Gloss } from "./parts";

const SNOW = "#EAF5FC";
const SNOW_DARK = "#B4D3E8";
const DOOR = "#5A7790";

export function Igloo() {
  return (
    <g>
      <GroundShadow rx={86} />
      <path d="M8 198 A92 92 0 0 1 192 198Z" fill={SNOW_DARK} />
      <path d="M8 198 A92 92 0 0 1 176 150 Q150 80 70 66 A92 92 0 0 0 8 198Z" fill={SNOW} />
      <path d="M18 166 H182 M34 140 H166 M66 114 H134" stroke={SNOW_DARK} strokeWidth="4" strokeLinecap="round" fill="none" />
      <path d="M30 140 V166 M170 140 V166 M66 114 V140 M100 114 V140 M134 114 V140 M66 166 V140 M100 140 V166 M134 140 V166" stroke={SNOW_DARK} strokeWidth="4" strokeLinecap="round" fill="none" />
      <path d="M60 198 V172 A40 36 0 0 1 140 172 V198Z" fill={SNOW} />
      <path d="M72 198 V172 A28 26 0 0 1 128 172 V198Z" fill={DOOR} />
      <path d="M72 172 A28 26 0 0 1 100 146 V198 H72Z" fill="#46627A" />
      <Gloss cx={52} cy={110} rx={22} ry={8} rot={-55} o={0.7} />
    </g>
  );
}
