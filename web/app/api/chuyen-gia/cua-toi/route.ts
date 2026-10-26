// /api/chuyen-gia/cua-toi — câu hỏi chuyên gia của CHÍNH người gọi (RLS qua hàm SQL, 0029).
//   GET            danh sách (không trả ảnh chụp hồ sơ — chỉ cờ co_ho_so). Có ?don= thì đối soát đơn payOS còn chờ trước (webhook lỡ).
//   POST {viec}    danh_gia {id, diem 1–5} · huy {id} (chỉ khi còn chờ thanh toán).
import { NextResponse } from "next/server";
import { z } from "zod";
import { khachDichVu, khachNguoiMua } from "@/lib/thanh-toan/cong";
import { doiSoatMotDon } from "@/lib/thanh-toan/doi-soat";

const Vao = z.discriminatedUnion("viec", [
  z.object({ viec: z.literal("danh_gia"), id: z.number().int().positive(), diem: z.number().int().min(1).max(5) }),
  z.object({ viec: z.literal("huy"), id: z.number().int().positive() }),
]);

export async function GET(req: Request) {
  const nm = await khachNguoiMua(req);
  if (!nm) return NextResponse.json({ error: "Hãy đăng nhập.", can: "dang_nhap" }, { status: 401 });
  const don = new URL(req.url).searchParams.get("don");
  if (don && /^\d{1,15}$/.test(don)) {
    const { data } = await nm.sb.from("don_nap").select("ma_don,cong,trang_thai").eq("ma_don", Number(don)).maybeSingle();
    const dv = khachDichVu();
    if (data?.trang_thai === "cho" && data.cong === "payos" && dv) await doiSoatMotDon(dv, Number(don));
  }
  const { data, error } = await nm.sb.rpc("cau_hoi_cua_toi");
  if (error) return NextResponse.json({ error: "Chưa đọc được (chạy migration 0029?)." }, { status: 503 });
  return NextResponse.json({ ds: Array.isArray(data) ? data : [] }, { headers: { "cache-control": "private, no-store" } });
}

export async function POST(req: Request) {
  const vao = Vao.safeParse(await req.json().catch(() => null));
  if (!vao.success) return NextResponse.json({ error: "Đầu vào không hợp lệ" }, { status: 422 });
  const nm = await khachNguoiMua(req);
  if (!nm) return NextResponse.json({ error: "Hãy đăng nhập.", can: "dang_nhap" }, { status: 401 });
  const { data, error } = vao.data.viec === "danh_gia"
    ? await nm.sb.rpc("danh_gia_cau_hoi", { p_id: vao.data.id, p_diem: vao.data.diem })
    : await nm.sb.rpc("huy_cau_hoi", { p_id: vao.data.id });
  if (error) return NextResponse.json({ error: "Chưa ghi được." }, { status: 502 });
  const kq = (data as { ket_qua?: string } | null)?.ket_qua ?? "khong_doi";
  if (kq !== "da_ghi" && kq !== "da_huy") return NextResponse.json({ error: "Không thay đổi được câu hỏi này.", ket_qua: kq }, { status: 409 });
  return NextResponse.json({ ket_qua: kq });
}
