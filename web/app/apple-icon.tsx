// Biểu tượng PNG 180×180 cho iOS "Thêm vào màn hình chính" và các nền tảng không đọc SVG (vẽ lại icon.svg).
import { anhBieuTuong } from "@/lib/bieu-tuong";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return anhBieuTuong(180);
}
