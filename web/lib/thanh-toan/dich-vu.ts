// Rà UX trục 3 ("lời hứa nhất quán, không ngõ cụt") — trạng thái mở của các dịch vụ trả tiền, đọc ở MÁY CHỦ từ đúng nguồn
// mà luồng mua / trừ Sao dùng (không ghi cứng):
//   · Hội viên năm mở  = công tắc sao.hoi_vien.bat VÀ có cổng thanh toán (congDangBat) — giống điều kiện hiện nút mua.
//   · Hỏi chuyên gia mở = chuyen_gia_thong_tin().bat (SQL 0029, cùng nguồn hàm tạo câu hỏi).
//   · "Chưa cần nạp"   = không chỗ nào đang trừ Sao: Luận giải toàn bộ cả 3 mảng (dangThuSao — công tắc chung + riêng mảng,
//     env cũ, bí mật ký khoá) VÀ hỏi đáp vượt lượt (sao.hoi.thu — cùng điều kiện cuaHoi).
import { layCauHinh } from "@/lib/cau-hinh";
import { thongTinChuyenGia } from "@/lib/chuyen-gia-may-chu";
import { coTaiKhoan } from "@/lib/cua-sao";
import { MANG_LUAN_GIAI } from "@/lib/luan-giai-mang";
import { dangThuSao } from "@/lib/luan-giai-sao";
import { congDangBat, khachDichVu } from "@/lib/thanh-toan/cong";

export interface DichVuMo { hoiVien: boolean; chuyenGia: boolean }

export async function dichVuDangMo(): Promise<DichVuMo> {
  const [hv, cg] = await Promise.all([
    layCauHinh<boolean>("sao.hoi_vien.bat").catch(() => false),
    thongTinChuyenGia().then((t) => t.bat).catch(() => false),
  ]);
  return { hoiVien: Boolean(hv) && congDangBat() !== null, chuyenGia: cg };
}

/** true khi hiện KHÔNG có chỗ nào trừ Sao của người dùng → /nap-sao nói thẳng "bạn chưa cần nạp". Lỗi đọc → false
 *  (không hứa miễn phí khi không chắc). */
export async function chuaCanNapSao(): Promise<boolean> {
  try {
    const luanGiai = await Promise.all(MANG_LUAN_GIAI.map((m) => dangThuSao(m)));
    if (luanGiai.some(Boolean)) return false;
    const hoi = coTaiKhoan() && Boolean(await layCauHinh<boolean>("sao.hoi.thu")) && khachDichVu() !== null;
    return !hoi;
  } catch {
    return false;
  }
}
