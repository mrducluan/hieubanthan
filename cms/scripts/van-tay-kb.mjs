// CG-6 — dựng vân tay kho tri thức (engine/app/kb/data/*.json) để CMS kiểm bài viết có chép nguyên văn trang kiến thức
// không. Chạy lúc build (vercel-build) và trước test/dev. Chỉ lưu MÃ BĂM các cụm từ, không lưu văn bản KB.
// Không thấy thư mục engine (Vercel tắt "Include files outside Root Directory") → ghi tệp rỗng, build vẫn chạy,
// CMS chỉ bỏ phần so với kho tri thức.
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const goc = dirname(dirname(fileURLToPath(import.meta.url)));
const ra = join(goc, "src/kiem-dinh/van-tay-kb.json");
const kb = join(goc, "../engine/app/kb/data");
const BO_QUA = new Set(["tham_dinh.json"]);   // sổ thẩm định nội bộ, không phải nội dung trang

function ghi(nguon, ghiChu) {
  writeFileSync(ra, JSON.stringify({ tao_luc: new Date().toISOString(), nguon }) + "\n");
  console.log(`[van-tay-kb] ${ghiChu}`);
}

let tl;
try {
  tl = await import("../src/kiem-dinh/trung-lap.ts");
} catch (e) {
  ghi({}, `bỏ qua (Node không chạy được .ts: ${e.message.split("\n")[0]}) — CMS không so với kho tri thức`);
  process.exit(0);
}
if (!existsSync(kb)) {
  ghi({}, "không thấy engine/app/kb/data — CMS không so với kho tri thức");
  process.exit(0);
}

const nguon = {};
let tong = 0;
for (const f of readdirSync(kb).filter((x) => x.endsWith(".json") && !BO_QUA.has(x)).sort()) {
  const vt = new Set();
  const duyet = (v) => {
    if (typeof v === "string") { if (v.length >= 60) for (const h of tl.vanTay(v)) vt.add(h); }
    else if (Array.isArray(v)) v.forEach(duyet);
    else if (v && typeof v === "object") Object.values(v).forEach(duyet);
  };
  duyet(JSON.parse(readFileSync(join(kb, f), "utf8")));
  if (vt.size) { nguon[f.replace(/\.json$/, "")] = tl.maHoaVanTay(vt); tong += vt.size; }
}
ghi(nguon, `${Object.keys(nguon).length} tệp, ${tong} cụm`);
