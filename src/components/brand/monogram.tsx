import {
  MONOGRAM_BADGE,
  MONOGRAM_RULES,
  MONOGRAM_RULE_HEIGHT,
  MONOGRAM_VIEWBOX,
} from "@/lib/brand-marks";

/**
 * The square mark, inline so `currentColor` resolves against the page and the
 * logo flips with the theme for free. Decorative by default: the wordmark or an
 * adjacent link already carries the accessible name, and a second announcement
 * of the firm's name is noise for a screen-reader user.
 */
export function Monogram({
  className,
  title,
}: {
  className?: string;
  /** Supply only when this mark is the sole accessible name for its control. */
  title?: string;
}) {
  return (
    <svg
      viewBox={MONOGRAM_VIEWBOX}
      className={className}
      role={title ? "img" : "presentation"}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      focusable="false"
    >
      <rect
        x={MONOGRAM_BADGE.x}
        y={MONOGRAM_BADGE.y}
        width={MONOGRAM_BADGE.size}
        height={MONOGRAM_BADGE.size}
        rx={MONOGRAM_BADGE.radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={MONOGRAM_BADGE.strokeWidth}
        opacity={MONOGRAM_BADGE.opacity}
      />
      {MONOGRAM_RULES.map(([x, y, w]) => (
        <rect
          key={`${x}-${y}`}
          x={x}
          y={y}
          width={w}
          height={MONOGRAM_RULE_HEIGHT}
          rx={MONOGRAM_RULE_HEIGHT / 2}
          fill="currentColor"
        />
      ))}
    </svg>
  );
}
