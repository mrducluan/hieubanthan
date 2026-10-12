// Chuẩn hoá tiếng Việt + kiểu bỏ dấu + video YouTube (viết trước khi nối vào hook/khối). Chạy: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { chuanHoaChu, chuanHoaDuLieu, demKieuDau, kiemDinhBai } from "./kiem-dinh.ts";
import { giayBatDau, maYoutube } from "../lib/video.ts";

const NFD = "Số chủ đạo".normalize("NFD");

test("chuanHoaChu: NFC, gộp khoảng trắng, bỏ khoảng trắng trước dấu câu, không trim", () => {
  assert.equal(chuanHoaChu(NFD), "Số chủ đạo");
  assert.equal(chuanHoaChu(NFD).length, 10);
  assert.equal(chuanHoaChu("  a   b , c ; d ?  "), " a b, c; d? ");
  assert.equal(chuanHoaChu("3 . 5 và 12:30"), "3. 5 và 12:30");
});

test("chuanHoaDuLieu: mọi chuỗi trong bài, trường thường trim, nút chữ Lexical giữ khoảng trắng hai đầu", () => {
  const d = chuanHoaDuLieu({
    tieu_de: `  ${NFD}  là gì ? `, hoi_dap: [{ cau_hoi: NFD }], so: 7,
    noi_dung: { root: { children: [{ type: "paragraph", children: [{ type: "text", text: `${NFD}  ` }, { type: "text", text: " tiếp" }] }] } },
  });
  assert.equal(d.tieu_de, "Số chủ đạo là gì?");
  assert.equal(d.hoi_dap[0]!.cau_hoi, "Số chủ đạo");
  assert.equal(d.so, 7);
  const con = d.noi_dung.root.children[0]!.children;
  assert.equal(con[0]!.text, "Số chủ đạo ");
  assert.equal(con[1]!.text, " tiếp");
});

test("demKieuDau: chỉ vần mở oa/oe/uy, bỏ qu-, bỏ âm tiết có phụ âm cuối", () => {
  assert.deepEqual(demKieuDau("hoà khoẻ thuỷ"), { moi: 3, cu: 0 });
  assert.deepEqual(demKieuDau("hòa khỏe thủy"), { moi: 0, cu: 3 });
  assert.deepEqual(demKieuDau("quý hoàng hoạch của tuy"), { moi: 0, cu: 0 });
  assert.deepEqual(demKieuDau("Hoà".normalize("NFD")), { moi: 1, cu: 0 });
});

test("kiểm định: cảnh báo chữ tổ hợp + trộn kiểu bỏ dấu, không chặn", () => {
  const kq = kiemDinhBai({ tieu_de: NFD, mo_ta_ngan: "Phong thuỷ và phong thủy" });
  const m = (ma: string) => kq.muc.find((x) => x.ma === ma)!;
  assert.equal(m("tieng_viet").muc_do, "canh_bao");
  assert.equal(m("kieu_dau").muc_do, "canh_bao");
  assert.ok(!kq.loi_chan.some((x) => x.ma === "tieng_viet" || x.ma === "kieu_dau"));
  const sach = kiemDinhBai({ tieu_de: "Phong thuỷ nhà ở", mo_ta_ngan: "Hoà hợp" });
  assert.equal(sach.muc.find((x) => x.ma === "tieng_viet")!.muc_do, "dat");
  assert.equal(sach.muc.find((x) => x.ma === "kieu_dau")!.muc_do, "dat");
});

test("maYoutube: mọi dạng link, chặn host lạ / mã sai", () => {
  for (const u of ["https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=30", "https://youtu.be/dQw4w9WgXcQ?t=1m30s",
    "https://m.youtube.com/shorts/dQw4w9WgXcQ", "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ", "dQw4w9WgXcQ"]) {
    assert.equal(maYoutube(u), "dQw4w9WgXcQ", u);
  }
  for (const u of ["https://evil.example/watch?v=dQw4w9WgXcQ", "https://youtube.com.evil.example/watch?v=dQw4w9WgXcQ",
    "javascript:alert(1)", "https://www.youtube.com/watch?v=abc", "https://www.youtube.com/watch?v=dQw4w9WgXcQ\"><x", 7, null]) {
    assert.equal(maYoutube(u), null, String(u));
  }
  assert.equal(giayBatDau("https://youtu.be/dQw4w9WgXcQ?t=1m30s"), 90);
  assert.equal(giayBatDau("https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=45"), 45);
  assert.equal(giayBatDau("https://youtu.be/dQw4w9WgXcQ"), null);
});
