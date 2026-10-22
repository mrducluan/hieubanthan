// KC-0 (docs/PHAN-TICH-MIGRATION-V2-2.md, GĐ0): nút 1 chạm "Đúng với mình / Chưa đúng" trên thẻ Đường bay tứ hoá và
// tháng đang diễn ra của "3 tháng tới". Sự kiện `tuvi_kiem_chung` CHỈ mang mã (mau, loai, ket_qua, phai), mỗi thẻ một
// lần mỗi phiên. Route TV-V2 trả output thật của engine đã ghi sẵn (e2e/fixtures/tuvi-v2.json), như tuvi-v2.spec.ts.
import { test, expect, type Page } from "@playwright/test";
import { napHoSo } from "./_hoso";
import FX from "./fixtures/tuvi-v2.json";
import { locThuocTinh } from "../lib/do-luong";
import { MA_DOI_SONG, MA_HAI_NGUOI, maNhip, maPhiHoa, MAU_KIEM_CHUNG, nhanMau, PHAI_HAI_NGUOI, tinhKiemChung } from "../lib/kiem-chung";

const PHI_HOA = FX["phi-hoa"];
const HOP_THAM = FX["hop-tham"];
const NHIP = FX["nhip-3-thang"];
type SK = { su_kien: string } & Record<string, unknown>;
const kiemChung = (p: Page) => p.evaluate(() =>
  ((window as unknown as { __hbt_su_kien?: SK[] }).__hbt_su_kien ?? []).filter((e) => e.su_kien === "tuvi_kiem_chung"));

async function mock(page: Page) {
  await page.route("**/api/tuvi/phi-hoa", (r) => r.fulfill({ json: PHI_HOA }));
  await page.route("**/api/tuvi/nhip-3-thang", (r) => r.fulfill({ json: NHIP }));
}

async function moKhoi(page: Page, nut: RegExp, testId: string) {
  if (!(await page.getByTestId(testId).isVisible().catch(() => false))) await page.getByRole("button", { name: nut }).click();
  await expect(page.getByTestId(testId)).toBeVisible();
}

const MA_HOP_LE = /^[a-z0-9_.+-]+$/;

test("mã kiểm chứng tất định, ngắn, chỉ ASCII — qua được bộ lọc thuộc tính", () => {
  const CUNG = ["Mệnh", "Phụ Mẫu", "Phúc Đức", "Điền Trạch", "Quan Lộc", "Nô Bộc", "Thiên Di", "Tật Ách", "Tài Bạch", "Tử Nữ", "Phu Thê", "Huynh Đệ"];
  for (const loai of ["mau", "ky_xung", "loc_nhap", "tu_hoa"]) for (const hoa of ["Lộc", "Quyền", "Khoa", "Kỵ"]) for (const tu of CUNG) for (const den of CUNG) {
    const ma = maPhiHoa({ loai, duong: { tu_cung: tu, hoa, den_cung: den, tu_hoa: tu === den } });
    expect(ma).toMatch(MA_HOP_LE);
    expect(locThuocTinh({ mau: ma }).mau).toBe(ma);   // ≤ 40 ký tự, không 4 chữ số liền
  }
  expect(maPhiHoa(PHI_HOA.noi_bat[0]!)).toBe("mau.menh.ky.tu");
  const tatCa = maNhip({ muc: "can_than", ly_do: ["song_loc", "chong_ky", "khoa_giai", "ky_xung_cung_chinh", "ky_nhap_cung_chinh", "loc_nhap_cung_chinh"].map((ma) => ({ ma })) });
  expect(tatCa).toBe("can_than.ck+kg+kn+kx+ln+sl");
  expect(locThuocTinh({ mau: tatCa }).mau).toBe(tatCa);
  expect(maNhip(NHIP.thang[0]!)).toBe("thuan.ln");
  expect(maNhip({ muc: "binh", ly_do: [] })).toBe("binh.-");
  expect(nhanMau("nhip_3_thang", "thuan.ln")).toBe("Thuận · Lộc nhập cung chính");
  // Bộ lọc vẫn chặn chữ tự do / thuộc tính lạ (không có đường nào để bình luận đi lên PostHog).
  expect(locThuocTinh({ mau: "x".repeat(61), binh_luan: "sai rồi", loai: "phi_hoa" })).toEqual({ loai: "phi_hoa" });
  // LG-ĐS: mã hộp đời sống "ds.*" tới 60 ký tự đi qua; vẫn chặn 4 chữ số liền (dễ là năm sinh).
  const ds = "ds.su_nghiep.thien_co.sang.manh";
  expect(locThuocTinh({ mau: ds, loai: "doi_song" })).toEqual({ mau: ds, loai: "doi_song" });
  expect(locThuocTinh({ mau: `ds.nam_nay.${"a".repeat(40)}` }).mau).toHaveLength(51);
  expect(locThuocTinh({ mau: "ds.nam_nay.1990" }).mau).toBeUndefined();
  expect(MA_DOI_SONG.test(ds) && !MA_DOI_SONG.test("ds.") && !MA_DOI_SONG.test("su_nghiep.manh")).toBe(true);
  expect(nhanMau("doi_song", ds)).toBe("Công việc · thien co · sáng · điểm mạnh");
});

test("bảng quản trị: chỉ mã đủ mẫu mới có tỉ lệ, tỉ lệ đúng thấp lên đầu", () => {
  const kq = tinhKiemChung([
    { loai: "phi_hoa", mau: "mau.menh.ky.tu", dung: 25, chua_dung: 10 },
    { loai: "phi_hoa", mau: "ky_xung.quan_loc.ky.menh", dung: 5, chua_dung: 30 },
    { loai: "nhip_3_thang", mau: "thuan.ln", dung: 10, chua_dung: MAU_KIEM_CHUNG - 11 },
  ]);
  expect(kq.du.map((d) => d.mau)).toEqual(["ky_xung.quan_loc.ky.menh", "mau.menh.ky.tu"]);
  expect(kq.chuaDu).toBe(1);
  expect(kq.tongPhieu).toBe(35 + 35 + MAU_KIEM_CHUNG - 1);
  expect(kq.du[0]!.nhan).toContain("Kỵ xung");
});

test("thẻ Đường bay + tháng hiện tại có nút kiểm chứng; sự kiện chỉ mang mã; mỗi thẻ ghi một lần mỗi phiên", async ({ page }) => {
  await napHoSo(page);
  await mock(page);
  await page.goto("/tu-vi");
  await expect(page.getByRole("group", { name: /Lá số Tử vi/ })).toBeVisible();

  // Đường bay tứ hoá: mỗi thẻ nổi bật có nút, không có ô nhập chữ.
  await moKhoi(page, /Đường bay tứ hoá/, "phi-hoa-noi-bat");
  const ph = page.getByTestId("phi-hoa-noi-bat");
  await expect(ph.getByTestId("kiem-chung")).toHaveCount(PHI_HOA.noi_bat.length);
  await expect(ph.locator("input, textarea, [contenteditable]")).toHaveCount(0);
  const the0 = ph.locator("li").first();
  await the0.getByRole("button", { name: "Đúng với mình" }).dblclick();
  await expect(the0.getByRole("status")).toContainText("Cảm ơn");
  await expect(the0.getByRole("button", { name: "Đúng với mình" })).toHaveCount(0);
  let sk = await kiemChung(page);
  expect(sk).toHaveLength(1);
  expect(sk[0]).toEqual({ su_kien: "tuvi_kiem_chung", feature_version: "gate_v1", loai: "phi_hoa", mau: maPhiHoa(PHI_HOA.noi_bat[0]!), ket_qua: "dung", phai: "phi_tinh" });
  expect(String(sk[0]!.mau)).toMatch(MA_HOP_LE);

  // Tải lại trang (cùng phiên): thẻ đã trả lời không hỏi lại, không ghi thêm; thẻ khác vẫn hỏi.
  await page.reload();
  await expect(page.getByRole("group", { name: /Lá số Tử vi/ })).toBeVisible();
  await moKhoi(page, /Đường bay tứ hoá/, "phi-hoa-noi-bat");
  await expect(ph.locator("li").first().getByRole("status")).toContainText("Cảm ơn");
  const the1 = ph.locator("li").nth(1);
  await the1.getByRole("button", { name: "Chưa đúng" }).click();
  sk = await kiemChung(page);
  expect(sk).toHaveLength(1);
  expect(sk[0]).toMatchObject({ loai: "phi_hoa", mau: maPhiHoa(PHI_HOA.noi_bat[1]!), ket_qua: "chua_dung" });

  // 3 tháng tới: chỉ tháng đã bắt đầu (tu ≤ ngay_xem) mới có nút.
  await moKhoi(page, /3 tháng tới/, "nhip-3-thang-noi-dung");
  const the = page.getByTestId("the-thang");
  const daBatDau = NHIP.thang.filter((t) => t.tu <= NHIP.ngay_xem).length;
  expect(daBatDau).toBeGreaterThan(0);
  await expect(page.getByTestId("nhip-3-thang-noi-dung").getByTestId("kiem-chung")).toHaveCount(daBatDau);
  await expect(the.nth(2).getByTestId("kiem-chung")).toHaveCount(0);
  await the.nth(0).getByRole("button", { name: "Đúng với mình" }).click();
  sk = (await kiemChung(page)).filter((e) => e.loai === "nhip_3_thang");
  expect(sk).toHaveLength(1);
  expect(sk[0]).toEqual({ su_kien: "tuvi_kiem_chung", feature_version: "gate_v1", loai: "nhip_3_thang", mau: maNhip(NHIP.thang[0]!), ket_qua: "dung", phai: NHIP.phai_luu_nguyet });
});

test("Xem lá số 2 người: hộp điểm có nút kiểm chứng loại hai_nguoi — gửi máy chủ + PostHog chỉ mã; hiện % khi đủ 30 phiếu", async ({ page }) => {
  const D = HOP_THAM.diem!;
  const hop = [...D.diem_manh, ...D.can_dung_hoa];
  expect(hop.length).toBeGreaterThan(1);
  for (const h of hop) expect(MA_HAI_NGUOI.test(h.ma_mau!), h.ma_mau).toBe(true);
  expect(PHAI_HAI_NGUOI.test(D.phien_ban)).toBe(true);
  expect(MA_HAI_NGUOI.test("hn.menh.tuong_sinh.1990") || MA_HAI_NGUOI.test("hn.ten.an.nguoi_yeu")).toBe(false);
  expect(nhanMau("hai_nguoi", "hn.chi.tam_hop.nguoi_yeu")).toBe("2 người · Con giáp · tam hop · người yêu");

  const guiMayChu: Record<string, unknown>[] = [];
  let hoiTyLe = "";
  await napHoSo(page);
  await mock(page);
  await page.route("**/api/tuvi/hop-tham", (r) => r.fulfill({ json: HOP_THAM }));
  await page.route("**/api/kiem-chung", (r) => { guiMayChu.push(r.request().postDataJSON()); return r.fulfill({ json: { ok: true, da_luu: true } }); });
  await page.route("**/api/kiem-chung/ty-le**", (r) => {
    hoiTyLe = new URL(r.request().url()).searchParams.get("mau") ?? "";
    return r.fulfill({ json: { ty_le: { [hop[1]!.ma_mau!]: { dung: 31, chua_dung: 9 } } } });
  });
  await page.goto("/tu-vi");
  await page.getByRole("button", { name: /Xem lá số 2 người/ }).click();
  const form = page.getByTestId("hop-tham-form");
  await form.getByLabel("Ngày sinh người ấy").fill("3");
  await form.getByLabel("Tháng sinh người ấy").fill("4");
  await form.getByLabel("Năm sinh người ấy").fill("1995");
  await form.getByRole("button", { name: "Xem độ hợp" }).click();
  const khoi = page.getByTestId("hai-nguoi-hop");
  await expect(khoi.getByTestId("kiem-chung")).toHaveCount(hop.length);
  await expect(khoi.locator("input, textarea, [contenteditable]")).toHaveCount(0);
  // Một lời gọi tỉ lệ cho mọi mã hộp; mã đủ 30 phiếu hiện "x% trong N người"
  await expect.poll(() => hoiTyLe.split(",").sort()).toEqual(hop.map((h) => h.ma_mau!).sort());
  await expect(khoi.getByTestId("hop-noi-bat").nth(1).getByTestId("ty-le-dung")).toContainText("78% trong 40 người");
  await expect(khoi.getByTestId("hop-noi-bat").nth(0).getByTestId("ty-le-dung")).toHaveCount(0);

  await khoi.getByTestId("hop-noi-bat").nth(0).getByRole("button", { name: "Đúng với mình" }).click();
  await expect(khoi.getByTestId("hop-noi-bat").nth(0).getByRole("status")).toContainText("Cảm ơn");
  await expect.poll(() => guiMayChu.length).toBe(1);
  expect(guiMayChu[0]).toEqual({ loai: "hai_nguoi", mau: hop[0]!.ma_mau, phai: D.phien_ban, ket_qua: "dung" });
  const sk = await kiemChung(page);
  expect(sk).toEqual([{ su_kien: "tuvi_kiem_chung", feature_version: "gate_v1", loai: "hai_nguoi", mau: hop[0]!.ma_mau, ket_qua: "dung", phai: D.phien_ban }]);
});

test("API kiểm chứng: loại hai_nguoi chỉ nhận đúng dạng mã + phái (chưa bật Supabase → chua_bat, không lỗi)", async ({ request }) => {
  const gui = (d: object) => request.post("/api/kiem-chung", { data: d });
  const tot = { loai: "hai_nguoi", mau: "hn.chi.tam_hop.nguoi_yeu", phai: "hai_nguoi_1", ket_qua: "dung" };
  const r = await gui(tot);
  expect(r.status()).toBe(200);
  expect(await r.json()).toMatchObject({ ok: false, ly_do: "chua_bat" });
  for (const sai of [{ ...tot, phai: "nam_phai_viet" }, { ...tot, mau: "hn.ten.an.nguoi_yeu" }, { ...tot, mau: "hn.chi.tam_hop.1990" },
    { ...tot, mau: "ds.tong_quan.x" }, { ...tot, loai: "khac" }]) {
    expect((await gui(sai)).status(), JSON.stringify(sai)).toBe(422);
  }
});
