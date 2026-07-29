"use client";

import CursorWave from "@/components/cursor-wave";
import { GifPicker } from "@/components/gif-picker";
import { PixelButton } from "@/components/pixel-button";
import { PixelIcon } from "@/components/pixel-icon";
import { MentionDropdown } from "@/components/mention-dropdown";
import { useApp } from "@/lib/app";
import { useReducedMotion } from "@/lib/motion";
import { useMentionAutocomplete } from "@/lib/use-mention-autocomplete";
import type { Gif } from "@/lib/types";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useState, type ReactNode } from "react";

export function ComposerModal(): ReactNode {
  const { composerOpen, closeComposer, account, publish, posts } = useApp();
  const reduced = useReducedMotion();

  const [text, setText] = useState("");
  const [gif, setGif] = useState<Gif | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  const knownHandles = useMemo(() => {
    const set = new Set<string>(["@brixel"]);
    for (const p of posts) if (p.handle && p.handle !== account?.handle) set.add(p.handle);
    return Array.from(set).sort();
  }, [posts, account?.handle]);

  const mention = useMentionAutocomplete(knownHandles);

  useEffect(() => {
    if (composerOpen) {
      setText("");
      setGif(null);
      setPickerOpen(false);
      mention.dismiss();
    }
  }, [composerOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!composerOpen || !account) return null;

  const canPost = text.trim().length > 0 || gif !== null;

  const submit = (): void => {
    if (!canPost) return;
    publish({ text, gif });
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[60] flex items-end sm:items-start justify-center overflow-y-auto p-0 sm:p-4 sm:py-10"
        initial={reduced ? undefined : { opacity: 0 }}
        animate={reduced ? undefined : { opacity: 1 }}
        exit={reduced ? undefined : { opacity: 0 }}
      >
        <button
          type="button"
          aria-label="Close"
          onClick={closeComposer}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm"
        />

        <motion.section
          role="dialog"
          aria-modal="true"
          aria-label="Write a post"
          initial={reduced ? undefined : { opacity: 0, y: 16, scale: 0.98 }}
          animate={reduced ? undefined : { opacity: 1, y: 0, scale: 1 }}
          exit={reduced ? undefined : { opacity: 0, y: 16, scale: 0.98 }}
          className="pixel-clip pixel-shadow-accent relative w-full max-w-xl border-2 border-t-2 border-foreground bg-background sm:mb-0 rounded-t-none"
        >
          {/* React Bits: cursor + click reactive banner */}
          <div className="relative h-14 sm:h-24 border-b-2 border-foreground">
            <CursorWave
              className="absolute inset-0 h-full w-full"
              width="100%"
              height="100%"
              backgroundColor="#0d0b12"
              cellSize={26}
              opacity={0.9}
            >
              <div className="flex h-full items-center gap-3 px-5">
                <span
                  className="pixel-clip flex h-10 w-10 items-center justify-center font-pixel text-[13px] text-white"
                  style={{ backgroundColor: account.avatarColor }}
                >
                  {account.displayName.charAt(0).toUpperCase()}
                </span>
                <div>
                  <p className="font-pixel text-[11px] text-panel-foreground">
                    Posting as {account.displayName}
                  </p>
                  <p className="font-mono text-[11px] text-panel-foreground/60">
                    {account.handle}
                  </p>
                </div>
              </div>
            </CursorWave>
            <button
              type="button"
              onClick={closeComposer}
              className="focus-ring absolute right-3 top-3 z-10 font-mono text-sm text-panel-foreground/70 hover:text-panel-foreground"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          <div className="p-5">
            <label className="sr-only" htmlFor="composer-text">
              Post text
            </label>
            <div className="relative">
              <textarea
                ref={mention.inputRef as React.RefObject<HTMLTextAreaElement>}
                id="composer-text"
                value={text}
                onChange={(e) => mention.onInputChange(e, setText)}
                onKeyDown={(e) => mention.onKeyDown(e, text, setText)}
                placeholder="what's happening? drop a #hashtag or @someone…"
                rows={5}
                autoFocus
                className="focus-ring w-full resize-none bg-transparent font-mono text-[15px] leading-relaxed outline-none placeholder:text-muted-foreground min-h-[100px]"
              />
              <MentionDropdown suggestions={mention.suggestions} onSelect={(h) => mention.insertMention(h, text, setText)} />
            </div>

            <AnimatePresence>
              {gif && (
                <motion.div
                  initial={reduced ? undefined : { opacity: 0, height: 0 }}
                  animate={reduced ? undefined : { opacity: 1, height: "auto" }}
                  exit={reduced ? undefined : { opacity: 0, height: 0 }}
                  className="relative mt-3 overflow-hidden"
                >
                  <div className="pixel-clip relative inline-block border-2 border-foreground">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={gif.url}
                      alt={gif.title}
                      className="max-h-56 w-auto"
                    />
                    <button
                      type="button"
                      onClick={() => setGif(null)}
                      className="focus-ring absolute right-2 top-2 flex h-7 w-7 items-center justify-center border border-white/40 bg-black/70 font-mono text-xs text-white hover:bg-black"
                      aria-label="Remove GIF"
                    >
                      ✕
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {pickerOpen && (
                <motion.div
                  initial={reduced ? undefined : { opacity: 0, y: -8 }}
                  animate={reduced ? undefined : { opacity: 1, y: 0 }}
                  exit={reduced ? undefined : { opacity: 0, y: -8 }}
                  className="mt-3"
                >
                  <GifPicker
                    onSelect={(g) => {
                      setGif(g);
                      setPickerOpen(false);
                    }}
                    onClose={() => setPickerOpen(false)}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mt-4 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setPickerOpen((o) => !o)}
                className="focus-ring group flex items-center gap-2 border border-border px-4 py-3 sm:px-3 sm:py-2 font-mono text-sm text-foreground transition-colors hover:border-accent hover:text-accent"
                aria-expanded={pickerOpen}
              >
                <PixelIcon
                  name="film"
                  className="h-5 w-5 sm:h-4 sm:w-4 text-accent transition-transform group-hover:scale-110"
                />
                <span className="hidden sm:inline">{gif ? "Change GIF" : "Add GIF"}</span>
              </button>

              <div className="flex flex-1 items-center justify-end gap-4">
                <PixelButton onClick={submit} size="md" className="flex-1 sm:flex-none py-3 sm:py-2">
                  <span className="font-mono">Publish</span>
                </PixelButton>
              </div>
            </div>
          </div>
        </motion.section>
      </motion.div>
    </AnimatePresence>
  );
}
