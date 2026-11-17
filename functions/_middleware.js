// Single shared password for the whole site (Cloudflare Pages Functions middleware).
// The password lives in the Pages secret SITE_PASSWORD; the cookie holds a hash of it, so
// changing the password logs everyone out. Without the secret the site stays closed.

const COOKIE = "paw_auth";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days
const LOGIN_PATH = "/__login";

async function sha256Hex(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function readCookie(request, name) {
  const header = request.headers.get("Cookie") || "";
  for (const part of header.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return v.join("=");
  }
  return "";
}

function safeNext(value) {
  // only same-site relative paths, never //host or absolute URLs
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//") ? value : "/";
}

function page(message, next, status) {
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const html = `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Research Watch</title><meta name="robots" content="noindex, nofollow">
<style>
  :root { --bg:#f7f5f0; --surface:#fff; --ink:#1d1b18; --muted:#807a70; --line:#e4dfd5; --accent:#b4431f; color-scheme: light; }
  @media (prefers-color-scheme: dark) { :root { --bg:#161513; --surface:#1f1d1a; --ink:#ece8e1; --muted:#8f897f; --line:#34312c; --accent:#ec8a63; color-scheme: dark; } }
  * { box-sizing: border-box; }
  body { margin:0; min-height:100vh; display:grid; place-items:center; background:var(--bg); color:var(--ink);
         font:16px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Roboto, sans-serif; padding:16px; }
  form { width:100%; max-width:360px; background:var(--surface); border:1px solid var(--line); border-radius:14px; padding:28px 24px; }
  h1 { font-family:"Iowan Old Style", Charter, Georgia, serif; font-size:24px; margin:0 0 4px; }
  h1 em { color:var(--accent); }
  p { color:var(--muted); margin:0 0 18px; font-size:14px; }
  input { width:100%; font:inherit; padding:11px 13px; border:1px solid var(--line); border-radius:10px; background:var(--bg); color:var(--ink); }
  button { width:100%; margin-top:12px; font:inherit; font-weight:600; padding:11px; border:0; border-radius:10px; background:var(--ink); color:var(--bg); cursor:pointer; }
  .err { color:var(--accent); font-size:14px; margin:10px 0 0; }
</style></head>
<body><form method="post" action="${LOGIN_PATH}">
  <h1>📡 Research <em>Watch</em></h1>
  <p>Acesso restrito. Digite a senha que você recebeu.</p>
  <input type="hidden" name="next" value="${esc(next)}">
  <input type="password" name="password" placeholder="Senha" autocomplete="current-password" required autofocus>
  <button type="submit">Entrar</button>
  ${message ? `<p class="err">${esc(message)}</p>` : ""}
</form></body></html>`;
  return new Response(html, {
    status,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "X-Robots-Tag": "noindex" },
  });
}

export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);
  const password = env.SITE_PASSWORD;
  if (!password) {
    return new Response("Site fechado: a senha (SITE_PASSWORD) ainda não foi configurada.", {
      status: 503, headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
    });
  }
  const token = await sha256Hex(`paw-v1:${password}`);

  if (url.pathname === LOGIN_PATH && request.method === "POST") {
    const form = await request.formData();
    const target = safeNext(form.get("next"));
    const given = await sha256Hex(`paw-v1:${form.get("password") || ""}`);
    if (!timingSafeEqual(given, token)) return page("Senha incorreta.", target, 401);
    return new Response(null, {
      status: 303,
      headers: {
        Location: target,
        "Set-Cookie": `${COOKIE}=${token}; Path=/; Max-Age=${MAX_AGE}; HttpOnly; Secure; SameSite=Lax`,
        "Cache-Control": "no-store",
      },
    });
  }

  if (timingSafeEqual(readCookie(request, COOKIE), token)) {
    const res = await next();
    const out = new Response(res.body, res);
    out.headers.set("Cache-Control", "private, no-cache");
    out.headers.set("X-Robots-Tag", "noindex");
    return out;
  }
  return page("", url.pathname + url.search, 401);
}
