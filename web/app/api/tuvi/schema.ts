// SPEC-004a — schema vào/ra của /api/tuvi/chart, validate bằng zod.
// Bản JSON Schema người-đọc-được nằm cạnh: chart.schema.json (v0, nháp chờ duyệt).
//
// pham_vi = "tuan_triet_only": đây CHƯA phải lá số an sao đầy đủ. Engine an sao
// (14 chính tinh, 12 cung) là SPEC-005 — chờ quyết định nguồn tri thức.
import { z } from "zod";

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
});
export type ChartInputT = z.infer<typeof ChartInput>;

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
  dai_han: z.object({ tu_tuoi: z.number(), den_tuoi: z.number() }),
  tieu_han_tuoi: z.array(z.number()),
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
  cung: z.array(Cung).length(12),
  co_canh_bao: z.array(z.object({ loai: z.string(), chi_tiet: z.string() })),
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
