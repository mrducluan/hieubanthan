// ND-0 — CMS đọc sổ trang (lib/so-trang.ts) để đồng bộ collection "Trang website" + "Mẫu cụm trang".
// Chỉ trả khi header x-cms-bi-mat khớp CMS_WEBHOOK_SECRET (so thời gian hằng, như /api/cms/lam-moi). Không lộ gì ngoài
// danh mục URL công khai + chữ mặc định đang hiện trên web.
import { NextResponse } from "next/server";
import { kiemBiMatCms } from "@/lib/cms";
import { MAU_CUM, SO_TRANG } from "@/lib/so-trang";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const chan = kiemBiMatCms(req);
  if (chan) return chan;
  return NextResponse.json({ trang: SO_TRANG, mau: MAU_CUM }, { headers: { "cache-control": "no-store" } });
}
