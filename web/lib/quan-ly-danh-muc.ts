// QLNS-2 — kho công khai của trang /quan-ly-nhan-su đọc từ ENGINE (`GET /v1/doanh-chu/tinh-huong`): tình huống quản lý,
// vai trò 5 hành, kế hoạch mẫu 4 tuần. MỘT nguồn cho phần chữ của trang lẫn ảnh minh hoạ (`/og/quan-ly`) — web không viết
// cứng tri thức; engine bận → null và trang tự ẩn các phần phụ thuộc (công cụ vẫn chạy).
const ENGINE_URL = process.env.ENGINE_URL ?? "http://localhost:8000";
const ENGINE_API_KEY = process.env.ENGINE_API_KEY;

export interface DanhMucQuanLy {
  tinh_huong: { ma: string; van_de: string; goc_nhin: string; mo_loi: string; viec: string }[];
  vai_tro_hanh: { hanh: string; vai_tro: string; gia_tri: string }[];
  ke_hoach_mau: { tuan: string; tieu_de: string; y: string }[];
}

export async function layDanhMucQuanLy(): Promise<DanhMucQuanLy | null> {
  try {
    const r = await fetch(`${ENGINE_URL}/v1/doanh-chu/tinh-huong`, {
      headers: ENGINE_API_KEY ? { "x-engine-key": ENGINE_API_KEY } : {},
      next: { revalidate: 60 * 60 * 24 }, signal: AbortSignal.timeout(10_000),
    });
    if (!r.ok) return null;
    const d = (await r.json()) as Partial<DanhMucQuanLy>;
    // Engine cũ (lệch deploy) chưa có kế hoạch mẫu → bỏ phần hình kế hoạch, giữ phần còn lại.
    return { tinh_huong: d.tinh_huong ?? [], vai_tro_hanh: d.vai_tro_hanh ?? [], ke_hoach_mau: d.ke_hoach_mau ?? [] };
  } catch {
    return null;
  }
}
