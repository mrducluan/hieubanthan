// VH-1 (docs/LUAN-GIAI-DOI-SONG.md mục 8) — chương "Vận hạn & điều nên tránh" của Luận giải Tử vi + Bát tự đời sống:
// dòng 10 năm (chấm màu theo mức, năm nay, cờ dân gian, bấm năm → Nên tránh / Nên làm), 12 tháng tới (Bát tự), nhãn
// "Cần lưu ý", chương không mang chip mức, điện thoại 360px, chương khoá SAO-2 KHÔNG lộ dòng 10 năm / lời năm.
// Báo cáo là fixture SINH TỪ ENGINE THẬT (e2e/fixtures/luan-giai-*.json). Đặt VH_ANH_DIR để lưu ảnh chụp.
import { test, expect, type Page } from "@playwright/test";
import { napHoSo } from "./_hoso";
import { catXemTruoc, type BaoCaoDay } from "../lib/sao-xem-truoc";
import FX_TV from "./fixtures/luan-giai-doi-song.json";
import FX_BT from "./fixtures/luan-giai-bat-tu.json";

type Nam = { nam: number; muc: string; hien_tai: boolean; co: { ma: string; nhan: string }[]; y: string;
  nen_tranh: string | null; nen_lam: string | null };
type ChuongVH = { ma: string; hop: { noi_dung: string }[]; dong_nam: Nam[]; thang_toi?: { muc: string }[];
  moi_xem: { diem_nhan: string; cau_hoi: string } };
const vh = (bc: { chuong: unknown[] }) => bc.chuong.find((c) => (c as { ma: string }).ma === "van_han") as ChuongVH;
const ANH = process.env.VH_ANH_DIR;
const CO_NGAN = new Set(["nam_tuoi", "xung_tuoi", "va_tuoi", "tam_tai", "xung_ngay"]);

async function mo(page: Page, mang: "tu-vi" | "bat-tu", bc: object, thu = false) {
  await page.route("**/api/luan-giai/phi*", (r) => r.fulfill({ json: { thu, gia: 10 } }));
  await page.route(`**/api/${mang === "tu-vi" ? "tuvi" : "battu"}/luan-giai`, (r) => r.fulfill({ json: bc }));
  await page.route("**/api/kiem-chung/ty-le**", (r) => r.fulfill({ json: {} }));
  await page.route("**/api/kiem-chung", (r) => r.fulfill({ json: { ok: false, ly_do: "chua_bat" } }));
  await page.route("**/api/luan-giai/tuy-chon", (r) => r.fulfill({ json: { tu_luu_luan_giai: false } }));
  await napHoSo(page);
  await page.goto(`/${mang}`);
}

test("thuần: khoá SAO-2 bỏ hẳn dòng 10 năm, lời năm và hộp cốt lõi của chương Vận hạn", () => {
  for (const fx of [FX_TV, FX_BT]) {
    const bc = fx.bao_cao as unknown as BaoCaoDay & { cot_loi: { tu_chuong: string }[] };
    const c = vh(bc);
    expect(bc.cot_loi.some((h) => h.tu_chuong === "van_han")).toBe(true);   // lá mẫu có năm cần lưu ý trong 3 năm tới
    const x = catXemTruoc(bc, 1);
    const s = JSON.stringify(x);
    for (const g of c.dong_nam) expect(s).not.toContain(g.y);
    for (const h of c.hop) expect(s).not.toContain(h.noi_dung);
    expect(s).not.toContain("dong_nam");
    expect(x.chuong.find((k) => k.ma === "van_han")).toEqual({ ma: "van_han", tieu_de: "Vận hạn & điều nên tránh", khoa: true, moi_xem: c.moi_xem });
    // Lời mời trung tính: điểm nhấn là năm thuận / năm đáng dồn sức, không đếm năm phải tránh.
    expect(c.moi_xem.diem_nhan).not.toMatch(/đi chậm|lưu ý|tránh/);
    expect(c.moi_xem.cau_hoi).not.toMatch(/\d/);
  }
});

test("Tử vi: dòng 10 năm — năm nay, cờ dân gian, bấm năm cần lưu ý ra Nên tránh / Nên làm", async ({ page }) => {
  const BC = FX_TV.bao_cao;
  const c = vh(BC);
  await mo(page, "tu-vi", BC);
  await page.getByRole("button", { name: "Xem luận giải" }).click();
  const ch = page.getByTestId("lg-chuong-van_han");
  await expect(ch.getByRole("heading", { level: 3 })).toContainText("Vận hạn & điều nên tránh");
  await expect(ch.getByTestId("chip-muc")).toHaveCount(0);
  await ch.getByTestId("lg-mo-chuong").click();          // Trục 1: chương sau gập sẵn
  const dong = ch.getByTestId("dong-muoi-nam");
  await dong.scrollIntoViewIfNeeded();
  const nam = dong.getByTestId("nam-van-han");
  await expect(nam).toHaveCount(10);
  await expect(nam.first()).toHaveAttribute("data-hien-tai", "1");
  await expect(nam.first()).toContainText("Năm nay");
  for (const [i, g] of c.dong_nam.entries()) await expect(nam.nth(i)).toHaveAttribute("data-muc", g.muc);
  await expect(dong.getByTestId("co-nam")).toHaveCount(c.dong_nam.filter((g) => g.co.some((x) => CO_NGAN.has(x.ma))).length);
  // Màu chấm: hổ phách cho "Cần lưu ý", không đỏ.
  const can = c.dong_nam.find((g) => g.muc === "can_chu_dong")!;
  const nut = dong.locator(`[data-testid=nam-van-han][data-nam="${can.nam}"]`);
  const mau = await nut.locator(".cham-vh").evaluate((e) => getComputedStyle(e).backgroundColor);
  expect(mau).toBe("rgb(240, 140, 60)");
  // Mặc định mở năm cần lưu ý gần nhất; bấm năm khác rồi bấm lại.
  const ct = dong.getByTestId("nam-chi-tiet");
  await expect(ct).toHaveAttribute("data-nam", String(can.nam));
  await nam.first().click();
  await expect(ct).toHaveAttribute("data-nam", String(c.dong_nam[0]!.nam));
  await expect(nam.first()).toHaveAttribute("aria-pressed", "true");
  await nut.click();
  await expect(ct.getByTestId("nam-chi-tiet-muc")).toHaveText("Cần lưu ý");
  await expect(ct.getByTestId("nen-tranh")).toContainText(can.nen_tranh!);
  await expect(ct.getByTestId("nen-lam")).toContainText(can.nen_lam!);
  // Hộp của chương: năm cần lưu ý có cả Nên tránh và Nên làm.
  await expect(ch.getByTestId("hop-noi-bat").filter({ hasText: "Nên tránh:" }).first()).toContainText("Nên làm:");
  if (ANH) await dong.screenshot({ path: `${ANH}/tu-vi-dong-10-nam.png` });
  const chu = (await ch.innerText()).toLowerCase();
  for (const cam of ["xấu", "tai hoạ", "giải hạn", "định mệnh", "đếm ngược"]) expect(chu).not.toContain(cam);
});

test("Bát tự: dòng 10 năm hai cách + 12 tháng tới theo tiết", async ({ page }) => {
  const BC = FX_BT.bao_cao;
  const c = vh(BC);
  await mo(page, "bat-tu", BC);
  await page.getByRole("button", { name: "Xem luận giải" }).click();
  const ch = page.getByTestId("lg-chuong-van_han");
  await ch.getByTestId("lg-mo-chuong").click();
  const dong = ch.getByTestId("dong-muoi-nam");
  await dong.scrollIntoViewIfNeeded();
  await expect(dong.getByTestId("nam-van-han")).toHaveCount(10);
  const tt = dong.getByTestId("thang-toi");
  await expect(tt.getByRole("img")).toHaveCount(12);
  for (const [i, t] of c.thang_toi!.entries()) await expect(tt.locator(".cham-vh").nth(i)).toHaveAttribute("data-muc", t.muc);
  const can = c.dong_nam.find((g) => g.muc === "can_chu_dong")!;
  await dong.locator(`[data-testid=nam-van-han][data-nam="${can.nam}"]`).click();
  await expect(dong.getByTestId("nam-chi-tiet")).toContainText(can.nen_tranh!);
  const co = c.dong_nam.find((g) => g.co.some((x) => x.ma === "nam_tuoi"))!;
  await dong.locator(`[data-testid=nam-van-han][data-nam="${co.nam}"]`).click();
  await expect(dong.getByTestId("co-chi-tiet").first()).toContainText("Theo tập quán dân gian — năm tuổi");
  if (ANH) await dong.screenshot({ path: `${ANH}/bat-tu-dong-10-nam.png` });
});

test("điện thoại 360px: dòng 10 năm cuộn trong khung riêng, trang không cuộn ngang", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 });
  await mo(page, "bat-tu", FX_BT.bao_cao);
  await page.getByRole("button", { name: "Xem luận giải" }).click();
  await page.getByTestId("lg-chuong-van_han").getByTestId("lg-mo-chuong").click();
  const dong = page.getByTestId("dong-muoi-nam");
  await dong.scrollIntoViewIfNeeded();
  const b = await dong.boundingBox();
  expect(b!.x).toBeGreaterThanOrEqual(0);
  expect(b!.x + b!.width).toBeLessThanOrEqual(360);
  const rong = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
  expect(rong[0]).toBeLessThanOrEqual(rong[1]!);
  const nam = dong.getByTestId("nam-van-han");
  await nam.nth(9).scrollIntoViewIfNeeded();
  await nam.nth(9).click();
  await expect(dong.getByTestId("nam-chi-tiet")).toHaveAttribute("data-nam", String(vh(FX_BT.bao_cao).dong_nam[9]!.nam));
  if (ANH) await dong.screenshot({ path: `${ANH}/bat-tu-dong-10-nam-360.png` });
});

test("SAO-2: chương Vận hạn khoá chỉ hiện tiêu đề + lời mời, không có dòng 10 năm", async ({ page }) => {
  const BC = FX_TV.bao_cao as unknown as BaoCaoDay;
  const xem = { ...catXemTruoc(BC, 1), phi: { sao: 10, ly_do: "xem_truoc", khoa: true, dang_nhap: true, so_du: 20 } };
  await mo(page, "tu-vi", xem, true);
  await page.getByRole("button", { name: "Đọc miễn phí chương đầu" }).click();
  await expect(page.getByTestId("lg-chuong-khoa")).toHaveCount(12);
  await expect(page.getByTestId("dong-muoi-nam")).toHaveCount(0);
  const khoa = page.getByTestId("lg-chuong-khoa").filter({ hasText: "Vận hạn & điều nên tránh" });
  await expect(khoa).toContainText(vh(FX_TV.bao_cao).moi_xem.cau_hoi);
  const chu = await page.getByTestId("luan-giai-toan-bo").innerText();
  for (const g of vh(FX_TV.bao_cao).dong_nam) expect(chu).not.toContain(g.y);
});
