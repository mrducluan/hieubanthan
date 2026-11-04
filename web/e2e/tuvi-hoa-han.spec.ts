// TV-HOA-HAN: tứ hoá theo hạn trên lá số + dòng tóm tắt, dải 12 giai đoạn 10 năm, chạm sao → thẻ sao (Đọc kỹ, Hỏi về
// sao này — chỉ điền sẵn, không gửi). Dữ liệu đều từ engine thật (playwright.config khởi động engine).
import { test, expect, type Page } from "@playwright/test";
import { napHoSo } from "./_hoso";

const suKien = (page: Page) => page.evaluate(() =>
  ((window as unknown as { __hbt_su_kien?: { su_kien: string; kind?: string }[] }).__hbt_su_kien ?? []));

async function moLaSo(page: Page) {
  await napHoSo(page);
  await page.goto("/tu-vi");
  const laSo = page.getByRole("group", { name: /Lá số Tử vi/ });
  await expect(laSo).toContainText("LƯU NIÊN");
  return laSo;
}

test("lớp lưu niên: huy hiệu hoá theo năm trên lá số + dòng tóm tắt; bật đại hạn thêm huy hiệu ĐH", async ({ page }) => {
  const laSo = await moLaSo(page);
  const dong = page.getByTestId("dong-hoa-han");
  await expect(dong.locator("[data-lop='ln']")).toContainText(/Năm \d{4}/);
  await expect(dong.locator("[data-lop='ln']")).toContainText(/hoá Lộc.*hoá Quyền.*hoá Khoa.*hoá Kỵ/s);
  await expect(laSo.locator(".ls-chi-tiet [data-hoa-han^='ln-']")).toHaveCount(4);
  await expect(laSo.locator(".ls-chi-tiet [data-hoa-han^='dh-']")).toHaveCount(0);
  await page.getByTestId("tv-hien-thi-mo").click();
  await page.getByRole("button", { name: "Lớp đại hạn" }).click();
  await expect(laSo.locator(".ls-chi-tiet [data-hoa-han^='dh-']")).toHaveCount(4);
  await expect(dong.locator("[data-lop='dh']")).toContainText(/Đại hạn \d+–\d+ tuổi/);
});

test("dải giai đoạn 10 năm: chạm một giai đoạn → năm xem nhảy tới năm đầu, bật lớp đại hạn", async ({ page }) => {
  await moLaSo(page);
  const dai = page.getByTestId("dai-han-nhay");
  await expect(dai.getByRole("button")).toHaveCount(12);
  const dang = dai.locator("[aria-current='true']");
  await expect(dang).toHaveCount(1);
  const khac = dai.locator("button:not([aria-current])").nth(1);
  const nhan = (await khac.getAttribute("aria-label"))!;
  const nam = nhan.match(/từ năm (\d{4})/)![1]!;
  await khac.click();
  await expect(page.getByRole("group", { name: "Năm xem hạn" })).toContainText(nam);
  await expect(dai.locator("[aria-current='true']")).toHaveAttribute("aria-label", nhan);
  await expect(page.getByTestId("dong-hoa-han").locator("[data-lop='dh']")).toBeVisible();
  expect((await suKien(page)).some((e) => e.su_kien === "chart_interacted" && e.kind === "nhay_dai_han")).toBe(true);
});

test("chạm sao trong chi tiết cung → thẻ sao; Hỏi về sao này chỉ điền sẵn câu", async ({ page }) => {
  await moLaSo(page);
  const sao = page.getByTestId("chon-sao").first();
  const ten = (await sao.innerText()).trim();
  await sao.click();
  const the = page.getByTestId("the-sao");
  await expect(the).toBeVisible();
  await expect(the).toContainText("Độ sáng");
  await expect(the.getByTestId("the-sao-han")).toBeVisible();
  await expect(the.getByRole("link", { name: "Đọc kỹ" })).toHaveAttribute("href", /^\/tu-vi\/sao-o-cung\/[a-z0-9-]+-cung-[a-z0-9-]+$/);
  await the.getByTestId("hoi-sao").click();
  await expect(page.getByRole("textbox", { name: /Câu hỏi Tử vi/ })).toHaveValue(`Sao ${ten} ở cung Mệnh của tôi nói gì?`);
  await page.waitForTimeout(600);
  await expect(page.getByTestId("cau-tra-loi")).toHaveCount(0);                 // không tự gửi
  const ds = await suKien(page);
  expect(ds.some((e) => e.kind === "chon_sao")).toBe(true);
  expect(ds.some((e) => e.kind === "hoi_sao")).toBe(true);
  // Phụ tinh cũng chạm được; đóng lại khi chạm lần nữa.
  await sao.click();
  await expect(the).toHaveCount(0);
});

test.describe("điện thoại 375px", () => {
  test.use({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 1 });
  test("không tràn ngang; vừa khung chỉ hiện huy hiệu của chính tinh; dải giai đoạn cuộn trong khung", async ({ page }) => {
    const laSo = await moLaSo(page);
    await expect(page.getByTestId("dong-hoa-han")).toBeVisible();
    const tran = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(tran).toBeLessThanOrEqual(0);
    // Lớp gọn đang hiện: huy hiệu trong lớp gọn chỉ của chính tinh; lớp chi tiết (có cả phụ tinh) đang ẩn.
    const gon = laSo.locator(".ls-gon [data-hoa-han-gon*='ln-']");
    const chiTiet = laSo.locator(".ls-chi-tiet [data-hoa-han^='ln-']");
    expect(await gon.count()).toBeLessThanOrEqual(4);
    if (await gon.count()) await expect(gon.first()).toBeVisible();
    if (await chiTiet.count()) await expect(chiTiet.first()).toBeHidden();
    const dai = page.getByTestId("dai-han-nhay").locator("div").first();
    const [sw, cw] = await dai.evaluate((el) => [el.scrollWidth, el.clientWidth]);
    expect(sw).toBeGreaterThan(cw);
  });
});
