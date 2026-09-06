import { Download } from "lucide-react";

import { Section } from "@/components/layout/section";

import { DOWNLOAD_CATEGORY_LABELS, DOWNLOAD_CATEGORY_ORDER } from "../categories";
import { formatFileSize } from "../format";

import type { DownloadCategory, DownloadItem, DownloadListRead } from "../service";

/**
 * The downloads library, grouped by category.
 *
 * A ruled list per category rather than a card grid (CLAUDE.md §3.8b) — a
 * circular and an act extract are not equally-weighted tiles, they are rows in
 * a reference list a visitor scans for one specific document.
 *
 * Each row is a real, direct link to the file rather than a row that merely
 * *describes* one: the whole row is the target, the trailing icon signals
 * "this leaves the page with a file", and the size sits next to the title so a
 * visitor on a slow connection can decide before tapping.
 */
function DownloadRow({ item }: { item: DownloadItem }) {
  const size = formatFileSize(item.fileSizeBytes);

  return (
    <li>
      <a
        href={item.fileUrl}
        download
        className="group flex items-start justify-between gap-6 border-t border-outline-variant py-5 focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none sm:py-6"
      >
        <div className="min-w-0">
          <p className="text-title-medium text-on-surface group-hover:underline">
            {item.title}
          </p>
          {item.description ? (
            <p className="max-w-prose-measure mt-1 text-body-small text-on-surface-variant">
              {item.description}
            </p>
          ) : null}
          {size ? (
            <p className="mt-2 text-label-medium text-on-surface-variant uppercase">
              {size}
            </p>
          ) : null}
        </div>

        <Download
          aria-hidden
          className="mt-1 size-5 shrink-0 text-on-surface-variant transition-transform motion-safe:group-hover:translate-y-0.5"
        />
      </a>
    </li>
  );
}

function CategoryGroup({
  category,
  items,
}: {
  category: DownloadCategory;
  items: readonly DownloadItem[];
}) {
  const headingId = `downloads-${category}`;

  return (
    <div>
      <h2 id={headingId} className="text-label-medium text-tertiary uppercase">
        {DOWNLOAD_CATEGORY_LABELS[category]}
      </h2>
      <ul
        aria-labelledby={headingId}
        className="mt-2 flex flex-col border-b border-outline-variant"
      >
        {items.map((item) => (
          <DownloadRow key={item.slug} item={item} />
        ))}
      </ul>
    </div>
  );
}

export function DownloadIndex({ read }: { read: DownloadListRead }) {
  /**
   * Three outcomes, kept distinct (CLAUDE.md §3.8c). "Nothing published" and
   * "could not reach the backend" read identically to a hurried visitor unless
   * the copy says which one happened — and only one of them is safe to treat as
   * normal.
   */
  if (read.status === "unavailable") {
    return (
      <Section labelledBy="downloads-heading" ground="surface">
        <h2 id="downloads-heading" className="sr-only">
          Downloads
        </h2>
        <p className="max-w-prose-measure text-body-large text-on-surface-variant">
          We could not load the downloads library just now. Please try again in a moment.
          {read.reference ? (
            <span className="mt-2 block font-[family-name:var(--font-mono)] text-body-small">
              Reference {read.reference}
            </span>
          ) : null}
        </p>
      </Section>
    );
  }

  if (read.items.length === 0) {
    return (
      <Section labelledBy="downloads-heading" ground="surface">
        <h2 id="downloads-heading" className="sr-only">
          Downloads
        </h2>
        <p className="max-w-prose-measure text-body-large text-on-surface-variant">
          Nothing has been published to the downloads library yet.
        </p>
      </Section>
    );
  }

  const grouped = DOWNLOAD_CATEGORY_ORDER.map((category) => ({
    category,
    items: read.items.filter((item) => item.category === category),
  })).filter((group) => group.items.length > 0);

  return (
    <Section labelledBy="downloads-heading" ground="surface" index="01">
      <h2 id="downloads-heading" className="sr-only">
        Downloads
      </h2>
      <div className="flex flex-col gap-12">
        {grouped.map((group) => (
          <CategoryGroup
            key={group.category}
            category={group.category}
            items={group.items}
          />
        ))}
      </div>
    </Section>
  );
}
