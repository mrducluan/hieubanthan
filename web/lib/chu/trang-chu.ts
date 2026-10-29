// ND-7 — bảng chữ trang chủ (`/`). Sửa chữ mặc định ở đây = đổi chữ trên web; người biên tập đổi ở CMS → Trang website
// → "/" → tab "Chữ trên trang". `*…*` = đoạn nhấn. Mỗi dòng phía Hiểu Bản Thân của bảng so sánh phải đúng với hệ thống
// đang chạy (TC-HOOK) — kiểm định CMS không biết điều này, người duyệt phải đọc.
import type { BangChu, BangHinh } from "@/lib/chu-trang";

const CO = "Cỡ chữ đầu trang";
const CO_CHON = [
  { gia_tri: "nho", nhan: "Nhỏ" }, { gia_tri: "thuong", nhan: "Vừa" },
  { gia_tri: "lon", nhan: "Lớn" }, { gia_tri: "rat_lon", nhan: "Rất lớn" },
] as const;
const D = "Đầu trang", DM = "Dòng điểm mù chạy", SS = "Vì sao xem ở đây", B = "Bảng so sánh", M = "Bốn mảng huyền học", R = "Ô riêng tư";

const DIEM_MU: [number, string][] = [
  [2, "Nói “có” khi trong lòng muốn nói “không”."],
  [7, "Nghĩ rất nhiều, chia sẻ rất ít."],
  [9, "Miệng nói đã buông, lòng thì chưa."],
  [1, "Ôm hết việc vì ngại nhờ người khác."],
  [6, "Lo thay, quyết thay cho người mình thương."],
  [3, "Bắt đầu thì nhiều, làm xong thì ít."],
  [8, "Đo giá trị bản thân bằng thành tích."],
  [5, "Hễ chán là muốn đổi."],
  [4, "Nghĩ nghỉ ngơi là lười."],
];

const HANG: [string, string, string][] = [
  ["Con số của bạn", "Tính bằng công thức cố định. Cùng một ngày sinh, lần nào cũng ra một số.",
    "Tự cộng trong lúc viết câu trả lời. Có lúc sai, hỏi lại có khi ra số khác."],
  ["Cách tính", "Hiện từng bước cộng để bạn tự kiểm lại.", "Thường chỉ đưa kết quả, ít khi nói dùng cách nào."],
  ["Ý nghĩa lấy từ đâu", "Kho tri thức biên soạn theo sách và trường phái, mục nào cũng ghi nguồn, có chủ biên duyệt.",
    "Gom từ khắp nơi trên mạng, không rõ nguồn. Đôi khi bịa chi tiết nghe rất thật."],
  ["Âm lịch, giờ sinh", "Âm lịch Việt Nam, tính cả múi giờ cũ trước 1975 và ranh giới giờ Tý.",
    "Đổi lịch theo ước đoán, dễ lệch tháng âm hay giờ sinh."],
  ["Trường phái", "Ghi rõ đang theo phái nào, cho bạn đổi phái để so.", "Trộn nhiều phái trong một câu trả lời mà không báo."],
  ["Cách nói", "Nói cả điểm mạnh lẫn điểm mù. Không doạ, không bán vật phẩm giải hạn.", "Dễ chiều theo cách bạn hỏi, nói điều bạn muốn nghe."],
  ["Đúng tới đâu", "Bạn tự tích nét nào đúng, nét nào chưa. Có bài còn hiện bao nhiêu phần trăm người đọc thấy đúng.",
    "Không có cách nào biết nó nói trúng tới đâu."],
  ["Ngày sinh của bạn", "Hồ sơ lưu trên máy bạn. Phần diễn đạt tự động không nhận họ tên hay ngày sinh.",
    "Nằm trong lịch sử trò chuyện trên máy chủ của bên thứ ba."],
];

const MANG: [string, string, string][] = [
  ["tu_vi", "Tử vi", "Lá số 12 cung, đại hạn, lưu niên"],
  ["kinh_dich", "Kinh Dịch", "Gieo một quẻ cho một việc đang cân nhắc"],
  ["bat_tu", "Bát tự", "Tứ trụ, ngũ hành, đại vận"],
  ["phong_thuy", "Phong thuỷ", "Mệnh quái, hướng nhà hợp tuổi"],
];

export const SO_DIEM_MU = DIEM_MU.length;
export const SO_HANG_SO_SANH = HANG.length;
export const KHOA_MANG = MANG.map(([k]) => k);

export const CHU_TRANG_CHU = {
  // TC-HOOK2 (2026-10-29): 3 người đọc thử chọn phương án "Năm nay của bạn" — lời ngắn, nói rõ nhận gì + năm nay.
  "dau.nhan_tren": { nhom: D, nhan: "Dòng nhỏ trên tiêu đề", mac_dinh: "Thần số học · Miễn phí", toi_da: 60 },
  // Hai chip đặt dưới hình vòng số (cân hai cột trên máy tính).
  "dau.chip_1": { nhom: D, nhan: "Chip 1 dưới hình (biểu tượng tia sét)", mac_dinh: "Không cần tài khoản", toi_da: 40 },
  "dau.chip_2": { nhom: D, nhan: "Chip 2 dưới hình (biểu tượng danh sách)", mac_dinh: "Đúng hay sai, bạn tự chấm", toi_da: 40 },
  // Cỡ chữ = lựa chọn có sẵn (không px tự do): web đổi bằng lớp Tailwind cố định (lib/kieu-chu.ts CO_TRANG_CHU).
  "co.h1": { nhom: CO, nhan: "Cỡ tiêu đề lớn (\"Bạn là số mấy?\")", mac_dinh: "thuong", lua_chon: CO_CHON },
  "co.diem_mu": { nhom: CO, nhan: "Cỡ dòng điểm mù chạy", mac_dinh: "thuong", lua_chon: CO_CHON },
  "co.chip": { nhom: CO, nhan: "Cỡ hai chip dưới hình", mac_dinh: "thuong", lua_chon: CO_CHON },
  "diem_mu.nhan": { nhom: DM, nhan: "Nhãn đỏ bên trái", mac_dinh: "Có quen không?", toi_da: 20 },
  ...Object.fromEntries(DIEM_MU.map(([so, cau], i) => [`diem_mu.cau_${i + 1}`,
    { nhom: DM, nhan: `Câu ${i + 1} (mỗi câu hiện 3 giây; *Số n* = phần vàng)`, mac_dinh: `*Số ${so}* ${cau}`, toi_da: 80 }])),

  "so_sanh.nho": { nhom: SS, nhan: "Dòng nhỏ trên tiêu đề mục", mac_dinh: "Vì sao xem ở đây", toi_da: 60 },
  "so_sanh.lon": { nhom: SS, nhan: "Tiêu đề mục", mac_dinh: "Chatbot trả lời rất trôi. Nhưng con số có đúng không?", toi_da: 120 },
  "so_sanh.mo_ta": { nhom: SS, nhan: "Mô tả dưới tiêu đề", toi_da: 300,
    mac_dinh: "Hỏi chatbot AI về thần số hay lá số, câu trả lời lúc nào cũng nghe hay. Cái khó là biết câu nào đúng, câu nào tự bịa." },
  "so_sanh.vi_du_tieu_de": { nhom: SS, nhan: "Thẻ ví dụ — dòng đầu", mac_dinh: "Thử với ngày sinh 24/10/1988", toi_da: 80 },
  "so_sanh.vi_du_cach_1": { nhom: SS, nhan: "Thẻ ví dụ — tên cách 1", mac_dinh: "Cách 1 · cộng hết các chữ số", toi_da: 60 },
  "so_sanh.vi_du_cach_2": { nhom: SS, nhan: "Thẻ ví dụ — tên cách 2", mac_dinh: "Cách 2 · rút gọn ngày, tháng, năm trước", toi_da: 60 },
  "so_sanh.vi_du_ket": { nhom: SS, nhan: "Thẻ ví dụ — câu kết (*…* = in đậm)", toi_da: 300,
    mac_dinh: "Hai cách đều đang được dùng, ra hai con số khác hẳn. Chatbot thường không nói nó chọn cách nào — hỏi lại có khi ra số khác. *Ở đây bạn thấy từng bước và tự chọn cách tính.*" },
  "so_sanh.cot_tieu_chi": { nhom: B, nhan: "Tiêu đề cột 1", mac_dinh: "Tiêu chí", toi_da: 30 },
  "so_sanh.huy_hieu": { nhom: B, nhan: "Huy hiệu cột Hiểu Bản Thân", mac_dinh: "Nên chọn", toi_da: 20 },
  "so_sanh.cot_hbt": { nhom: B, nhan: "Tên cột Hiểu Bản Thân", mac_dinh: "Hiểu Bản Thân", toi_da: 40 },
  "so_sanh.cot_hbt_phu": { nhom: B, nhan: "Dòng phụ cột Hiểu Bản Thân", mac_dinh: "Bộ tính + kho tri thức có nguồn", toi_da: 60 },
  "so_sanh.cot_ai": { nhom: B, nhan: "Tên cột so sánh (không ghi tên hãng — Luật Quảng cáo)", mac_dinh: "Chatbot AI đa năng", toi_da: 40 },
  "so_sanh.cot_ai_phu": { nhom: B, nhan: "Dòng phụ cột so sánh", mac_dinh: "Hỏi tự do trong khung chat", toi_da: 60 },
  ...Object.fromEntries(HANG.flatMap(([tc, hbt, ai], i) => [
    [`so_sanh.hang_${i + 1}_tieu_chi`, { nhom: B, nhan: `Hàng ${i + 1} — tiêu chí`, mac_dinh: tc, toi_da: 40 }],
    [`so_sanh.hang_${i + 1}_hbt`, { nhom: B, nhan: `Hàng ${i + 1} — Hiểu Bản Thân (phải đúng với hệ thống)`, mac_dinh: hbt, toi_da: 200 }],
    [`so_sanh.hang_${i + 1}_ai`, { nhom: B, nhan: `Hàng ${i + 1} — chatbot`, mac_dinh: ai, toi_da: 200 }],
  ])),
  "so_sanh.ket": { nhom: B, nhan: "Câu dưới bảng", toi_da: 300,
    mac_dinh: "Chatbot AI vẫn rất giỏi nhiều việc khác. Hiểu Bản Thân cũng dùng AI, nhưng chỉ ở bước cuối: viết lại cho dễ đọc. Con số do bộ tính quyết, ý nghĩa do kho tri thức quyết — AI không được thêm điều gì ngoài đó." },
  "so_sanh.nut": { nhom: B, nhan: "Nút dưới bảng (mở /than-so)", mac_dinh: "Xem con số của bạn", toi_da: 40 },

  "mang.nho": { nhom: M, nhan: "Dòng nhỏ trên tiêu đề mục", mac_dinh: "Khám phá sâu hơn", toi_da: 60 },
  "mang.lon": { nhom: M, nhan: "Tiêu đề mục", mac_dinh: "Bốn mảng huyền học, một hồ sơ", toi_da: 120 },
  "mang.mo_ta": { nhom: M, nhan: "Mô tả dưới tiêu đề", toi_da: 300,
    mac_dinh: "Sau thần số, bạn có thể đi tiếp vào các hệ thống phương Đông — dùng luôn hồ sơ đã nhập, chỉ hỏi thêm giờ sinh khi cần." },
  "mang.xem_tat_ca": { nhom: M, nhan: "Link dưới bốn thẻ (mở /huyen-hoc)", mac_dinh: "Xem cả năm mảng và công cụ lịch, tuổi", toi_da: 60 },
  ...Object.fromEntries(MANG.flatMap(([k, ten, mo]) => [
    [`mang.${k}_ten`, { nhom: M, nhan: `Thẻ ${ten} — tên`, mac_dinh: ten, toi_da: 30 }],
    [`mang.${k}_mo`, { nhom: M, nhan: `Thẻ ${ten} — mô tả`, mac_dinh: mo, toi_da: 80 }],
  ])),

  "rieng_tu.dam": { nhom: R, nhan: "Phần in đậm", mac_dinh: "Riêng tư theo mặc định.", toi_da: 60 },
  "rieng_tu.chu": { nhom: R, nhan: "Phần còn lại (phải khớp Chính sách quyền riêng tư)", toi_da: 300,
    mac_dinh: "Tên và ngày sinh lưu trên máy của bạn. Chỉ khi bạn bấm “Lưu vào tài khoản” thì hồ sơ mới được lưu trên máy chủ — và bạn xoá được bất cứ lúc nào." },
} as const satisfies BangChu;

/** ND-7 đợt 2 — hình trang chủ thay được bằng ảnh thư viện CMS (tab "Hình trên trang"). */
export const HINH_TRANG_CHU: BangHinh = {
  "hero.hinh": { nhom: "Đầu trang", nhan: "Hình lớn cạnh tiêu đề", goi_y: "Vuông, ≥ 1000×1000, nền tối hoặc trong suốt",
    mac_dinh: "Bầu trời số 1–9 vẽ bằng code, có chuyển động" },
  ...Object.fromEntries(MANG.map(([k, ten]) => [`mang.${k}`, { nhom: "Bốn mảng huyền học", nhan: `Biểu tượng thẻ ${ten}`,
    goi_y: "Vuông hoặc ngang 2:1, ≥ 256 px, nền trong suốt", mac_dinh: `Biểu tượng ${ten} vẽ bằng code` }])),
};
