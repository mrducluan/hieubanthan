# -*- coding: utf-8 -*-
"""Lấy lá số tử vi mẫu từ aov.cc (engine iztro) làm ORACLE golden cho SPEC-005.

QUAN TRỌNG — đây là ORACLE để đối chiếu khi phát triển, KHÔNG phải đường chạy
sản phẩm. Ngày giờ sinh dùng ở đây là GIẢ ĐỊNH (không của ai). Ở sản phẩm thật,
an sao chạy cục bộ bằng iztro (MIT), dữ liệu khách không rời máy chủ.

Xung đột đã biết: aov.cc dùng late_zi_rule = 23:00 sang ngày sau (SWITCH_AT_2300),
trong khi ta chốt SWITCH_AT_0000. Nên các ca 23:00–23:59 sẽ được đánh dấu
_ty_conflict để xử lý riêng, không lấy làm golden mù quáng.

    python engine/fixtures/_fetch_ziwei_oracle.py
"""
from __future__ import annotations

import json
import subprocess
import time
from pathlib import Path

API = "https://aov.cc/api/v1/ziwei/calculate"
RAW_DIR = Path(__file__).parent / "golden" / "ziwei_oracle_raw"
SUMMARY = Path(__file__).parent / "golden" / "ziwei_oracle.json"

# timeIndex trong iztro: 0=早子(00-01), 1=丑(01-03) ... 12=晚子(23-00).
CA = [
    {"id": "nam_1990_suu", "gender": "male", "year": 1990, "month": 5, "day": 15,
     "timeIndex": 1, "ghi_chu": "ca nen, gio Suu"},
    {"id": "nu_1992_dau", "gender": "female", "year": 1992, "month": 8, "day": 21,
     "timeIndex": 4, "ghi_chu": "ca nen nu"},
    {"id": "nam_2000_ngo", "gender": "male", "year": 2000, "month": 1, "day": 1,
     "timeIndex": 6, "ghi_chu": "gio Ngo, dau nam duong"},
    {"id": "nam_1988_truoc_tet", "gender": "male", "year": 1988, "month": 2, "day": 5,
     "timeIndex": 3, "ghi_chu": "truoc Tet Mau Thin -> phai la nam Dinh Mao"},
    {"id": "nu_1970_thin", "gender": "female", "year": 1970, "month": 12, "day": 2,
     "timeIndex": 5, "ghi_chu": "nam 1970 (luu y: aov khong nhan mui gio VN)"},
    {"id": "nam_som_ty", "gender": "male", "year": 1995, "month": 6, "day": 15,
     "timeIndex": 0, "ghi_chu": "som Ty 00:00-01:00 - KHONG dinh xung dot gio Ty"},
    {"id": "nam_muon_ty_XUNGDOT", "gender": "male", "year": 1995, "month": 6, "day": 15,
     "timeIndex": 12, "ghi_chu": "muon Ty 23:00 - aov tinh sang ngay sau, ta thi khong"},
    {"id": "nu_2004_nhuan", "gender": "female", "year": 2004, "month": 3, "day": 21,
     "timeIndex": 7, "ghi_chu": "nam 2004 co thang 2 nhuan"},
]


def goi(ca: dict, thu: int = 5) -> dict:
    """Gọi qua curl, không qua urllib.

    aov.cc dùng bot-detection fingerprint HTTP: urllib bị 403/503, curl qua
    được (đã kiểm chứng). Đây là script dev sinh fixtures nên shell-out curl
    hoàn toàn hợp lý — không phải đường chạy sản phẩm.
    """
    body = json.dumps({
        "gender": ca["gender"], "dateType": "solar",
        "year": str(ca["year"]), "month": str(ca["month"]), "day": str(ca["day"]),
        "timeIndex": ca["timeIndex"],
    })
    cmd = [
        "curl", "-s", "--max-time", "30", "-X", "POST", API,
        "-H", "Content-Type: application/json", "-d", body,
    ]
    for lan in range(thu):
        p = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8")
        if p.returncode == 0 and p.stdout.strip():
            try:
                data = json.loads(p.stdout)
            except json.JSONDecodeError:
                data = None
            if data and data.get("ok"):
                return data
        # 1102/503 = Cloudflare rate-limit → chờ lâu dần (15s, 30s, 45s...).
        if lan < thu - 1:
            time.sleep(15 * (lan + 1))
    raise RuntimeError(f"Goi {ca['id']} that bai sau {thu} lan: "
                       f"{(p.stdout or p.stderr)[:200]}")


def trich_yeu(data: dict) -> dict:
    """Rút gọn về đúng phần an sao cần đối chiếu: mệnh/thân, cục, 12 cung + sao."""
    d = data["data"]
    b = d["basicInfo"]
    palaces = d["payloadByScope"]["origin"]["palaces"]
    cung_gon = []
    for p in palaces:
        sao = []
        for khoa in ("major_stars", "minor_stars", "adjective_stars",
                     "majorStars", "minorStars", "adjectiveStars"):
            for s in p.get(khoa, []) or []:
                ten = s.get("name") if isinstance(s, dict) else s
                if ten:
                    sao.append(ten)
        cung_gon.append({
            "ten_cung": p.get("name") or p.get("palace_name"),
            "chi": p.get("earthly_branch") or p.get("branch"),
            "sao": sorted(set(sao)),
        })
    return {
        "solar_date": b["solar_date"],
        "lunar_date": b["lunar_date"],
        "chinese_date": b["chinese_date"],
        "birth_time_label": b["birth_time_label"],
        "five_elements_class": b["five_elements_class"],
        "soul": b["soul"], "body": b["body"],
        "soul_palace_branch": b["soul_palace_branch"],
        "body_palace_branch": b["body_palace_branch"],
        "cung": cung_gon,
    }


def main() -> None:
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    # Chờ throttle Cloudflare hết trước khi bắt đầu (loạt gọi hỏng trước đó).
    print("cho 90s cho throttle het ...", flush=True)
    time.sleep(90)
    out = {
        "_nguon": "aov.cc/api/v1/ziwei/calculate (engine iztro, MIT)",
        "_vai_tro": "ORACLE doi chieu khi phat trien - KHONG phai duong chay san pham",
        "_late_zi_rule_aov": "23:00 sang ngay sau (SWITCH_AT_2300)",
        "_chinh_sach_ta": "SWITCH_AT_0000 - ca timeIndex 12 co _ty_conflict=true",
        "cases": {},
    }
    for ca in CA:
        print(f"  goi {ca['id']} ...", end=" ", flush=True)
        raw = goi(ca)
        (RAW_DIR / f"{ca['id']}.json").write_text(
            json.dumps(raw, ensure_ascii=False, indent=2), encoding="utf-8")
        yeu = trich_yeu(raw)
        out["cases"][ca["id"]] = {
            "input": ca,
            "_ty_conflict": ca["timeIndex"] == 12,
            "expect": yeu,
        }
        print(f"OK ({yeu['chinese_date']}, {yeu['five_elements_class']})")
        time.sleep(10)   # giãn nhịp rộng để không kích lại rate-limit
    SUMMARY.write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\nDa ghi {SUMMARY.name}: {len(CA)} la so")


if __name__ == "__main__":
    main()
