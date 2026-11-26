"""Voice conversations (ElevenLabs agent) as traces, next to the pipeline and the Pergunte agent.

ElevenLabs keeps each conversation (transcript, per-turn latency, tool calls, credits); `sync()` pulls the finished
ones for the agent in ELEVENLABS_AGENT_ID and stores each as one trace in data/traces/<date>-voz.jsonl.gz, in the same
format as trace.py (OpenInference attributes), then sends it to the OTLP backend when one is configured.

Spans: an AGENT root per conversation (duration, credits, LLM cost, summary, the whole transcript), a CHAIN span per
user turn, an LLM span per agent turn (latency metrics, LLM tokens) and a TOOL span per consultar_acervo call (the
question sent, the archive's answer, tool latency). Each consultar_acervo call is also a normal /api/ask request,
traced on the serving side. Stdlib only; never raises from the network, returns a short report.
"""

import gzip
import hashlib
import json
import os
import urllib.parse
import urllib.request
from datetime import datetime, timezone

from . import trace

API = "https://api.elevenlabs.io/v1/convai"
NAME = "voz"


def _get(path, key, opener=urllib.request.urlopen, **params):
    url = f"{API}/{path}" + (f"?{urllib.parse.urlencode({k: v for k, v in params.items() if v is not None})}" if params else "")
    req = urllib.request.Request(url, headers={"xi-api-key": key, "Accept": "application/json"})
    with opener(req, timeout=30) as r:
        return json.loads(r.read().decode("utf-8"))


def _hex(seed, n):
    return hashlib.sha256(seed.encode("utf-8")).hexdigest()[:n]


def _f(v, default=0.0):
    try:
        return float(v)
    except (TypeError, ValueError):
        return default


def stored_ids():
    """Conversation ids already in data/traces/*-voz.jsonl.gz."""
    seen = set()
    for f in trace.TRACES.glob(f"*-{NAME}.jsonl.gz"):
        for t in trace.load(f):
            cid = (t.get("resource") or {}).get("elevenlabs.conversation_id")
            if cid:
                seen.add(cid)
    return seen


def to_trace(conv):
    """One ElevenLabs conversation (GET /convai/conversations/{id}) → a stored trace dict (trace.py's to_json shape)."""
    cid = conv["conversation_id"]
    meta = conv.get("metadata") or {}
    t0 = int(meta.get("start_time_unix_secs") or 0) * 1_000_000_000
    dur = _f(meta.get("call_duration_secs"))
    end = t0 + int(dur * 1e9)
    charging = meta.get("charging") or {}
    tts = charging.get("tts_usage") or {}
    asr = charging.get("asr_usage") or {}
    analysis = conv.get("analysis") or {}
    dyn = ((conv.get("conversation_initiation_client_data") or {}).get("dynamic_variables") or {})
    turns = conv.get("transcript") or []

    trace_id = _hex(f"elevenlabs:{cid}", 32)
    root_id = _hex(f"{cid}:root", 16)
    spans = []

    def add(name, kind, sid, start_ns, end_ns, attrs, parent=root_id, status="ok"):
        attrs = {"openinference.span.kind": kind, **{k: v for k, v in attrs.items() if v not in (None, "")}}
        for k, v in list(attrs.items()):
            if isinstance(v, (dict, list)):
                attrs[k] = json.dumps(v, ensure_ascii=False)
            if isinstance(attrs[k], str):
                attrs[k] = attrs[k][:trace.MAX_ATTR]
        spans.append({"name": name, "kind": kind, "span_id": sid, "parent_id": parent, "start_ns": start_ns, "end_ns": end_ns,
                      "start_ms": (start_ns - t0) // 1_000_000, "duration_ms": (end_ns - start_ns) // 1_000_000,
                      "status": status, "attrs": attrs})

    lines = []
    for i, tu in enumerate(turns):
        role = tu.get("role") or "?"
        msg = (tu.get("message") or "").strip()
        at = t0 + int(_f(tu.get("time_in_call_secs")) * 1e9)
        nxt = t0 + int(_f(turns[i + 1].get("time_in_call_secs")) * 1e9) if i + 1 < len(turns) else end
        nxt = max(nxt, at)
        metrics = {k: round(_f((v or {}).get("elapsed_time")), 3)
                   for k, v in (((tu.get("conversation_turn_metrics") or {}).get("metrics")) or {}).items()}
        if msg:
            lines.append(f"{'pessoa' if role == 'user' else 'agente'}: {msg}")
        sid = _hex(f"{cid}:{i}", 16)
        if role == "user":
            add("fala:pessoa", "CHAIN", sid, at, nxt, {"input.value": msg, "voice.interrupted": bool(tu.get("interrupted")),
                                                       **{f"voice.{k}": v for k, v in metrics.items()}})
        elif msg or not tu.get("tool_results"):
            usage = tu.get("llm_usage") or {}
            add("fala:agente", "LLM", sid, at, nxt, {"output.value": msg, "llm.model_name": tu.get("producing_llm") or None,
                                                     "voice.interrupted": bool(tu.get("interrupted")),
                                                     "llm.usage": usage or None, **{f"voice.{k}": v for k, v in metrics.items()}})
        calls = {c.get("request_id"): c for c in tu.get("tool_calls") or []}
        for j, c in enumerate(tu.get("tool_calls") or []):
            if not any(r.get("request_id") == c.get("request_id") for t2 in turns for r in t2.get("tool_results") or []):
                add(f"tool:{c.get('tool_name')}", "TOOL", _hex(f"{cid}:{i}:call:{j}", 16), at, nxt,
                    {"tool.name": c.get("tool_name"), "tool.parameters": c.get("params_as_json"), "input.value": c.get("params_as_json")},
                    status="error: sem resposta da ferramenta")
        for j, r in enumerate(tu.get("tool_results") or []):
            lat = _f(r.get("tool_latency_secs"))
            done = at
            start = max(t0, done - int(lat * 1e9))
            call = calls.get(r.get("request_id")) or next((c for t2 in turns for c in t2.get("tool_calls") or []
                                                         if c.get("request_id") == r.get("request_id")), {})
            err = str(r.get("is_error")).lower() == "true"
            params = call.get("params_as_json") or ""
            try:
                question = json.loads(params).get("pergunta") if params else None
            except ValueError:
                question = None
            add(f"tool:{r.get('tool_name')}", "TOOL", _hex(f"{cid}:{i}:tool:{j}", 16), start, max(done, start),
                {"tool.name": r.get("tool_name"), "tool.parameters": params, "input.value": question or params,
                 "output.value": r.get("result_value"), "tool.latency_s": round(lat, 2)},
                status=f"error: {r.get('raw_error_message') or r.get('error_type') or 'erro'}" if err else "ok")

    llm_usage = ((charging.get("llm_usage") or {}).get("irreversible_generation") or {}).get("model_usage") or {}
    root = {
        "voice.conversation_id": cid, "voice.agent_id": conv.get("agent_id"), "voice.topic": dyn.get("tema"),
        "voice.duration_s": dur, "voice.termination": meta.get("termination_reason"),
        "voice.credits": meta.get("cost"), "voice.credits.call": charging.get("call_charge"), "voice.credits.llm": charging.get("llm_charge"),
        "llm.cost.total": round(_f(charging.get("llm_price")), 6), "voice.platform_price_usd": round(_f(charging.get("platform_price")), 4),
        "voice.tts.model": tts.get("primary_tts_model"), "voice.tts.characters": tts.get("total_characters"),
        "voice.tts.audio_s": round(_f(tts.get("total_audio_output_seconds")), 1),
        "voice.asr.model": asr.get("asr_model"), "voice.asr.audio_s": round(_f(asr.get("total_audio_input_seconds")), 1),
        "voice.messages.user": conv.get("user_message_count"), "voice.messages.agent": conv.get("agent_message_count"),
        "voice.tool_calls": sum(len(tu.get("tool_calls") or []) for tu in turns),
        "voice.call_successful": analysis.get("call_successful"),
        "llm.models": sorted(llm_usage) or None,
        "input.value": "\n".join(lines), "output.value": analysis.get("transcript_summary"),
    }
    err = meta.get("error")
    add("voz:conversa", "AGENT", root_id, t0, end, root, parent=None, status=f"error: {err}" if err else "ok")
    spans.insert(0, spans.pop())  # root first, like trace.py
    return {"trace_id": trace_id, "name": NAME,
            "resource": {"deployment.environment": "voz", "elevenlabs.conversation_id": cid, "elevenlabs.agent_id": conv.get("agent_id")},
            "spans": spans}


def save(t, day):
    trace.TRACES.mkdir(parents=True, exist_ok=True)
    path = trace.TRACES / f"{day}-{NAME}.jsonl.gz"
    with gzip.open(path, "at", encoding="utf-8") as f:
        f.write(json.dumps(t, ensure_ascii=False) + "\n")
    return path


def sync(env=os.environ, opener=urllib.request.urlopen, log=print, limit=100):
    """Pull finished conversations not stored yet; save and export them. Returns a short status string."""
    key, agent = env.get("ELEVENLABS_API_KEY"), env.get("ELEVENLABS_AGENT_ID")
    if not key or not agent:
        return "sem ELEVENLABS_API_KEY/ELEVENLABS_AGENT_ID"
    seen = stored_ids()
    new, cursor = [], None
    try:
        while len(new) < limit:
            page = _get("conversations", key, opener, agent_id=agent, page_size=50, cursor=cursor)
            for c in page.get("conversations") or []:
                if c.get("conversation_id") not in seen and c.get("status") in ("done", "failed"):
                    new.append(c["conversation_id"])
            cursor = page.get("next_cursor")
            if not page.get("has_more") or not cursor:
                break
        saved = []
        for cid in reversed(new[:limit]):  # oldest first, so each day's file reads in order
            conv = _get(f"conversations/{cid}", key, opener)
            t = to_trace(conv)
            start = int((conv.get("metadata") or {}).get("start_time_unix_secs") or 0)
            day = datetime.fromtimestamp(start, timezone.utc).date().isoformat()
            save(t, day)
            status = trace.export(t, env)
            saved.append(cid)
            if log:
                log(f"voz: {cid} ({day}, {len(t['spans'])} spans) → data/traces/{day}-{NAME}.jsonl.gz; OTLP: {status}")
    except Exception as e:  # noqa: BLE001
        return f"falhou: {str(e)[:120]} ({len(new)} nova(s) encontrada(s))"
    return f"{len(saved)} conversa(s) nova(s)"
