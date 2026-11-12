/** The thick lesson progress bar of the approved look. */
export function ProgressBar({ ratio }: { ratio: number }) {
  const value = Math.round(Math.min(1, Math.max(0, ratio)) * 100);
  return (
    <div role="progressbar" aria-label="Progresso" aria-valuemin={0} aria-valuemax={100} aria-valuenow={value} className="k-bar">
      <i style={{ width: `${value}%` }} />
    </div>
  );
}
