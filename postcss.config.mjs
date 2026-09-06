/**
 * Tailwind v4 is CSS-first: the entire theme lives in `src/app/globals.css`
 * behind `@theme inline`. There is deliberately no `tailwind.config.js`
 * (CLAUDE.md §4) — adding one would split the design system across two files.
 */
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
