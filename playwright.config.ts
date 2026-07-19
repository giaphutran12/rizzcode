import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "e2e",
  use: {
    baseURL: "http://127.0.0.1:4273",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://127.0.0.1:4273",
    reuseExistingServer: true,
    env: {
      RIZZCODE_JUDGE_MOCK: "1",
    },
  },
});
