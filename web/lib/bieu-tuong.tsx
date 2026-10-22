// Biểu tượng ứng dụng (vẽ lại icon.svg) dùng chung cho apple-icon và biểu tượng PNG của web app (manifest) — Chrome chỉ
// hiện nút "Cài ứng dụng" khi manifest có PNG 192 + 512. Bản "maskable" thu emblem vào vùng an toàn 80% để Android cắt
// tròn / bo góc không mất hình.
import { ImageResponse } from "next/og";

export const SVG_BIEU_TUONG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect width="24" height="24" fill="#0a0a17"/><circle cx="12" cy="12" r="10" fill="none" stroke="#e9c46a" stroke-width="1"/><circle cx="12" cy="12" r="7.5" fill="none" stroke="#e9c46a" stroke-width="0.5" opacity="0.5"/><g fill="#ecebf7"><circle cx="12" cy="7" r="0.9"/><circle cx="7" cy="12" r="0.9"/><circle cx="17" cy="12" r="0.9"/><circle cx="12" cy="17" r="0.9"/><circle cx="8.5" cy="8.5" r="0.9"/><circle cx="15.5" cy="8.5" r="0.9"/><circle cx="8.5" cy="15.5" r="0.9"/><circle cx="15.5" cy="15.5" r="0.9"/></g><circle cx="12" cy="12" r="1.5" fill="#e9c46a"/></svg>`;

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
