/**
 * Domain types for the services feature.
 *
 * These are the shapes the **pages** consume. They are deliberately not the
 * shapes `config/content.ts` authors, and not the wire shapes the backend will
 * eventually send: keeping a domain type in the middle is what makes
 * `GET /api/v1/public/services` a change to `service.ts` rather than a rewrite
 * of two pages and six components.
 *
 * When the endpoint lands, a `types.ts` sibling gains the snake_case wire types
 * (CLAUDE.md §5.1 — the wire is mirrored 1:1 so a field is greppable across
 * repositories), `api.ts` does wire→domain mapping, and everything below is
 * untouched.
 */

/** One sub-service inside a practice area — the "What's included" row. */
export type ServiceInclusion = {
  readonly title: string;
  readonly detail: string;
};

/** One "Who this is for" entry: a situation, and why the service meets it. */
export type ServiceAudience = {
  readonly title: string;
  readonly note: string;
};

export type ServiceFaq = {
  readonly question: string;
  readonly answer: string;
};

/**
 * A practice area, as a page renders it.
 *
 * Every array may legitimately be empty, and every section that reads one
 * returns `null` when it is. That is the same honest-degradation rule the
 * landing page's sections follow (CLAUDE.md §3.5) applied to editorial content:
 * a page must never print a "What's included" heading over nothing.
 */
export type Service = {
  readonly slug: string;
  readonly name: string;
  /** One sentence. The card lede, the detail-page standfirst and the OG title. */
  readonly summary: string;
  /** lucide-react icon name, resolved through `icons.ts` at the render site. */
  readonly icon: string;
  /** ~155 characters, written per service. Feeds `<meta name="description">`. */
  readonly metaDescription: string;
  readonly overview: readonly string[];
  readonly whatsIncluded: readonly ServiceInclusion[];
  readonly whoFor: readonly ServiceAudience[];
  readonly whatYouGet: readonly string[];
  readonly faqs: readonly ServiceFaq[];
};

/** The subset a cross-link or a `<select>` option needs. */
export type ServiceSummary = Pick<Service, "slug" | "name" | "summary" | "icon">;
