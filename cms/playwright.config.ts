// E2E xuyên hai app: CMS (Payload, cổng 3001) + web (Next, cổng 3000) trên Postgres thật (DB cms_e2e, tự làm sạch).
// Máy cá nhân: dev server (nhanh). CI (hoặc E2E_PROD=1): bản build — CMS chạy migration trước như trên Vercel.
import { defineConfig, devices } from "@playwright/test";

const BAN_BUILD = Boolean(process.env.CI) || process.env.E2E_PROD === "1";
// Bản build dùng DB riêng: DB đã chạy dev (tự "push" cấu trúc) thì `payload migrate` dừng lại hỏi xác nhận.
export const DB_E2E = process.env.CMS_E2E_DATABASE_URI
  || `postgres://postgres:postgres@localhost:5432/${BAN_BUILD ? "cms_e2e_build" : "cms_e2e"}`;
export const BI_MAT = { webhook: "e2e-webhook-0000", preview: "e2e-preview-0000", apiKey: "e2e-khoa-may-doc-0123456789abcdef" };

const CMS = {
  DATABASE_URI: DB_E2E,
  PAYLOAD_SECRET: "e2e-payload-secret-chi-dung-thu-0123456789",
  CMS_URL: "http://localhost:3001",
  WEB_URL: "http://localhost:3000",
  CMS_EMAIL_QUAN_TRI: "quan-tri@vidu.vn",
  CMS_WEBHOOK_SECRET: ` ${BI_MAT.webhook}`,   // khoảng trắng thừa như khi dán vào Vercel — hai bên phải tự bỏ
  CMS_PREVIEW_SECRET: BI_MAT.preview,
  S3_BUCKET: "",
};
// Web: chỉ cần CMS — tắt Supabase/PostHog/GTM/NotFair để không gọi ra ngoài.
const WEB = {
  CMS_URL: "http://localhost:3001",
  CMS_API_KEY: BI_MAT.apiKey,
  CMS_WEBHOOK_SECRET: `${BI_MAT.webhook}\n`,  // xuống dòng thừa (lỗi 401 "Đồng bộ ngay" trên production, 2026-10-19)
  CMS_PREVIEW_SECRET: BI_MAT.preview,
  NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
  ENGINE_URL: "http://127.0.0.1:8000",
  NEXT_PUBLIC_SUPABASE_URL: "", NEXT_PUBLIC_SUPABASE_ANON_KEY: "", NEXT_PUBLIC_POSTHOG_KEY: "", NEXT_PUBLIC_GTM_ID: "",
  NOTFAIR_SEO_API_KEY: "", LOI_MOI_SECRET: "e2e-chi-dung-cho-thu-nghiem-0000",
};

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  forbidOnly: Boolean(process.env.CI),
  timeout: 120_000,
  expect: { timeout: 20_000 },
  reporter: process.env.CI ? [["list"], ["github"], ["html", { open: "never" }]] : "list",
  globalSetup: "./e2e/lam-sach-db.ts",
  use: { trace: "retain-on-failure", screenshot: "only-on-failure", locale: "vi-VN" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 1000 },
    launchOptions: { executablePath: process.env.PW_CHROMIUM_PATH || undefined } } }],
  webServer: [
    // Engine: web cần nó cho sitemap / llms.txt (danh mục kiến thức). Không LLM, không Supabase — như web/playwright.config.ts.
    {
      command: "cd ../engine && python -m uvicorn app.main:app --port 8000",
      url: "http://localhost:8000/health",
      env: { ENGINE_API_KEY: "", OPENROUTER_API_KEY: "", SUPABASE_URL: "", SUPABASE_ANON_KEY: "" },
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
    {
      command: BAN_BUILD ? "npx payload migrate && npm run build && npm run start" : "npm run dev",
      url: "http://localhost:3001/admin/login",
      env: CMS,
      reuseExistingServer: !process.env.CI,
      timeout: BAN_BUILD ? 600_000 : 180_000,
    },
    {
      command: BAN_BUILD ? "cd ../web && npm run build && npm run start -- --port 3000" : "cd ../web && npm run dev -- --port 3000",
      url: "http://localhost:3000/blog",
      env: WEB,
      reuseExistingServer: !process.env.CI,
      timeout: BAN_BUILD ? 900_000 : 180_000,
    },
  ],
});
