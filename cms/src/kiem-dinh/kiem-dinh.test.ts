// Viết TRƯỚC kiem-dinh.ts (quy tắc dự án). Chạy: npm test (node --test, không cần thư viện test).
import { test } from "node:test";
import assert from "node:assert/strict";
import { boDau, docLexical, kiemDinhBai, slugViet, TIEU_DE_TAM, type BaiKiem } from "./kiem-dinh.ts";

// ---- trợ giúp dựng cây Lexical tối giản (đúng dạng Payload lưu) ----
const chu = (text: string) => ({ type: "text", text, format: 0, version: 1 });
const doan = (...con: unknown[]) => ({ type: "paragraph", children: con, version: 1 });
const tieuDe = (tag: string, text: string) => ({ type: "heading", tag, children: [chu(text)], version: 1 });
const lien = (url: string, text: string, linkType = "custom") =>
  ({ type: "link", fields: { url, linkType }, children: [chu(text)], version: 1 });
const ds = (...muc: string[]) => ({ type: "list", listType: "bullet", children: muc.map((m) => ({ type: "listitem", children: [chu(m)] })) });
const anh = (alt?: string) => ({ type: "upload", relationTo: "media", value: { id: 1, alt: alt ?? "" }, fields: alt === undefined ? {} : { alt } });
const goc = (...con: unknown[]) => ({ root: { type: "root", children: con, version: 1 } });
const tu = (n: number, w = "chữ") => Array.from({ length: n }, () => w).join(" ");

function baiTot(): BaiKiem {
  const mo = "Số chủ đạo 7 là con số của người thích tìm hiểu, sống nội tâm và hay đặt câu hỏi về bản chất sự việc.";
  return {
    tieu_de: "Số chủ đạo 7: tính cách, công việc và tình yêu",
    slug: "so-chu-dao-7",
    tu_khoa_chinh: "số chủ đạo 7",
    mo_ta_ngan: "Tìm hiểu số chủ đạo 7 trong thần số học.",
    tra_loi_nhanh: "Số chủ đạo 7 là con số của sự tìm hiểu và chiêm nghiệm. " + tu(40, "người"),
    meta: {
      title: "Số chủ đạo 7: tính cách, công việc, tình yêu",
      description: "Số chủ đạo 7 trong thần số học nói gì về tính cách, công việc và tình yêu? Đọc giải thích dễ hiểu, có mặt sáng và mặt tối, kèm câu hỏi tự soi.",
      image: 1,
    },
    anh_bia: 1,
    noi_dung: goc(
      doan(chu(mo)),
      tieuDe("h2", "Số chủ đạo 7 là gì?"),
      doan(chu(tu(120))),
      doan(chu(tu(130)), lien("/than-so", "tính số chủ đạo của bạn", "custom")),
      ds("Ham học", "Độc lập", "Kỹ tính"),
      tieuDe("h2", "Số chủ đạo 7 trong công việc"),
      doan(chu(tu(120))),
      doan(chu(tu(130)), lien("https://hieuban.com/kien-thuc/so-chu-dao", "xem các số khác")),
      anh("Biểu đồ số 7"),
      tieuDe("h3", "Nghề hợp"),
      doan(chu(tu(120))),
    ),
    hoi_dap: [
      { cau_hoi: "Số chủ đạo 7 hợp nghề gì?", tra_loi: "Nghiên cứu, phân tích." },
      { cau_hoi: "Số 7 hợp với số nào?", tra_loi: "Thường được nhắc là 2, 4." },
      { cau_hoi: "Cách tính số chủ đạo?", tra_loi: "Cộng các chữ số ngày sinh." },
    ],
    nguon: [{ ten: "Thần số học Pythagoras hiện đại" }],
    ky_ten: "ban_bien_tap",
  };
}

const ma = (bai: BaiKiem) => new Map(kiemDinhBai(bai).muc.map((m) => [m.ma, m.muc_do]));

test("boDau + slugViet: đ → d, bỏ dấu, gạch nối, cắt độ dài", () => {
  assert.equal(boDau("Đường Hoá Kỵ"), "duong hoa ky");
  assert.equal(slugViet("  Số chủ đạo 7: Tính cách & Tình yêu!! "), "so-chu-dao-7-tinh-cach-tinh-yeu");
  assert.equal(slugViet("Đức — Luân"), "duc-luan");
  assert.ok(slugViet(tu(40, "dài")).length <= 80);
});

test("docLexical: chữ, tiêu đề, link trong/ngoài, ảnh thiếu alt, danh sách, H1 trong thân", () => {
  const d = docLexical(goc(
    tieuDe("h1", "Lỗi H1"), doan(chu("Một hai ba"), lien("/tu-vi", "lá số")),
    ds("a", "b"), anh(), anh("có alt"), doan(lien("https://example.com/x", "ngoài")),
  ));
  assert.deepEqual(d.tieuDe.map((h) => h.tag), ["h1"]);
  assert.equal(d.lienKetTrong.length, 1);
  assert.equal(d.lienKetNgoai.length, 1);
  assert.equal(d.anh, 2);
  assert.equal(d.anhThieuAlt, 1);
  assert.equal(d.danhSach, 1);
  assert.match(d.doanDau, /Một hai ba/);
  assert.ok(d.soTu >= 6);
});

test("docLexical chịu được dữ liệu rỗng / sai dạng", () => {
  for (const x of [undefined, null, {}, { root: null }, "chuỗi", 5]) {
    const d = docLexical(x);
    assert.equal(d.soTu, 0);
  }
});

test("bài chuẩn: điểm cao, không có lỗi chặn", () => {
  const kq = kiemDinhBai(baiTot());
  assert.equal(kq.loi_chan.length, 0, JSON.stringify(kq.loi_chan));
  assert.ok(kq.diem >= 85, `điểm ${kq.diem}: ` + JSON.stringify(kq.muc.filter((m) => m.muc_do !== "dat")));
  for (const nhom of ["seo", "geo", "eeat", "noi_dung"]) assert.ok(kq.muc.some((m) => m.nhom === nhom), nhom);
});

test("bài trống: điểm thấp, thiếu tiêu đề là lỗi", () => {
  const kq = kiemDinhBai({});
  assert.ok(kq.diem < 30, String(kq.diem));
  assert.equal(ma({}).get("tieu_de"), "loi");
});

test("SEO: tiêu đề/mô tả meta dài, slug có dấu, từ khoá không có trong tiêu đề", () => {
  const b = baiTot();
  b.meta = { ...b.meta, title: tu(30, "dài"), description: "ngắn" };
  b.slug = "Số-chủ-đạo";
  b.tu_khoa_chinh = "cung mệnh";
  const m = ma(b);
  assert.equal(m.get("meta_title"), "canh_bao");
  assert.equal(m.get("meta_description"), "canh_bao");
  assert.equal(m.get("slug"), "canh_bao");
  assert.equal(m.get("tu_khoa_tieu_de"), "canh_bao");
  assert.equal(m.get("tu_khoa_doan_dau"), "canh_bao");
});

test("SEO: so khớp từ khoá không phân biệt dấu kiểu cũ/mới (hoá ↔ hóa)", () => {
  const b = baiTot();
  b.tu_khoa_chinh = "Số chủ đạo 7";
  b.tieu_de = "So chu dao 7 la gi";
  assert.equal(ma(b).get("tu_khoa_tieu_de"), "dat");
});

test("SEO: H1 trong thân bài, nhảy cấp tiêu đề, ảnh thiếu alt, ít link nội bộ", () => {
  const b = baiTot();
  b.noi_dung = goc(tieuDe("h1", "X"), doan(chu(tu(700))), tieuDe("h4", "Nhảy cấp"), anh(""));
  assert.equal(ma(b).get("doan_dai"), "canh_bao");
  const m = ma(b);
  assert.equal(m.get("h1_than_bai"), "canh_bao");
  assert.equal(m.get("thu_tu_tieu_de"), "canh_bao");
  assert.equal(m.get("alt_anh"), "canh_bao");
  assert.equal(m.get("lien_ket_noi_bo"), "canh_bao");
});

test("SEO: nhồi từ khoá bị cảnh báo", () => {
  const b = baiTot();
  b.noi_dung = goc(doan(chu(Array.from({ length: 60 }, () => "số chủ đạo 7 hay").join(" "))));
  assert.equal(ma(b).get("mat_do_tu_khoa"), "canh_bao");
});

test("GEO: thiếu trả lời nhanh / hỏi đáp / nguồn / tiêu đề dạng câu hỏi", () => {
  const b = baiTot();
  b.tra_loi_nhanh = "";
  b.hoi_dap = [];
  b.nguon = [];
  b.noi_dung = goc(doan(chu(tu(800))), tieuDe("h2", "Phần một"), tieuDe("h2", "Phần hai"));
  const m = ma(b);
  assert.equal(m.get("tra_loi_nhanh"), "canh_bao");
  assert.equal(m.get("hoi_dap"), "canh_bao");
  assert.equal(m.get("nguon"), "canh_bao");
  assert.equal(m.get("tieu_de_cau_hoi"), "canh_bao");
  assert.equal(m.get("cau_truc"), "canh_bao");
});

test("GEO: trả lời nhanh quá dài bị cảnh báo", () => {
  const b = baiTot();
  b.tra_loi_nhanh = tu(150);
  assert.equal(ma(b).get("tra_loi_nhanh"), "canh_bao");
});

test("E-E-A-T: ký thẩm định thiếu người/ngày/xác nhận là lỗi chặn; tác giả thiếu người là lỗi chặn", () => {
  const b = baiTot();
  b.ky_ten = "tham_dinh";
  let kq = kiemDinhBai(b);
  assert.ok(kq.loi_chan.some((m) => m.ma === "tham_dinh"));
  b.nguoi_tham_dinh = 3; b.ngay_tham_dinh = "2026-10-01"; b.xac_nhan_tham_dinh = true;
  kq = kiemDinhBai(b);
  assert.ok(!kq.loi_chan.some((m) => m.ma === "tham_dinh"));
  b.ky_ten = "tac_gia"; b.tac_gia = null;
  assert.ok(kiemDinhBai(b).loi_chan.some((m) => m.ma === "tac_gia"));
});

test("Nội dung: vùng cấm, liên hệ, tên nội bộ là LỖI CHẶN xuất bản", () => {
  const cases: [string, string][] = [
    ["Tuổi này dễ chết sớm nếu không giải hạn.", "vung_cam"],
    ["Liên hệ zalo 0912 345 678 để xem thêm.", "lien_he"],
    ["Lá số an bằng iztro.", "ten_noi_bo"],
    ["Chạy trên Render và Supabase.", "ten_noi_bo"],
  ];
  for (const [cau, maLoi] of cases) {
    const b = baiTot();
    b.noi_dung = goc(doan(chu(cau)));
    const kq = kiemDinhBai(b);
    assert.ok(kq.loi_chan.some((m) => m.ma === maLoi), `${cau} → ${maLoi}: ${JSON.stringify(kq.loi_chan)}`);
  }
  const b = baiTot();
  b.hoi_dap = [{ cau_hoi: "Có nên cúng sao giải hạn?", tra_loi: "Nên mua vật phẩm." }];
  assert.ok(kiemDinhBai(b).loi_chan.some((m) => m.ma === "vung_cam"), "quét cả hỏi đáp");
});

test("Nội dung: giọng phán chỉ cảnh báo (không chặn)", () => {
  const b = baiTot();
  b.noi_dung = goc(doan(chu("Bạn sẽ chắc chắn sẽ thành công, định mệnh rồi. " + tu(700))));
  const kq = kiemDinhBai(b);
  assert.equal(ma(b).get("giong_phan"), "canh_bao");
  assert.ok(!kq.loi_chan.some((m) => m.ma === "giong_phan"));
});

test("Link hieuban.com đầy đủ được tính là nội bộ; link mailto/tel bị coi là liên hệ", () => {
  const d = docLexical(goc(doan(lien("https://www.hieuban.com/tu-vi", "x"), lien("https://hieuban.com", "y"))));
  assert.equal(d.lienKetTrong.length, 2);
  const b = baiTot();
  b.noi_dung = goc(doan(chu(tu(700)), lien("tel:0912345678", "gọi")));
  assert.ok(kiemDinhBai(b).loi_chan.some((m) => m.ma === "lien_he"));
});

test("Điểm nằm trong 0–100 và mỗi mục có thông điệp tiếng Việt", () => {
  for (const b of [{}, baiTot()]) {
    const kq = kiemDinhBai(b);
    assert.ok(kq.diem >= 0 && kq.diem <= 100);
    for (const m of kq.muc) assert.ok(m.thong_diep.length > 5, m.ma);
  }
});

test("kiemDinhBai chịu được form gõ dở: mảng là số dòng, trường sai kiểu", () => {
  const kq = kiemDinhBai({ tieu_de: 5 as never, hoi_dap: 2 as never, nguon: "x" as never, meta: "y" as never, tra_loi_nhanh: null });
  assert.ok(kq.diem >= 0);
});

test("tiêu đề tạm / trống → lỗi chặn xuất bản", () => {
  for (const t of [TIEU_DE_TAM, "", `${TIEU_DE_TAM} 12/10`]) {
    const kq = kiemDinhBai({ ...baiTot(), tieu_de: t });
    assert.ok(kq.loi_chan.some((m) => m.ma === "tieu_de"), t);
  }
  assert.ok(!kiemDinhBai(baiTot()).loi_chan.some((m) => m.ma === "tieu_de"));
});

test("ảnh NotFair chưa nhập (kho ảnh lỗi lúc nhập) → lỗi chặn xuất bản; chèn ảnh xong thì hết", () => {
  const b = baiTot();
  const co = { ...b, noi_dung: goc(doan(chu("Mở đầu.")), doan(chu("[Ảnh chưa nhập — tải ảnh vào Thư viện ảnh rồi chèn thay đoạn này: https://notfair.co/x.png]"))) };
  assert.ok(kiemDinhBai(co).loi_chan.some((m) => m.ma === "anh_chua_nhap"));
  assert.ok(!kiemDinhBai(b).loi_chan.some((m) => m.ma === "anh_chua_nhap"));
});
