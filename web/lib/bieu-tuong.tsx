// Biểu tượng ứng dụng (vẽ lại icon.svg — bản vuông không bo góc) dùng chung cho apple-icon và biểu tượng PNG của web app (manifest) — Chrome chỉ
// hiện nút "Cài ứng dụng" khi manifest có PNG 192 + 512. Bản "maskable" thu emblem vào vùng an toàn 80% để Android cắt
// tròn / bo góc không mất hình.
import { ImageResponse } from "next/og";

export const SVG_BIEU_TUONG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="Hiểu Bản Thân"><title>Hiểu Bản Thân</title><defs><linearGradient id="vb" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFEDBE"/><stop offset=".5" stop-color="#E9C46A"/><stop offset="1" stop-color="#C9962F"/></linearGradient></defs><rect width="64" height="64" fill="#0A0A17"/><path d="M6 32 Q32 10 58 32 Q32 54 6 32 Z" fill="none" stroke="url(#vb)" stroke-width="4.6" stroke-linejoin="round"/><circle cx="32" cy="32" r="11.5" fill="none" stroke="#6FA2F2" stroke-width="3.6"/><path d="M32 23 C32.7 29.5 33.6 31.3 41 32 C33.6 32.7 32.7 34.5 32 41 C31.3 34.5 30.4 32.7 23 32 C30.4 31.3 31.3 29.5 32 23 Z" fill="url(#vb)"/></svg>`;

const nguon = `data:image/svg+xml;base64,${Buffer.from(SVG_BIEU_TUONG).toString("base64")}`;

export function anhBieuTuong(co: number, maskable = false, dau?: Record<string, string>): ImageResponse {
  const trong = maskable ? Math.round(co * 0.72) : co;
  return new ImageResponse(
    <div style={{ width: co, height: co, display: "flex", alignItems: "center", justifyContent: "center", background: "#0a0a17" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img alt="" width={trong} height={trong} src={nguon} />
    </div>,
    { width: co, height: co, ...(dau ? { headers: dau } : {}) },
  );
}
