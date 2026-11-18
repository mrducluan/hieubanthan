// KM-2 — trang /ky-mon: bàn Kỳ Môn theo giờ. Engine lập và đọc bàn; web chỉ vẽ.
import { expect, test } from "@playwright/test";

test.describe("Kỳ Môn Độn Giáp", () => {
  test("HTML máy chủ đã có câu trả lời, bảng tám hướng, giải nghĩa và hỏi đáp", async ({ request }) => {
    const r = await request.get("/ky-mon");
    expect(r.status()).toBe(200);
    const html = await r.text();
    expect(html).toContain("Kỳ Môn Độn Giáp: giờ này nên đi hướng nào?");
    expect(html).toMatch(/là giờ (Tý|Sửu|Dần|Mão|Thìn|Tỵ|Ngọ|Mùi|Thân|Dậu|Tuất|Hợi)/);
    for (const cua of ["Cửa Khai", "Cửa Hưu", "Cửa Sinh", "Cửa Thương", "Cửa Đỗ", "Cửa Cảnh", "Cửa Tử", "Cửa Kinh"]) expect(html).toContain(cua);
    expect(html).toContain("開門宜遠行征討所向通達");                 // nguyên văn sách
    expect(html).toContain('"FAQPage"');
    expect(html).not.toMatch(/kinqimen|wikisource|đại hung|chắc chắn/i);   // BM-1 + lời không phán
    expect((html.match(/<h1/g) ?? []).length).toBe(1);
  });

  test("la bàn tám hướng: bấm hướng đọc chi tiết, chọn việc ra hướng và giờ hợp", async ({ page }) => {
    await page.goto("/ky-mon");
    const ban = page.getByTestId("ban-ky-mon");
    await expect(ban.locator("[data-cung]")).toHaveCount(8);
    for (const el of await ban.locator("[data-cung]").all()) expect(["thuan", "binh", "cham"]).toContain(await el.getAttribute("data-muc"));
    await expect(page.getByTestId("km-13-gio").locator("button")).toHaveCount(13);
    await expect(page.getByTestId("km-13-gio").locator('button[aria-current="time"]')).toHaveCount(1);

    await ban.locator('[data-cung="6"]').click();
    const ct = page.getByTestId("km-chi-tiet");
    await expect(ct).toContainText("Hướng Tây Bắc");
    await ct.getByText("Vì sao nói vậy").click();
    await expect(ct).toContainText(/Cửa .+ · sao .+ · thần/);

    await ban.getByRole("button", { name: "Đi xa, xuất phát" }).click();
    const viec = page.getByTestId("km-viec");
    await expect(viec).toContainText("Đi xa, xuất phát");
    await expect(viec).toContainText(/Giờ (Tý|Sửu|Dần|Mão|Thìn|Tỵ|Ngọ|Mùi|Thân|Dậu|Tuất|Hợi) \(/);
    await expect(viec).toContainText("lái xe cẩn thận");                 // câu ranh giới của việc

    // bấm khung giờ khác → la bàn đổi theo giờ ấy
    const gio = page.getByTestId("km-13-gio").locator("button").nth(6);
    await gio.click();
    await expect(gio).toHaveAttribute("aria-current", "time");
    await expect(page.getByTestId("km-gio")).toContainText("Giờ Ngọ");
  });

  test("đổi phép định cục: engine ghi chú phép trí nhuận", async ({ page }) => {
    await page.goto("/ky-mon");
    const ct = page.getByTestId("km-cach-tinh");
    await ct.locator("summary").click();
    await ct.locator("select").first().selectOption("tri_nhuan");
    await expect(ct).toContainText("chưa có bộ đối chiếu ngoài");
    await expect(page.getByTestId("ban-ky-mon").locator("[data-cung]")).toHaveCount(8);
  });

  test("điện thoại 390px: không tràn ngang, ô la bàn chạm được", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/ky-mon");
    await expect(page.getByTestId("ban-ky-mon").locator("[data-cung]")).toHaveCount(8);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
    const o = await page.getByTestId("ban-ky-mon").locator('[data-cung="1"]').boundingBox();
    expect(o!.width).toBeGreaterThanOrEqual(88);
  });

  test("API từ chối đầu vào lạ", async ({ request }) => {
    expect((await request.post("/api/ky-mon/ban", { data: { viec: "xo_so" } })).status()).toBe(422);
    expect((await request.post("/api/ky-mon/ban", { data: { ten: "A" } })).status()).toBe(422);
    expect((await request.post("/api/ky-mon/ngay", { data: { ngay: "2026-11-18", viec: "gap_go" } })).status()).toBe(200);
  });

  test("KM-3: Hôm nay có mục giờ và hướng thuận, dẫn sang /ky-mon", async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("hbt.hoso.v1", JSON.stringify({ v: 1, ho_ten: "Nguyen An", ngay: 24, thang: 10, nam: 1988, tao_luc: new Date().toISOString() })));
    await page.goto("/hom-nay");
    const muc = page.getByTestId("ky-mon-hom-nay");
    await expect(muc).toBeVisible();
    await expect(muc).toContainText("Giờ và hướng thuận hôm nay");
    await muc.locator("summary").click();
    await expect(muc.getByRole("link", { name: "Chọn theo việc bạn định làm" })).toHaveAttribute("href", "/ky-mon");
  });
});
