/** The thick lesson progress bar: an accent fill with a shine that keeps moving along it. */
export function ProgressBar({ ratio, tone = "accent" }: { ratio: number; tone?: "accent" | "sky" }) {
  const value = Math.round(Math.min(1, Math.max(0, ratio)) * 100);
  return (
    <div role="progressbar" aria-label="Progresso" aria-valuemin={0} aria-valuemax={100} aria-valuenow={value} className={`k-bar ${tone === "sky" ? "is-sky" : ""}`}>
      <i style={{ width: `${value}%` }}>
        <b className="k-bar-shine" />
      </i>
    </div>
  );
}
