/**
 * Types for the Twilio + ElevenLabs voice call integration.
 */

export interface OutboundCallConfig {
  /** Phone number to call (the doctor's office) */
  toNumber: string;
  /** Twilio phone number to call from */
  fromNumber: string;
  /** The prompt/context for the ElevenLabs AI agent */
  agentPrompt: string;
  /** First message the AI agent says when the call connects */
  firstMessage: string;
  /** Webhook base URL for TwiML (e.g. https://your-server.ngrok.io) */
  webhookBaseUrl: string;
}

export interface CallResult {
  success: boolean;
  callSid?: string;
  status?: string;
  error?: string;
}

export interface VoiceConfig {
  twilioAccountSid: string;
  twilioAuthToken: string;
  twilioPhoneNumber: string;
  twilioApiKeySid?: string;
  twilioApiKeySecret?: string;
  twilioTwimlAppSid?: string;
  elevenLabsApiKey: string;
  elevenLabsAgentId: string;
  /** Required only for ElevenLabs native SIP trunk outbound calls */
  elevenLabsPhoneNumberId?: string;
  /** HMAC secret for verifying ElevenLabs post-call webhook signatures */
  elevenLabsWebhookSecret?: string;
  webhookBaseUrl: string;
}
