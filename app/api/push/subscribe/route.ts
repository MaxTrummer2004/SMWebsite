import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(req: Request) {
  try {
    const { subscription, followedHandles } = await req.json() as {
      subscription: PushSubscriptionJSON;
      followedHandles: string[];
    };

    if (!subscription?.endpoint) {
      return NextResponse.json({ error: "invalid subscription" }, { status: 400 });
    }

    await adminSupabase.from("push_subscriptions").upsert(
      {
        endpoint: subscription.endpoint,
        p256dh: (subscription.keys as Record<string, string>)?.p256dh ?? "",
        auth: (subscription.keys as Record<string, string>)?.auth ?? "",
        followed_handles: followedHandles,
      },
      { onConflict: "endpoint" },
    );

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { endpoint } = await req.json() as { endpoint: string };
    await adminSupabase.from("push_subscriptions").delete().eq("endpoint", endpoint);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "server error" }, { status: 500 });
  }
}
