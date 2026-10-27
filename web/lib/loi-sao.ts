// Cửa Sao v2 "Ba lối mở" (docs/CUA-SAO-V2.md) — câu chữ + phép tính hiển thị khi người dùng chạm cửa Sao. Hàm THUẦN
// (không Supabase, không React) để e2e gọi thẳng. Mọi con số do nơi gọi đưa vào từ cài đặt / phản hồi máy chủ; số thật
// (trừ, thưởng) vẫn do hàm SQL quyết. Giọng: giá trị trước, giá sau; nói rõ điều kiện; không doạ, không khan hiếm giả.

/** Số bạn cần mời để đủ `thieu` Sao (mỗi bạn nhận lời mời: +moiBan Sao cho người mời). 0 = không cần; null = không có thưởng mời. */
export function soBanCanMoi(thieu: number, moiBan: number): number | null {
  if (moiBan <= 0) return null;
  return thieu <= 0 ? 0 : Math.ceil(thieu / moiBan);
}

/** Số câu hỏi mua được bằng `sao` Sao (giá mỗi câu `gia`). */
export const soCau = (sao: number, gia: number): number => (gia > 0 ? Math.floor(sao / gia) : 0);

/** Thanh dính cuối báo cáo — dòng gợi ý dưới "Đọc tiếp N chương còn lại". */
export function goiYThanhKhoa(d: {
  sao: number; dangNhap: boolean; soDu?: number | null; thuongChaoMung?: number | null; moiBan: number;
}): string {
  const { sao, dangNhap, moiBan } = d;
  if (dangNhap) {
    const soDu = d.soDu ?? 0;
    if (soDu >= sao) return `Ví có ${soDu} Sao — đủ mở ngay, xem lại cả ngày không trừ thêm.`;
    const k = soBanCanMoi(sao - soDu, moiBan);
    return k
      ? `Ví có ${soDu} Sao. Mời ${k} bạn là đủ (miễn phí), hoặc nạp nhanh bằng QR.`
      : `Ví có ${soDu} Sao — nạp nhanh bằng QR, xong quay lại đúng chỗ này.`;
  }
  const qua = d.thuongChaoMung ?? 0;
  if (!qua) return "Đăng nhập để dùng Sao.";
  if (qua >= sao) return `Đăng nhập nhận ${qua} Sao — đủ mở ngay báo cáo này.`;
  const k = soBanCanMoi(sao - qua, moiBan);
  return k === 1
    ? `Đăng nhập nhận ${qua} Sao, mời 1 bạn thêm ${moiBan} Sao — đủ mở mà không tốn đồng nào.`
    : `Đăng nhập nhận ${qua} Sao · phần còn lại: mời bạn bè hoặc nạp nhanh bằng QR.`;
}

/** Thẻ "Miễn phí — mời bạn" trong hộp thoại: dòng kết quả theo việc người dùng đang làm. "" khi không có thưởng mời. */
export function ketQuaMoi(d: { nguon: "hoi" | "luan_giai" | "nhiem_vu"; gia: number; thieu: number; moiBan: number }): string {
  const k = soBanCanMoi(d.thieu, d.moiBan);
  if (k === null) return "";
  if (d.nguon === "hoi") {
    const n = soCau(d.moiBan, d.gia);
    return n > 0 ? `Mỗi bạn nhận lời mời = ${n} câu hỏi nữa cho bạn.` : `Mỗi bạn nhận lời mời: +${d.moiBan} Sao cho bạn.`;
  }
  if (k === 0) return "Đủ Sao để mở rồi — mời bạn để dành Sao cho lần sau.";
  return k === 1 ? "Mời 1 bạn là đủ mở báo cáo này." : `Mời ${k} bạn là đủ mở báo cáo này.`;
}

/** Điều kiện nhận thưởng mời — luôn nói rõ (không hứa thưởng cho cú bấm chia sẻ). */
export function dieuKienMoi(m: { moiBan: number; duocMoi: number; tran: number }): string {
  const hai = m.moiBan === m.duocMoi ? `cả hai cùng nhận ${m.moiBan} Sao` : `bạn nhận ${m.moiBan} Sao, bạn ấy nhận ${m.duocMoi} Sao`;
  return `Bạn ấy mở link, đăng nhập và lưu hồ sơ là ${hai}. Tối đa ${m.tran} lượt mỗi 30 ngày.`;
}

/** Khách hết lượt hỏi: tài khoản được gì (câu miễn phí mỗi ngày + quà chào mừng quy ra câu). */
export function loiKhachHetLuot(d: { tranTk?: number; tranKhach?: number; thuong?: number | null; gia?: number }): string {
  const cau = d.thuong && d.gia ? soCau(d.thuong, d.gia) : 0;
  const moiNgay = d.tranTk && d.tranKhach !== undefined && d.tranTk > d.tranKhach ? `${d.tranTk} câu miễn phí mỗi ngày` : "câu hỏi miễn phí mỗi ngày";
  return cau > 0 ? `Có tài khoản: ${moiNgay}, cộng ${d.thuong} Sao chào mừng — hỏi thêm được ${cau} câu ngay hôm nay.`
    : `Có tài khoản: ${moiNgay}${d.thuong ? `, cộng ${d.thuong} Sao chào mừng` : ""}.`;
}

/** "Sao vừa về" (ThuongVe): câu báo khi người mời có Sao mới từ lời mời / hoa hồng. Không nói bạn nào — chỉ số Sao. */
export function loiThuongVe(ds: { loai: string; so: number }[]): string {
  const moi = ds.filter((x) => x.loai === "moi_ban"), hh = ds.filter((x) => x.loai === "hoa_hong");
  const tong = (a: { so: number }[]) => a.reduce((t, x) => t + x.so, 0);
  const cau: string[] = [];
  if (moi.length) cau.push(moi.length === 1 ? `+${tong(moi)} Sao — một người bạn vừa nhận lời mời của bạn.`
    : `+${tong(moi)} Sao — ${moi.length} người bạn vừa nhận lời mời của bạn.`);
  if (hh.length) cau.push(`+${tong(hh)} Sao hoa hồng — bạn bè bạn mời vừa nạp Sao.`);
  return cau.join(" ");
}

/** Trang nhận thẻ / lời mời: người nhận được gì nếu lưu hồ sơ vào tài khoản. "" khi không có thưởng nào.
 *  `coMa` = link mang mã giới thiệu (?gt=) → cộng thêm thưởng "được mời". `thu` = đang thu Sao báo cáo (mới nói "đủ mở"). */
export function loiNguoiNhan(d: { chaoMung: number; duocMoi: number; coMa: boolean; gia: number; thu: boolean }): string {
  const moi = d.coMa ? Math.max(0, d.duocMoi) : 0;
  const tong = Math.max(0, d.chaoMung) + moi;
  if (tong <= 0) return "";
  const chiTiet = moi > 0 && d.chaoMung > 0 ? ` (${d.chaoMung} chào mừng + ${moi} lời mời)` : "";
  const dau = moi > 0 ? "Bạn được mời: lưu hồ sơ vào tài khoản là nhận" : "Lưu hồ sơ vào tài khoản: nhận";
  const sau = d.thu && d.gia > 0 && tong >= d.gia ? " — đủ mở một Luận giải toàn bộ." : d.thu && d.gia > 0 ? " — để mở luận giải, hỏi thêm câu." : ".";
  return `${dau} ${tong} Sao${chiTiet}${sau}`;
}
