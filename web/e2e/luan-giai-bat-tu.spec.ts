// BT-ĐS (docs/LUAN-GIAI-DOI-SONG.md mục 6) — Luận giải Bát tự "đời sống" dùng chung khung với Tử vi: Điều quan trọng
// nhất, mục lục 13 chương (VH-1 thêm Vận hạn), chip mức, thanh sức tự thân, biểu đồ 5 hành + hai cách gợi ý bù (không chọn thay), dải đại vận
// hai cách + dòng thời gian, kiểm chứng (phái "tu_binh", mã ds.bt.*), lưu bài, điện thoại 360px, chương khoá SAO-2.
// Báo cáo là fixture SINH TỪ ENGINE THẬT (e2e/fixtures/luan-giai-bat-tu.json — `_ghi_chu` nói rõ chỗ sửa tay).
import { test, expect, type Page, type Request } from "@playwright/test";
import { HO_SO_MAU, napHoSo } from "./_hoso";
import FX from "./fixtures/luan-giai-bat-tu.json";

const BC = FX.bao_cao;
type HopFx = { ma_mau?: string; loai: string };
const chuong = (ma: string) => BC.chuong.find((c) => c.ma === ma)!;

async function moBaoCao(page: Page, bc: object = BC) {
  const goi: Record<string, Request[]> = { kiemChung: [], luu: [], tyLe: [] };
  await page.route("**/api/luan-giai/phi*", (r) => r.fulfill({ json: { thu: false, gia: 10 } }));
  await page.route("**/api/battu/luan-giai", (r) => r.fulfill({ json: bc }));
  await page.route("**/api/kiem-chung/ty-le**", (r) => { goi.tyLe!.push(r.request()); return r.fulfill({ json: FX.ty_le }); });
  await page.route("**/api/kiem-chung", (r) => { goi.kiemChung!.push(r.request()); return r.fulfill({ json: { ok: false, ly_do: "chua_bat" } }); });
  await page.route("**/api/luan-giai/tuy-chon", (r) => (r.request().method() === "POST"
    ? r.fulfill({ json: { ok: true } }) : r.fulfill({ json: { tu_luu_luan_giai: false } })));
  await page.route("**/api/luan-giai/luu", (r) => { goi.luu!.push(r.request()); return r.fulfill({ json: { id: "bai-bt" } }); });
  await napHoSo(page);
  await page.goto("/bat-tu");
  await page.getByRole("button", { name: "Xem luận giải" }).click();
  await expect(page.getByTestId("luan-giai-toan-bo")).toHaveAttribute("data-phien-ban", "doi_song_1");
  return goi;
}

test("Bát tự đời sống: cốt lõi, 13 chương, sức tự thân, 5 hành hai cách, đại vận hai cách", async ({ page }) => {
  await moBaoCao(page);
  const bc = page.getByTestId("luan-giai-toan-bo");
  await expect(bc.getByRole("heading", { level: 2 })).toHaveText("Luận giải Bát tự");
  await expect(page.getByTestId("lg-cot-loi").getByTestId("hop-noi-bat")).toHaveCount(BC.cot_loi.length);
  await expect(page.getByTestId("lg-muc-luc").getByRole("link")).toHaveCount(13);
  await page.getByTestId("lg-mo-het").click();        // Trục 1: chương 2+ gập sẵn
  const NHAN: Record<string, string> = { thuan: "Thuận lợi", can_bang: "Cân bằng", can_chu_dong: "Cần lưu ý" };
  for (const c of BC.chuong) {
    if (!c.muc) await expect(page.getByTestId(`lg-chuong-${c.ma}`).getByTestId("chip-muc")).toHaveCount(0);
    else await expect(page.getByTestId(`lg-chuong-${c.ma}`).getByTestId("chip-muc").first()).toHaveText(NHAN[c.muc]!);
  }
  // Trục 1: "Con người bạn" không mang chip mức (như Lời khuyên, Vận hạn).
  expect(BC.chuong.filter((c) => !c.muc).map((c) => c.ma)).toEqual(["tong_quan", "van_han", "loi_khuyen"]);
  // Chương 1: thanh sức tự thân — kim đứng đúng tỉ lệ (reduced motion: không hiệu ứng, ở ngay vị trí cuối).
  const tq = page.getByTestId("lg-chuong-tong_quan");
  const than = tq.getByTestId("thanh-than");
  await expect(than).toHaveAttribute("data-muc-than", chuong("tong_quan").than_do!.muc);
  await expect(than).toContainText(chuong("tong_quan").than_do!.nhan);
  const kim = await than.getByTestId("kim-than").evaluate((e) => (e as HTMLElement).style.left);
  expect(kim).toBe(`${Math.round(chuong("tong_quan").than_do!.ti_le * 100)}%`);

  // Chương 2: 5 cột ngũ hành theo thứ tự sinh, đánh dấu hành mỗi cách gợi ý — cả hai cách đều hiện (không tự chọn).
  const nh = page.getByTestId("lg-chuong-ngu_hanh");
  const cot = nh.getByTestId("cot-hanh");
  await expect(cot).toHaveCount(5);
  await expect(cot.nth(0)).toHaveAttribute("data-hanh", "moc");
  const bd = chuong("ngu_hanh").bieu_do!;
  expect(bd.hanh.filter((h) => h.cach_1).length).toBeGreaterThan(0);
  await expect(nh.getByTestId("goi-y-cach-1")).toHaveCount(bd.hanh.filter((h) => h.cach_1).length);
  await expect(nh.getByTestId("goi-y-cach-2")).toHaveCount(bd.hanh.filter((h) => h.cach_2).length);
  await expect(nh).toContainText("hệ thống không chọn thay bạn");
  for (const h of (chuong("ngu_hanh").hop as HopFx[])) expect(h.ma_mau).toMatch(/^ds\.bt\.ngu_hanh\./);
  // Cột hành đã có bề rộng (không kẹt ở 0 khi tắt hiệu ứng).
  const rong = await cot.nth(1).locator("span.block").evaluate((e) => (e as HTMLElement).getBoundingClientRect().width);
  expect(rong).toBeGreaterThan(10);

  // Chương 3: dải đại vận hai cách + dòng thời gian 8 mốc, đúng 1 "Bạn đang ở đây", nhãn "vận …", có mốc hai cách khác nhau.
  const cd = page.getByTestId("lg-chuong-cuoc_doi");
  await expect(cd.getByTestId("dai-van-hai-cach")).toBeVisible();
  await expect(cd.getByTestId("moc-dai-han")).toHaveCount(BC.thoi_gian_bieu.length);
  await expect(page.getByText("Bạn đang ở đây")).toHaveCount(1);
  const ht = BC.thoi_gian_bieu.find((m) => m.hien_tai)!;
  await expect(cd.locator("[aria-current=step]")).toContainText(ht.nhan!);
  await expect(cd.getByTestId("hai-cach-khac")).toHaveCount(BC.thoi_gian_bieu.filter((m) => m.hai_cach_khac).length);

  // Sức khoẻ: câu không thay lời bác sĩ; lời không có cụm doạ / giọng AI.
  await expect(page.getByTestId("lg-chuong-suc_khoe")).toContainText("không thay lời bác sĩ");
  const chu = (await bc.innerText()).toLowerCase();
  for (const cam of ["xấu", "hành trình", "tai hoạ", "định mệnh"]) expect(chu).not.toContain(cam);
});

test("Bát tự: kiểm chứng gửi phái tu_binh + mã ds.bt.*, tỉ lệ công khai, lưu bài đúng tiêu đề", async ({ page }) => {
  const goi = await moBaoCao(page);
  const cot = page.getByTestId("lg-cot-loi").getByTestId("hop-noi-bat");
  await expect(cot.nth(0).getByTestId("ty-le-dung")).toContainText("78% trong 120 người");
  await expect(cot.nth(1).getByTestId("ty-le-dung")).toContainText("80% trong 45 người");
  await cot.nth(2).getByRole("button", { name: "Đúng với mình" }).click();
  await expect.poll(() => goi.kiemChung!.length).toBe(1);
  expect(goi.kiemChung![0]!.postDataJSON()).toEqual({ loai: "doi_song", mau: BC.cot_loi[2]!.ma_mau, phai: "tu_binh", ket_qua: "dung" });
  expect(BC.cot_loi[2]!.ma_mau).toMatch(/^ds\.bt\./);

  const khoi = page.getByTestId("luu-bai-luan");
  await khoi.getByRole("button", { name: "Lưu vào tài khoản" }).click();
  await expect(khoi.getByTestId("da-luu")).toContainText("Đã lưu");
  expect(goi.luu![0]!.postDataJSON()).toMatchObject({ mo_dun: "battu", tieu_de: `Luận giải Bát tự — ${HO_SO_MAU.ho_ten}` });
});

test("Bát tự điện thoại 360px: không cuộn ngang, biểu đồ và dòng thời gian vừa màn hình", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 });
  await moBaoCao(page);
  await page.getByTestId("lg-mo-het").click();
  for (const id of ["thanh-than", "bieu-do-ngu-hanh", "dai-van-hai-cach", "dong-thoi-gian", "lg-cot-loi"]) {
    const el = page.getByTestId(id).first();
    await el.scrollIntoViewIfNeeded();
    const b = await el.boundingBox();
    expect(b!.x).toBeGreaterThanOrEqual(0);
    expect(b!.x + b!.width).toBeLessThanOrEqual(360);
  }
  const rong = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
  expect(rong[0]).toBeLessThanOrEqual(rong[1]!);
});

test("Bát tự SAO-2: chương 1 đọc được (kèm thanh sức tự thân), 12 chương khoá, biểu đồ chương 2 không lộ", async ({ page }) => {
  const [dau, ...sau] = BC.chuong;
  const { thoi_gian_bieu: _tg, ...conLai } = BC;
  await page.route("**/api/luan-giai/phi*", (r) => r.fulfill({ json: { thu: true, gia: 10 } }));
  await page.route("**/api/battu/luan-giai", (r) => r.fulfill({ json: {
    ...conLai, so_khoa: sau.length, phi: { sao: 10, ly_do: "xem_truoc", khoa: true, dang_nhap: true, so_du: 20 },
    cot_loi: BC.cot_loi.filter((h) => h.tu_chuong === dau!.ma),
    chuong: [dau, ...sau.map((c) => ({ ma: c.ma, tieu_de: c.tieu_de, khoa: true, moi_xem: c.moi_xem }))],
  } }));
  await page.route("**/api/kiem-chung/ty-le**", (r) => r.fulfill({ json: {} }));
  await page.route("**/api/luan-giai/tuy-chon", (r) => r.fulfill({ json: { tu_luu_luan_giai: false } }));
  await napHoSo(page);
  await page.goto("/bat-tu");
  await page.getByRole("button", { name: "Đọc miễn phí chương đầu" }).click();
  const bc = page.getByTestId("luan-giai-toan-bo");
  await expect(bc.getByTestId("lg-chuong-tong_quan")).toContainText(dau!.tom_tat!);
  await expect(bc.getByTestId("thanh-than")).toBeVisible();
  await expect(bc.getByTestId("bieu-do-ngu-hanh")).toHaveCount(0);
  await expect(bc.getByTestId("dong-thoi-gian")).toHaveCount(0);
  await expect(page.getByTestId("lg-chuong-khoa")).toHaveCount(12);
  await expect(page.getByTestId("lg-phan-khoa")).toContainText(sau[0]!.moi_xem.cau_hoi);
  await expect(page.getByTestId("luu-bai-luan")).toHaveCount(0);
});
