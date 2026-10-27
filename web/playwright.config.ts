// E2E (WS-5): Playwright tự khởi động engine (FastAPI) + web (next dev) rồi
// chạy luồng thật trên Chromium. Không LLM, không Supabase:
// các biến khoá bị ép rỗng để engine chạy template + KB file, tất định.
import { defineConfig, devices } from "@playwright/test";

// Cổng đổi được qua env (E2E_ENGINE_PORT / E2E_WEB_PORT) để nhiều bản sao repo chạy e2e song song không đụng nhau.
const ENGINE_PORT = Number(process.env.E2E_ENGINE_PORT) || 8000;
const WEB_PORT = Number(process.env.E2E_WEB_PORT) || 3000;
const BAN_BUILD = Boolean(process.env.CI) || process.env.E2E_PROD === "1";

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
  // CI: reporter "github" ghi test hỏng thành annotation của check run (đọc được qua API khi không tải được artifact).
  reporter: process.env.CI ? [["list"], ["github"], ["html", { open: "never" }]] : "list",
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
      // API NotFair giả (bài có slug có dấu) → /blog có bài NotFair mà không gọi ra ngoài.
      command: "node e2e/notfair-gia.mjs",
      url: "http://127.0.0.1:4555/health",
      reuseExistingServer: !process.env.CI,
      timeout: 15_000,
    },
    {
      command: `cd ../engine && python -m uvicorn app.main:app --port ${ENGINE_PORT}`,
      url: `http://localhost:${ENGINE_PORT}/health`,
      // Mọi yêu cầu E2E đi từ cùng một IP → nới hạn mức SEC-1 (120/phút/người gọi) để các worker song song không dính 429.
      env: { ...KHOA_TAT, ENGINE_LUOT_PHUT: "100000" },
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
    {
      // CI: chạy trên BẢN BUILD (next build + next start) — next dev biên dịch từng route lúc chạy, trên runner CI
      // vừa phình bộ nhớ (tự khởi động lại khi heap > 80%) vừa chậm bất chợt (> 15 s/trang) → mỗi lượt hỏng một test
      // khác nhau (2026-10-11). Máy cá nhân vẫn dùng dev (nhanh khi sửa). Ép chạy bản build: E2E_PROD=1.
      command: BAN_BUILD ? `npm run build && npm run start -- --port ${WEB_PORT}` : `npm run dev -- --port ${WEB_PORT}`,
      url: `http://localhost:${WEB_PORT}`,
      // ENGINE_URL dùng 127.0.0.1 (không "localhost"): Node 20 thử ::1 rồi 127.0.0.1 với hạn 250 ms mỗi địa chỉ
      // (autoSelectFamily) → khi runner CI đang bận, fetch tới engine có thể hỏng "fetch failed" giả.
      // NEXT_PUBLIC_SITE_URL: bản build mặc định canonical về hieuban.com — test cần localhost.
      // NEXT_PUBLIC_E2E: bản build vẫn ghi sự kiện đo lường vào window.__hbt_su_kien để test đọc (lib/do-luong.ts).
      env: {
        ...KHOA_TAT, ENGINE_URL: `http://127.0.0.1:${ENGINE_PORT}`, NEXT_PUBLIC_SITE_URL: `http://localhost:${WEB_PORT}`,
        NEXT_PUBLIC_E2E: "1",
        // DH-PC2: khoá giả — e2e chặn mọi request tới maps.googleapis.com và trả bản Google Maps giả (e2e/phong-thuy.spec.ts).
        NEXT_PUBLIC_GOOGLE_MAPS_KEY: "e2e-gmaps",
        NOTFAIR_SEO_API_KEY: "e2e", NOTFAIR_SEO_API_URL: "http://127.0.0.1:4555/",
        // BLOG-3b: route /api/cms/notfair cho CMS đọc bài NotFair qua web — bí mật giả chỉ dùng cho test.
        CMS_WEBHOOK_SECRET: "e2e-cms-webhook",
        // payOS khoá GIẢ (không gọi payOS thật: chưa bật tài khoản → không tạo đơn) — đủ để thử kiểm chữ ký webhook.
        PAYOS_CLIENT_ID: "e2e", PAYOS_API_KEY: "e2e", PAYOS_CHECKSUM_KEY: "e2e-payos-checksum-0000", SUPABASE_SERVICE_ROLE_KEY: "",
        UNG_HO_VI: "USDT (TRC20)|TE2eTestWalletAddress000000000000",
        // Bản build bắt buộc có khoá ký link mời/thẻ (lib/ma-moi.ts) — khoá giả chỉ dùng cho test.
        ...(BAN_BUILD ? { LOI_MOI_SECRET: "e2e-chi-dung-cho-thu-nghiem-0000" } : { NODE_OPTIONS: "--max-old-space-size=6144" }),
      },
      reuseExistingServer: !process.env.CI,
      timeout: BAN_BUILD ? 600_000 : 120_000,
    },
  ],
});
