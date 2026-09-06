import { brand } from "@/lib/brand";
import {
  MONOGRAM_BADGE,
  MONOGRAM_RULES,
  MONOGRAM_RULE_HEIGHT,
  WORDMARK_TYPE,
  WORDMARK_VIEWBOX,
} from "@/lib/brand-marks";

/**
 * Mark + firm name, inline for `currentColor` (see `brand-marks.ts`).
 *
 * The name is read from `brand.ts` rather than baked into path data, so a
 * rename is still a one-file change. `<text>` rather than outlined paths is a
 * deliberate placeholder property: a real logo arrives as outlines and drops
 * straight in at the same viewBox.
 */
export function Wordmark({ className }: { className?: string }) {
  const scale = WORDMARK_TYPE.markSize / 64;

  return (
    <svg
      viewBox={WORDMARK_VIEWBOX}
      className={className}
      role="img"
      aria-label={brand.name}
      focusable="false"
      data-placeholder=""
    >
      <g transform={`translate(0 ${WORDMARK_TYPE.markOffsetY}) scale(${scale})`}>
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
      </g>
      <text
        x={WORDMARK_TYPE.textX}
        y={WORDMARK_TYPE.textBaselineY}
        fill="currentColor"
        fontFamily={WORDMARK_TYPE.fontFamilyInline}
        fontSize={WORDMARK_TYPE.fontSize}
        letterSpacing={WORDMARK_TYPE.letterSpacing}
      >
        {brand.name}
      </text>
    </svg>
  );
}
