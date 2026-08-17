// Lớp gọi engine — CHỖ DUY NHẤT web nói chuyện với tầng CALC.
// Web không tự tính bất cứ thứ gì (xem CLAUDE.md, ranh giới giữa các tầng).
// Chỉ chạy phía server (Server Component / Route Handler) — ENGINE_URL không lộ ra client.

const ENGINE_URL = process.env.ENGINE_URL ?? "http://localhost:8000";
// Khoá service-to-service: chỉ web gửi được request hợp lệ tới engine.
// Không set (dev local) → không gửi header, engine cũng không đòi. Xem
// engine/app/main.py middleware require_engine_key.
const ENGINE_API_KEY = process.env.ENGINE_API_KEY;

function engineHeaders(base: Record<string, string> = {}): Record<string, string> {
  return ENGINE_API_KEY ? { ...base, "x-engine-key": ENGINE_API_KEY } : base;
}

export interface DoNhayResult {
  engine_version: string;
  ten_bien_the_da_quet: string[];
  ngay_sinh: string;
  khoang_ket_qua_co_the: Record<string, number[]>;
  so_ket_qua_khac_nhau: Record<string, number>;
  canh_bao: string[];
}

export interface EngineHealth {
  ok: boolean;
  engine_version: string;
  ty_boundary_set: boolean;
}

export class EngineError extends Error {
  constructor(
    message: string,
    public readonly status: number | null,
  ) {
    super(message);
    this.name = "EngineError";
  }
}

async function post<T>(path: string, body: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${ENGINE_URL}${path}`, {
      method: "POST",
      headers: engineHeaders({ "content-type": "application/json" }),
      body: JSON.stringify(body),
      cache: "no-store",
    });
  } catch {
    throw new EngineError(
      "Không kết nối được engine. Kiểm tra engine đã chạy chưa (port 8000).",
      null,
    );
  }
  if (!res.ok) {
    const detail = await res
      .json()
      .then((d: { detail?: unknown }) => String(d.detail ?? res.statusText))
      .catch(() => res.statusText);
    throw new EngineError(detail, res.status);
  }
  return res.json() as Promise<T>;
}

export function engineHealth(): Promise<EngineHealth> {
  return fetch(`${ENGINE_URL}/health`, { cache: "no-store", headers: engineHeaders() })
    .then((r) => r.json() as Promise<EngineHealth>)
    .catch(() => ({ ok: false, engine_version: "?", ty_boundary_set: false }));
}

export function doNhay(input: {
  ho_ten: string[];
  ngay: number;
  thang: number;
  nam: number;
}): Promise<DoNhayResult> {
  return post<DoNhayResult>("/v1/thanso/do-nhay", input);
}

export interface NghiaSo {
  gia_tri: number;
  tu_khoa: string;
  mat_toi: string;
  phan_chung: string;
  so_cai: boolean;
  trich_nguon: string;
}
export interface ViTriLuanGiai {
  vi_tri: string;
  ten: string;
  khung: string;
  on_dinh: boolean;
  gia_tri_co_the: number[];
  nghia: NghiaSo[];
  canh_bao?: string;
}
export interface LuanGiaiResult {
  engine_version: string;
  ngay_sinh: string;
  ten_bien_the_da_quet: string[];
  cac_vi_tri: ViTriLuanGiai[];
  tom_tat_do_tin: string;
  cach_doc: string;
  trich_nguon_chung: string;
}

export function luanGiai(input: {
  ho_ten: string[];
  ngay: number;
  thang: number;
  nam: number;
}): Promise<LuanGiaiResult> {
  return post<LuanGiaiResult>("/v1/thanso/luan-giai", input);
}
