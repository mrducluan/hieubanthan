import { NextResponse } from "next/server";
import { khachNguoiMua } from "@/lib/thanh-toan/cong";

export async function GET(req: Request) {
  const nm = await khachNguoiMua(req);
  if (!nm) return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });
  const { data, error } = await nm.sb.rpc("ds_li_xi_cua_toi");
  if (error) return NextResponse.json({ da_tang: [], da_nhan: [] });
  return NextResponse.json(data ?? { da_tang: [], da_nhan: [] }, { headers: { "cache-control": "no-store" } });
}
