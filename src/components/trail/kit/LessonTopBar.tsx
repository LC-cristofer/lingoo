import { CloseIcon } from "../icons";
import { ProgressBar } from "../ProgressBar";

/** Up to this many steps the progress is shown as lamps; beyond it, as a rope bar. */
export const MAX_LAMPS = 8;

type LessonTopBarProps = {
  ratio: number;
  onExit: () => void;
  title?: string;
  /** "2 de 5": the count pill (the memory training); its total also sets the number of lamps. */
  count?: string;
  /** How many steps the lesson has; with 8 or fewer the progress is drawn as lamps. */
  steps?: number;
};

const totalOf = (count?: string) => {
  const m = count ? /de\s+(\d+)/.exec(count) : null;
  return m ? Number(m[1]) : undefined;
};

/** A round "×" plus the progress: lamp segments (8 steps or fewer) or a rope bar; or, on the opening, a title pill. */
export function LessonTopBar({ ratio, onExit, title, count, steps }: LessonTopBarProps) {
  const total = steps ?? totalOf(count);
  const lamps = total !== undefined && total > 0 && total <= MAX_LAMPS ? total : 0;
  const value = Math.round(Math.min(1, Math.max(0, ratio)) * 100);
  const lit = Math.round(Math.min(1, Math.max(0, ratio)) * lamps);
  return (
    <div className="k-top">
      <button type="button" aria-label="Sair" onClick={onExit} className="k-round k-round-glass min-h-16 min-w-16">
        <CloseIcon size={24} />
      </button>
      {title ? (
        <span className="k-pill">{title}</span>
      ) : lamps ? (
        <div role="progressbar" aria-label="Progresso" aria-valuemin={0} aria-valuemax={100} aria-valuenow={value} className={`k-lamps ${count ? "is-sky" : ""}`}>
          {Array.from({ length: lamps }, (_, i) => (
            <i key={i} className={i < lit ? "is-on" : ""} />
          ))}
        </div>
      ) : (
        <ProgressBar ratio={ratio} tone={count ? "sky" : "accent"} />
      )}
      {count && !title ? <span className="k-pill k-pill-count">{count}</span> : null}
    </div>
  );
}
