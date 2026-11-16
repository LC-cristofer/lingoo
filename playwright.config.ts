import { existsSync } from "node:fs";
import { defineConfig, devices } from "@playwright/test";

// Sandbox-only: use the preinstalled Chromium when the matching Playwright build is absent.
const sandboxChromium = process.env.PW_CHROMIUM_PATH ?? "/opt/pw-browsers/chromium";

// The phase 1 specs drive the old flow; they run on the tablet only until it is removed.
const PHASE_1_SPECS = ["**/smoke.spec.ts", "**/audio.spec.ts"];

export default defineConfig({
  testDir: "./e2e",
  timeout: 180_000,
  use: {
    browserName: "chromium",
    trace: "off",
    // Infinite CSS animations (pulse/bob) make Playwright wait forever for "stable" elements.
    reducedMotion: "reduce",
    baseURL: "http://localhost:3100",
    launchOptions: existsSync(sandboxChromium) ? { executablePath: sandboxChromium } : {},
  },
  projects: [
    {
      name: "phone",
      testIgnore: PHASE_1_SPECS,
      use: {
        userAgent: devices["iPhone 13"].userAgent,
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 3,
        isMobile: true,
        hasTouch: true,
      },
    },
    {
      name: "tablet",
      use: {
        userAgent: devices["iPad (gen 7) landscape"].userAgent,
        viewport: { width: 1024, height: 768 },
        deviceScaleFactor: 2,
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
  webServer: {
    command: "npm run build && npm start -- -p 3100",
    url: "http://localhost:3100",
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
  },
});
