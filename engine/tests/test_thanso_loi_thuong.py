# -*- coding: utf-8 -*-
"""Trục 2 UX (2026-10-26) — chữ thần số hiện ra giao diện phải là lời thường, không lộ mã nội bộ. Viết TRƯỚC khi sửa.

Báo cáo người dùng mới thấy trên /than-so: "cách cộng Đường đời: tung_phan", "Pitago · nợ nghiệp ngay_sinh 14",
"Kết quả theo quy ước chính thức (quy tắc Y khoá)". Test quét mọi chuỗi CHỮ (bỏ qua các trường mã như `ma`, `vi_tri`,
`phai`…) của các bài đọc thần số: không có từ dạng snake_case (vd tung_phan, ngay_sinh, tong_het).
"""
import datetime as dt
import re

from app.luangiai import ban_do_con_so, tong_hop, thanso, thanso_chaldean
from app.narrative import hoi_van

MA = re.compile(r"\b[a-z]+(?:_[a-z0-9]+)+\b")
# Trường chứa MÃ (web không in thẳng ra) — không quét.
TRUONG_MA = {"ma", "vi_tri", "loai", "phai", "quan_he", "nhom", "school_id", "source_id", "quy_uoc_duong_doi", "trang_thai",
             "muc", "ma_mau", "che_do", "y_dinh", "linh_vuc", "xu_ly", "tru", "doi_tuong", "id", "khoa", "engine_version",
             "loai_goc", "tu_chuong", "phien_ban", "mat", "vai", "do_phu", "kieu", "nguon_id"}
NGAY_XEM = dt.date(2026, 10, 26)
NGUOI = [("Trần Thị Mai", 14, 3, 1998), ("Nguyễn Đức Luân", 24, 10, 1988), ("Lê Văn Bình", 19, 7, 1985), ("Phạm Thu Hà", 13, 4, 1993)]


def _quet(x, duong="", gap=None):
    gap = [] if gap is None else gap
    if isinstance(x, dict):
        for k, v in x.items():
            if k in TRUONG_MA and not isinstance(v, (dict, list)):
                continue
            _quet(v, f"{duong}.{k}", gap)
    elif isinstance(x, list):
        for v in x:
            _quet(v, duong + "[]", gap)
    elif isinstance(x, str):
        gap += [(duong, m, x) for m in MA.findall(x)]
    return gap


def test_khong_lo_ma_trong_bai_doc_than_so():
    gap = []
    for ten, d, t, n in NGUOI:
        for qu in ("tong_het", "tung_phan"):
            gap += _quet(thanso.luan_giai([ten], d, t, n, quy_uoc=qu))
            gap += _quet(tong_hop.tong_hop([ten], d, t, n, NGAY_XEM, quy_uoc=qu))
            gap += _quet(thanso_chaldean.luan_chaldea([ten], d, t, n, quy_uoc=qu))
            gap += _quet(ban_do_con_so.bao_cao([ten], d, t, n, NGAY_XEM, quy_uoc=qu))
    assert gap == []


def test_khong_lo_ma_trong_hoi_dap():
    gap = []
    for ten, d, t, n in NGUOI[:2]:
        nguoi = {"ho_ten": [ten], "ngay": d, "thang": t, "nam": n, "quy_uoc": "tung_phan"}
        for cau in ("Tôi hợp nghề gì?", "Năm nay của tôi thế nào?", "Tôi có nợ nghiệp không?", "Tình cảm của tôi ra sao?"):
            for phai in ("pitago", "chaldea", "tong_hop"):
                gap += _quet(hoi_van.tra_loi(cau, nguoi, None, NGAY_XEM, dung_llm=False, phai=phai))
    assert gap == []


def test_tom_tat_do_tin_khong_thuat_ngu_noi_bo():
    kq = thanso.luan_giai(["Trần Thị Mai"], 14, 3, 1998)
    assert "Y khoá" not in kq["tom_tat_do_tin"] and "quy tắc" not in kq["tom_tat_do_tin"]
    assert "/4" in kq["tom_tat_do_tin"]          # vẫn nói bao nhiêu chỉ số giữ nguyên khi đổi cách viết tên


def test_no_nghiep_tong_hop_noi_vi_tri_bang_loi_thuong():
    # 14/3/1998: ngày sinh 14 = nợ nghiệp (Pitago) = số kép 14 (Chaldea) → cạnh "bổ sung" giữa hai phái.
    kq = tong_hop.tong_hop(["Trần Thị Mai"], 14, 3, 1998, NGAY_XEM, quy_uoc="tung_phan")
    ten = [s["ten"] for t in kq["tuong_tac"] if t["quan_he"] == "bo_sung" for s in t["cac_so"]]
    assert "Pitago · nợ nghiệp ở ngày sinh" in ten


def test_ban_do_can_cu_goi_ten_cach_tinh():
    for qu, chu in (("tung_phan", "Rút gọn con số"), ("tong_het", "Cộng hết chữ số")):
        bc = ban_do_con_so.bao_cao(["Trần Thị Mai"], 14, 3, 1998, NGAY_XEM, quy_uoc=qu)
        cc = " ".join(x for c in bc["chuong"] for x in c.get("can_cu") or [])
        assert chu in cc and qu not in cc
