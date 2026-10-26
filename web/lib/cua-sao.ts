// SAO-2 — "cửa Sao" phía MÁY CHỦ: ai được dùng miễn phí, khi nào cần đăng nhập, khi nào trừ Sao.
// Quy tắc (đặt ở /quan-tri/cai-dat, mặc định TẮT → mọi thứ miễn phí như trước):
//   Hỏi đáp: khách N câu/ngày, có tài khoản M câu/ngày (tính chung mọi mảng, giờ VN). Hết lượt:
//     khách → mời đăng nhập (nhận Sao chào mừng) · có tài khoản → mỗi câu tốn G Sao, người dùng bấm đồng ý từng câu
//     (header x-dong-y-sao: 1). SEC-2: trừ Sao TRƯỚC khi gọi engine (khoá mỗi câu) rồi HOÀN nếu engine không trả lời
//     được (migration 0024 `hoan_sao_hoi`) — trước đây trừ sau → N yêu cầu song song với 1 Sao được N câu.
//   Câu khủng hoảng / ngoài phạm vi (engine /v1/hoi/dac-biet) KHÔNG bao giờ bị chặn hay trừ Sao.
//   Không đếm được (thiếu Supabase service role / bí mật) → mở (fail-open): thà cho hỏi miễn phí còn hơn chặn nhầm.
// Không lưu câu hỏi, không lưu IP: khoá khách = HMAC(IP) bằng bí mật máy chủ, chỉ sống trong bảng đếm theo ngày.
import { createHmac, randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { after, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { layCauHinh } from "@/lib/cau-hinh";
import { baoLoi } from "@/lib/giam-sat";
import { khachDichVu } from "@/lib/thanh-toan/cong";
import { goiEngineDaKiem } from "@/lib/proxy";

export const coTaiKhoan = () => Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
export const biMat = () => {
  const s = process.env.SAO_KHOA_SECRET || process.env.LOI_MOI_SECRET;
  return s && s.length >= 16 ? s : null;
};

/** Phiên người dùng từ cookie (RLS chính chủ). Chưa bật tài khoản / chưa đăng nhập → null. */
export async function phienNguoiDung(): Promise<{ sb: SupabaseClient; user: User } | null> {
  if (!coTaiKhoan()) return null;
  const kho = await cookies();
  const sb = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: { getAll: () => kho.getAll(), setAll: () => { /* route chỉ đọc phiên */ } },
  });
  const { data: { user } } = await sb.auth.getUser();
  return user ? { sb, user } : null;
}

/** Tài khoản chưa nhận Sao chào mừng → số Sao sẽ nhận (để hộp "nạp" mời lưu hồ sơ trước); đã nhận / lỗi → null. */
export async function chaoMungConNhan(phien: { sb: SupabaseClient; user: User }): Promise<number | null> {
  const thuong = await layCauHinh<number>("sao.thuong.chao_mung");
  if (!thuong) return null;
  const { data, error } = await phien.sb.from("so_cai_sao").select("id").eq("khoa", `chao_mung:${phien.user.id}`).limit(1);
  return error || data?.length ? null : thuong;
}

/** Khoá đếm lượt của khách: HMAC(IP) — không lưu IP. Không có bí mật → null (không đếm). */
export function khoaKhach(req: Request, bi = biMat()): string | null {
  const ip = req.headers.get("x-real-ip") ?? req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "";
  return bi && ip ? `k:${createHmac("sha256", bi).update(`luot-hoi|${ip}`).digest("hex").slice(0, 32)}` : null;
}

/** SAO-GL (0026): mã băm thiết bị = HMAC(IP + user-agent) bằng bí mật máy chủ — không lưu IP / user-agent, người dùng
 *  không tự tính được. Dùng khi nhận thưởng mời để phát hiện một máy tạo nhiều tài khoản. Thiếu bí mật / IP → null
 *  (không chặn, như trước). */
export function maThietBi(req: Request, bi = biMat()): string | null {
  const ip = req.headers.get("x-real-ip") ?? req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "";
  const ua = (req.headers.get("user-agent") ?? "").slice(0, 300);
  return bi && ip ? createHmac("sha256", bi).update(`thiet-bi|${ip}|${ua}`).digest("hex").slice(0, 32) : null;
}

export type LuotHoi = { con_lai: number; tran: number; tai_khoan: boolean } | { sao_da_tru: number; so_du: number | null };
type Cua = { ok: true; luot?: LuotHoi; xong: () => Promise<LuotHoi | undefined>; hoan?: () => Promise<void> } | { ok: false; res: NextResponse };

const MO: Cua = { ok: true, xong: async () => undefined };

/** Câu khủng hoảng / ngoài phạm vi (engine RULES, không LLM) → luôn trả lời miễn phí, không bao giờ gặp hộp Sao. */
async function laCauDacBiet(req: Request): Promise<boolean> {
  const b = (await req.clone().json().catch(() => null)) as { cau_hoi?: unknown } | null;
  if (typeof b?.cau_hoi !== "string" || !b.cau_hoi.trim()) return false;
  const kq = await goiEngineDaKiem({ cau_hoi: b.cau_hoi.slice(0, 500) }, "/v1/hoi/dac-biet");
  return kq.ok && Boolean((kq.body as { loai?: string | null })?.loai);
}

export async function cuaHoi(req: Request, moDun: string): Promise<Cua> {
  if (!coTaiKhoan() || !(await layCauHinh<boolean>("sao.hoi.thu"))) return MO;
  const dv = khachDichVu();
  if (!dv) return MO;
  const phien = await phienNguoiDung();
  const khoa = phien ? `u:${phien.user.id}` : khoaKhach(req);
  if (!khoa) return MO;
  const tran = await layCauHinh<number>(phien ? "sao.hoi.mien_phi_tk" : "sao.hoi.mien_phi_khach");
  const { data, error } = await dv.rpc("dung_luot_hoi", { p_khoa: khoa, p_tran: tran });
  if (error) return MO;
  const r = data as { duoc: boolean; da_dung: number; tran: number };
  if (r.duoc) {
    const luot = { con_lai: Math.max(0, r.tran - r.da_dung), tran: r.tran, tai_khoan: Boolean(phien) };
    return { ok: true, luot, xong: async () => luot };
  }
  if (await laCauDacBiet(req)) return MO;
  if (!phien) {
    const thuong = await layCauHinh<number>("sao.thuong.chao_mung");
    return { ok: false, res: NextResponse.json({
      error: `Bạn đã dùng hết ${tran} câu hỏi miễn phí hôm nay.`, can: "dang_nhap", tran, thuong, mo_dun: moDun,
    }, { status: 402 }) };
  }
  const gia = await layCauHinh<number>("sao.hoi.gia");
  const { data: du } = await phien.sb.rpc("so_du_sao");
  const soDu = typeof du === "number" ? du : 0;
  if (soDu < gia) {
    return { ok: false, res: NextResponse.json({
      error: `Hết ${tran} câu miễn phí hôm nay. Câu tiếp theo ${gia} Sao, ví bạn còn ${soDu} Sao.`, can: "nap", gia, so_du: soDu, tran,
      chao_mung: await chaoMungConNhan(phien),
    }, { status: 402 }) };
  }
  if (req.headers.get("x-dong-y-sao") !== "1") {
    return { ok: false, res: NextResponse.json({
      error: `Hết ${tran} câu miễn phí hôm nay. Hỏi tiếp: ${gia} Sao mỗi câu.`, can: "xac_nhan_sao", gia, so_du: soDu, tran,
    }, { status: 402 }) };
  }
  // SEC-2: trừ NGAY (khoá ngẫu nhiên mỗi câu — một câu, một lần trừ; dung_sao khoá theo người dùng nên song song không âm ví).
  const khoaCau = `hoi:${moDun}:${randomUUID()}`;
  const { data: d } = await phien.sb.rpc("dung_sao", { p_so: gia, p_khoa: khoaCau, p_ghi_chu: "Hỏi đáp vượt lượt miễn phí" });
  const kq = d as { ket_qua?: string; so_du?: number } | null;
  if (kq?.ket_qua !== "da_dung") {
    const con = typeof kq?.so_du === "number" ? kq.so_du : soDu;
    return { ok: false, res: NextResponse.json({
      error: `Hết ${tran} câu miễn phí hôm nay. Câu tiếp theo ${gia} Sao, ví bạn còn ${con} Sao.`, can: "nap", gia, so_du: con, tran,
      chao_mung: await chaoMungConNhan(phien),
    }, { status: 402 }) };
  }
  const luot = { sao_da_tru: gia, so_du: kq.so_du ?? null };
  return { ok: true, xong: async () => luot, hoan: async () => {
    const { error: loi } = await dv.rpc("hoan_sao_hoi", { p_user_id: phien.user.id, p_khoa: `dung:${phien.user.id}:${khoaCau}` });
    if (loi) baoLoi(new Error("hoan_sao_hoi"), { noi: "cua_sao", ma: loi.code ?? "" });
  } };
}

/** Bọc route hỏi đáp: kiểm cửa → chạy → engine trả 200 thì trừ Sao (nếu có) và gắn `luot` vào phản hồi. */
export async function voiCuaHoi(req: Request, moDun: string, chay: () => Promise<NextResponse>): Promise<NextResponse> {
  const cua = await cuaHoi(req, moDun);
  if (!cua.ok) return cua.res;
  const res = await chay();
  if (res.status !== 200) {
    await cua.hoan?.();   // SEC-2: đã trừ trước mà engine không trả lời được → hoàn
    return res;
  }
  demCauHoi();
  const luot = await cua.xong();
  if (!luot) return res;
  const body = await res.json().catch(() => null);
  return body && typeof body === "object" ? NextResponse.json({ ...body, luot }) : res;
}

/** SAO-3 (migration 0014): câu trả lời được của người ĐÃ đăng nhập → cộng 1 vào bộ đếm của tài khoản (nhiệm vụ
 *  "Hỏi 3 câu"). Chỉ con số — không lưu câu hỏi. Ghi bằng service role SAU khi đã trả lời (không làm chậm phản hồi);
 *  thiếu Supabase / service role / chưa chạy 0014 → bỏ qua lặng lẽ (nhiệm vụ đó chỉ không tiến lên). */
function demCauHoi(): void {
  if (!coTaiKhoan()) return;
  const dv = khachDichVu();
  if (!dv) return;
  after(async () => {
    try {
      const phien = await phienNguoiDung();
      if (phien) await dv.rpc("ghi_cau_hoi_tai_khoan", { p_user_id: phien.user.id });
    } catch { /* bỏ qua */ }
  });
}
