# -*- coding: utf-8 -*-
"""SEO-M — luật nội dung bổ sung cho trang kiến thức mỏng (KB `data/bo_sung_<loai>.json`, app/kb/bo_sung.py).

Tệp nào đã có thì phải đủ mọi trang của họ đó và đạt các luật: trả lời trước, có bảng thật, có nguồn sách,
không cụm cấm / giọng AI, không lộ tên nội bộ (BM-1), nói sức khoẻ thì kèm câu không thay lời bác sĩ, phần riêng
≥ 30 % trong họ trang. Không có tệp nào thì test vẫn xanh (khung chạy được trước khi có nội dung).
"""
import re

import pytest

from app import cong_khai
from app.kb import bo_sung, do_rieng, trang
from app.kb.tuvi_doi_song_kb import cum_cam, tim_cum_cam
from app.narrative import hoi_van

CAM_KB = ["bạn sẽ", "chắc chắn sẽ", "định mệnh", "số phận đã", "không thể tránh", "bẩm sinh", "vốn dĩ", "tiền định",
          "lời nguyền", "chết yểu", "phá sản", "ly hôn chắc", "khắc chết", "xui xẻo", "tai hoạ", "đại kỵ", "giải hạn",
          "hoá giải bằng", "vật phẩm", "chẩn đoán", "ung thư", "tiểu đường", "huyết áp", "trầm cảm", "vô sinh"]
SUC_KHOE = re.compile(r"sức khoẻ|sức khỏe|\bbệnh\b|cơ thể", re.I)
KHONG_THAY = re.compile(r"không thay (?:cho )?lời (?:khuyên của )?bác sĩ", re.I)
CO = [l for l in bo_sung.LOAI if bo_sung.doc(l)]
_cau = lambda s: [x for x in re.split(r"(?<=[.!?…])\s+", s.strip()) if x]  # noqa: E731


def _chu(bs: dict) -> list[str]:
    ra = []
    for m in bs.get("muc", []):
        ra += [m["tieu_de"], m.get("doan") or "", *(m.get("danh_sach") or [])]
    if b := bs.get("bang"):
        ra += [b["tieu_de"], b.get("chu_thich") or "", *b["cot"], *(o for d in b["dong"] for o in d)]
    for h in bs.get("hoi_dap", []):
        ra += [h["hoi"], h["dap"]]
    for x in bs.get("trich_dan", []):
        ra += [x.get("nghia") or "", x.get("sach") or "", x.get("chuong") or ""]
    ra += bs.get("y_chinh", [])
    return [s for s in ra if s]


def _slugs(loai: str) -> list[str]:
    if loai == "so":
        return [f"so-{s}" for s in trang._SO]
    return [s for _, s in trang._TRANG[loai][0]()]


def test_co_it_nhat_khung():
    assert set(bo_sung.LOAI) >= {"thap_than", "so"}


@pytest.mark.parametrize("loai", CO)
def test_goc_tep(loai):
    kb = bo_sung.doc(loai)
    for k in ("source_id", "school_id", "trang_thai", "source", "trang"):
        assert k in kb, f"{loai}: thiếu '{k}'"
    assert kb["trang_thai"] in ("nhap_ai", "da_duyet")
    thieu = set(_slugs(loai)) - set(kb["trang"])
    la = set(kb["trang"]) - set(_slugs(loai))
    assert not thieu, f"{loai}: thiếu trang {sorted(thieu)[:5]}"
    assert not la, f"{loai}: slug không có trang {sorted(la)[:5]}"


@pytest.mark.parametrize("loai", CO)
def test_luat_noi_dung(loai):
    loi = []
    for slug, bs in bo_sung.doc(loai)["trang"].items():
        d = f"{loai}/{slug}"
        muc = bs.get("muc", [])
        if len(muc) < 2:
            loi.append(f"{d}: cần ≥ 2 mục")
        for m in muc:
            if not (m.get("doan") or m.get("danh_sach")):
                loi.append(f"{d}: mục '{m['tieu_de']}' rỗng")
            if m.get("doan") and len(_cau(m["doan"])[0].split()) > 45:
                loi.append(f"{d}: câu đầu mục '{m['tieu_de']}' > 45 từ (trả lời trước, ngắn)")
        b = bs.get("bang")
        if not b or len(b["cot"]) < 2 or len(b["dong"]) < 3 or any(len(r) != len(b["cot"]) for r in b["dong"]):
            loi.append(f"{d}: bảng thiếu / sai kích thước (≥ 2 cột, ≥ 3 dòng, dòng đủ ô)")
        hd = bs.get("hoi_dap", [])
        if len(hd) < 2 or any(not h["hoi"].endswith("?") or len(h["dap"].split()) < 8 for h in hd):
            loi.append(f"{d}: hỏi đáp cần ≥ 2 câu, hỏi kết thúc '?', đáp ≥ 8 từ")
        td = bs.get("trich_dan", [])
        if not td or any(not x.get("sach") for x in td):
            loi.append(f"{d}: cần ≥ 1 trích dẫn có tên sách")
        for x in td:
            if x.get("nguyen_van") and (len(_cau(x["nguyen_van"])) > 2 or not x.get("nghia")):
                loi.append(f"{d}: nguyên văn ≤ 2 câu và phải có nghĩa")
        yc = bs.get("y_chinh", [])
        if not 3 <= len(yc) <= 5 or any(len(y) > 90 for y in yc):
            loi.append(f"{d}: y_chinh 3–5 ý, mỗi ý ≤ 90 ký tự")
        van = " ".join(_chu(bs))
        if len(van.split()) < 250:
            loi.append(f"{d}: chỉ {len(van.split())} chữ bổ sung (< 250)")
        thap = van.lower()
        for c in dict.fromkeys(CAM_KB + hoi_van.CAM):
            if c in thap:
                loi.append(f"{d}: cụm cấm '{c}'")
        for c in tim_cum_cam(van, cum_cam()):
            loi.append(f"{d}: giọng AI '{c}'")
        if SUC_KHOE.search(van) and not KHONG_THAY.search(van):
            loi.append(f"{d}: nói sức khoẻ thì kèm câu 'không thay lời bác sĩ'")
        for s in _chu(bs):
            if cong_khai.loc(s) != s:
                loi.append(f"{d}: lộ tên nội bộ (BM-1): {s[:60]}")
    assert not loi, "\n".join(loi[:40])


@pytest.mark.parametrize("loai", CO)
def test_ghep_vao_trang_va_phan_rieng(loai):
    do_rieng.ty_le.cache_clear()
    tl = do_rieng.ty_le()
    for slug in _slugs(loai):
        t = trang.lay(loai, slug)
        assert any(m.get("bang") for m in t["muc"]), f"{loai}/{slug}: chưa ghép bảng"
        assert t.get("y_chinh") and t.get("trich_dan")
        if loai == "so":
            assert all(m.get("bien_tap") for m in t["muc"] if m.get("bang") or m.get("trich_dan"))
        elif loai in {k for k, _ in tl}:
            assert tl[(loai, slug)] >= 0.30, f"{loai}/{slug}: phần riêng {tl[(loai, slug)]} < 0.30"
