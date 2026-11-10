import NextLink from "next/link";
import type { ComponentProps } from "react";

/**
 * App-wide link. Uses Next.js's default prefetching, so a tap shows the next
 * screen's loading state immediately instead of waiting on the network.
 */
export default function Link(props: ComponentProps<typeof NextLink>) {
  return <NextLink {...props} />;
}
