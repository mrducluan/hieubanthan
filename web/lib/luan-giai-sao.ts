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
import { dauNguoiGoi, goiEngineDaKiem as goiEngine } from "@/lib/proxy";
import { layCauHinh } from "@/lib/cau-hinh";
import { biMat, chaoMungConNhan, coTaiKhoan, phienNguoiDung } from "@/lib/cua-sao";
import { catXemTruoc, type BaoCaoDay } from "@/lib/sao-xem-truoc";
import { mangLuanGiai } from "@/lib/luan-giai-mang";

/** Giá mặc định; QT-2: chủ sở hữu đổi ở /quan-tri/cai-dat (khoá luan_giai.gia_sao). */
export const GIA_LUAN_GIAI_SAO = 29;   // chủ dự án chốt 26/10/2026 (trước 10); câu hỏi vượt lượt 3 Sao
export const giaLuanGiaiSao = () => layCauHinh<number>("luan_giai.gia_sao");

/** Công tắc: (cài đặt chung luan_giai.thu_sao — chưa đặt thì theo env LUAN_GIAI_THU_SAO=1 — HOẶC công tắc riêng của
 *  mảng luan_giai.thu_sao.<tuvi|battu|thanso>, SAO-V: bật Bản đồ con số trước) VÀ đã cấu hình Supabase + bí mật ký khoá
 *  giao dịch (SAO_KHOA_SECRET, lùi về LOI_MOI_SECRET). Thiếu bí mật → MỞ (miễn phí), không khoá nhầm.
 *  `moDun`: mã mảng (nhận cả bí danh như thanso_sau, tu_vi); không truyền / không thuộc ba mảng → chỉ xét công tắc chung. */
export async function dangThuSao(moDun?: string | null): Promise<boolean> {
  if (!coTaiKhoan() || !biMat()) return false;
  if (await layCauHinh<boolean>("luan_giai.thu_sao")) return true;
  const mang = mangLuanGiai(moDun);
  if (!mang) return false;
  try { return Boolean(await layCauHinh<boolean>(`luan_giai.thu_sao.${mang}`)); } catch { return false; }
}

/** SAO-V "Tặng một chương": số chương bạn bè tặng cho người đang xem ở mảng này (0/1, hàm SQL chuong_duoc_tang,
 *  migration 0025). Chưa chạy migration / lỗi → 0 (không mở nhầm). */
async function chuongDuocTang(phien: Awaited<ReturnType<typeof phienNguoiDung>>, moDun: string): Promise<number> {
  const mang = mangLuanGiai(moDun);
  if (!phien || !mang) return 0;
  try {
    const { data, error } = await phien.sb.rpc("chuong_duoc_tang", { p_mo_dun: mang });
    return !error && Number(data) >= 1 ? 1 : 0;
  } catch { return 0; }
}

/** SAO-HV (0028): người đang đăng nhập là hội viên năm còn hiệu lực? Hàm SQL hoi_vien_hieu_luc() (không tham số = chính
 *  mình). Chưa chạy 0028 / lỗi → false (không mở nhầm). */
async function laHoiVien(phien: NonNullable<Awaited<ReturnType<typeof phienNguoiDung>>>): Promise<boolean> {
  try {
    const { data, error } = await phien.sb.rpc("hoi_vien_hieu_luc");
    return !error && data === true;
  } catch { return false; }
}

const MIEN_PHI = { sao: 0, ly_do: "mien_phi_thu_nghiem" } as const;
const TEN: Record<string, string> = { tuvi: "Tử vi", battu: "Bát tự", thanso: "bản đồ con số" };

/** `khoaTu`: phần đầu vào dùng làm khoá "đã mở hôm nay" — bỏ những trường không đổi bản chất báo cáo (vd phiếu bình chọn
 *  của báo cáo ba phái đổi sau mỗi lần bấm) để người dùng không bị trừ Sao lần hai trong ngày. Mặc định: toàn bộ đầu vào. */
/** `them`: trường bổ sung CHỈ gửi engine, không tính vào khoá "đã mở hôm nay" (vd LG-ĐS: bảng tỉ lệ kiểm chứng
 *  `trong_so` + phiếu của chính người xem `ca_nhan` — đổi theo thời gian, không đổi bản chất báo cáo). Engine bản cũ
 *  chưa nhận trường đó (422) → gọi lại không kèm, báo cáo vẫn ra. */
export async function luanGiaiCoSao(req: Request, schema: ZodTypeAny, path: string, moDun: string,
                                    khoaTu: (d: Record<string, unknown>) => unknown = (d) => d,
                                    them?: () => Promise<Record<string, unknown>>): Promise<NextResponse> {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Đầu vào không hợp lệ" }, { status: 422 });
  const bs = them ? await them().catch(() => ({})) : {};
  const goiEngineDaKiem = async (data: unknown, p: string, dau: Record<string, string>) => {
    if (!Object.keys(bs).length) return goiEngine(data, p, dau);
    const kq = await goiEngine({ ...(data as object), ...bs }, p, dau);
    return !kq.ok && kq.res.status === 422 ? goiEngine(data, p, dau) : kq;
  };

  if (!(await dangThuSao(moDun))) {
    const kq = await goiEngineDaKiem(parsed.data, path, dauNguoiGoi(req));
    return kq.ok ? NextResponse.json({ ...(kq.body as object), phi: MIEN_PHI }) : kq.res;
  }

  const [gia, mienPhi, phien] = await Promise.all([giaLuanGiaiSao(), layCauHinh<number>("luan_giai.chuong_mien_phi"), phienNguoiDung()]);
  // SEC-1: khoá giao dịch ký HMAC bằng bí mật máy chủ (người dùng không tự tính được để gọi thẳng dung_sao rẻ hơn).
  // Không gồm giá: đổi giá giữa ngày thì báo cáo đã mở vẫn xem lại được, không trừ lần hai.
  const bi_mat = biMat();
  const ngay = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh" }).format(new Date());
  const khoa = bi_mat
    ? `lg:${createHmac("sha256", bi_mat).update(`${moDun}|${JSON.stringify(khoaTu(parsed.data as Record<string, unknown>))}|${ngay}`).digest("hex").slice(0, 40)}`
    : null;

  // SAO-HV (0028): hội viên năm đang hiệu lực → báo cáo đầy đủ, KHÔNG trừ Sao (kể cả lượt xem trước), ghi "đã mở" bằng
  // khoá báo cáo (chỉ đếm, cho chính sách hoàn tiền 14 ngày). Lỗi / chưa chạy 0028 → coi như không phải hội viên.
  if (phien && khoa && (await laHoiVien(phien))) {
    const kq = await goiEngineDaKiem(parsed.data, path, dauNguoiGoi(req));
    if (!kq.ok) return kq.res;
    await phien.sb.rpc("hoi_vien_ghi_mo", { p_khoa: khoa }).then(() => undefined, () => undefined);
    return NextResponse.json({ ...(kq.body as object), phi: { sao: 0, ly_do: "hoi_vien" } });
  }

  // Đã mở hôm nay? (RLS: người dùng đọc được sổ Sao của chính mình.)
  let daMo = false;
  if (phien && khoa) {
    const { data } = await phien.sb.from("so_cai_sao").select("id").eq("khoa", `dung:${phien.user.id}:${khoa}`).limit(1);
    daMo = Boolean(data?.length);
  }
  const moKhoa = req.headers.get("x-mo-khoa") === "1";

  if (!daMo && !moKhoa) {
    // Quà của bạn bè: thêm đúng một chương sau các chương miễn phí (chương mienPhi + 1), cùng đường cắt + diễn đạt AI.
    const tang = await chuongDuocTang(phien, moDun);
    const kq = await goiEngineDaKiem({ ...parsed.data, dien_dat_toi_da: mienPhi + tang }, path, dauNguoiGoi(req));
    if (!kq.ok) return kq.res;
    const day = kq.body as BaoCaoDay;
    const ban = catXemTruoc(day, mienPhi + tang);
    const maTang = tang ? day.chuong[mienPhi]?.ma ?? null : null;
    let soDu: number | null = null;
    if (phien) { const { data } = await phien.sb.rpc("so_du_sao"); soDu = typeof data === "number" ? data : null; }
    return NextResponse.json({ ...ban, phi: { sao: gia, ly_do: "xem_truoc", khoa: ban.so_khoa > 0, dang_nhap: Boolean(phien), so_du: soDu,
      thuong_chao_mung: phien ? null : await layCauHinh<number>("sao.thuong.chao_mung"),
      ...(maTang ? { chuong_tang: 1, chuong_tang_ma: maTang } : {}) } });
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
