// Phase 2 (docs/THIET-KE-UI.md §6.2): A so hợp đôi → tạo link mời → B mở link → nhập → kết quả → mời C.
import { test, expect } from "@playwright/test";
import { napHoSo } from "./_hoso";

const LUAN = { v: 1, ho_ten: "Nguyễn Đức Luân", ngay: 24, thang: 10, nam: 1988, tao_luc: "2026-09-30T00:00:00Z" };

test("A so với người ấy: cặp đường đời + 3 cặp theo tên, không có điểm số", async ({ page }) => {
  await napHoSo(page, LUAN);
  await page.goto("/hop-doi");
  await page.getByLabel(/Tên người ấy/).fill("Trần Thị Mai");
  await page.getByLabel("Ngày sinh người ấy").fill("13");
  await page.getByLabel("Tháng sinh người ấy").fill("5");
  await page.getByLabel("Năm sinh người ấy").fill("1990");
  await page.getByRole("button", { name: "Xem hai người" }).click();
  const kq = page.getByTestId("ket-qua-hop-doi");
  await expect(kq.getByTestId("cap-duong_doi")).toContainText("Điểm hoà.");
  await expect(kq.getByTestId("cap-duong_doi")).toContainText("Điểm va.");
  await expect(kq.getByTestId("cap-su_menh")).toBeVisible();
  await expect(kq).toContainText("Không có điểm số hợp hay khắc");
});

test("TS-SAU: hợp đôi theo loại quan hệ — sếp khác người yêu, có nhịp năm hai người", async ({ page }) => {
  await napHoSo(page, LUAN);
  await page.goto("/hop-doi");
  await page.getByTestId("quan-he-sep").click();
  await page.getByLabel("Ngày sinh người ấy").fill("13");
  await page.getByLabel("Tháng sinh người ấy").fill("5");
  await page.getByLabel("Năm sinh người ấy").fill("1990");
  await page.getByRole("button", { name: "Xem hai người" }).click();
  const kq = page.getByTestId("ket-qua-hop-doi");
  await expect(kq.getByTestId("ten-quan-he")).toHaveText("Sếp");
  await expect(kq).toContainText("Làm việc với sếp của bạn");
  await expect(kq.getByTestId("the-vai").first()).toContainText("trong vai sếp");
  await expect(kq.getByTestId("the-vai").first()).toContainText("Cách nói chuyện hợp");
  await expect(kq.getByTestId("nhip-nam")).toBeVisible();

  await page.getByRole("button", { name: "So với người khác" }).click();
  await page.getByTestId("quan-he-ban_be").click();
  await page.getByLabel("Ngày sinh người ấy").fill("13");
  await page.getByLabel("Tháng sinh người ấy").fill("5");
  await page.getByLabel("Năm sinh người ấy").fill("1990");
  await page.getByRole("button", { name: "Xem hai người" }).click();
  await expect(page.getByTestId("ten-quan-he")).toHaveText("Bạn bè");
  await expect(page.getByTestId("the-vai").first()).toContainText("trong vai bạn");
});

test("link mời: A tạo → B mở, nhập ngày sinh → thấy kết quả; mã sai bị chặn", async ({ page, browser }) => {
  await napHoSo(page, LUAN);
  await page.goto("/hop-doi");
  await page.getByLabel(/Tên hiển thị trên link/).fill("Luân");
  await page.getByRole("button", { name: "Tạo link mời" }).click();
  const link = await page.getByLabel("Link chia sẻ").inputValue();
  expect(link).toMatch(/\/hop-doi\/[\w-]+\.[\w-]+$/);

  // B: trình duyệt khác, chưa có hồ sơ.
  const b = await (await browser.newContext({ reducedMotion: "reduce" })).newPage();
  await b.goto(link);
  await expect(b.getByRole("heading", { level: 1 })).toContainText("Luân mời bạn xem hai người");
  await expect(b.getByTestId("so-nguoi-moi")).toHaveText("6");
  await b.getByLabel("Họ và tên đầy đủ").fill("Trần Thị Mai");
  await b.getByLabel("Ngày", { exact: true }).fill("13");
  await b.getByLabel("Tháng", { exact: true }).fill("5");
  await b.getByLabel("Năm", { exact: true }).fill("1990");
  await b.getByRole("button", { name: "Đồng ý và xem kết quả" }).click();   // ĐY-1: B chưa đồng ý → nút đồng ý thay "Xem hai người"
  await expect(b.getByTestId("ket-qua-hop-doi").getByTestId("cap-duong_doi")).toContainText("Điểm hoà.");
  // HN-2: B gửi lại link cho A → A mở là thấy cùng kết quả hai người (vòng khép kín).
  await expect(b.getByTestId("gui-lai-loi-moi")).toContainText("Gửi kết quả lại cho Luân");
  await b.getByRole("button", { name: "Tạo link gửi Luân" }).click();
  const linkB = await b.getByTestId("gui-lai-loi-moi").getByLabel("Link chia sẻ").inputValue();
  expect(linkB).toMatch(/\/hop-doi\/[\w-]+\.[\w-]+$/);
  // Gán nguồn giới thiệu (UI-6): share_clicked → referral_signup → compatibility_created cùng ma_moi.
  const sk = await b.evaluate(() => (window as unknown as { __hbt_su_kien: { su_kien: string; ma_moi?: string }[] }).__hbt_su_kien);
  const maMoi = link.split(".").pop()?.slice(0, 10);
  for (const k of ["share_clicked", "referral_signup", "compatibility_created"]) {
    expect(sk.find((e) => e.su_kien === k)?.ma_moi).toBe(maMoi);
  }

  await page.goto(linkB);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("mời bạn xem hai người");
  await expect(page.getByTestId("ket-qua-hop-doi").getByTestId("cap-duong_doi")).toContainText("Điểm hoà.");

  // Mã bị sửa → không hợp lệ.
  await b.goto(link.replace(/.$/, (c) => (c === "A" ? "B" : "A")));
  await expect(b.getByRole("heading", { name: "Lời mời không còn hiệu lực" })).toBeVisible();
});

test("thẻ chia sẻ: link thẻ công khai + ảnh OG", async ({ page, request }) => {
  await napHoSo(page, LUAN);
  await page.goto("/chia-se");
  await expect(page.getByTestId("the-danh-tinh")).toContainText("Nguyễn Đức Luân");
  await page.getByRole("button", { name: "Tạo link thẻ" }).click();
  const link = await page.getByLabel("Link chia sẻ").inputValue();
  await page.goto(link);
  await expect(page.getByTestId("so-the")).toHaveText("6");
  const ma = link.split("/the/")[1] ?? "";
  const og = await request.get(`/og?ma=${ma}`);
  expect(og.status()).toBe(200);
  expect(og.headers()["content-type"]).toContain("image/png");
});
