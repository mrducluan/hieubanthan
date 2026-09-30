# -*- coding: utf-8 -*-
"""Phần dùng chung cho mọi module hỏi đáp Huyền học (RULES, không LLM).

Tái dùng bộ chuẩn hoá và danh sách an toàn/từ chối của thần số (app.luangiai.hoi)
— không sửa chúng — và thêm các mẫu riêng của Huyền học.
"""
from __future__ import annotations

from app.luangiai import hoi as _h

chuan_hoa = _h.chuan_hoa
co = _h._co
dem = _h._dem

AN_TOAN_THEM = [r"chang con ly do", r"con ly do de song", r"ket thuc som", r"muon bien mat",
                r"danh dap", r"khong thiet song"]
TU_CHOI_THEM = [r"so de", r"song duoc bao lau", r"nao chet", r"tho bao nhieu", r"doan benh",
                r"benh gan", r"yem bua", r"chua duoc benh", r"nen tuyen", r"tuyen nhan vien",
                r"de quyet dinh tuyen", r"chon so lo", r"so lo"]

# Lĩnh vực thần số → khoá lĩnh vực đời sống dùng chung cho Huyền học.
LV_DOI_SONG = {"su_nghiep": "cong_viec", "tinh_yeu": "tinh_cam", "gia_dinh": "gia_dinh",
               "con_cai": "gia_dinh", "tai_chinh": "tien_bac", "hoc_tap": "hoc_hanh"}


def dac_biet(t: str) -> str | None:
    """'an_toan' | 'tu_choi_nhe' | None — ưu tiên cao nhất, mọi chế độ."""
    if co(t, _h.AN_TOAN) or co(t, AN_TOAN_THEM):
        return "an_toan"
    if any(co(t, m) for m in _h.TU_CHOI.values()) or co(t, TU_CHOI_THEM):
        return "tu_choi_nhe"
    return None


def linh_vuc_doi_song(t: str) -> str | None:
    diem = {lv: dem(t, kw) for lv, kw in _h.LINH_VUC_KW.items() if lv in LV_DOI_SONG}
    tot = max(diem.values())
    if tot == 0:
        return None
    return LV_DOI_SONG[max(diem, key=lambda k: diem[k])]


def ket(goi: dict) -> dict:
    """Điền so_trong_goi để bộ kiểm tra đầu ra chặn số lạ (như thần số)."""
    return _h._ket(goi)
