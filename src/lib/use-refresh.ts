"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { ActionState } from "@/lib/types";

/**
 * Server actions return only their result; the page is then refreshed separately.
 * (Revalidating inside the action intermittently left forms stuck on "Saving…".)
 */
export function useRefreshOnSuccess(state: ActionState, onSuccess?: () => void) {
  const router = useRouter();
  useEffect(() => {
    if (state?.ok) {
      onSuccess?.();
      router.refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);
}
