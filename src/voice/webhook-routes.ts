/**
 * HTTP webhook routes for Twilio voice integration.
 *
 * - /outbound-call-twiml — Returns TwiML to connect the call to a media stream
 * - /call-status — Receives call status callbacks
 */

import type { IncomingMessage, ServerResponse } from "http";
import { getPrompt } from "./prompt-store.js";
import { updateCallStatus } from "./call-tracker.js";

/**
 * Handle the TwiML webhook for outbound calls.
 * Retrieves the prompt from the in-memory store by ID,
 * then returns TwiML that opens a bidirectional media stream.
 */
export function handleTwimlRequest(
  req: IncomingMessage,
  res: ServerResponse,
  webhookBaseUrl: string,
): void {
  const url = new URL(req.url ?? "", `http://${req.headers.host}`);
  const promptId = url.searchParams.get("prompt_id") ?? "";

  // Convert https:// to wss:// for the WebSocket URL
  const wsUrl = webhookBaseUrl.replace(/^https?:\/\//, "wss://");

  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect>
    <Stream url="${wsUrl}/outbound-media-stream">
      <Parameter name="prompt_id" value="${escapeXml(promptId)}" />
    </Stream>
  </Connect>
</Response>`;

  console.log(`[TwiML] Serving stream TwiML for prompt_id=${promptId}`);
  res.writeHead(200, { "Content-Type": "text/xml" });
  res.end(twiml);
}

/**
 * Handle call status callbacks from Twilio.
 */
export function handleCallStatus(
  req: IncomingMessage,
  res: ServerResponse,
): void {
  let body = "";
  req.on("data", (chunk) => { body += chunk; });
  req.on("end", () => {
    const params = new URLSearchParams(body);
    const callSid = params.get("CallSid") ?? "";
    const callStatus = params.get("CallStatus") ?? "";
    const duration = params.get("CallDuration");
    console.log(`[Voice] Call status: SID=${callSid}, Status=${callStatus}, Duration=${duration ?? "N/A"}`);

    if (callSid) {
      updateCallStatus(callSid, callStatus, duration ? parseInt(duration, 10) : undefined);
    }

    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("OK");
  });
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
