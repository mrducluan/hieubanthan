// Phễu lời mời theo loại thẻ (/quan-tri/tang-truong) — hàm THUẦN, không gọi mạng (test: e2e/pheu-the.spec.ts).
// Bốn bước, nối với nhau bằng đúng mã link `ma_moi` (mỗi lần tạo thẻ một mã riêng — lib/ma-moi.ts tuTuMa / maNgauNhien):
//   share_created{kind, co_ma, ma_moi} → share_clicked{ma_moi} (người nhận mở link — GhiVaoTrang/GhiTu/GhiMoThe)
//   → referral_signup{ma_moi} (hồ sơ đầu tiên của người nhận) → credit_earned{kind=duoc_moi} (người nhận được Sao mời).
// Thêm: người GỬI nhận credit_earned{kind=moi_ban} (nếu có sự kiện này). landing_viewed không mang ?tu nên không dùng.
// Số chỉ là MÃ + con số đếm — không có tên, ngày sinh hay nội dung thẻ.

/** share_created gom theo (mã link, loại, có mã giới thiệu): `dau` = lần đầu thấy (ISO) để chọn loại gốc của mã. */
export interface DongChiaSeTho { ma: string; kind: string; co_ma: string; luot: number; dau: string }
/** Số trình duyệt khác nhau mở link mang mã này. */
export interface DongMoTho { ma: string; nguoi: number }
/** Số người tạo hồ sơ qua mã này + trong đó bao nhiêu người nhận Sao "được mời". */
export interface DongDangKyTho { ma: string; nguoi: number; nhan_sao: number }
/** Người gửi (theo loại thẻ + co_ma) đã nhận Sao "mời bạn". */
export interface DongMoiBanTho { kind: string; co_ma: string; nguoi: number }
export interface SoPheuThe { chiaSe: DongChiaSeTho[]; mo: DongMoTho[]; dangKy: DongDangKyTho[]; moiBan: DongMoiBanTho[] }

export type CoMa = "co" | "khong" | "khong_ro";
export interface DongPheuThe {
  kind: string; ten: string; co_ma: CoMa;
  chia_se: number; mo: number; dang_ky: number; nhan_sao: number; moi_ban: number;
  /** Tỉ lệ từng bước so với bước trước; null = bước trước bằng 0. */
  ti_le: { mo: number | null; dang_ky: number | null; nhan_sao: number | null };
}
export interface KetQuaPheuThe {
  dong: DongPheuThe[];
  /** Lượt mở / đăng ký mang mã không khớp lần chia sẻ nào trong khung (link tạo trước khung, hoặc mã cắt cụt). */
  ngoaiKhung: { mo: number; dang_ky: number };
}

export const TEN_KIND_THE: Record<string, string> = {
  card: "Thẻ hồ sơ", invite: "Lời mời hợp đôi", the_ngay: "Thẻ ngày", hom_nay: "Link Hôm nay",
  hai_nguoi: "Điểm hai người", hai_nguoi_anh: "Điểm hai người (ảnh)", ban_do: "Bản đồ 5 mảng", ban_do_anh: "Bản đồ 5 mảng (ảnh)",
  nha: "Nhà của bạn", nha_anh: "Nhà của bạn (ảnh)", que: "Quẻ của tôi", que_anh: "Quẻ của tôi (ảnh)",
  xong_dat: "Xông đất theo năm", tai_anh: "Ảnh lá số tải về", ms: "Chụp màn hình (QR ở dải chân)",
  huy_hieu: "Huy hiệu", huy_hieu_anh: "Huy hiệu (ảnh)", hoi: "Câu trả lời hỏi đáp", hoi_anh: "Câu trả lời hỏi đáp (ảnh)",
};
export const TEN_CO_MA: Record<CoMa, string> = { co: "có mã giới thiệu", khong: "không mã giới thiệu", khong_ro: "không rõ" };

/** Thuộc tính co_ma từ PostHog (toString của JSON) → ba trạng thái. Sự kiện cũ chưa có thuộc tính → "không rõ". */
export function chuanCoMa(v: string | null | undefined): CoMa {
  const s = (v ?? "").trim().toLowerCase();
  if (s === "true" || s === "1") return "co";
  if (s === "false" || s === "0") return "khong";
  return "khong_ro";
}

const tiLe = (tu: number, mau: number) => (mau > 0 ? Math.min(1, tu / mau) : null);

/** Mã cố định của QR chụp màn hình (lib/ma-man-hinh.ts) không có sự kiện share_created → gom theo tiền tố "ms.". */
function nguonMa(goc: Map<string, { kind: string; co_ma: CoMa; dau: string }>, ma: string) {
  return goc.get(ma) ?? (ma.startsWith("ms.") ? { kind: "ms", co_ma: "khong_ro" as CoMa, dau: "" } : undefined);
}

export function tinhPheuThe(s: SoPheuThe): KetQuaPheuThe {
  // Loại gốc của mỗi mã = dòng chia sẻ sớm nhất (vd "hai_nguoi" trước "hai_nguoi_anh" cùng một link).
  const goc = new Map<string, { kind: string; co_ma: CoMa; dau: string }>();
  const dong = new Map<string, DongPheuThe>();
  const lay = (kind: string, co_ma: CoMa) => {
    const k = `${kind}|${co_ma}`;
    let d = dong.get(k);
    if (!d) {
      d = { kind, ten: TEN_KIND_THE[kind] ?? kind, co_ma, chia_se: 0, mo: 0, dang_ky: 0, nhan_sao: 0, moi_ban: 0, ti_le: { mo: null, dang_ky: null, nhan_sao: null } };
      dong.set(k, d);
    }
    return d;
  };
  for (const r of s.chiaSe) {
    const kind = r.kind || "khac", co_ma = chuanCoMa(r.co_ma);
    lay(kind, co_ma).chia_se += r.luot;
    if (!r.ma) continue;
    const g = goc.get(r.ma);
    if (!g || r.dau < g.dau) goc.set(r.ma, { kind, co_ma, dau: r.dau });
  }
  const ngoaiKhung = { mo: 0, dang_ky: 0 };
  for (const r of s.mo) {
    const g = nguonMa(goc, r.ma);
    if (g) lay(g.kind, g.co_ma).mo += r.nguoi; else ngoaiKhung.mo += r.nguoi;
  }
  for (const r of s.dangKy) {
    const g = nguonMa(goc, r.ma);
    if (!g) { ngoaiKhung.dang_ky += r.nguoi; continue; }
    const d = lay(g.kind, g.co_ma);
    d.dang_ky += r.nguoi;
    d.nhan_sao += r.nhan_sao;
  }
  for (const r of s.moiBan) lay(r.kind || "khac", chuanCoMa(r.co_ma)).moi_ban += r.nguoi;
  const ds = [...dong.values()].map((d) => ({
    ...d, ti_le: { mo: tiLe(d.mo, d.chia_se), dang_ky: tiLe(d.dang_ky, d.mo), nhan_sao: tiLe(d.nhan_sao, d.dang_ky) },
  }));
  ds.sort((a, b) => b.chia_se - a.chia_se || b.mo - a.mo || a.kind.localeCompare(b.kind) || a.co_ma.localeCompare(b.co_ma));
  return { dong: ds, ngoaiKhung };
}
