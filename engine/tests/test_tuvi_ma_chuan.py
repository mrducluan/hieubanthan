# -*- coding: utf-8 -*-
"""TV-V2 — bảng mã chuẩn Tử vi (app/kb/tuvi_ma_chuan.py) ↔ `0_legacy_adapter_mapping` của bộ tài liệu v2.2.

Bảng gốc v2.2 được chép vào golden oracle (`fixtures/golden/tuvi_v22_oracle.json` → `adapter_mapping`) lúc sinh
golden; test kiểm TỪNG mục của bảng gốc ra đúng mã, cộng các tên dự án thực dùng mà bảng gốc thiếu.
"""
from __future__ import annotations

import datetime as dt
import json
from pathlib import Path

import pytest

from app.calc import lunar
from app.calc import tuvi_an_sao as az
from app.calc import tuvi_luu_nguyet as ln
from app.hoidap.tuvi import tom_tat
from app.kb import tuvi_ma_chuan as mc

BAN_DO = json.loads((Path(__file__).resolve().parents[1] / "fixtures" / "golden" / "tuvi_v22_oracle.json")
                    .read_text(encoding="utf-8"))["adapter_mapping"]
NHOM = {"palaces": mc.ma_cung, "stems": mc.ma_can, "branches": mc.ma_chi, "stars": mc.ma_sao}


def test_ban_do_goc_du_bon_nhom():
    assert set(BAN_DO) == set(NHOM)
    assert sum(len(v) for v in BAN_DO.values()) > 200


@pytest.mark.parametrize("nhom", sorted(NHOM))
def test_moi_muc_ban_do_v22_ra_dung_ma(nhom):
    sai = {ten: (ma, NHOM[nhom](ten)) for ten, ma in BAN_DO[nhom].items() if NHOM[nhom](ten) != ma}
    assert not sai


def test_ten_du_an_ma_ban_v22_thieu():
    assert mc.ma_cung("Tử Nữ") == mc.ma_cung("Tử Tức") == "TU_TUC"
    assert mc.ma_cung("Nô Bộc") == mc.ma_cung("Giao Hữu") == "NO_BOC"
    assert mc.ma_sao("Hoả Tinh") == mc.ma_sao("Hỏa Tinh") == "HOA_TINH"
    assert mc.ma_chi("Tỵ") == mc.ma_chi("Tị") == "TI" and mc.ma_chi("Tý") == mc.ma_chi("Tí") == "TY"
    assert mc.ma_hoa("Hoá Kỵ") == mc.ma_hoa("Kỵ") == "KY"
    # không dấu, hoa thường, khoảng trắng thừa, dạng NFD
    assert mc.ma_cung("  quan loc ") == "QUAN_LOC" and mc.ma_cung("taiBach") == "TAI_BACH"
    assert mc.ma_sao("THIEN CO") == "THIEN_CO"
    import unicodedata
    assert mc.ma_cung(unicodedata.normalize("NFD", "Điền Trạch")) == "DIEN_TRACH"


def test_ten_chuan_khop_du_an():
    assert list(mc.CAN.values()) == lunar.CAN
    assert list(mc.CHI.values()) == lunar.CHI
    sao_hoa = {s for ds in ln.TU_HOA.values() for s in ds}
    assert sao_hoa <= set(mc.SAO.values())
    assert len(mc.CHINH_TINH) == 14


def test_khu_hai_chieu():
    for bang, ma, ten in ((mc.CUNG, mc.ma_cung, mc.ten_cung), (mc.CAN, mc.ma_can, mc.ten_can),
                          (mc.CHI, mc.ma_chi, mc.ten_chi), (mc.SAO, mc.ma_sao, mc.ten_sao),
                          (mc.HOA, mc.ma_hoa, mc.ten_hoa)):
        for k, v in bang.items():
            assert ma(v) == k and ten(k) == v


def test_khong_nhan_ra_thi_bao_loi_khong_doan():
    # adapter TS âm thầm trả 'MENH' / 'TY' / 'GIAP'; Python báo lỗi để không lệch lá số.
    for f in (mc.ma_cung, mc.ma_can, mc.ma_chi, mc.ma_hoa):
        with pytest.raises(ValueError):
            f("Không có")
        with pytest.raises(ValueError):
            f("")
    # sao ngoài bảng (adapter TS: STAR_<TÊN>) → None
    assert mc.ma_sao("Thiên Hình") is None and mc.ma_sao("Tuần Không") is None


def test_cung_sang_ma_tren_la_so_that():
    ls = tom_tat(az.an_sao_tho(dt.date(1990, 5, 15), 1, "nam", "vi-VN"))
    ps = mc.cung_sang_ma(ls["cung"])
    assert sorted(p["palaceCode"] for p in ps) == sorted(mc.CUNG)
    assert [p["branch"] for p in ps] == [mc.ma_chi(c["chi"]) for c in ls["cung"]]
    assert [p["stem"] for p in ps] == [mc.ma_can(c["can"]) for c in ls["cung"]]
    sao = [s for p in ps for s in p["stars"]]
    assert len(sao) == len(set(sao))                                 # mỗi sao một cung
    assert set(mc.CHINH_TINH) <= set(sao)
    assert {"VAN_XUONG", "VAN_KHUC", "TA_PHU", "HUU_BAT"} <= set(sao)
    assert sum(p["hasTuan"] for p in ps) == 2 and sum(p["hasTriet"] for p in ps) == 2   # Tuần/Triệt đóng 2 cung
