// TV-V2 (docs/NANG-CAP-TUVI-V2.md): 4 khối nâng cao trên /tu-vi — Đường bay tứ hoá, 3 tháng tới, Định giờ sinh,
// Hợp tham. Lá số thật từ engine; 4 route mới mock theo hợp đồng §3 (engine làm song song) để test tách khỏi engine.
import { test, expect, type Page, type Request } from "@playwright/test";
import { HO_SO_MAU, napHoSo } from "./_hoso";

const DUONG = { tu_cung: "Mệnh", can: "Giáp", hoa: "Kỵ", sao: "Thái Dương", den_cung: "Tài Bạch", xung_cung: "Phúc Đức",
  tu_hoa: false, den_tuan_triet: [], nghia: "Nghĩa đường bay." };
const TEN_CUNG = ["Mệnh", "Phụ Mẫu", "Phúc Đức", "Điền Trạch", "Quan Lộc", "Nô Bộc", "Thiên Di", "Tật Ách", "Tài Bạch", "Tử Tức", "Phu Thê", "Huynh Đệ"];
const CHI = ["Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi", "Tý", "Sửu"];

const PHI_HOA = {
  engine_version: "test", can_nam_sinh: "Canh",
  lai_nhan: { cung: "Quan Lộc", chi: "Ngọ", can: "Nhâm" },
  cung: TEN_CUNG.map((ten, i) => ({ ten, chi: CHI[i], can: "Giáp", la_menh: i === 0, la_lai_nhan: i === 4 })),
  duong_bay: TEN_CUNG.flatMap((tu_cung) => ["Lộc", "Quyền", "Khoa", "Kỵ"].map((hoa) => ({ ...DUONG, tu_cung, hoa, tu_hoa: tu_cung === "Tài Bạch" }))),
  tu_hoa: [], vao_menh: [],
  noi_bat: [
    { loai: "ky_xung", duong: DUONG, tieu_de: "Kỵ từ Mệnh vào Tài Bạch", nghia: "Bạn để tâm nhiều tới chuyện tiền.",
      viec_nen_lam: "Ghi chép chi tiêu theo tuần.", cau_tu_soi: "Mình lo về tiền vì điều gì?", ghi_chu_tuan_triet: null },
    { loai: "loc_nhap", duong: { ...DUONG, hoa: "Lộc", den_cung: "Mệnh" }, tieu_de: "Lộc vào Mệnh", nghia: "Dễ được giúp.",
      viec_nen_lam: "Nhận lời giúp.", cau_tu_soi: "Mình có hay từ chối không?", ghi_chu_tuan_triet: null },
  ],
  luu_nien: { nam: 2026, can_chi: "Bính Ngọ", hoa: [{ hoa: "Lộc", sao: "Thiên Đồng", den_cung: "Quan Lộc", xung_cung: "Phu Thê" }] },
  phai: { ten: "Phi tinh tứ hoá", ghi_chu: "Một trường phái." }, luu_y: ["Tham khảo văn hoá."], trang_thai: "nhap_ai",
};

const thang = (n: number, muc: "thuan" | "binh" | "can_than", nhan: string) => ({
  thang: n, nhuan: false, phan: "ca_thang", can_chi: "Mậu Tuất", tu: `2026-${String(n).padStart(2, "0")}-01`, den: `2026-${String(n).padStart(2, "0")}-28`,
  cung_goc: "Quan Lộc", chu_de: "Công việc.", muc, nhan_muc: nhan,
  ly_do: [{ ma: "song_loc", noi_dung: `Lý do tháng ${n}.` }], tu_hoa_thang: [{ hoa: "Lộc", sao: "Tham Lang", cung_goc: "Mệnh" }],
  goi_y: `Gợi ý tháng ${n}.`, cau_tu_soi: `Tự soi tháng ${n}?`,
});
const NHIP = {
  engine_version: "test", ngay_xem: "2026-10-19", phai_luu_nguyet: "dau_quan_thai_tue",
  luu_nien: { nam_am: 2026, can_chi: "Bính Ngọ", tu_hoa: [{ hoa: "Lộc", sao: "Thiên Đồng", cung_goc: "Quan Lộc" }] },
  thang: [thang(9, "thuan", "Thuận"), thang(10, "binh", "Bình"), thang(11, "can_than", "Cần thận trọng")],
  uu_tien: "Đại hạn > lưu niên > tiểu hạn > lưu nguyệt.", luu_y: "Tham khảo.",
};

const ungVien = (nhan: string, chi_gio: string, la_gio_nhap: boolean) => ({
  nhan, chi_gio, khoang_gio: "11:00–12:59", gio_dai_dien: "12:00", la_gio_nhap,
  cung_menh: { chi: "Dần", chinh_tinh: ["Cự Môn"] }, cuc: "Thổ ngũ cục", than_cu: "Quan Lộc",
  nam: [{ nam: 2023, can_chi: "Quý Mão", cau_hoi: [{ hoa: "Kỵ", cung: "Tài Bạch", noi_dung: `Năm 2023 bạn có phải xem lại chuyện tiền (${chi_gio})?` }] }],
});
const DINH_GIO = {
  engine_version: "test", ly_do: ["gan_ranh_gio"],
  ung_vien: [ungVien("Giờ trước", "Tỵ", false), ungVien("Giờ đã nhập", "Ngọ", true), ungVien("Giờ sau", "Mùi", false)],
  khac_nhau: ["Ba giờ khác nhau ở cung Mệnh."], luu_y: ["Bạn tự chọn, hệ thống không tự đổi."],
};

const HOA4 = ["Lộc", "Quyền", "Khoa", "Kỵ"].map((hoa) => ({ hoa, sao: "Thái Âm", den_cung: "Phu Thê", xung_cung: "Quan Lộc", nghia: `Nghĩa hoá ${hoa}.` }));
const HOP_THAM = {
  engine_version: "test", quan_he: "ban_be", nhan_quan_he: "Bạn bè", can_nam_nguoi_kia: "Ất",
  nguoi_kia_vao_ban: HOA4, ban_vao_nguoi_kia: null, menh_nguoi_kia_vao_ban: null,
  tom_tat: ["Hai bạn chạm nhau ở cung Phu Thê."], luu_y: ["Không lưu dữ liệu người ấy."], khong_cham_diem: true,
};

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
    await page.route(`**/api/tuvi/${k}`, (r) => { goi[k]!.push(r.request()); return r.fulfill({ json: k === "phi-hoa" ? phiHoa() : json[k] }); });
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
  await expect(ph).toContainText("Kỵ từ Mệnh vào Tài Bạch");
  await expect(ph).toContainText("Nên làm: Ghi chép chi tiêu theo tuần.");
  await expect(ph).toContainText("Tự soi: Mình lo về tiền vì điều gì?");
  await page.getByTestId("phi-hoa-bang").locator("summary").click();
  await expect(page.getByTestId("phi-hoa-bang")).toContainText("tự hoá");
  await ph.getByRole("button", { name: "Xem cung trên lá số" }).first().click();
  await expect(page.getByRole("heading", { name: /Cung Tài Bạch/ })).toBeVisible();
  // next dev (StrictMode) có thể gọi effect hai lần → đếm ≥ 1, xét yêu cầu cuối.
  expect(goi["phi-hoa"]!.length).toBeGreaterThanOrEqual(1);
  expect(goi["phi-hoa"]!.at(-1)!.postDataJSON()).toMatchObject({ la_so: { birth_time: "12:30" }, nam_xem: expect.any(Number) });

  // 3 tháng tới
  await page.getByRole("button", { name: /3 tháng tới/ }).click();
  const the = page.getByTestId("the-thang");
  await expect(the).toHaveCount(3);
  await expect(the.nth(0)).toContainText("Thuận");
  await expect(the.nth(2)).toContainText("Cần thận trọng");
  await expect(the.nth(2)).toContainText("Tự soi tháng 11?");

  // Định giờ sinh: tick + "Dùng giờ này" chỉ mở form hồ sơ, ghi lech
  await page.getByRole("button", { name: /Định giờ sinh/ }).click();
  const uv = page.getByTestId("ung-vien-gio");
  await expect(uv).toHaveCount(3);
  await expect(page.getByTestId("dinh-gio-noi-dung")).toContainText("sát ranh giới");
  await uv.nth(0).getByRole("checkbox").check();
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
  await expect(kq).toContainText("Nghĩa hoá Kỵ.");
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
