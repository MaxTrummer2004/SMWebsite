import { NextResponse } from "next/server";

const RESEND_API_KEY = process.env.RESEND_API_KEY!;
const FROM = "noreply@knower.site";

type HookPayload = {
  user: { email: string; user_metadata?: { display_name?: string } };
  email_data: {
    token: string;
    token_hash: string;
    redirect_to: string;
    email_action_type: string;
    site_url: string;
  };
};

function confirmationEmail(name: string, confirmUrl: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>
body{background:#0d0b12;margin:0;padding:40px 20px;font-family:monospace}
.wrap{max-width:480px;margin:0 auto;border:2px solid #ea580c;background:#0d0b12}
.header{background:#ea580c;padding:24px;text-align:center}
.pixel-text{font-size:18px;font-weight:bold;letter-spacing:2px;color:#fff;text-transform:uppercase}
.body{padding:32px 24px;color:#e5e5e5}
.msg{font-size:13px;line-height:1.8;color:#a0a0a0;margin:16px 0}
.btn{display:block;margin:24px auto;width:fit-content;background:#ea580c;color:#fff;padding:14px 32px;text-decoration:none;font-family:monospace;font-size:13px;letter-spacing:2px;text-transform:uppercase;border:2px solid #fff}
.footer{border-top:1px solid #333;padding:16px 24px;font-size:11px;color:#555;text-align:center}
</style></head>
<body>
<div class="wrap">
  <div class="header">
    <div class="pixel-text">⬛🟧⬛ SMKnowers ⬛🟧⬛</div>
  </div>
  <div class="body">
    <div style="font-size:48px;text-align:center;margin:16px 0">👾</div>
    <p class="pixel-text" style="text-align:center;font-size:14px;color:#ea580c">PLAYER DETECTED</p>
    <p class="msg">
      hey ${name || "there"} —<br><br>
      Brixel here. you just signed up for
      <strong style="color:#ea580c">SMKnowers</strong>, the tiniest social club on the net.<br><br>
      click below to confirm your account and join the feed.
      no ads. no algorithm. just vibes and GIFs.
    </p>
    <a href="${confirmUrl}" style="display:block;margin:24px auto;width:fit-content;background-color:#ea580c;color:#ffffff !important;padding:14px 32px;text-decoration:none;font-family:monospace;font-size:13px;letter-spacing:2px;text-transform:uppercase;border:2px solid #ffffff;font-weight:bold;mso-padding-alt:0">▶ BESTÄTIGEN &amp; BEITRETEN</a>
    <p class="msg" style="font-size:11px;text-align:center">
      didn't sign up? ignore this. nothing bad happens. 👾
    </p>
  </div>
  <div class="footer">SMKnowers · made with pixels · knower.site</div>
</div>
</body>
</html>`;
}

export async function POST(req: Request) {
  try {
    const raw = await req.json();
    console.log("Hook payload:", JSON.stringify(raw));

    // Supabase may wrap payload differently
    const payload = (raw.payload ?? raw) as HookPayload;
    const { user, email_data } = payload;

    if (!email_data || email_data.email_action_type !== "signup") {
      return NextResponse.json({ success: true });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const confirmUrl = `${supabaseUrl}/auth/v1/verify?token=${email_data.token_hash}&type=signup&redirect_to=${encodeURIComponent(email_data.redirect_to)}`;
    const name = user.user_metadata?.display_name ?? "";

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM,
        to: user.email,
        subject: "👾 Confirm your SMKnowers account",
        html: confirmationEmail(name, confirmUrl),
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Resend error:", err);
      return NextResponse.json({ error: err }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "hook error" }, { status: 500 });
  }
}
