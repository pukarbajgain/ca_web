"use client";

import { useEffect } from "react";

import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { vocabulary } from "@/lib/vocabulary";

/**
 * Route-level error boundary.
 *
 * Both reference frontends ship without one, and ARCHITECTURE.md lists that as
 * a pattern explicitly not borrowed: an uncaught render error white-screens the
 * whole app. This catches it inside the layout, so the header, footer and
 * navigation survive and the visitor can go somewhere else.
 *
 * `digest` is Next's server-side error id. It is shown because it is the only
 * thing that connects "the page broke for me at 14:32" to a line in the server
 * log; the message itself is never shown, since a raw stack on a professional
 * firm's website is both alarming and an information leak.
 */
export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Client-side visibility until a real error reporter is wired up. Kept to
    // `console.error`, which the lint config permits precisely for this.
    console.error("[route-error]", error.digest ?? "", error.message);
  }, [error]);

  return (
    <Container className="py-16 md:py-24">
      <h1 className="font-[family-name:var(--font-display)] text-display-small">
        {vocabulary.states.error}
      </h1>
      <p className="mt-4 max-w-[60ch] text-body-large text-on-surface-variant">
        {vocabulary.states.errorBody}
      </p>
      <div className="mt-8 flex flex-wrap items-center gap-4">
        <Button onClick={reset}>{vocabulary.actions.tryAgain}</Button>
        {error.digest ? (
          <p className="font-[family-name:var(--font-mono)] text-body-small text-on-surface-variant">
            Reference: {error.digest}
          </p>
        ) : null}
      </div>
    </Container>
  );
}
