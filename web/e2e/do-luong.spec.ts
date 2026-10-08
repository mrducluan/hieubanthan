// UI-6: funnel Phase 1/2 bắn đủ sự kiện, và KHÔNG có dữ liệu cá nhân trong thuộc tính.
// Ở dev, lib/do-luong.ts đẩy sự kiện vào window.__hbt_su_kien (PostHog tắt khi không có key).
import { test, expect, type Page } from "@playwright/test";
import { hoi } from "./_hoso";

type SK = { su_kien: string } & Record<string, unknown>;
const suKien = (p: Page) => p.evaluate(() => ((window as unknown as { __hbt_su_kien?: SK[] }).__hbt_su_kien ?? []));
const KHOA_CHO_PHEP = new Set(["su_kien", "feature_version", "mo_dun", "kind", "ma_moi", "so_duong_doi", "huu_ich", "ket_qua"]);

test("funnel Phase 1: landing → bắt đầu → hồ sơ → đọc xong → góp ý → hỏi; không lộ dữ liệu cá nhân", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Họ và tên đầy đủ").fill("Nguyễn Đức Luân");
  await page.getByLabel("Ngày", { exact: true }).fill("24");
  await page.getByLabel("Tháng", { exact: true }).fill("10");
  await page.getByLabel("Năm", { exact: true }).fill("1988");
  await page.getByRole("button", { name: "Xem con số của tôi" }).click();
  // Lần đầu mở /ban-than, máy chủ dev phải biên dịch trang (có lúc > 15 giây khi vừa khởi động) → chờ lâu hơn ở bước này.
  await expect(page.getByTestId("so-duong-doi")).toHaveText("33", { timeout: 60_000 });
  await page.getByRole("heading", { name: "Giai đoạn này của bạn" }).scrollIntoViewIfNeeded();
  await page.getByTestId("gop-y").getByRole("button", { name: "Có, khá trúng" }).click();
  await expect(page.getByText("Cảm ơn bạn")).toBeVisible();

  const ds = await suKien(page);
  const ten = ds.map((e) => e.su_kien);
  // landing_viewed ở trang trước khi điều hướng client-side vẫn nằm trong cùng window.
  for (const k of ["landing_viewed", "reading_started", "profile_created", "reading_completed", "feedback_submitted"]) {
    expect(ten).toContain(k);
  }
  expect(ds.find((e) => e.su_kien === "reading_completed")?.so_duong_doi).toBe(33);
  for (const e of ds) {
    for (const k of Object.keys(e)) expect(KHOA_CHO_PHEP.has(k), `khoá lạ: ${k}`).toBe(true);
    expect(JSON.stringify(e)).not.toMatch(/1988|Luân|Nguyễn|24\/10/);
  }

  await page.goto("/than-so");
  await hoi(page, "Điểm mạnh cốt lõi của tôi là gì?");
  await expect(page.getByTestId("cau-tra-loi").last()).toContainText("Mặt tối");
  const ds2 = await suKien(page);
  expect(ds2.map((e) => e.su_kien)).toEqual(expect.arrayContaining(["advisor_question_started", "advisor_question_completed"]));
  expect(JSON.stringify(ds2)).not.toContain("Điểm mạnh");
});
