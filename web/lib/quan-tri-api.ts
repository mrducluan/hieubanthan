// Cổng chung cho route API quản trị (QT-2+): cùng origin → phiên aal2 → vai trò được phép. DB vẫn kiểm lại vai trò
// trong từng hàm SQL (qt_can_vai_tro) — lớp này chỉ để trả lỗi rõ ràng và không gọi DB khi chắc chắn bị từ chối.
import { NextResponse } from "next/server";
import { phienQuanTri, type PhienQuanTri, type VaiTro } from "@/lib/quan-tri";

export type PhienOk = Extract<PhienQuanTri, { trang: "ok" }>;

export async function congApi(req: Request, duoc: readonly VaiTro[]): Promise<PhienOk | NextResponse> {
  const origin = req.headers.get("origin");
  if (!origin || origin !== new URL(req.url).origin) return NextResponse.json({ error: "Sai nguồn gửi." }, { status: 403 });
  const p = await phienQuanTri();
  if (p.trang !== "ok") return NextResponse.json({ error: "Phiên quản trị hết hạn — tải lại trang." }, { status: 401 });
  if (!duoc.includes(p.vaiTro)) return NextResponse.json({ error: "Vai trò của bạn không làm được việc này." }, { status: 403 });
  return p;
}

/** Lỗi từ hàm SQL → câu báo cho người quản trị (không lộ chi tiết kỹ thuật). */
export function loiSql(e: { message?: string } | null): NextResponse {
  const m = e?.message ?? "";
  if (m.includes("khong_co_quyen")) return NextResponse.json({ error: "Không có quyền (cần MFA và đúng vai trò)." }, { status: 403 });
  if (/function .* does not exist|could not find the function/i.test(m)) {
    return NextResponse.json({ error: "Chưa chạy migration 0011 trên Supabase." }, { status: 503 });
  }
  return NextResponse.json({ error: "Cơ sở dữ liệu từ chối, thử lại sau." }, { status: 502 });
}

export const TAT_CA_VAI_TRO: readonly VaiTro[] = ["chu_so_huu", "bien_tap", "tham_dinh", "ho_tro", "xem"];
