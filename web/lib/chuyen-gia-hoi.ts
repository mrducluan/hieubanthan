// SAO-CG (migration 0029) — "Hỏi chuyên gia": phần THUẦN dùng chung trình duyệt + máy chủ (không gọi mạng, không React).
// Người dùng đặt một câu hỏi (≤ 1.500 ký tự) về một mảng, trả VND cố định (không bằng Sao), chuyên gia trả lời bằng văn bản
// trong N giờ hoặc hoàn 100 %. Giọng: trung tính — không đếm ngược kiểu thúc, không "chỉ còn", không doạ.

export const MANG_CG = ["than_so", "tu_vi", "bat_tu", "kinh_dich", "phong_thuy"] as const;
export type MangCg = (typeof MANG_CG)[number];
export const TEN_MANG_CG: Record<MangCg, string> = {
  than_so: "Thần số học", tu_vi: "Tử vi", bat_tu: "Bát tự", kinh_dich: "Kinh Dịch", phong_thuy: "Phong thuỷ",
};
/** Mảng cần giờ sinh + giới tính + nơi sinh để chuyên gia lập lá số (chỉ gợi ý tích chia sẻ hồ sơ — không bắt buộc). */
export const MANG_CAN_LA_SO: readonly MangCg[] = ["tu_vi", "bat_tu"];

export const CAU_HOI_TOI_DA = 1500;
export const CAU_HOI_TOI_THIEU = 10;
export const TRA_LOI_TOI_DA = 6000;

export type TrangThaiCg = "cho_tra" | "het_han_don" | "cho_tra_loi" | "da_tra_loi" | "qua_han" | "hoan" | "huy";
export const TEN_TRANG_THAI: Record<TrangThaiCg, string> = {
  cho_tra: "Chờ thanh toán", het_han_don: "Chưa thanh toán (đơn đã hết hạn)", cho_tra_loi: "Đang chờ chuyên gia trả lời",
  da_tra_loi: "Đã trả lời", qua_han: "Quá hạn trả lời — được hoàn 100 %", hoan: "Đã hoàn tiền", huy: "Đã huỷ",
};

export interface ThongTinCg {
  bat: boolean; gia_vnd: number; giam_lan_dau_pt: number; han_gio: number; gia_lan_dau: number;
  /** null = khách / chưa biết. */ lan_dau: boolean | null; gia_lan_nay: number; dang_cho: number | null;
  /** Do route web thêm: cổng thanh toán đang bật, người gọi đã đăng nhập, lượt hội viên còn (0028; null = không phải hội viên). */
  cong?: "payos" | "gia" | null; dang_nhap?: boolean; hoi_vien_con_luot?: number | null;
}

export interface CauHoiCg {
  id: number; mang: MangCg; cau_hoi: string; gia_vnd: number; mien_phi_hoi_vien: boolean; trang_thai: TrangThaiCg;
  ma_don: number | null; het_han_don: string | null; thanh_toan_luc: string | null; han_tra_loi: string | null;
  tra_loi: string | null; tra_loi_luc: string | null; danh_gia: number | null; hoan_luc: string | null; co_ho_so: boolean; tao_luc: string;
}

/** Ảnh chụp hồ sơ gửi kèm câu hỏi — CHỈ các trường này (SQL cg_loc_ho_so lọc lại lần nữa). */
export interface HoSoCg {
  ho_ten: string; ngay_sinh: string; gio_sinh?: string; do_tin_gio?: "exact" | "approx" | "unknown";
  gioi_tinh?: "nam" | "nu"; noi_sinh?: string; gio_mua_he?: boolean;
}

export const dinhDangVnd = (n: number) => `${n.toLocaleString("vi-VN")} ₫`;

/** Giá câu hỏi lần này theo thông tin máy chủ trả (khách → giá lần đầu). */
export const giaLanNay = (t: ThongTinCg) => (t.lan_dau === false ? t.gia_vnd : t.gia_lan_dau);

const gioPhutVn = (iso: string) =>
  new Intl.DateTimeFormat("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit", timeZone: "Asia/Ho_Chi_Minh" }).format(new Date(iso));

/** Dòng hạn trả lời — TRUNG TÍNH: "còn khoảng N giờ (đến hh:mm dd/mm)"; quá hạn → nói ngay điều người dùng được hưởng.
 *  Không "chỉ còn", không đếm giây, không giục. */
export function dongHan(han: string | null, bayGio = Date.now()): string {
  if (!han) return "";
  const ms = new Date(han).getTime() - bayGio;
  if (Number.isNaN(ms)) return "";
  if (ms <= 0) return "Đã quá hạn trả lời — bạn được hoàn 100 % tiền.";
  const gio = Math.round(ms / 3_600_000);
  const phan = gio >= 1 ? `còn khoảng ${gio} giờ` : "còn dưới một giờ";
  return `Hạn trả lời: ${phan} (đến ${gioPhutVn(han)}).`;
}

/** Cụm từ KHÔNG được xuất hiện ở trang người dùng (regex cho e2e + test thuần): kiểu đếm ngược thúc ép. */
export const CUM_THUC_EP = /chỉ còn|nhanh lên|gấp|sắp hết|đếm ngược|\d+\s*giây/i;

// ---------------------------------------------------------------- kiểm câu trả lời của chuyên gia (luật cố định, không AI)
// Danh sách ngắn trong TS để chạy ngay trong trình duyệt; engine /v1/quan-tri/kiem-dinh (qua /api/quan-tri/ai viec "kiem") kiểm
// thêm giọng phán / vùng cấm đầy đủ hơn — hai lớp đều báo, lớp nào có mục CHẶN thì nút Trả lời khoá.
const CHAN_BENH = [
  "ung thư", "tiểu đường", "đột quỵ", "tai biến", "trầm cảm", "tâm thần", "suy thận", "suy tim", "xơ gan", "viêm gan",
  "lao phổi", "hiv", "sida", "vô sinh", "sảy thai", "u não", "u xơ", "bướu", "nhồi máu", "huyết áp cao", "cao huyết áp",
  "chẩn đoán", "bệnh nặng", "bệnh hiểm nghèo", "mắc bệnh",
];
const CHAN_HUNG = ["chết", "tử vong", "qua đời", "tang tóc", "tai hoạ", "tai họa", "tai nạn", "đại kỵ", "đại hung", "cực hung", "hoạ sát thân", "xổ số", "lô đề", "số đề"];
const CANH_BAO_PHAN = ["chắc chắn", "nhất định", "định mệnh", "số phận đã", "không thể tránh", "bạn sẽ", "sẽ gặp", "phải mua", "vật phẩm", "giải hạn", "cúng", "bùa"];
const LIEN_HE = /(https?:\/\/|www\.)|[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}|(\+?84|0)[\s.-]?\d{2,3}[\s.-]?\d{3}[\s.-]?\d{3,4}|zalo|telegram|facebook\.com|fb\.com/i;

const boDau = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").toLowerCase();
/** Có cụm trong văn: khớp đúng dấu ở mọi cụm; khớp KHÔNG dấu (người gõ nhanh) chỉ với cụm ≥ 2 từ hoặc ≥ 7 ký tự, theo ranh giới
 *  từ — tránh "cúng" bắt nhầm "cung Quan Lộc". */
function coCum(van: string, cum: string): boolean {
  if (van.toLowerCase().includes(cum.toLowerCase())) return true;
  if (!cum.includes(" ") && cum.length < 7) return false;
  return new RegExp(`(^|[^a-z0-9])${boDau(cum).replace(/\s+/g, "\\s+")}([^a-z0-9]|$)`).test(boDau(van));
}

export interface KetQuaKiem { chan: string[]; canh_bao: string[] }

/** Kiểm trước khi gửi câu trả lời: `chan` (tên bệnh / chẩn đoán, sống chết – tai hoạ – đại kỵ, xổ số, link / số liên lạc) khoá nút
 *  gửi; `canh_bao` (giọng phán, vật phẩm) chỉ nhắc. Trả mảng rỗng = sạch. */
export function kiemTraLoi(van: string): KetQuaKiem {
  const chan: string[] = [], canh_bao: string[] = [];
  const t = van.trim();
  if (t.length < 20) chan.push("Câu trả lời quá ngắn (tối thiểu 20 ký tự).");
  if (t.length > TRA_LOI_TOI_DA) chan.push(`Quá ${TRA_LOI_TOI_DA.toLocaleString("vi-VN")} ký tự.`);
  const benh = CHAN_BENH.filter((c) => coCum(t, c));
  if (benh.length) chan.push(`Tên bệnh / chẩn đoán (cấm): ${benh.map((x) => `"${x}"`).join(", ")} — nói "phần cơ thể sách xưa gắn với sao, nên chăm sóc phòng ngừa, khám định kỳ" và nhắc không thay lời bác sĩ.`);
  const hung = CHAN_HUNG.filter((c) => coCum(t, c));
  if (hung.length) chan.push(`Phán hung / sống chết / xổ số (cấm): ${hung.map((x) => `"${x}"`).join(", ")}.`);
  if (LIEN_HE.test(t)) chan.push("Có link, email, số điện thoại hoặc kênh liên hệ ngoài — mọi trao đổi ở trong trang.");
  const phan = CANH_BAO_PHAN.filter((c) => coCum(t, c));
  if (phan.length) canh_bao.push(`Giọng phán định / vật phẩm: ${phan.map((x) => `"${x}"`).join(", ")} — đổi sang "thường được mô tả là", "nên cân nhắc".`);
  return { chan, canh_bao };
}
