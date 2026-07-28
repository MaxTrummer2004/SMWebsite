"use client";

import { NotificationSettings } from "@/components/notification-settings";
import { PixelButton } from "@/components/pixel-button";
import { PixelIcon } from "@/components/pixel-icon";
import { PostCard } from "@/components/post-card";
import { useApp } from "@/lib/app";
import { AnimatePresence } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";

function timeAgoArchive(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function Feed(): ReactNode {
  const { posts, hydrated, toggleLike, removePost, openComposer, signedIn, account } = useApp();
  const [tab, setTab] = useState<"feed" | "archive">("feed");

  const commentingRef = useRef<Set<string>>(new Set());
  const brixelReplyRef = useRef<Set<string>>(new Set());

  // Load persisted IDs on mount
  useEffect(() => {
    try {
      const replied = localStorage.getItem("smknowers.brixel.replied");
      if (replied) brixelReplyRef.current = new Set(JSON.parse(replied));
      const commented = localStorage.getItem("smknowers.brixel.commented");
      if (commented) commentingRef.current = new Set(JSON.parse(commented));
    } catch {}
  }, []);
  const dailyTriggered = useRef(false);

  // Ask mascot to comment on each new post (server writes comment directly to DB)
  useEffect(() => {
    if (!hydrated) return;
    const uncommented = posts.filter(
      (p) =>
        !p.mascotComment &&
        !p.isMascot &&
        (p.text || p.gif) &&
        !p.comments?.some((c) => c.handle === "@brixel") &&
        !commentingRef.current.has(p.id),
    );
    for (const post of uncommented) {
      commentingRef.current.add(post.id);
      try { localStorage.setItem("smknowers.brixel.commented", JSON.stringify([...commentingRef.current])); } catch {}
      const postText = post.text || (post.gif ? `[posted a gif: "${post.gif.title}"]` : "");
      fetch("/api/mascot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "comment", postText, postId: post.id }),
      }).catch(() => { commentingRef.current.delete(post.id); try { localStorage.setItem("smknowers.brixel.commented", JSON.stringify([...commentingRef.current])); } catch {} });
    }
  }, [hydrated, posts]);

  const markBrixelReplied = (key: string) => {
    brixelReplyRef.current.add(key);
    try {
      localStorage.setItem("smknowers.brixel.replied", JSON.stringify([...brixelReplyRef.current]));
    } catch {}
  };

  // Reply when @brixel is mentioned in post text or comments
  useEffect(() => {
    if (!hydrated) return;
    for (const post of posts) {
      // @brixel in post text → reply as comment (skip mascot's own posts)
      if (
        !post.isMascot &&
        post.text?.toLowerCase().includes("@brixel") &&
        !brixelReplyRef.current.has(`post:${post.id}`)
      ) {
        markBrixelReplied(`post:${post.id}`);
        fetch("/api/mascot", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mode: "mention-reply", postText: post.text, postId: post.id }),
        }).catch(() => brixelReplyRef.current.delete(`post:${post.id}`));
      }

      // @brixel in a comment → reply as another comment
      for (const comment of post.comments ?? []) {
        if (
          comment.handle !== "@brixel" &&
          comment.text?.toLowerCase().includes("@brixel") &&
          !brixelReplyRef.current.has(`comment:${comment.id}`)
        ) {
          markBrixelReplied(`comment:${comment.id}`);
          fetch("/api/mascot", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ mode: "mention-reply-comment", commentText: comment.text, postId: post.id }),
          }).catch(() => brixelReplyRef.current.delete(`comment:${comment.id}`));
        }
      }
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

      <div id="feed" className="flex items-center gap-3 pt-2">
        <PixelIcon name="list" className="h-4 w-4 text-accent" />
        <button
          type="button"
          onClick={() => setTab("feed")}
          className={`font-pixel text-[11px] transition-colors ${tab === "feed" ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
        >
          The Feed
        </button>
        <span className="font-pixel text-[11px] text-border">/</span>
        <button
          type="button"
          onClick={() => setTab("archive")}
          className={`font-pixel text-[11px] transition-colors ${tab === "archive" ? "text-accent" : "text-muted-foreground hover:text-foreground"}`}
        >
          Archive
        </button>
        <span className="h-px flex-1 bg-border" />
        <NotificationSettings />
        <span className="font-mono text-xs text-muted-foreground">
          {tab === "feed"
            ? `${Math.min(posts.length, 10)} post${Math.min(posts.length, 10) === 1 ? "" : "s"}`
            : `${posts.filter(p => p.text).length} entries`}
        </span>
      </div>

      {tab === "feed" ? (
        hydrated && posts.length === 0 ? (
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
        )
      ) : (
        <div className="space-y-2">
          {!hydrated ? (
            <p className="font-mono text-xs text-muted-foreground">loading…</p>
          ) : posts.filter(p => p.text).length === 0 ? (
            <div className="pixel-clip border-2 border-dashed border-border p-10 text-center">
              <p className="font-pixel text-[11px] text-accent">no text posts yet</p>
            </div>
          ) : (
            posts.filter(p => p.text).map(post => (
              <div key={post.id} className="border border-border bg-background p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="pixel-clip flex h-6 w-6 shrink-0 items-center justify-center font-pixel text-[9px] text-white"
                    style={{ backgroundColor: post.avatarColor }}
                  >
                    {post.author.charAt(0).toUpperCase()}
                  </span>
                  <span className="font-mono text-xs font-semibold">{post.author}</span>
                  <span className="font-mono text-xs text-muted-foreground">{post.handle}</span>
                  <span className="ml-auto font-mono text-xs text-muted-foreground">{timeAgoArchive(post.createdAt)}</span>
                </div>
                <p className="font-mono text-sm leading-relaxed">{post.text}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
