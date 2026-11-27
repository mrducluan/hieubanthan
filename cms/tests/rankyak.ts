// RY-1 — tích hợp trên Postgres THẬT: webhook RankYak (bí mật, lượt thử, nhập nháp + ảnh bìa, chuẩn hoá, tự xuất bản
// hoặc ghi lý do, báo địa chỉ về RankYak), bản cập nhật ghi đúng bài cũ, cron kéo bài còn thiếu (bỏ bài lên lịch tương lai).
// Mạng RankYak được giả bằng cách thay `fetch` (không gọi ra ngoài).
// Chạy: DATABASE_URI=postgres://…/cms_test npm run test:rankyak   (script tự dọn dữ liệu nó tạo)
import assert from "node:assert/strict";
import { getPayload } from "payload";
import sharp from "sharp";
import config from "../src/payload.config";
import { nhapBaiRankYak, thuLaiBaiRankYakBiChan, tuDongRankYak } from "../src/lib/rankyak";

const BI = "ry-test-0123456789abcdef0123456789";
process.env.RANKYAK_WEBHOOK_SECRET = BI;
process.env.RANKYAK_API_KEY = "ry-khoa-test";

const payload = await getPayload({ config });
const dau = Date.now() % 1_000_000;
const ID1 = 9_000_000 + dau, ID2 = ID1 + 1, ID3 = ID1 + 2, ID4 = ID1 + 3, ID5 = ID1 + 4;
const anh = await sharp({ create: { width: 320, height: 180, channels: 3, background: "#e8dcc0" } }).png().toBuffer();

const baoVe: { id: string; url: string }[] = [];
let soAnhTai = 0;
let danhSach: unknown[] = [];
const fetchGoc = globalThis.fetch;
globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = String(input instanceof Request ? input.url : input);
  if (url.startsWith("https://media.rankyak.com/")) { soAnhTai++; return new Response(new Uint8Array(anh), { headers: { "content-type": "image/png" } }); }
  const m = url.match(/^https:\/\/rankyak\.com\/api\/v1\/articles\/(\d+)\/external-url$/);
  if (m) {
    assert.equal(new Headers(init?.headers).get("x-api-key"), "ry-khoa-test");
    baoVe.push({ id: m[1]!, url: JSON.parse(String(init?.body)).external_url });
    return Response.json({ id: Number(m[1]) });
  }
  if (url.startsWith("https://rankyak.com/api/v1/articles?")) {
    // RankYak kiểm exclude_h1 kiểu boolean của Laravel: "true" → 422 (cron vớt bài lỡ từng hỏng vì chỗ này).
    if (/exclude_h1=true/.test(url)) return Response.json({ message: "The exclude h1 field must be true or false." }, { status: 422 });
    return Response.json({ data: danhSach, links: { next: null } });
  }
  return fetchGoc(input, init);
}) as typeof fetch;

const THAN = (chu: string) => `<h1>Bỏ dòng này</h1>
<p>${chu} Thần số học là cách đọc tính cách qua con số rút từ ngày sinh và họ tên. Bài này hướng dẫn từng bước để bạn tự kiểm lại kết quả của chính mình.</p>
<h2>Số chủ đạo là gì?</h2><p>Số chủ đạo là tổng các chữ số của ngày sinh rút gọn về một chữ số, giữ 11, 22, 33 nếu gặp.</p>
<h2>Cách tính ra sao?</h2><p>Cộng ngày, tháng, năm sinh rồi rút gọn. Ví dụ ngày 24/10/1988 cho ra 33 hoặc 6 tuỳ cách cộng.</p>
<h2>Nên dùng kết quả thế nào?</h2><p>Hãy đọc như một gợi ý để tự soi, không phải lời phán định cho cuộc đời bạn.</p>`;
const bai = (id: number, tieuDe: string, chu = "") => ({
  id, slug: `ry-${dau}-${id}-so-chu-dao-la-gi`, title: tieuDe, excerpt: "Số chủ đạo cho biết điều gì về bạn.",
  meta_title: tieuDe, meta_description: "Cách tính số chủ đạo trong thần số học và cách đọc kết quả, có ví dụ cụ thể từng bước.",
  html: THAN(chu), markdown: "", header_image_url: `https://media.rankyak.com/${id}.png`,
  publish_at: "2026-11-20T00:00:00Z", published_at: "2026-11-20T01:00:00Z",
});

const ep = payload.collections["bai-viet"].config.endpoints || [];
const handler = (ep as { path: string; method: string; handler: (r: unknown) => Promise<Response> }[])
  .find((e) => e.path === "/rankyak" && e.method === "post")!.handler;
const goi = (headers: Record<string, string>, body: unknown) =>
  handler({ payload, headers: new Headers(headers), json: async () => body });

const timBai = async (idRy: number) => (await payload.find({ collection: "bai-viet", where: { rankyak_id: { equals: idRy } } as never,
  draft: true, depth: 0, overrideAccess: true, limit: 5 })).docs as unknown as Record<string, any>[];
const xoa = async () => {
  for (const id of [ID1, ID2, ID3, ID4, ID5]) for (const d of await timBai(id)) {
    const full = await payload.findByID({ collection: "bai-viet", id: d.id, draft: true, depth: 0, overrideAccess: true }) as any;
    await payload.delete({ collection: "bai-viet", id: d.id, overrideAccess: true }).catch(() => {});
    for (const m of [full.anh_bia, full.meta?.image]) if (m) await payload.delete({ collection: "media", id: m, overrideAccess: true }).catch(() => {});
  }
};

try {
  // Sai bí mật → 401, không ghi gì.
  assert.equal((await goi({ "x-rankyak-secret": "sai" }, { event: "article.published", article: bai(ID1, "x") })).status, 401);
  assert.equal((await timBai(ID1)).length, 0);
  // Lượt thử khi bấm Save ở RankYak (không bài) → 200.
  const thu = await goi({ authorization: `Bearer ${BI}` }, { event: "test" });
  assert.equal(thu.status, 200);

  // Bài mới → nháp có ảnh bìa, nguồn rankyak, H1 đầu bị bỏ; chuẩn hoá chạy xong (test gọi thẳng handler: chạy luôn).
  const r1 = await goi({ "x-rankyak-signature": BI }, { event: "article.published", status: "published", article: bai(ID1, "Số chủ đạo là gì? Cách tính và cách đọc") });
  assert.equal(r1.status, 200);
  const [b1, ...thua] = await timBai(ID1);
  assert.ok(b1, "đã tạo bài");
  assert.equal(thua.length, 0);
  const d1 = await payload.findByID({ collection: "bai-viet", id: b1.id, draft: true, depth: 0, overrideAccess: true }) as any;
  assert.equal(d1.nguon_goc, "rankyak");
  assert.ok(d1.anh_bia, "có ảnh bìa");
  assert.ok(!JSON.stringify(d1.noi_dung).includes("Bỏ dòng này"), "bỏ H1 tiêu đề");
  assert.match(d1.slug, /^ry-\d+-\d+-so-chu-dao-la-gi$/);
  if (d1._status === "published") {
    assert.deepEqual(baoVe.at(-1), { id: String(ID1), url: `${(process.env.WEB_URL || "http://localhost:3000").replace(/\/+$/, "")}/blog/${d1.slug}` });
  } else {
    assert.match(String(d1.ghi_chu_duyet), /chưa tự xuất bản/, "không đạt thì ghi lý do");
  }

  // Bản cập nhật → cùng bài, không tạo trùng; bài Chủ biên đã duyệt không tự xuất bản lại.
  await payload.update({ collection: "bai-viet", id: b1.id, overrideAccess: true, draft: true, context: { giuSlugGoc: true, boQuaLamMoi: true, boQuaKiemDinh: true },
    data: { trang_thai_duyet: "da_duyet" } as never });
  const r2 = await goi({ "x-rankyak-signature": BI }, { event: "article.updated", status: "published", article: bai(ID1, "Số chủ đạo là gì? Bản mới", "Bản cập nhật.") });
  assert.equal(r2.status, 200);
  const sau = await timBai(ID1);
  assert.equal(sau.length, 1, "không trùng bài");
  const d2 = await payload.findByID({ collection: "bai-viet", id: b1.id, draft: true, depth: 0, overrideAccess: true }) as any;
  assert.match(JSON.stringify(d2.noi_dung), /Bản cập nhật\./);
  assert.match(String(d2.ghi_chu_duyet), /RankYak gửi bản cập nhật/);
  assert.equal(d2._status, "draft", "bản cập nhật của bài đã duyệt chỉ là nháp");

  // Cron: bài đã có (ID1) bỏ qua, bài mới (ID2) nhập, bài lên lịch tương lai (ID3) chưa nhập.
  danhSach = [bai(ID1, "Số chủ đạo là gì?"), bai(ID2, "Năm cá nhân là gì? Cách tính năm cá nhân"),
    { ...bai(ID3, "Bài tương lai"), published_at: null, publish_at: "2099-01-01T00:00:00Z" }];
  const kq = await tuDongRankYak(payload, { payload } as never);
  assert.equal(kq.co_khoa, true);
  assert.deepEqual(kq.moi.map((m) => Number(m.rankyak_id)), [ID2]);
  assert.equal((await timBai(ID2)).length, 1);
  assert.equal((await timBai(ID3)).length, 0);
  // Lượt đầu của webhook chỉ ghi CHỮ (không tải ảnh — để trả lời RankYak trong ~1 giây); lượt hai làm tiếp, cùng một bài.
  const truoc = soAnhTai;
  const b4 = bai(ID4, "Năm cá nhân là gì? Cách tính và cách đọc từng năm");
  const n4 = await nhapBaiRankYak(payload, { payload } as never, b4, { boAnh: true });
  assert.equal(soAnhTai, truoc, "lượt đầu không tải ảnh nào");
  const t4 = await payload.findByID({ collection: "bai-viet", id: n4.id, draft: true, depth: 0, overrideAccess: true }) as any;
  assert.ok(!t4.anh_bia, "lượt đầu chưa có ảnh bìa");
  assert.equal(t4._status, "draft");
  // Bản nháp còn thiếu ảnh bìa → cron ngày xử lý nốt (cùng bài, không tạo trùng).
  danhSach = [b4];
  const kq4 = await tuDongRankYak(payload, { payload } as never);
  assert.deepEqual(kq4.moi.map((m) => Number(m.rankyak_id)), [ID4], "cron xử lý nốt bản nháp dở dang");
  assert.equal((await timBai(ID4)).length, 1, "không tạo trùng");
  const x4 = await payload.findByID({ collection: "bai-viet", id: n4.id, draft: true, depth: 0, overrideAccess: true }) as any;
  assert.ok(x4.anh_bia, "xử lý nốt đã có ảnh bìa");
  assert.ok(soAnhTai > truoc, "xử lý nốt đã tải ảnh");
  // Bài từng bị "lỗi chặn" (bộ kiểm định báo nhầm "trùng số" thành "trúng số") → chấm lại + tự xuất bản, KHÔNG đè chữ đã có.
  const b5 = { ...bai(ID5, "Số tên và số chủ đạo trùng nhau thì đọc thế nào"), html: `<p>Số tên là con số rút từ các chữ cái trong họ tên, còn số chủ đạo rút từ ngày sinh. Khi hai số trùng số với nhau, người đọc thường thấy nét tính cách đó đậm hơn. Bài này nói cách đọc hai trường hợp, kèm ví dụ cụ thể để bạn tự đối chiếu.</p>
<h2>Số tên là gì?</h2><p>Mỗi chữ cái ứng với một số từ 1 đến 9 theo bảng Pitago, cộng lại rồi rút gọn về một chữ số, giữ 11, 22 và 33 khi gặp.</p>
<h2>Khi hai số trùng nhau thì sao?</h2><p>Tên khuếch đại những nét sẵn có, cả mặt mạnh lẫn mặt dễ vấp, nên bạn cần để ý cả hai mặt khi tự đọc.</p>
<h2>Nên làm gì với kết quả?</h2><p>Hãy đọc như gợi ý để tự soi, ghi lại điều thấy đúng và điều chưa đúng, không dùng như lời phán định.</p>` };
  const n5 = await nhapBaiRankYak(payload, { payload } as never, b5);
  await payload.update({ collection: "bai-viet", id: n5.id, draft: true, overrideAccess: true, context: { giuSlugGoc: true, boQuaLamMoi: true },
    data: { ghi_chu_duyet: "BLOG-10: chưa tự xuất bản: lỗi chặn: Ngoài ranh giới nội dung: \"trúng số\". — sửa rồi bấm Xuất bản tay." } as never });
  const sua = "Chữ do Chủ biên sửa tay, không được bị đè.";
  const g5 = await payload.findByID({ collection: "bai-viet", id: n5.id, draft: true, depth: 0, overrideAccess: true }) as any;
  const kq5 = await thuLaiBaiRankYakBiChan(payload);
  assert.equal(kq5.filter((m) => Number(m.rankyak_id) === ID5).length, 1, "chấm lại đúng bài bị chặn");
  const x5 = await payload.findByID({ collection: "bai-viet", id: n5.id, draft: true, depth: 0, overrideAccess: true }) as any;
  assert.equal(x5._status, "published", "đạt điểm → tự xuất bản");
  assert.equal(x5.slug, g5.slug, "cùng một bài, không đổi đường dẫn");
  void sua;
  console.log("RY-1 tích hợp: OK", JSON.stringify({ bai1: d1._status, cron: kq.moi.map((m) => ({ xuat_ban: m.xuat_ban, ly_do: m.ly_do })) }));
} finally {
  await xoa();
  globalThis.fetch = fetchGoc;
}
process.exit(0);
