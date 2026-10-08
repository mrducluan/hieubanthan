# -*- coding: utf-8 -*-
"""Bộ định tuyến câu hỏi (RULES) — golden là kho 2.000+ câu có nhãn.

Ngưỡng là HỢP ĐỒNG: hạ ngưỡng = phải có lý do ghi vào PR.
"""
from __future__ import annotations

import collections
import json
from pathlib import Path

import pytest

from app.luangiai import hoi

KHO = [json.loads(l) for l in (Path(__file__).parents[1] / "fixtures" / "cau_hoi" /
                               "thanso_cau_hoi.jsonl").open(encoding="utf-8")]


@pytest.fixture(scope="module")
def ket_qua():
    return [(r, hoi.phan_loai(r["cau_hoi"])) for r in KHO]


def test_an_toan_recall_100(ket_qua):
    lot = [r["cau_hoi"] for r, p in ket_qua if r["xu_ly"] == "an_toan" and p["xu_ly"] != "an_toan"]
    assert lot == [], lot


def test_an_toan_khong_bat_nham(ket_qua):
    nham = [r["cau_hoi"] for r, p in ket_qua if r["xu_ly"] != "an_toan" and p["xu_ly"] == "an_toan"]
    assert len(nham) <= 2, nham


def test_tu_choi_nhe_recall(ket_qua):
    ds = [(r, p) for r, p in ket_qua if r["xu_ly"] == "tu_choi_nhe"]
    lot = [r["cau_hoi"] for r, p in ds if p["xu_ly"] != "tu_choi_nhe"]
    assert len(lot) <= 0.1 * len(ds), lot


def test_tu_choi_khong_bat_nham(ket_qua):
    nham = [r["cau_hoi"] for r, p in ket_qua
            if r["xu_ly"] not in ("tu_choi_nhe", "an_toan") and p["xu_ly"] == "tu_choi_nhe"]
    assert len(nham) <= 2, nham


def test_linh_vuc_do_chinh_xac(ket_qua):
    dung = sum(1 for r, p in ket_qua if p["linh_vuc"] == r["linh_vuc"])
    sai = collections.Counter((r["linh_vuc"], p["linh_vuc"]) for r, p in ket_qua
                              if p["linh_vuc"] != r["linh_vuc"])
    # Nâng sàn theo kết quả vòng 2026-10-08 (95,01%) — chỉ được nâng, không hạ.
    assert dung / len(ket_qua) >= 0.94, sai.most_common(15)


def test_doi_tuong_do_chinh_xac(ket_qua):
    dung = sum(1 for r, p in ket_qua if p["doi_tuong"] == r["doi_tuong"])
    sai = collections.Counter((r["doi_tuong"], p["doi_tuong"]) for r, p in ket_qua
                              if p["doi_tuong"] != r["doi_tuong"])
    assert dung / len(ket_qua) >= 0.85, sai.most_common(10)


def test_khong_dau_giong_co_dau():
    assert hoi.phan_loai("toi khong muon song nua")["xu_ly"] == "an_toan"
    a, b = hoi.phan_loai("Tôi hợp với nghề gì?"), hoi.phan_loai("toi hop voi nghe gi")
    assert a["linh_vuc"] == b["linh_vuc"] == "su_nghiep"


def test_trich_ngay_va_cap_so():
    p = hoi.phan_loai("Tôi sinh ngày 12/3/1995, anh ấy sinh 8/7/1993, có hợp không?")
    assert p["linh_vuc"] == "hop_doi"
    assert p["ngay_nhac"] == [(12, 3, 1995), (8, 7, 1993)]
    q = hoi.phan_loai("Số chủ đạo 3 và 8 có hợp nhau không?")
    assert q["linh_vuc"] == "hop_doi" and q["cap_nhac"] == (3, 8)


def test_so_nhac_toi():
    assert hoi.phan_loai("Số chủ đạo 7 hợp nghề gì?")["so_nhac"] == {"duong_doi": 7}
    assert hoi.phan_loai("Năm cá nhân số 5 nên làm gì?")["so_nhac"] == {"nam_ca_nhan": 5}
    assert hoi.phan_loai("Sinh ngày 13 có nợ nghiệp không?")["so_nhac"] == {"ngay_sinh": 13}


def test_ky_thuat_tro_toi_muc_giai_thich():
    p = hoi.phan_loai("Tại sao các trang web khác ra số khác với ở đây?")
    assert p["linh_vuc"] == "ky_thuat" and "khac_trang" in p["giai_thich"]


# Vòng cải thiện 2026-10-08 (90,41% → 95,01%): giới thiệu chỉ là bối cảnh, trùng từ khoá, chọn ngày tốt.
@pytest.mark.parametrize("cau, linh_vuc", [
    ("Mình bán hàng online, năm nay của tôi thế nào?", "thoi_van"),            # giới thiệu không kéo sang sự nghiệp
    ("Em là mẹ bỉm hai con, tôi thiếu gì để thành công hơn?", "ban_than"),
    ("Tôi là con cả, có phải gánh vác hết không?", "gia_dinh"),                 # đuôi ngắn → vẫn lấy theo giới thiệu
    ("Tôi có năng khiếu nghệ thuật không?", "ban_than"),                        # "nghệ thuật" ≠ "nghề"
    ("Làm sao để tôi thăng tiến nhanh hơn?", "su_nghiep"),                      # "thăng tiến" ≠ "tiền"
    ("Tôi nên đọc sách gì cho hợp với con số?", "ban_than"),                    # "với con số" ≠ "với con"
    ("Tôi nên học cách buông bỏ điều gì?", "ban_than"),
    ("Tôi có mũi tên quyết tâm không?", "ban_than"),                            # "mũi tên" ≠ "tên"
    ("Ngày nào trong tháng hợp để ký hợp đồng?", "thoi_van"),
    ("Ngày mai có phải ngày tốt để tỏ tình không?", "thoi_van"),
    ("Làm sao để hoà hợp với mẹ chồng?", "gia_dinh"),
    ("Sếp tôi số chủ đạo 8, làm sao để làm việc với sếp?", "nguoi_khac"),
])
def test_vong_2026_10_08(cau, linh_vuc):
    assert hoi.phan_loai(cau)["linh_vuc"] == linh_vuc
