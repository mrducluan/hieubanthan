# -*- coding: utf-8 -*-
"""TS-NOIDAU — "Bạn đang vướng ở đâu?": ma trận nỗi đau × câu hỏi thần số (RULES, không LLM).

Port ý tưởng `question_intents` + `required_indicators` của bản V3 (docs/REVIEW-ENGINE-V3.md) vào kiến trúc 4 tầng:
câu hỏi + trụ đời nằm ở KB `thanso_noi_dau.json`; giá trị từng chỉ số lấy từ CALC qua `hoi._chi_so_nguoi` (cùng
bộ số hỏi đáp dùng → câu trả lời khớp đúng những con số hiện trên thẻ). Câu hỏi bấm vào được gửi nguyên văn sang
hỏi đáp `/v1/thanso/hoi` — test khoá mọi câu chuẩn định tuyến đúng lĩnh vực.

`lien_quan()` thay cho hybrid search (FTS + vector) của V3: so khớp từ đã bỏ dấu, tất định, không embedding.
"""
from __future__ import annotations

import datetime as dt
import json
from functools import lru_cache
from pathlib import Path

from app.calc import thanso_mo_rong as mr
from app.luangiai import hoi

_KB = Path(__file__).parents[1] / "kb" / "data" / "thanso_noi_dau.json"


@lru_cache(maxsize=1)
def _kb() -> dict:
    return json.loads(_KB.read_text(encoding="utf-8"))


def _dinh_cao_hien(cs: dict) -> int:
    for p in cs["dinh_cao"]:
        if p["den_tuoi"] is None or cs["tuoi"] <= p["den_tuoi"]:
            return p["so"]
    return cs["dinh_cao"][-1]["so"]


# Mã chỉ số trong KB → cách lấy giá trị từ bộ số `hoi._chi_so_nguoi` (None = thiếu tên nên chưa tính được).
CHI_SO_HO_TRO = {
    "duong_doi": lambda cs: cs["duong_doi"],
    "su_menh": lambda cs: cs.get("su_menh"),
    "linh_hon": lambda cs: cs.get("linh_hon"),
    "nhan_cach": lambda cs: cs.get("nhan_cach"),
    "so_ngay_sinh": lambda cs: cs["so_ngay_sinh"],
    "so_thai_do": lambda cs: cs["so_thai_do"],
    "nam_ca_nhan": lambda cs: cs["nam_ca_nhan"],
    "thang_ca_nhan": lambda cs: cs["thang_ca_nhan"],
    "ngay_ca_nhan": lambda cs: cs["ngay_ca_nhan"],
    "dinh_cao": _dinh_cao_hien,
    "thu_thach_chinh": lambda cs: cs["thu_thach_chinh"],
    "no_nghiep": lambda cs: sorted({x["so"] for x in cs["no_nghiep"]}),
    "bai_hoc_nghiep": lambda cs: cs.get("bai_hoc_nghiep"),
    "so_vang_bieu_do": lambda cs: cs["bieu_do"]["so_thieu"],
    "thang_mo_dau": lambda cs: [f"{t}/{n}" for n, t in cs["thang_mo_dau"]],
}


def thang_mo_dau(d: int, m: int, ngay_xem: dt.date, so_thang: int = 12) -> list[tuple[int, int]]:
    """(năm, tháng) có tháng cá nhân 1 — nhịp mở đầu — trong `so_thang` tháng tính từ tháng đang xem."""
    kq, n, t = [], ngay_xem.year, ngay_xem.month
    for _ in range(so_thang):
        if mr.thang_ca_nhan(d, m, n, t) == 1:
            kq.append((n, t))
        n, t = (n + 1, 1) if t == 12 else (n, t + 1)
    return kq


def _chi_so(nguoi: dict, ngay_xem: dt.date) -> dict:
    cs = hoi._chi_so_nguoi(nguoi, ngay_xem)
    cs["thang_mo_dau"] = thang_mo_dau(nguoi["ngay"], nguoi["thang"], ngay_xem)
    return cs


def ban_do(ho_ten: list[str], ngay: int, thang: int, nam: int, ngay_xem: dt.date,
           quy_uoc: str = "tong_het") -> dict:
    """5 trụ đời, mỗi câu hỏi kèm những con số CỦA NGƯỜI NÀY trả lời câu đó (lớp ĐÃ TÍNH)."""
    k = _kb()
    cs = _chi_so({"ho_ten": ho_ten, "ngay": ngay, "thang": thang, "nam": nam, "quy_uoc": quy_uoc}, ngay_xem)
    tru = []
    for ma, t in k["tru"].items():
        cau = [{"ma": q["ma"], "noi_dau": q["noi_dau"], "cau": q["cau"],
                "so": [{"ma": c, "ten": k["chi_so"][c], "gia_tri": CHI_SO_HO_TRO[c](cs)} for c in q["chi_so"]]}
               for q in k["cau_hoi"] if q["tru"] == ma]
        tru.append({"ma": ma, **t, "cau_hoi": cau})
    return {"ngay_xem": ngay_xem.isoformat(), "tru": tru,
            "nguon": k["source"]["ten"], "source_id": k["source_id"], "school_id": k["school_id"],
            "trang_thai": k["trang_thai"],
            "luu_y": "Câu hỏi để tự soi qua chính con số của bạn — góc nhìn tham khảo, không phải lời tiên đoán."}


# Từ rỗng (đã bỏ dấu) — không mang chủ đề, bỏ khi so khớp.
_RONG = frozenset("toi minh em anh chi ban cua la gi co khong nao the va nen hay de voi trong nhu sao vi "
                  "duoc mot nhung cac lam ve thi ma da dang se rat qua cho tu den ra vao".split())


def _tu(cau: str) -> set[str]:
    w = [x for x in hoi.chuan_hoa(cau).split() if x not in _RONG and not x.isdigit()]
    return set(w) | {f"{a} {b}" for a, b in zip(w, w[1:])}


def lien_quan(cau_hoi: str, k: int = 3) -> list[dict]:
    """≤ k câu chuẩn gần nhất với câu vừa hỏi (để gợi "hỏi tiếp"). Câu khủng hoảng/ngoài phạm vi → []."""
    pl = hoi.phan_loai(cau_hoi)
    # Câu về người khác / con: bảng này là câu về chính mình → không gợi (tránh lệch đối tượng).
    if pl["xu_ly"] in ("an_toan", "tu_choi_nhe") or pl["doi_tuong"] in ("nguoi_khac", "con"):
        return []
    tu = _tu(cau_hoi)
    chuan = hoi.chuan_hoa(cau_hoi)
    diem = []
    for i, q in enumerate(_kb()["cau_hoi"]):
        if hoi.chuan_hoa(q["cau"]) == chuan:
            continue
        mau = _tu(q["cau"]).union(*(_tu(b) for b in q["bien_the"]))
        khop = sum(2 if " " in w else 1 for w in tu & mau)
        # Phải chung ít nhất một từ: câu vô nghĩa không được gợi chỉ nhờ lĩnh vực mặc định.
        d = khop + (3 if pl["linh_vuc"] in q["linh_vuc"] else 0) if khop else 0
        if d:
            diem.append((-d, i, q))
    diem.sort(key=lambda x: (x[0], x[1]))
    return [{"ma": q["ma"], "tru": q["tru"], "cau": q["cau"], "noi_dau": q["noi_dau"]} for _, _, q in diem[:k]]


def cau_chuan(cau_hoi: str) -> dict | None:
    """Câu hỏi trùng nguyên văn một câu chuẩn (bấm từ bảng / "hỏi tiếp") → mục KB của câu đó."""
    c = hoi.chuan_hoa(cau_hoi)
    return next((q for q in _kb()["cau_hoi"] if hoi.chuan_hoa(q["cau"]) == c), None)


def _muc_chi_so(ma: str, cs: dict, nguoi: dict, lv: str, ngay_xem: dt.date) -> list[dict]:
    """Bằng chứng KB cho MỘT chỉ số của thẻ — dùng lại đúng các hàm dựng gói của hỏi đáp."""
    muc: list[dict] = []
    if ma in ("duong_doi", "su_menh", "linh_hon", "nhan_cach"):
        hoi._them_linh_vuc(muc, cs, hoi.KB_LV.get(lv, "ban_than"), "ban", [ma])
    elif ma == "dinh_cao":
        hoi._them_dinh_cao(muc, cs, "")
    elif ma == "thu_thach_chinh":
        hoi._them_dinh_cao(muc, cs, "thu thach")
        muc = [m for m in muc if m["loai"] == "thu_thach"]
    elif ma in ("no_nghiep", "bai_hoc_nghiep"):
        hoi._them_nghiep(muc, cs, "", {})
        muc = [m for m in muc if (m["loai"] == "bai_hoc_nghiep") == (ma == "bai_hoc_nghiep")]
    elif ma == "so_vang_bieu_do":
        hoi._them_bieu_do(muc, cs, "")
        muc = [m for m in muc if m["loai"] == "o_so"]
    elif ma in ("nam_ca_nhan", "thang_ca_nhan", "ngay_ca_nhan"):
        t = {"nam_ca_nhan": "", "thang_ca_nhan": "thang nay", "ngay_ca_nhan": "hom nay"}[ma]
        hoi._them_thoi_diem(muc, cs, t, ngay_xem, nguoi)
        muc = [m for m in muc if m["loai"] == ma]
    elif ma == "so_thai_do":
        n = hoi.kb.nghia_phu("thai_do", cs["so_thai_do"])
        if n:
            muc.append({"loai": "thai_do", "so": cs["so_thai_do"], "noi_dung": n, **hoi.kb.meta_phu()})
    elif ma == "thang_mo_dau":
        n = hoi.kb.nghia_phu("thang_ca_nhan", 1)
        if n:
            muc.append({"loai": "thang_mo_dau", "cac_thang": [f"{t}/{y}" for y, t in cs["thang_mo_dau"]],
                        **n, **hoi.kb.meta_phu()})
    elif ma == "so_ngay_sinh":
        n = hoi.kb.nghia_phu("ngay_sinh", nguoi["ngay"])
        if n:
            muc.append({"loai": "ngay_sinh", "ngay": nguoi["ngay"], "noi_dung": n, **hoi.kb.meta_phu()})
    return muc


def bo_sung_goi(goi: dict, cau_hoi: str, nguoi: dict, ngay_xem: dt.date) -> dict:
    """Câu chuẩn của bảng nỗi đau → đưa bằng chứng của ĐÚNG những chỉ số thẻ đã hứa lên đầu gói.

    Không có bước này, các câu cùng lĩnh vực (vd "hợp nghề gì" / "mất động lực") nhận cùng một câu trả lời và
    con số hiện trên thẻ có thể không xuất hiện trong lời đáp. Câu thường / khủng hoảng / cần người kia: giữ nguyên.
    """
    q = cau_chuan(cau_hoi)
    pl = goi["phan_loai"]
    if not q or pl["xu_ly"] in ("an_toan", "tu_choi_nhe") or goi["can_them"] or pl["linh_vuc"] == "hop_doi":
        return goi
    cs = _chi_so(nguoi, ngay_xem)
    dau: list[dict] = []
    for ma in q["chi_so"]:
        for m in _muc_chi_so(ma, cs, nguoi, pl["linh_vuc"], ngay_xem):
            if m not in dau:
                dau.append(m)
    con_lai = [m for m in goi["muc"] if m not in dau]
    return hoi._ket({**goi, "muc": dau + con_lai})
