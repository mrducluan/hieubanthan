// LG-ĐS (docs/LUAN-GIAI-DOI-SONG.md mục 2.3, 3, 5) — giao diện Luận giải Tử vi "đời sống": Điều quan trọng nhất, mục
// lục (13 chương), chip mức ("Cần lưu ý" — VH-1), dòng thời gian 12 đại hạn, "Vì sao nói vậy", kiểm chứng (POST /api/kiem-chung + "x% thấy đúng" khi
// ≥ 30 phiếu), lưu bài vào tài khoản + trang bài đã lưu, xác nhận ý định hỏi đáp, điện thoại 360px, chương khoá SAO-2.
// Báo cáo là fixture SINH TỪ ENGINE THẬT (e2e/fixtures/luan-giai-doi-song.json, `_ghi_chu` nói rõ 3 chỗ sửa tay); mọi
// route máy chủ mới giả bằng page.route. Mã mẫu / chữ lấy từ fixture, không viết cứng — engine đổi lời thì sinh lại.
import { test, expect, type Page, type Request } from "@playwright/test";
import { HO_SO_MAU, napHoSo, hoi } from "./_hoso";
import FX from "./fixtures/luan-giai-doi-song.json";

const ngayDuong = (iso?: string) => { if (!iso) return ""; const [y, m, d] = iso.split("-"); return `${Number(d)}/${Number(m)}/${y}`; };

const BC = FX.bao_cao;
type HopFx = { ma_mau?: string; dang_xem_lai?: boolean; tu?: string; den?: string; tu_tuoi?: number; den_tuoi?: number; loai: string;
  tham_chieu?: string; tieu_de: string };
const chuong = (ma: string) => BC.chuong.find((c) => c.ma === ma)!;
const hopHien = (ma: string) => (chuong(ma).hop as HopFx[]).filter((h) => !h.dang_xem_lai);
const COT = BC.cot_loi.map((h) => (h as HopFx).ma_mau);
// Trục 1: hộp đã ở "Điều quan trọng nhất" (cùng mã, có trên trang) → trong chương chỉ còn dòng tham chiếu.
const laThamChieu = (h: HopFx) => Boolean(h.ma_mau && COT.includes(h.ma_mau));
const hopDayDu = (ma: string) => hopHien(ma).filter((h) => !laThamChieu(h));

async function moBaoCao(page: Page, opts: { bc?: object; tuyChon?: object | number; tyLe?: object } = {}) {
  const goi: Record<string, Request[]> = { tyLe: [], kiemChung: [], luu: [], tuyChon: [] };
  await page.route("**/api/luan-giai/phi*", (r) => r.fulfill({ json: { thu: false, gia: 10 } }));
  await page.route("**/api/tuvi/luan-giai", (r) => r.fulfill({ json: opts.bc ?? BC }));
  await page.route("**/api/kiem-chung/ty-le**", (r) => { goi.tyLe!.push(r.request()); return r.fulfill({ json: opts.tyLe ?? FX.ty_le }); });
  await page.route("**/api/kiem-chung", (r) => { goi.kiemChung!.push(r.request()); return r.fulfill({ json: { ok: false, ly_do: "chua_bat" } }); });
  await page.route("**/api/luan-giai/tuy-chon", (r) => {
    goi.tuyChon!.push(r.request());
    if (r.request().method() === "POST") return r.fulfill({ json: { ok: true } });
    const tc = opts.tuyChon ?? 401;
    return typeof tc === "number" ? r.fulfill({ status: tc, json: { error: "Cần đăng nhập" } }) : r.fulfill({ json: tc });
  });
  await page.route("**/api/luan-giai/luu", (r) => { goi.luu!.push(r.request()); return r.fulfill({ json: { id: "bai-1" } }); });
  await napHoSo(page);
  await page.goto("/tu-vi");
  await page.getByRole("button", { name: "Xem luận giải" }).click();
  await expect(page.getByTestId("luan-giai-toan-bo")).toHaveAttribute("data-phien-ban", "doi_song_1");
  return goi;
}

test("báo cáo đời sống: cốt lõi, mục lục, chip mức, dòng thời gian, Vì sao nói vậy", async ({ page }) => {
  await moBaoCao(page);
  const bc = page.getByTestId("luan-giai-toan-bo");
  const cot = page.getByTestId("lg-cot-loi");
  await expect(cot.getByRole("heading", { name: "Điều quan trọng nhất" })).toBeVisible();
  await expect(cot.getByTestId("hop-noi-bat")).toHaveCount(BC.cot_loi.length);
  await expect(cot.getByTestId("hop-noi-bat").first()).toHaveAttribute("data-loai", "cot_loi");
  await expect(cot).toContainText("Điều quan trọng");
  // Cốt lõi đứng trước mục lục, mục lục trước chương 1.
  const y = async (l: ReturnType<Page["getByTestId"]>) => (await l.boundingBox())!.y;
  expect(await y(cot)).toBeLessThan(await y(page.getByTestId("lg-muc-luc")));

  // Mục lục: đủ 13 chương (VH-1 thêm "Vận hạn & điều nên tránh"), nhảy neo + mở chương (Trục 1: chương sau gập sẵn).
  const ml = page.getByTestId("lg-muc-luc").getByRole("link");
  await expect(ml).toHaveCount(13);
  await expect(page.getByTestId("lg-chuong-su_nghiep")).toHaveAttribute("data-mo", "0");
  await ml.nth(2).click();
  await expect(page).toHaveURL(/#lg-su_nghiep$/);
  await expect(page.getByTestId("lg-chuong-su_nghiep")).toHaveAttribute("data-mo", "1");
  await page.getByTestId("lg-mo-het").click();

  // Chip mức đời thường, không có mức "xấu".
  const sn = page.getByTestId("lg-chuong-su_nghiep");
  const NHAN: Record<string, string> = { thuan: "Thuận lợi", can_bang: "Cân bằng", can_chu_dong: "Cần lưu ý" };
  for (const c of BC.chuong) {
    // VH-1: Lời khuyên (tổng hợp) và Vận hạn (dòng 10 năm) không mang chip mức riêng.
    if (!c.muc) await expect(page.getByTestId(`lg-chuong-${c.ma}`).getByTestId("chip-muc")).toHaveCount(0);
    else await expect(page.getByTestId(`lg-chuong-${c.ma}`).getByTestId("chip-muc").first()).toHaveText(NHAN[c.muc]!);
  }
  // Trục 1: "Con người bạn" cũng không mang chip mức (người mới đọc chương đầu không thấy "Cần lưu ý").
  expect(BC.chuong.filter((c) => !c.muc).map((c) => c.ma)).toEqual(["tong_quan", "van_han", "loi_khuyen"]);
  await expect(sn.getByTestId("tom-tat")).toContainText(chuong("su_nghiep").tom_tat);
  await expect(sn.getByTestId("cau-tu-soi")).toContainText(chuong("su_nghiep").cau_tu_soi);
  // Hộp đủ 5 loại nhãn (trong cả bài); hộp `dang_xem_lai` không hiện.
  for (const n of ["Điểm mạnh", "Nên để ý", "Lời khuyên", "Thời điểm"]) await expect(bc).toContainText(n);
  await expect(sn.getByTestId("hop-noi-bat")).toHaveCount(hopDayDu("su_nghiep").length);
  await expect(sn.getByTestId("hop-tham-chieu")).toHaveCount(hopHien("su_nghiep").length - hopDayDu("su_nghiep").length);
  await expect(bc).not.toContainText("Hộp đang được xem lại");
  const chu = (await bc.innerText()).toLowerCase();
  for (const cam of ["xấu", "hành trình", "năng lượng vũ trụ", "tai hoạ"]) expect(chu).not.toContain(cam);

  // Hộp thời điểm có khoảng thời gian (tu–den, hoặc tuổi) + mức; chương sức khoẻ có câu không thay lời bác sĩ.
  const thang = hopHien("nam_nay").find((h) => h.loai === "thoi_diem" && h.tu && h.den)!;
  await expect(page.getByTestId("lg-chuong-nam_nay").getByTestId("hop-thoi-gian")).toContainText([`${ngayDuong(thang.tu)} – ${ngayDuong(thang.den)} dương lịch`]);
  const dh = hopHien("cuoc_doi").find((h) => typeof h.tu_tuoi === "number")!;
  await expect(page.getByTestId("lg-chuong-cuoc_doi").getByTestId("hop-thoi-gian").first()).toContainText(`${dh.tu_tuoi}–${dh.den_tuoi} tuổi`);
  // Engine đặt câu miễn trừ ngay trong `doan` → web không lặp khối "mien-tru" riêng (chỉ hiện khi doan thiếu câu).
  const sk = page.getByTestId("lg-chuong-suc_khoe");
  await expect(sk).toContainText("không thay lời bác sĩ");
  await expect(sk.getByTestId("mien-tru")).toHaveCount(chuong("suc_khoe").doan.some((d) => d.includes("bác sĩ")) ? 0 : 1);
  // Dòng thời gian: ≤ 9 mốc (engine bỏ giai đoạn bắt đầu sau 86 tuổi, trừ giai đoạn đang đi), đúng 1 "Bạn đang ở đây".
  const tg = page.getByTestId("dong-thoi-gian");
  expect(BC.thoi_gian_bieu.length).toBeLessThanOrEqual(9);
  await expect(tg.getByTestId("moc-dai-han")).toHaveCount(BC.thoi_gian_bieu.length);
  await expect(page.getByText("Bạn đang ở đây")).toHaveCount(1);
  const ht = BC.thoi_gian_bieu.find((m) => m.hien_tai)!;
  const mocHt = tg.locator("[aria-current=step]");
  await expect(mocHt).toHaveCount(1);
  await expect(mocHt).toContainText(`${ht.tu_tuoi}–${ht.den_tuoi} tuổi`);
  await expect(mocHt).toContainText(ht.mot_cau);
  // Máy tính: các mốc nằm ngang.
  const b0 = await tg.getByTestId("moc-dai-han").nth(0).boundingBox();
  const b1 = await tg.getByTestId("moc-dai-han").nth(1).boundingBox();
  expect(Math.abs(b0!.y - b1!.y)).toBeLessThan(4);

  // "Vì sao nói vậy": thu gọn, bấm mở / đóng.
  const hop0 = cot.getByTestId("hop-noi-bat").first();
  const nut = hop0.getByRole("button", { name: /Vì sao nói vậy/ });
  await expect(nut).toHaveAttribute("aria-expanded", "false");
  await expect(hop0.getByTestId("can-cu")).toBeHidden();
  await nut.click();
  await expect(nut).toHaveAttribute("aria-expanded", "true");
  await expect(hop0.getByTestId("can-cu")).toContainText(BC.cot_loi[0]!.can_cu.at(-1)!);
  await nut.click();
  await expect(hop0.getByTestId("can-cu")).toBeHidden();
  // Căn cứ của chương cũng thu gọn.
  const vsChuong = sn.getByTestId("vi-sao").last();
  await vsChuong.getByRole("button").click();
  await expect(vsChuong.getByTestId("can-cu")).toContainText(chuong("su_nghiep").can_cu[0]!);
});

test("kiểm chứng: tỉ lệ công khai ≥ 30 phiếu, dưới 30 chỉ hỏi; bấm gửi POST /api/kiem-chung (lỗi im lặng)", async ({ page }) => {
  const goi = await moBaoCao(page);
  const cot = page.getByTestId("lg-cot-loi").getByTestId("hop-noi-bat");
  // Số từ engine (0.78 · 120).
  await expect(cot.nth(0).getByTestId("ty-le-dung")).toContainText("78% trong 120 người có cùng điểm này thấy đúng");
  await expect(cot.nth(0).getByTestId("ty-le-dung")).toContainText("số người tự bấm, không phải kiểm định khoa học");
  // Số tải về một lần cho cả bài: 36/45 → 80%.
  await expect(cot.nth(1).getByTestId("ty-le-dung")).toContainText("80% trong 45 người");
  // 12 phiếu < 30 → không hiện số, chỉ hỏi.
  await expect(cot.nth(2).getByTestId("ty-le-dung")).toHaveCount(0);
  await expect(cot.nth(2).getByTestId("kiem-chung")).toContainText("Điều này có đúng với bạn?");
  // Hộp không có mã → không có dòng kiểm chứng.
  await expect(cot.nth(3).getByTestId("kiem-chung")).toHaveCount(0);

  expect(goi.tyLe!.length).toBeGreaterThanOrEqual(1);
  const maBai = new URL(goi.tyLe!.at(-1)!.url()).searchParams.get("mau")!.split(",");
  for (const m of [COT[0], COT[1], COT[2], hopHien("su_nghiep")[1]!.ma_mau, hopHien("loi_khuyen")[0]!.ma_mau]) expect(maBai).toContain(m);
  expect(COT[3]).toBeUndefined();                     // cot_loi[3] không mã (ca kiểm trên)
  expect(maBai).not.toContain("ds.su_nghiep.an");   // hộp đang xem lại không xin tỉ lệ
  expect(new Set(goi.tyLe!.map((r) => r.url())).size).toBe(1);

  await cot.nth(2).getByRole("button", { name: "Đúng với mình" }).click();
  await expect(cot.nth(2).getByRole("status")).toContainText("Cảm ơn");
  await expect.poll(() => goi.kiemChung!.length).toBe(1);
  expect(goi.kiemChung![0]!.postDataJSON()).toEqual({ loai: "doi_song", mau: COT[2], phai: "nam_phai_viet", ket_qua: "dung" });
  // Bấm thẻ đủ số: cảm ơn + vẫn hiện tỉ lệ.
  await cot.nth(0).getByRole("button", { name: "Chưa đúng" }).click();
  await expect(cot.nth(0).getByRole("status")).toContainText("Cảm ơn");
  await expect(cot.nth(0).getByTestId("ty-le-dung")).toContainText("78%");
  // Bấm xong: dấu ✓ + "Đã ghi" (Trục 1), hai nút biến mất.
  await expect(cot.nth(2).getByRole("status")).toContainText("Đã ghi");
  await expect(cot.nth(2).getByRole("button", { name: "Đúng với mình" })).toHaveCount(0);
  // Hộp gốc trong chương dùng chung mã với hộp "Điều quan trọng nhất" → chương chỉ còn dòng tham chiếu, không hỏi lại.
  const goc = BC.cot_loi[0]!.tu_chuong;
  expect(hopHien(goc).some((h) => h.ma_mau === COT[0])).toBe(true);
  const tc = page.getByTestId(`lg-chuong-${goc}`).locator(`[data-testid=hop-tham-chieu][data-ma-mau="${COT[0]}"]`);
  await expect(tc).toHaveCount(1);
  await expect(tc).toContainText("Đã nêu ở Điều quan trọng nhất");
  await expect(tc).toHaveAttribute("href", "#lg-cot-loi");
  await expect(tc.getByTestId("kiem-chung")).toHaveCount(0);
  await expect.poll(() => goi.kiemChung!.length).toBe(2);
  // Máy chủ trả {ok:false} → không có thông báo lỗi nào.
  await expect(page.getByTestId("luan-giai-toan-bo").getByRole("alert")).toHaveCount(0);
  const sk = await page.evaluate(() => ((window as unknown as { __hbt_su_kien?: Record<string, unknown>[] }).__hbt_su_kien ?? [])
    .filter((e) => e.su_kien === "tuvi_kiem_chung"));
  expect(sk[0]).toMatchObject({ loai: "doi_song", mau: COT[2], ket_qua: "dung" });
});

test("lưu bài: nút khi đã đăng nhập, ô tự lưu không tích sẵn → trang bài đã lưu xem + xoá", async ({ page }) => {
  const goi = await moBaoCao(page, { tuyChon: { tu_luu_luan_giai: false } });
  const khoi = page.getByTestId("luu-bai-luan");
  await expect(khoi).toBeVisible();
  const o = khoi.getByRole("checkbox", { name: "Tự lưu các bài luận sau" });
  await expect(o).not.toBeChecked();
  expect(goi.luu!.length).toBe(0);                      // không tự lưu khi chưa bật
  await khoi.getByRole("button", { name: "Lưu vào tài khoản" }).click();
  await expect(khoi.getByTestId("da-luu")).toContainText("Đã lưu");
  const body = goi.luu![0]!.postDataJSON();
  expect(body).toMatchObject({ mo_dun: "tuvi", tieu_de: `Luận giải Tử vi — ${HO_SO_MAU.ho_ten}`, noi_dung: { phien_ban: "doi_song_1" } });
  expect(body.noi_dung.chuong).toHaveLength(13);
  expect(body.noi_dung.phi).toBeUndefined();
  await o.check();
  await expect.poll(() => goi.tuyChon!.filter((r) => r.method() === "POST").at(-1)?.postDataJSON()).toEqual({ tu_luu_luan_giai: true });

  // Trang bài đã lưu.
  const xoa: string[] = [];
  await page.route("**/api/luan-giai/luu", (r) => r.fulfill({ json: { ds: [
    { id: "bai-1", mo_dun: "tuvi", tieu_de: `Luận giải Tử vi — ${HO_SO_MAU.ho_ten}`, tao_luc: "2026-10-21T03:00:00Z" },
    { id: "bai-2", mo_dun: "tuvi", tieu_de: "Luận giải Tử vi — Mẹ", tao_luc: "2026-10-20T03:00:00Z" },
  ] } }));
  await page.route("**/api/luan-giai/luu/*", (r) => {
    if (r.request().method() === "DELETE") { xoa.push(r.request().url()); return r.fulfill({ json: { ok: true } }); }
    return r.fulfill({ json: { noi_dung: BC } });
  });
  await khoi.getByRole("link", { name: "Xem bài đã lưu" }).click();
  await expect(page).toHaveURL(/\/ban-than\/bai-da-luu\?id=bai-1/);
  await expect(page.getByRole("heading", { level: 1, name: "Bài đã lưu" })).toBeVisible();
  await expect(page.getByTestId("giai-thich-luu")).toHaveText("Bài lưu 12 tháng, chỉ bạn xem được, xoá ngay khi bạn bấm.");
  const bai = page.getByTestId("luan-giai-toan-bo");
  await expect(bai.getByTestId("lg-cot-loi")).toBeVisible();
  await expect(bai.getByRole("heading", { name: `Luận giải Tử vi — ${HO_SO_MAU.ho_ten}` })).toBeVisible();
  await expect(page.getByText("Bạn đang ở đây")).toHaveCount(1);
  await page.getByRole("button", { name: "Danh sách bài" }).click();
  await expect(page.getByTestId("bai-luu")).toHaveCount(2);
  await page.getByRole("button", { name: "Xoá bài Luận giải Tử vi — Mẹ" }).click();
  await expect(page.getByTestId("bai-luu")).toHaveCount(1);
  expect(xoa.at(-1)).toMatch(/\/api\/luan-giai\/luu\/bai-2$/);
  const robots = await page.locator('meta[name="robots"]').getAttribute("content");
  expect(robots).toContain("noindex");
});

test("lưu bài: tự lưu khi đã bật; máy chủ chưa bật → ẩn; khách → ẩn; /ban-than có link bài đã lưu", async ({ page }) => {
  let goi = await moBaoCao(page, { tuyChon: { tu_luu_luan_giai: true } });
  await expect.poll(() => goi.luu!.length).toBeGreaterThanOrEqual(1);
  await expect(page.getByTestId("luu-bai-luan").getByRole("checkbox")).toBeChecked();
  await expect(page.getByTestId("da-luu")).toBeVisible();

  await page.unrouteAll({ behavior: "ignoreErrors" });
  goi = await moBaoCao(page, { tuyChon: { ok: false, ly_do: "chua_bat" } });
  await expect(page.getByTestId("lg-cot-loi")).toBeVisible();
  await expect(page.getByTestId("luu-bai-luan")).toHaveCount(0);

  // Khách (máy chủ không báo đăng nhập, tuỳ chọn 401) → không có nút.
  await page.unrouteAll({ behavior: "ignoreErrors" });
  await moBaoCao(page, { bc: { ...BC, phi: { sao: 10, ly_do: "mien_phi", dang_nhap: false } } });
  await expect(page.getByTestId("lg-cot-loi")).toBeVisible();
  await expect(page.getByTestId("luu-bai-luan")).toHaveCount(0);

  // Trục 2 UX: chưa bật tài khoản (e2e không có Supabase) → link "Bài luận đã lưu" ẩn ở Bản thân (tránh ngõ cụt).
  await page.goto("/ban-than");
  await expect(page.getByTestId("huy-hieu")).toBeVisible({ timeout: 45_000 });
  await expect(page.getByTestId("lien-ket-bai-da-luu")).toHaveCount(0);
});

test("điện thoại 360px: không cuộn ngang, dòng thời gian dọc", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 });
  await moBaoCao(page);
  await page.getByTestId("lg-chuong-cuoc_doi").getByTestId("lg-mo-chuong").click();
  const tg = page.getByTestId("dong-thoi-gian");
  await tg.scrollIntoViewIfNeeded();
  const b0 = await tg.getByTestId("moc-dai-han").nth(0).boundingBox();
  const b1 = await tg.getByTestId("moc-dai-han").nth(1).boundingBox();
  expect(b1!.y).toBeGreaterThan(b0!.y + 20);
  expect(Math.abs(b0!.x - b1!.x)).toBeLessThan(2);
  await expect(page.getByText("Bạn đang ở đây")).toHaveCount(1);
  const rong = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
  expect(rong[0]).toBeLessThanOrEqual(rong[1]!);
  // Kiểm chứng: hai nút một hàng chia đôi, cao ≥ 44px (Trục 1, báo cáo UX mục 5).
  const nut = page.getByTestId("lg-cot-loi").getByTestId("kiem-chung").first().getByRole("button");
  const [n0, n1] = [await nut.nth(0).boundingBox(), await nut.nth(1).boundingBox()];
  expect(Math.abs(n0!.y - n1!.y)).toBeLessThan(2);
  expect(n0!.height).toBeGreaterThanOrEqual(44);
  expect(Math.abs(n0!.width - n1!.width)).toBeLessThan(2);
  for (const id of ["lg-cot-loi", "lg-muc-luc", "dong-thoi-gian"]) {
    const b = await page.getByTestId(id).boundingBox();
    expect(b!.x + b!.width).toBeLessThanOrEqual(360);
  }
});

test("SAO-2 với báo cáo đời sống: chương 1 đọc được, chương sau khoá kèm lời mời, không có nút lưu", async ({ page }) => {
  const [dau, ...sau] = BC.chuong;
  // Như lib/sao-xem-truoc: cot_loi chỉ giữ hộp của chương mở, bỏ thoi_gian_bieu khi "cuoc_doi" bị khoá.
  const { thoi_gian_bieu: _tg, ...conLai } = BC;
  const xemTruoc = {
    ...conLai, so_khoa: sau.length, phi: { sao: 10, ly_do: "xem_truoc", khoa: true, dang_nhap: true, so_du: 20 },
    // Lá mẫu không có hộp cốt lõi nào từ chương 1 → giả một hộp như vậy (ca rỗng ở test sau).
    cot_loi: [{ ...BC.cot_loi[0]!, tu_chuong: dau!.ma }],
    chuong: [dau, ...sau.map((c) => ({ ma: c.ma, tieu_de: c.tieu_de, khoa: true, moi_xem: c.moi_xem }))],
  };
  await page.route("**/api/luan-giai/phi*", (r) => r.fulfill({ json: { thu: true, gia: 10 } }));
  await moBaoCaoKhoa(page, xemTruoc);
  const bc = page.getByTestId("luan-giai-toan-bo");
  await expect(bc.getByTestId("lg-cot-loi").getByTestId("hop-noi-bat")).toHaveCount(1);
  await expect(bc.getByTestId("dong-thoi-gian")).toHaveCount(0);
  await expect(bc.getByText("Bạn đang ở đây")).toHaveCount(0);
  await expect(bc.getByTestId("lg-chuong-tong_quan")).toContainText(dau!.doan[0]!);
  await expect(page.getByTestId("lg-chuong-khoa")).toHaveCount(12);
  await expect(page.getByTestId("lg-phan-khoa")).toContainText("Đã đọc 1/13 chương");
  await expect(page.getByTestId("lg-phan-khoa")).toContainText(sau[0]!.moi_xem.cau_hoi);
  await expect(page.getByTestId("lg-mo-khoa")).toHaveText(/Mở toàn bộ · 10 Sao/);
  await expect(page.getByTestId("lg-muc-luc").getByLabel("đang khoá")).toHaveCount(12);
  await expect(page.getByTestId("lg-muc-luc").getByRole("link").nth(1)).toHaveAttribute("href", "#lg-khoa");
  // Đoạn thân bài (không phải câu đầu — câu đầu chính là "điểm nhấn" của lời mời) không lộ.
  await expect(bc).not.toContainText(sau.flatMap((c) => c.doan.slice(1))[0]!);
  await expect(page.getByTestId("luu-bai-luan")).toHaveCount(0);
});

test("SAO-2: cot_loi rỗng (chương 1 không có hộp nổi bật) → không có khối Điều quan trọng nhất, bài vẫn hiện", async ({ page }) => {
  const [dau, ...sau] = BC.chuong;
  const { thoi_gian_bieu: _tg, ...conLai } = BC;
  await page.route("**/api/luan-giai/phi*", (r) => r.fulfill({ json: { thu: true, gia: 10 } }));
  await moBaoCaoKhoa(page, {
    ...conLai, cot_loi: [], so_khoa: sau.length, phi: { sao: 10, ly_do: "xem_truoc", khoa: true, dang_nhap: false, so_du: null, thuong_chao_mung: 10 },
    chuong: [dau, ...sau.map((c) => ({ ma: c.ma, tieu_de: c.tieu_de, khoa: true, moi_xem: c.moi_xem }))],
  });
  const bc = page.getByTestId("luan-giai-toan-bo");
  await expect(bc.getByTestId("lg-chuong-tong_quan")).toBeVisible();
  await expect(bc.getByTestId("lg-cot-loi")).toHaveCount(0);
  await expect(page.getByTestId("lg-chuong-khoa")).toHaveCount(12);
  await expect(page.getByTestId("lg-phan-khoa")).toContainText("tặng 10 Sao — đủ mở báo cáo này");
});

async function moBaoCaoKhoa(page: Page, bc: object) {
  await page.route("**/api/tuvi/luan-giai", (r) => r.fulfill({ json: bc }));
  await page.route("**/api/kiem-chung/ty-le**", (r) => r.fulfill({ json: {} }));
  await page.route("**/api/luan-giai/tuy-chon", (r) => r.fulfill({ json: { tu_luu_luan_giai: false } }));
  await napHoSo(page);
  await page.goto("/tu-vi");
  await page.getByRole("button", { name: "Đọc miễn phí chương đầu" }).click();
}

test("KC-1: Bản đồ con số dùng cùng khuôn đời sống (hộp, tóm tắt, Vì sao nói vậy), không dòng thời gian đại hạn", async ({ page }) => {
  await page.route("**/api/luan-giai/phi*", (r) => r.fulfill({ json: { thu: false, gia: 10 } }));
  await page.route("**/api/kiem-chung/ty-le**", (r) => r.fulfill({ json: {} }));
  await napHoSo(page);
  await page.goto("/than-so");
  const bd = page.getByTestId("ban-do-con-so").getByTestId("luan-giai-toan-bo");
  await expect(bd).toContainText("Tổng quan: bộ số của bạn");
  await expect(bd).toHaveAttribute("data-phien-ban", "doi_song_1");
  await expect(bd.getByTestId("lg-cot-loi").getByTestId("hop-noi-bat").first()).toContainText("Đường đời");
  await expect(bd.getByTestId("lg-chuong-tong_quan").getByTestId("tom-tat")).toBeVisible();
  await expect(bd.getByTestId("lg-chuong-tong_quan").getByTestId("hop-noi-bat").first()).toBeVisible();
  await expect(page.getByTestId("dong-thoi-gian")).toHaveCount(0);
});

test("hỏi đáp Tử vi: gợi ý ý định từ kho vectơ → hỏi lại, bấm gửi xác nhận", async ({ page }) => {
  const xn: Request[] = [];
  await page.route("**/api/tuvi/hoi", (r) => r.fulfill({ json: {
    cau_tra_loi: "Năm nay cung Quan Lộc có Hoá Lộc lưu niên.", che_do: "template",
    goi_y_vec: { id: "v-9", y_dinh: "di_hay_o", do_gan: 0.87 },
  } }));
  await page.route("**/api/hoi/xac-nhan-y-dinh", (r) => { xn.push(r.request()); return r.fulfill({ json: { ok: true } }); });
  await napHoSo(page);
  await page.goto("/tu-vi");
  const tl = await hoi(page, "chán chỗ làm quá muốn đi");
  const hop = page.getByTestId("xac-nhan-y-dinh");
  await expect(hop).toContainText("Hệ thống hiểu câu của bạn là về: ở lại hay đổi việc, ra làm riêng — đúng ý bạn chứ?");
  await expect(tl).toBeVisible();
  await hop.getByRole("button", { name: "Đúng ý mình" }).click();
  await expect(hop.getByRole("status")).toContainText("Cảm ơn");
  await expect.poll(() => xn.length).toBe(1);
  expect(xn[0]!.postDataJSON()).toEqual({ mo_dun: "tuvi", cau: "chán chỗ làm quá muốn đi", y_dinh: "di_hay_o", dung: true });
});


test("hỏi đáp Tử vi: không nhận ra ý định, không có câu gần nghĩa → chọn 1 trong 8 chủ đề, gửi xác nhận", async ({ page }) => {
  const xn: Request[] = [];
  await page.route("**/api/tuvi/hoi", (r) => r.fulfill({ json: {
    cau_tra_loi: "Câu trả lời chung từ kho tri thức.", che_do: "template", co_the_goi_y: true, nhan_ra_y_dinh: false,
    phan_loai: { xu_ly: "binh_thuong" },
  } }));
  await page.route("**/api/hoi/xac-nhan-y-dinh", (r) => { xn.push(r.request()); return r.fulfill({ json: { ok: true } }); });
  await napHoSo(page);
  await page.goto("/tu-vi");
  await hoi(page, "dạo này lấn cấn quá");
  const hop = page.getByTestId("chon-y-dinh");
  await expect(hop).toContainText("Bạn đang hỏi về chuyện gì? Chọn để lần sau hệ thống hiểu nhanh hơn");
  await expect(hop.getByRole("button")).toHaveCount(8);
  await expect(page.getByTestId("xac-nhan-y-dinh")).toHaveCount(0);
  await hop.locator("[data-y-dinh=tai_van]").click();
  await expect(hop.getByRole("status")).toContainText("tiền bạc sắp tới");
  await expect.poll(() => xn.length).toBe(1);
  expect(xn[0]!.postDataJSON()).toEqual({ mo_dun: "tuvi", cau: "dạo này lấn cấn quá", y_dinh: "tai_van", dung: true });
});

test("hỏi đáp Tử vi: câu đã nhận ra ý định hoặc câu an toàn → không hỏi lại chủ đề", async ({ page }) => {
  let lan = 0;
  await page.route("**/api/tuvi/hoi", (r) => r.fulfill({ json: lan++ === 0
    ? { cau_tra_loi: "Trả lời theo ý định.", che_do: "template", co_the_goi_y: false, nhan_ra_y_dinh: true }
    : { cau_tra_loi: "Lời hỗ trợ.", che_do: "template", co_the_goi_y: true, phan_loai: { xu_ly: "an_toan" } } }));
  await napHoSo(page);
  await page.goto("/tu-vi");
  await expect(await hoi(page, "có nên nghỉ việc không")).toContainText("Trả lời theo ý định.");
  await expect(await hoi(page, "mình mệt mỏi quá rồi")).toContainText("Lời hỗ trợ.");
  await expect(page.getByTestId("chon-y-dinh")).toHaveCount(0);
});

// ------------------------------------------------------------------ Trục 1 "Bài đọc dài dễ đi" (2026-10-26)
test("Trục 1: chương 1 mở, chương sau gập (tiêu đề + chip mức + tóm tắt), bấm mở, 'Chương tiếp' mở chương kế", async ({ page }) => {
  await moBaoCao(page);
  const [c1, c2, c3] = [BC.chuong[0]!, BC.chuong[1]!, BC.chuong[2]!];
  const ch = (ma: string) => page.getByTestId(`lg-chuong-${ma}`);
  await expect(ch(c1.ma)).toHaveAttribute("data-mo", "1");
  for (const c of BC.chuong.slice(1)) await expect(ch(c.ma)).toHaveAttribute("data-mo", "0");
  // Chương gập vẫn thấy tóm tắt + chip mức; thân (hộp, tự soi) ẩn.
  await expect(ch(c2.ma).getByTestId("tom-tat")).toBeVisible();
  await expect(ch(c2.ma).getByTestId("tom-tat")).toHaveText(c2.tom_tat);
  if (c2.muc) await expect(ch(c2.ma).getByTestId("chip-muc").first()).toBeVisible();
  await expect(ch(c2.ma).getByTestId("cau-tu-soi")).toBeHidden();
  // Chương 1 "Con người bạn" không có chip mức.
  await expect(ch(c1.ma).getByTestId("chip-muc")).toHaveCount(0);
  // "Chương tiếp" cuối chương 1 mở chương 2; bấm tiêu đề mở / gập.
  await ch(c1.ma).getByTestId("lg-chuong-tiep").click();
  await expect(ch(c2.ma)).toHaveAttribute("data-mo", "1");
  await expect(ch(c2.ma).getByTestId("cau-tu-soi")).toBeVisible();
  await ch(c3.ma).getByTestId("lg-mo-chuong").click();
  await expect(ch(c3.ma)).toHaveAttribute("data-mo", "1");
  await ch(c3.ma).getByTestId("lg-mo-chuong").click();
  await expect(ch(c3.ma)).toHaveAttribute("data-mo", "0");
  // Đo: mở chương ghi chart_interacted (chỉ số chương, không chữ).
  const sk = await page.evaluate(() => ((window as unknown as { __hbt_su_kien?: Record<string, unknown>[] }).__hbt_su_kien ?? [])
    .filter((e) => e.su_kien === "chart_interacted" && e.kind === "lg_mo_chuong"));
  expect(sk.map((e) => e.so_chuong)).toEqual(expect.arrayContaining([2, 3]));
  // Máy tính: cột chương DÍNH bên phải (vẫn trong tầm mắt khi đã cuộn xuống chương 3), không có thanh của điện thoại.
  await ch(c3.ma).getByTestId("lg-mo-chuong").click();
  await ch(c3.ma).getByTestId("cau-tu-soi").scrollIntoViewIfNeeded();
  await expect(page.getByTestId("lg-cot-chuong")).toBeInViewport();
  await expect(page.getByTestId("lg-cot-chuong").locator("[aria-current=location]")).toContainText(c3.tieu_de);
  await expect(page.getByTestId("lg-thanh-chuong")).toBeHidden();
});

test("Trục 1 điện thoại: thanh 'Chương x/13' dính dưới thanh đầu trang, mở danh sách chương, chạm chương → mở + cuộn tới", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await moBaoCao(page);
  const thanh = page.getByTestId("lg-thanh-chuong");
  // UX v3 M2: chấm màu mức có chú thích; mục lục đầu báo cáo đang trên màn hình → thanh dính CHƯA hiện (một mục lục).
  const ml = page.getByTestId("lg-muc-luc");
  await ml.scrollIntoViewIfNeeded();
  await expect(ml.getByTestId("lg-chu-thich-muc")).toBeVisible();
  await expect(ml.getByTestId("lg-chu-thich-muc")).toContainText("mức của chương");
  await expect(ml.getByRole("link").locator(".cham-muc").first()).toHaveAttribute("title", /Thuận lợi|Cân bằng|Cần lưu ý/);
  await expect(thanh).toBeHidden();
  await page.getByTestId(`lg-chuong-${BC.chuong[0]!.ma}`).getByTestId("tom-tat").scrollIntoViewIfNeeded();
  await page.mouse.wheel(0, 400);
  await expect(thanh).toBeVisible();
  await expect(thanh.getByTestId("lg-chuong-x")).toContainText("/13");
  await expect.poll(async () => (await thanh.boundingBox())!.y).toBeGreaterThanOrEqual(60);
  expect((await thanh.boundingBox())!.y).toBeLessThanOrEqual(70);
  await thanh.getByRole("button").first().click();
  await expect(thanh).toHaveAttribute("data-mo", "1");
  const dich = BC.chuong[5]!;
  await thanh.getByRole("link", { name: new RegExp(dich.tieu_de) }).click();
  await expect(page.getByTestId(`lg-chuong-${dich.ma}`)).toHaveAttribute("data-mo", "1");
  await expect(thanh).toHaveAttribute("data-mo", "0");
  await expect(page.getByTestId(`lg-chuong-${dich.ma}`).getByTestId("tom-tat")).toBeInViewport();
  await expect(thanh.getByTestId("lg-chuong-x")).toContainText("6/13");
  const rong = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
  expect(rong[0]).toBeLessThanOrEqual(rong[1]!);
  // Cuộn ngược lên mục lục đầu báo cáo → thanh dính ẩn lại.
  await ml.scrollIntoViewIfNeeded();
  await expect(thanh).toBeHidden();
});

test("UX v3 M9: nút 'Chương tiếp' không cắt tên chương ở 360px", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 });
  await moBaoCao(page);
  const nut = page.getByTestId(`lg-chuong-${BC.chuong[0]!.ma}`).getByTestId("lg-chuong-tiep");
  await nut.scrollIntoViewIfNeeded();
  await expect(nut).toContainText(`2. ${BC.chuong[1]!.tieu_de}`);
  const tran = await nut.evaluate((e) => [...e.querySelectorAll("span")].some((s) => s.scrollWidth > s.clientWidth + 1
    || getComputedStyle(s).textOverflow === "ellipsis"));
  expect(tran).toBe(false);
});

test("UX v3 M7: số hộp 'Điều quan trọng nhất' lẻ, hộp đầu chỉ còn tiêu đề → nằm gọn, hộp cuối trải trọn hàng (máy tính)", async ({ page }) => {
  const bc = structuredClone(BC);
  bc.cot_loi[0]!.noi_dung = "";
  delete (bc.cot_loi[0] as { huong_xu_ly?: string }).huong_xu_ly;
  await moBaoCao(page, { bc });
  const hop = page.getByTestId("lg-cot-loi").getByTestId("hop-noi-bat");
  await expect(hop).toHaveCount(BC.cot_loi.length);
  expect(BC.cot_loi.length % 2).toBe(1);
  const rong = await hop.evaluateAll((ds) => ds.map((e) => e.getBoundingClientRect().width));
  expect(rong[0]!).toBeLessThan(rong[1]! * 1.2);                      // hộp đầu (chỉ tiêu đề) cùng cỡ hộp thường
  expect(rong.at(-1)!).toBeGreaterThan(rong[0]! * 1.6);               // hộp cuối trải trọn hàng — lưới không hở ô
});

test("Trục 1: reading_completed chỉ tính khi đã mở và đọc tới hết chương cuối của báo cáo", async ({ page }) => {
  await moBaoCao(page);
  const dem = async () => (await page.evaluate(() => ((window as unknown as { __hbt_su_kien?: Record<string, unknown>[] }).__hbt_su_kien ?? [])
    .filter((e) => e.su_kien === "reading_completed" && e.mo_dun === "tuvi").length));
  await page.getByTestId("doc-xong-tuvi").scrollIntoViewIfNeeded();
  await page.mouse.wheel(0, 50);
  await page.waitForTimeout(11_000);
  expect(await dem()).toBe(0);                       // chương sau còn gập → chưa "đọc xong"
  const cuoi = BC.chuong.at(-1)!;
  await page.getByTestId(`lg-chuong-${cuoi.ma}`).getByTestId("lg-mo-chuong").click();
  await page.getByTestId(`lg-chuong-${cuoi.ma}`).getByTestId("vi-sao").last().scrollIntoViewIfNeeded();
  await page.mouse.wheel(0, 50);
  await page.getByTestId("doc-xong-tuvi").scrollIntoViewIfNeeded();
  await page.mouse.wheel(0, 50);
  await expect.poll(dem, { timeout: 10_000 }).toBe(1);
});
