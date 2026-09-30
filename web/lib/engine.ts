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
  gia_tri: number;
  nghia: NghiaSo | null;
  on_dinh: boolean;
  gia_tri_khac: number[];
  ghi_chu_do_nhay?: string;
}
export interface DinhCao {
  dinh: number;
  so: number;
  tu_tuoi: number;
  den_tuoi: number | null;
  nghia: { chu_de: string; y_nghia: string; bong_toi: string;
           phan_chung?: string; so_cai?: boolean } | null;
}
export interface NamCaNhan {
  nam: number;
  tuoi: number;
  so: number;
  nghia: { chu_de: string; y_nghia: string; nen: string; tranh: string } | null;
}
export interface ChieuSau {
  dinh_cao: DinhCao[];
  thu_thach_chinh: {
    so: number;
    nghia: { mo_ta: string; y_nghia: string; cach_vuot: string } | null;
  };
  nam_ca_nhan: NamCaNhan[];
  trich_nguon: string;
  cach_doc_chieu_sau: string;
}
export interface MuiTen {
  ma: string;
  trong: boolean;
  ten?: string;
  y_nghia?: string;
  mat_toi?: string;
  goi_y?: string;
}
export interface ThangCaNhanNghia { chu_de: string; nen: string; tranh: string }
export interface NoNghiepNghia { ten: string; y_nghia: string; goi_y: string }
export interface MoRong {
  bieu_do: { luoi: number[][]; so_thieu: number[]; mui_ten: MuiTen[] };
  so_ngay_sinh: { so: number; nghia: string | null };
  so_thai_do: { so: number; nghia: string | null };
  so_truong_thanh: { so: number; nghia: string | null };
  thang_ca_nhan: { thang: number; nam: number; so: number; nghia: ThangCaNhanNghia | null };
  no_nghiep: { vi_tri: string; so: number; nghia: NoNghiepNghia | null }[];
  bai_hoc_nghiep: { so: number; nghia: string | null }[];
  trich_nguon: string;
  trang_thai: string;
}
export interface LuanGiaiResult {
  engine_version: string;
  ngay_sinh: string;
  ten_chinh: string;
  ten_bien_the_da_quet: string[];
  cac_vi_tri: ViTriLuanGiai[];
  chieu_sau: ChieuSau;
  mo_rong?: MoRong;
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
