import assert from "node:assert/strict";
import test from "node:test";
import { CAU_QUYET_DINH, KHOA_CAU_CHO_CO_VAN, cauTuUrl, datCauChoCoVan, duongCoVan, layCauChoCoVan } from "./cau-hoi-co-van.ts";

const khoGia = () => { const m = new Map(); return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => void m.set(k, v), removeItem: (k) => void m.delete(k), m }; };

test("câu người dùng gõ đi qua sessionStorage, đọc MỘT lần rồi xoá, không bao giờ lên URL", () => {
  const k = khoGia();
  assert.equal(datCauChoCoVan("  Tôi   có nên mở quán  không?  ", k), true);
  assert.equal(k.m.get(KHOA_CAU_CHO_CO_VAN), "Tôi có nên mở quán không?");
  assert.equal(layCauChoCoVan(k), "Tôi có nên mở quán không?");
  assert.equal(layCauChoCoVan(k), null);
});

test("câu quá ngắn hoặc không có kho → không đặt; kho ném lỗi → không vỡ", () => {
  assert.equal(datCauChoCoVan("ab", khoGia()), false);
  assert.equal(datCauChoCoVan("Có nên mở quán không?", null), false);
  const hong = { getItem() { throw new Error("x"); }, setItem() { throw new Error("x"); }, removeItem() { throw new Error("x"); } };
  assert.equal(datCauChoCoVan("Có nên mở quán không?", hong), false);
  assert.equal(layCauChoCoVan(hong), null);
});

test("câu dài bị cắt 300 ký tự", () => {
  const k = khoGia();
  datCauChoCoVan("a".repeat(500), k);
  assert.equal(layCauChoCoVan(k).length, 300);
});

test("?cau= chỉ nhận câu thuộc danh mục cố định; đường dẫn chỉ mang câu danh mục", () => {
  assert.equal(cauTuUrl(CAU_QUYET_DINH[0]), CAU_QUYET_DINH[0]);
  assert.equal(cauTuUrl("Chồng tôi có ngoại tình không"), null);
  assert.equal(cauTuUrl(null), null);
  assert.equal(duongCoVan(CAU_QUYET_DINH[1]), "/co-van?cau=" + encodeURIComponent(CAU_QUYET_DINH[1]));
  assert.equal(duongCoVan("câu tự gõ riêng tư"), "/co-van");
  assert.equal(duongCoVan(), "/co-van");
});
