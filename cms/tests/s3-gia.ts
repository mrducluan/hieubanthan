// Máy chủ S3 GIẢ cho kiểm thử kho ảnh (không gọi Supabase): path-style http://127.0.0.1:<cổng>/<bucket>/<khoá>.
// PUT ghi vào bộ nhớ, HEAD/GET đọc lại (đóng vai cả URL công khai), DELETE xoá. Chế độ `matBucket` → mọi yêu cầu trả
// 404 NoSuchBucket (tái hiện "chưa tạo bucket cms-media").
// KIỂM CHỮ KÝ SigV4 như Supabase Storage (protocols/s3/signature-v4.ts) — bản cũ bỏ qua chữ ký nên không bắt được
// 403 SignatureDoesNotMatch trên production (sự cố 2026-10-24): mã khoá lạ → AccessDenied "Invalid Access Key";
// vùng khách ký không phải auto / us-east-1 / vùng máy chủ → máy chủ ký lại bằng vùng của nó → SignatureDoesNotMatch.
// Đổi `khoa` / `biMat` / `vung` giữa chừng = giả lập biến trên Vercel không khớp dự án Supabase.
// GET/HEAD không chữ ký = đọc công khai (bucket Public).
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import http from "node:http";

export type S3Gia = {
  cong: number; url: string; kho: Map<string, number>; matBucket: boolean; dong: () => Promise<void>; yeuCau: string[];
  khoa: string; biMat: string; vung: string; tuChoi: string[];
};

const hmac = (k: string | Buffer, s: string) => createHmac("sha256", k).update(s).digest();
const ma3986 = (s: string) => encodeURIComponent(s).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);

function loiXml(res: http.ServerResponse, status: number, ma: string, td: string) {
  res.writeHead(status, { "content-type": "application/xml" });
  res.end(`<?xml version="1.0" encoding="UTF-8"?><Error><Code>${ma}</Code><Message>${td}</Message></Error>`);
}

/** null = chữ ký đúng; chuỗi = [mã lỗi, thông điệp]. */
function kiemChuKy(req: http.IncomingMessage, mayChu: { khoa: string; biMat: string; vung: string }): [string, string] | null {
  const auth = String(req.headers.authorization ?? "");
  const m = /^AWS4-HMAC-SHA256 Credential=([^,]+),\s*SignedHeaders=([^,]+),\s*Signature=([0-9a-f]+)$/.exec(auth);
  if (!m) return ["AccessDenied", "Missing or malformed authorization"];
  const [khoa, ngay, vung, dv] = m[1]!.split("/");
  if (khoa !== mayChu.khoa) return ["AccessDenied", "Invalid Access Key"];
  const vungKy = ["auto", "us-east-1", mayChu.vung, ""].includes(vung ?? "") ? vung! : mayChu.vung;
  const amz = String(req.headers["x-amz-date"] ?? "");
  const [duong, truyVan = ""] = (req.url ?? "/").split("?");
  const qs = truyVan.split("&").filter(Boolean).map((p) => p.split("=").map((x) => decodeURIComponent(x ?? "")) as [string, string?])
    .filter(([k]) => k !== "X-Amz-Signature").sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([k, v = ""]) => `${ma3986(k)}=${ma3986(v)}`).join("&");
  const ky = m[2]!.split(";");
  const tieuDe = ky.map((h) => `${h}:${String(req.headers[h] ?? "").trim().replace(/\s+/g, " ")}`).join("\n");
  const chuan = [req.method, duong, qs, tieuDe, "", ky.join(";"), String(req.headers["x-amz-content-sha256"] ?? "UNSIGNED-PAYLOAD")].join("\n");
  const sts = ["AWS4-HMAC-SHA256", amz, `${ngay}/${vungKy}/${dv}/aws4_request`, createHash("sha256").update(chuan).digest("hex")].join("\n");
  const khoaKy = hmac(hmac(hmac(hmac(`AWS4${mayChu.biMat}`, ngay!), vungKy), dv!), "aws4_request");
  const dung = createHmac("sha256", khoaKy).update(sts).digest();
  const cua = Buffer.from(m[3]!, "hex");
  return cua.length === dung.length && timingSafeEqual(cua, dung) ? null
    : ["SignatureDoesNotMatch", "The request signature we calculated does not match the signature you provided. Check your key and signing method."];
}

export function moS3Gia(chuKy: { khoa: string; biMat: string; vung: string } = { khoa: "khoa-gia", biMat: "bi-mat-gia", vung: "ap-southeast-1" }): Promise<S3Gia> {
  const kho = new Map<string, number>();
  const tt = { matBucket: false, ...chuKy };
  const yeuCau: string[] = [];
  const tuChoi: string[] = [];
  const sv = http.createServer((req, res) => {
    const duong = decodeURIComponent((req.url ?? "/").split("?")[0]!).replace(/^\/+/, "");
    yeuCau.push(`${req.method} ${duong}`);
    const than: Buffer[] = [];
    req.on("data", (c: Buffer) => than.push(c));
    req.on("end", () => {
      const congKhai = (req.method === "GET" || req.method === "HEAD") && !req.headers.authorization;
      if (!congKhai) {
        const loi = kiemChuKy(req, tt);
        if (loi) { tuChoi.push(`${req.method} ${duong} → ${loi[0]}`); return loiXml(res, 403, loi[0], loi[1]); }
      }
      if (tt.matBucket) return loiXml(res, 404, "NoSuchBucket", "The specified bucket does not exist");
      if (req.method === "PUT") { kho.set(duong, Buffer.concat(than).length); res.writeHead(200, { etag: "\"gia\"" }); return res.end(); }
      if (req.method === "DELETE") { kho.delete(duong); res.writeHead(204); return res.end(); }
      if (req.method === "GET" && !congKhai && /list-type=2/.test(req.url ?? "")) {   // ListObjectsV2 (bộ ký thử)
        res.writeHead(200, { "content-type": "application/xml" });
        return res.end("<?xml version=\"1.0\"?><ListBucketResult><KeyCount>0</KeyCount></ListBucketResult>");
      }
      if (req.method === "HEAD" || req.method === "GET") {
        if (!kho.has(duong)) { res.writeHead(404); return res.end(); }
        res.writeHead(200, { "content-type": "image/webp", "content-length": String(kho.get(duong)) });
        return res.end(req.method === "GET" ? Buffer.alloc(kho.get(duong)!) : undefined);
      }
      res.writeHead(405); res.end();
    });
  });
  return new Promise((ok) => sv.listen(0, "127.0.0.1", () => {
    const cong = (sv.address() as { port: number }).port;
    ok({ cong, url: `http://127.0.0.1:${cong}`, kho, yeuCau, tuChoi,
      get matBucket() { return tt.matBucket; }, set matBucket(v: boolean) { tt.matBucket = v; },
      get khoa() { return tt.khoa; }, set khoa(v: string) { tt.khoa = v; },
      get biMat() { return tt.biMat; }, set biMat(v: string) { tt.biMat = v; },
      get vung() { return tt.vung; }, set vung(v: string) { tt.vung = v; },
      dong: () => new Promise((r) => sv.close(() => r())) });
  }));
}
