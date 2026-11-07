// TR-1 — Tarot: trang công cụ (năm bước hỏi → xáo → rút → lật → đọc), lá của ngày, hỏi đáp nghĩa lá, cụm 78 lá, điều hướng.
// Engine thật (e2e khởi động FastAPI); lịch sử chỉ ở localStorage; câu hỏi không lưu máy chủ.
import { test, expect } from "@playwright/test";
import { napHoSo } from "./_hoso";

test("trang công cụ: H1 máy chủ, xáo bằng máy → rút 3 lá → lật → bài đọc 7 chương → hỏi về lá vừa rút", async ({ page, request }) => {
  const html = await (await request.get("/tarot")).text();
  expect(html).toMatch(/<h1[^>]*>[^<]*Tarot/);
  expect(html).toContain('href="/tarot/la-bai"');
  await napHoSo(page, { ho_ten: "Nguyễn Văn An", ngay: 24, thang: 10, nam: 1988, gioi_tinh: "nam" });
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/tarot");
  await expect(page.getByTestId("buoc-hoi")).toBeVisible();
  await expect(page.getByTestId("la-ngay")).toBeVisible();
  await page.getByTestId("o-cau-hoi").fill("Tôi có nên nhận lời hợp tác với đối tác mới không?");
  await page.getByTestId("chu-de-cong_viec").click();
  await page.getByTestId("trai-bai-ba_la_loi_khuyen").click();
  await page.getByTestId("nut-bat-dau").click();
  await expect(page.getByTestId("xao-bai")).toBeVisible();
  await page.getByTestId("nut-may-xao").click();
  const quat = page.getByTestId("quat-bai");
  await expect(quat).toBeVisible({ timeout: 15_000 });
  await expect(quat.getByTestId("la-quat")).toHaveCount(78);
  // rút 3 lá: ba ô vị trí đầy, quạt còn 75. Trên quạt các lá chồng mép nhau (lá sau đè lá trước) — người dùng chạm phần
  // mép lộ ra; Playwright bấm vào TÂM lá nên lá kề đè lên → gửi thẳng sự kiện click tới lá đã chọn (cùng luật `rut(i)`).
  for (const k of [5, 40]) await quat.locator(`[data-chi-so="${k}"]`).dispatchEvent("click");
  await expect(quat.getByTestId("la-quat")).toHaveCount(76);
  await quat.locator('[data-chi-so="70"]').dispatchEvent("click");
  // đủ lá → sang bước Lật: quạt cất đi, bàn có 3 lá úp
  await expect(page.getByTestId("quat-bai")).toHaveCount(0);
  const ban = page.getByTestId("ban-trai-bai");
  await expect(ban.locator('[data-testid="la-bai"][data-lat="0"]')).toHaveCount(3);
  await page.getByTestId("nut-lat-het").click();
  await expect(ban.locator('[data-testid="la-bai"][data-lat="1"]')).toHaveCount(3);
  await page.getByTestId("nut-doc-bai").click();
  const bc = page.getByTestId("bao-cao-tarot");
  await expect(bc).toBeVisible({ timeout: 20_000 });
  await expect(bc).toContainText("Từng vị trí nói gì");
  await expect(bc).toContainText("Việc nên làm trong 72 giờ");
  await expect(bc.getByTestId("chip-muc").first()).toBeVisible();
  // lịch sử trên máy sau khi tải lại
  await page.reload();
  await expect(page.getByTestId("lich-su-tarot")).toContainText("3 lá");
  // hỏi đáp: nghĩa lá + từ chối đọc người khác
  const o = page.getByRole("textbox", { name: "Câu hỏi của bạn" });
  await o.fill("Lá Tháp nghĩa là gì?");
  await o.press("Enter");
  await expect(page.locator("main")).toContainText("Tháp (The Tower)", { timeout: 15_000 });
  await o.fill("Người yêu tôi có đang ngoại tình không?");
  await o.press("Enter");
  await expect(page.locator("main")).toContainText("đọc cho chính người hỏi", { timeout: 15_000 });
});

test("nhấn giữ xáo bài (hạt giống từ cử chỉ) → quạt hiện; lá của ngày lật được", async ({ page }) => {
  await page.goto("/tarot");
  await expect(page.getByTestId("buoc-hoi")).toBeVisible();
  await page.getByTestId("trai-bai-mot_la").click();
  await page.getByTestId("nut-bat-dau").click();
  const nut = page.getByTestId("nut-giu-xao");
  await nut.hover();                         // chờ khối Xáo bài dựng xong (hover tự chờ "stable")
  // Sau "Xáo bài" trang cuộn mượt tới bàn (50 ms sau) → trên máy CI chậm nút còn trôi khi chuột ấn xuống, pointerdown rơi cạnh nút.
  // Chờ nút đứng yên 300 ms rồi mới nhấn giữ; giữ ~1,5 s (ngưỡng tối thiểu 0,8 s).
  await expect.poll(async () => {
    const a = await nut.boundingBox(); await page.waitForTimeout(300); const b = await nut.boundingBox();
    return a && b && Math.abs(a.y - b.y) < 1 && Math.abs(a.x - b.x) < 1 ? "yen" : "dang_cuon";
  }, { timeout: 10_000 }).toBe("yen");
  await expect(nut).toBeEnabled();
  const hop = await nut.boundingBox();
  await page.mouse.move(hop!.x + 10, hop!.y + 10);
  await page.mouse.down();
  for (let i = 0; i < 16; i++) { await page.mouse.move(hop!.x + 10 + i * 3, hop!.y + 10 + (i % 3)); await page.waitForTimeout(90); }
  await page.mouse.up();
  await expect(page.getByTestId("quat-bai")).toBeVisible({ timeout: 15_000 });
  await page.getByTestId("quat-bai").locator('[data-chi-so="10"]').dispatchEvent("click");   // lá chồng mép (xem test trên)
  await expect(page.getByTestId("nut-doc-bai")).toBeVisible();
  // lá của ngày
  const la = page.getByTestId("la-ngay");
  await la.getByRole("button", { name: "Lật lá của ngày" }).click();
  await expect(la).toContainText("Việc 0 đồng");
});

test("cụm 78 lá, trang con, .md, sitemap, thanh mảng, hub bảy mảng", async ({ request }) => {
  const cum = await (await request.get("/tarot/la-bai")).text();
  expect((cum.match(/href="\/tarot\/la-bai\/[a-z0-9-]+"/g) ?? []).length).toBeGreaterThanOrEqual(78);
  const r = await request.get("/tarot/la-bai/thap");
  expect(r.status()).toBe(200);
  const html = await r.text();
  expect(html).toMatch(/<h1[^>]*>Tháp \(The Tower\)/);
  expect(html).toContain("Trả lời nhanh");
  expect(html).toContain("<table");
  expect(html).toContain('data-testid="minh-hoa"');
  expect(html).toContain('"@type":"FAQPage"');
  expect((await request.get("/tarot/la-bai/3-gay.md")).status()).toBe(200);
  expect((await request.get("/tarot/la-bai/khong-co")).status()).toBe(404);
  const sm = await (await request.get("/sitemap.xml")).text();
  expect(sm).toContain("/tarot</loc>");
  expect(sm).toContain("/tarot/la-bai/thap</loc>");
  const hub = await (await request.get("/huyen-hoc")).text();
  expect(hub).toContain('data-testid="the-mang-tarot"');
  expect(hub).toContain("bảy cách nhìn lại mình");
  const trang = await (await request.get("/tarot")).text();
  expect(trang).toContain("Trải bài của tôi");
});
