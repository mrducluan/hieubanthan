// QLNS-2 — lối đi tiếp cuối trang /quan-ly-nhan-su: các trang trụ liên quan, chữ link đúng từ khoá của trang đích
// (SEO-1: mỗi từ khoá một trang sở hữu, trang khác chỉ trỏ về bằng đúng từ khoá đó). Danh sách biên tập — mô tả nói đúng điều
// trang đích làm được. Dùng cùng kiểu thẻ + đo (`TheLap`, `DoKhoiCuoi`) như các khối cuối trang khác.
import type { TheLap } from "@/lib/the-lap";

export function lienKetQuanLy(namXem: number): TheLap[] {
  const the = (duong: string, ten: string, mo_ta: string, hinh: TheLap["hinh"]): TheLap => ({ duong, ten, mo_ta, hinh, nhan: "Công cụ" });
  return [
    the("/bat-tu", "Xem Bát tự online", "Hành nổi trội và đại vận của từng người, đọc đầy đủ theo giờ sinh.", "bat-tu"),
    the("/than-so", "Thần số học", "Số đường đời và năm cá nhân: vì sao mỗi người làm việc một nhịp riêng.", "than-so"),
    the("/hop-doi", "Xem hợp đôi đồng nghiệp, cộng sự", "Hai người làm chung: chỗ hợp, chỗ dễ va chạm và cách trao đổi.", "than-so"),
    the("/thoi-gian-toi", "Thời gian tới: lịch 12 tháng của bạn", "Tháng nào nên mở rộng, tháng nào nên giữ nhịp — theo lá số của riêng bạn.", "tu-vi"),
    the("/xem-ngay-tot", "Xem ngày tốt khai trương", "Chọn ngày và giờ hoàng đạo để ký hợp đồng, mở cửa hàng, về văn phòng mới.", "kinh-dich"),
    the("/phong-thuy", "Xem phong thuỷ nhà ở, văn phòng", "Hướng nhà, hướng kê bàn làm việc theo mệnh người ngồi.", "phong-thuy"),
    the(`/nam/${namXem}`, `Xem năm ${namXem} theo tuổi`, "Con giáp từng năm, tuổi làm nhà, cưới hỏi và xông đất.", "than-so"),
    the("/tu-vi", "Xem Tử vi online", "Cung Quan Lộc, Nô Bộc và Tài Bạch: cách bạn dùng người và giữ tiền.", "tu-vi"),
    the("/goi-xem", "Các gói xem luận giải", "Chọn báo cáo đầy đủ cho bản thân hoặc người trong nhóm.", "than-so"),
  ];
}
