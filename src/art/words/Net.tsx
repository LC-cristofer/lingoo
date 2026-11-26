import { GroundShadow } from "../shared";
import { CORAL, STONE, SUN_BASE, WOOD } from "./parts";

export function Net() {
  return (
    <g>
      <GroundShadow rx={60} />
      <path d="M36 176 L96 98" stroke={WOOD.dark} strokeWidth="11" strokeLinecap="round" fill="none" />
      <path d="M34 174 L94 96" stroke={WOOD.base} strokeWidth="8" strokeLinecap="round" fill="none" />
      <path d="M62 78 Q56 150 104 150 Q158 150 156 78Z" fill={STONE.light} opacity=".95" />
      <path d="M72 92 Q70 130 90 144 M92 82 Q92 138 106 150 M114 82 Q114 138 112 150 M136 84 Q132 130 122 148 M62 110 H154 M66 130 H148" stroke={STONE.dark} strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <ellipse cx="109" cy="78" rx="48" ry="16" fill="none" stroke={WOOD.deep} strokeWidth="7" />
      <g transform="rotate(12 140 34)">
        <path d="M140 34 Q116 8 106 28 Q104 46 140 40Z" fill={CORAL} />
        <path d="M140 34 Q164 8 174 28 Q176 46 140 40Z" fill={SUN_BASE} />
        <path d="M140 40 Q122 58 118 50 Q118 40 140 38Z" fill="#E8624A" />
        <path d="M140 40 Q158 58 162 50 Q162 40 140 38Z" fill="#E8B21E" />
        <rect x="137" y="26" width="6" height="22" rx="3" fill="#3A2618" />
      </g>
    </g>
  );
}
