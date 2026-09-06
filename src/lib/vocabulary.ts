/**
 * `vocabulary.ts` — every reader-facing string that is not body copy.
 *
 * Two rules from CLAUDE.md converge here:
 *
 *  1. **A raw enum value must never reach the UI** (§5.2). `published` is a
 *     database state; "Published" is a label; they live in different files.
 *  2. **Architecture stays i18n-ready** (§3.4). Primary language is English and
 *     we are explicitly not building i18n machinery now — but every string
 *     passing through one module means adding Nepali is a data change, not a
 *     refactor. That is the whole mechanism, and it costs nothing today.
 *
 * Devanagari is not covered by the three loaded typefaces; when Nepali ships,
 * Noto Sans/Serif Devanagari is added as an extra family in globals.css, not as
 * a replacement (see the header comment there).
 */

export const vocabulary = {
  nav: {
    home: "Home",
    about: "About",
    services: "Services",
    team: "Our people",
    insights: "Insights",
    contact: "Contact",
    menu: "Menu",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    primary: "Primary",
    skipToContent: "Skip to content",
  },

  actions: {
    call: "Call",
    whatsapp: "WhatsApp",
    email: "Email",
    /**
     * The primary ask, and it is deliberately NOT one string used everywhere.
     *
     * The strongest site in the reference set repeats "Book a Consultation"
     * verbatim in its header, hero, every section footer and its mobile bar, and
     * by the third repetition it has stopped being an invitation and become
     * furniture. Each surface here asks in its own register: the header offers,
     * the hero invites, the closing band — which has just said "start with a
     * conversation" — asks for exactly that, and the phone bar is a verb.
     */
    book: "Book a consultation",
    bookHero: "Book a consultation",
    bookClosing: "Arrange a first conversation",
    bookShort: "Book",
    getInTouch: "Get in touch",
    readMore: "Read more",
    viewAll: "View all",
    viewAllServices: "View all services",
    viewAllInsights: "View all insights",
    meetTheTeam: "Meet the team",
    ourStory: "Our story",
    backHome: "Back to the homepage",
    tryAgain: "Try again",
  },

  sections: {
    credentials: "Credentials",
    about: "About the firm",
    services: "What we do",
    howWeWork: "How we work",
    sectors: "Sectors we serve",
    people: "Our people",
    insights: "Insights",
    faq: "Common questions",
    offices: "Where to find us",
    contact: "Speak to us",
  },

  labels: {
    icanRegistration: "ICAN Reg. No.",
    /** Inland Revenue Department Permanent Account Number. */
    pan: "PAN",
    established: "Established",
    phone: "Phone",
    email: "Email",
    address: "Address",
    followUs: "Follow us",
    legal: "Legal",
    disclaimer: "Disclaimer",
    regulators: "Regulators",
    /** Heads the deliverables panel on the featured service tile. */
    whatIsIncluded: "What's included",
    /** Marks a slot awaiting real art. Rendered only on /design. */
    placeholder: "Placeholder",
  },

  states: {
    loading: "Loading",
    notFound: "We couldn't find that page",
    notFoundBody:
      "The address may have changed, or the page may have been retired. The sections below cover most of what people come here for.",
    error: "Something went wrong",
    errorBody:
      "This page failed to load. It is not something you did — please try again, and contact us if it keeps happening.",
    emptyInsights: "There are no published insights yet.",
  },

  legal: {
    privacy: "Privacy notice",
    terms: "Terms of use",
    disclaimer: "Disclaimer",
    copyright: (year: number, firm: string) => `© ${year} ${firm}. All rights reserved.`,
  },
} as const;
