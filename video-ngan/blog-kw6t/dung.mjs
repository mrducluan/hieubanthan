// KW-6T ý 3 — dựng 8 video dọc 1080×1920 (~30 giây) cho 8 bài blog tuần 1–2.
//   python3 giong.py <ra>        → giọng đọc từng cảnh (ElevenLabs, giọng đã chốt) + giong.json
//   node dung.mjs <ra> [b1 b2…]  → <ra>/hoan-chinh/<mã>-<slug>.mp4
// Mỗi cảnh: tiêu đề + ảnh minh hoạ của chính bài (cms/src/bai-khoi-tao/kw6t/anh) phóng chậm + phụ đề theo lời đọc.
// Cảnh cuối: QR về bài + hieuban.com. Nhạc nền tự tổng hợp (../v21-27/am-thanh.py) — không dùng nhạc có bản quyền.
// Phụ đề tránh vùng nút của Shorts / Reels / TikTok (đáy ~320 px, mép phải ~140 px).
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";

const DIR = path.dirname(fileURLToPath(import.meta.url));
const GOC = path.resolve(DIR, "../..");
const ANH = path.join(GOC, "cms/src/bai-khoi-tao/kw6t/anh");
const RA = path.resolve(process.argv[2] ?? "ra");
const CHON = process.argv.slice(3);
const { chromium } = createRequire(import.meta.url)("playwright");
const { maHoaQr, duongQr } = await import(pathToFileURL(path.join(GOC, "cms/src/lib/qr.ts")).href);
const FONT = (f) => pathToFileURL(path.join(GOC, "cms/assets/fonts", f)).href;
const LOGO = fs.readFileSync(path.join(GOC, "web/public/thuong-hieu/logo-ngang-nen-sang-trong-suot.svg"), "utf8");
const KB = JSON.parse(fs.readFileSync(path.join(DIR, "kich-ban.json"), "utf8"));
const GIONG = JSON.parse(fs.readFileSync(path.join(RA, "giong.json"), "utf8"));
const FPS = 30, TRUOC = 0.3, SAU = 0.5;

const e = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
const qrSvg = (url, px) => {
  const q = maHoaQr(url); const n = q.kichThuoc + 8; const o = Math.floor(px / n);
  return `<svg width="${n * o}" height="${n * o}" viewBox="0 0 ${n} ${n}" shape-rendering="crispEdges"><rect width="${n}" height="${n}" fill="#fff"/><path d="${duongQr(q)}" fill="#1d1830"/></svg>`;
};
const CSS = `
@font-face{font-family:BV;src:url(${FONT("BeVietnamPro-SemiBold.ttf")})}
@font-face{font-family:NR;src:url(${FONT("Newsreader.ttf")})}
*{box-sizing:border-box;margin:0;padding:0}
body{width:1080px;height:1920px;font-family:BV,sans-serif;color:#262033;background:transparent;overflow:hidden}
.nen{position:absolute;inset:0;background:radial-gradient(900px 700px at 90% 5%,#fff8e6 0,transparent 60%),
  radial-gradient(900px 900px at 0% 100%,#ecdfc3 0,transparent 60%),#f4ecda}
.logo{position:absolute;left:60px;top:70px}.logo svg{height:48px;width:auto}
.web{position:absolute;right:60px;top:78px;font-size:30px;color:#a8741a}
h1{position:absolute;left:60px;right:60px;top:160px;height:240px;display:flex;align-items:flex-end;
  font-family:NR,serif;font-weight:600;font-size:84px;line-height:1.08;color:#2a2140}
.khung{position:absolute;left:34px;top:434px;width:1012px;height:712px;border-radius:26px;background:#fff;
  box-shadow:0 20px 50px rgba(42,33,64,.22)}
.cap{position:absolute;left:60px;right:150px;top:1196px;display:flex;justify-content:center}
.cap div{background:#2a2140;color:#fbf5e6;font-size:52px;line-height:1.28;padding:26px 34px;border-radius:24px;text-align:center;
  box-shadow:0 12px 30px rgba(42,33,64,.3)}
.cap b{color:#f0c66b;font-weight:600}
.cta{position:absolute;left:60px;right:60px;top:520px;text-align:center}
.cta .q{display:inline-block;padding:22px;background:#fff;border-radius:28px;box-shadow:0 20px 50px rgba(42,33,64,.2)}
.cta .w{font-family:NR,serif;font-weight:600;font-size:96px;color:#2a2140;margin-top:40px}
.cta .u{font-size:32px;color:#6d6380;margin-top:14px}
`;
const trang = (than) => `<!doctype html><meta charset="utf-8"><style>${CSS}</style><body>${than}</body>`;

// Phụ đề: bỏ thẻ cảm xúc, "hieuban chấm com" → hieuban.com; tách theo câu, câu dài tách ở dấu phẩy; ≤ ~46 ký tự / dòng.
function phuDe(vo) {
  const chu = vo.replace(/\[[^\]]*\]\s*/g, "").replace(/hiểu bản chấm com/g, "hieuban.com").trim();
  const cau = chu.split(/(?<=[.?!:])\s+/).map((s) => s.trim()).filter(Boolean);   // "hieuban.com" không bị cắt
  const ra = [];
  for (const c of cau) {
    if (c.length <= 52) { ra.push(c); continue; }
    let cur = "";
    for (const p of c.split(/(?<=,)\s+/)) {
      if (cur && (cur + " " + p).length > 52) { ra.push(cur); cur = p; } else cur = cur ? `${cur} ${p}` : p;
    }
    if (cur) ra.push(cur);
  }
  // Mẩu ngắn < 3 chữ ghép vào mẩu trước (tránh một chữ đứng riêng).
  return ra.reduce((a, s) => (a.length && s.split(/\s+/).length < 3 ? (a[a.length - 1] += ` ${s}`, a) : (a.push(s), a)), []);
}
const toDam = (s) => e(s).replace(/(\b(?:19|20)\d\d\b|Tam tai|Kim lâu \S+|La Hầu|Kế Đô|Tứ Tấn Tài|hieuban\.com)/g, "<b>$1</b>");

const trinh = await chromium.launch(fs.existsSync("/opt/pw-browsers/chromium") ? { executablePath: "/opt/pw-browsers/chromium" } : {});
const p = await trinh.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
const chup = async (html, tep, trongSuot = false) => {
  await p.setContent(trang(html), { waitUntil: "load" });
  await p.evaluate(() => document.fonts.ready);
  await p.screenshot({ path: tep, omitBackground: trongSuot });
};
const dauMuc = `<div class="nen"></div><div class="logo">${LOGO}</div><div class="web">hieuban.com</div>`;
const ff = (args) => execFileSync("ffmpeg", ["-y", "-loglevel", "error", ...args], { stdio: "inherit" });
const giay = (tep) => parseFloat(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", tep]).toString());

fs.mkdirSync(path.join(RA, "hoan-chinh"), { recursive: true });
for (const v of KB.video) {
  if (CHON.length && !CHON.includes(v.ma)) continue;
  const tam = path.join(RA, "tam", v.ma); fs.mkdirSync(tam, { recursive: true });
  const url = `https://hieuban.com/blog/${v.slug}`;
  const canh = [], moc = [];
  let t0 = 0;
  for (const [i, c] of v.canh.entries()) {
    const g = GIONG[`${v.ma}-${i + 1}`];
    if (!g) throw new Error(`thiếu giọng ${v.ma}-${i + 1} — chạy giong.py trước`);
    const dai = TRUOC + g.giay + SAU;
    const bg = path.join(tam, `${i}-nen.png`);
    const than = c.cta
      ? `<div class="cta"><div class="q">${qrSvg(url, 520)}</div><div class="w">hieuban.com</div>
         <div class="u">Quét mã hoặc bấm link ở phần mô tả<br>để đọc bài đầy đủ</div></div>`
      : `<div class="khung"></div>`;   // ảnh bài chồng lên bằng ffmpeg (lia ngang chậm, xem dưới)
    await chup(`${dauMuc}<h1>${e(c.tieu)}</h1>${than}`, bg);
    const cum = phuDe(c.vo);
    const tong = cum.reduce((s, x) => s + x.length, 0);
    let t = TRUOC; const lop = [];
    for (const [k, x] of cum.entries()) {
      const d = (g.giay * x.length) / tong;
      const tep = path.join(tam, `${i}-cap${k}.png`);
      await chup(`<div class="cap" ${c.cta ? 'style="top:1330px"' : ""}><div>${toDam(x)}</div></div>`, tep, true);
      lop.push({ tep, a: k === 0 ? 0 : t, b: k === cum.length - 1 ? dai : t + d });
      t += d;
    }
    // Ảnh bài: cao 700 px (chữ trong ảnh đọc được trên điện thoại), rộng hơn khung 1000 px → lia ngang chậm trái → phải.
    // Cảnh CTA: nền tĩnh. Phụ đề chồng theo mốc thời gian.
    const vao = ["-loop", "1", "-framerate", String(FPS), "-t", dai.toFixed(3), "-i", bg,
      ...lop.flatMap((l) => ["-loop", "1", "-framerate", String(FPS), "-t", dai.toFixed(3), "-i", l.tep]), "-i", g.tep,
      ...(c.cta ? [] : ["-loop", "1", "-framerate", String(FPS), "-t", dai.toFixed(3), "-i", path.join(ANH, c.anh)])];
    const iAnh = lop.length + 2;
    let loc = c.cta ? "[0:v]null[v0]"
      : `[${iAnh}:v]scale=-2:700,crop=1000:700:x='(iw-1000)*min(1,t/${dai.toFixed(2)})':y=0[a];[0:v][a]overlay=40:440[v0]`;
    lop.forEach((l, k) => { loc += `;[v${k}][${k + 1}:v]overlay=0:0:enable='between(t,${l.a.toFixed(2)},${l.b.toFixed(2)})'[v${k + 1}]`; });
    loc += `;[v${lop.length}]fade=t=in:st=0:d=0.2,fade=t=out:st=${(dai - 0.2).toFixed(2)}:d=0.2,format=yuv420p[vr]`;
    loc += `;[${lop.length + 1}:a]adelay=${Math.round(TRUOC * 1000)}|${Math.round(TRUOC * 1000)},apad,atrim=0:${dai.toFixed(3)},aresample=44100,aformat=channel_layouts=stereo[ar]`;
    const ra = path.join(tam, `${i}.mp4`);
    ff([...vao, "-filter_complex", loc, "-map", "[vr]", "-map", "[ar]", "-r", String(FPS), "-c:v", "libx264", "-preset", "medium", "-crf", "19",
      "-c:a", "aac", "-b:a", "160k", "-t", dai.toFixed(3), ra]);
    canh.push(ra); moc.push(t0.toFixed(2)); t0 += giay(ra);
  }
  const ds = path.join(tam, "ds.txt");
  fs.writeFileSync(ds, canh.map((c) => `file '${c}'`).join("\n"));
  const noi = path.join(tam, "noi.mp4");
  ff(["-f", "concat", "-safe", "0", "-i", ds, "-c", "copy", noi]);
  const tong = giay(noi);
  const nhac = path.join(tam, "nhac.wav");
  execFileSync("python3", [path.join(DIR, "../v21-27/am-thanh.py"), nhac, tong.toFixed(2), v.ma, moc.join(",")], { stdio: "inherit" });
  const ra = path.join(RA, "hoan-chinh", `${v.ma}-${v.slug}.mp4`);
  ff(["-i", noi, "-i", nhac, "-filter_complex",
    "[1:a]volume=0.55,aresample=44100,aformat=channel_layouts=stereo[n];[0:a][n]amix=inputs=2:duration=first:normalize=0,loudnorm=I=-15:TP=-1.5:LRA=11[a]",
    "-map", "0:v", "-map", "[a]", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", ra]);
  console.log(`${v.ma}: ${tong.toFixed(1)} giây → ${ra}`);
}
await trinh.close();
