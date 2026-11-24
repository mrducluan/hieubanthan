// LX-2027 — Lì xì Báo cáo Tết Đinh Mùi 2027 (migration 0042_li_xi_tet.sql).
// Tặng NỘI DUNG mở trọn báo cáo /thoi-gian-toi (2027), KHÔNG phải Sao hay tiền mặt.
// Zero-PII: không bao giờ lưu hay truyền ngày sinh của người nhận từ phía người tặng.

export const MAU_THIEP = ["do_son", "mai_vang", "ngoc_bich", "dem_giao_thua"] as const;
export type MauThiep = (typeof MAU_THIEP)[number];

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
}

export const DANH_SACH_MAU_THIEP: ThongTinMauThiep[] = [
  {
    ma: "do_son",
    ten: "Đỏ Son Hoàng Kim",
    moTa: "Sơn mài đỏ thẫm ép kim truyền thống",
    nenChinh: "#7f1419",
    nenPhu: "#4c090d",
    vien: "#eab64d",
    chu: "#fff6e5",
    nhan: "#f5c85c",
  },
  {
    ma: "mai_vang",
    ten: "Mai Vàng Phú Quý",
    moTa: "Giấy điều đỏ thắm điểm nhị mai vàng",
    nenChinh: "#991b1b",
    nenPhu: "#5f1014",
    vien: "#fde047",
    chu: "#fefce8",
    nhan: "#facc15",
  },
  {
    ma: "ngoc_bich",
    ten: "Ngọc Bích An Khang",
    moTa: "Xanh ngọc cổ điển, trang nhã cho đối tác",
    nenChinh: "#0f3d36",
    nenPhu: "#082420",
    vien: "#e2b866",
    chu: "#f0fdf4",
    nhan: "#f0c875",
  },
  {
    ma: "dem_giao_thua",
    ten: "Đêm Giao Thừa",
    moTa: "Đêm sao Hiểu Bản Thân ánh kim pháo hoa",
    nenChinh: "#131736",
    nenPhu: "#090b1d",
    vien: "#e5b85b",
    chu: "#f8f4e8",
    nhan: "#f2c66d",
  },
];

export const mauThiepTheoMa = (ma?: string | null): ThongTinMauThiep =>
  DANH_SACH_MAU_THIEP.find((x) => x.ma === ma) ?? DANH_SACH_MAU_THIEP[0]!;

export const LOI_CHUC_MAU = [
  "Chúc bạn năm Đinh Mùi 2027 vạn sự hanh thông, tâm an trí sáng, mọi quyết định lớn đều đúng thời điểm.",
  "Gửi bạn một phong bao đặc biệt — chúc năm 2027 công việc thăng hoa, tài lộc vững bền, gia đạo êm ấm.",
  "Chúc mừng năm mới 2027! Mong bản đồ 12 tháng này giúp bạn chọn đúng tháng đẹp cho mọi dự định.",
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
