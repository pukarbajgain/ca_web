/**
 * Wire types for `GET /api/v1/public/settings` (API_CONTRACT.md §6 — ✅ Phase 1).
 *
 * **snake_case, mirroring the wire 1:1** (CLAUDE.md §5.1) so a field name is
 * greppable across all three repositories. Mapping to camelCase happens in
 * `api.ts`, never in a component.
 *
 * These are hand-written for now. §J.2 is clear that the destination is
 * `openapi-typescript` generation against the live `/openapi.json` — hand-mirrored
 * types drift, and with two frontends they drift in two directions. Generation is
 * wired up once the backend's public schema settles.
 */

export type SettingsOfficeWire = {
  id: number;
  name: string;
  street: string;
  city: string;
  region: string | null;
  postal_code: string | null;
  country_code: string;
  phone: string | null;
  email: string | null;
  latitude: number | null;
  longitude: number | null;
  is_primary: boolean;
};

export type SiteSettingsWire = {
  firm_name: string;
  legal_name: string | null;
  tagline: string | null;
  ican_registration_number: string | null;
  established_year: number | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  offices: SettingsOfficeWire[];
};
