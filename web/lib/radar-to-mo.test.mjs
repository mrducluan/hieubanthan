import test from "node:test";
import assert from "node:assert/strict";
import { duongTriThucKb, gomRadarToMo, phanMachToMo, tongKetMigrationHoc } from "./radar-to-mo.ts";

test("phân đúng 8 mạch tò mò đời sống và gắn link tệp KB chuẩn không đuôi .json", () => {
  assert.equal(phanMachToMo("Tháng mấy năm sau hùn vốn mở quán cà phê với bạn được?", "battu"), "kinh_doanh_doi_tac");
  assert.equal(phanMachToMo("Sau ly hôn bao giờ tôi mới mở lòng gặp người phù hợp?", "tuvi"), "tinh_duyen_ly_hon");
  assert.equal(phanMachToMo("Dạo này hai vợ chồng hay khắc khẩu cãi nhau chuyện con cái", "tuvi"), "gia_dao_con_cai");
  assert.equal(phanMachToMo("Làm sao giữ tiền không bị hao tài mỗi cuối năm?", "battu"), "tai_loc_giu_tien");
  assert.equal(phanMachToMo("Em nên nhảy việc hay chờ đợt xét thăng chức?", "tuvi"), "hoc_hanh_thang_tien");
  assert.equal(phanMachToMo("Năm 2027 gặp sao Thái Bạch và Tam tai cần lưu ý gì?", "tuvi"), "van_han_hoa_giai");
  assert.equal(phanMachToMo("Thầy bảo mệnh Vô Chính Diệu và bếp đặt hướng Tây có sao không?", "phongthuy"), "nha_cua_kiem_chung");
  assert.equal(phanMachToMo("Năm 2027 ba tháng đầu năm của mình thế nào?", "thanso"), "tuong_lai_nhip_thang");
  assert.equal(duongTriThucKb("tuvi_luan_hoi_kb.json"), "/quan-tri/tri-thuc/tuvi_luan_hoi_kb");
});

test("gom cụm radar sắp xếp theo số lượng câu chưa phủ và đếm đúng lượt không hữu ích", () => {
  const ds = [
    { id: "1", mo_dun: "battu", cau_hoi: "Góp vốn mở xưởng với co-founder cần chú ý gì?", huu_ich: false },
    { id: "2", mo_dun: "tuvi", cau_hoi: "Khai trương cửa hàng tháng nào thuận?", huu_ich: null },
    { id: "3", mo_dun: "tuvi", cau_hoi: "Sau ly dị bao giờ có duyên mới?", huu_ich: false },
  ];
  const kq = gomRadarToMo(ds);
  assert.equal(kq.length, 2);
  assert.equal(kq[0].ma, "kinh_doanh_doi_tac");
  assert.equal(kq[0].so_cau, 2);
  assert.equal(kq[0].so_khong_huu_ich, 1);
  assert.equal(kq[0].tep_kb[0].duong, "/quan-tri/tri-thuc/doanh_chu_quan_ly_kb");
});

test("tổng kết sức khỏe 8 migration trục tự học", () => {
  assert.deepEqual(tongKetMigrationHoc(null), { doc_duoc: false, da_chay: [], con_thieu: [] });
  const map = new Map([
    ["0011", true], ["0016", true], ["0017", true], ["0018", true],
    ["0022", false], ["0031", true], ["0032", true], ["0034", false],
  ]);
  const tk = tongKetMigrationHoc(map);
  assert.equal(tk.doc_duoc, true);
  assert.equal(tk.da_chay.length, 6);
  assert.deepEqual(tk.con_thieu.map((x) => x.so), ["0022", "0034"]);
});
