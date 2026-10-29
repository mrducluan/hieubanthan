// ND-0 — lớp phủ nội dung theo URL: gộp URL > mẫu cụm > mặc định code, thay biến (chữ thuần), sổ trang đủ mọi URL
// tĩnh của sitemap, chữ mặc định trong sổ trùng chữ đang hiện trên trang công cụ, route sổ trang + webhook đòi bí mật.
import { readFileSync } from "node:fs";
import path from "node:path";
import { test, expect } from "@playwright/test";
import { apDungSeo, gopNoiDung, layNoiDungTrang, mdKhoi, metaMacDinh, ngayHienThi, thayBien, duongHopLe, type KhoiCms } from "../lib/noi-dung-trang";
import { gopMucCms } from "../components/cms/DauTrangCms";
import { khopMauCum, MAU_CUM, mucSoTrang, SO_TRANG } from "../lib/so-trang";
import { CHU_DE } from "../lib/kien-thuc";

test("thay biến: chữ thuần (nơi hiển thị tự thoát — không thoát hai lần), biến lạ giữ nguyên chữ", () => {
  expect(thayBien("Xem {tieu_de} và {la}", { tieu_de: `"Tử vi" & 'Mệnh'` })).toBe(`Xem "Tử vi" & 'Mệnh' và {la}`);
  expect(thayBien("{constructor}", {})).toBe("{constructor}");
});

test("gộp: CMS trống → đúng mặc định code; ô có nội dung thắng; link ngoài bị bỏ", () => {
  const md = mucSoTrang("/tu-vi")!;
  const rong = gopNoiDung("/tu-vi", { ...md.mac_dinh, nhom: md.nhom, ten: md.ten }, null, null);
  expect(rong.seo.tieuDe).toBe(md.mac_dinh.tieu_de_seo);
  expect(rong.gioiThieu.doan).toEqual(md.mac_dinh.doan);
  expect(rong.gioiThieu.hoiDap).toEqual(md.mac_dinh.hoi_dap);
  expect(rong.dau.kieuChu).toEqual({ co: "thuong", can: "trai", nen: "khong" });
  expect(rong.khoi).toEqual({ tren: [], duoi: [], cuoi: [] });
  const co = gopNoiDung("/tu-vi", md.mac_dinh, {
    tieu_de_seo: "  ", mo_ta_seo: "Mô tả mới", h1: "Lá số Tử vi", kieu_chu: { co: "lon", can: "giua", nen: "x" as never },
    doan: [{ chu: "Đoạn CMS" }], hoi_dap: [{ cau_hoi: "Hỏi?", tra_loi: "" }],
    lien_ket: [{ nhan: "Ngoài", loai: "duong_dan", duong_dan: "//evil.vn" }, { nhan: "Sao", loai: "duong_dan", duong_dan: "/tu-vi/chinh-tinh" }],
  }, null);
  expect(co.seo.tieuDe).toBe(md.mac_dinh.tieu_de_seo);          // ô chỉ có khoảng trắng = trống
  expect(co.seo.moTa).toBe("Mô tả mới");
  expect(co.dau).toMatchObject({ h1: "Lá số Tử vi", kieuChu: { co: "lon", can: "giua", nen: "khong" } });
  expect(co.gioiThieu.doan).toEqual(["Đoạn CMS"]);
  expect(co.gioiThieu.hoiDap).toEqual(md.mac_dinh.hoi_dap);     // câu thiếu trả lời bị bỏ → về mặc định
  expect(co.gioiThieu.lienKet).toEqual([{ href: "/tu-vi/chinh-tinh", ten: "Sao" }]);
});

test("gộp khối: mẫu cụm áp cho trang KB; ghi đè 'thay' / 'thêm sau' / 'ẩn mẫu'; khung ngày; biến", () => {
  const k = (id: string, x: Record<string, unknown> = {}): KhoiCms => ({ blockType: "van_ban", id, noi_dung: `Về {tieu_de} ${id}`, ...x });
  const mau = { khoi_tren: [k("m1")], khoi_duoi: [k("m2")], khoi_cuoi: [k("m3"), k("cu", { blockType: "banner", den_ngay: "2020-01-01T00:00:00Z" })] };
  const bien = { tieu_de: "Tử Vi <Mệnh>" };
  const chiMau = gopNoiDung("/tu-vi/sao-o-cung/tu-vi-cung-menh", {}, null, mau, bien);
  expect(chiMau.khoi.tren.map((x) => x.noi_dung)).toEqual(["Về Tử Vi <Mệnh> m1"]);
  expect(chiMau.khoi.cuoi.map((x) => x.id)).toEqual(["m3"]);   // banner hết hạn bị bỏ
  const ghiDe = gopNoiDung("/tu-vi/sao-o-cung/tu-vi-cung-menh", {}, {
    khoi_tren: [k("r1")], khoi_duoi: [k("r2")], khoi_cuoi: [],
    che_do_mau: { tren: "thay", duoi: "them_sau", cuoi: "an_mau" },
  }, mau, bien);
  expect(ghiDe.khoi.tren.map((x) => x.id)).toEqual(["r1"]);
  expect(ghiDe.khoi.duoi.map((x) => x.id)).toEqual(["m2", "r2"]);
  expect(ghiDe.khoi.cuoi).toEqual([]);
  expect(ghiDe.nguon).toEqual({ trang: true, mau: true });
});

test("layNoiDungTrang: chưa nối CMS → không bao giờ null, trả mặc định; đường dẫn lạ vẫn trả khung rỗng", async () => {
  const cu = process.env.CMS_URL; delete process.env.CMS_URL;
  try {
    const nd = await layNoiDungTrang("/dieu-khoan");
    expect(nd.nhom).toBe("phap_ly");
    expect(nd.ngayHieuLuc).toBe(mucSoTrang("/dieu-khoan")!.mac_dinh.ngay_hieu_luc);
    expect(nd.muc.map((m) => m.id)).toContain("sao");
    const kb = await layNoiDungTrang("/tu-vi/sao-o-cung/tu-vi-cung-menh");
    expect(kb.nhom).toBe("kien_thuc");
    expect((await layNoiDungTrang("//evil.vn")).khoi).toEqual({ tren: [], duoi: [], cuoi: [] });
  } finally { if (cu !== undefined) process.env.CMS_URL = cu; }
  expect(duongHopLe("/tu-vi")).toBe("/tu-vi");
  for (const x of ["//evil.vn", "/\\evil", "https://x.vn", 5, "/a b"]) expect(duongHopLe(x)).toBeNull();
});

test("sổ trang: không sót URL tĩnh của sitemap + mọi chủ đề; không trùng; mẫu cụm khớp đúng trang KB", () => {
  const sm = readFileSync(path.join(__dirname, "..", "app", "sitemap.ts"), "utf8");
  const tinh = [...sm.slice(sm.indexOf("const TINH"), sm.indexOf("];", sm.indexOf("const TINH"))).matchAll(/\["(\/[^"]*)", [\d.]+\]/g)].map((m) => m[1]!);
  expect(tinh.length).toBeGreaterThan(15);
  const so = new Set(SO_TRANG.map((t) => t.duong));
  for (const d of [...tinh, "/phong-thuy/huong-hop-tuoi", ...Object.values(CHU_DE).map((c) => c.duong)]) expect(so.has(d), d).toBe(true);
  expect(so.size).toBe(SO_TRANG.length);
  expect(SO_TRANG.length).toBeLessThanOrEqual(49);   // bản gọn (mục 8.1): không tạo sẵn tài liệu cho trang KB; +1 trang cụm dấu hiệu (Y5), +1 SAO-HV (/hoi-vien), +1 SAO-CG (/hoi-chuyen-gia), +1 /xem-sao-han (MT-ĐS)
  expect(MAU_CUM.length).toBe(Object.keys(CHU_DE).length + 13);  // + tuổi hợp hướng, lá số mẫu, 6 cụm trang con (ND-7), 4 cụm SEO-L, sao hạn theo năm (MT-ĐS)
  expect(khopMauCum("/tu-vi/sao-o-cung/tu-vi-cung-menh")?.bien).toEqual({ slug: "tu-vi-cung-menh" });
  expect(khopMauCum("/phong-thuy/huong-hop-tuoi/tuoi-1990")?.bien).toEqual({ nam: "1990" });       // SEO-K: gộp nam + nữ
  expect(khopMauCum("/phong-thuy/huong-hop-tuoi/tuoi-1990-nam")).toBeNull();
  expect(khopMauCum("/phong-thuy/huong-hop-tuoi")).toBeNull();
  expect(khopMauCum("/tu-vi/sao-o-cung")).toBeNull();
  // ND-7: trang con theo ngày/năm — tháng khớp TRƯỚC ngày (cùng tiền tố).
  expect(khopMauCum("/xem-ngay-tot/thang-10-2026")).toMatchObject({ bien: { thang: "10", nam: "2026" } });
  expect(khopMauCum("/xem-ngay-tot/2026-10-21")).toMatchObject({ bien: { ngay: "2026-10-21" } });
  expect(khopMauCum("/xem-tuoi-lam-nha/2026/tuoi-1990")?.bien).toEqual({ nam: "2026", nam_sinh: "1990" });
  expect(khopMauCum("/tuoi-xong-dat/2027/tuoi-1985")?.bien).toEqual({ nam: "2027", nam_sinh: "1985" });
  expect(khopMauCum("/phong-thuy/huong-xau-nam/2026")?.bien).toEqual({ nam: "2026" });
  expect(khopMauCum("/xem-ngay-tot/abc")?.mau.mau_duong).not.toBe("/xem-ngay-tot/{ngay}");
  for (const m of SO_TRANG) if (m.nhom === "phap_ly") expect(m.o.some((o) => o.startsWith("khoi")), m.duong).toBe(false);
});

// Sổ trang CHÉP chữ của hằng ND trong page.tsx (pha ND-0 không sửa page.tsx) → kiểm bằng HTML thật để không lệch.
const giaiMa = (s: string) => s.replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
for (const m of SO_TRANG.filter((t) => t.nhom === "cong_cu" && t.mac_dinh.doan)) {
  test(`sổ trang trùng chữ đang hiện ở ${m.duong}`, async ({ request }) => {
    const html = giaiMa(await (await request.get(m.duong)).text());
    expect(giaiMa(/<title>([^<]*)<\/title>/.exec(html)?.[1] ?? "")).toContain(m.mac_dinh.tieu_de_seo!);
    for (const s of [m.mac_dinh.mo_ta_seo!, ...m.mac_dinh.doan!, ...m.mac_dinh.hoi_dap!.flatMap((h) => [h.hoi, h.dap]),
      ...m.mac_dinh.lien_ket!.map((l) => l.ten)]) expect(html, s).toContain(s);
  });
}

// ND-7: mọi URL trong sitemap (trừ bài blog / chuyên mục / trang đích — đã có collection riêng) phải sửa được ở CMS:
// có trong sổ trang hoặc thuộc một mẫu cụm. Thêm trang công khai mới mà quên khai → test này đỏ.
test("sitemap: mọi URL đều thuộc sổ trang hoặc một mẫu cụm (sửa được ở CMS)", async ({ request }) => {
  const xml = await (await request.get("/sitemap.xml")).text();
  const ds = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]!).pathname);
  expect(ds.length).toBeGreaterThan(500);
  const sot = ds.filter((d) => !/^\/(blog|su-kien)(\/|$)/.test(d) && !mucSoTrang(d) && !khopMauCum(d));
  expect(sot, `URL chưa có chỗ sửa ở CMS: ${sot.slice(0, 10).join(", ")}`).toEqual([]);
});

test("route sổ trang + webhook làm mới từ chối khi thiếu/sai bí mật", async ({ request }) => {
  expect((await request.get("/api/so-trang")).status()).toBe(401);
  expect((await request.get("/api/so-trang", { headers: { "x-cms-bi-mat": "sai" } })).status()).toBe(401);
  expect((await request.post("/api/cms/lam-moi", { data: { duong: "/tu-vi" } })).status()).toBe(401);
});

test("ND-2: CMS trống → metadata y nguyên bản code; ô SEO CMS phủ tiêu đề, mô tả, ảnh /og vẽ lại", () => {
  const md = mucSoTrang("/tu-vi")!;
  const goc = metaMacDinh("/tu-vi");
  const rong = gopNoiDung("/tu-vi", { ...md.mac_dinh, nhom: md.nhom, ten: md.ten }, null, null);
  expect(apDungSeo(goc, rong)).toBe(goc);                                   // cùng đối tượng → HTML không đổi
  const co = gopNoiDung("/tu-vi", md.mac_dinh, { tieu_de_seo: "Lá số Tử vi mới", mo_ta_seo: "Mô tả mới" }, null);
  const m = apDungSeo(goc, co);
  expect(m.title).toBe("Lá số Tử vi mới");
  expect(m.description).toBe("Mô tả mới");
  expect(m.alternates).toEqual(goc.alternates);
  // SEO-K: ảnh /og vẽ lại theo tiêu đề mới, giữ hình theo mảng (mang=…).
  const anhOg = new URL((m.openGraph as { images: string[] }).images[0]!, "http://x");
  expect(anhOg.pathname).toBe("/og");
  expect(anhOg.searchParams.get("tieu_de")).toBe("Lá số Tử vi mới");
  expect(apDungSeo({}, co, { tuyetDoi: true }).title).toEqual({ absolute: "Lá số Tử vi mới" });
  // trang không tự khai openGraph (vd pháp lý): sửa tiêu đề vẫn giữ đủ bộ chia sẻ (url, ảnh, thẻ Twitter)
  const pl = apDungSeo({ title: "Điều khoản sử dụng" }, gopNoiDung("/dieu-khoan", mucSoTrang("/dieu-khoan")!.mac_dinh, { tieu_de_seo: "Điều khoản mới" }, null));
  expect(pl.openGraph).toMatchObject({ title: "Điều khoản mới", url: "/dieu-khoan" });
  expect(new URL((pl.openGraph as { images: string[] }).images[0]!, "http://x").searchParams.get("tieu_de")).toBe("Điều khoản mới");
  expect(pl.twitter).toMatchObject({ card: "summary_large_image", title: "Điều khoản mới" });
});

test("ND-2: sổ trang — công cụ HL/TDG đọc giới thiệu từ noi-dung.ts; ô cho phép khớp chỗ web thật sự đọc", () => {
  for (const d of ["/xem-ngay-tot", "/xem-tuoi-lam-nha", "/tuoi-xong-dat", "/phong-thuy/huong-xau-nam"]) {
    const m = mucSoTrang(d)!;
    expect(m.o).toContain("gioi_thieu");
    expect(m.mac_dinh.doan?.length).toBeGreaterThan(0);
    expect(m.mac_dinh.hoi_dap?.length).toBeGreaterThan(0);
  }
  expect(mucSoTrang("/ban-than")!.o).toEqual(["seo", "khoi_duoi", "khoi_cuoi"]);
  expect(mucSoTrang("/tai-khoan")!.o).toEqual(["seo"]);
});

test("ND-5: bản Markdown nhận chữ của khối CMS (văn bản, ghi chú, trích dẫn, banner, hỏi đáp); khối không chữ bị bỏ", () => {
  const md = mdKhoi([
    { blockType: "van_ban", tieu_de: "Đọc thêm", noi_dung: "Đoạn một." },
    { blockType: "ghi_chu", tieu_de: "Tự soi", noi_dung: "Câu hỏi\ncho bạn." },
    { blockType: "trich_dan", cau: "Thiên hành kiện.", nguon: "Chu Dịch" },
    { blockType: "banner", tieu_de: "Mời bạn", mo_ta: "Mô tả banner." },
    { blockType: "hoi_dap", ds: [{ cau_hoi: "Hỏi?", tra_loi: "Đáp." }] },
    { blockType: "video", url: "x", tieu_de: "" }, { blockType: "nut_moi", chu: "Bấm", link: "/x" },
  ]);
  expect(md).toBe("## Đọc thêm\n\nĐoạn một.\n\n> **Tự soi** — Câu hỏi cho bạn.\n\n> Thiên hành kiện.\n>\n> — Chu Dịch\n\n**Mời bạn**\n\nMô tả banner.\n\n### Hỏi?\n\nĐáp.");
  expect(mdKhoi([])).toBe("");
});

test("ND-4: ngày hiệu lực — chữ trong code giữ nguyên, ngày CMS (ISO 12:00 UTC) ra dd/mm/yyyy, rác → null", () => {
  expect(ngayHienThi("08/10/2026")).toBe("08/10/2026");
  expect(ngayHienThi("2026-11-01T12:00:00.000Z")).toBe("01/11/2026");
  expect(ngayHienThi(null)).toBeNull();
  expect(ngayHienThi("không phải ngày")).toBeNull();
  const md = mucSoTrang("/dieu-khoan")!;
  const nd = gopNoiDung("/dieu-khoan", md.mac_dinh, { ngay_hieu_luc: "2026-11-01T12:00:00.000Z" }, null);
  expect(ngayHienThi(nd.ngayHieuLuc)).toBe("01/11/2026");
});

test("ND-3/ND-4: mục theo neo — CMS sửa tiêu đề/thân đúng neo, mục không sửa giữ chữ code, neo mới có thân thêm cuối; CMS trống → y nguyên", () => {
  const muc = [{ id: "a", tieuDe: "A", noiDung: "thân A" }, { id: "b", tieuDe: "B", noiDung: "thân B" }];
  const rong = gopNoiDung("/dieu-khoan", {}, null, null);
  expect(gopMucCms(muc, rong)).toBe(muc);
  const nd = gopNoiDung("/dieu-khoan", {}, { muc: [
    { neo: "b", tieu_de: "B mới", noi_dung_html: "<p>Thân B mới</p><script>x()</script>" },
    { neo: "c", tieu_de: "C", noi_dung_html: "<p>Thân C</p>" }, { neo: "d", tieu_de: "D không thân", noi_dung_html: "" },
  ] }, null);
  const ra = gopMucCms(muc, nd);
  expect(ra.map((m) => [m.id, m.tieuDe])).toEqual([["a", "A"], ["b", "B mới"], ["c", "C"]]);
  // neo có trong sổ trang nhưng trang đang ẩn (vd /gioi-thieu "ung-ho" khi chưa bật ủng hộ) → không tự hiện
  const gt = gopNoiDung("/gioi-thieu", {}, { muc: [{ neo: "ung-ho", tieu_de: "Ủng hộ", noi_dung_html: "<p>x</p>" }] }, null);
  expect(gopMucCms([{ id: "su-menh", tieuDe: "S", noiDung: "s" }], gt).map((m) => m.id)).toEqual(["su-menh"]);
  expect(ra[0]!.noiDung).toBe("thân A");
  const html = (ra[1]!.noiDung as { props: { dangerouslySetInnerHTML: { __html: string } } }).props.dangerouslySetInnerHTML.__html;
  expect(html).toContain("Thân B mới");
  expect(html).not.toContain("script");
});
