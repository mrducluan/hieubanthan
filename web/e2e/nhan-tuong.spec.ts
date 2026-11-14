// NT-1 — Nhân tướng học: trang công cụ (bản đồ mặt, khảo sát sáu bước, bài đọc 8 chương, hỏi đáp), cụm bộ vị, điều hướng.
// Engine thật (e2e khởi động FastAPI); không ảnh, câu trả lời chỉ ở localStorage.
import { test, expect } from "@playwright/test";
import { napHoSo } from "./_hoso";

test("trang công cụ: H1 máy chủ, bản đồ mặt, khảo sát → bài đọc, hỏi đáp theo bộ vị", async ({ page, request }) => {
  const html = await (await request.get("/nhan-tuong")).text();
  expect(html).toMatch(/<h1[^>]*>[^<]*Xem tướng mặt/);
  expect(html).toContain('data-testid="ban-do-mat"');
  await napHoSo(page, { v: 1, ho_ten: "Nguyễn Văn An", ngay: 24, thang: 10, nam: 1988, gioi_tinh: "nam", tao_luc: "2026-09-30T00:00:00Z" });
  await page.goto("/nhan-tuong");
  await expect(page.getByTestId("khao-sat-guong")).toBeVisible();
  // bước 1: trả lời 3 câu; vùng đang hỏi sáng trên bản đồ
  await page.getByTestId("cau-khuon_mat").getByRole("button", { name: "Vuông vức, góc cạnh rõ" }).click();
  await page.getByTestId("cau-tam_dinh").getByRole("button", { name: "Ba phần xấp xỉ nhau" }).click();
  await page.getByTestId("cau-sac_tong").getByRole("button", { name: "Trắng bệch, môi nhạt" }).click();
  await page.getByTestId("cau-cot_nhuc").getByRole("button", { name: /Thịt săn/ }).click();
  await expect(page.getByTestId("so-cau-da-tra-loi")).toHaveText("4");
  await expect(page.getByTestId("khao-sat-guong").locator('[data-vung][data-sang="1"]')).toHaveCount(1);
  // qua bước 2, chọn thêm rồi xem sớm
  await page.getByRole("button", { name: "Bước tiếp" }).click();
  await page.getByTestId("cau-an_duong").getByRole("button", { name: "Rộng, phẳng, sáng" }).click();
  await page.getByTestId("cau-long_may").getByRole("button", { name: /Sợi mượt/ }).click();
  await page.getByTestId("nut-xem-som").click();
  const bc = page.getByTestId("bao-cao-nhan-tuong");
  await expect(bc).toBeVisible({ timeout: 20_000 });
  await expect(bc).toContainText("Dáng mặt: Kim hình");
  await expect(bc.getByTestId("ban-do-mat").locator("[data-muc]")).not.toHaveCount(0);
  await expect(bc.getByTestId("ban-do-mat")).toContainText("Năm nay nhìn vào");      // hồ sơ có năm sinh → vùng lưu niên
  // WS-4: "Sách xưa nói gì về tuổi …" (hoặc bấm vùng sáng của năm nay) → câu bài ca lưu niên của Thần Tướng Toàn Biên
  await expect(bc.getByTestId("bai-ca-luu-nien")).toHaveCount(0);
  await bc.getByTestId("nut-bai-ca").click();
  await expect(bc.getByTestId("bai-ca-luu-nien")).toContainText(/Tuổi \d+(–\d+)? /);   // câu của đúng chặng tuổi (tuổi mụ đổi theo năm âm đang xem)
  const bca = bc.getByTestId("bai-ca-luu-nien");
  await expect(bca).toContainText("Thần Tướng Toàn Biên");
  await expect(bca.locator('[lang="zh-Hant"]')).toContainText("«");
  await expect(bc.getByTestId("chip-muc").first()).toBeVisible();
  // câu trả lời còn trên máy sau khi tải lại
  await page.reload();
  await expect(page.getByTestId("so-cau-da-tra-loi")).toHaveText("6");
  // hỏi đáp: bộ vị + từ chối xem người khác
  const o = page.getByRole("textbox", { name: "Câu hỏi của bạn" });
  await o.fill("Ấn Đường rộng nghĩa là gì?");
  await o.press("Enter");
  await expect(page.locator("main")).toContainText("Theo điều bạn đã tự quan sát", { timeout: 15_000 });
  await o.fill("sếp tôi mũi to thì sao");
  await o.press("Enter");
  await expect(page.locator("main")).toContainText("không đọc tướng người khác", { timeout: 15_000 });
});

test("cụm bộ vị, trang con, .md, sitemap, thanh mảng, hub, menu", async ({ request }) => {
  const cum = await (await request.get("/nhan-tuong/bo-vi")).text();
  expect((cum.match(/href="\/nhan-tuong\/bo-vi\/[a-z0-9-]+"/g) ?? []).length).toBeGreaterThanOrEqual(24);
  const r = await request.get("/nhan-tuong/bo-vi/an-duong");
  expect(r.status()).toBe(200);
  const html = await r.text();
  expect(html).toMatch(/<h1[^>]*>Ấn Đường/);
  expect(html).toContain("Trả lời nhanh");
  expect(html).toContain("<table");
  expect(html).toContain('data-testid="minh-hoa"');
  expect(html).toContain('data-testid="ban-do-mat"');
  expect(html).toContain('"@type":"FAQPage"');
  expect((await request.get("/nhan-tuong/bo-vi/an-duong.md")).status()).toBe(200);
  expect((await request.get("/nhan-tuong/bo-vi/khong-co")).status()).toBe(404);
  const sm = await (await request.get("/sitemap.xml")).text();
  expect(sm).toContain("/nhan-tuong</loc>");
  expect(sm).toContain("/nhan-tuong/bo-vi/an-duong</loc>");
  const hub = await (await request.get("/huyen-hoc")).text();
  expect(hub).toContain('data-testid="the-mang-nhan_tuong"');
  const trang = await (await request.get("/nhan-tuong")).text();
  expect(trang).toContain('href="/nhan-tuong/bo-vi"');
  expect(trang).toContain("Gương mặt của tôi");
});
