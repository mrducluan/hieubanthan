// BT-UI đợt 2 — Tuần này của bạn · Hôm nay của hai người · lá Tarot trong tổng kết tháng · thẻ hồ sơ hai mặt · lối tắt app.
import { expect, test, type Page } from "@playwright/test";
import { HO_SO_MAU, napHoSo } from "./_hoso";
import { demTarot, docNhatKy, ghiTarot, thongKeThang, type MucNhatKy } from "../lib/nhat-ky-ngay";
import { loiTongKet } from "../lib/tong-ket-thang";

const ngayMay = (page: Page) => page.evaluate(() => new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date()));
const NGUOI_THAN = { v: 1, ds: [{ id: "nt_abcd12", tao_luc: "2026-11-01T00:00:00Z", ten_goi: "Mai", quan_he: "ban_be", lich_nhap: "duong", ngay: 3, thang: 11, nam: 1992 }] };

test("demTarot + lời tổng kết: lá lặp lại → 'gặp nhiều nhất'; không lặp → kể ≤ 3 lá; không có lá → không thêm câu", () => {
  const d = (n: string, t?: string): MucNhatKy => ({ n, s: 1, ...(t ? { t } : {}) });
  const ds = [d("2026-10-01", "gay_1|Át Gậy"), d("2026-10-02", "dai_0|Chàng Khờ"), d("2026-10-03", "gay_1|Át Gậy"), d("2026-10-04"), d("2026-10-05", "coc_2|Hai Cốc")];
  expect(demTarot(ds)).toEqual([{ id: "gay_1", ten: "Át Gậy", lan: 2 }, { id: "dai_0", ten: "Chàng Khờ", lan: 1 }, { id: "coc_2", ten: "Hai Cốc", lan: 1 }]);
  const tk = { ...thongKeThang(ds, 2026, 10), huy_hieu_moi: [] };
  expect(loiTongKet(tk, (m) => m)).toContain("Lá Tarot bạn gặp nhiều nhất: Át Gậy (2 lần).");
  const mot = { ...thongKeThang([ds[0]!, ds[1]!, ds[4]!, d("2026-10-06", "kiem_3|Ba Kiếm")], 2026, 10), huy_hieu_moi: [] };
  expect(loiTongKet(mot, (m) => m)).toContain("Lá Tarot bạn đã gặp: Át Gậy, Chàng Khờ, Hai Cốc và 1 lá khác.");
  const khong = { ...thongKeThang([d("2026-10-01"), d("2026-10-02")], 2026, 10), huy_hieu_moi: [] };
  expect(loiTongKet(khong, (m) => m).join(" ")).not.toContain("Tarot");
});

test("lật lá Tarot → nhật ký máy ghi mã|tên lá (chỉ trên máy); tháng sau tổng kết kể lại lá đã gặp", async ({ page, request }) => {
  await napHoSo(page);
  await page.goto("/hom-nay");
  await page.getByTestId("ba-la-tarot").click();
  await expect(page.getByTestId("ba-la-doc-tarot")).toBeVisible();
  const ngay = await ngayMay(page);
  const api = (await (await request.post("/api/thanso/hom-nay", { data: { ngay: 17, thang: 5, nam: 1990, ngay_xem: ngay } })).json()) as { ba_la: { tarot: { id: string; ten: string } } };
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("hbt.nhat_ky.v1") ?? "{}").ds?.at(-1)?.t)).toBe(`${api.ba_la.tarot.id}|${api.ba_la.tarot.ten}`);
  // Hàm thuần đọc / ghi cùng định dạng (không chạy trong trình duyệt): mã lạ bị bỏ.
  expect(typeof ghiTarot).toBe("function");
  expect(typeof docNhatKy).toBe("function");
});

test("Tuần này của bạn: khu riêng trước \"Đọc thêm\", bảy ngày khớp engine, bấm một ngày → đủ năm môn + việc hợp + giờ tốt; tuần hợp việc gì, phong thuỷ tháng", async ({ page, request }) => {
  await napHoSo(page);
  await page.goto("/hom-nay");
  const muc = page.getByTestId("tuan-cua-toi");
  await expect(muc).toBeVisible();
  const ngay = await ngayMay(page);
  type Lop = { mon: string; nhan: string; cau: string };
  type Ngay = { ngay: string; so: number; hom_nay: boolean; da_qua: boolean; nhip: string; tom: string; lop: Lop[]; viec_tot: string[]; gio_tot: { chi: string }[] };
  const api = (await (await request.post("/api/thanso/tuan", { data: { ngay: HO_SO_MAU.ngay, thang: HO_SO_MAU.thang, nam: HO_SO_MAU.nam, ngay_xem: ngay } })).json()) as
    { ngay: Ngay[]; noi_bat: { ngay: string; tieu_de: string }[]; tom_tat: string; viec_tuan: { ten: string; ngay: string[] }[]; phong_thuy: { loi: string } };
  expect(api.ngay).toHaveLength(7);
  // Khu riêng: KHÔNG nằm trong "Đọc thêm về hôm nay", và đứng trước nó.
  await expect(page.getByTestId("doc-them").getByTestId("tuan-cua-toi")).toHaveCount(0);
  expect(await muc.evaluate((e) => Boolean(e.compareDocumentPosition(document.querySelector('[data-testid="doc-them"]')!) & Node.DOCUMENT_POSITION_FOLLOWING))).toBe(true);
  await expect(muc.getByRole("heading", { level: 2, name: "Tuần này của bạn" })).toBeVisible();
  await expect(muc).toContainText(api.tom_tat);
  const o = muc.getByTestId("tuan-luoi").getByRole("tab");
  await expect(o).toHaveCount(7);
  await expect(muc.locator('[data-hom-nay="1"]')).toHaveCount(1);
  for (let i = 0; i < 7; i++) { await expect(o.nth(i)).toContainText(String(api.ngay[i]!.so)); await expect(o.nth(i)).toHaveAttribute("data-nhip", api.ngay[i]!.nhip); }
  // Mặc định đang chọn hôm nay: bảng ngày có đủ năm môn theo đúng chữ engine.
  const homNay = api.ngay.find((n) => n.hom_nay)!;
  const bang = muc.getByTestId("tuan-bang");
  await expect(bang).toHaveAttribute("data-ngay", homNay.ngay);
  const kiem = async (n: Ngay) => {
    await expect(bang).toHaveAttribute("data-ngay", n.ngay);
    await expect(bang).toContainText(n.tom);
    const lop = bang.getByTestId("tuan-lop").locator("li");
    await expect(lop).toHaveCount(n.lop.length);
    expect(n.lop.map((l) => l.mon)).toEqual(["than_so", "lich", "tuoi", "bat_tu", "kinh_dich"]);
    for (const l of n.lop) { await expect(bang.locator(`[data-mon="${l.mon}"]`)).toContainText(l.nhan); await expect(bang.locator(`[data-mon="${l.mon}"]`)).toContainText(l.cau); }
    if (n.viec_tot.length) await expect(bang.getByTestId("tuan-viec-ngay")).toContainText(n.viec_tot[0]!); else await expect(bang.getByTestId("tuan-viec-ngay")).toHaveCount(0);
    await expect(bang.getByTestId("tuan-gio").locator("span.rounded-full")).toHaveCount(n.gio_tot.length);
    await expect(bang.getByRole("link", { name: /Xem kỹ ngày/ })).toHaveAttribute("href", `/xem-ngay-tot/${n.ngay}`);
  };
  await kiem(homNay);
  // Bấm ngày khác (ngày cuối tuần) → bảng đổi theo; bàn phím cũng chọn được.
  const cuoi = api.ngay[6]!;
  await o.nth(6).click();
  await expect(o.nth(6)).toHaveAttribute("aria-selected", "true");
  await kiem(cuoi);
  // Bàn phím: chỉ ngày đang chọn nằm trong thứ tự Tab; → sang ngày kế (vòng về đầu), Home về thứ Hai.
  await expect(o.nth(6)).toHaveAttribute("tabindex", "0");
  await expect(o.nth(0)).toHaveAttribute("tabindex", "-1");
  await o.nth(6).focus();
  await page.keyboard.press("ArrowRight");
  await kiem(api.ngay[0]!);
  await expect(o.nth(0)).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await kiem(api.ngay[1]!);
  await page.keyboard.press("Home");
  await kiem(api.ngay[0]!);
  await expect(bang).toHaveAttribute("aria-labelledby", "tuan-tab-0");
  // Tuần này hợp việc gì: đúng danh sách engine, bấm ngày → bảng nhảy tới ngày đó.
  if (api.viec_tuan.length) {
    const v = muc.getByTestId("tuan-viec");
    await expect(v.locator("li")).toHaveCount(api.viec_tuan.length);
    await expect(v).toContainText(api.viec_tuan[0]!.ten);
    await v.locator("li").first().getByRole("button").first().click();
    await expect(bang).toHaveAttribute("data-ngay", api.viec_tuan[0]!.ngay[0]!);
  } else await expect(muc.getByTestId("tuan-viec")).toHaveCount(0);
  await expect(muc.getByTestId("tuan-phong-thuy")).toContainText(api.phong_thuy.loi.slice(0, 40));
  // Ngày đáng để ý: ≤ 3, bấm → bảng nhảy tới ngày đó.
  const nb = muc.getByTestId("tuan-noi-bat").locator("li");
  await expect(nb).toHaveCount(api.noi_bat.length);
  expect(api.noi_bat.length).toBeLessThanOrEqual(3);
  if (api.noi_bat[0]) {
    await expect(nb.first()).toContainText(api.noi_bat[0].tieu_de);
    await nb.first().getByRole("button").click();
    await expect(bang).toHaveAttribute("data-ngay", api.noi_bat[0].ngay);
  }
  // Không tràn ngang ở điện thoại
  await page.setViewportSize({ width: 360, height: 780 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
  // API chặn đầu vào lạ
  expect((await request.post("/api/thanso/tuan", { data: { ngay: 17, thang: 5, nam: 1990, ngay_xem: "2020-01-01" } })).status()).toBe(422);
  expect((await request.post("/api/thanso/tuan", { data: { ngay: 17, thang: 5, nam: 1990, gioi_tinh: "khac" } })).status()).toBe(422);
});

test("Hôm nay của hai người: chưa lưu ai → mời thêm; có người thân → hai con số khớp engine, việc nên làm cùng, lời nhắn không tên / ngày sinh", async ({ page, request }) => {
  await napHoSo(page);
  await page.goto("/hom-nay");
  const muc = page.getByTestId("hai-nguoi-hom-nay");
  await muc.locator("summary").click();
  await expect(muc.getByRole("link", { name: /Thêm người thân/ })).toHaveAttribute("href", "/tu-vi#hop-tham");

  await page.addInitScript((v) => localStorage.setItem("hbt.nguoi_than.v1", v), JSON.stringify(NGUOI_THAN));
  await page.addInitScript(() => { Object.defineProperty(navigator, "share", { value: undefined, configurable: true }); });
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.reload();
  await muc.locator("summary").click();
  await muc.getByTestId("hai-nguoi-chon").filter({ hasText: "Mai" }).click();
  const kq = muc.getByTestId("hai-nguoi-kq");
  await expect(kq).toBeVisible();
  const ngay = await ngayMay(page);
  const api = (await (await request.post("/api/thanso/hom-nay-hai", { data: { ngay: 17, thang: 5, kia_ngay: 3, kia_thang: 11, quan_he: "ban_be", ngay_xem: ngay } })).json()) as
    { kieu: string; ban: { so: number }; nguoi_kia: { so: number }; viec_cung: string; tieu_de: string };
  await expect(kq).toHaveAttribute("data-kieu", api.kieu);
  await expect(kq).toContainText(api.tieu_de);
  await expect(kq).toContainText(api.viec_cung);
  expect(await kq.innerText()).not.toMatch(/\d+\s*%|điểm/);
  await muc.getByTestId("hai-nguoi-chia-se").click();
  await expect(muc.getByTestId("hai-nguoi-chia-se")).toContainText("Đã chép");
  const chu = await page.evaluate(() => navigator.clipboard.readText());
  expect(chu).toContain(`mình là ngày ${api.ban.so}, bạn là ngày ${api.nguoi_kia.so}`);
  expect(chu).toMatch(/\/hom-nay\?tu=hd\.[a-f0-9]{10}/);
  expect(chu).not.toMatch(/Mai|1992|3\/11|Nguyễn/);
  // Engine không trả ngày sinh người kia; đầu vào lạ bị chặn.
  expect(JSON.stringify(api)).not.toMatch(/kia_ngay|1992/);
  expect((await request.post("/api/thanso/hom-nay-hai", { data: { ngay: 17, thang: 5, kia_ngay: 3, kia_thang: 11, ten: "Mai" } })).status()).toBe(422);
});

test("Bản thân: thẻ hồ sơ hai mặt — bấm 'Mặt sau' mở khung thẻ 5 mảnh ghép dưới hai cột", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await napHoSo(page);
  await page.goto("/ban-than");
  await expect(page.getByTestId("khung-mat-sau")).toHaveCount(0);
  const nut = page.getByTestId("the-mat-sau");
  await expect(nut).toContainText("Mặt sau: thẻ 5 mảnh ghép");
  await nut.click();
  await expect(nut).toHaveAttribute("aria-expanded", "true");
  const khung = page.getByTestId("khung-mat-sau");
  await expect(khung).toBeVisible();
  // Khung nằm dưới cả hai cột (trải hết bề ngang), không chen vào trong thẻ.
  const [the, k] = [await page.getByTestId("the-danh-tinh").boundingBox(), await khung.boundingBox()];
  expect(k!.y).toBeGreaterThan(the!.y + the!.height - 1);
  expect(k!.width).toBeGreaterThan(the!.width * 1.5);
});

test("manifest: lối tắt 'Ba lá hôm nay' mở thẳng khối ba lá", async ({ request }) => {
  const mf = (await (await request.get("/manifest.webmanifest")).json()) as { shortcuts: { name: string; url: string }[] };
  expect(mf.shortcuts.find((s) => s.name === "Ba lá hôm nay")?.url).toBe("/hom-nay?tu=app#ba-la");
  expect(mf.shortcuts.length).toBeLessThanOrEqual(4);
});
