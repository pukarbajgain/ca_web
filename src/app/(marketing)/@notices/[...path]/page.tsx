import { NoticesFor } from "@/features/site-messages/components/messages-for-path";
import { pathFromSegments } from "@/features/site-messages/path";

/* The in-page slot for every path below `/`. See `../page.tsx`. */

export default async function NoticesSlot({
  params,
}: {
  params: Promise<{ path: string[] }>;
}) {
  const { path } = await params;
  return <NoticesFor path={pathFromSegments(path)} />;
}
