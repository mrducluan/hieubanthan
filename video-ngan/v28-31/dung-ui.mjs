// Dựng video "giao diện thật" (HyperFrames) từ kich-ban.json (video có "kieu": "ui") + ảnh chụp ui/ (chup-ui.mjs).
//   node dung-ui.mjs [mã video…]
// Bố cục 1080×1920 phủ kín: thương hiệu (trên cùng) · tiêu đề · khung trình duyệt hieuban.com chạy tới đáy màn,
// tự cuộn tới đúng vùng đang nói và khoanh sáng · phụ đề đè lên khung. Không để mảng trống.
// "nhin": ["ảnh" | "ảnh/vùng", …] — vùng lấy toạ độ trong ui/ui.json; các ảnh xếp thành một cột như trang thật.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const DIR = path.dirname(fileURLToPath(import.meta.url));
const KB = JSON.parse(fs.readFileSync(path.join(DIR, "kich-ban.json"), "utf8"));
const UI = JSON.parse(fs.readFileSync(path.join(DIR, "ui", "ui.json"), "utf8"));
const GIONG_TEP = path.join(DIR, "giong", "giong.json");
const GIONG = fs.existsSync(GIONG_TEP) ? JSON.parse(fs.readFileSync(GIONG_TEP, "utf8")) : {};
const chon = process.argv.slice(2);
const W = 1080, H = 1920;
const KHUNG = { x: 40, y: 424, w: 1000, thanh: 88 };          // khung trình duyệt
const THAN_Y = KHUNG.y + KHUNG.thanh, THAN_H = H - THAN_Y;
const NEO = 430;                                               // tâm vùng đang nói, tính từ đầu thân khung
const KHE = 28;

const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const r2 = x => Math.round(x * 100) / 100;
const sach = vo => vo.replace(/\[[^\]]*\]/g, "").replace(/\s+/g, " ").trim();
const amTiet = s => s.split(/\s+/).filter(w => /[\p{L}\p{N}]/u.test(w)).length;
const uocTinh = vo => { const t = sach(vo); return amTiet(t) / 4.1 + (t.match(/[.,?:!;]/g) || []).length * 0.18 + 0.3; };
function phuDe(vo, giay) {
  const phan = sach(vo).split(/(?<=[,.?!:;])\s+/).filter(Boolean); const gop = [];
  for (const p of phan) { if (gop.length && amTiet(gop[gop.length - 1]) < 8) gop[gop.length - 1] += " " + p; else gop.push(p); }
  const tong = gop.reduce((a, p) => a + amTiet(p), 0) || 1; let t0 = 0;
  // Lời đọc viết "hiểu bản chấm com" cho giọng đọc đúng; chữ trên màn hình luôn là tên miền.
  return gop.map(p => { const d = giay * amTiet(p) / tong; const r = { t: t0, d, p: p.replace(/hiểu bản chấm com/gi, "hieuban.com") }; t0 += d; return r; });
}
const tieuDe = s => { let trong = false; return String(s).split(/\s+/).map(w => { let h = trong ? "<em>" : ""; for (const ch of w) { if (ch === "*") { h += trong ? "</em>" : "<em>"; trong = !trong; } else h += esc(ch); } if (trong) h += "</em>"; return `<span class="w">${h.replace(/<em><\/em>/g, "")}</span>`; }).join(" "); };

// Cột ảnh của một cảnh + các điểm dừng cuộn
function cot(c) {
  const ten = [];
  for (const n of c.nhin) { const a = n.split("/")[0]; if (!ten.includes(a)) ten.push(a); }
  const duoi = c.duoi ?? [];                          // phần trang tiếp theo, để khung không bao giờ hụt đáy
  for (const a of duoi) if (!ten.includes(a)) ten.push(a);
  let y = 0; const anh = {};
  for (const a of ten) {
    const m = UI[a]; if (!m) throw new Error("thiếu ảnh " + a);
    const ty = KHUNG.w / m.w; anh[a] = { y, ty, h: m.h * ty }; y += m.h * ty + KHE;
  }
  const cao = y - KHE;
  if (cao < THAN_H) console.warn("  cột hụt đáy", c.chu, Math.round(cao));
  const dung = c.nhin.map(n => {
    const [a, k] = n.split("/"); const A = anh[a];
    const o = k ? k.split("+").map(x => UI[a].vung[x]) : [];
    const v = o.length && o.every(Boolean) ? o.reduce((g, b) => { const x = Math.min(g.x, b.x), y = Math.min(g.y, b.y); return { x, y, w: Math.max(g.x + g.w, b.x + b.w) - x, h: Math.max(g.y + g.h, b.y + b.h) - y }; }) : null;
    if (k && !v) throw new Error("thiếu vùng " + n);
    const box = v ? { x: v.x * A.ty, y: A.y + v.y * A.ty, w: v.w * A.ty, h: v.h * A.ty } : null;
    let dich = box ? (box.h > 760 ? 36 - box.y : NEO - (box.y + box.h / 2)) : -A.y;
    dich = Math.min(0, Math.max(Math.min(0, THAN_H - cao), dich));
    return { dich: r2(dich), box };
  });
  return { ten, anh, dung };
}

function dung(v) {
  const ra = path.join(DIR, `hf-${v.ma}`), as = path.join(ra, "assets");
  fs.rmSync(as, { recursive: true, force: true });
  fs.mkdirSync(path.join(as, "vo"), { recursive: true });
  // thư mục hf-<mã>/ không vào git: tự tạo tệp dự án HyperFrames khi chưa có
  const duAn = { "package.json": { name: `hf-${v.ma}`, private: true, type: "module", scripts: { check: "npx --yes hyperframes@0.9.97 check", render: "npx --yes hyperframes@0.9.97 render" } }, "meta.json": { id: `hf-${v.ma}`, name: `hf-${v.ma}` } };
  for (const [f, noi] of Object.entries(duAn)) if (!fs.existsSync(path.join(ra, f))) fs.writeFileSync(path.join(ra, f), JSON.stringify(noi, null, 2) + "\n");
  fs.copyFileSync(path.join(DIR, "../../web/public/thuong-hieu/logo-doc-nen-toi-trong-suot.svg"), path.join(as, "logo.svg"));
  let S = 0;
  const ds = v.canh.map((c, i) => {
    const g = GIONG[`${v.ma}-${i + 1}`]; const giay = g ? g.giay : uocTinh(c.vo);
    if (g) fs.copyFileSync(path.join(DIR, "giong", g.tep), path.join(as, "vo", g.tep));
    const cuoi = i === v.canh.length - 1;
    const D = r2(giay + 0.55 + (cuoi ? 1.6 : 0) + (i === 0 ? 0.2 : 0));
    const r = { c, k: i + 1, S: r2(S), D, giay, g, cuoi, ...cot(c) }; S += D; return r;
  });
  const T = r2(S);
  for (const a of new Set(ds.flatMap(d => d.ten))) fs.copyFileSync(path.join(DIR, "ui", `${a}.png`), path.join(as, `${a}.png`));
  // "anh": ảnh thật bên ngoài (anh/, nguồn ở NGUON-ANH.md) mở đầu cảnh, rồi khung giao diện trượt lên sau "giu" giây
  for (const a of new Set(ds.map(d => d.c.anh).filter(Boolean))) fs.copyFileSync(path.join(DIR, "anh", `${a}.jpg`), path.join(as, `${a}.jpg`));

  let seed = 11 + v.ma.charCodeAt(2); const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
  const sao = Array.from({ length: 50 }, () => `<i class="star" style="left:${(rnd() * W).toFixed(0)}px;top:${(rnd() * KHUNG.y).toFixed(0)}px;width:${(2 + rnd() * 3).toFixed(1)}px;height:${(2 + rnd() * 3).toFixed(1)}px;opacity:${(.25 + rnd() * .6).toFixed(2)}"></i>`).join("");

  const canh = ds.map(d => {
    const { c, k, S, D, ten, anh, dung: dg } = d;
    const imgs = ten.map(a => `<img src="assets/${a}.png" style="top:${r2(anh[a].y)}px" alt="">`).join("");
    const hl = dg.map((p, j) => p.box ? `<div class="hl" id="h${k}-${j}" style="left:${r2(Math.max(8, p.box.x - 12))}px;top:${r2(p.box.y - 12)}px;width:${r2(Math.min(KHUNG.w - 16, p.box.w + 24))}px;height:${r2(p.box.h + 24)}px"></div>` : "").join("");
    const ket = d.cuoi ? `<div class="ket" id="ket"><img src="assets/logo.svg" alt=""><b>${esc(v.ket.url)}</b><span>${esc(v.ket.nut)}</span></div>` : "";
    const nen = c.anh ? `<div class="nenanh" data-layout-allow-overflow><img id="a${k}" src="assets/${c.anh}.jpg" alt=""><i></i></div>` : "";
    return `<section id="s${k}" class="clip scene" data-start="${S}" data-duration="${D}" data-track-index="1">
  ${nen}
  <div class="brand" data-layout-ignore><span>hieuban<b>.com</b></span><em>${esc(v.mang)}</em></div>
  <div class="head"><h1>${tieuDe(c.chu)}</h1><p>${esc(c.phu)}</p></div>
  <div class="khung" id="kh${k}"><div class="thanh"><i></i><i></i><i></i><span>🔒 ${esc(c.url)}</span></div>
    <div class="than" data-layout-allow-overflow><div class="cot" id="c${k}">${imgs}${hl}</div></div></div>
  ${ket}
</section>`;
  }).join("\n");

  const caps = ds.flatMap(({ c, k, S, giay }) => phuDe(c.vo, giay).map((p, j) => ({ id: `cap${k}-${j}`, bd: r2(S + .15 + p.t), d: r2(Math.max(.4, p.d)), p: p.p })));
  const flashes = ds.slice(1).map(({ S }, j) => `<div id="fx${j}" class="clip flash" data-start="${r2(Math.max(0, S - .3))}" data-duration=".7" data-track-index="3"><i></i></div>`).join("\n");
  const voice = ds.filter(d => d.g).map(({ k, S, g }) => `<audio id="vo${k}" class="clip" src="assets/vo/${g.tep}" data-start="${r2(S + .15)}" data-track-index="5" data-volume="1"></audio>`).join("\n");
  const coGiong = ds.some(d => d.g);
  execFileSync("python3", [path.join(DIR, "nhac.py"), path.join(as, "nhac.wav"), String(T), v.ma, ds.map(d => d.S.toFixed(2)).join(","),
    ds.filter(d => d.g).map(d => `${r2(d.S + .15)}-${r2(d.S + .15 + d.giay)}`).join(";")]);

  const js = ds.map(({ c, k, S, D, dung: dg, cuoi }) => {
    const tin = c.anh ? Math.min(c.giu ?? 1.5, D * .45) : 0;
    const n = dg.length, doan = (D - tin) / n; const o = [];
    if (tin) {
      o.push(`tl.fromTo("#a${k}",{scale:1.04},{scale:1.16,duration:${D},ease:"none"},${S});`);
      o.push(`tl.fromTo("#s${k} .head",{y:300},{y:0,duration:.55,ease:"power3.inOut"},${r2(S + tin - .1)});`);
      o.push(`tl.fromTo("#kh${k}",{y:${H - KHUNG.y}},{y:0,duration:.6,ease:"power3.out"},${r2(S + tin)});`);
    }
    o.push(`tl.fromTo("#s${k} .head .w",{opacity:0,y:26},{opacity:1,y:0,duration:.4,stagger:.05,ease:"power2.out"},${r2(S + .02)});`);
    o.push(`tl.fromTo("#s${k} .head p",{opacity:0},{opacity:1,duration:.4},${r2(S + .35)});`);
    if (!tin) o.push(`tl.fromTo("#kh${k}",{opacity:.25},{opacity:1,duration:.3},${r2(S)});`);
    dg.forEach((p, j) => {
      const bd = r2(S + tin + j * doan);
      const tu = j === 0 ? Math.min(0, p.dich + 110) : dg[j - 1].dich;
      o.push(`tl.fromTo("#c${k}",{y:${tu}},{y:${p.dich},duration:${r2(Math.min(.9, doan * .55))},ease:"power2.inOut",immediateRender:${j === 0}},${bd});`);
      if (p.box) {
        o.push(`tl.fromTo("#h${k}-${j}",{opacity:0,scale:1.04},{opacity:1,scale:1,duration:.35,ease:"power2.out"},${r2(bd + Math.min(.7, doan * .4))});`);
        if (j < n - 1) o.push(`tl.fromTo("#h${k}-${j}",{opacity:1},{opacity:0,duration:.25,immediateRender:false},${r2(bd + doan - .15)});`);
      }
    });
    if (cuoi) o.push(`tl.fromTo("#ket",{opacity:0,y:60},{opacity:1,y:0,duration:.5,ease:"back.out(1.4)"},${r2(S + D * .45)});`);
    return o.join("\n");
  }).join("\n");

  const html = `<!doctype html>
<html lang="vi">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=${W}, height=${H}" />
<script src="https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js"></script>
<style>
:root{--acc:${v.mau}}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:${W}px;height:${H}px;overflow:hidden;background:#07081a;font-family:Montserrat,sans-serif;color:#f4f2fb}
#bg{position:absolute;inset:0;background:radial-gradient(90% 40% at 20% 6%,rgba(233,196,106,.28),transparent 70%),radial-gradient(120% 60% at 80% 0%,#2c2f78 0%,#12143a 45%,#07081a 100%)}
#bg .star{position:absolute;border-radius:50%;background:#fff;box-shadow:0 0 6px #fff}
.brand{z-index:6;position:absolute;left:60px;right:60px;top:56px;display:flex;justify-content:space-between;align-items:center;font-size:34px;font-weight:800}
.brand b{color:var(--acc)}
.brand em{font-style:normal;font-size:28px;color:#0b0d22;background:var(--acc);border-radius:999px;padding:10px 28px}
.scene{position:absolute;inset:0}
.nenanh{position:absolute;inset:0;overflow:hidden;z-index:0}
.nenanh img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.nenanh i{position:absolute;inset:0;background:linear-gradient(180deg,rgba(7,8,26,.84) 0%,rgba(7,8,26,.66) 24%,rgba(7,8,26,.42) 50%,rgba(7,8,26,.38) 70%,rgba(7,8,26,.86) 100%)}
.head{z-index:3;position:absolute;left:60px;width:960px;top:132px;height:268px;display:flex;flex-direction:column;justify-content:center;gap:18px}
.head h1{font-size:68px;font-weight:800;line-height:1.14;letter-spacing:-.01em;text-shadow:0 4px 18px rgba(0,0,0,.75)}
.head h1 em{font-style:normal;color:var(--acc)}
.head .w{display:inline-block}
.head p{font-size:36px;font-weight:600;color:#e6e4f6;text-shadow:0 3px 12px rgba(0,0,0,.8)}
.khung{z-index:4;position:absolute;left:${KHUNG.x}px;top:${KHUNG.y}px;width:${KHUNG.w}px;height:${H - KHUNG.y}px;background:#0f1022;border-radius:44px 44px 0 0;box-shadow:0 0 0 3px rgba(233,196,106,.55),0 -10px 60px rgba(0,0,0,.55);overflow:hidden}
.thanh{height:${KHUNG.thanh}px;display:flex;align-items:center;gap:12px;padding:0 28px;background:#1b1d38;border-bottom:2px solid rgba(255,255,255,.1)}
.thanh i{width:18px;height:18px;border-radius:50%;background:#4a4d70}
.thanh span{margin-left:16px;flex:1;background:#0b0c1c;border-radius:999px;padding:10px 26px;font-size:32px;font-weight:700;color:#f4f2fb}
.than{position:relative;height:${THAN_H}px;overflow:hidden}
.cot{position:absolute;left:0;top:0;width:${KHUNG.w}px}
.cot img{position:absolute;left:0;width:${KHUNG.w}px;height:auto;display:block}
.hl{position:absolute;border:7px solid var(--acc);border-radius:30px;box-shadow:0 0 38px var(--acc),0 0 0 2000px rgba(5,6,18,.26);opacity:0}
.cap{z-index:7;position:absolute;left:50px;width:980px;top:1558px;display:flex;justify-content:center}
.cap span{display:inline-block;text-align:center;font-size:46px;font-weight:800;line-height:1.3;background:rgba(5,6,20,.93);border:2px solid rgba(255,255,255,.14);padding:18px 30px;border-radius:26px;box-shadow:0 12px 40px rgba(0,0,0,.6)}
.ket{z-index:5;position:absolute;left:100px;width:880px;top:1010px;display:flex;flex-direction:column;align-items:center;gap:20px;padding:40px 30px;border-radius:40px;background:rgba(9,10,30,.96);border:4px solid var(--acc);box-shadow:0 20px 80px rgba(0,0,0,.7)}
.ket img{width:250px;height:auto}
.ket b{font-size:46px;color:var(--acc)}
.ket span{font-size:34px;font-weight:800;color:#0b0d22;background:var(--acc);border-radius:999px;padding:16px 40px}
.flash{position:absolute;inset:0;pointer-events:none}
.flash i{position:absolute;left:-40%;top:0;width:60%;height:100%;background:linear-gradient(100deg,rgba(255,255,255,0),rgba(255,236,190,.4),rgba(255,255,255,0));opacity:0}
</style>
</head>
<body>
<div id="root" data-composition-id="main" data-start="0" data-duration="${T}" data-width="${W}" data-height="${H}">
<div id="bg" class="clip" data-start="0" data-duration="${T}" data-track-index="0">${sao}</div>
${canh}
${caps.map(x => `<div id="${x.id}" class="clip cap" data-start="${x.bd}" data-duration="${x.d}" data-track-index="2"><span>${esc(x.p)}</span></div>`).join("\n")}
${flashes}
<audio id="nhac" class="clip" src="assets/nhac.wav" data-start="0" data-duration="${T}" data-track-index="6" data-volume="${coGiong ? 0.55 : 0.8}"></audio>
${voice}
</div>
<script>
const tl = gsap.timeline({ paused: true });
${js}
${ds.slice(1).map(({ S }, j) => `tl.fromTo("#fx${j} i",{x:0,opacity:0},{x:1500,opacity:1,duration:.7,ease:"power2.inOut"},${r2(Math.max(0, S - .3))});`).join("\n")}
${caps.map(x => `tl.fromTo("#${x.id} span",{opacity:0,y:14},{opacity:1,y:0,duration:.18},${x.bd});`).join("\n")}
window.__timelines["main"] = tl;
tl.seek(0);
</script>
</body>
</html>
`;
  fs.writeFileSync(path.join(ra, "index.html"), html);
  console.log(`${v.ma}: ${ds.length} cảnh, ${T}s ${coGiong ? "(giọng thật)" : "(ước tính)"}`);
}

for (const v of KB.video) if (v.kieu === "ui" && (!chon.length || chon.includes(v.ma))) dung(v);
