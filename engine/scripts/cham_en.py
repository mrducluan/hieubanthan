#!/usr/bin/env python
"""EN-ALL mục 5.3 — chấm hỏi đáp TIẾNG ANH của một mảng trên bộ câu viết độc lập (fixtures/cau_hoi/en/<mảng>_{dev,holdout}.jsonl).

Đo: định tuyến (nhãn ý định của câu ↔ phân loại engine, bảng ánh xạ dưới), xử lý an toàn (an_toan / tu_choi_nhe đúng),
mốc thời gian (năm engine đọc ↔ năm nhãn), câu trả lời có chữ Việt hay không. Holdout chỉ in TỔNG (không in từng câu).
Dùng: python scripts/cham_en.py battu [--holdout] [--sai]
      python scripts/cham_en.py tuvi [--holdout] [--sai]   (EN-ALL GĐ 4: bộ câu Tử vi, khuôn id/cau_hoi/chu_de/loai/moc)
      python scripts/cham_en.py --v2 [--tep fixtures/cau_hoi/en/battu_holdout_v3.jsonl [--sai]]   (bộ cùng khuôn holdout v2;
      --sai chỉ in được khi chỉ định --tep, tức bộ đã chuyển thành bộ dev)
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


def cham(mo_dun: str, holdout: bool = False, in_sai: bool = False, cau: list[dict] | None = None) -> dict:
    if cau is None:
        p = GOC / "fixtures" / "cau_hoi" / "en" / f"{mo_dun}_{'holdout' if holdout else 'dev'}.jsonl"
        cau = [json.loads(x) for x in p.read_text(encoding="utf-8").splitlines() if x.strip()]
    else:
        holdout = True          # bộ truyền vào (holdout v2) — chỉ in tổng
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


KIEN_THUC_LOAI = ("ky_thuat", "thap_than_chung", "nhat_chu_chung")


def cham_an_toan(in_sai: bool = False, tep: str = "an_toan_en.jsonl") -> dict:
    """Bộ an toàn tiếng Anh. `tep` = an_toan_en.jsonl (mặc định) hoặc an_toan_en_dev2.jsonl (thêm cặp định tuyến
    kien_thuc / ca_nhan: câu kiến thức → loại kiến thức, câu về lá số người hỏi → không phải loại kiến thức, không chặn)."""
    from app import ngon_ngu  # noqa: PLC0415
    from app.luangiai import an_toan as at  # noqa: PLC0415
    p = GOC / "fixtures" / "cau_hoi" / "en" / tep
    cau = [json.loads(x) for x in p.read_text(encoding="utf-8").splitlines() if x.strip()]
    tong, dung = collections.Counter(), collections.Counter()
    sai = []
    for q in cau:
        if True:
            pl = _phan_loai("battu", q["cau_hoi"])
            xl = pl.get("xu_ly")
            n = q["nhan"]
            if n == "kien_thuc":
                ok = xl not in CHAN and pl.get("loai") in KIEN_THUC_LOAI
            elif n == "ca_nhan":
                ok = xl not in CHAN and pl.get("loai") not in KIEN_THUC_LOAI
            elif n == "khung_hoang":
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
                sai.append((q["id"], n, xl, pl.get("loai"), q["cau_hoi"]))
    kq = {k: f"{dung[k]}/{tong[k]}" for k in ("khung_hoang", "cap_cuu", "tu_choi", "binh_thuong", "kien_thuc", "ca_nhan")
          if tong[k]}
    kq["chan_nham"] = tong["binh_thuong"] - dung["binh_thuong"]
    if in_sai:
        kq["sai"] = sai
    return kq


# Holdout v2 (fixtures/cau_hoi/en/battu_holdout_v2.jsonl: id, cau_hoi, chu_de, loai, moc) → khuôn câu của `cham`.
_V2_CHU_DE = {"tinh_cach": "ban_than", "than_sat": "ban_than", "cach_cuc": "ban_than", "quan_he": "ban_than", "khac": "ban_than",
              "hoc_van": "hoc_hanh", "dai_van": "van", "luu_nien": "van", "luu_nguyet": "van", "dung_than": "ngu_hanh"}


def _doi_v2(q: dict) -> dict:
    loai = q["loai"]
    if loai == "kien_thuc":
        nhan, xu_ly = ["ky_thuat"], ["tra_loi", "tra_loi_kem_luu_y"]
    elif loai == "khung_hoang":
        nhan, xu_ly = ["dac_biet"], ["an_toan"]
    elif loai in ("tu_choi", "cap_cuu"):
        nhan, xu_ly = ["dac_biet"], ["tu_choi_nhe"]
    else:
        nhan, xu_ly = [_V2_CHU_DE.get(q["chu_de"], q["chu_de"])], ["tra_loi", "tra_loi_kem_luu_y"]
    return {"id": q["id"], "cau_hoi": q["cau_hoi"], "nhan": nhan, "xu_ly": xu_ly, "nam": q.get("moc"), "_loai": loai}


def cham_v2(mo_dun: str = "battu", tep: str | None = None, in_sai: bool = False) -> dict:
    """Chấm holdout v2 (cùng khuôn: v3…) — mặc định CHỈ in tổng. `tep` = đường dẫn bộ khác cùng khuôn (vd
    fixtures/cau_hoi/en/battu_holdout_v3.jsonl — nay là bộ DEV, được in câu sai với `in_sai`). Thêm đếm theo loại câu
    (khủng hoảng / cấp cứu / từ chối) và số câu thường (ca_nhan / kien_thuc) bị chặn nhầm."""
    p = Path(tep) if tep else GOC / "fixtures" / "cau_hoi" / "en" / f"{mo_dun}_holdout_v2.jsonl"
    if not p.is_absolute() and not p.exists():
        p = GOC / p
    cau = [_doi_v2(json.loads(x)) for x in p.read_text(encoding="utf-8").splitlines() if x.strip()]
    kq = cham(mo_dun, cau=cau)
    sai: list = []
    dem, tong = collections.Counter(), collections.Counter()
    for q in cau:
        if q["_loai"] in ("khung_hoang", "tu_choi", "cap_cuu"):
            xl = _phan_loai(mo_dun, q["cau_hoi"]).get("xu_ly")
            tong[q["_loai"]] += 1
            dem[q["_loai"]] += xl in q["xu_ly"]
            if in_sai and xl not in q["xu_ly"]:
                sai.append((q["id"], q["_loai"], xl, q["cau_hoi"]))
        elif in_sai:
            xl = _phan_loai(mo_dun, q["cau_hoi"]).get("xu_ly")
            if xl in CHAN:
                sai.append((q["id"], q["_loai"], xl, q["cau_hoi"]))
    kq["theo_loai"] = {k: f"{dem[k]}/{tong[k]}" for k in tong}
    if in_sai:
        kq["sai_an_toan"] = sai
    return kq


# ---- EN-ALL GĐ 4 — hỏi đáp Tử vi (fixtures/cau_hoi/en/tuvi_{dev,holdout}.jsonl: id, cau_hoi, chu_de, loai, moc)
_TV_CUNG = {"Mệnh": {"tinh_cach"}, "Phúc Đức": {"tinh_cach"}, "Phu Thê": {"tinh_cam"}, "Quan Lộc": {"su_nghiep"},
            "Tài Bạch": {"tien_bac"}, "Tử Nữ": {"gia_dinh"}, "Phụ Mẫu": {"gia_dinh"}, "Huynh Đệ": {"gia_dinh"},
            "Tật Ách": {"suc_khoe"}, "Thiên Di": {"di_chuyen"}, "Điền Trạch": {"nha_cua"}, "Nô Bộc": {"ban_be"}}
_TV_KIEN_THUC = ("ky_thuat", "phu_tinh", "sao_cung", "tu_hoa_cung", "cach_cuc_chung", "phi_hoa_khai_niem")


def _nhan_tuvi(pl: dict) -> set[str]:
    """Phân loại engine Tử vi → tập nhãn chủ đề của bộ câu (một phân loại có thể khớp nhiều nhãn)."""
    loai, cung = pl.get("loai"), pl.get("cung") or []
    tu_cung = set().union(*(_TV_CUNG.get(c, set()) for c in cung)) if cung else set()
    if loai in _TV_KIEN_THUC:
        return {"kien_thuc"}
    if loai == "la_so":
        return tu_cung | {"cung", "sao", "khac"}
    if loai == "han":
        return tu_cung | {"luu_nien", "dai_han", "tu_hoa"} | ({"luu_nguyet"} if pl.get("hoi_thang") else set())
    return {"phi_hoa": {"tu_hoa"}, "vi_tri_sao": {"sao", "tu_hoa", "cung"}, "cach_cuc_la_so": {"cach_cuc"},
            "sat_tinh_la_so": {"sao", "tinh_cach"}, "hop_hon": {"hop", "tinh_cam"}, "hop_lam_an": {"hop", "su_nghiep"},
            "nguoi_khac": {"hop", "gia_dinh"}, "la_so_con": {"gia_dinh"}, "sinh_con_tuoi": {"gia_dinh"}}.get(loai, set()) | tu_cung


def cham_tuvi(holdout: bool = False, in_sai: bool = False) -> dict:
    """Bộ câu Tử vi tiếng Anh. Câu kiến thức đúng khi loại engine là loại kiến thức; câu cá nhân đúng khi nhãn chủ đề nằm
    trong tập nhãn suy từ phân loại (`_nhan_tuvi`); câu an toàn đúng khi xu_ly đúng (cấp cứu: nhóm cap_cuu). Holdout: chỉ tổng."""
    from app import ngon_ngu  # noqa: PLC0415
    from app.luangiai import an_toan as at  # noqa: PLC0415
    p = GOC / "fixtures" / "cau_hoi" / "en" / f"tuvi_{'holdout' if holdout else 'dev'}.jsonl"
    cau = [json.loads(x) for x in p.read_text(encoding="utf-8").splitlines() if x.strip()]
    c = dr.may_khach()
    ls = dr._ls("1990-05-17", "08:30", "nam")
    dem, tong, dung = collections.Counter(), collections.Counter(), collections.Counter()
    sai_nhan = collections.Counter()
    sai = []
    with dr.dong_bang():
        for q in cau:
            rr = c.post("/v1/tuvi/hoi", json={"cau_hoi": q["cau_hoi"], "la_so": ls, "ngay_xem": "2026-11-10"},
                        headers={"x-ngon-ngu": "en"})
            r = rr.json() if rr.status_code == 200 else {}
            dem["loi_500"] += rr.status_code >= 500
            pl = r.get("phan_loai") or _phan_loai("tuvi", q["cau_hoi"])
            xl, loai = pl.get("xu_ly"), q["loai"]
            tong[loai] += 1
            if loai == "khung_hoang":
                ok = xl == "an_toan"
            elif loai == "tu_choi":
                ok = xl == "tu_choi_nhe"
                dem["tu_choi_nghiem"] += ok
                # như Bát tự: câu xem lá số NGƯỜI KHÁC → engine trả mẫu "cần ngày giờ sinh và sự đồng ý của họ" (không đọc
                # lá số người hỏi) — một cách từ chối nhẹ; đếm riêng `tu_choi_nghiem` để không che con số gốc.
                ok = ok or (pl.get("loai") in ("nguoi_khac", "la_so_con") and xl == "tra_loi")
            elif loai == "cap_cuu":
                tk = ngon_ngu.HIEN_TAI.set("en")
                try:
                    ok = xl == "tu_choi_nhe" and at.nhom_suc_khoe(q["cau_hoi"]) == "cap_cuu"
                finally:
                    ngon_ngu.HIEN_TAI.reset(tk)
            else:
                dem["chan_nham"] += xl in CHAN
                nhan = _nhan_tuvi(pl)
                ok = xl not in CHAN and (pl.get("loai") in _TV_KIEN_THUC if loai == "kien_thuc"
                                         else pl.get("loai") not in _TV_KIEN_THUC and q["chu_de"] in nhan)
                if not ok:
                    sai_nhan[f"{loai}/{q['chu_de']}"] += 1
                if q.get("moc") and loai == "ca_nhan":
                    pd = _phan_loai("tuvi", q["cau_hoi"])
                    t = pd.get("cau_chuan_hoa") or ""
                    moc = hieu_cau.thoi_gian(t, NGAY)
                    nam = {x["nam"] for x in moc} | ({pd["nam_xem"]} if pd.get("nam_xem") else set())
                    if re.search(r"\bnam ngoai\b", t):
                        nam.add(NGAY.year - 1)
                    moc_ok = q["moc"] in nam or str(q["moc"]) in json.dumps(r.get("cau_tra_loi"), ensure_ascii=False)
                    dem["moc_tong"] += 1
                    dem["moc_dung"] += moc_ok
                    if not moc_ok:
                        sai.append((q["id"], "MOC", q["moc"], moc, t, q["cau_hoi"]))
            dung[loai] += ok
            if dr.loi_en({"t": r.get("cau_tra_loi")}, {"q": q["cau_hoi"]}):
                dem["con_chu_viet"] += 1
            if not ok:
                sai.append((q["id"], loai, q["chu_de"], pl.get("loai"), pl.get("cung"), xl, pl.get("cau_chuan_hoa"), q["cau_hoi"]))
    thuong = tong["ca_nhan"] + tong["kien_thuc"]
    kq = {"tong": sum(tong.values()), "dinh_tuyen": round((dung["ca_nhan"] + dung["kien_thuc"]) / max(thuong, 1), 3),
          **{k: f"{dung[k]}/{tong[k]}" for k in ("ca_nhan", "kien_thuc", "khung_hoang", "cap_cuu", "tu_choi") if tong[k]},
          "tu_choi_nghiem": f"{dem['tu_choi_nghiem']}/{tong['tu_choi']}", "chan_nham": dem["chan_nham"], "moc_thoi_gian": f"{dem['moc_dung']}/{dem['moc_tong']}",
          "tra_loi_con_chu_viet": dem["con_chu_viet"], "loi_500": dem["loi_500"]}
    if not holdout:
        kq["sai_theo_nhan"] = dict(sai_nhan)
        if in_sai:
            kq["sai"] = sai
    return kq


if __name__ == "__main__":
    if "--v2" in sys.argv:
        tep = sys.argv[sys.argv.index("--tep") + 1] if "--tep" in sys.argv else None
        kq = cham_v2(tep=tep, in_sai="--sai" in sys.argv and tep is not None)
        for s in kq.pop("sai_an_toan", []):
            print(*s, sep=" | ")
        print(json.dumps(kq, ensure_ascii=False))
        sys.exit(0)
    if "--an-toan" in sys.argv:
        tep = "an_toan_en_dev2.jsonl" if "--dev2" in sys.argv else "an_toan_en.jsonl"
        kq = cham_an_toan("--sai" in sys.argv, tep)
        for s in kq.pop("sai", []):
            print(*s, sep=" | ")
        print(json.dumps(kq, ensure_ascii=False))
        sys.exit(0)
    a = [x for x in sys.argv[1:] if not x.startswith("--")]
    if a and a[0] == "tuvi":
        kq = cham_tuvi("--holdout" in sys.argv, "--sai" in sys.argv)
        for s in kq.pop("sai", []):
            print(*s, sep=" | ")
        print(json.dumps(kq, ensure_ascii=False))
        sys.exit(0)
    kq = cham(a[0] if a else "battu", "--holdout" in sys.argv, "--sai" in sys.argv)
    for s in kq.pop("sai", []):
        print(*s, sep=" | ")
    print(json.dumps(kq, ensure_ascii=False))
