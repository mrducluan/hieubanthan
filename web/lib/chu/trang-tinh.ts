// ND-7 — bảng chữ các trang tĩnh còn chữ cứng ngoài H1/lời dẫn: /huyen-hoc, /kien-thuc. Sửa ở CMS → Trang website → URL
// → tab "Chữ trên trang". Tên/mô tả các thẻ chủ đề ở /kien-thuc lấy theo H1/lời dẫn của chính trang chủ đề (sửa ở đó).
import type { BangChu, BangHinh } from "@/lib/chu-trang";

const THE = "Thẻ năm hệ thống";
// [khoá, tên, câu hỏi gốc, mô tả đời thường, 3 điều nhận được, cần gì, nút] — câu lấy từ sổ trang của từng công cụ (lib/so-trang.ts).
const MANG: [string, string, string, string, [string, string, string], string, string][] = [
  ["than_so", "Thần số học", "Mình là người thế nào, đang ở nhịp năm nào?",
    "Bốn con số cốt lõi từ họ tên và ngày sinh. Mỗi số kèm 3 điểm mạnh, 3 điểm mù — bạn tự tích xem nó nói trúng mấy điều.",
    ["Cách tính từng bước, tự kiểm lại được", "Hai phái Pythagoras và Chaldea", "Năm, tháng, ngày cá nhân"], "Tên + ngày sinh", "Xem con số của bạn"],
  ["tu_vi", "Tử vi", "Mười hai mặt đời mình, mặt nào thuận, mặt nào cần lưu ý?",
    "Lá số 12 cung an theo âm lịch Việt Nam, tính cả múi giờ cũ trước 1975. Lời thường đọc trước, thuật ngữ để sau.",
    ["Đại hạn, lưu niên, nhịp 3 tháng tới", "Độ sáng sao theo Nam phái", "Xem lá số 2 người"], "+ giờ, giới tính, nơi sinh", "Lập lá số Tử vi"],
  ["bat_tu", "Bát tự", "Mình mạnh hành gì, thiếu hành gì?",
    "Tứ trụ năm – tháng – ngày – giờ lập theo tiết khí. Ngũ hành chấm theo thang điểm công bố; dụng thần luôn trình bày hai cách để bạn tự cân nhắc.",
    ["Đại vận từng 10 năm", "Cách cục theo tháng sinh", "So với những năm đã qua"], "+ giờ, giới tính, nơi sinh", "Lập tứ trụ"],
  ["phong_thuy", "Phong thuỷ", "Nhà này có hợp mình không?",
    "Đo hướng cửa bằng điện thoại: bạn hợp phía nào, từng phòng nên đặt gì, tháng nào nên sửa. Không bán vật phẩm hoá giải.",
    ["La bàn ngay trên điện thoại", "Nhà phố và chung cư", "Việc làm từ 0 đồng"], "Năm sinh + giới tính", "Xem nhà của bạn"],
  ["kinh_dich", "Kinh Dịch", "Đang phân vân một việc?",
    "Gieo một quẻ cho đúng một câu hỏi: việc đang thuận hay cần đổi cách, tuần này nên làm gì. Có nguyên văn Chu Dịch và lời nói nôm na.",
    ["Gieo 3 đồng xu hoặc Mai Hoa", "64 quẻ, 384 hào có nguồn", "Ba cách đọc một quẻ"], "Chỉ cần câu hỏi", "Gieo một quẻ"],
];
const HOI: [string, string][] = [
  ["Mình là người thế nào?", "Thần số học"],
  ["Hai người hoà ở đâu, va ở đâu?", "Hợp đôi"],
  ["Năm nay mình nên để ý mảng nào?", "Tử vi"],
  ["Có nên nhận việc này không?", "Kinh Dịch"],
  ["Nhà này có hợp mình không?", "Phong thuỷ"],
  ["Ngày nào làm việc lớn cho thuận?", "Xem ngày tốt"],
];
const LICH: [string, string][] = [
  ["Hôm nay của bạn", "Ngày cá nhân, âm lịch, một câu tự soi"],
  ["Xem ngày tốt", "Hoàng đạo, giờ tốt, việc nên làm"],
  ["Tuổi làm nhà, cưới hỏi", "Kim lâu, Hoang ốc, Tam tai"],
  ["Tuổi xông đất", "Tuổi hợp gia chủ, giờ đẹp mùng 1"],
  ["Hướng xấu theo năm", "Thái Tuế, Tam Sát, Ngũ Hoàng"],
  ["Tuổi nào hợp hướng nào", "Nam, nữ sinh 1960–2005"],
  ["Lịch âm {nam}", "Tết, tháng nhuận, mùng 1 và rằm"],
  ["Đổi lịch âm dương", "Theo âm lịch Việt Nam"],
];
// Khoá theo mã mảng (the.<khoa>_…) — trang đọc theo mã, không theo vị trí.
const SO_SANH: [string, string, string, string, string][] = [
  ["than_so", "Thần số học", "Họ tên, ngày sinh", "Tính cách, điểm mạnh – điểm mù, nhịp năm – tháng – ngày", "Pythagoras; Chaldea (Cheiro, 1926)"],
  ["tu_vi", "Tử vi", "Ngày giờ sinh âm lịch, giới tính, nơi sinh", "12 mặt đời sống, từng giai đoạn 10 năm, năm nay", "Tử vi Đẩu Số, Nam phái lối Việt"],
  ["bat_tu", "Bát tự", "Ngày giờ sinh theo tiết khí", "Ngũ hành mạnh – yếu, đại vận 10 năm", "Tử Bình Chân Thuyên"],
  ["phong_thuy", "Phong thuỷ", "Năm sinh, giới tính, hướng nhà", "Hướng hợp, đặt phòng, tháng nên sửa", "Bát trạch, Huyền Không phi tinh"],
  ["kinh_dich", "Kinh Dịch", "Một câu hỏi và lúc gieo", "Một việc cụ thể đang phân vân", "Chu Dịch: quái từ, hào từ, Thoán truyện"],
];
const HOI_DAP: [string, string][] = [
  ["Huyền học là gì?", "Là tên gọi chung cho các hệ thống người xưa dùng để đọc nhịp của con người và thời gian: qua con số (thần số học), ngày giờ sinh (Tử vi, Bát tự), quẻ dịch (Kinh Dịch) và nơi ở (Phong thuỷ). Ở đây chúng là nội dung văn hoá để tham khảo và tự soi, không phải lời tiên đoán."],
  ["Huyền học có phải mê tín không?", "Tuỳ cách dùng. Hiểu Bản Thân không dùng huyền học để phán hay doạ: phép tính hiện từng bước, nghĩa có ghi nguồn, mọi lời đọc kèm mặt tối và câu hỏi tự soi. Trang không trả lời chuyện bệnh tật, sống chết, xổ số và không bán vật phẩm hoá giải."],
  ["Nên bắt đầu từ mảng nào?", "Mới làm quen thì bắt đầu từ thần số học: chỉ cần tên và ngày sinh, nửa phút có kết quả. Biết giờ sinh thì đi tiếp Tử vi hoặc Bát tự. Đang phân vân một việc cụ thể thì gieo một quẻ Kinh Dịch; lo chuyện nhà cửa thì xem Phong thuỷ."],
  ["Thần số học có thuộc huyền học không?", "Thần số học có gốc phương Tây (Pythagoras, Chaldea); Tử vi, Bát tự, Kinh Dịch, Phong thuỷ là huyền học phương Đông. Ở Việt Nam người ta hay gọi chung là huyền học. Trang để thần số làm cửa vào vì cần nhập ít nhất."],
  ["Thông tin của tôi có bị lưu không?", "Hồ sơ lưu trên máy bạn và dùng chung cho mọi mảng. Máy chủ tính xong là bỏ, không gửi ngày giờ sinh cho bên thứ ba. Chỉ khi bạn bấm lưu vào tài khoản thì hồ sơ mới nằm trên máy chủ, và bạn xoá được bất cứ lúc nào."],
  ["Có mất phí không?", "Mọi phép tính, lá số và thư viện kiến thức đều miễn phí. Riêng bản luận giải đầy đủ nhiều chương và câu hỏi vượt lượt mỗi ngày có thể dùng Sao (điểm dùng trong trang) khi tính năng này bật — trang luôn hỏi trước khi trừ."],
];

// Bảng chữ trang hub /huyen-hoc (trước 2026-10-27 là /kham-pha — khoá cũ giữ nguyên tên để chữ đã sửa ở CMS không mất).
export const CHU_HUYEN_HOC = {
  "dau.nhan_tren": { nhom: "Đầu trang", nhan: "Dòng nhỏ trên tiêu đề", mac_dinh: "Huyền học phương Đông · thần số học", toi_da: 60 },
  ...Object.fromEntries((["Miễn phí mọi phép tính", "Một hồ sơ cho cả năm mảng", "Có nguồn sách, có mặt tối"]).map((m, i) =>
    [`dau.chip_${i + 1}`, { nhom: "Đầu trang", nhan: `Chip ${i + 1} dưới lời dẫn`, mac_dinh: m, toi_da: 40 }])),
  "dau.nut_chinh": { nhom: "Đầu trang", nhan: "Nút chính (mở /than-so)", mac_dinh: "Bắt đầu với con số của bạn", toi_da: 40 },
  "dau.nut_phu": { nhom: "Đầu trang", nhan: "Nút phụ (cuộn tới mục chọn theo câu hỏi)", mac_dinh: "Chưa biết chọn mảng nào?", toi_da: 40 },
  "ho_so.chao": { nhom: "Đầu trang", nhan: "Dòng hồ sơ ({ten} = tên gọi, {n} = số mảng xem ngay được)", mac_dinh: "Hồ sơ của {ten} xem ngay được {n}/5 mảng", toi_da: 80 },
  "ho_so.thieu": { nhom: "Đầu trang", nhan: "Dòng nhắc khi thiếu giờ sinh / giới tính / nơi sinh", mac_dinh: "Thêm giờ sinh, giới tính, nơi sinh để mở Tử vi và Bát tự", toi_da: 100 },
  "ho_so.san_sang": { nhom: THE, nhan: "Chip khi hồ sơ đã đủ cho mảng", mac_dinh: "Sẵn sàng", toi_da: 30 },
  "ho_so.can_them": { nhom: THE, nhan: "Chip khi hồ sơ còn thiếu cho mảng", mac_dinh: "Cần thêm thông tin", toi_da: 30 },

  "hoi.nho": { nhom: "Chọn theo câu hỏi", nhan: "Dòng nhỏ trên tiêu đề mục", mac_dinh: "Bắt đầu từ điều bạn đang nghĩ", toi_da: 60 },
  "hoi.lon": { nhom: "Chọn theo câu hỏi", nhan: "Tiêu đề mục", mac_dinh: "Bạn đang băn khoăn điều gì?", toi_da: 80 },
  ...Object.fromEntries(HOI.flatMap(([cau, den], i) => [
    [`hoi.cau_${i + 1}`, { nhom: "Chọn theo câu hỏi", nhan: `Câu ${i + 1}`, mac_dinh: cau, toi_da: 60 }],
    [`hoi.den_${i + 1}`, { nhom: "Chọn theo câu hỏi", nhan: `Câu ${i + 1} — tên công cụ`, mac_dinh: den, toi_da: 30 }],
  ])),

  "mang.nho": { nhom: THE, nhan: "Dòng nhỏ trên tiêu đề mục", mac_dinh: "Năm hệ thống, một hồ sơ", toi_da: 60 },
  "mang.lon": { nhom: THE, nhan: "Tiêu đề mục", mac_dinh: "Mỗi mảng trả lời một kiểu câu hỏi", toi_da: 80 },
  ...Object.fromEntries(MANG.flatMap(([k, ten, hoi, mo, nhan, can, nut]) => [
    [`the.${k}_ten`, { nhom: THE, nhan: `${ten} — tên`, mac_dinh: ten, toi_da: 40 }],
    [`the.${k}_hoi`, { nhom: THE, nhan: `${ten} — câu hỏi gốc`, mac_dinh: hoi, toi_da: 80 }],
    [`the.${k}_mo`, { nhom: THE, nhan: `${ten} — mô tả`, mac_dinh: mo, toi_da: 200 }],
    ...nhan.map((x, i) => [`the.${k}_nhan_${i + 1}`, { nhom: THE, nhan: `${ten} — điều nhận được ${i + 1}`, mac_dinh: x, toi_da: 50 }]),
    [`the.${k}_can`, { nhom: THE, nhan: `${ten} — nhãn "cần gì"`, mac_dinh: can, toi_da: 40 }],
    [`the.${k}_nut`, { nhom: THE, nhan: `${ten} — chữ nút`, mac_dinh: nut, toi_da: 30 }],
  ])),
  "the.kien_thuc": { nhom: THE, nhan: "Nhãn dòng link kiến thức trong thẻ", mac_dinh: "Tra cứu", toi_da: 30 },

  "lich.nho": { nhom: "Lịch & tuổi", nhan: "Dòng nhỏ trên tiêu đề mục", mac_dinh: "Theo lịch và tuổi dân gian", toi_da: 60 },
  "lich.lon": { nhom: "Lịch & tuổi", nhan: "Tiêu đề mục", mac_dinh: "Chọn ngày, xem tuổi, tra lịch", toi_da: 80 },
  ...Object.fromEntries(LICH.flatMap(([ten, mo], i) => [
    [`lich.ten_${i + 1}`, { nhom: "Lịch & tuổi", nhan: `Ô ${i + 1} — tên` + (i === 6 ? " ({nam} = năm hiện tại)" : ""), mac_dinh: ten, toi_da: 40 }],
    [`lich.mo_${i + 1}`, { nhom: "Lịch & tuổi", nhan: `Ô ${i + 1} — mô tả`, mac_dinh: mo, toi_da: 60 }],
  ])),

  "so_sanh.nho": { nhom: "Bảng so sánh", nhan: "Dòng nhỏ trên tiêu đề mục", mac_dinh: "Khác nhau thế nào", toi_da: 60 },
  "so_sanh.lon": { nhom: "Bảng so sánh", nhan: "Tiêu đề mục", mac_dinh: "Năm hệ thống, năm kiểu câu hỏi", toi_da: 80 },
  "so_sanh.cot_1": { nhom: "Bảng so sánh", nhan: "Tên cột 1", mac_dinh: "Hệ thống", toi_da: 30 },
  "so_sanh.cot_2": { nhom: "Bảng so sánh", nhan: "Tên cột 2", mac_dinh: "Dựa vào", toi_da: 30 },
  "so_sanh.cot_3": { nhom: "Bảng so sánh", nhan: "Tên cột 3", mac_dinh: "Trả lời tốt nhất", toi_da: 30 },
  "so_sanh.cot_4": { nhom: "Bảng so sánh", nhan: "Tên cột 4", mac_dinh: "Gốc sách, trường phái", toi_da: 30 },
  ...Object.fromEntries(SO_SANH.flatMap(([k, ten, dua, tra, goc]) => [
    [`so_sanh.dua_${k}`, { nhom: "Bảng so sánh", nhan: `${ten} — dựa vào`, mac_dinh: dua, toi_da: 80 }],
    [`so_sanh.tra_${k}`, { nhom: "Bảng so sánh", nhan: `${ten} — trả lời tốt nhất`, mac_dinh: tra, toi_da: 100 }],
    [`so_sanh.goc_${k}`, { nhom: "Bảng so sánh", nhan: `${ten} — gốc sách (không ghi tên thư viện, phần mềm)`, mac_dinh: goc, toi_da: 80 }],
  ])),
  "so_sanh.ket": { nhom: "Bảng so sánh", nhan: "Câu dưới bảng", toi_da: 200,
    mac_dinh: "Không mảng nào phán bệnh tật, sống chết hay xổ số — đó là những câu trang luôn từ chối." },

  "cach.nho": { nhom: "Cách làm", nhan: "Dòng nhỏ trên tiêu đề mục", mac_dinh: "Cách Hiểu Bản Thân làm huyền học", toi_da: 60 },
  "cach.lon": { nhom: "Cách làm", nhan: "Tiêu đề mục", mac_dinh: "Ba lớp, tách bạch", toi_da: 80 },
  ...Object.fromEntries(([
    ["Cách tính mở", "Mỗi con số, mỗi lá số hiện từng bước tính. Bạn tự kiểm lại được, không phải tin suông."],
    ["Diễn giải có nguồn", "Ý nghĩa lấy từ kho tri thức ghi rõ sách và trường phái. Chỗ các phái khác nhau thì nói ra, để bạn chọn."],
    ["Câu hỏi để tự soi", "Mỗi lời đọc kèm mặt tối và một câu hỏi cho chính bạn. Không phán, không doạ, không bán vật phẩm."],
  ] as const).flatMap(([ten, mo], i) => [
    [`cach.ten_${i + 1}`, { nhom: "Cách làm", nhan: `Lớp ${i + 1} — tên`, mac_dinh: ten, toi_da: 40 }],
    [`cach.mo_${i + 1}`, { nhom: "Cách làm", nhan: `Lớp ${i + 1} — mô tả`, mac_dinh: mo, toi_da: 160 }],
  ])),

  "hoi_dap.lon": { nhom: "Hỏi đáp", nhan: "Tiêu đề mục", mac_dinh: "Câu hỏi thường gặp về huyền học", toi_da: 80 },
  ...Object.fromEntries(HOI_DAP.flatMap(([h, d], i) => [
    [`hoi_dap.hoi_${i + 1}`, { nhom: "Hỏi đáp", nhan: `Câu ${i + 1} — hỏi`, mac_dinh: h, toi_da: 80 }],
    [`hoi_dap.dap_${i + 1}`, { nhom: "Hỏi đáp", nhan: `Câu ${i + 1} — đáp`, mac_dinh: d, toi_da: 300 }],
  ])),

  "thu_vien.dam": { nhom: "Thẻ thư viện", nhan: "Phần in đậm", mac_dinh: "Thư viện kiến thức", toi_da: 60 },
  "thu_vien.chu": { nhom: "Thẻ thư viện", nhan: "Phần còn lại ({n} = số trang tra cứu)", mac_dinh: "— {n} trang tra cứu: ý nghĩa con số, 64 quẻ, sao ở từng cung, mệnh theo năm sinh", toi_da: 120 },
  "thu_vien.tu_dien": { nhom: "Thẻ thư viện", nhan: "Link từ điển", mac_dinh: "Từ điển thuật ngữ", toi_da: 40 },
  "thu_vien.la_so_mau": { nhom: "Thẻ thư viện", nhan: "Link lá số mẫu", mac_dinh: "Lá số mẫu đọc từng bước", toi_da: 40 },
} as const satisfies BangChu;
export const KHOA_MANG_HUYEN_HOC = MANG.map(([k]) => k);
export const SO_HOI_HUYEN_HOC = HOI.length;
export const SO_LICH_HUYEN_HOC = LICH.length;
export const SO_HOI_DAP_HUYEN_HOC = HOI_DAP.length;

/** ND-7 đợt 2 — biểu tượng năm thẻ ở /huyen-hoc thay được bằng ảnh thư viện CMS. */
export const HINH_HUYEN_HOC: BangHinh = Object.fromEntries(MANG.map(([k, ten]) => [`the.${k}`, { nhom: THE, nhan: `Biểu tượng thẻ ${ten}`,
  goi_y: "Vuông hoặc ngang 2:1, ≥ 256 px, nền trong suốt", mac_dinh: `Biểu tượng ${ten} vẽ bằng code` }]));

export const CHU_KIEN_THUC = {
  "dau.nhan_tren": { nhom: "Đầu trang", nhan: "Dòng nhỏ trên tiêu đề", mac_dinh: "Kiến thức", toi_da: 60 },
  "mang.mo_cong_cu": { nhom: "Mục theo mảng", nhan: "Link mở công cụ cạnh tên mảng", mac_dinh: "Mở công cụ →", toi_da: 30 },
  "the.so_bai": { nhom: "Mục theo mảng", nhan: "Chữ số bài trên thẻ ({n} = số bài)", mac_dinh: "{n} bài", toi_da: 20 },
  "the.xem": { nhom: "Mục theo mảng", nhan: "Chữ trên thẻ không đếm bài", mac_dinh: "Xem", toi_da: 20 },
} as const satisfies BangChu;
