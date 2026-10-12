// GET /api/thanh-toan/goi — gói Sao đang bán + cổng đang bật (cho hộp nạp nhanh SAO-2). Không có dữ liệu riêng của ai.
import { NextResponse } from "next/server";
import { congDangBat, dsGoiSao } from "@/lib/thanh-toan/cong";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ goi: await dsGoiSao(), cong: congDangBat() });
}
