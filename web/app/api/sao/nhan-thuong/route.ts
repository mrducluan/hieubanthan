// SAO-GL (migration 0026) — nhận thưởng mời (?gt=) bằng phiên người dùng + mã băm thiết bị do máy chủ tính.
//   POST {ma}: chưa đăng nhập → 401 · mã sai định dạng → {ket_qua: "khong_hop_le"} · còn lại = kết quả hàm SQL
//   nhan_thuong_gioi_thieu(p_ma, p_thiet_bi). Hàm SQL tự kiểm mọi điều kiện + chống nhận hai lần; route chỉ thêm tín hiệu
//   thiết bị (HMAC(IP + user-agent), không lưu IP). Chưa chạy 0026 (hàm 2 tham số chưa có) → gọi lại không kèm thiết bị.
import { NextResponse } from "next/server";
import { maThietBi, phienNguoiDung } from "@/lib/cua-sao";

export const dynamic = "force-dynamic";
const KHONG_CACHE = { headers: { "cache-control": "private, no-store" } };

export async function POST(req: Request) {
  const b = (await req.json().catch(() => null)) as { ma?: unknown } | null;
  const ma = typeof b?.ma === "string" ? b.ma : "";
  if (!/^[a-z0-9]{8}$/.test(ma)) return NextResponse.json({ ket_qua: "khong_hop_le" }, KHONG_CACHE);
  const phien = await phienNguoiDung().catch(() => null);
  if (!phien) return NextResponse.json({ error: "Đăng nhập để nhận Sao." }, { status: 401, ...KHONG_CACHE });
  const tb = maThietBi(req);
  let { data, error } = await phien.sb.rpc("nhan_thuong_gioi_thieu", tb ? { p_ma: ma, p_thiet_bi: tb } : { p_ma: ma });
  if (error && tb && error.code === "PGRST202") {
    ({ data, error } = await phien.sb.rpc("nhan_thuong_gioi_thieu", { p_ma: ma }));   // 0026 chưa chạy
  }
  if (error || !data) return NextResponse.json({ error: "Chưa nhận được Sao giới thiệu." }, { status: 502, ...KHONG_CACHE });
  const d = data as { ket_qua?: string; sao?: number; thuong_nguoi_moi?: boolean };
  return NextResponse.json({ ket_qua: d.ket_qua, sao: d.sao ?? 0 }, KHONG_CACHE);
}
