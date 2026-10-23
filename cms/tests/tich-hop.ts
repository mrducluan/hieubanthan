// Kiểm thử tích hợp CMS trên Postgres THẬT (Local API của Payload, đúng đường đi của REST/admin):
// phân quyền theo vai trò, chặn xuất bản khi có lỗi chặn, HTML sinh cho web, giữ slug cũ, tài khoản đầu tiên.
// Chạy: DATABASE_URI=postgres://…/cms_test npm run test:tich-hop   (DB rỗng hoặc DB thử — script tự dọn dữ liệu nó tạo)
import assert from "node:assert/strict";
import { getPayload, type Payload } from "payload";
import config from "../src/payload.config";
import { MENU_MAC_DINH } from "../src/globals/DieuHuong";
import { vaiTro } from "../src/access";
import { buocHienTai, docCookie, maTotp, tuBase32 } from "../src/lib/totp";
import { dongBoSoTrang, kiemSoTrang } from "../src/lib/so-trang";
import { nhapBaiNotFair } from "../src/lib/notfair";
import { linkXemTrang, maXemTruoc } from "../src/lib/web";
import sharp from "sharp";

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
const tao: { collection: "bai-viet" | "bien-tap-vien" | "tac-gia" | "noi-dung-trang" | "mau-cum" | "media"; id: number | string }[] = [];
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

await ca("Điều hướng chân trang: mặc định 4 cột; link ngoài/thiếu bài bị chặn; chỉ Chủ biên sửa; bài → slug khi đọc", async () => {
  const g = await payload.findGlobal({ slug: "dieu-huong" }) as unknown as { cot: { ten: string; lien_ket: { duong_dan: string }[] }[] };
  assert.deepEqual(g.cot.map((c) => c.ten), ["Khám phá", "Kiến thức", "Về chúng tôi", "Pháp lý"]);
  assert.ok(g.cot[1]!.lien_ket.some((l) => l.duong_dan === "/blog"));
  const cot = (lien_ket: unknown[]) => ({ cot: [{ ten: "Thử", lien_ket }] }) as never;
  for (const xau of ["//evil.vn", "/\\evil.vn", "https://evil.vn", "javascript:alert(1)", "tu-vi"]) {
    await nem(() => payload.updateGlobal({ slug: "dieu-huong", user: chuBien, overrideAccess: false,
      data: cot([{ nhan: "x", loai: "duong_dan", duong_dan: xau }]) }), /không hợp lệ.*Đường dẫn/);
  }
  await nem(() => payload.updateGlobal({ slug: "dieu-huong", user: chuBien, overrideAccess: false,
    data: cot([{ nhan: "x", loai: "bai" }]) }), /không hợp lệ.*Bài viết/);
  await nem(() => payload.updateGlobal({ slug: "dieu-huong", user: bienTap, overrideAccess: false,
    data: cot([{ nhan: "x", loai: "duong_dan", duong_dan: "/tu-vi" }]) }), /permission|quyền|Forbidden/i);
  const b = await payload.create({ collection: "bai-viet", overrideAccess: true, data: { ...baiSach(`${dau}-menu`), _status: "published" } as never });
  tao.push({ collection: "bai-viet", id: b.id });
  await payload.updateGlobal({ slug: "dieu-huong", user: chuBien, overrideAccess: false,
    data: cot([{ nhan: "Bài hay", loai: "bai", bai: b.id }, { nhan: "Tử vi", loai: "duong_dan", duong_dan: "/tu-vi" }]) });
  const doc = await payload.findGlobal({ slug: "dieu-huong", depth: 1, overrideAccess: false }) as unknown as
    { cot: { lien_ket: { bai?: { slug: string } }[] }[] };
  assert.equal(doc.cot[0]!.lien_ket[0]!.bai!.slug, `${dau}-menu`);
  await payload.updateGlobal({ slug: "dieu-huong", overrideAccess: true, data: { cot: MENU_MAC_DINH.map((c) => ({ ...c, lien_ket: c.lien_ket.map((l) => ({ ...l, loai: "duong_dan" })) })) } as never });
});

await ca("Trang chủ & banner: link banner/thông báo phải trong site, số bài kẹp 2–6, biên tập viên không sửa được", async () => {
  await nem(() => payload.updateGlobal({ slug: "trang-chu", user: chuBien, overrideAccess: false,
    data: { thong_bao: { bat: true, chu: "Sự kiện", link: "//evil.vn" } } as never }), /không hợp lệ|invalid/i);
  await nem(() => payload.updateGlobal({ slug: "trang-chu", user: chuBien, overrideAccess: false,
    data: { banner: { bat: true, tieu_de: "B", nut_link: "https://evil.vn" } } as never }), /không hợp lệ|invalid/i);
  await nem(() => payload.updateGlobal({ slug: "trang-chu", user: chuBien, overrideAccess: false,
    data: { bai_viet: { so_bai: 9 } } as never }), /không hợp lệ|invalid/i);
  await nem(() => payload.updateGlobal({ slug: "trang-chu", user: bienTap, overrideAccess: false,
    data: { thong_bao: { bat: true, chu: "x" } } as never }), /permission|quyền|Forbidden/i);
  const ok = await payload.updateGlobal({ slug: "trang-chu", user: chuBien, overrideAccess: false,
    data: { thong_bao: { bat: true, chu: "Tuần này mời bạn được 40 Sao", link: "/tai-khoan" } } as never }) as unknown as { thong_bao: { chu: string } };
  assert.equal(ok.thong_bao.chu, "Tuần này mời bạn được 40 Sao");
  const khach = await payload.findGlobal({ slug: "trang-chu", overrideAccess: false }) as unknown as { thong_bao: { link: string } };
  assert.equal(khach.thong_bao.link, "/tai-khoan");
  await payload.updateGlobal({ slug: "trang-chu", overrideAccess: true, data: { thong_bao: { bat: false, chu: "", link: "" } } as never });
});

await ca("CMS-2 MFA: bật bằng mã TOTP → cookie mở quyền; thiếu cookie = không quyền; chặn dùng lại mã; sai 5 lần khoá", async () => {
  const qt = await nguoi("quan_tri") as unknown as { id: number };
  const ep = payload.collections["bien-tap-vien"].config.endpoints || [];
  const goi = (path: string, body: unknown, cookie = "") => ep.find((e) => e.path === path)!.handler({
    user: { ...qt, collection: "bien-tap-vien", _strategy: "local-jwt", mfa_bat: undefined }, payload, payloadAPI: "REST",
    headers: new Headers(cookie ? { cookie } : {}), json: async () => body, context: {},
  } as never);
  const r1 = await goi("/mfa/bat-dau", {});
  assert.equal(r1.status, 200, JSON.stringify(await r1.clone().json()));
  const { bi_mat } = await r1.json() as { bi_mat: string };
  const bi = tuBase32(bi_mat);
  const ma = maTotp(bi, buocHienTai());
  const r2 = await goi("/mfa/xac-nhan", { ma });
  assert.equal(r2.status, 200);
  const cookie = docCookie(r2.headers.get("set-cookie")?.split(";")[0]);
  assert.ok(cookie);
  assert.equal((await goi("/mfa/xac-nhan", { ma })).status, 400);                       // không dùng lại được mã vừa dùng
  const doc = await payload.findByID({ collection: "bien-tap-vien", id: qt.id, overrideAccess: true }) as { mfa_bat?: boolean; mfa_bi_mat?: string };
  assert.equal(doc.mfa_bat, true);
  assert.ok(!(await payload.findByID({ collection: "bien-tap-vien", id: qt.id, overrideAccess: false, user: qt as never }) as unknown as Record<string, unknown>).mfa_bi_mat);
  // vai trò có hiệu lực: không cookie → null; cookie đúng → quan_tri; Local API (script) không cần
  const req = (c?: string) => ({ user: { ...qt, collection: "bien-tap-vien", vai_tro: "quan_tri", mfa_bat: true, _strategy: "local-jwt" },
    payloadAPI: "REST", headers: new Headers(c ? { cookie: `cms-mfa=${c}` } : {}) }) as never;
  assert.equal(vaiTro(req()), null);
  assert.equal(vaiTro(req(cookie!)), "quan_tri");
  assert.equal(vaiTro({ ...(req() as object), payloadAPI: "local" } as never), "quan_tri");
  for (let i = 0; i < 5; i++) await goi("/mfa/xac-nhan", { ma: "000000" });
  assert.equal((await goi("/mfa/xac-nhan", { ma: maTotp(bi, buocHienTai() + 1) })).status, 429);
});

await ca("CMS-2 trợ lý AI: kiểm đầu vào, máy đọc bị từ chối, thiếu engine báo rõ (không bịa)", async () => {
  const ep = payload.collections["bai-viet"].config.endpoints || [];
  const h = ep.find((e) => e.path === "/soan-nhap")!.handler;
  const goi = (user: unknown, body: unknown) => h({ user, payload, payloadAPI: "local", headers: new Headers(), json: async () => body, context: {} } as never);
  assert.equal((await goi(mayDoc, { van: "Một đoạn văn đủ dài để sửa.", hanh_dong: "viet_lai" })).status, 403);
  assert.equal((await goi(bienTap, { van: "ngắn", hanh_dong: "viet_lai" })).status, 422);
  assert.equal((await goi(bienTap, { van: "Một đoạn văn đủ dài để sửa.", hanh_dong: "bia_dat" })).status, 422);
  const cu = process.env.ENGINE_URL; delete process.env.ENGINE_URL;
  const r = await goi(ctv, { van: "Một đoạn văn đủ dài để sửa.", hanh_dong: "soat_loi" });
  process.env.ENGINE_URL = cu;
  assert.equal(r.status, 200);
  const d = await r.json() as { nhap: string | null; loi?: string };
  assert.equal(d.nhap, null);
  assert.match(d.loi ?? "", /ENGINE_URL/);
});

// ---------------- ND-0 / ND-1: Trang website, Mẫu cụm trang, đồng bộ sổ trang, chân trang
const nd = `/nd-${dau}`;
const soTrang = (tenTool: string, coPhapLy = true) => kiemSoTrang({
  trang: [
    // mac_dinh nhiều khoá, thứ tự khác thứ tự jsonb tự sắp → lần đồng bộ thứ hai vẫn phải "không đổi gì".
    { duong: `${nd}/cong-cu`, nhom: "cong_cu", ten: tenTool, o: ["seo", "dau_trang", "gioi_thieu", "khoi_tren"], mac_dinh: { tieu_de_seo: "Mặc định", h1: "H", doan: ["a"] } },
    { duong: `${nd}/gioi-thieu`, nhom: "tinh", ten: "Giới thiệu", o: ["seo", "muc"], mac_dinh: {} },
    ...(coPhapLy ? [{ duong: `${nd}/dieu-khoan`, nhom: "phap_ly", ten: "Điều khoản", o: ["seo", "muc"], mac_dinh: { ngay_hieu_luc: "08/10/2026" } }] : []),
  ],
  mau: [{ mau_duong: `${nd}/kien-thuc/{slug}`, nhom: "kien_thuc", ten: "Cụm thử", bien: ["tieu_de"], o: ["khoi_tren"], nguon_kb: { kieu: "kb", loai: "sao", vi_du: "sao-tu-vi", tep_kb: ["tuvi_kb.json"] } }],
});
const timTrang = async (duong: string, draft = false) => (await payload.find({ collection: "noi-dung-trang", overrideAccess: true, draft,
  where: { duong: { equals: duong } }, limit: 1, depth: 0 })).docs[0] as unknown as Record<string, unknown> & { id: number };
const ghiTao = async () => {
  for (const c of ["noi-dung-trang", "mau-cum"] as const) {
    const r = await payload.find({ collection: c, overrideAccess: true, limit: 0, pagination: false, depth: 0,
      where: { [c === "mau-cum" ? "mau_duong" : "duong"]: { like: nd } } });
    for (const d of r.docs) if (!tao.some((t) => t.id === d.id && t.collection === c)) tao.push({ collection: c, id: d.id });
  }
};

await ca("đồng bộ sổ trang: tạo nháp trống cho URL mới + mẫu cụm; lần 2 không tạo trùng", async () => {
  const kq = await dongBoSoTrang(payload, soTrang("Công cụ thử"));
  await ghiTao();
  assert.equal(kq.tao, 3); assert.equal(kq.mau_tao, 1);
  const d = await timTrang(`${nd}/cong-cu`);
  assert.equal(d._status, "draft"); assert.equal(d.nhom, "cong_cu"); assert.equal(d.tren_web, true);
  assert.deepEqual(d.mac_dinh, { tieu_de_seo: "Mặc định", h1: "H", doan: ["a"] });
  const kq2 = await dongBoSoTrang(payload, soTrang("Công cụ thử"));
  assert.equal(kq2.tao + kq2.cap_nhat + kq2.mau_tao + kq2.mau_cap_nhat, 0);
});

await ca("đồng bộ không ghi đè ô biên tập (kể cả nháp chưa xuất bản); URL mất → tren_web=false; đổi tên → cập nhật", async () => {
  const d = await timTrang(`${nd}/cong-cu`);
  await payload.update({ collection: "noi-dung-trang", id: d.id, user: chuBien, overrideAccess: false,
    data: { tieu_de_seo: "Tiêu đề đã xuất bản", _status: "published" } as never });
  await payload.update({ collection: "noi-dung-trang", id: d.id, user: bienTap, overrideAccess: false, draft: true,
    data: { loi_dan: "Lời dẫn nháp của biên tập viên" } as never });
  const kq = await dongBoSoTrang(payload, soTrang("Công cụ đổi tên", false));
  assert.equal(kq.cap_nhat, 1); assert.equal(kq.go, 1);
  const xb = await timTrang(`${nd}/cong-cu`), nhap = await timTrang(`${nd}/cong-cu`, true);
  assert.equal(xb._status, "published"); assert.equal(xb.tieu_de_seo, "Tiêu đề đã xuất bản"); assert.equal(xb.ten, "Công cụ đổi tên");
  assert.equal(xb.loi_dan ?? null, null, "nháp chưa xuất bản không bị đẩy lên bản xuất bản");
  assert.equal(nhap.loi_dan, "Lời dẫn nháp của biên tập viên"); assert.equal(nhap.ten, "Công cụ đổi tên");
  assert.equal((await timTrang(`${nd}/dieu-khoan`)).tren_web, false);
  await dongBoSoTrang(payload, soTrang("Công cụ đổi tên"));
  assert.equal((await timTrang(`${nd}/dieu-khoan`)).tren_web, true);
});

await ca("biên tập viên không đổi được ô hệ thống, không sửa trang pháp lý; Chủ biên sửa được", async () => {
  const d = await timTrang(`${nd}/cong-cu`);
  const r = await payload.update({ collection: "noi-dung-trang", id: d.id, user: bienTap, overrideAccess: false, draft: true,
    data: { duong: "/khac", nhom: "phap_ly", mac_dinh: { x: 1 } } as never }) as unknown as Record<string, unknown>;
  assert.equal(r.duong, `${nd}/cong-cu`); assert.equal(r.nhom, "cong_cu"); assert.deepEqual(r.mac_dinh, { tieu_de_seo: "Mặc định", h1: "H", doan: ["a"] });
  const pl = await timTrang(`${nd}/dieu-khoan`);
  await nem(() => payload.update({ collection: "noi-dung-trang", id: pl.id, user: bienTap, overrideAccess: false, draft: true,
    data: { h1: "Sửa bậy" } as never }), /not allowed|Forbidden|không|quyền|Not Found/i);
  await payload.update({ collection: "noi-dung-trang", id: pl.id, user: chuBien, overrideAccess: false, draft: true, data: { h1: "Điều khoản" } as never });
});

await ca("pháp lý: 'Thay đổi nội dung' bắt buộc ngày hiệu lực mới hơn bản đang áp dụng; 'Sửa chữ' giữ ngày; xuất bản phải tích ô đối chiếu", async () => {
  const pl = await timTrang(`${nd}/dieu-khoan`);
  await nem(() => payload.update({ collection: "noi-dung-trang", id: pl.id, user: chuBien, overrideAccess: false,
    data: { loai_sua: "thay_doi_noi_dung", ngay_hieu_luc: "2026-10-01T00:00:00.000Z", _status: "published" } as never }), /ngày hiệu lực mới/);
  // Ô ngày "dayOnly" của Payload lưu 12:00 UTC — cùng NGÀY với ngày trong code (08/10/2026) vẫn phải bị chặn.
  await nem(() => payload.update({ collection: "noi-dung-trang", id: pl.id, user: chuBien, overrideAccess: false,
    data: { loai_sua: "thay_doi_noi_dung", ngay_hieu_luc: "2026-10-08T12:00:00.000Z", _status: "published" } as never }), /ngày hiệu lực mới/);
  // ND-4: chưa tích "đã đối chiếu" → không xuất bản được (ngày hợp lệ)
  await nem(() => payload.update({ collection: "noi-dung-trang", id: pl.id, user: chuBien, overrideAccess: false,
    data: { loai_sua: "thay_doi_noi_dung", ngay_hieu_luc: "2026-11-01T00:00:00.000Z", _status: "published" } as never }), /đối chiếu/);
  const xb = await payload.update({ collection: "noi-dung-trang", id: pl.id, user: chuBien, overrideAccess: false,
    data: { loai_sua: "thay_doi_noi_dung", ngay_hieu_luc: "2026-11-01T00:00:00.000Z", da_doi_chieu_phap_ly: true, _status: "published" } as never }) as unknown as { da_doi_chieu_phap_ly: boolean };
  assert.equal(xb.da_doi_chieu_phap_ly, false);   // xuất bản xong tự bỏ tích → lần sau xác nhận lại
  // sau khi xuất bản "thay đổi nội dung": lưu nháp và gỡ xuất bản không bị chặn bởi ngày hiệu lực
  await payload.update({ collection: "noi-dung-trang", id: pl.id, user: chuBien, overrideAccess: false, draft: true, data: { h1: "Điều khoản (nháp)" } as never });
  await nem(() => payload.update({ collection: "noi-dung-trang", id: pl.id, user: chuBien, overrideAccess: false,
    data: { loai_sua: "thay_doi_noi_dung", ngay_hieu_luc: "2026-11-01T00:00:00.000Z", _status: "published" } as never }), /ngày hiệu lực mới/);
  const r = await payload.update({ collection: "noi-dung-trang", id: pl.id, user: chuBien, overrideAccess: false,
    data: { loai_sua: "sua_chu", ngay_hieu_luc: "2027-01-01T00:00:00.000Z", da_doi_chieu_phap_ly: true, _status: "published" } as never }) as unknown as { ngay_hieu_luc: string };
  assert.match(r.ngay_hieu_luc, /^2026-11-01/);
});

await ca("/gioi-thieu mục 'quy-trinh': chỉ Chủ biên sửa; neo đã có không đổi được", async () => {
  // Luật gắn với đường dẫn /gioi-thieu → tạm đổi đường dẫn tài liệu thử sang /gioi-thieu (overrideAccess), xong trả lại.
  const g = await timTrang(`${nd}/gioi-thieu`);
  const muc = [{ neo: "quy-trinh", tieu_de: "Ai biên soạn, ai thẩm định" }, { neo: "nguon", tieu_de: "Nguồn" }];
  await payload.update({ collection: "noi-dung-trang", id: g.id, overrideAccess: true, context: { dongBo: true }, data: { duong: "/gioi-thieu", muc } as never });
  try {
    const cu = await timTrang("/gioi-thieu") as unknown as { muc: { id: string; neo: string; tieu_de: string }[] };
    await nem(() => payload.update({ collection: "noi-dung-trang", id: g.id, user: bienTap, overrideAccess: false, draft: true,
      data: { muc: cu.muc.map((m) => (m.neo === "quy-trinh" ? { ...m, tieu_de: "Đổi bậy" } : m)) } as never }), /Chủ biên/);
    await nem(() => payload.update({ collection: "noi-dung-trang", id: g.id, user: chuBien, overrideAccess: false, draft: true,
      data: { muc: cu.muc.map((m) => (m.neo === "nguon" ? { ...m, neo: "nguon-moi" } : m)) } as never }), /neo/);
    await payload.update({ collection: "noi-dung-trang", id: g.id, user: bienTap, overrideAccess: false, draft: true,
      data: { muc: cu.muc.map((m) => (m.neo === "nguon" ? { ...m, tieu_de: "Nguồn tri thức" } : m)) } as never });
  } finally {
    await payload.update({ collection: "noi-dung-trang", id: g.id, overrideAccess: true, context: { dongBo: true }, data: { duong: `${nd}/gioi-thieu` } as never });
  }
});

await ca("kiểm định chặn xuất bản: số điện thoại gõ tay, tự nhận 'đã thẩm định', link nút ra ngoài site", async () => {
  const d = await timTrang(`${nd}/cong-cu`);
  await nem(() => payload.update({ collection: "noi-dung-trang", id: d.id, user: chuBien, overrideAccess: false,
    data: { loi_dan: "Gọi 0912 345 678", _status: "published" } as never }), /Chưa xuất bản được.*điện thoại/);
  await nem(() => payload.update({ collection: "noi-dung-trang", id: d.id, user: chuBien, overrideAccess: false,
    data: { doan: [{ chu: "Trang này đã thẩm định bởi chuyên gia." }], _status: "published" } as never }), /thẩm định/);
  await nem(() => payload.update({ collection: "noi-dung-trang", id: d.id, user: chuBien, overrideAccess: false,
    data: { khoi_tren: [{ blockType: "nut_moi", chu: "Xem", link: "https://evil.vn" }], _status: "published" } as never }), /trong site|invalid|không hợp lệ/i);
  const r = await payload.update({ collection: "noi-dung-trang", id: d.id, user: chuBien, overrideAccess: false,
    data: { loi_dan: "Hoá  giải".normalize("NFD") + " nhẹ nhàng", _status: "published" } as never }) as unknown as { loi_dan: string; ghi_chu_kiem_dinh: string };
  assert.equal(r.loi_dan, r.loi_dan.normalize("NFC"));
  assert.match(r.ghi_chu_kiem_dinh, /nhạy cảm/);
});

await ca("ghi đè trang KB: chỉ đường dẫn thuộc mẫu cụm; tự gắn nhóm + mẫu; trùng bị chặn", async () => {
  const cu = process.env.ENGINE_URL; delete process.env.ENGINE_URL;   // không hỏi engine → chỉ dựa vào mẫu đường dẫn
  try {
    await nem(() => payload.create({ collection: "noi-dung-trang", user: bienTap, overrideAccess: false, draft: true,
      data: { duong: `${nd}/khong-co/abc` } as never }), /mẫu cụm/);
    const g = await payload.create({ collection: "noi-dung-trang", user: bienTap, overrideAccess: false, draft: true,
      data: { duong: `${nd}/kien-thuc/sao-tu-vi`, nhom: "phap_ly", khoi_tren: [{ blockType: "ghi_chu", kieu: "luu_y", noi_dung: "Xem {tieu_de}" }] } as never }) as unknown as Record<string, unknown> & { id: number };
    tao.push({ collection: "noi-dung-trang", id: g.id });
    assert.equal(g.nhom, "kien_thuc"); assert.ok(g.mau); assert.equal(g.tren_web, true);
    // Đồng bộ lại không đánh dấu ghi đè còn khớp mẫu là "URL đã gỡ" (kể cả nhóm tuoi / la_so_mau).
    const tuoi = kiemSoTrang({ trang: [{ duong: `${nd}/cong-cu`, nhom: "cong_cu", ten: "Công cụ đổi tên", o: [], mac_dinh: {} }],
      mau: [{ mau_duong: `${nd}/tuoi-{nam}-{gioi}`, nhom: "tuoi", ten: "Tuổi", bien: [], o: ["khoi_tren"], nguon_kb: { kieu: "tuoi", vi_du: "tuoi-1990-nam", tep_kb: [] } }] });
    await dongBoSoTrang(payload, { trang: soTrang("Công cụ đổi tên").trang, mau: [...soTrang("x").mau, ...tuoi.mau] });
    await ghiTao();
    const gt = await payload.create({ collection: "noi-dung-trang", user: bienTap, overrideAccess: false, draft: true,
      data: { duong: `${nd}/tuoi-1990-nam` } as never }) as unknown as { id: number; nhom: string };
    tao.push({ collection: "noi-dung-trang", id: gt.id });
    assert.equal(gt.nhom, "tuoi");
    const kq = await dongBoSoTrang(payload, { trang: soTrang("Công cụ đổi tên").trang, mau: [...soTrang("x").mau, ...tuoi.mau] });
    assert.equal(kq.go, 0);
    assert.equal((await timTrang(`${nd}/tuoi-1990-nam`)).tren_web, true);
    assert.equal((await timTrang(`${nd}/kien-thuc/sao-tu-vi`)).tren_web, true);
    await nem(() => payload.create({ collection: "noi-dung-trang", user: chuBien, overrideAccess: false, draft: true,
      data: { duong: `${nd}/kien-thuc/sao-tu-vi` } as never }), /Đã có|unique|duong/i);
  } finally { process.env.ENGINE_URL = cu; }
});

await ca("ND-7 chữ trên trang: chỉ khoá trong bảng, chữ thuần, cắt giới hạn; liên hệ gõ tay bị chặn; ghi đè cụm công cụ nhận bảng chữ của mẫu", async () => {
  const bang = { "dau.chip_1": { nhan: "Chip", mac_dinh: "30 giây", toi_da: 12 }, "so_sanh.lon": { nhan: "Tiêu đề", mac_dinh: "Gốc" } };
  const so = kiemSoTrang({
    trang: [{ duong: `${nd}/chu-trang`, nhom: "tinh", ten: "Trang chữ", o: ["seo"], mac_dinh: { chu: bang } }],
    mau: [{ mau_duong: `${nd}/xem-ngay/{ngay}`, nhom: "cong_cu_con", ten: "Ngày", bien: ["ngay"], o: ["khoi_tren"], nguon_kb: {},
      mac_dinh: { chu: { "dau.nhan_tren": { nhan: "Nhỏ", mac_dinh: "Ngày {ngay}" } } } }],
  });
  await dongBoSoTrang(payload, { trang: [...soTrang("Công cụ đổi tên").trang, ...so.trang], mau: [...soTrang("x").mau, ...so.mau] });
  await ghiTao();
  const d = await timTrang(`${nd}/chu-trang`);
  const r = await payload.update({ collection: "noi-dung-trang", id: d.id, user: chuBien, overrideAccess: false, draft: true,
    data: { chu: { "dau.chip_1": "<b>Nhanh</b> lắm hôm nay rồi", "so_sanh.lon": "Gốc", "khoa.la": "x" } } as never }) as unknown as { chu: Record<string, string> | null };
  assert.deepEqual(r.chu, { "dau.chip_1": "Nhanh lắm hô" });
  await nem(() => payload.update({ collection: "noi-dung-trang", id: d.id, user: chuBien, overrideAccess: false,
    data: { chu: { "so_sanh.lon": "Gọi 0912 345 678" }, _status: "published" } as never }), /Chưa xuất bản được.*điện thoại/);
  const cu = process.env.ENGINE_URL; delete process.env.ENGINE_URL;
  try {
    const g = await payload.create({ collection: "noi-dung-trang", user: chuBien, overrideAccess: false, draft: true,
      data: { duong: `${nd}/xem-ngay/2026-10-21` } as never }) as unknown as { id: number; nhom: string; mac_dinh: { chu: Record<string, unknown> } };
    tao.push({ collection: "noi-dung-trang", id: g.id });
    assert.equal(g.nhom, "cong_cu_con");
    assert.ok(g.mac_dinh.chu["dau.nhan_tren"], "ghi đè nhận bảng chữ của mẫu");
    const u = await payload.update({ collection: "noi-dung-trang", id: g.id, user: chuBien, overrideAccess: false,
      data: { chu: { "dau.nhan_tren": "Ngày đẹp {ngay}" }, _status: "published" } as never }) as unknown as { chu: Record<string, string> };
    assert.equal(u.chu["dau.nhan_tren"], "Ngày đẹp {ngay}");
  } finally { process.env.ENGINE_URL = cu; }
});

await ca("ND-7 đợt 2: hình trên trang chụp ảnh thư viện (khoá lạ / ảnh mất bị bỏ); chữ dùng chung lọc + chặn liên hệ; link xem trước ký đúng URL", async () => {
  const anh = await payload.create({ collection: "media", overrideAccess: true, data: { alt: "Ảnh hero thử" } as never,
    file: { data: await sharp({ create: { width: 640, height: 640, channels: 3, background: "#c8a24a" } }).png().toBuffer(),
      mimetype: "image/png", name: "hero-thu.png", size: 1 } }) as unknown as { id: number };
  tao.push({ collection: "media", id: anh.id });
  const so = kiemSoTrang({
    trang: [{ duong: `${nd}/hinh-trang`, nhom: "tinh", ten: "Trang hình", o: ["seo"], mac_dinh: { hinh: { "hero.hinh": { nhan: "Hero", goi_y: "vuông", mac_dinh: "SVG" } } } }],
    mau: [], chung: { "loi.thu_lai": { nhan: "Nút", mac_dinh: "Thử lại", toi_da: 20 } },
  });
  await dongBoSoTrang(payload, { trang: [...soTrang("Công cụ đổi tên").trang, ...so.trang], mau: soTrang("x").mau, chung: so.chung });
  await ghiTao();
  const d = await timTrang(`${nd}/hinh-trang`);
  const r = await payload.update({ collection: "noi-dung-trang", id: d.id, user: chuBien, overrideAccess: false, draft: true,
    data: { hinh: { "hero.hinh": anh.id, "khoa.la": anh.id, "mang.x": 999999 } } as never }) as unknown as { hinh: Record<string, { id: number; url: string; alt: string; sizes: Record<string, unknown> }> };
  assert.deepEqual(Object.keys(r.hinh), ["hero.hinh"]);
  assert.equal(r.hinh["hero.hinh"]!.id, anh.id); assert.equal(r.hinh["hero.hinh"]!.alt, "Ảnh hero thử");
  assert.match(r.hinh["hero.hinh"]!.url, /hero-thu/); assert.ok(r.hinh["hero.hinh"]!.sizes.nho, "có cỡ nhỏ");
  // lưu lại với bản đã chụp (giao diện gửi nguyên) → vẫn giữ
  const r2 = await payload.update({ collection: "noi-dung-trang", id: d.id, user: chuBien, overrideAccess: false, draft: true,
    data: { hinh: r.hinh } as never }) as unknown as { hinh: Record<string, { id: number }> };
  assert.equal(r2.hinh["hero.hinh"]!.id, anh.id);

  // chữ dùng chung: đồng bộ ghi bảng gốc; chữ thay lọc theo bảng; số điện thoại gõ tay bị chặn; biên tập viên không sửa
  const g0 = await payload.findGlobal({ slug: "chu-chung", overrideAccess: true }) as unknown as { mac_dinh: { chu: Record<string, unknown> } };
  assert.ok(g0.mac_dinh.chu["loi.thu_lai"]);
  await payload.updateGlobal({ slug: "chu-chung", user: chuBien, overrideAccess: false, data: { chu: { "loi.thu_lai": "Làm lại", "khoa.la": "x" } } as never });
  const g1 = await payload.findGlobal({ slug: "chu-chung", overrideAccess: true }) as unknown as { chu: Record<string, string>; mac_dinh: unknown };
  assert.deepEqual(g1.chu, { "loi.thu_lai": "Làm lại" }); assert.deepEqual(g1.mac_dinh, g0.mac_dinh);
  await nem(() => payload.updateGlobal({ slug: "chu-chung", user: chuBien, overrideAccess: false,
    data: { chu: { "loi.thu_lai": "Gọi 0912 345 678" } } as never }), /điện thoại/);
  await nem(() => payload.updateGlobal({ slug: "chu-chung", user: bienTap, overrideAccess: false, data: { chu: {} } as never }), /not allowed|Forbidden|quyền/i);
  await payload.updateGlobal({ slug: "chu-chung", overrideAccess: true, data: { chu: null } as never });

  // ND-6: link xem trước ký trên "trang:<đường dẫn>" (web kiểm cùng công thức)
  const cuBi = process.env.CMS_PREVIEW_SECRET; process.env.CMS_PREVIEW_SECRET = "bi-mat-thu";
  try {
    const link = linkXemTrang("/tu-vi");
    assert.match(String(link), /\/api\/cms\/xem-truoc\?duong=%2Ftu-vi&het=\d+&ma=/);
    const het = Number(new URL(link!).searchParams.get("het"));   // SEC-2: link mang hạn ~1 giờ
    assert.ok(het > Date.now() / 1000 && het <= Date.now() / 1000 + 3601);
    assert.ok(link!.endsWith(maXemTruoc("trang:/tu-vi", het)!));
    assert.equal(linkXemTrang("evil.vn"), null);
  } finally { if (cuBi === undefined) delete process.env.CMS_PREVIEW_SECRET; else process.env.CMS_PREVIEW_SECRET = cuBi; }
});

await ca("mẫu cụm: không tạo tay; biến lạ chỉ cảnh báo; cộng tác viên không đọc được hai collection", async () => {
  await nem(() => payload.create({ collection: "mau-cum", user: chuBien, overrideAccess: false, draft: true,
    data: { mau_duong: "/x/{slug}" } as never }), /đồng bộ/);
  const m = (await payload.find({ collection: "mau-cum", overrideAccess: true, where: { mau_duong: { equals: `${nd}/kien-thuc/{slug}` } } })).docs[0]!;
  const r = await payload.update({ collection: "mau-cum", id: m.id, user: chuBien, overrideAccess: false,
    data: { khoi_duoi: [{ blockType: "van_ban", noi_dung: "Đọc thêm về {tieu_de} và {la}" }], _status: "published" } as never }) as unknown as { ghi_chu_kiem_dinh: string };
  assert.match(r.ghi_chu_kiem_dinh, /\{la\}/);
  await nem(() => payload.find({ collection: "noi-dung-trang", user: ctv, overrideAccess: false }), /not allowed|Forbidden|quyền/i);
  await nem(() => payload.find({ collection: "mau-cum", user: ctv, overrideAccess: false }), /not allowed|Forbidden|quyền/i);
  const khach = await payload.find({ collection: "mau-cum", overrideAccess: false, where: { mau_duong: { like: nd } } });
  assert.equal(khach.docs.length, 1, "khách chỉ thấy bản đã xuất bản");
});

await ca("chân trang: chữ thương hiệu mặc định; miễn trừ không để trống; liên hệ gõ tay bị chặn; biên tập viên không sửa", async () => {
  const g = await payload.findGlobal({ slug: "dieu-huong" }) as unknown as { mien_tru: string; nhan_ung_ho: string };
  assert.match(g.mien_tru, /chủ biên Đức Luân chịu trách nhiệm/);
  await nem(() => payload.updateGlobal({ slug: "dieu-huong", user: chuBien, overrideAccess: false, data: { mien_tru: "  " } as never }), /Lời miễn trừ|required|bắt buộc|invalid/i);
  await nem(() => payload.updateGlobal({ slug: "dieu-huong", user: chuBien, overrideAccess: false,
    data: { thuong_hieu: { gioi_thieu: "Liên hệ 0912 345 678" } } as never }), /điện thoại/);
  await nem(() => payload.updateGlobal({ slug: "dieu-huong", user: bienTap, overrideAccess: false, data: { nhan_ung_ho: "x" } as never }), /not allowed|Forbidden|quyền/i);
  await payload.updateGlobal({ slug: "dieu-huong", user: chuBien, overrideAccess: false,
    data: { thuong_hieu: { gioi_thieu: "Giới thiệu mới", cam_ket: [{ chu: "Không bán dữ liệu", bieu_tuong: "khoa" }] }, nhan_ung_ho: "Ủng hộ" } as never });
  const d = await payload.findGlobal({ slug: "dieu-huong" }) as unknown as { thuong_hieu: { gioi_thieu: string; cam_ket: { chu: string }[] } };
  assert.equal(d.thuong_hieu.gioi_thieu, "Giới thiệu mới"); assert.equal(d.thuong_hieu.cam_ket.length, 1);
  await payload.updateGlobal({ slug: "dieu-huong", overrideAccess: true, data: { thuong_hieu: { gioi_thieu: null, cam_ket: [] }, nhan_ung_ho: null } as never });
});

await ca("QH-URL migration: chữ CMS của URL cũ đi theo URL silo (bản chính + phiên bản); trùng đích không đè; down trả lại", async () => {
  const { up, down } = await import("../src/migrations/20261019_060000_qh_url_doi_duong");
  const args = { db: payload.db.drizzle, payload, req: {} } as never;
  const moi = async (duong: string) => {
    const d = await payload.create({ collection: "noi-dung-trang", overrideAccess: true, context: { dongBo: true },
      data: { duong, nhom: "kien_thuc", ten: "QH thử", h1: `H1 ${duong}`, _status: "published" } as never }) as unknown as { id: number };
    tao.push({ collection: "noi-dung-trang", id: d.id });
    return d.id;
  };
  const a = await moi(`/kien-thuc/sao-cung/${dau}-a`);
  const b = await moi(`/phong-thuy/tuoi-${dau}`);
  const c = await moi(`/kien-thuc/sao-cung/${dau}-c`);
  const c2 = await moi(`/tu-vi/sao-o-cung/${dau}-c`);       // đích đã có (đồng bộ chạy trước) → c giữ nguyên
  const duong = async (id: number) => ((await payload.findByID({ collection: "noi-dung-trang", id, overrideAccess: true })) as unknown as { duong: string; h1: string });
  const phienBan = async (id: number) => (await payload.findVersions({ collection: "noi-dung-trang", overrideAccess: true,
    where: { parent: { equals: id } } })).docs.map((v) => (v.version as { duong: string }).duong);
  await up(args);
  assert.deepEqual(await duong(a), { ...(await duong(a)), duong: `/tu-vi/sao-o-cung/${dau}-a`, h1: `H1 /kien-thuc/sao-cung/${dau}-a` });
  assert.ok((await phienBan(a)).every((d) => d === `/tu-vi/sao-o-cung/${dau}-a`));
  assert.equal((await duong(b)).duong, `/phong-thuy/huong-hop-tuoi/tuoi-${dau}`);
  assert.equal((await duong(c)).duong, `/kien-thuc/sao-cung/${dau}-c`);
  assert.ok((await phienBan(c)).every((d) => d === `/kien-thuc/sao-cung/${dau}-c`));
  assert.equal((await duong(c2)).duong, `/tu-vi/sao-o-cung/${dau}-c`);
  await down(args);
  assert.equal((await duong(a)).duong, `/kien-thuc/sao-cung/${dau}-a`);
  assert.ok((await phienBan(a)).every((d) => d === `/kien-thuc/sao-cung/${dau}-a`));
  assert.equal((await duong(b)).duong, `/phong-thuy/tuoi-${dau}`);
  assert.equal((await duong(c2)).duong, `/tu-vi/sao-o-cung/${dau}-c`);      // c chiếm đích cũ → c2 ở lại
  await up(args);   // trả DB thử về trạng thái sau migration
});

await ca("BLOG-3 nhập bài NotFair: nháp cùng slug, ảnh vào Thư viện ảnh, giữ link đối tác; chỉ Chủ biên; không nhập trùng", async () => {
  // Giả API NotFair + máy chủ ảnh bằng cách thay fetch (không gọi mạng thật).
  const png = await sharp({ create: { width: 1600, height: 900, channels: 3, background: "#334" } }).png().toBuffer();
  const slug = `${dau}-xem-hop-doi-đúng-cách`;
  const bai = { id: 1, title: "Xem hợp đôi: đọc sao cho tỉnh táo", slug, meta_description: "Cách đọc hợp đôi.", tags: ["hop-doi"],
    image_url: "https://notfair.co/api/seo/image/bia.png", reading_time_minutes: 5, published_at: "2026-10-17T00:00:00Z", created_at: "2026-10-17T00:00:00Z",
    content_html: `<h1>Trong bài</h1><h2 id="a">Phần A</h2><p>Đọc <strong>tỉnh táo</strong>, xem <a href="https://doi-tac.vn/bai">đối tác</a>.</p>
      <figure><img src="https://notfair.co/api/seo/image/so-do.png" alt="Sơ đồ"><figcaption>Hình 1</figcaption></figure>
      <img src="https://la.example/x.png" alt="ảnh lạ"><ul><li>một</li><li>hai</li></ul>
      <p class="nf-attribution">Bài trao đổi qua NotFair.</p>` };
  const fetchGoc = globalThis.fetch;
  const cu = { url: process.env.NOTFAIR_SEO_API_URL, khoa: process.env.NOTFAIR_SEO_API_KEY };
  process.env.NOTFAIR_SEO_API_URL = "https://api.notfair.test/content";
  process.env.NOTFAIR_SEO_API_KEY = "nfbl_thu";
  globalThis.fetch = (async (dau_vao: string | URL | Request, init?: RequestInit) => {
    const u = String(dau_vao instanceof Request ? dau_vao.url : dau_vao);
    if (u.startsWith("https://api.notfair.test/content")) {
      assert.equal(new Headers(init?.headers).get("authorization"), "Bearer nfbl_thu");
      const q = new URL(u).searchParams.get("slug");
      return Response.json(q === null ? { posts: [bai] } : q === slug ? { post: bai } : {}, { status: q && q !== slug ? 404 : 200 });
    }
    if (u.startsWith("https://notfair.co/api/seo/image/")) return new Response(png, { headers: { "content-type": "image/png" } });
    if (u.startsWith("https://la.example/")) throw new Error("không được gọi miền lạ");
    return fetchGoc(dau_vao as never, init);
  }) as typeof fetch;
  try {
    const req = { payload, user: chuBien } as never;
    const kq = await nhapBaiNotFair(payload, req, slug);
    tao.push({ collection: "bai-viet", id: kq.id });
    assert.equal(kq.da_co, false);
    assert.deepEqual(kq.anh_loi, ["https://la.example/x.png"]);
    const d = await payload.findByID({ collection: "bai-viet", id: kq.id, overrideAccess: true, draft: true, depth: 1 }) as unknown as Record<string, unknown>;
    for (const m of [d.anh_bia as { id: number }]) tao.push({ collection: "media", id: m.id });
    assert.equal(d.slug, slug, "giữ nguyên slug NotFair (có dấu)");
    assert.equal(d._status, "draft");
    assert.equal(d.nguon_goc, "notfair");
    assert.deepEqual(d.notfair_lien_ket, ["https://doi-tac.vn/bai"]);
    assert.equal((d.anh_bia as { alt: string }).alt, bai.title);
    const html = String(d.noi_dung_html);
    assert.match(html, /<h2[^>]*>Trong bài<\/h2>/);
    assert.match(html, /<a href="https:\/\/doi-tac\.vn\/bai"[^>]*>đối tác<\/a>/);
    assert.match(html, /<figure><img [^>]*alt="Sơ đồ"[^>]*><figcaption>Hình 1<\/figcaption><\/figure>/);
    assert.match(html, /<ul[ >]/);
    assert.match(html, /Bài trao đổi qua NotFair\./);
    const up = ((d.noi_dung as { root: { children: { type: string; value: unknown }[] } }).root.children).filter((c) => c.type === "upload");
    assert.equal(up.length, 1);
    tao.push({ collection: "media", id: (up[0]!.value as { id: number }).id ?? up[0]!.value as number });
    // Gọi lại → trả bài đã có, không tạo trùng.
    const lai = await nhapBaiNotFair(payload, req, slug);
    assert.equal(lai.da_co, true);
    assert.equal(String(lai.id), String(kq.id));
    // Kiểm định: xoá link đối tác → mục "backlink_notfair" báo lỗi.
    const { kiemDinhBai } = await import("../src/kiem-dinh/kiem-dinh");
    const muc = kiemDinhBai({ ...d, noi_dung: goc(doan(chu("Hết link."))) } as never).muc.find((m) => m.ma === "backlink_notfair");
    assert.equal(muc?.muc_do, "loi");
    assert.equal(kiemDinhBai(d as never).muc.find((m) => m.ma === "backlink_notfair")?.muc_do, "dat");
  } finally {
    globalThis.fetch = fetchGoc;
    process.env.NOTFAIR_SEO_API_URL = cu.url; process.env.NOTFAIR_SEO_API_KEY = cu.khoa;
    if (cu.url === undefined) delete process.env.NOTFAIR_SEO_API_URL;
    if (cu.khoa === undefined) delete process.env.NOTFAIR_SEO_API_KEY;
  }
});

// dọn
for (const t of tao.reverse()) {
  await payload.delete({ collection: t.collection, id: t.id, overrideAccess: true }).catch(() => {});
}
console.log(`${dat} ca đạt${process.exitCode ? " — CÓ CA HỎNG" : ""}`);
process.exit(process.exitCode ?? 0);
