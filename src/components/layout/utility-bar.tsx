import { brand, isPresent, mailHref, telHref } from "@/lib/brand";
import { vocabulary } from "@/lib/vocabulary";

import { Container } from "./container";

/**
 * The thin bar above the header (§D.6 row 1): ICAN registration number, phone,
 * email.
 *
 * A registration number above the fold is the fastest credibility signal a CA
 * firm has — which is precisely why an invented one is unacceptable. Every item
 * here is conditional, and **the whole bar disappears when the firm has
 * published none of them**. An empty 32px strip is worse than no strip.
 *
 * Hidden below `md`: on a phone this content competes with the logo for a
 * scarce first screen, and the same three facts are one tap away in the drawer
 * and permanently available in the action bar.
 */
export function UtilityBar() {
  const tel = telHref();
  const mail = mailHref();
  const hasRegistration = isPresent(brand.icanRegistrationNumber);

  if (!hasRegistration && !tel && !mail) return null;

  return (
    <div className="hidden border-b border-outline-variant bg-surface-container-low md:block">
      <Container className="flex h-9 items-center justify-between gap-6 text-body-small text-on-surface-variant">
        {hasRegistration ? (
          <p className="tabular">
            <span className="text-on-surface-variant/80">
              {vocabulary.labels.icanRegistration}{" "}
            </span>
            <span className="text-on-surface">{brand.icanRegistrationNumber}</span>
          </p>
        ) : (
          <span />
        )}

        <ul className="flex items-center gap-6">
          {tel ? (
            <li>
              <a href={tel} className="hover:text-primary">
                {brand.contact.phone}
              </a>
            </li>
          ) : null}
          {mail ? (
            <li>
              <a href={mail} className="hover:text-primary">
                {brand.contact.email}
              </a>
            </li>
          ) : null}
        </ul>
      </Container>
    </div>
  );
}
