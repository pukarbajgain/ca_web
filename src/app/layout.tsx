import { JetBrains_Mono, Public_Sans, Source_Serif_4 } from "next/font/google";

import { JsonLd } from "@/components/seo/json-ld";
import { brand } from "@/lib/brand";
import { env } from "@/lib/env";
import { organizationJsonLd, officesJsonLd, websiteJsonLd } from "@/lib/seo";
import { vocabulary } from "@/lib/vocabulary";

import type { Metadata, Viewport } from "next";

import "./globals.css";
import "./site.css";

/**
 * Root layout.
 *
 * ── Fonts ───────────────────────────────────────────────────────────────────
 * The three CSS variable names below are a contract with `globals.css`, which
 * reads `--font-serif`, `--font-sans` and `--font-mono-src` in its `@theme
 * inline` block. Renaming one here silently drops the whole site back to system
 * fonts, so they are not arbitrary.
 *
 * `next/font/google` self-hosts the files at build time. That is a privacy and a
 * security property, not just a performance one: no request reaches Google from
 * a visitor's browser, and the CSP can stay `font-src 'self'` with no external
 * origin allow-listed.
 *
 * Weights are enumerated rather than left variable-wide because each extra
 * weight is a real download; these are the ones the type scale actually uses.
 */
const serif = Source_Serif_4({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

const sans = Public_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const mono = JetBrains_Mono({
  variable: "--font-mono-src",
  subsets: ["latin"],
  weight: ["400", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  /** Every relative URL in metadata resolves against this. Without it, OG and
   *  canonical URLs ship as paths and social scrapers reject them. */
  metadataBase: new URL(env.NEXT_PUBLIC_SITE_URL),
  title: {
    default: `${brand.name} — ${brand.tagline}`,
    template: `%s — ${brand.name}`,
  },
  description: brand.description,
  applicationName: brand.name,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_NP",
    siteName: brand.name,
    title: `${brand.name} — ${brand.tagline}`,
    description: brand.description,
    url: "/",
  },
  twitter: { card: "summary_large_image" },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  // `format-detection` off: iOS otherwise turns every number in an article —
  // section references, amounts, fiscal years — into a blue phone link.
  formatDetection: { telephone: false, address: false, email: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  /** Required for `env(safe-area-inset-bottom)` to resolve to anything but 0,
   *  which the mobile action bar depends on (§D.3 rule 7). */
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang={brand.locale.language}
      /**
       * `data-theme="light"` is stamped statically, and it is the whole of this
       * site's dark-mode removal.
       *
       * `globals.css` is the shared design system and must stay byte-identical
       * to `admin`'s copy, so its dark blocks cannot be deleted — but they are
       * written to be escapable: the media query is guarded
       * `:root:not([data-theme="light"])`, and the explicit dark palette keys on
       * `[data-theme="dark"]`. Declaring light here makes the first selector
       * fail and the second never match, so a visitor whose system is set to
       * dark still gets the firm's light palette, with no override CSS and no
       * flash. `color-scheme` tells the browser to match its own form controls
       * and scrollbars to it.
       */
      data-theme="light"
      /**
       * Declares the `scroll-behavior: smooth` that `globals.css` sets on
       * `html`. Next cannot read a stylesheet, so without this attribute it
       * assumes scrolling is instant and restores scroll position on a route
       * change before the smooth scroll has finished — the new page lands
       * mid-animation at the wrong offset. Told about it, Next suppresses the
       * behaviour for the duration of the transition and restores it after.
       *
       * It lives here rather than in `globals.css` because that file is the
       * shared design system and must stay byte-identical to `admin`'s copy
       * (repo CLAUDE.md §1.10). `admin` carries the same attribute for the
       * same reason.
       */
      data-scroll-behavior="smooth"
      style={{ colorScheme: "light" }}
      className={`${serif.variable} ${sans.variable} ${mono.variable}`}
    >
      <body className="min-h-dvh">
        {/* Bypass block (WCAG 2.4.1). First tab stop, visible only on focus. */}
        <a
          href="#main"
          className="sr-only rounded-md bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50"
        >
          {vocabulary.nav.skipToContent}
        </a>

        {/* One graph for the whole site. Page-level nodes (FAQ, breadcrumbs)
            are added by the pages that own them. Offices contribute nothing
            while `brand.offices` is empty — the site makes no location claim
            to a crawler that it does not make to a reader. */}
        <JsonLd nodes={[organizationJsonLd(), websiteJsonLd(), ...officesJsonLd()]} />

        {children}
      </body>
    </html>
  );
}
