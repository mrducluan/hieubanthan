import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { LaSoVao } from "./la-so-vao.ts";
import {
  KHOA_CAT_RIENG_SAO2,
  KHOA_CONG_KHAI_SAO2,
  boTinhTrangKhoa,
  catLuanHoiChat,
  catXemTruoc,
  khoaLaBiCat,
  taoKhoaGiaoDichLuanGiai,
  xetQuyenDocHoi,
} from "./sao-xem-truoc.ts";

const GOC_BEN = {
  cau_tra_loi: "Đoạn trả lời chung…",
  luan_hoi: {
    ma: "ben",
    cau: "Tôi một đời vợ chồng hay dễ dang dở, ly dị?",
    tra_loi: "Lá số thuộc nhóm dễ hai lần đò.",
    giai_thich: "Giải thích chi tiết…",
    nhan: "hai_lan_do",
    sac: "can_chu_dong",
    ma_mau: "ds.tinh_cam.hoi.ben.hai_lan_do",
    phai: "nam_phai_viet",
    chuong: "tinh_cam",
    ten_chuong: "Tình yêu & hôn nhân",
    ghi_chu: "Ghi chú thế lá số…",
  },
};

test("SAO-2: khi báo cáo chưa mở khoá, catLuanHoiChat cắt sạch cả luan_hoi lẫn doi_song_lien_ket của chương khoá", () => {
  const kq = catLuanHoiChat(GOC_BEN, false);
  assert.deepEqual(kq.luan_hoi, {
    khoa: true,
    ma: "ben",
    cau: "Tôi một đời vợ chồng hay dễ dang dở, ly dị?",
    sac: "can_chu_dong",
    chuong: "tinh_cam",
    ten_chuong: "Tình yêu & hôn nhân",
  });
  const raw = JSON.stringify(kq);
  assert.equal(raw.includes("hai_lan_do"), false);
  assert.equal(raw.includes("hai lần đò"), false);

  const kqDs = catLuanHoiChat({
    cau_tra_loi: "…",
    doi_song_lien_ket: {
      chuong: "suc_khoe",
      ten_chuong: "Sức khoẻ & năng lượng",
      tieu_de_hop: "Nên chú ý giấc ngủ",
      ma_mau: "ds.bt.suc_khoe.than.yeu.khuyen",
      phai: "tu_binh",
    },
  }, false);
  assert.deepEqual(kqDs.doi_song_lien_ket, {
    khoa: true,
    chuong: "suc_khoe",
    ten_chuong: "Sức khoẻ & năng lượng",
  });
  assert.equal(JSON.stringify(kqDs).includes("ds.bt.suc_khoe"), false);
});

test("SAO-2: xetQuyenDocHoi phủ đủ mọi nhánh (tắt thu Sao, bản Anh, chủ sở hữu, hội viên, thiếu bí mật đóng an toàn, khách, chuong_mien_phi động)", () => {
  const nen = {
    coLaSo: true, mienPhiAnh: false, thuSaoBat: true, coPhien: true,
    chuSoHuu: false, hoiVien: false, coBiMat: true, daMoHomNay: false,
    moDun: "tuvi", soChuongMo: 1,
  };
  // Công tắc thu Sao TẮT (mặc định) -> mở hoàn toàn
  assert.equal(xetQuyenDocHoi({ ...nen, thuSaoBat: false }).daMoToanBo, true);
  // Bản tiếng Anh -> mở hoàn toàn
  assert.equal(xetQuyenDocHoi({ ...nen, mienPhiAnh: true }).daMoToanBo, true);
  // Chủ sở hữu / Hội viên năm (0028) / Đã mở hôm nay -> mở hoàn toàn
  assert.equal(xetQuyenDocHoi({ ...nen, chuSoHuu: true }).daMoToanBo, true);
  assert.equal(xetQuyenDocHoi({ ...nen, hoiVien: true }).daMoToanBo, true);
  assert.equal(xetQuyenDocHoi({ ...nen, daMoHomNay: true }).daMoToanBo, true);
  // Thiếu bí mật máy chủ khi thu Sao đang bật -> ĐÓNG an toàn (không lộ nhầm!)
  const thieuBiMat = xetQuyenDocHoi({ ...nen, coBiMat: false });
  assert.equal(thieuBiMat.daMoToanBo, false);
  // Khách chưa đăng nhập -> khoá chương sau, chỉ mở chương miễn phí
  const khach = xetQuyenDocHoi({ ...nen, coPhien: false });
  assert.equal(khach.daMoToanBo, false);
  assert.deepEqual([...(khach.chuongMo ?? [])], ["tong_quan"]);

  // Quản trị nâng chuong_mien_phi lên 3 (hoặc 2 + 1 chương quà tặng) ở Tử vi -> su_nghiep mở cho mọi câu trong chương đó!
  const mo3 = xetQuyenDocHoi({ ...nen, coPhien: false, soChuongMo: 3 });
  const gocSuNghiep = {
    cau_tra_loi: "…",
    luan_hoi: { ...GOC_BEN.luan_hoi, chuong: "su_nghiep", ma: "chu_hay_cong", nhan: "lam_chu", tra_loi: "Hợp làm chủ." },
  };
  assert.deepEqual(catLuanHoiChat(gocSuNghiep, mo3), gocSuNghiep);
});

test("SAO-2: khoá giao dịch HMAC qua đúng schema LaSoVao thực tế giữa /luan-giai và /hoi khớp từng byte", () => {
  const tuClient = {
    birth_date: "1990-05-15",
    birth_time: "08:30",
    gender: "nam",
    noi_sinh: "ha-noi",
    do_tin_gio: "exact",
    luu_nguyet: "dau_quan_thai_tue",
  };
  const parsedBaoCao = LaSoVao.parse({ ...tuClient, tinh_trang: "co_doi" });
  const parsedHoi = LaSoVao.parse(tuClient);
  const kBaoCao = taoKhoaGiaoDichLuanGiai("secret_key_16_chars_min", "tuvi", boTinhTrangKhoa({ la_so: parsedBaoCao }), "2026-11-26");
  const kHoi = taoKhoaGiaoDichLuanGiai("secret_key_16_chars_min", "tuvi", boTinhTrangKhoa({ la_so: parsedHoi }), "2026-11-26");
  assert.equal(kBaoCao, kHoi);
});

test("SAO-2 (Chặng 1): catXemTruoc cắt chi tiết ung_dung_co_dien khi chương nguồn còn khoá và mở khi đủ chương", () => {
  const bcDay = {
    chuong: [
      { ma: "tong_quan", tieu_de: "Con người bạn", doan: ["Đoạn 1"] },
      { ma: "ngu_hanh", tieu_de: "Năng lượng", doan: ["Đoạn 2"] },
    ],
    ung_dung_co_dien: {
      ma: "battu_co_dien",
      tieu_de: "Ứng dụng Ngũ hành bổ khuyết từ Tứ Trụ",
      nguyen_tac_uu_tien: "Nguyên tắc…",
      tom_tat_dung_than: "Cả hai cách cùng cần hành Thủy.",
      hanh_ung_dung: [{ hanh_ma: "Thủy", ten_hanh: "Thủy", mau_sac: "Xanh lam", chat_lieu: "Kính", phuong_vi: "Bắc", khung_gio: "19:00", thoi_quen: [] }],
    },
  };
  const cat1 = catXemTruoc(bcDay, 1);
  assert.deepEqual(cat1.ung_dung_co_dien, {
    khoa: true,
    ma: "battu_co_dien",
    tieu_de: "Ứng dụng Ngũ hành bổ khuyết từ Tứ Trụ",
    nguyen_tac_uu_tien: "Nguyên tắc…",
  });
  assert.equal(JSON.stringify(cat1).includes("Xanh lam"), false);

  const cat2 = catXemTruoc(bcDay, 2);
  assert.deepEqual(cat2.ung_dung_co_dien, bcDay.ung_dung_co_dien);
});

test("SAO-2 v2.0 (Default-Deny Allowlist): chặn 100% khoá cấp gốc lạ khi báo cáo khoá và khớp toàn bộ mẫu golden thật", () => {
  // Guard B1: tiêm một trường mới chưa khai báo vào báo cáo đang khoá → bắt buộc bị cắt sạch (Default-Deny)
  const bcCoTruongLa = {
    mo_dun: "tuvi",
    phien_ban: "doi_song_1",
    chuong: [
      { ma: "tong_quan", tieu_de: "Mở", doan: ["Đoạn 1"] },
      { ma: "su_nghiep", tieu_de: "Khoá", doan: ["Bí mật 99 Sao"] },
    ],
    truong_moi_quen_cat: { bi_mat: "NỘI_DUNG_CHƯƠNG_SAU_LỘ_NHẦM" },
  };
  const catKhoa = catXemTruoc(bcCoTruongLa, 1);
  assert.equal("truong_moi_quen_cat" in catKhoa, false);
  assert.equal(JSON.stringify(catKhoa).includes("NỘI_DUNG_CHƯƠNG_SAU_LỘ_NHẦM"), false);

  // Khi mở trọn bài (mienPhi >= số chương) thì không cắt
  const catMo = catXemTruoc(bcCoTruongLa, 2);
  assert.deepEqual(catMo.truong_moi_quen_cat, { bi_mat: "NỘI_DUNG_CHƯƠNG_SAU_LỘ_NHẦM" });

  // Guard A + B2: quét trực tiếp toàn bộ báo cáo của 5 mô-đun có cổng Sao trong kho golden thật (`mau.json.gz` + `thoi_gian_toi.json`)
  // để bảo đảm KHÔNG MỘT KHOÁ HỢP LỆ NÀO của Engine bị bỏ sót hoặc rớt mất ngoài ý muốn.
  const thuMucGolden = path.resolve(import.meta.dirname, "../../engine/fixtures/golden/dau_ra_vi");
  const mauGz = JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(thuMucGolden, "mau.json.gz"))).toString("utf8"));

  // Hàm đối chiếu hành vi cũ (Denylist) trên mẫu hợp lệ để chứng minh Allowlist v2.0 khớp 100% byte trên mọi trường hợp lệ
  const catKieuCu = (bc, mienPhi) => {
    const n = Math.max(0, Math.min(mienPhi, bc.chuong.length));
    const khoa = bc.chuong.slice(n).map((c) => ({
      ma: c.ma, tieu_de: c.tieu_de, khoa: true,
      moi_xem: c.moi_xem ?? { diem_nhan: "", cau_hoi: "Chương này nói gì về chính bạn?", so_doan: c.doan.length, phut_doc: 1 },
    }));
    const out = { ...bc, chuong: [...bc.chuong.slice(0, n), ...khoa], so_khoa: khoa.length };
    if (khoa.length) {
      const mo = new Set(bc.chuong.slice(0, n).map((c) => c.ma));
      if (Array.isArray(bc.cot_loi)) out.cot_loi = bc.cot_loi.filter((h) => typeof h.tu_chuong === "string" && mo.has(h.tu_chuong));
      if ("thoi_gian_bieu" in bc && !mo.has("cuoc_doi")) delete out.thoi_gian_bieu;
      if (Array.isArray(bc.luu_y_mang)) {
        out.luu_y_mang = bc.luu_y_mang.map((r) => typeof r.tu_chuong === "string" && mo.has(r.tu_chuong) ? r
          : { ma: r.ma, ten: r.ten, muc: r.muc, nhan_muc: r.nhan_muc, tu_chuong: r.tu_chuong, khoa: true });
      }
      if (Array.isArray(bc.nguoi_quanh)) {
        out.nguoi_quanh = bc.nguoi_quanh.map((r) => typeof r.tu_chuong === "string" && mo.has(r.tu_chuong) ? r
          : { ma: r.ma, ten: r.ten, muc: r.muc, nhan_muc: r.nhan_muc, tu_chuong: r.tu_chuong, khoa: true });
      }
      if (bc.ung_dung_co_dien && typeof bc.ung_dung_co_dien === "object") {
        const u = bc.ung_dung_co_dien;
        const canMo = u.ma === "battu_co_dien" ? "ngu_hanh" : u.ma === "tuvi_co_dien" ? "su_nghiep" : null;
        if (!canMo || !mo.has(canMo)) out.ung_dung_co_dien = { khoa: true, ma: u.ma, tieu_de: u.tieu_de, nguyen_tac_uu_tien: u.nguyen_tac_uu_tien };
      }
    }
    return out;
  };

  const tienToCoSao = ["tuvi.luan_giai", "battu.luan_giai", "thanso.ban_do", "chan_dung."];
  const demTheoNhom = Object.fromEntries(tienToCoSao.map((p) => [p, 0]));
  const kiemMau = (tenMau, obj, nhom) => {
    if (!obj || typeof obj !== "object" || !Array.isArray(obj.chuong)) return;
    if (nhom) demTheoNhom[nhom] += 1;
    for (const k of Object.keys(obj)) {
      assert.equal(
        KHOA_CONG_KHAI_SAO2.has(k) || KHOA_CAT_RIENG_SAO2.has(k),
        true,
        `Mẫu ${tenMau} sinh khoá cấp gốc mới "${k}" chưa phân loại vào KHOA_CONG_KHAI_SAO2 hoặc KHOA_CAT_RIENG_SAO2 trong sao-xem-truoc.ts!`,
      );
    }
    assert.deepEqual(catXemTruoc(obj, 1), catKieuCu(obj, 1), `Lệch hành vi trên mẫu hợp lệ ${tenMau}`);
  };

  for (const [k, raw] of Object.entries(mauGz)) {
    const nhom = tienToCoSao.find((p) => k.startsWith(p));
    if (nhom) kiemMau(k, JSON.parse(raw), nhom);
  }
  for (const [p, so] of Object.entries(demTheoNhom)) {
    assert.equal(so >= 1, true, `Thiếu mẫu kiểm chứng cho nhóm ${p}`);
  }

  // Kiểm thêm các trường có điều kiện (gio_tam, vai_doc/loi_vai_doc, và báo cáo thoi_gian_toi)
  const mauThoiGianVaDieuKien = {
    phien_ban: "doi_song_1", mo_dun: "thoi_gian_toi", nam: 2027, cac_nam: [2026, 2027], nam_toi: true,
    ngay_xem: "2026-11-26", thieu: [], gio_tam: "Chưa rõ giờ sinh…", vai_doc: "cha_me", loi_vai_doc: "Dành cho cha mẹ…",
    nguon: "Tử vi · Bát tự", trang_thai: "nhap_ai", dien_dat: "mau", ket: "Kết…",
    cot_loi: [{ tieu_de: "Mở", tu_chuong: "ba_thang" }, { tieu_de: "Khoá", tu_chuong: "muoi_hai_thang" }],
    chuong: [{ ma: "ba_thang", tieu_de: "3 tháng", doan: ["A"] }, { ma: "muoi_hai_thang", tieu_de: "12 tháng", doan: ["B"] }],
  };
  kiemMau("thoi_gian_toi_va_dieu_kien", mauThoiGianVaDieuKien, null);

  // Mẫu THẬT của engine cho mô-đun `thoi_gian` (golden dau_ra_vi chỉ lưu băm, không có nguyên văn) — `thoi-gian-toi-mau.json.gz`
  // được engine/tests/test_ky_luat_v2.py so khoá cấp gốc với đầu ra engine hiện hành (không để mẫu cũ đi).
  const thoiGianThat = JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(import.meta.dirname, "thoi-gian-toi-mau.json.gz"))).toString("utf8"));
  assert.equal(thoiGianThat.mo_dun, "thoi_gian");
  assert.equal(thoiGianThat.chuong.length >= 3, true);
  kiemMau("thoi_gian_toi.that", thoiGianThat, null);
  const catTg = catXemTruoc(thoiGianThat, 1);
  assert.equal(catTg.so_khoa, thoiGianThat.chuong.length - 1);
  assert.equal(JSON.stringify(catTg).includes(thoiGianThat.chuong[1].doan[0]), false);
});

test("SAO-2: ung_dung_co_dien có `ma` lạ (vd phongthuy_co_dien, mã mới) MẶC ĐỊNH KHOÁ — không lộ khi còn chương khoá", () => {
  const bc = {
    chuong: [
      { ma: "tong_quan", tieu_de: "Mở", doan: ["Đoạn 1"] },
      { ma: "su_nghiep", tieu_de: "Khoá", doan: ["Đoạn 2"] },
      { ma: "ngu_hanh", tieu_de: "Khoá 2", doan: ["Đoạn 3"] },
    ],
    ung_dung_co_dien: {
      ma: "phongthuy_co_dien", tieu_de: "Ứng dụng Phong thuỷ", nguyen_tac_uu_tien: "NT…",
      khu_vuc_van_9: [{ ten_phep: "BÍ_MẬT_CHI_TIẾT" }],
    },
  };
  for (const mienPhi of [1, 2]) {
    const cat = catXemTruoc(bc, mienPhi);
    assert.deepEqual(cat.ung_dung_co_dien, { khoa: true, ma: "phongthuy_co_dien", tieu_de: "Ứng dụng Phong thuỷ", nguyen_tac_uu_tien: "NT…" });
    assert.equal(JSON.stringify(cat).includes("BÍ_MẬT_CHI_TIẾT"), false);
  }
  // Mở trọn bài (không còn chương khoá) thì giữ nguyên.
  assert.deepEqual(catXemTruoc(bc, 3).ung_dung_co_dien, bc.ung_dung_co_dien);
  // Mã đã biết vẫn đi theo chương nguồn của nó.
  const bt = { chuong: bc.chuong, ung_dung_co_dien: { ...bc.ung_dung_co_dien, ma: "battu_co_dien" } };
  assert.equal((catXemTruoc(bt, 2).ung_dung_co_dien).khoa, true);          // ngu_hanh còn khoá
  assert.equal((catXemTruoc({ chuong: [bc.chuong[0], bc.chuong[2], bc.chuong[1]], ung_dung_co_dien: bt.ung_dung_co_dien }, 2).ung_dung_co_dien).khoa, undefined);
});

test("SAO-2: khoaLaBiCat liệt kê khoá cấp gốc chưa phân loại (Default-Deny im lặng → có tín hiệu để báo)", () => {
  assert.deepEqual(khoaLaBiCat({ chuong: [], mo_dun: "tuvi", cot_loi: [], ung_dung_co_dien: {} }), []);
  assert.deepEqual(khoaLaBiCat({ chuong: [], mo_dun: "tuvi", truong_moi_a: 1, truong_moi_b: { x: 1 } }).sort(), ["truong_moi_a", "truong_moi_b"]);
});

test("SAO-2: khối gỡ nút giữ phần KB chung nhưng cắt phần mượn chương khi chương còn khoá", () => {
  const goc = {
    cau_tra_loi: "…",
    go_nut_doi_song: {
      ma: "sau_do_vo", tieu_de: "Nhịp phục hồi", goc_nhin_hai_mat: "Góc nhìn chung", viec_thuc_te: ["Việc chung"],
      tu_chuong: "tinh_cam", du_kien_la_so: "Lời riêng từ chương Tình cảm", viec_la_so: ["Năm 2028: nhịp thuận"],
    },
  };
  const khoa = catLuanHoiChat(goc, { daMoToanBo: false, chuongMo: new Set(["tong_quan"]) });
  const gn = khoa.go_nut_doi_song;
  assert.equal(gn.khoa, true);
  assert.equal(gn.du_kien_la_so, undefined);
  assert.equal(gn.viec_la_so, undefined);
  assert.deepEqual(gn.viec_thuc_te, ["Việc chung"]);
  assert.ok(!JSON.stringify(khoa).includes("Lời riêng từ chương"));
  // Chương đã mở / đã mua cả báo cáo → giữ nguyên.
  assert.deepEqual(catLuanHoiChat(goc, { daMoToanBo: false, chuongMo: new Set(["tong_quan", "tinh_cam"]) }), goc);
  assert.deepEqual(catLuanHoiChat(goc, true), goc);
  // Giải oan đọc lá số (miễn phí), không mang tu_chuong → không cắt.
  const oan = { go_nut_doi_song: { ma: "go_loi_phan_doa", tieu_de: "t", goc_nhin_hai_mat: "g", viec_thuc_te: [], du_kien_la_so: "Địa Không ở Tài Bạch" } };
  assert.deepEqual(catLuanHoiChat(oan, { daMoToanBo: false, chuongMo: new Set(["tong_quan"]) }), oan);
});

test("SAO-2 (Chặng 2): Cố vấn Tam Tài cắt goi_y của nhip_12_thang, ngay_dep_30_ngay và chi tiết tam_tai_co_dien khi khoá", () => {
  const bcTamTai = {
    mo_dun: "tam_tai",
    phien_ban: "doi_song_1",
    phai: "tam_tai",
    trang_thai: "mau",
    ket: "Tham khảo văn hoá, quyết định thuộc về bạn.",
    an_toan_chan: null,
    mach: "kinh_doanh_doi_tac",
    ten_mach: "Kinh doanh, Tháng làm lớn & Đối tác",
    bac_dau_vao: 3,
    lop_da_dung: ["battu_tu_tru", "thanso", "phong_thuy", "hoang_lich"],
    goi_y_nang_bac: [],
    ket_luan_5_giay: {
      nhip: "can_bang",
      nhan_nhip: "Giữ nhịp chắc tay",
      cau_ket_luan: "Nên thử quy mô nhỏ trước khi ký dài hạn.",
      diem_tua_chinh: "Nội lực ổn định, mặt bằng hợp hướng.",
      diem_can_giu: "Không dồn quá 40% vốn lưu động.",
      ma_mau: "ds.tam_tai.kinh_doanh.can_bang",
    },
    ba_tru_tam_tai: {
      nhan: { ten_tru: "Nhân", vai_tro: "Nội lực", nhan_muc: "Thuận lợi", nhan_xet: "Sức bền tốt", hanh_dong: "Chốt tiêu chí rõ", can_cu: ["Nhật chủ Giáp Mộc"] },
      thien: { ten_tru: "Thiên", vai_tro: "Thời vận", nhan_muc: "Cân bằng", nhan_xet: "Quý tới vừa sức", hanh_dong: "Chia 2 đợt", can_cu: ["Năm cá nhân 4"] },
      dia: { ten_tru: "Địa", vai_tro: "Không gian & Đối tác", nhan_muc: "Thuận lợi", nhan_xet: "Hướng Đông Nam sinh khí", hanh_dong: "Giữ cửa thoáng", can_cu: ["Vận 9 Cửu Tử"] },
    },
    bieu_do_ngu_hanh: {
      nhat_chu: "Mộc",
      co_gio: true,
      hanh: [{ hanh: "Mộc", diem: 3, ty_le: 0.35, nhom: "Bản thân", trang_thai: "vua", cach_1: false, cach_2: false }],
    },
    nhip_12_thang: [
      { thang: "2026-12", nhip: "day_manh", nhan_nhip: "Đẩy mạnh", goi_y: "CHỈ TIẾT THÁNG 12 CẦN GIẤU KHI KHOÁ" },
      { thang: "2027-01", nhip: "phong_thu", nhan_nhip: "Phòng thủ", goi_y: "CHI TIẾT THÁNG 1 CẦN GIẤU KHI KHOÁ" },
    ],
    ngay_dep_30_ngay: [
      { ngay: "2026-12-08", am: "30/10", can_chi: "Giáp Tý", ly_do: "NGÀY ĐẸP 30 NGÀY CẦN GIẤU KHI KHOÁ" },
    ],
    ung_dung_co_dien: {
      ma: "tam_tai_co_dien",
      tieu_de: "Ứng dụng Ngũ hành & Điều hoà Vận 9",
      nguyen_tac_uu_tien: "Lấy Thủy nhuận Mộc làm gốc.",
      tom_tat_dung_than: "Dụng thần Thủy – Mộc BÍ MẬT.",
      hanh_ung_dung: [{ hanh_ma: "Thủy", ten_hanh: "Thủy", mau_sac: "Xanh đậm BÍ MẬT", chat_lieu: "Kính", phuong_vi: "Bắc", khung_gio: "21:00", thoi_quen: [] }],
    },
    chuong: [
      { ma: "tam_tai_tong_quan", tieu_de: "Bức tranh Tam Tài", doan: ["Đoạn mở miễn phí."] },
      { ma: "nhip_12_thang_va_ngay_dep", tieu_de: "Nhịp 12 tháng & Ngày đẹp", doan: ["Đoạn chương 2 bí mật."] },
      { ma: "don_bay_khong_gian_va_doi_tac", tieu_de: "Đòn bẩy Không gian & Đối tác", doan: ["Đoạn chương 3 bí mật."] },
      { ma: "ke_hoach_hanh_dong", tieu_de: "Kế hoạch hành động 30 ngày", doan: ["Đoạn chương 4 bí mật."] },
    ],
  };

  for (const k of Object.keys(bcTamTai)) {
    assert.equal(KHOA_CONG_KHAI_SAO2.has(k) || KHOA_CAT_RIENG_SAO2.has(k), true, `Thiếu khai báo khoá ${k}`);
  }

  // Khi đang khoá (mienPhi = 1): giữ ket_luan_5_giay, ba_tru_tam_tai, bieu_do_ngu_hanh; cắt goi_y, ngay_dep_30_ngay, chi tiết ung_dung_co_dien
  const catKhoa = catXemTruoc(bcTamTai, 1);
  assert.equal(catKhoa.so_khoa, 3);
  assert.deepEqual(catKhoa.ket_luan_5_giay, bcTamTai.ket_luan_5_giay);
  assert.deepEqual(catKhoa.ba_tru_tam_tai, bcTamTai.ba_tru_tam_tai);
  assert.deepEqual(catKhoa.bieu_do_ngu_hanh, bcTamTai.bieu_do_ngu_hanh);
  assert.deepEqual(catKhoa.nhip_12_thang, [
    { thang: "2026-12", nhip: "day_manh", nhan_nhip: "Đẩy mạnh", khoa: true },
    { thang: "2027-01", nhip: "phong_thu", nhan_nhip: "Phòng thủ", khoa: true },
  ]);
  assert.equal("ngay_dep_30_ngay" in catKhoa, false);
  assert.deepEqual(catKhoa.ung_dung_co_dien, {
    khoa: true,
    ma: "tam_tai_co_dien",
    tieu_de: "Ứng dụng Ngũ hành & Điều hoà Vận 9",
    nguyen_tac_uu_tien: "Lấy Thủy nhuận Mộc làm gốc.",
  });
  const rawKhoa = JSON.stringify(catKhoa);
  assert.equal(rawKhoa.includes("CẦN GIẤU KHI KHOÁ"), false);
  assert.equal(rawKhoa.includes("BÍ MẬT"), false);

  // Khi mở 2 chương đầu (có nhip_12_thang_va_ngay_dep, chưa mở don_bay_khong_gian_va_doi_tac):
  const catMo2 = catXemTruoc(bcTamTai, 2);
  assert.equal(catMo2.so_khoa, 2);
  assert.deepEqual(catMo2.nhip_12_thang, bcTamTai.nhip_12_thang);
  assert.deepEqual(catMo2.ngay_dep_30_ngay, bcTamTai.ngay_dep_30_ngay);
  assert.equal(catMo2.ung_dung_co_dien.khoa, true);

  // Khi mở trọn báo cáo (mienPhi = 4): giữ nguyên 100% dữ liệu
  const catMoHet = catXemTruoc(bcTamTai, 4);
  assert.equal(catMoHet.so_khoa, 0);
  assert.deepEqual(catMoHet.nhip_12_thang, bcTamTai.nhip_12_thang);
  assert.deepEqual(catMoHet.ngay_dep_30_ngay, bcTamTai.ngay_dep_30_ngay);
  assert.deepEqual(catMoHet.ung_dung_co_dien, bcTamTai.ung_dung_co_dien);
});
