"use client";

import BlurHighlight from "@/components/blur-highlight";
import { PixelCharacter } from "@/components/pixel-character";
import { PixelIcon } from "@/components/pixel-icon";
import { useApp } from "@/lib/app";
import { useReducedMotion } from "@/lib/motion";
import type { Post } from "@/lib/types";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";

function timeAgo(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
}

function hashtags(text: string): string[] {
  const matches = text.match(/#[\p{L}\d_]+/gu);
  return matches ? Array.from(new Set(matches)) : [];
}

export function PostCard({
  post,
  onLike,
  onRemove,
  index,
}: {
  post: Post;
  onLike: (id: string) => void;
  onRemove: (id: string) => void;
  index: number;
}): ReactNode {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const { addComment, account, signedIn } = useApp();
  const [commentText, setCommentText] = useState("");

  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const srx = useSpring(rx, { stiffness: 200, damping: 20 });
  const sry = useSpring(ry, { stiffness: 200, damping: 20 });
  const rotateX = useTransform(srx, (v) => `${v}deg`);
  const rotateY = useTransform(sry, (v) => `${v}deg`);

  const onMove = (e: PointerEvent<HTMLElement>): void => {
    if (reduced) return;
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    ry.set(px * 6);
    rx.set(-py * 6);
  };

  const reset = (): void => {
    rx.set(0);
    ry.set(0);
  };

  const submitComment = (): void => {
    const text = commentText.trim();
    if (!text || !account) return;
    addComment(post.id, {
      author: account.displayName,
      handle: account.handle,
      avatarColor: account.avatarColor,
      text,
    });
    setCommentText("");
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === "Enter") submitComment();
  };

  const tags = hashtags(post.text);

  return (
    <motion.article
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={reset}
      initial={reduced ? undefined : { opacity: 0, y: 24, filter: "blur(8px)" }}
      animate={reduced ? undefined : { opacity: 1, y: 0, filter: "blur(0px)" }}
      exit={reduced ? undefined : { opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.4, delay: Math.min(index, 6) * 0.04 }}
      style={{ rotateX, rotateY, transformPerspective: 900 }}
      className={`pixel-clip group relative border-2 p-5 transition-shadow hover:pixel-shadow ${post.isMascot ? "border-accent bg-accent/5" : "border-foreground bg-background"}`}
    >
      <header className="flex items-center gap-3">
        <span
          className="pixel-clip flex h-10 w-10 shrink-0 items-center justify-center font-pixel text-[13px] text-white"
          style={{ backgroundColor: post.avatarColor }}
          aria-hidden="true"
        >
          {post.author.charAt(0).toUpperCase() || "?"}
        </span>
        <div className="min-w-0">
          <p className="truncate font-mono text-sm font-semibold">
            {post.author}
            {post.isMascot && <span className="ml-2 font-pixel text-[8px] text-accent">mascot</span>}
          </p>
          <p className="truncate font-mono text-xs text-muted-foreground">
            {post.handle} · {timeAgo(post.createdAt)}
          </p>
        </div>
        {account?.userId && post.userId === account.userId && (
          <button
            type="button"
            onClick={() => onRemove(post.id)}
            className="focus-ring ml-auto text-muted-foreground opacity-0 transition-opacity hover:text-accent group-hover:opacity-100"
            aria-label="Delete post"
          >
            <PixelIcon name="scissors" className="h-4 w-4" />
          </button>
        )}
      </header>

      {post.text && (
        <div className="mt-4 font-mono text-[15px] leading-relaxed">
          <BlurHighlight
            highlightedBits={tags}
            highlightColor="var(--accent)"
            blurAmount={6}
            blurDuration={0.5}
            viewportOptions={{ once: true, amount: 0.15 }}
          >
            {post.text}
          </BlurHighlight>
        </div>
      )}

      {post.gif && (
        <motion.div
          initial={reduced ? undefined : { opacity: 0, scale: 0.98 }}
          animate={reduced ? undefined : { opacity: 1, scale: 1 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="pixel-clip mt-4 overflow-hidden border-2 border-foreground max-w-sm w-fit"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.gif.url}
            alt={post.gif.title}
            loading="lazy"
            className="h-auto w-auto max-h-56 max-w-full"
          />
        </motion.div>
      )}

      {post.mascotComment && (
        <div className="mt-4 flex items-start gap-2 border-t border-border pt-3">
          <PixelCharacter scale={3} className="mt-0.5 shrink-0" />
          <p className="font-mono text-xs text-muted-foreground italic">{post.mascotComment}</p>
        </div>
      )}

      {post.comments && post.comments.length > 0 && (
        <div className="mt-4 space-y-2 border-t border-border pt-3">
          {post.comments.map((c) => (
            <div key={c.id} className="flex items-start gap-2">
              <span
                className="pixel-clip flex h-6 w-6 shrink-0 items-center justify-center font-pixel text-[8px] text-white"
                style={{ backgroundColor: c.avatarColor }}
              >
                {c.author.charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <span className="font-mono text-xs font-semibold">{c.author} </span>
                <span className="font-mono text-xs text-muted-foreground">{c.handle} · {timeAgo(c.createdAt)}</span>
                <p className="font-mono text-xs">{c.text}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <footer className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => onLike(post.id)}
          className={`focus-ring group/like flex shrink-0 items-center gap-2 border border-border px-3 py-1.5 font-mono text-sm transition-colors ${
            post.liked ? "border-accent bg-accent/10 text-accent" : "hover:border-accent hover:text-accent"
          }`}
          aria-pressed={post.liked}
          aria-label={post.liked ? "Unlike" : "Like"}
        >
          <PixelIcon name="sparkle" className={`h-4 w-4 transition-transform group-hover/like:scale-125 ${post.liked ? "text-accent" : ""}`} />
          {post.likes}
        </button>

        {signedIn ? (
          <div className="flex flex-1 gap-2">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={onKey}
              placeholder="comment…"
              className="flex-1 border border-border bg-muted px-3 py-1.5 font-mono text-xs outline-none focus:border-accent"
            />
            <button
              type="button"
              onClick={submitComment}
              disabled={!commentText.trim()}
              className="shrink-0 border-2 border-foreground bg-foreground px-3 py-1.5 font-mono text-xs text-background transition-opacity disabled:opacity-40 hover:bg-foreground/90"
            >
              ↵
            </button>
          </div>
        ) : (
          <span className="font-mono text-xs text-muted-foreground">sign in to comment</span>
        )}

        {tags.length > 0 && (
          <div className="ml-auto flex shrink-0 flex-wrap gap-1.5">
            {tags.slice(0, 2).map((tag) => (
              <span key={tag} className="border border-border px-2 py-0.5 font-mono text-xs text-muted-foreground">
                {tag}
              </span>
            ))}
          </div>
        )}
      </footer>
    </motion.article>
  );
}
