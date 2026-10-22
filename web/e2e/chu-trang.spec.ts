// ND-7 — "Chữ trên trang": bảng chữ hợp lệ (khoá, giới hạn, chữ mặc định có trên trang), CMS sửa → trang đổi, lọc chữ
// CMS (khoá lạ, HTML, quá dài), dấu nhấn *…* và biến {x}. Không cần CMS thật: gộp + đọc bằng hàm thuần.
import { test, expect } from "@playwright/test";
import { boNhan, locChu, tachNhan, taoChu, TOI_DA_CHU, type BangChu } from "../lib/chu-trang";
import { gopNoiDung } from "../lib/noi-dung-trang";
import { MAU_CUM, SO_TRANG } from "../lib/so-trang";
import { CHU_TRANG_CHU } from "../lib/chu/trang-chu";

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
