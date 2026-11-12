import { CloseIcon } from "../icons";
import { ProgressBar } from "../ProgressBar";

type LessonTopBarProps = { ratio: number; onExit: () => void; title?: string };

/** ✕ plus the thick progress bar (or, on the opening, a title pill). */
export function LessonTopBar({ ratio, onExit, title }: LessonTopBarProps) {
  return (
    <div className="k-top">
      <button type="button" aria-label="Sair" onClick={onExit} className="k-round k-round-white min-h-16 min-w-16">
        <CloseIcon size={24} />
      </button>
      {title ? <span className="k-pill">{title}</span> : <ProgressBar ratio={ratio} />}
    </div>
  );
}
