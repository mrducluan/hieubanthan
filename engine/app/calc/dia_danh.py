# -*- coding: utf-8 -*-
"""NS-QT (2026-11-16, chủ dự án duyệt) — tìm nơi sinh NGOÀI Việt Nam theo chữ người dùng gõ.

Dữ liệu: GeoNames `cities15000` (CC BY 4.0, ~34 nghìn thành phố ≥ 15.000 dân, bỏ Việt Nam), dựng bằng
`scripts/nap_geonames.py` → `data/dia_danh.json`. Mỗi nơi có toạ độ + mã vùng IANA; múi giờ / giờ mùa hè lúc sinh vẫn do
`mui_gio.tai()` + tzdata tính (một bộ tính). Mã nơi `gn-<geonameid>` đi cùng đường với mã thành phố cũ (`us-san_jose`).

Tìm tất định, không gọi mạng, không ghi lại chữ gõ: bỏ dấu + đ→d + viết thường; xếp hạng
  0 tên trùng hẳn · 1 tên bắt đầu bằng chữ gõ · 2 tên khác (Praha, Mát-xcơ-va…) trùng / bắt đầu bằng chữ gõ ·
  3 từng từ gõ là đầu một từ của tên / tên khác / bang / nước (gõ "melbourne florida" để chọn nơi trùng tên)
rồi theo dân số. Tầng CALC: dữ liệu tĩnh + tra cứu thuần."""
from __future__ import annotations

import json
import math
import unicodedata
from functools import lru_cache
from pathlib import Path

_F = Path(__file__).parent / "data" / "dia_danh.json"
TIEN_TO = "gn-"
TOI_DA = 8


def bo_dau(s: str) -> str:
    s = (s or "").replace("đ", "d").replace("Đ", "D")
    s = "".join(c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn")
    return " ".join("".join(c if c.isalnum() else " " for c in s.lower()).split())


@lru_cache(maxsize=1)
def du_lieu() -> dict:
    return json.loads(_F.read_text(encoding="utf-8"))


@lru_cache(maxsize=1)
def _chi_muc() -> tuple[list, dict[int, int]]:
    """[(tên chuẩn hoá, [tên khác], {từ của tên + tên khác}, {từ của bang + nước}), …] cùng thứ tự `tp` (đã xếp theo
    dân số), và bảng geonameid → vị trí."""
    d = du_lieu()
    ra, vt = [], {}
    for i, t in enumerate(d["tp"]):
        gid, ten, nuoc, cap1 = t[0], t[1], t[2], t[3]
        chinh = bo_dau(ten)
        khac = [k for k in t[8].split("|") if k]
        tu_ten = set(chinh.split())
        for k in khac:
            tu_ten.update(k.split())
        ten_nuoc = d["nuoc"].get(nuoc, [nuoc, nuoc])
        tu_noi = set(bo_dau(" ".join([d["cap1"].get(f"{nuoc}.{cap1}", ""), *ten_nuoc, nuoc])).split())
        ra.append((chinh, khac, frozenset(tu_ten), frozenset(tu_noi)))
        vt[gid] = i
    return ra, vt


def _dau_tu(tu: str, tap: frozenset[str]) -> bool:
    return any(x.startswith(tu) for x in tap)


def _muc(q: str, cm: tuple) -> int | None:
    chinh, khac, tu_ten, tu_noi = cm
    if chinh == q:
        return 0
    if chinh.startswith(q):
        return 1
    if any(k.startswith(q) for k in khac):
        return 2
    tu = q.split()
    if not _dau_tu(tu[0], tu_ten):
        return None
    # Phần đầu chữ gõ có thể là cả tên nhiều từ ("san jose costa rica"): bỏ dần các từ đã khớp tên rồi xét phần còn lại.
    con = tu[1:]
    for n in range(len(tu), 0, -1):
        dau = " ".join(tu[:n])
        if chinh.startswith(dau) or any(k.startswith(dau) for k in khac):
            con = tu[n:]
            break
    tap = tu_ten | tu_noi
    return 3 if all(_dau_tu(x, tap) for x in con) else None


def _hien(i: int, ngon_ngu: str = "vi") -> dict:
    d = du_lieu()
    gid, ten, nuoc, cap1, vi_do, kinh_do, zi, dan = d["tp"][i][:8]
    ten_nuoc = d["nuoc"].get(nuoc, [nuoc, nuoc])
    bang = d["cap1"].get(f"{nuoc}.{cap1}")
    nn = ten_nuoc[1] if ngon_ngu != "vi" else ten_nuoc[0]
    return {"ma": f"{TIEN_TO}{gid}", "ten": ten, "nuoc": nuoc, "ten_nuoc": ten_nuoc[0], "ten_nuoc_en": ten_nuoc[1],
            "bang": bang, "phu": ", ".join(x for x in (bang if bang and bang != ten else None, nn) if x),
            "vi_do": vi_do, "kinh_do": kinh_do, "zone": d["zone"][zi], "dan_so": dan}


def them_co(g: dict, nam: int | None = None) -> dict:
    """Cờ như danh sách thành phố cũ (Ý6): múi giờ chuẩn năm `nam`, lệch giờ mặt trời trung bình, Nam bán cầu."""
    from app import config  # noqa: PLC0415
    from app.calc import mui_gio  # noqa: PLC0415
    chuan = mui_gio.utc_chuan_nam(g["zone"], nam or config.hom_nay_vn().year)
    lech = mui_gio.lech_mat_troi_phut(g.get("kinh_do"), chuan)
    return {**g, "utc_chuan": chuan, "lech_mat_troi_phut": lech,
            "canh_bao_mat_troi": lech is not None and abs(lech) >= mui_gio.NGUONG_CANH_BAO_PHUT,
            "nam_ban_cau_kha_dung": mui_gio.nam_ban_cau_kha_dung(g.get("vi_do"))}


def tim(q: str, gioi_han: int = TOI_DA, ngon_ngu: str = "vi") -> list[dict]:
    q = bo_dau(q)
    if len(q) < 2:
        return []
    cm, _ = _chi_muc()
    hang: list[tuple[int, int]] = []
    for i, x in enumerate(cm):
        m = _muc(q, x)
        if m is not None:
            hang.append((m, i))
            if m == 0 and len(hang) > 400:   # đã đủ ứng viên tốt, dữ liệu xếp theo dân số
                break
    hang.sort()
    return [them_co(_hien(i, ngon_ngu)) for _, i in hang[:max(1, min(gioi_han, 20))]]


def tra(ma: str, ngon_ngu: str = "vi") -> dict | None:
    """Mã `gn-<geonameid>` → thông tin nơi (như một mục kết quả tìm); không có → None."""
    if not (ma or "").startswith(TIEN_TO) or not ma[len(TIEN_TO):].isdigit():
        return None
    _, vt = _chi_muc()
    i = vt.get(int(ma[len(TIEN_TO):]))
    return None if i is None else _hien(i, ngon_ngu)


def gan_nhat(vi_do: float, kinh_do: float) -> dict | None:
    """Nơi gần toạ độ nhất (độ, xấp xỉ phẳng) — chỉ để test đối chiếu danh sách thành phố cũ với GeoNames."""
    tot, d_tot = None, math.inf
    for i, t in enumerate(du_lieu()["tp"]):
        d = math.hypot(t[4] - vi_do, (t[5] - kinh_do) * math.cos(math.radians(vi_do)))
        if d < d_tot:
            tot, d_tot = i, d
    return None if tot is None else {**_hien(tot), "d": d_tot}
