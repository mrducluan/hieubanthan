# -*- coding: utf-8 -*-
"""Sinh golden dataset cho thần số học TỪ SCRIPT GỐC của người dùng.

Script gốc (`C:/Users/mrduc/thanso-hoc/thanso.py`) là nguồn chân lý. Bản port
trong `engine/app/calc/thanso.py` phải khớp tuyệt đối với nó.

Chạy lại file này CHỈ khi cố ý thay đổi hành vi tính toán. Nếu golden đổi mà
không có chủ ý, tức là bản port vừa làm sai một thứ gì đó.

    python engine/fixtures/_generate_thanso_golden.py
"""
from __future__ import annotations

import importlib.util
import json
import sys
from pathlib import Path

SCRIPT_GOC = Path("C:/Users/mrduc/thanso-hoc/thanso.py")
DICH = Path(__file__).with_name("golden_thanso.json")


def nap_script_goc():
    if not SCRIPT_GOC.exists():
        sys.exit(f"Khong tim thay script goc: {SCRIPT_GOC}")
    spec = importlib.util.spec_from_file_location("thanso_goc", SCRIPT_GOC)
    assert spec and spec.loader
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)          # __name__ != "__main__" nên khối CLI không chạy
    return mod


# Các ca được chọn để phủ: dấu tiếng Việt, chữ Đ, số cái (master 11/22/33),
# tên một chữ, và ngày sinh có kết quả ổn định.
CA_KIEM_THU: list[dict] = [
    {"id": "vn_dau_va_chu_D", "ten": ["Nguyen Duc Luan", "Nguyễn Đức Luân"],
     "d": 2, "m": 12, "y": 1988},
    {"id": "khong_dau", "ten": ["Tran Thi Mai"], "d": 15, "m": 7, "y": 1995},
    {"id": "co_chu_Y", "ten": ["Ly Yen Nhy"], "d": 29, "m": 2, "y": 2004},
    {"id": "ten_ngan", "ten": ["An"], "d": 1, "m": 1, "y": 2000},
    {"id": "master_11", "ten": ["Pham Van Bay"], "d": 29, "m": 11, "y": 1975},
]

CA_CHU_KY: list[dict] = [
    {"id": "chu_ky_1988", "d": 2, "m": 12, "y": 1988, "tu": 2024, "den": 2027},
    {"id": "chu_ky_2000", "d": 1, "m": 1, "y": 2000, "tu": 2020, "den": 2022},
]


def main() -> None:
    g = nap_script_goc()
    out: dict = {
        "_nguon": "sinh tu C:/Users/mrduc/thanso-hoc/thanso.py",
        "_canh_bao": "Khong sua tay. Chay lai _generate_thanso_golden.py.",
        "do_nhay": {},
        "chi_so_don": {},
        "chu_ky": {},
    }

    for ca in CA_KIEM_THU:
        out["do_nhay"][ca["id"]] = {
            "input": ca,
            "expect": g.do_nhay(ca["ten"], ca["d"], ca["m"], ca["y"]),
        }
        # Chốt một quy ước cụ thể để test từng hàm lẻ, không chỉ test khoảng.
        ten0 = ca["ten"][0]
        out["chi_so_don"][ca["id"]] = {
            "input": {"ten": ten0, "d": ca["d"], "m": ca["m"], "y": ca["y"],
                      "d_thanh_d": True, "y_la_nguyen_am": False, "giu_master": True},
            "expect": {
                "su_menh": g.chi_so_ten(ten0, "su_menh", True, False, True),
                "linh_hon": g.chi_so_ten(ten0, "linh_hon", True, False, True),
                "nhan_cach": g.chi_so_ten(ten0, "nhan_cach", True, False, True),
                "duong_doi_tong_het": g.duong_doi(ca["d"], ca["m"], ca["y"], "tong_het", True),
                "duong_doi_tung_phan": g.duong_doi(ca["d"], ca["m"], ca["y"], "tung_phan", True),
                "bo_dau": g.bo_dau(ten0, True),
            },
        }

    for ca in CA_CHU_KY:
        dd = g.duong_doi(ca["d"], ca["m"], ca["y"])
        out["chu_ky"][ca["id"]] = {
            "input": ca,
            "expect": {
                "duong_doi": dd,
                "dinh_cao": g.dinh_cao(ca["d"], ca["m"], ca["y"], dd),
                "thu_thach": g.thu_thach(ca["d"], ca["m"], ca["y"]),
                "bang_nam_ca_nhan": g.chu_ky_9_nam(ca["d"], ca["m"], ca["y"],
                                                   ca["tu"], ca["den"]),
            },
        }

    DICH.write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")
    n = len(CA_KIEM_THU) * 2 + len(CA_CHU_KY)
    print(f"Da ghi {DICH.name}: {n} ca kiem thu")


if __name__ == "__main__":
    main()
