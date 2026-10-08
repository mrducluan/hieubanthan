// E2E (WS-5): Playwright tự khởi động engine (FastAPI) + web (next dev) rồi
// chạy luồng thật trên Chromium. Không LLM, không Supabase:
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
  NEXT_PUBLIC_SUPABASE_URL: "",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "",
  SUPABASE_SERVICE_ROLE_KEY: "",
  NEXT_PUBLIC_POSTHOG_KEY: "",
  LOI_MOI_SECRET: "",
  THONG_TIN_CHU_SO_HUU: "",
  THONG_TIN_MA_SO: "",
  THONG_TIN_DIA_CHI: "",
  THONG_TIN_EMAIL: "",
  THONG_TIN_EMAIL_DU_LIEU: "",
  THONG_TIN_DIEN_THOAI: "",
  THONG_TIN_BO_CONG_THUONG_URL: "",
  GOOGLE_SITE_VERIFICATION: "",
  BING_SITE_VERIFICATION: "",
  // GTM giả để thử hộp hỏi cookie (e2e/seo-d.spec.ts chặn mọi request tới Google). Mọi test khác đã "từ chối" sẵn.
  NEXT_PUBLIC_GTM_ID: "GTM-E2ETEST",
  NEXT_PUBLIC_GA_ID: "",
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
    contextOptions: { reducedMotion: "reduce" },
    // Hộp hỏi cookie đã trả lời "từ chối" → không che nút ở các test khác; test riêng tự xoá để thử hộp hỏi.
    storageState: { cookies: [], origins: [{ origin: `http://localhost:${WEB_PORT}`, localStorage: [{ name: "hbt.dong-y-cookie.v1", value: "tu_choi" }] }] },
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
