// /oauth/authorize — consent screen of the OAuth flow. It sits behind the site password (functions/_middleware.js):
// a reader who is not logged in sees the login page first and comes back here. GET shows the consent screen;
// POST (same-site form, the login cookie is SameSite=Lax) approves or denies and redirects to the client.
import { checkAuthorizeRequest, issueCode } from "../../server/oauth.js";

const FIELDS = ["response_type", "client_id", "redirect_uri", "code_challenge", "code_challenge_method", "state", "scope", "resource"];
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function page(body, status = 200) {
  return new Response(`<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Autorizar acesso · Research Watch</title><meta name="robots" content="noindex, nofollow">
<style>
  :root { --bg:#f7f5f0; --surface:#fff; --ink:#1d1b18; --muted:#807a70; --line:#e4dfd5; --accent:#b4431f; color-scheme: light; }
  @media (prefers-color-scheme: dark) { :root { --bg:#161513; --surface:#1f1d1a; --ink:#ece8e1; --muted:#8f897f; --line:#34312c; --accent:#ec8a63; color-scheme: dark; } }
  * { box-sizing: border-box; }
  body { margin:0; min-height:100vh; display:grid; place-items:center; background:var(--bg); color:var(--ink);
         font:16px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Roboto, sans-serif; padding:16px; }
  .box { width:100%; max-width:400px; background:var(--surface); border:1px solid var(--line); border-radius:14px; padding:28px 24px; }
  h1 { font-family:"Iowan Old Style", Charter, Georgia, serif; font-size:22px; margin:0 0 10px; }
  p, li { color:var(--muted); font-size:14px; margin:0 0 10px; } ul { padding-left:18px; margin:0 0 16px; }
  b { color:var(--ink); } .row { display:flex; gap:10px; margin-top:8px; }
  button { flex:1; font:inherit; font-weight:600; padding:11px; border-radius:10px; cursor:pointer; border:1px solid var(--line); background:var(--bg); color:var(--ink); }
  button.ok { border:0; background:var(--ink); color:var(--bg); }
  .err { color:var(--accent); }
</style></head><body><div class="box">${body}</div></body></html>`,
  { status, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "X-Frame-Options": "DENY",
    "Content-Security-Policy": "frame-ancestors 'none'" } });
}

function redirect(uri, params) {
  const u = new URL(uri);
  for (const [k, v] of Object.entries(params)) if (v) u.searchParams.set(k, v);
  return Response.redirect(u.toString(), 302);
}

async function validate(env, q, origin) {
  const v = await checkAuthorizeRequest(env, q, origin);
  if (v.error && !v.redirect) return { response: page(`<h1>Não foi possível autorizar</h1><p class="err">${esc(v.error)}</p>`, 400) };
  if (v.error) return { response: redirect(q.redirect_uri, { error: "invalid_request", error_description: v.error, state: q.state }) };
  return v;
}

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const q = Object.fromEntries(FIELDS.map((k) => [k, url.searchParams.get(k) || ""]));
  const v = await validate(env, q, url.origin);
  if (v.response) return v.response;
  const host = new URL(q.redirect_uri).host;
  return page(`<h1>Autorizar acesso ao arquivo?</h1>
    <p><b>${esc(v.client.n)}</b> quer acessar o Research Watch em seu nome.</p>
    <ul><li>Ler os digests, a Evolução, as retrospectivas e a biblioteca de papers de todos os temas.</li>
    <li>Fazer perguntas ao agente do arquivo (até 40 por dia).</li>
    <li>Não pode alterar nada. O acesso vale 30 dias e é renovado enquanto o cliente usar.</li></ul>
    <p>Depois de autorizar, você volta para <b>${esc(host)}</b>.</p>
    <form method="post" action="/oauth/authorize">
      ${FIELDS.map((k) => `<input type="hidden" name="${k}" value="${esc(q[k])}">`).join("")}
      <div class="row"><button type="submit" name="decision" value="deny">Negar</button>
      <button class="ok" type="submit" name="decision" value="allow">Autorizar</button></div>
    </form>`);
}

export async function onRequestPost({ request, env }) {
  const url = new URL(request.url);
  const form = await request.formData();
  const q = Object.fromEntries(FIELDS.map((k) => [k, String(form.get(k) || "")]));
  const v = await validate(env, q, url.origin);
  if (v.response) return v.response;
  if (form.get("decision") !== "allow") return redirect(q.redirect_uri, { error: "access_denied", state: q.state });
  return redirect(q.redirect_uri, { code: await issueCode(env, v.params), state: q.state, iss: url.origin });
}
