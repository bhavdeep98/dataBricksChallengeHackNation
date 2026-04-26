/**
 * Standalone webhook server for Twilio + ElevenLabs voice integration.
 *
 * Handles:
 * - POST /outbound-call-twiml — TwiML for Twilio <Connect><Stream>
 * - POST /call-status — Twilio call status callbacks
 * - POST /elevenlabs-webhook — ElevenLabs post-call webhook (transcript + summary)
 * - WS /outbound-media-stream — Bridges Twilio ↔ ElevenLabs audio
 */

import "dotenv/config";
import { createServer } from "http";
import type { IncomingMessage, ServerResponse } from "http";
import { handleTwimlRequest, handleCallStatus } from "./webhook-routes.js";
import { setupWebSocketHandler } from "./websocket-handler.js";
import { saveCallSummary } from "./call-summary-store.js";

const PORT = parseInt(process.env.VOICE_WEBHOOK_PORT ?? "3001", 10);
const WEBHOOK_BASE_URL = process.env.VOICE_WEBHOOK_BASE_URL ?? `http://localhost:${PORT}`;
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_AGENT_ID = process.env.ELEVENLABS_AGENT_ID;
const ELEVENLABS_WEBHOOK_SECRET = process.env.ELEVENLABS_WEBHOOK_SECRET;

if (!ELEVENLABS_API_KEY || !ELEVENLABS_AGENT_ID) {
  console.error("❌ Missing ELEVENLABS_API_KEY or ELEVENLABS_AGENT_ID in .env");
  process.exit(1);
}

import { createHmac } from "crypto";

function verifyElevenLabsSignature(body: string, signatureHeader: string | undefined): boolean {
  if (!ELEVENLABS_WEBHOOK_SECRET || !signatureHeader) {
    console.log("[ElevenLabs Webhook] Skipping signature verification (no secret or no header)");
    return true;
  }

  try {
    // ElevenLabs sends: t=<timestamp>,v0=<hash>
    const parts = signatureHeader.split(",");
    const timestamp = parts.find(p => p.startsWith("t="))?.slice(2);
    const signature = parts.find(p => p.startsWith("v0="))?.slice(3);

    if (!timestamp || !signature) {
      console.log("[ElevenLabs Webhook] Signature header malformed:", signatureHeader);
      return false;
    }

    const signedPayload = `${timestamp}.${body}`;
    const expectedSignature = createHmac("sha256", ELEVENLABS_WEBHOOK_SECRET)
      .update(signedPayload)
      .digest("hex");

    const valid = signature === expectedSignature;
    if (!valid) {
      console.log("[ElevenLabs Webhook] Signature mismatch. Expected:", expectedSignature.slice(0, 20), "Got:", signature.slice(0, 20));
    }
    return valid;
  } catch (err) {
    console.error("[ElevenLabs Webhook] Signature verification error:", err);
    return false;
  }
}

function handleElevenLabsWebhook(req: IncomingMessage, res: ServerResponse): void {
  let body = "";
  req.on("data", (chunk) => { body += chunk; });
  req.on("end", () => {
    // Verify HMAC signature
    const sigHeader = req.headers["elevenlabs-signature"] as string | undefined;
    if (!verifyElevenLabsSignature(body, sigHeader)) {
      console.error("[ElevenLabs Webhook] Signature verification failed");
      res.writeHead(401, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Invalid signature" }));
      return;
    }

    try {
      const payload = JSON.parse(body);
      console.log(`[ElevenLabs Webhook] Received post-call data:`, JSON.stringify(payload).slice(0, 500));

      // ElevenLabs post-call webhook payload structure
      const conversationId = payload.data?.conversation_id ?? payload.conversation_id ?? "unknown";
      const status = payload.data?.status ?? payload.status ?? "done";

      // Extract transcript
      let transcript = "";
      const transcriptData = payload.data?.transcript ?? payload.transcript;
      if (Array.isArray(transcriptData)) {
        transcript = transcriptData
          .map((t: { role: string; message: string }) => `${t.role}: ${t.message}`)
          .join("\n");
      } else if (typeof transcriptData === "string") {
        transcript = transcriptData;
      }

      // Extract summary from analysis or conversation_summary
      const summary =
        payload.data?.analysis?.call_successful !== undefined
          ? `Call ${payload.data.analysis.call_successful ? "successful" : "unsuccessful"}. ${payload.data.analysis.transcript_summary ?? ""}`
          : payload.data?.conversation_summary ?? payload.conversation_summary ?? "";

      const duration = payload.data?.metadata?.call_duration_secs ?? payload.call_duration_secs;

      saveCallSummary({
        conversationId,
        status: status === "done" ? "done" : "failed",
        transcript,
        summary,
        duration,
        receivedAt: Date.now(),
      });

      console.log(`[ElevenLabs Webhook] Summary saved: ${conversationId}, duration: ${duration}s`);
      console.log(`[ElevenLabs Webhook] Transcript preview: ${transcript.slice(0, 200)}`);
    } catch (error) {
      console.error("[ElevenLabs Webhook] Error processing payload:", error);
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok" }));
  });
}

const server = createServer((req, res) => {
  const url = new URL(req.url ?? "", `http://${req.headers.host}`);
  const pathname = url.pathname;

  console.log(`[Webhook] ${req.method} ${pathname}`);

  if (pathname === "/outbound-call-twiml") {
    handleTwimlRequest(req, res, WEBHOOK_BASE_URL);
  } else if (pathname === "/call-status") {
    handleCallStatus(req, res);
  } else if (pathname === "/elevenlabs-webhook") {
    handleElevenLabsWebhook(req, res);
  } else if (pathname === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok", port: PORT }));
  } else {
    res.writeHead(404);
    res.end("Not found");
  }
});

setupWebSocketHandler(server, ELEVENLABS_API_KEY, ELEVENLABS_AGENT_ID);

server.listen(PORT, () => {
  console.log(`\n🎙️  Voice webhook server running on port ${PORT}`);
  console.log(`   TwiML endpoint:      ${WEBHOOK_BASE_URL}/outbound-call-twiml`);
  console.log(`   WebSocket:           ${WEBHOOK_BASE_URL.replace(/^http/, "ws")}/outbound-media-stream`);
  console.log(`   Twilio status:       ${WEBHOOK_BASE_URL}/call-status`);
  console.log(`   ElevenLabs webhook:  ${WEBHOOK_BASE_URL}/elevenlabs-webhook`);
  console.log(`\n   Update your ElevenLabs agent post-call webhook URL to:`);
  console.log(`   ${WEBHOOK_BASE_URL}/elevenlabs-webhook\n`);
});
