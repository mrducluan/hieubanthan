"use client";
// KC-4 GĐ1 — Web Push phía TRÌNH DUYỆT: đăng ký service worker (public/sw.js) + subscription CHỈ khi người dùng bấm
// "Bật nhắc", ghi thiết bị vào tài khoản qua dang_ky_push() (migration 0019, RLS chủ sở hữu). Không tự hỏi quyền khi
// mở trang. iPhone/iPad: chỉ chạy khi site đã "Thêm vào màn hình chính" (Safari 16.4+).
import { supabase } from "@/lib/supabase/trinh-duyet";
import { luuNhacTaiKhoan } from "@/lib/tai-khoan-nhac";
import { dsNhacTrenMay } from "@/lib/nhac-viec";
import { dangChayApp } from "@/lib/che-do-app";

const KHOA_BAT = "hbt.push.v1";   // = user id đã bật nhắc trên thiết bị này (nút "Nhắc tôi" tự lưu mốc vào tài khoản; máy dùng
                                  //   chung: tài khoản khác đăng nhập KHÔNG được kế thừa thiết bị khi chưa tự bấm "Bật nhắc")

export type TrangThaiPush =
  | "khong_ho_tro"     // trình duyệt không có Push API
  | "can_cai_ios"      // iPhone/iPad chưa "Thêm vào màn hình chính"
  | "bi_chan"          // người dùng đã chặn thông báo cho site
  | "dang_bat" | "chua_bat";

export const laIos = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);


/** Thiết bị này đang bật nhắc cho đúng tài khoản `userId`? (không có userId: cho bất kỳ tài khoản nào) */
export function pushDangBatTrenMay(userId?: string): boolean {
  try { const v = window.localStorage.getItem(KHOA_BAT); return Boolean(v) && (!userId || v === userId); } catch { return false; }
}
function datCo(userId: string | null) {
  try { if (userId) window.localStorage.setItem(KHOA_BAT, userId); else window.localStorage.removeItem(KHOA_BAT); } catch { /* riêng tư */ }
}

/** Khoá VAPID công khai; null = máy chủ chưa bật nhắc qua thông báo. */
export async function khoaMayChu(): Promise<string | null> {
  try {
    const r = await fetch("/api/push/khoa");
    return r.ok ? ((await r.json()) as { khoa?: string }).khoa ?? null : null;
  } catch { return null; }
}

async function dangKyHienTai(): Promise<PushSubscription | null> {
  const reg = await navigator.serviceWorker.getRegistration("/");
  return reg ? reg.pushManager.getSubscription() : null;
}

export async function trangThaiPush(): Promise<TrangThaiPush> {
  if (typeof window === "undefined") return "khong_ho_tro";
  const coApi = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
  if (!coApi) return laIos() && !dangChayApp() ? "can_cai_ios" : "khong_ho_tro";
  if (Notification.permission === "denied") return "bi_chan";
  const sub = await dangKyHienTai().catch(() => null);
  if (!sub) datCo(null);
  return sub && Notification.permission === "granted" ? "dang_bat" : "chua_bat";
}

const tuB64u = (s: string) => {
  const b = atob(s.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (s.length % 4)) % 4));
  return Uint8Array.from(b, (c) => c.charCodeAt(0));
};

/** Subscription hiện có được tạo bằng đúng khoá máy chủ hiện tại? (đổi khoá VAPID → phải đăng ký lại). */
function cungKhoa(sub: PushSubscription, khoa: Uint8Array): boolean {
  const k = sub.options?.applicationServerKey;
  if (!k) return true;   // trình duyệt không trả khoá → không kết luận được, giữ
  const a = new Uint8Array(k);
  return a.length === khoa.length && a.every((x, i) => x === khoa[i]);
}

async function ghiThietBi(sub: PushSubscription): Promise<void> {
  const j = sub.toJSON();
  const sb = await supabase();
  if (!sb || !j.endpoint || !j.keys?.p256dh || !j.keys.auth) throw new Error("Tài khoản chưa được bật trên hệ thống.");
  const { error } = await sb.rpc("dang_ky_push", { p_endpoint: j.endpoint, p_p256dh: j.keys.p256dh, p_auth: j.keys.auth });
  if (error) throw new Error("Chưa lưu được thiết bị (máy chủ có thể chưa bật nhắc qua thông báo).");
}

/** Bật nhắc trên thiết bị này. Ném lỗi có lời giải thích nếu không được. Mốc sắp tới đang lưu trên máy được chép lên
 *  tài khoản (người dùng đã đồng ý ở nút bật — máy chủ cần mốc để biết ngày gửi). */
export async function batPush(userId: string): Promise<void> {
  const khoa = await khoaMayChu();
  if (!khoa) throw new Error("Nhắc qua thông báo chưa được bật trên hệ thống.");
  const quyen = await Notification.requestPermission();
  if (quyen !== "granted") throw new Error("Bạn chưa cho phép thông báo — có thể bật lại trong phần cài đặt trang của trình duyệt.");
  const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
  await navigator.serviceWorker.ready;
  const khoaByte = tuB64u(khoa);
  let sub = await reg.pushManager.getSubscription();
  if (sub && !cungKhoa(sub, khoaByte)) { await sub.unsubscribe().catch(() => false); sub = null; }   // máy chủ đã đổi khoá VAPID
  sub ??= await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: khoaByte });
  await ghiThietBi(sub);
  datCo(userId);
  const homNay = new Date(Date.now() + 7 * 3_600_000).toISOString().slice(0, 10);
  await Promise.all(dsNhacTrenMay().filter((n) => n.ngay >= homNay).map((n) => luuNhacTaiKhoan(userId, n).catch(() => null)));
}

/** Tắt nhắc trên thiết bị này: huỷ subscription + xoá khỏi tài khoản. Mốc trong tài khoản giữ nguyên. */
export async function tatPush(): Promise<void> {
  const sub = await dangKyHienTai().catch(() => null);
  datCo(null);
  if (!sub) return;
  const endpoint = sub.endpoint;
  await sub.unsubscribe().catch(() => false);
  const sb = await supabase();
  if (sb) await sb.from("push_dang_ky").delete().eq("endpoint", endpoint);
}

/** Khi mở trang với thiết bị đang có subscription: CHỈ ĐỌC — tài khoản hiện tại có đúng thiết bị này trong `push_dang_ky`
 *  không. Ghi lại chỉ khi (a) trình duyệt vừa tự đổi subscription (sw.js báo "push_doi", `doiMoi = true`) hoặc (b) cờ trên
 *  máy ghi đúng tài khoản này mà máy chủ không còn endpoint hiện tại (đổi subscription lúc trang đóng). Tài khoản khác đăng
 *  nhập trên máy này → false, không chuyển thiết bị (phải tự bấm "Bật nhắc"). Khoá máy chủ đổi → tắt, trả false. */
export async function dongBoThietBi(userId: string, doiMoi = false): Promise<boolean> {
  const sub = await dangKyHienTai().catch(() => null);
  if (!sub) return false;
  const khoa = await khoaMayChu();
  if (khoa && !cungKhoa(sub, tuB64u(khoa))) { await tatPush(); return false; }
  const sb = await supabase();
  if (!sb) return false;
  const { data } = await sb.from("push_dang_ky").select("id").eq("endpoint", sub.endpoint).maybeSingle();   // RLS: chỉ hàng của mình
  if (data) { datCo(userId); return true; }
  if (!doiMoi && !pushDangBatTrenMay(userId)) return false;
  try { await ghiThietBi(sub); datCo(userId); return true; } catch { return false; }
}

// ---------------------------------------------------------------- KC-4 GĐ2: tuỳ chọn nhận thêm (push_tuy_chon, 0020)
export type MocLichChon = "thang_ca_nhan" | "giao_tiet" | "lap_xuan_tet";
export interface TuyChonPush { sang_nay: boolean; moc_lich: MocLichChon[] }
export const TUY_CHON_RONG: TuyChonPush = { sang_nay: false, moc_lich: [] };   // không tích sẵn

/** null = máy chủ chưa chạy 0020 (ẩn phần tuỳ chọn). */
export async function docTuyChon(userId: string): Promise<TuyChonPush | null> {
  const sb = await supabase();
  if (!sb) return null;
  const { data, error } = await sb.from("push_tuy_chon").select("sang_nay,moc_lich").eq("user_id", userId).maybeSingle();
  if (error) return null;
  return data ? { sang_nay: Boolean(data.sang_nay), moc_lich: (data.moc_lich ?? []) as MocLichChon[] } : TUY_CHON_RONG;
}
export async function luuTuyChon(userId: string, t: TuyChonPush): Promise<void> {
  const sb = await supabase();
  if (!sb) throw new Error("Tài khoản chưa được bật trên hệ thống.");
  const { error } = await sb.from("push_tuy_chon").upsert({ user_id: userId, sang_nay: t.sang_nay, moc_lich: t.moc_lich }, { onConflict: "user_id" });
  if (error) throw new Error("Chưa lưu được tuỳ chọn.");
}
/** "Sáng nay của bạn" cần ngày + tháng sinh trong hồ sơ tài khoản (bảng ho_so). */
export async function coHoSoTaiKhoan(userId: string): Promise<boolean> {
  const sb = await supabase();
  if (!sb) return false;
  const { data } = await sb.from("ho_so").select("user_id").eq("user_id", userId).maybeSingle();
  return Boolean(data);
}
