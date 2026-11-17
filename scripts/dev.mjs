#!/usr/bin/env node
/* global clearTimeout, console, process, setTimeout */
/**
 * Parcel watch, then rewrite webview HTML after every successful build.
 * Entry scripts still need an IINA restart. Webviews reload from their context menu.
 */
import { spawn } from "node:child_process";
import { postProcessDistUi } from "./postprocess-webviews.mjs";

const parcel = spawn("pnpm", ["exec", "parcel", "watch"], {
  stdio: ["inherit", "pipe", "pipe"],
});

let timer;

function schedule() {
  clearTimeout(timer);
  timer = setTimeout(() => {
    postProcessDistUi().catch((error) => {
      console.error("[dev] Failed to post-process webviews:", error);
    });
  }, 50);
}

function forward(stream, chunk) {
  stream.write(chunk);
  if (chunk.toString().includes("Built")) schedule();
}

parcel.stdout.on("data", (chunk) => forward(process.stdout, chunk));
parcel.stderr.on("data", (chunk) => forward(process.stderr, chunk));

parcel.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 1);
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    parcel.kill(signal);
  });
}
