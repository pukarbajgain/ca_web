import { brand } from "@/lib/brand";

/**
 * Formatting helpers.
 *
 * Two rules run through this file:
 *
 *  1. `Intl` formatters are constructed once at module scope. Building one per
 *     call is a measurable cost in a list, and it is free to avoid.
 *  2. **Every date is formatted in the firm's timezone, explicitly.** Nepal is
 *     UTC+05:45 and observes no DST (CLAUDE.md §3.4). A server rendering in UTC
 *     would otherwise print the previous day for anything published before
 *     05:45 NPT — a visible, embarrassing error on a dated professional
 *     publication. `timeZone` is therefore never omitted.
 *
 * Bikram Sambat conversion is deliberately NOT here. BS is an admin-side
 * presentation concern confined to `admin`'s `lib/nepali-date.ts`; the public
 * site publishes AD dates, and adding a converter would put a second date
 * system on a surface that does not need one.
 */

const TZ = brand.locale.timeZone;

const longDate = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: TZ,
});

const shortDate = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: TZ,
});

const monthYear = new Intl.DateTimeFormat("en-GB", {
  month: "long",
  year: "numeric",
  timeZone: TZ,
});

const integer = new Intl.NumberFormat("en-US");

/** Accepts what the API actually sends: an ISO-8601 string with offset. */
function toDate(input: Date | string | number): Date | null {
  const date = input instanceof Date ? input : new Date(input);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** "12 August 2026", in Nepal Time. Returns null for an unparseable input so
 *  the caller renders nothing rather than "Invalid Date". */
export function formatDate(input: Date | string | number): string | null {
  const date = toDate(input);
  return date ? longDate.format(date) : null;
}

/** "12 Aug 2026". For cards and metadata rows where width is tight. */
export function formatDateShort(input: Date | string | number): string | null {
  const date = toDate(input);
  return date ? shortDate.format(date) : null;
}

/** "August 2026". Used where a day would imply precision we do not have. */
export function formatMonthYear(input: Date | string | number): string | null {
  const date = toDate(input);
  return date ? monthYear.format(date) : null;
}

/** Machine-readable value for `<time dateTime>`. Always full ISO-8601 UTC. */
export function toDateTimeAttr(input: Date | string | number): string | null {
  return toDate(input)?.toISOString() ?? null;
}

/** Thousands-separated integer. Rendered with `font-variant-numeric: tabular-nums`
 *  by the `.tabular` utility in globals.css so columns of figures line up. */
export function formatCount(value: number): string {
  return Number.isFinite(value) ? integer.format(value) : "";
}

/**
 * Nepali Rupees. `Rs.` rather than the `NPR`/`रू` that `Intl` emits for `en-US`,
 * because `Rs.` is what appears on an actual Nepali invoice.
 */
export function formatNpr(amount: number): string {
  if (!Number.isFinite(amount)) return "";
  return `${brand.locale.currencySymbol} ${integer.format(Math.round(amount))}`;
}

/**
 * The Nepali fiscal year containing a date, as "2082/83".
 *
 * Nepal's fiscal year runs Shrawan–Ashad, which is roughly mid-July to
 * mid-July Gregorian. This uses **16 July** as the boundary: it is correct for
 * the overwhelming majority of years and, crucially, it is *stated* rather than
 * hidden. An exact answer needs a real BS calendar table, which belongs in the
 * admin's date module — so any caller needing certainty must go there.
 */
export function nepaliFiscalYearLabel(input: Date | string | number): string | null {
  const date = toDate(input);
  if (!date) return null;
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(date);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? NaN);
  const [y, m, d] = [get("year"), get("month"), get("day")];
  if (!Number.isFinite(y)) return null;
  // BS year ≈ AD + 56 before the mid-July boundary, +57 on or after it.
  const startedThisAdYear = m > 7 || (m === 7 && d >= 16);
  const bsStart = y + (startedThisAdYear ? 57 : 56);
  return `${bsStart}/${String((bsStart + 1) % 100).padStart(2, "0")}`;
}

/** Truncate on a word boundary, with a real ellipsis. Used for meta descriptions. */
export function truncate(text: string, maxLength: number): string {
  const trimmed = text.trim();
  if (trimmed.length <= maxLength) return trimmed;
  const cut = trimmed.slice(0, maxLength - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > maxLength * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

/**
 * "audit-and-assurance" from "Audit & Assurance". The public site only *reads*
 * slugs, but it builds them for in-page anchors, and an anchor that differs from
 * the CMS slug is a broken deep link.
 */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
