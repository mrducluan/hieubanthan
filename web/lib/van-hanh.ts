// PL-1 — thông tin đơn vị vận hành hiển thị ở footer + trang pháp lý. Đọc env ở MÁY CHỦ (server component),
// không hardcode thông tin thật trong code. Thiếu biến nào thì footer ẩn dòng đó; trang pháp lý ghi "đang cập nhật".
// Danh sách biến + ý nghĩa: web/.env.example, docs/VIEC-CUA-ANH.md mục E.

export interface VanHanh {
  /** Tên cá nhân/doanh nghiệp chịu trách nhiệm (bên kiểm soát dữ liệu). */
  chuSoHuu: string | null;
  /** Mã số thuế / số giấy chứng nhận đăng ký doanh nghiệp hoặc hộ kinh doanh. */
  maSo: string | null;
  noiCap: string | null;
  diaChi: string | null;
  email: string | null;
  /** Hộp thư nhận yêu cầu về dữ liệu cá nhân (mặc định = email liên hệ). */
  emailDuLieu: string | null;
  dienThoai: string | null;
  /** Link xác nhận "Đã thông báo Bộ Công Thương" (online.gov.vn) — chỉ có khi đã đăng ký. */
  boCongThuong: string | null;
  mangXaHoi: { ten: string; url: string }[];
}

const v = (k: string) => (process.env[k] ?? "").trim() || null;

export function vanHanh(): VanHanh {
  const email = v("THONG_TIN_EMAIL");
  const mxh: [string, string][] = [
    ["Facebook", "MXH_FACEBOOK"], ["Zalo", "MXH_ZALO"], ["TikTok", "MXH_TIKTOK"], ["YouTube", "MXH_YOUTUBE"],
  ];
  return {
    chuSoHuu: v("THONG_TIN_CHU_SO_HUU"),
    maSo: v("THONG_TIN_MA_SO"),
    noiCap: v("THONG_TIN_NOI_CAP"),
    diaChi: v("THONG_TIN_DIA_CHI"),
    email,
    emailDuLieu: v("THONG_TIN_EMAIL_DU_LIEU") ?? email,
    dienThoai: v("THONG_TIN_DIEN_THOAI"),
    boCongThuong: v("THONG_TIN_BO_CONG_THUONG_URL"),
    mangXaHoi: mxh.flatMap(([ten, k]) => { const url = v(k); return url && /^https:\/\//.test(url) ? [{ ten, url }] : []; }),
  };
}

export const DANG_CAP_NHAT = "đang cập nhật";
/** Ngày hiệu lực của bộ chính sách hiện hành — đổi khi sửa nội dung trang pháp lý. */
export const NGAY_HIEU_LUC = "08/10/2026";
