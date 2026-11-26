// SAO-LG + SAO-2 — "Luận giải toàn bộ" Tử vi / Bát tự (GIA-99: 99 Sao/báo cáo, giá riêng từng báo cáo; công tắc ở /quan-tri).
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
import { dauNguoiGoi, goiEngineDaKiem as goiEngine, laBanAnh, loiChung, mienPhiBanAnh } from "@/lib/proxy";
import { layCauHinh } from "@/lib/cau-hinh";
import { biMat, chaoMungConNhan, coTaiKhoan, phienNguoiDung } from "@/lib/cua-sao";
import { boTinhTrangKhoa, catXemTruoc, khoaLaBiCat, taoKhoaGiaoDichLuanGiai, xetQuyenDocHoi, type BaoCaoDay, type QuyenDocHoi } from "@/lib/sao-xem-truoc";
import { baoLoi } from "@/lib/giam-sat";
import { mangLuanGiai } from "@/lib/luan-giai-mang";
import { congDangBat } from "@/lib/thanh-toan/cong";
import { uuDaiCho } from "@/lib/uu-dai-may-chu";
import { dauGhiChu } from "@/lib/uu-dai";
import { namThoiGianToi } from "@/lib/nam";

/** Giá mặc định; QT-2: chủ sở hữu đổi ở /quan-tri/cai-dat (khoá luan_giai.gia_sao). */
export const GIA_LUAN_GIAI_SAO = 99;   // GIA-99: chủ dự án chốt 16/11/2026 (trước 29); câu hỏi vượt lượt 5 Sao
/** Báo cáo có khoá giá riêng `luan_giai.gia_sao.<mã>` (GIA-99). Mã khác → giá chung. */
export const BAO_CAO_GIA_RIENG = ["thanso", "tuvi", "battu", "thoi_gian", "chan_dung"] as const;
/** Giá một báo cáo (Sao). Có `moDun` và khoá giá riêng của nó > 0 → giá riêng; còn lại giá chung `luan_giai.gia_sao`.
 *  Nhận cả bí danh mảng (thanso_sau, tu_vi…). Lỗi đọc giá riêng → giá chung (không bao giờ ra 0). */
export async function giaLuanGiaiSao(moDun?: string | null): Promise<number> {
  const chung = await layCauHinh<number>("luan_giai.gia_sao");
  const ma = mangLuanGiai(moDun) ?? moDun;
  if (!ma || !(BAO_CAO_GIA_RIENG as readonly string[]).includes(ma)) return chung;
  try {
    const rieng = Number(await layCauHinh<number>(`luan_giai.gia_sao.${ma}`));
    return Number.isFinite(rieng) && rieng > 0 ? rieng : chung;
  } catch { return chung; }
}

/** Công tắc: (cài đặt chung luan_giai.thu_sao — chưa đặt thì theo env LUAN_GIAI_THU_SAO=1 — HOẶC công tắc riêng của
 *  mảng luan_giai.thu_sao.<tuvi|battu|thanso>, SAO-V: bật Bản đồ con số trước) VÀ đã cấu hình Supabase + bí mật ký khoá
 *  giao dịch (SAO_KHOA_SECRET, lùi về LOI_MOI_SECRET). Thiếu bí mật → MỞ (miễn phí), không khoá nhầm.
 *  `moDun`: mã mảng (nhận cả bí danh như thanso_sau, tu_vi); không truyền / không thuộc ba mảng → chỉ xét công tắc chung. */
export async function dangThuSao(moDun?: string | null): Promise<boolean> {
  if (!coTaiKhoan() || !biMat()) return false;
  // GIA-99: chưa có cổng nạp (Pay2S chưa đủ khoá) → KHÔNG khoá báo cáo: bật công tắc trước khi cổng sẵn sàng không được
  // thành ngõ cụt "cần Sao nhưng không nạp được". Cùng tinh thần fail-open của SAO-2.
  if (congDangBat() === null) return false;
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

/** LX-2027 (0042, LX-QUYEN): quyền đọc báo cáo Thời gian tới bằng bao lì xì đã nhận. Một bao = MỘT người: khoá hồ sơ là
 *  HMAC(bí mật máy chủ, ngày sinh) — DB không thấy ngày sinh, người dùng không tự tính được khoá để gọi thẳng hàm SQL.
 *  Năm đọc = năm trong yêu cầu (trang luôn gửi), thiếu thì năm mặc định của trang. Chưa chạy 0042 / lỗi → null. */
async function liXiCho(phien: NonNullable<Awaited<ReturnType<typeof phienNguoiDung>>>, d: Record<string, unknown>, biMatMay: string):
    Promise<{ khoa: string; nam: number; daGan: boolean; con: number } | null> {
  const ngaySinh = typeof d.ngay_sinh === "string" ? d.ngay_sinh : null;
  if (!ngaySinh) return null;
  let nam = typeof d.nam === "number" ? d.nam : null;
  if (nam === null) { const n = await namThoiGianToi(); nam = n.mac_dinh ?? n.cac_nam[0] ?? null; }
  if (nam === null) return null;
  const khoa = `lx:${createHmac("sha256", biMatMay).update(`li_xi|${ngaySinh}`).digest("hex").slice(0, 40)}`;
  try {
    const { data, error } = await phien.sb.rpc("li_xi_trang_thai", { p_khoa: khoa, p_nam: nam });
    if (error || !data) return null;
    const t = data as { da_gan?: boolean; con?: number };
    return { khoa, nam, daGan: t.da_gan === true, con: Number(t.con) || 0 };
  } catch { return null; }
}

/** QT-CSH: chủ sở hữu (bảng vai_tro_quan_tri, migration 0010) đọc trọn mọi báo cáo, không trừ Sao — để tự soát nội dung
 *  người dùng trả tiền mới thấy. Chỉ cần đăng nhập đúng tài khoản (không đòi MFA: chỉ là quyền ĐỌC báo cáo của chính
 *  hồ sơ mình nhập). Lỗi / chưa chạy 0010 → false. */
async function laChuSoHuu(phien: NonNullable<Awaited<ReturnType<typeof phienNguoiDung>>>): Promise<boolean> {
  try {
    const { data, error } = await phien.sb.rpc("vai_tro_cua_toi");
    return !error && data === "chu_so_huu";
  } catch { return false; }
}

const MIEN_PHI = { sao: 0, ly_do: "mien_phi_thu_nghiem" } as const;
const TEN: Record<string, string> = { tuvi: "Tử vi", battu: "Bát tự", thanso: "bản đồ con số", thoi_gian: "thời gian tới", chan_dung: "chân dung tổng hợp" };

/** `khoaTu`: phần đầu vào dùng làm khoá "đã mở hôm nay" — bỏ những trường không đổi bản chất báo cáo (vd phiếu bình chọn
 *  của báo cáo ba phái đổi sau mỗi lần bấm) để người dùng không bị trừ Sao lần hai trong ngày. Mặc định: toàn bộ đầu vào. */
/** `them`: trường bổ sung CHỈ gửi engine, không tính vào khoá "đã mở hôm nay" (vd LG-ĐS: bảng tỉ lệ kiểm chứng
 *  `trong_so` + phiếu của chính người xem `ca_nhan` — đổi theo thời gian, không đổi bản chất báo cáo). Engine bản cũ
 *  chưa nhận trường đó (422) → gọi lại không kèm, báo cáo vẫn ra. */
/** EN-2 mục 5: tình trạng (độc thân / có đôi) chỉ đổi MỘT hộp lời khuyên, không đổi bản chất báo cáo → không tính vào
 *  khoá "đã mở hôm nay" (đổi lựa chọn trong ngày không bị trừ Sao lần hai). */
export const boTinhTrang = boTinhTrangKhoa;

export async function luanGiaiCoSao(req: Request, schema: ZodTypeAny, path: string, moDun: string,
                                    khoaTu: (d: Record<string, unknown>) => unknown = boTinhTrang,
                                    them?: () => Promise<Record<string, unknown>>): Promise<NextResponse> {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: loiChung("dau_vao", laBanAnh(req)) }, { status: 422 });
  const bs = them ? await them().catch(() => ({})) : {};
  const goiEngineDaKiem = async (data: unknown, p: string, dau: Record<string, string>) => {
    if (!Object.keys(bs).length) return goiEngine(data, p, dau);
    const kq = await goiEngine({ ...(data as object), ...bs }, p, dau);
    return !kq.ok && kq.res.status === 422 ? goiEngine(data, p, dau) : kq;
  };

  // EN-ALL mục 6.1: bản Anh chưa có cổng thanh toán quốc tế → mọi chương "đang miễn phí" (không thu Sao, không khoá) —
  // chỉ ở mảng đã mở tiếng Anh (mienPhiBanAnh).
  if (mienPhiBanAnh(req, "luan_giai", moDun) || !(await dangThuSao(moDun))) {
    const kq = await goiEngineDaKiem(parsed.data, path, dauNguoiGoi(req));
    return kq.ok ? NextResponse.json({ ...(kq.body as object), phi: MIEN_PHI }) : kq.res;
  }

  const [giaThuong, mienPhi, phien] = await Promise.all([giaLuanGiaiSao(moDun), layCauHinh<number>("luan_giai.chuong_mien_phi"), phienNguoiDung()]);
  const moKhoa = req.headers.get("x-mo-khoa") === "1";
  // UD-1: đợt ưu đãi có hạn đang chạy → giá ưu đãi (lúc sắp trừ Sao thì đếm suất mới, không dùng số nhớ đệm).
  const uuDai = await uuDaiCho(giaThuong, moKhoa);
  const gia = uuDai?.gia ?? giaThuong;

  // QT-CSH: chủ sở hữu đọc trọn báo cáo, không trừ Sao, không tính suất ưu đãi.
  if (phien && (await laChuSoHuu(phien))) {
    const kq = await goiEngineDaKiem(parsed.data, path, dauNguoiGoi(req));
    return kq.ok ? NextResponse.json({ ...(kq.body as object), phi: { sao: 0, ly_do: "quan_tri" } }) : kq.res;
  }
  // SEC-1: khoá giao dịch ký HMAC bằng bí mật máy chủ (người dùng không tự tính được để gọi thẳng dung_sao rẻ hơn).
  // Không gồm giá: đổi giá giữa ngày thì báo cáo đã mở vẫn xem lại được, không trừ lần hai.
  const bi_mat = biMat();
  const ngay = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh" }).format(new Date());
  const khoa = bi_mat
    ? taoKhoaGiaoDichLuanGiai(bi_mat, moDun, khoaTu(parsed.data as Record<string, unknown>), ngay)
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
  // LX-2027 (0042, LX-QUYEN): hồ sơ đã gắn một bao lì xì → đọc trọn báo cáo năm đó, không trừ Sao. Còn bao chưa gắn mà
  // người dùng BẤM mở (và chưa trả Sao mở báo cáo này hôm nay) → dùng bao (không trừ Sao) cho đúng hồ sơ này. Chỉ xem trước → báo còn bao để giao diện nói rõ.
  const lx = moDun === "thoi_gian" && phien && bi_mat ? await liXiCho(phien, parsed.data as Record<string, unknown>, bi_mat) : null;
  if (lx && phien && (lx.daGan || (lx.con > 0 && moKhoa && !daMo))) {
    const kq = await goiEngineDaKiem(parsed.data, path, dauNguoiGoi(req));
    if (!kq.ok) return kq.res;                                // engine lỗi → chưa dùng bao
    if (!lx.daGan) {
      const { data } = await phien.sb.rpc("li_xi_dung", { p_khoa: lx.khoa, p_nam: lx.nam });
      const r = (data ?? {}) as { ket_qua?: string };
      if (r.ket_qua !== "da_dung" && r.ket_qua !== "da_gan") {
        return NextResponse.json({ error: "Chưa dùng được bao lì xì, thử lại sau ít phút." }, { status: 409 });
      }
    }
    return NextResponse.json({ ...(kq.body as object), phi: { sao: 0, ly_do: "li_xi", li_xi_nam: lx.nam } });
  }

  if (!daMo && !moKhoa) {
    // Quà của bạn bè: thêm đúng một chương sau các chương miễn phí (chương mienPhi + 1), cùng đường cắt + diễn đạt AI.
    const tang = await chuongDuocTang(phien, moDun);
    const kq = await goiEngineDaKiem({ ...(parsed.data as Record<string, unknown>), dien_dat_toi_da: mienPhi + tang }, path, dauNguoiGoi(req));
    if (!kq.ok) return kq.res;
    const day = kq.body as BaoCaoDay;
    const ban = catXemTruoc(day, mienPhi + tang);
    // SAO-2 Default-Deny: khoá cấp gốc chưa phân loại bị cắt im lặng → báo (chỉ tên khoá, không nội dung) để phân loại.
    if (ban.so_khoa > 0) {
      const la = khoaLaBiCat(day);
      if (la.length) baoLoi(new Error("sao2_khoa_la_bi_cat"), { noi: "luan_giai_sao", mo_dun: moDun, khoa: la.slice(0, 8).join(",") });
    }
    const maTang = tang ? day.chuong[mienPhi]?.ma ?? null : null;
    let soDu: number | null = null;
    if (phien) { const { data } = await phien.sb.rpc("so_du_sao"); soDu = typeof data === "number" ? data : null; }
    return NextResponse.json({ ...ban, phi: { sao: gia, ly_do: "xem_truoc", khoa: ban.so_khoa > 0, dang_nhap: Boolean(phien), so_du: soDu,
      thuong_chao_mung: phien ? null : await layCauHinh<number>("sao.thuong.chao_mung"),
      ...(uuDai ? { uu_dai: uuDai } : {}),
      ...(lx && lx.con > 0 ? { li_xi: lx.con, li_xi_nam: lx.nam } : {}),
      ...(maTang ? { chuong_tang: 1, chuong_tang_ma: maTang } : {}) } });
  }

  if (!phien) {
    const thuong = await layCauHinh<number>("sao.thuong.chao_mung");
    return NextResponse.json({ error: `Đăng nhập để mở toàn bộ báo cáo (${gia} Sao).`, can: "dang_nhap", gia, thuong, ...(uuDai ? { uu_dai: uuDai } : {}) }, { status: 402 });
  }
  if (!khoa) return NextResponse.json({ error: "Chưa cấu hình thu Sao, thử lại sau." }, { status: 503 });

  const kq = await goiEngineDaKiem(parsed.data, path, dauNguoiGoi(req));
  if (!kq.ok) return kq.res;                                  // engine lỗi → chưa trừ Sao
  if (daMo) return NextResponse.json({ ...(kq.body as object), phi: { sao: 0, ly_do: "da_mo_hom_nay" } });

  // UD-1: người dùng vừa thấy giá thấp hơn (ưu đãi hết hạn / hết suất giữa chừng) → KHÔNG trừ theo giá cao hơn khi họ
  // chưa thấy; báo giá mới, giao diện tải lại bản xem trước rồi họ tự bấm lại.
  const giaThay = Number(req.headers.get("x-gia-thay"));
  if (Number.isFinite(giaThay) && giaThay > 0 && gia > giaThay) {
    return NextResponse.json({ error: `Ưu đãi vừa kết thúc — giá hiện tại là ${gia} Sao. Bấm mở lần nữa nếu bạn vẫn muốn đọc tiếp.`, can: "gia_doi", gia }, { status: 409 });
  }
  const ghiChu = `Luận giải toàn bộ ${TEN[moDun] ?? moDun}${uuDai?.ma ? dauGhiChu(uuDai.ma) : ""}`;
  const { data, error } = await phien.sb.rpc("dung_sao", { p_so: gia, p_khoa: khoa, p_ghi_chu: ghiChu });
  if (error) return NextResponse.json({ error: "Chưa trừ được Sao, thử lại sau ít phút." }, { status: 502 });
  const r = data as { ket_qua: string; so_du?: number };
  if (r.ket_qua === "khong_du") {
    return NextResponse.json({
      error: `Cần ${gia} Sao, ví bạn còn ${r.so_du ?? 0} Sao.`, can: "nap", gia, so_du: r.so_du ?? 0,
      chao_mung: await chaoMungConNhan(phien), ...(uuDai ? { uu_dai: uuDai } : {}),
    }, { status: 402 });
  }
  if (r.ket_qua !== "da_dung") return NextResponse.json({ error: "Chưa trừ được Sao, thử lại sau." }, { status: 400 });
  return NextResponse.json({ ...(kq.body as object), phi: { sao: gia, ly_do: "da_tru_sao", so_du: r.so_du ?? null } });
}

/** D2 + SAO-2: xác định quyền đọc `luan_hoi` / `doi_song_lien_ket` trong `/api/<tuvi|battu>/hoi`, khớp 100% quy tắc của
 *  `luanGiaiCoSao` (công tắc thu Sao · bản Anh · chủ sở hữu · hội viên năm · đã mở hôm nay · `chuong_mien_phi + chuongDuocTang`;
 *  thiếu bí mật máy chủ thì đóng an toàn, không mở nhầm). Không trừ Sao, không ghi DB. */
export async function daMoBaoCaoHoi(req: Request, moDun: "tuvi" | "battu", laSo: unknown): Promise<QuyenDocHoi> {
  const coLaSo = Boolean(laSo && typeof laSo === "object");
  const mienPhiAnh = mienPhiBanAnh(req, "luan_giai", moDun);
  if (!coLaSo || mienPhiAnh) {
    return xetQuyenDocHoi({ coLaSo, mienPhiAnh, thuSaoBat: false, coPhien: false, chuSoHuu: false, hoiVien: false, coBiMat: false, daMoHomNay: false, moDun, soChuongMo: 1 });
  }
  const thuSaoBat = await dangThuSao(moDun);
  if (!thuSaoBat) {
    return xetQuyenDocHoi({ coLaSo, mienPhiAnh, thuSaoBat: false, coPhien: false, chuSoHuu: false, hoiVien: false, coBiMat: false, daMoHomNay: false, moDun, soChuongMo: 1 });
  }
  const [mienPhi, phien] = await Promise.all([layCauHinh<number>("luan_giai.chuong_mien_phi"), phienNguoiDung()]);
  const tang = await chuongDuocTang(phien, moDun);
  const soChuongMo = mienPhi + tang;
  if (!phien) {
    return xetQuyenDocHoi({ coLaSo, mienPhiAnh, thuSaoBat: true, coPhien: false, chuSoHuu: false, hoiVien: false, coBiMat: Boolean(biMat()), daMoHomNay: false, moDun, soChuongMo });
  }
  if (await laChuSoHuu(phien)) {
    return xetQuyenDocHoi({ coLaSo, mienPhiAnh, thuSaoBat: true, coPhien: true, chuSoHuu: true, hoiVien: false, coBiMat: true, daMoHomNay: false, moDun, soChuongMo });
  }
  if (await laHoiVien(phien)) {
    return xetQuyenDocHoi({ coLaSo, mienPhiAnh, thuSaoBat: true, coPhien: true, chuSoHuu: false, hoiVien: true, coBiMat: true, daMoHomNay: false, moDun, soChuongMo });
  }
  const bi_mat = biMat();
  if (!bi_mat) {
    return xetQuyenDocHoi({ coLaSo, mienPhiAnh, thuSaoBat: true, coPhien: true, chuSoHuu: false, hoiVien: false, coBiMat: false, daMoHomNay: false, moDun, soChuongMo });
  }
  const ngay = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh" }).format(new Date());
  const khoa = taoKhoaGiaoDichLuanGiai(bi_mat, moDun, boTinhTrang({ la_so: laSo }), ngay);
  let daMoHomNay = false;
  try {
    const { data } = await phien.sb.from("so_cai_sao").select("id").eq("khoa", `dung:${phien.user.id}:${khoa}`).limit(1);
    daMoHomNay = Boolean(data?.length);
  } catch {
    daMoHomNay = false;
  }
  return xetQuyenDocHoi({ coLaSo, mienPhiAnh, thuSaoBat: true, coPhien: true, chuSoHuu: false, hoiVien: false, coBiMat: true, daMoHomNay, moDun, soChuongMo });
}

