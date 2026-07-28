import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const CHANNEL_ID = "UC_WxS6C3_CwTZQVIYXSvnaw";
const RSS_URL = `https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const SYSTEM = `You are Brixel, the pixel mascot of SMKnowers — a tiny pixelated social network.
You are casual, funny, and extremely brief. Max 1-2 sentences.
No formalities. No greetings. Just vibe. Use German or English depending on the video title language.`;

async function getLatestVideo(): Promise<{ id: string; title: string; url: string } | null> {
  const res = await fetch(RSS_URL, { next: { revalidate: 0 } });
  if (!res.ok) return null;
  const xml = await res.text();

  const entryMatch = xml.match(/<entry>([\s\S]*?)<\/entry>/);
  if (!entryMatch) return null;
  const entry = entryMatch[1]!;

  const idMatch = entry.match(/<yt:videoId>(.*?)<\/yt:videoId>/);
  const titleMatch = entry.match(/<title>(.*?)<\/title>/);
  if (!idMatch || !titleMatch) return null;

  const videoId = idMatch[1]!;
  return {
    id: videoId,
    title: titleMatch[1]!.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">"),
    url: `https://www.youtube.com/watch?v=${videoId}`,
  };
}

export async function GET() {
  try {
    const video = await getLatestVideo();
    if (!video) return NextResponse.json({ ok: false, reason: "rss_error" });

    const { data: state } = await adminSupabase
      .from("brixel_youtube_state")
      .select("last_video_id")
      .eq("channel_id", CHANNEL_ID)
      .single();

    if (state?.last_video_id === video.id) {
      return NextResponse.json({ ok: true, reason: "no_new_video" });
    }

    // New video — update state first to avoid duplicate posts on error
    await adminSupabase
      .from("brixel_youtube_state")
      .upsert({ channel_id: CHANNEL_ID, last_video_id: video.id, updated_at: new Date().toISOString() });

    const msg = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 100,
      system: SYSTEM,
      messages: [
        {
          role: "user",
          content: `Gleggmire hat ein neues YouTube-Video hochgeladen: "${video.title}". Schreib einen kurzen, witzigen Post darüber für unser Social Network. Erwähne den Titel. Füge am Ende die URL ein: ${video.url}`,
        },
      ],
    });

    const text = msg.content[0]?.type === "text" ? msg.content[0].text : "";
    if (!text) return NextResponse.json({ ok: false, reason: "no_text" });

    await adminSupabase.from("posts").insert({
      user_id: null,
      author: "Brixel",
      handle: "@brixel",
      avatar_color: "#ea580c",
      text,
      gif: null,
      is_mascot: true,
    });

    return NextResponse.json({ ok: true, video: video.title });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "internal error" }, { status: 500 });
  }
}
