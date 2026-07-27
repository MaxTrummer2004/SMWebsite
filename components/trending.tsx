"use client";

import AnimatedList from "@/components/animated-list";
import { PixelIcon } from "@/components/pixel-icon";
import { TypistPrompt } from "@/components/typist-prompt";
import { useApp } from "@/lib/app";
import type { ReactNode } from "react";

function timeAgo(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function Trending(): ReactNode {
  const { posts } = useApp();

  // Real trending: count hashtags across all posts
  const tagCounts = new Map<string, number>();
  for (const post of posts) {
    const matches = post.text.match(/#[\p{L}\d_]+/gu) ?? [];
    for (const tag of matches) {
      tagCounts.set(tag.toLowerCase(), (tagCounts.get(tag.toLowerCase()) ?? 0) + 1);
    }
  }
  const trending = [...tagCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Real live: only events from last 24h
  type ActivityItem = { id: number; content: string };
  const activityItems: ActivityItem[] = [];
  let id = 0;
  const cutoff = Date.now() - 1000 * 60 * 60 * 24;

  const sorted = [...posts].sort((a, b) => b.createdAt - a.createdAt);
  for (const post of sorted) {
    if (post.createdAt < cutoff) continue;
    if (post.isMascot) {
      activityItems.push({ id: id++, content: `👾 Brixel posted ${timeAgo(post.createdAt)}` });
    } else if (post.gif && !post.text) {
      activityItems.push({ id: id++, content: `${post.handle} dropped a gif ${timeAgo(post.createdAt)}` });
    } else {
      activityItems.push({ id: id++, content: `${post.handle} posted ${timeAgo(post.createdAt)}` });
    }
    for (const c of post.comments ?? []) {
      if (c.createdAt >= cutoff) {
        activityItems.push({ id: id++, content: `${c.handle} commented ${timeAgo(c.createdAt)}` });
      }
    }
  }

  const liveItems = activityItems.length > 0
    ? activityItems
    : [{ id: 0, content: "quiet in here... be the first!" }];

  return (
    <aside id="trending" className="space-y-6 lg:sticky lg:top-24">
      {/* Trending topics */}
      <div className="pixel-clip border-2 border-foreground bg-background p-5">
        <div className="mb-4 flex items-center gap-2">
          <PixelIcon name="sparkle" className="h-4 w-4 text-accent" />
          <h2 className="font-pixel text-[11px]">Trending</h2>
        </div>
        {trending.length > 0 ? (
          <ul className="space-y-3">
            {trending.map(([tag, count], i) => (
              <li key={tag} className="flex items-center gap-3">
                <span className="w-4 font-mono text-xs text-muted-foreground">{i + 1}</span>
                <span className="font-mono text-sm text-foreground">{tag}</span>
                <span className="ml-auto font-mono text-xs text-muted-foreground">{count}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="font-mono text-xs text-muted-foreground">no hashtags yet — add some to your posts!</p>
        )}
      </div>

      {/* Live activity */}
      <div className="pixel-clip border-2 border-foreground bg-background p-5">
        <div className="mb-3 flex items-center gap-2">
          <span className="h-2 w-2 animate-pulse bg-accent" aria-hidden="true" />
          <h2 className="font-pixel text-[11px]">Live</h2>
        </div>
        <AnimatedList
          items={liveItems}
          height={220}
          autoAddDelay={2800}
          maxItems={5}
          animationType="blur"
          enterFrom="top"
          itemGap={8}
          fadeEdges
          className="font-mono text-xs"
        />
      </div>

      {/* Mascot box */}
      <div className="pixel-clip border-2 border-foreground bg-background p-5 flex flex-col gap-3">
        <div className="space-y-1">
          <p className="font-pixel text-[9px] text-accent leading-relaxed">built with pixels,</p>
          <p className="font-pixel text-[9px] text-accent leading-relaxed">on purpose.</p>
          <p className="font-mono text-[10px] text-muted-foreground mt-1">no algos. no ads. just pixels.</p>
        </div>
        <div className="flex justify-end">
          <TypistPrompt scale={7} />
        </div>
      </div>
    </aside>
  );
}
