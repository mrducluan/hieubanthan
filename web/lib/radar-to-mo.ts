// Chặng 0 — Radar Bắt Tò Mò Chưa Phủ & Sức Khỏe Trục Sống DB ↔ KB.
// Dữ liệu đầu vào hoàn toàn ẩn danh từ `nhat_ky_hoi_gan_day` (0004/0005/0011/0031: không user_id, không ngày sinh).
// Gom câu hỏi chưa phủ / bị bấm 👎 về đúng 8 Mạch Tò Mò Huyền Học và chỉ thẳng tệp KB cần bồi đắp tại `/quan-tri/tri-thuc/<slug>`.

export type MaMachToMo =
  | "kinh_doanh_doi_tac"
  | "tai_loc_giu_tien"
  | "tinh_duyen_ly_hon"
  | "gia_dao_con_cai"
  | "hoc_hanh_thang_tien"
  | "van_han_hoa_giai"
  | "tuong_lai_nhip_thang"
  | "nha_cua_kiem_chung";

export interface TepKbGoiY {
  tep: string;
  nhan: string;
  duong: string;
}

export interface CumRadarToMo {
  ma: MaMachToMo;
  ten: string;
  mo_ta: string;
  so_cau: number;
  so_khong_huu_ich: number;
  mau_cau: { id: string; mo_dun: string; cau_hoi: string }[];
  tep_kb: TepKbGoiY[];
}

export interface CauHoiNhatKy {
  id: string;
  mo_dun: string;
  cau_hoi: string;
  loai?: string;
  do_phu?: string;
  can_them?: string[];
  huu_ich?: boolean | null;
}

function boDau(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

interface DinhNghiaMach {
  ma: MaMachToMo;
  ten: string;
  mo_ta: string;
  mau: RegExp[];
  tep: [string, string][];
}

const MACH_8: readonly DinhNghiaMach[] = [
  {
    ma: "kinh_doanh_doi_tac",
    ten: "Kinh doanh, Tháng làm lớn & Đối tác",
    mo_ta: "Hùn vốn, chọn co-founder/cộng sự, mặt bằng, khai trương, mở rộng hay thu hẹp.",
    mau: [/\b(hop tac|hun von|gop von|doi tac|co founder|cong su|lam an chung|mo quan|mo tiem|mo cua hang|mo cong ty|mo xuong|khai truong|mat bang|quay thu ngan|nhap hang|bung von)\b/],
    tep: [
      ["doanh_chu_quan_ly_kb.json", "KB Quản lý & Cộng sự"],
      ["doanh_chu_lich_kb.json", "KB Lịch quyết định 12 tháng"],
      ["doanh_chu_mat_bang_kb.json", "KB Mặt bằng & Khai trương"],
    ],
  },
  {
    ma: "tinh_duyen_ly_hon",
    ten: "Tình duyên, Độc thân & Sau đổ vỡ",
    mo_ta: "Bao giờ gặp người phù hợp, tái hợp/mở lòng sau ly hôn, người thứ ba, duyên muộn.",
    mau: [/\b(ly hon|ly di|do vo|hai lan do|dang do|tai hon|nguoi cu|quay lai|nguoi thu ba|ngoai tinh|phan boi|tinh duyen|nguoi yeu|lay chong|lay vo|ket hon|dao hoa|hong loan|ban doi)\b/],
    tep: [
      ["tuvi_luan_hoi_kb.json", "KB Luận hỏi Tử vi (Tình cảm)"],
      ["battu_luan_hoi_kb.json", "KB Luận hỏi Bát tự (Tình cảm)"],
      ["tuvi_hai_nguoi_kb.json", "KB Hợp tham 2 lá số"],
    ],
  },
  {
    ma: "gia_dao_con_cai",
    ten: "Gia đạo lục đục, Vợ chồng & Con cái",
    mo_ta: "Vợ chồng khắc khẩu, cha mẹ/anh em, sinh con & thấu hiểu tính nết con cái.",
    mau: [/\b(vo chong|khac khau|cai nhau|luc duc|gia dao|gia dinh|con cai|sinh con|day con|cha me|bo me|anh em|me chong|nang dau)\b/],
    tep: [
      ["gia_dinh_kb.json", "KB Hồ sơ Gia đình"],
      ["tuvi_doi_song_kb.json", "KB Tử vi đời sống"],
      ["battu_doi_song_kb.json", "KB Bát tự đời sống"],
    ],
  },
  {
    ma: "tai_loc_giu_tien",
    ten: "Kích tài lộc, Giữ tiền & Nguồn thu",
    mo_ta: "Kiếm tiền bằng nghề gì, vì sao hay hụt tiền, kích tài vị, mua bán tài sản.",
    mau: [/\b(tai loc|kich tai|giu tien|hao tai|hut tien|tien bac|tai chinh|thu nhap|no nan|vay muon|doi no|dau tu|giau|tai bach|tai tinh)\b/],
    tep: [
      ["tuvi_luan_hoi_kb.json", "KB Luận hỏi Tử vi (Tiền bạc)"],
      ["battu_luan_hoi_kb.json", "KB Luận hỏi Bát tự (Tiền bạc)"],
      ["phongthuy_huyen_khong.json", "KB Huyền Không Phi Tinh"],
    ],
  },
  {
    ma: "hoc_hanh_thang_tien",
    ten: "Học hành, Thi cử, Đổi việc & Thăng tiến",
    mo_ta: "Chọn ngành/nghề, thi cử, nhảy việc, thăng chức, làm chủ hay làm thuê, đi xa.",
    mau: [/\b(hoc hanh|thi cu|thi dau|bang cap|thang chuc|thang tien|nhay viec|doi viec|nghe gi|hop nghe|lam chu|lam thue|sep|dong nghiep|di xa|dinh cu|du hoc|quan loc)\b/],
    tep: [
      ["tuvi_luan_hoi_kb.json", "KB Luận hỏi Tử vi (Sự nghiệp)"],
      ["battu_luan_hoi_kb.json", "KB Luận hỏi Bát tự (Sự nghiệp)"],
      ["ke_hoach_thang_kb.json", "KB Kế hoạch tháng theo việc"],
    ],
  },
  {
    ma: "van_han_hoa_giai",
    ten: "Vận hạn rủi ro & Cách điều hòa",
    mo_ta: "Sao hạn, Tam tai, Thái Tuế, giấy tờ/thị phi, sức khoẻ phòng ngừa & hướng điều hoà.",
    mau: [/\b(van han|sao han|tam tai|thai tue|kim lau|hoang oc|la hau|thai bach|ke do|ngu hoang|nhi hac|hoa giai|xui|thi phi|tieu nhan|kien tung|suc khoe)\b/],
    tep: [
      ["sao_han_kb.json", "KB Sao hạn & Bát hạn"],
      ["chu_y_kb.json", "KB Năm nên chú ý & Hành vi"],
      ["suc_khoe_kb.json", "KB Sức khoẻ phòng ngừa"],
    ],
  },
  {
    ma: "nha_cua_kiem_chung",
    ten: "Nhà cửa, Phong thủy & Đối chiếu sách xưa",
    mo_ta: "Hướng nhà, bếp, giường, bàn làm việc, định giờ sinh & kiểm chứng lời thầy khác.",
    mau: [/\b(huong nha|phong thuy|bep|giuong|ban lam viec|ban tho|cua chinh|xay nha|mua nha|chung cu|gio sinh|thay bao|thay noi|vo chinh dieu|khong kiep|that sat)\b/],
    tep: [
      ["phongthuy_tam_yeu.json", "KB Dương Trạch Tam Yếu"],
      ["phongthuy_huyen_khong.json", "KB Huyền Không Vận 9"],
      ["tuvi_sach_ghi.json", "KB Sách xưa Tử vi"],
    ],
  },
  {
    ma: "tuong_lai_nhip_thang",
    ten: "Tương lai sắp tới & Nhịp 12 tháng",
    mo_ta: "Năm 2027, 3 tháng tới, tháng nào thuận, đại vận 10 năm & bước ngoặt.",
    mau: [/\b(nam nay|nam toi|nam sau|2027|2028|thang nao|thang toi|ba thang|12 thang|dai van|dai han|luu nien|luu nguyet|tuong lai|sap toi)\b/],
    tep: [
      ["ke_hoach_thang_kb.json", "KB Kế hoạch tháng"],
      ["nam_tong_quan_kb.json", "KB Tổng quan năm"],
      ["thoi_gian_lop_kb.json", "KB Lớp thời gian"],
    ],
  },
];

export function duongTriThucKb(tep: string): string {
  return `/quan-tri/tri-thuc/${tep.replace(/\.json$/, "")}`;
}

export function phanMachToMo(cauHoi: string, moDun = ""): MaMachToMo {
  const t = boDau(cauHoi);
  for (const m of MACH_8) {
    if (m.mau.some((rx) => rx.test(t))) return m.ma;
  }
  if (moDun === "phongthuy") return "nha_cua_kiem_chung";
  return "tuong_lai_nhip_thang";
}

export function gomRadarToMo(ds: readonly CauHoiNhatKy[]): CumRadarToMo[] {
  const bang = new Map<MaMachToMo, CumRadarToMo>();
  for (const d of MACH_8) {
    bang.set(d.ma, {
      ma: d.ma,
      ten: d.ten,
      mo_ta: d.mo_ta,
      so_cau: 0,
      so_khong_huu_ich: 0,
      mau_cau: [],
      tep_kb: d.tep.map(([tep, nhan]) => ({ tep, nhan, duong: duongTriThucKb(tep) })),
    });
  }
  for (const c of ds) {
    if (!c.cau_hoi?.trim()) continue;
    const ma = phanMachToMo(c.cau_hoi, c.mo_dun);
    const cum = bang.get(ma)!;
    cum.so_cau += 1;
    if (c.huu_ich === false) cum.so_khong_huu_ich += 1;
    if (cum.mau_cau.length < 3) {
      cum.mau_cau.push({ id: c.id, mo_dun: c.mo_dun, cau_hoi: c.cau_hoi });
    }
  }
  return [...bang.values()]
    .filter((x) => x.so_cau > 0)
    .sort((a, b) => b.so_cau - a.so_cau || b.so_khong_huu_ich - a.so_khong_huu_ich);
}

/** 8 migration cốt lõi của Trục Sống DB Tự Học (đối chiếu với `tinhTrangMigration()` ở `/quan-tri/hoc`). */
export const MIGRATION_TRUC_HOC: readonly { so: string; vai_tro: string }[] = [
  { so: "0011", vai_tro: "Thống kê nhật ký hỏi đáp ẩn danh (thong_ke_hoi)" },
  { so: "0016", vai_tro: "Góp ý & cụm bất thường Thần số" },
  { so: "0017", vai_tro: "Phiếu kiểm chứng ma_mau, Bài đã lưu & Kho vectơ" },
  { so: "0018", vai_tro: "Hồ sơ nhà & Nhắc việc theo tháng" },
  { so: "0022", vai_tro: "Phiếu kết quả sau 30 ngày & Hàng đợi đề xuất luật" },
  { so: "0031", vai_tro: "Nhật ký hỏi đáp dùng khoá HMAC riêng" },
  { so: "0032", vai_tro: "Nhật ký ngày ghé (Tháng của tôi)" },
  { so: "0034", vai_tro: "Kiểm định lệch tỉ lệ đúng theo ngôn ngữ (VI ↔ EN)" },
];

export function tongKetMigrationHoc(tt: ReadonlyMap<string, boolean> | null): {
  doc_duoc: boolean;
  da_chay: string[];
  con_thieu: { so: string; vai_tro: string }[];
} {
  if (!tt) return { doc_duoc: false, da_chay: [], con_thieu: [] };
  const da_chay: string[] = [];
  const con_thieu: { so: string; vai_tro: string }[] = [];
  for (const m of MIGRATION_TRUC_HOC) {
    if (tt.get(m.so) === true) da_chay.push(m.so);
    else if (tt.get(m.so) === false) con_thieu.push(m);
  }
  return { doc_duoc: true, da_chay, con_thieu };
}
