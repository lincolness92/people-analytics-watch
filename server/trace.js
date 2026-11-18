// Tracing for the serving side, vendor-neutral: OpenTelemetry spans with OpenInference attributes (the
// conventions Arize Phoenix reads natively; Langfuse and other OTLP backends read them too), exported as
// OTLP/HTTP protobuf with a tiny dependency-free encoder (the Workers runtime cannot run the OTel Node SDK,
// and Phoenix's HTTP endpoint wants protobuf). Every trace is also returned as plain JSON so the caller can
// keep it (KV), which means no trace is lost when the backend is down or not configured.
//
// Configuration (Pages secrets/variables), standard OTel names:
//   OTEL_EXPORTER_OTLP_TRACES_ENDPOINT   e.g. https://app.phoenix.arize.com/s/<space>/v1/traces
//   OTEL_EXPORTER_OTLP_HEADERS           e.g. "api_key=<key>" or "Authorization=Bearer <key>" (comma-separated k=v)
//   OTEL_EXPORTER_OTLP_PROTOCOL          http/protobuf (default) or http/json
//   OTEL_SERVICE_NAME                    default "research-watch"; PHOENIX_PROJECT_NAME sets the Phoenix project

const hex = (bytes) => [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
const randomHex = (n) => hex(crypto.getRandomValues(new Uint8Array(n)));
const nowNs = () => BigInt(Date.now()) * 1000000n; // Workers clocks advance per I/O; ms precision is what we get

export const KIND = { CHAIN: "CHAIN", LLM: "LLM", RETRIEVER: "RETRIEVER", TOOL: "TOOL", AGENT: "AGENT" };
const MAX_ATTR = 8000; // keep single attribute values bounded (prompts, documents)

export class Tracer {
  constructor(resource = {}) {
    this.traceId = randomHex(16);
    this.resource = resource;
    this.spans = [];
  }

  /** Start a span; returns {set(k,v), setMany(obj), error(e), end()}. */
  start(name, kind, attrs = {}, parent = null) {
    const span = { name, kind, spanId: randomHex(8), parentId: parent?.spanId || null, start: nowNs(), end: null,
      attrs: { "openinference.span.kind": kind, ...attrs }, status: { code: 0 } };
    this.spans.push(span);
    const api = {
      spanId: span.spanId,
      set: (k, v) => { if (v !== undefined && v !== null) span.attrs[k] = typeof v === "string" ? v.slice(0, MAX_ATTR) : v; return api; },
      setMany: (o) => { for (const [k, v] of Object.entries(o || {})) api.set(k, v); return api; },
      error: (e) => { span.status = { code: 2, message: String(e?.message || e).slice(0, 500) }; return api; },
      end: () => { if (!span.end) { span.end = nowNs(); if (!span.status.code) span.status = { code: 1 }; } return api; },
    };
    return api;
  }

  /** Run fn inside a span, ending it (and marking errors) whatever happens. */
  async span(name, kind, attrs, parent, fn) {
    const s = this.start(name, kind, attrs, parent);
    try {
      const out = await fn(s);
      return out;
    } catch (e) {
      s.error(e);
      throw e;
    } finally {
      s.end();
    }
  }

  /** Plain JSON for storage (KV) — durations in ms. */
  toJSON() {
    const t0 = this.spans.length ? this.spans[0].start : 0n;
    return {
      trace_id: this.traceId,
      spans: this.spans.map((s) => ({ name: s.name, kind: s.kind, span_id: s.spanId, parent_id: s.parentId,
        start_ms: Number((s.start - t0) / 1000000n), duration_ms: s.end ? Number((s.end - s.start) / 1000000n) : null,
        status: s.status.code === 2 ? `error: ${s.status.message}` : "ok", attrs: s.attrs })),
    };
  }
}

// ---------- OTLP export ----------

function parseHeaders(raw) {
  const out = {};
  for (const part of String(raw || "").split(",")) {
    const i = part.indexOf("=");
    if (i > 0) out[decodeURIComponent(part.slice(0, i).trim())] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

export function otlpConfig(env) {
  const endpoint = env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT ||
    (env.OTEL_EXPORTER_OTLP_ENDPOINT ? env.OTEL_EXPORTER_OTLP_ENDPOINT.replace(/\/$/, "") + "/v1/traces" : "");
  if (!endpoint) return null;
  return { endpoint, headers: parseHeaders(env.OTEL_EXPORTER_OTLP_HEADERS),
    json: (env.OTEL_EXPORTER_OTLP_PROTOCOL || "").includes("json"),
    service: env.OTEL_SERVICE_NAME || "research-watch", project: env.PHOENIX_PROJECT_NAME || null };
}

/** Send a tracer's spans to the configured OTLP backend. Never throws; returns a short status string. */
export async function exportTrace(env, tracer, fetchImpl = fetch) {
  const cfg = otlpConfig(env);
  if (!cfg || !tracer.spans.length) return "sem backend";
  for (const s of tracer.spans) if (!s.end) s.end = nowNs();
  const resource = { "service.name": cfg.service, ...(cfg.project ? { "openinference.project.name": cfg.project } : {}), ...tracer.resource };
  try {
    const body = cfg.json ? JSON.stringify(otlpJson(tracer, resource)) : encodeTraces(tracer, resource);
    const r = await fetchImpl(cfg.endpoint, { method: "POST", body,
      headers: { "Content-Type": cfg.json ? "application/json" : "application/x-protobuf", ...cfg.headers } });
    return r.ok ? "ok" : `HTTP ${r.status}`;
  } catch (e) {
    return `falhou: ${String(e.message).slice(0, 80)}`;
  }
}

const anyValue = (v) => typeof v === "boolean" ? { boolValue: v } : typeof v === "number"
  ? (Number.isInteger(v) ? { intValue: String(v) } : { doubleValue: v }) : { stringValue: String(v) };

function otlpJson(tracer, resource) {
  return { resourceSpans: [{ resource: { attributes: Object.entries(resource).map(([key, v]) => ({ key, value: anyValue(v) })) },
    scopeSpans: [{ scope: { name: "research-watch" }, spans: tracer.spans.map((s) => ({
      traceId: tracer.traceId, spanId: s.spanId, ...(s.parentId ? { parentSpanId: s.parentId } : {}), name: s.name, kind: 1,
      startTimeUnixNano: String(s.start), endTimeUnixNano: String(s.end),
      attributes: Object.entries(s.attrs).map(([key, v]) => ({ key, value: anyValue(v) })),
      status: { code: s.status.code, ...(s.status.message ? { message: s.status.message } : {}) } })) }] }] };
}

// Minimal protobuf writer for opentelemetry.proto.collector.trace.v1.ExportTraceServiceRequest.
class PB {
  constructor() { this.b = []; }
  varint(n) { let v = BigInt(n); while (v > 127n) { this.b.push(Number((v & 127n) | 128n)); v >>= 7n; } this.b.push(Number(v)); return this; }
  tag(field, wire) { return this.varint((field << 3) | wire); }
  bytes(field, u8) { this.tag(field, 2).varint(u8.length); for (const x of u8) this.b.push(x); return this; }
  str(field, s) { return this.bytes(field, new TextEncoder().encode(s)); }
  msg(field, pb) { return this.bytes(field, Uint8Array.from(pb.b)); }
  fixed64(field, big) { this.tag(field, 1); let v = BigInt(big); for (let i = 0; i < 8; i++) { this.b.push(Number(v & 255n)); v >>= 8n; } return this; }
  double(field, x) { this.tag(field, 1); const dv = new DataView(new ArrayBuffer(8)); dv.setFloat64(0, x, true); for (let i = 0; i < 8; i++) this.b.push(dv.getUint8(i)); return this; }
  u8() { return Uint8Array.from(this.b); }
}
const hexBytes = (h) => Uint8Array.from(h.match(/../g).map((x) => parseInt(x, 16)));

function keyValue(key, v) {
  const val = new PB();
  if (typeof v === "boolean") val.tag(2, 0).varint(v ? 1 : 0);                 // AnyValue.bool_value = 2
  else if (typeof v === "number" && Number.isInteger(v)) val.tag(3, 0).varint(BigInt.asUintN(64, BigInt(v))); // int_value = 3
  else if (typeof v === "number") val.double(4, v);                              // double_value = 4
  else val.str(1, String(v));                                                    // string_value = 1
  return new PB().str(1, key).msg(2, val);                                       // KeyValue{key=1, value=2}
}

export function encodeTraces(tracer, resource) {
  const res = new PB();
  for (const [k, v] of Object.entries(resource)) res.msg(1, keyValue(k, v));    // Resource.attributes = 1
  const scope = new PB().str(1, "research-watch");                               // InstrumentationScope.name = 1
  const ss = new PB().msg(1, scope);                                             // ScopeSpans.scope = 1
  for (const s of tracer.spans) {
    const sp = new PB().bytes(1, hexBytes(tracer.traceId)).bytes(2, hexBytes(s.spanId)); // trace_id=1, span_id=2
    if (s.parentId) sp.bytes(4, hexBytes(s.parentId));                            // parent_span_id = 4
    sp.str(5, s.name).tag(6, 0).varint(1)                                         // name = 5, kind = 6 (INTERNAL)
      .fixed64(7, s.start).fixed64(8, s.end);                                     // start/end_time_unix_nano = 7/8
    for (const [k, v] of Object.entries(s.attrs)) sp.msg(9, keyValue(k, v));     // attributes = 9
    const st = new PB();
    if (s.status.message) st.str(2, s.status.message);                            // Status.message = 2
    st.tag(3, 0).varint(s.status.code);                                           // Status.code = 3
    sp.msg(15, st);                                                               // status = 15
    ss.msg(2, sp);                                                                // ScopeSpans.spans = 2
  }
  const rs = new PB().msg(1, res).msg(2, ss);                                    // ResourceSpans{resource=1, scope_spans=2}
  return new PB().msg(1, rs).u8();                                               // ExportTraceServiceRequest.resource_spans = 1
}
