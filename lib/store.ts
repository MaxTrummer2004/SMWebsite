"use client";

import { supabase } from "@/lib/supabase";
import type { Comment, Gif, Post } from "@/lib/types";
import { useCallback, useEffect, useState } from "react";

export const AVATAR_COLORS = [
  "#ea580c",
  "#7c3aed",
  "#0891b2",
  "#16a34a",
  "#db2777",
  "#ca8a04",
];

export function pickAvatarColor(): string {
  const i = Math.floor(Math.random() * AVATAR_COLORS.length);
  return AVATAR_COLORS[i] ?? "#ea580c";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapPost(row: any, userId: string | null): Post {
  const likes: { user_id: string }[] = row.likes ?? [];
  const comments: any[] = row.comments ?? []; // eslint-disable-line @typescript-eslint/no-explicit-any
  return {
    id: row.id,
    userId: row.user_id ?? null,
    author: row.author,
    handle: row.handle,
    avatarColor: row.avatar_color,
    text: row.text ?? "",
    gif: row.gif as Gif | null,
    createdAt: new Date(row.created_at).getTime(),
    likes: likes.length,
    liked: userId ? likes.some((l) => l.user_id === userId) : false,
    mascotComment: row.mascot_comment ?? undefined,
    isMascot: row.is_mascot ?? false,
    comments: comments
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      .map((c) => ({
        id: c.id,
        author: c.author,
        handle: c.handle,
        avatarColor: c.avatar_color,
        text: c.text,
        createdAt: new Date(c.created_at).getTime(),
      })),
  };
}

export function usePosts(userId: string | null) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [hydrated, setHydrated] = useState(false);

  const fetchPosts = useCallback(async () => {
    const { data, error } = await supabase
      .from("posts")
      .select("*, comments(*), likes(user_id)")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("fetchPosts error:", error.message);
      return;
    }
    setPosts((data ?? []).map((row) => mapPost(row, userId)));
    setHydrated(true);
  }, [userId]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Realtime — re-fetch on any change to posts/comments/likes
  useEffect(() => {
    const channel = supabase
      .channel("smknowers-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "posts" }, fetchPosts)
      .on("postgres_changes", { event: "*", schema: "public", table: "comments" }, fetchPosts)
      .on("postgres_changes", { event: "*", schema: "public", table: "likes" }, fetchPosts)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchPosts]);

  const addPost = useCallback(
    async (input: {
      author: string;
      text: string;
      gif: Post["gif"];
      avatarColor: string;
      handle?: string;
      isMascot?: boolean;
      userId?: string | null;
    }) => {
      const handle =
        input.handle ??
        `@${(input.author || "friend")
          .trim()
          .toLowerCase()
          .replace(/\s+/g, "")
          .slice(0, 16) || "friend"}`;

      const { data: inserted, error } = await supabase.from("posts").insert({
        user_id: input.userId ?? null,
        author: input.author.trim() || "Anon",
        handle,
        avatar_color: input.avatarColor,
        text: input.text.trim(),
        gif: input.gif,
        is_mascot: input.isMascot ?? false,
      }).select("id").single();

      if (error) {
        console.error("addPost error:", error.message);
        return;
      }

      if (inserted && !input.isMascot) {
        fetch("/api/push/notify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            author: input.author.trim() || "Anon",
            handle,
            text: input.text.trim(),
            postId: inserted.id,
          }),
        }).catch(() => {});
      }
    },
    [],
  );

  const toggleLike = useCallback(
    async (id: string) => {
      if (!userId) return;
      const post = posts.find((p) => p.id === id);
      if (!post) return;

      if (post.liked) {
        const { error } = await supabase
          .from("likes")
          .delete()
          .match({ post_id: id, user_id: userId });
        if (error) console.error("unlike error:", error.message);
      } else {
        const { error } = await supabase
          .from("likes")
          .insert({ post_id: id, user_id: userId });
        if (error) console.error("like error:", error.message);
      }
    },
    [userId, posts],
  );

  const removePost = useCallback(async (id: string) => {
    const { error } = await supabase.from("posts").delete().eq("id", id);
    if (error) console.error("removePost error:", error.message);
  }, []);

  const addComment = useCallback(
    async (postId: string, input: Omit<Comment, "id" | "createdAt">) => {
      const { error } = await supabase.from("comments").insert({
        post_id: postId,
        user_id: userId,
        author: input.author,
        handle: input.handle,
        avatar_color: input.avatarColor,
        text: input.text,
      });
      if (error) console.error("addComment error:", error.message);
    },
    [userId],
  );

  return { posts, hydrated, addPost, toggleLike, removePost, addComment };
}
