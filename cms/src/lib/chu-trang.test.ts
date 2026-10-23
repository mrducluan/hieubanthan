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

test("hình: chỉ khoá trong bảng, nhận số id hoặc bản đã chụp, ảnh mất khỏi thư viện thì bỏ", async () => {
  const { chupHinh, maAnh, bangHinhCua } = await import("./chu-trang.ts");
  const bang = { "hero.hinh": { nhan: "Hero" }, chia_se: { nhan: "OG" } };
  const kho: Record<string, Record<string, unknown>> = {
    "7": { id: 7, url: "/api/media/file/a.webp", alt: "Ảnh A", width: 800, height: 800, sizes: { nho: { url: "/n.webp", width: 480, height: 480 }, og: { url: null } } },
  };
  const ra = await chupHinh(bang, { "hero.hinh": 7, chia_se: { id: "9", url: "cũ" }, "khoa.la": 7 }, async (id) => kho[String(id)] ?? null);
  assert.deepEqual(ra, { "hero.hinh": { id: 7, url: "/api/media/file/a.webp", alt: "Ảnh A", width: 800, height: 800, sizes: { nho: { url: "/n.webp", width: 480, height: 480 } } } });
  assert.equal(await chupHinh(bang, { chia_se: "x" }, async () => null), null);
  assert.equal(maAnh("12"), "12"); assert.equal(maAnh({ id: 3 }), 3); assert.equal(maAnh("1; drop"), null);
  assert.deepEqual(bangHinhCua({ hinh: bang }), bang);
});

test("mục chọn (cỡ chữ): chỉ nhận giá trị trong danh sách, trùng mặc định thì bỏ", () => {
  const lc = [{ gia_tri: "nho", nhan: "Nhỏ" }, { gia_tri: "thuong", nhan: "Vừa" }, { gia_tri: "lon", nhan: "Lớn" }];
  const bang = { "co.h1": { mac_dinh: "thuong", lua_chon: lc } };
  assert.deepEqual(locChuCms(bang, { "co.h1": "lon" }), { "co.h1": "lon" });
  assert.equal(locChuCms(bang, { "co.h1": "thuong" }), null);
  assert.equal(locChuCms(bang, { "co.h1": "to-dung-dung" }), null);
  assert.equal(locChuCms(bang, { "co.h1": "<b>lon</b>" }), null);
});
