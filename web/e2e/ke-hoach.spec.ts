// KH-1 (2026-11-23) — "Việc bạn định làm: tháng nào hợp" trên /thoi-gian-toi (engine thật) + `?kw=` của Chân dung / Thời gian tới.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test, expect } from "@playwright/test";
import { MA_KE_HOACH } from "../lib/ke-hoach";
import { dauTheoKw } from "../lib/kw-qc";
import { napHoSo } from "./_hoso";

test("thuần: mã việc của web khớp KB engine; ?kw= mới có tiêu đề ≤ 60 ký tự", () => {
  const kb = JSON.parse(readFileSync(join(process.cwd(), "../engine/app/kb/data/ke_hoach_thang_kb.json"), "utf8"));
  expect([...MA_KE_HOACH]).toEqual(Object.keys(kb.viec));
  for (const [duong, kw] of [["/thoi-gian-toi", "thang-tot"], ["/chan-dung", "tong-hop"]] as const) {
    const d = dauTheoKw(duong, kw);
    expect(d).not.toBeNull();
    expect(d!.h1.length).toBeLessThanOrEqual(60);
  }
});

test("/thoi-gian-toi: chọn việc → câu trả lời, 12 tháng, chi tiết tháng hợp nhất; lần sau mở lại đúng việc; không gửi tên", async ({ page }) => {
  await napHoSo(page);
  const [req] = await Promise.all([
    page.waitForRequest((r) => r.url().endsWith("/api/thoi-gian-toi/ke-hoach")),
    page.goto("/thoi-gian-toi").then(() => page.getByTestId("kh-chip-mua_nha").click()),
  ]);
  const than = req.postDataJSON();
  expect(than.ke_hoach).toBe("mua_nha");
  expect(JSON.stringify(than)).not.toContain("Nguyễn");                // tên chỉ để chào trên máy, không gửi engine
  const k = page.getByTestId("ke-hoach-thang");
  await expect(k.getByRole("heading", { level: 2 })).toContainText("bạn định làm gì trong 12 tháng tới?");
  await expect(k.getByTestId("kh-tra-loi")).toContainText("Mua nhà, về nhà mới trong 12 tháng tới", { timeout: 30_000 });
  await expect(k.getByTestId("kh-thang")).toHaveCount(12);
  await expect(k.getByTestId("kh-chi-tiet")).toBeVisible();
  await expect(k.locator('[data-nhip="cham"] .chip-muc, [data-nhip="can_nhac"] .chip-muc').first()).toHaveAttribute("data-muc", "can_chu_dong");
  // bấm một tháng khác → chi tiết đổi theo
  await k.getByTestId("kh-thang").nth(11).click();
  await expect(k.getByTestId("kh-chi-tiet")).toContainText(await k.getByTestId("kh-thang").nth(11).locator("span").first().innerText());
  await page.reload();
  await expect(page.getByTestId("kh-chip-mua_nha")).toHaveAttribute("aria-pressed", "true", { timeout: 30_000 });
  await expect(page.getByTestId("kh-tra-loi")).toContainText("Mua nhà");
});

test("?kw=: tiêu đề theo nhóm quảng cáo ở /chan-dung và /thoi-gian-toi; mã lạ giữ tiêu đề mặc định", async ({ page }) => {
  await page.goto("/chan-dung?kw=tong-hop");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Chân dung bạn qua Tử vi, Bát tự và tướng mặt");
  await page.goto("/thoi-gian-toi?kw=thang-tot");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Tháng nào hợp để đổi việc, mua nhà, cưới hỏi?");
  await page.goto("/chan-dung?kw=<script>");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Chân dung tổng hợp của bạn");
});
