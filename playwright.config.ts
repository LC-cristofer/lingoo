import { existsSync } from "node:fs";
import { defineConfig, devices } from "@playwright/test";

// Sandbox-only: use the preinstalled Chromium when the matching Playwright build is absent.
const sandboxChromium = process.env.PW_CHROMIUM_PATH ?? "/opt/pw-browsers/chromium";

export default defineConfig({
  testDir: "./e2e",
  timeout: 180_000,
  use: {
    ...devices["iPad (gen 7) landscape"],
    browserName: "chromium",
    trace: "off",
    // Infinite CSS animations (pulse/bob) make Playwright wait forever for "stable" elements.
    reducedMotion: "reduce",
    baseURL: "http://localhost:3100",
    launchOptions: existsSync(sandboxChromium) ? { executablePath: sandboxChromium } : {},
  },
  webServer: {
    command: "npm run build && npm start -- -p 3100",
    url: "http://localhost:3100",
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
  },
});
