// GET /og?ma=…[&kieu=moi] — ảnh thẻ chia sẻ 1200×630 (OG + tải về). Dữ liệu CHỈ từ mã đã ký.
// Font Be Vietnam Pro / Newsreader (OFL, assets/fonts) để có đủ dấu tiếng Việt.
import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { docMa } from "@/lib/ma-moi";

export const runtime = "nodejs";

const TEN = ["Đường đời", "Sứ mệnh", "Linh hồn", "Nhân cách"];

async function font(ten: string): Promise<ArrayBuffer | null> {
  try {
    const b = await readFile(path.join(process.cwd(), "assets", "fonts", ten));
    return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) as ArrayBuffer;
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const nd = docMa(url.searchParams.get("ma") ?? "");
  const moi = url.searchParams.get("kieu") === "moi";
  // Trang kiến thức: ảnh chia sẻ mang tiêu đề bài (chữ công khai, không có dữ liệu cá nhân).
  const tieuDe = (url.searchParams.get("tieu_de") ?? "").slice(0, 110);
  const [sans, serif] = await Promise.all([font("BeVietnamPro-SemiBold.ttf"), font("Newsreader.ttf")]);
  const fonts = [
    ...(sans ? [{ name: "Sans", data: sans, weight: 600 as const }] : []),
    ...(serif ? [{ name: "Serif", data: serif, weight: 500 as const }] : []),
  ];
  const vang = "#e9c46a";

  return new ImageResponse(
    (
      <div style={{
        width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        background: "radial-gradient(circle at 80% 0%, #2a2350 0%, #0a0a17 55%)", color: "#ecebf7", fontFamily: "Sans",
      }}>
        <div style={{ display: "flex", fontSize: 26, letterSpacing: 6, color: "#8a88ac", textTransform: "uppercase" }}>
          {moi ? "Lời mời hợp đôi" : !nd && tieuDe ? "Thư viện kiến thức" : "Hồ sơ bản thân"}
        </div>
        {nd ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ display: "flex", fontSize: 46, marginTop: 14, fontFamily: "Serif" }}>
              {moi ? `${nd.t} mời bạn xem hai người` : nd.t}
            </div>
            <div style={{ display: "flex", fontSize: 190, lineHeight: 1, color: vang, fontFamily: "Serif", marginTop: 12 }}>{nd.so[0]}</div>
            {nd.k && <div style={{ display: "flex", fontSize: 36, fontFamily: "Serif", marginTop: 6 }}>{nd.k}</div>}
            {!moi && (
              <div style={{ display: "flex", gap: 22, marginTop: 30 }}>
                {nd.so.map((s, i) => (
                  <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "12px 26px", borderRadius: 18, background: "rgba(255,255,255,0.05)" }}>
                    <div style={{ display: "flex", fontSize: 44, color: vang, fontFamily: "Serif" }}>{s}</div>
                    <div style={{ display: "flex", fontSize: 18, color: "#8a88ac" }}>{TEN[i]}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: "flex", fontSize: tieuDe.length > 60 ? 50 : 60, marginTop: 20, fontFamily: "Serif", textAlign: "center", maxWidth: 1000, lineHeight: 1.2 }}>
            {tieuDe || "Con số nói gì về bạn?"}
          </div>
        )}
        <div style={{ display: "flex", position: "absolute", bottom: 34, fontSize: 24, color: "#b3b1cf" }}>Hiểu Bản Thân · xem con số của bạn</div>
      </div>
    ),
    { width: 1200, height: 630, ...(fonts.length ? { fonts } : {}) },
  );
}
