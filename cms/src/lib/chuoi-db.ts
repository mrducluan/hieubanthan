// Chuỗi kết nối Postgres cho CMS. Supabase có hai cổng pooler cùng máy chủ, cùng tài khoản:
// - 5432 "Session": mỗi kết nối của CMS giữ riêng một kết nối DB tới khi đóng. Chung hạn mức pool_size (15 ở gói
//   Free) → vài bản hàm Vercel (Fluid giữ bản hàm "ngủ" mà không đóng kết nối) là đầy: build báo EMAXCONNSESSION,
//   /admin lỗi 500 (sự cố 2026-10-24).
// - 6543 "Transaction": kết nối DB chỉ bị giữ trong một giao dịch → nhiều bản hàm dùng chung được.
// → Lúc chạy dùng 6543; `payload migrate` (CMS_DB_CHE_DO=phien) giữ 5432 vì migration cần nguyên phiên.
// Chỉ đổi chuỗi pooler Supabase cổng 5432; localhost / chuỗi khác để nguyên. CMS_DB_GIAO_DICH=0 tắt việc đổi cổng.
export function chuoiDb(goc: string, env: Record<string, string | undefined> = process.env): string {
  const s = goc.trim();
  if (env.CMS_DB_CHE_DO === "phien" || env.CMS_DB_GIAO_DICH === "0") return s;
  let u: URL;
  try { u = new URL(s); } catch { return s; }
  if (!/\.pooler\.supabase\.com$/i.test(u.hostname) || (u.port && u.port !== "5432")) return s;
  u.port = "6543";
  return u.toString();
}
