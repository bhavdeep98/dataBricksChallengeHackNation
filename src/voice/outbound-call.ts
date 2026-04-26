/**
 * Outbound call service using Twilio REST API + ElevenLabs Conversational AI.
 *
 * Architecture (based on https://github.com/Barty-Bart/elevenlabs-twilio-ai-caller):
 * 1. Twilio initiates an outbound call to the doctor's office
 * 2. When connected, Twilio streams audio via WebSocket to our server
 * 3. Our server bridges the Twilio media stream ↔ ElevenLabs Conversational AI
 * 4. ElevenLabs AI agent speaks to the office staff on behalf of the patient
 */

import type { CallResult, VoiceConfig, OutboundCallConfig } from "./types.js";
import { storePrompt } from "./prompt-store.js";

/**
 * Initiate an outbound call via Twilio that connects to an ElevenLabs AI agent.
 *
 * The call flow:
 * 1. POST to Twilio REST API to create a call
 * 2. Twilio fetches TwiML from our webhook URL
 * 3. TwiML instructs Twilio to open a <Stream> WebSocket
 * 4. Our WebSocket handler bridges Twilio ↔ ElevenLabs
 */
export async function initiateOutboundCall(
  config: VoiceConfig,
  callConfig: OutboundCallConfig,
): Promise<CallResult> {
  const { twilioAccountSid, twilioAuthToken } = config;

  // Store the prompt in memory and pass just the ID in the URL
  // (the full prompt is too long for URL query params)
  const promptId = storePrompt(callConfig.agentPrompt, callConfig.firstMessage);
  const twimlUrl = `${callConfig.webhookBaseUrl}/outbound-call-twiml?prompt_id=${promptId}`;

  try {
    // Use Twilio REST API directly (no SDK dependency needed)
    const url = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Calls.json`;
    const auth = Buffer.from(`${twilioAccountSid}:${twilioAuthToken}`).toString("base64");

    const body = new URLSearchParams({
      From: callConfig.fromNumber,
      To: callConfig.toNumber,
      Url: twimlUrl,
      StatusCallback: `${callConfig.webhookBaseUrl}/call-status`,
      StatusCallbackEvent: "initiated ringing answered completed",
    });

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      return {
        success: false,
        error: `Twilio API error (${response.status}): ${(errorBody as Record<string, string>).message ?? response.statusText}`,
      };
    }

    const data = (await response.json()) as { sid: string; status: string };
    return {
      success: true,
      callSid: data.sid,
      status: data.status,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error initiating call",
    };
  }
}

/**
 * Get a signed WebSocket URL from ElevenLabs for authenticated conversations.
 */
export async function getElevenLabsSignedUrl(
  apiKey: string,
  agentId: string,
): Promise<string> {
  const response = await fetch(
    `https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${agentId}`,
    {
      method: "GET",
      headers: { "xi-api-key": apiKey },
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to get ElevenLabs signed URL: ${response.statusText}`);
  }

  const data = (await response.json()) as { signed_url: string };
  return data.signed_url;
}
