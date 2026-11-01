# -*- coding: utf-8 -*-
"""EN-5.2 — đọc sao lưu năm Tử vi thành lời đời thường (RULES, tất định). Vị trí do CALC (`tuvi_an_sao.sao_luu_nam`,
đọc từ iztro) đưa vào; lời ở KB `tuvi_sao_luu_kb.json` (nháp AI). Sao lưu KHÔNG đổi mức của năm (ưu tiên đại hạn >
lưu niên > tiểu hạn giữ nguyên) — chỉ nói thêm mảng nào năm nay có Lộc, có va chạm, có chậm, có chuyển động."""
from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path

CUNG_CHU_Y = ("Mệnh", "Tài Bạch", "Quan Lộc", "Phu Thê", "Điền Trạch")      # = tuvi_doi_song.CUNG_VAN_HAN
_THU_TU = ("thai_tue", "loc", "kinh", "da", "ma", "khoi_viet", "xuong_khuc", "tang_mon", "bach_ho")
_CHU_Y = ("kinh", "da", "tang_mon", "bach_ho")
_CHINH = ("thai_tue", "loc", "kinh", "da", "ma")          # câu hỏi chung "sao lưu năm nay" → đọc đủ các sao này
# câu hỏi nêu tên sao → mã (chữ đã bỏ dấu, như hoidap.chung.chuan_hoa_cau)
HOI_SAO = ((r"kinh da", ("kinh", "da")), (r"kinh duong", ("kinh",)), (r"(?<!\w)da la", ("da",)),
           (r"loc ton|luu loc", ("loc",)), (r"thien ma|luu ma", ("ma",)), (r"tang mon", ("tang_mon",)),
           (r"bach ho", ("bach_ho",)), (r"thai tue", ("thai_tue",)), (r"khoi viet|thien khoi|thien viet", ("khoi_viet",)),
           (r"xuong khuc|van xuong|van khuc", ("xuong_khuc",)))


def ma_hoi(cau_chuan_hoa: str) -> list[str]:
    """Các sao lưu được nêu trong câu hỏi (theo thứ tự đọc)."""
    import re  # noqa: PLC0415
    ra = [m for rx, ds in HOI_SAO if re.search(rx, cau_chuan_hoa) for m in ds]
    return sorted(set(ra), key=_THU_TU.index)


@lru_cache(maxsize=1)
def KB() -> dict:  # noqa: N802
    return json.loads((Path(__file__).resolve().parent.parent / "kb" / "data" / "tuvi_sao_luu_kb.json")
                      .read_text(encoding="utf-8"))


def _vi_tri(sl: dict) -> dict[str, list[str]]:
    s, v = sl["sao"], sl["vong"]
    ra = {k: [s[k]] for k in ("loc", "kinh", "da", "ma") if k in s}
    ra["khoi_viet"] = [s[k] for k in ("khoi", "viet") if k in s]
    ra["xuong_khuc"] = [s[k] for k in ("xuong", "khuc") if k in s]
    ra.update({k: [v[k]] for k in ("thai_tue", "tang_mon", "bach_ho") if k in v})
    return {k: x for k, x in ra.items() if x}


def cau_chu_y(chu_y: list[dict], nam_s: str) -> str:
    from app.luangiai.tuvi_doi_song import _vat   # noqa: PLC0415
    if not chu_y:
        return ""
    return KB()["chu_y"].format(nam=nam_s, ds=", ".join(f"{m['ten']} ({_vat(m['cung'])})" for m in chu_y))


def doc(ls: dict, sl: dict, nam: int | None = None) -> dict:
    """`ls` = lá số tóm tắt (hoidap.tuvi.tom_tat), `sl` = `sao_luu_nam(...)`. → {"muc", "kep_loc", "chu_y", "can_cu"}."""
    from app.luangiai.tuvi_doi_song import _chu, _vat   # noqa: PLC0415 — tránh vòng import

    k = KB()
    theo_chi = {c["chi"]: c["ten"] for c in ls["cung"]}
    nam_s = str(nam) if nam else "này"
    muc = []
    for ma, chi_ds in sorted(_vi_tri(sl).items(), key=lambda x: _THU_TU.index(x[0])):
        o = k["sao"][ma]
        chi_ds = list(dict.fromkeys(chi_ds))
        cac = [theo_chi[c] for c in chi_ds]          # cặp sao (Khôi Việt, Xương Khúc) ở hai cung → một dòng
        chu = _chu(cac[0]) + "".join(f" và {_vat(c)}" for c in cac[1:])
        loi, nen = o["loi"].format(Chu=chu, nam=nam_s), o["nen_lam"]
        if ma in _CHU_Y and cac == ["Tật Ách"]:          # sao khó ở cung sức khoẻ → lời nhắc phòng ngừa, không đoán bệnh
            loi, nen = k["tat_ach"]["loi"].format(nam=nam_s), k["tat_ach"]["nen_lam"]
        muc.append({"ma": ma, "ten": o["ten"], "chi": chi_ds[0], "cung": cac[0], "cac_cung": cac,
                    "loi": loi, "nen_lam": nen,
                    "source_id": o["source_id"], "school_id": k["school_id"]})
    loc = next((m for m in muc if m["ma"] == "loc"), None)
    kep = k["kep_loc"].format(vat=_vat(loc["cung"]), nam=nam_s) if loc else ""
    chu_y = [m for m in muc if m["ma"] in _CHU_Y and m["cung"] in CUNG_CHU_Y]
    cy = cau_chu_y(chu_y, nam_s)
    return {"can": sl["can"], "chi": sl["chi"], "muc": muc, "kep_loc": kep, "chu_y": chu_y, "loi_chu_y": cy,
            "can_cu": k["can_cu"], "trang_thai": k["trang_thai"]}
