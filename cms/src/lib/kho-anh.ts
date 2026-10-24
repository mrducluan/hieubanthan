// Kho ảnh của CMS (Thư viện ảnh): Supabase Storage qua S3 khi đủ biến S3_*, không thì ổ đĩa máy (chỉ lúc chạy máy).
// Sự cố 2026-10-24: tải ảnh trên cms.hieuban.com báo "There was a problem while uploading the file." — Payload gom MỌI
// lỗi xử lý ảnh (sharp đổi WebP / tạo cỡ, ghi đĩa) vào một câu chung, chi tiết chỉ nằm trong log máy chủ. Tệp này:
//   (1) đọc cấu hình kho + biến thiếu;  (2) `kiemKhoAnh()` tải THẬT một ảnh 16×16 qua đúng đường đi của Payload
//   (sharp → kho → URL công khai) rồi xoá, bắt lại lỗi gốc từ logger và dịch thành việc cần làm;  (3) lọc chuỗi lỗi
//   để không lộ khoá. Không thêm dependency.
import type { Payload } from "payload";
import sharp from "sharp";

export type NguonKho = "s3" | "dia";
export const BIEN_S3 = ["S3_BUCKET", "S3_ENDPOINT", "S3_ACCESS_KEY_ID", "S3_SECRET_ACCESS_KEY"] as const;

export function cauHinhKho(env: NodeJS.ProcessEnv = process.env): { nguon: NguonKho; vercel: boolean; thieu: string[]; public_url: string } {
  const thieu: string[] = BIEN_S3.filter((k) => !(env[k] ?? "").trim());
  const nguon: NguonKho = thieu.length === 0 ? "s3" : "dia";
  if (nguon === "s3" && !(env.S3_PUBLIC_URL ?? "").trim()) thieu.push("S3_PUBLIC_URL");
  return { nguon, vercel: Boolean(env.VERCEL), thieu, public_url: (env.S3_PUBLIC_URL ?? "").replace(/\/+$/, "") };
}

/** Lời báo khi CMS chạy trên Vercel mà chưa nối S3: ổ đĩa hàm Vercel chỉ đọc → mọi lần tải ảnh đều hỏng. */
export const LOI_CHUA_NOI_KHO = "Kho ảnh chưa nối: dự án CMS trên Vercel thiếu biến S3_BUCKET / S3_ENDPOINT / S3_ACCESS_KEY_ID / "
  + "S3_SECRET_ACCESS_KEY (+ S3_PUBLIC_URL). Ổ đĩa của Vercel không ghi được nên tải ảnh sẽ luôn lỗi. "
  + "Làm theo mục CMS1 trong docs/VIEC-CUA-ANH.md (Supabase → Storage → bucket cms-media công khai → S3 access key), rồi Redeploy CMS.";

/** Bỏ thứ trông như khoá/chữ ký: chuỗi ≥ 20 ký tự liền có số / dấu + / = _ - hoặc toàn chữ hoa (AKIA…), và tham số
 *  X-Amz-* — giữ lại tên lỗi dạng CamelCase (SignatureDoesNotMatch) để còn đọc được. */
export function locLoi(s: string): string {
  return s.replace(/[A-Za-z0-9+/_=-]{20,}/g, (t) => (/[0-9+/=_-]/.test(t) || t === t.toUpperCase() ? "…" : t))
    .replace(/(X-Amz-[A-Za-z-]+=)[^&\s]+/g, "$1…").replace(/\s+/g, " ").trim().slice(0, 400);
}

/** Dịch lỗi gốc thành việc cần làm (tiếng Việt). */
export function goiYTuLoi(loi: string, nguon: NguonKho, vercel: boolean): string {
  const l = loi.toLowerCase();
  if (/erofs|read-only file system/.test(l) || (nguon === "dia" && vercel)) return LOI_CHUA_NOI_KHO;
  if (/nosuchbucket|the specified bucket does not exist/.test(l)) return "Bucket chưa có trên Supabase Storage: tạo bucket đúng tên trong S3_BUCKET (cms-media), bật Public.";
  if (/invalidaccesskeyid|signaturedoesnotmatch|access key|invalid.*credential/.test(l)) return "Khoá S3 sai: Supabase → Project Settings → Storage → S3 Connection → tạo lại Access key và dán đủ S3_ACCESS_KEY_ID + S3_SECRET_ACCESS_KEY (không dư dấu cách).";
  if (/accessdenied|forbidden|403/.test(l)) return "Khoá S3 không có quyền ghi vào bucket này, hoặc bucket chưa Public: kiểm quyền của access key và cài đặt bucket.";
  if (/enotfound|getaddrinfo|econnrefused|unknownendpoint|invalid url|certificate/.test(l)) return "Không nối được S3_ENDPOINT: phải có dạng https://<project>.supabase.co/storage/v1/s3 và S3_REGION đúng vùng dự án (ap-southeast-1).";
  if (/sharp|libvips|could not load|\.node|input buffer|unsupported image/.test(l)) return "Thư viện xử lý ảnh (sharp) không chạy trên máy chủ hoặc không đọc được ảnh: thử ảnh JPG/PNG thường (không HEIC/SVG), nếu vẫn lỗi → báo kỹ thuật kèm dòng chi tiết.";
  if (/payload_too_large|413|body exceeded|too large/.test(l)) return "Ảnh quá lớn cho máy chủ Vercel (trần 4,5 MB mỗi lần gửi): nén ảnh dưới 4,5 MB rồi tải lại.";
  if (/timeout|timed out|504/.test(l)) return "Xử lý quá lâu (ảnh quá lớn): thu nhỏ ảnh về rộng ≤ 2000 px trước khi tải.";
  return nguon === "s3" ? "Kiểm lại 5 biến S3_* trên Vercel (đúng tên, không dư dấu cách) rồi Redeploy; dòng chi tiết ở trên là lỗi gốc."
    : "Kiểm quyền ghi thư mục media trên máy chạy CMS.";
}

export type BuocKiem = { ten: string; ok: boolean; chi_tiet?: string };
export type KetQuaKho = { ok: boolean; nguon: NguonKho; vercel: boolean; thieu: string[]; buoc: BuocKiem[]; goi_y: string[]; url?: string };

const ALT_KIEM = "Ảnh kiểm tra kho (tự xoá)";

/** Tải thử một ảnh 16×16 qua đúng đường đi của Payload rồi xoá. Bắt lỗi gốc mà Payload chỉ ghi log. */
export async function kiemKhoAnh(payload: Payload, env: NodeJS.ProcessEnv = process.env): Promise<KetQuaKho> {
  const ch = cauHinhKho(env);
  const kq: KetQuaKho = { ok: true, nguon: ch.nguon, vercel: ch.vercel, thieu: ch.thieu, buoc: [], goi_y: [] };
  const hong = (ten: string, loi: string) => { kq.ok = false; kq.buoc.push({ ten, ok: false, chi_tiet: locLoi(loi) }); kq.goi_y.push(goiYTuLoi(loi, ch.nguon, ch.vercel)); };

  if (ch.nguon === "dia" && ch.vercel) { hong("Cấu hình kho", `Thiếu ${ch.thieu.join(", ")} (EROFS trên Vercel)`); return kq; }
  kq.buoc.push({ ten: "Cấu hình kho", ok: true, chi_tiet: ch.nguon === "s3" ? `Supabase Storage (S3), bucket ${env.S3_BUCKET}${ch.thieu.length ? ` — thiếu ${ch.thieu.join(", ")}` : ""}` : "Ổ đĩa máy (chỉ dùng khi chạy máy)" });
  if (ch.nguon === "s3" && ch.thieu.length) kq.goi_y.push(`Thiếu biến ${ch.thieu.join(", ")} → URL ảnh công khai sẽ sai.`);

  // 1) sharp
  let png: Buffer;
  try {
    png = await sharp({ create: { width: 16, height: 16, channels: 3, background: "#c8a24a" } }).png().toBuffer();
    await sharp(png).webp().toBuffer();
    kq.buoc.push({ ten: "Thư viện xử lý ảnh (sharp → WebP)", ok: true });
  } catch (e) { hong("Thư viện xử lý ảnh (sharp → WebP)", String((e as Error).stack ?? e)); return kq; }

  // 2) tải thật qua Payload — bắt lỗi gốc từ logger (Payload ném FileUploadError chung chung).
  const batLoi: string[] = [];
  const logger = payload.logger as unknown as { error: (...a: unknown[]) => void };
  const gocError = logger.error;
  logger.error = (...a: unknown[]) => {
    const x = a[0];
    batLoi.push(x instanceof Error ? `${x.name}: ${x.message}` : typeof x === "string" ? x : JSON.stringify(x).slice(0, 300));
    gocError.apply(payload.logger, a as never);
  };
  let id: number | string | null = null;
  try {
    const d = await payload.create({ collection: "media", overrideAccess: true, data: { alt: ALT_KIEM, nguon_anh: "Hiểu Bản Thân" } as never,
      file: { data: png, mimetype: "image/png", name: `kiem-kho-${Date.now().toString(36)}.png`, size: png.length } }) as unknown as { id: number | string; url?: string };
    id = d.id;
    kq.url = d.url;
    kq.buoc.push({ ten: "Ghi thử một ảnh 16×16 vào kho", ok: true, chi_tiet: d.url });
  } catch (e) {
    const goc = batLoi.length ? batLoi.join(" | ") : String((e as Error).message ?? e);
    hong("Ghi thử một ảnh 16×16 vào kho", goc);
  } finally {
    logger.error = gocError;
  }

  // 3) đọc lại qua URL công khai — chỉ với S3 (ổ đĩa máy phục vụ qua /api/media/file của chính CMS, không cần kiểm)
  if (ch.nguon === "s3" && kq.url && /^https?:\/\//.test(kq.url)) {
    try {
      const r = await fetch(kq.url, { method: "HEAD", signal: AbortSignal.timeout(10_000), cache: "no-store" });
      if (r.ok) kq.buoc.push({ ten: "Đọc lại ảnh qua URL công khai", ok: true, chi_tiet: `HTTP ${r.status}` });
      else { kq.ok = false; kq.buoc.push({ ten: "Đọc lại ảnh qua URL công khai", ok: false, chi_tiet: `HTTP ${r.status}` });
        kq.goi_y.push(r.status === 404 || r.status === 400 ? "Bucket chưa bật Public hoặc S3_PUBLIC_URL sai: phải là https://<project>.supabase.co/storage/v1/object/public/<bucket>." : "URL công khai trả lỗi — kiểm S3_PUBLIC_URL và quyền đọc công khai của bucket."); }
    } catch (e) { kq.ok = false; kq.buoc.push({ ten: "Đọc lại ảnh qua URL công khai", ok: false, chi_tiet: locLoi(String((e as Error).message ?? e)) }); kq.goi_y.push("Không tới được S3_PUBLIC_URL — kiểm tên miền."); }
  }

  // 4) dọn: xoá ảnh thử (kể cả bản ghi mồ côi khi kho ném lỗi SAU khi đã ghi DB)
  try {
    if (id != null) await payload.delete({ collection: "media", id, overrideAccess: true });
    const moCoi = await payload.find({ collection: "media", where: { alt: { equals: ALT_KIEM } }, limit: 20, depth: 0, overrideAccess: true });
    for (const d of moCoi.docs) await payload.delete({ collection: "media", id: d.id, overrideAccess: true }).catch(() => {});
    kq.buoc.push({ ten: "Xoá ảnh thử", ok: true, ...(moCoi.docs.length ? { chi_tiet: `đã dọn ${moCoi.docs.length} bản ghi mồ côi` } : {}) });
  } catch (e) { kq.buoc.push({ ten: "Xoá ảnh thử", ok: false, chi_tiet: locLoi(String((e as Error).message ?? e)) }); }
  kq.goi_y = [...new Set(kq.goi_y)];
  return kq;
}
