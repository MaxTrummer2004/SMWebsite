import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function GET() {
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  let subsCount = 0;
  let dbError = null;
  if (supabaseUrl && serviceKey) {
    const admin = createClient(supabaseUrl, serviceKey);
    const { data, error } = await admin.from("push_subscriptions").select("endpoint");
    subsCount = data?.length ?? 0;
    dbError = error?.message ?? null;
  }

  return NextResponse.json({
    vapidPublicKey: pub ? `${pub.slice(0, 10)}...` : "MISSING",
    vapidPrivateKey: priv ? `${priv.slice(0, 5)}...` : "MISSING",
    supabaseUrl: supabaseUrl ? "SET" : "MISSING",
    serviceRoleKey: serviceKey ? "SET" : "MISSING",
    subscriptionsInDb: subsCount,
    dbError,
  });
}
