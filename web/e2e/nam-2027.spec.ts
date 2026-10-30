// NAM-1 + NAM-2 (2026-10-30) — trang trụ "Năm {năm}" (+ sinh con, cưới hỏi), mục lục /nam, /lich-am (trước 404), menu
// "Năm {năm}" và công cụ "Thời gian tới của bạn". Kiểm: H1 + Trả lời nhanh + schema trong HTML máy chủ, dữ kiện khớp
// engine (Tết 06/02/2027, Đinh Mùi, Thiên Hà Thủy), không lộ "{nam}", không lời doạ, không cuộn ngang ở 390 px.
import { test, expect } from "@playwright/test";
import { napHoSo, HO_SO_MAU } from "./_hoso";

const CAM = /đại hung|tai hoạ|tai họa|xui xẻo|giải hạn|vật phẩm|con số may mắn|tuổi thọ|\{nam\}/i;

test("/nam/2027: H1, Trả lời nhanh, ô năm, bảng 12 con giáp, lối tra theo tuổi, FAQPage", async ({ page, request }) => {
  const r = await request.get("/nam/2027");
  expect(r.status()).toBe(200);
  const html = await r.text();
  expect(html).toMatch(/<h1[^>]*>Năm 2027 Đinh Mùi: năm con gì, mệnh gì, tuổi nào cần lưu ý<\/h1>/);
  expect(html).toContain('"@type":"FAQPage"');
  expect(html).toContain("06/02/2027");
  await page.goto("/nam/2027");
  await expect(page.getByTestId("o-nam")).toContainText("Thiên Hà Thủy");
  await expect(page.getByTestId("bang-con-giap").locator("tbody tr")).toHaveCount(12);
  for (const href of ["/xem-sao-han/2027", "/xem-tuoi-lam-nha/2027", "/nam/2027/cuoi-hoi", "/nam/2027/sinh-con",
    "/tuoi-xong-dat/2027", "/phong-thuy/huong-xau-nam/2027", "/lich-am/2027", "/bat-tu/menh-theo-nam/sinh-nam-2027-menh-gi"]) {
    await expect(page.locator(`main a[href="${href}"]`).first()).toBeVisible();
  }
  await expect(page.getByTestId("nut-ca-nhan")).toHaveAttribute("href", "/thoi-gian-toi?nam=2027");
  expect(await page.locator("main").innerText()).not.toMatch(CAM);
  expect((await request.get("/nam/1999")).status()).toBe(404);
});

test("/nam/2027/sinh-con và /cuoi-hoi: bảng nhóm, ranh giới bác sĩ, Kim lâu cô dâu", async ({ page, request }) => {
  await page.goto("/nam/2027/sinh-con");
  await expect(page.locator("h1")).toHaveText("Sinh con năm 2027 hợp tuổi bố mẹ nào?");
  await expect(page.getByTestId("bang-hop")).toContainText("1995");
  await expect(page.getByTestId("bang-luu_y")).toContainText("1997");
  await expect(page.locator("main")).toContainText("bác sĩ");
  expect(await page.locator("main").innerText()).not.toMatch(CAM);
  await page.goto("/nam/2027/cuoi-hoi");
  const bang = page.getByTestId("bang-cuoi");
  await expect(bang.locator("tr", { hasText: "1998" })).toContainText("Kim lâu Thê");
  await expect(bang.locator("tr", { hasText: "1999" })).toContainText("Không phạm");
  await expect(page.locator('main a[href="/xem-ngay-tot/cuoi-hoi-thang-2-2027"]')).toBeVisible();
  expect((await request.get("/nam/2027/cuoi-hoi")).status()).toBe(200);
});

test("/nam và /lich-am (trước 404) có trang mục lục; sitemap có trang năm", async ({ page, request }) => {
  await page.goto("/nam");
  await expect(page.getByTestId("the-nam")).toHaveCount(2);
  expect((await request.get("/lich-am")).status()).toBe(200);
  const sm = await (await request.get("/sitemap.xml")).text();
  for (const d of ["/nam/2027", "/nam/2027/sinh-con", "/nam/2027/cuoi-hoi", "/nam<", "/lich-am<", "/thoi-gian-toi<"]) expect(sm).toContain(d);
});

test("menu đầu trang có \"Năm 2027\" + menu con theo năm, không lộ {nam}", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");
  const nav = page.getByRole("navigation").first();
  await expect(nav.getByRole("link", { name: /^Năm 20\d\d$/ }).or(nav.getByRole("button", { name: /Năm 20\d\d/ })).first()).toBeVisible();
  expect(await page.content()).not.toContain("{nam}");
});

test("/thoi-gian-toi: chưa có hồ sơ → form; có hồ sơ → 4 chương, chương đầu mở, đổi năm", async ({ page, request }) => {
  const html = await (await request.get("/thoi-gian-toi")).text();
  expect(html).toMatch(/<h1[^>]*>Thời gian tới của bạn<\/h1>/);
  await page.goto("/thoi-gian-toi");
  await expect(page.getByTestId("tgt-nhap")).toBeVisible();
  await napHoSo(page);
  await page.goto("/thoi-gian-toi");
  const vung = page.getByTestId("thoi-gian-toi");
  await expect(vung).toContainText("Ba tháng tới", { timeout: 30_000 });
  await expect(vung).toContainText("12 tháng tới của bạn");
  await expect(vung).toContainText("nên tránh & nên làm");
  expect(await vung.innerText()).not.toMatch(CAM);
  const nut = vung.getByRole("button", { name: /Năm âm lịch đang đi/ });
  await nut.click();
  await expect(nut).toHaveAttribute("aria-pressed", "true");
});

test("/thoi-gian-toi chỉ có ngày sinh: mời bổ sung giờ sinh, vẫn đọc thần số", async ({ page }) => {
  await napHoSo(page, { v: 1, ho_ten: HO_SO_MAU.ho_ten, ngay: 17, thang: 5, nam: 1990, tao_luc: HO_SO_MAU.tao_luc });
  await page.goto("/thoi-gian-toi");
  await expect(page.getByTestId("tgt-bo-sung")).toBeVisible();
  await expect(page.getByTestId("thoi-gian-toi")).toContainText("năm cá nhân", { timeout: 30_000 });
});

test("điện thoại 390 px: trang năm và thời gian tới không cuộn ngang", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await napHoSo(page);
  for (const d of ["/nam/2027", "/nam/2027/sinh-con", "/nam/2027/cuoi-hoi", "/thoi-gian-toi"]) {
    await page.goto(d);
    await page.waitForLoadState("networkidle");
    const w = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(w, d).toBeLessThanOrEqual(390);
  }
});
