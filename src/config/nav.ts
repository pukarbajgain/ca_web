import { routes } from "@/lib/routes";
import { vocabulary } from "@/lib/vocabulary";

/**
 * Navigation, in one file with a test (CLAUDE.md §5.1).
 *
 * Only routes that exist are listed. ARCHITECTURE.md rejects the reference
 * admin's "flat 14-item nav with disabled 'Soon' items" — an unbuilt route in
 * the nav is a promise the site cannot keep, and on a professional-services
 * site a dead link is a credibility cost, not a cosmetic one.
 *
 * Labels come from `vocabulary.ts` and paths from `routes.ts`, so this file
 * hardcodes neither.
 */

export type NavItem = {
  readonly label: string;
  readonly href: string;
};

export const primaryNav: readonly NavItem[] = [
  { label: vocabulary.nav.about, href: routes.about() },
  { label: vocabulary.nav.services, href: routes.services() },
  { label: vocabulary.nav.team, href: routes.team() },
  { label: vocabulary.nav.insights, href: routes.insights() },
  { label: vocabulary.nav.contact, href: routes.contact() },
];

export const legalNav: readonly NavItem[] = [
  { label: vocabulary.legal.privacy, href: routes.privacy() },
  { label: vocabulary.legal.terms, href: routes.terms() },
  { label: vocabulary.legal.disclaimer, href: routes.disclaimer() },
];

/**
 * Active-state test. Exact match for the homepage (every path starts with "/"),
 * prefix match elsewhere so `/insights/some-article` still highlights Insights.
 */
export function isActivePath(pathname: string, href: string): boolean {
  if (href === routes.home()) return pathname === routes.home();
  return pathname === href || pathname.startsWith(`${href}/`);
}
