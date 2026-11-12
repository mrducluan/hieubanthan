// KW-6T ý 3 — bản HyperFrames của 8 video bài blog (chủ dự án yêu cầu 2026-11-12: dựng bằng HyperFrames, dùng hình của
// chính engine / hieuban.com thay vì lia ảnh minh hoạ tĩnh).
//   node dung-hf.mjs <thư mục giọng (giong.json)> <thư mục tài sản> <thư mục ra> [b1 b2…]
// Tài sản: web-*.png = ảnh chụp trang công cụ thật trên hieuban.com (khổ điện thoại), tt-*.png = ảnh tóm tắt engine dựng
// (/og/tom-tat). Cần: CLI `hyperframes` + gsap.min.js trong <tài sản> (CDN bị chặn → dùng bản cục bộ).
// Mỗi video = một project HyperFrames (index.html + assets) → `npx hyperframes render`. Không Math.random / Date.now:
// sao nền sinh bằng PRNG có hạt giống cố định trong lúc dựng HTML (đúng luật HyperFrames: chỉ logic tất định).
import { execFileSync } from "node:child_process";
import path from "node:path";
import fs from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

const DIR = path.dirname(fileURLToPath(import.meta.url));
const GOC = path.resolve(DIR, "../..");
const [GIONG_DIR, TAI_SAN, RA] = process.argv.slice(2, 5).map((p) => path.resolve(p));
const CHON = process.argv.slice(5);
const KB = JSON.parse(fs.readFileSync(path.join(DIR, "kich-ban.json"), "utf8"));
const HINH = JSON.parse(fs.readFileSync(path.join(DIR, "hinh-hf.json"), "utf8"));
const GIONG = JSON.parse(fs.readFileSync(path.join(GIONG_DIR, "giong.json"), "utf8"));
const { maHoaQr, duongQr } = await import(pathToFileURL(path.join(GOC, "cms/src/lib/qr.ts")).href);
const LOGO = fs.readFileSync(path.join(GOC, "web/public/thuong-hieu/logo-ngang-nen-toi-trong-suot.svg"), "utf8");
const TRUOC = 0.3, SAU = 0.5, W = 1080, H = 1920;

const e = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
const qrSvg = (url, px) => {
  const q = maHoaQr(url); const n = q.kichThuoc + 8; const o = Math.floor(px / n);
  return `<svg width="${n * o}" height="${n * o}" viewBox="0 0 ${n} ${n}" shape-rendering="crispEdges"><rect width="${n}" height="${n}" fill="#fff"/><path d="${duongQr(q)}" fill="#14122a"/></svg>`;
};
const kichAnh = (tep) => { // PNG: rộng/cao ở byte 16..23
  const b = fs.readFileSync(tep); return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
};

// Phụ đề: cùng luật với dung.mjs (bỏ thẻ cảm xúc, "hiểu bản chấm com" → hieuban.com, ≤ 52 ký tự / mẩu).
function phuDe(vo) {
  const chu = vo.replace(/\[[^\]]*\]\s*/g, "").replace(/hiểu bản chấm com/g, "hieuban.com").trim();
  const cau = chu.split(/(?<=[.?!:])\s+/).map((s) => s.trim()).filter(Boolean);
  const ra = [];
  for (const c of cau) {
    if (c.length <= 52) { ra.push(c); continue; }
    let cur = "";
    for (const p of c.split(/(?<=,)\s+/)) {
      if (cur && (cur + " " + p).length > 52) { ra.push(cur); cur = p; } else cur = cur ? `${cur} ${p}` : p;
    }
    if (cur) ra.push(cur);
  }
  return ra.reduce((a, s) => (a.length && s.split(/\s+/).length < 3 ? (a[a.length - 1] += ` ${s}`, a) : (a.push(s), a)), []);
}
const toDam = (s) => e(s).replace(/(\b(?:19|20)\d\d\b|Tam tai|Kim lâu \S+|La Hầu|Kế Đô|Tứ Tấn Tài|hieuban\.com)/g, "<b>$1</b>");

// PRNG tất định (mulberry32) — chỉ dùng lúc sinh HTML.
const prng = (a) => () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

const CSS = `
@font-face{font-family:BV;src:url(assets/BeVietnamPro-SemiBold.ttf)}
@font-face{font-family:NR;src:url(assets/Newsreader.ttf)}
:root{--nen:#0d0c1f;--vang:#e9c46a;--chu:#f6efdf;--mo:#b3acd0;--xanh:#86d7ad;--cam:#f2a65a}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:${W}px;height:${H}px;overflow:hidden;background:var(--nen)}
#root{position:relative;width:100%;height:100%;font-family:BV,sans-serif;color:var(--chu);
  background:radial-gradient(1100px 900px at 85% 8%,#2a2358 0,transparent 60%),radial-gradient(1000px 1000px at 0% 100%,#1d1840 0,transparent 60%),var(--nen)}
.clip{position:absolute;inset:0}
.sao{position:absolute;border-radius:50%;background:#fff}
.dau{position:absolute;left:60px;right:60px;top:70px;display:flex;align-items:center;justify-content:space-between}
.dau svg{height:52px;width:auto}.dau span{font-size:30px;color:var(--vang);letter-spacing:.02em}
.canh h1{position:absolute;left:64px;right:64px;top:170px;height:250px;display:flex;align-items:flex-end;font-family:NR,serif;font-weight:600;font-size:86px;line-height:1.06;color:#fff}
.nhan{position:absolute;left:64px;top:170px;font-size:30px;letter-spacing:.14em;text-transform:uppercase;color:var(--vang)}
.vung{position:absolute;left:0;right:0;top:450px;height:800px;display:flex;align-items:center;justify-content:center}
.lon{font-family:NR,serif;font-weight:600;font-size:230px;color:var(--vang);text-shadow:0 0 60px rgba(233,196,106,.35)}
.ds{width:900px;display:flex;flex-direction:column;gap:22px}
.the{display:flex;align-items:center;gap:26px;background:rgba(255,255,255,.07);border:2px solid rgba(233,196,106,.35);border-radius:26px;padding:26px 32px}
.the b{flex:none;min-width:84px;font-family:NR,serif;font-size:48px;color:var(--vang)}
.the span{font-size:40px;line-height:1.25}
.the.tot{border-color:rgba(134,215,173,.7);background:rgba(134,215,173,.12)}.the.tot b{color:var(--xanh)}
.the.xau{border-color:rgba(242,166,90,.75);background:rgba(242,166,90,.12)}.the.xau b{color:var(--cam)}
.dt{position:relative;width:700px;height:770px;border-radius:52px;border:10px solid #24204a;background:#000;overflow:hidden;box-shadow:0 30px 80px rgba(0,0,0,.6),0 0 0 2px rgba(233,196,106,.45)}
.dt img{position:absolute;left:0;top:0;width:100%}
.dtnhan{position:absolute;left:0;right:0;top:1258px;text-align:center;font-size:28px;color:var(--mo)}
.anh-tt{width:620px;border-radius:26px;box-shadow:0 30px 80px rgba(0,0,0,.6);border:3px solid rgba(233,196,106,.5)}
.pt{width:940px;display:flex;flex-direction:column;gap:34px;align-items:center;text-align:center}
.pt div{font-family:NR,serif;font-weight:600;font-size:64px;line-height:1.15;color:#fff}
.pt div:last-child{color:var(--vang);font-size:82px}
.cap{position:absolute;left:70px;right:150px;top:1330px;bottom:auto;display:flex;align-items:flex-start;justify-content:center}
.cap div{background:rgba(10,9,26,.82);border:2px solid rgba(233,196,106,.35);color:#fff;font-size:54px;line-height:1.28;padding:24px 34px;border-radius:26px;text-align:center}
.cap b{color:var(--vang);font-weight:600}
.cta{position:absolute;left:0;right:0;top:420px;display:flex;flex-direction:column;align-items:center;gap:30px}
.cta .dt{width:430px;height:600px;border-radius:46px}
.cta .hang{display:flex;align-items:center;gap:34px}
.cta .qr{background:#fff;padding:14px;border-radius:20px}
.cta .w{font-family:NR,serif;font-weight:600;font-size:84px;color:#fff}.cta .w em{font-style:normal;color:var(--vang)}
.cta .d{font-size:32px;color:var(--mo);max-width:470px;line-height:1.3}
`;

function vongSvg(muc, giua, lop = {}) {
  const n = muc.length, R = n > 9 ? 290 : 280, r = n > 9 ? 56 : n > 6 ? 66 : 84, fs = n > 9 ? 30 : n > 6 ? 27 : 26;
  const vi = muc.map((m, i) => { const a = -Math.PI / 2 + (i * 2 * Math.PI) / n; return { m, x: 360 + R * Math.cos(a), y: 360 + R * Math.sin(a) }; });
  const nut = (p, cls, fill, stroke, mauChu) => `<g class="${cls}" style="transform-origin:${p.x}px ${p.y}px"><circle cx="${p.x}" cy="${p.y}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="4"/>
    <text x="${p.x}" y="${p.y + fs * 0.36}" text-anchor="middle" font-family="NR" font-size="${fs}" fill="${mauChu}">${e(p.m)}</text></g>`;
  const nen = vi.map((p, i) => nut(p, `n n${i}`, "#1b1840", "rgba(233,196,106,.55)", "#f6efdf")).join("");
  const sang = vi.map((p, i) => {
    const kieu = (lop.tot ?? []).includes(p.m) ? ["#1f4a3a", "#86d7ad", "#e8fff3"] : (lop.xau ?? []).includes(p.m) ? ["#4a2c16", "#f2a65a", "#fff1e2"]
      : (lop.sang ?? []).includes(p.m) ? ["#e9c46a", "#e9c46a", "#1a1630"] : null;
    return kieu ? nut(p, `s s${i}`, ...kieu) : "";
  }).join("");
  return { html: `<svg width="720" height="720" viewBox="0 0 720 720">
    <circle cx="360" cy="360" r="${R}" fill="none" stroke="rgba(233,196,106,.25)" stroke-width="3" stroke-dasharray="6 12"/>
    ${nen}${sang}<text class="giua" x="360" y="378" text-anchor="middle" font-family="NR" font-size="64" fill="#e9c46a">${e(giua ?? "")}</text></svg>`, vi, r };
}

function dungVideo(v) {
  const hinh = HINH[v.ma];
  const thu = path.join(RA, "du-an", v.ma); fs.rmSync(thu, { recursive: true, force: true });
  fs.mkdirSync(path.join(thu, "assets"), { recursive: true });
  const chep = (tu, ten = path.basename(tu)) => { fs.copyFileSync(tu, path.join(thu, "assets", ten)); return `assets/${ten}`; };
  for (const f of ["BeVietnamPro-SemiBold.ttf", "Newsreader.ttf"]) chep(path.join(GOC, "cms/assets/fonts", f));
  fs.copyFileSync(path.join(TAI_SAN, "gsap.min.js"), path.join(thu, "gsap.min.js"));

  const tl = []; // [biểu thức GSAP]
  let t0 = 0; const canh = [], caps = [], am = [], moc = [];
  v.canh.forEach((c, i) => {
    const g = GIONG[`${v.ma}-${i + 1}`]; if (!g) throw new Error(`thiếu giọng ${v.ma}-${i + 1}`);
    const dai = +(TRUOC + g.giay + SAU).toFixed(2), h = hinh[i], id = `c${i}`;
    moc.push(t0.toFixed(2));
    am.push(`<audio id="g${i}" src="${chep(g.tep, `giong-${i}.mp3`)}" data-start="${(t0 + TRUOC).toFixed(2)}" data-duration="${g.giay.toFixed(2)}"></audio>`);
    let than = "";
    if (h.loai === "mo_dau") {
      than = `<div class="nhan">${e(h.nhan)}</div><div class="vung">${h.vong ? vongSvg(h.vong.muc, h.vong.giua, { sang: h.vong.sang }).html : `<div class="lon">${e(h.lon)}</div>`}</div>`;
      tl.push(`tl.from("#${id} .nhan",{opacity:0,x:-40,duration:.5},${t0.toFixed(2)});`);
      if (h.vong) {
        tl.push(`tl.from("#${id} .n",{scale:0,opacity:0,duration:.45,ease:"back.out(1.7)",stagger:.05},${(t0 + .2).toFixed(2)});`);
        tl.push(`tl.from("#${id} .s",{scale:0,opacity:0,duration:.5,ease:"back.out(2)",stagger:.25},${(t0 + 1.4).toFixed(2)});`);
        tl.push(`tl.from("#${id} .giua",{opacity:0,duration:.6},${(t0 + 1).toFixed(2)});`);
        tl.push(`tl.to("#${id} .vung svg",{rotation:8,duration:${dai},ease:"none"},${t0.toFixed(2)});`);
      } else tl.push(`tl.from("#${id} .lon",{scale:.4,opacity:0,duration:.8,ease:"back.out(1.6)"},${(t0 + .3).toFixed(2)});`);
    } else if (h.loai === "the") {
      than = `<div class="vung"><div class="ds">${h.muc.map((m) => `<div class="the ${m.mau ?? ""}"><b>${e(m.k)}</b><span>${e(m.v)}</span></div>`).join("")}</div></div>`;
      const buoc = Math.min(1.1, (dai - 1.4) / h.muc.length);
      tl.push(`tl.from("#${id} .the",{opacity:0,x:120,duration:.5,ease:"power3.out",stagger:${buoc.toFixed(2)}},${(t0 + .4).toFixed(2)});`);
    } else if (h.loai === "dien_thoai") {
      const src = chep(path.join(TAI_SAN, h.anh)); const k = kichAnh(path.join(TAI_SAN, h.anh)); const tile = 680 / k.w;
      const den = Math.min(h.den, k.h - 750 / tile);
      than = `<div class="vung"><div class="dt"><img src="${src}"></div></div><div class="dtnhan">${e(h.nhan)}</div>`;
      tl.push(`tl.from("#${id} .dt",{opacity:0,y:80,scale:.92,duration:.7,ease:"power3.out"},${t0.toFixed(2)});`);
      tl.push(`tl.fromTo("#${id} .dt img",{y:${-Math.round(h.tu * tile)}},{y:${-Math.round(den * tile)},duration:${(dai - 1.6).toFixed(2)},ease:"power1.inOut"},${(t0 + .9).toFixed(2)});`);
    } else if (h.loai === "anh_engine") {
      const src = chep(path.join(TAI_SAN, h.anh));
      than = `<div class="vung"><img class="anh-tt" src="${src}"></div><div class="dtnhan">${e(h.nhan)} · ảnh do engine Hiểu Bản Thân dựng</div>`;
      tl.push(`tl.from("#${id} .anh-tt",{opacity:0,y:70,duration:.7,ease:"power3.out"},${t0.toFixed(2)});`);
      tl.push(`tl.to("#${id} .anh-tt",{scale:1.06,duration:${dai},ease:"none"},${t0.toFixed(2)});`);
    } else if (h.loai === "phep_tinh") {
      than = `<div class="vung"><div class="pt">${h.dong.map((d) => `<div>${e(d)}</div>`).join("")}</div></div>`;
      const buoc = Math.min(1.6, (dai - 1.2) / h.dong.length);
      tl.push(`tl.from("#${id} .pt div",{opacity:0,y:50,duration:.5,ease:"power3.out",stagger:${buoc.toFixed(2)}},${(t0 + .3).toFixed(2)});`);
    } else if (h.loai === "vong") {
      than = `<div class="vung">${vongSvg(h.muc, h.giua, { tot: h.tot, xau: h.xau }).html}</div>`;
      tl.push(`tl.from("#${id} .n",{scale:0,opacity:0,duration:.4,ease:"back.out(1.7)",stagger:.08},${(t0 + .2).toFixed(2)});`);
      tl.push(`tl.from("#${id} .s",{scale:0,opacity:0,duration:.45,ease:"back.out(2)",stagger:${((dai - 2) / h.muc.length).toFixed(2)}},${(t0 + 1).toFixed(2)});`);
    } else if (h.loai === "dem") {
      const { html, vi, r } = vongSvg(h.muc, "");
      const vong = Array.from({ length: h.buoc + 1 }, (_, k) => vi[(h.bat_dau + k) % vi.length]);
      than = `<div class="vung" style="position:absolute">${html}</div>
        ${vong.map((p, k) => `<div class="tro tro${k}" style="position:absolute;left:${180 + p.x - r - 12}px;top:${450 + 40 + p.y - r - 12}px;width:${2 * r + 24}px;height:${2 * r + 24}px;border-radius:50%;border:8px solid #e9c46a;box-shadow:0 0 40px #e9c46a;opacity:0"></div>`).join("")}
        <div class="dem-dau" style="position:absolute;left:0;right:0;top:1180px;text-align:center;font-family:NR;font-size:56px;color:#fff">${e(h.nhan_dau)}</div>
        <div class="dem-cuoi" style="position:absolute;left:0;right:0;top:1180px;text-align:center;font-family:NR;font-size:60px;color:#e9c46a;opacity:0">${e(h.nhan_cuoi)}</div>`;
      tl.push(`tl.from("#${id} .n",{scale:0,opacity:0,duration:.4,ease:"back.out(1.7)",stagger:.06},${(t0 + .1).toFixed(2)});`);
      const b = (dai - 2.2) / (h.buoc + 1);
      vong.forEach((_, k) => {
        const tk = t0 + 0.9 + k * b;
        tl.push(`tl.set("#${id} .tro${k}",{opacity:1},${tk.toFixed(2)});`);
        if (k < vong.length - 1) tl.push(`tl.set("#${id} .tro${k}",{opacity:0},${(tk + b).toFixed(2)});`);
      });
      tl.push(`tl.set("#${id} .dem-dau",{opacity:0},${(t0 + 0.9 + h.buoc * b).toFixed(2)});`);
      tl.push(`tl.to("#${id} .dem-cuoi",{opacity:1,duration:.4},${(t0 + 0.9 + h.buoc * b).toFixed(2)});`);
    } else if (h.loai === "cta") {
      const src = chep(path.join(TAI_SAN, h.anh)); const k = kichAnh(path.join(TAI_SAN, h.anh)); const tile = 410 / k.w;
      than = `<div class="cta"><div class="dt"><img src="${src}"></div>
        <div class="hang"><div class="qr">${qrSvg(h.url, 210)}</div><div><div class="w">hieuban<em>.com</em></div><div class="d">${e(h.dong)}</div></div></div></div>`;
      tl.push(`tl.from("#${id} .cta .dt",{opacity:0,y:80,duration:.6,ease:"power3.out"},${t0.toFixed(2)});`);
      tl.push(`tl.fromTo("#${id} .cta .dt img",{y:0},{y:${-Math.round(Math.min(900, k.h - 580 / tile) * tile)},duration:${(dai - .8).toFixed(2)},ease:"power1.inOut"},${(t0 + .6).toFixed(2)});`);
      tl.push(`tl.from("#${id} .hang",{opacity:0,scale:.85,duration:.6,ease:"back.out(1.6)"},${(t0 + .5).toFixed(2)});`);
    }
    if (h.loai !== "cta") tl.push(`tl.from("#${id} h1",{opacity:0,y:40,duration:.55,ease:"power3.out"},${(t0 + .05).toFixed(2)});`);
    canh.push(`<div id="${id}" class="clip canh" data-start="${t0.toFixed(2)}" data-duration="${dai}" data-track-index="1">
      ${h.loai === "cta" ? "" : `<h1>${e(c.tieu)}</h1>`}${than}</div>`);
    // Phụ đề theo mẩu, thời lượng tỉ lệ số ký tự.
    const cum = phuDe(c.vo); const tong = cum.reduce((s, x) => s + x.length, 0); let t = t0 + TRUOC;
    cum.forEach((x, k) => {
      const d = (g.giay * x.length) / tong, a = k === 0 ? t0 : t, b = k === cum.length - 1 ? t0 + dai : t + d;
      caps.push(`<div class="clip cap" id="p${i}_${k}" data-start="${a.toFixed(2)}" data-duration="${(b - a).toFixed(2)}" data-track-index="2"${h.loai === "cta" ? ' style="top:1430px"' : ""}><div>${toDam(x)}</div></div>`);
      tl.push(`tl.from("#p${i}_${k} div",{opacity:0,y:16,duration:.2},${a.toFixed(2)});`);
      t += d;
    });
    t0 += dai;
  });
  const tong = +t0.toFixed(2);
  const wav = path.join(thu, "assets", "nhac.wav");
  execFileSync("python3", [path.join(DIR, "../v21-27/am-thanh.py"), wav, String(tong), v.ma, moc.join(",")], { stdio: "ignore" });
  am.push(`<audio id="nhac" src="assets/nhac.wav" data-start="0" data-duration="${tong}" data-volume="0.55" data-fade-out="1.2"></audio>`);
  const r = prng(v.ma.charCodeAt(1) * 7919);
  const sao = Array.from({ length: 70 }, (_, k) => { const s = 1 + r() * 3; return `<div class="sao s${k % 5}" style="left:${(r() * W).toFixed(0)}px;top:${(r() * H).toFixed(0)}px;width:${s.toFixed(1)}px;height:${s.toFixed(1)}px;opacity:${(0.25 + r() * 0.5).toFixed(2)}"></div>`; }).join("");
  for (let k = 0; k < 5; k++) tl.push(`tl.to("#root .sao.s${k}",{opacity:.9,duration:${(1.4 + k * .3).toFixed(1)},repeat:${Math.ceil(tong / (1.4 + k * .3))},yoyo:true,ease:"sine.inOut"},${(k * .4).toFixed(1)});`);
  const html = `<!doctype html>
<html lang="vi" data-resolution="portrait">
<head><meta charset="UTF-8"><meta name="viewport" content="width=${W}, height=${H}"><script src="gsap.min.js"></script><style>${CSS}</style></head>
<body>
<div id="root" data-composition-id="main" data-start="0" data-duration="${tong}" data-width="${W}" data-height="${H}">
  ${sao}
  <div class="clip" id="dau" data-start="0" data-duration="${tong}" data-track-index="0"><div class="dau">${LOGO}<span>hieuban.com</span></div></div>
  ${canh.join("\n  ")}
  ${caps.join("\n  ")}
  ${am.join("\n  ")}
</div>
<script>
  window.__timelines = window.__timelines || {};
  const tl = gsap.timeline({ paused: true });
  ${tl.join("\n  ")}
  window.__timelines["main"] = tl;
  tl.seek(0);
</script>
</body></html>`;
  fs.writeFileSync(path.join(thu, "index.html"), html);
  fs.writeFileSync(path.join(thu, "meta.json"), JSON.stringify({ id: v.ma, name: v.slug }));
  return { thu, tong };
}

fs.mkdirSync(path.join(RA, "hoan-chinh"), { recursive: true });
// CLI hyperframes cài cạnh thư mục tài sản (…/node_modules/hyperframes/bin/hyperframes.mjs) hoặc qua biến HF_BIN.
const HF = process.env.HF_BIN ?? path.join(path.dirname(createRequire(path.join(TAI_SAN, "x.js")).resolve("hyperframes/package.json")), "bin/hyperframes.mjs");
for (const v of KB.video) {
  if (CHON.length && !CHON.includes(v.ma)) continue;
  const { thu, tong } = dungVideo(v);
  const ra = path.join(RA, "hoan-chinh", `${v.ma}-${v.slug}.mp4`);
  execFileSync("node", [HF, "render", "-o", ra, "-q", "delivery", "--fps", "30"], { cwd: thu, stdio: ["ignore", "ignore", "inherit"],
    env: { ...process.env, DO_NOT_TRACK: "1", HYPERFRAMES_SKIP_SKILLS: "1" } });
  console.log(`${v.ma}: ${tong} giây → ${ra}`);
}
