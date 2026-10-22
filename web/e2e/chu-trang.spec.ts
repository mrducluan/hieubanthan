// ND-7 — "Chữ trên trang": bảng chữ hợp lệ (khoá, giới hạn, chữ mặc định có trên trang), CMS sửa → trang đổi, lọc chữ
// CMS (khoá lạ, HTML, quá dài), dấu nhấn *…* và biến {x}. Không cần CMS thật: gộp + đọc bằng hàm thuần.
import { test, expect } from "@playwright/test";
import { boNhan, locChu, tachNhan, taoChu, TOI_DA_CHU, type BangChu } from "../lib/chu-trang";
import { apDungAnhChiaSe, gopNoiDung } from "../lib/noi-dung-trang";
import { khopMauCum, MAU_CUM, SO_TRANG, viDuMau } from "../lib/so-trang";
import { CHU_TRANG_CHU } from "../lib/chu/trang-chu";
import { CHU_CHUNG } from "../lib/chu/chung";

const BANG: [string, BangChu][] = [
  ...SO_TRANG.filter((t) => t.mac_dinh.chu).map((t): [string, BangChu] => [t.duong, t.mac_dinh.chu!]),
  ...MAU_CUM.filter((m) => m.chu).map((m): [string, BangChu] => [m.mau_duong, m.chu!]),
];

test("bảng chữ: khoá đúng dạng, có nhãn, chữ mặc định không rỗng và không vượt giới hạn", () => {
  expect(BANG.length).toBeGreaterThanOrEqual(18);
  for (const [duong, bang] of BANG) for (const [k, m] of Object.entries(bang)) {
    expect(k, `${duong} ${k}`).toMatch(/^[a-z0-9_]+(\.[a-z0-9_]+)+$/);
    expect(m.nhan.length, `${duong} ${k}`).toBeGreaterThan(1);
    expect(m.mac_dinh.trim().length, `${duong} ${k}`).toBeGreaterThan(0);
    expect(m.mac_dinh.length, `${duong} ${k}`).toBeLessThanOrEqual(m.toi_da ?? TOI_DA_CHU);
  }
});

test("lọc chữ CMS: khoá lạ, không phải chuỗi, HTML, quá dài, trùng mặc định đều bị bỏ / cắt", () => {
  const ra = locChu(CHU_TRANG_CHU, { "dau.chip_1": "<script>x</script>Nhanh   gọn", "dau.chip_2": "Nói thật cả điểm mù", "khoa.la": "x",
    "dau.chip_3": 5, "so_sanh.nut": "x".repeat(100) });
  expect(ra).toEqual({ "dau.chip_1": "xNhanh gọn", "so_sanh.nut": "x".repeat(40) });
  expect(locChu(CHU_TRANG_CHU, ["a"])).toEqual({});
  const c = taoChu(CHU_TRANG_CHU, { "dau.chip_1": "Một phút", "khoa.la": "x" });
  expect(c("dau.chip_1")).toBe("Một phút");
  expect(c("dau.chip_2")).toBe("Nói thật cả điểm mù");
});

test("dấu nhấn *…* và biến {x}", () => {
  expect(tachNhan("Bạn là *số mấy?*")).toEqual([{ chu: "Bạn là ", nhan: false }, { chu: "số mấy?", nhan: true }]);
  expect(tachNhan("a * b")).toEqual([{ chu: "a * b", nhan: false }]);
  expect(boNhan("*Số 2* Nói")).toBe("Số 2 Nói");
  const c = taoChu({ "x.y": { nhan: "n", mac_dinh: "Ngày {ngay} — {la}" } });
  expect(c("x.y", { ngay: "21/10/2026" })).toBe("Ngày 21/10/2026 — {la}");
});

test("gộp: chữ của URL thắng chữ của mẫu cụm; chuỗi rỗng / không phải chuỗi bị bỏ", () => {
  const nd = gopNoiDung("/xem-ngay-tot/2026-10-21", {}, { chu: { "dau.tieu_de": "Riêng ngày này", "a.b": "  " } },
    { chu: { "dau.tieu_de": "Của cụm", "dau.nhan_tren": "Lịch cụm", "c.d": 3 } as never });
  expect(nd.chu).toEqual({ "dau.tieu_de": "Riêng ngày này", "dau.nhan_tren": "Lịch cụm" });
});

test("trang chủ hiện đúng chữ mặc định của bảng (CMS chưa nối)", async ({ page }) => {
  await page.goto("/");
  const html = await page.content();
  for (const k of ["dau.nhan_tren", "dau.chip_1", "dau.chip_2", "dau.chip_3", "so_sanh.lon", "so_sanh.cot_ai", "so_sanh.hang_3_hbt", "mang.lon", "mang.tu_vi_mo", "rieng_tu.dam"]) {
    expect(html, k).toContain(boNhan((CHU_TRANG_CHU as BangChu)[k]!.mac_dinh));
  }
  await expect(page.getByTestId("diem-mu-luot")).toContainText("Nói “có” khi trong lòng muốn nói “không”.");
});

// ---------------------------------------------------------------- ND-7 đợt 2
test("chữ dùng chung + bảng hình: khoá đúng dạng, có nhãn/gợi ý; mọi cụm (trừ hồ sơ chuyên gia) có ảnh chia sẻ", () => {
  for (const [k, m] of Object.entries(CHU_CHUNG as BangChu)) {
    expect(k).toMatch(/^[a-z0-9_]+(\.[a-z0-9_]+)+$/);
    expect(m.mac_dinh.length, k).toBeLessThanOrEqual(m.toi_da ?? TOI_DA_CHU);
  }
  const hinh = [...SO_TRANG.flatMap((t) => Object.entries(t.mac_dinh.hinh ?? {})), ...MAU_CUM.flatMap((m) => Object.entries(m.hinh ?? {}))];
  expect(hinh.length).toBeGreaterThan(20);
  for (const [k, m] of hinh) { expect(k).toMatch(/^[a-z0-9_]+(\.[a-z0-9_]+)*$/); expect(m.goi_y.length, k).toBeGreaterThan(3); expect(m.mac_dinh.length, k).toBeGreaterThan(3); }
  for (const m of MAU_CUM) expect(Boolean(m.hinh?.chia_se), m.mau_duong).toBe(m.mau_duong !== "/tac-gia/{slug}");
});

test("hình CMS: chỉ nhận url http(s) hoặc trong site; URL thắng cụm; ảnh chia sẻ thay /og trong metadata", () => {
  const a = { url: "https://cdn.vidu.vn/a.webp", alt: "A", sizes: { og: { url: "https://cdn.vidu.vn/a-og.webp", width: 1200, height: 630 } } };
  const nd = gopNoiDung("/tu-vi/sao-o-cung/tu-vi-cung-menh", {}, { hinh: { chia_se: a, xau: { url: "javascript:alert(1)" }, rong: null } },
    { hinh: { chia_se: { url: "/cu.webp", alt: "cũ" }, khac: { url: "//evil.vn/x.png" } } });
  expect(Object.keys(nd.hinh)).toEqual(["chia_se"]);
  expect(nd.hinh.chia_se!.url).toBe(a.url);
  const m = apDungAnhChiaSe({ openGraph: { images: ["/og?tieu_de=x"] }, twitter: { card: "summary_large_image" } }, nd);
  expect(JSON.stringify(m.openGraph)).toContain("a-og.webp");
  expect(JSON.stringify(m.twitter)).toContain("a-og.webp");
  const goc = { openGraph: { images: ["/og?tieu_de=x"] } };
  expect(apDungAnhChiaSe(goc, gopNoiDung("/x", {}, null, null))).toBe(goc);
});

test("xem trước: mỗi mẫu cụm có trang ví dụ thật (khớp đúng cụm); route từ chối mã sai / URL lạ", async ({ request }) => {
  const nay = new Date("2026-10-22T03:00:00Z");
  for (const m of MAU_CUM) {
    const vd = viDuMau(m, nay);
    expect(vd, m.mau_duong).not.toContain("{");
    expect(khopMauCum(vd)?.mau.mau_duong, vd).toBe(m.mau_duong);
  }
  expect(viDuMau(MAU_CUM.find((m) => m.mau_duong === "/xem-ngay-tot/{ngay}")!, nay)).toBe("/xem-ngay-tot/2026-10-22");
  for (const q of ["duong=%2Ftu-vi&ma=sai", "duong=%2F%2Fevil.vn&ma=x", "duong=https%3A%2F%2Fevil.vn&ma=x", "slug=bai&ma=x"]) {
    expect((await request.get(`/api/cms/xem-truoc?${q}`, { maxRedirects: 0 })).status(), q).toBe(401);
  }
  const r = await request.get("/api/cms/thoat-xem-truoc?duong=%2F%2Fevil.vn", { maxRedirects: 0 });
  expect(r.headers().location ?? "").not.toContain("evil.vn");
});
