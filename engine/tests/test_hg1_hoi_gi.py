# -*- coding: utf-8 -*-
"""HG-1 — "Hỏi gì xem nấy": câu trả lời riêng dựng ở engine từ phép tính có sẵn (trước đây chữ nằm cứng trong web)."""
import json
import re

import pytest
from fastapi.testclient import TestClient

from app import ngon_ngu
from app.calc import phongthuy as pt
from app.calc import tuoi_dan_gian as tdg
from app.kb import nap
from app.luangiai import phongthuy_bo_cuc as bc
from app.luangiai import phongthuy_cung_chi_tiet as ct
from app.luangiai import phongthuy_hoi_gi as hg
from app.main import app

client = TestClient(app)
P = "/v1/phongthuy/hoi-gi"
SINH = {"birth_date": "1988-10-24", "gender": "nam"}
EN = {"x-ngon-ngu": "en"}
VIET = re.compile(r"[ăâđêôơưĂÂĐÊÔƠƯáàảãạấầẩẫậắằẳẵặéèẻẽẹếềểễệíìỉĩịóòỏõọốồổỗộớờởỡợúùủũụứừửữựýỳỷỹỵ]")


def _hoi(ma, headers=None, **them):
    r = client.post(P, json={"ma": ma, **them}, headers=headers or {})
    assert r.status_code == 200, r.text
    return r.json()


def _chu(x) -> str:
    return json.dumps(x, ensure_ascii=False)


def test_danh_muc_du_sau_cau_dung_thu_tu():
    d = client.get(P).json()
    assert [c["ma"] for c in d["cau_hoi"]] == list(hg.MA)
    assert all(c["tieu_de"].endswith("?") and c["cau_chat"] for c in d["cau_hoi"])
    assert d["source_id"] and d["school_id"]


def test_veto_trong_module_khop_kb():
    assert set(hg.THU_TU_VETO) == bc.dau_hieu_veto()


def test_cua_chinh_thieu_gi_noi_do_khong_doan():
    d = _hoi("cua_chinh")
    assert d["rieng"] is False and [t["ma"] for t in d["thieu"]] == ["huong", "sinh"] and d["muc"] is None
    d = _hoi("cua_chinh", nha={"huong_do": 183.2})
    assert [t["ma"] for t in d["thieu"]] == ["sinh"] and "Nam" in d["tra_loi"] and d["da_tinh"]["toa"] == "Bắc"
    # không có năm xây → không lập bàn sao, không tự đặt năm (lỗi cũ: web tự ghi 2024)
    d = _hoi("cua_chinh", nha={"huong_do": 183.2}, sinh=SINH)
    assert "van" not in d["da_tinh"] and not any("vận" in x for x in d["vi_sao"])


def test_cua_chinh_khop_phep_tinh_bat_trach():
    for do in (3, 48, 92, 137, 183.2, 226, 271, 318):
        d = _hoi("cua_chinh", nha={"huong_do": do}, sinh=SINH)
        huong = pt.huong_tu_do(do)
        dn = pt.du_nien("Chấn", huong)                         # nam 1988 → Chấn
        assert d["rieng"] is True and d["da_tinh"]["du_nien"] == dn["du_nien"] and d["da_tinh"]["hop"] is dn["cat"]
        assert d["muc"] == ("thuan" if dn["du_nien"] in ("Sinh Khí", "Diên Niên", "Thiên Y") else "can_bang" if dn["du_nien"] == "Phục Vị" else "can_chu_dong")
        assert ("không nằm trong bốn hướng hợp" in d["tra_loi"]) == (not dn["cat"])
    d = _hoi("cua_chinh", nha={"huong_do": 183.2, "nam_xay": 2010}, sinh=SINH)
    assert d["da_tinh"]["van"] == 8 and any("vận 8" in x for x in d["vi_sao"])


def test_cua_chinh_dau_hieu_lon_la_tran_can_bang():
    nha = {"huong_do": 183.2, "bo_cuc": {"dau_hieu": {"wc_giua_nha": {"co": True}}}}
    d = _hoi("cua_chinh", nha=nha, sinh=SINH)
    assert d["muc"] == "can_bang" and any(y["nhan"] == "tran" for y in d["y"])
    # dấu hiệu từ ảnh CHƯA xác nhận không được tính
    nha["bo_cuc"]["dau_hieu"]["wc_giua_nha"] = {"co": True, "nguon": "anh", "do_tin": 0.9}
    assert _hoi("cua_chinh", nha=nha, sinh=SINH)["muc"] == "thuan"


def test_bo_cuc_hoi_nhanh_roi_tra_loi():
    d = _hoi("bo_cuc")
    assert [h["ma"] for h in d["hoi_nhanh"]] == list(hg.THU_TU_VETO) and d["thieu"][0]["ma"] == "dau_hieu" and not d["rieng"]
    khong = {m: {"co": False} for m in hg.THU_TU_VETO}
    d = _hoi("bo_cuc", nha={"bo_cuc": {"dau_hieu": khong}})
    assert d["rieng"] and d["muc"] is None and not d["thieu"] and "đều không có" in d["tra_loi"] and d["diem"] == []
    d = _hoi("bo_cuc", nha={"loai_nha": "can_ho", "bo_cuc": {"dau_hieu": {**khong, "wc_giua_nha": {"co": True}, "bep_doi_cua": {"co": True}}}})
    assert d["muc"] == "can_bang" and [x["ma"] for x in d["diem"]] == ["wc_giua_nha", "bep_doi_cua"]
    assert d["diem"][0]["nen_xu_ly_truoc"] and d["diem"][0]["trang"].startswith("/phong-thuy/dau-hieu/")
    assert len(d["viec"]) == 2 and all(":" in v for v in d["viec"])
    # mới trả lời một phần → nói rõ còn thiếu
    d = _hoi("bo_cuc", nha={"bo_cuc": {"dau_hieu": {"duong_dam": {"co": False}}}})
    assert d["thieu"] and "1 / 4" in d["tra_loi"]


def test_gia_dinh_khop_cong_cu_hai_cung():
    assert [t["ma"] for t in _hoi("gia_dinh")["thieu"]] == ["sinh", "nguoi_2"]
    assert [t["ma"] for t in _hoi("gia_dinh", sinh=SINH)["thieu"]] == ["nguoi_2"]
    d = _hoi("gia_dinh", sinh=SINH, nguoi_2={"nam": 1990, "gioi_tinh": "nu"})
    goc = ct.hai_cung(1988, "nam", 1990, "nu")
    assert d["tra_loi"] == goc["loi"] and d["hai_nguoi"]["huong_chung"] == goc["huong_chung"] and len(d["hai_nguoi"]["huong"]) == 8
    # người sinh trước Lập xuân: dùng năm đã xét mốc (một bộ tính với mệnh quái)
    d = _hoi("gia_dinh", sinh={"birth_date": "1989-01-20", "gender": "nam"}, nguoi_2={"nam": 1990, "gioi_tinh": "nu"})
    assert d["tra_loi"] == goc["loi"]


def test_han_nam_khop_phep_tinh_nam_va_khong_can_dau_vao():
    d = _hoi("han_nam", ngay_xem="2027-03-01")
    hn = tdg.han_nam(2027)
    assert d["rieng"] and d["muc"] is None and not d["thieu"]
    assert hn["ngu_hoang"]["phuong"] in d["tra_loi"] and hn["nhi_hac"]["phuong"] in d["tra_loi"]
    o = {x["phuong"]: x for x in d["luoi_nam"]["o"]}
    assert len(o) == 9 and o[hn["ngu_hoang"]["phuong"]]["sao"] == 5 and o[hn["ngu_hoang"]["phuong"]]["nhan"]
    assert d["lien_ket"][0]["duong"] == "/phong-thuy/huong-xau-nam/2027"
    # trước Lập xuân vẫn là năm trước
    assert _hoi("han_nam", ngay_xem="2027-01-20")["luoi_nam"]["nam"] == 2026
    # có vị trí phòng + năm sinh → nói thêm phòng ở phía đó và tuổi làm nhà
    d = _hoi("han_nam", ngay_xem="2027-03-01", sinh=SINH, nha={"bo_cuc": {"vi_tri": {"bep": hn["ngu_hoang"]["phuong"]}}})
    nhan = [y["nhan"] for y in d["y"]]
    assert "phong" in nhan and "tuoi" in nhan
    for nam in range(2024, 2036):                                 # năm sao 5 hoặc 2 đóng giữa nhà không được hỏng câu
        r = _hoi("han_nam", ngay_xem=f"{nam}-06-01")
        assert "{" not in r["tra_loi"] and "Giữa nhà" not in r["tra_loi"].replace("giữa nhà", "")


def test_hai_cau_dan_loi_co_lien_ket_trong_site():
    for ma in ("so_sanh", "mo_quan"):
        d = _hoi(ma)
        assert d["tra_loi"] and d["viec"] and d["lien_ket"] and d["muc"] is None
    assert _hoi("mo_quan")["lien_ket"][0]["duong"] == "/doanh-chu"


def test_moi_lien_ket_chi_trong_site_hoac_neo_co_dinh():
    k = nap.doc(hg.TEP)
    for c in k["cau_hoi"].values():
        for x in c["lien_ket"]:
            assert x.get("duong", "/").startswith("/") and "//" not in x.get("duong", "")
            assert ("neo" in x) != ("duong" in x) and x.get("neo", "do-huong") in hg.NEO


def test_giong_van_khong_doa_khong_hua_khong_ten_noi_bo():
    cam = ["phạm lỗi", "xấu", "hung", "kỵ", "sát khí", "tài khí", "vượng tài", "hoá giải", "hóa giải", "veto", "engine", "api",
           "chắc chắn", "đại kỵ", "tai hoạ", "dealbreaker"]
    k = nap.doc(hg.TEP)
    loi: list[str] = []

    def gom(x, khoa=""):
        if isinstance(x, dict):
            for kk, v in x.items():
                if kk not in ("neo", "duong", "can", "ma"):
                    gom(v, kk)
        elif isinstance(x, list):
            for v in x:
                gom(v, khoa)
        elif isinstance(x, str):
            loi.append(x)
    gom({kk: k[kk] for kk in ("cau_hoi", "mau", "thieu", "luu_y")})
    chu = " ".join(loi).lower()
    chu_cai = "a-zà-ỹđ"
    for c in cam:
        assert not re.search(rf"(?<![{chu_cai}]){re.escape(c)}(?![{chu_cai}])", chu), c
    assert not re.search(r"\.py|hbt\.|/api/|[a-z]_[a-z]", re.sub(r"\{[a-z0-9_]+\}", "", chu))     # tên tệp, khoá lưu trữ, mã nội bộ


def test_ban_anh_khong_con_chu_viet_va_cung_cau_truc():
    with ngon_ngu.dung("en"):
        en = nap.doc(hg.TEP)
    vi = nap.doc(hg.TEP)
    assert set(en["mau"]) == set(vi["mau"])
    for ma in hg.MA:
        d = _hoi(ma, EN, nha={"huong_do": 300, "nam_xay": 2010, "bo_cuc": {"dau_hieu": {"wc_giua_nha": {"co": True}}}}, sinh=SINH,
                 nguoi_2={"nam": 1990, "gioi_tinh": "nu"}, ngay_xem="2027-03-01")
        chu = _chu({k: d[k] for k in ("tieu_de", "tra_loi", "viec", "nguon", "cau_chat", "thieu", "luu_y")} | {"lk": [x["nhan"] for x in d["lien_ket"]]})
        assert not VIET.search(chu), (ma, VIET.search(chu).group(0), chu[:300])
    assert not re.search(r"\{[a-z_0-9]+\}", _chu(client.get(P, headers=EN).json()))


def test_422_va_dau_ra_khong_mang_ngay_sinh():
    assert client.post(P, json={"ma": "la"}).status_code == 422
    assert client.post(P, json={"ma": "cua_chinh", "them": 1}).status_code == 422
    assert client.post(P, json={"ma": "cua_chinh", "nha": {"huong_do": 360}}).status_code == 422
    d = _hoi("han_nam", sinh=SINH, ngay_xem="2027-03-01")
    assert "1988-10-24" not in _chu(d) and "birth_date" not in _chu(d)
