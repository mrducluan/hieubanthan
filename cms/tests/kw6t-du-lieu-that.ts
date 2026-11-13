// KW-6T — thử trên Postgres THẬT với bản sao bài đang xuất bản: nạp bài từ tệp JSON (REST công khai của CMS,
// ?depth=1), chạy apDungKw6t, kiểm kết quả, rồi hoàn tác. KHÔNG chạy trong CI (cần tệp dữ liệu ngoài repo).
// Chạy: DATABASE_URI=… KW6T_JSON=/đường/dẫn/bai.json npx payload run tests/kw6t-du-lieu-that.ts
// (KW6T_MOI=1: bỏ bước giả lập "lần chạy đầu đã cho 3 bài phụ thôi xuất bản" — thử đường chạy từ đầu)
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { getPayload } from "payload";
import sharp from "sharp";
import config from "../src/payload.config";
import { apDungKw6t, hoanTacKw6t, KE_HOACH, chuCua } from "../src/lib/kw6t-bai-cu";

const payload = await getPayload({ config });
const d = JSON.parse(readFileSync(process.env.KW6T_JSON!, "utf8")) as { docs: any[] };
// Dọn bài + ảnh có sẵn (DB thử): bài khởi tạo BLOG-6 trùng slug bài thật.
await payload.delete({ collection: "bai-viet", where: { id: { exists: true } }, overrideAccess: true });
const png = await sharp({ create: { width: 160, height: 90, channels: 3, background: "#f4efe4" } }).png().toBuffer();
const anh = new Map<number, number | string>();
const taoAnh = async (m: any) => {
  if (!m || typeof m !== "object") return null;
  if (!anh.has(m.id)) {
    const r = await payload.create({ collection: "media", overrideAccess: true,
      file: { data: png, mimetype: "image/png", name: `kw6t-${m.id}.png`, size: png.length }, data: { alt: m.alt ?? "ảnh", nguon_anh: m.nguon_anh ?? null } as never });
    anh.set(m.id, r.id);
  }
  return anh.get(m.id)!;
};
const doiAnh = async (n: any) => {
  if (n.type === "upload") n.value = await taoAnh(n.value);
  for (const c of n.children ?? []) await doiAnh(c);
};
const idCu = new Map<string, number | string>();
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
  idCu.set(b.slug, r.id);
}
console.log(`nạp ${d.docs.length} bài, ${anh.size} ảnh`);

// Như CMS thật: (1) mở bài trong trình soạn thảo → bản nháp tự lưu, CÙNG nội dung nhưng JSON Lexical khác cách ghi;
// (2) một bài Chủ biên đang sửa dở thật → phải giữ nguyên; (3) lần chạy đầu (bản cũ) đã cho 3 bài phụ thôi xuất bản.
const thatSua = "self-discovery-tu-hieu-minh-qua-gia-tri-thoi-quen-va-lua-chon";
const themDinhDang = (n: any): any => ({ ...n, ...(n.type === "paragraph" ? { textFormat: 0, textStyle: "" } : {}),
  ...(n.children ? { children: n.children.map(themDinhDang) } : {}) });
for (const b of d.docs) {
  const id = idCu.get(b.slug)!;
  const hien = await payload.findByID({ collection: "bai-viet", id, depth: 0, overrideAccess: true }) as any;
  await payload.update({ collection: "bai-viet", id, overrideAccess: true, draft: true, autosave: true,
    context: { giuSlugGoc: true, boQuaLamMoi: true },
    data: b.slug === thatSua ? { tieu_de: hien.tieu_de + " (đang sửa)" } : { noi_dung: { root: themDinhDang(hien.noi_dung.root) } } } as never);
}
for (const ke of KE_HOACH.filter((k) => k.gopVao && !process.env.KW6T_MOI)) {
  await payload.update({ collection: "bai-viet", id: idCu.get(ke.slug)!, overrideAccess: true, context: { giuSlugGoc: true, boQuaLamMoi: true },
    data: { _status: "draft", ghi_chu_duyet: "KW-6T 2026-11-11: lần chạy đầu" } as never });
}

const kq = await apDungKw6t(payload);
for (const r of kq) console.log(`  ${r.ok ? "✓" : "✗"} ${r.slug.slice(0, 60)} — ${r.viec}${r.ly_do ? ` (${r.ly_do})` : ""}`);
assert.deepEqual(kq.filter((r) => !r.ok).map((r) => [r.slug, r.ly_do]), [[thatSua, "có bản nháp đang sửa — không đè"]],
  "chỉ bài đang sửa thật bị giữ lại");

const lay = async (slug: string) => (await payload.find({ collection: "bai-viet", where: { slug: { equals: slug } }, depth: 1, overrideAccess: true })).docs[0] as any;
for (const ke of KE_HOACH) {
  if (ke.gopVao) {
    const phu = await lay(ke.slug), chinh = await lay(ke.gopVao);
    assert.equal(phu._status, "draft", `${ke.slug} thôi xuất bản`);
    assert.ok(chinh.slug_cu.includes(ke.slug), `${ke.gopVao} nhận slug_cu ${ke.slug}`);
    continue;
  }
  if (ke.slug === thatSua) continue;
  const b = await lay(ke.slugMoi ?? ke.slug);
  assert.ok(b, `thấy bài ${ke.slugMoi ?? ke.slug}`);
  assert.equal(b._status, "published");
  assert.ok(String(b.ghi_chu_duyet).includes("KW-6T"));
  const json = JSON.stringify(b.noi_dung);
  assert.ok(!/"url":"https:\/\/hieuban\.com\/?"/.test(json), `${b.slug}: còn link về trang chủ`);
  if (ke.themCuoi) assert.ok(/Đọc tiếp|Bài này|Lời đọc|Chiêm tinh|Muốn/.test(chuCua(b.noi_dung.root)), `${b.slug}: có đoạn đọc tiếp`);
  if (ke.slugMoi) {
    assert.ok(b.slug_cu.includes(ke.slug), `${b.slug}: slug cũ vào slug_cu`);
    assert.equal(b.tieu_de, ke.dat!.tieu_de);
    assert.notEqual(b.anh_bia.id, anh.get(d.docs.find((x) => x.slug === ke.slug).anh_bia.id), `${b.slug}: ảnh bìa mới`);
    assert.ok(b.anh_bia.alt === b.tieu_de, "alt ảnh bìa = tiêu đề mới");
    const alt = (b.noi_dung.root.children as any[]).filter((n) => n.type === "upload").map((n) => n.value.alt);
    assert.ok(alt.every((a: string) => !/[Bb]ói (Tình|Đồng|Người)|Kinh Dịnh/.test(a)), `${b.slug}: ảnh minh hoạ còn tiêu đề cũ: ${alt}`);
  }
  if (ke.lienQuan?.length) assert.ok((b.bai_lien_quan ?? []).length >= Math.min(2, ke.lienQuan.length), `${b.slug}: bài liên quan`);
  console.log(`  ${b.slug.slice(0, 55).padEnd(55)} điểm ${b.diem_kiem_dinh}`);
}
// Chạy lại: không sửa thêm.
const lan2 = await apDungKw6t(payload);
assert.ok(lan2.every((r) => r.slug === thatSua || (r.ok && /từ trước/.test(r.ly_do ?? ""))), "chạy lại không đổi thêm: " + JSON.stringify(lan2.filter((r) => !/từ trước/.test(r.ly_do ?? ""))));

const so = await hoanTacKw6t(payload);
console.log(`hoàn tác ${so} bài`);
for (const b of d.docs) {
  if (b.slug === thatSua) continue;
  const x = (await payload.findByID({ collection: "bai-viet", id: idCu.get(b.slug)!, depth: 0, overrideAccess: true })) as any;
  assert.equal(x.slug, b.slug, `hoàn tác slug ${b.slug}`);
  assert.equal(x.tieu_de, b.tieu_de);
  assert.equal(x._status, "published", `hoàn tác trạng thái ${b.slug}`);
}
console.log("KW-6T dữ liệu thật: đạt");
process.exit(0);
