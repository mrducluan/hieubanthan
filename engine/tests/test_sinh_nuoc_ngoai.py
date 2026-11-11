# -*- coding: utf-8 -*-
"""Ý3 (2026-11-09) — cụm trang "Sinh ở nước ngoài": mỗi nước một trang dữ kiện TÍNH (múi giờ chuẩn, giờ mùa hè theo lịch sử
tzdata, lệch giờ mặt trời trung bình theo kinh độ, Nam bán cầu → công tắc mùa, ngày lịch âm Việt – Trung lệch nhau trong năm).
Test viết TRƯỚC hàm. Đối chiếu tay: Sydney 151,21°Đ, UTC+10 → lệch mặt trời +5 phút; Paris 2,35°Đ, UTC+1 → −51 phút
(Pháp dùng giờ Berlin); Tokyo 139,69°Đ, UTC+9 → +19 phút; Nhật không giờ mùa hè từ 1952; Nga bỏ giờ mùa hè từ 2011."""
import datetime as dt
import json

import pytest
from fastapi.testclient import TestClient

from app.calc import lunar, mui_gio
from app.luangiai import sinh_nuoc_ngoai as S
from app.main import app

client = TestClient(app)
CAM = ("tzdata", "zoneinfo", "IANA", "iztro", "lunar-typescript", "AI nháp")


def test_muc_luc_chi_nuoc_co_trong_bang():
    ml = S.muc_luc()
    assert 12 <= len(ml) <= 15
    ma = {n["ma"] for n in mui_gio.danh_sach()}
    for n in ml:
        assert n["ma"] in ma and n["ten"] and n["so_thanh_pho"] >= 1 and n["mui_gio"]
    assert next(n for n in ml if n["ma"] == "au")["nam_ban_cau"] is True
    assert next(n for n in ml if n["ma"] == "jp")["gio_mua_he"] is False
    assert next(n for n in ml if n["ma"] == "us")["gio_mua_he"] is True


def test_uc_nam_ban_cau_va_lech_mat_troi():
    kq = S.nuoc("au", nam=2026)
    assert kq["ten"] == "Úc" and kq["cong_tac"]["mua_noi_sinh"] is True
    syd = next(t for t in kq["thanh_pho"] if t["ma"] == "au-sydney")
    assert syd["utc_chuan"] == 10 and syd["lech_mat_troi_phut"] == 5 and syd["canh_bao_mat_troi"] is False
    assert syd["nam_ban_cau_kha_dung"] is True and syd["gio_mua_he"] is True
    # giờ mùa hè Sydney 2026: tới 05/04 rồi lại từ 04/10 (Chủ nhật đầu tháng 10) — hai mốc đổi giờ trong năm dương
    moc = syd["doi_gio"]
    assert [m["ngay"] for m in moc] == ["2026-04-05", "2026-10-04"]
    bne = next(t for t in kq["thanh_pho"] if t["ma"] == "au-brisbane")
    assert bne["gio_mua_he"] is False and bne["doi_gio"] == []
    # tháng Tỵ Ngọ Mùi là mùa đông ở Nam bán cầu → câu hướng dẫn nêu công tắc
    assert "Mùa nơi sinh" in kq["tra_loi_nhanh"]


def test_phap_lech_mat_troi_lon_va_canh_bao():
    kq = S.nuoc("fr", nam=2026)
    paris = next(t for t in kq["thanh_pho"] if t["ma"] == "fr-paris")
    assert paris["utc_chuan"] == 1 and paris["lech_mat_troi_phut"] == -51 and paris["canh_bao_mat_troi"] is True
    assert kq["cong_tac"]["gio_mat_troi"] is True and kq["cong_tac"]["mua_noi_sinh"] is False
    assert "Giờ mặt trời thực" in kq["tra_loi_nhanh"]


def test_nhat_khong_gio_mua_he_moi_nam():
    kq = S.nuoc("jp", nam=2026)
    tokyo = next(t for t in kq["thanh_pho"] if t["ma"] == "jp-tokyo")
    assert tokyo["utc_chuan"] == 9 and tokyo["lech_mat_troi_phut"] == 19 and tokyo["gio_mua_he"] is False
    ls = kq["lich_su_gio_mua_he"]
    assert ls and all(not o["co"] for d in ls for o in d["cac_nam"])
    assert kq["cong_tac"] == {"gio_mat_troi": False, "mua_noi_sinh": False}


def test_nga_bo_gio_mua_he_tu_2011():
    kq = S.nuoc("ru", nam=2026)
    mos = next(d for d in kq["lich_su_gio_mua_he"] if d["zone"] == "Europe/Moscow")
    theo_nam = {o["nam"]: o["co"] for o in mos["cac_nam"]}
    assert theo_nam[1985] is True and theo_nam[2005] is True and theo_nam[2015] is False and theo_nam[2026] is False


def test_my_nhieu_mui_gio_va_moc_doi_gio():
    kq = S.nuoc("us", nam=2026)
    assert len({t["zone"] for t in kq["thanh_pho"]}) >= 4
    ny = next(t for t in kq["thanh_pho"] if t["ma"] == "us-new_york")
    assert ny["utc_chuan"] == -5 and [m["ngay"] for m in ny["doi_gio"]] == ["2026-03-08", "2026-11-01"]
    assert ny["doi_gio"][0]["gio"] == "02:00" and ny["doi_gio"][0]["sang"] == "mùa hè"
    la = next(t for t in kq["thanh_pho"] if t["ma"] == "us-los_angeles")
    assert la["utc_chuan"] == -8
    assert "nhiều múi giờ" in kq["tra_loi_nhanh"] or "múi giờ" in kq["tra_loi_nhanh"]


def test_lich_am_lech_viet_trung():
    kq = S.lich_am_lech(2026)
    assert kq["nam"] == 2026 and kq["tet_viet"] == "2026-02-17" and kq["tet_trung"] == "2026-02-17"
    for d in kq["ngay_lech"]:
        day = dt.date.fromisoformat(d["ngay"])
        v = lunar.solar_to_lunar(day.day, day.month, day.year, 7.0)
        t = lunar.solar_to_lunar(day.day, day.month, day.year, 8.0)
        assert v != t and d["am_viet"] and d["am_trung"]
    # 2026 không lệch Tết nhưng các năm khác có thể; hàm không ném lỗi với mọi năm trong khoảng
    for nam in (1985, 1997, 2030):
        S.lich_am_lech(nam)


def test_kb_va_ranh_gioi_loi():
    kq = S.nuoc("ca", nam=2026)
    van = json.dumps(kq, ensure_ascii=False)
    for c in CAM:
        assert c not in van, c
    assert kq["nguon"]["source_id"] and kq["nguon"]["school_id"]
    assert len(kq["hoi_dap"]) >= 4 and all(h["hoi"] and h["dap"] for h in kq["hoi_dap"])
    assert kq["huong_dan"] and "giấy khai sinh" in " ".join(kq["huong_dan"]).lower()
    assert kq["lich_am"]["nam"] == 2026


def test_nuoc_khong_co():
    assert S.nuoc("xx") is None
    assert S.nuoc("cn") is None       # có trong bảng múi giờ nhưng không nằm trong cụm trang


def test_api():
    r = client.get("/v1/sinh-nuoc-ngoai")
    assert r.status_code == 200 and len(r.json()["nuoc"]) >= 12
    r = client.get("/v1/sinh-nuoc-ngoai/au")
    assert r.status_code == 200 and r.json()["ma"] == "au"
    assert client.get("/v1/sinh-nuoc-ngoai/xx").status_code == 404
    assert client.get("/v1/sinh-nuoc-ngoai/AU").status_code in (404, 422)


def test_chi_tuyen_nam_mot_nguon():
    from app import battu_api
    assert mui_gio.CHI_TUYEN_NAM == battu_api.CHI_TUYEN_NAM
    assert mui_gio.nam_ban_cau_kha_dung(-33.87) and not mui_gio.nam_ban_cau_kha_dung(-6.2) and not mui_gio.nam_ban_cau_kha_dung(None)


def test_danh_sach_mui_gio_co_co_cong_tac():
    """Ý6 — danh sách nước/thành phố cho form hồ sơ mang sẵn cờ để web chỉ hiển thị (không tự tính)."""
    ds = client.get("/v1/dia-ly/mui-gio").json()["nuoc"]
    au = next(n for n in ds if n["ma"] == "au")
    syd = next(t for t in au["thanh_pho"] if t["ma"] == "au-sydney")
    assert syd["nam_ban_cau_kha_dung"] is True and syd["canh_bao_mat_troi"] is False and syd["lech_mat_troi_phut"] == 5
    fr = next(n for n in ds if n["ma"] == "fr")
    paris = next(t for t in fr["thanh_pho"] if t["ma"] == "fr-paris")
    assert paris["canh_bao_mat_troi"] is True and paris["nam_ban_cau_kha_dung"] is False
    khac = next(t for n in ds for t in n["thanh_pho"] if t["ma"].endswith("-khac"))
    assert khac["lech_mat_troi_phut"] is None and khac["canh_bao_mat_troi"] is False
