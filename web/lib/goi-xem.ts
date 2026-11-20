// GIA-99 — danh mục "gói xem" theo NHU CẦU (docs/GOI-XEM-VA-GIA-2026-11.md). Thuần, không I/O: trang /goi-xem và e2e dùng chung.
// Mỗi gói = MỘT báo cáo engine đã dựng (không phép tính mới); người dùng mở ngay trong trang công cụ của mảng (cổng Sao tại
// chỗ, SAO-2) — trang /goi-xem chỉ là bảng giá + lối vào, không bán riêng, không giỏ hàng.
// `maGia`: mã báo cáo của cổng Sao (luan_giai.gia_sao.<mã>, công tắc luan_giai.thu_sao[.<mảng>]); null = chưa qua cổng Sao
// (đang miễn phí hoàn toàn). Lời: nhu cầu trước, không doạ, không hứa kết quả.
import type { GoiHienThi } from "@/lib/thanh-toan/nap-dau";
import { giaMoiLanXem, soBaoCao } from "@/lib/thanh-toan/nap-dau";

export type GoiXem = {
  ma: string; mang: string; maGia: string | null; duong: string; ten: string;
  /** Câu người dùng hay tự hỏi — tiêu đề phụ của thẻ. */ hoi: string;
  /** Nhận được gì (2–3 ý ngắn, đúng với báo cáo đang chạy). */ nhan: string[];
  chuong: number | null; can: string; nut: string;
};

export const GOI_XEM: readonly GoiXem[] = [
  { ma: "nam_moi", mang: "Tử vi · Bát tự · Thần số", maGia: "thoi_gian", duong: "/thoi-gian-toi", ten: "Năm mới của tôi",
    hoi: "Năm tới tháng nào thuận, tháng nào nên đi chậm?",
    nhan: ["12 tháng tới, mỗi tháng một việc nên làm", "Năm mới theo cả Tử vi và Bát tự, điều nên tránh và nên làm", "Ngày đẹp, tháng hợp tuổi, góc nhà hợp bạn trong năm"],
    chuong: 4, can: "Ngày sinh; có giờ sinh thì đọc thêm Tử vi, Bát tự", nut: "Xem năm mới của tôi" },
  { ma: "tu_vi", mang: "Tử vi", maGia: "tuvi", duong: "/tu-vi", ten: "Lá số Tử vi trọn đời",
    hoi: "Công việc, tiền bạc, tình cảm của tôi về lâu dài ra sao?",
    nhan: ["13 chương: con người, công việc, tiền bạc, tình yêu, gia đình, sức khoẻ, nhà cửa", "Trả lời thẳng 27 câu hay hỏi: hợp nghề gì, hôn nhân bền không, giữ tiền ra sao", "Chân dung vợ chồng, cha mẹ, con, sếp và hướng hoá giải từng mảng"],
    chuong: 13, can: "Ngày giờ sinh, giới tính, nơi sinh", nut: "Lập lá số Tử vi" },
  { ma: "bat_tu", mang: "Bát tự", maGia: "battu", duong: "/bat-tu", ten: "Bát tự: mệnh và ngũ hành",
    hoi: "Mệnh tôi thừa gì, thiếu gì, hợp nghề và hướng đi nào?",
    nhan: ["13 chương theo tứ trụ: năng lượng thừa – thiếu, việc, tiền, tình cảm", "Trả lời thẳng 27 câu hay hỏi, la bàn nghề theo hành bạn cần bù", "Đại vận từng giai đoạn, mười năm tới của từng mảng và hướng hoá giải"],
    chuong: 13, can: "Ngày giờ sinh, giới tính, nơi sinh", nut: "Lập lá số Bát tự" },
  { ma: "ban_do", mang: "Thần số học", maGia: "thanso", duong: "/than-so#ban-do-con-so", ten: "Bản đồ con số",
    hoi: "Tôi mạnh ở đâu, hay tự mâu thuẫn ở đâu, 12 tháng tới nên dồn sức vào gì?",
    nhan: ["Nghịch lý bên trong giữa các con số của bạn", "12 tháng tới theo tháng cá nhân", "Sự nghiệp và tiền bạc theo bốn giai đoạn đời"],
    chuong: 4, can: "Họ tên và ngày sinh", nut: "Xem bản đồ con số" },
  { ma: "chan_dung", mang: "Tử vi · Bát tự · Nhân tướng", maGia: "chan_dung", duong: "/chan-dung", ten: "Chân dung tổng hợp",
    hoi: "Ba cách xem khác nhau có cùng nói một điều về tôi không?",
    nhan: ["Bảng 6 mảng đời × 3 cách xem, chỗ nào cùng thấy, chỗ nào khác", "Mượn nguyên lời từng môn, không chấm điểm", "Việc nên làm theo mức dè dặt nhất"],
    chuong: 9, can: "Ngày giờ sinh; thêm khảo sát gương mặt nếu muốn đủ ba cột", nut: "Xem chân dung tổng hợp" },
  { ma: "hai_nguoi", mang: "Tử vi", maGia: null, duong: "/tu-vi#hop-tham", ten: "Hai người: vợ chồng, làm ăn",
    hoi: "Tôi với người ấy hợp ở đâu, cần dung hoà ở đâu?",
    nhan: ["Điểm tham khảo 0–100 theo 5 tiêu chí", "Lời riêng cho 8 kiểu quan hệ: người yêu, vợ chồng, đối tác, sếp…"],
    chuong: null, can: "Ngày sinh hai người", nut: "Xem lá số 2 người" },
  { ma: "doanh_chu", mang: "Bát tự · Thần số", maGia: "doanh_chu", duong: "/ban-do-doi-ngu", ten: "Bản đồ Đội ngũ (Chủ DN · 1–8 cộng sự)",
    hoi: "Đội ngũ đang mạnh ở đâu, mỏng ở đâu và phối hợp với từng cộng sự thế nào cho ăn ý?",
    nhan: ["Bản đồ Radar 5 hành chỉ rõ thế mạnh tập thể & lỗ hổng vận hành cần bù", "Gợi ý phối hợp 2 chiều kèm 6 góc nhìn thực tế & câu mở lời khi bất đồng", "Thử ngay đội ngũ mẫu 1 chạm hoặc gửi link bảo mật để cộng sự tự điền (không lưu ngày sinh)"],
    chuong: null, can: "Ngày sinh của bạn và 1–8 cộng sự (có đồng ý)", nut: "Mở Bản đồ Đội ngũ" },
  { ma: "nha", mang: "Phong thuỷ", maGia: null, duong: "/phong-thuy", ten: "Nhà của tôi",
    hoi: "Nhà này hợp tôi không, kê giường, bếp, bàn làm việc thế nào?",
    nhan: ["Bốn hướng hợp theo tuổi, đo hướng bằng điện thoại", "Từng phòng: việc 0 đồng làm trước, việc tốn tiền làm sau"],
    chuong: 5, can: "Năm sinh, giới tính, hướng nhà", nut: "Xem nhà của tôi" },
  { ma: "ngay", mang: "Lịch & tuổi", maGia: null, duong: "/xem-ngay-tot", ten: "Ngày lành cho việc lớn",
    hoi: "Cưới, khai trương, về nhà mới: chọn ngày nào không xung tuổi cả nhà?",
    nhan: ["Ngày hợp việc theo sách lịch, không xung tuổi tới 8 người", "Giờ hoàng đạo, lưu ý tuổi cô dâu, tuổi làm nhà"],
    chuong: null, can: "Năm sinh những người liên quan", nut: "Chọn ngày" },
  { ma: "hoi_viec", mang: "Kinh Dịch · Tarot", maGia: null, duong: "/kinh-dich", ten: "Hỏi một việc cụ thể",
    hoi: "Có nên đổi việc, có nên đi tiếp chuyện này?",
    nhan: ["Gieo quẻ hoặc rút bài, đọc theo đúng việc bạn hỏi", "Điều cần gỡ trước, việc làm trong 72 giờ"],
    chuong: null, can: "Một câu hỏi về việc của chính bạn", nut: "Gieo quẻ" },
] as const;

/** Số báo cáo mỗi năm từ đó hội viên rẻ hơn mua lẻ từng lần bằng gói rẻ nhất tính theo Sao lẻ (1 Sao ≈ đơn giá gói nhỏ). */
export function mocHoiVien(giaHoiVien: number, giaBaoCaoSao: number, goi: readonly GoiHienThi[]): number | null {
  const le = [...goi].sort((a, b) => a.gia_vnd - b.gia_vnd)[0];
  if (!le || le.sao <= 0 || giaBaoCaoSao <= 0 || giaHoiVien <= 0) return null;
  const motBaoCao = (le.gia_vnd / le.sao) * giaBaoCaoSao;
  return Math.floor(giaHoiVien / motBaoCao) + 1;
}

/** Ba cột của bảng "Ba cách trả": gói lẻ (rẻ nhất), gói đích (có nhãn), hội viên năm. Thiếu gói → cột đó null. */
export function baCachTra(goi: readonly GoiHienThi[], giaBaoCaoSao: number) {
  const le = [...goi].sort((a, b) => a.gia_vnd - b.gia_vnd)[0] ?? null;
  const dich = goi.find((g) => g.nhan) ?? null;
  const cot = (g: GoiHienThi | null) => g && {
    goi: g, baoCao: soBaoCao(g.sao, giaBaoCaoSao), moiLan: giaMoiLanXem(g, giaBaoCaoSao),
  };
  return { le: cot(le), dich: dich && dich.ma !== le?.ma ? cot(dich) : null };
}
