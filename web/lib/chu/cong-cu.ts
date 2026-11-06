// ND-7 — bảng chữ các trang công cụ. Khung chung (TrangCongCu) đưa bảng của URL + chữ CMS vào DauCms → công cụ (client)
// đọc bằng useChu(); phần máy chủ (khối "Kiến thức …", "Về công cụ …") đọc bằng taoChu. H1 + lời dẫn vẫn ở tab "Đầu trang".
import { gopBang, type BangChu } from "@/lib/chu-trang";

const DAU = "Đầu trang", CUOI = "Cuối trang";

/** Chữ khung dùng chung mọi trang công cụ (phần dưới công cụ). {mang} = tên mảng, {ten} = tên công cụ. */
const KHUNG: BangChu = {
  "kien_thuc.tieu_de": { nhom: CUOI, nhan: "Tiêu đề khối liên kết kiến thức ({mang} = tên mảng)", mac_dinh: "Kiến thức {mang}", toi_da: 80 },
  "gioi_thieu.tieu_de": { nhom: CUOI, nhan: "Tiêu đề phần giới thiệu ({ten} = tên công cụ)", mac_dinh: "Về công cụ {ten}", toi_da: 80 },
  "gioi_thieu.hoi_dap": { nhom: CUOI, nhan: "Tiêu đề phần hỏi đáp", mac_dinh: "Câu hỏi thường gặp", toi_da: 60 },
  "gioi_thieu.doc_them": { nhom: CUOI, nhan: "Chữ trước danh sách đọc thêm", mac_dinh: "Đọc thêm:", toi_da: 30 },
};

/** Bốn mảng huyền học dùng khung DauMang (biểu tượng + dòng nhỏ + nhãn "Diễn giải từ kho tri thức…"). */
// TM-1: dòng nhỏ cạnh biểu tượng nói mảng này làm gì (breadcrumb ngay trên đã ghi "Huyền học" — không lặp lại).
const mangHuyenHoc = (coHoiAi: boolean, nhanTren: string): BangChu => gopBang(KHUNG, {
  "dau.nhan_tren": { nhom: DAU, nhan: "Dòng nhỏ cạnh biểu tượng", mac_dinh: nhanTren, toi_da: 60 },
  "dau.nhan_duoi": { nhom: DAU, nhan: "Nhãn viền dưới lời dẫn", mac_dinh: "Diễn giải từ kho tri thức Hiểu Bản Thân · tham khảo văn hoá", toi_da: 100 },
  ...(coHoiAi ? { "hoi.tieu_de": { nhom: "Hỏi đáp", nhan: "Tiêu đề khung hỏi đáp", mac_dinh: "Hỏi đáp chuyên sâu", toi_da: 60 } } : {}),
});

// Chữ mặc định (CTA-LS) — đặt trước bảng để bảng đọc được.
const MOI_TU_VI: MoiLap = {
  chip: ["Chương đầu đọc ngay", "Không cần tài khoản", "Bạn tự chấm đúng hay chưa"],
  nhan_tren: "Khoảng một phút",
  tieu_de: "Lập lá số để xem *năm nay của bạn*",
  tieu_de_thieu: "Còn {so} thông tin nữa là có lá số: {thieu}",
  cau_phu: "Mỗi canh giờ cho ra một lá số khác. Nơi sinh cho biết giờ địa phương lúc bạn chào đời, nhất là người sinh trước 1975.",
  nut: "Lập lá số của tôi",
  tran_an: "Không nhớ giờ sinh? Chọn “Không biết giờ” ở ô “Giờ sinh này”, lá số vẫn lập được và ghi rõ là giờ tạm.",
  nhan_tieu_de: "Bạn nhận được",
  ghi_chu_nhan: "Lá số và chương đầu bài đọc miễn phí; các chương sau có thể cần Sao.",
  nhan: ["Lá số 12 cung vẽ ngay, chạm từng cung để xem sao", "Mức *Thuận lợi, Cân bằng, Cần lưu ý* cho từng mảng đời", "Năm nào trong 10 năm tới nên chú ý tiền, việc, tình cảm", "Ba tháng tới: tháng nào nên đẩy việc, tháng nào nên chậm"],
  minh_hoa: "Minh hoạ. Lá số thật hiện ngay sau khi bạn nhập.",
  chua_san_sang: "Chưa muốn nhập? Bạn vẫn hỏi được câu kiến thức ở khung hỏi đáp bên dưới, hoặc",
  la_so_mau: "xem 6 lá số mẫu đọc từng bước",
};
const MOI_BAT_TU: MoiLap = {
  chip: ["Hành của bạn hiện ngay", "Hai cách tìm hành nên bù", "Chương đầu đọc ngay"],
  nhan_tren: "Khoảng một phút",
  tieu_de: "Xem năm hành của bạn *dư thiếu ra sao*",
  tieu_de_thieu: "Còn {so} thông tin nữa là có tứ trụ: {thieu}",
  cau_phu: "Giờ sinh cho ra trụ thứ tư của lá số. Nơi sinh để quy về đúng giờ đồng hồ lúc bạn chào đời. Giới tính để tính chiều các giai đoạn 10 năm.",
  nut: "Xem năm hành của tôi",
  tran_an: "Không nhớ giờ sinh? Chọn “Không biết giờ” ở ô “Giờ sinh này”; trang ghi rõ phần nào là tạm. Sinh gần ngày chuyển tiết thì giờ càng quan trọng.",
  nhan_tieu_de: "Bạn nhận được",
  ghi_chu_nhan: "Tứ trụ và chương đầu bài đọc miễn phí; các chương sau có thể cần Sao.",
  nhan: ["Hành của bạn, kèm một hình ảnh dễ nhớ như cây lớn hay ngọn nến", "Hành nào đang *dư*, hành nào đang *hụt*, sức bạn mạnh hay yếu", "Hai cách đọc hành nên bù, nói rõ khi hai cách khác nhau", "Năm nay và từng tháng theo tiết: lúc nào nên đẩy, lúc nào nên chậm"],
  minh_hoa: "Minh hoạ. Tứ trụ thật hiện ngay sau khi bạn nhập.",
  chua_san_sang: "Chưa muốn nhập? Bạn vẫn hỏi được câu kiến thức ở khung hỏi đáp bên dưới.",
};

/** CTA-LS: khối "Mời lập lá số" (form ngay trên trang) + 3 chip lợi ích dưới lời dẫn của Tử vi / Bát tự. */
type MoiLap = { chip: [string, string, string]; nhan_tren: string; tieu_de: string; tieu_de_thieu: string; cau_phu: string; nut: string;
  tran_an: string; nhan_tieu_de: string; ghi_chu_nhan: string; nhan: [string, string, string, string]; minh_hoa: string; chua_san_sang: string; la_so_mau?: string };
const M = "Mời lập lá số";
const moiLap = (m: MoiLap): BangChu => ({
  ...Object.fromEntries(m.chip.map((v, i) => [`dau.chip_${i + 1}`, { nhom: DAU, nhan: `Chip lợi ích ${i + 1} dưới lời dẫn`, mac_dinh: v, toi_da: 40 }])),
  "moi.nhan_tren": { nhom: M, nhan: "Dòng nhỏ trên tiêu đề khối", mac_dinh: m.nhan_tren, toi_da: 60 },
  "moi.tieu_de": { nhom: M, nhan: "Tiêu đề khối (chưa có hồ sơ) — *chữ* để nhấn màu", mac_dinh: m.tieu_de, toi_da: 80 },
  "moi.tieu_de_thieu": { nhom: M, nhan: "Tiêu đề khi hồ sơ còn thiếu ({so} = số mục, {thieu} = các mục thiếu)", mac_dinh: m.tieu_de_thieu, toi_da: 100 },
  "moi.cau_phu": { nhom: M, nhan: "Câu phụ dưới tiêu đề (vì sao cần giờ + nơi sinh)", mac_dinh: m.cau_phu, toi_da: 200 },
  "moi.nut": { nhom: M, nhan: "Nhãn nút gửi (người đã đồng ý dữ liệu)", mac_dinh: m.nut, toi_da: 32 },
  "moi.tran_an": { nhom: M, nhan: "Dòng gợi ý dưới form (không lặp lời riêng tư của form)", mac_dinh: m.tran_an, toi_da: 160 },
  "moi.nhan_tieu_de": { nhom: M, nhan: "Tiêu đề danh sách \"Bạn nhận được\"", mac_dinh: m.nhan_tieu_de, toi_da: 60 },
  "moi.ghi_chu_nhan": { nhom: M, nhan: "Dòng nhỏ dưới danh sách (phần nào miễn phí)", mac_dinh: m.ghi_chu_nhan, toi_da: 140 },
  ...Object.fromEntries(m.nhan.map((v, i) => [`moi.nhan_${i + 1}`, { nhom: M, nhan: `Bạn nhận được — dòng ${i + 1} (*chữ* để nhấn)`, mac_dinh: v, toi_da: 110 }])),
  "moi.minh_hoa": { nhom: M, nhan: "Chú thích dưới hình minh hoạ", mac_dinh: m.minh_hoa, toi_da: 100 },
  "moi.chua_san_sang": { nhom: M, nhan: "Dòng cho người chưa muốn nhập", mac_dinh: m.chua_san_sang, toi_da: 160 },
  ...(m.la_so_mau ? { "moi.la_so_mau": { nhom: M, nhan: "Chữ link lá số mẫu", mac_dinh: m.la_so_mau, toi_da: 60 } } : {}),
});

export const CHU_TU_VI = gopBang(mangHuyenHoc(true, "Tử vi 12 cung · Âm lịch Việt"), moiLap(MOI_TU_VI), {
  // TV-HOA-HAN: dải 12 giai đoạn 10 năm dưới lá số (chạm → năm xem nhảy tới đầu giai đoạn).
  "dai_han.tieu_de": { nhom: "Lá số", nhan: "Tiêu đề dải giai đoạn 10 năm dưới lá số", mac_dinh: "Các giai đoạn 10 năm — chạm để xem", toi_da: 80 },
  // TV-VONG: hai vòng sao theo hạn trong thẻ chi tiết cung (chỉ hiển thị, không đổi mức nào).
  "vong_han.dai_han": { nhom: "Lá số", nhan: "Nhãn dòng vòng sao theo hạn 10 năm (chi tiết cung)", mac_dinh: "Theo hạn 10 năm", toi_da: 40 },
  "vong_han.nam": { nhom: "Lá số", nhan: "Nhãn dòng vòng sao theo năm xem ({nam} = năm)", mac_dinh: "Theo năm {nam}", toi_da: 40 },
  "vong_han.giai_thich": { nhom: "Lá số", nhan: "Giải thích hai vòng sao theo hạn (trong \"Vì sao nói vậy\")",
    mac_dinh: "Mỗi giai đoạn 10 năm và mỗi năm có hai vòng 12 sao riêng — vòng Thái Tuế và vòng Tướng tinh — xếp lại từ cung của hạn đó. Ở đây chỉ để bạn đối chiếu với sách: hai vòng này không làm đổi mức thuận lợi hay lưu ý nào trong bài đọc.", toi_da: 320 },
});
export const CHU_BAT_TU = gopBang(mangHuyenHoc(true, "Bát tự tứ trụ · Ngũ hành"), moiLap(MOI_BAT_TU));
export const CHU_PHONG_THUY = mangHuyenHoc(true, "Hướng nhà · bố trí · Bát trạch");
export const CHU_KINH_DICH = mangHuyenHoc(false, "Gieo quẻ · 64 quẻ · lời hào");
export const CHU_NHAN_TUONG = gopBang(mangHuyenHoc(true, "Tự soi gương · Tam đình · Ngũ quan"), {
  "dau.chip_1": { nhom: DAU, nhan: "Chip lợi ích 1", mac_dinh: "Không cần gửi ảnh", toi_da: 40 },
  "dau.chip_2": { nhom: DAU, nhan: "Chip lợi ích 2", mac_dinh: "31 câu, khoảng 5 phút", toi_da: 40 },
  "dau.chip_3": { nhom: DAU, nhan: "Chip lợi ích 3", mac_dinh: "Bạn tự chấm đúng hay chưa", toi_da: 40 },
  "khao_sat.nho": { nhom: "Khảo sát", nhan: "Mục khảo sát — dòng nhỏ", mac_dinh: "Soi gương sáu bước", toi_da: 60 },
  "khao_sat.lon": { nhom: "Khảo sát", nhan: "Mục khảo sát — tiêu đề", mac_dinh: "Bạn thấy gì trong gương?", toi_da: 120 },
  "ban_do.nho": { nhom: "Bản đồ mặt", nhan: "Mục bản đồ — dòng nhỏ", mac_dinh: "Bản đồ gương mặt", toi_da: 60 },
  "ban_do.lon": { nhom: "Bản đồ mặt", nhan: "Mục bản đồ — tiêu đề", mac_dinh: "Mỗi vùng mặt nói về một mảng đời", toi_da: 120 },
  "bai_doc.nho": { nhom: "Bài đọc", nhan: "Mục bài đọc — dòng nhỏ", mac_dinh: "Bài đọc tám chương", toi_da: 60 },
  "bai_doc.lon": { nhom: "Bài đọc", nhan: "Mục bài đọc — tiêu đề", mac_dinh: "Gương mặt của bạn", toi_da: 120 },
  "hoi.nho": { nhom: "Hỏi đáp", nhan: "Mục hỏi — dòng nhỏ", mac_dinh: "Hỏi đáp chuyên sâu", toi_da: 60 },
  "hoi.lon": { nhom: "Hỏi đáp", nhan: "Mục hỏi — tiêu đề", mac_dinh: "Hỏi về một vùng trên mặt bạn", toi_da: 120 },
});

export const CHU_THAN_SO = gopBang(KHUNG, {
  "dau.nhan_tren": { nhom: DAU, nhan: "Dòng nhỏ trên tiêu đề (chưa có hồ sơ)", mac_dinh: "Thần số học", toi_da: 60 },
  "dau.dang_tai": { nhom: DAU, nhan: "Tiêu đề lúc đang tải", mac_dinh: "Thần số học theo họ tên và ngày sinh", toi_da: 120 },
  "dau.chua_ho_so": { nhom: DAU, nhan: "Tiêu đề khi chưa có hồ sơ (trên ô nhập)", mac_dinh: "Nhập tên và ngày sinh để bắt đầu", toi_da: 120 },
  "ket_qua.nhan_tren": { nhom: "Kết quả", nhan: "Dòng nhỏ trên tên người dùng", mac_dinh: "Thần số học của bạn", toi_da: 60 },
  "bon_so.nho": { nhom: "Kết quả", nhan: "Mục bốn số — dòng nhỏ", mac_dinh: "Bốn con số cốt lõi", toi_da: 60 },
  "bon_so.lon": { nhom: "Kết quả", nhan: "Mục bốn số — tiêu đề", mac_dinh: "Bốn con số nói gì về bạn", toi_da: 120 },
  "chieu_sau.nho": { nhom: "Kết quả", nhan: "Mục chiều sâu — dòng nhỏ", mac_dinh: "Chiều sâu", toi_da: 60 },
  "chieu_sau.lon": { nhom: "Kết quả", nhan: "Mục chiều sâu — tiêu đề", mac_dinh: "Các giai đoạn trong đời bạn", toi_da: 120 },
  "hoi.nho": { nhom: "Hỏi đáp", nhan: "Mục hỏi — dòng nhỏ", mac_dinh: "Hỏi đáp chuyên sâu", toi_da: 60 },
  "hoi.lon": { nhom: "Hỏi đáp", nhan: "Mục hỏi — tiêu đề ({ten} = tên người dùng)", mac_dinh: "{ten}, bạn đang băn khoăn điều gì?", toi_da: 120 },
});

export const CHU_HOP_DOI = gopBang(KHUNG, {
  "dau.nhan_tren": { nhom: DAU, nhan: "Dòng nhỏ trên tiêu đề", mac_dinh: "Hợp đôi", toi_da: 60 },
  "dau.dang_tai": { nhom: DAU, nhan: "Tiêu đề lúc đang tải", mac_dinh: "Hợp đôi theo thần số học", toi_da: 120 },
  "dau.chua_ho_so": { nhom: DAU, nhan: "Tiêu đề khi chưa có hồ sơ", mac_dinh: "Trước hết, con số của bạn", toi_da: 120 },
  "dau.chua_ho_so_dan": { nhom: DAU, nhan: "Lời dẫn khi chưa có hồ sơ", mac_dinh: "Nhập tên và ngày sinh của bạn, rồi mới đến người ấy.", toi_da: 200 },
});

export const CHU_HOM_NAY = gopBang(KHUNG, {
  "dau.nhan_tren": { nhom: DAU, nhan: "Dòng nhỏ trên tiêu đề", mac_dinh: "Mỗi ngày một thẻ", toi_da: 60 },
  "hoang_lich.tieu_de": { nhom: "Các mục", nhan: "Tiêu đề mục hoàng lịch", mac_dinh: "Hoàng lịch hôm nay", toi_da: 80 },
  "y_dinh.tieu_de": { nhom: "Các mục", nhan: "Tiêu đề mục ý định", mac_dinh: "Hôm nay bạn định làm gì?", toi_da: 80 },
  "noi_bat.tieu_de": { nhom: "Các mục", nhan: "Tiêu đề mục câu hỏi nổi bật", mac_dinh: "Câu hỏi nổi bật hôm nay", toi_da: 80 },
  "hom_qua.tieu_de": { nhom: "Các mục", nhan: "Tiêu đề mục hỏi lại hôm qua", mac_dinh: "Hôm qua của bạn", toi_da: 80 },
  "hom_qua.cau": { nhom: "Các mục", nhan: "Câu hỏi lại hôm qua ({ten} = việc, {nhip} = nhịp đã gợi ý)",
    mac_dinh: "Hôm qua gợi ý cho việc {ten}: {nhip}. Với bạn có đúng vậy không?", toi_da: 160 },
  "hom_qua.cam_on": { nhom: "Các mục", nhan: "Lời cảm ơn sau khi trả lời", mac_dinh: "Cảm ơn bạn — câu trả lời giúp gợi ý những ngày sau sát hơn với bạn.", toi_da: 160 },
  // SAO-HH
  "la_bai.tieu_de": { nhom: "Các mục", nhan: "Tiêu đề khối lá bài đầu ngày", mac_dinh: "Lá bài đầu ngày", toi_da: 80 },
  "hen.tieu_de": { nhom: "Các mục", nhan: "Nhãn “Hẹn với chính mình” (cạnh chuỗi ngày)", mac_dinh: "Hẹn với chính mình", toi_da: 60 },
});

export const CHU_XEM_NGAY = gopBang(KHUNG, {
  "dau.nhan_tren": { nhom: DAU, nhan: "Dòng nhỏ trên tiêu đề", mac_dinh: "Hoàng lịch mỗi ngày", toi_da: 60 },
});
export const CHU_LAM_NHA = gopBang(KHUNG, {
  "dau.nhan_tren": { nhom: DAU, nhan: "Dòng nhỏ trên tiêu đề", mac_dinh: "Tuổi dân gian", toi_da: 60 },
  "theo_nam.tieu_de": { nhom: "Tra nhanh", nhan: "Tiêu đề mục tra theo năm sinh", mac_dinh: "Tra nhanh theo năm sinh", toi_da: 80 },
  "theo_nam.dong": { nhom: "Tra nhanh", nhan: "Dòng trước danh sách năm ({nam} = năm làm nhà)", mac_dinh: "Làm nhà năm {nam}:", toi_da: 60 },
});
export const CHU_XONG_DAT = gopBang(KHUNG, {
  "dau.nhan_tren": { nhom: DAU, nhan: "Dòng nhỏ trên tiêu đề ({tet} = năm Tết)", mac_dinh: "Tết {tet}", toi_da: 60 },
  "theo_nam.tieu_de": { nhom: "Tra nhanh", nhan: "Tiêu đề mục tra theo năm sinh ({tet} = năm Tết)", mac_dinh: "Tuổi xông đất Tết {tet} theo năm sinh gia chủ", toi_da: 100 },
});
// MT-ĐS B3 — sao hạn theo tuổi.
export const CHU_SAO_HAN = gopBang(KHUNG, {
  "dau.nhan_tren": { nhom: DAU, nhan: "Dòng nhỏ trên tiêu đề", mac_dinh: "Tục lệ theo tuổi", toi_da: 60 },
  "theo_nam.tieu_de": { nhom: "Tra nhanh", nhan: "Tiêu đề mục bảng theo năm", mac_dinh: "Bảng sao hạn theo năm sinh", toi_da: 100 },
  "theo_nam.dong": { nhom: "Tra nhanh", nhan: "Chữ trước link bảng ({nam} = năm)", mac_dinh: "Năm {nam}:", toi_da: 60 },
});
// SEO-L5 — công cụ đổi lịch âm dương.
export const CHU_DOI_LICH = gopBang(KHUNG, {
  "dau.nhan_tren": { nhom: DAU, nhan: "Dòng nhỏ trên tiêu đề", mac_dinh: "Âm lịch Việt Nam", toi_da: 60 },
  "nam.tieu_de": { nhom: "Lịch theo năm", nhan: "Tiêu đề mục lịch âm từng năm", mac_dinh: "Lịch âm theo năm", toi_da: 80 },
});
export const CHU_HAN_NAM = gopBang(KHUNG, {
  "dau.nhan_tren": { nhom: DAU, nhan: "Dòng nhỏ trên tiêu đề", mac_dinh: "Phong thuỷ theo năm", toi_da: 60 },
});
// NAM-2 — "Thời gian tới của bạn".
export const CHU_THOI_GIAN_TOI = gopBang(KHUNG, {
  "dau.nhan_tren": { nhom: DAU, nhan: "Dòng nhỏ trên tiêu đề", mac_dinh: "Thần số · Tử vi · Bát tự · tập quán", toi_da: 60 },
});
