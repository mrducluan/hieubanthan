# -*- coding: utf-8 -*-
"""NS-QT (2026-11-16) — dựng `app/calc/data/dia_danh.json` từ GeoNames (CC BY 4.0, https://www.geonames.org).

Chạy:  python scripts/nap_geonames.py <thư mục có cities15000.txt, admin1CodesASCII.txt, countryInfo.txt>
Tải ba tệp ở https://download.geonames.org/export/dump/ (cities15000.zip giải nén). Bỏ Việt Nam (trong nước dùng 63 tỉnh).

Đầu ra gọn (một dòng một thành phố, mảng thay object) vì engine nạp ~34 nghìn dòng:
  "tp": [[geonameid, tên, mã nước, mã cấp 1, vĩ độ, kinh độ, chỉ số vùng giờ, dân số, "tên khác|…"], …]
  "zone": [mã IANA…] · "nuoc": {mã: [tên Việt, tên Anh]} · "cap1": {"US.CA": "California", …}
Tên khác chỉ giữ chữ Latin (có hoặc không dấu, đã bỏ dấu + viết thường) khác tên chính — để gõ "prague" ra Praha.
Không sửa tay tệp đầu ra; đổi gì thì sửa script này và chạy lại."""
from __future__ import annotations

import csv
import json
import sys
import unicodedata
from datetime import date
from pathlib import Path

GOC = Path(__file__).resolve().parents[1]
RA = GOC / "app" / "calc" / "data" / "dia_danh.json"
MUI_GIO = GOC / "app" / "calc" / "data" / "mui_gio.json"
TOI_DA_TEN_KHAC = 10

# Tên nước tiếng Việt thường dùng (bổ sung cho 62 nước đã có ở mui_gio.json); nước không có ở đây → tên tiếng Anh.
TEN_NUOC_VI = {
    "AF": "Afghanistan", "AL": "Albania", "DZ": "Algérie", "AD": "Andorra", "AO": "Angola", "AR": "Argentina",
    "AM": "Armenia", "AT": "Áo", "AZ": "Azerbaijan", "BH": "Bahrain", "BD": "Bangladesh", "BY": "Belarus",
    "BE": "Bỉ", "BJ": "Bénin", "BT": "Bhutan", "BO": "Bolivia", "BA": "Bosnia và Herzegovina", "BW": "Botswana",
    "BR": "Brasil", "BN": "Brunei", "BG": "Bulgaria", "BF": "Burkina Faso", "BI": "Burundi", "KH": "Campuchia",
    "CM": "Cameroon", "CA": "Canada", "CF": "Cộng hoà Trung Phi", "TD": "Tchad", "CL": "Chile", "CN": "Trung Quốc",
    "CO": "Colombia", "CG": "Cộng hoà Congo", "CD": "Cộng hoà Dân chủ Congo", "CR": "Costa Rica", "CI": "Bờ Biển Ngà",
    "HR": "Croatia", "CU": "Cuba", "CY": "Síp", "CZ": "Séc", "DK": "Đan Mạch", "DO": "Cộng hoà Dominica",
    "EC": "Ecuador", "EG": "Ai Cập", "SV": "El Salvador", "EE": "Estonia", "ET": "Ethiopia", "FI": "Phần Lan",
    "FR": "Pháp", "GA": "Gabon", "GE": "Gruzia", "DE": "Đức", "GH": "Ghana", "GR": "Hy Lạp", "GT": "Guatemala",
    "GN": "Guinée", "HT": "Haiti", "HN": "Honduras", "HK": "Hồng Kông", "HU": "Hungary", "IS": "Iceland",
    "IN": "Ấn Độ", "ID": "Indonesia", "IR": "Iran", "IQ": "Iraq", "IE": "Ireland", "IL": "Israel", "IT": "Ý",
    "JM": "Jamaica", "JP": "Nhật Bản", "JO": "Jordan", "KZ": "Kazakhstan", "KE": "Kenya", "KP": "Triều Tiên",
    "KR": "Hàn Quốc", "KW": "Kuwait", "KG": "Kyrgyzstan", "LA": "Lào", "LV": "Latvia", "LB": "Liban",
    "LY": "Libya", "LT": "Litva", "LU": "Luxembourg", "MO": "Ma Cao", "MG": "Madagascar", "MW": "Malawi",
    "MY": "Malaysia", "ML": "Mali", "MT": "Malta", "MX": "México", "MD": "Moldova", "MN": "Mông Cổ",
    "ME": "Montenegro", "MA": "Maroc", "MZ": "Mozambique", "MM": "Myanmar", "NA": "Namibia", "NP": "Nepal",
    "NL": "Hà Lan", "NZ": "New Zealand", "NI": "Nicaragua", "NE": "Niger", "NG": "Nigeria", "MK": "Bắc Macedonia",
    "NO": "Na Uy", "OM": "Oman", "PK": "Pakistan", "PA": "Panama", "PG": "Papua New Guinea", "PY": "Paraguay",
    "PE": "Peru", "PH": "Philippines", "PL": "Ba Lan", "PT": "Bồ Đào Nha", "PR": "Puerto Rico", "QA": "Qatar",
    "RO": "Romania", "RU": "Nga", "RW": "Rwanda", "SA": "Ả Rập Xê Út", "SN": "Sénégal", "RS": "Serbia",
    "SG": "Singapore", "SK": "Slovakia", "SI": "Slovenia", "SO": "Somalia", "ZA": "Nam Phi", "ES": "Tây Ban Nha",
    "LK": "Sri Lanka", "SD": "Sudan", "SE": "Thuỵ Điển", "CH": "Thuỵ Sĩ", "SY": "Syria", "TW": "Đài Loan",
    "TJ": "Tajikistan", "TZ": "Tanzania", "TH": "Thái Lan", "TL": "Đông Timor", "TG": "Togo", "TN": "Tunisia",
    "TR": "Thổ Nhĩ Kỳ", "TM": "Turkmenistan", "UG": "Uganda", "UA": "Ukraina", "AE": "Các Tiểu vương quốc Ả Rập Thống nhất",
    "GB": "Vương quốc Anh", "US": "Hoa Kỳ", "UY": "Uruguay", "UZ": "Uzbekistan", "VE": "Venezuela", "YE": "Yemen",
    "ZM": "Zambia", "ZW": "Zimbabwe", "AU": "Úc", "FJ": "Fiji", "NC": "Nouvelle-Calédonie", "PF": "Polynésie thuộc Pháp",
    "RE": "Réunion", "GU": "Guam", "MU": "Mauritius", "CV": "Cabo Verde", "ER": "Eritrea", "SS": "Nam Sudan",
}


def bo_dau(s: str) -> str:
    s = s.replace("đ", "d").replace("Đ", "D")
    s = "".join(c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn")
    return " ".join("".join(c if c.isalnum() else " " for c in s.lower()).split())


def la_latin(s: str) -> bool:
    return all(("LATIN" in unicodedata.name(c, "")) or not c.isalpha() for c in s)


def main(thu_muc: str) -> None:
    d = Path(thu_muc)
    vi = {n["ma"].upper(): (n["ten"], n.get("ten_en") or n["ten"]) for n in json.loads(MUI_GIO.read_text(encoding="utf-8"))["nuoc"]
          if len(n["ma"]) == 2}
    nuoc: dict[str, list[str]] = {}
    for dong in (d / "countryInfo.txt").read_text(encoding="utf-8").splitlines():
        if dong.startswith("#") or not dong.strip():
            continue
        c = dong.split("\t")
        ma, ten_en = c[0], c[4]
        ten_vi = (vi.get(ma) or (None, None))[0] or TEN_NUOC_VI.get(ma) or ten_en
        nuoc[ma] = [ten_vi.split(" (")[0], ten_en]
    cap1 = {}
    for dong in (d / "admin1CodesASCII.txt").read_text(encoding="utf-8").splitlines():
        c = dong.split("\t")
        if len(c) >= 2:
            cap1[c[0]] = c[1]
    zone: list[str] = []
    zi: dict[str, int] = {}
    tp = []
    dung_cap1 = set()
    with (d / "cities15000.txt").open(encoding="utf-8") as f:
        for c in csv.reader(f, delimiter="\t", quoting=csv.QUOTE_NONE):
            gid, ten, _ascii, khac, lat, lon, _fc, _fcode, cc, _cc2, a1 = c[:11]
            dan, tz = c[14], c[17]
            if cc == "VN" or not tz:
                continue
            if tz not in zi:
                zi[tz] = len(zone)
                zone.append(tz)
            chinh = bo_dau(ten)
            ten_khac = []
            for k in khac.split(","):
                k = k.strip()
                if not k or len(k) > 40 or not la_latin(k):
                    continue
                kb = bo_dau(k)
                if kb and kb != chinh and kb not in ten_khac and len(kb) >= 4:
                    ten_khac.append(kb)
                if len(ten_khac) >= TOI_DA_TEN_KHAC:
                    break
            k1 = f"{cc}.{a1}"
            if k1 in cap1:
                dung_cap1.add(k1)
            tp.append([int(gid), ten, cc, a1, round(float(lat), 2), round(float(lon), 2), zi[tz], int(dan or 0), "|".join(ten_khac)])
    tp.sort(key=lambda x: -x[7])
    ra = {
        "_nguon": "GeoNames (https://www.geonames.org), giấy phép CC BY 4.0 — tệp cities15000 (thành phố ≥ 15.000 dân), "
                  f"tải {date.today().isoformat()}; bỏ Việt Nam. Dựng bằng scripts/nap_geonames.py, không sửa tay.",
        "zone": zone,
        "nuoc": {k: v for k, v in nuoc.items() if any(t[2] == k for t in tp)},
        "cap1": {k: cap1[k] for k in sorted(dung_cap1)},
        "tp": tp,
    }
    RA.write_text(json.dumps(ra, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"{len(tp)} thành phố, {len(zone)} vùng giờ, {RA.stat().st_size / 1e6:.2f} MB → {RA}")


if __name__ == "__main__":
    main(sys.argv[1])
