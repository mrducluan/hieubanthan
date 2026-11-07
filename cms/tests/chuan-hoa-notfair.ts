// BLOG-7 — tích hợp trên Postgres THẬT: chuẩn hoá SEO bài nguồn NotFair (đường dẫn không dấu + slug_cu, trường SEO,
// ảnh nền sáng thay bìa tối, ảnh tóm tắt, bản NHÁP — bản xuất bản giữ nguyên tới khi bấm Xuất bản; chạy lại không đổi thêm).
// Chạy: DATABASE_URI=postgres://…/cms_test npm run test:chuan-hoa   (script tự dọn dữ liệu nó tạo)
import assert from "node:assert/strict";
import { getPayload } from "payload";
import sharp from "sharp";
import config from "../src/payload.config";
import { htmlSangKhoi } from "../src/lib/html-lexical";
import { chuanHoaMotBai, dsBaiNotFairCms, NGUON_ANH_BLOG7 } from "../src/lib/chuan-hoa-notfair";
import { NGUON_ANH_NOTFAIR } from "../src/lib/notfair";

const payload = await getPayload({ config });
const dau = `bl7${Date.now().toString(36)}`;
const SLUG_CU = `${dau}-cach-tinh-va-đoc-ho-so-than-so-hoc`;
const HTML = `<p>Thần số học là cách đọc tính cách qua con số rút từ ngày sinh và họ tên. Bài này hướng dẫn cách tính từng bước, có ví dụ để bạn tự kiểm lại kết quả của chính mình.</p>
<h2>Thần số học là gì?</h2><p>Thần số học là hệ thống gán ý nghĩa cho các con số từ 1 đến 9 và các số bậc thầy, giúp mỗi người tự soi bản thân.</p>
<h2>Cách tính số Đường đời ra sao?</h2><p>Cộng mọi chữ số của ngày, tháng, năm sinh rồi rút gọn về một chữ số, giữ lại 11, 22, 33 nếu gặp.</p>
<h2>Số bậc thầy có gì khác?</h2><p>Số bậc thầy thường được mô tả là mang hai mặt: tiềm năng lớn đi kèm áp lực lớn, nên cần nhịp sống cân bằng.</p>
<p>Nguồn tham khảo: <a href="https://doi-tac.example/bai">đối tác hòa bình</a>.</p>`;
const xoa: { collection: "bai-viet" | "media"; id: number | string }[] = [];

try {
  const toi = await sharp({ create: { width: 320, height: 180, channels: 3, background: "#0d0f2a" } }).png().toBuffer();
  const bia = await payload.create({ collection: "media", overrideAccess: true,
    file: { data: toi, mimetype: "image/png", name: `${dau}-toi.png`, size: toi.length }, data: { alt: "ảnh bìa tối" } });
  xoa.push({ collection: "media", id: bia.id });
  const bai = await payload.create({
    collection: "bai-viet", overrideAccess: true, draft: false, context: { giuSlugGoc: true, boQuaKiemDinh: true, boQuaLamMoi: true },
    data: {
      _status: "published", tieu_de: "Xem thần số học (Numerology): cách tính và đọc hồ sơ cho người mới bắt đầu",
      slug: SLUG_CU, generateSlug: false, anh_bia: bia.id, mang: "chung",
      noi_dung: { root: { type: "root", direction: "ltr", format: "", indent: 0, version: 1, children: htmlSangKhoi(HTML) } },
      the: ["thần số học", "numerology"], nguon_goc: "notfair", notfair_lien_ket: ["https://doi-tac.example/bai"],
      publishedAt: "2026-09-01T00:00:00.000Z",
    } as never,
  });
  xoa.push({ collection: "bai-viet", id: bai.id });

  // Danh sách cho khung CMS (không phụ thuộc NotFair) có bài này.
  assert.ok((await dsBaiNotFairCms(payload)).some((b) => b.id === bai.id), "khung Chuẩn hoá thấy bài nguồn NotFair");

  // AUDIT: báo sẽ sửa gì + điểm dự kiến, KHÔNG ghi gì, không tạo ảnh.
  const soAnh = (await payload.count({ collection: "media", overrideAccess: true })).totalDocs;
  const au = await chuanHoaMotBai(payload, undefined, bai.id, { ghi: false });
  assert.equal(au.da_ghi, false);
  assert.ok(au.thay_doi.some((t) => /Sẽ thay ảnh bìa tối/.test(t)), au.thay_doi.join(" | "));
  assert.ok(au.thay_doi.some((t) => /Sẽ vẽ \+ chèn ảnh "Tóm tắt nhanh"/.test(t)));
  assert.ok(au.diem_sau > au.diem_truoc + 15, `${au.diem_truoc} → ${au.diem_sau}`);
  assert.ok(au.con_lai.length > 0, "liệt kê việc máy không tự làm");
  const sauAudit = await payload.findByID({ collection: "bai-viet", id: bai.id, draft: true, depth: 0, overrideAccess: true }) as any;
  assert.equal(sauAudit.slug, SLUG_CU, "audit không đổi bài");
  assert.equal((await payload.count({ collection: "media", overrideAccess: true })).totalDocs, soAnh, "audit không tạo ảnh");

  const kq = await chuanHoaMotBai(payload, undefined, bai.id);
  assert.equal(kq.da_ghi, true);
  assert.equal(kq.diem_sau, au.diem_sau, "điểm sau chuẩn hoá đúng như audit dự kiến");
  console.log(`  điểm kiểm định ${kq.diem_truoc} → ${kq.diem_sau}\n${kq.thay_doi.map((t) => `    • ${t}`).join("\n")}`);
  assert.ok(kq.diem_sau > kq.diem_truoc + 15);

  const nhap = await payload.findByID({ collection: "bai-viet", id: bai.id, draft: true, depth: 1, overrideAccess: true }) as any;
  assert.equal(nhap.slug, `${dau}-cach-tinh-va-doc-ho-so-than-so-hoc`);
  assert.ok(nhap.slug_cu.includes(SLUG_CU), "đường dẫn cũ vào slug_cu");
  assert.equal(nhap.trang_thai_duyet, "cho_duyet");
  assert.match(nhap.ghi_chu_duyet, /BLOG-7/);
  assert.equal(nhap.anh_bia.nguon_anh, NGUON_ANH_BLOG7, "bìa tối được thay bằng bìa nền sáng");
  assert.equal(nhap.meta.image.id ?? nhap.meta.image, nhap.anh_bia.id);
  assert.ok(nhap.hoi_dap.length >= 3 && nhap.tra_loi_nhanh && nhap.meta.description && nhap.tu_khoa_chinh);
  xoa.push({ collection: "media", id: nhap.anh_bia.id });
  const tomTat = (nhap.noi_dung.root.children as any[]).find((n) => n.type === "upload");
  assert.ok(tomTat, "có ảnh tóm tắt trong thân bài");
  xoa.push({ collection: "media", id: tomTat.value.id ?? tomTat.value });

  const congKhai = await payload.findByID({ collection: "bai-viet", id: bai.id, depth: 0, overrideAccess: true }) as any;
  const banXuatBan = await payload.find({ collection: "bai-viet", where: { slug: { equals: SLUG_CU } }, depth: 0, overrideAccess: true });
  assert.ok(banXuatBan.docs.length === 1 || congKhai._status === "draft", "bản xuất bản cũ còn nguyên ở đường dẫn cũ tới khi bấm Xuất bản");

  const lai = await chuanHoaMotBai(payload, undefined, bai.id);
  assert.deepEqual(lai.thay_doi, [], "chạy lại không đổi thêm");
  // Chủ biên bấm Xuất bản → đường dẫn mới lên web, đường dẫn cũ tra được qua slug_cu (web chuyển 308).
  await payload.update({ collection: "bai-viet", id: bai.id, overrideAccess: true, data: { _status: "published" } as never,
    context: { boQuaLamMoi: true } });
  const cu = await payload.find({ collection: "bai-viet", where: { slug_cu: { in: [SLUG_CU] } }, depth: 0, overrideAccess: false });
  assert.equal((cu.docs[0] as any)?.slug, `${dau}-cach-tinh-va-doc-ho-so-than-so-hoc`, "khách tra slug cũ ra slug mới");
  console.log("  ✓ chuẩn hoá bài NotFair (nháp, slug_cu, ảnh sáng, idempotent, xuất bản → 308)");

  // BLOG-9: bìa NotFair SÁNG (không tối) vẫn bị thay — chữ in sẵn trong ảnh NotFair hay sai dấu.
  const sang = await sharp({ create: { width: 320, height: 180, channels: 3, background: "#f6f1e4" } }).png().toBuffer();
  const biaNf = await payload.create({ collection: "media", overrideAccess: true,
    file: { data: sang, mimetype: "image/png", name: `${dau}-nf.png`, size: sang.length },
    data: { alt: "bìa notfair", nguon_anh: NGUON_ANH_NOTFAIR } as never });
  xoa.push({ collection: "media", id: biaNf.id });
  const bai2 = await payload.create({
    collection: "bai-viet", overrideAccess: true, draft: false, context: { giuSlugGoc: true, boQuaKiemDinh: true, boQuaLamMoi: true },
    data: {
      _status: "published", tieu_de: "Xem tài lộc qua thần số học: đọc gợi ý thành việc làm", slug: `${dau}-tai-loc`,
      generateSlug: false, anh_bia: biaNf.id, mang: "chung",
      noi_dung: { root: { type: "root", direction: "ltr", format: "", indent: 0, version: 1, children: htmlSangKhoi(HTML) } },
      the: ["thần số học"], nguon_goc: "notfair", publishedAt: "2026-09-01T00:00:00.000Z",
    } as never,
  });
  xoa.push({ collection: "bai-viet", id: bai2.id });
  const au2 = await chuanHoaMotBai(payload, undefined, bai2.id, { ghi: false });
  assert.ok(au2.thay_doi.some((t) => /Sẽ thay ảnh bìa NotFair/.test(t)), au2.thay_doi.join(" | "));
  await chuanHoaMotBai(payload, undefined, bai2.id);
  const nhap2 = await payload.findByID({ collection: "bai-viet", id: bai2.id, draft: true, depth: 1, overrideAccess: true }) as any;
  assert.equal(nhap2.anh_bia.nguon_anh, NGUON_ANH_BLOG7, "bìa NotFair được vẽ lại");
  xoa.push({ collection: "media", id: nhap2.anh_bia.id });
  for (const n of nhap2.noi_dung.root.children as any[]) if (n.type === "upload") xoa.push({ collection: "media", id: n.value.id ?? n.value });
  assert.equal((await chuanHoaMotBai(payload, undefined, bai2.id, { ghi: false })).thay_doi.filter((t) => /ảnh bìa/.test(t)).length, 0,
    "bìa đã vẽ lại thì không thay nữa");
  console.log("  ✓ BLOG-9: bìa NotFair (chữ in trong ảnh) được vẽ lại, chạy lại không thay nữa");

  // BLOG-9c: ảnh THÂN BÀI tải từ NotFair (chữ in sẵn) bị bỏ khỏi thân bài; ảnh vẫn còn trong Thư viện; chạy lại không đổi.
  const anhNf = await payload.create({ collection: "media", overrideAccess: true,
    file: { data: sang, mimetype: "image/png", name: `${dau}-than-nf.png`, size: sang.length },
    data: { alt: "sơ đồ key concepts", nguon_anh: NGUON_ANH_NOTFAIR } as never });
  xoa.push({ collection: "media", id: anhNf.id });
  const khoi = htmlSangKhoi(HTML);
  khoi.splice(2, 0, { type: "upload", version: 3, relationTo: "media", value: anhNf.id, fields: null, format: "" } as never);
  const bai3 = await payload.create({
    collection: "bai-viet", overrideAccess: true, draft: false, context: { giuSlugGoc: true, boQuaKiemDinh: true, boQuaLamMoi: true },
    data: {
      _status: "published", tieu_de: "Xem thần số học năm cá nhân: đọc nhịp chín năm cho người mới", slug: `${dau}-than-anh`,
      generateSlug: false, mang: "chung", noi_dung: { root: { type: "root", direction: "ltr", format: "", indent: 0, version: 1, children: khoi } },
      the: ["thần số học"], nguon_goc: "notfair", publishedAt: "2026-09-01T00:00:00.000Z",
    } as never,
  });
  xoa.push({ collection: "bai-viet", id: bai3.id });
  const au3 = await chuanHoaMotBai(payload, undefined, bai3.id, { ghi: false });
  assert.ok(au3.thay_doi.some((t) => /Sẽ bỏ 1 ảnh NotFair/.test(t)), au3.thay_doi.join(" | "));
  await chuanHoaMotBai(payload, undefined, bai3.id);
  const nhap3 = await payload.findByID({ collection: "bai-viet", id: bai3.id, draft: true, depth: 0, overrideAccess: true }) as any;
  const ids3 = (nhap3.noi_dung.root.children as any[]).filter((n) => n.type === "upload").map((n) => String(n.value?.id ?? n.value));
  assert.ok(!ids3.includes(String(anhNf.id)), "ảnh NotFair đã ra khỏi thân bài");
  assert.ok(ids3.length >= 2, `bù ảnh CMS vẽ: ${ids3.length}`);
  ids3.forEach((i) => xoa.push({ collection: "media", id: i }));
  if (nhap3.anh_bia) xoa.push({ collection: "media", id: nhap3.anh_bia });
  assert.ok(await payload.findByID({ collection: "media", id: anhNf.id, overrideAccess: true }), "ảnh vẫn trong Thư viện");
  assert.ok(!(await chuanHoaMotBai(payload, undefined, bai3.id, { ghi: false })).thay_doi.some((t) => /ảnh NotFair/.test(t)), "chạy lại không bỏ thêm");
  console.log("  ✓ BLOG-9c: ảnh thân bài NotFair bị bỏ, ảnh CMS vẽ bù vào, chạy lại không đổi");

  // BLOG-9d: chưa có nguồn NotFair → tự nhập không làm gì, không lỗi.
  const { tuDongNotFair } = await import("../src/lib/tu-dong-notfair");
  const td = await tuDongNotFair(payload, undefined as never);
  assert.equal(td.co_nguon, false);
  console.log("  ✓ BLOG-9d: tự nhập bỏ qua khi chưa có nguồn NotFair");
} finally {
  for (const x of xoa.reverse()) await payload.delete({ collection: x.collection, id: x.id, overrideAccess: true }).catch(() => {});
}
process.exit(process.exitCode ?? 0);
