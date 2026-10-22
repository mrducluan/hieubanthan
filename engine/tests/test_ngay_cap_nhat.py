# -*- coding: utf-8 -*-
"""SEO-L4 — sổ ngày cập nhật thật phải khớp nội dung trang kiến thức (bắt quên chạy `scripts/ngay_cap_nhat.py`).

Nhánh `quan-tri/…` (sửa KB từ trang quản trị, chủ dự án không chạy lệnh được) đặt NGAY_CAP_NHAT_KIEM=0 trong CI:
khi đó chỉ kiểm khuôn sổ; trang giữ ngày cũ tới lần chạy lệnh kế tiếp."""
import os
import subprocess
import sys
from pathlib import Path

from app.kb import ngay_cap_nhat as ncn
from app.kb import trang

GOC = Path(__file__).resolve().parents[1]


def test_so_dung_khuon():
    so = ncn.doc_so()
    assert len(so) >= 500
    for k, v in so.items():
        assert "/" in k and len(v["bam"]) == 16 and v["dang"] <= v["sua"], k


def test_trang_lay_ngay_tu_so():
    t = trang.lay("sao_cung", "tu-vi-cung-menh")
    m = ncn.doc_so()["sao_cung/tu-vi-cung-menh"]
    assert t["ngay_dang"] == m["dang"] and t["cap_nhat"] >= m["sua"]
    # danh sách (sitemap) mang cùng ngày
    d = next(x for x in trang.danh_sach() if x["slug"] == "tu-vi-cung-menh")
    assert d["cap_nhat"] == t["cap_nhat"] and d["ngay_dang"] == t["ngay_dang"]


def test_ngay_khong_cung_mot_ngay_cho_ca_kho():
    assert len({v["sua"] for v in ncn.doc_so().values()}) > 1


def test_so_khop_noi_dung_hien_tai():
    if os.environ.get("NGAY_CAP_NHAT_KIEM") == "0":
        return
    r = subprocess.run([sys.executable, "scripts/ngay_cap_nhat.py", "--kiem"], cwd=GOC, capture_output=True, text=True)
    assert r.returncode == 0, ("Nội dung trang kiến thức đã đổi — chạy `python scripts/ngay_cap_nhat.py` rồi commit "
                               "app/kb/data/ngay_cap_nhat.json.\n" + r.stdout)


def test_bam_bo_qua_truong_bien_tap():
    t = trang.lay("que", "que-1-can")
    t2 = {**t, "tham_dinh": {"nguoi": "duc-luan", "ngay": "2030-01-01"}, "trang_thai": "da_duyet", "cap_nhat": "2030-01-01"}
    assert ncn.bam(t) == ncn.bam(t2)                       # duyệt bài không làm lệch sổ
    assert ncn.bam(t) != ncn.bam({**t, "tra_loi_nhanh": t["tra_loi_nhanh"] + " x"})   # sửa chữ thì lệch
