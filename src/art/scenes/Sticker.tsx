import type { ArtId } from "@/domain/trail/schema";
import { ART_WORDS, Animal } from "../Animal";
import { GROUND, Padlock, WHITE } from "../shared";

// The challenge reward: a round sticker with a thick white border. Until it is earned it shows
// the animal as a grey silhouette with a small padlock.

const BACKGROUNDS: Record<ArtId, string> = {
  bear: "#FFE6C7",
  bird: "#D9F0FF",
  frog: "#E4F6CF",
  snake: "#FFF1C2",
  spider: "#EDE3FB",
  mouse: "#FFE3EA",
};

const SILHOUETTE = { filter: "grayscale(1) brightness(.55)", opacity: 0.6 };
const LOCK_BADGE = "#9AA0AD";

export function Sticker({ art, earned, size = 160 }: { art: ArtId; earned: boolean; size?: number }) {
  return (
    <svg
      viewBox="0 0 200 206"
      width={size}
      height={Math.round((size * 206) / 200)}
      role="img"
      aria-label={ART_WORDS[art]}
      lang="en"
      data-art={art}
      data-earned={earned ? "true" : "false"}
      className="art-sticker"
    >
      <g className={earned ? "art-sticker-pop" : undefined}>
        <circle cx="100" cy="106" r="94" fill={GROUND} />
        <circle cx="100" cy="100" r="94" fill={WHITE} />
        <g style={earned ? undefined : SILHOUETTE}>
          <circle cx="100" cy="100" r="80" fill={earned ? BACKGROUNDS[art] : "#E6E8EC"} />
          <g transform="translate(14 12)" aria-hidden="true">
            <Animal id={art} size={172} />
          </g>
        </g>
        {earned ? (
          <path d="M44 62 A66 66 0 0 1 82 36" stroke={WHITE} strokeWidth="8" strokeLinecap="round" fill="none" opacity=".7" />
        ) : (
          <g transform="translate(152 152)">
            <circle r="24" fill={LOCK_BADGE} stroke={WHITE} strokeWidth="5" />
            <g transform="translate(0 -2) scale(1.15)">
              <Padlock />
            </g>
          </g>
        )}
      </g>
    </svg>
  );
}
