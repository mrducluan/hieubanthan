// ND-7 đợt 2 — "Chữ dùng chung": chữ nhỏ lặp lại trên nhiều trang (form hồ sơ, ô vào trang chủ, khung hỏi đáp, nút Thử
// lại). Sửa MỘT lần ở CMS → Giao diện website → "Chữ dùng chung" là đổi ở mọi trang. Nhãn ô nhập giữ nghĩa rõ (người dùng
// trình đọc màn hình nghe đúng nhãn này).
import type { BangChu } from "@/lib/chu-trang";

const HS = "Form hồ sơ", CV = "Ô vào trang chủ", HD = "Khung hỏi đáp", L = "Báo lỗi";

export const CHU_CHUNG = {
  "ho_so.ho_ten": { nhom: HS, nhan: "Nhãn ô họ tên", mac_dinh: "Họ và tên đầy đủ", toi_da: 40 },
  "ho_so.ho_ten_vi_du": { nhom: HS, nhan: "Chữ mờ trong ô họ tên", mac_dinh: "Nguyễn Văn An", toi_da: 40 },
  "ho_so.ngay_sinh": { nhom: HS, nhan: "Nhãn nhóm ngày sinh", mac_dinh: "Ngày sinh", toi_da: 30 },
  "ho_so.nut_xem": { nhom: HS, nhan: "Nút gửi mặc định", mac_dinh: "Xem con số của tôi", toi_da: 40 },
  "ho_so.them_khong_bat_buoc": { nhom: HS, nhan: "Dòng mở phần thêm (không bắt buộc)", mac_dinh: "Thêm tên thường gọi, giờ sinh, nơi sinh (không bắt buộc)", toi_da: 100 },
  "ho_so.them_day_du": { nhom: HS, nhan: "Dòng mở phần thêm (mảng cần giờ sinh)", mac_dinh: "Giờ sinh, giới tính & nơi sinh (cần cho mảng này)", toi_da: 100 },
  "ho_so.them_gioi_tinh": { nhom: HS, nhan: "Dòng mở phần thêm (mảng cần giới tính)", mac_dinh: "Giới tính (cần cho mảng này)", toi_da: 100 },
  "ho_so.ten_khac": { nhom: HS, nhan: "Nhãn ô tên thường gọi", mac_dinh: "Tên thường gọi / cách viết khác", toi_da: 60 },
  "ho_so.gio_sinh": { nhom: HS, nhan: "Nhãn ô giờ sinh", mac_dinh: "Giờ sinh", toi_da: 30 },
  "ho_so.gioi_tinh": { nhom: HS, nhan: "Nhãn ô giới tính", mac_dinh: "Giới tính", toi_da: 30 },
  "ho_so.noi_sinh": { nhom: HS, nhan: "Nhãn ô nơi sinh", mac_dinh: "Nơi sinh", toi_da: 30 },

  "cua_vao.tieu_de": { nhom: CV, nhan: "Tiêu đề ô nhập (chưa có hồ sơ)", mac_dinh: "Bắt đầu — chỉ cần 2 thông tin", toi_da: 80 },
  "cua_vao.chao_lai": { nhom: CV, nhan: "Dòng nhỏ khi đã có hồ sơ", mac_dinh: "Chào lại", toi_da: 30 },
  "cua_vao.san_sang": { nhom: CV, nhan: "Câu dưới tên người dùng", mac_dinh: "Hồ sơ đã sẵn sàng trên máy này.", toi_da: 100 },
  "cua_vao.nut_hom_nay": { nhom: CV, nhan: "Nút chính", mac_dinh: "Xem cả ngày hôm nay", toi_da: 40 },
  "cua_vao.nut_ho_so": { nhom: CV, nhan: "Nút phụ", mac_dinh: "Mở hồ sơ bản thân", toi_da: 40 },
  "cua_vao.nut_hop": { nhom: CV, nhan: "Nút mở lời mời xem hợp", mac_dinh: "Xem hợp với ai", toi_da: 40 },
  "cua_vao.moi_mo_ta": { nhom: CV, nhan: "Giải thích lời mời xem hợp", toi_da: 250,
    mac_dinh: "Gửi link cho người bạn muốn xem cùng — họ tự nhập ngày sinh của họ, rồi cả hai thấy kết quả hai người. Không ai thấy ngày sinh của ai." },

  "hoi.o_nhap": { nhom: HD, nhan: "Chữ mờ trong ô hỏi", mac_dinh: "Gõ điều bạn đang băn khoăn…", toi_da: 80 },
  "hoi.loi_ket_noi": { nhom: HD, nhan: "Báo khi mất kết nối", mac_dinh: "Không kết nối được. Thử lại sau.", toi_da: 100 },
  "loi.thu_lai": { nhom: L, nhan: "Nút thử lại khi lỗi", mac_dinh: "Thử lại", toi_da: 20 },
} as const satisfies BangChu;
