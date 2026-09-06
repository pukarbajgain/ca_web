import { Badge } from "@/components/ui/badge";

/**
 * A standing banner on every legal page.
 *
 * These documents are drafted as realistic, structurally-correct placeholders —
 * they describe how this website actually behaves, which is the part an engineer
 * can state truthfully. What they are *not* is legal advice reviewed by the
 * firm, and pretending otherwise on a regulated professional's site would be a
 * worse error than any placeholder photograph.
 *
 * So the status is stated in the open rather than tracked in a ticket. It is
 * removed in the same change that a partner approves the wording.
 */
export function LegalReviewNotice() {
  return (
    <aside
      className="mb-8 rounded-lg border border-warning/40 bg-warning-container p-4 text-on-warning-container"
      data-placeholder=""
    >
      <p className="flex flex-wrap items-center gap-2 text-body-medium">
        <Badge variant="outline">Awaiting review</Badge>
        This notice is a structural draft describing how this website operates. It has not
        yet been reviewed or approved by the firm, and it must be before the site goes
        live.
      </p>
    </aside>
  );
}
