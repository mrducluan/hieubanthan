// QC-G — tiêu đề trang khớp nhóm quảng cáo Google (?kw=<mã>). Danh sách MÃ CỐ ĐỊNH theo trang: trang KHÔNG BAO GIỜ in lại
// chữ trên URL (không XSS, không chữ ngoài kiểm soát). Mã lạ → tiêu đề mặc định / CMS. Canonical không đổi (SEO giữ nguyên).
// Chỉ bản Việt. Thêm nhóm quảng cáo mới = thêm một dòng ở đây (h1 ≤ 60 ký tự, lời dẫn một câu, không doạ, không "chính xác").
export type DauKw = { h1: string; loiDan: string };

export const DAU_KW: Record<string, Record<string, DauKw>> = {
  "/tu-vi": {
    "tron-doi": { h1: "Lá số Tử vi trọn đời của bạn",
      loiDan: "Nhập ngày giờ sinh: lá số 12 cung theo âm lịch Việt Nam hiện ngay, chương đầu đọc miễn phí." },
    "luan-giai": { h1: "Luận giải lá số Tử vi chi tiết",
      loiDan: "Công việc, tiền bạc, tình cảm và các chặng 10 năm, lời thường, có nguồn sách xưa. Chương đầu đọc miễn phí." },
  },
  "/bat-tu": {
    "thieu-hanh": { h1: "Mệnh bạn thiếu hành gì?",
      loiDan: "Nhập ngày giờ sinh: tứ trụ theo tiết khí và điểm năm hành hiện ngay, biết hành nào nhiều, hành nào thiếu." },
    "tu-tru": { h1: "Lá số Bát tự (tứ trụ) theo ngày giờ sinh",
      loiDan: "Bốn trụ, năm hành, đại vận 10 năm, lời thường. Tứ trụ và chương đầu đọc miễn phí." },
  },
  "/than-so": {
    "ngay-sinh": { h1: "Thần số học theo tên và ngày sinh",
      loiDan: "Nhập họ tên và ngày sinh: số chủ đạo, sứ mệnh, linh hồn, nhân cách hiện ngay, miễn phí, mất 30 giây." },
  },
  "/thoi-gian-toi": {
    "2027": { h1: "Năm 2027 của riêng bạn",
      loiDan: "Chỉ cần tên và ngày sinh: 3 tháng tới và tóm tắt năm 2027 đọc miễn phí, tháng nào nên đẩy mạnh, tháng nào nên đi chậm." },
    // CRO-2 / KH-1: nhóm quảng cáo "tháng nào tốt để …" → khối "Bạn định làm gì trong 12 tháng tới?" ngay đầu trang.
    "thang-tot": { h1: "Tháng nào hợp để đổi việc, mua nhà, cưới hỏi?",
      loiDan: "Chọn việc bạn định làm: xem tháng hợp nhất trong 12 tháng tới và ngày nên đặt việc chính, theo chính ngày sinh của bạn. Miễn phí." },
  },
  "/chan-dung": {
    "tong-hop": { h1: "Chân dung bạn qua Tử vi, Bát tự và tướng mặt",
      loiDan: "Ba cách xem đặt cạnh nhau theo từng mảng đời: chỗ cùng thấy, chỗ nhìn khác nhau và vì sao. Chương đầu đọc miễn phí." },
  },
};

const MA = /^[a-z0-9-]{1,20}$/;

/** Mã từ URL → tiêu đề của nhóm quảng cáo, hoặc null (mã lạ / sai định dạng / trang không có). */
export function dauTheoKw(duong: string, kw: unknown): DauKw | null {
  if (typeof kw !== "string" || !MA.test(kw)) return null;
  return DAU_KW[duong]?.[kw] ?? null;
}
