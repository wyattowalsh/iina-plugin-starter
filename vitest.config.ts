import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: "entry",
          environment: "node",
          include: ["src/**/*.entry.test.ts", "src/playlist.test.ts", "scripts/**/*.test.ts"],
          setupFiles: ["src/__mocks__/iina-entry.ts"],
        },
      },
      {
        test: {
          name: "ui",
          environment: "jsdom",
          include: ["src/bridge.test.ts", "src/utils.test.ts"],
          setupFiles: ["src/__mocks__/iina-webview.ts"],
        },
      },
    ],
  },
});
