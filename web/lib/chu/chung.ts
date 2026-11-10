// ND-7 đợt 2 — "Chữ dùng chung": chữ nhỏ lặp lại trên nhiều trang (form hồ sơ, ô vào trang chủ, khung hỏi đáp, nút Thử
// lại; đợt 3: góp ý, kiểm chứng, nút chia sẻ, "Vì sao nói vậy"). Sửa MỘT lần ở CMS → Giao diện website → "Chữ dùng chung"
// là đổi ở mọi trang. Nhãn ô nhập giữ nghĩa rõ (người dùng trình đọc màn hình nghe đúng nhãn này).
// KHÔNG đưa vào đây: câu cam kết dữ liệu (link "không có ngày sinh", ô đồng ý lưu ghi chú…) và câu tỉ lệ "x% thấy đúng" —
// đó là lời hứa về hệ thống, sửa tự do dễ thành nói sai; đổi bằng PR như trang pháp lý. Mã đo (feedback_submitted…) không
// phụ thuộc chữ: đổi nhãn nút không làm lệch số Gate.
import type { BangChu, MucChu } from "@/lib/chu-trang";
import { THANH_MANG, khoaChu } from "@/lib/thanh-mang";

const HS = "Form hồ sơ", CV = "Ô vào trang chủ", HD = "Khung hỏi đáp", L = "Báo lỗi";
const NT = "Lá số người thân (Tử vi)";
const GB = "Góp ý cuối bài", GC = "Góp ý dưới câu trả lời", KC = "Kiểm chứng “Đúng với mình”", CS = "Nút chia sẻ", BD = "Bài đọc";

// TM-1: nhãn thanh mảng (dải điều hướng dưới menu chính ở trang của từng mảng). Chỉ đổi CHỮ — đường dẫn, thứ tự, số
// trang khoá trong code (lib/thanh-mang.ts). Sinh từ THANH_MANG để thêm mục là có ô sửa ngay.
const CHU_THANH: Record<string, MucChu> = Object.fromEntries(THANH_MANG.flatMap((t) => [
  [`thanh.${t.ma}.ten`, { nhom: `Thanh mảng · ${t.ten}`, nhan: "Tên mảng (đầu thanh)", mac_dinh: t.ten, en: t.en, toi_da: 24 }],
  ...t.muc.map((m, i) => [khoaChu(t, m), { nhom: `Thanh mảng · ${t.ten}`,
    nhan: i === 0 ? `Mục đầu — mở công cụ (${m.duong})` : `Mục ${m.duong}`, mac_dinh: m.nhan, en: m.en, toi_da: 28 }]),
]));

export const CHU_CHUNG = {
  "ho_so.ho_ten": { nhom: HS, nhan: "Nhãn ô họ tên", mac_dinh: "Họ và tên đầy đủ", en: "Full name", toi_da: 40 },
  "ho_so.ho_ten_vi_du": { nhom: HS, nhan: "Chữ mờ trong ô họ tên", mac_dinh: "Nguyễn Văn An", en: "Jane Smith", toi_da: 40 },
  "ho_so.ngay_sinh": { nhom: HS, nhan: "Nhãn nhóm ngày sinh", mac_dinh: "Ngày sinh", en: "Date of birth", toi_da: 30 },
  "ho_so.nut_xem": { nhom: HS, nhan: "Nút gửi mặc định", mac_dinh: "Xem con số của tôi", en: "See my numbers", toi_da: 40 },
  "ho_so.them_khong_bat_buoc": { nhom: HS, nhan: "Dòng mở phần thêm (không bắt buộc)", mac_dinh: "Thêm giờ, nơi sinh, tên gọi khác (tuỳ chọn)", en: "Add birth time, place, another name (optional)", toi_da: 100 },
  "ho_so.them_day_du": { nhom: HS, nhan: "Dòng mở phần thêm (mảng cần giờ sinh)", mac_dinh: "Giờ sinh, giới tính & nơi sinh (cần cho mảng này)", en: "Birth time, sex and place of birth (needed here)", toi_da: 100 },
  "ho_so.them_gioi_tinh": { nhom: HS, nhan: "Dòng mở phần thêm (mảng cần giới tính)", mac_dinh: "Giới tính (cần cho mảng này)", en: "Sex (needed here)", toi_da: 100 },
  "ho_so.ten_khac": { nhom: HS, nhan: "Nhãn ô tên thường gọi", mac_dinh: "Tên thường gọi / cách viết khác", en: "Name you go by / other spelling", toi_da: 60 },
  "ho_so.gio_sinh": { nhom: HS, nhan: "Nhãn ô giờ sinh", mac_dinh: "Giờ sinh", en: "Time of birth", toi_da: 30 },
  "ho_so.gioi_tinh": { nhom: HS, nhan: "Nhãn ô giới tính", mac_dinh: "Giới tính", en: "Sex", toi_da: 30 },
  "ho_so.noi_sinh": { nhom: HS, nhan: "Nhãn ô nơi sinh", mac_dinh: "Nơi sinh", en: "Place of birth", toi_da: 30 },
  // ĐY-1: khối đồng ý xử lý dữ liệu (lần đầu). Câu mô tả CÁCH xử lý (không lưu, máy chủ Singapore) giữ trong code —
  // là lời hứa về hệ thống, đổi bằng PR cùng Chính sách quyền riêng tư; ở đây chỉ tiêu đề, nhãn nút và dòng trạng thái.
  "ho_so.dong_y_tieu_de": { nhom: HS, nhan: "Tiêu đề khối đồng ý (lần đầu)", mac_dinh: "Trước khi xem", en: "Before you continue", toi_da: 40 },
  "ho_so.nut_dong_y": { nhom: HS, nhan: "Nút gửi khi chưa đồng ý xử lý dữ liệu", mac_dinh: "Đồng ý và xem kết quả", en: "Agree and see my result", toi_da: 40 },
  "ho_so.da_dong_y": { nhom: HS, nhan: "Dòng trạng thái khi đã đồng ý", mac_dinh: "Bạn đã đồng ý xử lý dữ liệu", en: "You have agreed to data processing", toi_da: 60 },
  "ho_so.thu_hoi": { nhom: HS, nhan: "Nút thu hồi đồng ý (xoá đồng ý + hồ sơ trên máy)", mac_dinh: "Thu hồi", en: "Withdraw", toi_da: 30 },
  "ho_so.chinh_sach": { nhom: HS, nhan: "Chữ link tới Chính sách quyền riêng tư", mac_dinh: "Chính sách quyền riêng tư", en: "Privacy policy", toi_da: 40 },

  "cua_vao.tieu_de": { nhom: CV, nhan: "Tiêu đề ô nhập (chưa có hồ sơ)", mac_dinh: "Chỉ cần tên và ngày sinh", en: "All you need is a name and a birth date", toi_da: 80 },
  "cua_vao.chao_lai": { nhom: CV, nhan: "Dòng nhỏ khi đã có hồ sơ", mac_dinh: "Chào lại", en: "Welcome back", toi_da: 30 },
  "cua_vao.san_sang": { nhom: CV, nhan: "Câu dưới tên người dùng", mac_dinh: "Hồ sơ đã sẵn sàng trên máy này.", en: "Your profile is ready on this device.", toi_da: 100 },
  "cua_vao.nut_hom_nay": { nhom: CV, nhan: "Nút chính", mac_dinh: "Xem cả ngày hôm nay", en: "See your whole day", toi_da: 40 },
  "cua_vao.nut_ho_so": { nhom: CV, nhan: "Nút phụ", mac_dinh: "Mở hồ sơ bản thân", en: "Open my page", toi_da: 40 },
  "cua_vao.nut_hop": { nhom: CV, nhan: "Nút xem hợp đôi (mở /hop-doi)", mac_dinh: "Xem hợp với ai", en: "Who am I compatible with?", toi_da: 40 },

  "hoi.o_nhap": { nhom: HD, nhan: "Chữ mờ trong ô hỏi", mac_dinh: "Gõ điều bạn đang băn khoăn…", en: "Type what is on your mind…", toi_da: 80 },
  "hoi.loi_ket_noi": { nhom: HD, nhan: "Báo khi mất kết nối", mac_dinh: "Không kết nối được. Thử lại sau.", en: "We couldn't connect. Please try again later.", toi_da: 100 },
  "loi.thu_lai": { nhom: L, nhan: "Nút thử lại khi lỗi", mac_dinh: "Thử lại", en: "Try again", toi_da: 20 },

  "gop_y_bai.hoi": { nhom: GB, nhan: "Câu hỏi mặc định (trang không đặt câu riêng)", mac_dinh: "Bài đọc này có giúp bạn hiểu mình hơn?", en: "Did this reading help you understand yourself better?", toi_da: 100 },
  "gop_y_bai.co": { nhom: GB, nhan: "Nút “có” (đo Gate 1: co)", mac_dinh: "Có, khá trúng", en: "Yes, quite accurate", toi_da: 30 },
  "gop_y_bai.vua": { nhom: GB, nhan: "Nút “một phần” (đo: vua)", mac_dinh: "Một phần", en: "Partly", toi_da: 30 },
  "gop_y_bai.khong": { nhom: GB, nhan: "Nút “chưa” (đo: khong)", mac_dinh: "Chưa", en: "Not really", toi_da: 30 },
  "gop_y_bai.cam_on": { nhom: GB, nhan: "Lời cảm ơn sau khi bấm", mac_dinh: "Cảm ơn bạn — góp ý này giúp bài đọc tốt hơn.", en: "Thank you — your feedback helps us improve the reading.", toi_da: 120 },

  "gop_y_cau.hoi": { nhom: GC, nhan: "Câu hỏi dưới câu trả lời thần số", mac_dinh: "Câu trả lời này có đúng với bạn không?", en: "Does this answer fit you?", toi_da: 100 },
  "gop_y_cau.dung": { nhom: GC, nhan: "Nút đúng", mac_dinh: "Đúng", en: "Yes", toi_da: 20 },
  "gop_y_cau.chua_dung": { nhom: GC, nhan: "Nút chưa đúng (mở ô ghi chú)", mac_dinh: "Chưa đúng", en: "Not quite", toi_da: 20 },
  "gop_y_cau.gui": { nhom: GC, nhan: "Nút gửi ghi chú", mac_dinh: "Gửi góp ý", en: "Send feedback", toi_da: 30 },
  "gop_y_cau.bo_qua": { nhom: GC, nhan: "Nút bỏ qua ghi chú", mac_dinh: "Bỏ qua ghi chú", en: "Skip the note", toi_da: 30 },
  "gop_y_cau.cam_on": { nhom: GC, nhan: "Lời cảm ơn", mac_dinh: "Cảm ơn bạn — góp ý này giúp câu trả lời tốt hơn cho mọi người.", en: "Thank you — your feedback makes the answers better for everyone.", toi_da: 120 },

  "kiem_chung.hoi": { nhom: KC, nhan: "Câu hỏi mặc định dưới hộp luận giải", mac_dinh: "Điều này có đúng với bạn?", en: "Does this fit you?", toi_da: 80 },
  "kiem_chung.dung": { nhom: KC, nhan: "Nút đúng", mac_dinh: "Đúng với mình", en: "Resonates with me", toi_da: 30 },
  "kiem_chung.chua_dung": { nhom: KC, nhan: "Nút chưa đúng", mac_dinh: "Chưa đúng", en: "Not quite me", toi_da: 30 },
  "kiem_chung.cam_on": { nhom: KC, nhan: "Lời cảm ơn (đọc cho trình đọc màn hình)", mac_dinh: "Cảm ơn bạn — đã ghi nhận để ban biên tập xem lại.", en: "Thank you — noted for our editors to review.", toi_da: 120 },
  "kiem_chung.da_ghi": { nhom: KC, nhan: "Chữ cạnh dấu ✓ sau khi bấm", mac_dinh: "Đã ghi", en: "Saved", toi_da: 20 },

  "chia_se.ten_link": { nhom: CS, nhan: "Nhãn ô tên hiển thị trên link mời", mac_dinh: "Tên hiển thị trên link (có thể dùng biệt danh)", en: "Name shown on the link (a nickname is fine)", toi_da: 80 },
  "chia_se.dang_tao": { nhom: CS, nhan: "Nút lúc đang tạo link", mac_dinh: "Đang tạo…", en: "Creating…", toi_da: 30 },
  "chia_se.gui": { nhom: CS, nhan: "Nút gửi link", mac_dinh: "Gửi qua Zalo, Messenger…", en: "Share via WhatsApp, Messenger…", toi_da: 40 },
  "chia_se.chep_link": { nhom: CS, nhan: "Nút chép link (đọc cho trình đọc màn hình)", mac_dinh: "Sao chép link", en: "Copy link", toi_da: 30 },
  "chia_se.da_chep": { nhom: CS, nhan: "Báo đã chép link", mac_dinh: "Đã chép link", en: "Link copied", toi_da: 30 },
  "chia_se.tai_story": { nhom: CS, nhan: "Nút tải ảnh dọc", mac_dinh: "Tải ảnh (đăng story)", en: "Download image (for stories)", toi_da: 40 },
  "chia_se.the_ngay": { nhom: CS, nhan: "Nút chia sẻ thẻ hôm nay", mac_dinh: "Chia sẻ thẻ hôm nay", en: "Share today's card", toi_da: 40 },
  "chia_se.xong_dat": { nhom: CS, nhan: "Nút chia sẻ thẻ xông đất theo năm (không kèm tuổi gia chủ)", mac_dinh: "Rủ nhà khác xem tuổi xông đất", en: "Invite others to check first-footer ages", toi_da: 40 },

  "doc.vi_sao": { nhom: BD, nhan: "Nút mở căn cứ (thuật ngữ) dưới mỗi hộp / câu trả lời", mac_dinh: "Vì sao nói vậy", en: "Why we say this", toi_da: 30 },
  "doc.tai_anh": { nhom: BD, nhan: "Nút tải ảnh lá số / tứ trụ", mac_dinh: "Tải ảnh", en: "Download image", toi_da: 30 },

  // NT-1: lá số người thân lưu trên máy. Câu cam kết "Chỉ lưu trên máy này…" giữ trong code (lib/nguoi-than.ts).
  "nguoi_than.dang_xem": { nhom: NT, nhan: "Nhãn trước tên người đang xem lá số", mac_dinh: "Đang xem", en: "Viewing", toi_da: 30 },
  "nguoi_than.ban": { nhom: NT, nhan: "Tên chỉ chính người dùng trong ô chọn", mac_dinh: "Bạn", en: "You", toi_da: 20 },
  "nguoi_than.them": { nhom: NT, nhan: "Nút mở form thêm người thân", mac_dinh: "Thêm người thân", en: "Add a family member", toi_da: 40 },
  "nguoi_than.ten_goi": { nhom: NT, nhan: "Nhãn ô tên gọi (tuỳ chọn)", mac_dinh: "Tên gọi / biệt danh (tuỳ chọn)", en: "Name or nickname (optional)", toi_da: 60 },
  "nguoi_than.dong_y": { nhom: NT, nhan: "Ô đồng ý (không tích sẵn) trước khi lưu", mac_dinh: "Người này đồng ý cho tôi lưu, hoặc tôi là cha mẹ, người giám hộ", en: "This person agrees to me saving their details, or I am their parent or guardian", toi_da: 140 },
  "nguoi_than.luu": { nhom: NT, nhan: "Nút lưu", mac_dinh: "Lưu trên máy này", en: "Save on this device", toi_da: 40 },
  "nguoi_than.luu_nguoi_nay": { nhom: NT, nhan: "Lời mời lưu người vừa xem (Xem lá số 2 người)", mac_dinh: "Lưu người này trên máy", en: "Save this person on this device", toi_da: 60 },
  "nguoi_than.chon": { nhom: NT, nhan: "Ô chọn người đã lưu (Xem lá số 2 người)", mac_dinh: "Chọn từ người thân đã lưu", en: "Choose a saved family member", toi_da: 60 },
  "nguoi_than.xoa": { nhom: NT, nhan: "Nút xoá một người", mac_dinh: "Xoá", en: "Delete", toi_da: 20 },
  "nguoi_than.xoa_tat_ca": { nhom: NT, nhan: "Nút xoá tất cả", mac_dinh: "Xoá tất cả", en: "Delete all", toi_da: 30 },
  "nguoi_than.ve_ban": { nhom: NT, nhan: "Nút quay về lá số của chính người dùng", mac_dinh: "Về lá số của bạn", en: "Back to your chart", toi_da: 40 },
  "nguoi_than.chi_xem": { nhom: NT, nhan: "Dòng nhắc khi đang xem lá số người thân", mac_dinh: "Bạn đang xem lá số của người khác: chỉ xem lá số và hỏi đáp — không lưu bài, không luận giải toàn bộ, không ghi góp ý.", en: "You are viewing someone else's chart: you can see the chart and ask questions — no saving, no full reading, no feedback.", toi_da: 200 },
  "nguoi_than.chua_dong_y": { nhom: NT, nhan: "Báo khi bấm lưu mà chưa tích ô đồng ý", mac_dinh: "Hãy tích ô đồng ý trước khi lưu.", en: "Please tick the consent box before saving.", toi_da: 100 },
  "nguoi_than.day": { nhom: NT, nhan: "Báo khi đã lưu đủ 5 người", mac_dinh: "Đã đủ 5 người — xoá bớt một người để lưu thêm.", en: "You have saved 5 people — delete one to add another.", toi_da: 100 },
  "nguoi_than.da_luu": { nhom: NT, nhan: "Báo lưu xong", mac_dinh: "Đã lưu trên máy này.", en: "Saved on this device.", toi_da: 60 },
  "nguoi_than.thieu": { nhom: NT, nhan: "Ghi chú người thiếu giờ / giới tính / nơi sinh (chỉ dùng cho Xem lá số 2 người)", mac_dinh: "Chưa đủ giờ sinh, giới tính, nơi sinh — chỉ dùng để điền Xem lá số 2 người.", en: "Missing birth time, sex or place of birth — only used to fill in the two-chart comparison.", toi_da: 120 },
  ...CHU_THANH,
} as const satisfies BangChu;
