# -*- coding: utf-8 -*-
"""Y5 (2026-10-26) — cụm "dấu hiệu nhà ở" /phong-thuy/dau-hieu/{slug}: một trang cho mỗi dấu hiệu của form Khảo sát nhà,
chỉ ghép KB (`bo_tri`, đồ thị, luật thực hành) — không vật phẩm, không điểm số, không câu nghĩa mới."""
from __future__ import annotations

from fastapi.testclient import TestClient

from app.kb import do_rieng, phongthuy_kb as kbp, trang
from app.luangiai import phongthuy_bo_cuc as bc
from app.main import app

client = TestClient(app)
CAM = ("vật phẩm phong thuỷ nên mua", "tỳ hưu", "thạch anh", "hồ lô", "chuông gió", "chấm điểm", "đại hung", "tai hoạ",
       "ung thư", "chết", "tai nạn")


def _ds():
    return [t for t in trang.danh_sach() if t["loai"] == "dau_hieu"]


def test_mot_trang_cho_moi_dau_hieu_khao_sat():
    ds = _ds()
    assert len(ds) == len(bc.DAU_HIEU) == 23
    assert len({t["slug"] for t in ds}) == 23
    assert all(t["index"] for t in ds)
    assert trang.lay("dau_hieu", "khong-co-trang-nay") is None


def test_ghep_dung_kb_va_bang_chi_phi():
    t = trang.lay("dau_hieu", "nha-ve-sinh-o-giua-nha")
    m = kbp.bo_tri("wc_giua_nha")
    van = str(t)
    assert m["noi_dung"] in van and m["giai_thich_hien_dai"] in van
    bang = next(x["bang"] for x in t["muc"] if x.get("bang"))
    assert [d[1] for d in bang["dong"]] == [v["lam"] for v in m["viec"]]
    assert bang["dong"][0][0].startswith("0 đồng")
    # veto → mục "xử lý trước"; căn hộ → luật không đập kết cấu + việc lọc theo căn hộ
    tieu = [x["tieu_de"] for x in t["muc"]]
    assert "Vì sao xếp vào nhóm nên xử lý trước" in tieu and "Nếu bạn ở chung cư" in tieu
    assert any("kết cấu" in s for x in t["muc"] if x["tieu_de"] == "Nếu bạn ở chung cư" for s in x["danh_sach"])
    assert t["minh_hoa"] == {"kieu": "dau_hieu", "nhom": "trong_nha", "phong": ["Nhà vệ sinh"], "veto": True, "tot": False,
                             "ten": "Nhà vệ sinh ở giữa nhà"}


def test_dau_hieu_tot_khong_hoi_co_sao_khong():
    t = trang.lay("dau_hieu", "minh-duong")
    assert "có sao không" not in t["tieu_de"] and t["hoi_dap"][0]["hoi"].endswith("có tốt không?")
    assert t["minh_hoa"]["tot"] is True


def test_seo_va_khong_doa():
    for m in _ds():
        t = trang.lay("dau_hieu", m["slug"])
        assert len(t["tieu_de"]) <= 70 and 50 <= len(t["mo_ta"]) <= 160
        assert t["tra_loi_nhanh"] and all(h["hoi"].endswith("?") for h in t["hoi_dap"])
        assert any(x["duong"] == "/phong-thuy#khao-sat-nha" for x in t["lien_ket_ngoai"])
        low = str({k: t[k] for k in ("tieu_de", "tra_loi_nhanh", "muc", "hoi_dap")}).lower()
        for c in CAM:
            assert c not in low, (m["slug"], c)
        assert do_rieng.ty_le()[("dau_hieu", m["slug"])] >= do_rieng.NGUONG


def test_route_va_duong_dan_lien_quan():
    r = client.get("/v1/kb/trang/dau_hieu/guong-doi-dien-giuong")
    assert r.status_code == 200
    t = r.json()
    assert t["lien_quan"] and all(x["loai"] == "dau_hieu" and x["tieu_de"] for x in t["lien_quan"])
    assert client.get("/v1/kb/trang/dau_hieu/abc").status_code == 404
