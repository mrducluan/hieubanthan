# -*- coding: utf-8 -*-
"""TV-YBS đợt 3 — ý Tử vi bổ sung (KB `tuvi_y_bo_sung.json`) trên trang kiến thức Tử vi.

Luật: ý `hien_thi = "hop"` → mục "Thêm một cách đọc"; ý `goc_nhin_khac` → mục gập "Góc nhìn khác (tham khảo)". Chỉ hiện
trên ĐÚNG trang khớp điều kiện tĩnh (sao, cung, hoá): sao + cung cụ thể → "sao ở cung"; sao không gắn cung → trang
sao; hoá + cung (không có chính tinh) → "Hoá ở cung"; còn lại có cung cụ thể → trang cung. Ý cần hai lá số, ý chỉ
mô tả bằng ghi chú (chưa cơ học hoá), ý `khong` → không trang nào. Mỗi mục ≤ 3 ý; lời không doạ, không tên bệnh,
không lộ tên người / khoá học (BM-1); ý sức khoẻ luôn kèm câu không thay lời bác sĩ.
"""
from __future__ import annotations

import json
import re

import pytest

from app.kb import trang, trang_tuvi as ttv, tuvi_y_bo_sung as ybs
from app.kb.tuvi_doi_song_kb import tim_cum_cam

TIEU_DE_HOP, TIEU_DE_KHAC = "Thêm một cách đọc", "Góc nhìn khác (tham khảo)"
CAM = ["bạn sẽ", "chắc chắn sẽ", "định mệnh", "số phận đã", "không thể tránh", "tiền định", "lời nguyền", "chết yểu",
       "phá sản", "khắc chết", "xui xẻo", "tai hoạ", "đại kỵ", "giải hạn", "hoá giải", "vật phẩm", "chẩn đoán",
       "ung thư", "tiểu đường", "huyết áp", "trầm cảm", "vô sinh", "sẽ ốm", "tai nạn", "chết", "bệnh"]
BM1 = re.compile(r"Nghê|Hải Hạ|倪|Ni Hai|tianji|Thiên Kỷ|天紀|Renhuai|ziwei-doushu|bài giảng|khoá học|khóa học|"
                 r"tam_hop_hien_dai|tham_khao_tam_hop|yb\.", re.I)
KHONG_THAY = re.compile(r"không thay (?:cho )?lời (?:khuyên của )?bác sĩ", re.I)


def _trang_tuvi():
    """(loại, khoá trang, trang đã dựng) của 4 họ trang Tử vi."""
    ra = [("sao", ten, trang._trang_sao(ten, s)) for ten, s in trang._ds_sao()]
    for loai in ("cung", "sao_cung", "hoa_cung"):
        ds, dung = trang._TRANG[loai]
        ra += [(loai, k, dung(k, s)) for k, s in ds()]
    return ra


TRANG = _trang_tuvi()


def _muc(t, tieu_de):
    return [m for m in t["muc"] if m["tieu_de"] == tieu_de]


def test_noi_dung_y_dung_trang():
    """Một số ý mẫu: đúng trang khớp điều kiện; ý khớp nhiều trang cùng họ chỉ đặt ở trang đầu (phần riêng SEO-K/M)."""
    noi, tat_ca = ttv.noi_y_bo_sung(), {m["id"]: ttv._noi_tat_ca(m) for m in ttv._ybs()}
    assert noi["yb.sao.tham_lang_ty_hoi"] == [("sao_cung", ("Tham Lang", "Mệnh"))]
    assert sorted(tat_ca["yb.cap.liem_sat_sang"]) == [("sao", "Liêm Trinh"), ("sao", "Thất Sát")]
    assert noi["yb.cap.liem_sat_sang"] == [("sao", "Liêm Trinh")]
    assert noi["yb.cung.phu_the_quyen_chu_dong"] == [("hoa_cung", ("Quyền", "Phu Thê"))]
    assert sorted(tat_ca["yb.hon.co_qua_phu_the"]) == [("cung", "Mệnh"), ("cung", "Phu Thê")]
    assert noi["yb.cap.tu_phu_giap_menh"] == [("cung", "Mệnh")]                  # sao kẹp hai bên, không toạ Mệnh
    assert sorted(tat_ca["yb.cap.cu_nhat_loi_noi"]) == [("sao_cung", ("Cự Môn", "Mệnh")),
                                                        ("sao_cung", ("Thái Dương", "Mệnh"))]
    assert sorted(tat_ca["yb.hoa.khoa_quyen_cung_hoi"]) == [("hoa_cung", ("Khoa", "Mệnh")), ("hoa_cung", ("Quyền", "Mệnh"))]
    for ma, ds in noi.items():
        assert len(ds) == 1 and ds[0] == tat_ca[ma][0], ma
    for ma in ("yb.hai.phu_the_trung_menh_nguoi_kia", "yb.cung.no_boc_cat_hop_tac", "yb.cung.sao_dung_cho",
               "yb.cap.hung_tu_kinh_doanh", "yb.cung.han_cung_co_nguoi_cuoi", "yb.pp.sat_sang_ham"):
        assert not noi.get(ma), ma
    an = {m["id"] for m in json.loads(ybs.TEP.read_text(encoding="utf-8"))["muc"] if m["hien_thi"] == "khong"}
    assert not an & set(noi)


def test_y_chi_tren_trang_khop():
    """Mọi ý trên trang (theo mã nội bộ) thuộc đúng danh sách trang của ý đó; trang ngoài danh sách không có."""
    noi = ttv.noi_y_bo_sung()
    co = {}
    for loai, k, _ in TRANG:
        for m in ttv.y_cho_trang(loai, k):
            co.setdefault(m["id"], []).append((loai, k))
    for ma, ds in co.items():
        assert set(ds) <= set(noi[ma]), ma
    assert co, "không trang nào có ý bổ sung"


def test_muc_tren_trang():
    tong_hop = tong_khac = 0
    for loai, k, t in TRANG:
        h, kh = _muc(t, TIEU_DE_HOP), _muc(t, TIEU_DE_KHAC)
        assert len(h) <= 1 and len(kh) <= 1, (loai, k)
        y = ttv.y_cho_trang(loai, k)
        so_hop = sum(1 for m in y if m["hien_thi"] == "hop")
        so_khac = len(y) - so_hop
        assert bool(h) == bool(so_hop) and bool(kh) == bool(so_khac), (loai, k)
        for m, hien in ((h, "hop"), (kh, "goc_nhin_khac")):
            if not m:
                continue
            m = m[0]
            ds = [x for x in m["danh_sach"] if not KHONG_THAY.search(x) or "Nên làm:" in x]
            assert 1 <= len(ds) <= 3, (loai, k, len(ds))
            assert all("Nên làm:" in x and x.startswith("Khi ") for x in ds), (loai, k)
            assert m.get("bien_tap") is True
            assert (m.get("gap") is True) == (hien == "goc_nhin_khac")
        tong_hop += bool(h)
        tong_khac += bool(kh)
        # mục mới đứng trước "Câu hỏi tự soi" (mục cuối giữ nguyên; trang "Hoá ở cung" không có mục này)
        if loai != "hoa_cung":
            assert t["muc"][-1]["tieu_de"] == "Câu hỏi tự soi", (loai, k)
    assert tong_hop >= 40 and tong_khac >= 20, (tong_hop, tong_khac)


def test_loi_an_toan_bm1_suc_khoe():
    for loai, k, t in TRANG:
        for m in _muc(t, TIEU_DE_HOP) + _muc(t, TIEU_DE_KHAC):
            van = " ".join([m["tieu_de"], m.get("doan") or "", *m["danh_sach"]])
            thap = van.replace(ttv._KHONG_THAY_BAC_SI, "").lower()
            assert not [c for c in CAM if re.search(rf"(?<!\w){re.escape(c)}(?!\w)", thap)], (loai, k, van[:200])
            assert not tim_cum_cam(van), (loai, k, tim_cum_cam(van))
            assert not BM1.search(van), (loai, k, BM1.search(van))
            for x in m["danh_sach"]:
                if re.search(r"sức khoẻ|sức khỏe|đôi mắt|khám|cơ thể", x):
                    assert KHONG_THAY.search(" ".join(m["danh_sach"])), (loai, k, x)
        assert not BM1.search(" ".join(t["nguon"])), (loai, k)


@pytest.mark.parametrize("loai", ["sao_cung", "hoa_cung"])
def test_trang_lay_qua_api_giu_muc(loai):
    """Trang đi qua `trang.lay` (EEAT, ngày) vẫn giữ mục mới — bản .md dựng từ cùng JSON."""
    ds, _ = trang._TRANG[loai]
    for k, s in ds():
        if ttv.y_cho_trang(loai, k):
            t = trang.lay(loai, s)
            assert _muc(t, TIEU_DE_HOP) or _muc(t, TIEU_DE_KHAC)
            break
    else:
        pytest.fail("không có trang mẫu")
