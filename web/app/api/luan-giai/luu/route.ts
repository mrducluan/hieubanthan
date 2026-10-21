// /api/luan-giai/luu — LG-ĐS: bài luận người dùng CHỦ ĐỘNG lưu (migration 0017, bảng luan_giai_luu).
//   POST {mo_dun, tieu_de, noi_dung} → {id}   ·   GET → {ds: [{id, mo_dun, tieu_de, tao_luc}]}
// Chạy bằng phiên CHÍNH người dùng (RLS chủ sở hữu) — không service role. Bắt buộc đăng nhập; ≤ 256 KB / bài,
// ≤ 100 bài (SQL chặn), tự hết hạn 365 ngày, xoá ngay ở /api/luan-giai/luu/{id}. Chưa bật tài khoản → {ok:false, ly_do:"chua_bat"}.
import { NextResponse } from "next/server";
import { z } from "zod";
import { coTaiKhoan, phienNguoiDung } from "@/lib/cua-sao";
import { khacNguon } from "@/lib/hoc-tuvi";

const TRAN_BAI = 256 * 1024;

const Input = z.object({
  mo_dun: z.string().regex(/^[a-z0-9_]{2,20}$/),
  tieu_de: z.string().trim().min(1).max(200),
  noi_dung: z.record(z.string(), z.unknown()),
}).strict();

const CHUA_BAT = { ok: false, ly_do: "chua_bat" } as const;
const CAN_DANG_NHAP = { error: "Đăng nhập để lưu bài luận.", can: "dang_nhap" } as const;

export async function POST(req: Request) {
  if (khacNguon(req)) return NextResponse.json({ error: "Sai nguồn gửi." }, { status: 403 });
  if (!coTaiKhoan()) return NextResponse.json(CHUA_BAT);
  const tho = await req.text().catch(() => "");
  if (Buffer.byteLength(tho) > TRAN_BAI + 4096) return NextResponse.json({ error: "Bài quá dài để lưu (tối đa 256 KB)." }, { status: 413 });
  let json: unknown = null;
  try { json = JSON.parse(tho); } catch { /* để zod báo */ }
  const vao = Input.safeParse(json);
  if (!vao.success) return NextResponse.json({ error: "Đầu vào không hợp lệ" }, { status: 422 });
  if (Buffer.byteLength(JSON.stringify(vao.data.noi_dung)) > TRAN_BAI) {
    return NextResponse.json({ error: "Bài quá dài để lưu (tối đa 256 KB)." }, { status: 413 });
  }
  const phien = await phienNguoiDung();
  if (!phien) return NextResponse.json(CAN_DANG_NHAP, { status: 401 });
  const ev = vao.data.noi_dung.engine_version;
  const { data, error } = await phien.sb.from("luan_giai_luu").insert({
    mo_dun: vao.data.mo_dun, tieu_de: vao.data.tieu_de, noi_dung: vao.data.noi_dung,
    engine_version: typeof ev === "string" ? ev.slice(0, 20) : null,
  }).select("id").single();
  if (error) {
    if (error.message?.includes("qua_100_bai")) {
      return NextResponse.json({ error: "Bạn đã lưu 100 bài — xoá bớt bài cũ để lưu bài mới.", can: "xoa_bot" }, { status: 409 });
    }
    if (error.message?.includes("bai_qua_lon")) return NextResponse.json({ error: "Bài quá dài để lưu (tối đa 256 KB)." }, { status: 413 });
    return NextResponse.json(CHUA_BAT);
  }
  return NextResponse.json({ ok: true, id: (data as { id: string }).id });
}

export async function GET() {
  if (!coTaiKhoan()) return NextResponse.json({ ...CHUA_BAT, ds: [] });
  const phien = await phienNguoiDung();
  if (!phien) return NextResponse.json(CAN_DANG_NHAP, { status: 401 });
  const { data, error } = await phien.sb.from("luan_giai_luu").select("id, mo_dun, tieu_de, tao_luc")
    .order("tao_luc", { ascending: false }).limit(100);
  if (error) return NextResponse.json({ ...CHUA_BAT, ds: [] });
  return NextResponse.json({ ok: true, ds: data ?? [] }, { headers: { "cache-control": "private, no-store" } });
}
