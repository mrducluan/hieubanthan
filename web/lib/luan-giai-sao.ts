// SAO-LG + SAO-2 — "Luận giải toàn bộ" Tử vi / Bát tự (10 Sao/báo cáo, công tắc ở /quan-tri, mặc định TẮT = miễn phí).
// Khi thu Sao:
//   1. Ai cũng xem trước MIỄN PHÍ: N chương đầu trọn vẹn (luan_giai.chuong_mien_phi), chương sau chỉ có tiêu đề +
//      lời mời xem tiếp do engine soạn (điểm nhấn đã tính + câu hỏi mở). Engine chỉ diễn đạt AI N chương đầu.
//   2. Bấm "Mở khoá" (header x-mo-khoa: 1): chưa đăng nhập → 402 can=dang_nhap · thiếu Sao → 402 can=nap ·
//      đủ → engine tính trước, trừ Sao sau, trả báo cáo đầy đủ.
//   3. Đã mở hôm nay (cùng lá số, cùng ngày giờ VN) → xem lại đầy đủ, không trừ lần hai.
// Trừ Sao ở MÁY CHỦ bằng phiên của chính người dùng (hàm SQL dung_sao, migration 0008). Không lưu báo cáo.
import { createHmac } from "node:crypto";
import { NextResponse } from "next/server";
import type { ZodTypeAny } from "zod";
import { dauNguoiGoi, goiEngineDaKiem } from "@/lib/proxy";
import { layCauHinh } from "@/lib/cau-hinh";
import { biMat, chaoMungConNhan, coTaiKhoan, phienNguoiDung } from "@/lib/cua-sao";
import { catXemTruoc, type BaoCaoDay } from "@/lib/sao-xem-truoc";

/** Giá mặc định; QT-2: chủ sở hữu đổi ở /quan-tri/cai-dat (khoá luan_giai.gia_sao). */
export const GIA_LUAN_GIAI_SAO = 10;
export const giaLuanGiaiSao = () => layCauHinh<number>("luan_giai.gia_sao");

/** Công tắc: cài đặt luan_giai.thu_sao (chưa đặt thì theo env LUAN_GIAI_THU_SAO=1) VÀ đã cấu hình Supabase + bí mật
 *  ký khoá giao dịch (SAO_KHOA_SECRET, lùi về LOI_MOI_SECRET). Thiếu bí mật → MỞ (miễn phí), không khoá nhầm. */
export async function dangThuSao(): Promise<boolean> {
  return coTaiKhoan() && Boolean(biMat()) && (await layCauHinh<boolean>("luan_giai.thu_sao"));
}

const MIEN_PHI = { sao: 0, ly_do: "mien_phi_thu_nghiem" } as const;
const TEN: Record<string, string> = { tuvi: "Tử vi", battu: "Bát tự" };

export async function luanGiaiCoSao(req: Request, schema: ZodTypeAny, path: string, moDun: string): Promise<NextResponse> {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Đầu vào không hợp lệ" }, { status: 422 });

  if (!(await dangThuSao())) {
    const kq = await goiEngineDaKiem(parsed.data, path, dauNguoiGoi(req));
    return kq.ok ? NextResponse.json({ ...(kq.body as object), phi: MIEN_PHI }) : kq.res;
  }

  const [gia, mienPhi, phien] = await Promise.all([giaLuanGiaiSao(), layCauHinh<number>("luan_giai.chuong_mien_phi"), phienNguoiDung()]);
  // SEC-1: khoá giao dịch ký HMAC bằng bí mật máy chủ (người dùng không tự tính được để gọi thẳng dung_sao rẻ hơn).
  // Không gồm giá: đổi giá giữa ngày thì báo cáo đã mở vẫn xem lại được, không trừ lần hai.
  const bi_mat = biMat();
  const ngay = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh" }).format(new Date());
  const khoa = bi_mat
    ? `lg:${createHmac("sha256", bi_mat).update(`${moDun}|${JSON.stringify(parsed.data)}|${ngay}`).digest("hex").slice(0, 40)}`
    : null;

  // Đã mở hôm nay? (RLS: người dùng đọc được sổ Sao của chính mình.)
  let daMo = false;
  if (phien && khoa) {
    const { data } = await phien.sb.from("so_cai_sao").select("id").eq("khoa", `dung:${phien.user.id}:${khoa}`).limit(1);
    daMo = Boolean(data?.length);
  }
  const moKhoa = req.headers.get("x-mo-khoa") === "1";

  if (!daMo && !moKhoa) {
    const kq = await goiEngineDaKiem({ ...parsed.data, dien_dat_toi_da: mienPhi }, path, dauNguoiGoi(req));
    if (!kq.ok) return kq.res;
    const ban = catXemTruoc(kq.body as BaoCaoDay, mienPhi);
    let soDu: number | null = null;
    if (phien) { const { data } = await phien.sb.rpc("so_du_sao"); soDu = typeof data === "number" ? data : null; }
    return NextResponse.json({ ...ban, phi: { sao: gia, ly_do: "xem_truoc", khoa: ban.so_khoa > 0, dang_nhap: Boolean(phien), so_du: soDu,
      thuong_chao_mung: phien ? null : await layCauHinh<number>("sao.thuong.chao_mung") } });
  }

  if (!phien) {
    const thuong = await layCauHinh<number>("sao.thuong.chao_mung");
    return NextResponse.json({ error: `Đăng nhập để mở toàn bộ báo cáo (${gia} Sao).`, can: "dang_nhap", gia, thuong }, { status: 402 });
  }
  if (!khoa) return NextResponse.json({ error: "Chưa cấu hình thu Sao, thử lại sau." }, { status: 503 });

  const kq = await goiEngineDaKiem(parsed.data, path, dauNguoiGoi(req));
  if (!kq.ok) return kq.res;                                  // engine lỗi → chưa trừ Sao
  if (daMo) return NextResponse.json({ ...(kq.body as object), phi: { sao: 0, ly_do: "da_mo_hom_nay" } });

  const { data, error } = await phien.sb.rpc("dung_sao", { p_so: gia, p_khoa: khoa, p_ghi_chu: `Luận giải toàn bộ ${TEN[moDun] ?? moDun}` });
  if (error) return NextResponse.json({ error: "Chưa trừ được Sao, thử lại sau ít phút." }, { status: 502 });
  const r = data as { ket_qua: string; so_du?: number };
  if (r.ket_qua === "khong_du") {
    return NextResponse.json({
      error: `Cần ${gia} Sao, ví bạn còn ${r.so_du ?? 0} Sao.`, can: "nap", gia, so_du: r.so_du ?? 0,
      chao_mung: await chaoMungConNhan(phien),
    }, { status: 402 });
  }
  if (r.ket_qua !== "da_dung") return NextResponse.json({ error: "Chưa trừ được Sao, thử lại sau." }, { status: 400 });
  return NextResponse.json({ ...(kq.body as object), phi: { sao: gia, ly_do: "da_tru_sao", so_du: r.so_du ?? null } });
}
