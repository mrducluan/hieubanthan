// Máy chủ S3 GIẢ cho kiểm thử kho ảnh (không gọi Supabase): path-style http://127.0.0.1:<cổng>/<bucket>/<khoá>.
// PUT ghi vào bộ nhớ, HEAD/GET đọc lại (đóng vai cả URL công khai), DELETE xoá. Chế độ `matBucket` → mọi yêu cầu trả
// 404 NoSuchBucket (tái hiện "chưa tạo bucket cms-media"). Bỏ qua chữ ký AWS.
import http from "node:http";

export type S3Gia = { cong: number; url: string; kho: Map<string, number>; matBucket: boolean; dong: () => Promise<void>; yeuCau: string[] };

export function moS3Gia(): Promise<S3Gia> {
  const kho = new Map<string, number>();
  const trangThai: { matBucket: boolean } = { matBucket: false };
  const yeuCau: string[] = [];
  const sv = http.createServer((req, res) => {
    const duong = decodeURIComponent((req.url ?? "/").split("?")[0]!).replace(/^\/+/, "");
    yeuCau.push(`${req.method} ${duong}`);
    const than: Buffer[] = [];
    req.on("data", (c: Buffer) => than.push(c));
    req.on("end", () => {
      if (trangThai.matBucket) {
        res.writeHead(404, { "content-type": "application/xml" });
        return res.end("<?xml version=\"1.0\"?><Error><Code>NoSuchBucket</Code><Message>The specified bucket does not exist</Message></Error>");
      }
      if (req.method === "PUT") { kho.set(duong, Buffer.concat(than).length); res.writeHead(200, { etag: "\"gia\"" }); return res.end(); }
      if (req.method === "DELETE") { kho.delete(duong); res.writeHead(204); return res.end(); }
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
    ok({ cong, url: `http://127.0.0.1:${cong}`, kho, yeuCau,
      get matBucket() { return trangThai.matBucket; }, set matBucket(v: boolean) { trangThai.matBucket = v; },
      dong: () => new Promise((r) => sv.close(() => r())) });
  }));
}
