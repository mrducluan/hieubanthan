// GET /bieu-tuong/{192|512|512-maskable} — biểu tượng PNG cho web app manifest (cài lên màn hình chính) + thông báo.
import { anhBieuTuong } from "@/lib/bieu-tuong";

const CO: Record<string, [number, boolean]> = { "192": [192, false], "512": [512, false], "512-maskable": [512, true], "192-maskable": [192, true] };

export async function GET(_req: Request, { params }: { params: Promise<{ co: string }> }) {
  const c = CO[(await params).co];
  if (!c) return new Response("Không có", { status: 404 });
  return anhBieuTuong(c[0], c[1], { "cache-control": "public, max-age=86400, stale-while-revalidate=604800" });
}
