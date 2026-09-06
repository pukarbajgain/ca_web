import "server-only";

import { apiGet, ApiError, type Page } from "@/lib/fetcher";
import { COLLECTION_TAGS } from "@/lib/revalidation-tags";

import {
  DOWNLOAD_CATEGORIES,
  type DownloadCategoryWire,
  type DownloadWire,
} from "./types";

export type DownloadCategory = DownloadCategoryWire;

/** Domain shape. camelCase, and only what the page actually renders. */
export type DownloadItem = {
  readonly slug: string;
  readonly title: string;
  readonly description: string | null;
  readonly category: DownloadCategory;
  readonly fileUrl: string;
  readonly fileSizeBytes: number;
  readonly fileMimeType: string;
};

export type DownloadListRead =
  | {
      readonly status: "ok";
      readonly items: readonly DownloadItem[];
      readonly total: number;
      readonly page: number;
      readonly pageSize: number;
    }
  | { readonly status: "unavailable"; readonly reference: string | null };

function isKnownCategory(value: string): value is DownloadCategory {
  return (DOWNLOAD_CATEGORIES as readonly string[]).includes(value);
}

function toDownload(wire: DownloadWire): DownloadItem {
  return {
    slug: wire.slug,
    title: wire.title,
    description: wire.description,
    // A category outside the declared enum is a contract drift, not a reason
    // to crash the page — it groups under "Other" rather than disappearing.
    category: isKnownCategory(wire.category) ? wire.category : "other",
    fileUrl: wire.file_url,
    fileSizeBytes: wire.file_size_bytes,
    fileMimeType: wire.file_mime_type,
  };
}

export type DownloadQuery = {
  readonly category?: DownloadCategory | undefined;
  readonly page?: number | undefined;
  readonly pageSize?: number | undefined;
};

/**
 * The downloads library.
 *
 * **Never throws.** An outage returns `unavailable` with the request
 * reference, so the page can say "we could not load these just now" instead of
 * a confident "nothing published" (CLAUDE.md §3.8c).
 */
export async function getDownloads(query: DownloadQuery = {}): Promise<DownloadListRead> {
  const searchParams: Record<string, string> = {};
  if (query.category) searchParams.category = query.category;
  if (query.page && query.page > 1) searchParams.page = String(query.page);
  if (query.pageSize) searchParams.page_size = String(query.pageSize);

  try {
    const page = await apiGet<Page<DownloadWire>>("/public/downloads", {
      searchParams,
      tags: [COLLECTION_TAGS.download],
    });
    return {
      status: "ok",
      items: page.items.map(toDownload),
      total: page.total,
      page: page.page,
      pageSize: page.page_size,
    };
  } catch (error) {
    return {
      status: "unavailable",
      reference: error instanceof ApiError ? error.requestId : null,
    };
  }
}
