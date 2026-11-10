export function ProgressBar({ ratio }: { ratio: number }) {
  const value = Math.round(Math.min(1, Math.max(0, ratio)) * 100);
  return (
    <div
      role="progressbar"
      aria-label="Progresso"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
      className="h-4 w-full overflow-hidden rounded-full bg-ink/10"
    >
      <div className="h-full rounded-full bg-leaf transition-[width] duration-500 ease-out" style={{ width: `${value}%` }} />
    </div>
  );
}
