import type { ContactFormValues } from "./schema";

/**
 * The enquiry as `POST /api/v1/public/enquiries` accepts it.
 *
 * Its own module, with no `server-only` import, so it can be unit-tested — the
 * module that performs the fetch cannot be loaded outside a server runtime, and
 * this is the part with a rule in it. Same reason as `lib/paginate.ts`.
 *
 * **Every key here is checked against `app/schemas/public/enquiry.py`, which
 * sets `extra="forbid"`.** That is not a detail: a field the backend does not
 * declare is not ignored, it is a 422, and the visitor is told their enquiry
 * could not be sent. This shipped once sending `service_slug` and `source` —
 * neither of which exists on that schema — so the form rejected every enquiry
 * while the backend, the database and the console were all working perfectly.
 */
export type EnquiryWire = {
  name: string;
  email: string;
  phone: string | null;
  organisation: string | null;
  message: string;
  /** Must be `true`; the backend 422s on `false`, naming the field. */
  consent: true;
  /** The page the form was submitted from, e.g. `/services/taxation`. */
  source_path: string | null;
};

/**
 * Map the validated form values onto the wire.
 *
 * `serviceSlug` is deliberately absent. The API's field for it is
 * `service_interest_id`, an integer foreign key, and `web` cannot produce one:
 * public responses carry no integer ids at all (API_CONTRACT.md §5, enforced by
 * a leakage contract test), and the `service` table is empty besides, because
 * services became static content in this repository. Sending the slug instead
 * is exactly what the 422 was.
 */
export function toEnquiryWire(
  values: ContactFormValues,
  sourcePath: string | null,
): EnquiryWire {
  return {
    name: values.name,
    email: values.email,
    phone: values.phone ?? null,
    organisation: values.organisation ?? null,
    message: values.message,
    consent: true,
    source_path: sourcePath,
  };
}
