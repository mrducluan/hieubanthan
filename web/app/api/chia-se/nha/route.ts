// POST /api/chia-se/nha — UI-PT2 P7: mã có KÝ cho thẻ "Nhà của bạn". Máy chủ tự gọi engine đọc lại bài (client không tự
// khai mức được) rồi ký: mã CHỈ mang tên hiển thị, hướng nhà (8 hướng), loại nhà, mức chương "Ngôi nhà này với bạn" và
// ≤ 6 phòng [phòng, phương, mức]. Độ la bàn, năm xây, năm sinh, người cùng ở, toạ độ chỉ đi qua lượt gọi để engine tính —
// không ghi vào mã, không lưu.
import { NextResponse } from "next/server";
import { z } from "zod";
import { dauNguoiGoi, goiEngineDaKiem } from "@/lib/proxy";
import { LuanGiaiPTZ } from "@/lib/bo-cuc-zod";
import { CUNG_9, HUONG_8, kyMaNha, LOAI_NHA_THE, MUC_THE, PHONG_THE, tuTuMa } from "@/lib/ma-moi";

// `loai_nha_the`: loại nhà chọn ở Hành trình khi hồ sơ chưa có bố cục (Khảo sát) — chỉ để ghi nhãn thẻ, không vào lời gọi engine.
const Input = LuanGiaiPTZ.extend({ ten_hien_thi: z.string().trim().max(24).default(""), loai_nha_the: z.enum(LOAI_NHA_THE).nullable().optional() });

const BaoCao = z.object({
  da_tinh: z.object({ huong_nha: z.string().nullable() }).passthrough(),
  chuong: z.array(z.object({
    ma: z.string(), muc: z.string().nullable().optional(),
    phong: z.array(z.object({ phong: z.string(), cung: z.string(), muc: z.string().nullable().optional() })).optional(),
  }).passthrough()),
}).passthrough();

const trong = <T extends readonly string[]>(ds: T, v: string | null | undefined): T[number] | null =>
  v != null && (ds as readonly string[]).includes(v) ? (v as T[number]) : null;

export async function POST(req: Request): Promise<NextResponse> {
  const p = Input.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "Đầu vào không hợp lệ" }, { status: 422 });
  const { ten_hien_thi, loai_nha_the, ...yc } = p.data;
  const r = await goiEngineDaKiem(yc, "/v1/phongthuy/luan-giai", dauNguoiGoi(req));
  if (!r.ok) return r.res;
  const bc = BaoCao.safeParse(r.body);
  const h = bc.success ? trong(HUONG_8, bc.data.da_tinh.huong_nha) : null;
  if (!bc.success || !h) return NextResponse.json({ error: "Thẻ cần có hướng nhà — đo hoặc chọn hướng rồi đọc lại." }, { status: 422 });
  const cNha = bc.data.chuong.find((c) => c.ma === "ngoi_nha_voi_ban");
  const cPhong = bc.data.chuong.find((c) => c.ma === "tung_phong");
  const phong = (cPhong?.phong ?? [])
    .map((x) => [trong(PHONG_THE, x.phong), trong(CUNG_9, x.cung), trong(MUC_THE, x.muc ?? null)] as const)
    .filter((x): x is [(typeof PHONG_THE)[number], (typeof CUNG_9)[number], (typeof MUC_THE)[number] | null] => x[0] != null && x[1] != null)
    .slice(0, 6);
  try {
    const ma = kyMaNha({ t: ten_hien_thi, h, l: trong(LOAI_NHA_THE, yc.nha.bo_cuc?.loai_nha ?? loai_nha_the ?? null), m: trong(MUC_THE, cNha?.muc ?? null), p: phong });
    return NextResponse.json({ ma, tu: tuTuMa("nh", ma) });
  } catch (e) {
    const msg = e instanceof Error && e.message.includes("LOI_MOI_SECRET") ? e.message : "Chưa tạo được thẻ.";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
