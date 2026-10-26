// BLOG-7 — ảnh minh hoạ NỀN SÁNG cho bài blog (ảnh bìa 1600×900 + ảnh "Tóm tắt nhanh" 1600×900), vẽ ngay trong CMS bằng
// next/og (đã có trong gói next, không thêm dependency). Chủ dự án 2026-10-26: ảnh nền tối trùng màu nền site (Đêm sao) nên
// chìm → ảnh mới dùng nền giấy sáng, chữ mực tím than, điểm vàng đậm. Chỉ chữ công khai của bài (tiêu đề, sapo, tiêu đề mục)
// — không dữ liệu người dùng. Phông Be Vietnam Pro + Newsreader (OFL, assets/fonts) cho đủ dấu tiếng Việt.
import { readFile } from "node:fs/promises";
import path from "node:path";
import { createElement as h, type ReactElement } from "react";

export const CO_ANH = { width: 1600, height: 900 } as const;

export const MAU_SANG = {
  nen1: "#fbf6ea", nen2: "#efe2c4", muc: "#221d3f", mo: "#5f5878", vang: "#a2690f", vangNhat: "#d8bf86", khung: "#d6c393",
  tim: "#4b3f8f",
} as const;

export type MangAnh = "than_so" | "tu_vi" | "bat_tu" | "kinh_dich" | "phong_thuy" | "chung";

export const TEN_MANG: Record<MangAnh, string> = {
  than_so: "Thần số học", tu_vi: "Tử vi", bat_tu: "Bát tự", kinh_dich: "Kinh Dịch", phong_thuy: "Phong thuỷ", chung: "Hiểu Bản Thân",
};

type Phong = { name: string; data: ArrayBuffer; weight: 500 | 600; style: "normal" };
let phongNho: Promise<Phong[]> | null = null;

async function docPhong(ten: string): Promise<ArrayBuffer | null> {
  for (const goc of [process.cwd(), path.join(process.cwd(), "cms")]) {
    try {
      const b = await readFile(path.join(goc, "assets", "fonts", ten));
      return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) as ArrayBuffer;
    } catch { /* thử thư mục kế */ }
  }
  return null;
}

function napPhong(): Promise<Phong[]> {
  phongNho ??= Promise.all([docPhong("BeVietnamPro-SemiBold.ttf"), docPhong("Newsreader.ttf")]).then(([sans, serif]) => [
    ...(sans ? [{ name: "Sans", data: sans, weight: 600 as const, style: "normal" as const }] : []),
    ...(serif ? [{ name: "Serif", data: serif, weight: 500 as const, style: "normal" as const }] : []),
  ]);
  return phongNho;
}

/** Cắt chuỗi ở ranh giới từ, không quá `n` ký tự (thêm "…" khi cắt). */
export function catChu(s: string, n: number): string {
  const t = s.replace(/\s+/g, " ").trim();
  if (t.length <= n) return t;
  const c = t.slice(0, n - 1);
  return `${c.slice(0, c.lastIndexOf(" ") > n * 0.5 ? c.lastIndexOf(" ") : c.length).replace(/[,;:.\-–—]+$/, "")}…`;
}

// ------------------------------------------------------------------ hoạ tiết theo mảng (SVG nét mảnh, không chữ ngoài số)

function hoaTiet(mang: MangAnh, canh: number): ReactElement {
  const c = canh / 2, r = canh * 0.42;
  const net = { stroke: MAU_SANG.vang, fill: "none" };
  const con: ReactElement[] = [
    h("circle", { key: "v1", cx: c, cy: c, r, ...net, strokeWidth: 3, strokeOpacity: 0.55 }),
    h("circle", { key: "v2", cx: c, cy: c, r: r * 0.86, ...net, strokeWidth: 1.5, strokeOpacity: 0.35 }),
  ];
  const diem = (n: number, rr: number, lech = -Math.PI / 2) =>
    Array.from({ length: n }, (_, i) => [c + rr * Math.cos(lech + (2 * Math.PI * i) / n), c + rr * Math.sin(lech + (2 * Math.PI * i) / n)] as const);

  if (mang === "than_so") {
    const p = diem(9, r * 0.72);
    // Nối 1→4→7, 2→5→8, 3→6→9 (ba tam giác lồng) — hình "vòng số" quen thuộc của site, bản sáng.
    for (let k = 0; k < 3; k++) {
      const [a, b, d] = [p[k]!, p[k + 3]!, p[k + 6]!];
      con.push(h("path", { key: `t${k}`, d: `M${a[0]} ${a[1]} L${b[0]} ${b[1]} L${d[0]} ${d[1]} Z`, stroke: MAU_SANG.tim, strokeOpacity: 0.45, strokeWidth: 2, fill: "none" }));
    }
    p.forEach(([x, y], i) => {
      con.push(h("circle", { key: `c${i}`, cx: x, cy: y, r: canh * 0.055, fill: MAU_SANG.nen1, stroke: MAU_SANG.vang, strokeWidth: 3 }));
    });
  } else if (mang === "tu_vi") {
    // 12 cung: lưới 4×4 bỏ 4 ô giữa.
    const o = (r * 1.5) / 4, x0 = c - o * 2, y0 = c - o * 2;
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
      if (i > 0 && i < 3 && j > 0 && j < 3) continue;
      con.push(h("rect", { key: `o${i}${j}`, x: x0 + j * o + 4, y: y0 + i * o + 4, width: o - 8, height: o - 8, rx: 10,
        fill: (i + j) % 3 === 0 ? MAU_SANG.vangNhat : MAU_SANG.nen1, fillOpacity: 0.7, stroke: MAU_SANG.vang, strokeWidth: 2 }));
    }
    con.push(h("circle", { key: "tam", cx: c, cy: c, r: o * 0.55, fill: "none", stroke: MAU_SANG.tim, strokeWidth: 3, strokeOpacity: 0.6 }));
  } else if (mang === "bat_tu") {
    const w = r * 0.32, cao = r * 1.25, khe = r * 0.1, x0 = c - (4 * w + 3 * khe) / 2;
    for (let i = 0; i < 4; i++) {
      const x = x0 + i * (w + khe);
      con.push(h("rect", { key: `tr${i}`, x, y: c - cao / 2, width: w, height: cao, rx: 12, fill: i === 2 ? MAU_SANG.vangNhat : MAU_SANG.nen1,
        stroke: MAU_SANG.vang, strokeWidth: 3 }));
      con.push(h("line", { key: `g${i}`, x1: x + 8, x2: x + w - 8, y1: c, y2: c, stroke: MAU_SANG.tim, strokeOpacity: 0.5, strokeWidth: 2 }));
    }
  } else if (mang === "kinh_dich") {
    // Quẻ Thuỷ Hoả Ký Tế: âm dương xen kẽ.
    const w = r * 1.1, day = r * 0.11, khe = r * 0.07, y0 = c - (6 * day + 5 * khe) / 2;
    for (let i = 0; i < 6; i++) {
      const y = y0 + i * (day + khe), duong = i % 2 === 1;
      if (duong) con.push(h("rect", { key: `h${i}`, x: c - w / 2, y, width: w, height: day, rx: 6, fill: MAU_SANG.muc, fillOpacity: 0.85 }));
      else {
        con.push(h("rect", { key: `h${i}a`, x: c - w / 2, y, width: w * 0.43, height: day, rx: 6, fill: MAU_SANG.vang }));
        con.push(h("rect", { key: `h${i}b`, x: c + w * 0.07, y, width: w * 0.43, height: day, rx: 6, fill: MAU_SANG.vang }));
      }
    }
  } else if (mang === "phong_thuy") {
    diem(24, r * 0.93).forEach(([x, y], i) => {
      const [x2, y2] = [c + (x - c) * (i % 3 === 0 ? 0.84 : 0.9), c + (y - c) * (i % 3 === 0 ? 0.84 : 0.9)];
      con.push(h("line", { key: `k${i}`, x1: x, y1: y, x2, y2, stroke: MAU_SANG.vang, strokeWidth: i % 3 === 0 ? 4 : 2 }));
    });
    const kim = r * 0.62;
    con.push(h("path", { key: "kb", d: `M${c} ${c - kim} L${c + 22} ${c} L${c - 22} ${c} Z`, fill: MAU_SANG.vang }));
    con.push(h("path", { key: "kn", d: `M${c} ${c + kim} L${c + 22} ${c} L${c - 22} ${c} Z`, fill: MAU_SANG.tim, fillOpacity: 0.7 }));
    con.push(h("circle", { key: "tamk", cx: c, cy: c, r: 14, fill: MAU_SANG.nen1, stroke: MAU_SANG.muc, strokeWidth: 3 }));
  } else {
    // Chung: trăng khuyết + chòm sao.
    con.push(h("circle", { key: "tr", cx: c, cy: c, r: r * 0.45, fill: MAU_SANG.vangNhat }));
    con.push(h("circle", { key: "tr2", cx: c + r * 0.2, cy: c - r * 0.12, r: r * 0.4, fill: MAU_SANG.nen1 }));
    diem(7, r * 0.7, -1.1).forEach(([x, y], i) => con.push(h("circle", { key: `s${i}`, cx: x, cy: y, r: 7, fill: MAU_SANG.tim, fillOpacity: 0.6 })));
  }
  return h("svg", { width: canh, height: canh, viewBox: `0 0 ${canh} ${canh}` }, ...con);
}

// ------------------------------------------------------------------ khung chung

function khung(con: ReactElement[]): ReactElement {
  return h("div", {
    style: {
      width: "100%", height: "100%", display: "flex", position: "relative", fontFamily: "Sans", color: MAU_SANG.muc,
      background: `linear-gradient(135deg, ${MAU_SANG.nen1} 0%, #f6edd9 55%, ${MAU_SANG.nen2} 100%)`, padding: 28,
    },
  }, h("div", {
    style: { display: "flex", flex: 1, position: "relative", border: `2px solid ${MAU_SANG.khung}`, borderRadius: 28, padding: "64px 72px" },
  }, ...con));
}

const chanTrang = () => h("div", { key: "chan",
  style: { display: "flex", position: "absolute", left: 72, bottom: 44, fontSize: 28, color: MAU_SANG.vang, letterSpacing: 1 },
}, "hieuban.com");

async function veAnh(goc: ReactElement): Promise<Buffer> {
  const { ImageResponse } = await import("next/og.js");
  const fonts = await napPhong();
  const r = new ImageResponse(goc, { ...CO_ANH, ...(fonts.length ? { fonts } : {}) });
  return Buffer.from(await r.arrayBuffer());
}

/** Ảnh bìa: nhãn mảng + tiêu đề lớn + sapo ngắn bên trái, hoạ tiết mảng bên phải. PNG 1600×900. */
export function veAnhBia({ tieuDe, phu, mang }: { tieuDe: string; phu?: string | null; mang: MangAnh }): Promise<Buffer> {
  const td = catChu(tieuDe, 110);
  const coChu = td.length > 70 ? 66 : td.length > 44 ? 80 : 96;
  return veAnh(khung([
    h("div", { key: "trai", style: { display: "flex", flexDirection: "column", width: 900, justifyContent: "center", paddingBottom: 40 } },
      h("div", { style: { display: "flex", fontSize: 28, letterSpacing: 6, color: MAU_SANG.vang, textTransform: "uppercase" } }, TEN_MANG[mang]),
      h("div", { style: { display: "flex", width: 120, height: 4, background: MAU_SANG.vang, marginTop: 18, borderRadius: 2 } }),
      h("div", { style: { display: "flex", fontFamily: "Serif", fontSize: coChu, lineHeight: 1.12, marginTop: 30, color: MAU_SANG.muc } }, td),
      ...(phu ? [h("div", { key: "phu", style: { display: "flex", fontSize: 34, lineHeight: 1.4, marginTop: 30, color: MAU_SANG.mo } }, catChu(phu, 120))] : []),
    ),
    h("div", { key: "phai", style: { display: "flex", flex: 1, alignItems: "center", justifyContent: "center" } }, hoaTiet(mang, 520)),
    chanTrang(),
  ]));
}

/** Ảnh "Tóm tắt nhanh": tiêu đề bài + tối đa 5 ý (tiêu đề các mục H2), đánh số. PNG 1600×900. */
export function veAnhTomTat({ tieuDe, y, mang }: { tieuDe: string; y: string[]; mang: MangAnh }): Promise<Buffer> {
  const ds = y.slice(0, 5).map((s) => catChu(s, 70));
  const coY = ds.length > 4 ? 36 : 40;
  return veAnh(khung([
    h("div", { key: "trai", style: { display: "flex", flexDirection: "column", width: 1080 } },
      h("div", { style: { display: "flex", fontSize: 26, letterSpacing: 6, color: MAU_SANG.vang, textTransform: "uppercase" } },
        `Tóm tắt nhanh · ${TEN_MANG[mang]}`),
      h("div", { style: { display: "flex", fontFamily: "Serif", fontSize: 54, lineHeight: 1.15, marginTop: 18 } }, catChu(tieuDe, 80)),
      h("div", { style: { display: "flex", flexDirection: "column", marginTop: 40 } },
        ...ds.map((s, i) => h("div", { key: `y${i}`, style: { display: "flex", alignItems: "center", marginBottom: 22, fontSize: coY, lineHeight: 1.25 } },
          h("div", { style: { display: "flex", width: 56, height: 56, borderRadius: 28, background: MAU_SANG.vang, color: MAU_SANG.nen1,
            fontSize: 28, alignItems: "center", justifyContent: "center", marginRight: 26, flexShrink: 0 } }, String(i + 1)),
          h("div", { style: { display: "flex", flex: 1, color: MAU_SANG.muc } }, s)))),
    ),
    h("div", { key: "phai", style: { display: "flex", flex: 1, alignItems: "center", justifyContent: "center", opacity: 0.9 } }, hoaTiet(mang, 340)),
    chanTrang(),
  ]));
}
