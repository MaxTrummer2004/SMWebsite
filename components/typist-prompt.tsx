"use client";

import { PixelTypist } from "@/components/pixel-typist";
import { useApp } from "@/lib/app";
import { useState, type ReactNode } from "react";

export function TypistPrompt({ scale = 9 }: { scale?: number }): ReactNode {
  const { posts } = useApp();
  const [loading, setLoading] = useState(false);

  const poke = async () => {
    if (loading) return;
    setLoading(true);
    const recent = posts
      .filter((p) => !p.isMascot && p.text)
      .slice(0, 3)
      .map((p) => `"${p.text}"`);
    try {
      await fetch("/api/mascot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "prompted-post",
          choice: recent.length
            ? `Roast these recent posts in 1-2 sentences, be funny and a little mean: ${recent.join(", ")}`
            : "Nobody has posted yet. Make fun of that.",
        }),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={poke}

      className="cursor-pointer transition-opacity hover:opacity-70 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      aria-label="Poke Brixel"
      title="poke Brixel"
    >
      <PixelTypist scale={scale} />
    </button>
  );
}
