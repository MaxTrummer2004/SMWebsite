"use client";

import CursorWave from "@/components/cursor-wave";
import { GifPicker } from "@/components/gif-picker";
import { PixelButton } from "@/components/pixel-button";
import { PixelIcon } from "@/components/pixel-icon";
import { useApp } from "@/lib/app";
import { useReducedMotion } from "@/lib/motion";
import type { Gif } from "@/lib/types";
import { AnimatePresence, motion } from "motion/react";
import { type ChangeEvent, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

const MAX = 280;

export function ComposerModal(): ReactNode {
  const { composerOpen, closeComposer, account, publish, posts } = useApp();
  const reduced = useReducedMotion();

  const [text, setText] = useState("");
  const [gif, setGif] = useState<Gif | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionAnchor, setMentionAnchor] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const knownHandles = useMemo(() => {
    const set = new Set<string>(["@brixel"]);
    for (const p of posts) if (p.handle && p.handle !== account?.handle) set.add(p.handle);
    return Array.from(set).sort();
  }, [posts, account?.handle]);

  const mentionSuggestions = mentionQuery !== null
    ? knownHandles.filter((h) => h.slice(1).toLowerCase().startsWith(mentionQuery.toLowerCase()))
    : [];

  const handleTextChange = (e: ChangeEvent<HTMLTextAreaElement>): void => {
    const val = e.target.value.slice(0, MAX);
    setText(val);
    const cursor = e.target.selectionStart ?? val.length;
    const before = val.slice(0, cursor);
    const match = before.match(/@([\p{L}\d_]*)$/u);
    if (match && match.index !== undefined) {
      setMentionQuery(match[1]);
      setMentionAnchor(match.index);
    } else {
      setMentionQuery(null);
    }
  };

  const insertMention = (handle: string): void => {
    const after = text.slice(mentionAnchor + 1 + (mentionQuery?.length ?? 0));
    const newText = (text.slice(0, mentionAnchor) + handle + " " + after).slice(0, MAX);
    setText(newText);
    setMentionQuery(null);
    textareaRef.current?.focus();
  };

  // Reset each time the modal opens.
  useEffect(() => {
    if (composerOpen) {
      setText("");
      setGif(null);
      setPickerOpen(false);
    }
  }, [composerOpen]);

  if (!composerOpen || !account) return null;

  const remaining = MAX - text.length;
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
                ref={textareaRef}
                id="composer-text"
                value={text}
                onChange={handleTextChange}
                onKeyDown={(e) => {
                  if (mentionSuggestions.length > 0 && (e.key === "Escape" || e.key === " ")) {
                    setMentionQuery(null);
                  }
                }}
                placeholder="what's happening? drop a #hashtag or @someone…"
                rows={5}
                autoFocus
                className="focus-ring w-full resize-none bg-transparent font-mono text-[15px] leading-relaxed outline-none placeholder:text-muted-foreground min-h-[100px]"
              />
              <AnimatePresence>
                {mentionSuggestions.length > 0 && (
                  <motion.ul
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    transition={{ duration: 0.12 }}
                    className="absolute left-0 top-full z-10 mt-1 w-48 border border-border bg-background shadow-lg"
                    role="listbox"
                    aria-label="Mention suggestions"
                  >
                    {mentionSuggestions.slice(0, 6).map((handle) => (
                      <li key={handle}>
                        <button
                          type="button"
                          onMouseDown={(e) => { e.preventDefault(); insertMention(handle); }}
                          className="w-full px-3 py-2 text-left font-mono text-sm hover:bg-muted focus:bg-muted focus:outline-none"
                          style={{ color: "var(--accent-2)" }}
                        >
                          {handle}
                        </button>
                      </li>
                    ))}
                  </motion.ul>
                )}
              </AnimatePresence>
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
                <span
                  className={`font-mono text-xs ${
                    remaining < 20 ? "text-accent" : "text-muted-foreground"
                  }`}
                  aria-live="polite"
                >
                  {remaining}
                </span>
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
