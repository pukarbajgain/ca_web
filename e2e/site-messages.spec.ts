import { expect, test } from "@playwright/test";

/**
 * The dismissal contract for CMS site messages.
 *
 * **Data-dependent, and honest about it.** These assertions need a published,
 * dismissible message to exist; on an empty database there is nothing to close.
 * Rather than seed the CMS from a browser test — which would make the gate a
 * writer as well as a reader — each test skips when the site is carrying no
 * dismissible message, and states that it did. A skipped test that says why is
 * better than a passing test that asserted nothing.
 *
 * What they protect is the failure this feature actually shipped with:
 *
 *  1. A dismissed message must not reappear on the **next document load**. That
 *     is the pre-paint script's job, and it must have run *before* the browser
 *     painted — checked at `domcontentloaded`, not after hydration, because
 *     hiding it later is a layout shift at the very top of the page.
 *  2. A dismissed message must not reappear on a **client-side navigation**.
 *     This one was a real bug: React swaps in fresh markup from the RSC payload
 *     with no `hidden` attribute, and an inline script arriving that way does
 *     not run again — so closing the bar and clicking a nav link brought it
 *     straight back, and the close button looked broken.
 */

const DISMISSIBLE = "[data-site-message]:has(button[aria-label^='Dismiss'])";

test.describe("site message dismissal", () => {
  test("stays closed across a reload, without painting first", async ({ page }) => {
    await page.goto("/");
    const target = page.locator(DISMISSIBLE).first();
    if ((await page.locator(DISMISSIBLE).count()) === 0) {
      test.skip(true, "No dismissible site message is published.");
    }

    const key = await target.getAttribute("data-site-message");
    await target.getByRole("button", { name: /^Dismiss/ }).click();
    await expect(target).toBeHidden();

    await page.reload({ waitUntil: "domcontentloaded" });
    const hiddenAtDomReady = await page.evaluate(
      (k) =>
        document.querySelector(`[data-site-message="${k}"]`)?.hasAttribute("hidden") ??
        null,
      key,
    );
    expect(hiddenAtDomReady, "the pre-paint script did not hide it before paint").toBe(
      true,
    );

    // And React must not strip the attribute back off while hydrating.
    await page.waitForLoadState("load");
    await expect(page.locator(`[data-site-message="${key}"]`)).toBeHidden();
  });

  test("stays closed after a client-side navigation", async ({ page }) => {
    await page.goto("/");
    if ((await page.locator(DISMISSIBLE).count()) === 0) {
      test.skip(true, "No dismissible site message is published.");
    }

    const target = page.locator(DISMISSIBLE).first();
    const key = await target.getAttribute("data-site-message");
    await target.getByRole("button", { name: /^Dismiss/ }).click();
    await expect(target).toBeHidden();

    // A modal popup, if one is live, makes the page inert — correctly. Close it
    // so the navigation under test is the thing being measured.
    await page.evaluate(() =>
      (document.querySelector("dialog[open]") as HTMLDialogElement)?.close(),
    );

    /* Below `lg` the primary navigation is a drawer, so the link has to be
       reached the way a visitor on a phone reaches it. Opening the drawer is
       part of the journey being tested, not a workaround for it. */
    const insights = page.getByRole("link", { name: "Insights", exact: true }).first();
    if (!(await insights.isVisible())) {
      await page.getByRole("button", { name: /menu/i }).first().click();
    }
    await page.getByRole("link", { name: "Insights", exact: true }).last().click();
    await page.waitForURL("**/insights");

    await expect(page.locator(`[data-site-message="${key}"]`)).toBeHidden();
  });
});
