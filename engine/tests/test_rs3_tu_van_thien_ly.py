# -*- coding: utf-8 -*-
"""RS-3 — nguyên tắc Tử Vân (Đẩu Số Luận Mệnh) và Thiên Lý Mệnh Cảo (Vi Thiên Lý), lời tóm ý của ban biên tập, ra đúng chỗ:
một dòng "Vì sao nói vậy" CHỈ khi điều kiện đúng trên lá số; mức, hộp, mã kiểm chứng, cốt lõi không đổi; bản Anh cùng số
dòng nhưng không chữ Việt."""
from __future__ import annotations

import datetime as dt
import re

import pytest

from app import ngon_ngu
from app.kb.tuvi_doi_song_kb import tim_cum_cam
from app.luangiai import battu_doi_song as btd
from app.luangiai import doi_song_khuon as kh
from app.luangiai import tu_van_thien_ly as t
from app.luangiai import tuvi_doi_song as tvd
from app.luangiai import tuvi_hop_tham as hop

NGAY_XEM = dt.date(2026, 11, 20)
HAN = re.compile(r"[㐀-鿿]")
VIET = re.compile(r"[ăâđêôơưạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹđ]", re.I)
SINH = [{"ngay": dt.date(1990, 5, 15), "ti": 3, "gioi_tinh": "nam"}, {"ngay": dt.date(1984, 2, 9), "ti": 0, "gioi_tinh": "nam"},
        {"ngay": dt.date(1975, 11, 30), "ti": 9, "gioi_tinh": "nu"}, {"ngay": dt.date(2001, 8, 3), "ti": 6, "gioi_tinh": "nam"},
        {"ngay": dt.date(1962, 1, 20), "ti": 11, "gioi_tinh": "nam"}, {"ngay": dt.date(1996, 12, 25), "ti": 2, "gioi_tinh": "nu"},
        {"ngay": dt.date(1988, 10, 24), "ti": 5, "gioi_tinh": "nu"}, {"ngay": dt.date(1970, 3, 3), "ti": 8, "gioi_tinh": "nam"}]


# ------------------------------------------------------------------ lá số giả (đơn vị)
CHI = ("Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi", "Tý", "Sửu")
TEN = ("Mệnh", "Phụ Mẫu", "Phúc Đức", "Điền Trạch", "Quan Lộc", "Nô Bộc", "Thiên Di", "Tật Ách", "Tài Bạch", "Tử Nữ",
       "Phu Thê", "Huynh Đệ")


def _ls(phu: dict[str, list[str]] | None = None, hoa: dict[str, str] | None = None) -> dict:
    cung = [{"ten": TEN[i], "chi": CHI[i], "can": "Giáp", "phu_tinh": list((phu or {}).get(TEN[i], [])),
             "chinh_tinh": [], "dai_han": [2 + 10 * i, 11 + 10 * i]} for i in range(12)]
    return {"cung": cung, "tu_hoa": [{"hoa": h, "sao": "X", "cung": c} for h, c in (hoa or {}).items()]}


def test_giap_cat_va_sat():
    # Mệnh (Dần) kề Huynh Đệ (Sửu) và Phụ Mẫu (Mão).
    ls = _ls({"Huynh Đệ": ["Tả Phù"], "Phụ Mẫu": ["Hữu Bật"]})
    assert t._giap(ls, "Mệnh") == ([("Tả Phù", "Hữu Bật")], [])
    ls = _ls({"Huynh Đệ": ["Kình Dương"], "Phụ Mẫu": ["Đà La"]})
    assert t._giap(ls, "Mệnh") == ([], [("Kình Dương", "Đà La")])
    ls = _ls({"Huynh Đệ": ["Tả Phù", "Hữu Bật"]})          # cả cặp một bên → không phải giáp
    assert t._giap(ls, "Mệnh") == ([], [])
    ls = _ls({"Huynh Đệ": ["Lộc Tồn"]}, {"Lộc": "Phụ Mẫu"})  # song Lộc giáp: Lộc Tồn + Hoá Lộc năm sinh
    assert t._giap(ls, "Mệnh")[0] == [("Lộc Tồn", "Hoá Lộc")]
    d = t._dk_giap(_ls({"Huynh Đệ": ["Tả Phù"], "Phụ Mẫu": ["Hữu Bật"]}))
    assert set(d) == {"tong_quan"} and d["tong_quan"].startswith(t.NHAN_TU_VAN) and "Tả Phù và Hữu Bật" in d["tong_quan"]
    assert t._dk_giap(_ls()) == {}


def test_phu_the_chi_khi_ky_o_phuc_duc():
    assert t._dk_phu_the(_ls(hoa={"Kỵ": "Phúc Đức"}))
    assert t._dk_phu_the(_ls(hoa={"Kỵ": "Phu Thê"})) is None
    assert t._dk_phu_the(_ls()) is None


def test_thai_tue_dieu_kien():
    ls = _ls({"Mệnh": ["Kình Dương", "Địa Kiếp"]})
    assert "nơi có Kình Dương, Địa Kiếp" in t.thai_tue(ls, "Dần")
    ls = _ls({"Mệnh": ["Kình Dương"]})                           # một sát tinh → không đủ
    assert t.thai_tue(ls, "Dần") is None
    assert t.thai_tue(_ls(hoa={"Kỵ": "Mệnh"}), "Dần")
    assert "Lộc Tồn" in t.thai_tue(_ls({"Mệnh": ["Lộc Tồn"]}), "Dần")
    assert t.thai_tue(_ls(), "Dần") is None


# ------------------------------------------------------------------ báo cáo Tử vi
@pytest.fixture(scope="module")
def cap_tuvi():
    return [(s, tvd.lap(s, NGAY_XEM), tvd.lap(s, NGAY_XEM, tom_y_phai=False)) for s in SINH]


def _bo_can_cu(bc: dict) -> dict:
    return {**bc, "chuong": [{k: v for k, v in c.items() if k != "can_cu"} for c in bc["chuong"]]}


def _ma(bc: dict) -> list[str]:
    return [h.get("ma_mau") for c in bc["chuong"] for h in c["hop"]] + [h.get("ma_mau") for h in bc["cot_loi"]]


def _dong_moi(co: dict, khong: dict, nhan: str) -> dict[str, list[str]]:
    ra = {}
    for a, b in zip(co["chuong"], khong["chuong"]):
        assert a["can_cu"][:len(b["can_cu"])] == b["can_cu"]          # chỉ NỐI THÊM vào cuối
        moi = a["can_cu"][len(b["can_cu"]):]
        assert all(x.startswith(nhan) for x in moi)
        if moi:
            ra[a["ma"]] = moi
    return ra


def test_tuvi_khong_doi_muc_hop_ma(cap_tuvi):
    co_dong = 0
    for s, co, khong in cap_tuvi:
        assert _bo_can_cu(co) == _bo_can_cu(khong)                      # mức, hộp, cốt lõi, lời mời… giữ nguyên
        assert _ma(co) == _ma(khong)
        moi = _dong_moi(co, khong, t.NHAN_TU_VAN)
        co_dong += bool(moi)
        assert set(moi) <= {"tong_quan", "su_nghiep", "tien_bac", "nha_cua", "van_han", "tinh_cam", "loi_khuyen"}
        for x in (y for v in moi.values() for y in v):
            assert not HAN.search(x) and not tim_cum_cam(x, kh.cum_cam_chung())
        assert not kh.kiem_giong_van(co, mo_dun="tuvi")
    assert co_dong >= 3


def test_tuvi_dong_khop_dieu_kien(cap_tuvi):
    from app.calc import lunar
    from app.calc import tuvi_an_sao as az
    from app.hoidap.tuvi import tom_tat
    for s, co, khong in cap_tuvi:
        ls = tom_tat(az.an_sao_tho(s["ngay"], s["ti"], s["gioi_tinh"], "vi-VN"))
        vh = az.van_han(s["ngay"], s["ti"], s["gioi_tinh"], NGAY_XEM)
        nam_xem = lunar.solar_to_lunar(NGAY_XEM.day, NGAY_XEM.month, NGAY_XEM.year, 7.0)[2]
        mong = t.tuvi_dong(ls, nam_xem, nam_xem - vh["tuoi_mu"] + 1)
        assert _dong_moi(co, khong, t.NHAN_TU_VAN) == mong
        # tam đại: dòng có thì năm nêu ra nằm trong dòng mười năm của chương Vận hạn
        if "van_han" in mong:
            vhc = next(c for c in co["chuong"] if c["ma"] == "van_han")
            nam = int(re.search(r"Năm (\d{4})", mong["van_han"][0]).group(1))
            assert nam in {g["nam"] for g in vhc["dong_nam"]}


def test_tuvi_ban_anh_cung_so_dong_khong_chu_viet():
    s = SINH[0]
    vi = tvd.lap(s, NGAY_XEM)
    with ngon_ngu.dung("en"):
        en = tvd.lap(s, NGAY_XEM)
        en0 = tvd.lap(s, NGAY_XEM, tom_y_phai=False)
    for a, b, b0 in zip(vi["chuong"], en["chuong"], en0["chuong"]):
        assert len(a["can_cu"]) == len(b["can_cu"])
        for x in b["can_cu"][len(b0["can_cu"]):]:
            assert x.startswith(t.NHAN_TU_VAN_EN) and not VIET.search(x)


# ------------------------------------------------------------------ Bát tự
def _bt(i: int) -> dict:
    return {"lich": dt.datetime(1950, 1, 1, 8) + dt.timedelta(days=i * 97, hours=i * 5 % 24),
            "gioi_tinh": "nam" if i % 2 else "nu"}


def test_battu_theo_cach_cuc():
    gap = set()
    for i in range(40):
        co, khong = btd.lap(_bt(i), NGAY_XEM), btd.lap(_bt(i), NGAY_XEM, tom_y_phai=False)
        assert _bo_can_cu(co) == _bo_can_cu(khong) and _ma(co) == _ma(khong)
        moi = _dong_moi(co, khong, t.NHAN_THIEN_LY)
        pt = btd.phan_tich({**btd._la_so(_bt(i))})
        ma = pt["cach_2"]["ma"]
        if ma in t.CACH_BT:
            assert set(moi) >= {t.CACH_BT[ma][1]}
            gap.add(ma)
        else:
            assert not set(moi) - {"ngu_hanh"}
        for x in (y for v in moi.values() for y in v):
            assert not HAN.search(x)
        assert not kh.kiem_giong_van(co, mo_dun="battu")
    assert len(gap) >= 2


def test_battu_mat_theo_than():
    pt = {"cach_2": {"ma": "chinh_an", "ten": "Chính Ấn cách"}, "than": "yeu", "ngoai_cach": None}
    d = t.battu_dong(pt)["hoc_tap"][0]
    muc = t._thien_ly("chinh_thien_an_ho_than")
    assert muc["mat_tich_cuc"] in d and muc["mat_tieu_cuc_can_chu_y"] not in d
    d = t.battu_dong({**pt, "than": "manh"})["hoc_tap"][0]
    assert muc["mat_tieu_cuc_can_chu_y"] in d
    d = t.battu_dong({**pt, "than": "can_bang"})["hoc_tap"][0]
    assert muc["mat_tich_cuc"] not in d and muc["mat_tieu_cuc_can_chu_y"] not in d
    assert t.battu_dong({**pt, "cach_2": {"ma": "chinh_quan", "ten": "Chính Quan cách"}}) == {}


def test_battu_ban_anh():
    with ngon_ngu.dung("en"):
        for i in range(12):
            for x in (y for v in t.battu_dong(btd.phan_tich(btd._la_so(_bt(i)))).values() for y in v):
                assert x.startswith(t.NHAN_THIEN_LY_EN) and not VIET.search(x)


# ------------------------------------------------------------------ Xem lá số 2 người
def test_hop_tham_khong_doi_diem(monkeypatch):
    from app.calc import tuvi_an_sao as az
    from app.hoidap.tuvi import tom_tat
    co_dong = 0
    for s in SINH:
        ls = tom_tat(az.an_sao_tho(s["ngay"], s["ti"], s["gioi_tinh"], "vi-VN"))
        for nam_kia in range(1980, 1992):
            from app.calc import lunar
            can_k = lunar.can_chi_nam(nam_kia)[0]
            ban, kia = {"nam_am": s["ngay"].year, "gioi_tinh": s["gioi_tinh"]}, {"nam_am": nam_kia, "gioi_tinh": "nu"}
            a = hop.lap(ls, ls["can_nam"], can_k, "nguoi_yeu", ban=ban, kia=kia)
            with monkeypatch.context() as m:
                m.setattr(t, "thai_tue", lambda *_: None)
                b = hop.lap(ls, ls["can_nam"], can_k, "nguoi_yeu", ban=ban, kia=kia)
            assert a["diem"]["tong"] == b["diem"]["tong"]
            assert [h["ma_mau"] for h in a["diem"]["diem_manh"] + a["diem"]["can_dung_hoa"]] == \
                   [h["ma_mau"] for h in b["diem"]["diem_manh"] + b["diem"]["can_dung_hoa"]]
            ca, cb = (next(x for x in d["diem"]["tieu_chi"] if x["ma"] == "chi")["can_cu"] for d in (a, b))
            assert ca[:len(cb)] == cb and len(ca) - len(cb) in (0, 1)
            co_dong += len(ca) - len(cb)
            if len(ca) > len(cb):
                assert ca[-1].startswith(t.NHAN_TU_VAN) and "Thái Tuế" in ca[-1]
    assert co_dong >= 5
