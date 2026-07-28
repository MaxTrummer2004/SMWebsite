"use client";

import { PixelButton } from "@/components/pixel-button";
import { PixelIcon } from "@/components/pixel-icon";
import { PostCard } from "@/components/post-card";
import { useApp } from "@/lib/app";
import { AnimatePresence } from "motion/react";
import { useEffect, useRef, type ReactNode } from "react";

export function Feed(): ReactNode {
  const { posts, hydrated, toggleLike, removePost, openComposer, signedIn, account } = useApp();

  const commentingRef = useRef<Set<string>>(new Set());
  const dailyTriggered = useRef(false);

  // Ask mascot to comment on each new post (server writes comment directly to DB)
  useEffect(() => {
    if (!hydrated) return;
    const uncommented = posts.filter(
      (p) =>
        !p.mascotComment &&
        !p.isMascot &&
        (p.text || p.gif) &&
        !commentingRef.current.has(p.id),
    );
    for (const post of uncommented) {
      commentingRef.current.add(post.id);
      const postText = post.text || (post.gif ? `[posted a gif: "${post.gif.title}"]` : "");
      fetch("/api/mascot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "comment", postText, postId: post.id }),
      }).catch(() => commentingRef.current.delete(post.id));
    }
  }, [hydrated, posts]);

  // Daily Brixel post — server writes it directly to DB
  useEffect(() => {
    if (!hydrated || dailyTriggered.current) return;
    const today = new Date().toISOString().slice(0, 10);
    const lastKey = "smknowers.brixel.lastpost";
    if (typeof window !== "undefined" && localStorage.getItem(lastKey) === today) return;

    const alreadyPostedToday = posts.some(
      (p) => p.isMascot && new Date(p.createdAt).toISOString().slice(0, 10) === today,
    );
    if (alreadyPostedToday) {
      if (typeof window !== "undefined") localStorage.setItem(lastKey, today);
      return;
    }

    dailyTriggered.current = true;
    if (typeof window !== "undefined") localStorage.setItem(lastKey, today);

    const todayPosts = posts
      .filter(
        (p) =>
          !p.isMascot &&
          new Date(p.createdAt).toISOString().slice(0, 10) === today &&
          p.text,
      )
      .map((p) => p.text);

    const delay = 3000 + Math.random() * 7000;
    const timer = setTimeout(() => {
      fetch("/api/mascot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "daily-post", postTexts: todayPosts }),
      }).catch(() => {
        dailyTriggered.current = false;
      });
    }, delay);

    return () => clearTimeout(timer);
  }, [hydrated, posts]);

  return (
    <div className="space-y-6">
      <div className="pixel-clip flex items-center gap-3 border-2 border-foreground bg-background p-4">
        <span
          className="pixel-clip flex h-10 w-10 shrink-0 items-center justify-center font-pixel text-[12px] text-white"
          style={{ backgroundColor: account?.avatarColor ?? "#ea580c" }}
          aria-hidden="true"
        >
          {signedIn && account ? account.displayName.charAt(0).toUpperCase() : "?"}
        </span>
        <button
          type="button"
          onClick={openComposer}
          className="focus-ring flex-1 border border-border bg-muted px-4 py-2.5 text-left font-mono text-sm text-muted-foreground transition-colors hover:border-accent"
        >
          {signedIn ? "what's happening?" : "sign in to post…"}
        </button>
        <PixelButton onClick={openComposer} size="md">
          <span className="font-mono">Publish</span>
        </PixelButton>
      </div>

      <div id="feed" className="flex items-center gap-3 pt-2" aria-hidden="true">
        <PixelIcon name="list" className="h-4 w-4 text-accent" />
        <span className="font-pixel text-[11px]">The Feed</span>
        <span className="h-px flex-1 bg-border" />
        <span className="font-mono text-xs text-muted-foreground">
          {posts.length} post{posts.length === 1 ? "" : "s"}
        </span>
      </div>

      {hydrated && posts.length === 0 ? (
        <div className="pixel-clip border-2 border-dashed border-border p-10 text-center">
          <p className="font-pixel text-[11px] text-accent">quiet in here…</p>
          <p className="mt-3 font-mono text-sm text-muted-foreground">
            Be the first to post. Hit Publish above.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          <AnimatePresence initial={false}>
            {posts.slice(0, 10).map((post, i) => (
              <PostCard
                key={post.id}
                post={post}
                index={i}
                onLike={toggleLike}
                onRemove={removePost}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
