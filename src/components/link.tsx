import NextLink from "next/link";
import type { ComponentProps } from "react";

/**
 * next/link with prefetching off by default. Prefetching every visible link fires a
 * Supabase session check per link (costly on mobile data) and raced with server-action
 * refreshes in testing, leaving forms stuck on "Saving…".
 */
export default function Link({ prefetch = false, ...props }: ComponentProps<typeof NextLink>) {
  return <NextLink prefetch={prefetch} {...props} />;
}
