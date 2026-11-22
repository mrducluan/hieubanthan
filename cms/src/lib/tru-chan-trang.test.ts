// FOOTER-2: CMS không cho lưu chân trang thiếu trang trụ. Chạy: npm test.
import { test } from "node:test"
import assert from "node:assert/strict"
import { TRU_CHAN_TRANG, thieuTru } from "./tru-chan-trang.ts"

const lk = (duong_dan: string, loai = "duong_dan") => ({ loai, duong_dan })

test("cột trống (web dùng mặc định) → không thiếu", () => {
  assert.deepEqual(thieuTru([]), [])
  assert.deepEqual(thieuTru(undefined), [])
})

test("đủ trang trụ (kể cả có #neo, ?query, rải nhiều cột) → không thiếu", () => {
  const ds = TRU_CHAN_TRANG.map((d, i) => lk(i === 0 ? `${d}#x` : i === 1 ? `${d}?a=1` : d))
  assert.deepEqual(thieuTru([{ lien_ket: ds.slice(0, 5) }, { lien_ket: ds.slice(5) }]), [])
})

test("bản sửa tay production (6 mục) → báo đúng các trụ thiếu", () => {
  const cot = [{ lien_ket: ["/than-so", "/tu-vi", "/bat-tu", "/kinh-dich", "/phong-thuy", "/hop-doi"].map((d) => lk(d)) }]
  assert.deepEqual(thieuTru(cot), ["/nhan-tuong", "/tarot", "/ky-mon", "/huyen-hoc"])
})

test("liên kết loại bài viết / chuyên mục không tính là trang trụ", () => {
  assert.ok(thieuTru([{ lien_ket: TRU_CHAN_TRANG.map((d) => lk(d, "bai")) }]).length === TRU_CHAN_TRANG.length)
})
