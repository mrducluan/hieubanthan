# -*- coding: utf-8 -*-
"""Tầng KB — Chỉ tay phương Tây (TK-2): Cheiro, Language of the Hand (1894) · Benham, The Laws of Scientific Hand Reading (1900).

Chỉ TRA `chi_tay_tay_kb.json` (git là nguồn) và GHÉP lời: bảy dáng tay, bảy gò, các đường chỉ — người dùng TỰ NHÌN tay mình rồi
chọn. Mỗi lựa chọn có câu trích tiếng Anh nguyên văn (test so với kho nguồn `fixtures/nguon/`), lời Việt đời thường, nhóm A
(mô tả) / B ("Nên chú ý …" + một việc). Lớp này KHÔNG có nhóm C: câu sách về sống lâu, bệnh, chết, phẩm hạnh không đưa vào;
độ dài đường Sinh không được đọc. Số đo ảnh tay (CALC `chi_tay_do.nhan_tay`) chỉ gợi ba điều hai sách có nói.
Không trả tên tệp kho nguồn, không trả ngưỡng (BM-1).
"""
from __future__ import annotations

from app.kb import nap

TEP = "chi_tay_tay_kb.json"
_KHOA_VIET = ("y", "ham_y", "viec", "ten", "mo_ta", "vi_tri", "cau", "gioi_thieu", "ly_do", "cau_ket", "ten_phai")
_THU_TU = {"A": 0, "B": 1}


@nap.nho
def _d() -> dict:
    try:
        d = nap.doc(TEP)
    except (OSError, ValueError):
        return {}
    return d if isinstance(d, dict) else {}


def nguon() -> dict[str, dict]:
    return _d().get("nguon") or {}


def _hien(ma_nguon: str | None) -> str | None:
    return (nguon().get(ma_nguon or "") or {}).get("hien_thi")


def do_tay_cfg() -> dict:
    return _d().get("do_tay") or {}


def _cac_lua_chon_go() -> list[dict]:
    return [g[k] for g in (_d().get("go") or {}).get("muc") or [] for k in ("day", "trung", "phang") if g.get(k)]


def moi_muc() -> list[dict]:
    """Mọi mục đọc được (dáng tay, gò, đường, nhãn số đo, lưu ý độ dài đường Sinh) — cho test và tra mã."""
    d = _d()
    ra = list((d.get("dang_tay") or {}).get("lua_chon") or [])
    ra += _cac_lua_chon_go()
    ra += [x for du in d.get("duong") or [] for c in du["cau"] for x in c["lua_chon"]]
    ra += list((do_tay_cfg().get("nhan") or {}).values())
    if d.get("luu_y_do_dai"):
        ra.append(d["luu_y_do_dai"])
    return ra


def moi_chuoi_viet() -> list[str]:
    ra: list[str] = []

    def di(x, khoa=None):
        if isinstance(x, dict):
            for k, v in x.items():
                if not k.startswith("_") and k not in ("trich", "nguon", "nguong"):
                    di(v, k)
        elif isinstance(x, list):
            for v in x:
                di(v, khoa)
        elif isinstance(x, str) and khoa in _KHOA_VIET:
            ra.append(x)
    di(_d())
    return ra


def _ra(m: dict, loai: str | None = None) -> dict:
    """Một mục cho người dùng: không mã nguồn nội bộ, thêm `nguon_hien_thi` + `loi`."""
    ra = {k: m[k] for k in ("ma", "ten", "mo_ta", "y", "ham_y", "viec", "nhom", "trich", "vi_tri", "goi_y_dang", "khong_doc")
          if m.get(k) not in (None, "", [])}
    if m.get("nguon"):
        ra["nguon_hien_thi"] = _hien(m["nguon"])
    ra["loi"] = m["y"] + (f" {m['ham_y']}" if m.get("ham_y") else "")
    if loai:
        ra["loai"] = loai
    return ra


def thu_vien() -> dict:
    d = _d()
    dt, go = d.get("dang_tay") or {}, d.get("go") or {}
    return {
        "phai": "tay", "ten_phai": d.get("ten_phai", ""), "gioi_thieu": d.get("gioi_thieu", ""),
        "nguon_hien_thi": [v["hien_thi"] for v in nguon().values()], "trang_thai": d.get("trang_thai", "nhap_ban_bien_tap"),
        "dang_tay": {"cau": dt.get("cau", ""), "gioi_thieu": dt.get("gioi_thieu", ""),
                     "lua_chon": [_ra(x) for x in dt.get("lua_chon") or []]},
        "go": {"cau": go.get("cau", ""), "gioi_thieu": go.get("gioi_thieu", ""), "lua_chon": go.get("lua_chon") or [],
               "muc": [{"ma": g["ma"], "ten": g["ten"], "vi_tri": g["vi_tri"], "day": _ra(g["day"]), "trung": _ra(g["trung"])}
                       for g in go.get("muc") or []]},
        "duong": [{"ma": du["ma"], "ten": du["ten"], "vi_tri": du["vi_tri"],
                   "cau": [{"ma": c["ma"], "ten": c["ten"], "lua_chon": [_ra(x) for x in c["lua_chon"]]} for c in du["cau"]]}
                  for du in d.get("duong") or []],
        "luu_y_do_dai": _ra(d["luu_y_do_dai"]) if d.get("luu_y_do_dai") else None,
        "khong_dua_vao": d.get("khong_dua_vao") or [],
        "cau_ket": d.get("cau_ket", ""),
    }


def _go(ma: str) -> dict | None:
    return next((g for g in (_d().get("go") or {}).get("muc") or [] if g["ma"] == ma), None)


def _cau_duong(ma: str) -> dict | None:
    return next((c for du in _d().get("duong") or [] for c in du["cau"] if c["ma"] == ma), None)


def _dang(ma: str) -> dict | None:
    return next((x for x in (_d().get("dang_tay") or {}).get("lua_chon") or [] if x["ma"] == ma), None)


def hop_le(dang: str | None, go: dict[str, str] | None, duong: dict[str, str] | None) -> list[str]:
    """Danh sách lỗi (rỗng = đạt) của các lựa chọn phái Tây người dùng gửi."""
    loi = []
    if dang and not _dang(dang):
        loi.append(f"không có dáng tay {dang!r}")
    lc_go = {x["ma"] for x in (_d().get("go") or {}).get("lua_chon") or []}
    for k, v in (go or {}).items():
        if not _go(k) or v not in lc_go:
            loi.append(f"không có gò {k!r} / lựa chọn {v!r}")
    for k, v in (duong or {}).items():
        c = _cau_duong(k)
        if not c or f"{k}_{v}" not in {x["ma"] for x in c["lua_chon"]}:
            loi.append(f"không có câu {k!r} / lựa chọn {v!r}")
    return loi


def _xep(muc: list[dict]) -> list[dict]:
    return sorted(muc, key=lambda m: _THU_TU.get(m.get("nhom"), 2))


def doc(dang: str | None, go: dict[str, str] | None, duong: dict[str, str] | None) -> dict:
    """Lời sách cho các điều người dùng tự chọn: A trước B, mục "sách không đọc gì" xếp cuối."""
    muc = []
    if dang and (m := _dang(dang)):
        muc.append(_ra(m, "dang_tay"))
    da_co: set[str] = set()
    for k, v in (go or {}).items():
        if (g := _go(k)) and g.get(v):
            muc.append(_kinh_dien(_ra(g[v], "go"), _KINH_DIEN_GO.get(k), "bay_go", da_co))
    for k, v in (duong or {}).items():
        c = _cau_duong(k)
        if c and (m := next((x for x in c["lua_chon"] if x["ma"] == f"{k}_{v}"), None)):
            du = next((d["ma"] for d in _d().get("duong") or [] if c in d["cau"]), None)
            muc.append(_kinh_dien(_ra(m, "duong"), _KINH_DIEN_DUONG.get(du or ""), "duong_chinh", da_co))
    return {"phai": "tay", "muc": _xep(muc), "cau_ket": _d().get("cau_ket", "") if muc else ""}


# RS-3 — gò / đường của lớp này ↔ mục kho kinh điển `chitay_phuong_tay_kinh_dien.json` (Cheiro 1916 · Dale 1895).
_KINH_DIEN_GO = {"jupiter": "moc_tinh", "saturn": "tho_tinh", "apollo": "thai_duong", "mercury": "thuy_tinh",
                 "mars": "hoa_tinh", "luna": "thai_am", "venus": "kim_tinh"}
_KINH_DIEN_DUONG = {"sinh": "sinh_dao", "tri": "tri_dao", "tam": "tam_dao", "van_menh": "dinh_menh"}


def _kinh_dien(ra: dict, ma: str | None, nhom: str, da_co: set[str]) -> dict:
    """Gắn trường RIÊNG `kinh_dien` (hai mặt + câu sách) vào mục ĐẦU TIÊN của đường / gò đó. Chỉ bản Việt.
    Không đổi trường cũ, không đổi thứ tự / nhóm."""
    from app import ngon_ngu
    from app.kb import tuong_hoc_dot4_kb

    if not ma or ma in da_co or not ngon_ngu.la_viet():
        return ra
    m = (tuong_hoc_dot4_kb.chitay_phuong_tay().get(nhom) or {}).get(ma)
    if not m:
        return ra
    da_co.add(ma)
    sg = m.get("sach_ghi") or {}
    ra["kinh_dien"] = {"ma": ma, "ten": m["ten"], "mat_tich_cuc": m["mat_tich_cuc"],
                       "mat_tieu_cuc_can_chu_y": m["mat_tieu_cuc_can_chu_y"],
                       **({"trich": sg["trich"], "nguon": sg["nguon"]} if sg.get("trich") else {})}
    return ra


def ket_qua_do_tay(kq: dict, tay: str) -> dict:
    """Ghép kết quả CALC `chi_tay_do.do_tay` (số đo) với ba nhãn phái Tây + câu sách. Không trả ngưỡng."""
    from app.calc import chi_tay_do
    from app.kb import chi_tay_kb

    if not kq["hop_le"]:
        cfg = chi_tay_kb.do_tay_cfg()
        ten = (cfg.get("ten_tay") or {}).get(tay, "")
        return {"phai": "tay", "hop_le": False, "loi": kq["loi"], "loi_nhac": cfg["loi"][kq["loi"]].format(tay=ten),
                "so_do": None, "nhan": [], "muc": [], "to_hop": None, "goi_y_dang": [], "cau_ket": ""}
    r = chi_tay_do.nhan_tay(kq["so_do"])
    bang = do_tay_cfg().get("nhan") or {}
    nhan = [{"ma": n["ma"], "truc": n["truc"], "vua": n["vua"], "ten": bang[n["ma"]]["ten"], "y": bang[n["ma"]]["y"]}
            for n in r["nhan"]]
    muc = _xep([_ra(bang[n["ma"]], "so_do") for n in r["nhan"] if not n["vua"] and bang[n["ma"]].get("nhom")])
    goi_y = [g for n in r["nhan"] for g in bang[n["ma"]].get("goi_y_dang") or []]
    to_hop = ({"ma": r["to_hop"], "ten": (do_tay_cfg().get("to_hop") or {}).get(r["to_hop"], "")} if r["to_hop"] else None)
    return {"phai": "tay", "hop_le": True, "loi": None, "loi_nhac": None, "so_do": kq["so_do"], "nhan": nhan, "muc": muc,
            "to_hop": to_hop, "goi_y_dang": goi_y, "cau_ket": _d().get("cau_ket", "") if muc else ""}
