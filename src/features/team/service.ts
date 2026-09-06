import "server-only";
import { cache } from "react";

import { apiGet, ApiError, type Page } from "@/lib/fetcher";
import { COLLECTION_TAGS, itemTag } from "@/lib/revalidation-tags";

import type { TeamMemberWire, TeamOfficeRefWire, TeamPhotoWire } from "./types";

/** Domain shapes. camelCase, and only what a page actually renders. */
export type TeamPhoto = {
  readonly url: string;
  readonly altText: string | null;
  readonly width: number | null;
  readonly height: number | null;
};

export type TeamOfficeRef = {
  readonly name: string;
  readonly slug: string;
};

export type TeamMember = {
  readonly name: string;
  readonly slug: string;
  readonly postNominals: string | null;
  readonly designation: string | null;
  readonly photo: TeamPhoto | null;
  readonly practiceAreas: readonly string[];
  readonly office: TeamOfficeRef | null;
  readonly bio: string | null;
};

export type TeamListRead =
  | {
      readonly status: "ok";
      readonly items: readonly TeamMember[];
      readonly total: number;
      readonly page: number;
      readonly pageSize: number;
    }
  | { readonly status: "unavailable"; readonly reference: string | null };

export type TeamMemberRead =
  | { readonly status: "ok"; readonly member: TeamMember }
  | { readonly status: "absent" }
  | { readonly status: "unavailable"; readonly reference: string | null };

const toPhoto = (wire: TeamPhotoWire | null): TeamPhoto | null =>
  wire
    ? { url: wire.url, altText: wire.alt_text, width: wire.width, height: wire.height }
    : null;

const toOffice = (wire: TeamOfficeRefWire | null): TeamOfficeRef | null =>
  wire ? { name: wire.name, slug: wire.slug } : null;

function toMember(wire: TeamMemberWire): TeamMember {
  return {
    name: wire.name,
    slug: wire.slug,
    postNominals: wire.post_nominals,
    designation: wire.designation,
    photo: toPhoto(wire.photo),
    practiceAreas: wire.practice_areas,
    office: toOffice(wire.office),
    bio: wire.bio,
  };
}

export type TeamQuery = {
  readonly office?: string | undefined;
  readonly page?: number | undefined;
  readonly pageSize?: number | undefined;
};

/**
 * The team directory.
 *
 * **Never throws.** An outage returns `unavailable` with the request
 * reference so the page can say "we could not load the team just now" rather
 * than an empty directory — on a chartered accountancy site the people list is
 * the strongest trust signal there is (CLAUDE.md §D.6 row 10), so a silent
 * empty state here is one of the more damaging places §3.8c could be broken.
 */
export async function getTeamMembers(query: TeamQuery = {}): Promise<TeamListRead> {
  const searchParams: Record<string, string> = {};
  if (query.office) searchParams.office = query.office;
  if (query.page && query.page > 1) searchParams.page = String(query.page);
  if (query.pageSize) searchParams.page_size = String(query.pageSize);

  try {
    const page = await apiGet<Page<TeamMemberWire>>("/public/team", {
      searchParams,
      tags: [COLLECTION_TAGS.team_member],
    });
    return {
      status: "ok",
      items: page.items.map(toMember),
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

/**
 * One team member, by slug.
 *
 * `cache()`-deduped so `generateMetadata` and the page body share a single
 * request. A 404 is `absent` — distinct from `unavailable` — because the page
 * must call `notFound()` for the first and show an error for the second.
 */
export const getTeamMember = cache(async (slug: string): Promise<TeamMemberRead> => {
  try {
    const wire = await apiGet<TeamMemberWire>(`/public/team/${slug}`, {
      tags: [COLLECTION_TAGS.team_member, itemTag("team_member", slug)],
    });
    return { status: "ok", member: toMember(wire) };
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return { status: "absent" };
    return {
      status: "unavailable",
      reference: error instanceof ApiError ? error.requestId : null,
    };
  }
});
