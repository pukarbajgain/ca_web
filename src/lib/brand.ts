/**
 * `brand.ts` — the SINGLE source of firm identity.
 *
 * Nothing else in this repository may hardcode the firm's name, registration
 * number, contact details, offices or social links. Replacing the placeholder
 * identity is an edit to this file and nowhere else.
 *
 * ── THE RULE THAT SHAPES THIS FILE ──────────────────────────────────────────
 * CLAUDE.md §3.5 / ARCHITECTURE.md §D.6: **never render a fabricated claim.**
 * A placeholder *photograph* is honest — everyone reads it as art direction
 * pending real art. A placeholder *fact* is not: an invented ICAN registration
 * number, an invented "15 years of practice", an invented office address or an
 * invented phone number are false statements on a regulated professional's
 * website, and one of them (a phone number) is very likely someone else's real
 * number.
 *
 * So every verifiable fact below is typed as `T | null` and ships as `null`.
 * Components branch on absence and render nothing. That is not a gap to be
 * filled with lorem before launch — it is the mechanism, and it is exercised:
 * `/` currently renders the absent branch of every one of these, and `/design`
 * renders the present branch with explicitly-supplied sample data so both paths
 * are visually reviewable and both are covered by the responsive gate.
 *
 * What is NOT null: descriptive copy about what a CA practice does. A service
 * list, a sector list and a process description are the firm's *offer*, not a
 * verifiable claim, and ARCHITECTURE.md §J.4.7 requires realistic prose rather
 * than lorem. Those are written to be plausible for a Nepal/ICAN practice and
 * are expected to be edited, not deleted.
 *
 * `pnpm assets:audit` lists every field still awaiting the firm (§P.1.2).
 */

/** A postal address the firm actually occupies. Rendered, and fed to JSON-LD. */
export type Office = {
  readonly id: string;
  readonly name: string;
  /** Street/tole line. */
  readonly street: string;
  readonly city: string;
  /** Province or district, as it would be written on a letterhead. */
  readonly region: string | null;
  readonly postalCode: string | null;
  readonly countryCode: "NP";
  readonly phone: string | null;
  readonly email: string | null;
  /** Decimal degrees. Both or neither — a half-coordinate is worse than none. */
  readonly latitude: number | null;
  readonly longitude: number | null;
  /** True for the office that answers the main line; feeds `LocalBusiness` @id. */
  readonly isPrimary: boolean;
};

/**
 * A social presence. **Opt-in only**: a platform with a null `href` is not a
 * profile the firm has, and rendering a dead icon that 404s is worse than
 * rendering nothing. There is no "coming soon" state.
 */
export type SocialLink = {
  readonly platform: "linkedin" | "facebook" | "x" | "youtube" | "instagram";
  readonly label: string;
  readonly href: string | null;
};

/**
 * A figure in the stats band. `value` is a *string* on purpose: "40+" and
 * "Rs. 2.4bn" are how a firm actually states these, and forcing a number here
 * would push formatting decisions into the component. `source` is required —
 * if nobody can say where a number came from, it does not go on the site.
 */
export type Stat = {
  readonly id: string;
  readonly value: string;
  readonly label: string;
  readonly source: string;
};

/** A named, qualified human. The strongest trust element on a CA site (§D.6). */
export type Person = {
  readonly id: string;
  readonly name: string;
  /** "FCA", "CA", "ACCA" — post-nominals exactly as ICAN records them. */
  readonly postNominals: string | null;
  readonly role: string;
  readonly practiceAreas: readonly string[];
  /** ICAN membership number, when the person consents to publishing it. */
  readonly membershipNumber: string | null;
};

export const brand = {
  /**
   * The firm (root CLAUDE.md §3.3b).
   *
   * `shortName` is deliberately NOT a single word. A chartered accountancy
   * practice is named as a firm — "Rahul & Associates" — and clipping it to
   * "Rahul" in a tight header reads as a personal brand rather than a practice,
   * which is both wrong and, under ICAN's presentation conventions, worse than
   * wrapping. Anywhere space is tight, the monogram is used instead of a
   * truncated name.
   *
   * `isPlaceholderIdentity` stays true until the registration number, founding
   * year, offices and contact details below are confirmed — the *name* is
   * settled, the rest of the identity is not, and `pnpm assets:audit` reports
   * the remainder.
   */
  name: "Rahul & Associates",
  shortName: "Rahul & Associates",
  /** Full registered style, used in the footer, legal pages and JSON-LD. */
  legalName: "Rahul & Associates, Chartered Accountants",
  isPlaceholderIdentity: true,

  /**
   * One line, plain language, no superlative. ICAN advertising rules make
   * "leading", "best" and "No. 1" unusable, and they read as weak anyway.
   */
  tagline: "Audit, tax and advisory for businesses in Nepal",

  /**
   * ~160 characters: this is the default meta description and the OG summary,
   * and it is the sentence a search result is judged on.
   */
  description:
    "A chartered accountancy practice in Nepal providing statutory audit, tax compliance, company secretarial and business advisory services under ICAN and NFRS.",

  /** Longer intro prose for the firm-introduction section. Two paragraphs. */
  intro: [
    "We are a chartered accountancy practice serving businesses, not-for-profits and institutions across Nepal. Our work is statutory audit, tax compliance and the advisory that sits alongside both — the recurring obligations a business has to meet, handled by people who do only this.",
    "Engagements are led by a partner and staffed by qualified people who stay with the file year on year. We would rather explain a position clearly than deliver a report that needs interpreting, and we say plainly when something is outside our competence.",
  ] as const,

  /** ────────── Verifiable facts. All null until the firm confirms them. ────── */

  /**
   * ICAN firm registration number. A registration number above the fold is the
   * fastest credibility signal a CA firm has (§D.6, row 1) — which is exactly
   * why inventing one is unacceptable. Null until confirmed; the utility bar
   * omits the whole element.
   */
  icanRegistrationNumber: null as string | null,

  /**
   * IRD Permanent Account Number.
   *
   * In Nepal the convention is to print the ICAN firm registration number **and**
   * the IRD PAN together in the footer — it is the pair that makes a practice
   * checkable against two independent registers, and it is what the strongest
   * Nepali firm sites do verbatim. Publishing only "ICAN-registered" without a
   * number is materially weaker, which is exactly why inventing one is not an
   * option: null until confirmed, and the footer omits the whole line.
   */
  panNumber: null as string | null,

  /** Year the practice was established. Drives "Est. ____" and `foundingDate`. */
  establishedYear: null as number | null,

  contact: {
    /** E.164, e.g. "+97714XXXXXX". Powers `tel:` and the mobile action bar. */
    phone: null as string | null,
    /** Digits only, no "+", per the wa.me URL format. */
    whatsapp: null as string | null,
    email: null as string | null,
  },

  /**
   * Offices. Empty until real addresses exist — an invented address is a claim
   * a visitor can physically act on. The offices section and every
   * `LocalBusiness` JSON-LD node render nothing while this is empty.
   */
  offices: [] as readonly Office[],

  /**
   * Partners and senior staff. Empty until real people consent to being listed.
   * Naming a person who does not work here is the single worst error this site
   * could make, so there is no placeholder person.
   */
  people: [] as readonly Person[],

  /** Stats band. Empty; see the `Stat.source` requirement above. */
  stats: [] as readonly Stat[],

  /** Opt-in only — a null href means the firm has no such profile. */
  socials: [
    { platform: "linkedin", label: "LinkedIn", href: null },
    { platform: "facebook", label: "Facebook", href: null },
  ] as readonly SocialLink[],

  /**
   * Nepal-specific constants. These are jurisdiction facts (CLAUDE.md §3.4),
   * not firm claims, so they are real and settled.
   */
  locale: {
    country: "Nepal",
    countryCode: "NP",
    /** Nepal Time. No DST — Nepal has never observed it. */
    timeZone: "Asia/Kathmandu",
    utcOffset: "+05:45",
    currency: "NPR",
    currencySymbol: "Rs.",
    language: "en",
    /** Sunday–Friday. Any Mon–Fri working-day helper is wrong here (§3.4). */
    weekend: ["saturday"] as const,
    /** Shrawan–Ashad. Month indices are Bikram Sambat, 1-based. */
    fiscalYearStartMonth: 4,
  },

  /**
   * Regulators a Nepali CA practice actually references. Outbound links, so
   * they are `rel="noopener"` at the call site.
   */
  regulators: [
    {
      id: "ican",
      name: "ICAN",
      full: "Institute of Chartered Accountants of Nepal",
      href: "https://www.ican.org.np/",
    },
    {
      id: "ird",
      name: "IRD",
      full: "Inland Revenue Department",
      href: "https://ird.gov.np/",
    },
    {
      id: "ocr",
      name: "OCR",
      full: "Office of the Company Registrar",
      href: "https://ocr.gov.np/",
    },
    {
      id: "nrb",
      name: "NRB",
      full: "Nepal Rastra Bank",
      href: "https://www.nrb.org.np/",
    },
    {
      id: "sebon",
      name: "SEBON",
      full: "Securities Board of Nepal",
      href: "https://www.sebon.gov.np/",
    },
  ] as const,

  /**
   * The professional disclaimer. ARCHITECTURE.md §D.6 row 16: on a professional
   * site the disclaimer *adds* credibility rather than subtracting it.
   */
  disclaimer:
    "Information on this website is general in nature and is not a substitute for professional advice. It does not create a client relationship and should not be relied upon for any specific transaction without engaging us.",
} as const;

/**
 * Narrow `T | null | undefined` to `T`, and treat an empty/whitespace string as
 * absent. Used as the single gate in front of every "render nothing when the
 * value is absent" branch, so the rule reads identically at every call site
 * instead of being re-expressed as `x && x.trim()` twelve different ways.
 */
export function isPresent<T>(value: T | null | undefined): value is T {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

/** Social profiles the firm actually has. Never returns a null-href entry. */
export function activeSocials(): readonly (SocialLink & { href: string })[] {
  return brand.socials.filter((s): s is SocialLink & { href: string } =>
    isPresent(s.href),
  );
}

/** `tel:` href, or null when no phone is published. */
export function telHref(): string | null {
  return isPresent(brand.contact.phone)
    ? `tel:${brand.contact.phone.replace(/[^\d+]/g, "")}`
    : null;
}

/** `wa.me` href, or null. WhatsApp wants digits with no "+" and no separators. */
export function whatsAppHref(): string | null {
  return isPresent(brand.contact.whatsapp)
    ? `https://wa.me/${brand.contact.whatsapp.replace(/\D/g, "")}`
    : null;
}

/** `mailto:` href, or null. */
export function mailHref(): string | null {
  return isPresent(brand.contact.email) ? `mailto:${brand.contact.email}` : null;
}
