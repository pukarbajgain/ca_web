/**
 * Editorial defaults for the landing page and the services pages.
 *
 * **Why this file exists and what it is allowed to contain.** ARCHITECTURE.md
 * §J.4.7 requires realistic prose, never lorem — and CLAUDE.md §3.5 forbids a
 * fabricated claim. Those are compatible because they cover different things:
 *
 *   - A service list, a sector list, a description of how an engagement runs and
 *     a set of common questions describe **what the firm offers and how it
 *     works**. They are editorial, they are plausible for any Nepali CA
 *     practice, and they are meant to be edited rather than deleted.
 *   - A registration number, a headcount, a founding year, an address or a
 *     client count are **verifiable facts**. Those live in `lib/brand.ts`, ship
 *     as `null`, and render nothing. None of them appear here.
 *
 * These move into the CMS in Phase 4 (`service`, `faq` and `sector` become real
 * content types). Until the backend exposes them, they are typed local data —
 * not a mock of a remote call, which §O.18 bans. A component reads this the same
 * way it will read the API: a list that may be empty.
 *
 * **Nothing imports this module directly except the read seam.** `/services` and
 * `/services/[slug]` go through `features/services/service.ts`, so swapping to
 * `GET /api/v1/public/services` is a change to two functions rather than to
 * every page. (`components/sections/*` and `lib/routes.ts` read it directly, and
 * are named in that module's comment as the two call sites that move with it.)
 *
 * Copy discipline for a regulated profession: no superlative, no comparative, no
 * "leading"/"best"/"trusted by N clients", and every answer below is
 * process-oriented rather than a specific tax position — a website is not the
 * place to give an opinion that a reader might rely on (`brand.disclaimer`).
 */

/**
 * One sub-service inside a practice area.
 *
 * `title` is the line a card can carry on its own; `detail` is the sentence that
 * makes it credible on the service's own page. Keeping them in one record rather
 * than two parallel lists is what stops the card and the detail page drifting —
 * `ServiceItem.includes` below is *derived* from these titles, never re-typed.
 */
export type ServiceInclusion = {
  readonly title: string;
  readonly detail: string;
};

/** "Who this is for" — a situation, plus why this practice area meets it. */
export type ServiceAudience = {
  readonly title: string;
  readonly note: string;
};

export type ServiceItem = {
  readonly slug: string;
  readonly name: string;
  /** One line for the card. Second person, plain language, no jargon stack. */
  readonly summary: string;
  /** 3–4 concrete deliverables. Specifics are what make a list credible.
   *  **Derived** from the first four `whatsIncluded` titles — see `defineService`. */
  readonly includes: readonly string[];
  /** lucide-react icon name, resolved through a map in the component so this
   *  module stays free of component imports and safe to import anywhere. */
  readonly icon: string;
  /**
   * Gives this service a double-width cell in the grid.
   *
   * Six equally-weighted cards read as a list of six equally-important things,
   * which is never true — a practice has a defining service and a set of
   * services that surround it. Letting size carry that is cheaper and more
   * honest than ordering alone, and it is **data**, not markup: the firm changes
   * its emphasis by moving this flag, not by editing a component.
   *
   * At most one. The grid falls back to a uniform layout if none is set.
   */
  readonly featured?: boolean;

  /* ── Fields the detail page needs and the card does not ──────────────────
   * ARCHITECTURE.md §A.5 records the section structure every reference CA site
   * converges on: hero + intro → what's included → who this is for → what you
   * get → FAQs. Each of the four below is one of those sections, so the page
   * cannot render a section the content does not support. */

  /**
   * Two paragraphs of intro prose for `/services/[slug]`.
   *
   * Deliberately about **scope, process and obligation**, never a position on a
   * specific tax or accounting treatment. Guidance a reader might rely on goes
   * through the `reviewed_by` editorial workflow as an article (§G.4), not into
   * marketing copy.
   */
  readonly overview: readonly string[];
  /** The real sub-service list. Fuller than the card's four bullets. */
  readonly whatsIncluded: readonly ServiceInclusion[];
  /** Who the practice area is for. Situations, not company sizes. */
  readonly whoFor: readonly ServiceAudience[];
  /** The deliverables that actually land on the client's desk. */
  readonly whatYouGet: readonly string[];
  /** Per-service FAQs. Drive the on-page accordion **and** `FAQPage` JSON-LD. */
  readonly faqs: readonly FaqItem[];
  /**
   * ~155 characters. This is the detail page's meta description and OG summary —
   * the sentence a search result is judged on, so it is written per service
   * rather than generated from `summary` with the firm name bolted on.
   */
  readonly metaDescription: string;
};

/** Everything a service is authored with. `includes` is derived, never typed. */
type ServiceSpec = Omit<ServiceItem, "includes">;

/**
 * Builds a `ServiceItem`, deriving the card's `includes` from `whatsIncluded`.
 *
 * The card and the detail page were originally two hand-written lists, which is
 * a drift bug waiting to happen: someone renames a sub-service on the detail
 * page and the homepage keeps advertising the old name indefinitely. One list,
 * one truth, and the card simply shows less of it.
 */
function defineService(spec: ServiceSpec): ServiceItem {
  return { ...spec, includes: spec.whatsIncluded.slice(0, 4).map((i) => i.title) };
}

/**
 * Six services, which is the §D.6 row-7 range (6–8). Ordered by how a Nepali
 * business actually encounters them: the statutory obligation first, then the
 * recurring one, then the things that follow from having a company at all.
 */
/**
 * The landing hero.
 *
 * Copy and trust markers live here, not in the component, for the reason every
 * other string on this site does: the firm edits its own words without going
 * near JSX, and there is one place to check a claim.
 *
 * **Every line below is a claim the firm is making about itself**, which is
 * exactly why it is data and not markup (CLAUDE.md §3.5). Nothing here is
 * inferred or rounded up by the site; change the words and the page changes.
 */
export type HeroTrustMarker = {
  readonly icon: "registration" | "clients" | "experience";
  /**
   * One string per rendered line.
   *
   * The breaks are authored rather than left to the container: at three
   * markers across a 34rem column, natural wrapping put "Businesses" and
   * "Across" on different lines from the design and the row stopped scanning
   * as three peers. Short, deliberate lines also survive translation better
   * than a width that happens to work in English.
   */
  readonly lines: readonly string[];
};

export const heroContent = {
  /** Split so the accent can sit on the closing phrase without a nested span
   *  in the middle of a sentence. */
  headline: "Your Trusted Chartered Accountants",
  headlineAccent: "in Nepal",
  body:
    "Audit, tax, compliance and advisory services for businesses, startups and " +
    "individuals — delivered with clarity, commitment and practical solutions.",
  trust: [
    { icon: "registration", lines: ["Registered", "with ICAN"] },
    { icon: "clients", lines: ["Trusted by", "Businesses Across", "Nepal & India"] },
    { icon: "experience", lines: ["7+ Years", "of Professional", "Excellence"] },
  ],
} as const satisfies {
  headline: string;
  headlineAccent: string;
  body: string;
  trust: readonly HeroTrustMarker[];
};

export const services: readonly ServiceItem[] = [
  defineService({
    slug: "audit-and-assurance",
    name: "Audit & assurance",
    summary:
      "Statutory and special-purpose audits carried out under Nepal Standards on Auditing, with findings you can act on.",
    icon: "ClipboardCheck",
    // The defining service of a chartered accountancy practice, and the one
    // most visitors arrive looking for.
    featured: true,
    metaDescription:
      "Statutory audit, NGO and project audit, internal audit and certification for entities in Nepal, carried out under Nepal Standards on Auditing.",
    overview: [
      "An audit is a statutory obligation for most registered entities in Nepal, and for a donor-funded project it is often a condition of the grant itself. We plan the work around the deadline that actually binds you — the Office of the Company Registrar filing, the donor's reporting date, or the annual general meeting — and agree the timetable before fieldwork starts.",
      "The report is only half of it. Where we find a control that does not work, a reconciliation that has not been done or a treatment we disagree with, you hear about it while there is still time to deal with it, in a management letter written to be read by a board rather than by another auditor.",
    ],
    whatsIncluded: [
      {
        title: "Statutory audit under the Companies Act",
        detail:
          "Annual audit of the financial statements of private and public companies, with the auditor's report and the schedules the Office of the Company Registrar expects.",
      },
      {
        title: "NGO/INGO and project audits for donor reporting",
        detail:
          "Project and grant audits in the format the donor requires, including fund utilisation statements and Social Welfare Council reporting.",
      },
      {
        title: "Internal audit and systems review",
        detail:
          "A recurring internal audit programme agreed with the board or audit committee, reporting on controls, authorisation and where cash and inventory actually go.",
      },
      {
        title: "Agreed-upon procedures and certification",
        detail:
          "Turnover, net worth, fund utilisation and other certificates required by banks, regulators and tender processes, issued only on procedures we have actually performed.",
      },
      {
        title: "Tax audit support",
        detail:
          "Schedules, reconciliations and working papers prepared so that an Inland Revenue Department review starts from a file that answers its own questions.",
      },
      {
        title: "Opening-balance and first-year audits",
        detail:
          "Verification of opening balances where we are appointed after incorporation or in place of a previous auditor, including communication with the outgoing firm.",
      },
    ],
    whoFor: [
      {
        title: "Companies with a statutory filing due",
        note: "Private and public companies that must file audited statements with the OCR each year.",
      },
      {
        title: "NGOs, INGOs and donor-funded projects",
        note: "Where the audit format is set by the grant agreement rather than by the Companies Act.",
      },
      {
        title: "Boards that want an independent view",
        note: "Internal audit for entities where the statutory audit alone does not give the board enough.",
      },
      {
        title: "Entities changing auditor",
        note: "Where a first-year audit means opening balances have to be verified rather than assumed.",
      },
    ],
    whatYouGet: [
      "An audit report and signed financial statements in the form the recipient requires",
      "A management letter setting out control weaknesses, in priority order, with what to do about each",
      "A closing meeting with the partner who signed the report, not a handover of paper",
      "The schedules and confirmations your filing, bank or donor will ask for next",
    ],
    faqs: [
      {
        question: "How long does an audit take?",
        answer:
          "For a small or medium company with books already closed, fieldwork is usually a few days and the report follows within two to three weeks. The variable is almost never the audit itself — it is how ready the accounting records are. We tell you at the planning stage what we will need, so the timetable is something you can hold us to.",
      },
      {
        question: "What do you need from us before fieldwork starts?",
        answer:
          "A trial balance and closed ledgers for the year, bank statements and confirmations, fixed asset and inventory records, tax and VAT returns filed during the year, and the minute book. We send a written request list at planning, and we chase it — an audit that stalls waiting for documents helps nobody.",
      },
      {
        question: "Can you audit an entity you also do the bookkeeping for?",
        answer:
          "No. Preparing the accounts we then audit would compromise independence under the ICAN code of ethics, and we will not do it. Where a client needs both, we take one role and help them find a separate firm for the other.",
      },
      {
        question: "Do you issue the certificates banks ask for?",
        answer:
          "Yes, where we have performed procedures that support them — turnover, net worth and fund utilisation certificates are common. We do not issue a certificate on figures we have not tested, however routine the request looks.",
      },
    ],
  }),
  defineService({
    slug: "taxation",
    name: "Taxation",
    summary:
      "Income tax, VAT and TDS handled as a routine — returns filed on time, positions documented, assessments answered.",
    icon: "Receipt",
    metaDescription:
      "Income tax, VAT and TDS registration, filing and assessment support for businesses in Nepal, under the Income Tax Act and the Value Added Tax Act.",
    overview: [
      "Most tax problems in Nepal are not disputes about the law. They are a return filed late, a TDS deposit missed in a busy month, or a position taken three years ago that nobody wrote down. We run tax as a calendar rather than as a series of emergencies: every filing a client has is on a schedule, and someone here owns the date.",
      "Where a genuine question of treatment arises, we set out the position, the section it rests on and the risk, in writing, before it goes into a return. That file is what answers an Inland Revenue Department query two years later, and it is the difference between a query and an assessment.",
    ],
    whatsIncluded: [
      {
        title: "Income tax computation and annual filing",
        detail:
          "Computation from the audited or management accounts, D-01/D-03 filing, advance tax estimates and instalment tracking through the fiscal year.",
      },
      {
        title: "VAT and TDS registration, returns and reconciliation",
        detail:
          "PAN and VAT registration, monthly or trimester VAT returns, TDS deposit and e-TDS filing, and reconciliation of the returns to the ledgers.",
      },
      {
        title: "Responses to IRD queries and assessments",
        detail:
          "Drafting replies, assembling supporting records, attending the tax office with you, and taking an assessment to administrative review where that is the right course.",
      },
      {
        title: "Tax planning within the Income Tax Act",
        detail:
          "Structuring, timing and allowance decisions taken on the statute and current practice — never on a scheme whose only merit is that nobody has challenged it yet.",
      },
      {
        title: "Withholding and cross-border payments",
        detail:
          "TDS rates on service, rent, royalty and contractor payments, and treaty relief where a double taxation agreement applies.",
      },
      {
        title: "Filing calendar and deadline monitoring",
        detail:
          "A per-client schedule of every recurring obligation, so a missed month is caught by us rather than by a penalty notice.",
      },
    ],
    whoFor: [
      {
        title: "Businesses with monthly obligations",
        note: "VAT and TDS filings recur whether or not anyone is watching the calendar.",
      },
      {
        title: "Entities facing an IRD query or assessment",
        note: "Where the file needs assembling and the reply needs writing to the section, not to the tone of the letter.",
      },
      {
        title: "Companies making cross-border payments",
        note: "Withholding on services, royalties and management fees, and treaty relief where it applies.",
      },
      {
        title: "Anyone who has fallen behind",
        note: "Late returns and unfiled years can be brought current; the longer they are left the more it costs.",
      },
    ],
    whatYouGet: [
      "Every return filed, with the acknowledgement and the working file kept together",
      "A written position note for any treatment that is a judgement rather than a rule",
      "A filing calendar covering the whole fiscal year, shared with you",
      "Someone who attends the tax office with you rather than sending you a letter to hand over",
    ],
    faqs: [
      {
        question: "When does the Nepali fiscal year end, and what is due after it?",
        answer:
          "The fiscal year runs Shrawan to Ashad. The annual income tax return follows the year end, and VAT and TDS obligations recur through the year on their own cycles — monthly or trimester depending on registration. The exact dates shift with the calendar each year, which is why we run a per-client filing schedule rather than relying on memory.",
      },
      {
        question: "We have unfiled returns from previous years. Can that be fixed?",
        answer:
          "Usually, yes. Late filing generally attracts interest and fees, and the amounts grow with time, so bringing the position current is almost always cheaper than waiting. We would start by establishing exactly what is outstanding, then file in order and deal with the consequences openly rather than hoping they are not noticed.",
      },
      {
        question: "Do you handle VAT refunds?",
        answer:
          "Yes, where a genuine refund position exists — typically exporters and entities in a sustained input-credit position. Refund claims are examined closely, so the work is mostly in the supporting records: a claim that cannot be evidenced line by line is a query waiting to happen.",
      },
      {
        question: "Will you take a position you think is aggressive if we ask you to?",
        answer:
          "We will tell you where the line is and where a position sits relative to it, in writing. If a position is not supportable we will not sign it, and we would rather say that early than sign and then be unable to defend it.",
      },
    ],
  }),
  defineService({
    slug: "accounting-and-payroll",
    name: "Accounting & payroll",
    summary:
      "Outsourced bookkeeping and payroll for businesses that would rather not carry a finance department.",
    icon: "Calculator",
    metaDescription:
      "Outsourced bookkeeping, management accounts and payroll with TDS and SSF deductions for businesses in Nepal, kept audit-ready month by month.",
    overview: [
      "A business below a certain size cannot justify a qualified finance team, and a business above it usually discovers that the books it has been keeping do not survive an audit. Outsourced accounting sits between those two: monthly bookkeeping done to the standard the year-end will require, so the audit is a review rather than a reconstruction.",
      "Payroll is included because in Nepal it is inseparable from tax. Salary TDS, Social Security Fund contributions and provident fund deductions all have their own deposit deadlines, and getting the payslip right while missing the deposit is not getting payroll right.",
    ],
    whatsIncluded: [
      {
        title: "Monthly bookkeeping and management accounts",
        detail:
          "Vouchers posted, ledgers maintained and a monthly profit-and-loss, balance sheet and cash position you can actually read.",
      },
      {
        title: "Payroll processing with TDS and SSF deductions",
        detail:
          "Payslips, salary TDS computation, Social Security Fund and provident fund schedules, and the deposit and filing that follow each month.",
      },
      {
        title: "Bank and party reconciliations",
        detail:
          "Bank, receivable and payable reconciliations performed monthly, so a difference is found the month it arises rather than at year end.",
      },
      {
        title: "Year-end close and audit-ready schedules",
        detail:
          "Closing entries, accruals, depreciation and the supporting schedules an auditor asks for, prepared before the auditor asks.",
      },
      {
        title: "Accounting system setup and chart of accounts",
        detail:
          "Setting up or restructuring the chart of accounts and the recording routine so the reports mean something and the audit trail holds.",
      },
      {
        title: "Fixed asset register maintenance",
        detail:
          "A register that ties to the ledger, with additions, disposals and depreciation kept current rather than rebuilt each year.",
      },
    ],
    whoFor: [
      {
        title: "Businesses without an in-house finance team",
        note: "Where the alternative is the owner doing the books on evenings and weekends.",
      },
      {
        title: "Branch and representative offices",
        note: "Foreign-owned entities that need Nepali-compliant books and a local point of contact.",
      },
      {
        title: "Entities whose books did not survive the last audit",
        note: "Where the year-end became a reconstruction and nobody wants to repeat it.",
      },
      {
        title: "Employers with SSF and TDS obligations",
        note: "Payroll where the deduction is only half the job and the deposit is the other half.",
      },
    ],
    whatYouGet: [
      "Monthly management accounts within an agreed number of days after month end",
      "Payslips, statutory deduction schedules and the deposits made on time",
      "Reconciled bank, receivable and payable positions every month",
      "A year-end file the auditor can work from without rebuilding it",
    ],
    faqs: [
      {
        question: "Do we have to change accounting software?",
        answer:
          "Not usually. We work with the common packages used in Nepal and with spreadsheets where the volume genuinely does not justify a package. If the current setup cannot produce a reliable audit trail we will say so and explain what changing would involve, but it is a recommendation, not a condition of engagement.",
      },
      {
        question: "How do documents reach you?",
        answer:
          "Whatever is practical: shared drive, email, or collection where volume makes that easier. What matters more than the channel is the routine — an agreed cut-off each month, so the accounts close on a date rather than whenever the last voucher arrives.",
      },
      {
        question: "Can you also be our auditor?",
        answer:
          "No. Auditing accounts we prepared would compromise independence under the ICAN code of ethics. We take one role or the other, and we are happy to work alongside whichever firm takes the other.",
      },
      {
        question: "Who deals with a payroll query from an employee?",
        answer:
          "You do, and we give you what you need to answer it — the computation behind each payslip, including how the salary TDS and SSF figures were arrived at. We do not deal directly with your staff unless you ask us to.",
      },
    ],
  }),
  defineService({
    slug: "company-secretarial",
    name: "Company secretarial",
    summary:
      "Registrations, annual filings and the ongoing OCR compliance that keeps a company in good standing.",
    icon: "FileText",
    metaDescription:
      "Company and branch registration, OCR annual returns, statutory registers and share transfers for entities operating in Nepal.",
    overview: [
      "Company secretarial work is the least visible thing a business needs and the fastest to become a problem. An unfiled annual return, a share transfer never recorded, a director change never notified — none of it matters until a bank, a buyer or a regulator asks for the file, and then all of it matters at once.",
      "We keep the register current and the filings made, and we handle the registrations a business needs at the start: incorporation, PAN and VAT, industry registration, and the local and sectoral permissions that depend on what the entity actually does.",
    ],
    whatsIncluded: [
      {
        title: "Company and branch registration at the OCR",
        detail:
          "Name reservation, memorandum and articles, incorporation, and branch or liaison office registration for foreign entities.",
      },
      {
        title: "Annual returns and statutory register maintenance",
        detail:
          "The annual return to the Office of the Company Registrar, plus registers of members, directors and charges kept current rather than reconstructed.",
      },
      {
        title: "Share transfers, capital changes and board records",
        detail:
          "Allotments, transfers, increases in authorised capital, and the board and general meeting minutes that have to support them.",
      },
      {
        title: "Industry, PAN/VAT and local registrations",
        detail:
          "Department of Industry registration, PAN and VAT with the Inland Revenue Department, and ward and municipal registrations where required.",
      },
      {
        title: "Director, address and object changes",
        detail:
          "Notifying the OCR of changes to directors, registered office and objects within the periods the Companies Act allows.",
      },
      {
        title: "Winding up and deregistration",
        detail:
          "Closing an entity properly, including final filings and clearances, rather than leaving a dormant company accruing obligations.",
      },
    ],
    whoFor: [
      {
        title: "New companies and branch offices",
        note: "Where the first year is a sequence of registrations nobody has done before.",
      },
      {
        title: "Companies behind on OCR filings",
        note: "Where annual returns have lapsed and the position needs bringing current.",
      },
      {
        title: "Businesses taking investment",
        note: "Where a share issue or transfer has to be recorded correctly to survive due diligence.",
      },
      {
        title: "Foreign-owned entities",
        note: "Where approvals, registrations and reporting run alongside the ordinary company filings.",
      },
    ],
    whatYouGet: [
      "Registration certificates and approvals, with the file kept in one place",
      "Annual returns filed and the statutory registers maintained",
      "Minutes and resolutions drafted to support each recorded change",
      "A written list of what is due next, and when",
    ],
    faqs: [
      {
        question: "How long does it take to register a company in Nepal?",
        answer:
          "Where the name is available and the shareholders' documents are in order, incorporation is usually a matter of days rather than weeks. What extends it is almost always documentation — particularly for foreign shareholders, where notarised and authenticated documents are required and have to be obtained abroad.",
      },
      {
        question: "What happens if annual returns have not been filed for years?",
        answer:
          "The company remains liable and the fees accrue, but the position can generally be brought current by filing the outstanding years. We would establish what is missing, quantify the cost before starting, and file in order.",
      },
      {
        question: "Do you act as company secretary for our board?",
        answer:
          "We prepare board and general meeting documentation, keep the registers and make the filings. Formal appointment as company secretary depends on the entity and what the Companies Act requires of it, and we will tell you plainly which of the two you actually need.",
      },
      {
        question: "Can a foreign company open a branch rather than a subsidiary?",
        answer:
          "In many cases yes, and the choice has real tax and liability consequences. Which is appropriate depends on what the entity will do in Nepal and for how long, so it is a conversation before it is a filing.",
      },
    ],
  }),
  defineService({
    slug: "financial-reporting-advisory",
    name: "Financial reporting advisory",
    summary:
      "NFRS application for entities moving beyond simple accounts, including first-time adoption.",
    icon: "BookOpen",
    metaDescription:
      "NFRS transition and first-time adoption support, accounting policy papers, consolidation and technical opinions for reporting entities in Nepal.",
    overview: [
      "Nepal Financial Reporting Standards apply differently depending on the entity, and the point at which a business crosses into full NFRS is rarely noticed in advance. First-time adoption is where most of the work sits: restating comparatives, choosing between the exemptions available on transition, and writing the disclosures that explain what changed and why.",
      "Beyond transition, this is the work that does not fit into a routine — a lease, a financial instrument, a business combination, a revenue arrangement whose timing is not obvious. We write the position down, with the standard and the reasoning, so it can be given to an auditor rather than re-argued each year.",
    ],
    whatsIncluded: [
      {
        title: "NFRS transition and first-time adoption support",
        detail:
          "Gap assessment against current practice, an opening statement of financial position, restated comparatives and the transition disclosures.",
      },
      {
        title: "Accounting policy papers and disclosure drafting",
        detail:
          "Written policies for the areas that carry judgement, and disclosure notes drafted to the standard rather than copied from another entity's accounts.",
      },
      {
        title: "Consolidation and group reporting",
        detail:
          "Consolidation workings for groups, associates and joint arrangements, including intra-group elimination and non-controlling interests.",
      },
      {
        title: "Technical opinions on specific transactions",
        detail:
          "A reasoned written opinion on how a particular transaction should be recognised, measured and disclosed, referenced to the applicable standard.",
      },
      {
        title: "Financial statement preparation and review",
        detail:
          "Drafting a full set of NFRS financial statements, or reviewing yours against a disclosure checklist before they go to the auditor.",
      },
      {
        title: "Impairment, leases and financial instruments",
        detail:
          "The three areas that most often need working through in practice, including expected credit loss models where they apply.",
      },
    ],
    whoFor: [
      {
        title: "Entities moving to full NFRS",
        note: "Where growth, listing or a lender has changed which framework applies.",
      },
      {
        title: "Groups preparing consolidated accounts",
        note: "Where more than one entity has to be presented as one.",
      },
      {
        title: "Finance teams facing an unusual transaction",
        note: "A lease, an acquisition or an instrument where the treatment is a judgement.",
      },
      {
        title: "Boards that had a disagreement with an auditor",
        note: "Where an independent technical view, written down, would settle it.",
      },
    ],
    whatYouGet: [
      "A written technical position referenced to the applicable standard",
      "Restatement workings and transition disclosures that an auditor can follow",
      "Accounting policies documented for the areas that carry judgement",
      "A disclosure checklist review before the accounts leave your hands",
    ],
    faqs: [
      {
        question: "Does NFRS apply to our company?",
        answer:
          "Which framework applies depends on the type and size of the entity and on what the Institute has prescribed for it. Establishing that is the first hour of any transition engagement, and it is worth doing deliberately — applying the wrong framework is expensive to unwind after a year of reporting under it.",
      },
      {
        question: "How long does a first-time adoption take?",
        answer:
          "For a single entity with straightforward operations, a matter of weeks. The variables are the number of areas where practice differs from the standard, the quality of the historical records needed to restate comparatives, and how many judgements have to be documented for the first time.",
      },
      {
        question: "Can you prepare our financial statements and audit them?",
        answer:
          "No — preparing the statements we then audit would compromise independence under the ICAN code of ethics. We do this work for entities whose audit is with another firm, and we deal with that firm directly where it helps.",
      },
      {
        question: "Will a written opinion from you satisfy our auditor?",
        answer:
          "It is not binding on them, and we would not present it as if it were. What it does is set out the reasoning and the references clearly enough that the discussion is about the standard rather than about who said what.",
      },
    ],
  }),
  defineService({
    slug: "business-advisory",
    name: "Business advisory",
    summary:
      "Structuring, valuation and due diligence for transactions, funding rounds and internal decisions.",
    icon: "TrendingUp",
    metaDescription:
      "Business valuation, financial and tax due diligence, projections and internal control design for transactions and funding decisions in Nepal.",
    overview: [
      "Advisory work here means the analysis behind a decision that is about to be made: what a business is worth, what is actually inside the one being bought, whether the projection a lender is being shown holds together. It is finite work with a deliverable, not a retainer for general advice.",
      "The discipline is the same as the audit side of the practice — say what was examined, say what was not, and be explicit about the assumptions. A valuation whose assumptions are hidden inside a spreadsheet is not a valuation anyone can rely on, and that includes the person who commissioned it.",
    ],
    whatsIncluded: [
      {
        title: "Business valuation and financial modelling",
        detail:
          "Valuations for transactions, share transfers and disputes, with the method, the assumptions and the sensitivities set out rather than buried.",
      },
      {
        title: "Financial and tax due diligence",
        detail:
          "Buy-side or sell-side review of earnings quality, working capital, related-party dealings and undisclosed tax exposure, reported as findings rather than as a data dump.",
      },
      {
        title: "Projections for bank and investor submissions",
        detail:
          "Forecast statements and cash flow built on stated assumptions, in the format lenders and investors in Nepal actually ask for.",
      },
      {
        title: "Internal control and process design",
        detail:
          "Authorisation limits, segregation of duties and reporting routines designed for the size the business is, not for the size of its auditor.",
      },
      {
        title: "Entity structuring and reorganisation",
        detail:
          "How a group or a new venture should be structured, with the tax, regulatory and practical consequences of each option written down.",
      },
      {
        title: "Agreed-upon procedures for a specific question",
        detail:
          "A defined piece of investigative work — a fund trace, a margin review, a stock verification — reported on exactly the procedures performed.",
      },
    ],
    whoFor: [
      {
        title: "Buyers and sellers of a business",
        note: "Where a price has to be justified and what sits behind it has to be examined.",
      },
      {
        title: "Companies raising debt or equity",
        note: "Where a lender or investor needs projections that survive questioning.",
      },
      {
        title: "Shareholders in disagreement",
        note: "Where an independent valuation is what allows a transfer to be settled.",
      },
      {
        title: "Businesses that have outgrown their controls",
        note: "Where the routines that worked at ten people do not work at fifty.",
      },
    ],
    whatYouGet: [
      "A report that states the scope, the method and what was outside it",
      "Assumptions listed openly, with sensitivities on the ones that move the answer",
      "Findings ranked by what they are worth, not by the order they were found in",
      "A meeting to work through the conclusions before anything is finalised",
    ],
    faqs: [
      {
        question: "How is a valuation fee set?",
        answer:
          "On the scope and the time the work requires, agreed in writing before it starts. It is never a percentage of the valuation or of a transaction value — a fee that moves with the answer is not consistent with an independent opinion.",
      },
      {
        question: "Can you do due diligence in a short timeframe?",
        answer:
          "Often, yes, provided the scope is narrowed deliberately rather than by accident. We would rather agree to examine four areas properly than to look at everything superficially, and the report says exactly which four.",
      },
      {
        question: "Will you sign off on projections we have already prepared?",
        answer:
          "We will review them, test the assumptions and report on what we find. We do not attach the practice's name to a forecast we have not been able to trace back to something.",
      },
      {
        question: "Is advisory work confidential if a transaction does not proceed?",
        answer:
          "Yes. Client confidentiality under the ICAN code of ethics applies regardless of whether a transaction completes, and it binds everyone in the practice indefinitely.",
      },
    ],
  }),
];

/**
 * Sectors, not clients. §D.6 row 9: this signals relevant experience without
 * naming anyone — which is both a confidentiality requirement and the thing
 * ICAN's advertising restrictions are most concerned with.
 */
export const sectors: readonly { name: string; note: string }[] = [
  { name: "NGOs and INGOs", note: "Donor-funded project audits and grant reporting" },
  {
    name: "Trading and manufacturing",
    note: "Inventory, excise and customs-linked accounting",
  },
  {
    name: "Hospitality and tourism",
    note: "Seasonal revenue cycles and service-charge treatment",
  },
  { name: "Cooperatives and BFIs", note: "Sector-specific reporting and NRB directives" },
  {
    name: "Technology and services",
    note: "Export income, cross-border payments and TDS",
  },
  {
    name: "Education and healthcare",
    note: "Not-for-distribution structures and exemptions",
  },
];

/**
 * Four steps. §D.6 row 8 exists to remove one specific hesitation — "what
 * actually happens if I call?" — so each step says what *we* do and what *you*
 * get, not what we value.
 */
export const engagementSteps: readonly {
  title: string;
  body: string;
}[] = [
  {
    title: "First conversation",
    body: "A short call or meeting to understand the entity, its obligations and what is already in place. No charge, and no obligation to proceed.",
  },
  {
    title: "Scope and engagement letter",
    body: "We put the work, the timeline, the responsibilities on both sides and the fee basis in writing before anything starts.",
  },
  {
    title: "Fieldwork and review",
    body: "A named team does the work and a partner reviews it. You get a single point of contact and a running list of open items — no surprises at the end.",
  },
  {
    title: "Report and follow-through",
    body: "We deliver the report or return, walk you through what it says, and stay available for the filings and queries that follow.",
  },
];

/**
 * Credential marquee (§D.6 row 4). Quiet, factual, scannable.
 *
 * Only statements that are true by construction appear here. "ICAN registered"
 * is a definitional property of a chartered accountancy practice; "Est. ____"
 * is deliberately absent because `brand.establishedYear` is null — the marquee
 * component appends it only when a real year exists.
 */
export const credentials: readonly string[] = [
  "ICAN registered practice",
  "Audit & assurance",
  "Income tax · VAT · TDS",
  "NFRS reporting",
  "Company secretarial",
  "Nepal-wide engagements",
];

export type FaqItem = { readonly question: string; readonly answer: string };

/**
 * FAQ (§D.6 row 13) — answers the objection before it becomes a bounce.
 *
 * Every answer is deliberately about **process, scope or timing**, never a
 * position on a specific tax treatment. Published guidance a reader might rely
 * on carries real professional liability (§P.3), and it goes through the
 * `reviewed_by` workflow as an article — not into a homepage accordion.
 */
export const faqs: readonly FaqItem[] = [
  {
    question: "When does my company need a statutory audit?",
    answer:
      "Companies registered under the Companies Act are generally required to have their annual financial statements audited by a registered auditor before filing with the Office of the Company Registrar. The specific requirements depend on the type of entity and its registration. We can confirm what applies to your company in a short call.",
  },
  {
    question: "What is the Nepali fiscal year, and when are returns due?",
    answer:
      "The fiscal year runs from Shrawan to Ashad. Income tax returns, VAT and TDS filings each have their own statutory deadlines within and after that cycle, and some are monthly rather than annual. We maintain a filing calendar for every client so nothing depends on remembering a date.",
  },
  {
    question: "How are your fees set?",
    answer:
      "Fees are agreed in writing before work begins, in the engagement letter. They are based on the scope, the size and complexity of the entity, and the time the engagement genuinely requires — not a percentage of turnover or of any tax outcome.",
  },
  {
    question: "Can you take over from our current auditor or accountant?",
    answer:
      "Yes. There is a professional process for this, including communicating with the outgoing firm, and we handle it. We will also tell you plainly if we think a change is not in your interest.",
  },
  {
    question: "Do you work with clients outside Kathmandu?",
    answer:
      "Yes. Much of the work — bookkeeping, payroll, return preparation and review — is done remotely, with fieldwork scheduled on site where the engagement requires it.",
  },
  {
    question: "Is my information kept confidential?",
    answer:
      "Yes. Client confidentiality is a professional obligation under the ICAN code of ethics, and it binds everyone in the practice. Information is shared outside the firm only where the law requires it or you instruct us to.",
  },
];
