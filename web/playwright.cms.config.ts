// e2e-cms (CTA-2) — web chạy với CMS GIẢ (e2e-cms/cms-gia.mjs): khối "Bài viết mới / liên quan" có bài thật từ CMS, cấu
// hình "Lối đi tiếp cuối trang" + thẻ ưu tiên từng URL đọc từ CMS, đo end_cta_*. Tách khỏi playwright.config.ts vì bộ
// chính chạy KHÔNG có CMS (đặt CMS_URL ở đó đổi hành vi mọi trang). CI: chạy sau `npm run e2e`, dùng lại bản build (.next)
// — CMS_URL, CMS_WEBHOOK_SECRET là biến máy chủ, đọc lúc chạy. Máy cá nhân: next dev (không chạy song song với bộ chính).
import { defineConfig, devices } from "@playwright/test";

const ENGINE_PORT = 8000;
const WEB_PORT = 3002;
const CMS_PORT = 4666;
const BAN_BUILD = Boolean(process.env.CI) || process.env.E2E_PROD === "1";
const TAT = { ENGINE_API_KEY: "", OPENROUTER_API_KEY: "", SUPABASE_URL: "", SUPABASE_ANON_KEY: "", NEXT_PUBLIC_SUPABASE_URL: "",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "", SUPABASE_SERVICE_ROLE_KEY: "", NEXT_PUBLIC_POSTHOG_KEY: "", NEXT_PUBLIC_GTM_ID: "", NEXT_PUBLIC_GA_ID: "" };
export const BI_MAT_CMS = "e2e-cms-webhook";

export default defineConfig({
  testDir: "./e2e-cms",
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: 0,
  timeout: 90_000,
  expect: { timeout: 20_000 },
  reporter: process.env.CI ? [["list"], ["github"], ["html", { open: "never", outputFolder: "playwright-report-cms" }]] : "list",
  outputDir: "test-results-cms",
  use: {
    baseURL: `http://localhost:${WEB_PORT}`,
    trace: "retain-on-failure",
    contextOptions: { reducedMotion: "reduce" },
    storageState: { cookies: [], origins: [{ origin: `http://localhost:${WEB_PORT}`, localStorage: [{ name: "hbt.dong-y-cookie.v1", value: "tu_choi" }] }] },
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"], launchOptions: { executablePath: process.env.PW_CHROMIUM_PATH || undefined } } }],
  webServer: [
    { command: "node e2e-cms/cms-gia.mjs", url: `http://127.0.0.1:${CMS_PORT}/health`, reuseExistingServer: !process.env.CI, timeout: 15_000 },
    {
      command: `cd ../engine && python -m uvicorn app.main:app --port ${ENGINE_PORT}`,
      url: `http://localhost:${ENGINE_PORT}/health`, env: { ...TAT, ENGINE_LUOT_PHUT: "100000" }, reuseExistingServer: !process.env.CI, timeout: 60_000,
    },
    {
      command: BAN_BUILD ? `([ -f .next/BUILD_ID ] || npm run build) && npm run start -- --port ${WEB_PORT}` : `npm run dev -- --port ${WEB_PORT}`,
      url: `http://localhost:${WEB_PORT}`,
      env: {
        ...TAT, ENGINE_URL: `http://127.0.0.1:${ENGINE_PORT}`, NEXT_PUBLIC_SITE_URL: `http://localhost:${WEB_PORT}`, NEXT_PUBLIC_E2E: "1",
        CMS_URL: `http://127.0.0.1:${CMS_PORT}`, CMS_WEBHOOK_SECRET: BI_MAT_CMS,
        ...(BAN_BUILD ? { LOI_MOI_SECRET: "e2e-chi-dung-cho-thu-nghiem-0000" } : { NODE_OPTIONS: "--max-old-space-size=6144" }),
      },
      reuseExistingServer: !process.env.CI,
      timeout: BAN_BUILD ? 600_000 : 180_000,
    },
  ],
});
