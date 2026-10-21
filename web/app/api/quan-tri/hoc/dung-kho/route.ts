// POST /api/quan-tri/hoc/dung-kho — LG-ĐS mục 4: "Dựng kho vectơ". Lấy câu hỏi có nhãn ý định + vectơ tất định từ
// engine (/v1/nhung/kho, câu đã lọc) theo trang rồi nạp vào cau_hoi_vec (nguon = 'kho', hoạt động) bằng service role.
// Chạy lại được: câu đã có thì cập nhật vectơ, câu quản trị đã tắt vẫn tắt. Chỉ chủ sở hữu / biên tập (phiên aal2).
import { NextResponse } from "next/server";
import { congApi } from "@/lib/quan-tri-api";
import { khachDichVu } from "@/lib/thanh-toan/cong";
import { MO_HINH_NHUNG } from "@/lib/hoc-tuvi";
import { baoLoi } from "@/lib/giam-sat";

export const maxDuration = 60;

const ENGINE_URL = process.env.ENGINE_URL ?? "http://localhost:8000";
const ENGINE_API_KEY = process.env.ENGINE_API_KEY;

interface Trang { mo_hinh: string; tong: number; so_trang: number; ds: { y_dinh: string; cau: string; vec: number[] }[] }

export async function POST(req: Request) {
  const p = await congApi(req, ["chu_so_huu", "bien_tap"]);
  if (p instanceof NextResponse) return p;
  const dv = khachDichVu();
  if (!dv) return NextResponse.json({ error: "Chưa cấu hình Supabase service role." }, { status: 503 });
  let nap = 0, tong = 0;
  try {
    for (let trang = 1; trang <= 50; trang++) {
      const r = await fetch(`${ENGINE_URL}/v1/nhung/kho?mo_dun=tuvi&trang=${trang}&co=100`, {
        headers: ENGINE_API_KEY ? { "x-engine-key": ENGINE_API_KEY } : {}, cache: "no-store",
      });
      if (!r.ok) return NextResponse.json({ error: `Máy tính toán trả lỗi ${r.status}.` }, { status: 502 });
      const t = (await r.json()) as Trang;
      if (t.mo_hinh !== MO_HINH_NHUNG) return NextResponse.json({ error: "Mô hình nhúng của engine khác web." }, { status: 409 });
      tong = t.tong;
      if (!t.ds.length) break;
      const { data, error } = await dv.rpc("nap_kho_vec", {
        p_mo_dun: "tuvi", p_mo_hinh: t.mo_hinh, p_ds: t.ds.map((d) => ({ y_dinh: d.y_dinh, cau: d.cau, vec: d.vec })),
      });
      if (error) return NextResponse.json({ error: "Chưa nạp được (chạy migration 0017 + bật extension vector?)." }, { status: 502 });
      nap += Number(data) || 0;
      if (trang >= t.so_trang) break;
    }
  } catch (e) {
    baoLoi(e, { noi: "api", duong: "/api/quan-tri/hoc/dung-kho" });
    return NextResponse.json({ error: "Không kết nối được máy tính toán." }, { status: 502 });
  }
  return NextResponse.json({ ok: true, nap, tong });
}
