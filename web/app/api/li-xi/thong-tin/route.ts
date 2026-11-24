import { NextResponse } from "next/server";
import { thongTinLiXi } from "@/lib/li-xi-may-chu";

export async function GET() {
  return NextResponse.json(await thongTinLiXi(), { headers: { "cache-control": "no-store" } });
}
