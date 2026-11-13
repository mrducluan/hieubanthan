// Proxy mỏng web → engine cho route handler: giữ ENGINE key phía server, không tự tính gì.
import { NextResponse } from "next/server";
import { LA_MA_EN } from "@/lib/ngon-ngu";
import type { ZodTypeAny } from "zod";
import { baoLoi } from "@/lib/giam-sat";
import { ganNgonNgu } from "@/lib/engine-ngon-ngu";

const ENGINE_URL = process.env.ENGINE_URL ?? "http://localhost:8000";
const ENGINE_API_KEY = process.env.ENGINE_API_KEY;

// Lời báo lỗi cho người dùng từ phản hồi lỗi của engine. Engine tự viết `detail` tiếng Việt cho lỗi nghiệp
// vụ (vd "Nơi sinh không có trong danh sách") → giữ nguyên. Lỗi chung của FastAPI ("Not Found", danh sách lỗi
// validate…) → câu tiếng Việt, không lộ chữ kỹ thuật. 404 "Not Found" = engine đang chạy bản cũ thiếu route
// (web và engine deploy lệch nhánh) → 503 để phân biệt với "không có dữ liệu".
const CHUNG = new Set(["Not Found", "Method Not Allowed", "Internal Server Error", "Unauthorized", "Forbidden"]);

/** EN-ALL GĐ 4 — thông báo lỗi CHUNG của route API theo ngôn ngữ lượt gọi (bản Việt: đúng chữ cũ). */
const LOI_CHUNG = {
  cu: ["Máy tính toán chưa có tính năng này (đang chạy phiên bản cũ). Vui lòng thử lại sau ít phút.", "This feature is not available on the calculation server yet. Please try again in a few minutes."],
  khong_hop_le: ["Thông tin chưa hợp lệ — kiểm tra lại ngày, giờ, nơi sinh.", "Something in your details is not valid — please check the date, time and birthplace."],
  tu_choi: ["Máy tính toán từ chối kết nối. Vui lòng báo quản trị.", "The calculation server refused the connection. Please let us know."],
  loi: ["Máy tính toán đang gặp lỗi, thử lại sau ít phút.", "The calculation server hit an error. Please try again in a few minutes."],
  khong_ket_noi: ["Không kết nối được máy tính toán. Thử lại sau.", "Could not reach the calculation server. Please try again later."],
  khong_ket_noi_phut: ["Không kết nối được máy tính toán. Thử lại sau ít phút.", "Could not reach the calculation server. Please try again in a few minutes."],
  dau_vao: ["Đầu vào không hợp lệ", "Invalid input"],
  cap_nhat: ["Máy tính toán đang cập nhật, thử lại sau ít phút.", "The calculation server is updating. Please try again in a few minutes."],
  khong_json: ["Body không phải JSON", "The request body is not JSON"],
} as const;
export type MaLoiChung = keyof typeof LOI_CHUNG;
export const loiChung = (ma: MaLoiChung, en = false): string => LOI_CHUNG[ma][en ? 1 : 0];
/** Lượt gọi là bản Anh (trình duyệt trang /en gửi `x-ngon-ngu`). */
export const laBanAnh = (req: Request): boolean => Boolean(dauNgonNgu(req)["x-ngon-ngu"]);

export function loiEngine(status: number, body: unknown, en = false): { error: string; status: number } {
  // Lệch phiên bản (404) và lỗi máy (5xx) là việc của người vận hành → báo Sentry; lỗi nhập liệu (4xx) thì không.
  if (status === 404 || status >= 500 || status === 401 || status === 403) baoLoi(new Error(`engine ${status}`), { engine_status: status });
  const detail = body && typeof body === "object" && "detail" in body ? (body as { detail: unknown }).detail : null;
  if (status === 404 && (detail === "Not Found" || detail === null)) {
    return { error: loiChung("cu", en), status: 503 };
  }
  if (typeof detail === "string" && detail && !CHUNG.has(detail)) return { error: detail, status };
  if (status === 422) return { error: loiChung("khong_hop_le", en), status };
  if (status === 401 || status === 403) return { error: loiChung("tu_choi", en), status: 502 };
  return { error: loiChung("loi", en), status: status >= 500 ? status : 502 };
}

/** RL-1: IP người dùng → engine (băm ngay, chỉ dùng giới hạn lượt AI, không lưu). Trên Vercel `x-real-ip` /
 *  `x-forwarded-for` do Vercel đặt, người dùng không tự giả được. */
export function dauNguoiGoi(req: Request): Record<string, string> {
  const ip = req.headers.get("x-real-ip") ?? req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return { ...(ip ? { "x-nguoi-goi": ip.slice(0, 64) } : {}), ...dauNgonNgu(req) };
}

/** QTE: ngôn ngữ của lượt gọi (trang /en gửi `x-ngon-ngu: en`) → chuyển tiếp nguyên header tới engine; giá trị lạ bỏ qua. */
export function dauNgonNgu(req: Request): Record<string, string> {
  const nn = (req.headers.get("x-ngon-ngu") ?? "").toLowerCase();
  return LA_MA_EN.test(nn) ? { "x-ngon-ngu": nn } : {};
}

/** EN-ALL mục 6.1: bản Anh chưa có cổng thanh toán quốc tế → miễn phí, nhưng CHỈ cho mảng đã mở tiếng Anh (header do
 *  trình duyệt gửi, giả được — miễn phí rộng hơn thì người dùng bản Việt chỉ cần gửi header là đọc hết chương khoá).
 *  Mở thêm mảng tiếng Anh = thêm mã vào đây. Người gửi header giả chỉ nhận bản TIẾNG ANH của đúng mảng đã mở miễn phí. */
export const MO_DUN_MIEN_PHI_EN = {
  luan_giai: new Set(["battu", "tuvi"]),
  hoi: new Set(["battu", "phongthuy", "thanso", "tuvi"]),
} as const;

export function mienPhiBanAnh(req: Request, loai: keyof typeof MO_DUN_MIEN_PHI_EN, moDun: string): boolean {
  return Boolean(dauNgonNgu(req)["x-ngon-ngu"]) && MO_DUN_MIEN_PHI_EN[loai].has(moDun);
}

/** EN-ALL việc 5: ngôn ngữ của một lượt gọi route GET có đệm — header `x-ngon-ngu` HOẶC `?ngon_ngu=` (trình duyệt nên dùng
 *  query: bộ đệm CDN khoá theo URL). Trả đường dẫn engine đã gắn ngôn ngữ (bản Việt giữ nguyên) + header kèm theo. */
export function engineTheoReq(req: Request, duong: string): { duong: string; dau: Record<string, string> } {
  let nn = (req.headers.get("x-ngon-ngu") ?? "").toLowerCase();
  if (!LA_MA_EN.test(nn)) { try { nn = (new URL(req.url).searchParams.get("ngon_ngu") ?? "").toLowerCase(); } catch { nn = ""; } }
  return ganNgonNgu(duong, LA_MA_EN.test(nn) ? nn : "vi");
}

/** Gọi engine với dữ liệu ĐÃ kiểm (dùng chung cho goiEngine và các route cần xử lý thêm, vd trừ Sao). */
export async function goiEngineDaKiem(data: unknown, path: string, them: Record<string, string> = {}): Promise<{ ok: true; body: unknown } | { ok: false; res: NextResponse }> {
  try {
    const r = await fetch(`${ENGINE_URL}${path}`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(ENGINE_API_KEY ? { "x-engine-key": ENGINE_API_KEY } : {}),
        ...them,
      },
      body: JSON.stringify(data),
      cache: "no-store",
    });
    const body: unknown = await r.json().catch(() => null);
    if (!r.ok) {
      const l = loiEngine(r.status, body, Boolean(them["x-ngon-ngu"]));
      return { ok: false, res: NextResponse.json({ error: l.error }, { status: l.status }) };
    }
    return { ok: true, body };
  } catch (e) {
    baoLoi(e, { noi: "goi_engine", duong: path });
    return { ok: false, res: NextResponse.json({ error: loiChung("khong_ket_noi", Boolean(them["x-ngon-ngu"])) }, { status: 502 }) };
  }
}

export async function goiEngine(req: Request, schema: ZodTypeAny, path: string): Promise<NextResponse> {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: loiChung("dau_vao", laBanAnh(req)) }, { status: 422 });
  }
  const kq = await goiEngineDaKiem(parsed.data, path, dauNguoiGoi(req));
  return kq.ok ? NextResponse.json(kq.body) : kq.res;
}
