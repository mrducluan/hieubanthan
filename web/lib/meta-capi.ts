// META-CAPI (chủ dự án duyệt 2026-11-16) — API chuyển đổi của Meta cho đơn nạp Sao / hội viên. CHỈ chạy ở MÁY CHỦ.
// Vì sao: Pixel trên trình duyệt hụt lượt mua khi người mua chặn quảng cáo, dùng iPhone, hoặc đóng tab trước khi trang
// kết quả kịp tải. Máy chủ gửi Purchase khi cổng thanh toán báo ĐÃ TRẢ, cùng event_id `don-<mã>` với Pixel → Meta khử trùng.
// Riêng tư: gửi mã cookie Meta (_fbp, _fbc) + IP + user agent (Meta cần để khớp lượt bấm quảng cáo) + (QC-G, chủ dự án quyết
// 2026-11-23) EMAIL tài khoản thật đã chuẩn hoá và BĂM SHA-256 (không gửi email gốc; bỏ email đại diện Zalo; tắt bằng env
// META_CAPI_EMAIL=0) — KHÔNG tên, ngày sinh. Chỉ khi người mua chưa tắt cookie đo lường (trình duyệt báo lúc bấm nạp). Gửi xong xoá IP + user agent; cron
// xoá mọi dòng > 8 ngày (Meta chỉ nhận sự kiện ≤ 7 ngày). Bật bằng env META_CAPI_TOKEN (Events Manager → Settings →
// Conversions API → Generate access token). META_CAPI_TEST_CODE (tuỳ chọn) để thử ở mục "Test events".
import type { SupabaseClient } from "@supabase/supabase-js";
import { META_BAT, META_PIXEL_ID } from "@/lib/meta-id";
import { siteUrl } from "@/lib/seo";
import { choGuiEmail, emailBamCuaNguoi } from "@/lib/google-offline";

const FBP = /^fb\.[0-9]\.[0-9]{10,16}\.[0-9]{1,30}$/;
const FBC = /^fb\.[0-9]\.[0-9]{10,16}\.[A-Za-z0-9_-]{1,400}$/;
const PHIEN_BAN = (process.env.META_CAPI_VERSION ?? "v23.0").trim();
const HAN_GUI_MS = 4_000;

const token = (): string => (process.env.META_CAPI_TOKEN ?? "").trim();
export const capiBat = (): boolean => META_BAT && token().length >= 20;

/** Đọc một cookie từ header Cookie (không phụ thuộc next/headers → test được). */
export function docCookie(cookie: string | null, ten: string): string | null {
  for (const p of (cookie ?? "").split(";")) {
    const i = p.indexOf("=");
    if (i > 0 && p.slice(0, i).trim() === ten) {
      try { return decodeURIComponent(p.slice(i + 1).trim()); } catch { return null; }
    }
  }
  return null;
}

export interface DuLieuKhop { fbp: string | null; fbc: string | null; ip: string | null; ua: string | null }

/** Mã cookie Meta + IP + user agent của lượt bấm nạp. Cookie sai định dạng → bỏ (không tin trình duyệt). */
export function duLieuKhop(req: Request): DuLieuKhop {
  const ck = req.headers.get("cookie");
  const fbp = docCookie(ck, "_fbp"), fbc = docCookie(ck, "_fbc");
  const ip = (req.headers.get("x-real-ip") ?? req.headers.get("x-forwarded-for")?.split(",")[0] ?? "").trim();
  const ua = (req.headers.get("user-agent") ?? "").trim();
  return {
    fbp: fbp && FBP.test(fbp) ? fbp : null,
    fbc: fbc && FBC.test(fbc) ? fbc : null,
    ip: ip && ip.length <= 64 && /^[0-9a-fA-F:.]+$/.test(ip) ? ip : null,
    ua: ua ? ua.slice(0, 400) : null,
  };
}

/** Lúc tạo đơn: ghi mã khớp (chỉ khi CAPI bật, người mua đồng ý đo lường, có ít nhất một mã cookie Meta). Lỗi → bỏ qua. */
export async function ghiMetaDon(dv: SupabaseClient | null, maDon: number, req: Request, dongY: boolean): Promise<void> {
  if (!dv || !dongY || !capiBat()) return;
  const k = duLieuKhop(req);
  if (!k.fbp && !k.fbc) return;   // không có cookie Meta (Pixel chưa từng chạy) → Meta không khớp được, không lưu gì
  const { error } = await dv.from("meta_don").upsert({ ma_don: maDon, ...k }, { onConflict: "ma_don" });
  if (error) console.error("[meta-capi] ghi", error.code ?? "loi");
}

type Don = { ma_don: number; so_tien: number; loai?: string | null; trang_thai: string; tra_luc: string | null; user_id?: string | null };
type Dong = { ma_don: number; fbp: string | null; fbc: string | null; ip: string | null; ua: string | null };

/** Gói sự kiện Purchase gửi Meta (hàm thuần → test được). */
export function goiPurchase(don: Don, d: Dong, testCode?: string, emBam?: string | null): Record<string, unknown> {
  const luc = don.tra_luc ? Math.floor(Date.parse(don.tra_luc) / 1000) : Math.floor(Date.now() / 1000);
  const user_data: Record<string, string | string[]> = {};
  if (d.fbp) user_data.fbp = d.fbp;
  if (d.fbc) user_data.fbc = d.fbc;
  if (d.ip) user_data.client_ip_address = d.ip;
  if (d.ua) user_data.client_user_agent = d.ua;
  if (emBam && /^[0-9a-f]{64}$/.test(emBam)) user_data.em = [emBam];
  return {
    data: [{
      event_name: "Purchase",
      event_time: luc,
      event_id: `don-${don.ma_don}`,
      action_source: "website",
      event_source_url: `${siteUrl()}/nap-sao`,
      user_data,
      custom_data: { value: don.so_tien, currency: "VND", content_type: don.loai ?? "sao" },
    }],
    ...(testCode ? { test_event_code: testCode } : {}),
  };
}

/** Sau khi cổng báo đã trả: gửi Purchase một lần (giành dòng bằng da_gui), gửi xong xoá IP + user agent. Gửi lỗi → trả
 *  da_gui về null để cron thử lại. Không bao giờ ném lỗi (không làm hỏng webhook thanh toán). */
export async function guiCapiDon(dv: SupabaseClient | null, maDon: number): Promise<"da_gui" | "bo_qua" | "loi"> {
  if (!dv || !capiBat()) return "bo_qua";
  try {
    const { data: dong } = await dv.from("meta_don").update({ da_gui: new Date().toISOString() })
      .eq("ma_don", maDon).is("da_gui", null).select("ma_don,fbp,fbc,ip,ua").maybeSingle();
    if (!dong) return "bo_qua";
    const { data: don } = await dv.from("don_nap").select("ma_don,so_tien,loai,trang_thai,tra_luc,user_id").eq("ma_don", maDon).maybeSingle();
    if (!don || (don as Don).trang_thai !== "da_tra") {
      await dv.from("meta_don").update({ da_gui: null }).eq("ma_don", maDon);
      return "bo_qua";
    }
    const testCode = (process.env.META_CAPI_TEST_CODE ?? "").trim() || undefined;
    const r = await fetch(`https://graph.facebook.com/${PHIEN_BAN}/${META_PIXEL_ID}/events?access_token=${encodeURIComponent(token())}`, {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify(goiPurchase(don as Don, dong as Dong, testCode,
        choGuiEmail("META_CAPI_EMAIL") ? await emailBamCuaNguoi(dv, (don as Don).user_id) : null)),
      signal: AbortSignal.timeout(HAN_GUI_MS), cache: "no-store",
    });
    if (!r.ok) {
      console.error("[meta-capi] gui", r.status);   // không in thân trả về (có thể nhắc lại token)
      await dv.from("meta_don").update({ da_gui: null }).eq("ma_don", maDon);
      return "loi";
    }
    await dv.from("meta_don").update({ ip: null, ua: null }).eq("ma_don", maDon);
    return "da_gui";
  } catch (e) {
    console.error("[meta-capi]", e instanceof Error ? e.name : "loi");
    await dv.from("meta_don").update({ da_gui: null }).eq("ma_don", maDon).then(() => undefined, () => undefined);
    return "loi";
  }
}

/** Cron ngày: gửi lại đơn đã trả mà chưa gửi được (≤ 7 ngày), rồi xoá dòng > 8 ngày. */
export async function capiCron(dv: SupabaseClient): Promise<{ gui: number; xoa: number } | null> {
  const truoc8 = new Date(Date.now() - 8 * 86_400_000).toISOString();
  const { count } = await dv.from("meta_don").delete({ count: "exact" }).lt("tao_luc", truoc8);
  if (!capiBat()) return { gui: 0, xoa: count ?? 0 };
  const truoc7 = new Date(Date.now() - 7 * 86_400_000 + 3_600_000).toISOString();
  const { data } = await dv.from("meta_don").select("ma_don").is("da_gui", null).gt("tao_luc", truoc7).limit(8);
  let gui = 0;
  for (const { ma_don } of (data ?? []) as { ma_don: number }[]) if ((await guiCapiDon(dv, ma_don)) === "da_gui") gui++;
  return { gui, xoa: count ?? 0 };
}
