// BLOG-7 — tích hợp trên Postgres THẬT: chuẩn hoá SEO bài nguồn NotFair (đường dẫn không dấu + slug_cu, trường SEO,
// ảnh nền sáng thay bìa tối, ảnh tóm tắt, bản NHÁP — bản xuất bản giữ nguyên tới khi bấm Xuất bản; chạy lại không đổi thêm).
// Chạy: DATABASE_URI=postgres://…/cms_test npm run test:chuan-hoa   (script tự dọn dữ liệu nó tạo)
import assert from "node:assert/strict";
import { getPayload } from "payload";
import sharp from "sharp";
import config from "../src/payload.config";
import { htmlSangKhoi } from "../src/lib/html-lexical";
import { chuanHoaMotBai, NGUON_ANH_BLOG7 } from "../src/lib/chuan-hoa-notfair";

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

  const kq = await chuanHoaMotBai(payload, undefined, bai.id);
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
} finally {
  for (const x of xoa.reverse()) await payload.delete({ collection: x.collection, id: x.id, overrideAccess: true }).catch(() => {});
}
process.exit(process.exitCode ?? 0);
