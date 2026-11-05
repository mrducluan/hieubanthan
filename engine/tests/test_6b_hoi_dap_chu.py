# -*- coding: utf-8 -*-
"""6b (chủ dự án giao 2026-11-04): sáu câu hỏi còn mở sau kiểm toán SEO/GEO — `docs/AUDIT-SEO-GEO-2026-11.md` mục 6b."""
import datetime as dt

import pytest

from app.calc import phongthuy as pt
from app.luangiai import hoang_lich as hl
from app.luangiai import phongthuy_doi_song as pds
from app.luangiai import trang_tuoi
from app.luangiai import tuoi_dan_gian as L


# ---------------------------------------------------------------- 6b-2 làm nhà năm tuổi / xung tuổi
def test_lam_nha_nam_tuoi_khong_doi_muc_nhung_ghi_chu():
    """1981 Tân Dậu, năm 2029 Kỷ Dậu: không phạm Kim lâu / Hoang ốc / Tam tai → vẫn "thuận", kèm lời năm tuổi."""
    d = L.xem_tuoi_lam_nha(1981, 2029)
    assert d["ket_luan"]["ma"] == "thuan"
    assert d["nam_tuoi"]["ma"] == "trung"
    assert "năm tuổi" in d["nam_tuoi"]["chu"] and "mượn tuổi" in d["nam_tuoi"]["chu"]
    assert "năm tuổi" in d["ket_luan"]["chu"]
    assert "năm tuổi" in d["tra_loi_nhanh"]


def test_lam_nha_xung_tuoi_ghi_chu():
    d = L.xem_tuoi_lam_nha(1981, 2023)     # Quý Mão xung Dậu
    assert d["nam_tuoi"]["ma"] == "xung"
    assert "xung tuổi Dậu" in d["nam_tuoi"]["chu"]


def test_lam_nha_nam_thuong_khong_co_ghi_chu():
    d = L.xem_tuoi_lam_nha(1981, 2027)     # Đinh Mùi — không trùng, không xung Dậu
    assert d["nam_tuoi"] is None


def test_muoi_nam_trang_tuoi_co_co_nam_tuoi():
    rows = trang_tuoi.lam_nha(2027, 1981)["muoi_nam"]
    r29 = next(r for r in rows if r["nam"] == 2029)
    assert r29["nam_tuoi"] == "trung" and r29["thuan"] is True
    assert next(r for r in rows if r["nam"] == 2027)["nam_tuoi"] is None


# ---------------------------------------------------------------- 6b-5 Nhà của bạn: nhóm theo lưng nhà
@pytest.mark.parametrize("cua_hop,cung_nhom", [(True, True), (True, False), (False, True), (False, False)])
def test_cau_nhom_noi_ro_lung_nha(cua_hop, cung_nhom):
    trach = pt.trach("Đông Nam")
    mq = {"nhom": "Tây tứ mệnh" if cung_nhom else "Đông tứ mệnh"}
    c = pds._cau_nhom(trach, mq, cua_hop, cung_nhom)
    assert "lưng nhà" in c and "toạ Tây Bắc" in c and "nhóm Tây" in c
    assert "bố trí dễ" not in c
    if not cua_hop:
        assert "đều thuận" not in c


def test_cua_chinh_noi_ve_cua_dang_co():
    """Nhà đang quay Đông Nam: gợi ý cửa chính nói về cửa đang có, không bảo 'cửa chính phía Tây Nam'."""
    mq = pt.menh_quai(1981, "nu")   # Cấn — Tây tứ mệnh, Đông Nam là phía kém
    c3 = pds._chuong_tung_phong(mq, "Đông Nam", None, None, None)
    g = next(x["goi_y"] for x in c3["goi_y_phong"] if x["phong"] == "cua_chinh")
    assert g.startswith("Cửa chính: đang quay về Đông Nam") and "không cần đổi cửa" in g


# ---------------------------------------------------------------- 6b-3 trang mệnh: hướng theo cung phi, không theo ngũ hành
def test_trang_menh_khong_goi_huong_theo_ngu_hanh():
    from app.kb import trang_menh
    tr = trang_menh.trang_menh_nam(1981, "sinh-nam-1981-menh-gi")
    muc = {m["tieu_de"]: m for m in tr["muc"]}
    mau = next(m for k, m in muc.items() if k.startswith("Màu"))
    chu = " ".join([mau.get("doan", "")] + mau.get("danh_sach", []))
    for h in ("hướng Đông", "hướng Tây", "hướng Nam", "hướng Bắc", "Đông Bắc/Tây Nam"):
        assert h not in chu, h
    cp = next(m for k, m in muc.items() if k.startswith("Cung phi"))
    cpt = " ".join([cp.get("doan", "")] + cp.get("danh_sach", []))
    # 1981 (Lập xuân): nam Khảm, nữ Cấn — hướng tốt nhất (Sinh Khí) Đông Nam / Tây Nam
    assert "Nam 1981: cung Khảm" in cpt and "Đông Nam" in cpt
    assert "Nữ 1981: cung Cấn" in cpt and "Tây Nam" in cpt
    assert any("hướng" in h["hoi"] for h in tr["hoi_dap"])


# ---------------------------------------------------------------- 6b-4 thần số: một cách chia nhóm cho mọi trang
NHOM = {1: (1, 5, 7), 5: (1, 5, 7), 7: (1, 5, 7), 2: (2, 4, 8), 4: (2, 4, 8), 8: (2, 4, 8),
        3: (3, 6, 9), 6: (3, 6, 9), 9: (3, 6, 9), 11: (2, 4, 8), 22: (2, 4, 8), 33: (3, 6, 9)}


@pytest.mark.parametrize("so", sorted(NHOM))
def test_trang_tinh_yeu_cung_nhom_voi_trang_y_nghia_so(so):
    """Trang "Số n trong tình yêu" và trang "Ý nghĩa số n" nói cùng một nhóm (trước: số 7 'hợp 4, 7, 9' ↔ 'nhóm 1, 5, 7')."""
    import json
    import re
    from pathlib import Path
    data = Path(__file__).resolve().parents[1] / "app" / "kb" / "data"
    ty = json.loads((data / "bo_sung_tinh_yeu.json").read_text(encoding="utf-8"))["trang"][f"so-{so}-trong-tinh-yeu"]["bang"]["chu_thich"]
    ys = json.dumps(json.loads((data / "bo_sung_so.json").read_text(encoding="utf-8"))["trang"][f"so-{so}"], ensure_ascii=False)
    g = NHOM[so]
    khac = [x for x in g if x != so] if so in g else list(g)
    nhom_ty = re.search(r"cùng nhóm (?:với số )?([\d, và]+)", ty)
    assert nhom_ty, ty
    so_ty = {int(x) for x in re.findall(r"\d+", nhom_ty.group(1))}
    assert so_ty >= set(khac), (so, ty)
    assert "trang Ý nghĩa số" in ty
    # trang ý nghĩa số nêu cùng các số đó trong câu nói về nhóm
    assert all(str(x) in ys for x in khac)


# ---- 6b-1: trang ngày và trang "ngày tốt {việc} tháng" phải cùng một kết luận ----
def test_ngay_xem_viec_lon_khop_trang_viec_thang():
    import datetime as dt
    from app.luangiai import hoang_lich as h
    d = dt.date(2027, 1, 1)
    r = h.ngay_xem(d)
    v6 = {v["ma"]: v for v in r["viec_lon"]}
    assert set(v6) == {v["ma"] for v in h.VIEC_SEO}
    # Sách ghi nên cưới gả nhưng kiêng Dạm ngõ, Đính ước (sách xưa: Nạp thái, Đính minh) → không phải ngày tốt cưới hỏi (đúng như trang việc-tháng).
    assert v6["cuoi_hoi"]["danh_gia"] == "tranh"
    assert "Dạm ngõ" in v6["cuoi_hoi"]["chu"] and "Đính ước" in v6["cuoi_hoi"]["chu"]
    ds = {x["ngay"] for x in h.viec_thang("cuoi_hoi", 2027, 1)["ngay"]}
    assert d.isoformat() not in ds
    for v in h.VIEC_SEO:
        ngay_tot = {x["ngay"] for x in h.viec_thang(v["ma"], 2027, 1)["ngay"]}
        assert (v6[v["ma"]]["danh_gia"] == "tot") == (d.isoformat() in ngay_tot), v["ma"]
    # Câu trả lời nhanh nói rõ, không để "nên cưới hỏi" đứng một mình.
    t = r["tra_loi_nhanh"]
    assert "chưa xếp vào ngày tốt" in t and "cưới hỏi" in t.split("chưa xếp vào ngày tốt")[1]
    assert "về nhà mới" in t.split("chưa xếp vào ngày tốt")[0]


def test_ngay_xem_viec_lon_khop_ca_thang():
    import datetime as dt
    from app.luangiai import hoang_lich as h
    for viec in h.VIEC_SEO:
        tot = {x["ngay"] for x in h.viec_thang(viec["ma"], 2027, 2)["ngay"]}
        for i in range(28):
            d = dt.date(2027, 2, 1) + dt.timedelta(days=i)
            v = next(x for x in h.ngay_xem(d)["viec_lon"] if x["ma"] == viec["ma"])
            assert (v["danh_gia"] == "tot") == (d.isoformat() in tot)
            assert v["slug"] == viec["slug"] and v["chu"]


def test_viec_thang_neu_ngay_dep_nhat_va_hoang_dao():
    from app.luangiai import hoang_lich as h
    r = h.viec_thang("cuoi_hoi", 2027, 1)
    assert r["dep_nhat"] and "Đẹp nhất" in r["tra_loi_nhanh"]
    so_hd = sum(x["hoang_dao"] for x in r["ngay"])
    assert f"{so_hd} ngày hoàng đạo" in r["tra_loi_nhanh"]
