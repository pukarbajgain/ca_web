import { brand, isPresent, mailHref, telHref, whatsAppHref } from "@/lib/brand";
import type { Office } from "@/lib/brand";
import { vocabulary } from "@/lib/vocabulary";

/**
 * The direct contact channels: Call · WhatsApp · Email · Head office.
 *
 * ── The rule this component exists to enforce ───────────────────────────────
 * CLAUDE.md §3.5: **never render a fabricated claim.** Every value here is
 * `T | null` in `lib/brand.ts` and ships as `null`, so today this renders
 * **nothing at all** — not a row with a dash in it, not "Coming soon", not a
 * greyed-out button. A phone number invented to make a contact page look
 * complete is very likely somebody else's real number, and on a regulated
 * professional's site it is a false statement.
 *
 * Each row is independently conditional, so the firm can publish an email before
 * it publishes a phone number and the block simply gets shorter.
 *
 * ── Why this is a ruled block and not four cards ───────────────────────────
 * A card is a border, a fill, a radius and usually a shadow: four separate
 * statements that this thing is a discrete object. A phone number is not an
 * object, it is a line of contact detail — the way it appears on a letterhead.
 * Setting it as a definition list with one hairline per row, and no icons, reads
 * as more assured than four bordered tiles with a pictogram each, and it leaves
 * the form below as the page's only lifted element (CLAUDE.md §3.8b).
 */

/** True when at least one direct channel is published. */
export function hasDirectChannel(): boolean {
  return (
    isPresent(brand.contact.phone) ||
    isPresent(brand.contact.whatsapp) ||
    isPresent(brand.contact.email)
  );
}

type Method = {
  key: string;
  label: string;
  value: string;
  href: string;
  external?: boolean;
  note: string;
};

export function ContactMethods({
  offices = brand.offices,
}: {
  offices?: readonly Office[];
}) {
  const tel = telHref();
  const whatsapp = whatsAppHref();
  const mail = mailHref();
  const head = offices.find((office) => office.isPrimary) ?? offices[0];

  const methods: Method[] = [];

  if (tel && isPresent(brand.contact.phone)) {
    methods.push({
      key: "phone",
      label: vocabulary.actions.call,
      value: brand.contact.phone,
      href: tel,
      note: `Sunday to Friday, Nepal Time (${brand.locale.utcOffset}).`,
    });
  }

  if (whatsapp && isPresent(brand.contact.whatsapp)) {
    methods.push({
      key: "whatsapp",
      label: vocabulary.actions.whatsapp,
      value: brand.contact.whatsapp,
      href: whatsapp,
      external: true,
      note: "For sending a document or a quick question.",
    });
  }

  if (mail && isPresent(brand.contact.email)) {
    methods.push({
      key: "email",
      label: vocabulary.actions.email,
      value: brand.contact.email,
      href: mail,
      note: "We reply within one working day.",
    });
  }

  if (head) {
    methods.push({
      key: "office",
      label: "Head office",
      value: [head.street, head.city].filter(Boolean).join(", "),
      /* An outbound maps query built from the address the firm actually
       * published. No coordinates are invented — the query is the address text
       * itself, so the link cannot point somewhere the page does not claim. */
      href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        [head.name, head.street, head.city, head.region].filter(Boolean).join(", "),
      )}`,
      external: true,
      note: "Visits by appointment, so someone is there to see you.",
    });
  }

  if (methods.length === 0) return null;

  return (
    <dl className="mt-12 border-t border-outline-variant md:mt-16">
      {methods.map((method) => (
        <div
          key={method.key}
          className="grid gap-1 border-b border-outline-variant py-6 md:grid-cols-12 md:items-baseline md:gap-8"
        >
          <dt className="text-label-small text-on-surface-variant uppercase md:col-span-3">
            {method.label}
          </dt>
          <dd className="md:col-span-9">
            <a
              href={method.href}
              {...(method.external
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {})}
              className="inline-flex min-h-11 items-center text-title-large break-words text-on-surface underline-offset-4 transition-colors hover:text-primary hover:underline"
            >
              {method.value}
            </a>
            <p className="text-body-medium text-on-surface-variant">{method.note}</p>
          </dd>
        </div>
      ))}
    </dl>
  );
}
