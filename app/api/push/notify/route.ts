import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import webpush from "web-push";

let vapidInitialized = false;
function initVapid() {
  if (vapidInitialized) return;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) return;
  webpush.setVapidDetails("mailto:maxtrummer16@gmail.com", pub, priv);
  vapidInitialized = true;
}

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(req: Request) {
  try {
    initVapid();
    if (!vapidInitialized) return NextResponse.json({ ok: true });
    const { author, handle, text, postId, type } = await req.json() as {
      author: string;
      handle: string;
      text: string;
      postId: string;
      type?: "post" | "comment";
    };

    const { data: subs } = await adminSupabase
      .from("push_subscriptions")
      .select("endpoint, p256dh, auth, followed_handles");

    if (!subs?.length) return NextResponse.json({ ok: true });

    const payload = JSON.stringify({
      title: type === "comment" ? `${author} commented` : `${author} posted`,
      body: text ? (text.length > 80 ? text.slice(0, 77) + "…" : text) : "posted a GIF",
      tag: `${postId}-${type ?? "post"}`,
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
