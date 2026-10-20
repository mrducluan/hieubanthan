# -*- coding: utf-8 -*-
"""TS-PHAI — luận thần số phái Chaldea (RULES + NARRATIVE template, không LLM).

CALC `calc/thanso_chaldean` ra con số; KB `thanso_chaldean.json` cho nghĩa số gốc 1–9 và số kép 10–52. Mỗi con
số kèm vết tính (chữ → giá trị), nghĩa gốc + nghĩa kép (có mặt tối + câu tự soi) và đối chiếu với phái Pitago
để người dùng thấy hai phái giống/khác ở đâu. KB thiếu mục → None, tầng hiển thị im lặng.
"""
from __future__ import annotations

from app.calc import thanso, thanso_chaldean as ch, thanso_mo_rong as mr
from app.kb import thanso_v2 as kb

# Thứ tự hiển thị: phái Chaldea coi trọng tên thường gọi nhất.
VI_TRI = [
    ("ten_goi", "Số tên gọi", "Tên người khác gọi bạn hằng ngày — phái Chaldea xem đây là con số rõ nét nhất."),
    ("so_ten", "Số họ tên", "Cộng giá trị mọi chữ cái trong họ tên đầy đủ."),
    ("ngay_sinh", "Số ngày sinh", "Chỉ lấy ngày sinh trong tháng (1–31)."),
    ("duong_doi", "Số đường đời", "Cộng mọi chữ số của ngày, tháng, năm sinh."),
    ("linh_hon", "Số linh hồn", "Chỉ cộng nguyên âm trong họ tên."),
    ("nhan_cach", "Số nhân cách", "Chỉ cộng phụ âm trong họ tên."),
]
# Vị trí Chaldea ↔ chỉ số Pitago cùng ý nghĩa để đối chiếu.
DOI_CHIEU = {"so_ten": ("su_menh", "Sứ mệnh"), "linh_hon": ("linh_hon", "Linh hồn"),
             "nhan_cach": ("nhan_cach", "Nhân cách"), "duong_doi": ("duong_doi", "Đường đời")}
# TS-NOIDAU giao điểm: vị trí Chaldea ↔ vị trí nợ nghiệp Pitago (ngày sinh, đường đời cùng tổng thô ở hai phái).
VI_TRI_PITAGO = {"ngay_sinh": "ngay_sinh", "duong_doi": "duong_doi", "so_ten": "su_menh",
                 "linh_hon": "linh_hon", "nhan_cach": "nhan_cach"}


def giao_diem(so: dict, ten_chinh: str, ngay: int, thang: int, nam: int) -> list[dict]:
    """Vị trí có số 13/14/16/19 ở ít nhất một phái: Pitago gọi nợ nghiệp, Chaldea đọc số kép — nối hai cách đọc."""
    no = {x["vi_tri"]: x["so"] for x in mr.no_nghiep(ten_chinh, ngay, thang, nam)}
    ten = dict((ma, t) for ma, t, _ in VI_TRI)
    kq = []
    for ma, vt in VI_TRI_PITAGO.items():
        p = no.get(vt)
        c = so[ma]["kep"] if so[ma]["kep"] in mr.NO_NGHIEP else None
        if p or c:
            # Hai phái có thể ra HAI số khác nhau ở vị trí tên (bảng chữ khác) → mỗi phái lời của đúng số mình.
            np_, nc = kb.giao_diem_phai(p) if p else None, kb.giao_diem_phai(c) if c else None
            kq.append({"ma": ma, "ten": ten[ma], "pitago_no_nghiep": p, "chaldea_kep": c, "cung_so": p == c,
                       "pitago": np_["pitago"] if np_ else None, "chaldea": nc["chaldea"] if nc else None,
                       "cach_dung": np_["cach_dung"] if p == c and np_ else None,
                       "tu_soi": (nc or np_)["tu_soi"] if (nc or np_) else None})
    return kq


def _vet_ten(ten: str) -> str:
    phan = [f"{c}({ch.gia_tri(c)})" for c in thanso.bo_dau(ten, True).upper() if c.isalpha() and c.isascii()]
    return " + ".join(phan)


def _cach_tinh(ma: str, so: dict, ho_ten: str, ten_goi: str, ngay: int, thang: int, nam: int) -> str:
    duoi = f"= {so['tong']}"
    if so["kep"] is not None and so["kep"] != so["tong"]:
        duoi += f" → kép {so['kep']}"
    if so["goc"] != (so["kep"] or so["tong"]):
        duoi += f" → gốc {so['goc']}"
    if ma == "ten_goi":
        return f"{_vet_ten(ten_goi)} {duoi}"
    if ma == "so_ten":
        return f"{_vet_ten(ho_ten)} {duoi}"
    if ma == "ngay_sinh":
        return f"Ngày {ngay} {duoi}"
    if ma == "duong_doi":
        return f"{' + '.join(f'{ngay}{thang}{nam}')} {duoi}"
    return f"{'Nguyên âm' if ma == 'linh_hon' else 'Phụ âm'} của họ tên {duoi}"


def luan_chaldea(ho_ten: list[str], ngay: int, thang: int, nam: int, quy_uoc: str = "tong_het") -> dict:
    ten_chinh = ho_ten[0]
    ten_goi = ho_ten[1] if len(ho_ten) > 1 else None
    so = ch.tinh(ten_chinh, ngay, thang, nam, ten_goi)
    pitago = thanso.chi_so_xac_dinh(ten_chinh, ngay, thang, nam, quy_uoc)
    cac_so = []
    for ma, ten, mo_ta in VI_TRI:
        s = so[ma]
        muc = {
            "ma": ma, "ten": ten, "mo_ta": mo_ta, "tong": s["tong"], "kep": s["kep"], "goc": s["goc"],
            "cach_tinh": _cach_tinh(ma, s, ten_chinh, so["ten_goi"]["ten"], ngay, thang, nam),
            "nghia_goc": kb.chaldea_goc(s["goc"]), "nghia_kep": kb.chaldea_kep(s["kep"]),
        }
        if ma == "ten_goi":
            muc["ten_goi"] = so["ten_goi"]["ten"]
        if ma in DOI_CHIEU:
            k, ten_pt = DOI_CHIEU[ma]
            muc["pitago"] = {"ten": ten_pt, "so": pitago[k], "khac": pitago[k] != s["goc"]}
        cac_so.append(muc)
    meta = kb.meta_chaldea()
    return {
        "phai": "chaldea",
        "ten_chinh": ten_chinh,
        "ngay_sinh": f"{ngay:02d}/{thang:02d}/{nam}",
        "gioi_thieu": kb.chaldea_gioi_thieu(),
        "cac_so": cac_so,
        "so_khac_pitago": sum(1 for m in cac_so if m.get("pitago", {}).get("khac")),
        "giao_diem": giao_diem(so, ten_chinh, ngay, thang, nam),
        "nguon": meta["nguon"], "source_id": meta["source_id"], "school_id": meta["school_id"],
        "trang_thai": meta["trang_thai"],
        "luu_y": "Thần số học là góc nhìn văn hoá để tự soi, không phải dự báo. Hai phái tính khác nhau nên có thể ra số khác nhau.",
    }


def ngay_chaldea(ngay_sinh: int, ngay_xem: int) -> dict:
    """Số của ngày đang xem theo Chaldea + có trùng số gốc ngày sinh không (dùng cho thẻ Hôm nay)."""
    hn, sn = ch.so_ngay(ngay_xem), ch.so_ngay(ngay_sinh)
    return {"so": hn["goc"], "kep": hn["kep"], "so_ngay_sinh": sn["goc"], "cong_huong": hn["goc"] == sn["goc"],
            "nghia_goc": kb.chaldea_goc(hn["goc"]), "nghia_kep": kb.chaldea_kep(hn["kep"])}
