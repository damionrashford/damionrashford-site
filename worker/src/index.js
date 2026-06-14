// Cloudflare Worker — contact form handler for damionrashford.com
// Validates input, blocks spam, and emails Damion via Resend.
// Secrets (set via `wrangler secret put`): RESEND_API_KEY
// Vars (in wrangler.toml): TO_EMAIL, FROM_EMAIL, ALLOWED_ORIGIN

const cors = (origin) => ({
  "Access-Control-Allow-Origin": origin,
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Vary": "Origin",
});

export default {
  async fetch(request, env) {
    const allowed = env.ALLOWED_ORIGIN || "https://damionrashford.com";
    const origin = request.headers.get("Origin") || "";
    const okOrigin = origin === allowed ? origin : allowed;

    if (request.method === "OPTIONS") return new Response(null, { headers: cors(okOrigin) });
    if (request.method !== "POST")
      return new Response("Method not allowed", { status: 405, headers: cors(okOrigin) });
    if (origin && origin !== allowed)
      return new Response("Forbidden", { status: 403, headers: cors(okOrigin) });

    let body;
    try { body = await request.json(); }
    catch { return new Response("Bad request", { status: 400, headers: cors(okOrigin) }); }

    const name = (body.name || "").toString().trim().slice(0, 120);
    const email = (body.email || "").toString().trim().slice(0, 200);
    const message = (body.message || "").toString().trim().slice(0, 5000);

    if (!name || !email || !message)
      return new Response("Missing fields", { status: 422, headers: cors(okOrigin) });
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
      return new Response("Invalid email", { status: 422, headers: cors(okOrigin) });

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: env.FROM_EMAIL || "Portfolio <onboarding@resend.dev>",
        to: [env.TO_EMAIL],
        reply_to: email,
        subject: `New message from ${name} via damionrashford.com`,
        text: `From: ${name} <${email}>\n\n${message}`,
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      console.log("resend error", res.status, detail);
      return new Response("Could not send", { status: 502, headers: cors(okOrigin) });
    }
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...cors(okOrigin), "Content-Type": "application/json" },
    });
  },
};
