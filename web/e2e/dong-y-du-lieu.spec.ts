// ĐY-1 — Đồng ý xử lý dữ liệu cá nhân (Luật BVDLCN 91/2025): hỏi mềm ngay trên nút tính, không tích sẵn, không modal;
// chưa đồng ý thì KHÔNG gửi gì lên máy chủ; đồng ý rồi lần sau không hỏi; thu hồi xoá sạch; trang Tài khoản liệt kê.
import { test, expect, type Page } from "@playwright/test";
import { napDongY, napHoSo } from "./_hoso";
import { KHOA_DONG_Y_DL, PHIEN_BAN_DONG_Y } from "../lib/dong-y-du-lieu";

type SK = { su_kien: string } & Record<string, unknown>;
const suKien = (p: Page) => p.evaluate(() => ((window as unknown as { __hbt_su_kien?: SK[] }).__hbt_su_kien ?? []));
const docDongY = (p: Page) => p.evaluate((k) => JSON.parse(localStorage.getItem(k) ?? "null"), KHOA_DONG_Y_DL);
const docHoSo = (p: Page) => p.evaluate(() => localStorage.getItem("hbt.hoso.v1"));

async function goForm(page: Page) {
  await page.getByLabel("Họ và tên đầy đủ").fill("Nguyễn Đức Luân");
  await page.getByLabel("Ngày", { exact: true }).fill("24");
  await page.getByLabel("Tháng", { exact: true }).fill("10");
  await page.getByLabel("Năm", { exact: true }).fill("1988");
}

test("lần đầu: khối đồng ý + nút 'Đồng ý và xem kết quả'; chưa bấm thì không gọi API nào mang ngày sinh", async ({ page }) => {
  const goiApi: string[] = [];
  await page.route("**/api/**", (r) => { goiApi.push(new URL(r.request().url()).pathname); return r.fallback(); });
  await page.goto("/");
  await goForm(page);
  const khoi = page.getByTestId("dong-y-du-lieu");
  // Trục 2 UX: một dòng ngắn; câu cam kết đầy đủ + link chính sách gập/mở tại chỗ (không modal, không rời trang).
  await expect(khoi).toContainText("Ngày giờ sinh chỉ dùng để tính, không lưu trên máy");
  await expect(khoi.getByTestId("dong-y-chi-tiet")).toHaveCount(0);
  await khoi.getByRole("button", { name: "Chi tiết" }).click();
  await expect(khoi.getByRole("button", { name: "Chi tiết" })).toHaveAttribute("aria-expanded", "true");
  await expect(khoi.getByTestId("dong-y-chi-tiet")).toContainText("Singapore");
  await expect(khoi.getByTestId("dong-y-chi-tiet")).toContainText("rút lại được bất cứ lúc nào");
  await expect(khoi.getByRole("link", { name: "Chính sách quyền riêng tư" })).toHaveAttribute("href", "/chinh-sach-rieng-tu#dong-y");
  await expect(page.getByRole("button", { name: "Đồng ý và xem kết quả" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Xem con số của tôi" })).toHaveCount(0);
  await expect(page.getByTestId("da-dong-y")).toHaveCount(0);
  // Không ô tích sẵn nào trong form; xem trước đổi lịch chưa chạy (ngày sinh chưa đi đâu).
  expect(await page.locator("form input[type=checkbox]:checked").count()).toBe(0);
  await page.waitForTimeout(700);   // quá thời gian chờ gõ của xem trước (300 ms)
  await expect(page.getByTestId("doi-lich")).toBeEmpty();
  expect(goiApi.filter((d) => d.startsWith("/api/lich") || d.startsWith("/api/thanso")), goiApi.join(",")).toEqual([]);
  expect(await docDongY(page)).toBeNull();

  await page.getByRole("button", { name: "Đồng ý và xem kết quả" }).click();
  await expect(page).toHaveURL(/\/ban-than/);
  await expect(page.getByTestId("so-duong-doi")).toHaveText("6", { timeout: 60_000 });
  expect(await docDongY(page)).toMatchObject({ phien_ban: PHIEN_BAN_DONG_Y });
  expect(goiApi.some((d) => d.startsWith("/api/thanso"))).toBe(true);
  const ds = await suKien(page);
  expect(ds.find((e) => e.su_kien === "consent_given")).toMatchObject({ phien_ban: PHIEN_BAN_DONG_Y });
  for (const e of ds) expect(JSON.stringify(e)).not.toMatch(/1988|Luân|24\/10/);
});

test("trục 2 UX — điện thoại 390×844: nút 'Đồng ý và xem kết quả' nằm trong màn đầu, trên thanh tab dưới (không cuộn)", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const nut = page.getByRole("button", { name: "Đồng ý và xem kết quả" });
  await expect(nut).toBeVisible();
  await page.waitForTimeout(300);   // phông chữ / ảnh hero ổn định
  expect(await page.evaluate(() => scrollY)).toBe(0);
  const b = (await nut.boundingBox())!;
  expect(b.y + b.height).toBeLessThanOrEqual(844);
  // Thanh tab dưới (điện thoại) cố định ở đáy: nút phải nằm trọn phía trên nó, không bị che.
  const tab = await page.locator("nav").evaluateAll((ds) => ds.map((d) => d.getBoundingClientRect())
    .filter((r) => r.bottom >= innerHeight - 1 && r.height < 120).map((r) => r.top));
  if (tab.length) expect(b.y + b.height).toBeLessThanOrEqual(Math.min(...tab));
  // Khối đồng ý vẫn ở ngay trên nút, không ô tích sẵn.
  const k = (await page.getByTestId("dong-y-du-lieu").boundingBox())!;
  expect(k.y + k.height).toBeLessThanOrEqual(b.y);
  expect(await page.locator("form input[type=checkbox]:checked").count()).toBe(0);
});

test("đã đồng ý: lần sau không hỏi lại, xem trước đổi lịch chạy; Thu hồi xoá đồng ý + hồ sơ, form về đầu", async ({ page }) => {
  await napDongY(page);
  await page.goto("/");
  await expect(page.getByTestId("dong-y-du-lieu")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Xem con số của tôi" })).toBeVisible();
  await expect(page.getByTestId("da-dong-y")).toContainText("Bạn đã đồng ý");
  await goForm(page);
  await expect(page.getByTestId("doi-lich")).toContainText("Âm lịch: 14/9/1988");

  await page.getByRole("button", { name: "Thu hồi" }).click();
  expect(await docDongY(page)).toBeNull();
  expect(await docHoSo(page)).toBeNull();
  await expect(page.getByTestId("dong-y-du-lieu")).toBeVisible();
  await expect(page.getByRole("button", { name: "Đồng ý và xem kết quả" })).toBeVisible();
  await expect(page.getByLabel("Họ và tên đầy đủ")).toHaveValue("");
  await expect(page.getByLabel("Năm", { exact: true })).toHaveValue("");
  expect((await suKien(page)).some((e) => e.su_kien === "consent_withdrawn")).toBe(true);
});

test("bản đồng ý cũ (đổi PHIEN_BAN_DONG_Y) → coi như chưa đồng ý, hỏi lại", async ({ page }) => {
  await page.addInitScript((k) => localStorage.setItem(k, JSON.stringify({ phien_ban: "dl0", luc: "2026-01-01T00:00:00Z" })), KHOA_DONG_Y_DL);
  await page.goto("/");
  await expect(page.getByTestId("dong-y-du-lieu")).toBeVisible();
  await expect(page.getByRole("button", { name: "Đồng ý và xem kết quả" })).toBeVisible();
});

test("có hồ sơ: sửa hồ sơ không hỏi lại; Thu hồi trong form sửa xoá hồ sơ trên máy", async ({ page }) => {
  await napHoSo(page);
  await page.goto("/tai-khoan");
  await page.getByRole("button", { name: "Sửa", exact: true }).click();
  const form = page.getByRole("dialog").locator("form");
  await expect(form.getByRole("button", { name: "Lưu hồ sơ" })).toBeVisible();
  await expect(form.getByTestId("dong-y-du-lieu")).toHaveCount(0);
  await form.getByRole("button", { name: "Thu hồi" }).click();
  expect(await docHoSo(page)).toBeNull();
  expect(await docDongY(page)).toBeNull();
});

test("Tài khoản → 'Dữ liệu của tôi': liệt kê đồng ý trên máy, Thu hồi (có hỏi lại) xoá sạch; link bản sao qua email; chính sách có mục đồng ý", async ({ page }) => {
  await napHoSo(page);
  await page.goto("/tai-khoan");
  const khoi = page.getByTestId("du-lieu-cua-toi");
  await expect(khoi.getByTestId("dl-dong-y")).toContainText("Đã đồng ý ngày 30/09/2026");
  await expect(khoi.getByRole("link", { name: "Yêu cầu bản sao dữ liệu qua email" })).toHaveAttribute("href", /^mailto:contact@hieuban\.com\?subject=/);
  await khoi.getByRole("button", { name: "Thu hồi" }).click();
  const hop = page.getByRole("dialog");
  await expect(hop).toContainText("Thu hồi đồng ý?");
  await hop.getByRole("button", { name: "Thu hồi" }).click();
  await expect(khoi.getByTestId("dl-dong-y")).toContainText("Chưa đồng ý");
  await expect(page.getByTestId("ho-so-may")).toContainText("Tạo hồ sơ");
  expect(await docHoSo(page)).toBeNull();
  expect(await docDongY(page)).toBeNull();

  await page.goto("/chinh-sach-rieng-tu");
  const main = page.locator("main");
  await expect(main).toContainText("Cách bạn đồng ý và rút lại");
  await expect(main).toContainText("Đồng ý và xem kết quả");
  await expect(main).toContainText("im lặng không được coi là đồng ý");
  await expect(main.locator("#dong-y")).toBeVisible();
});
