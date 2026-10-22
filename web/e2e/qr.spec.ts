// TCS-1 — bộ mã hoá QR tự viết (lib/qr.ts) so TỪNG Ô với golden sinh bằng hai bộ mã hoá độc lập
// (qrcodegen của Project Nayuki — kể cả mặt nạ tự chọn; thư viện Python qrcode — ép cùng mặt nạ).
// Thuần hàm, không mở trình duyệt. Sinh lại golden: web/scripts/qr-golden/ (venv tạm, không phải dependency).
import { readFileSync } from "node:fs";
import path from "node:path";
import { test, expect } from "@playwright/test";
import { dungLuongByte, duongQr, maHoaQr } from "../lib/qr";
import { urlQr } from "../lib/the-chia-se";

interface Ca { chuoi: string; phien_ban: number; mask: number; hang: string[] }
const G = JSON.parse(readFileSync(path.join(__dirname, "fixtures", "qr-golden.json"), "utf8")) as { ca: Ca[]; ca_qrcode: Ca[] };
const hang = (o: boolean[][]) => o.map((h) => h.map((c) => (c ? "1" : "0")).join(""));

test("golden đủ ca: ≥ 30 chuỗi, phủ phiên bản 1–10, có UTF-8 nhiều byte", () => {
  expect(G.ca.length).toBeGreaterThanOrEqual(30);
  expect(new Set(G.ca.map((c) => c.phien_ban))).toEqual(new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]));
  expect(G.ca.some((c) => /[^\x00-\x7f]/.test(c.chuoi))).toBe(true);
});

test("khớp qrcodegen từng ô: phiên bản, mặt nạ tự chọn, ma trận", () => {
  for (const c of G.ca) {
    const q = maHoaQr(c.chuoi);
    expect(q.phienBan, c.chuoi).toBe(c.phien_ban);
    expect(q.mask, c.chuoi).toBe(c.mask);
    expect(hang(q.o), c.chuoi).toEqual(c.hang);
  }
});

test("khớp thư viện qrcode từng ô khi ép cùng mặt nạ", () => {
  for (const c of G.ca_qrcode) {
    const q = maHoaQr(c.chuoi, { mask: c.mask });
    expect(q.phienBan, c.chuoi).toBe(c.phien_ban);
    expect(hang(q.o), c.chuoi).toEqual(c.hang);
  }
});

test("dung lượng mức M chế độ byte đúng bảng chuẩn; quá phiên bản 10 thì báo lỗi", () => {
  expect([1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(dungLuongByte)).toEqual([14, 26, 42, 62, 84, 106, 122, 152, 180, 213]);
  expect(() => maHoaQr("x".repeat(214))).toThrow(RangeError);
  expect(maHoaQr("x".repeat(213)).phienBan).toBe(10);
});

test("đường SVG: mỗi ô tối đúng một lần, có vùng yên tĩnh 4 ô", () => {
  const q = maHoaQr("https://hieuban.com/tu-vi?tu=ta.0123456789");
  const d = duongQr(q, 4);
  const dem = [...d.matchAll(/M(\d+) (\d+)h(\d+)/g)].reduce((s, m) => s + Number(m[3]), 0);
  expect(dem).toBe(q.o.flat().filter(Boolean).length);
  expect(Math.min(...[...d.matchAll(/M(\d+) (\d+)/g)].flatMap((m) => [Number(m[1]), Number(m[2])]))).toBe(4);
});

test("urlQr: URL thẻ vừa phiên bản 8 thì giữ, dài hơn thì dùng URL dự phòng", () => {
  const ngan = "https://hieuban.com/the/hai/abc.def?tu=hp.0123456789";
  expect(urlQr(ngan, "https://hieuban.com/")).toBe(ngan);
  expect(urlQr(`https://hieuban.com/the/${"A".repeat(200)}`, "https://hieuban.com/")).toBe("https://hieuban.com/");
});
