// CRO-1 (2026-11-22) — sửa phễu quảng cáo → nạp Sao sau khi rà Meta Ads + đi thử phễu trên điện thoại:
// mở khoá báo cáo không mang chữ "luan-giai" vẫn là báo cáo, giá có số tiền, gói Lần đầu 59.000 ₫, đăng nhập trong app
// Facebook, thanh mở khoá dính đáy, nút xuống form + "Không biết giờ", tiêu đề /than-so, Meta: AddToCart + value.
import { test, expect } from "@playwright/test";
import { nguonCuaUrl } from "../lib/goi-api";
import { giaVnd } from "../lib/loi-sao";
import { appNhung, xepNhaCungCap } from "../lib/trinh-duyet-nhung";
import { GOI_LAN_DAU, goiGoiY, goiMacDinh, goiNangCap, laGoiDacBiet, locGoiLanDau } from "../lib/thanh-toan/nap-dau";
import { datGiaTriMeta, metaSuKien } from "../lib/meta-pixel";
import { napHoSo } from "./_hoso";

const GOI = [
  { ma: "lan_dau", ten: "Lần đầu", gia_vnd: 59000, sao: 59, nhan: "Lần đầu", mo_ta: "Chỉ lần nạp đầu của mỗi tài khoản" },
  { ma: "le_1", ten: "Một lần xem", gia_vnd: 99000, sao: 99, nhan: null, mo_ta: "" },
  { ma: "doi_2", ten: "Hai lần xem", gia_vnd: 199000, sao: 200, nhan: null, mo_ta: "" },
  { ma: "ba_3", ten: "Ba lần xem", gia_vnd: 249000, sao: 300, nhan: "Phổ biến", mo_ta: "" },
];

test("thuần: route báo cáo không mang chữ luan-giai vẫn đi luồng mở khoá báo cáo", () => {
  expect(nguonCuaUrl("/api/thanso/ban-do-con-so")).toBe("luan_giai");
  expect(nguonCuaUrl("/api/thoi-gian-toi")).toBe("luan_giai");
  expect(nguonCuaUrl("/api/chan-dung")).toBe("luan_giai");
  expect(nguonCuaUrl("/api/tuvi/luan-giai")).toBe("luan_giai");
  expect(nguonCuaUrl("/api/x/bat-ky", { "x-mo-khoa": "1" })).toBe("luan_giai");
  expect(nguonCuaUrl("/api/thanso/hoi")).toBe("hoi");
  expect(nguonCuaUrl("/api/tuvi/hoi")).toBe("hoi");
});

test("thuần: số tiền viết kiểu Việt, không phụ thuộc ICU", () => {
  expect(giaVnd(69)).toBe("69.000 ₫");
  expect(giaVnd(99)).toBe("99.000 ₫");
  expect(giaVnd(1234)).toBe("1.234.000 ₫");
  expect(giaVnd(0)).toBe("0 ₫");
});

test("thuần: nhận biết trình duyệt trong app + xếp nút đăng nhập", () => {
  const FB = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 [FBAN/FBIOS;FBAV/440.0]";
  const IG = "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36 Instagram 310.0.0";
  const ZL = "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/119 Mobile Safari/537.36 Zalo android/12";
  const SAF = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1";
  expect(appNhung(FB)).toBe("facebook");
  expect(appNhung(IG)).toBe("instagram");
  expect(appNhung(ZL)).toBe("zalo");
  expect(appNhung(SAF)).toBeNull();
  expect(xepNhaCungCap(["google", "zalo", "facebook"], null)).toEqual(["google", "zalo", "facebook"]);
  expect(xepNhaCungCap(["google", "zalo", "facebook"], "facebook")).toEqual(["facebook", "zalo", "google"]);
  expect(xepNhaCungCap(["google", "facebook"], "instagram")).toEqual(["facebook", "google"]);
  expect(xepNhaCungCap(["google", "zalo", "facebook"], "zalo")).toEqual(["zalo", "facebook", "google"]);
  expect(xepNhaCungCap(["google"], "facebook")).toEqual(["google"]);
});

test("thuần: gói Lần đầu — gợi ý khi vừa đủ phần thiếu, không chọn sẵn, không là gói đích, ẩn khi đã nạp", () => {
  expect(laGoiDacBiet(GOI_LAN_DAU)).toBe(true);
  // Báo cáo ưu đãi 69 Sao, đã nhận 10 Sao chào mừng → thiếu 59 → gói Lần đầu vừa đủ (59.000 ₫ thay vì 99.000 ₫).
  expect(goiGoiY(GOI, 59)?.ma).toBe("lan_dau");
  expect(goiGoiY(GOI, 89)?.ma).toBe("le_1");
  expect(goiMacDinh(GOI)?.ma).toBe("ba_3");
  expect(goiNangCap(GOI, "lan_dau", 99)?.goi.ma).toBe("ba_3");
  expect(locGoiLanDau(GOI, { lan_dau: false }).map((g) => g.ma)).not.toContain("lan_dau");
  expect(locGoiLanDau(GOI, { lan_dau: true }).map((g) => g.ma)).toContain("lan_dau");
  expect(locGoiLanDau(GOI, null).map((g) => g.ma)).toContain("lan_dau");
});

test("thuần: Meta — AddToCart khi BẤM mở khoá (một lần / mảng / phiên), có value; InitiateCheckout có value", async () => {
  const ds: unknown[][] = [];
  const g = globalThis as unknown as { window?: unknown; sessionStorage?: Storage; localStorage?: Storage };
  const kho = new Map<string, string>();
  const st = { getItem: (k: string) => kho.get(k) ?? null, setItem: (k: string, v: string) => void kho.set(k, v), removeItem: (k: string) => void kho.delete(k) } as unknown as Storage;
  const cu = { window: g.window, ss: g.sessionStorage, ls: g.localStorage };
  g.window = { fbq: (...a: unknown[]) => ds.push(a), location: { href: "https://hieuban.com/bat-tu" } };
  g.sessionStorage = st; g.localStorage = st;
  try {
    datGiaTriMeta(69000);
    metaSuKien("unlock_clicked", { mo_dun: "battu", kind: "bam" });
    metaSuKien("unlock_clicked", { mo_dun: "battu", kind: "bam" });     // lần hai cùng phiên: không gửi
    metaSuKien("unlock_clicked", { mo_dun: "tuvi", kind: "tu_dong" });   // tự mở lại: không gửi
    datGiaTriMeta(59000);
    metaSuKien("checkout_started", { kind: "lan_dau", goi: "lan_dau" });
    metaSuKien("checkout_started", { kind: "le_1", goi: "le_1" });        // không đặt giá trị → không có value
  } finally { g.window = cu.window; g.sessionStorage = cu.ss; g.localStorage = cu.ls; }
  expect(ds).toEqual([
    ["track", "AddToCart", { content_category: "battu", content_type: "product", value: 69000, currency: "VND" }],
    ["track", "InitiateCheckout", { content_type: "lan_dau", content_ids: ["lan_dau"], value: 59000, currency: "VND" }],
    ["track", "InitiateCheckout", { content_type: "le_1", content_ids: ["le_1"], currency: "VND" }],
  ]);
});

test("/than-so chưa có hồ sơ: tiêu đề nói lời hứa, không còn 'Nhập tên và ngày sinh để bắt đầu'", async ({ page }) => {
  await page.goto("/than-so");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Bạn là số mấy?");
  await expect(page.getByText("ba điểm mù", { exact: false }).first()).toBeVisible();
});

test("/bat-tu điện thoại chưa có hồ sơ: nút xuống form ở màn đầu, bấm thì ô nhập vào màn hình; 'Không biết giờ' bấm được", async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  await page.goto("/bat-tu");
  const nut = page.getByTestId("nut-xuong-form");
  await expect(nut).toBeVisible();
  const hop = await nut.boundingBox();
  expect(hop && hop.y + hop.height).toBeLessThan(844);
  await nut.click();
  const khoi = page.getByTestId("moi-lap-la-so");
  await expect(khoi.locator("input").first()).toBeInViewport();
  const kbg = khoi.getByTestId("nut-khong-biet-gio");
  await expect(kbg).toHaveAttribute("aria-pressed", "false");
  await kbg.click();
  await expect(kbg).toHaveAttribute("aria-pressed", "true");
  await expect(khoi.locator("#gio-sinh")).toBeDisabled();
  await expect(khoi.locator("#do-tin-gio")).toHaveValue("unknown");
  await ctx.close();
});

const MOI = (cau: string) => ({ diem_nhan: "Điểm nhấn", cau_hoi: cau, so_doan: 4, phut_doc: 2 });
const BAN_DO = {
  mo_dun: "thanso", ket: "Kết.", trang_thai: "nhap_ai", dien_dat: "mau", so_khoa: 2,
  chuong: [
    { ma: "tong_quan", tieu_de: "Tổng quan", doan: Array.from({ length: 40 }, (_, i) => `Đoạn mở miễn phí số ${i + 1}. `.repeat(6)) },
    { ma: "nghich_ly", tieu_de: "Nghịch lý bên trong", khoa: true, moi_xem: MOI("Vì sao bạn hay nghĩ một đằng làm một nẻo?") },
    { ma: "muoi_hai", tieu_de: "12 tháng tới", khoa: true, moi_xem: MOI("Tháng nào để khởi sự?") },
  ],
  phi: { sao: 34, ly_do: "xem_truoc", khoa: true, dang_nhap: false, so_du: null, thuong_chao_mung: 10 },
};

test("Bản đồ con số (/than-so): bấm Mở toàn bộ khi chưa đăng nhập → THẲNG tới đăng nhập (không còn hộp 'Hết câu hỏi')", async ({ page }) => {
  await page.route("**/api/luan-giai/phi*", (r) => r.fulfill({ json: { thu: true, gia: 34 } }));
  await page.route("**/api/thanso/ban-do-con-so", (r) => r.request().headers()["x-mo-khoa"] === "1"
    ? r.fulfill({ status: 402, json: { error: "Đăng nhập để mở toàn bộ báo cáo.", can: "dang_nhap", gia: 34, thuong: 10 } })
    : r.fulfill({ json: BAN_DO }));
  await napHoSo(page);
  await page.goto("/than-so");
  const nut = page.getByTestId("lg-mo-khoa");
  await expect(nut).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId("lg-gia-vnd")).toHaveText("(≈ 34.000 ₫)");
  await expect(page.getByTestId("lg-tin-cay")).toContainText("hoàn tiền trong 7 ngày");
  await nut.click();
  await expect(page).toHaveURL(/\/dang-nhap\?tiep=%2Fthan-so&tu=bao_cao&qua=10$/);
  await expect(page.getByText("Hết câu hỏi miễn phí hôm nay")).toHaveCount(0);
});

test("thanh mở khoá dính đáy: hiện khi đọc qua đầu bài, ẩn khi tới hộp mở khoá cuối", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route("**/api/luan-giai/phi*", (r) => r.fulfill({ json: { thu: true, gia: 34 } }));
  await page.route("**/api/thanso/ban-do-con-so", (r) => r.fulfill({ json: BAN_DO }));
  await napHoSo(page);
  await page.goto("/than-so");
  const thanh = page.getByTestId("lg-thanh-day");
  await expect(page.getByTestId("lg-mo-khoa")).toBeAttached({ timeout: 30_000 });
  await expect(thanh).toHaveAttribute("data-hien", "0");
  await page.getByText("Đoạn mở miễn phí số 20.", { exact: false }).first().scrollIntoViewIfNeeded();
  await expect(thanh).toHaveAttribute("data-hien", "1");
  await expect(thanh).toContainText("Đọc tiếp 2 chương");
  await expect(thanh).toContainText("≈ 34.000 ₫");
  // Dính đáy MÀN HÌNH (gắn vào body, không bám khung kính của bài): đáy thanh nằm trong màn hình, trên tab dưới.
  const hop = await thanh.boundingBox();
  expect(hop && hop.y + hop.height).toBeLessThanOrEqual(844);
  expect(hop && hop.y).toBeGreaterThan(844 - 200);
  await page.getByTestId("lg-phan-khoa").scrollIntoViewIfNeeded();
  await expect(thanh).toHaveAttribute("data-hien", "0");
});

// CRO-2 (2026-11-23) — áp CRO-1 cho các money page còn lại: Tử vi tự mở chương 1 + nút đầu lá số xuống bài luận + Sách xưa
// dưới bài luận; Chân dung + Thời gian tới có nút xuống ô nhập trên điện thoại.
test("/tu-vi có hồ sơ: chương 1 tự tải (không cần bấm), nút đầu lá số trỏ #luan-giai, Sách xưa nằm DƯỚI bài luận", async ({ page }) => {
  await napHoSo(page);
  const [res] = await Promise.all([
    page.waitForResponse((r) => r.url().endsWith("/api/tuvi/luan-giai")),
    page.goto("/tu-vi"),
  ]);
  expect(res.request().headers()["x-mo-khoa"]).toBeUndefined();   // tự tải là bản xem trước, không bao giờ trừ Sao
  const bc = page.getByTestId("luan-giai-toan-bo");
  await expect(bc).toBeVisible({ timeout: 60_000 });
  await expect(page.getByTestId("tu-vi-den-luan-giai")).toHaveAttribute("href", "#luan-giai");
  const sach = page.getByTestId("sach-ghi").or(page.getByTestId("sach-xua")).first();
  await expect(sach).toBeAttached();
  const [yBc, ySach] = await Promise.all([bc.evaluate((e) => e.getBoundingClientRect().top + scrollY), sach.evaluate((e) => e.getBoundingClientRect().top + scrollY)]);
  expect(ySach).toBeGreaterThan(yBc);
});

for (const [duong, chon] of [["/chan-dung", "moi-lap-la-so"], ["/thoi-gian-toi", "tgt-nhap"]] as const) {
  test(`${duong} điện thoại chưa có hồ sơ: nút xuống ô nhập ở màn đầu, bấm thì ô nhập vào màn hình`, async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const page = await ctx.newPage();
    await page.goto(duong);
    const nut = page.getByTestId("nut-xuong-form");
    await expect(nut).toBeVisible();
    const hop = await nut.boundingBox();
    expect(hop && hop.y + hop.height).toBeLessThan(844);
    await nut.click();
    await expect(page.getByTestId(chon).locator("input").first()).toBeInViewport();
    await ctx.close();
  });
}
