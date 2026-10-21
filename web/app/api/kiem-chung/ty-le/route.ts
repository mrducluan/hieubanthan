// GET /api/kiem-chung/ty-le?mau=a,b,c — LG-ĐS mục 5: "x% trong N người có cùng điểm này thấy đúng" cho thẻ Tử vi.
// Chỉ mã ≥ 30 phiếu (dưới ngưỡng: không có trong kết quả → thẻ hỏi "Bạn thấy đúng không?", không hiện số).
// Đọc từ bảng tỉ lệ cache 1 giờ (lib/hoc-tuvi.bangTyLe); trình duyệt/CDN giữ 1 giờ. Chưa bật → {ty_le: {}}.
import { NextResponse } from "next/server";
import { bangTyLe, type TyLe } from "@/lib/hoc-tuvi";

const MA = /^[a-z0-9_.+-]{3,60}$/;

export async function GET(req: Request) {
  const ds = (new URL(req.url).searchParams.get("mau") ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  if (ds.length > 200 || ds.some((m) => !MA.test(m))) return NextResponse.json({ error: "Mã không hợp lệ" }, { status: 422 });
  const bang: TyLe = ds.length ? await bangTyLe().catch(() => ({})) : {};
  const ty_le: TyLe = {};
  for (const m of new Set(ds)) if (bang[m]) ty_le[m] = bang[m];
  return NextResponse.json({ ty_le }, { headers: { "cache-control": "public, max-age=3600, s-maxage=3600" } });
}
