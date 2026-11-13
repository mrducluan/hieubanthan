// EN-ALL giai đoạn 1 — nền web đa ngôn ngữ (docs/PROMPT-EN-TOAN-BO.md mục 3.1): bảng đường dẫn Việt ↔ Anh một nguồn,
// định dạng theo ngôn ngữ, catalog chữ có chiều tiếng Anh, proxy (rewrite / 308), nút đổi ngôn ngữ về trang tương đương.
import { existsSync } from "node:fs";
import path from "node:path";
import { test, expect } from "@playwright/test";
import { CAP_DUONG, banAnh, banViet, banVietCuaTrang, capHreflang, dichRewrite, duongTheo, khongCoBanAnh, suaDuongLac, type CapDuong } from "../lib/duong-en";
import { dinhDanhSach, dinhGio, dinhKhoangNgay, dinhNgay, dinhTien, soNhieu, soThuTu } from "../lib/dinh-dang";
import { khoaThieuEn, taoChu, type BangChu } from "../lib/chu-trang";

const APP = path.join(__dirname, "..", "app");

test.describe("bảng đường dẫn", () => {
  test("mỗi đường dẫn Việt / Anh xuất hiện một lần, slug Anh đúng khuôn", () => {
    const vi = CAP_DUONG.map((c) => c.vi), en = CAP_DUONG.map((c) => c.en);
    expect(new Set(vi).size).toBe(vi.length);
    expect(new Set(en).size).toBe(en.length);
    for (const c of CAP_DUONG) {
      expect(c.en, c.vi).toMatch(/^\/en(\/[a-z0-9]+(-[a-z0-9]+)*)*$/);
      expect(c.vi, c.vi).toMatch(/^\/([a-z0-9-]+(\/[a-z0-9-]+)*)?$/);
    }
  });

  test("slug mảng khớp bảng 4.1 chủ dự án duyệt (khoá sau giai đoạn 1)", () => {
    const m = Object.fromEntries(CAP_DUONG.map((c) => [c.vi, c.en]));
    expect(m).toMatchObject({
      "/than-so": "/en/numerology", "/tu-vi": "/en/zi-wei-dou-shu", "/bat-tu": "/en/bazi", "/phong-thuy": "/en/feng-shui",
      "/kinh-dich": "/en/i-ching", "/tarot": "/en/tarot", "/nhan-tuong": "/en/face-reading", "/hop-doi": "/en/compatibility",
      "/huyen-hoc": "/en/chinese-metaphysics", "/hom-nay": "/en/today", "/ban-than": "/en/me", "/thoi-gian-toi": "/en/year-ahead",
      "/chan-dung": "/en/portrait", "/xem-ngay-tot": "/en/auspicious-dates", "/lich-am": "/en/lunar-calendar",
      "/doi-lich-am-duong": "/en/lunar-converter", "/nam": "/en/year", "/sinh-o-nuoc-ngoai": "/en/born-abroad",
      "/tuoi-xong-dat": "/en/vietnamese-customs/first-footer",
    });
  });

  test("trang Việt gốc của mỗi mục có thật; mục `rieng` có trang dưới app/en; mục chưa mở không có `rieng`", () => {
    for (const c of CAP_DUONG) {
      const dau = c.vi === "/" ? "" : c.vi.split("/")[1]!;
      expect(existsSync(path.join(APP, dau)), `app/${dau} (${c.vi})`).toBe(true);
      if (c.rieng) {
        expect(c.mo, c.en).toBe(true);
        expect(existsSync(path.join(APP, c.en, "page.tsx")), `app${c.en}/page.tsx`).toBe(true);
      }
    }
  });

  test("7 URL tiếng Anh đã công bố giữ nguyên", () => {
    for (const u of ["/en", "/en/numerology", "/en/numerology/life-path", "/en/tarot", "/en/tarot/cards", "/en/privacy", "/en/terms"]) {
      expect(CAP_DUONG.find((c) => c.en === u)?.mo, u).toBe(true);
      expect(suaDuongLac(u), u).toBeNull();
      expect(dichRewrite(u), u).toBeNull();      // còn là trang riêng → không rewrite
    }
  });

  const THU: CapDuong[] = [
    { vi: "/", en: "/en", mo: true, rieng: true, la: true },
    { vi: "/bat-tu", en: "/en/bazi", mo: true },
    { vi: "/bat-tu/thap-than", en: "/en/bazi/ten-gods", mo: true },
    { vi: "/nam", en: "/en/year", mo: true },
    { vi: "/tu-vi", en: "/en/zi-wei-dou-shu", mo: false },
  ];

  test("đổi hai chiều: tiền tố dài nhất, đuôi đi nguyên, giữ query và neo, slug Anh thay đuôi", () => {
    expect(banAnh("/bat-tu", undefined, THU)).toBe("/en/bazi");
    expect(banAnh("/bat-tu/thap-than/chinh-quan", undefined, THU)).toBe("/en/bazi/ten-gods/chinh-quan");
    expect(banAnh("/bat-tu/thap-than/chinh-quan", "/direct-officer", THU)).toBe("/en/bazi/ten-gods/direct-officer");
    expect(banAnh("/nam/2027/sinh-con?x=1#a", undefined, THU)).toBe("/en/year/2027/sinh-con?x=1#a");
    expect(banAnh("/bat-tu/", undefined, THU)).toBe("/en/bazi");
    expect(banAnh("/tu-vi", undefined, THU)).toBeNull();          // chưa mở
    expect(banAnh("/bat-tu-khac", undefined, THU)).toBeNull();    // không khớp nửa đoạn
    expect(banAnh("/khong-co", undefined, THU)).toBeNull();
    expect(banViet("/en/bazi/ten-gods/x?cach=1", undefined, THU)).toBe("/bat-tu/thap-than/x?cach=1");
    expect(banViet("/en/zi-wei-dou-shu", undefined, THU)).toBe("/tu-vi");   // chưa mở vẫn biết đích Việt
    expect(banViet("/en", undefined, THU)).toBe("/");
    expect(banViet("/en/la", undefined, THU)).toBeNull();
  });

  test("proxy: rewrite trang đã mở không có trang riêng; 308 slug Việt gõ lạc; chưa mở thì không làm gì", () => {
    expect(dichRewrite("/en/bazi", THU)).toBe("/bat-tu");
    expect(dichRewrite("/en/bazi/ten-gods/direct-officer", THU)).toBe("/bat-tu/thap-than/direct-officer");
    expect(dichRewrite("/en/year/2027", THU)).toBe("/nam/2027");
    expect(dichRewrite("/en", THU)).toBeNull();                    // trang riêng
    expect(dichRewrite("/en/zi-wei-dou-shu", THU)).toBeNull();     // chưa mở → 404 tiếng Anh
    expect(suaDuongLac("/en/bat-tu", THU)).toBe("/en/bazi");
    expect(suaDuongLac("/en/bat-tu/thap-than?x=1", THU)).toBe("/en/bazi/ten-gods?x=1");
    expect(suaDuongLac("/en/tu-vi", THU)).toBeNull();
    expect(suaDuongLac("/en/bazi", THU)).toBeNull();
  });

  test("duongTheo: tiếng Việt giữ nguyên; tiếng Anh chỉ đổi trang đã mở; link ngoài / đã /en giữ nguyên", () => {
    expect(duongTheo("vi", "/than-so")).toBe("/than-so");
    expect(duongTheo("en", "/than-so")).toBe("/en/numerology");
    expect(duongTheo("en", "/tarot#la-ngay")).toBe("/en/tarot#la-ngay");
    expect(duongTheo("en", "/kinh-dich")).toBe("/kinh-dich");     // chưa mở → link sang bản Việt
    expect(duongTheo("en", "https://example.com/tu-vi")).toBe("https://example.com/tu-vi");
    expect(duongTheo("en", "/en/tarot")).toBe("/en/tarot");
    expect(duongTheo("en", "#neo")).toBe("#neo");
    expect(capHreflang("/than-so?x=1")).toEqual({ vi: "/than-so", en: "/en/numerology" });
    expect(capHreflang("/kinh-dich")).toBeNull();
    expect(khongCoBanAnh("/quan-tri/cai-dat")).toBe(true);
    expect(khongCoBanAnh("/tu-vi")).toBe(false);
    expect(banVietCuaTrang("/en/numerology/life-path/7")).toBe("/than-so/y-nghia-so/so-7");
    expect(banVietCuaTrang("/en/tarot/cards/the-fool")).toBe("/tarot/la-bai");
    expect(banVietCuaTrang("/en/khong-co")).toBe("/");
  });
});

test.describe("định dạng theo ngôn ngữ", () => {
  test("ngày, khoảng ngày, giờ", () => {
    expect(dinhNgay("2026-11-10", "en")).toBe("10 November 2026");
    expect(dinhNgay("2026-11-10", "en-us")).toBe("November 10, 2026");
    expect(dinhNgay("2026-11-10", "en", "day_du")).toBe("Tuesday, 10 November 2026");
    expect(dinhNgay({ nam: 2027, thang: 2, ngay: 6 }, "en", "ngan")).toBe("6 Feb 2027");
    expect(dinhNgay("2026-11-10", "vi")).toContain("2026");
    expect(dinhKhoangNgay("2027-02-04", "2027-03-05", "en")).toMatch(/^4 Feb\s*–\s*5 Mar 2027$/);
    expect(dinhGio("14:05", "en")).toBe("14:05");
    expect(dinhGio("14:05", "en-us").replace(/ /g, " ")).toBe("2:05 PM");
    expect(dinhGio("00:30", "en-us").replace(/ /g, " ")).toBe("12:30 AM");
  });
  test("số thứ tự, số nhiều, danh sách, tiền", () => {
    expect([1, 2, 3, 4, 11, 12, 13, 21, 22, 23, 101].map((n) => soThuTu(n, "en"))).toEqual(["1st", "2nd", "3rd", "4th", "11th", "12th", "13th", "21st", "22nd", "23rd", "101st"]);
    expect(soNhieu(1, "en", { one: "{n} card", other: "{n} cards" })).toBe("1 card");
    expect(soNhieu(3, "en", { one: "{n} card", other: "{n} cards" })).toBe("3 cards");
    expect(soNhieu(1, "vi", { other: "{n} lá" })).toBe("1 lá");
    expect(dinhDanhSach(["A", "B", "C"], "en")).toBe("A, B and C");
    expect(dinhDanhSach(["A", "B"], "en", "hoac")).toBe("A or B");
    expect(dinhTien(19000, "en").replace(/ /g, " ")).toMatch(/19,000/);
    expect(dinhTien(4.5, "en-us", "USD")).toBe("$4.50");
  });
});

test.describe("catalog chữ có chiều tiếng Anh", () => {
  const BANG: BangChu = {
    "dau.tieu_de": { nhan: "Tiêu đề", mac_dinh: "Xem *Bát tự*", en: "Read your *BaZi* chart" },
    "dau.chao": { nhan: "Chào", mac_dinh: "Chào {ten}", en: "Hi {ten}" },
    "dau.thieu": { nhan: "Chưa dịch", mac_dinh: "Chữ Việt" },
  };
  test("bản Anh đọc `en`, không bao giờ rơi về chữ Việt; bản Việt y như cũ", () => {
    const en = taoChu(BANG, null, "en"), vi = taoChu(BANG);
    expect(en("dau.tieu_de")).toBe("Read your *BaZi* chart");
    expect(en("dau.chao", { ten: "Emma" })).toBe("Hi Emma");
    expect(en("dau.thieu")).toBe("");
    expect(vi("dau.tieu_de")).toBe("Xem *Bát tự*");
    expect(vi("dau.thieu")).toBe("Chữ Việt");
    expect(khoaThieuEn(BANG)).toEqual(["dau.thieu"]);
  });
  test("chữ CMS tiếng Anh thay chữ mặc định tiếng Anh, vẫn bị lọc thẻ", () => {
    const en = taoChu(BANG, { "dau.tieu_de": "Your <b>BaZi</b> chart", "la": "x" }, "en");
    expect(en("dau.tieu_de")).toBe("Your BaZi chart");
  });
});

test.describe("trên trình duyệt", () => {
  test("thương hiệu bản Anh là Hieuban; nút đổi ngôn ngữ (đầu + chân trang) về trang tương đương", async ({ page }) => {
    const nut = async (href: string) => {
      const ds = page.getByTestId("doi-tieng-viet");
      await expect(ds).toHaveCount(2);                     // thanh trên + chân trang
      for (const n of await ds.all()) await expect(n).toHaveAttribute("href", href);
    };
    await page.goto("/en/numerology");
    await expect(page.getByRole("banner")).toContainText("Hieuban");
    await expect(page.locator("body")).not.toContainText("Hieu Ban Than");
    await nut("/than-so");
    await page.goto("/en/numerology/life-path/7");
    await nut("/than-so/y-nghia-so/so-7");
    await page.goto("/en/tarot/cards/the-fool");
    await nut("/tarot/la-bai/chang-kho");   // lấy từ hreflang của trang
    await page.goto("/en");
    await nut("/");
  });

  test("URL Anh của trang CHƯA mở: 404 tiếng Anh, không rewrite sang chữ Việt, không chuyển hướng", async ({ page }) => {
    for (const u of ["/en/feng-shui/annual-afflictions", "/en/i-ching", "/en/kinh-dich"]) {
      const r = await page.goto(u);
      expect(r!.status(), u).toBe(404);
      expect(new URL(page.url()).pathname, u).toBe(u);
      await expect(page.locator("html")).toHaveAttribute("lang", /^en/);
    }
  });
});
