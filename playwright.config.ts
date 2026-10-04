import { defineConfig } from "@playwright/test";

// E2E smoke PDC: target server lokal di port ephemeral via PDC_E2E_URL
// (dijalankan tools-uji/run-e2e.mjs — bukan port dev, langsung dimatikan).
// Scope realistis tanpa OAuth: logged-out + API gates.
export default defineConfig({
  testDir: "./e2e",
  timeout: 30000,
  fullyParallel: false,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: process.env.PDC_E2E_URL ?? "http://127.0.0.1:3100",
    trace: "off",
    screenshot: "off",
    video: "off",
  },
  projects: [{ name: "chromium", use: { browserName: "chromium" } }],
});
