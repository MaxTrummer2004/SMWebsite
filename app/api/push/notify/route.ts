import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import webpush from "web-push";

webpush.setVapidDetails(
  "mailto:maxtrummer16@gmail.com",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
);

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(req: Request) {
  try {
    const { author, handle, text, postId } = await req.json() as {
      author: string;
      handle: string;
      text: string;
      postId: string;
    };

    const { data: subs } = await adminSupabase
      .from("push_subscriptions")
      .select("endpoint, p256dh, auth, followed_handles");

    if (!subs?.length) return NextResponse.json({ ok: true });

    const payload = JSON.stringify({
      title: `${author} posted`,
      body: text ? (text.length > 80 ? text.slice(0, 77) + "…" : text) : "posted a GIF",
      tag: postId,
      url: "/#feed",
    });

    const results = await Promise.allSettled(
      subs
        .filter((s) => s.followed_handles?.includes(handle))
        .map((s) =>
          webpush.sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            payload,
          ),
        ),
    );

    const expired = results
      .map((r, i) => ({ r, s: subs[i] }))
      .filter(({ r }) => r.status === "rejected")
      .map(({ s }) => s?.endpoint)
      .filter(Boolean) as string[];

    if (expired.length) {
      await adminSupabase.from("push_subscriptions").delete().in("endpoint", expired);
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "server error" }, { status: 500 });
  }
}
