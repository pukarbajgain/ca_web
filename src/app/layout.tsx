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
  icons: {
    icon: [{ url: "/brand/monogram.svg", type: "image/svg+xml" }],
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
      className={`${serif.variable} ${sans.variable} ${mono.variable}`}
      /* next-themes writes `data-theme` and `color-scheme` onto this element
       * from an inline script that runs before React hydrates — deliberately,
       * so the page never flashes the wrong scheme. That is an attribute
       * mismatch by construction, and this suppresses the warning for this one
       * element only. It does not suppress anything for descendants. */
      suppressHydrationWarning
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
