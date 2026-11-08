// POST /api/chia-se/tarot — TR-3: mã có KÝ cho thẻ "Câu trả lời của lá bài". Máy chủ gọi engine `/v1/tarot/the` với các lá đã
// rút + MÃ ý định / loại việc / lĩnh vực (danh mục engine) để đọc lại nghiêng, tên lá, tên vị trí rồi ký — client không tự khai.
// Mã KHÔNG mang câu hỏi người dùng gõ, KHÔNG ngày sinh, KHÔNG lời đọc từng lá.
import { NextResponse } from "next/server";
import { z } from "zod";
import { dauNguoiGoi, goiEngineDaKiem } from "@/lib/proxy";
import { kyMaTarot, tuTuMa } from "@/lib/ma-moi";
import { traLoiChiaSe } from "@/lib/loi-chia-se";

const MA = /^[a-z_]{3,20}$/;
const Input = z.object({
  trai_bai: z.enum(["mot_la", "ba_la_thoi_gian", "ba_la_loi_khuyen", "nam_la", "celtic", "hai_lua_chon", "khi_nao"]),
  la: z.array(z.object({ id: z.string().regex(/^[a-z]{3,4}_[a-z0-9_]{1,12}$/), nguoc: z.boolean() }).strict()).min(1).max(10),
  y_dinh: z.string().regex(MA),
  viec: z.string().regex(MA).nullable().optional(),
  linh_vuc: z.enum(["tinh_cam", "cong_viec", "tien_bac", "suc_khoe"]).nullable().optional(),
  ten_hien_thi: z.string().trim().max(24).default(""),
}).strict();

const The = z.object({
  tieu_de: z.string().min(1).max(40), nghieng: z.enum(["tien", "dieu_kien", "cho"]), cau_dau: z.string().min(1).max(200),
  nhan_viec: z.string().max(60).nullable(),
  la: z.array(z.object({ id: z.string(), nguoc: z.boolean(), ten: z.string().min(1).max(24), vi_tri: z.string().min(1).max(40) }).passthrough()).min(1).max(10),
}).passthrough();

export async function POST(req: Request): Promise<NextResponse> {
  const p = Input.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "Đầu vào không hợp lệ" }, { status: 422 });
  const { trai_bai, la, y_dinh, viec, linh_vuc, ten_hien_thi } = p.data;
  const r = await goiEngineDaKiem({ trai_bai, la, y_dinh, ...(viec ? { viec } : {}), ...(linh_vuc ? { linh_vuc } : {}) }, "/v1/tarot/the", dauNguoiGoi(req));
  if (!r.ok) return r.res;
  const t = The.safeParse(r.body);
  if (!t.success) return NextResponse.json({ error: "Chưa đọc lại được trải bài." }, { status: 502 });
  try {
    const ma = kyMaTarot({
      t: ten_hien_thi, b: trai_bai, l: t.data.la.map((x) => [x.id, x.nguoc, x.ten, x.vi_tri] as [string, boolean, string, string]),
      y: y_dinh, n: t.data.nghieng, h: t.data.tieu_de, c: t.data.cau_dau, w: t.data.nhan_viec,
    });
    return NextResponse.json({ ma, tu: tuTuMa("ta", ma) });
  } catch (e) {
    return traLoiChiaSe(e, "tarot");
  }
}
