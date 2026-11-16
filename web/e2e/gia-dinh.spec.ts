// GD-1 đợt 1 (2026-11-16) — "Nhà mình": thêm người nhà chỉ trên máy (cần tự tích đồng ý), engine ghép năm của cả nhà.
// Kiểm: không tích đồng ý → không lưu; tên gọi không gửi lên máy chủ; bảng năm + cặp nổi bật + việc chung hiện ra; xoá được;
// xoá hồ sơ thì xoá luôn người nhà; noindex; 390px không cuộn ngang.
import { test, expect, type Page } from "@playwright/test";
import { napHoSo, HO_SO_MAU } from "./_hoso";

async function them(page: Page, vai: string, ten: string, nam: string, gt?: string, dongY = true) {
  const f = page.getByTestId("form-nguoi-nha");
  await f.locator("#gd-vai").selectOption(vai);
  await f.locator("#gd-ten").fill(ten);
  await f.locator("#gd-nam").fill(nam);
  if (gt) await f.locator("#gd-gt").selectOption(gt);
  if (dongY) await f.getByTestId("gd-dong-y").check();
  await f.getByRole("button", { name: "Lưu người này" }).click();
}

test("Nhà Tôi: thêm người nhà → bảng năm, cặp nổi bật, việc chung; tên không rời máy", async ({ page, request }) => {
  const html = await (await request.get("/gia-dinh")).text();
  expect(html).toMatch(/<meta name="robots" content="noindex/);
  await napHoSo(page, HO_SO_MAU);                         // 17/05/1990 nam → Canh Ngọ
  const gui: string[] = [];
  page.on("request", (r) => { if (r.url().includes("/api/gia-dinh")) gui.push(r.postData() ?? ""); });
  await page.goto("/gia-dinh");
  await them(page, "con", "Bé Na", "2018", "nu", false);
  await expect(page.getByTestId("form-nguoi-nha").getByRole("alert")).toContainText("Tích ô đồng ý");
  await page.getByTestId("gd-dong-y").check();
  await page.getByRole("button", { name: "Lưu người này" }).click();
  await them(page, "anh_chi", "Anh Hai", "1984", "nam");
  await expect(page.getByTestId("ds-nguoi-nha").locator("li")).toHaveCount(3);
  const bang = page.getByTestId("bang-nha");
  await expect(bang.getByTestId("the-nguoi-nha").locator("li")).toHaveCount(3, { timeout: 20_000 });
  await expect(bang).toContainText("Bé Na");
  // 1990 Ngọ – 2018 Tuất tam hợp (điểm sáng); 1990 Ngọ – 1984 Tý xung (nên để ý)
  const cap = bang.getByTestId("cap-nha");
  // GD-2: mỗi cặp có nhịp gộp từ nhiều lớp (data-nhip) + các lớp + từng mặt; có sơ đồ nhà, lịch 5 năm, lá số của bạn
  await expect(cap.locator("li[data-nhip]")).toHaveCount(3);
  await expect(cap.locator('li[data-nhip]').first()).toContainText("Nên làm");
  await cap.getByTestId("cap-mo").first().click();
  await expect(cap.locator("details[open]").first()).toContainText("Vì sao nói vậy");
  await expect(bang.getByTestId("so-do-nha").locator("circle")).toHaveCount(3);
  await expect(bang.getByTestId("lich-nha").locator("ol > li")).toHaveCount(5);
  const ls = bang.getByTestId("la-so-cua-ban");
  await expect(ls).toContainText("Theo Tử vi");
  await expect(ls).toContainText("Theo Bát tự");
  await expect(ls).toContainText("Bé Na");
  await expect(bang.getByTestId("viec-chung").locator('a[href="/xem-ngay-tot#chon-ngay-nhieu"]')).toBeVisible();
  expect(gui.length).toBeGreaterThan(0);
  for (const g of gui) { expect(g).not.toContain("Bé Na"); expect(g).not.toContain("Anh Hai"); expect(g).not.toContain(HO_SO_MAU.ho_ten); }
  expect(await bang.innerText()).not.toMatch(/khắc|giải hạn|xui|\bđiểm \d/i);
  // xoá một người
  await page.getByRole("button", { name: "Xoá Anh Hai" }).click();
  await expect(page.getByTestId("ds-nguoi-nha").locator("li")).toHaveCount(2);
  const ev = await page.evaluate(() => JSON.stringify((window as unknown as { __hbt_su_kien?: unknown[] }).__hbt_su_kien ?? []));
  expect(ev).toContain("family_member_added"); expect(ev).toContain("family_viewed");
  expect(ev).not.toContain("Bé Na");
});

test("Nhà Tôi: 390px không cuộn ngang; lưu trên máy; Bản thân có lối vào", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await napHoSo(page, HO_SO_MAU);
  await page.goto("/gia-dinh");
  await them(page, "me", "Mẹ", "1966", "nu");
  await expect(page.getByTestId("bang-nha")).toBeVisible({ timeout: 20_000 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
  expect(await page.evaluate(() => localStorage.getItem("hbt.gia_dinh.v1"))).toContain("Mẹ");
  await page.goto("/ban-than");
  await expect(page.getByTestId("loi-gia-dinh")).toHaveAttribute("href", "/gia-dinh");
});

// GD-MENU (2026-11-16): "Nhà Tôi" là menu con của Bản thân; ở /gia-dinh mục cha "Bản thân" sáng; thẻ ở /ban-than hiện số người.
test("Nhà Tôi: có trong menu Bản thân, thẻ Bản thân hiện số người, lối vào ở Tài khoản", async ({ page }) => {
  await napHoSo(page, HO_SO_MAU);
  await page.goto("/ban-than");
  await expect(page.getByTestId("loi-gia-dinh")).toContainText("Nhà Tôi");
  await expect(page.getByTestId("loi-gia-dinh-so")).toHaveText("Thêm người nhà");
  await page.goto("/gia-dinh");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Nhà Tôi");
  await expect(page.locator('header a[href="/gia-dinh"]').first()).toBeAttached();
  await them(page, "me", "Mẹ", "1966", "nu");
  await expect(page.getByTestId("bang-nha")).toBeVisible({ timeout: 20_000 });
  await page.goto("/ban-than");
  await expect(page.getByTestId("loi-gia-dinh-so")).toHaveText("Đã có 1 người");
  await page.goto("/tai-khoan");
  await expect(page.getByTestId("dl-gia-dinh-mo")).toHaveAttribute("href", "/gia-dinh");
});
