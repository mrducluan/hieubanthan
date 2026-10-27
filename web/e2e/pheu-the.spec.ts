// Phễu lời mời theo loại thẻ (/quan-tri/tang-truong) — hàm thuần tinhPheuThe, không cần trình duyệt.
import { test, expect } from "@playwright/test";
import { chuanCoMa, tinhPheuThe } from "../lib/pheu-the";

test("chuanCoMa: true/1 → có, false/0 → không, thiếu → không rõ", () => {
  expect(chuanCoMa("true")).toBe("co");
  expect(chuanCoMa("1")).toBe("co");
  expect(chuanCoMa("false")).toBe("khong");
  expect(chuanCoMa("0")).toBe("khong");
  expect(chuanCoMa("")).toBe("khong_ro");
  expect(chuanCoMa(null)).toBe("khong_ro");
});

test("tinhPheuThe: nối bước bằng mã link, loại gốc = lần chia sẻ sớm nhất, tỉ lệ so với bước trước", () => {
  const kq = tinhPheuThe({
    chiaSe: [
      { ma: "hp.aaaaaaaaaa", kind: "hai_nguoi", co_ma: "true", luot: 1, dau: "2026-10-20T10:00:00Z" },
      // Tải ảnh cùng link → cộng lượt chia sẻ cho "ảnh" nhưng bước sau vẫn tính cho loại gốc.
      { ma: "hp.aaaaaaaaaa", kind: "hai_nguoi_anh", co_ma: "", luot: 2, dau: "2026-10-20T10:05:00Z" },
      { ma: "hp.bbbbbbbbbb", kind: "hai_nguoi", co_ma: "false", luot: 1, dau: "2026-10-21T10:00:00Z" },
      { ma: "hn.cccccccccc", kind: "the_ngay", co_ma: "", luot: 4, dau: "2026-10-19T08:00:00Z" },
      { ma: "", kind: "the_ngay", co_ma: "", luot: 1, dau: "2026-10-19T09:00:00Z" },
    ],
    mo: [{ ma: "hp.aaaaaaaaaa", nguoi: 4 }, { ma: "hn.cccccccccc", nguoi: 2 }, { ma: "hp.zzzzzzzzzz", nguoi: 3 }],
    dangKy: [{ ma: "hp.aaaaaaaaaa", nguoi: 2, nhan_sao: 1 }, { ma: "th12345678", nguoi: 1, nhan_sao: 0 }],
    moiBan: [{ kind: "hai_nguoi", co_ma: "true", nguoi: 1 }],
  });
  const tim = (kind: string, co_ma: string) => kq.dong.find((d) => d.kind === kind && d.co_ma === co_ma)!;

  const co = tim("hai_nguoi", "co");
  expect(co).toMatchObject({ ten: "Điểm hai người", chia_se: 1, mo: 4, dang_ky: 2, nhan_sao: 1, moi_ban: 1 });
  expect(co.ti_le.mo).toBe(1);              // kẹp ≤ 100%
  expect(co.ti_le.dang_ky).toBe(0.5);
  expect(co.ti_le.nhan_sao).toBe(0.5);

  const anh = tim("hai_nguoi_anh", "khong_ro");
  expect(anh).toMatchObject({ chia_se: 2, mo: 0, dang_ky: 0 });
  expect(anh.ti_le.dang_ky).toBeNull();     // bước trước = 0 → không có tỉ lệ

  expect(tim("hai_nguoi", "khong")).toMatchObject({ chia_se: 1, mo: 0 });
  expect(tim("the_ngay", "khong_ro")).toMatchObject({ ten: "Thẻ ngày", chia_se: 5, mo: 2, dang_ky: 0 });
  expect(kq.ngoaiKhung).toEqual({ mo: 3, dang_ky: 1 });
  expect(kq.dong[0]!.kind).toBe("the_ngay");   // xếp theo lượt chia sẻ
});

test("tinhPheuThe: không có số → bảng rỗng", () => {
  expect(tinhPheuThe({ chiaSe: [], mo: [], dangKy: [], moiBan: [] })).toEqual({ dong: [], ngoaiKhung: { mo: 0, dang_ky: 0 } });
});

test("QR chụp màn hình: mã cố định theo mảng đúng dạng ?tu= và được gom vào dòng 'ms' dù không có share_created", async () => {
  const { maManHinh, linkQrManHinh } = await import("../lib/ma-man-hinh");
  for (const d of ["/tu-vi", "/tu-vi/la-so-mau/abc", "/bat-tu", "/kinh-dich", "/phong-thuy", "/khac"]) {
    expect(maManHinh(d)).toMatch(/^[a-z]{2}\.[a-f0-9]{10}$/);   // đúng dạng GhiVaoTrang chấp nhận
  }
  expect(maManHinh("/tu-vi")).not.toBe(maManHinh("/tu-vi/la-so-mau/abc"));
  expect(linkQrManHinh("https://hieuban.com", "/bat-tu")).toBe(`https://hieuban.com/bat-tu?tu=${maManHinh("/bat-tu")}`);
  const kq = tinhPheuThe({
    chiaSe: [],
    mo: [{ ma: maManHinh("/tu-vi"), nguoi: 5 }],
    dangKy: [{ ma: maManHinh("/tu-vi"), nguoi: 2, nhan_sao: 1 }],
    moiBan: [],
  });
  expect(kq.ngoaiKhung).toEqual({ mo: 0, dang_ky: 0 });
  expect(kq.dong).toHaveLength(1);
  expect(kq.dong[0]).toMatchObject({ kind: "ms", mo: 5, dang_ky: 2, nhan_sao: 1, chia_se: 0 });
  expect(kq.dong[0]!.ti_le.mo).toBeNull();   // không có lượt "tạo thẻ" → không chia cho 0
});
