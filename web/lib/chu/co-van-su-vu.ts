// CHANG-3 — chữ cố định của khối "Việc sắp làm trong vài ngày" (components/co-van/SuVuTucThoi.tsx) ở /co-van và
// /co-van-kinh-doanh. Chỉ bản Việt (hai trang chưa có bản Anh). Mã tình huống phải khớp danh sách engine nhận
// (`TinhHuongSuVu` ở engine/app/co_van_api.py) — engine chưa có route trả danh sách nên nhãn + câu mẫu ở đây.
// Lời luận (giờ, hướng, quẻ, việc chuẩn bị) do engine trả. Thuật ngữ chỉ ở phần "Vì sao nói vậy".

export const MA_TINH_HUONG_SU_VU = [
  "dam_phan_thuong_vu",
  "ky_ket_hop_dong",
  "thu_hoi_cong_no",
  "ra_mat_khai_truong",
  "hoa_giai_bat_dong",
  "cho_tin_ket_qua",
] as const;
export type MaTinhHuongSuVu = (typeof MA_TINH_HUONG_SU_VU)[number];

export const CHU_SU_VU = {
  tinh_huong: {
    dam_phan_thuong_vu: { ten: "Đàm phán, gặp đối tác", goi_y: "Buổi gặp đối tác bàn giá dịch vụ tuần này nên chọn giờ nào và giữ nhịp ra sao?" },
    ky_ket_hop_dong: { ten: "Ký hợp đồng", goi_y: "Sắp ký hợp đồng thuê mặt bằng cần rà điểm gì về giấy tờ và chọn khung giờ nào?" },
    thu_hoi_cong_no: { ten: "Đòi công nợ", goi_y: "Nhắc đối tác thanh toán khoản công nợ đến hạn lúc nào dễ có phản hồi thực chất?" },
    ra_mat_khai_truong: { ten: "Ra mắt, mở hàng", goi_y: "Đợt mở bán sản phẩm mới này sức cầu thực tế và khung giờ mở hàng thế nào?" },
    hoa_giai_bat_dong: { ten: "Ngồi lại hoà giải", goi_y: "Ngồi lại tháo gỡ hiểu lầm với cộng sự nên chọn khung giờ êm nào?" },
    cho_tin_ket_qua: { ten: "Chờ hồi âm, phê duyệt", goi_y: "Hồ sơ báo giá đã nộp bao giờ thuận nhịp hỏi thăm kết quả?" },
  } satisfies Record<MaTinhHuongSuVu, { ten: string; goi_y: string }>,
  tab: "Việc sắp làm trong vài ngày",
  nho: "Việc gấp trong vài ngày tới · hai cách xem đọc riêng",
  tieu_de: "Nên làm lúc nào, chuẩn bị gì?",
  mo_ta: "Chọn loại việc sắp diễn ra. Cách thứ nhất xem khung giờ và hướng thuận trong ngày; cách thứ hai gieo một quẻ để xem việc đang thuận hay cần chủ động, và ngày nào có thể có tin. Hai cách đọc riêng, không gộp điểm.",
  chon_aria: "Chọn loại việc",
  o_cau: "Việc cụ thể bạn đang chuẩn bị (3–500 ký tự)",
  o_ngay: "Ngày định làm (để trống = hôm nay)",
  tu_gieo: "Tôi đã tự gieo 3 đồng xu ở ngoài và muốn nhập 6 lần gieo",
  hao: "Lần gieo {n}",
  hao_tu_duoi: "Nhập từ lần gieo đầu (vạch dưới cùng) lên lần thứ sáu.",
  hao_7: "Một vạch liền (2 sấp 1 ngửa)",
  hao_8: "Một vạch đứt (2 ngửa 1 sấp)",
  hao_9: "Vạch liền, đang đổi (3 ngửa)",
  hao_6: "Vạch đứt, đang đổi (3 sấp)",
  nut: "Xem giờ và gieo quẻ",
  dang: "Đang xem…",
  loi: "Chưa xem được lúc này, bạn thử lại sau giây lát.",
  loi_mang: "Mất kết nối tạm thời — thử lại sau ít phút.",
  an_toan: "Lưu ý an toàn ưu tiên trước",
  ngay_xem: "Ngày xem: {ngay}",
  gio: "Giờ {chi} ({khung})",
  huong: "Hướng {phuong}",
  vi_sao_gio: "Giờ {chi}: cửa {cua}, hướng {phuong}.",
  mo_ky_mon: "Mở bàn giờ và hướng đầy đủ",
  que: "Quẻ {ten}",
  que_bien: " → đổi sang {ten}",
  que_tinh: " (không vạch nào đổi)",
  dung_than: "Phần quẻ nói về việc này: {x}",
  ung_ky: "Ngày có thể có tin",
  ung_ky_dong: "Ngày {chi} gần nhất ({ngay}, khoảng {n} ngày nữa)",
  mo_kinh_dich: "Mở trang Kinh Dịch đầy đủ",
  chuan_bi: "Việc chuẩn bị thực tế trước khi làm",
};

export function dienChu(s: string, bien: Record<string, string | number>): string {
  return s.replace(/\{(\w+)\}/g, (_, k: string) => String(bien[k] ?? ""));
}
