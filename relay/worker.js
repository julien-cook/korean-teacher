// Cloudflare Worker — CORS relay for the xAI API.
//
// Why this exists: api.x.ai does not send Access-Control-* headers on
// /v1/chat/completions, so a browser cannot call it directly. This Worker adds
// them, and — more importantly — holds the xAI key server-side so it never
// enters the browser at all.
//
// The browser authenticates to THIS Worker with a relay token, not with the xAI
// key. If the token leaks, an attacker can burn your quota; they cannot take
// your key. Rotate the token by re-running `wrangler secret put RELAY_TOKEN`.
//
// Secrets (wrangler secret put ...):
//   XAI_API_KEY   your xai-... key
//   RELAY_TOKEN   any long random string; paste the same value into the app
//
// Optional var (wrangler.toml [vars]):
//   ALLOWED_ORIGIN   defaults to "*"; set to your Pages origin to lock it down

const UPSTREAM = "https://api.x.ai";

// Only these paths may be proxied. An open relay would let anyone spend the key
// on any endpoint.
const ALLOWED_PATHS = new Set([
  "/v1/chat/completions",
  "/v1/stt",
  "/v1/tts",
  "/v1/tts/voices",
]);

function corsHeaders(env) {
  const origin = env.ALLOWED_ORIGIN || "*";
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, content-type, x-relay-token",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}

function json(body, status, env) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders(env) },
  });
}

export default {
  async fetch(request, env) {
    const cors = corsHeaders(env);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }

    const url = new URL(request.url);

    if (url.pathname === "/health") {
      return json({ ok: true, hasKey: Boolean(env.XAI_API_KEY) }, 200, env);
    }

    if (!ALLOWED_PATHS.has(url.pathname)) {
      return json({ error: "Path not allowed by this relay.", path: url.pathname }, 404, env);
    }

    if (!env.XAI_API_KEY) {
      return json({ error: "Relay is missing XAI_API_KEY. Run: wrangler secret put XAI_API_KEY" }, 500, env);
    }

    // Constant-time-ish comparison; these are short strings so the practical
    // risk is negligible, but there is no reason to leak length information.
    const supplied = request.headers.get("x-relay-token") || "";
    const expected = env.RELAY_TOKEN || "";
    if (!expected || supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) {
      return json({ error: "Bad or missing relay token." }, 401, env);
    }

    // Forward verbatim. Body is streamed through untouched so multipart audio
    // uploads and SSE responses both work without buffering.
    const upstreamReq = new Request(UPSTREAM + url.pathname + url.search, {
      method: request.method,
      headers: (() => {
        const h = new Headers();
        const ct = request.headers.get("content-type");
        if (ct) h.set("content-type", ct);
        const accept = request.headers.get("accept");
        if (accept) h.set("accept", accept);
        h.set("authorization", `Bearer ${env.XAI_API_KEY}`);
        return h;
      })(),
      body: request.method === "GET" || request.method === "HEAD" ? undefined : request.body,
    });

    let upstream;
    try {
      upstream = await fetch(upstreamReq);
    } catch (err) {
      return json({ error: "Upstream fetch failed: " + String(err) }, 502, env);
    }

    // Pass the body through as a stream so SSE arrives token-by-token and audio
    // arrives as bytes. Never buffer: a long TTS clip would blow the memory cap.
    const headers = new Headers(upstream.headers);
    for (const [k, v] of Object.entries(cors)) headers.set(k, v);
    headers.delete("content-encoding");

    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers,
    });
  },
};

function timingSafeEqual(a, b) {
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
