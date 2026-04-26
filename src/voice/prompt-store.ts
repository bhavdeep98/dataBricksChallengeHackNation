/**
 * File-based prompt store shared between MCP server and webhook server.
 * 
 * The MCP server stores prompts here, the webhook server reads them.
 * Uses a simple JSON file in the OS temp directory.
 */

import { writeFileSync, readFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

const STORE_DIR = join(tmpdir(), "medsupport-prompts");
const STORE_FILE = join(STORE_DIR, "prompts.json");

interface PromptEntry {
  prompt: string;
  firstMessage: string;
  createdAt: number;
}

function ensureDir(): void {
  if (!existsSync(STORE_DIR)) {
    mkdirSync(STORE_DIR, { recursive: true });
  }
}

function readStore(): Record<string, PromptEntry> {
  ensureDir();
  try {
    if (existsSync(STORE_FILE)) {
      return JSON.parse(readFileSync(STORE_FILE, "utf-8"));
    }
  } catch {
    // Corrupted file, start fresh
  }
  return {};
}

function writeStore(store: Record<string, PromptEntry>): void {
  ensureDir();
  writeFileSync(STORE_FILE, JSON.stringify(store), "utf-8");
}

let counter = 0;

export function storePrompt(prompt: string, firstMessage: string): string {
  const id = `p_${Date.now()}_${++counter}`;
  const store = readStore();

  // Clean up entries older than 5 minutes
  const cutoff = Date.now() - 5 * 60 * 1000;
  for (const key of Object.keys(store)) {
    if (store[key].createdAt < cutoff) delete store[key];
  }

  store[id] = { prompt, firstMessage, createdAt: Date.now() };
  writeStore(store);
  return id;
}

export function getPrompt(id: string): { prompt: string; firstMessage: string } | null {
  const store = readStore();
  return store[id] ?? null;
}
