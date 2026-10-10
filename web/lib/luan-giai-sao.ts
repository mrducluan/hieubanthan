// SAO-LG — "Luận giải toàn bộ" trừ Sao (chủ dự án chốt 2026-10-02: 10 Sao/báo cáo, CHƯA thu — công tắc tắt).
// Trừ Sao ở MÁY CHỦ, bằng phiên đăng nhập của chính người dùng (hàm SQL dung_sao, migration 0008) — client không
// bỏ qua được. Engine tính trước, trừ Sao sau, đủ Sao mới trả báo cáo. Khoá giao dịch = mảng + lá số + ngày (giờ
// Việt Nam): xem lại cùng báo cáo trong ngày không bị trừ lần hai. Không lưu báo cáo.
import { createHmac } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { ZodTypeAny } from "zod";
import { dauNguoiGoi, goiEngineDaKiem } from "@/lib/proxy";
import { layCauHinh } from "@/lib/cau-hinh";

/** Giá mặc định; QT-2: chủ sở hữu đổi ở /quan-tri/cai-dat (khoá luan_giai.gia_sao). */
export const GIA_LUAN_GIAI_SAO = 10;
export const giaLuanGiaiSao = () => layCauHinh<number>("luan_giai.gia_sao");

/** Công tắc: cài đặt luan_giai.thu_sao (chưa đặt thì theo env LUAN_GIAI_THU_SAO=1) VÀ đã cấu hình Supabase. */
export async function dangThuSao(): Promise<boolean> {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    && (await layCauHinh<boolean>("luan_giai.thu_sao"));
}

const MIEN_PHI = { sao: 0, ly_do: "mien_phi_thu_nghiem" } as const;

export async function luanGiaiCoSao(req: Request, schema: ZodTypeAny, path: string, moDun: string): Promise<NextResponse> {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Đầu vào không hợp lệ" }, { status: 422 });

  if (!(await dangThuSao())) {
    const kq = await goiEngineDaKiem(parsed.data, path, dauNguoiGoi(req));
    return kq.ok ? NextResponse.json({ ...(kq.body as object), phi: MIEN_PHI }) : kq.res;
  }

  const kho = await cookies();
  const sb = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: { getAll: () => kho.getAll(), setAll: () => { /* route chỉ đọc phiên */ } },
  });
  const gia = await giaLuanGiaiSao();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: `Luận giải toàn bộ cần ${gia} Sao — hãy đăng nhập để dùng Sao.`, can: "dang_nhap" }, { status: 401 });
  }

  const kq = await goiEngineDaKiem(parsed.data, path, dauNguoiGoi(req));
  if (!kq.ok) return kq.res;                                  // engine lỗi → chưa trừ Sao

  // SEC-1: khoá giao dịch ký HMAC bằng bí mật máy chủ. Trước đây là SHA-256 của dữ liệu công khai → người dùng tự
  // tính được khoá, gọi thẳng RPC dung_sao(1 Sao, khoá đó) rồi lấy báo cáo 10 Sao chỉ với 1 Sao.
  const bi_mat = process.env.SAO_KHOA_SECRET || process.env.LOI_MOI_SECRET;
  if (!bi_mat || bi_mat.length < 16) return NextResponse.json({ error: "Chưa cấu hình thu Sao, thử lại sau." }, { status: 503 });
  const ngay = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh" }).format(new Date());
  const khoa = createHmac("sha256", bi_mat).update(`${moDun}|${gia}|${JSON.stringify(parsed.data)}|${ngay}`).digest("hex").slice(0, 40);
  const { data, error } = await sb.rpc("dung_sao", {
    p_so: gia, p_khoa: `lg:${khoa}`, p_ghi_chu: `Luận giải toàn bộ ${moDun === "tuvi" ? "Tử vi" : "Bát tự"}`,
  });
  if (error) return NextResponse.json({ error: "Chưa trừ được Sao, thử lại sau ít phút." }, { status: 502 });
  const r = data as { ket_qua: string; so_du?: number };
  if (r.ket_qua === "khong_du") {
    return NextResponse.json({
      error: `Cần ${gia} Sao, bạn còn ${r.so_du ?? 0} Sao. Nhận thêm Sao ở trang Tài khoản (chào mừng, mời bạn bè).`,
      can: "them_sao", so_du: r.so_du ?? 0,
    }, { status: 402 });
  }
  if (r.ket_qua !== "da_dung") return NextResponse.json({ error: "Chưa trừ được Sao, thử lại sau." }, { status: 400 });
  return NextResponse.json({ ...(kq.body as object), phi: { sao: gia, ly_do: "da_tru_sao", so_du: r.so_du ?? null } });
}
