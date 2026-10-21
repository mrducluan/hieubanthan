// SPEC-004a — schema vào/ra của /api/tuvi/chart, validate bằng zod.
// Bản JSON Schema người-đọc-được nằm cạnh: chart.schema.json (v0, nháp chờ duyệt).
//
// pham_vi = "tuan_triet_only": đây CHƯA phải lá số an sao đầy đủ. Engine an sao
// (14 chính tinh, 12 cung) là SPEC-005 — chờ quyết định nguồn tri thức.
import { z } from "zod";

/** TV-LN — 5 phái tính cung tháng Giêng của lưu nguyệt (engine: calc/tuvi_luu_nguyet.PHAI). */
export const PHAI_LUU_NGUYET = ["dau_quan_thai_tue", "dau_quan_tieu_han", "tieu_han", "luu_nien", "dia_chi_thang"] as const;
export type PhaiLuuNguyet = (typeof PHAI_LUU_NGUYET)[number];

export const ChartInput = z.object({
  birth_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Định dạng YYYY-MM-DD"),
  birth_time: z.string().regex(/^\d{2}:\d{2}$/, "Định dạng HH:MM"),
  gender: z.enum(["nam", "nu"]),
  calendar_type: z.enum(["duong", "am"]).default("duong"),
  am_nhuan: z.boolean().default(false),
  // Bắt buộc khi sinh trước 13/06/1975 — engine sẽ từ chối nếu thiếu.
  vung: z.enum(["north", "south"]).optional(),
  noi_sinh: z.string().regex(/^[a-z0-9_-]{2,40}$/).optional(),
  gio_mua_he: z.boolean().optional(),
  truong_phai: z.enum(["npl", "vvt"]).optional(),
  che_do: z.enum(["hep", "tam_hop", "tptc"]).optional(),
  do_tin_gio: z.enum(["exact", "approx", "unknown"]).default("exact"),
  /** TV-PHAI — Hoả/Linh lối Việt | Trung Châu; nửa sau tháng nhuận tính tháng sau | như tháng chính. */
  hoa_linh: z.enum(["viet", "trung"]).optional(),
  thang_nhuan: z.enum(["thang_sau", "thang_chinh"]).optional(),
  /** TV-LICH — âm lịch Việt Nam (mặc định) | lịch Trung Quốc. */
  lich: z.enum(["viet", "trung"]).optional(),
  /** TV-LN — phái tính lưu nguyệt (tháng hạn). */
  luu_nguyet: z.enum(PHAI_LUU_NGUYET).optional(),
});
export type ChartInputT = z.infer<typeof ChartInput>;
/** Đầu vào phía trình duyệt (trước khi zod điền mặc định) — dùng cho component gửi `la_so`. */
export type ChartInputVao = z.input<typeof ChartInput>;

const CungChiTiet = z.object({
  cung: z.string(),
  nguon: z.array(z.enum(["Tuần", "Triệt"])),
  kieu: z.string(),
  cuong_do_phan_tram: z.number().optional(),
});

export const ChartOutput = z.object({
  engine_version: z.string(),
  pham_vi: z.literal("tuan_triet_only"),
  duong_lich_goc: z.string(),
  duong_lich_kinh_tuyen: z.string(),
  mui_gio_dong_ho: z.number().nullable(),
  am_lich: z.object({
    ngay: z.number(), thang: z.number(), nam: z.number(), nhuan: z.number(),
  }),
  can_chi_nam: z.object({ can: z.string(), chi: z.string() }),
  gioi_tinh: z.enum(["nam", "nu"]),
  ngay_can_chi: z.string().nullable(),
  ty_boundary_policy: z.string().nullable(),
  tuan_triet: z.object({
    nam_sinh: z.string(),
    tuoi: z.string(),
    truong_phai: z.string(),
    che_do_pham_vi: z.string(),
    giai_doan: z.string(),
    ranh_gioi_tuoi_mu: z.number().nullable(),
    tuan_dong_tai: z.array(z.string()),
    triet_dong_tai: z.array(z.string()),
    chi_tiet_tung_cung: z.array(CungChiTiet),
    tong_so_cung_bi_anh_huong: z.number(),
    ty_le: z.string(),
    cung_KHONG_bi_anh_huong: z.array(z.string()),
    canh_bao: z.array(z.string()),
  }),
  co_canh_bao: z.array(z.object({ loai: z.string(), chi_tiet: z.string() })),
});
export type ChartOutputT = z.infer<typeof ChartOutput>;

// --------------------------------------------------------------------------- //
// SPEC-005 — lá số an sao đầy đủ (iztro cục bộ). Route riêng /api/tuvi/la-so để
// KHÔNG đổi hợp đồng /api/tuvi/chart (v0 tuan_triet_only đã duyệt).
// --------------------------------------------------------------------------- //
const Sao = z.object({
  ten: z.string(),
  do_sang: z.string().nullable(),
  tu_hoa: z.string().nullable(),
  /** TV-NP: độ sáng lối Việt (chính tinh; phụ tinh từ TV-NP2 — null nếu sách không luận); `do_sang` là bảng phái Trung của iztro. */
  do_sang_nam_phai: z.string().nullable().optional(),
  /** Chính tinh: lời đời thường theo sao × cung × sáng/hãm (Nam phái) — điều thường thấy ở bạn + một việc nên làm;
   *  tên sao, độ sáng, tính chất sao chỉ ở `can_cu` ("Vì sao nói vậy"). */
  giai_nghia: z.object({
    thuong_thay: z.string(), nen_lam: z.string().nullable(), can_cu: z.array(z.string()).optional(),
  }).nullable().optional(),
});

const PhuTinh = Sao.extend({ loai: z.string().optional() });

const Cung = z.object({
  ten: z.string(),
  can: z.string(),
  chi: z.string(),
  la_menh: z.boolean(),
  la_than: z.boolean(),
  la_lai_nhan: z.boolean().optional(),
  chinh_tinh: z.array(Sao),
  phu_tinh: z.array(PhuTinh),
  tap_dieu: z.array(z.string()),
  truong_sinh: z.string(),
  bac_si: z.string(),
  tuong_tien: z.string(),
  tue_tien: z.string(),
  /** TV-LICH: tên vòng Thái Tuế theo sách Việt (iztro dùng tên phái Trung). */
  thai_tue_nam_phai: z.string().optional(),
  dai_han: z.object({ tu_tuoi: z.number(), den_tuoi: z.number() }),
  tieu_han_tuoi: z.array(z.number()),
  /** TV-NP2 — độ sáng lối Việt của phụ tinh, tạp diệu, Đại/Tiểu Hao, Hoá Kỵ trong cung (chỉ sao có luận). */
  do_sang_phu: z.record(z.string()).optional(),
});

export const LaSoOutput = z.object({
  engine_version: z.string(),
  pham_vi: z.literal("an_sao_day_du"),
  iztro: z.string(),
  duong_lich_goc: z.string(),
  duong_lich_kinh_tuyen: z.string(),
  mui_gio_dong_ho: z.number().nullable(),
  gio_chi_so: z.number().int().min(0).max(12),
  gio: z.string(),
  khoang_gio: z.string(),
  am_lich: z.object({ ngay: z.number(), thang: z.number(), nam: z.number(), nhuan: z.number() }),
  am_lich_iztro: z.string(),
  tu_tru: z.string(),
  can_chi_nam: z.object({ can: z.string(), chi: z.string() }),
  gioi_tinh: z.enum(["nam", "nu"]),
  ngu_hanh_cuc: z.string(),
  menh_chu: z.string(),
  than_chu: z.string(),
  chi_cung_menh: z.string(),
  chi_cung_than: z.string(),
  // VZ-1 (engine ≥ bản này): phần giữa lá số + Tuần/Triệt lối Việt. Optional để web chịu được engine cũ.
  menh_nap_am: z.object({ ten: z.string(), hanh: z.string(), han: z.string() }).optional(),
  am_duong: z.object({ nam_sinh: z.string(), nhan: z.string(), ly: z.enum(["thuận", "nghịch"]) }).optional(),
  menh_cuc: z.string().optional(),
  tuan_triet: z.object({ tuan: z.array(z.string()), triet: z.array(z.string()) }).optional(),
  // KB-2: cách cục quanh Mệnh (engine nhận diện, KB diễn giải — nháp AI).
  cach_cuc: z.array(z.object({
    ma: z.string(), ten: z.string(), ten_han: z.string(), nhom: z.enum(["cát", "hung", "trung"]),
    dieu_kien: z.string(), y: z.string(), mat_toi: z.string(), loi_khuyen: z.string(),
    co_ca: z.string().optional(),   // KB-TV2: phiên âm Hán Việt bài phú cổ (cổ thư công cộng)
    cung_lien_quan: z.array(z.string()), sat_hoi: z.array(z.string()),
  })).optional(),
  cach_cuc_luu_y: z.string().optional(),
  cung: z.array(Cung).length(12),
  co_canh_bao: z.array(z.object({ loai: z.string(), chi_tiet: z.string() })),
  /** TV-PHAI — trường phái đang dùng cho lá số này. */
  phai: z.object({ hoa_linh: z.string(), thang_nhuan: z.string(), co_the_doi_thang_nhuan: z.boolean(),
    lich: z.string().optional(), lich_khac: z.boolean().optional(), luu_nguyet: z.string().optional() }).optional(),
});
export type LaSoOutputT = z.infer<typeof LaSoOutput>;

// VZ-1 — lớp vận hạn phủ lên lá số (/v1/tuvi/van-han). chi_so = vị trí trong mảng `cung` (0 = Dần).
export const VanHanInput = z.object({
  la_so: ChartInput,
  nam_xem: z.number().int().min(1900).max(2100).optional(),
});
const LopHan = z.object({
  chi_so: z.number().int().min(0).max(11),
  can: z.string(),
  chi: z.string(),
  tu_hoa: z.array(z.string()),
  ten_cung: z.array(z.string()),
  sao: z.array(z.array(z.string())),
  cung_goc: z.string(),
});
export const VanHanOutput = z.object({
  engine_version: z.string(),
  ngay_xem: z.string(),
  nam_xem: z.number(),
  can_chi_nam_xem: z.string(),
  tuoi_mu: z.number(),
  dai_han: LopHan.extend({ tu_tuoi: z.number(), den_tuoi: z.number() }),
  tieu_han: z.object({ chi_so: z.number(), can: z.string(), chi: z.string(), cung_goc: z.string() }),
  luu_nien: LopHan,
});
export type VanHanOutputT = z.infer<typeof VanHanOutput>;

// TV-LN — lưu nguyệt cả năm âm (/v1/tuvi/luu-nguyet). Engine tính hết; web chỉ hiển thị.
export const LuuNguyetInput = z.object({
  la_so: ChartInput,
  nam_am: z.number().int().min(1900).max(2100).optional(),
});
const TenCung = z.object({ chi: z.string(), cung_goc: z.string() });
const ThangLuu = z.object({
  thang: z.number(), nhuan: z.boolean(), phan: z.enum(["ca_thang", "nua_dau", "nua_sau"]), thang_tinh: z.number(),
  ngay_am: z.array(z.number()), tu: z.string(), den: z.string(), can_chi: z.string(),
  chi: z.string(), cung_goc: z.string(), chu_de: z.string().nullable(),
  chinh_tinh: z.array(z.object({ ten: z.string(), do_sang: z.string().nullable(), tu_hoa_goc: z.string().nullable() })),
  phu_tinh: z.object({ cat: z.array(z.string()), sat: z.array(z.string()) }),
  tuan_triet: z.array(z.string()),
  tam_phuong: z.array(z.string()),
  tu_hoa_thang: z.array(z.object({ hoa: z.string(), sao: z.string(), cung_goc: z.string().nullable(),
    vao_cung_thang: z.boolean(), vao_tam_phuong: z.boolean() })),
  trung: z.array(z.enum(["dai_han", "luu_nien", "tieu_han"])),
  chieu: z.array(z.enum(["dai_han", "luu_nien", "tieu_han"])),
  xu_huong: z.object({ cat: z.array(z.string()), sat: z.array(z.string()), ket: z.string() }),
});
export const LuuNguyetOutput = z.object({
  engine_version: z.string(),
  nam_am: z.number(), can_chi_nam: z.string(),
  phai: z.enum(PHAI_LUU_NGUYET), phai_ten: z.string(), phai_cach_tinh: z.string(), phai_nguon: z.string(),
  thang_sinh: z.number(), gio_sinh: z.string(), thang_nhuan: z.string(), tuoi_mu: z.number(),
  han_nam: z.object({ dai_han: TenCung, luu_nien: TenCung, tieu_han: TenCung }),
  thang: z.array(ThangLuu),
  so_sanh_phai: z.record(z.object({ ten: z.string(), thang_gieng: TenCung, theo_thang: z.array(z.string()) })),
  cac_phai: z.record(z.object({ ten: z.string(), cach_tinh: z.string(), nguon: z.string() })),
  uu_tien: z.string(),
  luu_y: z.string(),
});
export type LuuNguyetOutputT = z.infer<typeof LuuNguyetOutput>;

// --------------------------------------------------------------------------- //
// TV-V2 (docs/NANG-CAP-TUVI-V2.md §3) — phi hoá, nhịp 3 tháng, hợp tham, định giờ sinh.
// Engine tính hết; web chỉ hiển thị. Output dùng .passthrough() để engine thêm trường không vỡ web.
// --------------------------------------------------------------------------- //
export const HOA = ["Lộc", "Quyền", "Khoa", "Kỵ"] as const;

export const PhiHoaInput = z.object({
  la_so: ChartInput,
  nam_xem: z.number().int().min(1900).max(2100).optional(),
});
const DuongBay = z.object({
  tu_cung: z.string(), can: z.string(), hoa: z.string(), sao: z.string(),
  den_cung: z.string().nullable(), xung_cung: z.string().nullable(),
  tu_hoa: z.boolean(), den_tuan_triet: z.array(z.string()).default([]), nghia: z.string().nullable().optional(),
}).passthrough();
export type DuongBayT = z.infer<typeof DuongBay>;
export const PhiHoaOutput = z.object({
  engine_version: z.string(),
  can_nam_sinh: z.string(),
  lai_nhan: z.object({ cung: z.string(), chi: z.string(), can: z.string() }).passthrough().nullable(),
  cung: z.array(z.object({ ten: z.string(), chi: z.string(), can: z.string(), la_menh: z.boolean(), la_lai_nhan: z.boolean() }).passthrough()),
  duong_bay: z.array(DuongBay),
  tu_hoa: z.array(DuongBay),
  vao_menh: z.array(DuongBay),
  noi_bat: z.array(z.object({
    loai: z.string(), duong: DuongBay, tieu_de: z.string(), nghia: z.string(),
    viec_nen_lam: z.string().nullable().optional(), cau_tu_soi: z.string().nullable().optional(),
    ghi_chu_tuan_triet: z.string().nullable().optional(),
    /** Căn cứ kỹ thuật (tên cung, sao, hoá, can) — chỉ hiện ở "Vì sao nói vậy"; lời trên thẻ là lời thường. */
    can_cu: z.array(z.string()).optional(),
  }).passthrough()).max(8),
  luu_nien: z.object({
    nam: z.number(), can_chi: z.string(),
    hoa: z.array(z.object({ hoa: z.string(), sao: z.string(), den_cung: z.string().nullable(), xung_cung: z.string().nullable() }).passthrough()),
  }).passthrough().nullable().optional(),
  phai: z.object({ ten: z.string(), ghi_chu: z.string().optional() }).passthrough().optional(),
  luu_y: z.array(z.string()).default([]),
  trang_thai: z.string().optional(),
  co_canh_bao: z.array(z.object({ loai: z.string(), chi_tiet: z.string() })).default([]),
}).passthrough();
export type PhiHoaOutputT = z.infer<typeof PhiHoaOutput>;

export const Nhip3ThangInput = z.object({
  la_so: ChartInput,
  ngay_xem: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});
const HoaGoc = z.object({ hoa: z.string(), sao: z.string(), cung_goc: z.string().nullable() }).passthrough();
const LuuNienNhip = z.object({ nam_am: z.number(), can_chi: z.string(), tu_hoa: z.array(HoaGoc) }).passthrough();
/** NHIP-2: hộp nổi bật của một tháng (khuôn Hop LG-ĐS; `nhan` = nhãn riêng "Điểm sáng" / "Nên để ý" / "Nên làm"). */
const HopThang = z.object({
  loai: z.enum(["diem_manh", "luu_y", "loi_khuyen"]), nhan: z.string(),
  tieu_de: z.string(), noi_dung: z.string(), huong_xu_ly: z.string().optional(),
  can_cu: z.array(z.string()).default([]), cung: z.string().nullable().optional(),
}).passthrough();
export type HopThangT = z.infer<typeof HopThang>;
export const Nhip3ThangOutput = z.object({
  engine_version: z.string(),
  ngay_xem: z.string(),
  phai_luu_nguyet: z.string(),
  ten_phai_luu_nguyet: z.string().optional(),
  luu_nien: LuuNienNhip,
  /** Có khi 3 tháng vắt sang năm âm sau: tứ hoá của năm âm kế tiếp (tháng có `nam_am` = năm này đọc theo nó). */
  luu_nien_sau: LuuNienNhip.optional(),
  /** NHIP-2: một câu so ba tháng (tháng nào thuận cho việc gì) — lời đời thường. Tuỳ chọn để chịu được engine cũ. */
  tom_tat_3_thang: z.string().optional(),
  /** 12 cung (tên, chi, nhãn đời thường ngắn) — vẽ vòng 12 cung mini. */
  cung: z.array(z.object({ ten: z.string(), chi: z.string(), nhan_ngan: z.string() }).passthrough()).optional(),
  thang: z.array(z.object({
    thang: z.number(), nhuan: z.boolean(), phan: z.string(), nam_am: z.number(), can_chi: z.string(),
    tu: z.string(), den: z.string(), cung_goc: z.string(), chu_de: z.string().nullable(),
    muc: z.enum(["thuan", "binh", "can_than"]), nhan_muc: z.string(),
    ly_do: z.array(z.object({ ma: z.string(), noi_dung: z.string() }).passthrough()),
    tu_hoa_thang: z.array(HoaGoc),
    goi_y: z.string().nullable(), cau_tu_soi: z.string().nullable(),
    // NHIP-2 — lời riêng từng tháng (không thuật ngữ) + học thuật tách riêng trong can_cu ("Vì sao nói vậy").
    nhan_thang: z.string().optional(),
    tieu_de_thang: z.string().optional(),
    chu_de_thang: z.string().optional(),
    hop: z.array(HopThang).optional(),
    can_cu: z.array(z.string()).optional(),
    diem_sang: z.string().nullable().optional(),
    de_y: z.string().nullable().optional(),
    noi_tiep: z.boolean().optional(),
  }).passthrough()).length(3),
  /** Thứ tự ưu tiên khi các lớp hạn mâu thuẫn (đại hạn > lưu niên > tiểu hạn > lưu nguyệt) + cung hạn của năm. */
  uu_tien: z.object({
    thu_tu: z.array(z.string()),
    ghi_chu: z.string(),
    han_nam: z.object({ dai_han: TenCung, luu_nien: TenCung, tieu_han: TenCung }).passthrough().optional(),
  }).passthrough().optional(),
  luu_y: z.union([z.string(), z.array(z.string())]).optional(),
  co_canh_bao: z.array(z.object({ loai: z.string(), chi_tiet: z.string() })).default([]),
}).passthrough();
export type Nhip3ThangOutputT = z.infer<typeof Nhip3ThangOutput>;

export const QUAN_HE_HOP_THAM = ["nguoi_yeu", "vo_chong", "ban_be", "dong_nghiep", "doi_tac", "sep", "cha_me_con", "gia_dinh"] as const;
export const HopThamInput = z.object({
  la_so: ChartInput,
  nguoi_kia: z.object({
    birth_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Định dạng YYYY-MM-DD"),
    calendar_type: z.enum(["duong", "am"]).optional(),
    am_nhuan: z.boolean().optional(),
    birth_time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    gender: z.enum(["nam", "nu"]).optional(),
    noi_sinh: z.string().regex(/^[a-z0-9_-]{2,40}$/).optional(),
    vung: z.enum(["north", "south"]).optional(),
  }),
  quan_he: z.enum(QUAN_HE_HOP_THAM).default("nguoi_yeu"),
});
const HoaVao = z.object({
  hoa: z.string(), sao: z.string(), den_cung: z.string().nullable(), xung_cung: z.string().nullable(),
  nghia: z.string().nullable().optional(),
}).passthrough();
export type HoaVaoT = z.infer<typeof HoaVao>;
// HN-2N — "Xem lá số 2 người": điểm tham khảo 0–100 (engine luangiai/tuvi_hai_nguoi.py, luật `hai_nguoi_1`).
// Web chỉ hiển thị, không tự tính.
export const MUC_DIEM_HAI_NGUOI = ["de_hoa_hop", "hop_neu_hieu", "can_dung_hoa_nhieu", "nhieu_khac_biet"] as const;
export const KET_LUAN_TIEU_CHI = ["hop", "binh_hoa", "can_dung_hoa"] as const;
const HopDiem = z.object({
  loai: z.enum(["diem_manh", "luu_y"]),
  tieu_de: z.string(), noi_dung: z.string(),
  can_cu: z.array(z.string()).default([]),
  ma_mau: z.string().regex(/^[a-z0-9_.+-]{3,60}$/).optional(),
  huong_xu_ly: z.string().optional(),
}).passthrough();
const TieuChiDiem = z.object({
  ma: z.enum(["menh", "can", "chi", "cung_phi", "tu_vi"]),
  ten: z.string(), mo_ta: z.string().nullable().optional(),
  tinh: z.boolean(),
  diem: z.number().int().min(0).max(100), toi_da: z.number().int().min(0).max(100),
  ty_le: z.number().min(0).max(1).nullable(),
  loai: z.string(),
  ket_luan: z.enum(KET_LUAN_TIEU_CHI).nullable(), nhan_ket_luan: z.string().nullable(),
  giai_thich: z.string(),
  can_cu: z.array(z.string()).default([]),
  chieu: z.string().optional(),
}).passthrough();
export const DiemHaiNguoi = z.object({
  phien_ban: z.string(),
  tong: z.number().int().min(0).max(100), toi_da: z.literal(100),
  muc: z.enum(MUC_DIEM_HAI_NGUOI), nhan_muc: z.string(), mo_ta_muc: z.string(),
  tieu_chi: z.array(TieuChiDiem).min(1),
  diem_manh: z.array(HopDiem).max(3).default([]),
  can_dung_hoa: z.array(HopDiem).max(3).default([]),
  goi_y: z.array(z.string()).default([]),
  loi_dan: z.string(),
  hai_chieu: z.boolean().default(false),
}).passthrough();
export type DiemHaiNguoiT = z.infer<typeof DiemHaiNguoi>;
export type TieuChiDiemT = z.infer<typeof TieuChiDiem>;
export const HopThamOutput = z.object({
  engine_version: z.string(),
  quan_he: z.string(), nhan_quan_he: z.string(),
  can_nam_nguoi_kia: z.string(),
  can_menh_nguoi_kia: z.string().nullable().optional(),
  nguoi_kia_vao_ban: z.array(HoaVao),
  ban_vao_nguoi_kia: z.array(HoaVao).nullable().optional(),
  menh_nguoi_kia_vao_ban: z.array(HoaVao).nullable().optional(),
  tom_tat: z.array(z.string()).default([]),
  luu_y: z.array(z.string()).default([]),
  diem: DiemHaiNguoi.nullable().optional(),
  khong_cham_diem: z.boolean(),
}).passthrough();
export type HopThamOutputT = z.infer<typeof HopThamOutput>;

export const DinhGioInput = z.object({
  la_so: ChartInput,
  nam_doi_chieu: z.array(z.number().int().min(1900).max(2100)).max(3).optional(),
  tat_ca_gio: z.boolean().optional(),
});
export const DinhGioOutput = z.object({
  engine_version: z.string(),
  ly_do: z.array(z.string()),
  ung_vien: z.array(z.object({
    nhan: z.string(), chi_gio: z.string(),
    /** Khoảng giờ của canh theo kinh tuyến lịch UTC+7 (Tử vi chia canh theo giờ này). */
    khoang_gio: z.string(),
    /** Cùng canh đó trên ĐỒNG HỒ nơi sinh (lệch khi múi giờ lịch sử ≠ UTC+7, giờ mùa hè…). Optional: engine cũ. */
    khoang_gio_dong_ho: z.string().optional(),
    lech_gio_lich: z.boolean().optional(),
    /** Chỉ ứng viên "Giờ Tý muộn" (chế độ 12 canh: giờ đồng hồ nhập 23:xx, hoặc 00:xx khi đồng hồ chạy sớm hơn giờ lịch). */
    ghi_chu: z.string().optional(),
    /** Ngày dương theo ĐỒNG HỒ người dùng (ISO) — web hiện ngày khi khác ngày đã nhập. Optional: engine cũ. */
    ngay_duong: z.string().optional(),
    gio_dai_dien: z.string(),
    la_gio_nhap: z.boolean(),
    cung_menh: z.object({ chi: z.string(), chinh_tinh: z.array(z.string()) }).passthrough(),
    cuc: z.string(), than_cu: z.string(),
    /** Ngày giờ dương lịch theo ĐỒNG HỒ nơi sinh của ứng viên (để người dùng tự nhập lại vào hồ sơ). */
    dau_vao: z.object({ birth_date: z.string(), birth_time: z.string(), calendar_type: z.string() }).passthrough().optional(),
    nam: z.array(z.object({
      nam: z.number(), can_chi: z.string(),
      /** `cach`: "nhap" = hoá bay vào cung đó, "chieu" = Hoá Kỵ chiếu sang từ cung đối diện. */
      cau_hoi: z.array(z.object({ hoa: z.string(), cung: z.string(), cach: z.enum(["nhap", "chieu"]).optional(), noi_dung: z.string() }).passthrough()),
    }).passthrough()),
  }).passthrough()).min(1).max(13),   // 12 canh + "Giờ Tý muộn" khi giờ nhập 23:xx
  khac_nhau: z.array(z.string()).default([]),
  /** Vì sao đồng hồ nơi sinh lệch giờ lịch: "mui_gio_lich_su" | "gio_mua_he" | "nuoc_ngoai"; null = không lệch.
   *  Để chuỗi (không enum) — mã mới của engine không làm vỡ cả khối; web chỉ hiện câu cho mã đã biết. */
  ly_do_lech: z.string().nullable().optional(),
  nam_doi_chieu: z.array(z.number()).optional(),
  loi_dan: z.string().optional(),
  luu_y: z.array(z.string()).default([]),
  co_canh_bao: z.array(z.object({ loai: z.string(), chi_tiet: z.string() })).default([]),
}).passthrough();
export type DinhGioOutputT = z.infer<typeof DinhGioOutput>;
