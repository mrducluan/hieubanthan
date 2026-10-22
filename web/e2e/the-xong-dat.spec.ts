// Thẻ xông đất theo năm (khâu MỜI, mùa Tết): ảnh /og/xong-dat (ngang + dọc, năm sai → ảnh mời chung), nút chia sẻ ở trang
// năm và ở công cụ → link /tuoi-xong-dat/{năm}?tu=xd.<10 hex>; lời chia sẻ KHÔNG mang tuổi gia chủ vừa nhập.
import { test, expect, type Page } from "@playwright/test";

const suKien = (page: Page) => page.evaluate(() => (window as unknown as { __hbt_su_kien?: Record<string, unknown>[] }).__hbt_su_kien ?? []);

test("ảnh /og/xong-dat: 2027 ngang + dọc, năm ngoài bảng / sai dạng vẫn trả ảnh mời chung", async ({ request }) => {
  for (const q of ["nam=2027", "nam=2027&khung=doc&tu=xd.0123456789", "nam=1990", "nam=abc", ""]) {
    const anh = await request.get(`/og/xong-dat?${q}`);
    expect(anh.status(), q).toBe(200);
    expect(anh.headers()["content-type"], q).toContain("image/png");
  }
});

test("trang Tết 2027: ảnh chia sẻ là thẻ xông đất; nút chia sẻ chép link có ?tu=xd.…, tải được ảnh dọc", async ({ page, request, context }) => {
  const html = await (await request.get("/tuoi-xong-dat/2027")).text();
  expect(html).toContain("/og/xong-dat?nam=2027");
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.addInitScript(() => { (navigator as unknown as { share?: unknown }).share = undefined; });
  await page.goto("/tuoi-xong-dat/2027");
  await page.getByTestId("chia-se-xong-dat").click();
  await expect(page.getByTestId("chia-se-xong-dat")).toContainText("Đã chép link");
  const chep = await page.evaluate(() => navigator.clipboard.readText());
  expect(chep).toContain("Tết Đinh Mùi 2027");
  const url = new URL(chep.slice(chep.indexOf("http")));
  expect(url.pathname).toBe("/tuoi-xong-dat/2027");
  const tu = url.searchParams.get("tu")!;
  expect(tu).toMatch(/^xd\.[0-9a-f]{10}$/);
  expect(await suKien(page)).toContainEqual(expect.objectContaining({ su_kien: "share_created", kind: "xong_dat", ma_moi: tu }));
  const tai = page.getByTestId("tai-anh-xong-dat");
  await expect(tai).toHaveAttribute("href", `/og/xong-dat?nam=2027&tu=${tu}&khung=doc`);
  const anh = await request.get((await tai.getAttribute("href"))!);
  expect(anh.headers()["content-type"]).toContain("image/png");
});

test("công cụ: sau khi xem, chia sẻ thẻ năm — lời và link không mang năm sinh gia chủ", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.addInitScript(() => { (navigator as unknown as { share?: unknown }).share = undefined; });
  await page.goto("/tuoi-xong-dat");
  const form = page.getByTestId("form-tuoi");
  await form.getByLabel("Năm sinh").fill("1983");
  await form.getByLabel("Năm xem").fill("2027");
  await form.getByRole("button", { name: "Xem ngay" }).click();
  await expect(page.getByTestId("ket-qua-xong-dat")).toBeVisible();
  await page.getByTestId("chia-se-xong-dat").click();
  await expect(page.getByTestId("chia-se-xong-dat")).toContainText("Đã chép link");
  const chep = await page.evaluate(() => navigator.clipboard.readText());
  expect(chep).toMatch(/\/tuoi-xong-dat\/2027\?tu=xd\.[0-9a-f]{10}$/);
  for (const s of ["1983", "Quý Hợi", "Hợi"]) expect(chep).not.toContain(s);
});
