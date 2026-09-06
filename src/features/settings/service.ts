import "server-only";
import { cache } from "react";

import type { Office } from "@/lib/brand";

import { fetchSiteSettings } from "./api";

import type { SettingsOfficeWire } from "./types";

export type SiteSettings = {
  readonly firmName: string;
  readonly legalName: string | null;
  readonly tagline: string | null;
  readonly icanRegistrationNumber: string | null;
  readonly establishedYear: number | null;
  readonly phone: string | null;
  readonly whatsapp: string | null;
  readonly email: string | null;
  readonly offices: readonly Office[];
};

/** Mirrors `OptionalRead`, named for this domain so call sites read plainly. */
export type SiteSettingsRead =
  | { readonly status: "ok"; readonly settings: SiteSettings }
  | { readonly status: "absent" }
  | { readonly status: "unavailable"; readonly reference: string | null };

/**
 * Server-side orchestration and the wire→domain mapping.
 *
 * **Honest degradation, not a fallback layer.** Nothing here substitutes an
 * invented office or a stand-in phone number; ARCHITECTURE.md §O.18 bans a
 * seed/mock fallback because "a fallback hides real failures", and CLAUDE.md
 * §3.5 says the same thing about content.
 *
 * **But absence has two causes, and they are not the same fact** (§3.8c). The
 * backend answering "no settings row yet" is a published state and the site
 * should render its locally-configured values as normal. The backend being
 * unreachable is a failure, and rendering *anything* as though it were current
 * turns an outage into a confident claim. So this returns which one it was, and
 * the page decides — rather than collapsing both into a `null` that reads the
 * same at every call site.
 *
 * `cache()` dedupes within a request so `generateMetadata` and the page body
 * share one fetch rather than racing two.
 */
export const readSiteSettings = cache(async (): Promise<SiteSettingsRead> => {
  const read = await fetchSiteSettings();
  if (read.status !== "ok") return read;

  const wire = read.data;
  return {
    status: "ok",
    settings: {
      firmName: wire.firm_name,
      legalName: wire.legal_name,
      tagline: wire.tagline,
      icanRegistrationNumber: wire.ican_registration_number,
      establishedYear: wire.established_year,
      phone: wire.phone,
      whatsapp: wire.whatsapp,
      email: wire.email,
      offices: wire.offices.map(toOffice),
    },
  };
});

/**
 * The settings, or `null` if there are none to show for any reason.
 *
 * Kept as a thin wrapper over `readSiteSettings` so existing call sites are
 * unchanged. Prefer `readSiteSettings` in new code: a caller that cannot tell an
 * outage from an empty record cannot obey §3.8c, and this one deliberately
 * cannot. Both share the same `cache()`d fetch.
 */
export async function getSiteSettings(): Promise<SiteSettings | null> {
  const read = await readSiteSettings();
  return read.status === "ok" ? read.settings : null;
}

/**
 * The wire office carries an `int64` id; the domain office keys on a string,
 * because `lib/brand.ts` offices are authored by hand and have no database id.
 * Converting here keeps that difference out of every component.
 */
function toOffice(wire: SettingsOfficeWire): Office {
  return {
    id: String(wire.id),
    name: wire.name,
    street: wire.street,
    city: wire.city,
    region: wire.region,
    postalCode: wire.postal_code,
    // The backend sends a free-form country code; this site is Nepal-only, so
    // anything else is a data error and is normalised rather than rendered.
    countryCode: "NP",
    phone: wire.phone,
    email: wire.email,
    latitude: wire.latitude,
    longitude: wire.longitude,
    isPrimary: wire.is_primary,
  };
}
