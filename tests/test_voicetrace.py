import json
import sys
import tempfile
import unittest
from pathlib import Path
from unittest import mock

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "src"))

from pawatch import trace, voicetrace  # noqa: E402

CONV = {
    "conversation_id": "conv_1", "agent_id": "agent_x", "status": "done", "user_message_count": 1, "agent_message_count": 2,
    "metadata": {"start_time_unix_secs": 1795674983, "call_duration_secs": 40, "cost": 300, "termination_reason": "Client disconnected",
                 "charging": {"llm_price": 0.01, "call_charge": 280, "llm_charge": 20, "platform_price": 0.05,
                              "tts_usage": {"primary_tts_model": "eleven_v4_turbo", "total_characters": 120, "total_audio_output_seconds": 9.5},
                              "asr_usage": {"asr_model": "scribe_v3_live", "total_audio_input_seconds": 6.2}}},
    "analysis": {"call_successful": "success", "transcript_summary": "Pessoa perguntou sobre Pix."},
    "conversation_initiation_client_data": {"dynamic_variables": {"tema": "Bank Fraud Watch"}},
    "transcript": [
        {"role": "agent", "message": "Oi!", "time_in_call_secs": 0,
         "conversation_turn_metrics": {"metrics": {"convai_tts_service_ttfb": {"elapsed_time": 0.07}}}},
        {"role": "user", "message": "O que mudou no Pix?", "time_in_call_secs": 3},
        {"role": "agent", "message": "", "time_in_call_secs": 6, "tool_calls": [
            {"request_id": "r1", "tool_name": "consultar_acervo", "params_as_json": "{\"pergunta\": \"O que mudou no Pix?\"}"}]},
        {"role": "agent", "message": None, "time_in_call_secs": 18, "tool_results": [
            {"request_id": "r1", "tool_name": "consultar_acervo", "result_value": "Resposta…", "is_error": "False", "tool_latency_secs": "11.5"}]},
        {"role": "agent", "message": "Olha, o MED 2.0…", "time_in_call_secs": 19},
    ],
}


class VoiceTraceTest(unittest.TestCase):
    def test_conversation_becomes_a_trace(self):
        t = voicetrace.to_trace(CONV)
        root = t["spans"][0]
        self.assertEqual(root["name"], "voz:conversa")
        self.assertIsNone(root["parent_id"])
        self.assertEqual(root["duration_ms"], 40_000)
        self.assertEqual(root["attrs"]["voice.credits"], 300)
        self.assertEqual(root["attrs"]["voice.topic"], "Bank Fraud Watch")
        self.assertIn("pessoa: O que mudou no Pix?", root["attrs"]["input.value"])
        self.assertEqual(t["resource"]["elevenlabs.conversation_id"], "conv_1")
        tool = next(s for s in t["spans"] if s["kind"] == "TOOL")
        self.assertEqual(tool["attrs"]["input.value"], "O que mudou no Pix?")
        self.assertEqual(tool["duration_ms"], 11_500)
        self.assertEqual(tool["status"], "ok")
        self.assertTrue(all(s["parent_id"] == root["span_id"] for s in t["spans"][1:]))
        self.assertEqual(voicetrace.to_trace(CONV)["trace_id"], t["trace_id"])  # stable: re-sync never duplicates in Phoenix
        trace.encode(t, {"service.name": "x"})  # encodes as OTLP protobuf

    def test_sync_stores_new_conversations_once(self):
        calls = []

        def opener(req, timeout=30):
            calls.append(req.full_url)
            body = {"conversations": [{"conversation_id": "conv_1", "status": "done"},
                                      {"conversation_id": "conv_live", "status": "in-progress"}], "has_more": False} \
                if "/conversations?" in req.full_url else CONV
            r = mock.MagicMock()
            r.__enter__.return_value.read.return_value = json.dumps(body).encode()
            return r

        with tempfile.TemporaryDirectory() as d, mock.patch.object(trace, "TRACES", Path(d)):
            env = {"ELEVENLABS_API_KEY": "k", "ELEVENLABS_AGENT_ID": "agent_x"}
            self.assertEqual(voicetrace.sync(env, opener, log=None), "1 conversa(s) nova(s)")
            self.assertEqual(voicetrace.sync(env, opener, log=None), "0 conversa(s) nova(s)")
            self.assertEqual(sorted(p.name for p in Path(d).iterdir()), ["2026-11-26-voz.jsonl.gz"])
            self.assertEqual(sum(1 for u in calls if u.endswith("/conversations/conv_1")), 1)
        self.assertEqual(voicetrace.sync({}, opener, log=None), "sem ELEVENLABS_API_KEY/ELEVENLABS_AGENT_ID")


if __name__ == "__main__":
    unittest.main()
