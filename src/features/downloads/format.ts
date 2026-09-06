/**
 * `formatFileSize` — human-readable file size for a download row ("2.4 MB").
 *
 * Kept local to this feature rather than added to `lib/format.ts`: that module
 * is a shared surface this task does not own, and a byte-size formatter is
 * used by exactly one feature today. If a second consumer appears, promoting
 * it to `lib/format.ts` is a one-function move.
 *
 * Binary units (1024, "KB"/"MB") rather than SI (1000, "kB"/"MB"): that is what
 * every OS file browser and every download manager shows, so it is the
 * unsurprising choice on a page whose entire job is "here is a file to save".
 */
const UNITS = ["B", "KB", "MB", "GB"] as const;

export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "";
  if (bytes === 0) return "0 B";

  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < UNITS.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  // Whole bytes read as a count ("512 B"), not a measurement — no decimal.
  // Everything above that gets one decimal place, dropped when it is ".0".
  const precision = unitIndex === 0 ? 0 : 1;
  const rounded = value.toFixed(precision).replace(/\.0$/, "");
  return `${rounded} ${UNITS[unitIndex]}`;
}
