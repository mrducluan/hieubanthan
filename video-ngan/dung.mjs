// Dựng dự án HyperFrames cho video 1–5 từ kich-ban.mjs.
//   node dung.mjs            → dựng cả 5 vào ban-dung/v0X/
//   node dung.mjs v01 v03    → chỉ dựng video chỉ định
// Có giọng thật (giong/<ma>/<canh>.json + .mp3 do tao-giong.mjs sinh) → cảnh dài theo giọng, phụ đề khớp từng câu.
// Chưa có giọng → thời lượng ước theo số âm tiết (≈ 4,6 âm tiết/giây), phụ đề vẫn chạy để duyệt nội dung + hình.
import fs from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { VIDEO, MIEN_TRU } from "./kich-ban.mjs";

const GOC = path.dirname(fileURLToPath(import.meta.url));
const W = 1080, H = 1920;
const TOC_DO = 4.2;        // âm tiết / giây khi chưa có giọng
const DAU_GIONG = 0.15;    // giọng vào sau đầu cảnh
const DUOI_CANH = 0.55;    // khoảng lặng cuối cảnh

const MAU = {
  nen: "#0A0A17", mat: "#12122A", mat2: "#1A1A38", vien: "#2A2A4D",
  chu: "#ECEBF7", mo: "#B3B1CF", nhat: "#8A88AC",
  vang: "#E9C46A", ngoc: "#6FD3B5", trang: "#B9A7FF", son: "#EF8A6F",
};

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const boTag = (s) => s.replace(/\[[^\]]*\]\s*/g, "").trim();
const amTiet = (s) => boTag(s).split(/\s+/).filter(Boolean).length;
const r3 = (x) => Math.round(x * 1000) / 1000;
/** "*vàng*" → span */
const toMau = (s) => esc(s).replace(/\*([^*]+)\*/g, '<span class="hl">$1</span>');

// Ngẫu nhiên có hạt (sao nền) — cùng hạt, cùng kết quả mỗi lần render.
function hat(n) { let x = n; return () => ((x = (x * 1664525 + 1013904223) % 4294967296) / 4294967296); }

// ---------------------------------------------------------------- CSS chung mọi cảnh
const PHONG = `
@font-face { font-family: "BVP"; src: url("assets/fonts/BeVietnamPro-400.ttf"); font-weight: 400; }
@font-face { font-family: "BVP"; src: url("assets/fonts/BeVietnamPro-600.ttf"); font-weight: 600; }
@font-face { font-family: "BVP"; src: url("assets/fonts/BeVietnamPro-800.ttf"); font-weight: 800; }
@font-face { font-family: "BVP"; src: url("assets/fonts/BeVietnamPro-900.ttf"); font-weight: 900; }
@font-face { font-family: "NR"; src: url("assets/fonts/Newsreader-500i.ttf"); font-weight: 500; font-style: italic; }`;

const CHUNG = `${PHONG}
#root { position: absolute; inset: 0; font-family: "BVP"; color: ${MAU.chu}; }
.khung { position: absolute; inset: 0; }
.hl { color: ${MAU.vang}; }
.tde { position: absolute; left: 90px; right: 90px; text-align: center; font-weight: 900; font-size: 100px; line-height: 1.12; letter-spacing: -0.02em; }
.tde .w { display: inline-block; }
.nho { position: absolute; left: 110px; right: 110px; text-align: center; font-weight: 600; font-size: 44px; line-height: 1.3; color: ${MAU.mo}; }
.serif { font-family: "NR"; font-style: italic; font-weight: 500; }
.the { position: absolute; background: rgba(18,18,42,0.92); border: 2px solid rgba(233,196,106,0.32); border-radius: 36px; box-shadow: 0 30px 80px rgba(0,0,0,0.45); }
.chip { display: inline-block; padding: 14px 30px; border-radius: 999px; background: rgba(233,196,106,0.12); border: 2px solid rgba(233,196,106,0.55); color: ${MAU.vang}; font-weight: 800; font-size: 38px; white-space: nowrap; }
`;

/** Cỡ chữ để một dòng vừa 880 px (chữ đậm ≈ 0,6 em mỗi ký tự). */
const co = (s, max = 100) => Math.min(max, Math.floor(880 / (s.replace(/\*/g, "").length * 0.6)));

/** Chữ tách từng từ để hiện lần lượt. */
function tachTu(s, lop = "w") {
  return s.split(/(\*[^*]+\*)/).filter(Boolean).flatMap((doan) => {
    const vang = doan.startsWith("*");
    const t = vang ? doan.slice(1, -1) : doan;
    return t.split(/\s+/).filter(Boolean).map((w) => `<span class="${lop}${vang ? " hl" : ""}">${esc(w)}</span>`);
  }).join(" ");
}

// ---------------------------------------------------------------- kiểu cảnh
// Mỗi hàm nhận (c, x) với x = { p: tiền tố id, d: thời lượng cảnh, moc: [{bd, kt}] mốc từng câu } và trả { css, html, js }.
// js dùng biến `tl` (timeline của cảnh). Mọi phần tử nằm trong một .clip phủ cả cảnh.

const KIEU = {
  hai_so(c, { p, d, moc }) {
    return {
      css: `
#${p}-tren { top: 270px; font-size: 64px; color: ${MAU.mo}; font-weight: 800; }
.${p}-dt { width: 400px; height: 600px; top: 420px; display: flex; flex-direction: column; align-items: center; justify-content: center; }
#${p}-a { left: 110px; } #${p}-b { right: 110px; }
.${p}-nhan { font-size: 38px; color: ${MAU.mo}; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; }
.${p}-so { font-size: 260px; font-weight: 900; line-height: 1; margin-top: 18px; }
#${p}-sa { color: ${MAU.son}; } #${p}-sb { color: ${MAU.vang}; }
#${p}-vs { position: absolute; left: 0; right: 0; top: 670px; text-align: center; font-size: 60px; font-weight: 900; color: ${MAU.nhat}; }
#${p}-hoi { top: 1060px; font-size: 150px; }`,
      html: `
<div id="${p}-tren" class="tde">${toMau(c.tieu_tren)}</div>
<div id="${p}-a" class="the ${p}-dt"><div class="${p}-nhan">${esc(c.nhan)}</div><div id="${p}-sa" class="${p}-so">${esc(c.so_trai)}</div></div>
<div id="${p}-b" class="the ${p}-dt"><div class="${p}-nhan">${esc(c.nhan)}</div><div id="${p}-sb" class="${p}-so">${esc(c.so_phai)}</div></div>
<div id="${p}-vs">vs</div>
<div id="${p}-hoi" class="tde">${toMau(c.tieu_de)}</div>`,
      js: `
tl.set("#${p}-a", {rotation:-6}, 0); tl.set("#${p}-b", {rotation:6}, 0);
tl.fromTo("#${p}-a", {rotation:-6}, {rotation:-9, x:-10, duration:0.5, ease:"power2.out"}, ${r3(moc[0].bd + (moc[0].kt - moc[0].bd) * 0.45)});
tl.fromTo("#${p}-sa", {scale:1}, {scale:1.15, duration:0.18, yoyo:true, repeat:1, ease:"power2.out"}, ${r3(moc[0].bd + (moc[0].kt - moc[0].bd) * 0.45)});
tl.fromTo("#${p}-b", {rotation:6}, {rotation:9, x:10, duration:0.5, ease:"power2.out"}, ${r3(moc[0].bd + (moc[0].kt - moc[0].bd) * 0.85)});
tl.fromTo("#${p}-sb", {scale:1}, {scale:1.15, duration:0.18, yoyo:true, repeat:1, ease:"power2.out"}, ${r3(moc[0].bd + (moc[0].kt - moc[0].bd) * 0.85)});
tl.fromTo("#${p}-hoi", {opacity:0, scale:1.25, filter:"blur(12px)"}, {opacity:1, scale:1, filter:"blur(0px)", duration:0.35, ease:"expo.out"}, ${r3(moc[1]?.bd ?? d * 0.6)});`,
      sfx: [{ f: "pop", t: moc[0].bd + (moc[0].kt - moc[0].bd) * 0.45, v: 0.4 }, { f: "pop", t: moc[0].bd + (moc[0].kt - moc[0].bd) * 0.85, v: 0.4 }, { f: "impact-bass-1", t: moc[1]?.bd ?? d * 0.6, v: 0.5 }],
    };
  },

  phep_tinh(c, { p, d, moc }) {
    const motDong = c.dong.length === 1;
    const bd = moc.length > 1 ? moc[1].bd : d * 0.2;
    const kt = moc[moc.length - 1].bd + 0.2;
    const buoc = (kt - bd) / c.dong.length;
    const hang = c.dong.map((h, i) => {
      const top = motDong ? 560 : 470 + i * 150;
      return `<div id="${p}-h${i}" class="${p}-hang${h.lon ? " lon" : ""}" style="top:${top}px">
  <span class="${p}-bt">${h.chu.split("").map((ch) => `<span class="${p}-k">${esc(ch)}</span>`).join("")}</span>
  ${motDong ? "" : `<span class="${p}-kq" id="${p}-q${i}">${esc(h.ket)}</span>`}</div>`;
    }).join("\n");
    const js = c.dong.map((h, i) => {
      const t = bd + i * buoc;
      const soK = h.chu.length;
      const go = Math.min(buoc * 0.55, soK * 0.045);
      return `
tl.fromTo("#${p}-h${i}", {opacity:0}, {opacity:1, duration:0.01}, ${r3(t)});
tl.fromTo("#${p}-h${i} .${p}-k", {opacity:0, y:14}, {opacity:1, y:0, duration:0.12, stagger:${r3(go / soK)}, ease:"power2.out"}, ${r3(t)});
${motDong ? "" : `tl.fromTo("#${p}-q${i}", {opacity:0, scale:0.3}, {opacity:1, scale:1, duration:0.35, ease:"back.out(2.2)"}, ${r3(t + go + 0.1)});`}`;
    }).join("");
    const lon = motDong ? `
#${p}-to { position:absolute; left:0; right:0; top:740px; text-align:center; font-size:340px; font-weight:900; color:${MAU.vang}; line-height:1; text-shadow: 0 0 60px rgba(233,196,106,0.35); }
#${p}-bac { position:absolute; left:0; right:0; top:1100px; text-align:center; }` : "";
    const soCuoi = c.dong[0].ket;
    return {
      css: `
#${p}-ngay { position:absolute; left:0; right:0; top:270px; text-align:center; font-size:96px; color:${MAU.chu}; }
.${p}-hang { position:absolute; left:90px; right:90px; display:flex; align-items:center; justify-content:space-between; gap:24px; }
.${p}-bt { font-size:${motDong ? 70 : 54}px; font-weight:700; color:${MAU.mo}; white-space:nowrap; ${motDong ? "width:100%; text-align:center;" : ""} }
.${p}-k { display:inline-block; white-space:pre; }
.${p}-kq { min-width:118px; height:118px; border-radius:999px; display:flex; align-items:center; justify-content:center; background:rgba(233,196,106,0.14); border:3px solid ${MAU.vang}; color:${MAU.vang}; font-size:64px; font-weight:900; }
.${p}-hang.lon .${p}-bt { color:${MAU.chu}; font-size:60px; }
.${p}-hang.lon .${p}-kq { min-width:150px; height:150px; font-size:96px; background:${MAU.vang}; color:${MAU.nen}; }
${lon}`,
      html: `
<div id="${p}-ngay" class="serif">${esc(c.ngay)}</div>
${hang}
${motDong ? `<div id="${p}-to">0</div>${c.nhan ? `<div id="${p}-bac"><span class="chip">${esc(c.nhan)}</span></div>` : ""}` : ""}`,
      js: `
tl.fromTo("#${p}-ngay", {opacity:0, y:-30, filter:"blur(8px)"}, {opacity:1, y:0, filter:"blur(0px)", duration:0.45, ease:"expo.out"}, 0.1);
${js}
${motDong ? `const ${p}N = {v:0};
tl.fromTo("#${p}-to", {opacity:0, scale:0.6}, {opacity:1, scale:1, duration:0.4, ease:"expo.out"}, ${r3(kt - 0.1)});
tl.to(${p}N, {v:${Number(soCuoi)}, duration:0.8, ease:"power3.out", onUpdate:()=>{document.querySelector("#${p}-to").textContent=Math.round(${p}N.v);}}, ${r3(kt - 0.1)});
${c.nhan ? `tl.fromTo("#${p}-bac", {opacity:0, y:30}, {opacity:1, y:0, duration:0.4, ease:"back.out(1.6)"}, ${r3(kt + 0.6)});` : ""}` : ""}`,
      sfx: [
        ...c.dong.map((_, i) => ({ f: "key-press", t: bd + i * buoc, v: 0.35 })),
        ...(motDong ? [{ f: "pop", t: kt + 0.6 }] : c.dong.map((h, i) => ({ f: "pop", t: bd + i * buoc + Math.min(buoc * 0.55, h.chu.length * 0.045) + 0.1, v: 0.5 }))),
      ],
    };
  },

  man_hinh(c, { p, d }) {
    // Khung điện thoại: rộng trong 720, cao trong 860; ảnh chụp 975 px rộng (390 CSS px × 2,5).
    const RT = 720, CT = 860, CAO_ANH = Math.round(2110 * RT / 975);
    const pan = CAO_ANH - CT;
    const doi = c.anh_sau ? (c.doi_luc ?? 0.5) * d : d;
    const [a, b] = c.truot ?? [0, 0.2];
    const chip = (c.nhan_noi ?? []).map((n, i) => `<div id="${p}-n${i}" class="${p}-n" style="top:1068px"><span class="chip">${esc(n.chu)}</span></div>`).join("");
    const jsChip = (c.nhan_noi ?? []).map((n, i) => `
tl.fromTo("#${p}-n${i}", {opacity:0, y:30, scale:0.9}, {opacity:1, y:0, scale:1, duration:0.4, ease:"back.out(1.7)"}, ${r3(Math.max(0.5, n.tre * d))});${i < c.nhan_noi.length - 1 ? `
tl.to("#${p}-n${i}", {opacity:0, y:-20, duration:0.2, ease:"power2.in"}, ${r3(Math.max(0.5, c.nhan_noi[i + 1].tre * d) - 0.2)});` : ""}`).join("");
    return {
      css: `
#${p}-dt { position:absolute; left:${(W - RT) / 2 - 18}px; top:226px; width:${RT + 36}px; height:${CT + 36}px; border-radius:64px; background:#05050d; border:3px solid rgba(233,196,106,0.45); box-shadow: 0 40px 120px rgba(0,0,0,0.6), 0 0 0 10px rgba(185,167,255,0.06); }
#${p}-man { position:absolute; left:18px; top:18px; width:${RT}px; height:${CT}px; border-radius:48px; overflow:hidden; background:${MAU.nen}; }
.${p}-anh { position:absolute; left:0; top:0; width:${RT}px; height:auto; }
.${p}-n { position:absolute; left:0; right:0; text-align:center; }
.${p}-n .chip { background: ${MAU.nen}; box-shadow: 0 16px 40px rgba(0,0,0,0.55); font-size:40px; }`,
      html: `
<div id="${p}-dt"><div id="${p}-man" data-layout-allow-overflow>
  <img id="${p}-a1" class="${p}-anh" src="assets/anh/${c.anh}" alt="" />
  ${c.anh_sau ? `<img id="${p}-a2" class="${p}-anh" src="assets/anh/${c.anh_sau}" alt="" />` : ""}
</div></div>
${chip}`,
      js: `
tl.fromTo("#${p}-dt", {opacity:0, y:140, scale:0.92}, {opacity:1, y:0, scale:1, duration:0.65, ease:"expo.out"}, 0);
tl.fromTo("#${p}-a1", {y:${-Math.round(pan * a)}}, {y:${-Math.round(pan * b)}, duration:${r3(Math.max(0.5, doi - 0.6))}, ease:"power2.inOut"}, 0.5);
${c.anh_sau ? `
tl.fromTo("#${p}-a2", {opacity:0, y:0, filter:"blur(10px)"}, {opacity:1, filter:"blur(0px)", duration:0.25, ease:"power2.out"}, ${r3(doi)});
tl.to("#${p}-a1", {opacity:0, filter:"blur(10px)", duration:0.2, ease:"power2.in"}, ${r3(doi)});
tl.to("#${p}-a2", {y:${-Math.round(pan * 0.18)}, duration:${r3(Math.max(0.5, d - doi - 0.8))}, ease:"power2.inOut"}, ${r3(doi + 0.4)});` : ""}
${jsChip}`,
      sfx: [{ f: "whoosh-short", t: 0.05, v: 0.45 }, ...(c.anh_sau ? [{ f: "click-soft", t: doi, v: 0.5 }] : []), ...(c.nhan_noi ?? []).map((n) => ({ f: "pop", t: Math.max(0.5, n.tre * d), v: 0.4 }))],
    };
  },

  chu(c, { p, d, moc }) {
    const n = c.dong.length;
    const fs = Math.min(...c.dong.map((x) => co(x, 104)));
    const cao = Math.round(fs * 1.18), dau = 640 - (n * cao) / 2;
    const dong = c.dong.map((s, i) => `<div id="${p}-d${i}" class="tde" style="top:${dau + i * cao}px; font-size:${fs}px; white-space:nowrap">${tachTu(s)}</div>`).join("");
    const tPhu = moc.length > 1 ? moc[moc.length - 1].bd : d * 0.6;
    return {
      css: `#${p}-phu { top:${dau + n * cao + 70}px; color:${MAU.vang}; font-weight:800; }`,
      html: `${dong}${c.phu ? `<div id="${p}-phu" class="nho">${esc(c.phu)}</div>` : ""}`,
      js: c.dong.map((_, i) => `
tl.fromTo("#${p}-d${i} .w", {opacity:0, filter:"blur(8px)"}, {opacity:1, filter:"blur(0px)", duration:0.14, stagger:0.075, ease:"power3.out"}, ${r3(0.1 + i * Math.min(0.9, (tPhu - 0.2) / n))});`).join("") +
        (c.phu ? `
tl.fromTo("#${p}-phu", {opacity:0, y:24}, {opacity:1, y:0, duration:0.4, ease:"expo.out"}, ${r3(tPhu)});` : ""),
      sfx: [{ f: "whoosh", t: 0.02, v: 0.35 }],
    };
  },

  cta(c, { p, d, moc, video }) {
    const duong = video.duong_cta ?? video.duong;
    const tChip = moc.length > 1 ? moc[1].bd : d * 0.5;
    return {
      css: `
#${p}-logo { position:absolute; left:0; right:0; top:250px; display:flex; flex-direction:column; align-items:center; gap:18px; }
#${p}-ten { font-size:60px; color:${MAU.chu}; }
#${p}-mien { position:absolute; left:0; right:0; top:520px; text-align:center; font-size:136px; font-weight:900; color:${MAU.vang}; letter-spacing:-0.03em; text-shadow: 0 0 70px rgba(233,196,106,0.35); }
#${p}-duong { position:absolute; left:0; right:0; top:700px; text-align:center; }
#${p}-duong span { display:inline-block; padding:16px 40px; border-radius:24px; background:${MAU.mat2}; border:2px solid ${MAU.vien}; font-size:${duong.length > 16 ? 46 : 56}px; font-weight:800; color:${MAU.chu}; }
#${p}-chips { position:absolute; left:90px; right:90px; top:850px; display:flex; flex-wrap:wrap; justify-content:center; gap:18px 18px; }
#${p}-chips .chip { font-size:34px; padding:12px 26px; }
#${p}-mt { position:absolute; left:120px; right:120px; top:1075px; text-align:center; font-size:28px; color:${MAU.nhat}; font-weight:400; }`,
      html: `
<div id="${p}-logo"><svg width="120" height="120" viewBox="0 0 120 120"><circle cx="60" cy="60" r="54" fill="none" stroke="${MAU.vang}" stroke-width="4"/><path d="M60 14 L68 52 L106 60 L68 68 L60 106 L52 68 L14 60 L52 52 Z" fill="${MAU.vang}"/></svg><div id="${p}-ten" class="serif">Hiểu Bản Thân</div></div>
<div id="${p}-mien">hieuban.com</div>
<div id="${p}-duong"><span>${esc(duong)}</span></div>
<div id="${p}-chips">${c.chip.map((s, i) => `<span class="chip" id="${p}-c${i}">${esc(s)}</span>`).join("")}</div>
<div id="${p}-mt">${esc(MIEN_TRU)}</div>`,
      js: `
tl.fromTo("#${p}-logo", {opacity:0, scale:0.7, rotation:-30}, {opacity:1, scale:1, rotation:0, duration:0.7, ease:"expo.out"}, 0.05);
tl.fromTo("#${p}-mien", {opacity:0, scale:1.3, filter:"blur(16px)"}, {opacity:1, scale:1, filter:"blur(0px)", duration:0.45, ease:"expo.out"}, 0.35);
tl.fromTo("#${p}-duong", {opacity:0, y:30}, {opacity:1, y:0, duration:0.4, ease:"expo.out"}, 0.75);
tl.fromTo("#${p}-chips .chip", {opacity:0, y:24, scale:0.9}, {opacity:1, y:0, scale:1, duration:0.35, stagger:0.12, ease:"back.out(1.7)"}, ${r3(tChip)});
tl.fromTo("#${p}-mt", {opacity:0}, {opacity:1, duration:0.4}, ${r3(Math.min(d - 4, tChip + 0.6))});`,
      sfx: [{ f: "sparkle", t: 0.4, v: 0.55 }, { f: "pop", t: tChip, v: 0.4 }],
    };
  },

  pin(c, { p, d, moc }) {
    const t2 = moc[1]?.bd ?? d * 0.5;
    return {
      css: `
#${p}-d0 { top:300px; font-size:${co(c.dong[0], 96)}px; white-space:nowrap; } #${p}-d1 { top:440px; font-size:${co(c.dong[1], 80)}px; white-space:nowrap; color:${MAU.mo}; }
#${p}-pin { position:absolute; left:290px; top:720px; width:440px; height:220px; border:10px solid ${MAU.chu}; border-radius:40px; padding:18px; }
#${p}-dau { position:absolute; left:740px; top:785px; width:34px; height:90px; border-radius:0 16px 16px 0; background:${MAU.chu}; }
#${p}-ruot { height:100%; width:100%; border-radius:20px; background:${MAU.ngoc}; transform-origin:left center; }
#${p}-pt { position:absolute; left:0; right:0; top:1000px; text-align:center; font-size:72px; font-weight:900; color:${MAU.ngoc}; }`,
      html: `
<div id="${p}-d0" class="tde">${tachTu(c.dong[0])}</div>
<div id="${p}-d1" class="tde">${tachTu(c.dong[1])}</div>
<div id="${p}-pin"><div id="${p}-ruot"></div></div><div id="${p}-dau"></div>
<div id="${p}-pt">100%</div>`,
      js: `
tl.fromTo("#${p}-d0 .w", {opacity:0, filter:"blur(8px)"}, {opacity:1, filter:"blur(0px)", duration:0.14, stagger:0.07}, 0.05);
tl.fromTo("#${p}-d1 .w", {opacity:0, filter:"blur(8px)"}, {opacity:1, filter:"blur(0px)", duration:0.14, stagger:0.07}, ${r3(t2)});
tl.fromTo(["#${p}-pin", "#${p}-dau"], {opacity:0, scale:0.8}, {opacity:1, scale:1, duration:0.5, ease:"expo.out"}, 0.2);
const ${p}P = {v:100};
tl.to(${p}P, {v:8, duration:${r3(Math.max(1, d - 1.2))}, ease:"power2.in", onUpdate:()=>{
  const v = ${p}P.v; const r = document.querySelector("#${p}-ruot"); r.style.transform = "scaleX(" + (v/100) + ")";
  const m = v > 50 ? "${MAU.ngoc}" : v > 25 ? "${MAU.vang}" : "${MAU.son}"; r.style.background = m;
  const t = document.querySelector("#${p}-pt"); t.textContent = Math.round(v) + "%"; t.style.color = m; }}, 0.5);`,
      sfx: [{ f: "whoosh-cinematic", t: t2, v: 0.35 }],
    };
  },

  keo_hai_huong(c, { p, d, moc }) {
    const t2 = moc[1]?.bd ?? d * 0.4;
    return {
      css: `
#${p}-tit { top:290px; font-size:${co("Hai con số kéo về hai hướng", 84)}px; white-space:nowrap; }
#${p}-ban { position:absolute; left:440px; top:640px; width:200px; height:200px; border-radius:999px; background:${MAU.mat2}; border:4px solid ${MAU.chu}; display:flex; align-items:center; justify-content:center; font-size:52px; font-weight:900; }
.${p}-mui { position:absolute; top:690px; width:300px; height:100px; }
#${p}-trai { left:110px; } #${p}-phai { right:110px; }
.${p}-nh { position:absolute; top:900px; width:380px; text-align:center; font-size:52px; font-weight:900; }
#${p}-nt { left:60px; color:${MAU.trang}; } #${p}-np { right:60px; color:${MAU.vang}; }`,
      html: `
<div id="${p}-tit" class="tde">${tachTu("Hai con số *kéo về hai hướng*")}</div>
<svg id="${p}-trai" class="${p}-mui" viewBox="0 0 300 100"><path d="M290 50 H40 M70 15 L30 50 L70 85" stroke="${MAU.trang}" stroke-width="14" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
<svg id="${p}-phai" class="${p}-mui" viewBox="0 0 300 100"><path d="M10 50 H260 M230 15 L270 50 L230 85" stroke="${MAU.vang}" stroke-width="14" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
<div id="${p}-ban">Bạn</div>
<div id="${p}-nt" class="${p}-nh">${esc(c.trai)}</div><div id="${p}-np" class="${p}-nh">${esc(c.phai)}</div>`,
      js: `
tl.fromTo("#${p}-ban", {opacity:0, scale:0.5}, {opacity:1, scale:1, duration:0.5, ease:"back.out(1.8)"}, 0.1);
tl.fromTo("#${p}-tit .w", {opacity:0, filter:"blur(8px)"}, {opacity:1, filter:"blur(0px)", duration:0.14, stagger:0.075}, ${r3(t2)});
tl.fromTo("#${p}-trai", {opacity:0, x:120}, {opacity:1, x:0, duration:0.5, ease:"expo.out"}, ${r3(t2 + 0.3)});
tl.fromTo("#${p}-phai", {opacity:0, x:-120}, {opacity:1, x:0, duration:0.5, ease:"expo.out"}, ${r3(t2 + 0.45)});
tl.fromTo(["#${p}-nt","#${p}-np"], {opacity:0, y:20}, {opacity:1, y:0, duration:0.4, stagger:0.15}, ${r3(t2 + 0.7)});
tl.to("#${p}-ban", {x:-14, duration:0.18, ease:"sine.inOut"}, ${r3(t2 + 1.3)});
tl.to("#${p}-ban", {x:14, duration:0.36, ease:"sine.inOut"}, ${r3(t2 + 1.48)});
tl.to("#${p}-ban", {x:0, scaleX:1.12, scaleY:0.92, duration:0.4, ease:"power2.out"}, ${r3(t2 + 1.84)});`,
      sfx: [{ f: "whoosh", t: t2 + 0.3, v: 0.35 }],
    };
  },

  hai_vong(c, { p, d, moc }) {
    const t = (i, f = d * (0.2 + i * 0.2)) => r3(moc[i]?.bd ?? f);
    return {
      css: `
#${p}-ngoai { position:absolute; left:200px; top:360px; width:680px; height:680px; border-radius:999px; border:24px solid rgba(233,196,106,0.75); }
#${p}-trong { position:absolute; left:370px; top:530px; width:340px; height:340px; border-radius:999px; background:radial-gradient(circle, rgba(185,167,255,0.55), rgba(185,167,255,0.12)); border:4px solid ${MAU.trang}; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; }
.${p}-ten { font-size:54px; font-weight:900; } .${p}-ng { font-size:28px; font-weight:600; color:${MAU.mo}; margin-top:6px; }
#${p}-nhanNgoai { position:absolute; left:0; right:0; top:268px; text-align:center; }
.${p}-so { position:absolute; left:0; right:0; text-align:center; font-weight:900; line-height:1; }
#${p}-s7 { top:610px; font-size:150px; color:${MAU.chu}; }
#${p}-c7 { position:absolute; left:0; right:0; top:900px; text-align:center; }
#${p}-s3 { top:300px; }
#${p}-s3 span, #${p}-c7 span { display:inline-block; padding:12px 30px; border-radius:22px; background:${MAU.nen}; border:3px solid currentColor; font-size:40px; font-weight:800; }
#${p}-s3 span { color:${MAU.vang}; } #${p}-c7 span { color:${MAU.trang}; }
#${p}-s3 b, #${p}-c7 b { font-size:64px; margin-right:14px; vertical-align:-6px; }
#${p}-ket { top:600px; font-size:${co(c.ket, 84)}px; white-space:nowrap; }`,
      html: `
<div id="${p}-ngoai"></div>
<div id="${p}-nhanNgoai"><span class="${p}-ten hl">${esc(c.ngoai.ten)}</span> <span class="${p}-ng">· ${esc(c.ngoai.nguon)}</span></div>
<div id="${p}-trong"><div class="${p}-ten">${esc(c.trong.ten)}</div><div class="${p}-ng">${esc(c.trong.nguon)}</div></div>
<div id="${p}-s7" class="${p}-so">${esc(c.trong.vd)}</div><div id="${p}-c7"><span><b>${esc(c.trong.vd)}</b>${esc(c.trong.nghia)}</span></div>
<div id="${p}-s3" class="${p}-so"><span><b>${esc(c.ngoai.vd)}</b>${esc(c.ngoai.nghia)}</span></div>
<div id="${p}-ket" class="tde">${tachTu(c.ket.replace("trong cạn pin", "*trong cạn pin*"))}</div>`,
      js: `
tl.fromTo("#${p}-trong", {opacity:0, scale:0.4}, {opacity:1, scale:1, duration:0.6, ease:"expo.out"}, ${t(0, 0.1)});
tl.fromTo("#${p}-ngoai", {opacity:0, scale:1.3}, {opacity:1, scale:1, duration:0.7, ease:"expo.out"}, ${t(1)});
tl.fromTo("#${p}-nhanNgoai", {opacity:0, y:-20}, {opacity:1, y:0, duration:0.4}, ${r3((moc[1]?.bd ?? d * 0.4) + 0.3)});
tl.to("#${p}-trong > div", {opacity:0, duration:0.2}, ${t(2)});
tl.fromTo("#${p}-s7", {opacity:0, scale:0.4}, {opacity:1, scale:1, duration:0.45, ease:"back.out(2)"}, ${t(2)});
tl.fromTo("#${p}-c7", {opacity:0, y:20}, {opacity:1, y:0, duration:0.35}, ${r3((moc[2]?.bd ?? d * 0.6) + 0.5)});
tl.to("#${p}-nhanNgoai", {opacity:0, duration:0.2}, ${r3((moc[2]?.bd ?? d * 0.6) + 1.4)});
tl.fromTo("#${p}-s3", {opacity:0, scale:0.6}, {opacity:1, scale:1, duration:0.45, ease:"back.out(2)"}, ${r3((moc[2]?.bd ?? d * 0.6) + 1.6)});
tl.to(["#${p}-ngoai", "#${p}-trong", "#${p}-s7", "#${p}-c7", "#${p}-s3"], {opacity:0.12, filter:"blur(4px)", duration:0.4}, ${t(3, d * 0.85)});
tl.fromTo("#${p}-ket .w", {opacity:0, filter:"blur(8px)"}, {opacity:1, filter:"blur(0px)", duration:0.14, stagger:0.08}, ${r3((moc[3]?.bd ?? d * 0.85) + 0.2)});`,
      sfx: [{ f: "pop", t: moc[2]?.bd ?? d * 0.6, v: 0.45 }, { f: "pop", t: (moc[2]?.bd ?? d * 0.6) + 1.6, v: 0.45 }],
    };
  },

  ban_ve(c, { p, d, moc }) {
    const t2 = moc[1]?.bd ?? d * 0.5;
    const luoi = Array.from({ length: 12 }, (_, i) => `<line x1="${i * 80}" y1="0" x2="${i * 80}" y2="720" /><line x1="0" y1="${i * 80}" x2="880" y2="${i * 80}" />`).join("");
    return {
      css: `
#${p}-d0 { top:250px; font-size:${co(c.dong[0], 92)}px; white-space:nowrap; } #${p}-d1 { top:1040px; font-size:${co(c.dong[1], 76)}px; white-space:nowrap; }
#${p}-bv { position:absolute; left:100px; top:400px; width:880px; height:620px; }
#${p}-dau { position:absolute; left:610px; top:430px; padding:14px 34px; border:8px solid ${MAU.son}; border-radius:20px; color:${MAU.son}; font-size:96px; font-weight:900; }`,
      html: `
<div id="${p}-d0" class="tde">${tachTu(c.dong[0])}</div>
<svg id="${p}-bv" viewBox="0 0 880 620"><g stroke="rgba(185,167,255,0.12)" stroke-width="2">${luoi}</g>
<path id="${p}-nha" d="M140 560 V300 L440 90 L740 300 V560 Z M140 300 H740 M380 560 V420 H500 V560 M200 360 H320 V460 H200 Z M560 360 H680 V460 H560 Z" stroke="${MAU.trang}" stroke-width="7" fill="none" stroke-linejoin="round"/>
<path d="M60 560 H820" stroke="${MAU.mo}" stroke-width="5"/></svg>
<div id="${p}-dau">${esc(c.nam)}?</div>
<div id="${p}-d1" class="tde">${tachTu(c.dong[1])}</div>`,
      js: `
tl.fromTo("#${p}-d0 .w", {opacity:0, filter:"blur(8px)"}, {opacity:1, filter:"blur(0px)", duration:0.14, stagger:0.07}, 0.05);
tl.fromTo("#${p}-nha", {strokeDasharray:4200, strokeDashoffset:4200}, {strokeDashoffset:0, duration:${r3(Math.min(2.2, d * 0.6))}, ease:"power2.inOut"}, 0.15);
tl.fromTo("#${p}-dau", {opacity:0, scale:2.2, rotation:-30}, {opacity:1, scale:1, rotation:-10, duration:0.35, ease:"power4.in"}, ${r3(Math.min(1.6, d * 0.4))});
tl.fromTo("#${p}-d1 .w", {opacity:0, filter:"blur(8px)"}, {opacity:1, filter:"blur(0px)", duration:0.14, stagger:0.07}, ${r3(t2)});`,
      sfx: [{ f: "impact-bass-1", t: Math.min(1.6, d * 0.4) + 0.33, v: 0.55 }],
    };
  },

  ba_the(c, { p, d, moc }) {
    const t2 = moc[1]?.bd ?? d * 0.55;
    const the = c.the.map((x, i) => `<div id="${p}-t${i}" class="the ${p}-t" style="top:${300 + i * 230}px"><div class="${p}-so">${i + 1}</div><div><div class="${p}-ten">${esc(x.ten)}</div><div class="${p}-phu">${esc(x.phu)}</div></div></div>`).join("");
    return {
      css: `
.${p}-t { left:120px; right:120px; height:190px; display:flex; align-items:center; gap:40px; padding:0 48px; }
.${p}-so { width:100px; height:100px; border-radius:999px; background:${MAU.vang}; color:${MAU.nen}; font-size:60px; font-weight:900; display:flex; align-items:center; justify-content:center; flex:none; }
.${p}-ten { font-size:70px; font-weight:900; } .${p}-phu { font-size:36px; color:${MAU.mo}; font-weight:600; }
#${p}-dau { position:absolute; left:0; right:0; top:1030px; text-align:center; }
#${p}-dau span { display:inline-block; padding:16px 40px; border-radius:20px; border:5px solid ${MAU.ngoc}; color:${MAU.ngoc}; font-size:58px; font-weight:900; }`,
      html: `${the}<div id="${p}-dau"><span>= phép tính đơn giản</span></div>`,
      js: c.the.map((_, i) => `
tl.fromTo("#${p}-t${i}", {opacity:0, x:${i % 2 ? 200 : -200}}, {opacity:1, x:0, duration:0.55, ease:"expo.out"}, ${r3(0.15 + i * Math.max(0.45, (t2 - 0.4) / 3))});`).join("") + `
tl.fromTo("#${p}-dau", {opacity:0, scale:1.6, rotation:-8}, {opacity:1, scale:1, rotation:-3, duration:0.35, ease:"power4.in"}, ${r3(t2 + 1.4)});`,
      sfx: [...c.the.map((_, i) => ({ f: "whoosh-short", t: 0.15 + i * Math.max(0.45, (t2 - 0.4) / 3), v: 0.35 })), { f: "impact-bass-1", t: t2 + 1.72, v: 0.45 }],
    };
  },

  phep_chia(c, { p, d, moc }) {
    const t2 = moc[1]?.bd ?? d * 0.55;
    const b = moc[0].bd;
    const buoc = Math.max(0.6, (t2 - b - 0.6) / 4);
    return {
      css: `
#${p}-nhan { position:absolute; left:0; right:0; top:250px; text-align:center; }
#${p}-ct { top:360px; font-size:62px; }
#${p}-vd { left:110px; right:110px; top:540px; padding:40px 50px; }
.${p}-r { font-size:46px; font-weight:700; color:${MAU.mo}; margin:10px 0; }
.${p}-r b { color:${MAU.chu}; font-weight:900; }
#${p}-ket { margin-top:22px; font-size:64px; font-weight:900; color:${MAU.ngoc}; }
#${p}-cy { top:1000px; color:${MAU.vang}; font-weight:700; font-size:40px; }`,
      html: `
<div id="${p}-nhan"><span class="chip">${esc(c.nhan)}</span></div>
<div id="${p}-ct" class="tde">${tachTu(c.cong_thuc.replace("dư 1, 3, 6, 8", "*dư 1, 3, 6, 8*"))}</div>
<div id="${p}-vd" class="the">
  <div class="${p}-r" id="${p}-r0">${esc(c.vd.nam)}</div>
  <div class="${p}-r" id="${p}-r1">Tuổi mụ <b>${esc(c.vd.tuoi)}</b></div>
  <div class="${p}-r" id="${p}-r2"><b>${esc(c.vd.tuoi)} ÷ 9</b> → dư <b>${esc(c.vd.du)}</b></div>
  <div id="${p}-ket">✓ ${esc(c.vd.ket)}</div>
</div>
<div id="${p}-cy" class="nho">${esc(c.chu_y)}</div>`,
      js: `
tl.fromTo("#${p}-nhan", {opacity:0, y:-20}, {opacity:1, y:0, duration:0.35, ease:"back.out(1.7)"}, 0.05);
tl.fromTo("#${p}-ct .w", {opacity:0, filter:"blur(8px)"}, {opacity:1, filter:"blur(0px)", duration:0.14, stagger:0.07}, 0.3);
tl.fromTo("#${p}-vd", {opacity:0, y:60}, {opacity:1, y:0, duration:0.5, ease:"expo.out"}, ${r3(b + 0.5)});
${[0, 1, 2].map((i) => `tl.fromTo("#${p}-r${i}", {opacity:0, x:-30}, {opacity:1, x:0, duration:0.3}, ${r3(b + 0.7 + i * buoc)});`).join("\n")}
tl.fromTo("#${p}-ket", {opacity:0, scale:0.5}, {opacity:1, scale:1, duration:0.4, ease:"back.out(2)"}, ${r3(b + 0.7 + 3 * buoc)});
tl.fromTo("#${p}-cy", {opacity:0, y:20}, {opacity:1, y:0, duration:0.4}, ${r3(t2)});`,
      sfx: [{ f: "pop", t: b + 0.7 + 3 * buoc, v: 0.5 }],
    };
  },

  vong_cung(c, { p, d, moc }) {
    const t2 = moc[1]?.bd ?? d * 0.5;
    const R = 300, cx = 540, cy = 730;
    const cung = c.cung.map((s, i) => {
      const g = -Math.PI / 2 + (i * 2 * Math.PI) / 6;
      return `<div id="${p}-k${i}" class="${p}-k${i === c.sang ? " sang" : ""}" style="left:${Math.round(cx + R * Math.cos(g) - 150)}px; top:${Math.round(cy + R * Math.sin(g) - 46)}px">${esc(s)}</div>`;
    }).join("");
    const GIAP = ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"];
    const R2 = 330;
    const pos = (i) => { const g = -Math.PI / 2 + (i * 2 * Math.PI) / 12; return [Math.round(cx + R2 * Math.cos(g)), Math.round(cy + R2 * Math.sin(g))]; };
    const giap = GIAP.map((s, i) => { const [x, y] = pos(i); return `<div class="${p}-g${c.tam_tai.giap.includes(s) ? " sang" : ""}" style="left:${x - 75}px; top:${y - 40}px">${s}</div>`; }).join("");
    const tg = c.tam_tai.giap.map((s) => pos(GIAP.indexOf(s)));
    const den = Math.max(0.4, (t2 - 1.6) / (c.sang + 0.0001));
    return {
      css: `
.${p}-k { position:absolute; width:300px; height:92px; border-radius:46px; background:${MAU.mat2}; border:3px solid ${MAU.vien}; display:flex; align-items:center; justify-content:center; font-size:40px; font-weight:800; color:${MAU.mo}; }
${c.cung.map((_, i) => `#${p}-k${i}`).join(",")} { position:absolute; width:300px; height:92px; border-radius:46px; background:${MAU.mat2}; border:3px solid ${MAU.vien}; display:flex; align-items:center; justify-content:center; font-size:40px; font-weight:800; color:${MAU.mo}; }
#${p}-tay { position:absolute; left:0; right:0; top:660px; text-align:center; font-size:46px; font-weight:800; color:${MAU.chu}; }
#${p}-tay small { display:block; font-size:32px; color:${MAU.mo}; font-weight:600; margin-top:8px; }
#${p}-tit { top:250px; font-size:70px; }
#${p}-tt { position:absolute; inset:0; }
.${p}-g { position:absolute; width:150px; height:80px; display:flex; align-items:center; justify-content:center; font-size:42px; font-weight:800; color:${MAU.nhat}; }
.${p}-g.sang { color:${MAU.nen}; background:${MAU.vang}; border-radius:40px; }
#${p}-giua { position:absolute; left:0; right:0; top:670px; text-align:center; font-size:44px; font-weight:900; }
#${p}-giua span { display:inline-block; padding:14px 30px; border-radius:24px; background:rgba(10,10,23,0.85); }
#${p}-giua small { display:block; color:${MAU.vang}; font-size:36px; margin-top:8px; }`,
      html: `
<div id="${p}-a" class="khung">
  <div id="${p}-tit" class="tde">${tachTu("*Hoang ốc* · 6 cung")}</div>
  ${cung}
  <div id="${p}-tay">Đếm đốt tay<small>sinh 1988 · tuổi mụ 40 → Tứ Tấn Tài</small></div>
</div>
<div id="${p}-b" class="khung">
  <div id="${p}-tit2" class="tde" style="top:250px;font-size:70px">${tachTu("*Tam tai* · " + c.tam_tai.nam)}</div>
  <svg id="${p}-tt" viewBox="0 0 1080 1920"><polygon points="${tg.map((x) => x.join(",")).join(" ")}" fill="rgba(233,196,106,0.10)" stroke="${MAU.vang}" stroke-width="5"/></svg>
  ${giap}
  <div id="${p}-giua"><span>Hợi · Mão · Mùi<small>năm Tam tai thứ 3</small></span></div>
</div>`,
      js: `
tl.fromTo("#${p}-tit .w", {opacity:0, filter:"blur(8px)"}, {opacity:1, filter:"blur(0px)", duration:0.14, stagger:0.07}, 0.05);
tl.fromTo("[id^='${p}-k']", {opacity:0, scale:0.6}, {opacity:1, scale:1, duration:0.4, stagger:0.08, ease:"back.out(1.7)"}, 0.2);
${c.cung.map((_, i) => i <= c.sang ? `tl.to("#${p}-k${i}", {background:"${i === c.sang ? MAU.vang : MAU.vien}", color:"${i === c.sang ? MAU.nen : MAU.chu}", duration:0.15}, ${r3(1.2 + i * den)});` : "").join("\n")}
tl.fromTo("#${p}-tay", {opacity:0, y:20}, {opacity:1, y:0, duration:0.4}, ${r3(1.2 + c.sang * den + 0.2)});
tl.to("#${p}-a", {opacity:0, filter:"blur(10px)", duration:0.25, ease:"power2.in"}, ${r3(t2 - 0.2)});
tl.fromTo("#${p}-b", {opacity:0}, {opacity:1, duration:0.3}, ${r3(t2)});
tl.fromTo("#${p}-tit2 .w", {opacity:0, filter:"blur(8px)"}, {opacity:1, filter:"blur(0px)", duration:0.14, stagger:0.07}, ${r3(t2 + 0.05)});
tl.fromTo(".${p}-g", {opacity:0, scale:0.5}, {opacity:1, scale:1, duration:0.3, stagger:0.04, ease:"back.out(1.6)"}, ${r3(t2 + 0.2)});
tl.fromTo("#${p}-tt polygon", {opacity:0, scale:0.7, transformOrigin:"540px 730px"}, {opacity:1, scale:1, duration:0.5, ease:"expo.out"}, ${r3(t2 + 1.4)});
tl.fromTo("#${p}-giua", {opacity:0, scale:0.8}, {opacity:1, scale:1, duration:0.4, ease:"back.out(1.7)"}, ${r3(t2 + 1.7)});`,
      sfx: [...Array.from({ length: c.sang + 1 }, (_, i) => ({ f: "click-soft", t: 1.2 + i * den, v: 0.4 })), { f: "whoosh", t: t2 - 0.2, v: 0.35 }, { f: "pop", t: t2 + 1.7, v: 0.45 }],
    };
  },

  vong_diem(c, { p, d, moc }) {
    const chay = c.che_do === "chay";
    const C = 2 * Math.PI * 230;
    const t2 = moc[1]?.bd ?? d * 0.6;
    return {
      css: `
#${p}-vong { position:absolute; left:290px; top:${chay ? 520 : 300}px; width:500px; height:500px; }
#${p}-so { position:absolute; left:290px; width:500px; top:${chay ? 680 : 460}px; text-align:center; font-size:170px; font-weight:900; line-height:1; color:${MAU.chu}; }
#${p}-tren { position:absolute; left:290px; width:500px; top:${chay ? 870 : 650}px; text-align:center; font-size:36px; color:${MAU.mo}; font-weight:700; }
#${p}-muc { position:absolute; left:0; right:0; top:840px; text-align:center; font-size:64px; font-weight:900; color:${MAU.vang}; }
.${p}-ng { position:absolute; top:270px; width:170px; height:170px; border-radius:999px; background:${MAU.mat2}; border:4px solid ${MAU.vien}; }
#${p}-n1 { left:200px; } #${p}-n2 { right:200px; }
#${p}-tim { position:absolute; left:0; right:0; top:300px; text-align:center; font-size:90px; color:${MAU.son}; }
#${p}-khoan { position:absolute; left:0; right:0; top:1060px; text-align:center; font-size:110px; font-weight:900; color:${MAU.vang}; }
#${p}-d0 { top:950px; font-size:${co(c.dong?.[0] ?? "", 80)}px; white-space:nowrap; } #${p}-d1 { top:1045px; font-size:${co(c.dong?.[1] ?? "", 80)}px; white-space:nowrap; }`,
      html: `
${chay ? `<div id="${p}-n1" class="${p}-ng"></div><div id="${p}-n2" class="${p}-ng"></div><div id="${p}-tim">♥</div>` : ""}
<svg id="${p}-vong" viewBox="0 0 500 500"><circle cx="250" cy="250" r="230" stroke="${MAU.vien}" stroke-width="30" fill="none"/>
<circle id="${p}-cung" cx="250" cy="250" r="230" stroke="${MAU.vang}" stroke-width="30" fill="none" stroke-linecap="round" transform="rotate(-90 250 250)" stroke-dasharray="${r3(C)}" stroke-dashoffset="${r3(C)}"/></svg>
<div id="${p}-so">0</div><div id="${p}-tren">/ 100 · tham khảo</div>
${chay ? `<div id="${p}-khoan">Ơ khoan!</div>` : `<div id="${p}-muc">${esc(c.muc)}</div>
<div id="${p}-d0" class="tde">${tachTu(c.dong[0])}</div><div id="${p}-d1" class="tde">${tachTu(c.dong[1])}</div>`}`,
      js: chay ? `
tl.fromTo([".${p}-ng", "#${p}-tim"], {opacity:0, scale:0.5}, {opacity:1, scale:1, duration:0.45, stagger:0.1, ease:"back.out(1.8)"}, 0.05);
tl.fromTo(["#${p}-vong", "#${p}-so", "#${p}-tren"], {opacity:0, scale:0.8}, {opacity:1, scale:1, duration:0.5, ease:"expo.out"}, 0.2);
const ${p}S = {v:0};
tl.to(${p}S, {v:97, duration:${r3(Math.max(1, t2 - 0.4))}, ease:"none", onUpdate:()=>{
  const v = ${p}S.v; document.querySelector("#${p}-so").textContent = Math.round(v);
  document.querySelector("#${p}-cung").setAttribute("stroke-dashoffset", ${r3(C)} * (1 - v/100)); }}, 0.3);
tl.set("#${p}-so", {textContent:"??"}, ${r3(t2)});
tl.fromTo("#${p}-khoan", {opacity:0, scale:1.6}, {opacity:1, scale:1, duration:0.25, ease:"power4.in"}, ${r3(t2)});
tl.to("#${p}-vong", {x:-12, duration:0.05}, ${r3(t2 + 0.25)}); tl.to("#${p}-vong", {x:12, duration:0.1}, ${r3(t2 + 0.3)}); tl.to("#${p}-vong", {x:0, duration:0.05}, ${r3(t2 + 0.4)});` : `
tl.fromTo(["#${p}-vong", "#${p}-so", "#${p}-tren"], {opacity:0, scale:0.85}, {opacity:1, scale:1, duration:0.5, ease:"expo.out"}, 0.05);
const ${p}S = {v:0};
tl.to(${p}S, {v:${c.diem}, duration:1.4, ease:"power3.out", onUpdate:()=>{
  const v = ${p}S.v; document.querySelector("#${p}-so").textContent = Math.round(v);
  document.querySelector("#${p}-cung").setAttribute("stroke-dashoffset", ${r3(C)} * (1 - v/100)); }}, 0.2);
tl.fromTo("#${p}-muc", {opacity:0, y:20}, {opacity:1, y:0, duration:0.4}, 1.5);
tl.fromTo("#${p}-d0 .w", {opacity:0, filter:"blur(8px)"}, {opacity:1, filter:"blur(0px)", duration:0.14, stagger:0.07}, ${r3(t2)});
tl.fromTo("#${p}-d1 .w", {opacity:0, filter:"blur(8px)"}, {opacity:1, filter:"blur(0px)", duration:0.14, stagger:0.07}, ${r3(t2 + 0.6)});`,
      sfx: chay ? [{ f: "riser", t: 0.3, v: 0.3 }, { f: "impact-bass-1", t: t2 + 0.2, v: 0.55 }] : [{ f: "pop", t: 1.6, v: 0.5 }],
    };
  },

  nam_thanh(c, { p, d, moc }) {
    const b = 0.2, ket = (moc[1]?.kt ?? d * 0.6);
    const buoc = Math.max(0.5, (ket - b) / c.thanh.length);
    const t3 = moc[2]?.bd ?? d * 0.7;
    const mau = (x) => (x >= 0.7 ? MAU.ngoc : x >= 0.45 ? MAU.vang : MAU.son);
    const thanh = c.thanh.map((t, i) => `<div id="${p}-t${i}" class="${p}-t" style="top:${270 + i * 160}px">
  <div class="${p}-dau"><span class="${p}-ten">${esc(t.ten)}</span><span class="${p}-d" id="${p}-d${i}">${t.d}/${t.tran}</span></div>
  <div class="${p}-sach">${esc(t.sach)}</div>
  <div class="${p}-ray"><div class="${p}-ruot" id="${p}-r${i}" style="background:${mau(t.d / t.tran)}"></div></div></div>`).join("");
    return {
      css: `
.${p}-t { position:absolute; left:110px; right:110px; }
.${p}-dau { display:flex; justify-content:space-between; align-items:baseline; }
.${p}-ten { font-size:44px; font-weight:800; } .${p}-d { font-size:44px; font-weight:900; color:${MAU.vang}; }
.${p}-sach { font-size:28px; color:${MAU.nhat}; font-weight:600; margin-top:2px; }
.${p}-ray { margin-top:12px; height:26px; border-radius:13px; background:${MAU.mat2}; overflow:hidden; }
.${p}-ruot { height:100%; border-radius:13px; transform-origin:left center; }
.${p}-tag { position:absolute; right:110px; font-size:32px; font-weight:800; padding:8px 20px; border-radius:16px; }
#${p}-g1 { top:252px; right:320px; background:rgba(111,211,181,0.15); color:${MAU.ngoc}; border:2px solid ${MAU.ngoc}; }
#${p}-g2 { top:572px; right:320px; background:rgba(239,138,111,0.15); color:${MAU.son}; border:2px solid ${MAU.son}; }`,
      html: `${thanh}<div id="${p}-g1" class="${p}-tag">dễ hợp</div><div id="${p}-g2" class="${p}-tag">cần nói rõ</div>`,
      js: c.thanh.map((t, i) => `
tl.fromTo("#${p}-t${i}", {opacity:0, x:-60}, {opacity:1, x:0, duration:0.4, ease:"expo.out"}, ${r3(b + i * buoc)});
tl.fromTo("#${p}-r${i}", {scaleX:0}, {scaleX:${r3(t.d / t.tran)}, duration:0.8, ease:"power3.out"}, ${r3(b + i * buoc + 0.15)});`).join("") + `
tl.fromTo("#${p}-g1", {opacity:0, scale:0.6}, {opacity:1, scale:1, duration:0.35, ease:"back.out(2)"}, ${r3(t3 + 1.2)});
tl.fromTo("#${p}-g2", {opacity:0, scale:0.6}, {opacity:1, scale:1, duration:0.35, ease:"back.out(2)"}, ${r3(t3 + 2.2)});`,
      sfx: [...c.thanh.map((_, i) => ({ f: "click-soft", t: b + i * buoc + 0.15, v: 0.35 })), { f: "pop", t: t3 + 1.2, v: 0.4 }, { f: "pop", t: t3 + 2.2, v: 0.4 }],
    };
  },

  quan_he(c, { p, d, moc }) {
    const b = moc[0].bd + 1.2, t2 = moc[1]?.bd ?? d * 0.6;
    const buoc = Math.max(0.45, (t2 - b) / c.chon.length);
    const o = c.chon.map((s, i) => `<div id="${p}-o${i}" class="${p}-o" style="left:${i % 2 ? 560 : 110}px; top:${400 + Math.floor(i / 2) * 230}px">${esc(s)}</div>`).join("");
    return {
      css: `
#${p}-tit { top:280px; font-size:64px; color:${MAU.mo}; }
.${p}-o { position:absolute; width:410px; height:180px; border-radius:40px; background:${MAU.mat2}; border:4px solid ${MAU.vien}; display:flex; align-items:center; justify-content:center; font-size:56px; font-weight:900; color:${MAU.mo}; }
#${p}-ket { top:920px; font-size:76px; }`,
      html: `<div id="${p}-tit" class="tde">Người ấy là…</div>${o}<div id="${p}-ket" class="tde">${tachTu("Cùng 2 lá số → *4 cách đọc*")}</div>`,
      js: `
tl.fromTo("#${p}-tit", {opacity:0}, {opacity:1, duration:0.3}, 0.05);
tl.fromTo(".${p}-o", {opacity:0, scale:0.7}, {opacity:1, scale:1, duration:0.4, stagger:0.09, ease:"back.out(1.7)"}, 0.2);
${c.chon.map((_, i) => `tl.to("#${p}-o${i}", {background:"${MAU.vang}", color:"${MAU.nen}", borderColor:"${MAU.vang}", scale:1.06, duration:0.18}, ${r3(b + i * buoc)});
${i < c.chon.length - 1 ? `tl.to("#${p}-o${i}", {background:"${MAU.mat2}", color:"${MAU.mo}", borderColor:"${MAU.vien}", scale:1, duration:0.18}, ${r3(b + (i + 1) * buoc)});` : ""}`).join("\n")}
tl.fromTo("#${p}-ket .w", {opacity:0, filter:"blur(8px)"}, {opacity:1, filter:"blur(0px)", duration:0.14, stagger:0.08}, ${r3(t2)});`,
      sfx: c.chon.map((_, i) => ({ f: "click-soft", t: b + i * buoc, v: 0.45 })),
    };
  },

  phong_ngu(c, { p, d, moc }) {
    const t2 = moc[1]?.bd ?? d * 0.5;
    return {
      css: `
#${p}-d0 { top:250px; font-size:${co(c.dong[0], 92)}px; white-space:nowrap; } #${p}-d1 { top:1040px; font-size:${co(c.dong[1], 80)}px; white-space:nowrap; }
#${p}-canh { position:absolute; left:90px; top:380px; width:900px; height:640px; overflow:hidden; border-radius:36px; border:2px solid ${MAU.vien}; background:linear-gradient(${MAU.mat}, ${MAU.nen}); }
#${p}-cam { position:absolute; left:0; top:0; width:900px; height:1100px; }`,
      html: `
<div id="${p}-d0" class="tde">${tachTu(c.dong[0])}</div>
<div id="${p}-canh" data-layout-allow-overflow><svg id="${p}-cam" viewBox="0 0 900 1100">
  <rect x="0" y="40" width="900" height="120" fill="#2a2440"/><rect x="0" y="160" width="900" height="18" fill="#1a1630"/>
  <text x="450" y="118" text-anchor="middle" font-family="BVP" font-weight="800" font-size="42" fill="${MAU.son}">xà ngang</text>
  <path d="M450 190 V330 M420 300 L450 335 L480 300" stroke="${MAU.son}" stroke-width="8" fill="none" stroke-linecap="round"/>
  <rect x="160" y="760" width="580" height="170" rx="26" fill="#2b2b55" stroke="${MAU.trang}" stroke-width="5"/>
  <rect x="190" y="720" width="190" height="80" rx="30" fill="#3a3a6e"/>
  <rect x="160" y="930" width="30" height="80" fill="#2b2b55"/><rect x="710" y="930" width="30" height="80" fill="#2b2b55"/>
  <path d="M120 1010 H780" stroke="${MAU.vien}" stroke-width="6"/>
</svg></div>
<div id="${p}-d1" class="tde">${tachTu(c.dong[1])}</div>`,
      js: `
tl.fromTo("#${p}-d0 .w", {opacity:0, filter:"blur(8px)"}, {opacity:1, filter:"blur(0px)", duration:0.14, stagger:0.07}, 0.05);
tl.fromTo("#${p}-canh", {opacity:0}, {opacity:1, duration:0.4}, 0.1);
tl.fromTo("#${p}-cam", {y:-460}, {y:0, duration:${r3(Math.max(1.2, t2 + 0.6))}, ease:"power2.inOut"}, 0.3);
tl.fromTo("#${p}-d1 .w", {opacity:0, filter:"blur(8px)"}, {opacity:1, filter:"blur(0px)", duration:0.14, stagger:0.07}, ${r3(t2)});`,
      sfx: [{ f: "whoosh-cinematic", t: 0.3, v: 0.35 }],
    };
  },

  bon_dau_hieu(c, { p, d, moc }) {
    const b = moc[1]?.bd ?? d * 0.4;
    const kt = moc[1]?.kt ?? d * 0.9;
    const buoc = Math.max(0.6, (kt - b) / 4);
    const HINH = {
      duong: `<path d="M20 150 H120 M20 110 H120" stroke="${MAU.mo}" stroke-width="6"/><path d="M125 130 H200" stroke="${MAU.son}" stroke-width="8"/><path d="M185 110 L205 130 L185 150" stroke="${MAU.son}" stroke-width="8" fill="none"/><rect x="210" y="80" width="60" height="100" rx="6" fill="none" stroke="${MAU.chu}" stroke-width="6"/>`,
      xa: `<rect x="30" y="40" width="240" height="30" fill="${MAU.son}"/><rect x="60" y="150" width="180" height="50" rx="10" fill="none" stroke="${MAU.chu}" stroke-width="6"/><path d="M150 80 V135" stroke="${MAU.son}" stroke-width="6"/>`,
      wc: `<rect x="40" y="40" width="220" height="160" fill="none" stroke="${MAU.chu}" stroke-width="6"/><rect x="120" y="95" width="60" height="50" fill="${MAU.son}"/><path d="M40 120 H260 M150 40 V200" stroke="${MAU.vien}" stroke-width="3"/>`,
      ban_cong: `<rect x="20" y="70" width="60" height="110" fill="none" stroke="${MAU.chu}" stroke-width="6"/><rect x="220" y="70" width="60" height="110" fill="none" stroke="${MAU.chu}" stroke-width="6"/><path d="M90 125 H205 M190 105 L210 125 L190 145" stroke="${MAU.son}" stroke-width="7" fill="none"/>`,
    };
    const the = c.the.map((x, i) => `<div id="${p}-t${i}" class="the ${p}-t" style="left:${i % 2 ? 560 : 100}px; top:${380 + Math.floor(i / 2) * 330}px">
<svg viewBox="0 0 300 220" width="260" height="190">${HINH[x.ma]}</svg><div class="${p}-ten">${esc(x.ten)}</div></div>`).join("");
    return {
      css: `
#${p}-tit { top:240px; font-size:72px; }
.${p}-t { width:420px; height:300px; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:10px 24px; text-align:center; }
.${p}-ten { font-size:34px; font-weight:800; line-height:1.2; }
#${p}-bon { position:absolute; left:0; right:0; top:420px; text-align:center; font-size:520px; font-weight:900; line-height:1; color:${MAU.vang}; text-shadow:0 0 90px rgba(233,196,106,0.35); }`,
      html: `<div id="${p}-tit" class="tde">${tachTu("4 thứ xem *trước tiên*")}</div><div id="${p}-bon">4</div>${the}`,
      js: `
tl.fromTo("#${p}-tit .w", {opacity:0, filter:"blur(8px)"}, {opacity:1, filter:"blur(0px)", duration:0.14, stagger:0.08}, 0.1);
tl.fromTo("#${p}-bon", {opacity:0, scale:0.5}, {opacity:1, scale:1, duration:0.5, ease:"expo.out"}, 0.3);
tl.to("#${p}-bon", {opacity:0, scale:1.4, filter:"blur(16px)", duration:0.3, ease:"power2.in"}, ${r3(b - 0.3)});
${c.the.map((_, i) => `tl.fromTo("#${p}-t${i}", {opacity:0, scale:0.7, y:40}, {opacity:1, scale:1, y:0, duration:0.45, ease:"back.out(1.6)"}, ${r3(b + i * buoc)});`).join("\n")}`,
      sfx: c.the.map((_, i) => ({ f: "pop", t: b + i * buoc, v: 0.4 })),
    };
  },

  hai_cot(c, { p, d, moc }) {
    const t1 = moc[0].bd + 0.6, t2 = moc[1]?.bd ?? d * 0.55;
    const hang = c.hang.map((h, i) => `<div id="${p}-h${i}" class="${p}-h" style="top:${420 + i * 220}px"><div class="${p}-x serif">${esc(h[0])}</div><div class="${p}-mui">${h[0] ? "→" : ""}</div><div class="${p}-y">${esc(h[1])}</div></div>`).join("");
    const lt = [t1, t2, t2 + 2.2];
    return {
      css: `
.${p}-cot { position:absolute; top:280px; font-size:44px; font-weight:900; letter-spacing:0.06em; text-transform:uppercase; }
#${p}-c0 { left:100px; color:${MAU.trang}; } #${p}-c1 { left:560px; color:${MAU.vang}; }
.${p}-h { position:absolute; left:100px; right:90px; display:flex; align-items:center; gap:20px; }
.${p}-x { width:380px; font-size:46px; color:${MAU.chu}; }
.${p}-mui { width:40px; font-size:46px; color:${MAU.nhat}; }
.${p}-y { flex:1; font-size:40px; font-weight:700; line-height:1.28; padding:22px 26px; border-radius:26px; background:rgba(233,196,106,0.08); border:2px solid rgba(233,196,106,0.35); }`,
      html: `<div id="${p}-c0" class="${p}-cot">${esc(c.cot[0])}</div><div id="${p}-c1" class="${p}-cot">${esc(c.cot[1])}</div>${hang}`,
      js: `
tl.fromTo(".${p}-cot", {opacity:0, y:-20}, {opacity:1, y:0, duration:0.4, stagger:0.15}, 0.05);
${c.hang.map((_, i) => `tl.fromTo("#${p}-h${i} .${p}-x", {opacity:0, x:-40}, {opacity:1, x:0, duration:0.4, ease:"expo.out"}, ${r3(lt[i] ?? t2)});
tl.fromTo(["#${p}-h${i} .${p}-mui", "#${p}-h${i} .${p}-y"], {opacity:0, x:40}, {opacity:1, x:0, duration:0.45, ease:"expo.out", stagger:0.1}, ${r3((lt[i] ?? t2) + 0.5)});`).join("\n")}`,
      sfx: c.hang.map((_, i) => ({ f: "whoosh-short", t: lt[i] ?? t2, v: 0.3 })),
    };
  },

  khong_dong(c, { p, d, moc }) {
    const t2 = moc[1]?.bd ?? d * 0.5;
    const kt = moc[1]?.kt ?? d * 0.9;
    const buoc = Math.max(0.45, (kt - t2) / (c.viec.length + c.khong.length));
    return {
      css: `
#${p}-dau { position:absolute; left:0; right:0; top:250px; text-align:center; }
#${p}-dau span { display:inline-block; padding:18px 54px; border:10px solid ${MAU.ngoc}; border-radius:30px; color:${MAU.ngoc}; font-size:130px; font-weight:900; line-height:1; }
.${p}-v { position:absolute; left:160px; right:160px; height:120px; display:flex; align-items:center; gap:28px; padding:0 40px; font-size:52px; font-weight:800; }
.${p}-v b { color:${MAU.ngoc}; font-size:56px; }
.${p}-k { position:absolute; left:0; right:0; text-align:center; font-size:46px; font-weight:800; color:${MAU.mo}; }`,
      html: `<div id="${p}-dau"><span>0 đồng</span></div>
${c.viec.map((s, i) => `<div id="${p}-v${i}" class="the ${p}-v" style="top:${510 + i * 145}px"><b>✓</b>${esc(s)}</div>`).join("")}
${c.khong.map((s, i) => `<div id="${p}-k${i}" class="${p}-k" style="top:${960 + i * 70}px">✕ ${esc(s)}</div>`).join("")}`,
      js: `
tl.fromTo("#${p}-dau", {opacity:0, scale:2, rotation:-20}, {opacity:1, scale:1, rotation:-6, duration:0.35, ease:"power4.in"}, 0.3);
${[...c.viec.map((_, i) => `tl.fromTo("#${p}-v${i}", {opacity:0, x:-80}, {opacity:1, x:0, duration:0.4, ease:"expo.out"}, ${r3(t2 + i * buoc)});`),
   ...c.khong.map((_, i) => `tl.fromTo("#${p}-k${i}", {opacity:0, y:20}, {opacity:1, y:0, duration:0.35}, ${r3(t2 + (c.viec.length + i) * buoc)});`)].join("\n")}`,
      sfx: [{ f: "impact-bass-1", t: 0.63, v: 0.5 }, ...c.viec.map((_, i) => ({ f: "pop", t: t2 + i * buoc, v: 0.4 }))],
    };
  },
};

// ---------------------------------------------------------------- thời lượng
function docGiong(ma, id) {
  const f = path.join(GOC, "giong", ma, `${id}.json`);
  return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, "utf8")) : null;
}

function lichCanh(video) {
  let t = 0;
  return video.canh.map((c) => {
    if (c.noi.length !== c.phu_de.length) throw new Error(`${video.ma}/${c.id}: noi và phu_de lệch số câu`);
    const g = docGiong(video.ma, c.id);
    let moc, d;
    if (g) {
      moc = g.cau.map((x) => ({ bd: DAU_GIONG + x.bd, kt: DAU_GIONG + x.kt }));
      d = DAU_GIONG + g.dur + DUOI_CANH;
    } else {
      let x = DAU_GIONG + 0.1;
      moc = c.noi.map((s) => { const dd = amTiet(s) / TOC_DO; const m = { bd: x, kt: x + dd }; x += dd + 0.32; return m; });
      d = moc[moc.length - 1].kt + DUOI_CANH + 0.2;
    }
    if (c.loai === "cta") d += 2.2; // dòng miễn trừ cuối phim cần ≥ 3,5 s
    d = Math.max(d, 3.2);
    const ra = { c, bd: t, d: r3(d), moc: moc.map((m) => ({ bd: r3(m.bd), kt: r3(m.kt) })), giong: g };
    t = r3(t + d);
    return ra;
  });
}

// ---------------------------------------------------------------- phụ đề
function nhomPhuDe(cau, bd, kt) {
  // Tách câu thành nhóm ≤ 5 từ, ngắt ở dấu câu; thời gian chia theo số ký tự.
  const tu = [];
  let vang = false;
  for (const raw of cau.split(/\s+/).filter(Boolean)) {
    let w = raw; const mo = w.startsWith("*"); if (mo) { vang = true; w = w.slice(1); }
    const dong = w.includes("*"); w = w.replace(/\*/g, "");
    tu.push({ w, vang: vang || mo });
    if (dong) vang = false;
  }
  const nhom = []; let cur = [];
  tu.forEach((x, i) => {
    cur.push(x);
    const ngat = /[.,!?…:;—]$/.test(x.w) || x.w === "—" || x.w === "·";
    if (cur.length >= 5 || (ngat && cur.length >= 2) || i === tu.length - 1) { nhom.push(cur); cur = []; }
  });
  const tong = tu.reduce((s, x) => s + x.w.length + 1, 0);
  let t = bd;
  return nhom.map((g) => {
    const len = g.reduce((s, x) => s + x.w.length + 1, 0);
    const dd = ((kt - bd) * len) / tong;
    let tt = t;
    const words = g.map((x) => { const wd = (dd * (x.w.length + 1)) / len; const r = { ...x, t: r3(tt) }; tt += wd; return r; });
    const ra = { bd: r3(t), kt: r3(t + dd), words };
    t += dd;
    return ra;
  });
}

function canhPhuDe(lich) {
  const nhom = [];
  for (const s of lich) s.c.phu_de.forEach((cau, i) => {
    const m = s.moc[i];
    nhom.push(...nhomPhuDe(cau, s.bd + m.bd, s.bd + Math.max(m.kt, m.bd + 0.6)));
  });
  // Nhóm sau mở → nhóm trước đóng.
  nhom.forEach((g, i) => { const sau = nhom[i + 1]; g.het = r3(sau ? Math.min(sau.bd, g.kt + 0.6) : g.kt + 0.6); });
  const html = nhom.map((g, i) => `<div id="pd-${i}" class="pd">${g.words.map((w, j) => `<span id="pd-${i}-${j}" class="pw${w.vang ? " hl" : ""}">${esc(w.w)}</span>`).join(" ")}</div>`).join("\n");
  const js = nhom.map((g, i) => `
tl.fromTo("#pd-${i}", {opacity:0, y:16, scale:0.96}, {opacity:1, y:0, scale:1, duration:0.12, ease:"power3.out"}, ${r3(g.bd)});
${g.words.map((w, j) => `tl.fromTo("#pd-${i}-${j}", {opacity:0.42}, {opacity:1, duration:0.08}, ${w.t});`).join("\n")}
tl.to("#pd-${i}", {opacity:0, duration:0.08, ease:"power2.in"}, ${r3(g.het - 0.08)});
tl.set("#pd-${i}", {opacity:0, visibility:"hidden"}, ${g.het});`).join("");
  return `<template>
<style>
${PHONG}
#root { position:absolute; inset:0; }
.pd { position:absolute; left:80px; right:80px; top:1170px; text-align:center; font-family:"BVP"; font-weight:900; font-size:62px; line-height:1.18; color:${MAU.chu}; opacity:0; text-shadow: 0 4px 0 rgba(0,0,0,0.55), 0 0 30px rgba(10,10,23,0.9); text-wrap: balance; overflow: visible; }
.pd .hl { color:${MAU.vang}; }
</style>
<div id="root" data-composition-id="phu-de" data-width="${W}" data-height="${H}">
<div id="pd-khung" class="clip" data-start="0" data-duration="${lich.at(-1).bd + lich.at(-1).d}" data-layout-allow-caption-zone data-layout-allow-overlap>
${html}
</div></div>
<script>
const tl = gsap.timeline({ paused: true });
${js}
window.__timelines["phu-de"] = tl;
</script>
</template>`;
}

// ---------------------------------------------------------------- ghép dự án
function canhFile(video, s) {
  const f = KIEU[s.c.loai];
  if (!f) throw new Error(`Chưa có kiểu cảnh ${s.c.loai}`);
  const p = `${video.ma}${s.c.id.replace(/-/g, "")}`;
  const k = f(s.c, { p, d: s.d, moc: s.moc, video });
  const ra = r3(s.d - 0.28);
  return {
    sfx: (k.sfx ?? []).map((x) => ({ ...x, t: r3(s.bd + Math.max(0, x.t)) })).filter((x) => x.t < s.bd + s.d),
    html: `<template>
<style>
${CHUNG}
${k.css}
</style>
<div id="root" data-composition-id="${s.c.id}" data-width="${W}" data-height="${H}">
<div id="${p}-khung" class="clip khung" data-start="0" data-duration="${s.d}">
<div id="${p}-noi" class="khung">
${k.html}
</div></div></div>
<script>
const tl = gsap.timeline({ paused: true });
${k.js}
tl.to("#${p}-noi", {opacity:0, filter:"blur(10px)", duration:0.24, ease:"power2.in"}, ${ra});
window.__timelines["${s.c.id}"] = tl;
</script>
</template>`,
  };
}

function nenFile(tong) {
  const r = hat(7);
  const sao = Array.from({ length: 140 }, () => {
    const x = Math.round(r() * W), y = Math.round(r() * H), s = (r() * 2.4 + 0.6).toFixed(1), o = (r() * 0.55 + 0.15).toFixed(2);
    return `<circle cx="${x}" cy="${y}" r="${s}" fill="#fff" opacity="${o}"/>`;
  }).join("");
  const vach = Array.from({ length: 12 }, (_, i) => { const g = (i * Math.PI) / 6; return `<line x1="${540 + 560 * Math.cos(g)}" y1="${960 + 560 * Math.sin(g)}" x2="${540 + 620 * Math.cos(g)}" y2="${960 + 620 * Math.sin(g)}" />`; }).join("");
  return `<template>
<style>
${PHONG}
#root { position:absolute; inset:0; }
#nen-day { position:absolute; inset:0; background: radial-gradient(1200px 900px at 50% 28%, #1c1a3f 0%, ${MAU.nen} 62%); }
#nen-sao, #nen-vong { position:absolute; left:0; top:0; width:${W}px; height:${H}px; }
#nen-hieu { position:absolute; left:0; right:0; top:178px; text-align:center; font-family:"NR"; font-style:italic; font-weight:500; font-size:36px; color:${MAU.vang}; opacity:0.9; }
#nen-chan { position:absolute; left:0; right:0; top:1600px; text-align:center; font-family:"BVP"; font-weight:800; font-size:34px; color:rgba(233,196,106,0.35); letter-spacing:0.12em; }
</style>
<div id="root" data-composition-id="nen" data-width="${W}" data-height="${H}">
<div id="nen-khung" class="clip" data-start="0" data-duration="${tong}" data-layout-ignore>
  <div id="nen-day"></div>
  <svg id="nen-sao" viewBox="0 0 ${W} ${H}">${sao}</svg>
  <svg id="nen-vong" viewBox="0 0 ${W} ${H}"><g stroke="rgba(233,196,106,0.10)" stroke-width="3" fill="none"><circle cx="540" cy="960" r="590"/><circle cx="540" cy="960" r="620"/>${vach}</g></svg>
  <div id="nen-hieu">✦ Hiểu Bản Thân</div>
  <div id="nen-chan">HIEUBAN.COM</div>
</div></div>
<script>
const tl = gsap.timeline({ paused: true });
tl.fromTo("#nen-vong", {rotation:0, transformOrigin:"540px 960px"}, {rotation:${r3(tong * 3)}, duration:${tong}, ease:"none"}, 0);
tl.fromTo("#nen-sao", {y:0}, {y:-60, duration:${tong}, ease:"none"}, 0);
window.__timelines["nen"] = tl;
</script>
</template>`;
}

const _dai = {};
function dodai(f) {
  if (!_dai[f]) _dai[f] = r3(Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path.join(GOC, "am-thanh", `${f}.mp3`)]).toString().trim()));
  return _dai[f];
}

function dung(video) {
  const lich = lichCanh(video);
  const tong = r3(lich.at(-1).bd + lich.at(-1).d);
  const thu = path.join(GOC, "ban-dung", video.ma);
  fs.rmSync(path.join(thu, "compositions"), { recursive: true, force: true });
  for (const d of ["compositions", "assets/fonts", "assets/anh", "assets/sfx", "assets/giong"]) fs.mkdirSync(path.join(thu, d), { recursive: true });
  for (const f of fs.readdirSync(path.join(GOC, "phong"))) if (f.endsWith(".ttf")) fs.copyFileSync(path.join(GOC, "phong", f), path.join(thu, "assets/fonts", f));
  fs.copyFileSync(path.join(GOC, "node_modules/gsap/dist/gsap.min.js"), path.join(thu, "assets/gsap.min.js"));

  const hosts = [], sfx = [], giong = [];
  for (const s of lich) {
    for (const k of ["anh", "anh_sau"]) if (s.c[k]) fs.copyFileSync(path.join(GOC, "anh", s.c[k]), path.join(thu, "assets/anh", s.c[k]));
    const cf = canhFile(video, s);
    fs.writeFileSync(path.join(thu, "compositions", `${s.c.id}.html`), cf.html);
    hosts.push(`<div id="${s.c.id}" data-composition-id="${s.c.id}" data-composition-src="compositions/${s.c.id}.html" data-start="${s.bd}" data-duration="${s.d}" data-track-index="2" data-track-kind="graphics" data-width="${W}" data-height="${H}" style="z-index:2"></div>`);
    if (s !== lich[0]) sfx.push({ f: ["whoosh", "whoosh-short", "whoosh-cinematic"][sfx.length % 3], t: r3(s.bd - 0.12), v: 0.3 });
    sfx.push(...cf.sfx);
    if (s.giong) {
      const ten = `${s.c.id}.mp3`;
      fs.copyFileSync(path.join(GOC, "giong", video.ma, ten), path.join(thu, "assets/giong", ten));
      giong.push(`<audio id="giong-${s.c.id}" class="clip" src="assets/giong/${ten}" data-start="${r3(s.bd + DAU_GIONG)}" data-duration="${r3(s.giong.dur)}" data-track-index="5" data-volume="1"></audio>`);
    }
  }
  // Hiệu ứng tiếng: nhỏ hơn hẳn khi có giọng; mỗi tiếng có đúng thời lượng tệp, xoay 4 làn để không chồng.
  const coGiong = giong.length > 0;
  const dungSfx = new Set();
  const sfxHtml = sfx.filter((x) => x.t >= 0 && x.t < tong - 0.2).map((x, i) => {
    dungSfx.add(x.f);
    const v = r3((x.v ?? 0.5) * (coGiong ? 0.55 : 1));
    const dai = Math.min(dodai(x.f), r3(tong - x.t));
    return `<audio id="sfx-${i}" class="clip" src="assets/sfx/${x.f}.mp3" data-start="${x.t}" data-duration="${dai}" data-track-index="${6 + (i % 4)}" data-volume="${v}"></audio>`;
  }).join("\n    ");
  for (const f of dungSfx) fs.copyFileSync(path.join(GOC, "am-thanh", `${f}.mp3`), path.join(thu, "assets/sfx", `${f}.mp3`));

  fs.writeFileSync(path.join(thu, "compositions", "nen.html"), nenFile(tong));
  fs.writeFileSync(path.join(thu, "compositions", "phu-de.html"), canhPhuDe(lich));
  fs.writeFileSync(path.join(thu, "hyperframes.json"), JSON.stringify({
    $schema: "https://hyperframes.heygen.com/schema/hyperframes.json",
    paths: { blocks: "compositions", components: "compositions/components", assets: "assets" },
    media: { autoProxy: true }, authoringSkill: "hyperframes",
  }, null, 2));
  fs.writeFileSync(path.join(thu, "index.html"), `<!doctype html>
<html lang="vi" data-resolution="portrait">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=${W}, height=${H}" />
    <title>${esc(video.ma)} — ${esc(video.ten)}</title>
    <script src="assets/gsap.min.js"></script>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body { width: ${W}px; height: ${H}px; overflow: hidden; background: ${MAU.nen}; }
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="${tong}" data-width="${W}" data-height="${H}">
    <div id="nen" data-composition-id="nen" data-composition-src="compositions/nen.html" data-start="0" data-duration="${tong}" data-track-index="1" data-track-kind="graphics" data-width="${W}" data-height="${H}" style="z-index:1"></div>
    ${hosts.join("\n    ")}
    <div id="phu-de" data-composition-id="phu-de" data-composition-src="compositions/phu-de.html" data-start="0" data-duration="${tong}" data-track-index="3" data-track-kind="captions" data-width="${W}" data-height="${H}" style="z-index:5"></div>
    ${giong.join("\n    ")}
    ${sfxHtml}
    </div>
    <script>
      window.__timelines["main"] = gsap.timeline({ paused: true });
    </script>
  </body>
</html>
`);
  return { ma: video.ma, tong, canh: lich.map((s) => `${s.c.id}:${s.d}s${s.giong ? "🎙" : ""}`), coGiong };
}

const chon = process.argv.slice(2);
for (const v of VIDEO) if (!chon.length || chon.includes(v.ma)) console.log(JSON.stringify(dung(v)));
