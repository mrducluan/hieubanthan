// GET /og/ngay?ma=… — NHIP-1: ảnh thẻ "Hôm nay {tên} là Ngày cá nhân N — còn bạn?" 1200×630 (xem trước link + tải về).
// Dữ liệu CHỈ từ mã đã ký (lib/ma-moi.ts docMaNgay) — không có ngày sinh.
import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { docMaNgay } from "@/lib/ma-moi";

export const runtime = "nodejs";

const VONG = Array.from({ length: 9 }, (_, i) => {
  const g = -Math.PI / 2 + (2 * Math.PI * i) / 9;
  return [i + 1, 600 + 250 * Math.cos(g), 300 + 250 * Math.sin(g)] as const;
});

async function font(ten: string): Promise<ArrayBuffer | null> {
  try {
    const b = await readFile(path.join(process.cwd(), "assets", "fonts", ten));
    return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) as ArrayBuffer;
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  const nd = docMaNgay(new URL(req.url).searchParams.get("ma") ?? "");
  const [sans, serif] = await Promise.all([font("BeVietnamPro-SemiBold.ttf"), font("Newsreader.ttf")]);
  const fonts = [
    ...(sans ? [{ name: "Sans", data: sans, weight: 600 as const }] : []),
    ...(serif ? [{ name: "Serif", data: serif, weight: 500 as const }] : []),
  ];
  const vang = "#e9c46a";
  const ngay = nd ? nd.d.split("-").reverse().slice(0, 2).join("/") : "";
  return new ImageResponse(
    (
      <div style={{
        width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        background: "radial-gradient(circle at 50% 45%, #2a2350 0%, #0a0a17 62%)", color: "#ecebf7", fontFamily: "Sans",
      }}>
        <svg width="1200" height="630" viewBox="0 0 1200 630" style={{ position: "absolute", top: 0, left: 0 }}>
          <circle cx="600" cy="300" r="250" fill="none" stroke="rgba(233,196,106,0.18)" strokeWidth="2" />
          <circle cx="600" cy="300" r="290" fill="none" stroke="rgba(185,167,255,0.12)" strokeWidth="2" strokeDasharray="4 14" />
          {VONG.map(([n, x, y]) => (
            <circle key={n} cx={x} cy={y} r={nd && n === nd.n ? 16 : 7} fill={nd && n === nd.n ? vang : "rgba(233,196,106,0.45)"} />
          ))}
        </svg>
        <div style={{ display: "flex", fontSize: 26, letterSpacing: 6, color: "#8a88ac", textTransform: "uppercase" }}>
          {nd ? `Hôm nay ${ngay}` : "Hôm nay của bạn"}
        </div>
        {nd ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ display: "flex", fontSize: 44, marginTop: 10, fontFamily: "Serif" }}>{nd.t} là Ngày cá nhân</div>
            <div style={{ display: "flex", fontSize: 200, lineHeight: 1, color: vang, fontFamily: "Serif" }}>{nd.n}</div>
            {nd.k && <div style={{ display: "flex", fontSize: 32, fontFamily: "Serif", marginTop: 4, maxWidth: 900, textAlign: "center" }}>{nd.k}</div>}
            {(nd.s || nd.hn) && (
              <div style={{ display: "flex", fontSize: 26, marginTop: 14, color: "#b9a7ff" }}>
                {[nd.s ? `Số nổi bật ${nd.s}` : "", nd.hn ? `Chữ của ngày: ${nd.hn}` : ""].filter(Boolean).join("  ·  ")}
              </div>
            )}
            <div style={{ display: "flex", fontSize: 30, marginTop: 22, color: vang }}>Còn bạn hôm nay là ngày mấy?</div>
          </div>
        ) : (
          <div style={{ display: "flex", fontSize: 60, marginTop: 20, fontFamily: "Serif" }}>Mỗi ngày một con số của riêng bạn</div>
        )}
        <div style={{ display: "flex", position: "absolute", bottom: 30, fontSize: 22, color: "#b3b1cf" }}>Hiểu Bản Thân · hieuban.com/hom-nay</div>
      </div>
    ),
    { width: 1200, height: 630, ...(fonts.length ? { fonts } : {}) },
  );
}
