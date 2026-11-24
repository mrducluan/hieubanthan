// LX-2027 — LÌ XÌ TẾT 2027 (migration 0042_li_xi_tet.sql).
// Tặng NỘI DUNG mở trọn báo cáo /thoi-gian-toi (2027), KHÔNG phải Sao hay tiền mặt.
// Zero-PII: không bao giờ lưu hay truyền ngày sinh của người nhận từ phía người tặng.

export const MAU_THIEP = ["do_son", "mai_vang", "ngoc_bich", "dem_giao_thua"] as const;
export type MauThiep = (typeof MAU_THIEP)[number];

export const HOA_TIET_TET = ["linh_vat", "hoa_mai", "hoa_dao", "phao_hoa"] as const;
export type HoaTietTet = (typeof HOA_TIET_TET)[number];

export const KHUNG_SOCIAL = ["doc", "vuong", "ngang"] as const;
export type KhungSocial = (typeof KHUNG_SOCIAL)[number];

export const MA_LI_XI_RE = /^[a-z0-9]{12,16}$/;

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

export const DANH_SACH_HOA_TIET: { ma: HoaTietTet; ten: string; moTa: string }[] = [
  { ma: "linh_vat", ten: "Linh Vật Đinh Mùi", moTa: "Biểu trưng Kim Dương 2027" },
  { ma: "hoa_mai", ten: "Cành Hoa Mai", moTa: "Mai vàng 5 cánh phương Nam" },
  { ma: "hoa_dao", ten: "Cành Hoa Đào", moTa: "Đào phớt thắm sắc xuân Bắc" },
  { ma: "phao_hoa", ten: "Pháo Hoa Xuân", moTa: "Ánh kim đêm Giao Thừa" },
];

export const DANH_SACH_KHUNG_SOCIAL: { ma: KhungSocial; ten: string; kichThuoc: string; dungCho: string }[] = [
  { ma: "doc", ten: "Story 9:16", kichThuoc: "1080×1920", dungCho: "Instagram / FB / TikTok / Zalo Story" },
  { ma: "vuong", ten: "Bài đăng 1:1", kichThuoc: "1080×1080", dungCho: "Facebook / Zalo Feed" },
  { ma: "ngang", ten: "Ảnh bìa 16:9", kichThuoc: "1200×630", dungCho: "Chia sẻ link Zalo / Messenger" },
];

export const mauThiepTheoMa = (ma?: string | null): ThongTinMauThiep =>
  DANH_SACH_MAU_THIEP.find((x) => x.ma === ma) ?? DANH_SACH_MAU_THIEP[0]!;

export const hoaTietTheoMa = (ma?: string | null, mau?: MauThiep): HoaTietTet => {
  if (ma && (HOA_TIET_TET as readonly string[]).includes(ma)) return ma as HoaTietTet;
  return mauThiepTheoMa(mau).hoaMacDinh;
};

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

/** Kiểm tra lời chúc phía client trước khi gửi (SQL cũng kiểm lại): không link, email, SĐT, ≤ 160 ký tự. */
export function kiemLoiChuc(s: string): string | null {
  const t = s.trim();
  if (t.length > 160) return "Lời chúc tối đa 160 ký tự.";
  if (/(https?:\/\/|@|\b0\d{8,10}\b)/i.test(t)) return "Lời chúc không chứa đường dẫn, email hoặc số điện thoại.";
  return null;
}
