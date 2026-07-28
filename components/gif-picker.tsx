"use client";

import { PixelIcon } from "@/components/pixel-icon";
import { GIPHY_KEY_MISSING, searchGifs } from "@/lib/giphy";
import type { Gif } from "@/lib/types";
import { useEffect, useRef, useState, type ReactNode } from "react";

export function GifPicker({
  onSelect,
  onClose,
}: {
  onSelect: (gif: Gif) => void;
  onClose: () => void;
}): ReactNode {
  const [query, setQuery] = useState("");
  const [gifs, setGifs] = useState<Gif[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [url, setUrl] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const addFromUrl = (): void => {
    const clean = url.trim();
    if (!/^https?:\/\/.+/i.test(clean)) return;
    onSelect({ url: clean, width: 480, height: 270, title: "gif" });
  };

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const t = setTimeout(() => {
      setLoading(true);
      setError(null);
      searchGifs(query, controller.signal)
        .then((results) => {
          setGifs(results);
          setLoading(false);
        })
        .catch((err: unknown) => {
          const e = err as Error;
          if (e.name === "AbortError") return;
          setError(
            e.message === GIPHY_KEY_MISSING
              ? "GIF search needs a free Giphy API key (NEXT_PUBLIC_GIPHY_KEY). For now, paste a GIF link below."
              : "Couldn't reach Giphy. Paste a GIF link below instead."
          );
          setLoading(false);
        });
    }, 350);
    return () => {
      controller.abort();
      clearTimeout(t);
    };
  }, [query]);

  return (
    <div className="pixel-clip border border-border bg-background p-3">
      <div className="flex items-center gap-2 border border-border bg-muted px-3 py-2">
        <PixelIcon name="sparkle" className="h-3.5 w-3.5 text-accent" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search GIFs on Giphy…"
          className="w-full bg-transparent font-mono text-sm outline-none placeholder:text-muted-foreground"
          aria-label="Search GIFs"
        />
        <button
          type="button"
          onClick={onClose}
          className="focus-ring font-mono text-xs text-muted-foreground hover:text-foreground"
          aria-label="Close GIF picker"
        >
          ✕
        </button>
      </div>

      <div className="mt-3 h-80 overflow-y-auto overscroll-contain scroll-smooth pt-1 pb-1">
        {error ? (
          <p className="p-4 text-center font-mono text-xs text-muted-foreground">
            {error}
          </p>
        ) : loading ? (
          <div className="grid grid-cols-3 gap-2 px-0.5">
            {Array.from({ length: 9 }).map((_, i) => (
              <div
                key={i}
                className="aspect-video animate-pulse bg-muted"
                aria-hidden="true"
              />
            ))}
          </div>
        ) : gifs.length === 0 ? (
          <p className="p-4 text-center font-mono text-xs text-muted-foreground">
            No GIFs found. Try another word.
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-2 px-0.5">
            {gifs.map((gif) => (
              <button
                key={gif.url}
                type="button"
                onClick={() => onSelect(gif)}
                className="focus-ring group relative aspect-video overflow-hidden border border-border transition-transform hover:-translate-y-0.5 hover:border-accent"
                aria-label={`Pick GIF: ${gif.title}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={gif.url}
                  alt={gif.title}
                  loading="lazy"
                  className="h-full w-full object-cover"
                  style={{ imageRendering: "auto" }}
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Paste-a-link fallback — always works, no API key needed */}
      <div className="mt-3 border-t border-border pt-3">
        <label
          htmlFor="gif-url"
          className="mb-1.5 block font-mono text-[11px] text-muted-foreground"
        >
          …or paste a GIF link
        </label>
        <div className="flex gap-2">
          <input
            id="gif-url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addFromUrl()}
            placeholder="https://media.giphy.com/…/giphy.gif"
            className="focus-ring min-w-0 flex-1 border border-border bg-muted px-2 py-1.5 font-mono text-xs outline-none placeholder:text-muted-foreground"
          />
          <button
            type="button"
            onClick={addFromUrl}
            className="focus-ring border border-border px-3 py-1.5 font-mono text-xs transition-colors hover:border-accent hover:text-accent"
          >
            Use
          </button>
        </div>
        <p className="mt-2 text-right font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          search powered by giphy
        </p>
      </div>
    </div>
  );
}
