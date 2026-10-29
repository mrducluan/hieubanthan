// Xuất MP4 từ ban-dung/<ma>/ → xuat/<ma>.mp4 (1080×1920, 30 fps).
//   node render.mjs [v01 …]
// Máy không có Chrome của HyperFrames: đặt HYPERFRAMES_BROWSER_PATH tới một Chrome headless có sẵn.
// Có nhac/<ma>.mp3 (tao-nhac.mjs) → trộn nhạc nền: nền ≈ −10 dB so với giọng, tự hạ thêm khi có lời (sidechain),
// mờ vào 0,4 s, mờ ra 1,8 s cuối; cả bản trộn chuẩn hoá −14 LUFS (mức Reels / TikTok). Hình giữ nguyên (copy).
// Env: NHAC_DB (mặc định −10) chỉnh độ to nhạc nền. Bản chưa trộn giữ ở xuat/<ma>.khong-nhac.mp4;
// `node render.mjs --chi-tron [v01 …]` chỉ trộn lại nhạc (không dựng lại hình) khi đổi nhạc / độ to.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { VIDEO } from "./kich-ban.mjs";

const GOC = path.dirname(fileURLToPath(import.meta.url));
const NHAC_DB = Number(process.env.NHAC_DB ?? -10);
const doDai = (f) => Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]).toString().trim());

function tronNhac(vao, nhac, ra) {
  const d = doDai(vao);
  const loc = [
    `[1:a]atrim=0:${d},asetpts=N/SR/TB,volume=${NHAC_DB}dB,afade=t=in:d=0.4,afade=t=out:st=${Math.max(0, d - 1.8).toFixed(2)}:d=1.8[nen]`,
    "[0:a]asplit=2[loi][khoa]",
    "[nen][khoa]sidechaincompress=threshold=0.04:ratio=6:attack=15:release=350:makeup=1[nenha]",
    "[loi][nenha]amix=inputs=2:duration=first:normalize=0,loudnorm=I=-14:TP=-1:LRA=11,aresample=48000[a]",
  ].join(";");
  execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-i", vao, "-i", nhac, "-filter_complex", loc,
    "-map", "0:v", "-map", "[a]", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", ra]);
}

const chiTron = process.argv.includes("--chi-tron");
const chon = process.argv.slice(2).filter((x) => !x.startsWith("--"));
fs.mkdirSync(path.join(GOC, "xuat"), { recursive: true });
for (const v of VIDEO) {
  if (chon.length && !chon.includes(v.ma)) continue;
  const thu = path.join(GOC, "ban-dung", v.ma);
  if (!fs.existsSync(thu)) { console.error(`${v.ma}: chưa dựng — chạy node dung.mjs ${v.ma}`); continue; }
  const ra = path.join(GOC, "xuat", `${v.ma}.mp4`);
  const nhac = path.join(GOC, "nhac", `${v.ma}.mp3`);
  const coNhac = fs.existsSync(nhac);
  const tho = coNhac ? path.join(GOC, "xuat", `${v.ma}.khong-nhac.mp4`) : ra;
  if (!(chiTron && coNhac && fs.existsSync(tho))) {
    execFileSync(path.join(GOC, "node_modules/.bin/hyperframes"), ["render", "-o", tho, "--quiet"], { cwd: thu, stdio: "inherit" });
  }
  if (coNhac) tronNhac(tho, nhac, ra);
  console.log(`${v.ma} → ${path.relative(GOC, ra)}${coNhac ? " (có nhạc nền)" : ""}`);
}
