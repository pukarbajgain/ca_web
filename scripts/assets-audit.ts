/**
 * `pnpm assets:audit` — the handover checklist (ARCHITECTURE.md §J.4.4).
 *
 * Lists every image slot still holding generated art *and* every field in
 * `brand.ts` still waiting on the firm. Both belong in one report because they
 * are the same task from the firm's point of view: "what do we still owe this
 * website before it can go live?"
 *
 * Exits non-zero when anything is unreplaced, so it can become a release gate
 * later without being rewritten. It is deliberately NOT in the CI chain today —
 * everything is a placeholder by design at this stage, and a gate that always
 * fails is a gate people learn to ignore.
 */
import { assets, unreplacedAssets } from "../src/lib/assets";
import { brand, isPresent } from "../src/lib/brand";
import { imageSlots } from "../src/lib/image-slots";

type Row = { item: string; detail: string };

function imageRows(): Row[] {
  return unreplacedAssets().map(({ key, asset }) => {
    const slot = imageSlots[asset.slot];
    const size = slot.vector ? "SVG" : `${slot.intrinsic.width}×${slot.intrinsic.height}`;
    return {
      item: `assets.${key}`,
      detail: `${slot.name} · ${slot.ratio[0]}:${slot.ratio[1]} · ${size} · ${slot.description}`,
    };
  });
}

/**
 * Verifiable facts that ship as `null` (CLAUDE.md §3.5). Their absence is
 * correct today — the site renders nothing rather than a fabricated claim — but
 * each one is a section of the page that is currently silent, so they belong on
 * the same checklist as the artwork.
 */
function identityRows(): Row[] {
  const rows: Row[] = [];

  if (brand.isPlaceholderIdentity) {
    rows.push({
      item: "brand (identity)",
      detail: `Firm name is settled ("${brand.name}"); the verifiable identity fields below are not. Clear this flag once they are.`,
    });
  }
  if (!isPresent(brand.icanRegistrationNumber)) {
    rows.push({
      item: "brand.icanRegistrationNumber",
      detail:
        "Utility bar, hero credential line, footer and Organization JSON-LD all omit it.",
    });
  }
  if (!isPresent(brand.panNumber)) {
    rows.push({
      item: "brand.panNumber",
      detail:
        "Footer omits the IRD PAN. In Nepal the ICAN registration number and PAN are published as a pair.",
    });
  }
  if (!isPresent(brand.establishedYear)) {
    rows.push({
      item: "brand.establishedYear",
      detail: "Credential marquee omits 'Est. ____'; JSON-LD omits foundingDate.",
    });
  }
  if (!isPresent(brand.contact.phone)) {
    rows.push({
      item: "brand.contact.phone",
      detail:
        "Mobile action bar drops the Call action; utility bar and footer omit the number.",
    });
  }
  if (!isPresent(brand.contact.whatsapp)) {
    rows.push({
      item: "brand.contact.whatsapp",
      detail: "Mobile action bar drops the WhatsApp action.",
    });
  }
  if (!isPresent(brand.contact.email)) {
    rows.push({
      item: "brand.contact.email",
      detail: "Footer, drawer and privacy notice omit it.",
    });
  }
  if (brand.offices.length === 0) {
    rows.push({
      item: "brand.offices",
      detail:
        "Offices section renders nothing; no LocalBusiness JSON-LD node is emitted.",
    });
  }
  if (brand.people.length === 0) {
    rows.push({
      item: "brand.people",
      detail:
        "People rail renders nothing — the strongest trust element on the page (§D.6 row 10).",
    });
  }
  if (brand.stats.length === 0) {
    rows.push({
      item: "brand.stats",
      detail:
        "Stats band renders nothing. Every figure needs a stated source before it ships.",
    });
  }
  if (!brand.socials.some((social) => isPresent(social.href))) {
    rows.push({
      item: "brand.socials",
      detail: "Footer 'Follow us' block renders nothing.",
    });
  }

  return rows;
}

function print(title: string, rows: Row[]): void {
  console.warn(`\n${title} (${rows.length})`);
  console.warn("-".repeat(title.length + 6));
  if (rows.length === 0) {
    console.warn("  nothing outstanding");
    return;
  }
  const width = Math.max(...rows.map((row) => row.item.length));
  for (const row of rows) {
    console.warn(`  ${row.item.padEnd(width)}  ${row.detail}`);
  }
}

const images = imageRows();
const identity = identityRows();
const total = Object.keys(assets).length;

console.warn("CA Platform — web · asset & identity audit");
print("Image slots still on generated art", images);
print("Firm identity still awaiting confirmation", identity);
console.warn(
  `\n${images.length}/${total} image slots unreplaced · ${identity.length} identity fields outstanding.\n`,
);

process.exitCode = images.length + identity.length > 0 ? 1 : 0;
