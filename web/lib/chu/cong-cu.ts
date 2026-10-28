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
const mangHuyenHoc = (coHoiAi: boolean): BangChu => gopBang(KHUNG, {
  "dau.nhan_tren": { nhom: DAU, nhan: "Dòng nhỏ cạnh biểu tượng", mac_dinh: "Huyền học", toi_da: 60 },
  "dau.nhan_duoi": { nhom: DAU, nhan: "Nhãn viền dưới lời dẫn", mac_dinh: "Diễn giải từ kho tri thức Hiểu Bản Thân · tham khảo văn hoá", toi_da: 100 },
  ...(coHoiAi ? { "hoi.tieu_de": { nhom: "Hỏi đáp", nhan: "Tiêu đề khung hỏi đáp", mac_dinh: "Hỏi đáp cùng AI", toi_da: 60 } } : {}),
});

export const CHU_TU_VI = mangHuyenHoc(true);
export const CHU_BAT_TU = mangHuyenHoc(true);
export const CHU_PHONG_THUY = mangHuyenHoc(true);
export const CHU_KINH_DICH = mangHuyenHoc(false);

export const CHU_THAN_SO = gopBang(KHUNG, {
  "dau.nhan_tren": { nhom: DAU, nhan: "Dòng nhỏ trên tiêu đề (chưa có hồ sơ)", mac_dinh: "Thần số học", toi_da: 60 },
  "dau.dang_tai": { nhom: DAU, nhan: "Tiêu đề lúc đang tải", mac_dinh: "Thần số học theo họ tên và ngày sinh", toi_da: 120 },
  "dau.chua_ho_so": { nhom: DAU, nhan: "Tiêu đề khi chưa có hồ sơ (trên ô nhập)", mac_dinh: "Nhập tên và ngày sinh để bắt đầu", toi_da: 120 },
  "ket_qua.nhan_tren": { nhom: "Kết quả", nhan: "Dòng nhỏ trên tên người dùng", mac_dinh: "Thần số học của bạn", toi_da: 60 },
  "bon_so.nho": { nhom: "Kết quả", nhan: "Mục bốn số — dòng nhỏ", mac_dinh: "Bốn con số cốt lõi", toi_da: 60 },
  "bon_so.lon": { nhom: "Kết quả", nhan: "Mục bốn số — tiêu đề", mac_dinh: "Bốn con số nói gì về bạn", toi_da: 120 },
  "chieu_sau.nho": { nhom: "Kết quả", nhan: "Mục chiều sâu — dòng nhỏ", mac_dinh: "Chiều sâu", toi_da: 60 },
  "chieu_sau.lon": { nhom: "Kết quả", nhan: "Mục chiều sâu — tiêu đề", mac_dinh: "Các giai đoạn trong đời bạn", toi_da: 120 },
  "hoi.nho": { nhom: "Hỏi đáp", nhan: "Mục hỏi — dòng nhỏ", mac_dinh: "Hỏi sâu hơn", toi_da: 60 },
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
