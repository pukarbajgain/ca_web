/**
 * Dismissal and frequency capping — the browser's half of the message engine.
 *
 * **Why the browser owns this at all.** `frequency` records the firm's intent
 * ("show this once a day"), but honouring it needs a per-visitor counter, and a
 * per-visitor counter needs a visitor identity. The public site deliberately has
 * none: no login, no cookie, nothing to correlate. So the backend states the
 * rule and the browser keeps the tally, in storage that is already
 * per-visitor-per-device and that the visitor can clear themselves
 * (ARCHITECTURE.md §H.3).
 *
 * **Two stores, because two of the four frequencies mean different things.**
 * `once_per_session` must come back in a new tab tomorrow, which is exactly what
 * `sessionStorage` already does — reimplementing it with timestamps in
 * `localStorage` would mean inventing a definition of "session" that the browser
 * has already defined better. `once_per_day` and `once_ever` outlive the tab and
 * live in `localStorage`.
 *
 * **`always` is scoped to the page load, and it is the one that is not stored
 * at all.** It means "come back when the page is loaded again" — so a dismissal
 * is held in a module-level set, which a client-side navigation preserves and a
 * reload destroys, because the module is re-evaluated. That is exactly the
 * asked-for behaviour: closing it keeps it closed while you move around the
 * site, and refreshing brings it back. Writing it to `sessionStorage` would
 * survive the reload and writing nothing at all would make it reappear on the
 * next link click, and neither is what "every time the page loads" means.
 *
 * Nothing here is a tracking mechanism: the values are message ids and
 * timestamps, they never leave the device, and no request carries them.
 */

/**
 * Dismissals that last exactly one page load.
 *
 * Module scope is the storage. There is no API for clearing it because the
 * thing that clears it is a page load, which is the semantic.
 */
const dismissedThisPageLoad = new Set<string>();

import type { MessageFrequency } from "./types";

/** One key in each store. Namespaced so it cannot collide with the theme key. */
export const DISMISSAL_STORAGE_KEY = "ram.dismissed-messages";

/** Sentinel for "never show this again". A real timestamp cannot be negative,
 *  so the two cases stay distinguishable without a second field. */
export const FOREVER = -1;

const DAY_MS = 24 * 60 * 60 * 1000;

/** `messageKey` → epoch-ms expiry, or `FOREVER`. */
export type DismissalMap = Record<string, number>;

/**
 * The storage pair, injected rather than reached for.
 *
 * Storage access throws outright in some configurations — Safari's private mode
 * historically, and any browser where the user has blocked site data. A helper
 * that assumed `window.localStorage` would take the whole popup down with it,
 * so callers pass what they have and the tests pass fakes.
 */
export type StoragePair = {
  readonly local: Storage | null;
  readonly session: Storage | null;
};

export function browserStorages(): StoragePair {
  return {
    local: readableStorage(() => window.localStorage),
    session: readableStorage(() => window.sessionStorage),
  };
}

function readableStorage(get: () => Storage): Storage | null {
  try {
    const storage = get();
    // Presence is not enough: the accessor can exist and every call throw.
    storage.getItem(DISMISSAL_STORAGE_KEY);
    return storage;
  } catch {
    return null;
  }
}

function readMap(storage: Storage | null): DismissalMap {
  if (!storage) return {};
  try {
    const raw = storage.getItem(DISMISSAL_STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const map: DismissalMap = {};
    for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof value === "number") map[key] = value;
    }
    return map;
  } catch {
    // Corrupt or foreign data in our key. Treat it as no dismissals rather than
    // throwing: the failure mode of showing a message twice is trivial, and the
    // failure mode of an exception here is a blank chrome slot.
    return {};
  }
}

/** True when an entry is still suppressing its message at `now`. */
export function isActive(entry: number | undefined, now: number): boolean {
  return entry === FOREVER || (typeof entry === "number" && entry > now);
}

export function isDismissed(key: string, now: number, storages: StoragePair): boolean {
  return (
    dismissedThisPageLoad.has(key) ||
    isActive(readMap(storages.session)[key], now) ||
    isActive(readMap(storages.local)[key], now)
  );
}

/**
 * Record a dismissal, in the store the frequency implies.
 *
 * `always` is deliberately the one case that persists nothing: it is held in
 * memory for this page load only (see the module note above), so it survives a
 * client-side navigation and is gone after a refresh.
 */
export function recordDismissal(
  key: string,
  frequency: MessageFrequency,
  now: number,
  storages: StoragePair,
): void {
  if (frequency === "always") {
    dismissedThisPageLoad.add(key);
    return;
  }

  const storage = frequency === "once_per_session" ? storages.session : storages.local;
  if (!storage) return;

  const expiry = frequency === "once_per_day" ? now + DAY_MS : FOREVER;
  const map = readMap(storage);

  // Prune while we are here. Without this the map grows by one entry for every
  // message the firm ever publishes and never shrinks, and it is the visitor's
  // storage quota being spent.
  const next: DismissalMap = { [key]: expiry };
  for (const [existing, value] of Object.entries(map)) {
    if (existing !== key && isActive(value, now)) next[existing] = value;
  }

  try {
    storage.setItem(DISMISSAL_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Quota exceeded, or storage blocked between the read and the write. The
    // message reappearing is the correct degradation; a thrown error here would
    // break the click handler that was dismissing it.
  }
}

/**
 * The pre-paint script that hides already-dismissed messages **before the
 * browser paints them**.
 *
 * Without it, a server-rendered announcement bar is in the HTML for everybody,
 * including the visitor who closed it last week: they would see it flash and
 * then vanish, and the vanish is a layout shift at the very top of the page —
 * the most expensive place on the page to have one. React cannot prevent that,
 * because React runs after hydration, which is after paint.
 *
 * This is the same technique the theme script uses in the root layout, and it
 * is the reason the markup carries `data-site-message` and is hidden with the
 * `hidden` attribute rather than a React state flag: the attribute is something
 * a four-line script can set, and `site.css` forces it to win over the utility
 * classes that would otherwise set `display`.
 *
 * The logic is deliberately the same rule as `isActive` above, and
 * `dismissal.test.ts` executes *this string* against the same fakes as the
 * TypeScript predicate to prove the two cannot drift apart.
 */
export const PREPAINT_DISMISSAL_SCRIPT = `(function(k,n){try{
var maps=[];
try{var a=window.sessionStorage.getItem(k);if(a)maps.push(JSON.parse(a))}catch(e){}
try{var b=window.localStorage.getItem(k);if(b)maps.push(JSON.parse(b))}catch(e){}
if(!maps.length)return;
var els=document.querySelectorAll('[data-site-message]');
for(var i=0;i<els.length;i++){
var id=els[i].getAttribute('data-site-message');
for(var j=0;j<maps.length;j++){
var v=maps[j]&&maps[j][id];
if(v===${FOREVER}||(typeof v==='number'&&v>n)){els[i].setAttribute('hidden','');break}
}
}
}catch(e){}})(${JSON.stringify(DISMISSAL_STORAGE_KEY)},Date.now())`;
