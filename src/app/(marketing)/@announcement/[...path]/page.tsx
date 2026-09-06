import { AnnouncementFor } from "@/features/site-messages/components/messages-for-path";
import { pathFromSegments } from "@/features/site-messages/path";

/* The announcement slot for every path below `/`. See `../page.tsx`. */

export default async function AnnouncementSlot({
  params,
}: {
  params: Promise<{ path: string[] }>;
}) {
  const { path } = await params;
  return <AnnouncementFor path={pathFromSegments(path)} />;
}
