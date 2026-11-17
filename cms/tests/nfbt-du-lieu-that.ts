// NF-BT — thử trên Postgres THẬT với bản sao bài đang xuất bản (REST công khai của CMS, ?depth=1): nạp bài, giả lập bản
// nháp KHÁC nội dung do máy để lại (như production: lần 2 KW-6T bị chặn ở cả 21 bài), chạy đúng `up` của migration
// 20261117_090000_nf_bt_bien_tap, kiểm kết quả, chạy lại (không đổi thêm), rồi `down`. KHÔNG chạy trong CI.
// Chạy: DATABASE_URI=… NFBT_JSON=/đường/dẫn/bai.json npx payload run tests/nfbt-du-lieu-that.ts
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { getPayload } from "payload";
import sharp from "sharp";
import config from "../src/payload.config";
import { up, down } from "../src/migrations/20261117_090000_nf_bt_bien_tap";
import { BIEN_TAP, DAU_NFBT } from "../src/lib/notfair-bien-tap";
import { chuCua, KE_HOACH } from "../src/lib/kw6t-bai-cu";

const payload = await getPayload({ config });
const d = JSON.parse(readFileSync(process.env.NFBT_JSON!, "utf8")) as { docs: any[] };
await payload.delete({ collection: "bai-viet", where: { id: { exists: true } }, overrideAccess: true });
const png = await sharp({ create: { width: 160, height: 90, channels: 3, background: "#f4efe4" } }).png().toBuffer();
const anh = new Map<number, number | string>();
const taoAnh = async (m: any) => {
  if (!m || typeof m !== "object") return null;
  if (!anh.has(m.id)) {
    const r = await payload.create({ collection: "media", overrideAccess: true,
      file: { data: png, mimetype: "image/png", name: `nf-${m.id}.png`, size: png.length }, data: { alt: m.alt ?? "ảnh", nguon_anh: m.nguon_anh ?? null } as never });
    anh.set(m.id, r.id);
  }
  return anh.get(m.id)!;
};
const doiAnh = async (n: any) => {
  if (n.type === "upload") n.value = await taoAnh(n.value);
  for (const c of n.children ?? []) await doiAnh(c);
};
const id = new Map<string, number | string>();
for (const b of d.docs) {
  await doiAnh(b.noi_dung.root);
  const bia = await taoAnh(b.anh_bia);
  const r = await payload.create({ collection: "bai-viet", overrideAccess: true, draft: false,
    context: { giuSlugGoc: true, boQuaKiemDinh: true, boQuaLamMoi: true },
    data: { _status: "published", tieu_de: b.tieu_de, slug: b.slug, generateSlug: false, slug_cu: b.slug_cu, anh_bia: bia,
      mo_ta_ngan: b.mo_ta_ngan, tra_loi_nhanh: b.tra_loi_nhanh, noi_dung: b.noi_dung, hoi_dap: b.hoi_dap?.map(({ cau_hoi, tra_loi }: any) => ({ cau_hoi, tra_loi })),
      nguon: b.nguon?.map(({ ten, url }: any) => ({ ten, url })), tu_khoa_chinh: b.tu_khoa_chinh, tu_khoa_phu: b.tu_khoa_phu,
      meta: { title: b.meta?.title, description: b.meta?.description, image: bia }, mang: b.mang, loai_bai: b.loai_bai,
      the: b.the, ky_ten: "ban_bien_tap", publishedAt: b.publishedAt } as never });
  id.set(b.slug, r.id);
  // Bản nháp máy để lại, KHÁC nội dung (thêm một đoạn) — đúng thứ đã chặn KW-6T lần 2 trên production.
  await payload.update({ collection: "bai-viet", id: r.id, overrideAccess: true, draft: true, context: { giuSlugGoc: true, boQuaLamMoi: true },
    data: { mo_ta_ngan: `${b.mo_ta_ngan} (nháp máy)` } as never });
}
console.log(`nạp ${d.docs.length} bài, ${anh.size} ảnh, mỗi bài một bản nháp khác nội dung`);

await up({ payload, req: undefined as never } as never);

const lay = async (slug: string) => (await payload.find({ collection: "bai-viet", where: { slug: { equals: slug } }, depth: 2, overrideAccess: true })).docs[0] as any;
for (const bt of BIEN_TAP) {
  const b = await lay(bt.slug);
  assert.ok(b, `thấy bài ${bt.slug} (KW-6T đổi slug phải chạy trước)`);
  assert.equal(b._status, "published", bt.slug);
  assert.ok(String(b.ghi_chu_duyet).includes(DAU_NFBT), `${bt.slug}: ghi chú NF-BT`);
  if (KE_HOACH.some((k) => k.slug === bt.slug || k.slugMoi === bt.slug)) assert.ok(String(b.ghi_chu_duyet).includes("KW-6T"), `${bt.slug}: ghi chú KW-6T`);
  assert.equal(b.anh_bia?.alt, bt.bia.alt, `${bt.slug}: ảnh bìa mới`);
  assert.equal(b.meta?.image?.id ?? b.meta?.image, b.anh_bia.id, `${bt.slug}: ảnh chia sẻ = bìa mới`);
  const t = chuCua(b.noi_dung.root);
  assert.ok(!/lăng kính/.test(t), `${bt.slug}: còn "lăng kính"`);
  assert.ok(!/\[\[ANH:/.test(t), `${bt.slug}: còn chỗ giữ ảnh`);
  assert.ok(!/"url":"https:\/\/hieuban\.com\/?"/.test(JSON.stringify(b.noi_dung)), `${bt.slug}: còn link về trang chủ`);
  const up_ = (b.noi_dung.root.children as any[]).filter((n) => n.type === "upload").map((n) => n.value);
  for (const c of bt.chen ?? []) if (c.anh) assert.ok(up_.some((m: any) => m.alt === c.anh!.alt), `${bt.slug}: thiếu ảnh ${c.anh.ten_tep}`);
  assert.ok(up_.every((m: any) => !/^(Tóm tắt nhanh|Lộ trình bài viết|Câu hỏi thường gặp):/.test(m.alt)), `${bt.slug}: alt cũ chưa đổi: ${up_.map((m: any) => m.alt)}`);
  assert.ok((b.hoi_dap ?? []).length >= 3, `${bt.slug}: hỏi đáp ${b.hoi_dap?.length}`);
  console.log(`  ✓ ${bt.slug.slice(0, 58).padEnd(58)} điểm ${b.diem_kiem_dinh} · ${up_.length} ảnh · ${b.hoi_dap.length} hỏi đáp`);
}
// Gộp: bài phụ còn trong dữ liệu (nếu có) đã thôi xuất bản; bài chính nhận slug.
const tv = await lay("tu-vi-la-gi-cau-truc-la-so-cach-doc-va-gioi-han");
assert.ok(tv.slug_cu.includes("tu-vi-ly-so-la-gi-cach-hieu-la-so-va-kiem-tra-du-lieu-sinh") || !d.docs.some((x) => x.slug.startsWith("tu-vi-ly-so")));

// Chạy lại: không đổi thêm (không tạo ảnh mới).
const soAnh = (await payload.count({ collection: "media", overrideAccess: true })).totalDocs;
await up({ payload, req: undefined as never } as never);
assert.equal((await payload.count({ collection: "media", overrideAccess: true })).totalDocs, soAnh, "chạy lại tạo thêm ảnh");

await down({ payload } as never);
for (const bt of BIEN_TAP) {
  const b = await lay(bt.slug);
  assert.ok(!String(b.ghi_chu_duyet ?? "").includes(DAU_NFBT), `down: ${bt.slug} còn NF-BT`);
  assert.equal(b._status, "published");
}
console.log("NF-BT dữ liệu thật: đạt");
process.exit(0);
