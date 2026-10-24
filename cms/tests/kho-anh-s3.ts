// Kho ảnh qua S3 (đường đi THẬT của Payload + @payloadcms/storage-s3) trên máy chủ S3 giả + Postgres thật:
// tải ảnh → sharp đổi WebP + sinh cỡ → ghi bucket → URL công khai đọc được → xoá; bucket chưa có → "Kiểm tra kho ảnh"
// chỉ đúng nguyên nhân + tự dọn bản ghi mồ côi. Chạy: DATABASE_URI=… npm run test:kho-anh
import assert from "node:assert/strict";
import sharp from "sharp";
import { moS3Gia } from "./s3-gia";

const s3 = await moS3Gia();
process.env.S3_BUCKET = "cms-media";
process.env.S3_ENDPOINT = s3.url;
process.env.S3_REGION = "ap-southeast-1";
process.env.S3_ACCESS_KEY_ID = "khoa-gia";
process.env.S3_SECRET_ACCESS_KEY = "bi-mat-gia";
process.env.S3_PUBLIC_URL = `${s3.url}/cms-media`;
delete process.env.VERCEL;

// Cấu hình đọc env lúc import → nạp SAU khi đặt biến.
const { default: config } = await import("../src/payload.config");
const { getPayload } = await import("payload");
const { cauHinhKho, goiYTuLoi, kiemKhoAnh, locLoi } = await import("../src/lib/kho-anh");
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
  assert.match(goiYTuLoi("InvalidAccessKeyId", "s3", true), /Khoá S3 sai/);
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

await ca("Kiểm tra kho ảnh: kho tốt → mọi bước ✓, không để lại ảnh thử", async () => {
  const kq = await kiemKhoAnh(payload);
  assert.equal(kq.ok, true, JSON.stringify(kq));
  assert.equal(kq.nguon, "s3");
  assert.deepEqual(kq.buoc.map((b) => b.ok), [true, true, true, true, true]);
  assert.equal([...s3.kho.keys()].filter((k) => k.includes("kiem-kho")).length, 0);
  assert.equal((await payload.count({ collection: "media", where: { alt: { equals: "Ảnh kiểm tra kho (tự xoá)" } }, overrideAccess: true })).totalDocs, 0);
});

await ca("bucket chưa tạo: tải ảnh hỏng, Kiểm tra kho chỉ đúng 'bucket', lần sau dọn bản ghi mồ côi", async () => {
  s3.matBucket = true;
  const kq = await kiemKhoAnh(payload);
  assert.equal(kq.ok, false);
  const hong = kq.buoc.find((b) => !b.ok);
  assert.equal(hong?.ten, "Ghi thử một ảnh 16×16 vào kho");
  assert.match(hong?.chi_tiet ?? "", /bucket does not exist|NoSuchBucket/i);
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
