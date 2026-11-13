# -*- coding: utf-8 -*-
"""KT-N2 — bảng thần sát Bát tự đối chiếu nguyên văn «Tam Mệnh Thông Hội» (kho nguồn Tứ khố)."""
from __future__ import annotations

import json
from pathlib import Path

from app.calc import battu_mo_rong as mr
from app.calc.battu import CAN, CHI, DUONG_NHAN, LOC

GOC = Path(__file__).resolve().parent.parent
KHO = json.loads((GOC / "fixtures" / "nguon" / "tam_menh_thong_hoi.json").read_text("utf-8"))
VAN = "".join(t["van"] for t in KHO["thien"])
HAN_CAN = dict(zip("甲乙丙丁戊己庚辛壬癸", CAN))
HAN_CHI = dict(zip("子丑寅卯辰巳午未申酉戌亥", CHI))


def test_kho_nguon_co_cac_thien_dang_dung():
    ten = [t["ten"] for t in KHO["thien"]]
    for can in ("論胎元", "論坐命宫", "論小運", "論金轝", "論天乙貴人", "論天月徳", "論刼煞亡神", "論孤辰寡宿", "論天羅地網", "魁罡"):
        assert any(can in x for x in ten), can
    assert KHO["can_doi_chieu"] is True


def test_cau_sach_cua_tung_sao_la_nguyen_van():
    for ten, s in mr.THAN_SAT_SACH.items():
        assert ten in mr._Y, ten
        assert s["han"] in VAN, f"{ten}: «{s['han']}» không có trong kho nguồn"
    # sao không có trong sách thì không được gán câu
    assert "Thiên Y" not in mr.THAN_SAT_SACH
    assert set(mr._Y) - set(mr.THAN_SAT_SACH) == {"Thiên Y"}


def test_kim_du_va_duong_nhan_dung_luat_sach():
    """«金轝常居祿前二辰», «羊刃常居祿前一辰» — tính lại từ bảng Lộc."""
    for c in CAN:
        assert mr._KIM_DU[c] == CHI[(CHI.index(LOC[c]) + 2) % 12], c
    for c, chi in DUONG_NHAN.items():
        assert chi == CHI[(CHI.index(LOC[c]) + 1) % 12], c


def test_hong_diem_khac_sach_dung_ba_can():
    """Câu sách: 甲乙逢午 丙寅 丁未 戊子 己辰 庚戌 辛酉 壬巳 癸申. Engine dùng bảng phổ thông, khác đúng ba can."""
    sach = {"Giáp": "Ngọ", "Ất": "Ngọ", "Bính": "Dần", "Đinh": "Mùi", "Mậu": "Tý", "Kỷ": "Thìn", "Canh": "Tuất",
            "Tân": "Dậu", "Nhâm": "Tỵ", "Quý": "Thân"}
    khac = {c for c in CAN if mr._HONG_DIEM[c] != sach[c]}
    assert khac == {"Ất", "Mậu", "Nhâm"}
    assert mr.THAN_SAT_SACH["Hồng Diễm"]["khop"] is False and mr.THAN_SAT_SACH["Văn Xương"]["khop"] is False


def test_thien_duc_khop_khau_quyet_sach():
    """«正月丁…二月坤…三月壬…四月辛…五月乾…六月甲…七月癸…八月艮…九月丙…十月乙» (quẻ → chi: 坤 Thân, 乾 Hợi, 艮 Dần, 巽 Tỵ)."""
    for thang_chi, mong in (("Dần", "Đinh"), ("Mão", "Thân"), ("Thìn", "Nhâm"), ("Tỵ", "Tân"), ("Ngọ", "Hợi"),
                            ("Mùi", "Giáp"), ("Thân", "Quý"), ("Dậu", "Dần"), ("Tuất", "Bính"), ("Hợi", "Ất")):
        assert mr._THIEN_DUC[thang_chi] == mong, thang_chi
    for cau in ("正月丁", "二月坤", "三月壬", "四月辛", "五月乾", "六月甲", "七月癸", "八月艮", "九月丙", "十月乙"):
        assert cau in VAN, cau


def test_than_sat_tra_kem_cau_sach():
    tru = [{"can": "Giáp", "chi": "Tý"}, {"can": "Bính", "chi": "Dần"}, {"can": "Giáp", "chi": "Thìn"}, {"can": "Ất", "chi": "Sửu"}]
    ds = mr.than_sat(tru)
    assert ds and all(("sach" in x) == (x["ten"] in mr.THAN_SAT_SACH) for x in ds)
    assert all(set(x["sach"]) == {"han", "khop"} for x in ds if "sach" in x)


# ---------- Hiệp Kỷ Biện Phương Thư q.36 — tháng gả cưới đại lợi (EN-5.1) ----------
HK = json.loads((GOC / "fixtures" / "nguon" / "hiep_ky_bien_phuong_thu.json").read_text("utf-8"))
HK_VAN = "".join(m["van"] for m in HK["muc"])


def test_gia_thu_cau_dan_la_nguyen_van():
    from app.luangiai import chon_ngay_nhieu as cn
    for k, v in cn.GIA_THU_HAN.items():
        assert v in HK_VAN, k
    assert HK["can_doi_chieu"] is True


def test_gia_thu_dung_luat_sach():
    """«陽年自本命前一月向前順數 … 隂年自本命後一月向後逆數 第一月為大利 … 第十二月為女本命 第六月為本命之衝»."""
    from app.calc.tuoi_dan_gian import thang_gia_thu
    assert "第十二月為女本命第六月為本命之衝" in HK_VAN
    duong = [HAN_CHI[c] for c in "子寅辰午申戌"]
    for i, chi in enumerate(CHI):
        buoc = 1 if chi in duong else -1
        day = [CHI[(i + buoc * k) % 12] for k in range(1, 13)]            # mười hai tháng đếm theo sách
        assert day[11] == chi and day[5] == CHI[(i + 6) % 12]             # hai câu kiểm của chính sách
        g = thang_gia_thu(chi)
        assert set(g["dai_loi_chi"]) == {day[0], day[6]}, chi             # «至第七月又復一轉»
        assert set(g["tieu_loi_chi"]) == {day[1], day[7]}, chi
    assert "至第七月又復一轉" in HK_VAN


def test_gia_thu_dau_ra_co_nguyen_van():
    from app.luangiai import chon_ngay_nhieu as cn
    r = cn._gia_thu_ra({"nam_sinh": 1998, "con_giap": "Dần"}, thang_gia_thu_dan())
    assert r["nguyen_van"]["quy_tac"] in HK_VAN


def thang_gia_thu_dan():
    from app.calc.tuoi_dan_gian import thang_gia_thu
    return thang_gia_thu("Dần")
