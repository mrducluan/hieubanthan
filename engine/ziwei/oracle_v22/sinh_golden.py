# -*- coding: utf-8 -*-
"""ORACLE PHÁT TRIỂN (không chạy runtime) — sinh golden đối chiếu engine TypeScript v2.2.

    cd engine && PYTHONPATH=. .venv/bin/python ziwei/oracle_v22/sinh_golden.py [đường_dẫn_kb_v2_2.json]

1. Lấy 67 lá golden phi hoá (`fixtures/golden/tuvi_phi_hoa_golden.json` — ngày lịch Việt = lịch Trung), an lá số
   bằng iztro của dự án (`calc.tuvi_an_sao.an_sao_tho` → `hoidap.tuvi.tom_tat`).
2. Đổi cung/chi/sao sang mã chuẩn bằng `app.kb.tuvi_ma_chuan.cung_sang_ma` (như adapter 04 của v2.2) — can cung
   KHÔNG đưa vào: để TS tự tính bằng Ngũ Hổ Độn (assignPalaceStemsAndLaiNhan) rồi so với iztro + Python.
3. Chạy `sinh_golden.ts` bằng `node --experimental-strip-types` → ghi `fixtures/golden/tuvi_v22_oracle.json`.
Tham số tuỳ chọn: tệp KB v2.2 gốc (không vào git) → chép bảng `0_legacy_adapter_mapping` vào golden để test kiểm
`tuvi_ma_chuan` khớp từng mục.
"""
from __future__ import annotations

import datetime as dt
import json
import subprocess
import sys
import tempfile
from pathlib import Path

from app.calc import lunar
from app.calc import tuvi_an_sao as az
from app.hoidap.tuvi import tom_tat
from app.kb import tuvi_ma_chuan as mc

GOC = Path(__file__).resolve().parent
ENGINE = GOC.parents[1]
GOLDEN = ENGINE / "fixtures" / "golden"
RA = GOLDEN / "tuvi_v22_oracle.json"
VAI = ["BUSINESS_PARTNER", "SPOUSE", "CHILD"]
NHAN = ["PREV_HOUR_CHART", "EXACT_HOUR_CHART", "NEXT_HOUR_CHART"]
# Ngày xem cho "nhịp 3 tháng": giữa năm 2026 · tháng 11 âm (vắt sang năm âm sau) · tháng nhuận 6/2025.
NGAY_NHIP = ["2026-10-20", "2026-12-25", "2025-08-10"]

_SO = {"正": 1, "一": 1, "二": 2, "三": 3, "四": 4, "五": 5, "六": 6, "七": 7, "八": 8, "九": 9, "十": 10,
       "冬": 11, "腊": 12, "臘": 12}


def _so_han(s: str) -> int:
    """Số Hán 1–30 dạng tháng/ngày âm (初一, 十五, 廿三, 三十, 十一月…)."""
    s = s.replace("初", "").replace("廿", "二十").replace("卅", "三十")
    if s in ("冬", "腊", "臘", "正"):
        return _SO[s]
    if "十" in s:
        a, b = s.split("十")
        return (_SO[a] if a else 1) * 10 + (_SO[b] if b else 0)
    return _SO[s]


def thang_am_iztro(la: dict) -> tuple[int, int, bool]:
    """(tháng, ngày, nhuận) âm lịch iztro ghi trên lá (`lunarDate` = 一九五一年四月十二, có thể có 闰)."""
    s = la["lunarDate"].split("年", 1)[1]
    thang, ngay = s.split("月", 1)
    return _so_han(thang.replace("闰", "").replace("閏", "")), _so_han(ngay), ("闰" in thang or "閏" in thang)


def _ls(ngay: dt.date, ti: int, gt: str) -> tuple[dict, dict]:
    la = az.an_sao_tho(ngay, ti, gt, "vi-VN")
    return la, tom_tat(la)


def _nam(y: int) -> dict:
    can, chi = lunar.can_chi_nam(y)
    return {"viewingYear": y, "viewingYearStem": mc.ma_can(can), "viewingYearBranch": mc.ma_chi(chi)}


def dau_vao() -> dict:
    goc = json.loads((GOLDEN / "tuvi_phi_hoa_golden.json").read_text(encoding="utf-8"))["cases"]
    cases = []
    ls_all = []
    for c in goc:
        ngay = dt.date.fromisoformat(c["ngay"])
        la, ls = _ls(ngay, c["ti"], c["gioi_tinh"])
        ls_all.append(ls)
        thang, ngay_am, nhuan = thang_am_iztro(la)
        cases.append({"id": f"{c['ngay']}_{c['ti']}_{c['gioi_tinh']}", "ngay": c["ngay"], "ti": c["ti"],
                      "gioi_tinh": c["gioi_tinh"], "can_nam": c["can_nam"],
                      "birthYearStem": mc.ma_can(c["can_nam"]), "palaces": mc.cung_sang_ma(ls["cung"]),
                      "birthLunarMonth": thang, "birthLunarDay": ngay_am, "birthLunarLeap": nhuan,
                      "birthHourBranch": mc.ma_chi(lunar.CHI[c["ti"] % 12])})
    n = len(cases)
    for i, c in enumerate(cases):
        # Lưu nguyệt cả năm (tháng 1, 4, 7, 10 → 3 tháng mỗi lượt = 12 tháng) + một lượt "nhịp 3 tháng" theo ngày xem.
        nx = dt.date.fromisoformat(NGAY_NHIP[i % len(NGAY_NHIP)])
        _, m, y, _ = lunar.solar_to_lunar(nx.day, nx.month, nx.year, 7.0)
        c["radar"] = [{**_nam(2020 + i % 11), "startMonths": [1, 4, 7, 10]},
                      {**_nam(y), "startMonths": [m], "ngay_xem": nx.isoformat()}]
        j = (i + 1) % n
        kia = cases[j]
        c["synergy"] = {"partner": kia["id"], "role": VAI[i % 3], "partnerBirthYearStem": kia["birthYearStem"],
                        "partnerMenhPalaceStem": mc.ma_can(next(x["can"] for x in ls_all[j]["cung"]
                                                                 if x["ten"] == "Mệnh")),
                        "partnerPalaces": kia["palaces"]}
        ti = c["ti"]
        ung = []
        for nhan, t in zip(NHAN, (ti - 1, ti, ti + 1)):
            if 0 <= t <= 12:
                ung.append({"label": nhan, "ti": t, "hourBranch": mc.ma_chi(lunar.CHI[t % 12]),
                            "palaces": mc.cung_sang_ma(_ls(dt.date.fromisoformat(c["ngay"]), t,
                                                           c["gioi_tinh"])[1]["cung"])})
        y0 = 2015 + i % 9
        c["calibration"] = {"candidates": ung,
                            "years": [{"solarYear": y, "yearStem": mc.ma_can(lunar.can_chi_nam(y)[0])}
                                      for y in (y0, y0 + 1, y0 + 2)]}
    # Lá thiếu Văn Xương (dữ liệu hỏng/adapter đọc sót) — lộ cách TS lặng lẽ rơi về 'MENH'.
    thieu = [{**{k: cases[0][k] for k in ("id", "birthYearStem")},
              "palaces": [{**p, "stars": [s for s in p["stars"] if s != "VAN_XUONG"]} for p in cases[0]["palaces"]],
              "viewingYearStem": "BINH", "currentLunarMonth": 1, "janBranch": "DAN",
              "years": [{"solarYear": 2031, "yearStem": "TAN"}]}]
    bazhai = [{"year": y, "gender": g} for y in range(1900, 2100) for g in ("MALE", "FEMALE")]
    return {"cases": cases, "bazhai": bazhai, "thieuSao": thieu}


_KHOA_BAY = ("sourcePalace", "sourceStem", "siHuaType", "transformedStar", "targetPalace", "clashedPalace",
             "isSelfTransformation", "isCircuitBrokenByVN")


def _gon(kq: dict) -> dict:
    """Bỏ phần lặp (danh sách sao chép lại từ đầu vào) và câu chữ TS (giọng văn không dùng) cho golden gọn.
    Giữ: mọi mã cung/can/sao/mức của TS — đủ để đối chiếu."""
    for c in kq["cases"]:
        c["assign"]["stems"] = {p["palaceCode"]: p["stem"] for p in c["assign"].pop("updatedPalaces")}
        m = c["matrix"]
        m["selfTransformations"] = len(m["selfTransformations"])
        # đường bay dạng mảng: [cung nguồn, can, hoá, sao, cung đích, cung xung, tự hoá, Tuần/Triệt]
        m["allTransitions"] = [[t[k] for k in _KHOA_BAY] for t in m["allTransitions"]]
        m["criticalClashes"] = [[t["sourcePalace"], t["siHuaType"]] for t in m["criticalClashes"]]
        for r in c["radar"]:
            for it in r["items"]:
                it.pop("alertReason")
        s = c["synergy"]
        s.pop("partnerPalaces")
        for x in s["forward"] + s["reverse"]:
            x.pop("strategicMeaning")
        k = c["calibration"]
        for u in k["candidates"]:
            u.pop("palaces")
        for res in (k["result"], k["resultDefaultYears"]):
            for r in res:
                for q in r["pastVerificationQuestions"]:
                    q.pop("expectedEventSummary")
        k["resultDefaultYears"] = [{"candidateLabel": r["candidateLabel"],
                                    "years": [(q["yearToCheck"], q["yearStem"], q["clashedPalace"])
                                              for q in r["pastVerificationQuestions"]]}
                                   for r in k["resultDefaultYears"]]
    return kq


def main() -> None:
    vao = dau_vao()
    with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False, encoding="utf-8") as f:
        json.dump(vao, f, ensure_ascii=False)
    out = subprocess.run(["node", "--experimental-strip-types", "--no-warnings", str(GOC / "sinh_golden.ts"), f.name],
                         capture_output=True, text=True, check=True, cwd=GOC)
    Path(f.name).unlink()
    kq = _gon(json.loads(out.stdout))
    ban_do = None
    if len(sys.argv) > 1:
        ban_do = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))["0_legacy_adapter_mapping"]
        ban_do = {k: v for k, v in ban_do.items() if k != "description"}
    elif RA.exists():
        ban_do = json.loads(RA.read_text(encoding="utf-8")).get("adapter_mapping")
    nguon = ("engine/ziwei/oracle_v22/astroEngine_v2_2.ts (bản sao nguyên văn 03_astroEngine_v2_2.ts, chủ dự án "
             "gửi 2026-10-19) chạy bằng node --experimental-strip-types; đầu vào = lá số iztro 2.6.0 của dự án "
             "(67 lá tuvi_phi_hoa_golden), tên → mã bằng app/kb/tuvi_ma_chuan.py. Sinh bằng "
             "ziwei/oracle_v22/sinh_golden.py.")
    dong = lambda x: json.dumps(x, ensure_ascii=False, separators=(",", ":"))  # noqa: E731
    phan = [f'"_nguon":{dong(nguon)}', f'"adapter_mapping":{dong(ban_do)}']
    for k in ("cases", "bazhai", "thieuSao"):
        phan.append(f'"{k}":[\n' + ",\n".join(dong(x) for x in kq[k]) + "\n]")
    RA.write_text("{" + ",\n".join(phan) + "}\n", encoding="utf-8")
    print(f"{RA}: {len(kq['cases'])} lá, {len(kq['bazhai'])} ca bát trạch")


if __name__ == "__main__":
    main()
