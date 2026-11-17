import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("init and dev-reload", () => {
  it("exits 1 when stdin is not a TTY", () => {
    const result = spawnSync("node", ["scripts/init.mjs"], {
      stdio: "pipe",
      encoding: "utf8",
    });
    expect(result.status).toBe(1);
  });

  it("prints the webview Reload hint and does not call osascript", () => {
    const source = readFileSync(resolve("scripts/dev-reload.mjs"), "utf8");
    expect(source).not.toMatch(/osascript/i);

    const result = spawnSync("node", ["scripts/dev-reload.mjs"], {
      stdio: "pipe",
      encoding: "utf8",
    });
    expect(result.status).toBe(0);
    expect(result.stdout).toMatch(/Reload/);
  });
});
