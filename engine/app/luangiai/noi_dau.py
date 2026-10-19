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
}


def ban_do(ho_ten: list[str], ngay: int, thang: int, nam: int, ngay_xem: dt.date) -> dict:
    """5 trụ đời, mỗi câu hỏi kèm những con số CỦA NGƯỜI NÀY trả lời câu đó (lớp ĐÃ TÍNH)."""
    k = _kb()
    cs = hoi._chi_so_nguoi({"ho_ten": ho_ten, "ngay": ngay, "thang": thang, "nam": nam}, ngay_xem)
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
    if pl["xu_ly"] in ("an_toan", "tu_choi_nhe"):
        return []
    tu = _tu(cau_hoi)
    chuan = hoi.chuan_hoa(cau_hoi)
    diem = []
    for i, q in enumerate(_kb()["cau_hoi"]):
        if hoi.chuan_hoa(q["cau"]) == chuan:
            continue
        mau = _tu(q["cau"]).union(*(_tu(b) for b in q["bien_the"]))
        d = sum(2 if " " in w else 1 for w in tu & mau) + (3 if pl["linh_vuc"] in q["linh_vuc"] else 0)
        if d:
            diem.append((-d, i, q))
    diem.sort(key=lambda x: (x[0], x[1]))
    return [{"ma": q["ma"], "tru": q["tru"], "cau": q["cau"], "noi_dau": q["noi_dau"]} for _, _, q in diem[:k]]
