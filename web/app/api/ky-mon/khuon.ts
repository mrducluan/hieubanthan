import { z } from "zod";
import { VIEC_KM } from "@/lib/ky-mon";

const chung = {
  utc: z.number().min(-12).max(14).refine((x) => Number.isInteger(x * 4)).optional(),
  phep: z.enum(["sach_bo", "tri_nhuan"]).optional(),
  gio_ty: z.enum(["da_ty", "sang_ngay"]).optional(),
  viec: z.enum(VIEC_KM).optional(),
  huong_hop: z.array(z.enum(["Bắc", "Đông Bắc", "Đông", "Đông Nam", "Nam", "Tây Nam", "Tây", "Tây Bắc"])).max(8).optional(),
};
export const BanIn = z.object({ ...chung, thoi_diem: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/).optional() }).strict();
export const NgayIn = z.object({ ...chung, ngay: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional() }).strict();
