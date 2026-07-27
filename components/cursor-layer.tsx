"use client";

import { useReducedMotion } from "@/lib/motion";
import { useTheme } from "next-themes";
import dynamic from "next/dynamic";
import { useSyncExternalStore, type ReactNode } from "react";

const DitherCursor = dynamic(() => import("@/components/dither-cursor"), {
  ssr: false,
});

function useIsMounted(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

/**
 * Full-screen pixelated dither trail that follows the cursor.
 * Sits behind all content (pointer-events-none) and is disabled for
 * reduced-motion users and coarse (touch) pointers.
 */
export function CursorLayer(): ReactNode {
  const mounted = useIsMounted();
  const reduced = useReducedMotion();
  const { resolvedTheme } = useTheme();

  if (!mounted || reduced) return null;
  if (
    typeof window !== "undefined" &&
    window.matchMedia("(pointer: coarse)").matches
  ) {
    return null;
  }

  const color = resolvedTheme === "dark" ? "#fb923c" : "#ea580c";

  return (
    <div
      aria-hidden="true"
      className="cursor-fx-layer pointer-events-none fixed inset-0 z-30 opacity-40"
    >
      <DitherCursor
        color={color}
        intensity={0.32}
        radius={0.05}
        decay={0.12}
        ditherSize={2.5}
      />
    </div>
  );
}
