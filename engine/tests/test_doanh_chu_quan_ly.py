# -*- coding: utf-8 -*-
"""QLNS-1 — phần quản lý của Bản đồ đội ngũ: kế hoạch 30 ngày, tình huống đúng với nhóm, câu hỏi 1-1, bản cá nhân."""
from __future__ import annotations

import json
import re
from pathlib import Path

from fastapi.testclient import TestClient

from app import ngon_ngu
from app.calc import doanh_chu
from app.kb import sach_ghi as sg, tuvi_doi_song_kb as kds
from app.luangiai import doanh_chu_quan_ly as ql
from app.main import app

_C = TestClient(app)
_VIET = re.compile(r"[ăâđêôơưàáạảãầấậẩẫằắặẳẵèéẹẻẽềếệểễìíịỉĩòóọỏõồốộổỗờớợởỡùúụủũừứựửữỳýỵỷỹ]", re.I)
_DATA = Path(__file__).resolve().parents[1] / "app" / "kb" / "data"

_PAYLOAD = {
    "ong_chu": {"ten": "Anh Minh", "vai_tro": "CEO", "ngay": 15, "thang": 5, "nam": 1986, "gioi_tinh": "nam", "dong_y_tu_nguyen": True},
    "doi_ngu": [
        {"ten": "Chị Lan", "vai_tro": "COO", "ngay": 8, "thang": 11, "nam": 1989, "gioi_tinh": "nu", "dong_y_tu_nguyen": True},
        {"ten": "Anh Hùng", "vai_tro": "CFO", "ngay": 22, "thang": 3, "nam": 1992, "gioi_tinh": "nam", "dong_y_tu_nguyen": True},
        {"ten": "Bạn Trang", "vai_tro": "Sales", "ngay": 19, "thang": 8, "nam": 1995, "gioi_tinh": "nu", "dong_y_tu_nguyen": True},
    ],
    "nam_xem": 2027,
    "cam_ket_thoa_thuan": True,
}

# Từ ngữ đưa công cụ thành "đánh giá nhân viên" (Bộ luật Lao động — cấm phân biệt đối xử; CY-1, DC-1).
_CAM = ("sa thải", "nhảy việc", "nghỉ việc", "tuyển", "loại hồ sơ", "sàng lọc", "chấm điểm", "xếp lương", "kỷ luật",
        "đánh giá năng lực", "fire ", "quit", "hiring", "dismiss", "performance review")


def _chuoi(x):
    if isinstance(x, str):
        yield x
    elif isinstance(x, dict):
        for k, v in x.items():
            if k not in ("ten", "ai", "ma"):
                yield from _chuoi(v)
    elif isinstance(x, list):
        for v in x:
            yield from _chuoi(v)


def _kq(lang: str = "vi") -> dict:
    doi = _PAYLOAD["doi_ngu"] if lang == "vi" else [{**t, "ten": f"Member {i}"} for i, t in enumerate(_PAYLOAD["doi_ngu"])]
    with ngon_ngu.dung(lang):
        kq = doanh_chu.ban_do_doi_ngu(_PAYLOAD["ong_chu"], doi, nam_xem=2027)
        return ql.lam_giau(kq)


def _phan_moi(kq: dict) -> dict:
    return {"ke_hoach": kq["ke_hoach_30_ngay"], "tinh_huong": kq["tinh_huong"],
            "hoi": [n["cau_hoi_1_1"] for n in kq["ma_tran_phoi_hop"]]}


def test_api_doi_ngu_co_phan_quan_ly():
    r = _C.post("/v1/doanh-chu/doi-ngu", json=_PAYLOAD)
    assert r.status_code == 200, r.text
    d = r.json()
    kh = d["ke_hoach_30_ngay"]
    assert 3 <= len(kh) <= 5
    assert kh[0]["ma"].startswith("bu_truc.") and kh[-1]["ma"] == "mot_mot"
    for v in kh:
        assert v["tieu_de"] and v["viec"] and v["vi_sao"]
    assert 1 <= len(d["tinh_huong"]) <= 3
    for t in d["tinh_huong"]:
        assert t["van_de"] and t["mo_loi"] and t["viec"]
        assert "{" not in t["goc_nhin"] + t["mo_loi"], "Còn biến chưa thay"
    for n in d["ma_tran_phoi_hop"]:
        assert len(n["cau_hoi_1_1"]) == 2


def test_loi_moi_sach_giong_va_khong_tu_vung_danh_gia():
    cam, cum = kds.cum_cam(), kds.cum_chung_chung()
    van = []
    for s in _chuoi(_phan_moi(_kq())):
        assert not sg.kiem_loi(s), s
        assert not kds.tim_cum_cam(s, cam), (s, kds.tim_cum_cam(s, cam))
        assert not kds.tim_cum_cam(s, cum), (s, kds.tim_cum_cam(s, cum))
        van.append(s.lower())
    ca = ql.ca_nhan(19, 8, 1995, "nu", 2027)
    van += [s.lower() for s in _chuoi(ca)]
    van += [s.lower() for s in _chuoi(ql.danh_muc()["tinh_huong"])]
    toan = " ".join(van)
    for tu in _CAM:
        assert tu not in toan, f"Từ vựng đánh giá nhân viên: {tu}"


def test_ban_tieng_anh_khong_lot_chu_viet():
    for s in _chuoi(_phan_moi(_kq("en"))):
        assert not _VIET.search(s), s
    for v in _kq("en")["ke_hoach_30_ngay"]:
        assert not _VIET.search(v["ma"]), v["ma"]
    with ngon_ngu.dung("en"):
        for s in _chuoi(ql.ca_nhan(19, 8, 1995, "nu", 2027)):
            assert not _VIET.search(s), s
        for s in _chuoi(ql.danh_muc()):
            assert not _VIET.search(s), s


def test_ban_phu_tieng_anh_du_khoa():
    vi = json.loads((_DATA / "doanh_chu_quan_ly_kb.json").read_text("utf-8"))
    en = json.loads((_DATA / "en" / "doanh_chu_quan_ly_kb.json").read_text("utf-8"))

    def khoa(d, p=""):
        out = set()
        for k, v in d.items():
            if k.startswith("_") or k in ("source_id", "school_id"):
                continue
            out |= khoa(v, f"{p}.{k}") if isinstance(v, dict) else {f"{p}.{k}"}
        return out
    assert khoa(vi) == khoa(en)


def _gia(thanh_vien, troi="Thổ", thieu="Hỏa", dd_chu=4, hanh_bu="Kim"):
    return {
        "can_bang_ngu_hanh": {"hanh_troi": troi, "hanh_thieu": thieu},
        "ong_chu": {"duong_doi": dd_chu, "hanh_can_bu": hanh_bu},
        "goi_y_ghep_cap": [],
        "ma_tran_phoi_hop": [
            {"ten": t, "muc_phoi_hop": m, "chi_so": {"hanh_manh": h, "duong_doi": dd, "nam_ca_nhan": (0, ncn),
                                                      "bu_khuyet_ngu_hanh": False}}
            for t, h, dd, ncn, m in thanh_vien
        ],
    }


def test_luat_chon_tinh_huong():
    with ngon_ngu.dung("vi"):
        # cặp cần quy ước + người tự quyết → phản biện căng; Mộc + Kim → hai trục va chạm
        kq = _gia([("A", "Mộc", 8, 4, "can_quy_che_ro"), ("B", "Kim", 4, 4, "bo_tro_tot")])
        ma = [t["ma"] for t in ql.tinh_huong(kq)]
        assert ma[:2] == ["phan_bien_cang", "hai_truc_va_cham"]
        assert ql.tinh_huong(kq)[1]["ai"] == ["A", "B"]
        # nhóm trội Hỏa, mỏng Thổ → bán hàng sót quy trình + ý tưởng nhiều (đường đời 3)
        kq = _gia([("C", "Hỏa", 3, 4, "bo_tro_tot")], troi="Hỏa", thieu="Thổ")
        assert [t["ma"] for t in ql.tinh_huong(kq)] == ["ban_hang_sot_quy_trinh", "y_tuong_nhieu"]
        # người ôm việc (6) và người ít nói (7) là hai người khác nhau
        kq = _gia([("D", "Thổ", 6, 4, "bo_tro_tot"), ("E", "Thổ", 7, 4, "bo_tro_tot")])
        assert [t["ma"] for t in ql.tinh_huong(kq)] == ["nguoi_om_viec", "it_noi_trong_hop"]
        # năm cá nhân 7 → đổi nhịp, nêu pha
        kq = _gia([("F", "Thổ", 4, 7, "bo_tro_tot")])
        t = ql.tinh_huong(kq)
        assert t[0]["ma"] == "doi_nhip" and "đào sâu" in t[0]["goc_nhin"]
        # không luật nào khớp → giữ nhịp
        kq = _gia([("G", "Thổ", 4, 4, "bo_tro_tot")])
        assert [t["ma"] for t in ql.tinh_huong(kq)] == ["giu_nhip"]
        # trần 3 tình huống
        kq = _gia([("A", "Mộc", 8, 7, "can_quy_che_ro"), ("B", "Kim", 6, 4, "bo_tro_tot"), ("C", "Hỏa", 3, 4, "bo_tro_tot")],
                  troi="Hỏa", thieu="Thổ")
        assert len(ql.tinh_huong(kq)) == 3


def test_ke_hoach_theo_du_lieu_nhom():
    with ngon_ngu.dung("vi"):
        kq = _gia([("A", "Mộc", 8, 4, "can_quy_che_ro"), ("B", "Kim", 4, 4, "bo_tro_tot")], troi="Thổ", thieu="Hỏa")
        kq["ma_tran_phoi_hop"][1]["chi_so"]["bu_khuyet_ngu_hanh"] = True
        kh = ql.ke_hoach_30_ngay(kq)
        assert [v["ma"] for v in kh] == ["bu_truc.hoa", "quy_che", "bu_khuyet", "troi_truc.tho", "mot_mot"]
        assert kh[1]["ai"] == ["A"] and kh[2]["ai"] == ["B"]
        assert "Kim" in kh[2]["viec"]
        # không có cặp quy ước, không có người bù → dùng cặp ghép
        kq = _gia([("A", "Mộc", 4, 4, "bo_tro_tot")])
        kq["goi_y_ghep_cap"] = [{"ten_a": "A", "ten_b": "B"}]
        assert [v["ma"] for v in ql.ke_hoach_30_ngay(kq)][1] == "ghep_cap"


def test_api_ca_nhan_va_danh_muc():
    r = _C.post("/v1/doanh-chu/ca-nhan", json={"ngay": 19, "thang": 8, "nam": 1995, "gioi_tinh": "nu", "nam_xem": 2027})
    assert r.status_code == 200, r.text
    d = r.json()
    for k in ("hanh_manh", "vai_tro_hop", "manh", "de_y", "lam_tot", "trao_doi", "nhip_nam", "nhan"):
        assert d[k], k
    assert d["khong_luu_du_lieu"] is True
    assert _C.post("/v1/doanh-chu/ca-nhan", json={"ngay": 31, "thang": 2, "nam": 1995, "nam_xem": 2027}).status_code == 422
    dm = _C.get("/v1/doanh-chu/tinh-huong").json()
    assert len(dm["tinh_huong"]) == 7 and len(dm["vai_tro_hanh"]) == 5
    for t in dm["tinh_huong"]:
        assert "{" not in t["goc_nhin"] + t["mo_loi"]
