// TCS-1 — mảnh dùng chung cho ảnh thẻ chia sẻ (`app/og/**`, chạy ImageResponse phía máy chủ): nạp phông có đủ dấu
// tiếng Việt, khối mã QR (SVG path từ lib/qr.ts — không thư viện ngoài), chân ảnh "hieuban.com" và sao rải tất định.
// Mọi ảnh chia sẻ BẮT BUỘC có mã QR + chữ hieuban.com (docs/THE-CHIA-SE.md).
import { readFile } from "node:fs/promises";
import path from "node:path";
import { duongQr, maHoaQr } from "@/lib/qr";
import { TEN_MIEN } from "@/lib/the-chia-se";

export const MAU = {
  nen: "#0a0a17", nen2: "#14142e", chu: "#ecebf7", mo: "#8a88ac", mo2: "#b3b1cf",
  vang: "#e9c46a", trang: "#b9a7ff", ngoc: "#6fd3b5", giay: "#f4efe2",
} as const;

export type KhungAnh = "ngang" | "doc";
/** 1200×630 (xem trước link) · 1080×1350 (tải về, đăng story / bài 4:5). */
export const CO_ANH: Record<KhungAnh, { width: number; height: number }> = {
  ngang: { width: 1200, height: 630 },
  doc: { width: 1080, height: 1350 },
};
export const khungTuThamSo = (v: string | null): KhungAnh => (v === "doc" ? "doc" : "ngang");

async function font(ten: string): Promise<ArrayBuffer | null> {
  try {
    const b = await readFile(path.join(process.cwd(), "assets", "fonts", ten));
    return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) as ArrayBuffer;
  } catch {
    return null;
  }
}

/** Be Vietnam Pro (Sans) + Newsreader (Serif) — OFL, assets/fonts. Thiếu tệp → ảnh vẫn dựng bằng phông mặc định. */
export async function napPhong() {
  const [sans, serif] = await Promise.all([font("BeVietnamPro-SemiBold.ttf"), font("Newsreader.ttf")]);
  return [
    ...(sans ? [{ name: "Sans", data: sans, weight: 600 as const }] : []),
    ...(serif ? [{ name: "Serif", data: serif, weight: 500 as const }] : []),
  ];
}

/** Ô mã QR: ô tối trên nền sáng (máy quét nào cũng đọc được), vùng yên tĩnh 4 ô. */
export function KhoiQr({ url, canh, toi = MAU.nen, nen = MAU.giay }: { url: string; canh: number; toi?: string; nen?: string }) {
  const qr = maHoaQr(url);
  const n = qr.kichThuoc + 8;
  return (
    <div style={{ display: "flex", background: nen, borderRadius: Math.round(canh * 0.07), width: canh, height: canh }}>
      <svg width={canh} height={canh} viewBox={`0 0 ${n} ${n}`} shapeRendering="crispEdges">
        <path d={duongQr(qr, 4)} fill={toi} />
      </svg>
    </div>
  );
}

/** Cụm QR + tên miền + lời mời quét. `doc`: chữ dưới mã; mặc định: chữ bên trái mã. */
export function ChanQr({ url, canh, loiMoi, doc = false, mauChu = MAU.chu, mauMo = MAU.mo2 }: {
  url: string; canh: number; loiMoi: string; doc?: boolean; mauChu?: string; mauMo?: string;
}) {
  const chu = (
    <div style={{ display: "flex", flexDirection: "column", alignItems: doc ? "center" : "flex-end", marginRight: doc ? 0 : 18, marginTop: doc ? 12 : 0 }}>
      <div style={{ display: "flex", fontSize: Math.round(canh * 0.17), color: mauChu, letterSpacing: 1 }}>{TEN_MIEN}</div>
      <div style={{ display: "flex", fontSize: Math.round(canh * 0.105), color: mauMo, marginTop: 4 }}>{loiMoi}</div>
    </div>
  );
  return (
    <div style={{ display: "flex", flexDirection: doc ? "column" : "row", alignItems: "center" }}>
      {!doc && chu}
      <KhoiQr url={url} canh={canh} />
      {doc && chu}
    </div>
  );
}

/** Sao rải tất định (cùng hạt → cùng bầu trời): [x, y, bán kính, độ sáng]. */
export function saoRai(hat: number, so: number, w: number, h: number): [number, number, number, number][] {
  let s = hat >>> 0 || 1;
  const r = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 2 ** 32; };
  return Array.from({ length: so }, () => [Math.round(r() * w), Math.round(r() * h), 0.8 + r() * 2.2, 0.25 + r() * 0.6]);
}

/** Băm chuỗi ra số (FNV-1a) — hạt cho sao rải theo từng thẻ. */
export function bam(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
