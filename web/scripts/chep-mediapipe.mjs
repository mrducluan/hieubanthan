// ANH-3 — chép bộ tìm điểm mốc gương mặt vào public/mediapipe/<phiên bản>/ để site TỰ PHỤC VỤ (không gọi máy chủ ngoài lúc
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
const moHinh = join(goc, "mo-hinh", cfg.mo_hinh);
const bam = createHash("sha256").update(readFileSync(moHinh)).digest("hex");
if (bam !== cfg.sha256) {
  console.error(`[chep-mediapipe] mô hình ${cfg.mo_hinh} sai mã băm (${bam}) — tệp hỏng hoặc bị thay.`);
  process.exit(1);
}
const dich = join(goc, "public/mediapipe", ban);
rmSync(join(goc, "public/mediapipe"), { recursive: true, force: true });
mkdirSync(join(dich, "wasm"), { recursive: true });
for (const t of ["vision_wasm_internal.js", "vision_wasm_internal.wasm"]) copyFileSync(join(goi, "wasm", t), join(dich, "wasm", t));
copyFileSync(moHinh, join(dich, cfg.mo_hinh));
if (!existsSync(join(dich, "wasm/vision_wasm_internal.wasm"))) process.exit(1);
console.log(`[chep-mediapipe] đã chép bộ đo ${ban} vào public/mediapipe/${ban}/`);
