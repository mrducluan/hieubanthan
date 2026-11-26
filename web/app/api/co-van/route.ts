// POST /api/co-van — Chặng 2: Cổng Cố vấn Liên mảng Tam Tài (Nhân · Thiên · Địa, thích nghi 3 Bậc đầu vào).
// Đi qua `luanGiaiCoSao` (mô-đun "tam_tai"): chương 1 + kết luận 5 giây + 3 trụ + biểu đồ 5 hành mở miễn phí;
// các chương chi tiết sau và phụ lục mở bằng Sao khi công tắc thu Sao chung bật (cắt sạch phía máy chủ qua Allowlist SAO-2 v2.0).
import { z } from "zod";
import { themHocLuanGiai } from "@/lib/hoc-tuvi";
import { luanGiaiCoSao } from "@/lib/luan-giai-sao";

const NhaCoVan = z.object({
  do_huong: z.number().min(0).lt(360),
  nam_xay: z.number().int().min(1864).max(2043).nullable().optional(),
}).strict();

const DoiTacCoVan = z.object({
  ngay_sinh: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  gioi_tinh: z.enum(["nam", "nu"]).default("nam"),
  vai_tro: z.enum(["nguoi_thuong", "gop_von", "cong_su"]).default("cong_su"),
}).strict();

const Input = z.object({
  cau_hoi: z.string().trim().min(3).max(500),
  ngay_sinh: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  gioi_tinh: z.enum(["nam", "nu"]).default("nam"),
  gio_sinh: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).nullable().optional(),
  do_tin_gio: z.enum(["exact", "approx", "unknown"]).default("unknown"),
  noi_sinh: z.string().trim().max(60).nullable().optional(),
  nha: NhaCoVan.nullable().optional(),
  doi_tac: DoiTacCoVan.nullable().optional(),
  che_do: z.enum(["doi_song", "kinh_doanh"]).default("doi_song"),
  ngay_xem: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
}).strict();

const khoaCoVan = (d: Record<string, unknown>) => [
  d.ngay_sinh,
  d.gioi_tinh ?? "nam",
  d.gio_sinh ?? "",
  d.che_do ?? "doi_song",
];

export const maxDuration = 30;

export function POST(req: Request) {
  return luanGiaiCoSao(
    req,
    Input,
    "/v1/co-van",
    "tam_tai",
    khoaCoVan,
    () => themHocLuanGiai({ loai: "doi_song", tienTo: "ds.tam_tai." }),
  );
}
