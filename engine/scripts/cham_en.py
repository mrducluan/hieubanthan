#!/usr/bin/env python
"""EN-ALL mục 5.3 — chấm hỏi đáp TIẾNG ANH của một mảng trên bộ câu viết độc lập (fixtures/cau_hoi/en/<mảng>_{dev,holdout}.jsonl).

Đo: định tuyến (nhãn ý định của câu ↔ phân loại engine, bảng ánh xạ dưới), xử lý an toàn (an_toan / tu_choi_nhe đúng),
mốc thời gian (năm engine đọc ↔ năm nhãn), câu trả lời có chữ Việt hay không. Holdout chỉ in TỔNG (không in từng câu).
Dùng: python scripts/cham_en.py battu [--holdout] [--sai]
      python scripts/cham_en.py --an-toan [--sai]   (bộ an toàn tiếng Anh fixtures/cau_hoi/en/an_toan_en.jsonl, qua
      bộ phân loại hỏi đáp Bát tự ở ngữ cảnh tiếng Anh — khủng hoảng → an_toan, từ chối / cấp cứu → tu_choi_nhe (cấp cứu: nhóm cap_cuu),
      câu thường → không bị chặn)
"""
from __future__ import annotations

import collections
import json
import re
import sys
from pathlib import Path

GOC = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(GOC))

import datetime  # noqa: E402

from app.hoidap import hieu_cau  # noqa: E402
from tests import _dau_ra as dr  # noqa: E402

NGAY = datetime.date(2026, 11, 10)     # ngày xem cố định của bộ chấm (khớp đồng hồ đóng băng của tests/_dau_ra)

# chủ đề / loại engine Bát tự → nhãn ý định của bộ câu (một chủ đề engine có thể khớp nhiều nhãn)
ANH_XA = {
    "battu": {
        "loai": {"ky_thuat": {"ky_thuat"}, "thap_than_chung": {"ky_thuat"}, "nhat_chu_chung": {"ky_thuat"},
                 "hop": {"nguoi_khac", "tinh_cam"}, "nguoi_khac": {"nguoi_khac"}, "con": {"nguoi_khac", "gia_dinh"},
                 "sinh_con_tuoi": {"gia_dinh"}, "van": {"van"}},
        "chu_de": {"nghe_tien": {"su_nghiep", "tien_bac"}, "hon_nhan": {"tinh_cam"}, "con_cai": {"gia_dinh"},
                   "gia_dinh": {"gia_dinh"}, "ngu_hanh": {"ngu_hanh"}, "loi_song": {"suc_khoe", "ngu_hanh"},
                   "hoc_hanh": {"hoc_hanh"}, "tinh_cach": {"ban_than"}, "thap_than": {"ban_than"}, "cach_cuc": {"ban_than"},
                   "tru": {"ban_than"}, "cung_than": {"ban_than"}, "than_sat": {"ban_than"}, "than_sat_tk": {"ban_than"},
                   "hau_van": {"van"}, "quan_he": {"tinh_cam", "gia_dinh", "su_nghiep"}, "phap_ly": {"tien_bac", "su_nghiep"},
                   "di_xa": {"van", "su_nghiep"}, "an_toan": {"suc_khoe"}, "xung_hop": {"ban_than", "nguoi_khac"},
                   "suc_khoe": {"suc_khoe"}},
    },
}
ROUTE = {"battu": "/v1/battu/hoi"}


def _phan_loai(mo_dun: str, cau: str) -> dict:
    """Phân loại trực tiếp (ngữ cảnh tiếng Anh) — dùng khi route lỗi, và cho bộ an toàn (không phụ thuộc lớp lời đáp)."""
    import importlib  # noqa: PLC0415
    from app import ngon_ngu  # noqa: PLC0415
    tk = ngon_ngu.HIEN_TAI.set("en")
    try:
        return importlib.import_module(f"app.hoidap.{mo_dun}").phan_loai(cau)
    finally:
        ngon_ngu.HIEN_TAI.reset(tk)


def cham(mo_dun: str, holdout: bool = False, in_sai: bool = False) -> dict:
    p = GOC / "fixtures" / "cau_hoi" / "en" / f"{mo_dun}_{'holdout' if holdout else 'dev'}.jsonl"
    cau = [json.loads(x) for x in p.read_text(encoding="utf-8").splitlines() if x.strip()]
    c = dr.may_khach()
    ls = dr._ls("1990-05-17", "08:30", "nam")
    ax = ANH_XA[mo_dun]
    dem = collections.Counter()
    loi_at, loi_dt = collections.Counter(), collections.Counter()
    sai = []
    with dr.dong_bang():
        for q in cau:
            rr = c.post(ROUTE[mo_dun], json={"cau_hoi": q["cau_hoi"], "la_so": ls, "ngay_xem": "2026-11-10"},
                        headers={"x-ngon-ngu": "en"})
            r = rr.json() if rr.status_code == 200 else {}
            dem["loi_500"] += rr.status_code >= 500
            pl = r.get("phan_loai") or _phan_loai(mo_dun, q["cau_hoi"])
            dem["tong"] += 1
            xu_ly_dung = pl.get("xu_ly") in q["xu_ly"] or (pl.get("xu_ly") == "tra_loi_kem_luu_y" and "tra_loi" in q["xu_ly"])
            # câu về NGƯỜI KHÁC / về con: engine trả mẫu "cần ngày giờ sinh và sự đồng ý của họ" (không đọc lá số người hỏi)
            # — một cách từ chối nhẹ; đếm riêng (an_toan_nghiem = chỉ tính đúng xu_ly) để không che con số gốc.
            mem = "tu_choi_nhe" in q["xu_ly"] and pl.get("loai") in ("nguoi_khac", "con") and pl.get("xu_ly") == "tra_loi"
            if q["nhan"][0] == "dac_biet" or set(q["xu_ly"]) & {"an_toan", "tu_choi_nhe"}:
                dem["an_toan_nghiem"] += xu_ly_dung
            xu_ly_dung = xu_ly_dung or mem
            if q["nhan"][0] == "dac_biet" or set(q["xu_ly"]) & {"an_toan", "tu_choi_nhe"}:
                dem["an_toan_tong"] += 1
                dem["an_toan_dung"] += xu_ly_dung
                ok = xu_ly_dung
                if not ok:      # tổng theo cặp (mong đợi → engine) — in được cả với holdout (không lộ câu)
                    loi_at[f"{'/'.join(q['xu_ly'])}→{pl.get('xu_ly')} ({pl.get('loai')}/{pl.get('chu_de')})"] += 1
            else:
                nhan = (ax["loai"].get(pl.get("loai")) or set()) | (ax["chu_de"].get(pl.get("chu_de")) or set())
                ok = bool(nhan & set(q["nhan"]))
                dem["chan_nham"] += pl.get("xu_ly") in ("an_toan", "tu_choi_nhe")
                if not ok:
                    loi_dt[f"{q['nhan'][0]}→{pl.get('loai')}/{pl.get('chu_de')}"] += 1
            dem["dinh_tuyen"] += ok
            if q.get("nam") and not (q["nhan"][0] == "dac_biet" or set(q["xu_ly"]) & {"an_toan", "tu_choi_nhe"}):
                # mốc thời gian = mốc engine sẽ dùng: hiểu câu (`hieu_cau.thoi_gian`) trên cụm đã hiểu + năm nêu rõ;
                # câu khủng hoảng / từ chối không đọc mốc (không tính). "last year" → năm ngoái (mốc đã qua, engine không đọc).
                pd = _phan_loai(mo_dun, q["cau_hoi"])
                t = pd.get("cau_chuan_hoa") or ""
                moc = hieu_cau.thoi_gian(t, NGAY)
                nam = {x["nam"] for x in moc} | ({pd["nam_xem"]} if pd.get("nam_xem") else set())
                if re.search(r"\bnam ngoai\b", t):
                    nam.add(NGAY.year - 1)
                moc_ok = q["nam"] in nam and (not q.get("thang") or any(x.get("thang") == q["thang"] and x["nam"] == q["nam"] for x in moc))
                moc_ok = moc_ok or (not q.get("thang") and str(q["nam"]) in json.dumps(r.get("cau_tra_loi"), ensure_ascii=False))
                dem["moc_tong"] += 1
                dem["moc_dung"] += moc_ok
                if not moc_ok:
                    sai.append((q["id"], "MOC", q["nam"], q.get("thang"), moc, t, q["cau_hoi"]))
            if dr.loi_en({"t": r.get("cau_tra_loi")}, {"q": q["cau_hoi"]}):
                dem["con_chu_viet"] += 1
            if not ok:
                sai.append((q["id"], q["nhan"], pl.get("loai"), pl.get("chu_de"), pl.get("xu_ly"), q["cau_hoi"]))
    kq = {"tong": dem["tong"], "dinh_tuyen": round(dem["dinh_tuyen"] / dem["tong"], 3),
          "an_toan": f"{dem['an_toan_dung']}/{dem['an_toan_tong']}",
          "an_toan_nghiem": f"{dem['an_toan_nghiem']}/{dem['an_toan_tong']}", "chan_nham": dem["chan_nham"],
          "moc_thoi_gian": f"{dem['moc_dung']}/{dem['moc_tong']}", "tra_loi_con_chu_viet": dem["con_chu_viet"],
          "loi_500": dem["loi_500"], "an_toan_sai_theo_loai": dict(loi_at), "dinh_tuyen_sai_theo_nhan": dict(loi_dt)}
    if in_sai and not holdout:
        kq["sai"] = sai
    return kq


CHAN = ("an_toan", "tu_choi_nhe", "dan_huong")


def cham_an_toan(in_sai: bool = False) -> dict:
    from app import ngon_ngu  # noqa: PLC0415
    from app.luangiai import an_toan as at  # noqa: PLC0415
    p = GOC / "fixtures" / "cau_hoi" / "en" / "an_toan_en.jsonl"
    cau = [json.loads(x) for x in p.read_text(encoding="utf-8").splitlines() if x.strip()]
    tong, dung = collections.Counter(), collections.Counter()
    sai = []
    for q in cau:
        if True:
            xl = _phan_loai("battu", q["cau_hoi"]).get("xu_ly")
            n = q["nhan"]
            if n == "khung_hoang":
                ok = xl == "an_toan"
            elif n == "tu_choi":
                ok = xl == "tu_choi_nhe"
            elif n == "cap_cuu":
                tk = ngon_ngu.HIEN_TAI.set("en")
                try:
                    ok = xl == "tu_choi_nhe" and at.nhom_suc_khoe(q["cau_hoi"]) == "cap_cuu"
                finally:
                    ngon_ngu.HIEN_TAI.reset(tk)
            else:
                ok = xl not in CHAN
            tong[n] += 1
            dung[n] += ok
            if not ok:
                sai.append((q["id"], n, xl, q["cau_hoi"]))
    kq = {k: f"{dung[k]}/{tong[k]}" for k in ("khung_hoang", "cap_cuu", "tu_choi", "binh_thuong")}
    kq["chan_nham"] = tong["binh_thuong"] - dung["binh_thuong"]
    if in_sai:
        kq["sai"] = sai
    return kq


if __name__ == "__main__":
    if "--an-toan" in sys.argv:
        kq = cham_an_toan("--sai" in sys.argv)
        for s in kq.pop("sai", []):
            print(*s, sep=" | ")
        print(json.dumps(kq, ensure_ascii=False))
        sys.exit(0)
    a = [x for x in sys.argv[1:] if not x.startswith("--")]
    kq = cham(a[0] if a else "battu", "--holdout" in sys.argv, "--sai" in sys.argv)
    for s in kq.pop("sai", []):
        print(*s, sep=" | ")
    print(json.dumps(kq, ensure_ascii=False))
