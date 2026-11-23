// QC-G (chủ dự án duyệt 2026-11-23) — chuyển đổi offline Google Ads cho đơn nạp Sao / hội viên. CHỈ chạy ở MÁY CHỦ.
// Vì sao: Pay2S báo tiền về máy chủ; người mua quét QR rồi đóng tab → thẻ trên trình duyệt hụt lượt mua. Lúc bấm nạp,
// trình duyệt gửi kèm mã lượt bấm quảng cáo (gclid / gbraid / wbraid, chỉ khi chưa tắt cookie đo lường) → bảng google_don
// (migration 0041). Google Ads tải tệp CSV ở /api/qc/google-offline theo lịch (HTTPS + mật khẩu) → ghép đơn với lượt bấm.
// Email: chỉ email tài khoản THẬT (bỏ email đại diện Zalo), chuẩn hoá rồi băm SHA-256 ngay lúc xuất, không lưu — tắt bằng
// env GOOGLE_OFFLINE_EMAIL=0. Không họ tên, không ngày sinh.
import { createHash, timingSafeEqual } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { laEmailZalo } from "@/lib/zalo-email";

const MA = /^[A-Za-z0-9_-]{10,200}$/;
const HAN_XUAT_NGAY = 90;    // Google nhận chuyển đổi ≤ 90 ngày sau lượt bấm
const HAN_GIU_NGAY = 95;

export type MaGoogleVao = { gclid?: unknown; gbraid?: unknown; wbraid?: unknown } | null | undefined;

/** Lọc mã từ trình duyệt (không tin định dạng). Không có mã hợp lệ nào → null. */
export function locMaGoogle(v: MaGoogleVao): { gclid: string | null; gbraid: string | null; wbraid: string | null } | null {
  if (!v || typeof v !== "object") return null;
  const lay = (x: unknown) => (typeof x === "string" && MA.test(x) ? x : null);
  const kq = { gclid: lay(v.gclid), gbraid: lay(v.gbraid), wbraid: lay(v.wbraid) };
  return kq.gclid || kq.gbraid || kq.wbraid ? kq : null;
}

/** Lúc tạo đơn: ghi mã lượt bấm (chỉ khi người mua chưa tắt đo lường và có mã). Lỗi → bỏ qua (không chặn đơn). */
export async function ghiGoogleDon(dv: SupabaseClient | null, maDon: number, vao: MaGoogleVao, dongY: boolean): Promise<void> {
  const m = locMaGoogle(vao);
  if (!dv || !dongY || !m) return;
  const { error } = await dv.from("google_don").upsert({ ma_don: maDon, ...m }, { onConflict: "ma_don" });
  if (error) console.error("[google-offline] ghi", error.code ?? "loi");
}

/** Email chuẩn hoá (chữ thường, bỏ khoảng trắng) → SHA-256 hex. Email đại diện Zalo / không hợp lệ → null. */
export function bamEmail(email: string | null | undefined): string | null {
  const e = (email ?? "").trim().toLowerCase();
  if (!e || laEmailZalo(e) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return null;
  return createHash("sha256").update(e).digest("hex");
}

/** Có được gửi email băm cho dịch vụ quảng cáo không (env GOOGLE_OFFLINE_EMAIL / META_CAPI_EMAIL = "0" để tắt). */
export const choGuiEmail = (ten: "GOOGLE_OFFLINE_EMAIL" | "META_CAPI_EMAIL") => (process.env[ten] ?? "").trim() !== "0";

/** Email (băm) của chủ đơn — đọc bằng service role, không lưu. Lỗi → null. */
export async function emailBamCuaNguoi(dv: SupabaseClient, userId: string | null | undefined): Promise<string | null> {
  if (!userId) return null;
  try {
    const { data } = await dv.auth.admin.getUserById(userId);
    return bamEmail(data.user?.email);
  } catch { return null; }
}

/** Giờ Việt Nam "yyyy-MM-dd HH:mm:ss" (tệp khai TimeZone=Asia/Ho_Chi_Minh). */
export function gioVn(iso: string): string {
  const d = new Date(Date.parse(iso) + 7 * 3_600_000);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())} ${p(d.getUTCHours())}:${p(d.getUTCMinutes())}:${p(d.getUTCSeconds())}`;
}

export type DongXuat = { gclid: string; email: string | null; tra_luc: string; so_tien: number };

/** Hàm thuần: tệp CSV theo mẫu "Conversions from clicks" của Google Ads (cột Email là SHA-256 khi có). */
export function taoCsv(ds: DongXuat[], tenChuyenDoi: string, coEmail: boolean): string {
  const ten = tenChuyenDoi.replace(/[",\r\n]/g, " ").trim() || "Nap Sao";
  const dau = coEmail
    ? "Google Click ID,Email,Conversion Name,Conversion Time,Conversion Value,Conversion Currency"
    : "Google Click ID,Conversion Name,Conversion Time,Conversion Value,Conversion Currency";
  const dong = ds.filter((d) => MA.test(d.gclid) && d.so_tien > 0).map((d) => (coEmail
    ? [d.gclid, d.email ?? "", ten, gioVn(d.tra_luc), String(d.so_tien), "VND"]
    : [d.gclid, ten, gioVn(d.tra_luc), String(d.so_tien), "VND"]).join(","));
  return ["Parameters:TimeZone=Asia/Ho_Chi_Minh", dau, ...dong].join("\r\n") + "\r\n";
}

/** Kiểm Basic Auth (so hằng thời gian). Chưa đặt GOOGLE_OFFLINE_USER / GOOGLE_OFFLINE_PASS (≥ 16 ký tự) → không mở. */
export function dungMatKhau(auth: string | null): boolean {
  const u = (process.env.GOOGLE_OFFLINE_USER ?? "").trim(), p = (process.env.GOOGLE_OFFLINE_PASS ?? "").trim();
  if (!u || p.length < 16 || !auth?.startsWith("Basic ")) return false;
  let tho = "";
  try { tho = Buffer.from(auth.slice(6).trim(), "base64").toString("utf8"); } catch { return false; }
  const a = Buffer.from(tho), b = Buffer.from(`${u}:${p}`);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Đơn đã trả trong 90 ngày có gclid → dòng xuất. */
export async function layDongXuat(dv: SupabaseClient, coEmail: boolean): Promise<DongXuat[]> {
  const tu = new Date(Date.now() - HAN_XUAT_NGAY * 86_400_000).toISOString();
  const { data: gg } = await dv.from("google_don").select("ma_don,gclid").not("gclid", "is", null).gt("tao_luc", tu).limit(2000);
  const ma = ((gg ?? []) as { ma_don: number; gclid: string }[]);
  if (!ma.length) return [];
  const { data: don } = await dv.from("don_nap").select("ma_don,user_id,so_tien,tra_luc,trang_thai")
    .in("ma_don", ma.map((x) => x.ma_don)).eq("trang_thai", "da_tra");
  const theoMa = new Map(((don ?? []) as { ma_don: number; user_id: string; so_tien: number; tra_luc: string | null }[]).map((d) => [d.ma_don, d]));
  const kq: DongXuat[] = [];
  for (const g of ma) {
    const d = theoMa.get(g.ma_don);
    if (!d?.tra_luc) continue;
    kq.push({ gclid: g.gclid, so_tien: d.so_tien, tra_luc: d.tra_luc, email: coEmail ? await emailBamCuaNguoi(dv, d.user_id) : null });
  }
  return kq;
}

/** Cron ngày: xoá dòng > 95 ngày. */
export async function googleCron(dv: SupabaseClient): Promise<{ xoa: number }> {
  const truoc = new Date(Date.now() - HAN_GIU_NGAY * 86_400_000).toISOString();
  const { count } = await dv.from("google_don").delete({ count: "exact" }).lt("tao_luc", truoc);
  return { xoa: count ?? 0 };
}
