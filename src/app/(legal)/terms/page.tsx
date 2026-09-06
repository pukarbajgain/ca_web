import { brand } from "@/lib/brand";
import { vocabulary } from "@/lib/vocabulary";

import { LegalReviewNotice } from "../legal-notice";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: vocabulary.legal.terms,
  description: `Terms governing the use of the ${brand.name} website.`,
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <>
      <LegalReviewNotice />
      <h1>{vocabulary.legal.terms}</h1>

      <p>
        These terms govern your use of this website. They do not govern any professional
        engagement with {brand.legalName} — an engagement is governed by its own
        engagement letter, which prevails over anything on this site.
      </p>

      <h2>Using this site</h2>
      <p>
        You may read, print and share the content here for your own reference. You may not
        copy it for republication, use it to train a model for commercial redistribution,
        or present it as your own work, without our permission.
      </p>

      <h2>No client relationship</h2>
      <p>
        Reading this site, or sending us an enquiry through it, does not create a client
        relationship. A relationship begins only when both sides have agreed an engagement
        in writing and we have completed the acceptance checks our profession requires.
      </p>

      <h2>Accuracy and availability</h2>
      <p>
        We take care over what we publish, but tax law, reporting standards and filing
        requirements change. Content is accurate as at its publication or update date and
        is not maintained thereafter unless the page says so. We do not guarantee the site
        will be available without interruption.
      </p>

      <h2>Links to other sites</h2>
      <p>
        We link to regulators and other external sources for convenience. We do not
        control those sites and are not responsible for their content.
      </p>

      <h2>Governing law</h2>
      <p>
        These terms are governed by the laws of {brand.locale.country}, and the courts of{" "}
        {brand.locale.country} have jurisdiction over any dispute arising from them.
      </p>
    </>
  );
}
