// POST /api/tuvi/hop-tham — TV-V2 + HN-2N — "Xem lá số 2 người" (can năm người kia phi hoá vào lá mình + điểm
// tham khảo hợp – khắc do engine chấm), không lưu người kia.
// Proxy mỏng: zod hai chiều, KHÔNG tự tính gì. Tầng HỌC (migration 0020): máy chủ thêm `trong_so` (tỉ lệ công khai mã
// hn.*, ≥ 30 phiếu) + `ca_nhan` (phiếu hn.* của chính người đang đăng nhập) để engine hạ/xếp hộp — không đổi điểm.
// Chưa bật Supabase / chưa chạy 0017 + 0020 → không kèm gì, kết quả như cũ.
import { NextResponse } from "next/server";
import { baoLoi } from "@/lib/giam-sat";
import { themHocLuanGiai } from "@/lib/hoc-tuvi";
import { loiEngine } from "@/lib/proxy";
import { HopThamInput, HopThamOutput } from "../schema";

const ENGINE_URL = process.env.ENGINE_URL ?? "http://localhost:8000";
const ENGINE_API_KEY = process.env.ENGINE_API_KEY;

export async function POST(req: Request): Promise<NextResponse> {
  const parsed = HopThamInput.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Đầu vào không hợp lệ", chi_tiet: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }

  const hoc = await themHocLuanGiai({ loai: "hai_nguoi", tienTo: "hn." }).catch(() => ({}));
  const goi = (than: object) => fetch(`${ENGINE_URL}/v1/tuvi/hop-tham`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(ENGINE_API_KEY ? { "x-engine-key": ENGINE_API_KEY } : {}),
    },
    body: JSON.stringify(than),
    cache: "no-store",
  });
  let engineRes: Response;
  try {
    engineRes = await goi({ ...parsed.data, ...hoc });
    // Engine cũ chưa nhận trong_so/ca_nhan (lệch deploy) → 422: gọi lại không kèm tầng HỌC, điểm vẫn ra như cũ.
    if (engineRes.status === 422 && Object.keys(hoc).length) engineRes = await goi(parsed.data);
  } catch (e) {
    baoLoi(e, { noi: "api", duong: new URL(req.url).pathname });
    return NextResponse.json({ error: "Không kết nối được máy tính toán. Thử lại sau ít phút." }, { status: 502 });
  }

  const body: unknown = await engineRes.json().catch(() => null);
  if (!engineRes.ok) {
    const l = loiEngine(engineRes.status, body);
    return NextResponse.json({ error: l.error }, { status: l.status });
  }

  const out = HopThamOutput.safeParse(body);
  if (!out.success) {
    return NextResponse.json(
      { error: "Output engine lệch schema — kiểm tra phiên bản hai bên",
        chi_tiet: out.error.flatten().fieldErrors },
      { status: 502 },
    );
  }
  return NextResponse.json(out.data);
}
