// e2e-that — chuỗi THẬT của cửa Sao (SAO-2) trên "Supabase thu nhỏ" (GoTrue + PostgREST + Postgres, migration thật):
// khách đọc chương miễn phí → mở khoá → đăng nhập OTP → nhận Sao chào mừng → mở · nạp qua cổng giả → quay về tự mở ·
// hỏi đáp vượt lượt → đồng ý trừ Sao · câu khủng hoảng miễn phí. Không giả lập route nào ở máy chủ web.
// Chạy: bash e2e-that/stack/len.sh (cần Postgres + biến libpq) rồi `npm run e2e:that`. Job CI: .github/workflows/e2e.yml.
import { defineConfig, devices } from "@playwright/test";
import { createHmac } from "node:crypto";

// Khoá JWT chỉ cho kiểm thử — cùng bí mật với e2e-that/stack/khoa.mjs (GoTrue + PostgREST cục bộ ký/kiểm bằng nó).
const JWT_THU = "e2e-that-jwt-chi-dung-cho-kiem-thu-0123456789";
const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");
function khoa(role: string): string {
  const h = b64({ alg: "HS256", typ: "JWT" }), p = b64({ role, iss: "supabase", iat: 1700000000, exp: 2000000000 });
  return `${h}.${p}.${createHmac("sha256", JWT_THU).update(`${h}.${p}`).digest("base64url")}`;
}

const ENGINE_PORT = 8100;
const WEB_PORT = 3100;
const BAN_BUILD = Boolean(process.env.CI) || process.env.E2E_PROD === "1";
const TAT = { OPENROUTER_API_KEY: "", ENGINE_API_KEY: "", SUPABASE_URL: "", SUPABASE_ANON_KEY: "", NEXT_PUBLIC_POSTHOG_KEY: "", NEXT_PUBLIC_GTM_ID: "", NEXT_PUBLIC_GA_ID: "" };

export default defineConfig({
  testDir: "./e2e-that",
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: 0,
  timeout: 240_000,
  expect: { timeout: 30_000 },
  reporter: process.env.CI ? [["list"], ["github"], ["html", { open: "never", outputFolder: "playwright-report-that" }]] : "list",
  outputDir: "test-results-that",
  use: {
    baseURL: `http://localhost:${WEB_PORT}`,
    trace: "retain-on-failure",
    contextOptions: { reducedMotion: "reduce" },
    storageState: { cookies: [], origins: [{ origin: `http://localhost:${WEB_PORT}`, localStorage: [{ name: "hbt.dong-y-cookie.v1", value: "tu_choi" }] }] },
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"], launchOptions: { executablePath: process.env.PW_CHROMIUM_PATH || undefined } } }],
  webServer: [
    {
      command: `cd ../engine && python -m uvicorn app.main:app --port ${ENGINE_PORT}`,
      url: `http://localhost:${ENGINE_PORT}/health`, env: TAT, reuseExistingServer: !process.env.CI, timeout: 60_000,
    },
    {
      // Xoá bộ nhớ đệm dữ liệu (unstable_cache: bảng tỉ lệ kiểm chứng 1 giờ, cài đặt 60 giây) — tồn tại qua các lần chạy
      // trong .next/cache/fetch-cache → lượt trước (hoặc e2e thường không Supabase) để lại bảng rỗng / cài đặt cũ.
      command: BAN_BUILD ? `rm -rf .next/cache/fetch-cache && npm run build && npm run start -- --port ${WEB_PORT}` : `rm -rf .next/cache/fetch-cache && npm run dev -- --port ${WEB_PORT}`,
      url: `http://localhost:${WEB_PORT}`,
      env: {
        ...TAT, ENGINE_URL: `http://127.0.0.1:${ENGINE_PORT}`, NEXT_PUBLIC_SITE_URL: `http://localhost:${WEB_PORT}`, NEXT_PUBLIC_E2E: "1",
        NEXT_PUBLIC_SUPABASE_URL: "http://localhost:54321", NEXT_PUBLIC_SUPABASE_ANON_KEY: khoa("anon"),
        SUPABASE_SERVICE_ROLE_KEY: khoa("service_role"),
        SAO_KHOA_SECRET: "e2e-that-sao-khoa-chi-dung-cho-kiem-thu", LOI_MOI_SECRET: "e2e-that-loi-moi-chi-dung-cho-kiem-thu",
        THANH_TOAN_GIA: "1", PAYOS_CLIENT_ID: "", PAYOS_API_KEY: "", PAYOS_CHECKSUM_KEY: "",
        ...(BAN_BUILD ? {} : { NODE_OPTIONS: "--max-old-space-size=6144" }),
      },
      reuseExistingServer: !process.env.CI,
      timeout: BAN_BUILD ? 600_000 : 180_000,
    },
  ],
});
