/**
 * Watches the call tracker file for completed calls.
 * Outputs a message when a call reaches a terminal state.
 * Used by the Kiro hook to notify the agent.
 */

import { readFileSync, existsSync, watchFile } from "fs";
import { join } from "path";
import { tmpdir } from "os";

const CALLS_FILE = join(tmpdir(), "medsupport-prompts", "calls.json");

interface CallStatus {
  callSid: string;
  status: string;
  duration?: number;
  updatedAt: number;
}

const reportedCalls = new Set<string>();
const terminalStates = ["completed", "failed", "busy", "no-answer", "canceled"];

function checkCalls(): void {
  try {
    if (!existsSync(CALLS_FILE)) return;
    const store: Record<string, CallStatus> = JSON.parse(readFileSync(CALLS_FILE, "utf-8"));

    for (const [sid, call] of Object.entries(store)) {
      if (terminalStates.includes(call.status) && !reportedCalls.has(sid)) {
        reportedCalls.add(sid);

        if (call.status === "completed" && call.duration && call.duration > 15) {
          console.log(`CALL_COMPLETED|${sid}|${call.duration}s|The call with the doctor's office completed successfully after ${call.duration} seconds. Ask the patient if the appointment was confirmed or if they need to try the next provider.`);
        } else if (call.status === "completed") {
          console.log(`CALL_SHORT|${sid}|${call.duration ?? 0}s|The call ended quickly (${call.duration ?? 0}s) — the office may not have been able to help. Offer to try the next provider.`);
        } else {
          console.log(`CALL_FAILED|${sid}|${call.status}|The call ${call.status}. Offer to try the next provider on the list.`);
        }
      }
    }
  } catch {
    // File might be mid-write
  }
}

// Check immediately and then watch for changes
checkCalls();
watchFile(CALLS_FILE, { interval: 2000 }, () => {
  checkCalls();
});

// Also poll every 3 seconds as backup
setInterval(checkCalls, 3000);

// Keep alive for 5 minutes max
setTimeout(() => process.exit(0), 5 * 60 * 1000);
