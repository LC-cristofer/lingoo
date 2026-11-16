import { CloseIcon } from "../icons";
import { ProgressBar } from "../ProgressBar";

type LessonTopBarProps = { ratio: number; onExit: () => void; title?: string; /** "2 de 5": a blue bar and a count pill (the memory training). */ count?: string };

/** ✕ plus the thick progress bar (or, on the opening, a title pill). */
export function LessonTopBar({ ratio, onExit, title, count }: LessonTopBarProps) {
  return (
    <div className="k-top">
      <button type="button" aria-label="Sair" onClick={onExit} className="k-round k-round-white min-h-16 min-w-16">
        <CloseIcon size={24} />
      </button>
      {title ? <span className="k-pill">{title}</span> : <ProgressBar ratio={ratio} tone={count ? "sky" : "leaf"} />}
      {count && !title ? <span className="k-pill k-pill-count">{count}</span> : null}
    </div>
  );
}
