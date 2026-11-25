// GET /api/phongthuy/tam-yeu/so-do — tra nhanh Cửa – Chủ – Bếp (Dương Trạch Tam Yếu) từ engine. Web chỉ kiểm đầu vào.
// `nam_sinh` (năm sinh người đọc, chỉ để engine biết có hiện ghi chép nhóm C — SX-C) → không cache chung.
import { engineTheoReq } from "@/lib/proxy";
import { NextResponse } from "next/server";

const ENGINE_URL = process.env.ENGINE_URL ?? "http://localhost:8000";
const ENGINE_API_KEY = process.env.ENGINE_API_KEY;
const QUAI_HOP_LE = new Set(["Càn", "Đoài", "Ly", "Chấn", "Tốn", "Khảm", "Cấn", "Khôn"]);

export async function GET(req: Request): Promise<NextResponse> {
  const sp = new URL(req.url).searchParams;
  const cua = sp.get("cua") ?? "";
  const chu = sp.get("chu");
  const bep = sp.get("bep");
  const namSinh = sp.get("nam_sinh");
  const du18 = sp.get("du_18") === "1";
  // TY-2: giới tính (cùng năm sinh → mệnh người chủ, engine tính), phía WC / bàn thờ trong hồ sơ nhà.
  const gioi = sp.get("gioi_tinh");
  const veSinh = sp.get("ve_sinh");
  const banTho = sp.get("ban_tho");
  if (!QUAI_HOP_LE.has(cua) || (chu && !QUAI_HOP_LE.has(chu)) || (bep && !QUAI_HOP_LE.has(bep))
      || (veSinh && !QUAI_HOP_LE.has(veSinh)) || (banTho && !QUAI_HOP_LE.has(banTho))
      || (gioi && gioi !== "nam" && gioi !== "nu")
      || (namSinh && !/^(19|20)\d\d$/.test(namSinh))) {
    return NextResponse.json({ error: "Đầu vào không hợp lệ." }, { status: 422 });
  }
  const q = new URLSearchParams({ cua });
  if (chu) q.set("chu", chu);
  if (bep) q.set("bep", bep);
  if (namSinh) q.set("nam_sinh", namSinh);
  if (du18) q.set("du_18", "true");
  if (gioi && namSinh) q.set("gioi_tinh", gioi);
  if (veSinh) q.set("ve_sinh", veSinh);
  if (banTho) q.set("ban_tho", banTho);
  const rieng = Boolean(namSinh || du18 || veSinh || banTho);
  try {
    const nn = engineTheoReq(req, `/v1/phongthuy/tam-yeu/so-do?${q.toString()}`);
    const r = await fetch(`${ENGINE_URL}${nn.duong}`, {
      headers: { ...(ENGINE_API_KEY ? { "x-engine-key": ENGINE_API_KEY } : {}), ...nn.dau },
      ...(rieng ? { cache: "no-store" as const } : { next: { revalidate: 86_400 } }),
    });
    if (!r.ok) return NextResponse.json({ error: "Chưa tra được sơ đồ Tam Yếu." }, { status: 502 });
    return NextResponse.json(await r.json(), {
      headers: { "cache-control": rieng ? "private, no-store" : "public, max-age=3600, s-maxage=86400" },
    });
  } catch {
    return NextResponse.json({ error: "Chưa tra được sơ đồ Tam Yếu." }, { status: 502 });
  }
}
