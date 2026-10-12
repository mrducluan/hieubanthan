// Kiểm thử tích hợp CMS trên Postgres THẬT (Local API của Payload, đúng đường đi của REST/admin):
// phân quyền theo vai trò, chặn xuất bản khi có lỗi chặn, HTML sinh cho web, giữ slug cũ, tài khoản đầu tiên.
// Chạy: DATABASE_URI=postgres://…/cms_test npm run test:tich-hop   (DB rỗng hoặc DB thử — script tự dọn dữ liệu nó tạo)
import assert from "node:assert/strict";
import { getPayload, type Payload } from "payload";
import config from "../src/payload.config";

const chu = (text: string) => ({ type: "text", text, format: 0, detail: 0, mode: "normal", style: "", version: 1 });
const doan = (...children: unknown[]) =>
  ({ type: "paragraph", children, direction: "ltr", format: "", indent: 0, textFormat: 0, textStyle: "", version: 1 });
const h = (tag: string, text: string) => ({ type: "heading", tag, children: [chu(text)], direction: "ltr", format: "", indent: 0, version: 1 });
const khoi = (fields: Record<string, unknown>) =>
  ({ type: "block", version: 2, format: "", fields: { id: Math.random().toString(16).slice(2, 14), blockName: "", ...fields } });
const goc = (...children: unknown[]) => ({ root: { type: "root", children, direction: "ltr", format: "", indent: 0, version: 1 } });
const tu = (n: number) => Array.from({ length: n }, (_, i) => `chữ${i % 7}`).join(" ");
// Thân bài riêng cho từng bài thử: bài giống hệt nhau giờ bị kiểm trùng (CG-6) chặn khi cộng tác viên gửi duyệt.
const tuRieng = (khoa: string, n: number) => Array.from({ length: n }, (_, i) => `${khoa.replace(/\W/g, "")}${i}`).join(" ");

let dat = 0;
async function ca(ten: string, f: () => Promise<void>) {
  try { await f(); dat++; console.log(`  ✓ ${ten}`); }
  catch (e) { console.error(`  ✕ ${ten}\n`, e); process.exitCode = 1; }
}
async function nem(f: () => Promise<unknown>, khop: RegExp) {
  let loi: unknown = null;
  try { await f(); } catch (e) { loi = e; }
  assert.ok(loi, "phải ném lỗi");
  assert.match(String((loi as Error).message), khop);
}

const payload: Payload = await getPayload({ config });
const tao: { collection: "bai-viet" | "bien-tap-vien" | "tac-gia"; id: number | string }[] = [];
const dau = `tt${Date.now().toString(36)}`;

const nguoi = async (vai_tro: string) => {
  const u = await payload.create({
    collection: "bien-tap-vien", overrideAccess: true,
    data: { email: `${dau}-${vai_tro}-${tao.length}@vidu.vn`, password: "mat-khau-du-dai-123", ten_hien_thi: vai_tro, vai_tro } as never,
  });
  tao.push({ collection: "bien-tap-vien", id: u.id });
  return { ...u, collection: "bien-tap-vien" } as never;
};

console.log("CMS tích hợp:");
// Bảo đảm đã có ít nhất một tài khoản (để kiểm khoá "tài khoản đầu tiên").
const chuBien = await nguoi("chu_bien");
const bienTap = await nguoi("bien_tap");
const mayDoc = await nguoi("may_doc");
const ctv = await nguoi("cong_tac_vien");
const ctv2 = await nguoi("cong_tac_vien");

const baiSach = (slug: string) => ({
  tieu_de: `Số chủ đạo 7 là gì ${slug}`,
  slug,
  mang: "than_so",
  tu_khoa_chinh: "số chủ đạo 7",
  tra_loi_nhanh: "Số chủ đạo 7 là con số của sự tìm hiểu. " + tu(40),
  noi_dung: goc(
    doan(chu("Số chủ đạo 7 là con số của người thích tìm hiểu.")),
    h("h2", "Số chủ đạo 7 là gì?"),
    doan(chu(tuRieng(slug, 120))),
    khoi({ blockType: "ghi_chu", kieu: "tu_soi", noi_dung: "Bạn thấy mình giống ở điểm nào?" }),
    khoi({ blockType: "keu_goi", cong_cu: "/than-so", loi_moi: "Xem số của bạn", nut: "Xem ngay" }),
    khoi({ blockType: "trich_dan", cau: "Biết người là trí, biết mình là sáng.", nguon: "Đạo Đức Kinh, chương 33" }),
  ),
  hoi_dap: [{ cau_hoi: "Số 7 hợp nghề gì?", tra_loi: "Nghiên cứu." }],
  nguon: [{ ten: "Thần số học Pythagoras hiện đại" }],
});

await ca("biên tập viên lưu NHÁP được", async () => {
  const b = await payload.create({ collection: "bai-viet", user: bienTap, overrideAccess: false, draft: true,
    data: { ...baiSach(`${dau}-nhap`), _status: "draft" } as never });
  tao.push({ collection: "bai-viet", id: b.id });
  assert.equal((b as { _status?: string })._status, "draft");
});

await ca("biên tập viên KHÔNG xuất bản được", async () => {
  await nem(() => payload.create({ collection: "bai-viet", user: bienTap, overrideAccess: false,
    data: { ...baiSach(`${dau}-bt-xb`), _status: "published" } as never }), /not allowed|Forbidden|không được phép|quyền/i);
});

await ca("máy đọc không sửa được bài", async () => {
  await nem(() => payload.create({ collection: "bai-viet", user: mayDoc, overrideAccess: false, draft: true,
    data: { ...baiSach(`${dau}-md`), _status: "draft" } as never }), /not allowed|Forbidden|quyền/i);
});

await ca("có lỗi chặn (vùng cấm) → chủ biên cũng không xuất bản được", async () => {
  const x = baiSach(`${dau}-cam`);
  x.noi_dung.root.children.push(doan(chu("Mua vé xổ số ngày đẹp.")) as never);
  await nem(() => payload.create({ collection: "bai-viet", user: chuBien, overrideAccess: false,
    data: { ...x, _status: "published" } as never }), /Chưa xuất bản được.*xổ số/);
});

await ca("ký thẩm định thiếu xác nhận → không xuất bản được", async () => {
  await nem(() => payload.create({ collection: "bai-viet", user: chuBien, overrideAccess: false,
    data: { ...baiSach(`${dau}-td`), ky_ten: "tham_dinh", _status: "published" } as never }), /Thẩm định/);
});

let idXb: number | string = 0;
await ca("chủ biên xuất bản bài sạch: điểm, ngày xuất bản, HTML cho web", async () => {
  const b = await payload.create({ collection: "bai-viet", user: chuBien, overrideAccess: false,
    data: { ...baiSach(`${dau}-xb`), _status: "published" } as never });
  tao.push({ collection: "bai-viet", id: b.id });
  idXb = b.id;
  const d = await payload.findByID({ collection: "bai-viet", id: b.id, overrideAccess: true }) as unknown as Record<string, unknown>;
  assert.ok(typeof d.diem_kiem_dinh === "number" && (d.diem_kiem_dinh as number) > 0, "có điểm");
  assert.ok(d.publishedAt, "tự đặt ngày xuất bản");
  const html = String(d.noi_dung_html);
  assert.match(html, /<h2[^>]*>Số chủ đạo 7 là gì\?<\/h2>/);
  assert.match(html, /<aside class="hbt-ghi-chu hbt-ghi-chu-tu_soi">/);
  assert.match(html, /<a href="\/than-so">Xem ngay<\/a>/);
  assert.match(html, /<figcaption>Đạo Đức Kinh, chương 33<\/figcaption>/);
  assert.doesNotMatch(html, /<script/i);
});

await ca("link nội bộ tới bài khác → /blog/{slug}", async () => {
  const b = await payload.create({ collection: "bai-viet", overrideAccess: true, draft: true, data: {
    ...baiSach(`${dau}-link`), _status: "draft",
    noi_dung: goc(doan({ type: "link", version: 3, direction: "ltr", format: "", indent: 0,
      fields: { linkType: "internal", newTab: false, doc: { relationTo: "bai-viet", value: idXb } }, children: [chu("đọc bài")] })),
  } as never });
  tao.push({ collection: "bai-viet", id: b.id });
  const d = await payload.findByID({ collection: "bai-viet", id: b.id, overrideAccess: true, draft: true }) as unknown as Record<string, unknown>;
  assert.match(String(d.noi_dung_html), new RegExp(`href="/blog/${dau}-xb"`));
});

await ca("khách chỉ thấy bài đã xuất bản, không thấy trường nội bộ", async () => {
  const r = await payload.find({ collection: "bai-viet", overrideAccess: false, where: { slug: { like: dau } }, limit: 50 });
  const slugs = r.docs.map((d) => (d as { slug?: string }).slug);
  assert.ok(slugs.includes(`${dau}-xb`), "thấy bài xuất bản");
  assert.ok(!slugs.includes(`${dau}-nhap`), "không thấy nháp");
  const d = r.docs.find((x) => (x as { slug?: string }).slug === `${dau}-xb`) as unknown as Record<string, unknown>;
  assert.equal(d.diem_kiem_dinh, undefined);
  assert.equal(d.ghi_chu_kiem_dinh, undefined);
  assert.equal(d.xac_nhan_tham_dinh, undefined);
  assert.ok(String(d.noi_dung_html).length > 50, "có HTML");
});

await ca("khách không tạo/sửa được bài", async () => {
  await nem(() => payload.create({ collection: "bai-viet", overrideAccess: false, draft: true,
    data: { ...baiSach(`${dau}-khach`), _status: "draft" } as never }), /not allowed|Forbidden|quyền/i);
});

await ca("đổi slug bài đã xuất bản (kể cả sau khi có bản nháp tự lưu) → giữ slug cũ để chuyển hướng", async () => {
  await payload.update({ collection: "bai-viet", id: idXb, user: chuBien, overrideAccess: false, draft: true,
    data: { mo_ta_ngan: "nháp tự lưu", _status: "draft" } as never });
  await payload.update({ collection: "bai-viet", id: idXb, user: chuBien, overrideAccess: false,
    data: { slug: `${dau}-xb-moi`, _status: "published" } as never });
  const d = await payload.findByID({ collection: "bai-viet", id: idXb, overrideAccess: true }) as unknown as Record<string, unknown>;
  assert.equal(d.slug, `${dau}-xb-moi`);
  assert.deepEqual(d.slug_cu, [`${dau}-xb`]);
});

await ca("slug tự sinh bỏ dấu tiếng Việt (kể cả đ)", async () => {
  const b = await payload.create({ collection: "bai-viet", overrideAccess: true, draft: true,
    data: { ...baiSach(""), slug: undefined, tieu_de: `Đường đời ${dau} số 7`, _status: "draft" } as never });
  tao.push({ collection: "bai-viet", id: b.id });
  assert.equal((b as { slug?: string }).slug, `duong-doi-${dau}-so-7`);
});

await ca("mật khẩu ngắn hơn 12 ký tự bị từ chối", async () => {
  await nem(() => payload.create({ collection: "bien-tap-vien", overrideAccess: true,
    data: { email: `${dau}-ngan@vidu.vn`, password: "ngan123", ten_hien_thi: "x", vai_tro: "bien_tap" } as never }), /12 ký tự/);
});

await ca("đã có tài khoản → không ai tự đăng ký 'tài khoản đầu tiên' qua mạng được nữa", async () => {
  // Giả lập đúng yêu cầu REST chưa đăng nhập (đường của màn "tạo tài khoản đầu tiên").
  const { createLocalReq } = await import("payload");
  const req = await createLocalReq({}, payload);
  req.payloadAPI = "REST";
  await nem(() => payload.create({ collection: "bien-tap-vien", overrideAccess: true, req,
    data: { email: `${dau}-la@vidu.vn`, password: "mat-khau-du-dai-123", ten_hien_thi: "lạ" } as never }), /Đã có tài khoản/);
});

await ca("biên tập viên không tự nâng vai trò của mình", async () => {
  const u = bienTap as unknown as { id: number };
  await payload.update({ collection: "bien-tap-vien", id: u.id, user: bienTap, overrideAccess: false,
    data: { vai_tro: "quan_tri" } as never });
  const d = await payload.findByID({ collection: "bien-tap-vien", id: u.id, overrideAccess: true }) as unknown as { vai_tro: string };
  assert.equal(d.vai_tro, "bien_tap");
});

await ca("tính năng: khách đọc được, biên tập viên không sửa được", async () => {
  const g = await payload.findGlobal({ slug: "tinh-nang", overrideAccess: false }) as unknown as Record<string, unknown>;
  assert.equal(g.blog_bat, true);
  await nem(() => payload.updateGlobal({ slug: "tinh-nang", user: bienTap, overrideAccess: false, data: { blog_bat: false } as never }),
    /not allowed|Forbidden|quyền/i);
});

// ---------------- cộng tác viên (lộ trình chuyên gia) + chuẩn hoá tiếng Việt + video
const idCua = (u: unknown) => (u as { id: number }).id;
let idCtv: number | string = 0;
await ca("cộng tác viên tạo nháp: tự gắn người tạo, trạng thái 'đang viết', không đổi được chữ ký E-E-A-T", async () => {
  const b = await payload.create({ collection: "bai-viet", user: ctv, overrideAccess: false, draft: true,
    data: { ...baiSach(`${dau}-ctv`), ky_ten: "tham_dinh", nguoi_tao: idCua(chuBien), _status: "draft" } as never });
  tao.push({ collection: "bai-viet", id: b.id });
  idCtv = b.id;
  const d = await payload.findByID({ collection: "bai-viet", id: b.id, overrideAccess: true, depth: 0, draft: true }) as unknown as Record<string, unknown>;
  assert.equal(d.nguoi_tao, idCua(ctv));
  assert.equal(d.trang_thai_duyet, "dang_viet");
  assert.equal(d.ky_ten, "ban_bien_tap");
});

await ca("cộng tác viên KHÔNG xuất bản được", async () => {
  await nem(() => payload.create({ collection: "bai-viet", user: ctv, overrideAccess: false,
    data: { ...baiSach(`${dau}-ctv-xb`), _status: "published" } as never }), /not allowed|Forbidden|quyền/i);
  await nem(() => payload.update({ collection: "bai-viet", id: idCtv, user: ctv, overrideAccess: false,
    data: { _status: "published" } as never }), /not allowed|Forbidden|quyền/i);
});

await ca("cộng tác viên khác không thấy, không sửa được nháp của người khác", async () => {
  const r = await payload.find({ collection: "bai-viet", user: ctv2, overrideAccess: false, draft: true,
    where: { id: { equals: idCtv } } });
  assert.equal(r.totalDocs, 0);
  await nem(() => payload.update({ collection: "bai-viet", id: idCtv, user: ctv2, overrideAccess: false, draft: true,
    data: { tieu_de: "chiếm bài" } as never }), /not allowed|Forbidden|quyền|Not Found|không tìm/i);
  const cua = await payload.find({ collection: "bai-viet", user: ctv, overrideAccess: false, draft: true, where: { id: { equals: idCtv } } });
  assert.equal(cua.totalDocs, 1);
});

await ca("cộng tác viên gửi duyệt được, tự 'Đã duyệt' thì bị chặn, không sửa ghi chú Chủ biên", async () => {
  await nem(() => payload.update({ collection: "bai-viet", id: idCtv, user: ctv, overrideAccess: false, draft: true,
    data: { trang_thai_duyet: "da_duyet" } as never }), /Chỉ Chủ biên/);
  await payload.update({ collection: "bai-viet", id: idCtv, user: ctv, overrideAccess: false, draft: true,
    data: { trang_thai_duyet: "cho_duyet", ghi_chu_duyet: "tự khen" } as never });
  const d = await payload.findByID({ collection: "bai-viet", id: idCtv, overrideAccess: true, draft: true }) as unknown as Record<string, unknown>;
  assert.equal(d.trang_thai_duyet, "cho_duyet");
  assert.ok(!d.ghi_chu_duyet);
});

await ca("gửi duyệt bài có lỗi chặn → bị từ chối", async () => {
  const x = baiSach(`${dau}-ctv-cam`);
  x.noi_dung.root.children.push(doan(chu("Gọi hotline 0912 345 678 để xem thêm.")) as never);
  await nem(() => payload.create({ collection: "bai-viet", user: ctv, overrideAccess: false, draft: true,
    data: { ...x, trang_thai_duyet: "cho_duyet", _status: "draft" } as never }), /Chưa gửi duyệt được/);
});

await ca("Chủ biên ghi 'cần sửa' rồi xuất bản → trạng thái 'đã duyệt', người tạo giữ nguyên", async () => {
  await payload.update({ collection: "bai-viet", id: idCtv, user: chuBien, overrideAccess: false, draft: true,
    data: { trang_thai_duyet: "can_sua", ghi_chu_duyet: "Thêm nguồn sách." } as never });
  const a = await payload.findByID({ collection: "bai-viet", id: idCtv, user: ctv, overrideAccess: false, draft: true }) as unknown as Record<string, unknown>;
  assert.equal(a.ghi_chu_duyet, "Thêm nguồn sách.");
  await payload.update({ collection: "bai-viet", id: idCtv, user: chuBien, overrideAccess: false,
    data: { _status: "published" } as never });
  const d = await payload.findByID({ collection: "bai-viet", id: idCtv, overrideAccess: true, depth: 0 }) as unknown as Record<string, unknown>;
  assert.equal(d.trang_thai_duyet, "da_duyet");
  assert.equal(d.nguoi_tao, idCua(ctv));
  const khach = await payload.findByID({ collection: "bai-viet", id: idCtv, overrideAccess: false }) as unknown as Record<string, unknown>;
  assert.equal(khach.nguoi_tao, undefined);
  assert.equal(khach.ghi_chu_duyet, undefined);
});

await ca("chuẩn hoá tiếng Việt khi lưu: NFC, khoảng trắng, dấu câu (kể cả trong thân bài)", async () => {
  const x = baiSach(`${dau}-nfc`);
  x.tieu_de = `  ${"Số chủ đạo".normalize("NFD")}  là gì ? `;
  x.noi_dung.root.children.push(doan(chu(`${"Thủy".normalize("NFD")}  sinh mộc , hoả sinh thổ .`)) as never);
  const b = await payload.create({ collection: "bai-viet", user: bienTap, overrideAccess: false, draft: true,
    data: { ...x, _status: "draft" } as never });
  tao.push({ collection: "bai-viet", id: b.id });
  const d = await payload.findByID({ collection: "bai-viet", id: b.id, overrideAccess: true, draft: true }) as unknown as
    { tieu_de: string; noi_dung: { root: { children: { children?: { text?: string }[] }[] } } };
  assert.equal(d.tieu_de, "Số chủ đạo là gì?");
  const cuoi = d.noi_dung.root.children.at(-1)!.children![0]!.text;
  assert.equal(cuoi, "Thủy sinh mộc, hoả sinh thổ.");
});

await ca("khối video YouTube → iframe youtube-nocookie trong HTML cho web; link sai bị từ chối", async () => {
  const x = baiSach(`${dau}-video`);
  x.noi_dung.root.children.push(khoi({ blockType: "video", url: "https://youtu.be/dQw4w9WgXcQ?t=90", tieu_de: "Cách tính số chủ đạo" }) as never);
  const b = await payload.create({ collection: "bai-viet", user: chuBien, overrideAccess: false,
    data: { ...x, _status: "published" } as never });
  tao.push({ collection: "bai-viet", id: b.id });
  const d = await payload.findByID({ collection: "bai-viet", id: b.id, overrideAccess: true }) as unknown as { noi_dung_html: string };
  assert.match(d.noi_dung_html, /<figure class="hbt-video"><iframe src="https:\/\/www\.youtube-nocookie\.com\/embed\/dQw4w9WgXcQ\?start=90" title="Cách tính số chủ đạo"/);
  const y = baiSach(`${dau}-video-sai`);
  y.noi_dung.root.children.push(khoi({ blockType: "video", url: "https://evil.example/v", tieu_de: "x" }) as never);
  // Nháp bỏ qua kiểm hợp lệ (Payload) → kiểm khi xuất bản; bộ chuyển HTML vẫn bỏ link sai nếu lọt.
  await nem(() => payload.create({ collection: "bai-viet", user: chuBien, overrideAccess: false,
    data: { ...y, _status: "published" } as never }), /YouTube|invalid|không hợp lệ/i);
});

// ---------------- nháp chưa đặt tiêu đề + loại bài
await ca("nháp tự lưu chưa có tiêu đề → tiêu đề tạm, không sinh slug, hai nháp không đụng slug, không xuất bản được", async () => {
  const ids: (number | string)[] = [];
  for (let i = 0; i < 2; i++) {
    const b = await payload.create({ collection: "bai-viet", user: bienTap, overrideAccess: false, draft: true,
      data: { _status: "draft" } as never });
    tao.push({ collection: "bai-viet", id: b.id }); ids.push(b.id);
    const d = b as unknown as { tieu_de: string; slug?: string | null; loai_bai?: string };
    assert.equal(d.tieu_de, "(Chưa đặt tiêu đề)");
    assert.ok(!d.slug, `slug phải trống, có: ${d.slug}`);
    assert.equal(d.loai_bai, "bai_viet");
  }
  // Gõ tiêu đề thật → slug sinh theo tiêu đề.
  const u = await payload.update({ collection: "bai-viet", id: ids[0]!, user: bienTap, overrideAccess: false, draft: true,
    data: { tieu_de: `Tiêu đề thật ${dau}` } as never }) as unknown as { slug: string };
  assert.equal(u.slug, `tieu-de-that-${dau}`);
  await nem(() => payload.update({ collection: "bai-viet", id: ids[1]!, user: chuBien, overrideAccess: false,
    data: { ...baiSach(`${dau}-chua-ten`), tieu_de: "", _status: "published" } as never }), /Chưa xuất bản được.*tiêu đề/);
});

await ca("loại bài Tin tức lưu được, khách đọc được qua REST", async () => {
  const b = await payload.create({ collection: "bai-viet", user: chuBien, overrideAccess: false,
    data: { ...baiSach(`${dau}-tin`), loai_bai: "tin_tuc", _status: "published" } as never });
  tao.push({ collection: "bai-viet", id: b.id });
  const k = await payload.findByID({ collection: "bai-viet", id: b.id, overrideAccess: false }) as unknown as { loai_bai: string };
  assert.equal(k.loai_bai, "tin_tuc");
});

await ca("tạo chuyên mục / tác giả qua API không gửi slug → slug tự sinh từ tên (bỏ dấu, cả đ)", async () => {
  const c = await payload.create({ collection: "chuyen-muc", user: chuBien, overrideAccess: false,
    data: { ten: `Đời sống ${dau}` } as never }) as unknown as { id: number; slug: string };
  assert.equal(c.slug, `doi-song-${dau}`);
  await payload.delete({ collection: "chuyen-muc", id: c.id, overrideAccess: true });
  const t = await payload.create({ collection: "tac-gia", user: chuBien, overrideAccess: false,
    data: { ten: `Đức Thử ${dau}` } as never }) as unknown as { id: number; slug: string };
  tao.push({ collection: "tac-gia", id: t.id });
  assert.equal(t.slug, `duc-thu-${dau}`);
});

// ---------------- CG-6 kiểm trùng nội dung
const vanChep = "Người mang số chủ đạo bảy thường thích đọc sách, tự tìm hiểu bản chất của sự việc, ít khi tin ngay lời "
  + "người khác và cần những khoảng lặng một mình để nạp lại năng lượng sau mỗi tuần làm việc căng thẳng. Họ quan sát lâu "
  + "rồi mới nói, ghét bị thúc ép, và thường chỉ mở lòng với vài người bạn đã chứng tỏ được sự tin cậy qua nhiều năm.";
const baiChep = (slug: string, van: string) => {
  const x = baiSach(slug);
  x.noi_dung.root.children.splice(2, 1, doan(chu(van)) as never);
  return x;
};
await ca("cộng tác viên gửi duyệt bài chép bài đã xuất bản → chặn, nêu tên bài gốc + đoạn trùng", async () => {
  const goc1 = await payload.create({ collection: "bai-viet", user: chuBien, overrideAccess: false,
    data: { ...baiChep(`${dau}-goc`, vanChep), tieu_de: "Bài gốc số 7", _status: "published" } as never });
  tao.push({ collection: "bai-viet", id: goc1.id });
  await nem(() => payload.create({ collection: "bai-viet", user: ctv2, overrideAccess: false, draft: true,
    data: { ...baiChep(`${dau}-chep`, vanChep), trang_thai_duyet: "cho_duyet", _status: "draft" } as never }),
    /Chưa gửi duyệt được.*Trùng \d+% với bài "Bài gốc số 7".*Đoạn trùng: "/);
  // Lưu nháp vẫn được (kiểm trùng chỉ chạy khi gửi duyệt / xuất bản).
  const nhap = await payload.create({ collection: "bai-viet", user: ctv2, overrideAccess: false, draft: true,
    data: { ...baiChep(`${dau}-chep2`, vanChep), _status: "draft" } as never });
  tao.push({ collection: "bai-viet", id: nhap.id });
});

await ca("Chủ biên xuất bản bài trùng → chỉ cảnh báo, ghi vào ghi chú kiểm định", async () => {
  const b = await payload.create({ collection: "bai-viet", user: chuBien, overrideAccess: false,
    data: { ...baiChep(`${dau}-chep-cb`, vanChep), _status: "published" } as never });
  tao.push({ collection: "bai-viet", id: b.id });
  const d = await payload.findByID({ collection: "bai-viet", id: b.id, overrideAccess: true, depth: 0 }) as unknown as { ghi_chu_kiem_dinh?: string };
  assert.match(d.ghi_chu_kiem_dinh ?? "", /Trùng \d+% với/);
});

await ca("chép nguyên văn kho tri thức → chặn cộng tác viên (vân tay KB dựng lúc build)", async () => {
  const fs = await import("node:fs");
  const kb = JSON.parse(fs.readFileSync("../engine/app/kb/data/thanso_chan_dung.json", "utf8")) as unknown;
  const ds: string[] = [];
  const nhat = (v: unknown) => { if (typeof v === "string" && v.length > 200) ds.push(v); else if (v && typeof v === "object") Object.values(v).forEach(nhat); };
  nhat(kb);
  assert.ok(ds.length >= 2, "cần đoạn KB đủ dài");
  await nem(() => payload.create({ collection: "bai-viet", user: ctv2, overrideAccess: false, draft: true,
    data: { ...baiChep(`${dau}-chep-kb`, ds.slice(0, 3).join(" ")), trang_thai_duyet: "cho_duyet", _status: "draft" } as never }),
    /kho tri thức/);
});

await ca("nút Kiểm trùng (POST /api/bai-viet/kiem-trung): cộng tác viên dùng được, bài nháp người khác không lộ tên, máy đọc bị từ chối", async () => {
  const ep = payload.collections["bai-viet"].config.endpoints || [];
  const h = ep.find((e) => e.path === "/kiem-trung")!.handler;
  const goi = (user: unknown, body: unknown) => h({ user, payload, json: async () => body, context: {} } as never);
  const nhapKhac = await payload.create({ collection: "bai-viet", user: bienTap, overrideAccess: false, draft: true,
    data: { ...baiChep(`${dau}-nhap-bi-mat`, vanChep.split("").reverse().join("") + " " + tuRieng("bimat", 60)), tieu_de: "Tiêu đề bí mật", _status: "draft" } as never });
  tao.push({ collection: "bai-viet", id: nhapKhac.id });
  const x = baiChep(`${dau}-hoi`, vanChep);
  const r = await goi(ctv, { tra_loi_nhanh: x.tra_loi_nhanh, noi_dung: x.noi_dung, hoi_dap: x.hoi_dap });
  assert.equal(r.status, 200);
  const j = await r.json() as { muc: { ma: string; muc_do: string; thong_diep: string }[] };
  const m = j.muc.find((v) => v.ma === "trung_bai")!;
  assert.equal(m.muc_do, "loi");
  assert.doesNotMatch(JSON.stringify(j), /Tiêu đề bí mật/);
  const r2 = await goi(mayDoc, {});
  assert.equal(r2.status, 403);
});

// dọn
for (const t of tao.reverse()) {
  await payload.delete({ collection: t.collection, id: t.id, overrideAccess: true }).catch(() => {});
}
console.log(`${dat} ca đạt${process.exitCode ? " — CÓ CA HỎNG" : ""}`);
process.exit(process.exitCode ?? 0);
