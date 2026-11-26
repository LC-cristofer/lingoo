import { GroundShadow } from "../shared";
import { CORAL, CORAL_DARK, CREAM, Gloss, WOOD, WOOL_DARK } from "./parts";

export function Bed() {
  return (
    <g>
      <GroundShadow rx={88} />
      <rect x="14" y="40" width="40" height="150" rx="16" fill={WOOD.dark} />
      <rect x="10" y="36" width="40" height="150" rx="16" fill={WOOD.base} />
      <rect x="150" y="116" width="36" height="76" rx="14" fill={WOOD.dark} />
      <rect x="22" y="160" width="26" height="40" rx="10" fill={WOOD.dark} />
      <rect x="156" y="164" width="26" height="36" rx="10" fill={WOOD.dark} />
      <rect x="26" y="106" width="152" height="68" rx="20" fill={WOOL_DARK} />
      <rect x="26" y="98" width="152" height="64" rx="20" fill={CREAM} />
      <rect x="40" y="76" width="56" height="40" rx="18" fill="#DDEFFA" />
      <rect x="38" y="72" width="56" height="40" rx="18" fill="#fff" />
      <path d="M92 108 H170 Q184 108 184 122 V156 Q184 168 170 168 H92Z" fill={CORAL_DARK} />
      <path d="M100 104 H166 Q180 104 180 118 V150 Q180 162 166 162 H100Z" fill={CORAL} />
      <circle cx="122" cy="130" r="6" fill="#FFD2C6" opacity=".7" />
      <circle cx="148" cy="144" r="6" fill="#FFD2C6" opacity=".7" />
      <circle cx="150" cy="118" r="6" fill="#FFD2C6" opacity=".7" />
      <Gloss cx={52} cy={84} rx={10} ry={4} rot={-20} o={0.7} />
      <Gloss cx={24} cy={70} rx={6} ry={18} rot={0} o={0.35} />
    </g>
  );
}
