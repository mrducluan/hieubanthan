"use client";
// KC-4 GĐ1 — Web Push phía TRÌNH DUYỆT: đăng ký service worker (public/sw.js) + subscription CHỈ khi người dùng bấm
// "Bật nhắc", ghi thiết bị vào tài khoản qua dang_ky_push() (migration 0019, RLS chủ sở hữu). Không tự hỏi quyền khi
// mở trang. iPhone/iPad: chỉ chạy khi site đã "Thêm vào màn hình chính" (Safari 16.4+).
import { supabase } from "@/lib/supabase/trinh-duyet";
import { luuNhacTaiKhoan } from "@/lib/tai-khoan-nhac";
import { dsNhacTrenMay } from "@/lib/nhac-viec";

const KHOA_BAT = "hbt.push.v1";   // "1" = thiết bị này đang bật nhắc (để nút "Nhắc tôi" tự lưu mốc vào tài khoản)

export type TrangThaiPush =
  | "khong_ho_tro"     // trình duyệt không có Push API
  | "can_cai_ios"      // iPhone/iPad chưa "Thêm vào màn hình chính"
  | "bi_chan"          // người dùng đã chặn thông báo cho site
  | "dang_bat" | "chua_bat";

export const laIos = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
const daCaiApp = () => window.matchMedia?.("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone === true;

export function pushDangBatTrenMay(): boolean {
  try { return window.localStorage.getItem(KHOA_BAT) === "1"; } catch { return false; }
}
function datCo(bat: boolean) {
  try { if (bat) window.localStorage.setItem(KHOA_BAT, "1"); else window.localStorage.removeItem(KHOA_BAT); } catch { /* riêng tư */ }
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
  if (!coApi) return laIos() && !daCaiApp() ? "can_cai_ios" : "khong_ho_tro";
  if (Notification.permission === "denied") return "bi_chan";
  const sub = await dangKyHienTai().catch(() => null);
  if (!sub) datCo(false);
  return sub && Notification.permission === "granted" ? "dang_bat" : "chua_bat";
}

const tuB64u = (s: string) => {
  const b = atob(s.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (s.length % 4)) % 4));
  return Uint8Array.from(b, (c) => c.charCodeAt(0));
};

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
  const sub = (await reg.pushManager.getSubscription())
    ?? await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: tuB64u(khoa) });
  await ghiThietBi(sub);
  datCo(true);
  const homNay = new Date(Date.now() + 7 * 3_600_000).toISOString().slice(0, 10);
  await Promise.all(dsNhacTrenMay().filter((n) => n.ngay >= homNay).map((n) => luuNhacTaiKhoan(userId, n).catch(() => null)));
}

/** Tắt nhắc trên thiết bị này: huỷ subscription + xoá khỏi tài khoản. Mốc trong tài khoản giữ nguyên. */
export async function tatPush(): Promise<void> {
  const sub = await dangKyHienTai().catch(() => null);
  datCo(false);
  if (!sub) return;
  const endpoint = sub.endpoint;
  await sub.unsubscribe().catch(() => false);
  const sb = await supabase();
  if (sb) await sb.from("push_dang_ky").delete().eq("endpoint", endpoint);
}

/** Trang mở ra sau khi trình duyệt tự đổi subscription (sw.js báo "push_doi") → ghi lại thiết bị. */
export async function dongBoThietBi(): Promise<void> {
  if (!pushDangBatTrenMay()) return;
  const sub = await dangKyHienTai().catch(() => null);
  if (sub) await ghiThietBi(sub).catch(() => null);
}
