/**
 * WebSocket handler that bridges Twilio Media Streams ↔ ElevenLabs Conversational AI.
 *
 * Flow:
 * 1. Twilio connects via WebSocket after the TwiML <Stream> instruction
 * 2. We open a second WebSocket to ElevenLabs Conversational AI (signed URL)
 * 3. Audio from Twilio (doctor's office) → forwarded to ElevenLabs
 * 4. Audio from ElevenLabs (AI agent response) → forwarded back to Twilio
 */

import { WebSocketServer, WebSocket } from "ws";
import type { IncomingMessage } from "http";
import type { Server as HttpServer } from "http";
import { getElevenLabsSignedUrl } from "./outbound-call.js";
import { getPrompt } from "./prompt-store.js";

interface MediaStreamState {
  streamSid: string | null;
  callSid: string | null;
  elevenLabsWs: WebSocket | null;
  promptId: string | null;
}

export function setupWebSocketHandler(
  server: HttpServer,
  elevenLabsApiKey: string,
  elevenLabsAgentId: string,
): void {
  const wss = new WebSocketServer({ noServer: true });

  server.on("upgrade", (request: IncomingMessage, socket, head) => {
    const pathname = new URL(request.url ?? "", `http://${request.headers.host}`).pathname;

    if (pathname === "/outbound-media-stream") {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request);
      });
    } else {
      socket.destroy();
    }
  });

  wss.on("connection", (ws: WebSocket) => {
    console.log("[Voice] Twilio connected to outbound media stream");

    const state: MediaStreamState = {
      streamSid: null,
      callSid: null,
      elevenLabsWs: null,
      promptId: null,
    };

    ws.on("error", (err) => console.error("[Voice] Twilio WS error:", err));

    // Handle messages from Twilio
    ws.on("message", (message: Buffer | string) => {
      try {
        const msg = JSON.parse(message.toString());

        switch (msg.event) {
          case "start":
            state.streamSid = msg.start.streamSid;
            state.callSid = msg.start.callSid;
            state.promptId = msg.start.customParameters?.prompt_id ?? null;
            console.log(`[Voice] Stream started — SID: ${state.streamSid}, Call: ${state.callSid}, Prompt: ${state.promptId}`);

            // Now that we have the prompt ID, set up ElevenLabs
            setupElevenLabsBridge(ws, state, elevenLabsApiKey, elevenLabsAgentId);
            break;

          case "media":
            if (state.elevenLabsWs?.readyState === WebSocket.OPEN) {
              const audioMessage = {
                user_audio_chunk: Buffer.from(msg.media.payload, "base64").toString("base64"),
              };
              state.elevenLabsWs.send(JSON.stringify(audioMessage));
            }
            break;

          case "stop":
            console.log(`[Voice] Stream ${state.streamSid} ended`);
            if (state.elevenLabsWs?.readyState === WebSocket.OPEN) {
              state.elevenLabsWs.close();
            }
            break;
        }
      } catch (error) {
        console.error("[Voice] Error processing Twilio message:", error);
      }
    });

    ws.on("close", () => {
      console.log("[Voice] Twilio client disconnected");
      if (state.elevenLabsWs?.readyState === WebSocket.OPEN) {
        state.elevenLabsWs.close();
      }
    });
  });
}

async function setupElevenLabsBridge(
  twilioWs: WebSocket,
  state: MediaStreamState,
  apiKey: string,
  agentId: string,
): Promise<void> {
  try {
    const signedUrl = await getElevenLabsSignedUrl(apiKey, agentId);
    state.elevenLabsWs = new WebSocket(signedUrl);

    state.elevenLabsWs.on("open", () => {
      console.log("[Voice] Connected to ElevenLabs Conversational AI");

      // Retrieve the stored prompt
      const stored = state.promptId ? getPrompt(state.promptId) : null;
      const prompt = stored?.prompt ?? "";
      const firstMessage = stored?.firstMessage ?? "";

      console.log(`[Voice] Using prompt_id=${state.promptId}, prompt length=${prompt.length}, firstMessage length=${firstMessage.length}`);

      // Send conversation initiation with dynamic overrides
      const initialConfig: Record<string, unknown> = {
        type: "conversation_initiation_client_data",
        conversation_config_override: {
          agent: {
            prompt: { prompt },
            first_message: firstMessage,
          },
        },
      };

      state.elevenLabsWs!.send(JSON.stringify(initialConfig));
    });

    state.elevenLabsWs.on("message", (data: Buffer | string) => {
      try {
        const message = JSON.parse(data.toString());

        switch (message.type) {
          case "conversation_initiation_metadata":
            console.log("[Voice] ElevenLabs conversation initiated");
            break;

          case "audio": {
            if (!state.streamSid) {
              console.log("[Voice] Got ElevenLabs audio but no streamSid yet");
              break;
            }
            const payload = message.audio?.chunk ?? message.audio_event?.audio_base_64;
            if (payload) {
              twilioWs.send(JSON.stringify({
                event: "media",
                streamSid: state.streamSid,
                media: { payload },
              }));
            }
            break;
          }

          case "interruption":
            if (state.streamSid) {
              twilioWs.send(JSON.stringify({ event: "clear", streamSid: state.streamSid }));
            }
            break;

          case "ping":
            if (message.ping_event?.event_id) {
              state.elevenLabsWs!.send(JSON.stringify({
                type: "pong",
                event_id: message.ping_event.event_id,
              }));
            }
            break;

          default:
            console.log(`[Voice] ElevenLabs message: ${message.type}`, JSON.stringify(message).slice(0, 200));
        }
      } catch (error) {
        console.error("[Voice] Error processing ElevenLabs message:", error);
      }
    });

    state.elevenLabsWs.on("error", (err) => console.error("[Voice] ElevenLabs WS error:", err));
    state.elevenLabsWs.on("close", (code: number, reason: Buffer) => {
      console.log(`[Voice] ElevenLabs disconnected — code: ${code}, reason: ${reason?.toString() ?? "none"}`);
    });
  } catch (error) {
    console.error("[Voice] Failed to set up ElevenLabs bridge:", error);
  }
}
