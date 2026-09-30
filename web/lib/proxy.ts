// Proxy mỏng web → engine cho route handler: giữ ENGINE key phía server, không tự tính gì.
import { NextResponse } from "next/server";
import type { ZodTypeAny } from "zod";
import { baoLoi } from "@/lib/giam-sat";

const ENGINE_URL = process.env.ENGINE_URL ?? "http://localhost:8000";
const ENGINE_API_KEY = process.env.ENGINE_API_KEY;

// Lời báo lỗi cho người dùng từ phản hồi lỗi của engine. Engine tự viết `detail` tiếng Việt cho lỗi nghiệp
// vụ (vd "Nơi sinh không có trong danh sách") → giữ nguyên. Lỗi chung của FastAPI ("Not Found", danh sách lỗi
// validate…) → câu tiếng Việt, không lộ chữ kỹ thuật. 404 "Not Found" = engine đang chạy bản cũ thiếu route
// (web và engine deploy lệch nhánh) → 503 để phân biệt với "không có dữ liệu".
const CHUNG = new Set(["Not Found", "Method Not Allowed", "Internal Server Error", "Unauthorized", "Forbidden"]);

export function loiEngine(status: number, body: unknown): { error: string; status: number } {
  // Lệch phiên bản (404) và lỗi máy (5xx) là việc của người vận hành → báo Sentry; lỗi nhập liệu (4xx) thì không.
  if (status === 404 || status >= 500 || status === 401 || status === 403) baoLoi(new Error(`engine ${status}`), { engine_status: status });
  const detail = body && typeof body === "object" && "detail" in body ? (body as { detail: unknown }).detail : null;
  if (status === 404 && (detail === "Not Found" || detail === null)) {
    return { error: "Máy tính toán chưa có tính năng này (đang chạy phiên bản cũ). Vui lòng thử lại sau ít phút.", status: 503 };
  }
  if (typeof detail === "string" && detail && !CHUNG.has(detail)) return { error: detail, status };
  if (status === 422) return { error: "Thông tin chưa hợp lệ — kiểm tra lại ngày, giờ, nơi sinh.", status };
  if (status === 401 || status === 403) return { error: "Máy tính toán từ chối kết nối. Vui lòng báo quản trị.", status: 502 };
  return { error: "Máy tính toán đang gặp lỗi, thử lại sau ít phút.", status: status >= 500 ? status : 502 };
}

export async function goiEngine(req: Request, schema: ZodTypeAny, path: string): Promise<NextResponse> {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Đầu vào không hợp lệ" }, { status: 422 });
  }
  try {
    const r = await fetch(`${ENGINE_URL}${path}`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(ENGINE_API_KEY ? { "x-engine-key": ENGINE_API_KEY } : {}),
      },
      body: JSON.stringify(parsed.data),
      cache: "no-store",
    });
    const body: unknown = await r.json().catch(() => null);
    if (!r.ok) {
      const l = loiEngine(r.status, body);
      return NextResponse.json({ error: l.error }, { status: l.status });
    }
    return NextResponse.json(body);
  } catch (e) {
    baoLoi(e, { noi: "goi_engine", duong: path });
    return NextResponse.json({ error: "Không kết nối được máy tính toán. Thử lại sau." }, { status: 502 });
  }
}
