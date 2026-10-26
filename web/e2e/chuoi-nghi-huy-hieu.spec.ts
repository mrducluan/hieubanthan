// SAO-HH (migration 0030) — ngày nghỉ chuỗi miễn phí · lá bài đầu ngày · "Hẹn với chính mình" · huy hiệu. e2e không có
// Supabase: /api/sao/chuoi, /api/sao/huy-hieu giả lập bằng page.route; điều kiện SQL thật kiểm ở
// supabase/kiem_thu/thu_chuoi_huy_hieu_0030.sql. Mọi khối: không "trúng / thưởng / quay / đếm ngược", không doạ.
import { test, expect, type Page } from "@playwright/test";
import { napHoSo, HO_SO_MAU } from "./_hoso";
import { CAU_DA_NGHI, CAU_NGHI_CON, loiChuoiMayChu } from "../lib/chuoi-ngay";
import { cacLaBai, chonLaBai, type NguyenLieuLaBai } from "../lib/la-bai";
import { DANH_MUC, gopHuyHieu, tienDoHen, type HuyHieu } from "../lib/huy-hieu";

const TU_CAM = /trúng|thưởng|quay số|vòng quay|đếm ngược|sắp mất|mất chuỗi|đừng để|kẻo|nhanh lên|hết hạn|mua huy hiệu/i;
const dd = (p: Partial<Record<string, unknown>>) => ({
  tai_khoan: true, dang_nhap: true, san_sang: true, ngay: "2026-10-25", chuoi: 3, dai_nhat: 3, moi: true,
  bat: true, moc: 7, sao_moc: 2, con_ngay: 4, sao: 0, ...p,
});
type SuKien = { su_kien: string; kind?: string; ma?: string; ngay?: number; chuoi?: number };
const suKien = (page: Page) => page.evaluate(() => (window as unknown as { __hbt_su_kien?: SuKien[] }).__hbt_su_kien ?? []);

async function moHomNay(page: Page) {
  await napHoSo(page);
  await page.goto("/hom-nay");
  await expect(page.getByTestId("the-hom-nay")).toBeVisible({ timeout: 45_000 });
}

test("hàm thuần: lời ngày nghỉ, lá bài tất định, tiến độ hẹn, gộp huy hiệu", () => {
  const goc = { ngay: "2026-10-25", chuoi: 5, dai_nhat: 5, moi: true, bat: false, moc: 7, sao_moc: 2, con_ngay: 2, sao: 0 };
  expect(loiChuoiMayChu({ ...goc, da_nghi: true, nghi_con: false }).nghi).toBe(CAU_DA_NGHI);
  expect(loiChuoiMayChu({ ...goc, da_nghi: false, nghi_con: true }).nghi).toBe(CAU_NGHI_CON);
  expect(loiChuoiMayChu({ ...goc, chuoi: 1, da_nghi: false, nghi_con: true }).nghi).toBeNull();   // ngày đầu: chưa cần nhắc
  expect(loiChuoiMayChu(goc).nghi).toBeNull();   // DB chưa chạy 0030 → không hứa gì
  expect(`${CAU_DA_NGHI} ${CAU_NGHI_CON}`).not.toMatch(TU_CAM);

  const the: NguyenLieuLaBai = {
    ngay_xem: "2026-10-25", ngay_ca_nhan: { so: 4, nghia: "Ngày cá nhân 4: hợp sắp xếp.", tu_soi: "Việc nào cần làm cho xong?" },
    que_ngay: { ten: "Thuần Càn", y_chinh: "Khởi đầu mạnh.", loi_khuyen: "Giữ nhịp.", cau_tu_soi: "Bạn đang dẫn hay đang chờ?" },
    hoang_lich: { gio_hoang_dao: [{ chi: "Tý", khung: "23–1h", than: "Thanh Long" }] },
    ngay_pho_quat: { so: 7, nghia: "Ngày để nhìn lại." },
    chaldea: { so: 3, kep: 12, nghia_goc: null, nghia_kep: { bieu_tuong: "Người treo ngược", xu_huong: "Nhìn từ góc khác." } },
  };
  expect(cacLaBai(the).map((l) => l.ma)).toEqual(["tu_soi", "que", "gio", "pho_quat", "chaldea"]);
  const a = chonLaBai(the, HO_SO_MAU), b = chonLaBai(the, HO_SO_MAU);
  expect(a).toEqual(b);   // tất định
  const mai = chonLaBai({ ...the, ngay_xem: "2026-10-26" }, HO_SO_MAU);
  expect(mai?.ma).not.toBe(a?.ma);   // ngày sau sang lá khác
  for (const l of cacLaBai(the)) expect(`${l.nhan} ${l.chu} ${l.phu ?? ""}`).not.toMatch(TU_CAM);

  const hen = { muc: 7 as const, ngay_bd: "2026-10-20", chuoi_bd: 3 };
  expect(tienDoHen(hen, 3)).toEqual({ ngay: 1, dat: false, lo: false });
  expect(tienDoHen(hen, 9)).toEqual({ ngay: 7, dat: true, lo: false });
  expect(tienDoHen(hen, 1)).toEqual({ ngay: 0, dat: false, lo: true });
  expect(tienDoHen({ ...hen, dat_luc: "2026-10-26" }, 1)).toEqual({ ngay: 7, dat: true, lo: false });

  const may: HuyHieu[] = [{ ma: "chuoi_may_7", dat: true, luc: null, nguon: "may" }, { ma: "hen_7", dat: false, luc: null, nguon: "may" }];
  const g = gopHuyHieu([{ ma: "chuoi_7", dat: true, luc: "2026-10-20" }, { ma: "hoi_vien", dat: false, luc: null }], may);
  expect(g.map((h) => h.ma)).toEqual(["chuoi_7", "hen_7"]);   // hoi_vien chưa đạt không gợi; chuỗi máy ẩn khi tài khoản đã đạt
  expect(gopHuyHieu(null, may).map((h) => h.ma)).toEqual(["chuoi_may_7", "hen_7"]);
  for (const d of Object.values(DANH_MUC)) expect(`${d.ten} ${d.dieu_kien}`).not.toMatch(TU_CAM);
});

test("đã đăng nhập, hôm qua nghỉ: dòng 'chuỗi vẫn nối tiếp', đo streak_freeze_used; hôm sau chỉ nhắc còn ngày nghỉ", async ({ page }) => {
  await page.route("**/api/sao/chuoi", (r) => r.fulfill({ json: dd({ chuoi: 5, dai_nhat: 5, con_ngay: 2, da_nghi: true, nghi_con: false }) }));
  await moHomNay(page);
  await expect(page.getByTestId("chuoi-chinh")).toHaveText("Bạn ghé 5 ngày liên tiếp");
  await expect(page.getByTestId("chuoi-nghi")).toHaveText(CAU_DA_NGHI);
  expect(await page.getByTestId("chuoi-ngay").innerText()).not.toMatch(TU_CAM);
  expect(await suKien(page)).toContainEqual(expect.objectContaining({ su_kien: "streak_freeze_used", chuoi: 5 }));
  await page.route("**/api/sao/chuoi", (r) => r.fulfill({ json: dd({ chuoi: 6, dai_nhat: 6, con_ngay: 1, moi: false, da_nghi: false, nghi_con: true }) }));
  await page.reload();
  await expect(page.getByTestId("chuoi-nghi")).toHaveText(CAU_NGHI_CON);
  // DB chưa chạy 0030 (không có da_nghi / nghi_con) → không dòng nào
  await page.route("**/api/sao/chuoi", (r) => r.fulfill({ json: dd({ chuoi: 6, dai_nhat: 6, con_ngay: 1, moi: false }) }));
  await page.reload();
  await expect(page.getByTestId("chuoi-nghi")).toHaveCount(0);
});

test("lá bài đầu ngày: úp → lật → một điều của hôm nay, nhớ trong ngày, không chữ cấm, chỉ đo mã", async ({ page }) => {
  await moHomNay(page);
  const la = page.getByTestId("la-bai");
  await expect(la).toHaveAttribute("data-lat", "0");
  await expect(la.getByTestId("la-bai-noi-dung")).toHaveCount(0);
  await la.getByRole("button", { name: "Lật lá bài của hôm nay" }).click();
  await expect(la).toHaveAttribute("data-lat", "1");
  const nd = la.getByTestId("la-bai-noi-dung");
  await expect(nd).toBeVisible();
  expect((await nd.innerText()).trim().length).toBeGreaterThan(10);
  expect(await la.innerText()).not.toMatch(TU_CAM);
  const sk = await suKien(page);
  const lat = sk.find((e) => e.su_kien === "daily_card_flipped");
  expect(lat).toBeTruthy();
  expect(Object.keys(lat!)).not.toContain("chu");
  expect(await page.evaluate(() => localStorage.getItem("hbt.la_bai.v1"))).toContain('"lat":true');
  // Mở lại trong ngày: vẫn đã lật, cùng nội dung
  const chu = await nd.innerText();
  await page.reload();
  await expect(page.getByTestId("la-bai")).toHaveAttribute("data-lat", "1");
  await expect(page.getByTestId("la-bai-noi-dung")).toHaveText(chu);
  await expect(page.getByTestId("la-bai-chia-se")).toBeVisible();
});

test("hẹn với chính mình 7 ngày: đặt → tiến độ từ chuỗi → đạt → huy hiệu máy + chia sẻ; lỡ → hẹn lại, không mất gì", async ({ page }) => {
  await page.route("**/api/sao/chuoi", (r) => r.fulfill({ json: dd({ chuoi: 3, dai_nhat: 3, con_ngay: 4 }) }));
  await moHomNay(page);
  const hen = page.getByTestId("hen-chinh-minh");
  await expect(hen).toHaveAttribute("data-trang-thai", "chua_hen");
  await hen.getByTestId("hen-7").click();
  await expect(hen).toHaveAttribute("data-trang-thai", "dang_di");
  await expect(hen.getByTestId("hen-tien-do")).toHaveText("1");
  expect(await suKien(page)).toContainEqual(expect.objectContaining({ su_kien: "self_goal_set", ngay: 7 }));
  // Chuỗi tới 9 (= 7 ngày từ lúc hẹn) → đạt
  await page.route("**/api/sao/chuoi", (r) => r.fulfill({ json: dd({ chuoi: 9, dai_nhat: 9, con_ngay: 5, moi: false }) }));
  await page.reload();
  await expect(page.getByTestId("hen-chinh-minh")).toHaveAttribute("data-trang-thai", "dat");
  await expect(page.getByTestId("hen-chinh-minh")).toContainText("Giữ lời hẹn 7 ngày");
  await expect(page.getByTestId("hen-chia-se")).toBeVisible();
  const sk = await suKien(page);
  expect(sk).toContainEqual(expect.objectContaining({ su_kien: "self_goal_reached", ngay: 7 }));
  expect(sk).toContainEqual(expect.objectContaining({ su_kien: "badge_earned", ma: "hen_7" }));
  expect(await page.evaluate(() => localStorage.getItem("hbt.huy_hieu_may.v1"))).toContain("hen_7");
  expect(await page.getByTestId("the-hom-nay").innerText()).not.toMatch(TU_CAM);
  // Hẹn tiếp 30, rồi chuỗi đứt → "lỡ", hẹn lại từ hôm nay
  await page.getByTestId("hen-chinh-minh").getByTestId("hen-30").click();
  await expect(page.getByTestId("hen-chinh-minh")).toHaveAttribute("data-trang-thai", "dang_di");
  await page.route("**/api/sao/chuoi", (r) => r.fulfill({ json: dd({ chuoi: 1, dai_nhat: 9, con_ngay: 6 }) }));
  await page.reload();
  const lo = page.getByTestId("hen-chinh-minh");
  await expect(lo).toHaveAttribute("data-trang-thai", "lo");
  expect(await lo.innerText()).not.toMatch(TU_CAM);
  await lo.getByTestId("hen-lai").click();
  await expect(page.getByTestId("hen-chinh-minh")).toHaveAttribute("data-trang-thai", "dang_di");
  await expect(page.getByTestId("hen-tien-do")).toHaveText("1");
  // Huy hiệu hen_7 vẫn còn ở Bản thân
  await page.goto("/ban-than");
  const hh = page.getByTestId("huy-hieu");
  await expect(hh).toBeVisible({ timeout: 45_000 });
  await expect(hh.getByTestId("hh-hen_7")).toHaveAttribute("data-dat", "1");
});

test("khách: khối huy hiệu trên Bản thân chỉ dấu mốc máy (mờ + điều kiện), ghi rõ không mua bán; Tài khoản có dòng tóm tắt", async ({ page, request }) => {
  expect(await (await request.get("/api/sao/huy-hieu")).json()).toEqual({ tai_khoan: false });
  await napHoSo(page);
  await page.addInitScript(() => {
    const homNay = new Date(Date.now() + 7 * 3600_000).toISOString().slice(0, 10);
    localStorage.setItem("hbt.hom_nay", JSON.stringify({ ngay: homNay, chuoi: 8 }));
    localStorage.setItem("hbt.mang_da_xem.v1", JSON.stringify(["thanso", "tuvi"]));
  });
  await page.goto("/ban-than");
  const hh = page.getByTestId("huy-hieu");
  await expect(hh).toBeVisible({ timeout: 45_000 });
  await expect(hh).toContainText("chỉ hiện dấu mốc ghi trên máy này");
  await expect(hh.getByTestId("hh-chuoi_may_7")).toHaveAttribute("data-dat", "1");
  await expect(hh.getByTestId("hh-chuoi_may_7")).toContainText("trên máy này");
  await expect(hh.getByTestId("hh-doc_5_mang")).toHaveAttribute("data-dat", "0");
  await expect(hh.getByTestId("hh-doc_5_mang")).toContainText(DANH_MUC.doc_5_mang.dieu_kien);
  await expect(hh.getByTestId("hh-chuoi_7")).toHaveCount(0);   // máy chủ không có khi chưa đăng nhập
  await expect(hh).toContainText("không mua bán, không chuyển cho ai, không đổi ra Sao hay tiền");
  expect(await hh.innerText()).not.toMatch(TU_CAM);
  await page.goto("/tai-khoan");
  await expect(page.getByTestId("huy-hieu-tom-tat")).toContainText("Huy hiệu: 1/4 dấu mốc");
});

test("đã đăng nhập: huy hiệu máy chủ sáng / mờ theo dat, kèm ngày đạt; mảng đã xem ghi từ reading_started", async ({ page }) => {
  await page.route("**/api/sao/huy-hieu", (r) => r.fulfill({ json: { tai_khoan: true, dang_nhap: true, san_sang: true, huy_hieu: [
    { ma: "chuoi_7", dat: true, luc: "2026-10-20" }, { ma: "chuoi_30", dat: false, luc: null }, { ma: "da_luu_ho_so", dat: true, luc: "2026-10-01" },
    { ma: "hoi_3", dat: false, luc: null }, { ma: "moi_1", dat: false, luc: null }, { ma: "moi_5", dat: false, luc: null }, { ma: "hoi_vien", dat: false, luc: null },
  ] } }));
  await napHoSo(page);
  await page.goto("/ban-than");
  const hh = page.getByTestId("huy-hieu");
  await expect(hh).toBeVisible({ timeout: 45_000 });
  await expect(hh.getByTestId("hh-chuoi_7")).toHaveAttribute("data-dat", "1");
  await expect(hh.getByTestId("hh-chuoi_7")).toContainText("20/10/2026");
  await expect(hh.getByTestId("hh-chuoi_30")).toHaveAttribute("data-dat", "0");
  await expect(hh.getByTestId("hh-hoi_vien")).toHaveCount(0);
  await expect(hh.getByTestId("hh-chuoi_may_7")).toHaveCount(0);   // tài khoản đã đạt chuỗi 7 → ẩn bản máy
  await expect(hh.getByTestId("huy-hieu-ds")).toHaveAttribute("data-dat", "2");
  // reading_started của thần số (trang này) đã ghi mảng vào máy
  expect(await page.evaluate(() => localStorage.getItem("hbt.mang_da_xem.v1"))).toContain("thanso");
});
