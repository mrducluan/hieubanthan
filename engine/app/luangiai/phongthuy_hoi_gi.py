# -*- coding: utf-8 -*-
"""HG-1 — "Hỏi gì xem nấy" (trang Phong thuỷ): sáu câu người dùng hay mang tới → câu trả lời RIÊNG từ hồ sơ nhà.

Tầng RULES, tất định, không LLM. Module này KHÔNG có phép tính mới — chỉ gọi lại phép tính đã có và ghép lời từ KB
`phongthuy_hoi_gi_kb.json` (chữ) + KB có sẵn (du niên, dấu hiệu `bo_tri`, tổ hợp sao):

- `cua_chinh` → `pt.do_huong`, `pt.du_nien`, bàn Huyền Không của `phongthuy_doi_song._trach_ban`
- `bo_cuc`    → `phongthuy_bo_cuc.luan` (dấu hiệu người dùng đã khai); chưa khai → trả bốn câu hỏi có / không (nhóm veto)
- `gia_dinh`  → `phongthuy_cung_chi_tiet.hai_cung`
- `han_nam`   → `tuoi_dan_gian.han_nam` (năm theo Lập xuân) + `xem_tuoi_lam_nha` (năm âm lịch Việt)
- `so_sanh`, `mo_quan` → lời dẫn + lối đi (đã có công cụ riêng)

Nguyên tắc Q1 giữ nguyên: mức chỉ do du niên với người ở + dấu hiệu đã xác nhận quyết định; sao năm chỉ nói thời điểm.
Không điểm số, không hứa tài lộc, không vật phẩm. Thuật ngữ chỉ nằm ở `vi_sao`. Thiếu dữ kiện nào thì nói rõ ở `thieu`
(web mời nhập đúng thứ thiếu) — không bao giờ đoán thay người dùng (vd không tự đặt năm xây).
"""
from __future__ import annotations

import datetime as dt

from app.calc import huyen_khong as hk
from app.calc import phongthuy as pt
from app.calc import tuoi_dan_gian as tdg
from app.kb import nap
from app.kb import ten as _ten
from app.luangiai import phongthuy_bo_cuc as bo_cuc
from app.luangiai import phongthuy_doi_song as ds

TEP = "phongthuy_hoi_gi_kb.json"
MA = ("cua_chinh", "bo_cuc", "gia_dinh", "han_nam", "so_sanh", "mo_quan")
THU_TU_VETO = ("duong_dam", "wc_giua_nha", "cua_thong_ban_cong", "xa_ngang")     # thứ tự hỏi: ngoài nhà → trong nhà
NEO = {"do-huong", "menh-quai", "khao-sat-nha", "doc-anh-nha", "vi-tri-vat", "nha-cua-ban", "hanh-trinh-nha", "huyen-khong"}


def _kb() -> dict:
    return nap.doc(TEP)


def _m(ma: str, **slot) -> str:
    s = _kb()["mau"][ma]
    return s.format(**slot) if slot else s


def _noi(xs) -> str:
    return _kb()["mau"]["noi"].join(xs)


def _h(x: str) -> str:
    return _ten.ten("huong", x)


def _nhom(x: str) -> str:
    return _ten.ten("nhom_trach", x)


def _can_chi(x: str) -> str:
    can, chi = x.split(" ", 1)
    return f"{_ten.ten('can', can)} {_ten.ten('chi', chi)}"


def _lien_ket(ds_: list[dict], **slot) -> list[dict]:
    """Chỉ đường dẫn trong site hoặc neo trên trang Phong thuỷ thuộc danh sách cố định."""
    kq = []
    for x in ds_:
        muc = {"nhan": x["nhan"].format(**slot)}
        if x.get("duong", "").startswith("/"):
            muc["duong"] = x["duong"].format(**slot)
        elif x.get("neo") in NEO:
            muc["neo"] = x["neo"]
        else:
            continue
        kq.append(muc)
    return kq


def danh_muc() -> dict:
    k = _kb()
    return {"cau_hoi": [{"ma": ma, **{f: k["cau_hoi"][ma][f] for f in ("tieu_de", "mo_ta", "can", "cau_chat")}} for ma in k["thu_tu"]],
            "luu_y": k["luu_y"], "trang_thai": k["trang_thai"], "source_id": k["source_id"], "school_id": k["school_id"]}


def _khung(ma: str, nam: int) -> dict:
    k = _kb()
    c = k["cau_hoi"][ma]
    return {"ma": ma, "tieu_de": c["tieu_de"], "rieng": False, "muc": None, "thieu": [], "tra_loi": c["chung"], "y": [],
            "viec": list(c["viec"]), "vi_sao": list(c["vi_sao"]), "nguon": c["nguon"], "cau_chat": c["cau_chat"],
            "lien_ket": _lien_ket(c["lien_ket"], nam=nam), "luu_y": k["luu_y"]}


def _thieu(r: dict, *ma: str) -> None:
    k = _kb()["thieu"]
    r["thieu"] = [{"ma": m, "loi": k[m]} for m in ma]


def _dau_hieu_da_khai(nha: dict) -> dict:
    """Dấu hiệu người dùng đã trả lời (có / không) — đúng luật `_nhan`: nguồn ảnh chưa xác nhận không tính."""
    dh = (nha.get("bo_cuc") or {}).get("dau_hieu") or {}
    return {ma: bool(v.get("co")) for ma, v in dh.items()
            if ma in bo_cuc.DAU_HIEU and (v.get("nguon", "nguoi_dung") == "nguoi_dung" or v.get("xac_nhan"))}


def _veto_dang_co(nha: dict) -> list[str]:
    khai = _dau_hieu_da_khai(nha)
    return [m for m in THU_TU_VETO if khai.get(m)]


def _ten_dau_hieu(ma: str) -> str:
    from app.kb import phongthuy_kb as kbp  # noqa: PLC0415
    return kbp.bo_tri(ma)["tieu_de"]


# --------------------------------------------------------------------------- #
def _cua_chinh(r: dict, nha: dict, sinh: dict | None) -> dict:
    huong, do = ds._huong_nha(nha)
    if huong is None:
        _thieu(r, "huong", *(() if sinh else ("sinh",)))
        return r
    trach = pt.trach(huong)
    mq = ds._menh(sinh)
    if do is not None:
        r["da_tinh"] = {k: v for k, v in pt.do_huong(do).items() if k in ("do_huong", "huong", "son_huong", "do_toa", "toa", "son_toa", "canh_bao")}
    else:
        r["da_tinh"] = {"huong": huong}
    if mq is None:
        r["tra_loi"] = (_m("cua.chua_tuoi", huong=_h(huong), do=round(do, 1), nhom=_nhom(trach["nhom"])) if do is not None
                        else _m("cua.chua_do", huong=_h(huong), nhom=_nhom(trach["nhom"])))
        _thieu(r, "sinh")
        return r
    dn = pt.du_nien(mq["quai"], huong)
    bang = pt.bang_huong(mq["quai"])
    hop = [h for h, d in bang.items() if d in pt.CAT]
    r["rieng"] = True
    r["da_tinh"].update(menh_quai=mq["quai"], du_nien=dn["du_nien"], hop=dn["cat"])
    if dn["cat"]:
        r["tra_loi"] = _m("cua.hop", huong=_h(huong), y=ds._dn_kb(dn["du_nien"])["mot_cau"].rstrip(".") + ".")
        r["viec"] = r["viec"][:1]
    else:
        r["tra_loi"] = _m("cua.khong_hop", huong=_h(huong))
        r["viec"] = [_m("cua.viec_bu", ds=_noi(_h(h) for h in hop)), r["viec"][0]]
    r["muc"] = ds._muc_du_nien(dn["du_nien"])
    cung_nhom = trach["nhom"][:6] == mq["nhom"][:6]
    r["y"].append({"nhan": "nhom", "noi_dung": _m("cua.cung_nhom" if cung_nhom else "cua.khac_nhom", nhom_nha=_nhom(trach["nhom"]), nhom_menh=_nhom(mq["nhom"]))})
    r["y"].append({"nhan": "huong_hop", "noi_dung": _m("cua.huong_hop", ds=_noi(_h(h) for h in hop))})
    veto = _veto_dang_co(nha)
    if veto and r["muc"] == "thuan":                                  # Q1: dấu hiệu lớn đã xác nhận = trần "Cân bằng"
        r["muc"] = "can_bang"
        r["y"].append({"nhan": "tran", "noi_dung": _m("cua.tran", ds=_noi(_ten_dau_hieu(m) for m in veto))})
    r["vi_sao"].append(f"{_ten.ten('quai', mq['quai'])} · {_h(huong)} → {_ten.ten('du_nien', dn['du_nien'])}")
    b = ds._trach_ban(nha, do, huong) if (nha.get("nam_xay") or nha.get("van_xay")) else None   # không có năm / vận xây thì không lập bàn (không đoán)
    if b:
        c = b["cung_map"][b["huong"]["quai"]]
        r["vi_sao"].append(_m("cua.sao_van", van=b["van"], son=c["son"], sao_huong=c["huong"]) if b.get("nam_uoc")
                           else _m("cua.sao", nam_xay=b["nam_xay"], van=b["van"], son=c["son"], sao_huong=c["huong"]))
        if (b.get("cap_huong") or {}).get("y"):
            r["vi_sao"].append(_m("cua.sao_y", y=b["cap_huong"]["y"]))
        r["da_tinh"]["van"] = b["van"]
    return r


def _bo_cuc(r: dict, nha: dict, sinh: dict | None) -> dict:
    khai = _dau_hieu_da_khai(nha)
    da_hoi = [m for m in THU_TU_VETO if m in khai]
    r["hoi_nhanh"] = [{"ma": m, "hoi": bo_cuc.hoi(m), "tra_loi": khai.get(m)} for m in THU_TU_VETO]
    if not da_hoi and not any(khai.values()):
        _thieu(r, "dau_hieu")
        return r
    bc = dict(nha.get("bo_cuc") or {})
    bc["dau_hieu"] = {m: {"co": True} for m, co in khai.items() if co}
    if nha.get("loai_nha") and not bc.get("loai_nha"):
        bc["loai_nha"] = nha["loai_nha"]
    luan = bo_cuc.luan({k: v for k, v in bc.items() if k in ("loai_nha", "dau_hieu", "huong_nha", "huong_nha_do")}, None, "doi_song")
    dh = [d for d in luan["dien_giai"]["dau_hieu"] if not d.get("tot")]
    lon = sorted((d for d in dh if d["veto"]), key=lambda d: THU_TU_VETO.index(d["ma"]))
    nho = [d for d in dh if not d["veto"]]
    cau = []
    if lon:
        cau.append(_m("bc.co_lon", n=len(lon), ds=_noi(d["tieu_de"] for d in lon)))
        r["muc"] = "can_bang"
    elif len(da_hoi) == len(THU_TU_VETO):
        cau.append(_m("bc.khong_lon"))
    if nho:
        cau.append(_m("bc.con_nho", n=len(nho), ds=_noi(d["tieu_de"] for d in nho[:4])))
    if len(da_hoi) < len(THU_TU_VETO):
        cau.append(_m("bc.chua_du", n=len(da_hoi), tong=len(THU_TU_VETO)))
        _thieu(r, "dau_hieu")
    r["rieng"] = True
    r["tra_loi"] = " ".join(cau)
    viec = []
    for d in (lon + nho)[:4]:
        v0 = next((v["lam"] for v in d.get("viec", []) if v["chi_phi"] == "khong_ton"), d.get("goi_y"))
        if v0:
            viec.append(_m("bc.viec", ten=d["tieu_de"], lam=v0))
    r["viec"] = viec or []
    r["diem"] = [{"ma": d["ma"], "tieu_de": d["tieu_de"], "nen_xu_ly_truoc": d["veto"], "giai_thich": d["giai_thich"]["doi_song"] or d["noi_dung"],
                  "trang": d["trang"]} for d in lon + nho]
    return r


def _nam_tinh(sinh: dict) -> int:
    return ds._menh(sinh)["nam_tinh"]


def _gia_dinh(r: dict, sinh: dict | None, nguoi_2: dict | None) -> dict:
    from app.luangiai import phongthuy_cung_chi_tiet as ct  # noqa: PLC0415
    if not sinh:
        _thieu(r, "sinh", *(() if nguoi_2 else ("nguoi_2",)))
        return r
    mq = ds._menh(sinh)
    hop_a = [h for h, d in pt.bang_huong(mq["quai"]).items() if d in pt.CAT]
    if not nguoi_2:
        r["tra_loi"] = _m("gd.thieu", ds=_noi(_h(h) for h in hop_a))
        _thieu(r, "nguoi_2")
        return r
    # người dùng: năm đã xét mốc Lập xuân theo ngày sinh; người ở cùng: chỉ có năm sinh (như công cụ hướng hợp tuổi)
    h2 = ct.hai_cung(mq["nam_tinh"], sinh["gioi_tinh"], nguoi_2["nam"], nguoi_2["gioi_tinh"])
    r["rieng"] = True
    r["tra_loi"] = h2["loi"]
    ten_ng = (_m("gd.ban"), _m("gd.nguoi_2"))
    for t, ng in zip(ten_ng, h2["nguoi"]):
        r["y"].append({"nhan": "nguoi", "noi_dung": _m("gd.nguoi", ten=t, quai=_ten.ten("quai", ng["quai"]), nhom=_nhom(ng["nhom"]),
                                                       ds=_noi(_h(h) for h in ng["huong_tot"]))})
    if h2["cung_nhom"]:
        r["viec"] = [_m("gd.viec.cung_nhom")]
    elif h2["huong_chung"]:
        r["viec"] = [_m("gd.viec.co_chung", ds=_noi(_h(h) for h in h2["huong_chung"]))]
    else:
        r["viec"] = [_m("gd.viec.khong_chung")]
    r["hai_nguoi"] = {"cung_nhom": h2["cung_nhom"], "huong_chung": h2["huong_chung"],
                      "huong": [{"huong": x["huong"], "a_hop": x["a_cat"], "b_hop": x["b_cat"]} for x in h2["huong"]]}
    if h2.get("luu_y"):
        r["vi_sao"].append(h2["luu_y"])
    return r


def _han_nam(r: dict, nha: dict, sinh: dict | None, nam_lx: int, nam_am: int) -> dict:
    hn = tdg.han_nam(nam_lx)
    p5, p2, ts = hn["ngu_hoang"]["phuong"], hn["nhi_hac"]["phuong"], hn["tam_sat"]["phuong"]
    giua = lambda p: p not in pt.HUONG_QUAI                                 # noqa: E731 — "Giữa nhà" không phải một trong 8 phương
    r["rieng"] = True
    if giua(p5):
        r["tra_loi"] = _m("hn.tra_loi_trung", nam=nam_lx, can_chi=_can_chi(hn["can_chi"]), p2=_h(p2))
    elif giua(p2):
        r["tra_loi"] = _m("hn.tra_loi_trung", nam=nam_lx, can_chi=_can_chi(hn["can_chi"]), p2=_h(p5))
    else:
        r["tra_loi"] = _m("hn.tra_loi", nam=nam_lx, can_chi=_can_chi(hn["can_chi"]), p5=_h(p5), p2=_h(p2))
    r["y"].append({"nhan": "tam_sat", "noi_dung": _m("hn.tam_sat", p=_h(ts))})
    r["y"].append({"nhan": "thai_tue", "noi_dung": _m("hn.thai_tue", p=_h(hn["thai_tue"]["phuong"]), pha=_h(hn["tue_pha"]["phuong"]))})
    r["y"].append({"nhan": "moc", "noi_dung": _m("hn.moc")})
    vi_tri = (nha.get("bo_cuc") or {}).get("vi_tri") or {}
    for p in dict.fromkeys(x for x in (p5, p2, ts) if not giua(x)):
        phong = [bo_cuc.ten_phong(k) for k, v in vi_tri.items() if v == p and k in bo_cuc.TEN_PHONG]
        if phong:
            r["y"].append({"nhan": "phong", "noi_dung": _m("hn.phong", p=_h(p), phong=_noi(x.lower() for x in phong))})
    nhan = {}
    for p, k in ((ts, "tam_sat"), (p2, "2"), (p5, "5")):
        nhan[p] = _m(f"hn.nhan.{k}")
    r["luoi_nam"] = {"nam": nam_lx, "can_chi": hn["can_chi"],
                     "o": [{"cung": x["cung"], "phuong": x["phuong"], "sao": x["sao"], "nhan": nhan.get(x["phuong"])} for x in hn["phi_tinh"]]}
    if sinh:
        from app.luangiai import tuoi_dan_gian as L_tdg  # noqa: PLC0415
        s_ngay = sinh.get("ngay")
        t = L_tdg.xem_tuoi_lam_nha(sinh["nam"], nam_am, s_ngay.month if s_ngay else None, s_ngay.day if s_ngay else None)
        r["y"].append({"nhan": "tuoi", "noi_dung": _m("hn.tuoi", nam_am=nam_am, y=t["tra_loi_nhanh"])})
    r["lien_ket"] = _lien_ket(_kb()["cau_hoi"]["han_nam"]["lien_ket"], nam=nam_lx)
    return r


def tra_loi(ma: str, nha: dict | None = None, sinh: dict | None = None, nguoi_2: dict | None = None,
            ngay_xem: dt.date | None = None) -> dict:
    """`nha` = {huong_do?, huong?, nam_xay?, loai_nha?, bo_cuc?: {dau_hieu?, vi_tri?}}; `sinh` = đầu ra `SinhInput.sinh()`;
    `nguoi_2` = {nam, gioi_tinh}. Không lưu gì; đầu ra không mang ngày sinh."""
    if ma not in MA:
        raise ValueError("Không có câu hỏi này")
    nha = nha or {}
    ngay = ngay_xem or dt.date.today()
    nam_lx = hk.nam_theo_lap_xuan(dt.datetime(ngay.year, ngay.month, ngay.day, 5))        # 12:00 giờ VN
    from app.calc import lunar  # noqa: PLC0415
    from app.config import CALENDAR_MERIDIAN_TZ  # noqa: PLC0415
    nam_am = lunar.solar_to_lunar(ngay.day, ngay.month, ngay.year, CALENDAR_MERIDIAN_TZ)[2]
    r = _khung(ma, nam_lx)
    if ma == "cua_chinh":
        return _cua_chinh(r, nha, sinh)
    if ma == "bo_cuc":
        return _bo_cuc(r, nha, sinh)
    if ma == "gia_dinh":
        return _gia_dinh(r, sinh, nguoi_2)
    if ma == "han_nam":
        return _han_nam(r, nha, sinh, nam_lx, nam_am)
    return r
