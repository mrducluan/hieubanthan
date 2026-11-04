# -*- coding: utf-8 -*-
"""TV-YBS — ý Tử vi bổ sung nối vào báo cáo đời sống (`tuvi_doi_song.lap` + `luangiai/tuvi_y_bo_sung.py`).

Khoá: không đổi mức nào · không mất mã kiểm chứng cũ, không đổi "Điều quan trọng nhất" · ≤ 2 hộp mới / chương, chỉ ở
chương hợp chủ đề · hộp cũ được làm giàu giữ nguyên lời + mã · khung "Góc nhìn khác" ≤ 1 / chương, 1–3 ý, mỗi ý một mã
`ds.<chương>.yb.*` + phái riêng · luật HỌC (≥ 100 phiếu & < 40 % → không hiện; "chưa đúng" → cuối) · chương khoá không
lộ chữ của ý bổ sung qua lời mời · MỘT hộp "Năm nên chú ý sức khoẻ hơn" · giọng văn sạch."""
from __future__ import annotations

import datetime as dt
import json
import re
from pathlib import Path

import pytest

from app.luangiai import doi_song_khuon as kh
from app.luangiai import suc_khoe_nam as skn
from app.luangiai import toan_bo
from app.luangiai import tuvi_doi_song as ds
from app.luangiai import tuvi_y_bo_sung as yb
from tests.test_tuvi_doi_song import BENH, DOA, THUAT_NGU

XEM = dt.date(2026, 10, 21)
_G = json.loads((Path(__file__).parents[1] / "fixtures" / "golden" / "lasotuvi_60.json").read_text("utf-8"))["cases"]
SQL_DS = re.compile(r"^ds\.[a-z0-9_]+(\.[a-z0-9_+-]+)+$")
CHUONG_HOP_MOI = {"tong_quan", "cuoc_doi", "su_nghiep", "tien_bac", "tinh_cam", "gia_dinh", "quan_he", "nha_cua",
                  "nam_nay", "van_han"}


def _sinh(ca: dict) -> dict:
    return {"ngay": dt.date.fromisoformat(ca["ngay"]), "ti": ca["ti"], "gioi_tinh": ca["gioi_tinh"]}


@pytest.fixture(scope="module")
def cap() -> list[tuple[dict, dict]]:
    """(bản có ý bổ sung, bản không) cho 30 lá golden."""
    return [(ds.lap(_sinh(ca), XEM), ds.lap(_sinh(ca), XEM, y_bo_sung=False)) for ca in _G[:30]]


def _ma(bc: dict) -> set[str]:
    ra = set()

    def di(x):
        if isinstance(x, dict):
            if isinstance(x.get("ma_mau"), str):
                ra.add(x["ma_mau"])
            for v in x.values():
                di(v)
        elif isinstance(x, list):
            for v in x:
                di(v)
    di(bc)
    return ra


def _yb_hop(c: dict) -> list[dict]:
    return [h for h in c["hop"] if ".yb." in h.get("ma_mau", "")]


def test_khong_doi_muc_khong_mat_ma_khong_doi_cot_loi(cap):
    for co, khong in cap:
        assert [c["muc"] for c in co["chuong"]] == [c["muc"] for c in khong["chuong"]]
        assert [g["muc"] for g in co["thoi_gian_bieu"]] == [g["muc"] for g in khong["thoi_gian_bieu"]]
        assert {m for m in _ma(khong) if ".chu_y." not in m} <= _ma(co), sorted(_ma(khong) - _ma(co))[:5]
        assert [h["ma_mau"] for h in co["cot_loi"]] == [h["ma_mau"] for h in khong["cot_loi"]]
        assert not any(".yb." in h["ma_mau"] for h in co["cot_loi"])
        # hộp cũ: lời + mã giữ nguyên (ý bổ sung nằm ở trường riêng `y_bo_sung`)
        for c1, c0 in zip(co["chuong"], khong["chuong"]):
            # CY-1: hộp "Năm nên chú ý {mảng} hơn" dùng chung chỗ hộp thêm với ý bổ sung → có thể nhường chỗ khi chương
            # đã có 2 hộp ý bổ sung; so phần còn lại.
            cu = [h for h in c1["hop"] if ".yb." not in h["ma_mau"] and ".chu_y." not in h["ma_mau"]]
            c0 = {**c0, "hop": [h for h in c0["hop"] if ".chu_y." not in h["ma_mau"]]}
            # hộp SK-1 có thể XUẤT HIỆN khi ý bổ sung thêm lý do cho một năm (vẫn một hộp) — các hộp khác y nguyên
            sk_moi = [h["ma_mau"] for h in cu if h["ma_mau"].startswith("ds.suc_khoe.nam.")]
            assert len(sk_moi) <= 1
            assert [h["ma_mau"] for h in cu if h["ma_mau"] not in sk_moi] == \
                [h["ma_mau"] for h in c0["hop"] if h["ma_mau"] not in sk_moi], c1["ma"]
            assert {h["ma_mau"] for h in c0["hop"]} <= {h["ma_mau"] for h in cu}, c1["ma"]
            # hộp SK-1 "Năm nên chú ý sức khoẻ hơn" có thể nêu thêm năm (lý do thêm từ ý bổ sung) — cùng một hộp, cùng mã
            assert [(h["tieu_de"], h["noi_dung"]) for h in cu if not h["ma_mau"].startswith("ds.suc_khoe.nam.")] == \
                [(h["tieu_de"], h["noi_dung"]) for h in c0["hop"] if not h["ma_mau"].startswith("ds.suc_khoe.nam.")]
            assert c1["tom_tat"] == c0["tom_tat"]


def test_gioi_han_va_cho_dat(cap):
    co_moi = co_gnk = co_giau = 0
    for co, _ in cap:
        for c in co["chuong"]:
            moi = _yb_hop(c)
            assert len(moi) <= yb.TOI_DA_HOP_MOI, c["ma"]
            if moi:
                co_moi += 1
                assert c["ma"] in CHUONG_HOP_MOI, c["ma"]
            for h in moi:
                assert h["loai"] in ("loi_khuyen", "thoi_diem") and "muc" not in h
                assert h["ma_mau"].startswith(f"ds.{c['ma']}.yb.") and SQL_DS.match(h["ma_mau"]) and len(h["ma_mau"]) <= 60
                assert h["huong_xu_ly"] and h["can_cu"]
            giau = [h for h in c["hop"] if h.get("y_bo_sung")]
            assert len(giau) <= yb.TOI_DA_LAM_GIAU
            co_giau += len(giau)
            for h in giau:
                assert h["y_bo_sung"]["noi_dung"] and h["y_bo_sung"]["viec"]
                assert any(x.startswith("Ý bổ sung (tham khảo)") for x in h["can_cu"])
            g = c.get("goc_nhin_khac")
            if g:
                co_gnk += 1
                assert g["loai"] == "goc_nhin_khac" and g["tieu_de"] == "Góc nhìn khác" and g["ghi_chu"] == yb.GHI_CHU_GNK
                assert 1 <= len(g["y"]) <= yb.TOI_DA_GNK
                for y in g["y"]:
                    assert y["ma_mau"].startswith(f"ds.{c['ma']}.yb.") and SQL_DS.match(y["ma_mau"])
                    assert y["phai"] == yb.PHAI_GNK and y["tieu_de"] and y["noi_dung"] and y["huong_xu_ly"]
            assert c["ma"] not in ("duong_bay", "loi_khuyen") or (not moi and not c.get("goc_nhin_khac"))
        # SK-1: vẫn MỘT hộp năm sức khoẻ, không hộp phần cơ thể thứ hai
        sk = next(c for c in co["chuong"] if c["ma"] == "suc_khoe")
        assert sum(h["tieu_de"] == skn.TIEU_DE_HOP for h in sk["hop"]) <= 1 and not _yb_hop(sk)
    assert co_moi >= 30 and co_gnk >= 30 and co_giau >= 30, (co_moi, co_gnk, co_giau)


def test_ma_y_bo_sung_khong_trung(cap):
    for co, khong in cap:
        ma = [h["ma_mau"] for c in co["chuong"] for h in _yb_hop(c)] + \
             [y["ma_mau"] for c in co["chuong"] for y in (c.get("goc_nhin_khac") or {}).get("y", [])]
        assert len(ma) == len(set(ma)) and not set(ma) & _ma(khong)


def test_loi_doi_thuong_sach(cap):
    for co, _ in cap:
        # chỉ xét phần thêm (lời hộp cũ đã có test riêng): không lỗi giọng văn mới nào
        moi = set(kh.kiem_giong_van(co, mo_dun="tuvi")) - set(kh.kiem_giong_van(_, mo_dun="tuvi"))
        assert not moi, moi
        for c in co["chuong"]:
            van = [x for h in _yb_hop(c) for x in (h["tieu_de"], h["noi_dung"], h["huong_xu_ly"])]
            van += [x for h in c["hop"] if h.get("y_bo_sung") for x in h["y_bo_sung"].values()]
            van += [x for y in (c.get("goc_nhin_khac") or {}).get("y", []) for x in (y["tieu_de"], y["noi_dung"])]
            for s in van:
                assert not THUAT_NGU.search(s), s
                low = s.lower()
                for w in DOA + BENH:
                    assert not re.search(rf"(?<!\w){re.escape(w)}(?!\w)", low), (w, s)
                assert not skn.kiem(s), s


def test_chuong_khoa_khong_lo_y_bo_sung():
    b = toan_bo.tuvi(_sinh(_G[3]), ngay_xem=XEM)
    for c in b["chuong"]:
        van = [h["tieu_de"] for h in _yb_hop(c)] + [h["noi_dung"] for h in _yb_hop(c) if h["noi_dung"]]
        van += [h["y_bo_sung"]["noi_dung"] for h in c["hop"] if h.get("y_bo_sung")]
        van += [y["noi_dung"] for y in (c.get("goc_nhin_khac") or {}).get("y", [])]
        dn = c["moi_xem"]["diem_nhan"] or ""
        assert not any(v and (v.rstrip(".") in dn or dn.rstrip(".") and dn.rstrip(".") in v) for v in van), (c["ma"], dn)


def _co_gnk(cap) -> tuple[dict, dict, str]:
    for i, (co, _) in enumerate(cap):
        for c in co["chuong"]:
            if len((c.get("goc_nhin_khac") or {}).get("y", [])) >= 2:
                return _sinh(_G[i]), c, c["ma"]
    raise AssertionError("không có lá nào có khung Góc nhìn khác ≥ 2 ý")


def test_hoc_goc_nhin_khac(cap):
    sinh, c, ma_ch = _co_gnk(cap)
    y0, y1 = c["goc_nhin_khac"]["y"][:2]
    b = ds.lap(sinh, XEM, trong_so={y0["ma_mau"]: {"dung": 20, "chua_dung": 90},          # 110 phiếu, 18 % → xem lại
                                     y1["ma_mau"]: {"dung": 30, "chua_dung": 10}})         # 40 phiếu → gắn tỉ lệ
    c2 = next(x for x in b["chuong"] if x["ma"] == ma_ch)
    ma = [y["ma_mau"] for y in (c2.get("goc_nhin_khac") or {}).get("y", [])]
    assert y0["ma_mau"] not in ma and any(x.startswith("Đang xem lại: ") for x in c2["can_cu"])
    g1 = next(y for y in c2["goc_nhin_khac"]["y"] if y["ma_mau"] == y1["ma_mau"])
    assert g1["ty_le_dung"] == 0.75 and g1["so_phieu"] == 40
    b2 = ds.lap(sinh, XEM, ca_nhan={y0["ma_mau"]: "chua_dung"})
    c3 = next(x for x in b2["chuong"] if x["ma"] == ma_ch)
    assert c3["goc_nhin_khac"]["y"][-1]["ma_mau"] == y0["ma_mau"]


def test_hoc_hop_moi(cap):
    for i, (co, _) in enumerate(cap):
        c = next((c for c in co["chuong"] if _yb_hop(c)), None)
        if c:
            break
    h = _yb_hop(c)[0]
    b = ds.lap(_sinh(_G[i]), XEM, trong_so={h["ma_mau"]: {"dung": 10, "chua_dung": 100}})
    c2 = next(x for x in b["chuong"] if x["ma"] == c["ma"])
    assert h["ma_mau"] not in [x["ma_mau"] for x in c2["hop"]]
    assert any(x == f"Đang xem lại: {h['tieu_de']}" or x.startswith("Đang xem lại: ") for x in c2["can_cu"])


def test_tat_dinh():
    s = _sinh(_G[7])
    assert json.dumps(ds.lap(s, XEM), sort_keys=True, ensure_ascii=False) == \
        json.dumps(ds.lap(s, XEM), sort_keys=True, ensure_ascii=False)


def test_thoi_diem_noi_ro_moc(cap):
    """Hộp / ý thời điểm nói thẳng mốc ("Năm 2028, …" / "Mười năm 34–43 tuổi, …"), không "Năm có nét này"."""
    for co, _ in cap:
        for c in co["chuong"]:
            for h in _yb_hop(c) + (c.get("goc_nhin_khac") or {}).get("y", []):
                txt = h["tieu_de"] + " " + h["noi_dung"]
                assert "có nét này" not in txt.split(".")[0] or not (h.get("nam") or h.get("tu_tuoi")), txt
                if h.get("nam"):
                    assert f"Năm {h['nam']}" in txt
