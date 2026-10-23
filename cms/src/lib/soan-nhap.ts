// CMS-2 — trợ lý AI soạn nháp TỪNG ĐOẠN trong trình viết bài (dùng lại engine /v1/quan-tri/soan-nhap, cùng luật với
// /quan-tri): AI chỉ trả một đoạn nháp + cảnh báo kiểm định; người viết đọc, sửa, tự dán vào bài. Không tự ghi vào bài,
// không tự xuất bản. Hạn mức lượt AI quản trị do engine giữ (LLM_QT_LUOT_NGAY). Thiếu ENGINE_URL → báo chưa bật.
export const HANH_DONG = {
  viet_lai: "Viết lại mạch lạc",
  mo_rong: "Viết sâu hơn",
  rut_gon: "Rút gọn",
  soat_loi: "Soát chính tả",
  doi_thuong: "Lời đời thường",
} as const;
export type HanhDong = keyof typeof HANH_DONG;

export type KetQuaSoan = { nhap: string | null; kiem_dinh: { ma: string; noi_dung: string }[]; loi?: string };

export function kiemDauVao(b: Record<string, unknown>): { van: string; hanh_dong: HanhDong; yeu_cau: string; tieu_de: string; mang: string } | string {
  const van = typeof b.van === "string" ? b.van.trim() : "";
  if (van.length < 10) return "Dán đoạn cần sửa (ít nhất 10 ký tự).";
  if (van.length > 4000) return "Mỗi lần tối đa 4.000 ký tự — chia nhỏ đoạn.";
  const hd = b.hanh_dong;
  if (typeof hd !== "string" || !(hd in HANH_DONG)) return "Chọn việc cần làm.";
  const s = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : "");
  return { van, hanh_dong: hd as HanhDong, yeu_cau: s(b.yeu_cau, 300), tieu_de: s(b.tieu_de, 120), mang: s(b.mang, 30) };
}

export async function soanNhap(v: Exclude<ReturnType<typeof kiemDauVao>, string>): Promise<KetQuaSoan> {
  const goc = (process.env.ENGINE_URL || "").replace(/\/+$/, "");
  if (!goc) return { nhap: null, kiem_dinh: [], loi: "Chưa nối engine (thiếu ENGINE_URL trên CMS)." };
  try {
    const r = await fetch(`${goc}/v1/quan-tri/soan-nhap`, {
      method: "POST",
      headers: { "content-type": "application/json", ...(process.env.ENGINE_API_KEY ? { "x-engine-key": process.env.ENGINE_API_KEY } : {}),
        ...(process.env.ENGINE_QUAN_TRI_KEY ? { "x-quan-tri-key": process.env.ENGINE_QUAN_TRI_KEY } : {}) },   // SEC-2
      body: JSON.stringify({ tep: "cms_bai_viet.json", duong: ["doan"], hien_tai: v.van, hanh_dong: v.hanh_dong, yeu_cau: v.yeu_cau,
        ngu_canh: { tieu_de_bai: v.tieu_de, mang: v.mang } }),
      signal: AbortSignal.timeout(60_000),
    });
    if (!r.ok) return { nhap: null, kiem_dinh: [], loi: r.status === 401 || r.status === 403 ? "Engine từ chối (sai ENGINE_API_KEY)." : `Engine lỗi ${r.status}.` };
    const d = (await r.json()) as KetQuaSoan;
    return { nhap: d.nhap ?? null, kiem_dinh: d.kiem_dinh ?? [], ...(d.loi ? { loi: d.loi } : {}) };
  } catch {
    return { nhap: null, kiem_dinh: [], loi: "Không kết nối được engine, thử lại sau." };
  }
}
