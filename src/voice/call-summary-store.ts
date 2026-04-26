/**
 * File-based store for ElevenLabs post-call summaries.
 * The webhook server writes summaries here when ElevenLabs sends them.
 * The MCP server reads them via the nh-check-call tool.
 */

import { writeFileSync, readFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

const STORE_DIR = join(tmpdir(), "medsupport-prompts");
const SUMMARIES_FILE = join(STORE_DIR, "call-summaries.json");

export interface CallSummary {
  conversationId: string;
  status: "done" | "failed";
  transcript: string;
  summary: string;
  duration?: number;
  receivedAt: number;
}

function ensureDir(): void {
  if (!existsSync(STORE_DIR)) {
    mkdirSync(STORE_DIR, { recursive: true });
  }
}

function readStore(): Record<string, CallSummary> {
  ensureDir();
  try {
    if (existsSync(SUMMARIES_FILE)) {
      return JSON.parse(readFileSync(SUMMARIES_FILE, "utf-8"));
    }
  } catch { /* start fresh */ }
  return {};
}

function writeStore(store: Record<string, CallSummary>): void {
  ensureDir();
  writeFileSync(SUMMARIES_FILE, JSON.stringify(store), "utf-8");
}

export function saveCallSummary(summary: CallSummary): void {
  const store = readStore();
  store[summary.conversationId] = summary;
  // Clean old entries (> 30 min)
  const cutoff = Date.now() - 30 * 60 * 1000;
  for (const key of Object.keys(store)) {
    if (store[key].receivedAt < cutoff) delete store[key];
  }
  writeStore(store);
  console.log(`[Summary] Saved summary for conversation ${summary.conversationId}`);
}

export function getLatestSummary(): CallSummary | null {
  const store = readStore();
  const entries = Object.values(store).sort((a, b) => b.receivedAt - a.receivedAt);
  return entries[0] ?? null;
}

export function getSummaryByConversationId(id: string): CallSummary | null {
  const store = readStore();
  return store[id] ?? null;
}
