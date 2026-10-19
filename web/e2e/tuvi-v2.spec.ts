// TV-V2 (docs/NANG-CAP-TUVI-V2.md): 4 khối nâng cao trên /tu-vi — Đường bay tứ hoá, 3 tháng tới, Định giờ sinh,
// Hợp tham. Lá số thật từ engine; 4 route mới trả OUTPUT THẬT của engine đã ghi sẵn (e2e/fixtures/tuvi-v2.json, cùng
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
const NHAN_MUC: Record<string, string> = { thuan: "Thuận", binh: "Bình", can_than: "Cần thận trọng" };

async function mock(page: Page) {
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
      const body = k === "phi-hoa" ? phiHoa() : k === "dinh-gio" && r.request().postDataJSON()?.tat_ca_gio ? DINH_GIO_12 : json[k];
      return r.fulfill({ json: body });
    });
  }
  return goi;
}

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
  // Ba tháng vắt sang năm âm sau: hiện cả tứ hoá năm mới + thứ tự ưu tiên (uu_tien là object của engine).
  const nhip = page.getByTestId("nhip-3-thang-noi-dung");
  await expect(nhip).toContainText(NHIP.luu_nien_sau!.can_chi);
  await expect(page.getByTestId("nhip-3-thang-uu-tien")).toContainText(NHIP.uu_tien.ghi_chu);
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

  // Hợp tham
  await page.getByRole("button", { name: /Hợp tham hai lá số/ }).click();
  const form = page.getByTestId("hop-tham-form");
  await expect(form).toContainText("không chấm điểm hợp hay khắc");
  await expect(form).toContainText("có giờ, giới tính và nơi sinh thì xem được hai chiều");
  await expect(form).toContainText("không lưu lại");
  await expect(form.locator("[data-testid^=hop-tham-quan-he-]")).toHaveCount(8);
  await form.getByTestId("hop-tham-quan-he-ban_be").click();
  await form.getByLabel("Ngày sinh người ấy").fill("3");
  await form.getByLabel("Tháng sinh người ấy").fill("4");
  await form.getByLabel("Năm sinh người ấy").fill("1995");
  await form.getByRole("button", { name: "Xem hai lá số" }).click();
  const kq = page.getByTestId("hop-tham-ket-qua");
  await expect(kq).toContainText("Không có điểm hợp/khắc");
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
    await goi("hop-tham", { la_so, nguoi_kia: { birth_date: "1993-01-20" } });
    await goi("hop-tham", { la_so, nguoi_kia: { birth_date: "1991-02-14", birth_time: "10:00", gender: "nu", noi_sinh: "ha-noi" } });
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
});
