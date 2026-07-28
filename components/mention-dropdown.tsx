"use client";

import { AnimatePresence, motion } from "motion/react";
import type { ReactNode } from "react";

export function MentionDropdown({
  suggestions,
  onSelect,
}: {
  suggestions: string[];
  onSelect: (handle: string) => void;
}): ReactNode {
  if (suggestions.length === 0) return null;
  return (
    <AnimatePresence>
      <motion.ul
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 4 }}
        transition={{ duration: 0.12 }}
        className="absolute left-0 top-full z-10 mt-1 w-48 border border-border bg-background shadow-lg"
        role="listbox"
        aria-label="Mention suggestions"
      >
        {suggestions.slice(0, 6).map((handle, i) => (
          <li key={handle}>
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); onSelect(handle); }}
              className="w-full px-3 py-2 text-left font-mono text-sm hover:bg-muted"
              style={{ color: "var(--accent-2)" }}
            >
              {i === 0 ? <><span className="opacity-40 text-xs mr-1">Tab↹</span>{handle}</> : handle}
            </button>
          </li>
        ))}
      </motion.ul>
    </AnimatePresence>
  );
}
