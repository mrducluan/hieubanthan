# -*- coding: utf-8 -*-
"""Sinh golden cho SPEC-004a: tuần/triệt + can chi, TỪ BẢN GỐC tuan_triet.py.

5 ca được chọn có chủ đích:
  1. Sinh 1988 thường           — ca nền
  2. Sinh 05/02/1988 (trước Tết)— năm can chi phải là Đinh Mão 1987
  3. Sinh 02/12/1970 00:30 SG   — múi giờ UTC+8, lùi về 01/12 23:30
  4. Sinh 23:30                 — sát biên giờ Tý
  5. Sinh 2000 trường phái NPL  — có cảnh báo xung đột nếu chạy chế độ rộng

    python engine/fixtures/_generate_tuvi_golden.py
"""
from __future__ import annotations

import importlib.util
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parents[1]))
from app.calc import lunar  # noqa: E402

BAN_GOC = Path("C:/Users/mrduc/tuvi-vn/tuan_triet.py")
DICH = Path(__file__).parent / "golden" / "tuvi_tuan_triet.json"


def nap_ban_goc():
    spec = importlib.util.spec_from_file_location("tuan_triet_goc", BAN_GOC)
    assert spec and spec.loader
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


CA = [
    {"id": "nen_1988", "duong": (2, 12, 1988), "truong_phai": "npl", "che_do": "hep"},
    {"id": "truoc_tet_1988", "duong": (5, 2, 1988), "truong_phai": "npl", "che_do": "hep"},
    {"id": "saigon_1970", "duong": (1, 12, 1970), "truong_phai": "vvt", "che_do": "tam_hop",
     "ghi_chu": "ngay da quy doi ve UTC+7 tu 02/12 00:30 dong ho Sai Gon"},
    {"id": "bien_gio_ty", "duong": (15, 6, 1990), "truong_phai": "vvt", "che_do": "tam_hop"},
    {"id": "xung_dot_cau_hinh", "duong": (5, 2, 2000), "truong_phai": "npl", "che_do": "tam_hop",
     "ghi_chu": "NPL + che do rong -> PHAI co canh bao xung dot"},
]


def main() -> None:
    goc = nap_ban_goc()
    out = {"_nguon": "sinh tu tuvi-vn/tuan_triet.py + app.calc.lunar",
           "_canh_bao": "Khong sua tay. Chay lai _generate_tuvi_golden.py.",
           "cases": {}}
    for ca in CA:
        d, m, y = ca["duong"]
        ld, lm, ly, leap = lunar.solar_to_lunar(d, m, y, 7.0)
        can, chi = lunar.can_chi_nam(ly)
        out["cases"][ca["id"]] = {
            "input": ca,
            "expect": {
                "am_lich": {"ngay": ld, "thang": lm, "nam": ly, "nhuan": leap},
                "can_chi_nam": [can, chi],
                "tuan_triet": goc.phan_tich(can, chi, ca["che_do"], ca["truong_phai"]),
            },
        }
    DICH.parent.mkdir(parents=True, exist_ok=True)
    DICH.write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Da ghi {DICH.relative_to(Path(__file__).parents[1])}: {len(CA)} ca")


if __name__ == "__main__":
    main()
