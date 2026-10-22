// ND-0 — CMS đọc sổ trang (lib/so-trang.ts) để đồng bộ collection "Trang website" + "Mẫu cụm trang".
// Chỉ trả khi header x-cms-bi-mat khớp CMS_WEBHOOK_SECRET (so thời gian hằng, như /api/cms/lam-moi). Không lộ gì ngoài
// danh mục URL công khai + chữ mặc định đang hiện trên web.
import { NextResponse } from "next/server";
import { soKhop } from "@/lib/cms";
import { bangChoCms } from "@/lib/chu-trang";
import { MAU_CUM, SO_TRANG } from "@/lib/so-trang";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const bi = process.env.CMS_WEBHOOK_SECRET;
  if (!bi || !soKhop(req.headers.get("x-cms-bi-mat"), bi)) {
    return NextResponse.json({ loi: "Không được phép." }, { status: 401 });
  }
  // ND-7: bảng chữ gửi dạng CMS đọc (nhãn · mặc định · giới hạn · nhóm); mẫu cụm gửi trong mac_dinh như trang.
  const trang = SO_TRANG.map((t) => (t.mac_dinh.chu ? { ...t, mac_dinh: { ...t.mac_dinh, chu: bangChoCms(t.mac_dinh.chu) } } : t));
  const mau = MAU_CUM.map(({ chu, ...m }) => ({ ...m, nguon_kb: m.nguon_kb ?? {}, mac_dinh: chu ? { chu: bangChoCms(chu) } : {} }));
  return NextResponse.json({ trang, mau }, { headers: { "cache-control": "no-store" } });
}
