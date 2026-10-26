// ND-7 đợt 2 — "Chữ dùng chung": chữ nhỏ lặp lại trên nhiều trang (form hồ sơ, ô vào trang chủ, khung hỏi đáp, nút Thử
// lại; đợt 3: góp ý, kiểm chứng, nút chia sẻ, "Vì sao nói vậy"). Sửa MỘT lần ở CMS → Giao diện website → "Chữ dùng chung"
// là đổi ở mọi trang. Nhãn ô nhập giữ nghĩa rõ (người dùng trình đọc màn hình nghe đúng nhãn này).
// KHÔNG đưa vào đây: câu cam kết dữ liệu (link "không có ngày sinh", ô đồng ý lưu ghi chú…) và câu tỉ lệ "x% thấy đúng" —
// đó là lời hứa về hệ thống, sửa tự do dễ thành nói sai; đổi bằng PR như trang pháp lý. Mã đo (feedback_submitted…) không
// phụ thuộc chữ: đổi nhãn nút không làm lệch số Gate.
import type { BangChu } from "@/lib/chu-trang";

const HS = "Form hồ sơ", CV = "Ô vào trang chủ", HD = "Khung hỏi đáp", L = "Báo lỗi";
const GB = "Góp ý cuối bài", GC = "Góp ý dưới câu trả lời", KC = "Kiểm chứng “Đúng với mình”", CS = "Nút chia sẻ", BD = "Bài đọc";

export const CHU_CHUNG = {
  "ho_so.ho_ten": { nhom: HS, nhan: "Nhãn ô họ tên", mac_dinh: "Họ và tên đầy đủ", toi_da: 40 },
  "ho_so.ho_ten_vi_du": { nhom: HS, nhan: "Chữ mờ trong ô họ tên", mac_dinh: "Nguyễn Văn An", toi_da: 40 },
  "ho_so.ngay_sinh": { nhom: HS, nhan: "Nhãn nhóm ngày sinh", mac_dinh: "Ngày sinh", toi_da: 30 },
  "ho_so.nut_xem": { nhom: HS, nhan: "Nút gửi mặc định", mac_dinh: "Xem con số của tôi", toi_da: 40 },
  "ho_so.them_khong_bat_buoc": { nhom: HS, nhan: "Dòng mở phần thêm (không bắt buộc)", mac_dinh: "Thêm giờ, nơi sinh, tên gọi khác (tuỳ chọn)", toi_da: 100 },
  "ho_so.them_day_du": { nhom: HS, nhan: "Dòng mở phần thêm (mảng cần giờ sinh)", mac_dinh: "Giờ sinh, giới tính & nơi sinh (cần cho mảng này)", toi_da: 100 },
  "ho_so.them_gioi_tinh": { nhom: HS, nhan: "Dòng mở phần thêm (mảng cần giới tính)", mac_dinh: "Giới tính (cần cho mảng này)", toi_da: 100 },
  "ho_so.ten_khac": { nhom: HS, nhan: "Nhãn ô tên thường gọi", mac_dinh: "Tên thường gọi / cách viết khác", toi_da: 60 },
  "ho_so.gio_sinh": { nhom: HS, nhan: "Nhãn ô giờ sinh", mac_dinh: "Giờ sinh", toi_da: 30 },
  "ho_so.gioi_tinh": { nhom: HS, nhan: "Nhãn ô giới tính", mac_dinh: "Giới tính", toi_da: 30 },
  "ho_so.noi_sinh": { nhom: HS, nhan: "Nhãn ô nơi sinh", mac_dinh: "Nơi sinh", toi_da: 30 },
  // ĐY-1: khối đồng ý xử lý dữ liệu (lần đầu). Câu mô tả CÁCH xử lý (không lưu, máy chủ Singapore) giữ trong code —
  // là lời hứa về hệ thống, đổi bằng PR cùng Chính sách quyền riêng tư; ở đây chỉ tiêu đề, nhãn nút và dòng trạng thái.
  "ho_so.dong_y_tieu_de": { nhom: HS, nhan: "Tiêu đề khối đồng ý (lần đầu)", mac_dinh: "Trước khi xem", toi_da: 40 },
  "ho_so.nut_dong_y": { nhom: HS, nhan: "Nút gửi khi chưa đồng ý xử lý dữ liệu", mac_dinh: "Đồng ý và xem kết quả", toi_da: 40 },
  "ho_so.da_dong_y": { nhom: HS, nhan: "Dòng trạng thái khi đã đồng ý", mac_dinh: "Bạn đã đồng ý xử lý dữ liệu", toi_da: 60 },
  "ho_so.thu_hoi": { nhom: HS, nhan: "Nút thu hồi đồng ý (xoá đồng ý + hồ sơ trên máy)", mac_dinh: "Thu hồi", toi_da: 30 },
  "ho_so.chinh_sach": { nhom: HS, nhan: "Chữ link tới Chính sách quyền riêng tư", mac_dinh: "Chính sách quyền riêng tư", toi_da: 40 },

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

  "gop_y_bai.hoi": { nhom: GB, nhan: "Câu hỏi mặc định (trang không đặt câu riêng)", mac_dinh: "Bài đọc này có giúp bạn hiểu mình hơn?", toi_da: 100 },
  "gop_y_bai.co": { nhom: GB, nhan: "Nút “có” (đo Gate 1: co)", mac_dinh: "Có, khá trúng", toi_da: 30 },
  "gop_y_bai.vua": { nhom: GB, nhan: "Nút “một phần” (đo: vua)", mac_dinh: "Một phần", toi_da: 30 },
  "gop_y_bai.khong": { nhom: GB, nhan: "Nút “chưa” (đo: khong)", mac_dinh: "Chưa", toi_da: 30 },
  "gop_y_bai.cam_on": { nhom: GB, nhan: "Lời cảm ơn sau khi bấm", mac_dinh: "Cảm ơn bạn — góp ý này giúp bài đọc tốt hơn.", toi_da: 120 },

  "gop_y_cau.hoi": { nhom: GC, nhan: "Câu hỏi dưới câu trả lời thần số", mac_dinh: "Câu trả lời này có đúng với bạn không?", toi_da: 100 },
  "gop_y_cau.dung": { nhom: GC, nhan: "Nút đúng", mac_dinh: "Đúng", toi_da: 20 },
  "gop_y_cau.chua_dung": { nhom: GC, nhan: "Nút chưa đúng (mở ô ghi chú)", mac_dinh: "Chưa đúng", toi_da: 20 },
  "gop_y_cau.gui": { nhom: GC, nhan: "Nút gửi ghi chú", mac_dinh: "Gửi góp ý", toi_da: 30 },
  "gop_y_cau.bo_qua": { nhom: GC, nhan: "Nút bỏ qua ghi chú", mac_dinh: "Bỏ qua ghi chú", toi_da: 30 },
  "gop_y_cau.cam_on": { nhom: GC, nhan: "Lời cảm ơn", mac_dinh: "Cảm ơn bạn — góp ý này giúp câu trả lời tốt hơn cho mọi người.", toi_da: 120 },

  "kiem_chung.hoi": { nhom: KC, nhan: "Câu hỏi mặc định dưới hộp luận giải", mac_dinh: "Điều này có đúng với bạn?", toi_da: 80 },
  "kiem_chung.dung": { nhom: KC, nhan: "Nút đúng", mac_dinh: "Đúng với mình", toi_da: 30 },
  "kiem_chung.chua_dung": { nhom: KC, nhan: "Nút chưa đúng", mac_dinh: "Chưa đúng", toi_da: 30 },
  "kiem_chung.cam_on": { nhom: KC, nhan: "Lời cảm ơn (đọc cho trình đọc màn hình)", mac_dinh: "Cảm ơn bạn — đã ghi nhận để ban biên tập xem lại.", toi_da: 120 },
  "kiem_chung.da_ghi": { nhom: KC, nhan: "Chữ cạnh dấu ✓ sau khi bấm", mac_dinh: "Đã ghi", toi_da: 20 },

  "chia_se.ten_link": { nhom: CS, nhan: "Nhãn ô tên hiển thị trên link mời", mac_dinh: "Tên hiển thị trên link (có thể dùng biệt danh)", toi_da: 80 },
  "chia_se.dang_tao": { nhom: CS, nhan: "Nút lúc đang tạo link", mac_dinh: "Đang tạo…", toi_da: 30 },
  "chia_se.gui": { nhom: CS, nhan: "Nút gửi link", mac_dinh: "Gửi qua Zalo, Messenger…", toi_da: 40 },
  "chia_se.chep_link": { nhom: CS, nhan: "Nút chép link (đọc cho trình đọc màn hình)", mac_dinh: "Sao chép link", toi_da: 30 },
  "chia_se.da_chep": { nhom: CS, nhan: "Báo đã chép link", mac_dinh: "Đã chép link", toi_da: 30 },
  "chia_se.tai_story": { nhom: CS, nhan: "Nút tải ảnh dọc", mac_dinh: "Tải ảnh (đăng story)", toi_da: 40 },
  "chia_se.the_ngay": { nhom: CS, nhan: "Nút chia sẻ thẻ hôm nay", mac_dinh: "Chia sẻ thẻ hôm nay", toi_da: 40 },
  "chia_se.xong_dat": { nhom: CS, nhan: "Nút chia sẻ thẻ xông đất theo năm (không kèm tuổi gia chủ)", mac_dinh: "Rủ nhà khác xem tuổi xông đất", toi_da: 40 },

  "doc.vi_sao": { nhom: BD, nhan: "Nút mở căn cứ (thuật ngữ) dưới mỗi hộp / câu trả lời", mac_dinh: "Vì sao nói vậy", toi_da: 30 },
  "doc.tai_anh": { nhom: BD, nhan: "Nút tải ảnh lá số / tứ trụ", mac_dinh: "Tải ảnh", toi_da: 30 },
} as const satisfies BangChu;
