export type WeekDay = { date: string; played: boolean; isToday: boolean };

const LETTERS = ["S", "T", "Q", "Q", "S", "S", "D"];

function StarIcon({ size = 22 }: { size?: number }) {
  return (
    <svg viewBox="-12 -12 24 24" width={size} height={size} aria-hidden="true">
      <path d="M0 -11 l3.3 6.8 l7.5 1 l-5.4 5.2 l1.3 7.4 l-6.7 -3.5 l-6.7 3.5 l1.3 -7.4 l-5.4 -5.2 l7.5 -1z" fill="#FFC93C" stroke="#DE9F12" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

/** The star count and the week (Monday first) at the top of the map. */
export function TopChips({ stars, week }: { stars: number; week: WeekDay[] }) {
  return (
    <div className="k-chips">
      <span className="k-chip" aria-label={`${stars} estrelas`}>
        <StarIcon />
        <b>{stars}</b>
      </span>
      <span className="k-chip k-chip-days">
        {week.map((d, i) => (
          <span key={d.date} className={`k-day ${d.played ? "is-on" : ""} ${d.isToday ? "is-today" : ""}`}>
            <i />
            <em>{LETTERS[i % 7]}</em>
          </span>
        ))}
      </span>
    </div>
  );
}
