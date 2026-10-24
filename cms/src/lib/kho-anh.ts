// Kho ảnh của CMS (Thư viện ảnh): Supabase Storage qua S3 khi đủ biến S3_*, không thì ổ đĩa máy (chỉ lúc chạy máy).
// Sự cố 2026-10-24: tải ảnh trên cms.hieuban.com báo "There was a problem while uploading the file." — Payload gom MỌI
// lỗi xử lý ảnh (sharp đổi WebP / tạo cỡ, ghi đĩa) vào một câu chung, chi tiết chỉ nằm trong log máy chủ. Tệp này:
//   (1) đọc cấu hình kho + biến thiếu;  (2) `kiemKhoAnh()` tải THẬT một ảnh 16×16 qua đúng đường đi của Payload
//   (sharp → kho → URL công khai) rồi xoá, bắt lại lỗi gốc từ logger và dịch thành việc cần làm;  (3) lọc chuỗi lỗi
//   để không lộ khoá. Không thêm dependency.
// Sự cố 2026-10-24 (lần 2): sau khi thêm cột, Supabase trả 403 SignatureDoesNotMatch. Mã nguồn Supabase Storage
// (protocols/s3/signature-v4.ts): mã khoá sai → "Invalid Access Key"; còn SignatureDoesNotMatch = khoá bí mật sai / dính
// khoảng trắng, HOẶC vùng khách ký khác vùng dự án (máy chủ ký lại bằng vùng của nó trừ khi khách dùng auto/us-east-1),
// HOẶC host endpoint khác host máy chủ dùng để ký. → `cauHinhS3()` làm sạch biến; `chanDoanS3()` tự ký thử để chỉ đúng chỗ.
import { createHash, createHmac } from "node:crypto";
import type { Payload } from "payload";
import sharp from "sharp";

export type NguonKho = "s3" | "dia";
export const BIEN_S3 = ["S3_BUCKET", "S3_ENDPOINT", "S3_ACCESS_KEY_ID", "S3_SECRET_ACCESS_KEY"] as const;

/** Bỏ khoảng trắng / xuống dòng hai đầu và cặp ngoặc bao ngoài (dán từ tệp .env hay kèm "…"). */
export function sachBien(v: string | undefined): string {
  let s = (v ?? "").trim();
  if (s.length >= 2 && (s[0] === "\"" || s[0] === "'") && s.at(-1) === s[0]) s = s.slice(1, -1).trim();
  return s;
}

export type CauHinhS3 = { bucket: string; endpoint: string; region: string; key: string; secret: string; public: string };

/** Cấu hình S3 đã làm sạch — MỘT nguồn cho plugin (payload.config.ts) và bộ kiểm tra. Khoá không bao giờ có khoảng
 *  trắng → bỏ hết (kể cả xuống dòng giữa chuỗi khi dán bị ngắt dòng). */
export function cauHinhS3(env: NodeJS.ProcessEnv = process.env): CauHinhS3 {
  return {
    bucket: sachBien(env.S3_BUCKET),
    endpoint: sachBien(env.S3_ENDPOINT).replace(/\/+$/, ""),
    region: sachBien(env.S3_REGION) || "ap-southeast-1",
    key: sachBien(env.S3_ACCESS_KEY_ID).replace(/\s+/g, ""),
    secret: sachBien(env.S3_SECRET_ACCESS_KEY).replace(/\s+/g, ""),
    public: sachBien(env.S3_PUBLIC_URL).replace(/\/+$/, ""),
  };
}

export type NhaCungCap = "supabase" | "r2" | "s3";
/** Nhận nhà cung cấp từ endpoint — để chỉ đúng bảng điều khiển khi khoá / vùng sai. */
export function nhaCungCap(endpoint: string): NhaCungCap {
  try {
    const h = new URL(endpoint).hostname;
    if (/\.r2\.cloudflarestorage\.com$/.test(h)) return "r2";
    if (/\.supabase\.(co|in)$/.test(h)) return "supabase";
  } catch { /* endpoint hỏng: báo ở bước ký thử */ }
  return "s3";
}
export const TEN_NHA: Record<NhaCungCap, string> = { supabase: "Supabase Storage (S3)", r2: "Cloudflare R2", s3: "kho S3" };

export function cauHinhKho(env: NodeJS.ProcessEnv = process.env): { nguon: NguonKho; nha: NhaCungCap; vercel: boolean; thieu: string[]; public_url: string } {
  const thieu: string[] = BIEN_S3.filter((k) => !sachBien(env[k]));
  const nguon: NguonKho = thieu.length === 0 ? "s3" : "dia";
  if (nguon === "s3" && !sachBien(env.S3_PUBLIC_URL)) thieu.push("S3_PUBLIC_URL");
  return { nguon, nha: nhaCungCap(sachBien(env.S3_ENDPOINT)), vercel: Boolean(env.VERCEL), thieu, public_url: cauHinhS3(env).public };
}

/** Vùng Supabase có thể đặt dự án (dò khi chữ ký sai). */
export const VUNG_SUPABASE = ["ap-southeast-1", "ap-southeast-2", "ap-northeast-1", "ap-northeast-2", "ap-south-1", "us-east-1", "us-east-2",
  "us-west-1", "us-west-2", "ca-central-1", "sa-east-1", "eu-west-1", "eu-west-2", "eu-west-3", "eu-central-1", "eu-central-2", "eu-north-1"] as const;

type KetQuaKy = { ok: boolean; status: number; ma: string; thong_diep: string };
const sha = (s: string) => createHash("sha256").update(s).digest("hex");
const hmac = (k: string | Buffer, s: string) => createHmac("sha256", k).update(s).digest();

/** Tự ký SigV4 một lệnh ĐỌC (ListObjectsV2, 1 mục) — không ghi gì vào kho. */
export async function kyThuS3(c: CauHinhS3, region: string, endpoint = c.endpoint): Promise<KetQuaKy> {
  const u = new URL(`${endpoint}/${encodeURIComponent(c.bucket)}`);
  const qs = "list-type=2&max-keys=1";
  u.search = qs;
  const amz = new Date().toISOString().replace(/[-:]|\.\d{3}/g, "");
  const ngay = amz.slice(0, 8);
  const rong = sha("");
  const ky = "host;x-amz-content-sha256;x-amz-date";
  const chuan = ["GET", u.pathname, qs, `host:${u.host}`, `x-amz-content-sha256:${rong}`, `x-amz-date:${amz}`, "", ky, rong].join("\n");
  const pham = `${ngay}/${region}/s3/aws4_request`;
  const khoaKy = hmac(hmac(hmac(hmac(`AWS4${c.secret}`, ngay), region), "s3"), "aws4_request");
  const chuKy = createHmac("sha256", khoaKy).update(["AWS4-HMAC-SHA256", amz, pham, sha(chuan)].join("\n")).digest("hex");
  const r = await fetch(u, { cache: "no-store", signal: AbortSignal.timeout(8_000), headers: {
    "x-amz-date": amz, "x-amz-content-sha256": rong,
    authorization: `AWS4-HMAC-SHA256 Credential=${c.key}/${pham}, SignedHeaders=${ky}, Signature=${chuKy}` } });
  const t = await r.text().catch(() => "");
  const ma = /<Code>([^<]+)<\/Code>/.exec(t)?.[1] ?? /"(?:code|error)"\s*:\s*"([^"]+)"/.exec(t)?.[1] ?? (r.ok ? "" : `HTTP ${r.status}`);
  const thong_diep = /<Message>([^<]+)<\/Message>/.exec(t)?.[1] ?? /"message"\s*:\s*"([^"]+)"/.exec(t)?.[1] ?? "";
  return { ok: r.ok, status: r.status, ma, thong_diep };
}

/** Host còn lại của cùng dự án Supabase (<ref>.supabase.co ↔ <ref>.storage.supabase.co) — máy chủ ký theo một host. */
export function endpointThayThe(endpoint: string): string | null {
  try {
    const u = new URL(endpoint);
    const m = /^([a-z0-9]+)\.(storage\.)?supabase\.co$/.exec(u.hostname);
    if (!m) return null;
    u.hostname = m[2] ? `${m[1]}.supabase.co` : `${m[1]}.storage.supabase.co`;
    return u.toString().replace(/\/+$/, "");
  } catch { return null; }
}

export type ChanDoan = { ok: boolean; chi_tiet: string; goi_y: string[] };

/** Ký thử bằng cấu hình hiện tại; hỏng thì dò: vùng nào ký được, host còn lại có được không → chỉ ĐÚNG biến cần sửa. */
const TAO_KHOA: Record<NhaCungCap, string> = {
  supabase: "Supabase → Project Settings → Storage → S3 Connection → New access key",
  r2: "Cloudflare → R2 → Manage R2 API Tokens → Create API token (quyền Object Read & Write, đúng bucket)",
  s3: "bảng điều khiển của kho S3 → tạo access key mới",
};

export async function chanDoanS3(c: CauHinhS3, env: NodeJS.ProcessEnv = process.env): Promise<ChanDoan> {
  const nha = nhaCungCap(c.endpoint);
  // R2: endpoint là https://<account>.r2.cloudflarestorage.com — KHÔNG kèm tên bucket (bảng Cloudflare hay hiện kèm).
  try {
    const duong = new URL(c.endpoint).pathname.replace(/\/+$/, "");
    if (c.bucket && duong.split("/").pop() === c.bucket) {
      return { ok: false, chi_tiet: `S3_ENDPOINT kết thúc bằng tên bucket "${c.bucket}"`, goi_y: [
        `Bỏ "/${c.bucket}" ở cuối S3_ENDPOINT (tên bucket đã nằm ở S3_BUCKET) → Redeploy.`] };
    }
  } catch { /* để bước ký thử báo */ }
  const hinh = `mã khoá ${c.key.length} ký tự, khoá bí mật ${c.secret.length} ký tự, vùng ${c.region}`;
  const tho = (sachBien(env.S3_SECRET_ACCESS_KEY) !== (env.S3_SECRET_ACCESS_KEY ?? "") || sachBien(env.S3_ACCESS_KEY_ID) !== (env.S3_ACCESS_KEY_ID ?? ""))
    ? " · biến khoá có khoảng trắng / ngoặc thừa (đã tự bỏ)" : "";
  let r: KetQuaKy;
  try { r = await kyThuS3(c, c.region); }
  catch (e) {
    return { ok: false, chi_tiet: locLoi(String((e as Error).message ?? e)), goi_y: [
      nha === "r2" ? "Không nối được S3_ENDPOINT: R2 có dạng https://<account-id>.r2.cloudflarestorage.com (Cloudflare → R2 → bucket → Settings → S3 API)."
        : "Không nối được S3_ENDPOINT: phải có dạng https://<project>.supabase.co/storage/v1/s3 (Supabase → Project Settings → Storage → S3 Connection → Endpoint)."] };
  }
  if (r.ok) return { ok: true, chi_tiet: `${hinh}${tho}`, goi_y: [] };
  const loi = `${r.ma}${r.thong_diep ? `: ${r.thong_diep}` : ""} (HTTP ${r.status}) · ${hinh}${tho}`;
  const ketQua = (goi_y: string[]): ChanDoan => ({ ok: false, chi_tiet: locLoi(loi), goi_y });
  if (/nosuchbucket/i.test(r.ma) || /bucket.*not.*(exist|found)/i.test(r.thong_diep)) {
    return ketQua([nha === "r2" ? `Bucket "${c.bucket}" chưa có trên R2: Cloudflare → R2 → Create bucket tên đúng S3_BUCKET (hoặc sửa S3_BUCKET cho khớp).`
      : `Bucket "${c.bucket}" chưa có: Supabase → Storage → New bucket tên đúng S3_BUCKET, bật Public.`]);
  }
  if (/invalidaccesskeyid/i.test(r.ma) || /access key/i.test(r.thong_diep)) {
    return ketQua([`S3_ACCESS_KEY_ID không có trong tài khoản / dự án của S3_ENDPOINT (dán nhầm, khoá đã thu hồi, hoặc khoá của nơi khác): `
      + `${TAO_KHOA[nha]}, dán lại CẢ HAI S3_ACCESS_KEY_ID + S3_SECRET_ACCESS_KEY, Redeploy.`]);
  }
  const vungKhac = /signaturedoesnotmatch/i.test(r.ma) || /region/i.test(r.thong_diep);
  if (!vungKhac) return ketQua([goiYTuLoi(loi, "s3", Boolean(env.VERCEL))]);

  // Dò vùng: vùng nào ký đúng thì khoá bí mật đúng — chỉ S3_REGION sai.
  const dsVung = nha === "r2" ? ["auto"] : [...VUNG_SUPABASE];
  const thu = await Promise.all(dsVung.filter((v) => v !== c.region).map(async (v) => ({ v, r: await kyThuS3(c, v).catch(() => null) })));
  const duoc = thu.filter((x) => x.r?.ok).map((x) => x.v);
  const vungThat = duoc.find((v) => v !== "us-east-1") ?? duoc[0];
  if (vungThat) {
    return ketQua([`Khoá S3 ĐÚNG nhưng S3_REGION sai: đang là "${c.region}", ${nha === "r2" ? "R2 cần" : "dự án Supabase ở"} "${vungThat}". `
      + `Vercel → dự án CMS → Settings → Environment Variables → đặt S3_REGION = ${vungThat} → Redeploy.`]);
  }
  // Dò host còn lại của cùng dự án.
  const khac = endpointThayThe(c.endpoint);
  if (khac) {
    const h = await kyThuS3(c, c.region, khac).catch(() => null);
    if (h?.ok) return ketQua([`Khoá S3 ĐÚNG nhưng máy chủ ký theo host khác: đổi S3_ENDPOINT thành ${khac} → Redeploy.`]);
  }
  return ketQua([
    "S3_SECRET_ACCESS_KEY không khớp S3_ACCESS_KEY_ID (mã khoá được nhận, nhưng khoá bí mật sai — mọi vùng đều ký không khớp). "
      + `Khoá bí mật chỉ hiện MỘT lần lúc tạo: ${TAO_KHOA[nha]}, `
      + "dán CẢ HAI giá trị mới vào Vercel (dự án CMS, môi trường Production) → Redeploy. Có thể xoá khoá cũ.",
  ]);
}

/** Lời báo khi CMS chạy trên Vercel mà chưa nối S3: ổ đĩa hàm Vercel chỉ đọc → mọi lần tải ảnh đều hỏng. */
export const LOI_CHUA_NOI_KHO = "Kho ảnh chưa nối: dự án CMS trên Vercel thiếu biến S3_BUCKET / S3_ENDPOINT / S3_ACCESS_KEY_ID / "
  + "S3_SECRET_ACCESS_KEY (+ S3_PUBLIC_URL). Ổ đĩa của Vercel không ghi được nên tải ảnh sẽ luôn lỗi. "
  + "Làm theo mục CMS1 trong docs/VIEC-CUA-ANH.md (Supabase Storage hoặc Cloudflare R2 — docs/LUU-TRU-MEDIA.md), rồi Redeploy CMS.";

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
  if (/nosuchbucket|the specified bucket does not exist/.test(l)) return "Bucket chưa có trong kho: tạo bucket đúng tên trong S3_BUCKET (cms-media) — Supabase: bật Public; R2: bật Public access (r2.dev hoặc tên miền riêng).";
  if (/signaturedoesnotmatch/.test(l)) return "Chữ ký S3 không khớp: khoá bí mật (S3_SECRET_ACCESS_KEY) sai, hoặc S3_REGION khác vùng của kho (Supabase: vùng dự án; R2: auto). Mở Thư viện ảnh → bấm \"Kiểm tra kho ảnh\": máy tự ký thử và chỉ đúng biến cần sửa.";
  if (/invalidaccesskeyid|access key|invalid.*credential/.test(l)) return "Mã khoá S3 sai: tạo khoá mới (Supabase → Project Settings → Storage → S3 Connection; R2 → Manage R2 API Tokens), dán đủ S3_ACCESS_KEY_ID + S3_SECRET_ACCESS_KEY, Redeploy.";
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
  kq.buoc.push({ ten: "Cấu hình kho", ok: true, chi_tiet: ch.nguon === "s3" ? `${TEN_NHA[ch.nha]}, bucket ${sachBien(env.S3_BUCKET)}${ch.thieu.length ? ` — thiếu ${ch.thieu.join(", ")}` : ""}` : "Ổ đĩa máy (chỉ dùng khi chạy máy)" });
  if (ch.nguon === "s3" && ch.thieu.length) kq.goi_y.push(`Thiếu biến ${ch.thieu.join(", ")} → URL ảnh công khai sẽ sai.`);

  // 0) S3: tự ký thử một lệnh đọc trước — chữ ký sai thì tải ảnh chắc chắn hỏng, chỉ đúng biến cần sửa rồi dừng.
  if (ch.nguon === "s3") {
    const cd = await chanDoanS3(cauHinhS3(env), env);
    kq.buoc.push({ ten: "Khoá + vùng S3 (ký thử, không ghi gì)", ok: cd.ok, chi_tiet: cd.chi_tiet });
    if (!cd.ok) { kq.ok = false; kq.goi_y.push(...cd.goi_y); kq.goi_y = [...new Set(kq.goi_y)]; return kq; }
  }

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
