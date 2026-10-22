// ND-7 — bảng chữ các trang tĩnh còn chữ cứng ngoài H1/lời dẫn: /kham-pha, /kien-thuc. Sửa ở CMS → Trang website → URL
// → tab "Chữ trên trang". Tên/mô tả các thẻ chủ đề ở /kien-thuc lấy theo H1/lời dẫn của chính trang chủ đề (sửa ở đó).
import type { BangChu } from "@/lib/chu-trang";

const THE = "Thẻ năm hệ thống";
const MANG: [string, string, string, string][] = [
  ["than_so", "Thần số học", "Bốn con số cốt lõi, dải đời, năm cá nhân, biểu đồ ngày sinh.", "Tên + ngày sinh"],
  ["tu_vi", "Tử vi", "Lá số 12 cung, đại hạn – lưu niên – tiểu hạn.", "+ giờ sinh, giới tính"],
  ["bat_tu", "Bát tự", "Tứ trụ theo tiết khí, ngũ hành, dụng thần hai cách, đại vận.", "+ giờ sinh, giới tính"],
  ["phong_thuy", "Phong thuỷ", "Mệnh quái, tám hướng du niên, cửa – chủ – bếp, sao năm.", "+ giới tính"],
  ["kinh_dich", "Kinh Dịch", "Một quẻ cho một việc — Nghĩa Lý, Lục Hào, Mai Hoa.", "Chỉ cần câu hỏi"],
];

export const CHU_KHAM_PHA = {
  "dau.nhan_tren": { nhom: "Đầu trang", nhan: "Dòng nhỏ trên tiêu đề", mac_dinh: "Khám phá", toi_da: 60 },
  ...Object.fromEntries(MANG.flatMap(([k, ten, mo, can]) => [
    [`the.${k}_ten`, { nhom: THE, nhan: `${ten} — tên`, mac_dinh: ten, toi_da: 40 }],
    [`the.${k}_mo`, { nhom: THE, nhan: `${ten} — mô tả`, mac_dinh: mo, toi_da: 120 }],
    [`the.${k}_can`, { nhom: THE, nhan: `${ten} — nhãn "cần gì"`, mac_dinh: can, toi_da: 40 }],
  ])),
  "the.nut": { nhom: THE, nhan: "Chữ nút trên mỗi thẻ", mac_dinh: "Mở", toi_da: 20 },
  "thu_vien.dam": { nhom: "Thẻ thư viện", nhan: "Phần in đậm", mac_dinh: "Thư viện kiến thức", toi_da: 60 },
  "thu_vien.chu": { nhom: "Thẻ thư viện", nhan: "Phần còn lại", mac_dinh: "— ý nghĩa 12 con số, 64 quẻ, 14 chính tinh", toi_da: 120 },
} as const satisfies BangChu;
export const KHOA_MANG_KHAM_PHA = MANG.map(([k]) => k);

export const CHU_KIEN_THUC = {
  "dau.nhan_tren": { nhom: "Đầu trang", nhan: "Dòng nhỏ trên tiêu đề", mac_dinh: "Kiến thức", toi_da: 60 },
  "mang.mo_cong_cu": { nhom: "Mục theo mảng", nhan: "Link mở công cụ cạnh tên mảng", mac_dinh: "Mở công cụ →", toi_da: 30 },
  "the.so_bai": { nhom: "Mục theo mảng", nhan: "Chữ số bài trên thẻ ({n} = số bài)", mac_dinh: "{n} bài", toi_da: 20 },
  "the.xem": { nhom: "Mục theo mảng", nhan: "Chữ trên thẻ không đếm bài", mac_dinh: "Xem", toi_da: 20 },
} as const satisfies BangChu;
