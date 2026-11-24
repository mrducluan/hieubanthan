// LX-2027 — LÌ XÌ TẾT 2027 (migration 0042_li_xi_tet.sql).
// Tặng NỘI DUNG mở trọn báo cáo /thoi-gian-toi (2027), KHÔNG phải Sao hay tiền mặt.
// Zero-PII: không bao giờ lưu hay truyền ngày sinh của người nhận từ phía người tặng.

export const MAU_THIEP = ["do_son", "mai_vang", "ngoc_bich", "dem_giao_thua"] as const;
export type MauThiep = (typeof MAU_THIEP)[number];

export const HOA_TIET_TET = [
  "linh_vat",
  "linh_vat_son_mai",
  "linh_vat_thanh_lich",
  "hoa_mai",
  "hoa_dao",
  "phao_hoa",
] as const;
export type HoaTietTet = (typeof HOA_TIET_TET)[number];

export const KHUNG_SOCIAL = ["doc", "vuong", "ngang"] as const;
export type KhungSocial = (typeof KHUNG_SOCIAL)[number];

export const MA_LI_XI_RE = /^[a-f0-9]{16}$/;

export interface ThongTinMauThiep {
  ma: MauThiep;
  ten: string;
  moTa: string;
  nenChinh: string;
  nenPhu: string;
  vien: string;
  chu: string;
  nhan: string;
  hoaMacDinh: HoaTietTet;
  mauCanhHoa: string;
}

export const DANH_SACH_MAU_THIEP: ThongTinMauThiep[] = [
  {
    ma: "do_son",
    ten: "Gấm Đỏ Son",
    moTa: "Sơn mài đỏ thẫm ép kim đồng xu cổ",
    nenChinh: "#8b1218",
    nenPhu: "#47070b",
    vien: "#eab64d",
    chu: "#fff6e5",
    nhan: "#f7cf68",
    hoaMacDinh: "linh_vat",
    mauCanhHoa: "#fde047",
  },
  {
    ma: "mai_vang",
    ten: "Lụa Mai Vàng",
    moTa: "Giấy điều đỏ thắm điểm cành mai vàng",
    nenChinh: "#9e1c1c",
    nenPhu: "#5a0e12",
    vien: "#fde047",
    chu: "#fefce8",
    nhan: "#fde047",
    hoaMacDinh: "hoa_mai",
    mauCanhHoa: "#facc15",
  },
  {
    ma: "ngoc_bich",
    ten: "Men Ngọc Bích",
    moTa: "Xanh ngọc cổ điển điểm hoa đào xuân",
    nenChinh: "#0e433b",
    nenPhu: "#07241f",
    vien: "#e2b866",
    chu: "#f0fdf4",
    nhan: "#f3cb77",
    hoaMacDinh: "hoa_dao",
    mauCanhHoa: "#fda4af",
  },
  {
    ma: "dem_giao_thua",
    ten: "Đêm Giao Thừa",
    moTa: "Đêm sao Hiểu Bản Thân ánh kim pháo hoa",
    nenChinh: "#151b3d",
    nenPhu: "#080b1f",
    vien: "#e5b85b",
    chu: "#f8f4e8",
    nhan: "#f5cb6f",
    hoaMacDinh: "phao_hoa",
    mauCanhHoa: "#fda4af",
  },
];

export interface ThongTinHoaTiet {
  ma: HoaTietTet;
  ten: string;
  moTa: string;
  nhanSocial: string;
  anh: string | null;
}

export const DANH_SACH_HOA_TIET: ThongTinHoaTiet[] = [
  {
    ma: "linh_vat",
    ten: "Linh Vật Ép Kim 24K",
    moTa: "Phù điêu Dê Vàng trên gấm chữ Vạn",
    nhanSocial: "LINH VẬT ĐINH MÙI · ÉP KIM 24K",
    anh: "/anh/li-xi/linh-vat-ep-kim.jpg",
  },
  {
    ma: "linh_vat_son_mai",
    ten: "Linh Vật Sơn Mài",
    moTa: "Khắc gỗ hoàng kim & sóng Thiên Hà Thuỷ",
    nhanSocial: "LINH VẬT ĐINH MÙI · SƠN MÀI",
    anh: "/anh/li-xi/linh-vat-son-mai.jpg",
  },
  {
    ma: "linh_vat_thanh_lich",
    ten: "Linh Vật Thanh Lịch",
    moTa: "Dê Vàng tối giản sang trọng hiện đại",
    nhanSocial: "LINH VẬT ĐINH MÙI · THANH LỊCH",
    anh: "/anh/li-xi/linh-vat-thanh-lich.jpg",
  },
  {
    ma: "hoa_mai",
    ten: "Cành Hoa Mai",
    moTa: "Mai vàng nhiều lớp cánh phương Nam",
    nhanSocial: "MAI VÀNG PHÚ QUÝ",
    anh: "/anh/li-xi/hoa-mai-vang.jpg",
  },
  {
    ma: "hoa_dao",
    ten: "Cành Hoa Đào",
    moTa: "Đào bích nhung hồng trên gấm ngọc",
    nhanSocial: "ĐÀO XUÂN AN KHANG",
    anh: "/anh/li-xi/hoa-dao-bich.jpg",
  },
  {
    ma: "phao_hoa",
    ten: "Pháo Hoa Xuân",
    moTa: "Ánh kim rực rỡ đêm Giao Thừa",
    nhanSocial: "PHÁO HOA GIAO THỪA",
    anh: null,
  },
];

export const ANH_NEN_GAM_EP_KIM = "/anh/li-xi/nen-gam-ep-kim.jpg";

export const DANH_SACH_KHUNG_SOCIAL: { ma: KhungSocial; ten: string; kichThuoc: string; dungCho: string }[] = [
  { ma: "doc", ten: "Story 9:16", kichThuoc: "1080×1920", dungCho: "Instagram / FB / TikTok / Zalo Story" },
  { ma: "vuong", ten: "Bài đăng 1:1", kichThuoc: "1080×1080", dungCho: "Facebook / Zalo Feed" },
  { ma: "ngang", ten: "Ảnh bìa 16:9", kichThuoc: "1200×630", dungCho: "Chia sẻ link Zalo / Messenger" },
];

export const mauThiepTheoMa = (ma?: string | null): ThongTinMauThiep =>
  DANH_SACH_MAU_THIEP.find((x) => x.ma === ma) ?? DANH_SACH_MAU_THIEP[0]!;

export const thongTinHoaTiet = (ma?: string | null, mau?: MauThiep): ThongTinHoaTiet => {
  const macDinh = mauThiepTheoMa(mau).hoaMacDinh;
  return DANH_SACH_HOA_TIET.find((x) => x.ma === ma) ??
    DANH_SACH_HOA_TIET.find((x) => x.ma === macDinh) ??
    DANH_SACH_HOA_TIET[0]!;
};

export const hoaTietTheoMa = (ma?: string | null, mau?: MauThiep): HoaTietTet =>
  thongTinHoaTiet(ma, mau).ma;

/**
 * Băm tất định từ mã bao lì xì `ma` (12–16 ký tự hex) → xoay vòng qua các mẫu Linh Vật & Hoa Xuân
 * để mỗi bao lì xì trong combo 3 / 5 bao có một vẻ đẹp riêng mà 100% không dùng Math.random khi SSR.
 */
export function hoaTietTuMaBao(maBao?: string | null, mau?: MauThiep): HoaTietTet {
  if (!maBao) return mauThiepTheoMa(mau).hoaMacDinh;
  if (mau === "ngoc_bich") return "hoa_dao";
  if (mau === "mai_vang") return "hoa_mai";
  if (mau === "dem_giao_thua") return "phao_hoa";
  const dsLinhVat: HoaTietTet[] = ["linh_vat", "linh_vat_son_mai", "linh_vat_thanh_lich"];
  let sum = 0;
  for (let i = 0; i < maBao.length; i++) sum = (sum * 31 + maBao.charCodeAt(i)) >>> 0;
  return dsLinhVat[sum % dsLinhVat.length]!;
}

export const LOI_CHUC_MAU = [
  "Chúc bạn năm Đinh Mùi 2027 vạn sự hanh thông, tâm an trí sáng, mọi quyết định lớn đều đúng thời điểm.",
  "Gửi bạn phong bao LÌ XÌ TẾT 2027 — chúc công việc thăng hoa, tài lộc vững bền, gia đạo êm ấm.",
  "Chúc mừng năm mới Đinh Mùi 2027! Mong bản đồ 12 tháng này giúp bạn chọn đúng tháng đẹp cho mọi dự định.",
  "Kính chúc gia đình một năm Đinh Mùi an khang, sức khoẻ dồi dào, bình an trong từng chặng đường mới.",
  "Chúc bạn năm mới 2027 bứt phá rực rỡ, giữ tiền chắc tay, gặp nhiều quý nhân và bình yên mỗi ngày.",
  "Món quà nhỏ đầu xuân — chúc bạn hiểu rõ nhịp vận 2027 để chủ động đón lành, tránh vội vàng.",
];

export interface ThongTinLiXi {
  bat: boolean;
  gia_1: number;
  gia_3: number;
  gia_5: number;
  nam: number;
  han: string;
  cong: "pay2s" | "gia" | null;
}

export interface BaoLiXiCongKhai {
  co: boolean;
  ma?: string;
  ten_nguoi_tang?: string | null;
  loi_chuc?: string | null;
  mau_thiep?: MauThiep;
  nam?: number;
  trang_thai?: "san_sang" | "da_nhan";
  het_han?: string;
  con_han?: boolean;
}

export interface BaoLiXiCuaToi {
  ma: string;
  ma_don?: number;
  ten_nguoi_tang: string | null;
  loi_chuc: string | null;
  mau_thiep: MauThiep;
  nam: number;
  trang_thai?: "cho_tra" | "san_sang" | "da_nhan" | "hoan";
  het_han?: string;
  nhan_luc: string | null;
  tao_luc?: string;
}

export const dinhDangVnd = (n: number) => `${Math.round(n).toLocaleString("vi-VN")} ₫`;

/** Chữ người tặng gõ có thứ không được hiện dưới tên miền hieuban.com không (true = chặn): link (cả không "http"), email,
 *  dãy số dài (điện thoại, số tài khoản), từ ngữ lừa đảo hay gặp. Giống hệt hàm SQL `lx_chu_bi_chan` (0042) — sửa một
 *  bên thì sửa bên kia, test hai phía (lib/li-xi-tet.test.mjs, supabase/kiem_thu/thu_li_xi_tet_0042.sql). */
export function chuBiChan(s: string): boolean {
  return /(https?:|www\.|\.(com|vn|net|org|io|me|xyz|top|info|link|app|site|online|shop)([^a-z]|$)|@|bit\.ly|tinyurl)/i.test(s)
    || /[0-9][0-9 .-]{5,}[0-9]/.test(s)
    || /(zalo|telegram|viber|whatsapp|facebook|\bstk\b|t[aà]i kho[aả]n|chuy[eể]n kho[aả]n|ng[aâ]n h[aà]ng|\botp\b|m[aậ]t kh[aẩ]u|m[aã] x[aá]c (nh[aậ]n|th[uự]c)|tr[uú]ng th[uư][oở]ng|nh[aậ]n th[uư][oở]ng|b[aấ]m v[aà]o|nh[aấ]n v[aà]o|đăng nh[aậ]p|dang nhap)/i.test(s);
}

/** Tên người tặng (tuỳ chọn): ≤ 40 ký tự, không chữ số, không link / từ lừa đảo. */
export function kiemTen(s: string): string | null {
  const t = s.trim();
  if (!t) return null;
  if (t.length > 40) return "Tên người tặng tối đa 40 ký tự.";
  if (/[0-9]/.test(t) || chuBiChan(t)) return "Tên người tặng chỉ gồm chữ (không số, không đường dẫn, không tên ngân hàng / ứng dụng).";
  return null;
}

/** Lời chúc (mẫu hoặc tự viết): ≤ 160 ký tự, không link, email, số điện thoại / tài khoản, từ ngữ lừa đảo. */
export function kiemLoiChuc(s: string): string | null {
  const t = s.trim();
  if (t.length > 160) return "Lời chúc tối đa 160 ký tự.";
  if (chuBiChan(t)) return "Lời chúc không kèm đường dẫn, email, số điện thoại / số tài khoản hay lời nhắn chuyển tiền.";
  return null;
}

/** Lời chúc là một mẫu có sẵn? Mẫu mới được hiện ở ảnh chia sẻ + mô tả link; lời tự viết chỉ hiện TRONG trang bao. */
export const laLoiChucMau = (s?: string | null) => Boolean(s) && LOI_CHUC_MAU.includes(s!.trim());

/** Phần trăm rẻ hơn so với mua lẻ, tính từ chính bảng giá (GIA-99: không ghi cứng). < 5 % → null (không khoe). */
export function tietKiemPhanTram(giaLe: number, giaGoi: number, soBao: number): number | null {
  if (!(giaLe > 0) || !(soBao > 1)) return null;
  const pt = Math.floor((1 - giaGoi / (giaLe * soBao)) * 100);
  return pt >= 5 ? pt : null;
}

/**
 * Tải hoặc chia sẻ ảnh PNG LÌ XÌ TẾT 2027 tương thích cả Desktop lẫn Zalo / Facebook In-App WebView trên iOS/Android:
 * - Nếu thiết bị hỗ trợ Web Share Level 2 (navigator.canShare({ files })) trên mobile → mở sheet chia sẻ/lưu ảnh gốc của OS;
 * - Ngược lại → tải qua Blob objectURL (hoặc mở tab ảnh nếu WebView chặn a[download]).
 */
export async function taiAnhSocialLiXi(url: string, tenFile: string): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    const r = await fetch(url, { cache: "no-store" });
    if (!r.ok) throw new Error("bad_status");
    const blob = await r.blob();
    const file = new File([blob], tenFile, { type: "image/png" });
    const laMobile = /iPhone|iPad|iPod|Android|Zalo|FBAN|FBAV/i.test(navigator.userAgent);
    if (laMobile && typeof navigator.canShare === "function" && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title: "LÌ XÌ TẾT 2027" });
      return;
    }
    const objUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objUrl;
    a.download = tenFile;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(objUrl), 5_000);
  } catch {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}
