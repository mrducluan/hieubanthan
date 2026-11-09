// Dựng video nháp (animatic) cho v21–27 từ kich-ban.json.
//   node dung.mjs <thư mục ra> [mã video…] [--anh]   (--anh: chỉ xuất ảnh mốc từng cảnh để duyệt)
// Hình: canvas tạo sinh trong Chromium (khung.html), 24 hình/giây, 1080×1920. Tiếng: nhạc nền tự tổng hợp (am-thanh.py).
import { createRequire } from "node:module";
const { chromium } = createRequire(import.meta.url)("playwright");
import { spawn, execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DIR = path.dirname(fileURLToPath(import.meta.url));
const [ra, ...thamSo] = process.argv.slice(2);
const chiAnh = thamSo.includes("--anh");
const iG = thamSo.indexOf("--giong");
const GIONG = iG >= 0 ? JSON.parse(fs.readFileSync(thamSo[iG + 1], "utf8")) : null;
const chon = thamSo.filter((s, i) => !s.startsWith("--") && !(iG >= 0 && i === iG + 1));
const FPS = 24;
fs.mkdirSync(ra, { recursive: true });

// Thời lượng cảnh theo lời đọc: ~4,1 âm tiết/giây (giọng đọc tin tức tiếng Việt), cộng khoảng nghỉ.
function thoiLuong(sc) {
  const amTiet = sc.vo.split(/\s+/).filter(Boolean).length;
  const ngat = (sc.vo.match(/[.,?:!;]/g) || []).length * 0.18;
  let d = amTiet / 4.1 + ngat + 0.6;
  if (sc.loai === "hook") d = Math.max(d, 3.0);
  if (sc.loai === "cta") d += 1.6;
  return Math.max(2.6, Math.round(d * 10) / 10);
}

const kb = JSON.parse(fs.readFileSync(path.join(DIR, "kich-ban.json"), "utf8"));
const ds = kb.video.filter(v => !chon.length || chon.includes(v.ma));
const logo = "file://" + path.resolve(DIR, "../../web/public/thuong-hieu/logo-dau-nen-toi-trong-suot.svg");

const trinh = await chromium.launch();
const trang = await trinh.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
await trang.goto("file://" + path.join(DIR, "khung.html"));

const bang = [];
for (const v of ds) {
  v.canh.forEach((sc, i) => {
    const g = GIONG && GIONG[`${v.ma}-${i + 1}`];
    if (g) { sc.giay = g.giay; sc.tep = g.tep; sc.thoi_luong = Math.round((g.giay + 0.55 + (sc.loai === "cta" ? 1.4 : 0)) * 100) / 100; }
    else sc.thoi_luong = thoiLuong(sc);
  });
  const tong = await trang.evaluate(([vv, lg]) => window.nap(vv, lg), [v, logo]);
  bang.push({ ma: v.ma, tong, canh: v.canh.map(s => [s.loai, s.thoi_luong]) });
  if (chiAnh) {
    let t0 = 0;
    for (const [i, sc] of v.canh.entries()) {
      const t = t0 + sc.thoi_luong * 0.78; t0 += sc.thoi_luong;
      await trang.evaluate(tt => window.ve(tt), t);
      await trang.locator("canvas").screenshot({ path: path.join(ra, `${v.ma}-${i + 1}-${sc.loai}.jpg`), type: "jpeg", quality: 85 });
    }
    continue;
  }
  const hinh = path.join(ra, `${v.ma}.hinh.mp4`);
  const ff = spawn("ffmpeg", ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(FPS), "-c:v", "mjpeg", "-i", "-",
    "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p", "-r", String(FPS), hinh], { stdio: ["pipe", "inherit", "inherit"] });
  const n = Math.ceil(tong * FPS);
  for (let f = 0; f < n; f++) {
    await trang.evaluate(tt => window.ve(tt), f / FPS);
    const buf = await trang.locator("canvas").screenshot({ type: "jpeg", quality: 92 });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once("drain", r));
  }
  ff.stdin.end(); await new Promise(r => ff.on("close", r));
  // nhạc nền + tiếng chuông chuyển cảnh, rồi ghép
  const moc = []; let t0 = 0; v.canh.forEach(sc => { moc.push(t0.toFixed(2)); t0 += sc.thoi_luong; });
  const wav = path.join(ra, `${v.ma}.wav`);
  execFileSync("python3", [path.join(DIR, "am-thanh.py"), wav, tong.toFixed(2), v.ma, moc.join(",")], { stdio: "inherit" });
  if (GIONG) {
    // giọng từng cảnh đặt đúng mốc (+0,15 giây), nhạc nền hạ thấp; trộn rồi chuẩn hoá âm lượng
    const vao = ["-i", hinh, "-i", wav]; const loc = []; let k = 2; let t1 = 0;
    v.canh.forEach(sc => { if (sc.tep) { vao.push("-i", sc.tep); const ms = Math.round((t1 + 0.15) * 1000); loc.push(`[${k}:a]aresample=44100,adelay=${ms}|${ms}[g${k}]`); k++; } t1 += sc.thoi_luong; });
    const nhan = Array.from({ length: k - 2 }, (_, j) => `[g${j + 2}]`).join("");
    loc.push(`[1:a]aresample=44100,volume=0.35[nen]`, `${nhan}amix=inputs=${k - 2}:normalize=0[gi]`, `[gi][nen]amix=inputs=2:normalize=0,loudnorm=I=-15:TP=-1.5:LRA=11[a]`);
    execFileSync("ffmpeg", ["-y", "-loglevel", "error", ...vao, "-filter_complex", loc.join(";"), "-map", "0:v", "-map", "[a]",
      "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-ar", "44100", "-t", tong.toFixed(2), "-movflags", "+faststart", path.join(ra, `${v.ma}.mp4`)]);
  } else
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", hinh, "-i", wav, "-c:v", "copy", "-c:a", "aac", "-b:a", "160k", "-shortest",
    "-movflags", "+faststart", path.join(ra, `${v.ma}.mp4`)]);
  fs.rmSync(hinh); fs.rmSync(wav);
  console.log(`${v.ma}: ${tong.toFixed(1)} giây, ${n} hình`);
}
fs.writeFileSync(path.join(ra, chiAnh ? "thoi-luong-anh.json" : "thoi-luong.json"), JSON.stringify(bang, null, 1));
await trinh.close();
