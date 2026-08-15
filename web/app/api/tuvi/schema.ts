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
  mui_gio_dong_ho: z.number(),
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
