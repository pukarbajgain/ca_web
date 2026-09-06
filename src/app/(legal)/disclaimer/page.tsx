import { brand } from "@/lib/brand";
import { vocabulary } from "@/lib/vocabulary";

import { LegalReviewNotice } from "../legal-notice";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: vocabulary.legal.disclaimer,
  description: `The basis on which information published by ${brand.name} may be used.`,
  alternates: { canonical: "/disclaimer" },
};

export default function DisclaimerPage() {
  return (
    <>
      <LegalReviewNotice />
      <h1>{vocabulary.legal.disclaimer}</h1>

      <p>{brand.disclaimer}</p>

      <h2>Information, not advice</h2>
      <p>
        Articles, guidance notes and summaries on this site describe the position in
        general terms. They cannot account for the facts of your entity, its history, or
        the specific transaction in front of you — and in tax and reporting those details
        routinely change the answer. Do not act on anything here without taking advice on
        your own circumstances.
      </p>

      <h2>Dates matter</h2>
      <p>
        Each article shows when it was published and when it was last updated. Nepali tax
        rates, thresholds, filing formats and reporting standards change from year to
        year; an article that was correct when written may not describe the current
        position. Where we retire guidance, we mark it rather than delete it, so a reader
        who arrives from an old link can see that it has been superseded.
      </p>

      <h2>Regulatory position</h2>
      <p>
        {brand.legalName} is a chartered accountancy practice subject to the Institute of
        Chartered Accountants of Nepal and its code of ethics. Nothing on this site is
        intended as solicitation or as a comparative claim about other practices.
      </p>

      <h2>External sources</h2>
      <p>
        Where we link to a regulator or quote a statutory source, the source itself
        governs. We do not warrant that a linked page is current.
      </p>
    </>
  );
}
