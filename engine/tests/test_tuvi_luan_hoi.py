# -*- coding: utf-8 -*-
"""LH-1 — lớp "Luận theo câu hỏi" của Luận giải Tử vi đời sống (`luangiai/tuvi_luan_hoi.py`)."""
from __future__ import annotations

import collections
import datetime as dt
import json
import re
from pathlib import Path

import pytest

from app import ngon_ngu
from app.hoidap.tuvi import tom_tat
from app.kb import tuvi_doi_song_kb as kb_ds
from app.kb import tuvi_luan_hoi_kb as kb
from app.luangiai import chu_y_nam as cyn
from app.luangiai import tuvi_doi_song as tvd
from app.luangiai import tuvi_luan_hoi as lh
from tests._tuvi_1000 import la_1000

NGAY_XEM = dt.date(2026, 11, 17)
SINH = [{"ngay": dt.date(1990, 5, 17), "ti": 4, "gioi_tinh": "nu"}, {"ngay": dt.date(1984, 2, 9), "ti": 0, "gioi_tinh": "nam"},
        {"ngay": dt.date(1975, 11, 30), "ti": 9, "gioi_tinh": "nu"}, {"ngay": dt.date(2001, 8, 3), "ti": 6, "gioi_tinh": "nam"},
        {"ngay": dt.date(1962, 1, 20), "ti": 11, "gioi_tinh": "nam"}, {"ngay": dt.date(1996, 12, 25), "ti": 2, "gioi_tinh": "nu"}]
SQL_MA = re.compile(r"^ds\.[a-z0-9_]+(\.[a-z0-9_+-]+)+$")          # như hàm SQL kiểm mã của migration 0017
CHINH_TINH = list((kb.lay("sao_nguoi") or {}).keys())
THUAT_NGU = CHINH_TINH + ["Hoá Kỵ", "Hoá Lộc", "Hoá Quyền", "Hoá Khoa", "Tuần", "Triệt", "Kình Dương", "Đà La", "Địa Kiếp",
                          "lưu niên", "đại hạn", "Phu Thê", "Quan Lộc", "Tài Bạch", "Nô Bộc", "Thiên Di", "Tử Nữ", "Phụ Mẫu"]


@pytest.fixture(scope="module")
def cac_bc():
    return [tvd.lap(s, NGAY_XEM) for s in SINH]


def _chu_hien(lh_: dict):
    """Mọi chuỗi người đọc thấy ở lớp đời thường (không gồm `can_cu`)."""
    for x in lh_["tra_loi"]:
        yield from (x["cau"], x["tra_loi"], x["giai_thich"])
    for n in lh_["nguoi"]:
        yield from (n["ten"], n["chan_dung"], n["song_chung"], *n["ban_voi_ho"], *n["ho_voi_ban"])
    hg = lh_["hoa_giai"]
    yield from (*hg["phat_huy"], *hg["can_sua"], *hg["canh_bao"], *(d["loi"] for d in hg["dan_gian"]), hg["ghi_chu_dan_gian"])
    for d in lh_["dong_mang"]:
        yield d["y"]
    if "nghe" in lh_:
        yield lh_["nghe"]["cau"]
        for h in lh_["nghe"]["hanh"]:
            yield h["nganh"]


def test_nam_chuong_co_du_phan(cac_bc):
    for bc in cac_bc:
        co = {c["ma"]: c["luan_hoi"] for c in bc["chuong"] if "luan_hoi" in c}
        assert set(co) == set(lh.CHUONG_CUNG)
        for ch, x in co.items():
            ma_kb = [c["ma"] for c in kb.cau(ch)]
            assert [t["ma"] for t in x["tra_loi"]] == [m for m in ma_kb if m in {t["ma"] for t in x["tra_loi"]}]   # đúng thứ tự KB
            assert len(x["tra_loi"]) >= len(ma_kb) - 1
            for t in x["tra_loi"]:
                assert t["cau"].endswith("?") and len(t["tra_loi"]) >= 20 and t["can_cu"], t
                assert SQL_MA.match(t["ma_mau"]) and len(t["ma_mau"]) <= 60, t["ma_mau"]
                assert t["sac"] in ("thuan", "can_bang", "can_chu_dong")
            hg = x["hoa_giai"]
            assert hg["phat_huy"] and hg["can_sua"] and hg["dan_gian"] and hg["ghi_chu_dan_gian"]
            assert all(d.get("duong", "/").startswith("/") for d in hg["dan_gian"])          # link chỉ trong site
            assert [d["nam"] for d in x["dong_mang"]] == list(range(x["dong_mang"][0]["nam"], x["dong_mang"][0]["nam"] + 10))
            assert [n["ma"] for n in x["nguoi"]] == list(lh.NGUOI_CHUONG.get(ch, ()))
        assert "nghe" in co["su_nghiep"] and len(co["su_nghiep"]["nghe"]["hanh"]) == 5
        assert sum(h["cap"] == "chinh" for h in co["su_nghiep"]["nghe"]["hanh"]) <= 1


def test_nguoi_quanh_bay_vai(cac_bc):
    ma_chuong = {c[0] for c in tvd.CHUONG}
    for bc, s in zip(cac_bc, SINH):
        nq = bc["nguoi_quanh"]
        assert [n["ma"] for n in nq] == list(kb.vai())
        for n in nq:
            assert n["tu_chuong"] in ma_chuong and n["muc"] in ("thuan", "can_bang", "can_chu_dong") and n["chan_dung"]
        assert nq[0]["ten"] == ("Vợ" if s["gioi_tinh"] == "nam" else "Chồng")


def test_khong_doi_muc_va_hop_cua_bao_cao():
    """Lớp mới chỉ THÊM trường — chương, mức, hộp, cốt lõi y như khi chưa có lớp này."""
    co = tvd.lap(SINH[0], NGAY_XEM)
    goc = lh.ap
    try:
        lh.ap = lambda *a, **k: []
        khong = tvd.lap(SINH[0], NGAY_XEM)
    finally:
        lh.ap = goc
    co.pop("nguoi_quanh")
    for c in co["chuong"]:
        c.pop("luan_hoi", None)
    assert json.dumps(co, ensure_ascii=False, sort_keys=True) == json.dumps(khong, ensure_ascii=False, sort_keys=True)


def test_giong_van_va_thuat_ngu(cac_bc):
    cam = kb_ds.cum_cam()
    for bc in cac_bc:
        for c in bc["chuong"]:
            if "luan_hoi" not in c:
                continue
            for s in _chu_hien(c["luan_hoi"]):
                assert not kb_ds.tim_cum_cam(s, cam), (kb_ds.tim_cum_cam(s, cam), s)
                assert not [t for t in THUAT_NGU if t in s], s          # thuật ngữ chỉ ở "Vì sao nói vậy"
                assert "{" not in s and "  " not in s, s


def test_kb_du_o_va_sach_cum_cam():
    cam = kb_ds.cum_cam()
    for ma, ds in lh.NHAN.items():
        for nhan in ds:
            assert kb.tra_loi(ma, nhan).get("tl"), (ma, nhan)
            assert nhan in lh.SAC, nhan
    assert {c["ma"] for ch in lh.CHUONG_CUNG for c in kb.cau(ch)} >= set(lh.NHAN)
    for sao in CHINH_TINH:
        assert all(kb.lay("sao_nguoi", sao).get(k) for k in ("kieu", "ngan", "ham", "song"))
        assert kb.lay("sao_nghe", sao)["hanh"] in kb.lay("hanh_nganh") and kb.lay("sao_nghe", sao)["kieu"] in ("chu", "chuyen_mon", "to_chuc")
    for ch in lh.CHUONG_CUNG:
        for t in (*lh.TIN_DUONG, *lh.TIN_AM):
            if t == "ma" and ch not in ("su_nghiep", "quan_he"):
                continue
            assert kb.tin_hieu(ch, t).get("y") and kb.tin_hieu(ch, t).get("lam"), (ch, t)
        assert kb.chuoi("mac_dinh", "phat_huy", ch) and kb.chuoi("mac_dinh", "can_sua", ch) and kb.dan_gian(ch)

    def chuoi(x):
        if isinstance(x, str):
            yield x
        elif isinstance(x, dict):
            for k, v in x.items():
                if not k.startswith("_"):
                    yield from chuoi(v)
        elif isinstance(x, list):
            for v in x:
                yield from chuoi(v)
    d = json.loads((Path(kb.__file__).parent / "data" / "tuvi_luan_hoi_kb.json").read_text("utf-8"))
    assert d["source_id"] and d["school_id"]
    for s in chuoi(d):
        assert not kb_ds.tim_cum_cam(s, cam), (kb_ds.tim_cum_cam(s, cam), s)
        # tập quán dân gian được ghi; bùa, trấn yểm, vật phẩm thì không
        assert not re.search(r"bùa|trấn yểm|vòng tay|tỳ hưu|thạch anh|đá phong thuỷ|thỉnh về", s.lower()), s


def test_phan_bo_nhan_1000_la():
    """Nhãn nói thẳng phải hiếm; không nhãn nào thành "ai cũng nhận"."""
    ten = ("ben", "nguoi_thu_ba", "som_muon", "chu_hay_cong", "hoc_hanh", "di_xa", "giu_tien", "cong_danh", "kinh_doanh",
           "quy_nhan", "lam_an_chung", "thi_phi")
    dem = {k: collections.Counter() for k in ten}
    for la in la_1000():
        ls = tom_tat(la)
        cc = tvd.cham_cung(ls)
        for k in ten:
            dem[k][getattr(lh, "nhan_" + k)(ls, cc)] += 1
    for k, c in dem.items():
        assert set(c) <= set(lh.NHAN[k]), (k, c)
        assert max(c.values()) <= 820, (k, c)                      # không nhãn nào quá 82 %
    assert 30 <= dem["ben"]["hai_lan_do"] <= 120                    # 3–12 % lá
    assert dem["ben"]["mot_moi_ben"] >= 300
    assert dem["nguoi_thu_ba"]["it_dau_hieu"] >= 700
    assert dem["som_muon"]["lan_dan"] <= 150


def test_dong_mang_mot_nguon_voi_nam_nen_chu_y():
    s = SINH[0]
    bc = tvd.lap(s, NGAY_XEM)
    from app.calc import tuvi_an_sao as az
    ls = tom_tat(az.an_sao_tho(s["ngay"], s["ti"], s["gioi_tinh"], "vi-VN"))
    cc = tvd.cham_cung(ls)
    nam0 = bc["chuong"][0] and next(c for c in bc["chuong"] if "luan_hoi" in c)["luan_hoi"]["dong_mang"][0]["nam"]
    nam_sinh = nam0 - bc["tuoi_mu"] + 1
    dong = {g["nam"]: g for g in tvd.dong_muoi_nam(ls, cc, nam0, nam_sinh, s["gioi_tinh"])}
    for c in bc["chuong"]:
        if "luan_hoi" not in c:
            continue
        cham = {x["nam"] for x in c["luan_hoi"]["dong_mang"] if x["muc"] == "can_chu_dong"}
        nguon = {x["nam"] for cu in lh.CHUONG_CUNG[c["ma"]]
                 for x in cyn.tuvi_nam_cung(ls, nam0, nam_sinh, cu, 10, dong=dong, mang_thuong=True)}
        assert nguon <= cham                                         # (báo cáo còn thêm sao lưu năm đang xem)
        assert cham - nguon <= {nam0}
        for x in c["luan_hoi"]["dong_mang"]:
            assert x["y"] and (x["muc"] != "can_bang" or not x["hy"])


def test_nhan_ben_theo_dau_hieu_tay():
    """Lá dựng tay: cung Phu Thê chỉ có sao hiền, sáng + Hoá Lộc → một mối bền; thêm sao cứng, hãm, Kỵ, sát, Tuần → hai lần đò."""
    ten = ["Mệnh", "Huynh Đệ", "Phu Thê", "Tử Nữ", "Tài Bạch", "Tật Ách", "Thiên Di", "Nô Bộc", "Quan Lộc", "Điền Trạch",
           "Phúc Đức", "Phụ Mẫu"]
    chi = ["Tý", "Hợi", "Tuất", "Dậu", "Thân", "Mùi", "Ngọ", "Tỵ", "Thìn", "Mão", "Dần", "Sửu"]

    def la(chinh, phu, hoa):
        cung = [{"ten": t, "chi": c, "can": "Giáp", "chinh_tinh": chinh if t == "Phu Thê" else [],
                 "phu_tinh": phu if t == "Phu Thê" else [], "dai_han": [1, 10]} for t, c in zip(ten, chi)]
        return {"cung": cung, "tu_hoa": hoa}
    em = la([{"ten": "Thiên Đồng", "do_sang": "Miếu"}], ["Tả Phù"], [{"hoa": "Lộc", "sao": "Thiên Đồng", "cung": "Phu Thê"}])
    assert lh.nhan_ben(em, tvd.cham_cung(em)) == "mot_moi_ben" and lh.nhan_som_muon(em, tvd.cham_cung(em)) == "som_thuan"
    kho = la([{"ten": "Thất Sát", "do_sang": "Hãm"}], ["Kình Dương", "Địa Kiếp", "Tuần Không", "Cô Thần"],
             [{"hoa": "Kỵ", "sao": "Thất Sát", "cung": "Phu Thê"}])
    assert lh.nhan_ben(kho, tvd.cham_cung(kho)) == "hai_lan_do" and lh.nhan_som_muon(kho, tvd.cham_cung(kho)) == "lan_dan"
    dao = la([{"ten": "Tham Lang", "do_sang": "Vượng"}], ["Hàm Trì"], [])
    assert lh.nhan_nguoi_thu_ba(dao, tvd.cham_cung(dao)) == "phia_nguoi_ay"


def test_duoi_18_tuoi_va_ban_tieng_anh_khong_co_lop_nay():
    be = tvd.lap({"ngay": dt.date(2012, 6, 1), "ti": 3, "gioi_tinh": "nu"}, NGAY_XEM)
    assert "nguoi_quanh" not in be and not any("luan_hoi" in c for c in be["chuong"])
    with ngon_ngu.dung("en"):
        en = tvd.lap(SINH[0], NGAY_XEM)
    assert "nguoi_quanh" not in en and not any("luan_hoi" in c for c in en["chuong"])


def test_tat_dinh(cac_bc):
    lai = tvd.lap(SINH[0], NGAY_XEM)
    assert json.dumps(lai, ensure_ascii=False, sort_keys=True) == json.dumps(cac_bc[0], ensure_ascii=False, sort_keys=True)
