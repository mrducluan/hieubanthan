// Biểu tượng PNG 180×180 cho iOS "Thêm vào màn hình chính" và các nền tảng không đọc SVG (vẽ lại icon.svg).
import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

const SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect width="24" height="24" fill="#0a0a17"/><circle cx="12" cy="12" r="10" fill="none" stroke="#e9c46a" stroke-width="1"/><circle cx="12" cy="12" r="7.5" fill="none" stroke="#e9c46a" stroke-width="0.5" opacity="0.5"/><g fill="#ecebf7"><circle cx="12" cy="7" r="0.9"/><circle cx="7" cy="12" r="0.9"/><circle cx="17" cy="12" r="0.9"/><circle cx="12" cy="17" r="0.9"/><circle cx="8.5" cy="8.5" r="0.9"/><circle cx="15.5" cy="8.5" r="0.9"/><circle cx="8.5" cy="15.5" r="0.9"/><circle cx="15.5" cy="15.5" r="0.9"/></g><circle cx="12" cy="12" r="1.5" fill="#e9c46a"/></svg>`;

export default function AppleIcon() {
  return new ImageResponse(
    // eslint-disable-next-line @next/next/no-img-element
    <img alt="" width={180} height={180} src={`data:image/svg+xml;base64,${Buffer.from(SVG).toString("base64")}`} />,
    size,
  );
}
