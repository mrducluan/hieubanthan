// Hạ tầng GĐ1: Sentry không được gửi dữ liệu cá nhân; không có DSN thì không tải gói Sentry.
import { test, expect } from "@playwright/test";
import type { ErrorEvent } from "@sentry/nextjs";
import { locSuKien } from "../lib/giam-sat";

test("bộ lọc bỏ body, query, cookie, user, header khoá", () => {
  const e = locSuKien({
    type: undefined,
    request: {
      url: "https://x/api/tuvi/la-so?birth_date=1990-05-17",
      query_string: "birth_date=1990-05-17",
      data: { birth_date: "1990-05-17", ho_ten: "Nguyễn Văn An" },
      cookies: { sb: "token" },
      headers: { "x-engine-key": "bi-mat", "user-agent": "UA" },
    },
    user: { ip_address: "1.2.3.4" },
    extra: { body: "1990" },
    breadcrumbs: [{ category: "fetch", data: { url: "/api/lich/doi?ngay=17" } }],
  } as ErrorEvent);
  const s = JSON.stringify(e);
  expect(s).not.toContain("1990");
  expect(s).not.toContain("Nguyễn");
  expect(s).not.toContain("bi-mat");
  expect(s).not.toContain("1.2.3.4");
  expect(e.request?.url).toBe("https://x/api/tuvi/la-so");
  expect(e.request?.headers).toEqual({ "user-agent": "UA" });
});

test("không có NEXT_PUBLIC_SENTRY_DSN: trang không tải gói Sentry", async ({ page }) => {
  const js: string[] = [];
  page.on("request", (r) => { if (r.resourceType() === "script") js.push(r.url()); });
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  expect(js.some((u) => /sentry/i.test(u))).toBe(false);
  expect(js.some((u) => /ingest\.sentry\.io/.test(u))).toBe(false);
});
