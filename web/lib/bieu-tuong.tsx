// Biểu tượng ứng dụng (vẽ lại icon.svg — bản vuông không bo góc) dùng chung cho apple-icon và biểu tượng PNG của web app (manifest) — Chrome chỉ
// hiện nút "Cài ứng dụng" khi manifest có PNG 192 + 512. Bản "maskable" thu emblem vào vùng an toàn 80% để Android cắt
// tròn / bo góc không mất hình.
import { ImageResponse } from "next/og";

export const SVG_BIEU_TUONG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="Hiểu Bản Thân"><title>Hiểu Bản Thân</title><defs><linearGradient id="vb" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFF3D1"/><stop offset=".45" stop-color="#E9C46A"/><stop offset="1" stop-color="#B8862D"/></linearGradient><linearGradient id="lb" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#C4DAFF"/><stop offset=".55" stop-color="#5B95F5"/><stop offset="1" stop-color="#3F7FE0"/></linearGradient></defs><rect width="64" height="64" fill="#0A0A17"/><g transform="translate(32 32) scale(0.335) translate(-100 -100)"><path d="M19.1 100 A90.45 90.45 0 0 1 180.9 100 A90.45 90.45 0 0 1 19.1 100 Z" fill="none" stroke="url(#vb)" stroke-width="6.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M13.2 100 L19.1 97.0 L19.1 103.0 Z M186.8 100 L180.9 97.0 L180.9 103.0 Z" fill="url(#vb)"/><circle cx="100" cy="100" r="30.9" fill="none" stroke="url(#lb)" stroke-width="5.4" stroke-linecap="round" stroke-dasharray="10.00 11.5723" transform="rotate(-90 100 100)"/><path d="M100 80.9 C101.6 95.8 104.2 98.4 119.1 100 C104.2 101.6 101.6 104.2 100 119.1 C98.4 104.2 95.8 101.6 80.9 100 C95.8 98.4 98.4 95.8 100 80.9 Z" fill="url(#vb)"/><circle cx="100" cy="100" r="2.6" fill="#6FD3B5"/></g></svg>`;

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
