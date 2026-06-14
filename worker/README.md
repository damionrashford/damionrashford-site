# dr-contact — contact form Worker for damionrashford.com

Cloudflare Worker that receives the portfolio contact form and emails Damion via Resend.
Lives in `worker/` inside the site repo. It is source-only (no secrets); the deploy is separate from the GitHub Pages site.

## One-time deploy

```bash
cd ~/Projects/dr-site/worker
npm i -g wrangler            # if not installed
wrangler login              # opens browser, authorize Cloudflare

# get a Resend API key (free, 3k/mo): https://resend.com → API Keys
wrangler secret put RESEND_API_KEY   # paste the key when prompted

wrangler deploy             # prints the live URL, e.g. https://dr-contact.<you>.workers.dev
```

## Wire the site

Copy the deployed URL and replace `REPLACE_WITH_WORKER_URL` in
`~/Projects/dr-site/index.html` (the `FORM_ENDPOINT` const), then commit + push.

## Notes

- Until you verify `damionrashford.com` in Resend, the `from` stays `onboarding@resend.dev`
  (Resend's test sender — delivers to your own account email). Verify the domain in Resend
  (adds a few DNS records at GoDaddy) to send from `hello@damionrashford.com`.
- `reply_to` is set to the sender's email, so you can reply straight from your inbox.
- CORS is locked to `https://damionrashford.com`; the honeypot field blocks basic bots.
