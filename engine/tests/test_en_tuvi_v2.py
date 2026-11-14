# -*- coding: utf-8 -*-
"""EN-ALL GĐ 4 (agent C) — bản Anh của phi hoá / nhịp 3 tháng / xem lá số 2 người: bản phủ KB đủ, câu không lặp, không
doạ, không cụm cấm tiếng Anh; nhãn mức hai người theo nghĩa KB; bản Việt của KB không bị bản phủ chạm tới."""
import itertools
import json
import re
from pathlib import Path

from app import ngon_ngu
from app.kb import nap, tuvi_hai_nguoi_kb as hkb

DATA = Path(__file__).resolve().parents[1] / "app" / "kb" / "data"
VIET = re.compile(r"[ăâđêôơưàáạảãầấậẩẫằắặẳẵèéẹẻẽềếệểễìíịỉĩòóọỏõồốộổỗờớợởỡùúụủũừứựửữỳýỵỷỹ]", re.I)
TIEU_CHI = ("menh", "can", "chi", "cung_phi", "tu_vi")
MUC = ("hop", "binh_hoa", "can_dung_hoa")
QUAN_HE = ("nguoi_yeu", "vo_chong", "ban_be", "dong_nghiep", "doi_tac", "sep", "cha_me_con", "gia_dinh")
# Không phán chia tay / cưới hay không, không doạ, không vật phẩm.
TU_DOA_EN = ("should not marry", "shouldn't marry", "break up", "divorce", "doomed", "bad omen", "curse", "amulet",
             "talisman", "disaster", "fatal", "never work")


def _chuoi(x):
    if isinstance(x, str):
        return [x]
    if isinstance(x, dict):
        return [s for k, v in x.items() if not k.startswith("_") for s in _chuoi(v)]
    if isinstance(x, list):
        return [s for v in x for s in _chuoi(v)]
    return []


def _cum_cam_en():
    return [re.compile(p, re.I) for p in nap.doc("thuat_ngu_en.json").get("cum_cam_en", [])]


def test_ban_phu_sach_tieng_viet_va_cum_cam():
    rx = _cum_cam_en()
    for ten in ("tuvi_phi_hoa_kb.json", "tuvi_hai_nguoi_kb.json", "loi/tuvi_v2.json"):
        d = json.loads((DATA / "en" / ten).read_text("utf-8"))
        for s in _chuoi(d):
            assert not VIET.search(s), (ten, s)
            assert not any(r.search(s) for r in rx), (ten, s)
            assert not any(t in s.lower() for t in TU_DOA_EN), (ten, s)


def test_hai_nguoi_en_du_va_khong_lap():
    with ngon_ngu.dung("en"):
        y, nen = [], []
        for ma, muc, q in itertools.product(TIEU_CHI, MUC, QUAN_HE):
            c = hkb.cau(ma, muc, q)
            assert c and not VIET.search(c["y"] + c["nen"]), (ma, muc, q)
            y.append(c["y"])
            nen.append(c["nen"])
        assert len(set(y)) == len(y) == 120 and len(set(nen)) == len(nen) == 120
        td = [hkb.tieu_de(ma, muc) for ma, muc in itertools.product(TIEU_CHI, MUC)]
        assert len(set(td)) == len(td) and not any(VIET.search(s) for s in td)
        goi = [s for q in QUAN_HE for s in hkb.goi_y(q)]
        assert len(goi) == len(set(goi)) == 24
        assert hkb.muc_tong("de_hoa_hop")["nhan"] == "Easy to get along"
    # bản Việt không đổi
    assert hkb.muc_tong("de_hoa_hop")["nhan"] == "Dễ hoà hợp"


def test_ban_phu_cung_cau_truc_ban_viet():
    """Bản phủ chỉ thay chữ: mọi khoá của bản phủ có trong bản Việt (gộp không thêm dữ kiện), danh sách cùng độ dài."""
    def khop(goc, phu, duong=""):
        if isinstance(phu, dict):
            for k, v in phu.items():
                if k.startswith("_"):
                    continue
                assert isinstance(goc, dict) and k in goc, f"{duong}.{k}"
                khop(goc[k], v, f"{duong}.{k}")
        elif isinstance(phu, list):
            assert isinstance(goc, list) and len(goc) == len(phu), duong
            for i, (a, b) in enumerate(zip(goc, phu)):
                khop(a, b, f"{duong}[{i}]")
    for ten in ("tuvi_phi_hoa_kb.json", "tuvi_hai_nguoi_kb.json"):
        khop(json.loads((DATA / ten).read_text("utf-8")), json.loads((DATA / "en" / ten).read_text("utf-8")), ten)
