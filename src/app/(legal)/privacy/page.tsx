import { brand, isPresent, mailHref } from "@/lib/brand";
import { vocabulary } from "@/lib/vocabulary";

import { LegalReviewNotice } from "../legal-notice";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: vocabulary.legal.privacy,
  description: `How ${brand.name} handles personal information collected through this website.`,
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  const mail = mailHref();

  return (
    <>
      <LegalReviewNotice />
      <h1>{vocabulary.legal.privacy}</h1>

      <p>
        This notice explains what personal information this website collects, why, and
        what happens to it. It covers the website only — information you give us in the
        course of an engagement is governed by the engagement letter and by our
        professional obligations of confidentiality.
      </p>

      <h2>What this website collects</h2>
      <p>
        This site does not offer accounts, and there is nothing to log in to. It sets no
        advertising or analytics cookies and does not load third-party trackers. The only
        information reaching us is what you choose to send — for example, the contents of
        an enquiry form — together with the technical request data (IP address, user
        agent, requested page) that any web server records in order to serve a page and to
        detect abuse.
      </p>

      <h2>Why we hold it</h2>
      <ul>
        <li>To respond to an enquiry you have sent us.</li>
        <li>To keep the site available and to investigate misuse or attack.</li>
        <li>To meet a legal or regulatory obligation where one applies.</li>
      </ul>

      <h2>Who else sees it</h2>
      <p>
        Enquiries are read by people in the firm. We do not sell personal information and
        we do not share it for marketing. We use service providers for hosting and email
        delivery, who process data on our instructions only. We disclose information
        outside the firm where the law requires it.
      </p>

      <h2>How long we keep it</h2>
      <p>
        Enquiries are retained for as long as needed to deal with them and for a
        reasonable period afterwards, then deleted. Server logs are retained for a short
        operational period.
      </p>

      <h2>Your choices</h2>
      <p>
        You may ask what we hold about you, ask us to correct it, or ask us to delete it
        where we are not required to retain it. Write to us and we will respond.
      </p>

      <h2>Contact</h2>
      <p>
        {isPresent(brand.contact.email) && mail ? (
          <>
            Questions about this notice: <a href={mail}>{brand.contact.email}</a>.
          </>
        ) : (
          <>
            Contact details for privacy questions will be published here once the
            firm&rsquo;s address for correspondence is confirmed.
          </>
        )}
      </p>
    </>
  );
}
