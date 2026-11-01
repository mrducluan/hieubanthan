# -*- coding: utf-8 -*-
"""EN-3 — chấm hỏi đáp 5 mảng trên holdout_v2 (261 câu viết độc lập, ĐÓNG BĂNG — không viết luật nhìn theo nó).

Thước đo (docs/KE-HOACH-NANG-CAP-ENGINE.md, EN-3): định tuyến đúng (xử lý + nhãn + mục), trả lời thẳng (mẫu tiêu điểm
`holdout_v2_tieu_diem.json` có ở đoạn 1–2 = 1; đoạn 3–5 = 0,5; câu có năm/tháng mà lời không nêu đúng thời gian ≤ 0,5),
cá nhân hoá, đúng thời gian, an toàn nhạy cảm, chặn nhầm, số từ.

    cd engine && .venv/bin/python scripts/cham_holdout_v2.py [--chi-tiet] [--json out.json]
"""
from __future__ import annotations

import argparse
import collections
import datetime as dt
import json
import re
import sys
import traceback
from pathlib import Path

GOC = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(GOC))

from app.hoidap import battu, kinhdich, phongthuy, tuvi  # noqa: E402
from app.narrative import hoi_van  # noqa: E402

FX = GOC / "fixtures" / "cau_hoi"
XEM = dt.date(2026, 11, 1)
NGUOI = {"ho_ten": ["Nguyễn Thị Mai Anh"], "ngay": 17, "thang": 5, "nam": 1990, "quy_uoc": "tung_phan"}
SV = {"ngay": dt.date(1990, 5, 17), "ti": 6, "gioi_tinh": "nu"}
SB = {"lich": dt.datetime(1990, 5, 17, 12, 0), "gioi_tinh": "nu", "gio_ty": "da_ty"}
SP = {"nam": 1990, "gioi_tinh": "nu", "ngay": dt.date(1990, 5, 17), "moc_nam": "lap_xuan"}
TL = {"tra_loi", "tra_loi_kem_luu_y"}
CANCHI = {2026: "Bính Ngọ", 2027: "Đinh Mùi", 2028: "Mậu Thân", 2029: "Kỷ Dậu"}
MAC_DINH = {"thanso": {"ban_than"}, "tuvi": set(), "battu": {"tinh_cach"}, "phongthuy": {"ky_thuat"}, "kinhdich": set()}
PERS = {"thanso": {"linh_vuc", "chan_dung", "nam_ca_nhan", "dinh_cao", "thang_ca_nhan", "bai_hoc_nghiep", "truong_thanh",
                   "mui_ten", "o_so", "no_nghiep", "ngay_ca_nhan", "thai_do", "trong_vai"},
        "tuvi": {"cung", "doi_song", "han", "cung_trong_han", "phi_hoa_y_dinh", "luu_nien_phi_hoa", "luu_nguyet", "chinh_tinh",
                 "than_cu", "cac_dai_han", "cach_cuc", "vi_tri_sao", "sat_chieu", "phi_hoa_tong", "phi_hoa_noi_bat",
                 "nhip_3_thang", "phu_tinh_cung", "tuoi"},
        "battu": {"tu_tru", "doi_song", "dai_van", "luu_nien", "khoi_van", "cac_dai_van"},
        "phongthuy": {"menh_quai", "tuoi_lam_nha", "sao_han", "nha_rieng"}, "kinhdich": {"que"}}
BO = (r"^Tứ trụ \(năm", r"^Tuổi mụ tại thời điểm xem", r"^Đây là góc nhìn tham khảo", r"^Câu hỏi để tự soi")
MANG = ["thanso", "tuvi", "battu", "phongthuy", "kinhdich"]


def chay(r: dict) -> dict:
    c, md = r["cau_hoi"], r["mo_dun"]
    if md == "thanso":
        return hoi_van.tra_loi(c, NGUOI, None, XEM, dung_llm=False)
    if md == "tuvi":
        return tuvi.tra_loi(c, "tham_khao", sinh=SV, ngay_xem=XEM)
    if md == "battu":
        return battu.tra_loi(c, sinh=SB, ngay_xem=XEM)
    if md == "phongthuy":
        return phongthuy.tra_loi(c, sinh=SP, ngay_xem=XEM)
    return kinhdich.tra_loi(c, "tu_dong", gia_tri_hao=[7, 8, 9, 7, 6, 8], thoi_diem=dt.datetime(2026, 11, 1, 9, 0),
                            cach_ra_que="gieo_tay")


def cham(r: dict, k: dict, tieu_diem: dict) -> dict:
    md = r["mo_dun"]
    pl = k.get("phan_loai") or {}
    xl = pl.get("xu_ly")
    lab = pl.get("linh_vuc") if md == "thanso" else pl.get("loai")
    if md == "tuvi":
        sub = pl.get("cung") or []
    elif md in ("battu", "kinhdich"):
        key = "chu_de" if md == "battu" else "linh_vuc"
        sub = [pl[key]] if pl.get(key) else []
    else:
        sub = []
    ans = k.get("cau_tra_loi") or ""
    if xl not in r["xu_ly"]:
        dt_ = "sai_xu_ly"
    elif xl in TL and r["nhan"]:
        ok_lab = lab in r["nhan"]
        ok_sub = (not r["muc"]) or bool(set(sub) & set(r["muc"]))
        if ok_lab and ok_sub:
            dt_ = "dung"
        elif ok_lab:
            dt_ = "dung_loai_sai_muc" if sub else "dung_loai_khong_ra_muc"
        else:
            dt_ = "khong_nhan_ra" if (lab in MAC_DINH[md] or (md == "tuvi" and lab == "la_so" and sub == ["Mệnh"])) \
                else "sai_loai"
    else:
        dt_ = "dung"
    muc = [m.get("loai") for m in (k.get("bang_chung") or {}).get("muc", [])]
    pers = bool(set(muc) & PERS[md]) if r["ca_nhan"] else None
    tg = None
    if r["nam"] and xl in r["xu_ly"] and xl in TL:
        y = r["nam"]
        tg = (str(y) in ans) or (CANCHI.get(y, "#") in ans)
        if r["thang"]:
            tg = tg and bool(re.search(rf"[Tt]háng {r['thang']}(?!\d)|tháng (Giêng|{r['thang']}) âm", ans))
    if r["nhay_cam"]:
        tt, vt = (1.0 if dt_ == "dung" else 0.0), None
    else:
        ps = [p for p in ans.split("\n\n") if p.strip() and not any(re.match(b, p) for b in BO)]
        pat = tieu_diem.get(r["id"])
        vt = next((i for i, p in enumerate(ps) if re.search(pat, p)), None) if pat else None
        tt = 1.0 if vt is not None and vt <= 1 else 0.5 if vt is not None and vt <= 4 else 0.0
        if tg is False:
            tt = min(tt, 0.5)
    return {"id": r["id"], "md": md, "q": r["cau_hoi"], "giong": r["giong"], "nc": r["nhay_cam"], "xl": xl, "lab": lab,
            "sub": sub, "nhan": r["nhan"], "muc_exp": r["muc"], "dt": dt_, "pers": pers, "tg": tg, "tt": tt, "vt": vt,
            "nw": len(ans.split()), "nw_dau": len(ans.split("\n\n")[0].split()) if ans else 0}


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--chi-tiet", action="store_true")
    ap.add_argument("--json")
    ap.add_argument("--bo", default="holdout_v2", help="holdout_v2 (đóng băng, đo) | dev_en3 (bộ phát triển, viết luật)")
    a = ap.parse_args()
    f_td = FX / f"{a.bo}_tieu_diem.json"
    td = json.loads(f_td.read_text("utf-8"))["mau"] if f_td.exists() else {}
    if not td:
        print("(bộ này không có mẫu tiêu điểm → cột 'Trả lời thẳng' không có nghĩa)")
    rows, loi = [], []
    for line in (FX / f"{a.bo}.jsonl").read_text("utf-8").splitlines():
        r = json.loads(line)
        try:
            k = chay(r)
        except Exception:  # noqa: BLE001
            loi.append((r["id"], traceback.format_exc()[-300:]))
            k = {}
        rows.append(cham(r, k, td))
    tong = collections.Counter()
    print("| Mảng | n | Định tuyến | Trả lời thẳng | Cá nhân hoá | Thời gian | An toàn | Chặn nhầm | Từ đoạn 1 (TV) |")
    print("|---|---|---|---|---|---|---|---|---|")
    for md in MANG:
        v = [x for x in rows if x["md"] == md]
        th = [x for x in v if not x["nc"]]
        dung = sum(x["dt"] == "dung" for x in v)
        tt = sum(x["tt"] for x in th)
        pc = [x["pers"] for x in th if x["pers"] is not None]
        tg = [x["tg"] for x in v if x["tg"] is not None]
        sens = [x for x in v if x["nc"]]
        fp = [x for x in th if x["xl"] not in TL]
        nw = sorted(x["nw_dau"] for x in th)[len(th) // 2]
        print(f"| {md} | {len(v)} | {dung}/{len(v)} ({100 * dung / len(v):.0f}%) | {100 * tt / len(th):.0f}% | "
              f"{sum(pc)}/{len(pc)} | {sum(tg)}/{len(tg)} | {sum(x['dt'] == 'dung' for x in sens)}/{len(sens)} | "
              f"{len(fp)} | {nw} |")
        for k_, val in (("n", len(v)), ("dung", dung), ("tt", tt), ("th", len(th)), ("pc", sum(pc)), ("pcn", len(pc)),
                        ("tg", sum(tg)), ("tgn", len(tg)), ("s", sum(x["dt"] == "dung" for x in sens)),
                        ("sn", len(sens)), ("fp", len(fp))):
            tong[k_] += val
    print(f"| **Tổng** | {tong['n']} | {tong['dung']}/{tong['n']} ({100 * tong['dung'] / tong['n']:.0f}%) | "
          f"{100 * tong['tt'] / tong['th']:.0f}% | {tong['pc']}/{tong['pcn']} | {tong['tg']}/{tong['tgn']} | "
          f"{tong['s']}/{tong['sn']} | {tong['fp']} | |")
    g = collections.defaultdict(lambda: [0, 0])
    for x in rows:
        for gg in x["giong"].split("|"):
            g[gg][0] += x["dt"] == "dung"
            g[gg][1] += 1
    print("Theo giọng:", {k_: f"{a_}/{b_}" for k_, (a_, b_) in sorted(g.items())})
    if loi:
        print("LỖI:", loi)
    if a.chi_tiet:
        for x in rows:
            if x["dt"] != "dung" or x["tt"] < 1:
                print(f"  {x['id']} {x['dt']:<22} tt={x['tt']} lab={x['lab']} sub={x['sub']} nhan={x['nhan']} "
                      f"muc={x['muc_exp']} tg={x['tg']} | {x['q']}")
    if a.json:
        Path(a.json).write_text(json.dumps(rows, ensure_ascii=False, indent=1), "utf-8")


if __name__ == "__main__":
    main()
