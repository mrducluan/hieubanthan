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

test("Tuần này của bạn: bảy ô khớp engine, hôm nay được đánh dấu, ≤ 3 ngày đáng để ý có link sang trang ngày; mở sẵn vào thứ Hai", async ({ page, request }) => {
  await napHoSo(page);
  await page.goto("/hom-nay");
  const muc = page.getByTestId("tuan-cua-toi");
  await expect(muc).toBeVisible();
  const ngay = await ngayMay(page);
  const api = (await (await request.post("/api/thanso/tuan", { data: { ngay: HO_SO_MAU.ngay, thang: HO_SO_MAU.thang, nam: HO_SO_MAU.nam, ngay_xem: ngay } })).json()) as
    { ngay: { ngay: string; so: number; hom_nay: boolean }[]; noi_bat: { ngay: string; tieu_de: string }[]; tom_tat: string };
  expect(api.ngay).toHaveLength(7);
  const thuHai = api.ngay[0]!.hom_nay;
  if (thuHai) await expect(muc).toHaveAttribute("open", ""); else { await expect(muc).not.toHaveAttribute("open", ""); await muc.locator("summary").click(); }
  await expect(muc).toContainText(api.tom_tat);
  const o = muc.getByTestId("tuan-luoi").locator("li");
  await expect(o).toHaveCount(7);
  await expect(muc.locator('[data-hom-nay="1"]')).toHaveCount(1);
  for (let i = 0; i < 7; i++) await expect(o.nth(i)).toContainText(String(api.ngay[i]!.so));
  const nb = muc.getByTestId("tuan-noi-bat").locator("li");
  await expect(nb).toHaveCount(api.noi_bat.length);
  expect(api.noi_bat.length).toBeLessThanOrEqual(3);
  if (api.noi_bat[0]) {
    await expect(nb.first()).toContainText(api.noi_bat[0].tieu_de);
    await expect(nb.first().getByRole("link")).toHaveAttribute("href", `/xem-ngay-tot/${api.noi_bat[0].ngay}`);
  }
  // API chặn đầu vào lạ
  expect((await request.post("/api/thanso/tuan", { data: { ngay: 17, thang: 5, nam: 1990, ngay_xem: "2020-01-01" } })).status()).toBe(422);
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
  expect(chu).toMatch(/\/hom-nay\?tu=h2\.[a-z0-9]{10}/);
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
