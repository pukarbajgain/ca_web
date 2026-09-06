import { beforeEach, describe, expect, it } from "vitest";

import {
  DISMISSAL_STORAGE_KEY,
  FOREVER,
  PREPAINT_DISMISSAL_SCRIPT,
  browserStorages,
  isDismissed,
  recordDismissal,
} from "./dismissal";

import type { MessageFrequency } from "./types";

const NOW = Date.UTC(2026, 8, 6, 9, 0, 0);
const DAY = 24 * 60 * 60 * 1000;

/**
 * A `Storage` of our own, installed onto `window`.
 *
 * jsdom's storage is not reachable here — Node's own experimental
 * `localStorage` global shadows it, and arrives as an empty object with no
 * `getItem`. Rather than depend on which of the two wins in a given runtime,
 * the tests install a real implementation and exercise the production code
 * against it. Both the TypeScript predicate and the pre-paint script read
 * `window.localStorage`, so both see this one.
 */
function fakeStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    key: (index: number) => [...map.keys()][index] ?? null,
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => void map.set(key, String(value)),
    removeItem: (key: string) => void map.delete(key),
    clear: () => map.clear(),
  };
}

function install(name: "localStorage" | "sessionStorage"): Storage {
  const storage = fakeStorage();
  Object.defineProperty(window, name, {
    value: storage,
    configurable: true,
    writable: true,
  });
  return storage;
}

function storages() {
  return browserStorages();
}

beforeEach(() => {
  install("localStorage");
  install("sessionStorage");
  document.body.innerHTML = "";
});

describe("recordDismissal", () => {
  it("does not persist anything for `always` — the message is meant to return", () => {
    recordDismissal("a", "always", NOW, storages());

    expect(window.localStorage.getItem(DISMISSAL_STORAGE_KEY)).toBeNull();
    expect(window.sessionStorage.getItem(DISMISSAL_STORAGE_KEY)).toBeNull();
    expect(isDismissed("a", NOW, storages())).toBe(false);
  });

  it("puts `once_per_session` in sessionStorage, so a new tab sees it again", () => {
    recordDismissal("a", "once_per_session", NOW, storages());

    expect(window.sessionStorage.getItem(DISMISSAL_STORAGE_KEY)).not.toBeNull();
    expect(window.localStorage.getItem(DISMISSAL_STORAGE_KEY)).toBeNull();
    expect(isDismissed("a", NOW, storages())).toBe(true);
  });

  it("expires `once_per_day` exactly a day later, not at midnight", () => {
    recordDismissal("a", "once_per_day", NOW, storages());

    expect(isDismissed("a", NOW + DAY - 1000, storages())).toBe(true);
    expect(isDismissed("a", NOW + DAY + 1000, storages())).toBe(false);
  });

  it("never expires `once_ever`", () => {
    recordDismissal("a", "once_ever", NOW, storages());

    expect(isDismissed("a", NOW + 50 * 365 * DAY, storages())).toBe(true);
  });

  it("prunes lapsed entries on write rather than growing forever", () => {
    recordDismissal("old", "once_per_day", NOW, storages());
    recordDismissal("new", "once_per_day", NOW + 2 * DAY, storages());

    const stored = JSON.parse(
      window.localStorage.getItem(DISMISSAL_STORAGE_KEY) ?? "{}",
    ) as Record<string, number>;
    expect(Object.keys(stored)).toEqual(["new"]);
  });

  it("keeps entries that are still active alongside the new one", () => {
    recordDismissal("kept", "once_ever", NOW, storages());
    recordDismissal("added", "once_per_day", NOW, storages());

    expect(isDismissed("kept", NOW, storages())).toBe(true);
    expect(isDismissed("added", NOW, storages())).toBe(true);
  });
});

describe("isDismissed", () => {
  it("is false for a message nobody has dismissed", () => {
    expect(isDismissed("unknown", NOW, storages())).toBe(false);
  });

  it("survives corrupt data in our key rather than throwing", () => {
    window.localStorage.setItem(DISMISSAL_STORAGE_KEY, "{not json");

    expect(() => isDismissed("a", NOW, storages())).not.toThrow();
    expect(isDismissed("a", NOW, storages())).toBe(false);
  });

  it("ignores non-numeric values written by something else", () => {
    window.localStorage.setItem(DISMISSAL_STORAGE_KEY, JSON.stringify({ a: "yes" }));

    expect(isDismissed("a", NOW, storages())).toBe(false);
  });

  it("works with no storage at all, as in a browser that blocks site data", () => {
    expect(isDismissed("a", NOW, { local: null, session: null })).toBe(false);
    expect(() =>
      recordDismissal("a", "once_ever", NOW, { local: null, session: null }),
    ).not.toThrow();
  });
});

/**
 * The parity suite.
 *
 * The pre-paint script is a second implementation of `isDismissed`, hand-written
 * in ES5 because it runs before any bundle. Two implementations of one rule
 * drift — unless something executes both against the same state and demands the
 * same answer, which is what this does. A change to either one that the other
 * does not follow fails here rather than in production, where the symptom would
 * be a banner reappearing for people who closed it.
 */
describe("PREPAINT_DISMISSAL_SCRIPT agrees with isDismissed", () => {
  function runScript(): void {
    // `new Function` rather than `eval` so the script gets its own scope and
    // cannot see this file's bindings — the same isolation it has in a <script>.
    new Function(PREPAINT_DISMISSAL_SCRIPT)();
  }

  function render(keys: readonly string[]): void {
    document.body.innerHTML = keys
      .map((key) => `<div data-site-message="${key}">x</div>`)
      .join("");
  }

  function hiddenKeys(): string[] {
    return [...document.querySelectorAll("[data-site-message]")]
      .filter((element) => element.hasAttribute("hidden"))
      .map((element) => element.getAttribute("data-site-message") ?? "");
  }

  const cases: { frequency: MessageFrequency; expectHidden: boolean }[] = [
    { frequency: "always", expectHidden: false },
    { frequency: "once_per_session", expectHidden: true },
    { frequency: "once_per_day", expectHidden: true },
    { frequency: "once_ever", expectHidden: true },
  ];

  for (const { frequency, expectHidden } of cases) {
    it(`matches for ${frequency}`, () => {
      recordDismissal("target", frequency, Date.now(), storages());
      render(["target", "other"]);

      runScript();

      expect(hiddenKeys()).toEqual(expectHidden ? ["target"] : []);
      expect(isDismissed("target", Date.now(), storages())).toBe(expectHidden);
    });
  }

  it("leaves a lapsed once_per_day entry visible, as isDismissed does", () => {
    // Written as if dismissed two days ago: still in storage, no longer active.
    window.localStorage.setItem(
      DISMISSAL_STORAGE_KEY,
      JSON.stringify({ target: Date.now() - DAY }),
    );
    render(["target"]);

    runScript();

    expect(hiddenKeys()).toEqual([]);
    expect(isDismissed("target", Date.now(), storages())).toBe(false);
  });

  it("hides a FOREVER entry found in sessionStorage as well as localStorage", () => {
    window.sessionStorage.setItem(
      DISMISSAL_STORAGE_KEY,
      JSON.stringify({ target: FOREVER }),
    );
    render(["target"]);

    runScript();

    expect(hiddenKeys()).toEqual(["target"]);
  });

  it("does nothing, and throws nothing, when there are no dismissals", () => {
    render(["a", "b"]);

    expect(() => runScript()).not.toThrow();
    expect(hiddenKeys()).toEqual([]);
  });
});
