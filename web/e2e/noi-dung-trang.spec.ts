// ND-0 — lớp phủ nội dung theo URL: gộp URL > mẫu cụm > mặc định code, thay biến (thoát HTML), sổ trang đủ mọi URL
// tĩnh của sitemap, chữ mặc định trong sổ trùng chữ đang hiện trên trang công cụ, route sổ trang + webhook đòi bí mật.
import { readFileSync } from "node:fs";
import path from "node:path";
import { test, expect } from "@playwright/test";
import { gopNoiDung, layNoiDungTrang, thayBien, duongHopLe, type KhoiCms } from "../lib/noi-dung-trang";
import { khopMauCum, MAU_CUM, mucSoTrang, SO_TRANG } from "../lib/so-trang";
import { CHU_DE } from "../lib/kien-thuc";

test("thay biến: thoát HTML giá trị, biến lạ giữ nguyên chữ", () => {
  expect(thayBien("Xem {tieu_de} và {la}", { tieu_de: `<b>"Tử vi" & 'Mệnh'</b>` }))
    .toBe("Xem &lt;b&gt;&quot;Tử vi&quot; &amp; &#39;Mệnh&#39;&lt;/b&gt; và {la}");
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
    lien_ket: [{ nhan: "Ngoài", loai: "duong_dan", duong_dan: "//evil.vn" }, { nhan: "Sao", loai: "duong_dan", duong_dan: "/kien-thuc/tu-vi" }],
  }, null);
  expect(co.seo.tieuDe).toBe(md.mac_dinh.tieu_de_seo);          // ô chỉ có khoảng trắng = trống
  expect(co.seo.moTa).toBe("Mô tả mới");
  expect(co.dau).toMatchObject({ h1: "Lá số Tử vi", kieuChu: { co: "lon", can: "giua", nen: "khong" } });
  expect(co.gioiThieu.doan).toEqual(["Đoạn CMS"]);
  expect(co.gioiThieu.hoiDap).toEqual(md.mac_dinh.hoi_dap);     // câu thiếu trả lời bị bỏ → về mặc định
  expect(co.gioiThieu.lienKet).toEqual([{ href: "/kien-thuc/tu-vi", ten: "Sao" }]);
});

test("gộp khối: mẫu cụm áp cho trang KB; ghi đè 'thay' / 'thêm sau' / 'ẩn mẫu'; khung ngày; biến", () => {
  const k = (id: string, x: Record<string, unknown> = {}): KhoiCms => ({ blockType: "van_ban", id, noi_dung: `Về {tieu_de} ${id}`, ...x });
  const mau = { khoi_tren: [k("m1")], khoi_duoi: [k("m2")], khoi_cuoi: [k("m3"), k("cu", { blockType: "banner", den_ngay: "2020-01-01T00:00:00Z" })] };
  const bien = { tieu_de: "Tử Vi <Mệnh>" };
  const chiMau = gopNoiDung("/kien-thuc/sao-cung/tu-vi-cung-menh", {}, null, mau, bien);
  expect(chiMau.khoi.tren.map((x) => x.noi_dung)).toEqual(["Về Tử Vi &lt;Mệnh&gt; m1"]);
  expect(chiMau.khoi.cuoi.map((x) => x.id)).toEqual(["m3"]);   // banner hết hạn bị bỏ
  const ghiDe = gopNoiDung("/kien-thuc/sao-cung/tu-vi-cung-menh", {}, {
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
    const kb = await layNoiDungTrang("/kien-thuc/sao-cung/tu-vi-cung-menh");
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
  for (const d of [...tinh, "/phong-thuy/huong-hop-tuoi", ...Object.keys(CHU_DE).map((k) => `/kien-thuc/${k}`)]) expect(so.has(d), d).toBe(true);
  expect(so.size).toBe(SO_TRANG.length);
  expect(SO_TRANG.length).toBeLessThanOrEqual(45);   // bản gọn (mục 8.1): không tạo sẵn tài liệu cho trang KB
  expect(MAU_CUM.length).toBe(Object.keys(CHU_DE).length + 2);
  expect(khopMauCum("/kien-thuc/sao-cung/tu-vi-cung-menh")?.bien).toEqual({ slug: "tu-vi-cung-menh" });
  expect(khopMauCum("/phong-thuy/tuoi-1990-nam")?.bien).toEqual({ nam: "1990", gioi: "nam" });
  expect(khopMauCum("/phong-thuy/huong-hop-tuoi")).toBeNull();
  expect(khopMauCum("/kien-thuc/sao-cung")).toBeNull();
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

test("route sổ trang + webhook làm mới từ chối khi thiếu/sai bí mật", async ({ request }) => {
  expect((await request.get("/api/so-trang")).status()).toBe(401);
  expect((await request.get("/api/so-trang", { headers: { "x-cms-bi-mat": "sai" } })).status()).toBe(401);
  expect((await request.post("/api/cms/lam-moi", { data: { duong: "/tu-vi" } })).status()).toBe(401);
});
