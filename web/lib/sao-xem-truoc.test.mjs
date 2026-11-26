import test from "node:test";
import assert from "node:assert/strict";
import { LaSoVao } from "./la-so-vao.ts";
import { boTinhTrangKhoa, catLuanHoiChat, catXemTruoc, taoKhoaGiaoDichLuanGiai, xetQuyenDocHoi } from "./sao-xem-truoc.ts";

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
