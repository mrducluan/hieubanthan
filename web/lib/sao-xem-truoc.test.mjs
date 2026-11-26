import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import zlib from "node:zlib";
import {
  CAU_MAU_MIEN_PHI,
  KHOA_CAT_RIENG_SAO2,
  KHOA_CONG_KHAI_SAO2,
  boTinhTrangKhoa,
  catLuanHoiChat,
  catXemTruoc,
  taoKhoaGiaoDichLuanGiai,
  xetQuyenDocHoi,
} from "./sao-xem-truoc.ts";

test("catXemTruoc: Allowlist mặc định khoá — cắt sạch khoá cấp gốc lạ khi so_khoa > 0 (Guard B)", () => {
  const bcDay = {
    mo_dun: "battu",
    phien_ban: "doi_song_1",
    ket: "Lời kết",
    bi_mat_chuong_sau_chua_khai_bao: "Nội dung nhạy cảm rò rỉ nếu dùng Denylist!",
    ung_dung_co_dien: {
      ma: "battu_co_dien",
      tieu_de: "Đối chiếu Học thuật Cổ điển",
      nguyen_tac_uu_tien: "Nguyên tắc...",
      diem_hoc_thuat: [{ nhan: "Cách cục", noi_dung: "Thực Thần" }],
    },
    chuong: [
      { ma: "tong_quan", tieu_de: "Chương 1", doan: ["A"] },
      { ma: "ngu_hanh", tieu_de: "Chương 2", doan: ["B"] },
    ],
  };

  const xemTruoc = catXemTruoc(bcDay, 1);
  assert.equal(xemTruoc.so_khoa, 1);
  assert.equal("bi_mat_chuong_sau_chua_khai_bao" in xemTruoc, false, "Khoá lạ phải bị Allowlist chặn sạch!");
  assert.deepEqual(xemTruoc.ung_dung_co_dien, {
    khoa: true,
    ma: "battu_co_dien",
    tieu_de: "Đối chiếu Học thuật Cổ điển",
    nguyen_tac_uu_tien: "Nguyên tắc...",
  });
  assert.equal("diem_hoc_thuat" in xemTruoc.ung_dung_co_dien, false);
  assert.equal("sach" in xemTruoc.ung_dung_co_dien, false);

  // Mở đủ chương -> giữ trọn
  const moHet = catXemTruoc(bcDay, 2);
  assert.equal(moHet.so_khoa, 0);
  assert.deepEqual(moHet.ung_dung_co_dien.diem_hoc_thuat, bcDay.ung_dung_co_dien.diem_hoc_thuat);
});

test("catXemTruoc: Guard A — mọi mẫu báo cáo thật trong mau.json.gz đều nằm trọn trong tập khoá SAO-2", () => {
  const thuMucGolden = path.resolve(import.meta.dirname, "../../engine/fixtures/golden/dau_ra_vi");
  const mauGz = JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(thuMucGolden, "mau.json.gz"))).toString("utf8"));
  const tienToCoSao = ["tuvi.luan_giai", "battu.luan_giai", "thanso.ban_do", "chan_dung."];
  let dem = 0;
  for (const [k, raw] of Object.entries(mauGz)) {
    if (!tienToCoSao.some((p) => k.startsWith(p))) continue;
    const obj = JSON.parse(raw);
    if (!obj || typeof obj !== "object" || !Array.isArray(obj.chuong)) continue;
    dem += 1;
    for (const key of Object.keys(obj)) {
      assert.equal(
        KHOA_CONG_KHAI_SAO2.has(key) || KHOA_CAT_RIENG_SAO2.has(key),
        true,
        `Mẫu ${k} sinh khoá cấp gốc "${key}" chưa khai báo trong sao-xem-truoc.ts`,
      );
    }
  }
  assert.equal(dem >= 4, true);
});

test("catLuanHoiChat: khoá các câu thuộc chương trả phí nhưng giữ câu mẫu miễn phí D1 và chương được mở", () => {
  const mauTraPhi = {
    cau_tra_loi: "Đoạn trả lời chung",
    luan_hoi: {
      ma: "ben",
      cau: "Tôi một đời vợ chồng hay dễ dang dở?",
      tra_loi: "Nội dung chi tiết trả phí",
      giai_thich: "Giải thích trả phí",
      nhan: "mot_moi_ben",
      sac: "thuan",
      ma_mau: "ds.tinh_cam.hoi.ben.mot_moi_ben",
      phai: "nam_phai_viet",
      chuong: "tinh_cam",
      ten_chuong: "Tình yêu & hôn nhân",
    },
    doi_song_lien_ket: {
      chuong: "suc_khoe",
      ten_chuong: "Sức khoẻ",
      tieu_de_hop: "Hộp trả phí",
      ma_mau: "ds.suc_khoe.luu_y.1",
      phai: "nam_phai_viet",
    },
  };

  const biKhoa = catLuanHoiChat(mauTraPhi, { daMoToanBo: false, chuongMo: new Set(["tong_quan"]) });
  assert.equal(biKhoa.luan_hoi.khoa, true);
  assert.equal("tra_loi" in biKhoa.luan_hoi, false);
  assert.equal("ma_mau" in biKhoa.luan_hoi, false);
  assert.equal(biKhoa.doi_song_lien_ket.khoa, true);

  const cauMauD1 = {
    luan_hoi: {
      ma: CAU_MAU_MIEN_PHI.ma,
      cau: "Tôi hợp nghề gì?",
      tra_loi: "Bạn hợp nghề chuyên môn",
      nhan: "chuyen_mon",
      sac: "thuan",
      ma_mau: "ds.su_nghiep.hoi.nghe_hop.chuyen_mon",
      phai: "nam_phai_viet",
      chuong: CAU_MAU_MIEN_PHI.chuong,
      ten_chuong: "Công việc",
    },
  };
  const kqD1 = catLuanHoiChat(cauMauD1, false);
  assert.equal(kqD1.luan_hoi.tra_loi, "Bạn hợp nghề chuyên môn");
});

test("boTinhTrangKhoa & xetQuyenDocHoi khớp từng byte khoá giao dịch", () => {
  const coTt = { la_so: { birth_date: "1990-05-15", birth_time: "08:30", gender: "nam", tinh_trang: "co_doi" } };
  const khongTt = { la_so: { birth_date: "1990-05-15", birth_time: "08:30", gender: "nam" } };
  assert.equal(
    taoKhoaGiaoDichLuanGiai("secret", "tuvi", boTinhTrangKhoa(coTt), "2026-11-26"),
    taoKhoaGiaoDichLuanGiai("secret", "tuvi", boTinhTrangKhoa(khongTt), "2026-11-26"),
  );
  assert.equal(
    xetQuyenDocHoi({
      coLaSo: true, mienPhiAnh: false, thuSaoBat: true, coPhien: true,
      chuSoHuu: false, hoiVien: true, coBiMat: true, daMoHomNay: false, moDun: "tuvi", soChuongMo: 1,
    }).daMoToanBo,
    true,
  );
});
