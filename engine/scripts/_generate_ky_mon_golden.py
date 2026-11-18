# -*- coding: utf-8 -*-
"""KM-1 — rút bảng 18 cục × 60 giờ của Cổ Kim Đồ Thư Tập Thành (quyển 709–712, kho nguồn `ky_mon_co_kim_do_thu.json`)
thành golden `fixtures/golden/ky_mon_18_cuc.json`. CHỈ đọc chữ sách, không gọi phép tính của engine:

  mỗi dòng giờ → sao trực phù + cung nó tới, cửa trực sử + cung nó tới, vị trí bốn thần (Cửu Thiên, Cửu Địa, Thái Âm,
  Lục Hợp), và ba cặp «cửa – cung» sách kê; mỗi cục → bốn «tiết + nguyên» ở đầu mục.

    python scripts/_generate_ky_mon_golden.py
Dòng bản gõ sai khuôn thì bỏ (đếm ở `_thong_ke`), không sửa tay.
"""
from __future__ import annotations

import json
import re
from pathlib import Path

GOC = Path(__file__).resolve().parent.parent / "fixtures"
SO = "一二三四五六七八九"
CAN, CHI = "甲乙丙丁戊己庚辛壬癸", "子丑寅卯辰巳午未申酉戌亥"
SAO = {"蓬": 1, "內": 2, "芮": 2, "沖": 3, "衝": 3, "輔": 4, "輛": 4, "禽": 5, "心": 6, "柱": 7, "任": 8, "英": 9}
CUA = {"休": 1, "死": 2, "傷": 3, "杜": 4, "開": 6, "驚": 7, "生": 8, "景": 9}
QUE = {"坎": 1, "坤": 2, "震": 3, "巽": 4, "㢲": 4, "乾": 6, "兌": 7, "艮": 8, "離": 9}
TIET = ["冬至", "小寒", "大寒", "立春", "雨水", "驚蟄", "春分", "清明", "穀雨", "立夏", "小滿", "芒種",
        "夏至", "小暑", "大暑", "立秋", "處暑", "白露", "秋分", "寒露", "霜降", "立冬", "小雪", "大雪"]
_S = "".join(SAO)
_DAU = re.compile(rf"(?:^|\n)(?=[{CAN}][{CHI}](?:[{_S}][{SO}][{''.join(CUA)}](?:[{SO}]|〔缺〕)|[{_S}]直符))")


def _gio(ten: str) -> int:
    c, z = CAN.index(ten[0]), CHI.index(ten[1])
    return (6 * c - 5 * z) % 60


def doc_cuc(ten: str, van: str) -> dict:
    duong, cuc = ten[0] == "陽", SO.index(ten[2]) + 1
    khoi = _DAU.split(van)
    dau, hang, loi = khoi[0], [], 0
    tiet = [{"tiet": TIET.index(t), "nguyen": "上中下".index(n)} for t, n in re.findall(r"〕([^〔〕]{2})([上中下])〔", dau)]
    for k in khoi[1:]:
        k = k.replace("\n", "")
        m = (re.match(rf"([{CAN}][{CHI}])([{_S}])([{SO}])([{''.join(CUA)}])([{SO}])", k)
             or re.match(rf"([{CAN}][{CHI}])([{_S}])直符([{SO}])([{''.join(CUA)}])直使?([{SO}])", k))
        than = re.search(rf"天([{SO}])地([{SO}])陰([{SO}])合([{SO}])", k)
        if not m or not than:
            loi += 1
            continue
        truoc = k[m.end():than.start()]
        cua_vi = [[CUA[a], QUE[b]] for a, b in re.findall(rf"([{''.join(CUA)}])[^{''.join(CUA)}{''.join(QUE)}]{{0,4}}([{''.join(QUE)}])", truoc)]
        hang.append({"gio": _gio(m.group(1)), "sao": SAO[m.group(2)], "sao_cung": SO.index(m.group(3)) + 1,
                     "cua": CUA[m.group(4)], "cua_cung": SO.index(m.group(5)) + 1,
                     "than": {"thien": SO.index(than.group(1)) + 1, "dia": SO.index(than.group(2)) + 1,
                              "am": SO.index(than.group(3)) + 1, "hop": SO.index(than.group(4)) + 1},
                     "cua_vi": cua_vi})
    return {"duong": duong, "cuc": cuc, "tiet": tiet, "hang": hang, "_loi": loi}


def main() -> None:
    d = json.loads((GOC / "nguon" / "ky_mon_co_kim_do_thu.json").read_text("utf-8"))
    cuc = [doc_cuc(t["ten"].split(" · ")[-1], t["van"]) for t in d["thien"] if t["quyen"] in range(709, 713)]
    out = {"_nguon": "Bảng 18 cục × 60 giờ, 《欽定古今圖書集成》 藝術典 quyển 709–712 (kho nguồn ky_mon_co_kim_do_thu.json). "
                     "Rút bằng scripts/_generate_ky_mon_golden.py — chỉ đọc chữ sách, không sửa tay.",
           "_thong_ke": {"so_cuc": len(cuc), "so_hang": sum(len(c["hang"]) for c in cuc), "hang_bo": sum(c.pop("_loi") for c in cuc)},
           "cuc": cuc}
    (GOC / "golden" / "ky_mon_18_cuc.json").write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")) + "\n", "utf-8")
    print(out["_thong_ke"], [len(c["tiet"]) for c in cuc])


if __name__ == "__main__":
    main()
