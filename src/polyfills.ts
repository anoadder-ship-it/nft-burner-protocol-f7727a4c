// FIRST import in main.tsx — sets up globals before any Solana code runs.

import { Buffer } from "buffer";

// Buffer
(globalThis as Record<string, unknown>).Buffer = Buffer;

// process — some bundled deps call process.env / process.browser at module init
if (!(globalThis as Record<string, unknown>).process) {
  (globalThis as Record<string, unknown>).process = {
    env: { NODE_ENV: "production" },
    browser: true,
    version: "",
    platform: "browser",
    nextTick: (fn: () => void) => setTimeout(fn, 0),
  };
}

export {};
