# -*- coding: utf-8 -*-
"""AUD-Q2 (chủ dự án 2026-11-03): gộp 46 trang "tuổi X hợp hướng nào" thành 8 trang theo CUNG PHI (mệnh quái) +
mục lục năm sinh. Cung phi lặp 9 năm → các trang năm gần trùng (146/1.035 cặp Jaccard > 0,6); trang cung có dữ kiện
riêng thật (hướng, du niên, danh sách năm sinh). Không phép tính mới: đúng `pt.menh_quai` / `pt.bang_huong`."""
from fastapi.testclient import TestClient

from app.calc import phongthuy as pt
from app.luangiai import phongthuy_tuoi as pt_tuoi
from app.main import app

client = TestClient(app)


def test_tam_cung_slug_khong_trung():
    ds = pt_tuoi.danh_sach_cung()
    assert [c["quai"] for c in ds] == ["Khảm", "Khôn", "Chấn", "Tốn", "Càn", "Đoài", "Cấn", "Ly"]
    assert len({c["slug"] for c in ds}) == 8
    assert pt_tuoi.cung_tu_slug("cung-can-tay-bac") == "Càn" and pt_tuoi.cung_tu_slug("cung-can-dong-bac") == "Cấn"
    assert pt_tuoi.cung_tu_slug("cung-xyz") is None


def test_cung_kham_huong_va_nam_sinh():
    c = pt_tuoi.cung_phi("cung-kham-bac")
    assert c["quai"] == "Khảm" and c["nhom"] == "Đông tứ mệnh" and c["so"] == 1
    bang = pt.bang_huong("Khảm")
    assert [h["huong"] for h in c["huong_tot"]] == [next(k for k, v in bang.items() if v == d) for d in pt_tuoi.THU_TU_CAT]
    # mọi năm sinh trong danh sách có đúng cung này, và không sót năm nào
    for x in c["nam_sinh"]:
        assert pt.menh_quai(x["nam"], x["gioi_tinh"])["quai"] == "Khảm"
    du = {(n, g) for n in range(1960, 2006) for g in ("nam", "nu") if pt.menh_quai(n, g)["quai"] == "Khảm"}
    assert {(x["nam"], x["gioi_tinh"]) for x in c["nam_sinh"]} == du
    assert (1990, "nam") in du
    # câu trả lời nhanh tự đứng: nêu tên cung, nhóm, hướng tốt nhất và ví dụ năm sinh
    tl = c["tra_loi_nhanh"]
    assert tl.startswith("Cung phi Khảm") and "Đông tứ mệnh" in tl and c["huong_tot"][0]["huong"] in tl and "1990" in tl
    assert "Lập xuân" in tl
    assert {x["slug"] for x in c["cung_cung_nhom"]} == {"cung-ly-nam", "cung-chan-dong", "cung-ton-dong-nam"}


def test_cung_5_va_trang_khac_nhau():
    # mệnh quái số 5: nam → Khôn, nữ → Cấn (đúng quy ước hiện có)
    kh, ca = pt_tuoi.cung_phi("cung-khon-tay-nam"), pt_tuoi.cung_phi("cung-can-dong-bac")
    assert any(x["gioi_tinh"] == "nam" for x in kh["nam_sinh"]) and any(x["gioi_tinh"] == "nu" for x in ca["nam_sinh"])
    assert kh["tra_loi_nhanh"] != ca["tra_loi_nhanh"] and kh["hoi_dap"][0]["dap"] != ca["hoi_dap"][0]["dap"]


def test_muc_luc_tuoi_46_nam():
    ml = pt_tuoi.muc_luc_tuoi()
    assert [x["nam"] for x in ml] == list(range(1960, 2006))
    r = next(x for x in ml if x["nam"] == 1990)
    assert r["nam_gioi"]["quai"] == "Khảm" and r["nu_gioi"]["quai"] == "Cấn"
    assert r["nam_gioi"]["slug"] == "cung-kham-bac" and r["nu_gioi"]["slug"] == "cung-can-dong-bac"
    assert r["lap_xuan"].startswith("1990-02-0") and r["can_chi"] == "Canh Ngọ"


def test_api_cung_phi():
    r = client.get("/v1/phongthuy/cung-phi")
    assert r.status_code == 200 and len(r.json()["cung"]) == 8 and len(r.json()["tuoi"]) == 46
    r = client.get("/v1/phongthuy/cung-phi/cung-ly-nam")
    assert r.status_code == 200 and r.json()["quai"] == "Ly"
    assert client.get("/v1/phongthuy/cung-phi/cung-abc").status_code == 404


def test_trang_menh_tro_toi_cung():
    from app.kb import trang_menh
    t = trang_menh.trang_menh_nam(1990, "sinh-nam-1990-menh-gi")
    duong = [x["duong"] for x in t.get("lien_ket_ngoai", [])]
    assert "/phong-thuy/huong-hop-tuoi/cung-kham-bac" in duong and "/phong-thuy/huong-hop-tuoi/cung-can-dong-bac" in duong
    assert not any("/tuoi-1990" in d for d in duong)
