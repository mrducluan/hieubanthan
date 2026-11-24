// QT-2 — cài đặt site trong bảng cau_hinh (migration 0010/0011). Chỉ chạy ở MÁY CHỦ.
// Không bao giờ chứa bí mật: khoá bí mật vẫn ở env. Web đọc bằng khoá anon qua hàm cau_hinh_cong_khai(),
// cache 60 giây (tag "cau-hinh" — trang quản trị xoá cache ngay khi lưu). Thiếu Supabase / chưa chạy 0011 → {} →
// mọi thứ chạy theo mặc định (hoặc env cũ), không vỡ trang.
import { unstable_cache } from "next/cache";
import { createClient } from "@supabase/supabase-js";

export type CaiDat =
  | { khoa: string; ten: string; moTa: string; nhom: string; loai: "so"; min: number; max: number; macDinh: number }
  | { khoa: string; ten: string; moTa: string; nhom: string; loai: "bat_tat"; macDinh: boolean; env?: string }
  | { khoa: string; ten: string; moTa: string; nhom: string; loai: "chu"; toiDa: number; macDinh: string }
  | { khoa: string; ten: string; moTa: string; nhom: string; loai: "duong_dan"; macDinh: string };

/** Danh mục DUY NHẤT các khoá được sửa trên giao diện. Chữ/banner hiển thị (dải thông báo…) thuộc CMS (Trang chủ & banner),
 *  ở đây chỉ còn số + công tắc ảnh hưởng tiền/Sao/AI. Thêm khoá = thêm ở đây (SQL chỉ nhận tiền tố site./sao./luan_giai.). */
export const CAI_DAT: readonly CaiDat[] = [
  { khoa: "sao.thuong.moi_ban", nhom: "Sao & lời mời", loai: "so", min: 0, max: 100, macDinh: 20,
    ten: "Thưởng người mời", moTa: "Sao cộng cho người gửi link khi bạn bè (tài khoản mới hay cũ, chưa từng nhận lời mời ai) lưu hồ sơ vào tài khoản." },
  { khoa: "sao.thuong.duoc_moi", nhom: "Sao & lời mời", loai: "so", min: 0, max: 100, macDinh: 20,
    ten: "Thưởng người được mời", moTa: "Sao cộng cho người mới đến từ link mời." },
  { khoa: "sao.thuong.chao_mung", nhom: "Sao & lời mời", loai: "so", min: 0, max: 100, macDinh: 10,
    ten: "Thưởng chào mừng", moTa: "Sao cộng một lần khi lưu hồ sơ vào tài khoản." },
  { khoa: "sao.tran_moi_30_ngay", nhom: "Sao & lời mời", loai: "so", min: 0, max: 200, macDinh: 20,
    ten: "Trần lượt thưởng người mời / 30 ngày", moTa: "Chống lạm dụng. Quá trần: người được mời vẫn nhận, người mời không." },
  // SAO-V (migration 0025): hoa hồng nạp Sao — affiliate MỘT tầng, trả bằng Sao tặng (hạn 365 ngày), SQL đọc cùng khoá (kẹp).
  { khoa: "sao.hoa_hong.bat", nhom: "Hoa hồng nạp Sao", loai: "bat_tat", macDinh: false,
    ten: "Hoa hồng khi bạn bè nạp Sao", moTa: "Bật = người mời nhận % số Sao của các đơn nạp đầu của bạn bè mình mời (chỉ người mời trực tiếp). Đơn hoàn tiền → tự thu hồi." },
  { khoa: "sao.hoa_hong.phan_tram", nhom: "Hoa hồng nạp Sao", loai: "so", min: 0, max: 50, macDinh: 20,
    ten: "Tỉ lệ hoa hồng (%)", moTa: "Tính trên số Sao của đơn (làm tròn xuống), trả bằng Sao tặng." },
  { khoa: "sao.hoa_hong.so_don", nhom: "Hoa hồng nạp Sao", loai: "so", min: 1, max: 12, macDinh: 1,
    ten: "Số đơn đầu được tính", moTa: "1 = chỉ lần nạp đầu tiên của bạn bè." },
  { khoa: "sao.hoa_hong.thang", nhom: "Hoa hồng nạp Sao", loai: "so", min: 1, max: 36, macDinh: 12,
    ten: "Thời hạn tính hoa hồng (tháng)", moTa: "Tính từ lúc bạn bè nhận lời mời." },
  { khoa: "sao.hoa_hong.tran_30_ngay", nhom: "Hoa hồng nạp Sao", loai: "so", min: 0, max: 10000, macDinh: 1000,
    ten: "Trần hoa hồng mỗi người mời / 30 ngày (Sao)", moTa: "Chống lạm dụng. Quá trần: đơn vẫn ghi nhận, không cộng thêm Sao." },
  // SAO-GL (0026): chống gian lận thưởng mời + hoa hồng theo mã băm thiết bị (HMAC IP + user-agent, không lưu IP).
  { khoa: "sao.gian_lan.bat", nhom: "Hoa hồng nạp Sao", loai: "bat_tat", macDinh: true,
    ten: "Chống gian lận lời mời", moTa: "Bật (mặc định) = một máy nhận lời mời cho quá nhiều tài khoản, hoặc người mời và người được mời cùng máy → người mời không được thưởng / hoa hồng, ghi cờ ở Doanh thu. Người được mời vẫn nhận thưởng của mình." },
  { khoa: "sao.gian_lan.thiet_bi_30_ngay", nhom: "Hoa hồng nạp Sao", loai: "so", min: 2, max: 50, macDinh: 3,
    ten: "Số tài khoản / một máy / 30 ngày thì gắn cờ", moTa: "Tài khoản thứ N nhận lời mời trên cùng một máy trong 30 ngày → người mời không được thưởng. Gia đình dùng chung máy: tăng số này." },
  // SAO-ND (migration 0027): thiết kế lần nạp đầu — SQL đọc cùng khoá (tao_don_nap / goi_sao_dang_ban / nd_tang_cho_don).
  { khoa: "sao.goi_khoi_dau.bat", nhom: "Nạp Sao", loai: "bat_tat", macDinh: false,
    ten: "Bán gói Khởi đầu (19.000 ₫ / 19 Sao)", moTa: "Gói nhỏ từ thời giá 29 Sao — ở giá 99 Sao không còn đủ mở báo cáo nào, nên để TẮT (GIA-99). Tắt = ẩn và máy chủ từ chối tạo đơn gói này." },
  // CRO-1 (migration 0040): gói 59.000 ₫ / 59 Sao — cùng 10 Sao chào mừng vừa đủ báo cáo ưu đãi 69 Sao.
  { khoa: "sao.goi_lan_dau.bat", nhom: "Nạp Sao", loai: "bat_tat", macDinh: false,
    ten: "Bán gói Lần đầu (59.000 ₫ / 59 Sao)", moTa: "Chỉ tài khoản CHƯA từng nạp mới thấy và mua được (máy chủ kiểm lúc tạo đơn). Cộng 10 Sao chào mừng là đủ 69 Sao. Tắt = ẩn và máy chủ từ chối tạo đơn gói này." },
  { khoa: "sao.nap_dau.bat", nhom: "Nạp Sao", loai: "bat_tat", macDinh: false,
    ten: "Tặng Sao lần nạp đầu", moTa: "Bật = đơn nạp thành công ĐẦU TIÊN của mỗi tài khoản được cộng thêm % số Sao của gói, dưới dạng Sao tặng (hạn 365 ngày). Một lần mỗi tài khoản; hoàn tiền đơn đó → tự thu hồi. Hoa hồng người mời vẫn tính trên Sao của gói." },
  { khoa: "sao.nap_dau.phan_tram", nhom: "Nạp Sao", loai: "so", min: 0, max: 100, macDinh: 20,
    ten: "Tỉ lệ tặng lần nạp đầu (%)", moTa: "Tính trên số Sao của gói, làm tròn xuống. 0 = tạm dừng." },
  // ---- SAO-CG (0029) ---- "Hỏi chuyên gia": trả VND cố định qua cổng thanh toán (KHÔNG bằng Sao), chuyên gia trả lời trong
  // N giờ hoặc hoàn 100%. SQL đọc cùng khoá (cg_gia_vnd / cg_giam_pt / cg_han_gio, kẹp). Khoá gia_vnd dùng chung với 0028 (hội viên).
  { khoa: "sao.chuyen_gia.bat", nhom: "Hỏi chuyên gia", loai: "bat_tat", macDinh: false,
    ten: "Mở \"Hỏi chuyên gia\"", moTa: "Bật = trang /hoi-chuyen-gia nhận câu hỏi trả phí; chuyên gia (chủ sở hữu / thẩm định, đã MFA) trả lời ở Quản trị → Hỏi chuyên gia. Tắt = trang hiện \"sắp mở\", máy chủ từ chối tạo câu hỏi." },
  { khoa: "sao.chuyen_gia.gia_vnd", nhom: "Hỏi chuyên gia", loai: "so", min: 20000, max: 5000000, macDinh: 199000,
    ten: "Giá một câu hỏi (₫)", moTa: "Trả một lần qua chuyển khoản QR. Số tiền đơn luôn lấy từ đây ở máy chủ. Dùng chung với Hội viên năm: hoàn tiền hội viên sau 14 ngày trừ đúng giá này cho mỗi câu đã dùng." },
  { khoa: "sao.chuyen_gia.giam_lan_dau_pt", nhom: "Hỏi chuyên gia", loai: "so", min: 0, max: 90, macDinh: 30,
    ten: "Giảm giá câu hỏi đầu tiên (%)", moTa: "Áp dụng cho tài khoản chưa từng thanh toán câu hỏi nào. 0 = không giảm." },
  { khoa: "sao.chuyen_gia.han_gio", nhom: "Hỏi chuyên gia", loai: "so", min: 12, max: 168, macDinh: 48,
    ten: "Hạn trả lời (giờ)", moTa: "Tính từ lúc thanh toán. Quá hạn → chủ sở hữu hoàn 100% ngoài hệ thống rồi bấm Hoàn." },
  // SAO-V (0025): chuỗi ngày ghé — chỉ lưu ngày ghé cuối + độ dài chuỗi, mất chuỗi chỉ đếm lại.
  { khoa: "sao.chuoi.bat", nhom: "Chuỗi ngày ghé", loai: "bat_tat", macDinh: false,
    ten: "Thưởng chuỗi ngày ghé", moTa: "Tắt = vẫn đếm chuỗi cho người đăng nhập, không cộng Sao." },
  { khoa: "sao.chuoi.moc", nhom: "Chuỗi ngày ghé", loai: "so", min: 2, max: 30, macDinh: 7,
    ten: "Mốc thưởng (ngày liên tiếp)", moTa: "Cứ đủ bội số mốc này thì thưởng một lần." },
  { khoa: "sao.chuoi.sao", nhom: "Chuỗi ngày ghé", loai: "so", min: 0, max: 20, macDinh: 2,
    ten: "Sao mỗi mốc", moTa: "0 = tạm dừng thưởng." },
  { khoa: "sao.chuoi.tran_30_ngay", nhom: "Chuỗi ngày ghé", loai: "so", min: 0, max: 60, macDinh: 6,
    ten: "Trần Sao chuỗi / 30 ngày", moTa: "Chống lạm dụng." },
  // SAO-V (0025): tặng một chương — quà là NỘI DUNG (thêm 1 chương miễn phí trong 30 ngày), không phải Sao.
  { khoa: "sao.qua.bat", nhom: "Tặng một chương", loai: "bat_tat", macDinh: false,
    ten: "Cho phép tặng một chương", moTa: "Người đã mở Luận giải toàn bộ bằng Sao gửi link quà; bạn bè (có tài khoản + hồ sơ của chính họ) đọc thêm 1 chương của báo cáo của họ trong 30 ngày." },
  { khoa: "sao.qua.tran_30_ngay", nhom: "Tặng một chương", loai: "so", min: 0, max: 10, macDinh: 3,
    ten: "Số quà mỗi người / 30 ngày", moTa: "0 = tạm dừng tặng." },
  // SAO-3 (migration 0014): SQL đọc cùng các khoá này (nv_bat, nv_muc — kẹp 0–50).
  { khoa: "sao.nhiem_vu.bat", nhom: "Nhiệm vụ kiếm Sao", loai: "bat_tat", macDinh: false,
    ten: "Thưởng Sao cho nhiệm vụ", moTa: "Tắt = hộp nhiệm vụ chỉ hiện tiến độ cho người đã đăng nhập (khách không thấy), chưa nhận Sao được. Bật = làm xong bấm \"Nhận Sao\"." },
  { khoa: "sao.nhiem_vu.luu_ho_so", nhom: "Nhiệm vụ kiếm Sao", loai: "so", min: 0, max: 50, macDinh: 5,
    ten: "Nhiệm vụ: Lưu hồ sơ", moTa: "Cộng thêm, ngoài Sao chào mừng. 0 = tạm dừng nhiệm vụ này." },
  { khoa: "sao.nhiem_vu.hoi_3_cau", nhom: "Nhiệm vụ kiếm Sao", loai: "so", min: 0, max: 50, macDinh: 5,
    ten: "Nhiệm vụ: Hỏi 3 câu", moTa: "Đếm câu hỏi đáp trả lời được khi đã đăng nhập (mọi mảng, cộng dồn). 0 = tạm dừng." },
  { khoa: "sao.nhiem_vu.moi_1_ban", nhom: "Nhiệm vụ kiếm Sao", loai: "so", min: 0, max: 50, macDinh: 5,
    ten: "Nhiệm vụ: Mời 1 bạn", moTa: "Cộng thêm, ngoài thưởng mời (người mời / được mời ở trên). 0 = tạm dừng." },
  // HTT-2 H5: AI chỉ diễn đạt LẠI các hộp "Điểm giao thoa" đã ghép (bản tất định vẫn hiện), qua bộ kiểm chung; chỉ bản Việt.
  { khoa: "giao_thoa.dien_dat", nhom: "Điểm giao thoa", loai: "bat_tat", macDinh: false,
    ten: "AI diễn đạt lại hộp giao thoa", moTa: "Tắt = chỉ bản mẫu tất định. Bật = thêm một đoạn AI diễn đạt lại đúng các hộp đã ghép (không thêm dữ kiện; không qua kiểm thì không hiện), tốn lượt AI. Nên bật sau khi hộp giao thoa có ≥ 30 phiếu \"Đúng với mình\"." },
  { khoa: "luan_giai.thu_sao", nhom: "Luận giải toàn bộ", loai: "bat_tat", macDinh: false, env: "LUAN_GIAI_THU_SAO",
    ten: "Thu Sao cho Luận giải toàn bộ", moTa: "Tắt = miễn phí thử nghiệm. Chưa đặt ở đây thì theo env LUAN_GIAI_THU_SAO." },
  // SAO-V: bật thu Sao TỪNG mảng (chạy thử Bản đồ con số trước). Mảng thu khi công tắc chung HOẶC công tắc mảng bật.
  { khoa: "luan_giai.thu_sao.thanso", nhom: "Luận giải toàn bộ", loai: "bat_tat", macDinh: false,
    ten: "Thu Sao riêng: Bản đồ con số (Thần số)", moTa: "Bật = chỉ mảng này thu Sao, kể cả khi công tắc chung đang tắt." },
  { khoa: "luan_giai.thu_sao.tuvi", nhom: "Luận giải toàn bộ", loai: "bat_tat", macDinh: false,
    ten: "Thu Sao riêng: Luận giải Tử vi", moTa: "Bật = mảng này thu Sao, kể cả khi công tắc chung đang tắt." },
  { khoa: "luan_giai.thu_sao.battu", nhom: "Luận giải toàn bộ", loai: "bat_tat", macDinh: false,
    ten: "Thu Sao riêng: Luận giải Bát tự", moTa: "Bật = mảng này thu Sao, kể cả khi công tắc chung đang tắt." },
  { khoa: "luan_giai.thu_sao.doanh_chu", nhom: "Luận giải toàn bộ", loai: "bat_tat", macDinh: false,
    ten: "Thu Sao riêng: Đội ngũ Doanh Chủ", moTa: "Bật = phân tích đội ngũ thật trên /doanh-chu sẽ trừ Sao (chế độ mẫu luôn miễn phí)." },
  { khoa: "luan_giai.gia_sao", nhom: "Luận giải toàn bộ", loai: "so", min: 1, max: 300, macDinh: 99,
    ten: "Giá Luận giải toàn bộ (Sao/báo cáo)", moTa: "Giá chung, chỉ áp dụng khi đang thu Sao. GIA-99 (16/11/2026): 99 Sao. Báo cáo có giá riêng bên dưới thì theo giá riêng." },
  // GIA-99: giá RIÊNG từng báo cáo (0 = theo giá chung). Chỉ web đọc (SQL dung_sao nhận số Sao do máy chủ web quyết).
  { khoa: "luan_giai.gia_sao.thanso", nhom: "Luận giải toàn bộ", loai: "so", min: 0, max: 300, macDinh: 49,
    ten: "Giá riêng: Bản đồ con số (Thần số)", moTa: "Báo cáo ngắn (4 chương) — cửa vào giá thấp. 0 = theo giá chung." },
  { khoa: "luan_giai.gia_sao.doanh_chu", nhom: "Luận giải toàn bộ", loai: "so", min: 0, max: 300, macDinh: 0,
    ten: "Giá riêng: Đội ngũ Doanh Chủ", moTa: "0 = theo giá chung." },
  { khoa: "luan_giai.gia_sao.tuvi", nhom: "Luận giải toàn bộ", loai: "so", min: 0, max: 300, macDinh: 0,
    ten: "Giá riêng: Luận giải Tử vi", moTa: "0 = theo giá chung." },
  { khoa: "luan_giai.gia_sao.battu", nhom: "Luận giải toàn bộ", loai: "so", min: 0, max: 300, macDinh: 0,
    ten: "Giá riêng: Luận giải Bát tự", moTa: "0 = theo giá chung." },
  { khoa: "luan_giai.gia_sao.thoi_gian", nhom: "Luận giải toàn bộ", loai: "so", min: 0, max: 300, macDinh: 0,
    ten: "Giá riêng: Thời gian tới (năm)", moTa: "0 = theo giá chung." },
  { khoa: "luan_giai.gia_sao.chan_dung", nhom: "Luận giải toàn bộ", loai: "so", min: 0, max: 300, macDinh: 0,
    ten: "Giá riêng: Chân dung tổng hợp", moTa: "0 = theo giá chung." },
  // UD-1: đợt ưu đãi CÓ HẠN THẬT cho Luận giải toàn bộ (docs/UU-DAI-CO-HAN.md). Giá gạch = giá thường ở trên; đồng hồ đếm
  // tới đúng hạn chót; "còn N suất" đếm từ sổ Sao. Thiếu hạn chót / quá hạn / hết suất → tự tắt, giá về giá thường.
  { khoa: "luan_giai.uu_dai.bat", nhom: "Ưu đãi có hạn", loai: "bat_tat", macDinh: false,
    ten: "Chạy đợt ưu đãi", moTa: "Bật = mọi Luận giải toàn bộ giảm theo mức bên dưới cho tới hết ngày hạn chót (hoặc hết suất). Phải điền hạn chót thì ưu đãi mới chạy. Hết hạn giá tự về giá thường — đừng dời hạn liên tục, người dùng sẽ hết tin đồng hồ." },
  { khoa: "luan_giai.uu_dai.ten", nhom: "Ưu đãi có hạn", loai: "chu", toiDa: 40, macDinh: "Ưu đãi mở bán",
    ten: "Tên đợt ưu đãi", moTa: "Hiện trên dải ưu đãi, vd \"Ưu đãi mở bán\", \"Đón Tết Đinh Mùi\"." },
  { khoa: "luan_giai.uu_dai.giam_pt", nhom: "Ưu đãi có hạn", loai: "so", min: 0, max: 50, macDinh: 30,
    ten: "Mức giảm (%)", moTa: "Tính trên giá thường của từng báo cáo, làm tròn Sao (99 Sao giảm 30% → 69 Sao). Tối đa 50%. 0 = tạm dừng." },
  { khoa: "luan_giai.uu_dai.het_han", nhom: "Ưu đãi có hạn", loai: "chu", toiDa: 10, macDinh: "",
    ten: "Hạn chót (năm-tháng-ngày)", moTa: "Dạng 2026-11-30. Ưu đãi chạy tới 23:59 ngày này theo giờ Việt Nam. Để trống hoặc sai dạng = không có ưu đãi." },
  { khoa: "luan_giai.uu_dai.so_suat", nhom: "Ưu đãi có hạn", loai: "so", min: 0, max: 100000, macDinh: 0,
    ten: "Số suất ưu đãi", moTa: "0 = không giới hạn suất (chỉ theo hạn chót). Lớn hơn 0 = trang hiện \"còn N suất\" đếm thật từ số lượt đã mở bằng giá ưu đãi; hết suất thì ưu đãi dừng. Cần điền mã đợt bên dưới." },
  { khoa: "luan_giai.uu_dai.ma", nhom: "Ưu đãi có hạn", loai: "chu", toiDa: 12, macDinh: "",
    ten: "Mã đợt (để đếm suất)", moTa: "2–12 chữ thường / số, không dấu, vd mb2611. Mỗi đợt mới đặt một mã mới để bộ đếm suất bắt đầu lại từ 0." },
  { khoa: "luan_giai.chuong_mien_phi", nhom: "Luận giải toàn bộ", loai: "so", min: 0, max: 3, macDinh: 1,
    ten: "Số chương xem miễn phí", moTa: "Khi đang thu Sao: ai cũng đọc trọn N chương đầu; chương sau hiện tiêu đề + điểm nhấn + câu hỏi, mở bằng Sao." },
  // EN-AI: lớp phân loại AI cho câu gõ tự do tiếng Anh (Bát tự, Tử vi). Cần CẢ env engine HOI_PHAN_LOAI_AI=1 lẫn công tắc này.
  { khoa: "hoi.phan_loai_ai_en", nhom: "Hỏi đáp", loai: "bat_tat", macDinh: false,
    ten: "Bản Anh: AI phân loại câu hỏi gõ tự do", moTa: "Bật = câu hỏi tiếng Anh (chỉ câu chữ, không dữ liệu sinh) được gửi tới nhà cung cấp AI để gán nhãn an toàn + chủ đề; AI chỉ được nâng mức an toàn, câu trả lời vẫn do engine dựng. Chỉ bật SAU khi Chính sách riêng tư bản Anh đã ghi ngày hiệu lực và env engine HOI_PHAN_LOAI_AI=1. Tốn lượt AI." },
  { khoa: "sao.hoi.thu", nhom: "Hỏi đáp", loai: "bat_tat", macDinh: false,
    ten: "Giới hạn hỏi đáp miễn phí mỗi ngày", moTa: "Tắt = hỏi không giới hạn (vẫn có trần chống lạm dụng ở engine). Bật = quá lượt miễn phí thì mỗi câu tốn Sao." },
  { khoa: "sao.hoi.mien_phi_khach", nhom: "Hỏi đáp", loai: "so", min: 0, max: 50, macDinh: 3,
    ten: "Câu miễn phí/ngày — khách chưa đăng nhập", moTa: "Hết lượt → mời đăng nhập (nhận Sao chào mừng) để hỏi tiếp." },
  { khoa: "sao.hoi.mien_phi_tk", nhom: "Hỏi đáp", loai: "so", min: 0, max: 100, macDinh: 10,
    ten: "Câu miễn phí/ngày — có tài khoản", moTa: "Tính chung mọi mảng. Hết lượt → mỗi câu tốn Sao (người dùng bấm đồng ý từng câu)." },
  { khoa: "sao.hoi.gia", nhom: "Hỏi đáp", loai: "so", min: 1, max: 10, macDinh: 5,
    ten: "Giá mỗi câu vượt lượt (Sao)", moTa: "Chỉ áp dụng khi bật giới hạn hỏi đáp." },
  // ---- SAO-HV (0028) ----
  // Hội viên năm HAI HẠNG (chủ dự án chốt phương án a, docs/SO-SANH-GIA-HOI-VIEN.md): thường + Chuyên gia. Mua MỘT LẦN bằng
  // VND (Pay2S, không tự gia hạn). SQL đọc cùng khoá (hv_goi, tao_don_hoi_vien, hv_cap_sao_thang_cho, hoi_vien_cua_toi,
  // hoan_don_nap) — kẹp cùng khoảng. Quyền lợi ĐÓNG BĂNG lúc mua: đổi số ở đây chỉ áp cho đơn / gia hạn SAU khi đổi.
  // Công tắc mặc định TẮT: trang /hoi-vien vẫn có (noindex) nhưng nút ẩn.
  { khoa: "sao.hoi_vien.bat", nhom: "Hội viên năm", loai: "bat_tat", macDinh: false,
    ten: "Bán hội viên năm (hạng thường)", moTa: "Bật = trang /hoi-vien có nút mua hạng thường, máy chủ nhận tạo đơn. Hội viên đang hiệu lực vẫn giữ quyền khi tắt. Hạng Chuyên gia cần bật thêm công tắc riêng bên dưới." },
  { khoa: "sao.hoi_vien.gia_vnd", nhom: "Hội viên năm", loai: "so", min: 100000, max: 50000000, macDinh: 399000,
    ten: "Giá hạng thường (₫/năm)", moTa: "Trả một lần cho 365 ngày; gia hạn (khi còn ≤ 30 ngày) theo giá lúc gia hạn, nối tiếp hạn cũ. Đơn đã tạo giữ giá lúc tạo." },
  { khoa: "sao.hoi_vien.sao_thang", nhom: "Hội viên năm", loai: "so", min: 0, max: 100, macDinh: 15,
    ten: "Sao tặng mỗi tháng (cả hai hạng)", moTa: "Cấp một lần mỗi tháng (lần đầu mở trang trong tháng hoặc cron sáng), hết hạn ngày cuối tháng — KHÔNG cộng dồn. 0 = tạm dừng." },
  { khoa: "sao.hoi_vien.cau_hoi_nam", nhom: "Hội viên năm", loai: "so", min: 0, max: 12, macDinh: 1,
    ten: "Câu hỏi chuyên gia mỗi năm (hạng thường)", moTa: "Lượt hỏi chuyên gia kèm hạng thường. Gia hạn → lượt về 0 cho năm mới." },
  { khoa: "sao.hoi_vien.cg.bat", nhom: "Hội viên năm", loai: "bat_tat", macDinh: false,
    ten: "Bán hạng Chuyên gia", moTa: "Bật khi chuyên gia đủ thời gian trả lời trong hạn ưu tiên. Chỉ bán khi cùng bật \"Bán hội viên năm\" và \"Mở Hỏi chuyên gia\". Người đang ở hạng thường thấy nút nâng hạng." },
  { khoa: "sao.hoi_vien.cg.gia_vnd", nhom: "Hội viên năm", loai: "so", min: 100000, max: 50000000, macDinh: 1990000,
    ten: "Giá hạng Chuyên gia (₫/năm)", moTa: "Nâng hạng giữa kỳ = giá này − giá kỳ thường × tháng tròn còn lại / 12 (làm tròn nghìn), được kỳ mới 365 ngày." },
  { khoa: "sao.hoi_vien.cg.cau_hoi_nam", nhom: "Hội viên năm", loai: "so", min: 0, max: 24, macDinh: 6,
    ten: "Câu hỏi chuyên gia mỗi năm (hạng Chuyên gia)", moTa: "Câu đã dùng ở hạng thường mang sang khi nâng hạng." },
  { khoa: "sao.hoi_vien.cg.han_gio", nhom: "Hội viên năm", loai: "so", min: 1, max: 168, macDinh: 24,
    ten: "Hạn trả lời ưu tiên (giờ, hạng Chuyên gia)", moTa: "Áp cho mọi câu hỏi của hội viên Chuyên gia (cả câu trả tiền lẻ). Không dài hơn hạn chung của Hỏi chuyên gia." },
  // (sao.chuyen_gia.gia_vnd khai một lần ở khối SAO-CG phía trên — hội viên hoàn tiền trừ theo giá đó cho câu đã dùng.)
  // ---- LX-2027 (0042) ---- LÌ XÌ TẾT 2027: bán quyền mở trọn báo cáo /thoi-gian-toi 2027 bằng VND (Pay2S).
  { khoa: "sao.li_xi.bat", nhom: "LÌ XÌ TẾT 2027", loai: "bat_tat", macDinh: false,
    ten: "Mở bán LÌ XÌ TẾT 2027", moTa: "Bật = trang /li-xi-tet-2027 hiện nút thanh toán Pay2S và máy chủ nhận tạo đơn 1 / 3 / 5 bao. Tắt = ẩn nút mua, các bao đã bán vẫn mở nhận bình thường tới 31/03/2027." },
  { khoa: "sao.li_xi.gia_1", nhom: "LÌ XÌ TẾT 2027", loai: "so", min: 20000, max: 5000000, macDinh: 99000,
    ten: "Giá gói 1 Bao Lì Xì (₫)", moTa: "Mở trọn Báo cáo Năm 2027 cho 1 người nhận (người nhận tự nhập ngày sinh)." },
  { khoa: "sao.li_xi.gia_3", nhom: "LÌ XÌ TẾT 2027", loai: "so", min: 50000, max: 10000000, macDinh: 249000,
    ten: "Giá Combo 3 Bao Gia Đình (₫)", moTa: "Sinh 3 đường dẫn bao lì xì độc lập cho 3 người nhận khác nhau." },
  { khoa: "sao.li_xi.gia_5", nhom: "LÌ XÌ TẾT 2027", loai: "so", min: 80000, max: 20000000, macDinh: 399000,
    ten: "Giá Combo 5 Bao Doanh Nghiệp (₫)", moTa: "Sinh 5 đường dẫn bao lì xì độc lập để tặng nhóm hoặc đối tác." },
];

export const caiDat = (khoa: string) => CAI_DAT.find((c) => c.khoa === khoa);

/** Kiểm + chuẩn hoá giá trị người quản trị nhập. Trả lỗi (chuỗi) nếu sai. */
export function chuanHoa(c: CaiDat, v: unknown): { ok: true; giaTri: unknown } | { ok: false; loi: string } {
  switch (c.loai) {
    case "so": {
      const n = typeof v === "number" ? v : Number(v);
      if (!Number.isInteger(n) || n < c.min || n > c.max) return { ok: false, loi: `Cần số nguyên từ ${c.min} đến ${c.max}.` };
      return { ok: true, giaTri: n };
    }
    case "bat_tat":
      return typeof v === "boolean" ? { ok: true, giaTri: v } : { ok: false, loi: "Cần bật hoặc tắt." };
    case "chu": {
      const s = typeof v === "string" ? v.replace(/\s+/g, " ").trim() : "";
      if (s.length > c.toiDa) return { ok: false, loi: `Tối đa ${c.toiDa} ký tự.` };
      return { ok: true, giaTri: s };
    }
    case "duong_dan": {
      const s = typeof v === "string" ? v.trim() : "";
      if (s && !/^\/(?![/\\])[\w\-./?=&#%]*$/.test(s)) return { ok: false, loi: "Chỉ nhận đường dẫn trong site, bắt đầu bằng /." };
      return { ok: true, giaTri: s };
    }
  }
}

async function docTho(): Promise<Record<string, unknown>> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return {};
  try {
    // Đọc trên đường đi của trang/hỏi đáp → Supabase chậm thì bỏ qua sau 3 giây (dùng mặc định), không treo.
    const sb = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { fetch: (u, i) => fetch(u, { ...i, signal: AbortSignal.timeout(3_000) }) },
    });
    const { data, error } = await sb.rpc("cau_hinh_cong_khai");
    return !error && data && typeof data === "object" ? (data as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

export const TAG_CAU_HINH = "cau-hinh";
const docCache = unstable_cache(docTho, ["cau-hinh-cong-khai"], { revalidate: 60, tags: [TAG_CAU_HINH] });

/** Giá trị thô đang lưu (chưa áp mặc định) — trang quản trị dùng để biết khoá nào đã đặt. */
export async function cauHinhDaLuu(): Promise<Record<string, unknown>> {
  return docCache().catch(() => ({}));
}

/** Giá trị có hiệu lực của một khoá: cau_hinh hợp lệ → env (nếu khai) → mặc định. */
export function giaTriHieuLuc(c: CaiDat, luu: Record<string, unknown>): unknown {
  if (c.khoa in luu) {
    const r = chuanHoa(c, luu[c.khoa]);
    if (r.ok) return r.giaTri;
  }
  if (c.loai === "bat_tat" && c.env && process.env[c.env] !== undefined) return process.env[c.env] === "1";
  return c.macDinh;
}

export async function layCauHinh<T = unknown>(khoa: string): Promise<T> {
  const c = caiDat(khoa);
  if (!c) throw new Error(`Không có cài đặt ${khoa}`);
  return giaTriHieuLuc(c, await cauHinhDaLuu()) as T;
}
