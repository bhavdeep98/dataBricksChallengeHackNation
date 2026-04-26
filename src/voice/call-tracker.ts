/**
 * File-based call status tracker shared between MCP server and webhook server.
 * 
 * The webhook server updates call status when Twilio sends callbacks.
 * The MCP server polls for status to know when a call ended.
 */

import { writeFileSync, readFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

const STORE_DIR = join(tmpdir(), "medsupport-prompts");
const CALLS_FILE = join(STORE_DIR, "calls.json");

export interface CallStatus {
  callSid: string;
  status: "initiated" | "ringing" | "in-progress" | "completed" | "failed" | "busy" | "no-answer" | "canceled";
  duration?: number;
  updatedAt: number;
}

function ensureDir(): void {
  if (!existsSync(STORE_DIR)) {
    mkdirSync(STORE_DIR, { recursive: true });
  }
}

function readStore(): Record<string, CallStatus> {
  ensureDir();
  try {
    if (existsSync(CALLS_FILE)) {
      return JSON.parse(readFileSync(CALLS_FILE, "utf-8"));
    }
  } catch { /* start fresh */ }
  return {};
}

function writeStore(store: Record<string, CallStatus>): void {
  ensureDir();
  writeFileSync(CALLS_FILE, JSON.stringify(store), "utf-8");
}

export function updateCallStatus(callSid: string, status: string, duration?: number): void {
  const store = readStore();
  store[callSid] = {
    callSid,
    status: status as CallStatus["status"],
    duration,
    updatedAt: Date.now(),
  };
  // Clean old entries (> 10 min)
  const cutoff = Date.now() - 10 * 60 * 1000;
  for (const key of Object.keys(store)) {
    if (store[key].updatedAt < cutoff) delete store[key];
  }
  writeStore(store);
}

export function getCallStatus(callSid: string): CallStatus | null {
  const store = readStore();
  return store[callSid] ?? null;
}

/**
 * Wait for a call to reach a terminal state (completed, failed, busy, no-answer, canceled).
 * Polls every 2 seconds, times out after maxWaitMs.
 */
export async function waitForCallEnd(callSid: string, maxWaitMs: number = 120_000): Promise<CallStatus | null> {
  const terminalStates = ["completed", "failed", "busy", "no-answer", "canceled"];
  const start = Date.now();

  while (Date.now() - start < maxWaitMs) {
    const status = getCallStatus(callSid);
    if (status && terminalStates.includes(status.status)) {
      return status;
    }
    await new Promise((r) => setTimeout(r, 2000));
  }

  return getCallStatus(callSid);
}
