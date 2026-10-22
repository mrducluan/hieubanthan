// KC-0 (docs/PHAN-TICH-MIGRATION-V2-2.md, GĐ0) — vòng "kiểm chứng" thay RLHF: người dùng bấm 1 chạm "Đúng với mình /
// Chưa đúng" trên thẻ Tử vi; chỉ MÃ đi lên PostHog (sự kiện `tuvi_kiem_chung`), không chữ, không lá số, không ngày giờ.
// Mã dựng từ dữ kiện ĐÃ TÍNH của engine (loại + cung nguồn + hoá + cung đích; mức + mã lý do) — tất định, cùng lá số
// ra cùng mã, không phụ thuộc câu chữ KB. Số đếm chỉ để người biên tập XEM LẠI KB, không tự đổi luận giải.
// Dùng chung trình duyệt (thẻ) + máy chủ (/quan-tri/tang-truong) — không import gì phía máy chủ ở đây.

export type LoaiKiemChung = "phi_hoa" | "nhip_3_thang" | "doi_song";
export type KetQuaKiemChung = "dung" | "chua_dung";

/** Chuỗi ASCII thường, gạch dưới: "Quan Lộc" → "quan_loc", "Điền Trạch" → "dien_trach". */
export function maChu(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[đĐ]/g, "d").toLowerCase()
    .replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

/** Mã mẫu một đường bay nổi bật: `{loai}.{cung nguồn}.{hoá}.{cung đích | tu}` (vd `mau.quan_loc.ky.menh`).
 *  ≤ 40 ký tự với mọi tên cung (dài nhất: `loc_nhap.dien_trach.quyen.dien_trach` = 36). */
export function maPhiHoa(n: { loai: string; duong: { tu_cung: string; hoa: string; den_cung: string | null; tu_hoa: boolean } }): string {
  const den = n.duong.tu_hoa ? "tu" : maChu(n.duong.den_cung ?? "khong");
  return [maChu(n.loai), maChu(n.duong.tu_cung), maChu(n.duong.hoa), den].join(".");
}

/** Mã lý do nhịp — viết tắt cố định để mã đủ ngắn (giới hạn 40 ký tự của lib/do-luong). */
export const LY_DO_NGAN: Record<string, string> = {
  chong_ky: "ck", ky_xung_cung_chinh: "kx", khoa_giai: "kg", loc_nhap_cung_chinh: "ln", song_loc: "sl",
};
export const TEN_LY_DO: Record<string, string> = {
  ck: "chồng Kỵ", kx: "Kỵ xung cung chính", kg: "Khoa giải", ln: "Lộc nhập cung chính", sl: "song Lộc",
};
const TEN_MUC: Record<string, string> = { thuan: "Thuận", binh: "Bình", can_than: "Cần thận trọng" };

/** Mã một tháng nhịp: `{mức}.{lý do viết tắt, xếp theo chữ cái, nối +}` hoặc `{mức}.-` khi không có lý do. */
export function maNhip(t: { muc: string; ly_do: { ma: string }[] }): string {
  const ly = [...new Set(t.ly_do.map((l) => LY_DO_NGAN[l.ma] ?? "x"))].sort();
  return `${maChu(t.muc)}.${ly.length ? ly.join("+") : "-"}`;
}

/** LG-ĐS: mã hộp luận giải đời sống do engine dựng — `ds.{chương}.{…}` (vd `ds.su_nghiep.thien_co.sang.manh`),
 *  ≤ 60 ký tự, chữ thường/số/`_.+-`. Web không tự dựng mã này, chỉ chuyển nguyên văn. BT-ĐS: Bát tự dùng `ds.bt.{chương}.{…}`
 *  (cùng loại `doi_song`, đi qua ràng buộc của migration 0017 — không cần migration mới). */
export const MA_DOI_SONG = /^ds\.[a-z0-9_]+(\.[a-z0-9_+-]+)+$/;
/** Phái ghi kèm phiếu kiểm chứng theo mô-đun của báo cáo đời sống. */
export const PHAI_DOI_SONG: Record<string, string> = { tuvi: "nam_phai_viet", battu: "tu_binh", phongthuy: "bat_trach_huyen_khong", thanso: "pitago" };
/** HỌC-ĐS: chương của báo cáo "Nhà của bạn" (ds.phongthuy.*). */
export const TEN_CHUONG_PT: Record<string, string> = {
  ban_hop_huong: "Bạn hợp hướng nào", ngoi_nha_voi_ban: "Ngôi nhà này với bạn", tung_phong: "Từng phòng",
  nam_nay: "Năm nay & 3 tháng tới", viec_nen_lam: "Việc nên làm",
};
/** Mảng của một mã kiểm chứng (để /quan-tri/hoc gom theo mảng): ds.bt → battu, ds.phongthuy / ds.kinhdich / ds.thanso, còn lại Tử vi. */
export function mangCuaMa(loai: string, mau: string): string {
  if (loai !== "doi_song") return "tuvi";
  const m = mau.split(".")[1] ?? "";
  if (m === "bt") return "battu";
  return ["phongthuy", "kinhdich", "thanso"].includes(m) ? m : "tuvi";
}
export const TEN_MANG: Record<string, string> = { tuvi: "Tử vi", battu: "Bát tự", phongthuy: "Phong thuỷ", kinhdich: "Kinh Dịch", thanso: "Thần số" };
export const TEN_CHUONG_BT: Record<string, string> = {
  tong_quan: "Con người bạn", ngu_hanh: "Năng lượng (ngũ hành)", cuoc_doi: "Các giai đoạn cuộc đời", su_nghiep: "Công việc",
  tien_bac: "Tiền bạc", tinh_cam: "Tình yêu & hôn nhân", gia_dinh: "Gia đình", hoc_tap: "Học & nghĩ",
  suc_khoe: "Sức khoẻ", quan_he: "Bạn bè & bên ngoài", nam_nay: "Năm nay & tháng tới", van_han: "Vận hạn & điều nên tránh",
  loi_khuyen: "Lời khuyên",
};
export const TEN_CHUONG_DS: Record<string, string> = {
  tong_quan: "Con người bạn", cuoc_doi: "Các giai đoạn cuộc đời", su_nghiep: "Công việc", tien_bac: "Tiền bạc",
  tinh_cam: "Tình yêu & hôn nhân", gia_dinh: "Gia đình", suc_khoe: "Sức khoẻ", quan_he: "Bạn bè & bên ngoài",
  nha_cua: "Nhà cửa", duong_bay: "Đường bay tứ hoá", nam_nay: "Năm nay & 3 tháng tới", van_han: "Vận hạn & điều nên tránh",
  loi_khuyen: "Lời khuyên",
  cot_loi: "Điều quan trọng nhất",
};
const TEN_PHAN_DS: Record<string, string> = {
  sang: "sáng", ham: "hãm", manh: "điểm mạnh", de_vap: "dễ vấp", loi_khuyen: "lời khuyên", luu_y: "lưu ý",
  diem_manh: "điểm mạnh", thoi_diem: "thời điểm", thuan: "thuận lợi", can_bang: "cân bằng", can_chu_dong: "cần lưu ý",
  loc: "Lộc", quyen: "Quyền", khoa: "Khoa", ky: "Kỵ", cat: "cát tinh", sat: "sát tinh", dao_hoa: "đào hoa",
  // BT-ĐS (ds.bt.*)
  vap: "dễ vấp", khuyen: "lời khuyên", nc: "nhật chủ", noi_bat: "thập thần nổi nhất", cach: "cách cục", ts: "thần sát",
  yeu: "thân yếu", cach1: "cách 1 (cân sức)", cach2: "cách 2 (tháng sinh)", hai_cach: "hai cách trùng", thua: "thừa",
  thieu: "thiếu", van: "đại vận", nam: "năm nay", hien_tai: "đang đi", tiep: "kế tiếp", phoi: "cung phối ngẫu",
  // VH-1 (ds.van_han.* / ds.bt.van_han.*)
  ky_nhap: "Kỵ năm nhập", ky_chieu: "Kỵ năm chiếu", loc_nhap: "Lộc năm nhập", song_loc: "song Lộc", tre: "tuổi trẻ",
  lon: "từ 35 tuổi", nho: "dưới 18 tuổi", can: "năm cần lưu ý", giu_nhip: "năm nên giữ nhịp", don_suc: "năm đáng dồn sức",
  thang: "12 tháng tới", cham: "có tháng nên chậm",
};

/** Nhãn đọc được cho người biên tập ở /quan-tri (giải mã ngược, không cần engine). */
export function nhanMau(loai: string, mau: string): string {
  const p = mau.split(".");
  if (loai === "doi_song" && p[1] === "bt") {
    const [, , chuong, ...con] = p;
    return ["Bát tự", TEN_CHUONG_BT[chuong ?? ""] ?? chuong, ...con.map((x) => TEN_PHAN_DS[x] ?? x.replace(/_/g, " "))].join(" · ");
  }
  if (loai === "doi_song" && p[1] === "phongthuy") {
    const [, , chuong, ...con] = p;
    return ["Phong thuỷ", TEN_CHUONG_PT[chuong ?? ""] ?? chuong, ...con.map((x) => TEN_PHAN_DS[x] ?? x.replace(/_/g, " "))].join(" · ");
  }
  if (loai === "doi_song" && p[1] === "kinhdich") {
    const [, , chuDe, ...con] = p;
    return ["Kinh Dịch", (chuDe ?? "").replace(/_/g, " "), ...con.map((x) => TEN_PHAN_DS[x] ?? (x.startsWith("q") ? `quẻ ${x.slice(1)}` : x.replace(/_/g, " ")))].join(" · ");
  }
  if (loai === "doi_song") {
    const [, chuong, ...con] = p;
    return [TEN_CHUONG_DS[chuong ?? ""] ?? chuong, ...con.map((x) => TEN_PHAN_DS[x] ?? x.replace(/_/g, " "))].join(" · ");
  }
  if (loai === "nhip_3_thang") {
    const ly = p[1] && p[1] !== "-" ? p[1].split("+").map((x) => TEN_LY_DO[x] ?? x).join(", ") : "không có lý do riêng";
    return `${TEN_MUC[p[0] ?? ""] ?? p[0]} · ${ly}`;
  }
  const [loaiNb, tu, hoa, den] = p;
  const nguon = loaiNb === "mau" ? "mẫu KB" : loaiNb === "ky_xung" ? "Kỵ xung" : loaiNb === "loc_nhap" ? "Lộc nhập" : loaiNb === "tu_hoa" ? "tự hoá" : loaiNb;
  return `${nguon}: ${tu} → hoá ${hoa} → ${den === "tu" ? "tự hoá" : den}`;
}

/** Ngưỡng đủ mẫu (đúng + chưa đúng) để hiện tỉ lệ một mã. */
export const MAU_KIEM_CHUNG = 30;

export interface DongKiemChung { loai: string; mau: string; dung: number; chua_dung: number }
export interface KetQuaBangKiemChung { du: (DongKiemChung & { tong: number; ti_le_dung: number; nhan: string })[]; chuaDu: number; tongPhieu: number }

/** Lọc + xếp: chỉ mã đủ mẫu mới có tỉ lệ; xếp tỉ lệ "đúng" thấp lên đầu (KB cần xem lại trước). */
export function tinhKiemChung(ds: DongKiemChung[], nguong = MAU_KIEM_CHUNG): KetQuaBangKiemChung {
  const du = ds.map((d) => ({ ...d, tong: d.dung + d.chua_dung }))
    .filter((d) => d.tong >= nguong)
    .map((d) => ({ ...d, ti_le_dung: d.dung / d.tong, nhan: nhanMau(d.loai, d.mau) }))
    .sort((a, b) => a.ti_le_dung - b.ti_le_dung || b.tong - a.tong);
  return { du, chuaDu: ds.filter((d) => d.dung + d.chua_dung < nguong).length, tongPhieu: ds.reduce((s, d) => s + d.dung + d.chua_dung, 0) };
}
