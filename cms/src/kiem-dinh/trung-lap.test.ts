// Viết TRƯỚC trung-lap.ts (quy tắc dự án). Chạy: npm test.
import { test } from "node:test";
import assert from "node:assert/strict";
import { danhGiaTrung, doanTrungDaiNhat, giaiMaVanTay, maHoaVanTay, tuCua, vanBai, vanTay, NGUONG } from "./trung-lap.ts";

const chu = (text: string) => ({ type: "text", text, version: 1 });
const doan = (t: string) => ({ type: "paragraph", children: [chu(t)], version: 1 });
const goc = (...con: unknown[]) => ({ root: { type: "root", children: con, version: 1 } });

const A = "Người mang số chủ đạo bảy thường thích đọc sách, tự tìm hiểu bản chất của sự việc, ít khi tin ngay lời người khác "
  + "và cần những khoảng lặng một mình để nạp lại năng lượng sau mỗi tuần làm việc căng thẳng với nhiều người xung quanh.";
const B = "Bát tự xem bốn trụ năm tháng ngày giờ, mỗi trụ gồm một thiên can và một địa chi, từ đó xét ngũ hành vượng suy "
  + "của nhật chủ để hiểu khí chất, rồi đặt trong đại vận mười năm và lưu niên từng năm để thấy nhịp thay đổi.";

test("tuCua: bỏ dấu, viết thường, tách từ, bỏ dấu câu", () => {
  assert.deepEqual(tuCua("Số chủ đạo 7: Đức, HOÀ!"), ["so", "chu", "dao", "7", "duc", "hoa"]);
});

test("vanTay: cùng văn khác dấu câu/hoa thường/dấu thanh kiểu cũ → cùng vân tay; quá ngắn → rỗng", () => {
  assert.deepEqual([...vanTay(A)].sort(), [...vanTay(A.toUpperCase().replace(/,/g, " ;"))].sort());
  assert.equal(vanTay("ngắn quá").size, 0);
});

test("danhGiaTrung: chép nguyên bài khác → lỗi, chặn khi là cộng tác viên, chỉ cảnh báo với ban biên tập", () => {
  const moi = vanTay(A + " " + B.slice(0, 40));
  const khac = [{ id: 2, tieu_de: "Số 7", slug: "so-7", xuat_ban: true, van_tay: vanTay(A) }];
  const ctv = danhGiaTrung(moi, khac, new Map(), { congTacVien: true });
  const m = ctv.find((x) => x.ma === "trung_bai")!;
  assert.equal(m.muc_do, "loi");
  assert.equal(m.chan, true);
  assert.match(m.thong_diep, /Số 7/);
  const bt = danhGiaTrung(moi, khac, new Map(), { congTacVien: false }).find((x) => x.ma === "trung_bai")!;
  assert.equal(bt.muc_do, "canh_bao");
  assert.ok(!bt.chan);
});

test("danhGiaTrung: bài nháp của người khác → không lộ tiêu đề", () => {
  const m = danhGiaTrung(vanTay(A), [{ id: 3, tieu_de: "Bí mật", slug: "bi-mat", xuat_ban: false, van_tay: vanTay(A) }],
    new Map(), { congTacVien: true }).find((x) => x.ma === "trung_bai")!;
  assert.doesNotMatch(m.thong_diep, /Bí mật|bi-mat/);
});

test("danhGiaTrung: bài khác hẳn → đạt; trùng kho tri thức → nêu nguồn", () => {
  const kb = new Map([["thanso_meanings", vanTay(A)]]);
  const dat = danhGiaTrung(vanTay(B), [{ id: 2, tieu_de: "x", slug: "x", xuat_ban: true, van_tay: vanTay(A) }], kb, { congTacVien: true });
  assert.ok(dat.every((x) => x.muc_do === "dat"));
  const kq = danhGiaTrung(vanTay(A), [], kb, { congTacVien: true }).find((x) => x.ma === "trung_kho_tri_thuc")!;
  assert.equal(kq.muc_do, "loi");
  assert.match(kq.thong_diep, /thanso_meanings/);
});

test("danhGiaTrung: trích một phần nhỏ (dưới ngưỡng cảnh báo) → đạt", () => {
  const dai = B + " " + B.split("").reverse().join("") + " " + A.split(" ").slice(0, 8).join(" ");
  const kq = danhGiaTrung(vanTay(dai), [{ id: 2, tieu_de: "x", slug: "x", xuat_ban: true, van_tay: vanTay(A) }], new Map(), { congTacVien: true });
  assert.ok(kq.every((x) => x.muc_do === "dat"), JSON.stringify(kq));
  assert.ok(NGUONG.canh_bao > 0 && NGUONG.loi > NGUONG.canh_bao);
});

test("doanTrungDaiNhat: trả đoạn chép dài nhất để người duyệt thấy", () => {
  const d = doanTrungDaiNhat("Mở đầu riêng của tôi hoàn toàn mới. " + A, vanTay(A));
  assert.match(d, /thích đọc sách/);
  assert.doesNotMatch(d, /Mở đầu riêng/);
});

test("vanBai: gom trả lời nhanh + thân bài + hỏi đáp", () => {
  const v = vanBai({ tra_loi_nhanh: "nhanh", noi_dung: goc(doan("than bai")), hoi_dap: [{ cau_hoi: "hỏi", tra_loi: "đáp" }] });
  assert.match(v, /nhanh/); assert.match(v, /than bai/); assert.match(v, /đáp/);
});

test("maHoaVanTay ↔ giaiMaVanTay", () => {
  const v = vanTay(A);
  assert.deepEqual([...giaiMaVanTay(maHoaVanTay(v))].sort(), [...v].sort());
  assert.equal(giaiMaVanTay("").size, 0);
});
