import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Service role client bypasses RLS — only used server-side
const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const SYSTEM = `You are Brixel, the pixel mascot of SMKnowers — a tiny pixelated social network.
You are casual, funny, and extremely brief. Max 2 sentences, usually just one.
No formalities. No greetings. Just vibe. Use the same language as the user (German or English).
For post comments: react to the post with a short, witty, genuine comment. No hashtags.`;

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      mode: string;
      postText?: string;
      postId?: string;
      postTexts?: string[];
      messages?: { role: string; content: string }[];
      choice?: string;
      gifUrl?: string;
    };
    const { mode } = body;

    if (mode === "prompted-post") {
      const msg = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 100,
        system: SYSTEM,
        messages: [
          {
            role: "user",
            content: `Write a short post (max 2 sentences) about: "${body.choice}". Sound like you just had to deal with this. No quotes, write the post directly.`,
          },
        ],
      });
      const text = msg.content[0]?.type === "text" ? msg.content[0].text : "";
      if (text) {
        await adminSupabase.from("posts").insert({
          user_id: null,
          author: "Brixel",
          handle: "@brixel",
          avatar_color: "#ea580c",
          text,
          gif: null,
          is_mascot: true,
        });
      }
      return NextResponse.json({ ok: true });
    }

    if (mode === "daily-post") {
      const context = body.postTexts?.length
        ? `Today's posts:\n${body.postTexts.slice(0, 8).map((t, i) => `${i + 1}. "${t}"`).join("\n")}`
        : "No posts today yet.";
      const msg = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 100,
        system: SYSTEM,
        messages: [
          {
            role: "user",
            content: `${context}\n\nWrite a short casual post (1-2 sentences) reacting to today's vibe on the network. No quotes, just write the post directly.`,
          },
        ],
      });
      const text = msg.content[0]?.type === "text" ? msg.content[0].text : "";
      if (text) {
        await adminSupabase.from("posts").insert({
          user_id: null,
          author: "Brixel",
          handle: "@brixel",
          avatar_color: "#ea580c",
          text,
          gif: null,
          is_mascot: true,
        });
      }
      return NextResponse.json({ ok: true });
    }

    if (mode === "comment" && body.postText && body.postId) {
      const userContent: Anthropic.MessageParam["content"] = body.gifUrl
        ? [
            {
              type: "image",
              source: { type: "url", url: body.gifUrl },
            },
            {
              type: "text",
              text: body.postText.startsWith("[posted a gif")
                ? "React to this GIF they posted (1 sentence, witty). Describe what you see."
                : `Comment on this post with the attached GIF (1 sentence, witty): "${body.postText}"`,
            },
          ]
        : `Comment on this post (1 sentence, witty): "${body.postText}"`;

      const msg = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 80,
        system: SYSTEM,
        messages: [{ role: "user", content: userContent }],
      });
      const text = msg.content[0]?.type === "text" ? msg.content[0].text : "";
      if (text) {
        await adminSupabase
          .from("posts")
          .update({ mascot_comment: text })
          .eq("id", body.postId);
      }
      return NextResponse.json({ ok: true });
    }

    if (mode === "mention-reply" && body.postText && body.postId) {
      const { count } = await adminSupabase
        .from("comments")
        .select("id", { count: "exact", head: true })
        .eq("post_id", body.postId)
        .eq("handle", "@brixel");
      if (count && count > 0) return NextResponse.json({ ok: true, skipped: true });

      const msg = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 80,
        system: SYSTEM,
        messages: [
          {
            role: "user",
            content: `Someone mentioned you (@brixel) in their post: "${body.postText}"\n\nReply directly to them (1 sentence, casual, no "@brixel" prefix).`,
          },
        ],
      });
      const text = msg.content[0]?.type === "text" ? msg.content[0].text : "";
      if (text) {
        const { error } = await adminSupabase.from("comments").insert({
          post_id: body.postId,
          user_id: null,
          author: "Brixel",
          handle: "@brixel",
          avatar_color: "#ea580c",
          text,
        });
        // unique constraint violation = already replied, treat as success
        if (error && !error.code?.startsWith("23")) throw error;
      }
      return NextResponse.json({ ok: true });
    }

    if (mode === "mention-reply-comment" && body.postId) {
      const commentText = (body as { commentText?: string; commentId?: string }).commentText;
      const commentId = (body as { commentId?: string }).commentId;
      if (!commentText) return NextResponse.json({ error: "missing commentText" }, { status: 400 });

      if (commentId) {
        const { data: triggerComment } = await adminSupabase
          .from("comments")
          .select("created_at")
          .eq("id", commentId)
          .single();
        if (triggerComment) {
          const { count } = await adminSupabase
            .from("comments")
            .select("id", { count: "exact", head: true })
            .eq("post_id", body.postId)
            .eq("handle", "@brixel")
            .gt("created_at", triggerComment.created_at);
          if (count && count > 0) return NextResponse.json({ ok: true, skipped: true });
        }
      }

      const msg = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 80,
        system: SYSTEM,
        messages: [
          {
            role: "user",
            content: `Someone mentioned you (@brixel) in a comment: "${commentText}"\n\nReply to their comment (1 sentence, casual, no "@brixel" prefix).`,
          },
        ],
      });
      const text = msg.content[0]?.type === "text" ? msg.content[0].text : "";
      if (text) {
        await adminSupabase.from("comments").insert({
          post_id: body.postId,
          user_id: null,
          author: "Brixel",
          handle: "@brixel",
          avatar_color: "#ea580c",
          text,
        });
      }
      return NextResponse.json({ ok: true });
    }

    if (mode === "chat" && body.messages) {
      const msg = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 120,
        system: SYSTEM,
        messages: body.messages as Anthropic.MessageParam[],
      });
      const text = msg.content[0]?.type === "text" ? msg.content[0].text : "";
      return NextResponse.json({ reply: text });
    }

    return NextResponse.json({ error: "unknown mode" }, { status: 400 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "api error" }, { status: 500 });
  }
}
