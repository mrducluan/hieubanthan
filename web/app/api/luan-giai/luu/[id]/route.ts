// /api/luan-giai/luu/{id} — đọc lại (GET) hoặc xoá ngay (DELETE) một bài luận đã lưu. RLS: chỉ chủ sở hữu thấy/xoá.
import { NextResponse } from "next/server";
import { z } from "zod";
import { coTaiKhoan, phienNguoiDung } from "@/lib/cua-sao";
import { khacNguon } from "@/lib/hoc-tuvi";

const Id = z.string().uuid();
type Ctx = { params: Promise<{ id: string }> };

async function chuan(ctx: Ctx) {
  if (!coTaiKhoan()) return { res: NextResponse.json({ ok: false, ly_do: "chua_bat" }) };
  const id = Id.safeParse((await ctx.params).id);
  if (!id.success) return { res: NextResponse.json({ error: "Mã bài không hợp lệ" }, { status: 422 }) };
  const phien = await phienNguoiDung();
  if (!phien) return { res: NextResponse.json({ error: "Đăng nhập để xem bài đã lưu.", can: "dang_nhap" }, { status: 401 }) };
  return { id: id.data, phien };
}

export async function GET(_req: Request, ctx: Ctx) {
  const c = await chuan(ctx);
  if ("res" in c) return c.res;
  const { data, error } = await c.phien.sb.from("luan_giai_luu")
    .select("id, mo_dun, tieu_de, noi_dung, engine_version, tao_luc, het_han").eq("id", c.id).maybeSingle();
  if (error) return NextResponse.json({ ok: false, ly_do: "chua_bat" });
  if (!data) return NextResponse.json({ error: "Không tìm thấy bài (đã xoá hoặc hết hạn)." }, { status: 404 });
  return NextResponse.json({ ok: true, bai: data }, { headers: { "cache-control": "private, no-store" } });
}

export async function DELETE(req: Request, ctx: Ctx) {
  if (khacNguon(req)) return NextResponse.json({ error: "Sai nguồn gửi." }, { status: 403 });
  const c = await chuan(ctx);
  if ("res" in c) return c.res;
  const { data, error } = await c.phien.sb.from("luan_giai_luu").delete().eq("id", c.id).select("id");
  if (error) return NextResponse.json({ ok: false, ly_do: "chua_bat" });
  return NextResponse.json({ ok: true, da_xoa: (data ?? []).length > 0 });
}
