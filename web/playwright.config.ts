// E2E (WS-5): Playwright tự khởi động engine (FastAPI) + web (next dev) rồi
// chạy luồng thật trên Chromium. Không LLM, không Supabase, không Basic Auth:
// các biến khoá bị ép rỗng để engine chạy template + KB file, tất định.
import { defineConfig, devices } from "@playwright/test";

const ENGINE_PORT = 8000;
const WEB_PORT = 3000;

// Rỗng = tắt (engine/web đều coi chuỗi rỗng là "không set").
const KHOA_TAT = {
  ENGINE_API_KEY: "",
  OPENROUTER_API_KEY: "",
  SUPABASE_URL: "",
  SUPABASE_ANON_KEY: "",
  STAGING_USER: "",
  STAGING_PASS: "",
};

// Cloud container có sẵn Chromium ở /opt/pw-browsers (PLAYWRIGHT_BROWSERS_PATH).
// Nếu bản @playwright/test lệch bản Chromium đã cài, đặt PW_CHROMIUM_PATH
// (vd. /opt/pw-browsers/chromium) thay vì chạy `playwright install`.
const executablePath = process.env.PW_CHROMIUM_PATH || undefined;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: 0,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${WEB_PORT}`,
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], launchOptions: { executablePath } },
    },
  ],
  webServer: [
    {
      command: `cd ../engine && python -m uvicorn app.main:app --port ${ENGINE_PORT}`,
      url: `http://localhost:${ENGINE_PORT}/health`,
      env: KHOA_TAT,
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
    {
      command: `npm run dev -- --port ${WEB_PORT}`,
      url: `http://localhost:${WEB_PORT}`,
      env: { ...KHOA_TAT, ENGINE_URL: `http://localhost:${ENGINE_PORT}` },
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
});
