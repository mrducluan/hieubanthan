// ND-7: lọc "Chữ trên trang" trước khi lưu.
import assert from "node:assert/strict";
import { test } from "node:test";
import { bangCua, chuDaSua, locChuCms } from "./chu-trang.ts";

const BANG = {
  "dau.chip_1": { nhan: "Chip 1", mac_dinh: "30 giây", toi_da: 10 },
  "so_sanh.lon": { nhan: "Tiêu đề", mac_dinh: "Chatbot trả lời rất trôi." },
};

test("chỉ giữ khoá có trong bảng, chữ thuần, cắt theo giới hạn", () => {
  const ra = locChuCms(BANG, {
    "dau.chip_1": "  <b>Nhanh</b>   lắm ạ hôm nay  ", "so_sanh.lon": "Chatbot trả lời rất trôi.", "khoa.la": "x", "Sai Khoa": "y", "so_sanh.khac": 3,
  });
  assert.deepEqual(ra, { "dau.chip_1": "Nhanh lắm" });   // "Nhanh lắm ạ…" cắt còn 10 ký tự rồi bỏ khoảng trắng cuối
});

test("trống / trùng chữ gốc / không phải đối tượng → null", () => {
  assert.equal(locChuCms(BANG, { "dau.chip_1": "   ", "so_sanh.lon": "Chatbot trả lời rất trôi." }), null);
  assert.equal(locChuCms(BANG, null), null);
  assert.equal(locChuCms(BANG, ["x"]), null);
  assert.equal(locChuCms(BANG, "chuỗi"), null);
});

test("xuống dòng gộp thành một dòng; giữ dấu nhấn và biến", () => {
  assert.deepEqual(locChuCms(BANG, { "so_sanh.lon": "Bạn là\n *số mấy?* {ten}" }), { "so_sanh.lon": "Bạn là *số mấy?* {ten}" });
});

test("bangCua đọc mac_dinh.chu an toàn; chuDaSua chỉ lấy chuỗi", () => {
  assert.deepEqual(bangCua({ chu: BANG }), BANG);
  assert.deepEqual(bangCua(null), {});
  assert.deepEqual(bangCua({ chu: [1] }), {});
  assert.deepEqual(chuDaSua({ a: "x", b: 2 }), ["x"]);
});
