// Bảng HIỂN THỊ cho lá số Tử vi (VZ-2) — chỉ dùng để xếp chỗ và tô màu, KHÔNG an sao/không tính.
// Mọi vị trí sao, độ sáng, tứ hoá, vòng sao đều đến từ engine (/api/tuvi/la-so, /api/tuvi/van-han).

export type Hanh = "Kim" | "Mộc" | "Thủy" | "Hỏa" | "Thổ";

// Ngũ hành chính của sao (theo bảng phổ thông trong sách Tử vi Việt) — để tô màu chữ.
export const HANH_SAO: Record<string, Hanh> = {
  "Tử Vi": "Thổ", "Thiên Cơ": "Mộc", "Thái Dương": "Hỏa", "Vũ Khúc": "Kim", "Thiên Đồng": "Thủy",
  "Liêm Trinh": "Hỏa", "Thiên Phủ": "Thổ", "Thái Âm": "Thủy", "Tham Lang": "Thủy", "Cự Môn": "Thủy",
  "Thiên Tướng": "Thủy", "Thiên Lương": "Mộc", "Thất Sát": "Kim", "Phá Quân": "Thủy",
  "Tả Phù": "Thổ", "Hữu Bật": "Thủy", "Văn Xương": "Kim", "Văn Khúc": "Thủy", "Thiên Khôi": "Hỏa",
  "Thiên Việt": "Hỏa", "Lộc Tồn": "Thổ", "Thiên Mã": "Hỏa", "Kình Dương": "Kim", "Đà La": "Kim",
  "Hỏa Tinh": "Hỏa", "Linh Tinh": "Hỏa", "Địa Không": "Hỏa", "Địa Kiếp": "Hỏa",
};

// Viết tắt độ sáng như lá số giấy: (M) (V) (Đ) (L) (B) (H).
export const DO_SANG_TAT: Record<string, string> = {
  "Miếu": "M", "Vượng": "V", "Đắc": "Đ", "Lợi": "L", "Bình": "B", "Bất": "B", "Hạn": "H", "Hãm": "H",
};
export const DO_SANG_DAY: Record<string, string> = {
  "Miếu": "Miếu địa", "Vượng": "Vượng địa", "Đắc": "Đắc địa", "Lợi": "Lợi địa", "Bình": "Bình hoà",
  "Bất": "Bất đắc", "Hạn": "Hãm địa", "Hãm": "Hãm địa",
};

export const TU_HOA = ["Lộc", "Quyền", "Khoa", "Kỵ"] as const;

// Nhóm để tô màu phụ tinh / tạp diệu / vòng sao. Không phải luận cát hung — chỉ là nhóm quen dùng.
const TOT = new Set([
  "Long Trì", "Phụng Các", "Phượng Các", "Tam Thai", "Bát Tọa", "Ân Quang", "Thiên Quý", "Thiên Quan",
  "Thiên Phúc", "Thiên Đức", "Nguyệt Đức", "Phúc Đức", "Long Đức", "Giải Thần", "Thiên Giải", "Địa Giải",
  "Niên Giải", "Thiên Tài", "Thiên Thọ", "Đài Phụ", "Thai Phụ", "Phong Cáo", "Thiên Trù", "Hoa Cái",
  "Thanh Long", "Hỷ Thần", "Bác Sỹ", "Tấu Thư", "Tướng Quân", "Thiên Y", "Thiên Vu",
]);
const XAU = new Set([
  "Thiên Hình", "Thiên Khốc", "Thiên Hư", "Cô Thần", "Quả Tú", "Phá Toái", "Kiếp Sát", "Thiên Thương",
  "Thiên Sứ", "Âm Sát", "Thiên Không", "Thiên La", "Địa Võng", "Đại Hao", "Tiểu Hao", "Phi Liêm",
  "Bệnh Phù", "Phục Binh", "Quan Phủ", "Quan Phù", "Tang Môn", "Bạch Hổ", "Điếu Khách", "Tuế Phá",
  "Trực Phù", "Hối Khí", "Quán Sách", "Lực Sỹ", "Thiên Nguyệt", "Lưu Hà", "Không Vong", "Tai Sát",
  "Thiên Sát", "Nguyệt Sát", "Vong Thần",
]);
const DAO_HOA = new Set(["Hồng Loan", "Thiên Hỷ", "Đào Hoa", "Thiên Diêu", "Hàm Trì"]);

export type NhomSao = "cat" | "sat" | "dao_hoa" | "trung";

export function nhomSao(ten: string, loai?: string | null): NhomSao {
  if (loai === "tough") return "sat";
  if (loai === "flower" || DAO_HOA.has(ten)) return "dao_hoa";
  if (loai === "soft" || loai === "lucun" || loai === "tianma") return "cat";
  if (TOT.has(ten)) return "cat";
  if (XAU.has(ten)) return "sat";
  return "trung";
}

// iztro (trường phái Trung) có Tuần Không / Triệt Lộ đặt một cung — lá số Việt dùng Tuần/Triệt đóng
// giữa hai cung (khoá `tuan_triet` của engine) nên ẩn hai sao này để khỏi trùng.
export const AN_TAP_DIEU = new Set(["Tuần Không", "Triệt Lộ"]);

// Vị trí 12 chi trên lưới 4×4 truyền thống (hàng, cột — đếm từ 0).
export const VI_TRI: Record<string, [number, number]> = {
  "Tỵ": [0, 0], "Ngọ": [0, 1], "Mùi": [0, 2], "Thân": [0, 3],
  "Thìn": [1, 0], "Dậu": [1, 3],
  "Mão": [2, 0], "Tuất": [2, 3],
  "Dần": [3, 0], "Sửu": [3, 1], "Tý": [3, 2], "Hợi": [3, 3],
};

// Điểm neo trên mép trong của mỗi cung (đơn vị ô) — đường tam phương tứ chính vẽ giữa các điểm này.
export const NEO: Record<string, [number, number]> = {
  "Tỵ": [1, 1], "Ngọ": [1.5, 1], "Mùi": [2.5, 1], "Thân": [3, 1],
  "Dậu": [3, 1.5], "Tuất": [3, 2.5], "Hợi": [3, 3], "Tý": [2.5, 3],
  "Sửu": [1.5, 3], "Dần": [1, 3], "Mão": [1, 2.5], "Thìn": [1, 1.5],
};

export const CHI = ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"];

// Tam phương tứ chính là quan hệ HÌNH HỌC cố định của 12 chi (cách 4, 8 và đối 6) — không phụ thuộc người xem.
export function tamPhuong(chi: string): { tam_hop: string[]; xung: string } {
  const i = CHI.indexOf(chi);
  return { tam_hop: [CHI[(i + 4) % 12]!, CHI[(i + 8) % 12]!], xung: CHI[(i + 6) % 12]! };
}

// Tách "Đinh Sửu - Quý Mão - Canh Thân - Bính Tý" của iztro thành 4 trụ.
export function tachTuTru(s: string): string[] {
  return s.split(/\s*-\s*/).filter(Boolean);
}
