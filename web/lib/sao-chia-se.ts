// CHANG-4 — máy chủ đọc lại cung Mặt Trời / Mặt Trăng / Mọc qua engine `/v1/chiem-tinh/ban-do` (không tự tính) để ký thẻ
// chia sẻ Chiêm tinh. Chỉ chạy ở MÁY CHỦ (route /api/chia-se/sao, /api/chia-se/sao2). Ngày sinh chỉ đi qua lượt gọi này,
// không vào mã, không ghi log.
// Chưa rõ giờ sinh: engine lập bản đồ theo giờ giữa ngày, nhưng Mặt Trăng (và hiếm khi Mặt Trời ở ngày giao cung) có thể đổi
// cung trong ngày → hỏi engine thêm lúc 00:00 và 23:59; hai đầu ngày khác cung thì để trống cung đó (không đoán).
import { z } from "zod";
import type { NextResponse } from "next/server";
import { goiEngineDaKiem } from "@/lib/proxy";
import { CUNG_12 } from "@/lib/the-sao";

export const NguoiSao = z.object({
  ngay_sinh: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  gio_sinh: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).nullable().optional(),
  gioi_tinh: z.enum(["nam", "nu"]).optional(),
  noi_sinh: z.string().trim().regex(/^[A-Za-z0-9_+\-\/]{2,60}$/).nullable().optional(),
  vung_vn: z.enum(["north", "south"]).optional(),
}).strict();
export type NguoiSao = z.infer<typeof NguoiSao>;

export type Cung = [(typeof CUNG_12)[number], string];
export interface BaCung { s: Cung | null; m: Cung | null; a: Cung | null }

const HanhTinh = z.object({ ma: z.string(), cung_ma: z.enum(CUNG_12), cung_ten: z.string().min(1).max(16) }).passthrough();
const BanDo = z.object({
  co_gio_sinh: z.boolean().optional(),
  hanh_tinh: z.array(HanhTinh).optional(),
  truc: z.object({ asc: z.object({ cung: z.enum(CUNG_12), cung_ten: z.string().min(1).max(16) }).passthrough() }).passthrough().nullable().optional(),
  chuyen_huong_tuoi: z.unknown().optional(),
}).passthrough();

async function mot(n: NguoiSao, gio: string | null, hdr: Record<string, string>) {
  const r = await goiEngineDaKiem({ ...n, gio_sinh: gio, kem_cau_noi_dong_tay: false }, "/v1/chiem-tinh/ban-do", hdr);
  if (!r.ok) return r;
  const b = BanDo.safeParse(r.body);
  return b.success ? { ok: true as const, body: b.data } : { ok: true as const, body: null };
}

const cung = (bd: z.infer<typeof BanDo> | null, ma: string): Cung | null => {
  const h = bd?.hanh_tinh?.find((x) => x.ma === ma);
  return h ? [h.cung_ma, h.cung_ten] : null;
};

/** Ba cung của một người. `tuoi` = engine từ chối vì chưa đủ tuổi người lớn (chuyển hướng); `res` = lỗi engine. */
export async function baCung(n: NguoiSao, hdr: Record<string, string>):
  Promise<{ ok: true; cung: BaCung } | { ok: false; res?: NextResponse; tuoi?: boolean }> {
  const gio = n.gio_sinh ?? null;
  const chinh = await mot(n, gio, hdr);
  if (!chinh.ok) return { ok: false, res: chinh.res };
  const bd = chinh.body;
  if (!bd || bd.chuyen_huong_tuoi || !bd.hanh_tinh?.length) return { ok: false, tuoi: Boolean(bd?.chuyen_huong_tuoi) };
  let s = cung(bd, "mat_troi"), m = cung(bd, "mat_trang");
  if (!gio) {
    const [dau, cuoi] = await Promise.all([mot(n, "00:00", hdr), mot(n, "23:59", hdr)]);
    const ok = (a: typeof dau) => (a.ok ? a.body : null);
    const giu = (ma: string, c: Cung | null) => {
      const x = cung(ok(dau), ma), y = cung(ok(cuoi), ma);
      return c && x && y && x[0] === c[0] && y[0] === c[0] ? c : null;
    };
    s = giu("mat_troi", s);
    m = giu("mat_trang", m);
  }
  const asc = gio && bd.co_gio_sinh && bd.truc?.asc ? [bd.truc.asc.cung, bd.truc.asc.cung_ten] as Cung : null;
  return { ok: true, cung: { s, m, a: asc } };
}
