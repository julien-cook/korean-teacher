# xAI relay

A ~90-line Cloudflare Worker that sits between the homework helper and `api.x.ai`.

## Why it exists

Two reasons, and the second matters more than the first.

1. **CORS.** `api.x.ai` does not send `Access-Control-*` headers on `/v1/chat/completions`, so a browser cannot call it directly. The Worker adds them.
2. **Your key never enters the browser.** The Worker holds `XAI_API_KEY` as a secret. The app authenticates to the *Worker* with a `RELAY_TOKEN` instead. If that token ever leaks, someone can burn your quota — they cannot take your key, and you rotate it with one command.

This matches xAI's own guidance: their cookbook says long-lived keys don't belong in client-side code.

## Deploy

```bash
npm install -g wrangler
wrangler login

cd relay
wrangler deploy

# Your xAI key — paste when prompted. Never appears in the repo.
wrangler secret put XAI_API_KEY

# Any long random string. Generate one:
#   node -e "console.log(crypto.randomUUID()+crypto.randomUUID())"
wrangler secret put RELAY_TOKEN
```

`wrangler deploy` prints a URL like `https://korean-teacher-relay.<you>.workers.dev`. Paste that URL and your `RELAY_TOKEN` into the homework helper's setup panel.

## Lock it to your own site (recommended)

By default the Worker accepts any origin. Once it's working, restrict it — add to `wrangler.toml`:

```toml
[vars]
ALLOWED_ORIGIN = "https://julien-cook.github.io"
```

Then `wrangler deploy` again.

## Check it

```bash
# Should print {"ok":true,"hasKey":true}
curl https://YOUR-WORKER.workers.dev/health

# Should print a 401 — proves the token check works
curl -X POST https://YOUR-WORKER.workers.dev/v1/chat/completions \
  -H "content-type: application/json" -H "x-relay-token: wrong" \
  -d '{"model":"grok-4.5","messages":[{"role":"user","content":"hi"}]}'

# Should return a completion
curl -X POST https://YOUR-WORKER.workers.dev/v1/chat/completions \
  -H "content-type: application/json" -H "x-relay-token: YOUR_TOKEN" \
  -d '{"model":"grok-4.5","messages":[{"role":"user","content":"say hi"}]}'
```

## Notes

- Only `/v1/chat/completions`, `/v1/stt`, `/v1/tts` and `/v1/tts/voices` are proxied. An open relay would let anyone spend the key on any endpoint.
- Request and response bodies are streamed, not buffered, so SSE arrives token-by-token and audio arrives as bytes without hitting the Worker memory limit.
- Free tier is 100k requests/day — far beyond one person's weekly homework.
