"use client";

/**
 * The last resort: an error thrown by the root layout itself.
 *
 * This replaces the entire document, so it must render its own `<html>` and
 * `<body>` — and, critically, it **cannot rely on the stylesheet**, since a
 * failure in the root layout may be exactly what stopped the stylesheet from
 * being applied. Every style here is therefore inline, and there are no
 * imports beyond React. Anything else (a token, a component, a font variable)
 * risks throwing a second time inside the handler for the first throw.
 *
 * Deliberately plain: the goal is a readable sentence and a working link, not a
 * branded experience.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
          background: "#fbfaf8",
          color: "#191c1d",
          fontFamily: "Georgia, 'Times New Roman', serif",
        }}
      >
        <main style={{ maxWidth: "34rem" }}>
          <h1 style={{ fontSize: "1.75rem", margin: 0, lineHeight: 1.2 }}>
            This page could not be displayed
          </h1>
          <p style={{ fontSize: "1rem", lineHeight: 1.6, color: "#3f484a" }}>
            Something went wrong while loading the site. Please try again in a moment.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              minHeight: "2.75rem",
              padding: "0 1.25rem",
              border: 0,
              borderRadius: "0.5rem",
              background: "#0e4a52",
              color: "#ffffff",
              fontSize: "0.875rem",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
          {error.digest ? (
            <p style={{ fontSize: "0.8125rem", color: "#6f797b" }}>
              Reference: {error.digest}
            </p>
          ) : null}
        </main>
      </body>
    </html>
  );
}
