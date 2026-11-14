# -*- coding: utf-8 -*-
"""KT-PT1 — kho nguồn «陽宅十書» (Dương Trạch Thập Thư, Minh; bản chép trong Cổ Kim Đồ Thư Tập Thành quyển 675–677) và
đối chiếu PHÉP TÍNH Bát trạch của engine với chính sách:

  • «論大遊年第三» — bài Đại du niên ca (乾六天五禍絕延生…) ↔ `phongthuy.bang_huong` (8 quái × 7 hướng còn lại);
  • «三元甲子福德宮定局» — bảng cung phi nam / nữ của 180 năm (thượng – trung – hạ nguyên) ↔ `phongthuy.menh_quai`;
  • «福元說» — nam trung cung gửi Khôn, nữ trung cung gửi Cấn; Đông tứ = Chấn Tốn Khảm Ly.
Câu trích trong KB Phong thuỷ (`du_nien.*.sach`, `bo_tri.*.sach`) phải là chuỗi con của kho nguồn.
Quyển 678 (論符鎮, bùa trấn) cố ý không nạp.
"""
from __future__ import annotations

import json
import re
from pathlib import Path

from app.calc import phongthuy as pt
from app.kb import phongthuy_kb, trang_phongthuy
from app.hoidap import phongthuy as hd

ROOT = Path(__file__).resolve().parent.parent
KHO = json.loads((ROOT / "fixtures" / "nguon" / "duong_trach_thap_thu.json").read_text("utf-8"))
KB = json.loads((ROOT / "app" / "kb" / "data" / "phongthuy_kb.json").read_text("utf-8"))
VAN = "".join(m["van"] for q in KHO["quyen"] for m in q["muc"])

QUAI = {"乾": "Càn", "坎": "Khảm", "艮": "Cấn", "震": "Chấn", "巽": "Tốn", "離": "Ly", "坤": "Khôn", "兌": "Đoài"}
VONG = "乾坎艮震巽離坤兌"                      # thứ tự bài ca: đi vòng tám cung Hậu thiên từ Tây Bắc
SAO = {"生": "Sinh Khí", "延": "Diên Niên", "天": "Thiên Y", "禍": "Hoạ Hại", "六": "Lục Sát", "五": "Ngũ Quỷ", "絕": "Tuyệt Mệnh"}


def _muc(ten: str) -> str:
    return next(m["van"] for q in KHO["quyen"] for m in q["muc"] if m["ten"] == ten)


def test_kho_nguon_du_ba_quyen_khong_co_bua():
    assert [q["tap_thanh"] for q in KHO["quyen"]] == [675, 676, 677]
    assert KHO["can_doi_chieu"] is True and all(q["revid"] and q["muc"] for q in KHO["quyen"])
    ten = [m["ten"] for q in KHO["quyen"] for m in q["muc"]]
    for t in ("論宅外形第一", "論福元第二", "論大遊年第三", "論穿宮九星第四", "論開門修造門第六", "論放水第七", "論宅內形第八"):
        assert t in ten, t
    assert "論符鎮第十" not in ten and "符" not in "".join(ten)
    assert not re.search(r"[<>，。、；：「」《》]", VAN)                 # không thẻ HTML, không dấu câu Wikisource


def test_dai_du_nien_ca_khop_phep_tinh():
    ca = _muc("論大遊年第三")
    ca = ca[ca.index("乾六天五禍絕延生"):]
    assert len(ca) == 64
    for i in range(8):
        cau = ca[i * 8:(i + 1) * 8]
        goc = cau[0]
        assert goc == VONG[i]
        bang = pt.bang_huong(QUAI[goc])
        assert bang[pt.QUAI[QUAI[goc]][1]] == "Phục Vị"
        for j, chu in enumerate(cau[1:], 1):
            dich = QUAI[VONG[(i + j) % 8]]
            assert bang[pt.QUAI[dich][1]] == SAO[chu], f"{goc} → {dich}: sách {SAO[chu]}, engine {bang[pt.QUAI[dich][1]]}"


def _bang_180() -> list[tuple[str, str]]:
    v = _muc("三元甲子福德宮定局")
    v = v[:v.index("以上三元甲子")]
    o = re.findall(r"(〈男中寄坤〉|男[乾坎艮震巽離坤兌])(〈女中寄艮〉|女[乾坎艮震巽離坤兌])", v)
    return [("Khôn" if "中" in a else QUAI[a[1]], "Cấn" if "中" in b else QUAI[b[1]]) for a, b in o]


def test_bang_cung_phi_180_nam_khop_phep_tinh():
    """Thượng nguyên Giáp Tý = 1504 (Hoằng Trị 17) → chu kỳ 180 năm: 1864 thượng · 1924 trung · 1984 hạ."""
    bang = _bang_180()
    assert len(bang) == 180
    for i, (nam_s, nu_s) in enumerate(bang):
        for goc in (1864, 2044 - 180 * 2):           # hai chu kỳ: 1684–1863 và 1864–2043
            y = goc + i
            assert pt.menh_quai(y, "nam")["quai"] == nam_s, f"{y} nam: sách {nam_s}"
            assert pt.menh_quai(y, "nu")["quai"] == nu_s, f"{y} nữ: sách {nu_s}"
    assert bang[0] == ("Khảm", "Cấn") and bang[60] == ("Tốn", "Khôn") and bang[120] == ("Đoài", "Cấn")


def test_phuc_nguyen_thuyet():
    v = _muc("福元說")
    assert "男中五則寄坤宮女中五則寄艮宮" in v
    assert "震巽坎離福德為東四位生人乾坤艮兌福德為西四位生人" in v
    assert pt.DONG_TU == {"Chấn", "Tốn", "Khảm", "Ly"}
    assert "生者生氣星貪狼星也一木延者延年星武曲星也一金天者天乙星巨門星也一土" in _muc("吉星三")


def _cac_cau():
    for nhom in ("du_nien", "bo_tri"):
        for ma, m in KB[nhom].items():
            if m.get("sach"):
                yield nhom, ma, m["sach"]


def test_cau_trich_kb_la_nguyen_van():
    cau = list(_cac_cau())
    assert len([c for c in cau if c[0] == "du_nien"]) == 8 and len(cau) >= 15
    for nhom, ma, c in cau:
        assert c["nguon"] == "duong_trach_thap_thu" and c["nguon"] in KB["source_ten"], ma
        assert c["han"] in VAN, f"{nhom}.{ma}: «{c['han']}» không có trong kho nguồn"
        assert c["trich"] and c["y"] and "—" not in c["y"], ma


def test_cau_sach_khong_doa():
    """Chỉ trích câu trung tính: phần đoán hoạ của sách (chết, tuyệt, ôn dịch, kiện…) không vào lời."""
    for nhom, ma, c in _cac_cau():
        if nhom == "bo_tri":                          # tên du niên vốn mang chữ 鬼 / 絕 (Ngũ Quỷ, Tuyệt Mệnh)
            assert not re.search(r"[死絕瘟訟哭鬼盜淫]", c["han"]), ma
        assert not re.search(r"chết|tuyệt tự|ôn dịch|tai hoạ|hoạ sát", c["y"].lower()), ma


def test_cau_sach_hien_o_trang_dau_hieu_va_hoi_dap():
    ma, slug = next((m, s) for m, s in trang_phongthuy.ds_dau_hieu() if m == "duong_dam")
    tr = trang_phongthuy.trang_dau_hieu(ma, slug)
    muc = next(x for x in tr["muc"] if x["tieu_de"] == "Nguyên văn sách xưa")
    assert "凡宅不居當衝口處" in muc["doan"] and "Dương Trạch Thập Thư" in muc["doan"]
    assert "«生者生氣星貪狼星也一木»" in hd._cau_sach(phongthuy_kb.du_nien("Sinh Khí"))
    assert hd._cau_sach({"tieu_de": "x"}) == ""
