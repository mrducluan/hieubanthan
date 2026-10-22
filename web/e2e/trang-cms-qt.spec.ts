// ND-6 — thẻ quản trị "Trang có nội dung CMS": phần thuần (tóm tắt phần đã sửa, chia số Search Console trước/sau ngày sửa,
// bộ lọc trang cho Search Console, cộng lượt bấm theo mẫu cụm). Trang /quan-tri cần tài khoản → không dựng được ở đây.
import { test, expect } from "@playwright/test";
import { bamTheoDong, chiaTruocSau, locGsc, tomTatSua } from "@/lib/trang-cms-qt";

test("tomTatSua: ô trống = không tính; đếm khối, chữ, hình", () => {
  expect(tomTatSua({})).toEqual([]);
  expect(tomTatSua({ h1: "  ", doan: [{ chu: "" }], muc: [{ noi_dung_html: null }], chu: {}, hinh: null, khoi_tren: [] })).toEqual([]);
  expect(tomTatSua({
    tieu_de_seo: "Tiêu đề", loi_dan: "Lời dẫn", hoi_dap: [{ cau_hoi: "a", tra_loi: "b" }], muc: [{ noi_dung_html: "<p>x</p>" }],
    khoi_tren: [{ blockType: "van_ban" }], khoi_cuoi: [{ blockType: "anh" }, { blockType: "keu_goi" }],
    chu: { "hero.chip_1": "x", "hero.chip_2": "y" }, hinh: { "hero.hinh": { id: 1 } },
  })).toEqual(["SEO", "Đầu trang", "Giới thiệu", "Mục", "3 khối", "2 chữ", "1 hình"]);
});

test("chiaTruocSau: 28 ngày trước ngày sửa ↔ từ ngày sửa, kỳ sau cắt theo ngày chốt", () => {
  const d = (ngay: string, clicks: number, impressions: number) => ({ keys: [ngay], clicks, impressions });
  const dong = [
    d("2026-09-01", 99, 99),                        // trước kỳ so sánh → bỏ
    d("2026-09-02", 1, 10), d("2026-09-29", 2, 20), // hai mép kỳ trước (29/9 = ngày cuối trước ngày sửa)
    d("2026-09-30", 4, 40), d("2026-10-05", 6, 60), // kỳ sau (từ ngày sửa)
  ];
  const kq = chiaTruocSau(dong, "2026-09-30T08:15:00.000Z", "2026-10-05");
  expect(kq.truoc).toEqual({ nhap: 3, hien: 30, ngay: 28 });
  expect(kq.sau).toEqual({ nhap: 10, hien: 100, ngay: 6 });
  // sửa sau ngày chốt (số Google trễ 2 ngày) → kỳ sau 0 ngày
  expect(chiaTruocSau(dong, "2026-10-10T00:00:00Z", "2026-10-05").sau).toEqual({ nhap: 0, hien: 0, ngay: 0 });
  // kỳ sau tối đa 28 ngày
  expect(chiaTruocSau([], "2026-01-01T00:00:00Z", "2026-10-05").sau.ngay).toBe(28);
});

test("locGsc: URL cụ thể = equals trên hieuban.com; mẫu cụm = regex khớp đúng các URL của cụm", () => {
  expect(locGsc({ loai: "trang", duong: "/tu-vi" })).toEqual({ dimension: "page", operator: "equals", expression: "https://hieuban.com/tu-vi" });
  const l = locGsc({ loai: "mau", duong: "/xem-ngay-tot/{ngay}" });
  expect(l.operator).toBe("includingRegex");
  const re = new RegExp(l.expression);
  expect(re.test("https://hieuban.com/xem-ngay-tot/2026-10-22")).toBe(true);
  expect(re.test("https://hieuban.com/xem-ngay-tot/thang-10-2026")).toBe(false);
  expect(re.test("https://hieubanXcom/xem-ngay-tot/2026-10-22")).toBe(false);
  expect(re.test("https://hieuban.com/xem-ngay-tot/2026-10-22/them")).toBe(false);
});

test("bamTheoDong: trang lấy đúng URL, mẫu cụm cộng mọi URL khớp", () => {
  const bam = new Map([["/tu-vi", 3], ["/kinh-dich/que/can-vi-thien", 2], ["/kinh-dich/que/khon-vi-dia", 5], ["/kinh-dich", 7]]);
  expect(bamTheoDong({ loai: "trang", duong: "/tu-vi" }, bam)).toBe(3);
  expect(bamTheoDong({ loai: "trang", duong: "/bat-tu" }, bam)).toBe(0);
  expect(bamTheoDong({ loai: "mau", duong: "/kinh-dich/que/{slug}" }, bam)).toBe(7);
});
