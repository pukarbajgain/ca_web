import { serializeJsonLd, type JsonLdNode } from "@/lib/seo";

/**
 * Renders a JSON-LD graph.
 *
 * One `<script>` carrying an array beats N scripts carrying one node each:
 * search engines merge them either way, but a single graph lets nodes reference
 * each other by `@id` (`publisher`, `parentOrganization`) instead of repeating
 * the organisation inline on every page.
 *
 * Serialisation goes through `serializeJsonLd`, which escapes `<` — a `</script>`
 * sequence inside any string value would otherwise close the tag early. That is
 * the one real injection vector in structured data, and it is why this is a
 * component rather than a bare `JSON.stringify` at each call site.
 *
 * `nodes` is filtered: builders return `null` when they have nothing honest to
 * say (no offices, no FAQs, a one-item breadcrumb), and a null must not become
 * a `null` entry in the graph.
 */
export function JsonLd({ nodes }: { nodes: readonly (JsonLdNode | null)[] }) {
  const graph = nodes.filter((node): node is JsonLdNode => node !== null);
  if (graph.length === 0) return null;

  return (
    <script
      type="application/ld+json"
      // Safe by construction: the input is built by typed builders in lib/seo.ts
      // and escaped by serializeJsonLd. No user-supplied HTML reaches this.
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(graph) }}
    />
  );
}
