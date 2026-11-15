// ANH-3 + CT-2 — chép bộ tìm điểm mốc gương mặt + bàn tay vào public/mediapipe/<phiên bản>/ để site TỰ PHỤC VỤ (không gọi máy chủ ngoài lúc
// chạy; CSP connect-src chỉ có 'self'). Chạy trước `next dev` / `next build` (predev, prebuild). Tệp sinh ra không vào git.
import { createHash } from "node:crypto";
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const goc = join(dirname(fileURLToPath(import.meta.url)), "..");
const cfg = JSON.parse(readFileSync(join(goc, "lib/bo-do-mat.json"), "utf8"));
const goi = join(goc, "node_modules/@mediapipe/tasks-vision");
const ban = JSON.parse(readFileSync(join(goi, "package.json"), "utf8")).version;
if (ban !== cfg.phien_ban) {
  console.error(`[chep-mediapipe] @mediapipe/tasks-vision đang là ${ban} nhưng lib/bo-do-mat.json ghi ${cfg.phien_ban} — sửa phien_ban cho khớp.`);
  process.exit(1);
}
// Mô hình gương mặt (ANH-3) + bàn tay (CT-2): kiểm mã băm từng tệp trước khi chép.
const dsMoHinh = [{ mo_hinh: cfg.mo_hinh, sha256: cfg.sha256 }, ...(cfg.tay ? [cfg.tay] : [])];
for (const m of dsMoHinh) {
  const bam = createHash("sha256").update(readFileSync(join(goc, "mo-hinh", m.mo_hinh))).digest("hex");
  if (bam !== m.sha256) {
    console.error(`[chep-mediapipe] mô hình ${m.mo_hinh} sai mã băm (${bam}) — tệp hỏng hoặc bị thay.`);
    process.exit(1);
  }
}
const dich = join(goc, "public/mediapipe", ban);
rmSync(join(goc, "public/mediapipe"), { recursive: true, force: true });
mkdirSync(join(dich, "wasm"), { recursive: true });
for (const t of ["vision_wasm_internal.js", "vision_wasm_internal.wasm"]) copyFileSync(join(goi, "wasm", t), join(dich, "wasm", t));
for (const m of dsMoHinh) copyFileSync(join(goc, "mo-hinh", m.mo_hinh), join(dich, m.mo_hinh));
if (!existsSync(join(dich, "wasm/vision_wasm_internal.wasm"))) process.exit(1);
console.log(`[chep-mediapipe] đã chép bộ đo ${ban} vào public/mediapipe/${ban}/`);
