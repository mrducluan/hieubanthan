// Kho ảnh qua S3 (đường đi THẬT của Payload + @payloadcms/storage-s3) trên máy chủ S3 giả + Postgres thật:
// tải ảnh → sharp đổi WebP + sinh cỡ → ghi bucket → URL công khai đọc được → xoá; bucket chưa có → "Kiểm tra kho ảnh"
// chỉ đúng nguyên nhân + tự dọn bản ghi mồ côi. S3 giả KIỂM CHỮ KÝ SigV4 như Supabase → tái hiện 403 SignatureDoesNotMatch
// (khoá bí mật sai, sai vùng, biến dán kèm khoảng trắng / ngoặc) — sự cố production 2026-10-24.
// Chạy: DATABASE_URI=… npm run test:kho-anh
import assert from "node:assert/strict";
import sharp from "sharp";
import { moS3Gia } from "./s3-gia";

const s3 = await moS3Gia();
process.env.S3_BUCKET = "cms-media";
// Biến "bẩn" như khi dán vào Vercel: xuống dòng, khoảng trắng, ngoặc kép, gạch chéo cuối — cấu hình phải tự làm sạch.
process.env.S3_ENDPOINT = `${s3.url}/`;
process.env.S3_REGION = " ap-southeast-1";
process.env.S3_ACCESS_KEY_ID = "khoa-gia\n";
process.env.S3_SECRET_ACCESS_KEY = ' "bi-mat-gia"\n';
process.env.S3_PUBLIC_URL = `${s3.url}/cms-media`;
delete process.env.VERCEL;

// Cấu hình đọc env lúc import → nạp SAU khi đặt biến.
const { default: config } = await import("../src/payload.config");
const { getPayload } = await import("payload");
const { cauHinhKho, cauHinhS3, chanDoanS3, endpointThayThe, goiYTuLoi, kiemKhoAnh, kyThuS3, locLoi, nhaCungCap } = await import("../src/lib/kho-anh");
const { Media } = await import("../src/collections/Media");
const payload = await getPayload({ config });

let dat = 0;
async function ca(ten: string, f: () => Promise<void>) {
  try { await f(); dat++; console.log(`  ✓ ${ten}`); }
  catch (e) { console.error(`  ✕ ${ten}\n`, e); process.exitCode = 1; }
}
console.log("Kho ảnh S3:");

await ca("cấu hình: đủ biến → nguồn s3; thiếu khoá → ổ đĩa; lọc lỗi không lộ khoá; gợi ý theo lỗi", async () => {
  assert.equal(cauHinhKho().nguon, "s3");
  assert.deepEqual(cauHinhKho().thieu, []);
  const t = cauHinhKho({ S3_BUCKET: "a", S3_ENDPOINT: "b", NODE_ENV: "test" } as NodeJS.ProcessEnv);
  assert.equal(t.nguon, "dia"); assert.deepEqual(t.thieu, ["S3_ACCESS_KEY_ID", "S3_SECRET_ACCESS_KEY"]);
  assert.equal(locLoi("SignatureDoesNotMatch key=AKIAABCDEFGHIJKLMNOPQRSTUV x"), "SignatureDoesNotMatch … x");
  assert.equal(locLoi("InvalidAccessKeyId AKIAABCDEFGHIJKLMNOPQRSTUV Signature=abc123def456ghi789jkl012"), "InvalidAccessKeyId … …");
  assert.match(goiYTuLoi("EROFS: read-only file system", "dia", true), /Vercel/);
  assert.match(goiYTuLoi("NoSuchBucket", "s3", true), /bucket/i);
  assert.match(goiYTuLoi("InvalidAccessKeyId", "s3", true), /Mã khoá S3 sai/);
  assert.match(goiYTuLoi("SignatureDoesNotMatch", "s3", true), /Kiểm tra kho ảnh/);
  assert.match(goiYTuLoi("getaddrinfo ENOTFOUND x", "s3", true), /S3_ENDPOINT/);
  assert.match(goiYTuLoi("Could not load the sharp module", "s3", true), /sharp/);
});

await ca("tải ảnh thật qua S3: ảnh gốc + các cỡ vào bucket với tiền tố cms/, URL công khai đúng, xoá bài → xoá tệp", async () => {
  const png = await sharp({ create: { width: 1800, height: 1000, channels: 3, background: "#2a2450" } }).png().toBuffer();
  const d = await payload.create({ collection: "media", overrideAccess: true, data: { alt: "Ảnh thử S3" } as never,
    file: { data: png, mimetype: "image/png", name: "anh-thu-s3.png", size: png.length } }) as unknown as
    { id: number; url: string; filename: string; sizes: Record<string, { url?: string; filename?: string }> };
  assert.match(d.filename, /^anh-thu-s3.*\.webp$/, "đổi sang WebP");
  assert.equal(d.url, `${s3.url}/cms-media/cms/${d.filename}`);
  assert.ok(s3.kho.has(`cms-media/cms/${d.filename}`), "ảnh gốc nằm trong bucket");
  for (const k of ["nho", "vua", "lon", "og"]) {
    const c = d.sizes[k];
    assert.ok(c?.filename, `có cỡ ${k}`);
    assert.ok(s3.kho.has(`cms-media/cms/${c!.filename}`), `cỡ ${k} nằm trong bucket`);
    assert.equal(c!.url, `${s3.url}/cms-media/cms/${c!.filename}`);
  }
  const r = await fetch(d.url, { method: "HEAD" });
  assert.equal(r.status, 200);
  await payload.delete({ collection: "media", id: d.id, overrideAccess: true });
  assert.equal([...s3.kho.keys()].filter((k) => k.includes("anh-thu-s3")).length, 0, "xoá bài là xoá hết tệp trên bucket");
});

await ca("biến dán bẩn được làm sạch: S3 giả kiểm chữ ký bắt được khoá CHƯA làm sạch; sau làm sạch ký đúng", async () => {
  const c = cauHinhS3();
  assert.deepEqual([c.key, c.secret, c.region, c.endpoint], ["khoa-gia", "bi-mat-gia", "ap-southeast-1", s3.url]);
  const chuaSach = await kyThuS3({ ...c, secret: String(process.env.S3_SECRET_ACCESS_KEY) }, c.region);
  assert.equal(chuaSach.ma, "SignatureDoesNotMatch", "khoá kèm ngoặc/xuống dòng → chữ ký sai (đúng lỗi production)");
  assert.equal((await kyThuS3(c, c.region)).ok, true);
  assert.equal(endpointThayThe("https://abc123.supabase.co/storage/v1/s3"), "https://abc123.storage.supabase.co/storage/v1/s3");
  assert.equal(endpointThayThe("https://abc123.storage.supabase.co/storage/v1/s3"), "https://abc123.supabase.co/storage/v1/s3");
  assert.equal(endpointThayThe(s3.url), null);
});

await ca("Cloudflare R2: nhận nhà cung cấp; endpoint dán kèm tên bucket → chỉ đúng chỗ (không gọi mạng)", async () => {
  assert.equal(nhaCungCap("https://0123abcd.r2.cloudflarestorage.com"), "r2");
  assert.equal(nhaCungCap("https://abc.supabase.co/storage/v1/s3"), "supabase");
  assert.equal(nhaCungCap(s3.url), "s3");
  assert.equal(cauHinhKho({ ...process.env, S3_ENDPOINT: "https://0123abcd.r2.cloudflarestorage.com" }).nha, "r2");
  const cd = await chanDoanS3({ ...cauHinhS3(), endpoint: "https://0123abcd.r2.cloudflarestorage.com/cms-media", region: "auto" });
  assert.equal(cd.ok, false);
  assert.match(cd.goi_y.join(" "), /Bỏ "\/cms-media" ở cuối S3_ENDPOINT/);
});

await ca("Kiểm tra kho ảnh: kho tốt → mọi bước ✓, không để lại ảnh thử", async () => {
  const kq = await kiemKhoAnh(payload);
  assert.equal(kq.ok, true, JSON.stringify(kq));
  assert.equal(kq.nguon, "s3");
  assert.deepEqual(kq.buoc.map((b) => b.ok), [true, true, true, true, true, true]);
  assert.equal(kq.buoc[1]?.ten, "Khoá + vùng S3 (ký thử, không ghi gì)");
  assert.equal([...s3.kho.keys()].filter((k) => k.includes("kiem-kho")).length, 0);
  assert.equal((await payload.count({ collection: "media", where: { alt: { equals: "Ảnh kiểm tra kho (tự xoá)" } }, overrideAccess: true })).totalDocs, 0);
});

const png16 = () => sharp({ create: { width: 16, height: 16, channels: 3, background: "#123" } }).png().toBuffer();
const taoAnh = async (alt = "Ảnh thử lỗi kho") => { const p = await png16();
  return payload.create({ collection: "media", overrideAccess: true, data: { alt } as never, file: { data: p, mimetype: "image/png", name: "loi-kho.png", size: p.length } }); };
/** Lỗi thô SDK đi qua afterError của Ảnh → lời tiếng Việt, không còn "Something went wrong." */
const quaAfterError = async (err: unknown) => {
  const h = Media.hooks?.afterError?.[0];
  assert.ok(h, "Ảnh có afterError");
  return (await h({ error: err, result: { errors: [{ message: "Something went wrong." }] } } as never)) as { status: number; response: { errors: { message: string }[] } } | undefined;
};

await ca("KHOÁ BÍ MẬT SAI (đúng ảnh chụp production): tải ảnh → 403 SignatureDoesNotMatch → lời tiếng Việt; Kiểm tra kho chỉ S3_SECRET_ACCESS_KEY", async () => {
  s3.biMat = "khoa-bi-mat-khac-tren-supabase";
  try {
    const loi = await taoAnh().then(() => null, (e: unknown) => e as { name?: string; $metadata?: { httpStatusCode?: number } });
    assert.ok(loi, "tải ảnh phải hỏng");
    assert.equal(loi.name, "SignatureDoesNotMatch"); assert.equal(loi.$metadata?.httpStatusCode, 403);
    const r = await quaAfterError(loi);
    assert.equal(r?.status, 400);
    assert.match(r!.response.errors[0]!.message, /Kho ảnh từ chối ghi tệp \(SignatureDoesNotMatch · HTTP 403\)/);
    assert.match(r!.response.errors[0]!.message, /Kiểm tra kho ảnh/);
    assert.doesNotMatch(r!.response.errors[0]!.message, /: |,/, "ô báo lỗi Payload cắt ': ' và ',' thành danh sách");
    const kq = await kiemKhoAnh(payload);
    assert.equal(kq.ok, false);
    assert.equal(kq.buoc.find((b) => !b.ok)?.ten, "Khoá + vùng S3 (ký thử, không ghi gì)");
    assert.equal(kq.buoc.length, 2, "dừng sau bước ký thử, không tải ảnh");
    assert.match(kq.goi_y.join(" "), /S3_SECRET_ACCESS_KEY không khớp/);
    assert.doesNotMatch(JSON.stringify(kq), /bi-mat-gia|khoa-bi-mat-khac/, "không lộ khoá");
  } finally { s3.biMat = "bi-mat-gia"; }
});

await ca("SAI VÙNG: dự án ở eu-central-1, S3_REGION = ap-southeast-1 → SignatureDoesNotMatch; Kiểm tra kho chỉ đúng S3_REGION = eu-central-1", async () => {
  s3.vung = "eu-central-1";
  try {
    await assert.rejects(taoAnh(), (e: { name?: string }) => e.name === "SignatureDoesNotMatch");
    const cd = await chanDoanS3(cauHinhS3());
    assert.equal(cd.ok, false);
    assert.match(cd.goi_y.join(" "), /Khoá S3 ĐÚNG nhưng S3_REGION sai: đang là "ap-southeast-1", dự án Supabase ở "eu-central-1"/);
  } finally { s3.vung = "ap-southeast-1"; }
});

await ca("NHẬP BÀI NOTFAIR khi kho ảnh từ chối chữ ký (ảnh chụp production): chữ vẫn vào nháp, ảnh thành chỗ đánh dấu, chặn xuất bản", async () => {
  const { nhapBaiNotFair } = await import("../src/lib/notfair");
  const { kiemDinhBai } = await import("../src/kiem-dinh/kiem-dinh");
  const cb = await payload.create({ collection: "bien-tap-vien", overrideAccess: true,
    data: { email: `cb-${Date.now()}@vidu.vn`, password: "mat-khau-du-dai-123", ten_hien_thi: "Chủ biên", vai_tro: "chu_bien" } as never });
  const png = await png16();
  const slug = `xem-tu-vi-${Date.now().toString(36)}`;
  const bai = { id: 1, title: "Cách xem Tử vi: lập lá số và đọc 12 cung từng bước", slug, meta_description: "Hướng dẫn.", tags: [],
    image_url: "https://notfair.co/api/seo/image/bia.png", published_at: "2026-10-10T00:00:00Z", created_at: "2026-10-10T00:00:00Z",
    content_html: `<h2>Lập lá số</h2><p>Đoạn một.</p><figure><img src="https://notfair.co/api/seo/image/hinh.png" alt="Lá số mẫu"></figure><p>Đoạn hai.</p>` };
  const fetchGoc = globalThis.fetch;
  const cu = { url: process.env.NOTFAIR_SEO_API_URL, khoa: process.env.NOTFAIR_SEO_API_KEY };
  process.env.NOTFAIR_SEO_API_URL = "https://api.notfair.test/content"; process.env.NOTFAIR_SEO_API_KEY = "nfbl_thu";
  let soAnhTai = 0;
  globalThis.fetch = (async (v: string | URL | Request, init?: RequestInit) => {
    const u = String(v instanceof Request ? v.url : v);
    if (u.startsWith("https://api.notfair.test/content")) return Response.json({ post: bai });
    if (u.startsWith("https://notfair.co/api/seo/image/")) { soAnhTai++; return new Response(png, { headers: { "content-type": "image/png" } }); }
    return fetchGoc(v as never, init);
  }) as typeof fetch;
  s3.biMat = "khoa-bi-mat-khac-tren-supabase";
  const truoc = (await payload.count({ collection: "media", overrideAccess: true })).totalDocs;
  try {
    const kq = await nhapBaiNotFair(payload, { payload, user: { ...cb, collection: "bien-tap-vien" } } as never, slug);
    assert.equal(kq.da_co, false);
    assert.match(kq.loi_kho ?? "", /SignatureDoesNotMatch/);
    assert.deepEqual(kq.anh_loi, [bai.image_url, "https://notfair.co/api/seo/image/hinh.png"]);
    assert.equal(soAnhTai, 1, "kho hỏng ở ảnh đầu → không tải tiếp các ảnh sau");
    const d = await payload.findByID({ collection: "bai-viet", id: kq.id, overrideAccess: true, draft: true }) as unknown as Record<string, unknown>;
    assert.equal(d._status, "draft"); assert.equal(d.slug, slug);
    const html = String(d.noi_dung_html);
    assert.match(html, /Đoạn một\.[\s\S]*\[Ảnh chưa nhập — [^\]]*hinh\.png \(alt: Lá số mẫu\)\][\s\S]*Đoạn hai\./, "chỗ đánh dấu đúng vị trí ảnh");
    assert.ok(kiemDinhBai(d as never).loi_chan.some((m) => m.ma === "anh_chua_nhap"), "còn chỗ đánh dấu → chặn xuất bản");
    assert.equal((await payload.count({ collection: "media", overrideAccess: true })).totalDocs, truoc, "không để lại ảnh mồ côi");
    await payload.delete({ collection: "bai-viet", id: kq.id, overrideAccess: true });
  } finally {
    s3.biMat = "bi-mat-gia"; globalThis.fetch = fetchGoc;
    process.env.NOTFAIR_SEO_API_URL = cu.url; process.env.NOTFAIR_SEO_API_KEY = cu.khoa;
    if (cu.url === undefined) delete process.env.NOTFAIR_SEO_API_URL;
    if (cu.khoa === undefined) delete process.env.NOTFAIR_SEO_API_KEY;
    await payload.delete({ collection: "bien-tap-vien", id: cb.id, overrideAccess: true });
  }
});

await ca("MÃ KHOÁ SAI: AccessDenied Invalid Access Key → chỉ S3_ACCESS_KEY_ID", async () => {
  s3.khoa = "khoa-cua-du-an-khac";
  try {
    const loi = await taoAnh().then(() => null, (e: unknown) => e);
    assert.ok(loi);
    assert.match((await quaAfterError(loi))!.response.errors[0]!.message, /AccessDenied · HTTP 403/);
    const kq = await kiemKhoAnh(payload);
    assert.match(kq.goi_y.join(" "), /S3_ACCESS_KEY_ID không có trong tài khoản \/ dự án/);
  } finally { s3.khoa = "khoa-gia"; }
  assert.equal((await kiemKhoAnh(payload)).ok, true, "sửa khoá xong → kho tốt");
});

await ca("bucket chưa tạo: tải ảnh hỏng, Kiểm tra kho chỉ đúng 'bucket', lần sau dọn bản ghi mồ côi", async () => {
  s3.matBucket = true;
  await assert.rejects(taoAnh("Ảnh kiểm tra kho (tự xoá)"));
  const kq = await kiemKhoAnh(payload);
  assert.equal(kq.ok, false);
  const hong = kq.buoc.find((b) => !b.ok);
  assert.equal(hong?.ten, "Khoá + vùng S3 (ký thử, không ghi gì)");
  assert.match(hong?.chi_tiet ?? "", /NoSuchBucket/i);
  assert.ok(kq.goi_y.some((g) => /bucket/i.test(g)), JSON.stringify(kq.goi_y));
  s3.matBucket = false;
  const lai = await kiemKhoAnh(payload);
  assert.equal(lai.ok, true, JSON.stringify(lai));
  assert.equal((await payload.count({ collection: "media", where: { alt: { equals: "Ảnh kiểm tra kho (tự xoá)" } }, overrideAccess: true })).totalDocs, 0, "không còn bản ghi mồ côi");
});

await ca("trên Vercel mà thiếu S3 → tạo ảnh bị chặn với lời tiếng Việt, không chạm sharp/đĩa", async () => {
  const cu = { ...process.env };
  process.env.VERCEL = "1"; delete process.env.S3_ACCESS_KEY_ID;
  try {
    const png = await sharp({ create: { width: 16, height: 16, channels: 3, background: "#000" } }).png().toBuffer();
    await assert.rejects(payload.create({ collection: "media", overrideAccess: true, data: { alt: "x" } as never,
      file: { data: png, mimetype: "image/png", name: "x.png", size: png.length } }), /Kho ảnh chưa nối/);
    const kq = await kiemKhoAnh(payload);
    assert.equal(kq.ok, false); assert.equal(kq.buoc[0]?.ten, "Cấu hình kho"); assert.match(kq.goi_y[0] ?? "", /Vercel/);
  } finally { process.env.S3_ACCESS_KEY_ID = cu.S3_ACCESS_KEY_ID; delete process.env.VERCEL; }
});

await s3.dong();
console.log(`${dat} ca đạt${process.exitCode ? " — CÓ CA HỎNG" : ""}`);
process.exit(process.exitCode ?? 0);
