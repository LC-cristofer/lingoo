export type BackdropVariant = "sky" | "interior" | "night";

/**
 * The full-bleed background of a screen, behind everything, with the paper grain over it.
 * sky: the day sky (map, start, memory home). interior: a warm stone wall with a soft vignette (behind the stops).
 * night: the night gradient. Decorative: hidden from screen readers, never takes a tap.
 */
export function Backdrop({ variant = "sky" }: { variant?: BackdropVariant }) {
  return (
    <div className={`k-backdrop is-${variant}`} data-variant={variant} aria-hidden="true">
      <i className="k-grain" />
    </div>
  );
}
