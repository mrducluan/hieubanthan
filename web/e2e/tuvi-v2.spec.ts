// TV-V2 (docs/NANG-CAP-TUVI-V2.md): 4 khối nâng cao trên /tu-vi — Đường bay tứ hoá, 3 tháng tới, Định giờ sinh,
// Xem lá số 2 người (mã cũ: hợp tham — HN-2N có điểm tham khảo). Lá số thật từ engine; 4 route mới trả OUTPUT THẬT của engine đã ghi sẵn (e2e/fixtures/tuvi-v2.json, cùng
// hồ sơ HO_SO_MAU) để test UI tất định. Test cuối gọi engine thật qua proxy web cho các ca khó (Tý muộn, không biết
// giờ, miền Nam 1965, ba tháng vắt sang năm âm sau) — bắt lệch hợp đồng zod giữa web và engine.
import { test, expect, type Page, type Request } from "@playwright/test";
import { HO_SO_MAU, napHoSo } from "./_hoso";
import FX from "./fixtures/tuvi-v2.json";

const PHI_HOA = FX["phi-hoa"];
const NHIP = FX["nhip-3-thang"];
const DINH_GIO = FX["dinh-gio"];
const DINH_GIO_12 = FX["dinh-gio-12"];
const HOP_THAM = FX["hop-tham"];
const DINH_GIO_NAM_65 = FX["dinh-gio-mien-nam-1965"];
const DINH_GIO_TY_MUON_12 = FX["dinh-gio-ty-muon-12"];
const DINH_GIO_NAM_65_00H30 = FX["dinh-gio-mien-nam-1965-00h30"];
const DINH_GIO_NAM_65_00H30_12 = FX["dinh-gio-mien-nam-1965-00h30-12"];
const DINH_GIO_MUA_HE = FX["dinh-gio-gio-mua-he"];
const NHAN_MUC: Record<string, string> = { thuan: "Thuận", binh: "Bình", can_than: "Cần thận trọng" };

async function mock(page: Page, dinhGio?: { ba?: object; muoiHai?: object }) {
  const goi: Record<string, Request[]> = { "phi-hoa": [], "nhip-3-thang": [], "dinh-gio": [], "hop-tham": [] };
  // Cung của mock phi hoá lấy theo lá số thật (tên ↔ chi khớp), để "Xem cung trên lá số" chọn đúng cung.
  let cungThat: { ten: string; chi: string; can: string; la_menh: boolean; la_lai_nhan?: boolean }[] | null = null;
  await page.route("**/api/tuvi/la-so", async (r) => {
    const res = await r.fetch();
    const j = await res.json();
    cungThat = j.cung;
    return r.fulfill({ response: res, json: j });
  });
  const phiHoa = () => cungThat
    ? { ...PHI_HOA, cung: cungThat.map((c) => ({ ten: c.ten, chi: c.chi, can: c.can, la_menh: c.la_menh, la_lai_nhan: Boolean(c.la_lai_nhan) })) }
    : PHI_HOA;
  const json = { "phi-hoa": PHI_HOA, "nhip-3-thang": NHIP, "dinh-gio": DINH_GIO, "hop-tham": HOP_THAM } as const;
  for (const k of Object.keys(json) as (keyof typeof json)[]) {
    await page.route(`**/api/tuvi/${k}`, (r) => {
      goi[k]!.push(r.request());
      const body = k === "phi-hoa" ? phiHoa() : k === "dinh-gio"
        ? (r.request().postDataJSON()?.tat_ca_gio ? dinhGio?.muoiHai ?? DINH_GIO_12 : dinhGio?.ba ?? DINH_GIO)
        : json[k];
      return r.fulfill({ json: body });
    });
  }
  return goi;
}

test("3 tháng tới (NHIP-2) vừa màn hình 360px, không tràn ngang", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await napHoSo(page);
  await mock(page);
  await page.goto("/tu-vi");
  await expect(page.getByRole("group", { name: /Lá số Tử vi/ })).toBeVisible();
  await page.getByRole("button", { name: /3 tháng tới/ }).click();
  await expect(page.getByTestId("the-thang")).toHaveCount(3);
  await expect(page.getByTestId("vong-cung-thang").first()).toBeVisible();
  const tran = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(tran).toBeLessThanOrEqual(0);
});

test("4 khối TV-V2 hiện, chỉ gọi engine khi mở, không có giọng doạ", async ({ page }) => {
  await napHoSo(page);
  const goi = await mock(page);
  await page.goto("/tu-vi");
  await expect(page.getByRole("group", { name: /Lá số Tử vi/ })).toBeVisible();
  for (const id of ["phi-hoa", "nhip-3-thang", "dinh-gio", "hop-tham"]) await expect(page.getByTestId(id)).toBeVisible();
  // Tải lười: chưa mở thì chưa gọi.
  expect(Object.values(goi).every((g) => g.length === 0)).toBe(true);

  // Đường bay tứ hoá
  await page.getByRole("button", { name: /Đường bay tứ hoá/ }).click();
  const ph = page.getByTestId("phi-hoa-noi-bat");
  const nb0 = PHI_HOA.noi_bat[0]!;
  await expect(ph).toContainText(nb0.tieu_de);
  await expect(ph).toContainText(`Nên làm: ${nb0.viec_nen_lam}`);
  await expect(ph).toContainText(`Tự soi: ${nb0.cau_tu_soi}`);
  await expect(page.getByTestId("phi-hoa-luu-nien")).toContainText(PHI_HOA.luu_nien!.can_chi);
  await page.getByTestId("phi-hoa-bang").locator("summary").click();
  await expect(page.getByTestId("phi-hoa-bang")).toContainText("tự hoá");
  await ph.getByRole("button", { name: "Xem cung trên lá số" }).first().click();
  await expect(page.getByRole("heading", { name: new RegExp(`Cung ${nb0.duong.den_cung ?? nb0.duong.tu_cung}`) })).toBeVisible();
  // next dev (StrictMode) có thể gọi effect hai lần → đếm ≥ 1, xét yêu cầu cuối.
  expect(goi["phi-hoa"]!.length).toBeGreaterThanOrEqual(1);
  expect(goi["phi-hoa"]!.at(-1)!.postDataJSON()).toMatchObject({ la_so: { birth_time: "12:30" }, nam_xem: expect.any(Number) });

  // 3 tháng tới
  await page.getByRole("button", { name: /3 tháng tới/ }).click();
  const the = page.getByTestId("the-thang");
  await expect(the).toHaveCount(3);
  for (const [k, t] of NHIP.thang.entries()) await expect(the.nth(k)).toContainText(NHAN_MUC[t.muc]!);
  await expect(the.nth(2)).toContainText(NHIP.thang[2]!.cau_tu_soi!);
  // NHIP-2: câu so ba tháng + biểu đồ nhịp + kết luận riêng từng tháng + 2–3 hộp nổi bật; lời không lặp giữa các tháng.
  const nhip = page.getByTestId("nhip-3-thang-noi-dung");
  await expect(page.getByTestId("nhip-tom-tat")).toHaveText(NHIP.tom_tat_3_thang!);
  await expect(page.getByTestId("nhip-bieu-do").locator("[role=button]")).toHaveCount(3);
  for (const [k, t] of NHIP.thang.entries()) {
    await expect(the.nth(k).getByTestId("tieu-de-thang")).toHaveText(t.tieu_de_thang!);
    await expect(the.nth(k).getByTestId("hop-noi-bat")).toHaveCount(t.hop!.length);
    await expect(the.nth(k).getByText("Nên làm", { exact: true })).toBeVisible();
    await expect(the.nth(k).getByTestId("vong-cung-thang")).toBeVisible();
  }
  expect(new Set(NHIP.thang.map((t) => t.goi_y)).size).toBe(3);
  // Học thuật thu gọn: chip tứ hoá + câu "Năm …: tứ hoá của năm" chỉ hiện khi bấm.
  const chip = the.nth(0).getByRole("list", { name: "Tứ hoá theo can tháng" });
  await expect(chip).toBeHidden();
  await expect(page.getByText(`Năm ${NHIP.luu_nien.can_chi}: tứ hoá của năm`)).toBeHidden();
  await the.nth(0).getByRole("button", { name: /Vì sao nói vậy/ }).click();
  await expect(chip).toBeVisible();
  await expect(the.nth(0).getByTestId("can-cu")).toContainText(`Tứ hoá tháng ${NHIP.thang[0]!.can_chi}`);
  // Bấm nút tháng trên biểu đồ → thẻ tháng đó được làm nổi.
  await page.getByTestId("nhip-bieu-do").locator("[role=button]").nth(2).click();
  await expect(the.nth(2)).toHaveClass(/shadow-glow/);
  // Ba tháng vắt sang năm âm sau: hiện cả tứ hoá năm mới + thứ tự ưu tiên (uu_tien là object của engine).
  await page.getByTestId("nhip-hoc-thuat").locator("summary").click();
  await expect(nhip).toContainText(NHIP.luu_nien_sau!.can_chi);
  await expect(page.getByTestId("nhip-3-thang-uu-tien")).toContainText(NHIP.uu_tien.ghi_chu);
  await expect(page.getByText(`Năm ${NHIP.luu_nien.can_chi}: tứ hoá của năm`)).toBeVisible();
  await expect(nhip).not.toContainText("[object Object]");

  // Định giờ sinh: tick + "Dùng giờ này" chỉ mở form hồ sơ, ghi lech
  await page.getByRole("button", { name: /Định giờ sinh/ }).click();
  const uv = page.getByTestId("ung-vien-gio");
  await expect(uv).toHaveCount(3);
  await expect(page.getByTestId("dinh-gio-noi-dung")).toContainText(DINH_GIO.ly_do.length ? "sát ranh giới" : "không sát ranh canh giờ");
  await expect(page.getByTestId("dinh-gio-noi-dung")).toContainText(DINH_GIO.loi_dan);
  await uv.nth(0).getByRole("checkbox").first().check();
  await expect(uv.nth(0)).toContainText("1 câu bạn thấy đúng");
  await expect(uv.nth(1).getByRole("button", { name: "Dùng giờ này" })).toHaveCount(0);   // giờ đã nhập
  await uv.nth(2).getByRole("button", { name: "Dùng giờ này" }).click();
  await expect(page.getByRole("dialog", { name: "Sửa giờ sinh trong hồ sơ" })).toBeVisible();
  await page.keyboard.press("Escape");
  // Người dùng chọn năm đối chiếu → gửi lại với nam_doi_chieu
  await page.getByRole("button", { name: "Chọn năm bạn nhớ rõ" }).click();
  await page.getByLabel("Năm đối chiếu 1").fill("2019");
  await page.getByLabel("Năm đối chiếu 2").fill("");
  await page.getByLabel("Năm đối chiếu 3").fill("");
  await page.getByRole("button", { name: "Đối chiếu", exact: true }).click();
  await expect.poll(() => goi["dinh-gio"]!.at(-1)?.postDataJSON().nam_doi_chieu).toEqual([2019]);
  expect(goi["dinh-gio"]![0]!.postDataJSON().tat_ca_gio).toBeUndefined();

  // Xem lá số 2 người (HN-2N: có điểm tham khảo)
  await page.getByRole("button", { name: /Xem lá số 2 người/ }).click();
  const form = page.getByTestId("hop-tham-form");
  await expect(form).toContainText("điểm tham khảo 0–100");
  await expect(form).not.toContainText("không chấm điểm");
  await expect(form.getByTestId("hop-tham-vi-sao-diem")).toContainText("Vì sao ở đây có điểm");   // trục 2 UX: nói rõ khác Hợp đôi thần số
  await expect(form).toContainText("đủ giờ, giới tính và nơi sinh thì xem được hai chiều");
  await expect(form).toContainText("không lưu lại");
  await expect(form.locator("[data-testid^=hop-tham-quan-he-]")).toHaveCount(8);
  await form.getByTestId("hop-tham-quan-he-ban_be").click();
  await form.getByLabel("Ngày sinh người ấy").fill("3");
  await form.getByLabel("Tháng sinh người ấy").fill("4");
  await form.getByLabel("Năm sinh người ấy").fill("1995");
  await form.getByRole("button", { name: "Xem độ hợp" }).click();
  const kq = page.getByTestId("hop-tham-ket-qua");
  const D = HOP_THAM.diem!;
  await expect(kq.getByTestId("diem-tong")).toHaveAttribute("data-diem", String(D.tong));
  await expect(kq.getByTestId("diem-tong")).toContainText(String(D.tong));      // đếm xong
  await expect(kq.getByTestId("diem-muc")).toHaveText(D.nhan_muc);
  await expect(kq.locator("[data-testid^=tieu-chi-]")).toHaveCount(5);
  // chỉ có ngày sinh → chưa tính cung phi, thang chia lại cho 4 tiêu chí
  await expect(kq.getByTestId("tieu-chi-cung_phi")).toHaveAttribute("data-tinh", "0");
  await expect(kq.getByTestId("tieu-chi-cung_phi")).toContainText("Chưa tính");
  for (const t of D.tieu_chi.filter((x) => x.tinh)) await expect(kq.getByTestId(`tieu-chi-${t.ma}`)).toContainText(`${t.diem}/${t.toi_da}`);
  await expect(kq.getByTestId("hai-nguoi-hop").getByTestId("hop-noi-bat")).toHaveCount(D.diem_manh.length + D.can_dung_hoa.length);
  await expect(kq.getByTestId("hai-nguoi-goi-y")).toContainText(D.goi_y[0]!);
  await expect(kq.getByTestId("diem-loi-dan")).toContainText("tham khảo");
  await expect(kq).not.toContainText("Không có điểm hợp/khắc");
  // Phần học thuật thu gọn: đường bay chỉ hiện khi mở
  await expect(kq.getByTestId("hop-tham-kia-vao-ban")).toBeHidden();
  await kq.getByText("Đường bay tứ hoá chi tiết").click();
  await expect(kq).toContainText(HOP_THAM.nguoi_kia_vao_ban.find((h) => h.hoa === "Kỵ")!.nghia);
  expect(goi["hop-tham"]![0]!.postDataJSON()).toMatchObject({ quan_he: "ban_be", nguoi_kia: { birth_date: "1995-04-03" } });
  expect(goi["hop-tham"]![0]!.postDataJSON().nguoi_kia.birth_time).toBeUndefined();

  // Không giọng doạ (trong 4 khối mới)
  let chu = "";
  for (const id of ["phi-hoa", "nhip-3-thang", "dinh-gio", "hop-tham"]) chu += (await page.getByTestId(id).innerText()).toLowerCase();
  for (const cam of ["báo động", "nguy hiểm", "phá sản", "tai nạn"]) expect(chu).not.toContain(cam);

  // Đo lường: chỉ mã
  const sk = await page.evaluate(() => (window as unknown as { __hbt_su_kien?: { su_kien: string; kind?: string; lech?: number }[] }).__hbt_su_kien ?? []);
  const kinds = sk.filter((s) => s.su_kien === "chart_interacted").map((s) => s.kind);
  for (const k of ["phi_hoa", "nhip_3_thang", "hop_tham", "dinh_gio"]) expect(kinds).toContain(k);
  expect(sk.find((s) => s.kind === "dinh_gio")?.lech).toBe(1);
});

test("Xem lá số 2 người: 360px không tràn ngang, giảm chuyển động thì hiện điểm ngay", async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 360, height: 780 }, reducedMotion: "reduce" });
  const page = await ctx.newPage();
  await napHoSo(page);
  await mock(page);
  await page.goto("/tu-vi");
  await page.getByRole("button", { name: /Xem lá số 2 người/ }).click();
  const form = page.getByTestId("hop-tham-form");
  await form.getByLabel("Ngày sinh người ấy").fill("3");
  await form.getByLabel("Tháng sinh người ấy").fill("4");
  await form.getByLabel("Năm sinh người ấy").fill("1995");
  await form.getByRole("button", { name: "Xem độ hợp" }).click();
  const tong = page.getByTestId("diem-tong");
  await expect(tong).toContainText(String(HOP_THAM.diem!.tong), { timeout: 300 });
  const tran = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(tran).toBeLessThanOrEqual(0);
  await ctx.close();
});

test("không biết giờ: hồ sơ chọn được, lá số an tạm 12:00, định giờ hỏi đủ 12 canh", async ({ page }) => {
  await napHoSo(page, { ...HO_SO_MAU, gio: "12:00", do_tin_gio: "unknown" });
  const goi = await mock(page);
  await page.goto("/tu-vi");
  await expect(page.getByRole("group", { name: /Lá số Tử vi/ })).toBeVisible();
  await expect(page.getByTestId("nhac-khong-biet-gio-tuvi")).toBeVisible();
  await page.getByRole("button", { name: /Định giờ sinh/ }).click();
  await expect.poll(() => goi["dinh-gio"]!.length).toBeGreaterThanOrEqual(1);
  expect(goi["dinh-gio"]!.at(-1)!.postDataJSON()).toMatchObject({ tat_ca_gio: true, la_so: { do_tin_gio: "unknown", birth_time: "12:00" } });
  await expect(page.getByTestId("ung-vien-gio")).toHaveCount(12);
  await expect(page.getByTestId("dinh-gio-noi-dung")).toContainText("chưa biết giờ sinh");
});

test("form hồ sơ: chọn “Không biết giờ” → khoá ô giờ, lưu giờ đại diện + unknown", async ({ page }) => {
  const { gio: _g, ...khongGio } = HO_SO_MAU;
  await napHoSo(page, khongGio);
  await mock(page);
  await page.goto("/tu-vi");
  await page.getByRole("button", { name: "Thêm giờ sinh, giới tính, nơi sinh" }).click();
  await page.getByLabel("Giờ sinh này").selectOption("unknown");
  await expect(page.getByLabel("Giờ sinh", { exact: true })).toBeDisabled();
  await expect(page.getByTestId("nhac-khong-biet-gio")).toBeVisible();
  await page.getByRole("button", { name: "Lưu và xem" }).click();
  await expect(page.getByRole("group", { name: /Lá số Tử vi/ })).toBeVisible();
  const hs = await page.evaluate(() => JSON.parse(localStorage.getItem("hbt.hoso.v1") ?? "{}"));
  expect(hs).toMatchObject({ gio: "12:00", do_tin_gio: "unknown" });
});

test("định giờ miền Nam 1965 (đồng hồ UTC+8): khoảng giờ đồng hồ là chính, kèm dòng giờ lịch", async ({ page }) => {
  await napHoSo(page, { ...HO_SO_MAU, ngay: 20, thang: 7, nam: 1965, gio: "06:10", noi_sinh: "tp-ho-chi-minh", vung: "south" });
  const goi = await mock(page, { ba: DINH_GIO_NAM_65 });
  await page.goto("/tu-vi");
  await expect(page.getByRole("group", { name: /Lá số Tử vi/ })).toBeVisible();
  await page.getByRole("button", { name: /Định giờ sinh/ }).click();
  const uv = page.getByTestId("ung-vien-gio");
  await expect(uv).toHaveCount(3);
  const nhap = DINH_GIO_NAM_65.ung_vien[1]!;
  expect(nhap).toMatchObject({ la_gio_nhap: true, khoang_gio: "05:00–06:59", khoang_gio_dong_ho: "06:00–07:59", lech_gio_lich: true });
  await expect(uv.nth(1).getByTestId("khoang-gio")).toHaveText("06:00–07:59");
  await expect(uv.nth(1).getByTestId("khoang-gio-lich")).toContainText("theo giờ lịch: 05:00–06:59");
  await expect(uv.nth(1).getByTestId("khoang-gio-lich")).toContainText("UTC+7");
  expect(goi["dinh-gio"]!.at(-1)!.postDataJSON()).toMatchObject({ la_so: { birth_time: "06:10", noi_sinh: "tp-ho-chi-minh" } });
});

test("hồ sơ thường (không lệch giờ lịch): không hiện dòng giờ lịch", async ({ page }) => {
  await napHoSo(page);
  await mock(page);
  await page.goto("/tu-vi");
  await page.getByRole("button", { name: /Định giờ sinh/ }).click();
  await expect(page.getByTestId("ung-vien-gio")).toHaveCount(3);
  await expect(page.getByTestId("khoang-gio").nth(1)).toHaveText(DINH_GIO.ung_vien[1]!.khoang_gio);
  await expect(page.getByTestId("khoang-gio-lich")).toHaveCount(0);
});

test("12 canh khi giờ nhập 23:xx: thêm ứng viên thứ 13 “Giờ Tý muộn”, lech tính theo thời gian", async ({ page }) => {
  await napHoSo(page, { ...HO_SO_MAU, gio: "12:00", do_tin_gio: "unknown" });
  await mock(page, { muoiHai: DINH_GIO_TY_MUON_12 });
  await page.goto("/tu-vi");
  await page.getByRole("button", { name: /Định giờ sinh/ }).click();
  const uv = page.getByTestId("ung-vien-gio");
  await expect(uv).toHaveCount(13);
  await expect(uv.nth(12)).toContainText("Giờ Tý muộn (23:00–23:59)");
  await expect(uv.nth(12).getByTestId("ghi-chu-ung-vien")).toContainText("ngày hôm sau");
  await expect(uv.nth(0).getByTestId("khoang-gio")).toHaveText("00:00–00:59");
  await expect(uv.nth(12).getByTestId("khoang-gio")).toHaveText("23:00–23:59");
  await uv.nth(0).getByRole("button", { name: "Dùng giờ này" }).click();     // Tý sớm 00:30 sớm hơn 23:30 đã nhập
  await page.keyboard.press("Escape");
  const sk = await page.evaluate(() => (window as unknown as { __hbt_su_kien?: { su_kien: string; kind?: string; lech?: number }[] }).__hbt_su_kien ?? []);
  expect(sk.filter((s) => s.kind === "dinh_gio").at(-1)?.lech).toBe(-1);
});

test("miền Nam 1965 nhập 00:30 (đồng hồ UTC+8), 12 canh: cùng ngày đã nhập, Tý muộn theo giờ đồng hồ", async ({ page }) => {
  await napHoSo(page, { ...HO_SO_MAU, gio: "12:00", do_tin_gio: "unknown" });
  await mock(page, { muoiHai: DINH_GIO_NAM_65_00H30_12 });
  await page.goto("/tu-vi");
  await page.getByRole("button", { name: /Định giờ sinh/ }).click();
  const uv = page.getByTestId("ung-vien-gio");
  await expect(uv).toHaveCount(12);
  await expect(uv.nth(0)).toContainText("Giờ Tý muộn (00:00–00:59)");
  await expect(uv.nth(0)).not.toContainText("Giờ Tý muộn (23:00–23:59)");
  await expect(uv.nth(0).getByTestId("khoang-gio")).toHaveText("00:00–00:59");
  await expect(uv.nth(0).getByTestId("ghi-chu-ung-vien")).toContainText("23:30 ngày 19/07/1965");
  await expect(page.getByTestId("ngay-ung-vien")).toHaveCount(0);           // mọi ứng viên cùng ngày đã nhập
  await expect(uv.nth(0).getByTestId("khoang-gio-lich")).toContainText("UTC+8");
});

test("±1 canh qua nửa đêm: ứng viên khác ngày đã nhập thì ghi ngày", async ({ page }) => {
  await napHoSo(page);
  await mock(page, { ba: DINH_GIO_NAM_65_00H30 });
  await page.goto("/tu-vi");
  await page.getByRole("button", { name: /Định giờ sinh/ }).click();
  const uv = page.getByTestId("ung-vien-gio");
  await expect(uv).toHaveCount(3);
  await expect(uv.nth(0).getByTestId("ngay-ung-vien")).toHaveText("· ngày 19/07/1965");
  await expect(uv.nth(1).getByTestId("ngay-ung-vien")).toHaveCount(0);
  await expect(uv.nth(2).getByTestId("ngay-ung-vien")).toHaveCount(0);
});

test("sinh nước ngoài giờ mùa hè: dòng lệch giải thích giờ mùa hè, không nói UTC+7", async ({ page }) => {
  await napHoSo(page);
  await mock(page, { ba: DINH_GIO_MUA_HE });
  await page.goto("/tu-vi");
  await page.getByRole("button", { name: /Định giờ sinh/ }).click();
  const lich = page.getByTestId("ung-vien-gio").nth(1).getByTestId("khoang-gio-lich");
  await expect(lich).toContainText("theo giờ chuẩn địa phương: 05:00–06:59");
  await expect(lich).toContainText("giờ mùa hè");
  await expect(lich).not.toContainText("UTC+7");
});

// Engine THẬT qua proxy web: mọi output phải qua zod của web (proxy trả 502 nếu lệch schema).
test("engine thật: 4 route TV-V2 qua proxy web, các ca khó", async ({ request }) => {
  const binh = { birth_date: "1990-05-17", birth_time: "12:30", gender: "nam", noi_sinh: "ha-noi" };
  const tyMuon = { birth_date: "1992-11-03", birth_time: "23:30", gender: "nu", noi_sinh: "ha-noi" };
  const khongBiet = { birth_date: "1988-02-10", birth_time: "12:00", gender: "nu", noi_sinh: "ha-noi", do_tin_gio: "unknown" };
  const mienNam65 = { birth_date: "1965-07-20", birth_time: "06:10", gender: "nam", noi_sinh: "tp-ho-chi-minh" };
  const goi = async (duong: string, data: object) => {
    const r = await request.post(`/api/tuvi/${duong}`, { data });
    expect(r.status(), `${duong} ${JSON.stringify(data)}: ${await r.text()}`).toBe(200);
    return r.json();
  };
  for (const la_so of [binh, tyMuon, khongBiet, mienNam65]) {
    const ph = await goi("phi-hoa", { la_so, nam_xem: 2026 });
    expect(ph.duong_bay).toHaveLength(48);
    const nh = await goi("nhip-3-thang", { la_so, ngay_xem: "2027-01-20" });
    expect(nh.thang.map((t: { nam_am: number }) => t.nam_am)).toEqual([2026, 2027, 2027]);
    expect(nh.luu_nien_sau.can_chi).toBe("Đinh Mùi");
    const mot = await goi("hop-tham", { la_so, nguoi_kia: { birth_date: "1993-01-20" } });
    expect(mot.diem.tong).toBe(mot.diem.tieu_chi.reduce((s: number, t: { diem: number }) => s + t.diem, 0));
    const hai = await goi("hop-tham", { la_so, nguoi_kia: { birth_date: "1991-02-14", birth_time: "10:00", gender: "nu", noi_sinh: "ha-noi" } });
    expect(hai.diem.hai_chieu).toBe(true);
    expect(hai.khong_cham_diem).toBe(false);
    await goi("dinh-gio", { la_so });
  }
  // Người kia sinh 20/01/1993 (trước Tết Quý Dậu 23/01/1993) → năm âm Nhâm Thân, can Nhâm.
  expect((await goi("hop-tham", { la_so: binh, nguoi_kia: { birth_date: "1993-01-20" } })).can_nam_nguoi_kia).toBe("Nhâm");
  const dg12 = await goi("dinh-gio", { la_so: khongBiet, tat_ca_gio: true });
  expect(dg12.ung_vien).toHaveLength(12);
  expect(dg12.ly_do).toContain("khong_biet");
  // 23:30: giờ sau qua nửa đêm sang ngày hôm sau.
  const dgTy = await goi("dinh-gio", { la_so: tyMuon });
  expect(dgTy.ung_vien.map((u: { chi_gio: string }) => u.chi_gio)).toEqual(["Hợi", "Tý", "Sửu"]);
  expect(dgTy.ung_vien[2].dau_vao.birth_date).toBe("1992-11-04");
  // 23:30 + 12 canh: 12 canh của ngày đã nhập (Tý sớm 00:30) + ứng viên thứ 13 Tý muộn = đúng giờ nhập.
  type U = { nhan: string; chi_gio: string; gio_dai_dien: string; la_gio_nhap: boolean; khoang_gio: string;
    khoang_gio_dong_ho: string; lech_gio_lich: boolean; ghi_chu?: string; dau_vao: { birth_date: string } };
  const dgTy12: U[] = (await goi("dinh-gio", { la_so: tyMuon, tat_ca_gio: true })).ung_vien;
  expect(dgTy12).toHaveLength(13);
  expect(dgTy12[0]).toMatchObject({ chi_gio: "Tý", gio_dai_dien: "00:30", la_gio_nhap: false });
  expect(dgTy12[12]).toMatchObject({ nhan: "Giờ Tý muộn (23:00–23:59)", gio_dai_dien: "23:30", la_gio_nhap: true });
  expect(dgTy12[12]!.ghi_chu).toContain("ngày hôm sau");
  expect(dgTy12.filter((u) => u.la_gio_nhap)).toHaveLength(1);
  expect(new Set(dgTy12.map((u) => u.dau_vao.birth_date))).toEqual(new Set(["1992-11-03"]));
  // Miền Nam 1965 (đồng hồ UTC+8): khoảng giờ đồng hồ = giờ lịch + 1 giờ.
  const dg65: U[] = (await goi("dinh-gio", { la_so: mienNam65 })).ung_vien;
  expect(dg65[1]).toMatchObject({ la_gio_nhap: true, chi_gio: "Mão", khoang_gio: "05:00–06:59", khoang_gio_dong_ho: "06:00–07:59", lech_gio_lich: true });
  const dg65_12: U[] = (await goi("dinh-gio", { la_so: mienNam65, tat_ca_gio: true })).ung_vien;
  expect(dg65_12).toHaveLength(12);
  expect(dg65_12.find((u) => u.chi_gio === "Thìn")).toMatchObject({ gio_dai_dien: "09:00", khoang_gio_dong_ho: "08:00–09:59" });
  expect((await goi("dinh-gio", { la_so: binh })).ung_vien.every((u: U) => !u.lech_gio_lich && u.khoang_gio_dong_ho === u.khoang_gio)).toBe(true);
  // Miền Nam 1965 nhập 00:30 đồng hồ (= 23:30 hôm trước theo giờ lịch): 12 canh vẫn của ngày đã nhập.
  const dg65_0 = await goi("dinh-gio", { la_so: { ...mienNam65, birth_time: "00:30" }, tat_ca_gio: true });
  expect(dg65_0.ly_do_lech).toBe("mui_gio_lich_su");
  expect(dg65_0.ung_vien).toHaveLength(12);
  expect(new Set(dg65_0.ung_vien.map((u: U & { ngay_duong: string }) => u.ngay_duong))).toEqual(new Set(["1965-07-20"]));
  expect(dg65_0.ung_vien[0]).toMatchObject({ nhan: "Giờ Tý muộn (00:00–00:59)", gio_dai_dien: "00:30", la_gio_nhap: true });
  const muaHe = await goi("dinh-gio", { la_so: { ...binh, birth_time: "06:10", noi_sinh: "nuoc_ngoai", gio_mua_he: true } });
  expect(muaHe.ly_do_lech).toBe("gio_mua_he");
  expect((await goi("dinh-gio", { la_so: binh })).ly_do_lech).toBeNull();
});
