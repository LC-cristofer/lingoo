import { Animal } from "@/art/Animal";
import type { ArtId } from "@/domain/trail/schema";

const ROTATION = [-12, 8, -2];

/** A fanned pile of up to 3 picture cards (pictures only, never a word). `faded` is the "all done" look. */
export function CardPile({ ids, faded = false }: { ids: ArtId[]; faded?: boolean }) {
  // The first card (the most urgent one) lies on top of the pile.
  const shown = ids.slice(0, 3).reverse();
  return (
    <div className={`k-pile ${faded ? "is-faded" : ""}`} style={{ ["--n" as string]: shown.length }} aria-hidden="true">
      {shown.map((id, i) => (
        <span key={id} className="k-pile-card" style={{ ["--i" as string]: i, ["--r" as string]: `${ROTATION[i]}deg` }}>
          <Animal id={id} size={110} />
        </span>
      ))}
    </div>
  );
}
