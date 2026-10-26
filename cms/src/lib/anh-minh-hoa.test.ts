// Ảnh vẽ cho bài blog (BLOG-7) mang link + QR về đúng bài (2026-10-26) — vẽ được, khác bản không có đường dẫn, đúng cỡ.
import { test } from "node:test";
import assert from "node:assert/strict";
import { writeFileSync } from "node:fs";
import { CO_ANH, veAnhBia, veAnhTomTat } from "./anh-minh-hoa.ts";

const coPng = (b: Buffer) => [b.readUInt32BE(16), b.readUInt32BE(20)];

test("ảnh bìa + tóm tắt có chân link + QR khi có đường dẫn bài; không có → chỉ tên miền", async () => {
  const co = await veAnhBia({ tieuDe: "Cách xem hướng nhà hợp tuổi", phu: "Bát trạch từng bước", mang: "phong_thuy", duong: "/blog/cach-xem-huong-nha-hop-tuoi" });
  const khong = await veAnhBia({ tieuDe: "Cách xem hướng nhà hợp tuổi", phu: "Bát trạch từng bước", mang: "phong_thuy" });
  assert.deepEqual(coPng(co), [CO_ANH.width, CO_ANH.height]);
  assert.notDeepEqual(co, khong);
  const tt = await veAnhTomTat({ tieuDe: "Bát tự là gì", y: ["Tứ trụ", "Nhật chủ", "Dụng thần"], mang: "bat_tu", duong: "/blog/bat-tu-la-gi" });
  assert.deepEqual(coPng(tt), [CO_ANH.width, CO_ANH.height]);
  if (process.env.ANH_RA) { writeFileSync(`${process.env.ANH_RA}/bia.png`, co); writeFileSync(`${process.env.ANH_RA}/tomtat.png`, tt); }
});
