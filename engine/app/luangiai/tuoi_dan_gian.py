# -*- coding: utf-8 -*-
"""TDG-1 — ghép lời cho: xem tuổi làm nhà / cưới (Kim lâu, Hoang ốc, Tam tai), hướng xấu theo năm, tuổi xông đất.
Phép tính ở `calc/tuoi_dan_gian`; tên + nghĩa ở KB `tuoi_dan_gian_kb.json` (nháp AI). Không LLM, không dự báo sự
kiện; lời lẽ "dân gian thường tránh…", không doạ, không vật phẩm."""
from __future__ import annotations

import datetime as dt
import json
from pathlib import Path

from app.calc import lunar, tuoi_dan_gian as t
from app.config import CALENDAR_MERIDIAN_TZ
from app.luangiai import hoang_lich as hl

KB = json.loads((Path(__file__).parents[1] / "kb" / "data" / "tuoi_dan_gian_kb.json").read_text(encoding="utf-8"))
_HK = json.loads((Path(__file__).parents[1] / "kb" / "data" / "phongthuy_huyen_khong.json").read_text(encoding="utf-8"))
LUU_Y = ("Đây là tập quán dân gian để tham khảo khi lên kế hoạch, không phải lời tiên đoán. Quyết định làm nhà, cưới "
         "hỏi nên dựa trên điều kiện thực tế của gia đình.")


def _meta() -> dict:
    return {"nguon": KB["source"]["ten"], "source_id": KB["source_id"], "school_id": KB["school_id"],
            "trang_thai": KB["trang_thai"], "luu_y": LUU_Y}


def nam_am_sinh(nam: int, thang: int | None = None, ngay: int | None = None) -> int:
    """Năm âm lịch Việt của ngày sinh (đủ ngày/tháng); chỉ có năm → dùng nguyên năm (ghi chú cho người sinh trước Tết)."""
    if thang and ngay:
        return lunar.solar_to_lunar(ngay, thang, nam, CALENDAR_MERIDIAN_TZ)[2]
    return nam


def _danh_gia_nam(nam_sinh_am: int, nam_xay: int) -> dict:
    tuoi = t.tuoi_mu(nam_sinh_am, nam_xay)
    kl, ho = t.kim_lau(tuoi), t.HOANG_OC[t.hoang_oc(tuoi)]
    tt = t.pham_tam_tai(t.can_chi_nam(nam_sinh_am)[1], t.can_chi_nam(nam_xay)[1])
    xau = [x for x in (KB["kim_lau"][kl]["ten"] if kl else None,
                       KB["hoang_oc"][ho]["ten"] if ho in t.HOANG_OC_XAU else None,
                       f"Tam tai (năm thứ {tt})" if tt else None) if x]
    return {"tuoi": tuoi, "kl": kl, "ho": ho, "tt": tt, "xau": xau}


def xem_tuoi_lam_nha(nam_sinh: int, nam_xay: int, thang_sinh: int | None = None, ngay_sinh: int | None = None) -> dict:
    nsa = nam_am_sinh(nam_sinh, thang_sinh, ngay_sinh)
    can, chi = t.can_chi_nam(nsa)
    d = _danh_gia_nam(nsa, nam_xay)
    nam_thuan = []
    for n in range(nam_xay + 1, nam_xay + 16):
        x = _danh_gia_nam(nsa, n)
        if not x["xau"]:
            nam_thuan.append({"nam": n, "can_chi": " ".join(t.can_chi_nam(n)), "tuoi_mu": x["tuoi"]})
        if len(nam_thuan) == 4:
            break
    ket = ({"ma": "thuan", "chu": f"Năm {nam_xay} tuổi {d['tuoi']} không phạm Kim lâu, Hoang ốc xấu hay Tam tai."}
           if not d["xau"] else
           {"ma": "can_nhac", "chu": f"Năm {nam_xay} tuổi {d['tuoi']} rơi vào {', '.join(d['xau'])} — dân gian thường tránh làm nhà, cưới hỏi năm này."})
    # SEO-M: trả lời trước — chỉ ghép kết luận + năm thuận đã tính.
    tra_loi = (f"{ket['chu']} Người sinh năm {nam_sinh} ({can} {chi}) tính tuổi mụ {d['tuoi']} vào năm {nam_xay}."
               + (f" Năm gần nhất không phạm: {nam_thuan[0]['nam']} ({nam_thuan[0]['can_chi']}, tuổi {nam_thuan[0]['tuoi_mu']})."
                  if d["xau"] and nam_thuan else ""))
    return {
        "tra_loi_nhanh": tra_loi,
        "nam_sinh": nam_sinh, "nam_sinh_am": nsa, "can_chi": f"{can} {chi}", "nam_xay": nam_xay,
        "can_chi_nam_xay": " ".join(t.can_chi_nam(nam_xay)), "tuoi_mu": d["tuoi"],
        "uoc_luong_nam_sinh": not (thang_sinh and ngay_sinh),
        "kim_lau": {"ma": d["kl"], **KB["kim_lau"][d["kl"]]} if d["kl"] else None,
        "hoang_oc": {"ma": d["ho"], **KB["hoang_oc"][d["ho"]]},
        "tam_tai": ({"nam_thu": d["tt"], **KB["tam_tai"]} if d["tt"] else None),
        "cac_nam_tam_tai": t.tam_tai(chi),
        "ket_luan": ket, "nam_thuan": nam_thuan,
        "cuoi_hoi": ("Với cưới hỏi, dân gian xét Kim lâu theo tuổi mụ của cô dâu: "
                     + (f"tuổi {d['tuoi']} phạm {KB['kim_lau'][d['kl']]['ten']}." if d["kl"] else f"tuổi {d['tuoi']} không phạm Kim lâu.")),
        "cach_dan_gian": KB["cach_dan_gian"] if d["xau"] else None,
        "cach_tinh": ("Tuổi mụ = năm định làm − năm sinh (âm lịch) + 1. Kim lâu: tuổi mụ chia 9 dư 1, 3, 6, 8. Hoang ốc: "
                      "10 tuổi Nhất Cát, 20 Nhì Nghi, 30 Tam Địa Sát, 40 Tứ Tấn Tài, 50 Ngũ Thọ Tử, 60 Lục Hoang Ốc, số lẻ "
                      "đếm tiếp. Tam tai: ba năm theo tam hợp của tuổi."),
        "han_nam": han_nam_luan(nam_xay),
        **_meta(),
    }


def han_nam_luan(nam: int) -> dict:
    h = t.han_nam(nam)
    tranh = [{"ma": m, **KB["han_nam"][m], "phuong": h[m]["phuong"],
              **({"chi": h[m]["chi"]} if m in ("tam_sat",) else {"chi": [h[m]["chi"]]} if m in ("thai_tue", "tue_pha") else {})}
             for m in ("thai_tue", "tue_pha", "tam_sat", "ngu_hoang", "nhi_hac")]
    sao = _HK["sao"]
    phi_tinh = [{**x, "ten_sao": {1: "Nhất Bạch", 2: "Nhị Hắc", 3: "Tam Bích", 4: "Tứ Lục", 5: "Ngũ Hoàng", 6: "Lục Bạch",
                                  7: "Thất Xích", 8: "Bát Bạch", 9: "Cửu Tử"}[x["sao"]],
                 "y_nghia": sao[str(x["sao"])].get("y_vuong")} for x in h["phi_tinh"]]
    tet = dt.date(*reversed(lunar.lunar_to_solar(1, 1, nam, 0, CALENDAR_MERIDIAN_TZ)))
    # SEO-M: trả lời trước + hỏi đáp — chỉ ghép phương đã tính.
    ten_phuong = "; ".join(f"{x['ten']} ở {x['phuong']}" for x in tranh)
    tra_loi = (f"Năm {nam} ({h['can_chi']}), các phương truyền thống khuyên tránh động thổ, đục phá lớn: {ten_phuong}. "
               f"Tính theo năm tiết khí từ Lập xuân (khoảng 4/2/{nam}).")
    hd = [
        {"hoi": f"Năm {nam} hướng nào xấu, không nên động thổ?", "dap": tra_loi},
        {"hoi": f"Năm {nam} Thái Tuế ở đâu?", "dap": next(
            f"Thái Tuế năm {h['can_chi']} ở phương {x['phuong']} ({', '.join(x.get('chi', []))}); Tuế Phá ở phương đối diện."
            for x in tranh if x["ma"] == "thai_tue")},
        {"hoi": f"Năm {nam} Ngũ Hoàng, Nhị Hắc bay tới đâu?", "dap": "; ".join(
            f"{x['ten']} bay tới phương {x['phuong']}" for x in tranh if x["ma"] in ("ngu_hoang", "nhi_hac")) + "."},
        {"hoi": "Đang ở sẵn nhà có cần đổi hướng không?",
         "dap": "Không. Hạn năm chỉ nhắc tránh khởi công, đục phá lớn ở các phương đó trong năm; nhà đang ở giữ nguyên, "
                "giữ phía ấy gọn gàng, yên tĩnh là đủ."},
    ]
    return {"nam": nam, "can_chi": h["can_chi"], "huong_tranh": tranh, "phi_tinh": phi_tinh,
            "tra_loi_nhanh": tra_loi, "hoi_dap": hd,
            "moc": f"Tính từ Lập xuân (khoảng 4/2/{nam}); Tết Việt năm {h['can_chi']} là {tet.day}/{tet.month}/{tet.year}.",
            **_meta()}


def _ly_do(x: dict) -> list[str]:
    q = KB["quan_he_chi"]
    ra = []
    if x["chi_voi_nam"] in ("tam_hop", "luc_hop"):
        ra.append(f"tuổi {x['chi']} {q[x['chi_voi_nam']]} với năm")
    if x["chi_voi_chu"] in ("tam_hop", "luc_hop"):
        ra.append(f"{q[x['chi_voi_chu']]} với tuổi gia chủ")
    if x["can_voi_chu"] in ("ngu_hop", "sinh_chu"):
        ra.append(KB["can_voi_chu"][x["can_voi_chu"]])
    if x["nap_am_voi_chu"] in ("sinh", "bình hoà"):
        ra.append(f"{x['nap_am']} — {KB['nap_am'][x['nap_am_voi_chu']]}")
    return ra


def xong_dat_luan(nam: int, nam_sinh_chu: int, thang_sinh: int | None = None, ngay_sinh: int | None = None,
                  tu: int = 1960, den: int = 2008) -> dict:
    nsa = nam_am_sinh(nam_sinh_chu, thang_sinh, ngay_sinh)
    ds = t.xong_dat(nam, nsa, range(tu, den + 1))
    hop = [{"nam_sinh": x["nam_sinh"], "can_chi": x["can_chi"], "nap_am": x["nap_am"], "ly_do": _ly_do(x)}
           for x in ds if x["diem"] >= 2 and not x["tam_tai"] and _ly_do(x)][:8]
    can_n, chi_n = t.can_chi_nam(nam)
    can_c, chi_c = t.can_chi_nam(nsa)
    xung_nam = t.CHI[(t.CHI.index(chi_n) + 6) % 12]
    xung_chu = t.CHI[(t.CHI.index(chi_c) + 6) % 12]
    tam_tai_nam = [c for c in t.CHI if t.pham_tam_tai(c, chi_n)]
    tet = dt.date(*reversed(lunar.lunar_to_solar(1, 1, nam, 0, CALENDAR_MERIDIAN_TZ)))
    m1 = hl.ngay_xem(tet)
    # SEO-M: trả lời trước — 3 tuổi hợp đầu + tuổi nên tránh + giờ đẹp mùng 1 (đều đã tính).
    tra_loi = (f"Gia chủ sinh năm {nam_sinh_chu} ({can_c} {chi_c}) đón Tết {can_n} {chi_n} "
               + ("có thể nhờ người tuổi " + ", ".join(f"{x['nam_sinh']} ({x['can_chi']})" for x in hop[:3]) + " xông đất."
                  if hop else "chưa thấy tuổi nào hợp đủ điều kiện trong khoảng 1960–2008, nên chọn người thân thuận hoà.")
               + f" Nên tránh tuổi {xung_nam}, tuổi {xung_chu} và các tuổi {', '.join(tam_tai_nam)} đang Tam tai. "
               f"Mùng 1 Tết ({tet.day}/{tet.month}/{tet.year}) giờ hoàng đạo đầu tiên là "
               f"{m1['gio_hoang_dao'][0]['chi']} ({m1['gio_hoang_dao'][0]['khung']}).")
    return {
        "tra_loi_nhanh": tra_loi,
        "nam": {"nam": nam, "can_chi": f"{can_n} {chi_n}"}, "chu": {"nam_sinh": nam_sinh_chu, "can_chi": f"{can_c} {chi_c}"},
        "uoc_luong_nam_sinh": not (thang_sinh and ngay_sinh),
        "tuoi_hop": hop,
        "nen_tranh": [f"Tuổi {xung_nam} (xung năm {chi_n})", f"Tuổi {xung_chu} (xung tuổi gia chủ {chi_c})",
                      f"Tuổi {', '.join(tam_tai_nam)} (đang trong Tam tai năm {chi_n})"],
        "mung_mot": {"ngay": tet.isoformat(), "can_chi": m1["can_chi"]["ngay"],
                     "gio_hoang_dao": [{"chi": g["chi"], "khung": g["khung"]} for g in m1["gio_hoang_dao"]],
                     "huong": m1["huong"], "hoang_dao": m1["hoang_dao"], "than": m1["than"]["ten"]},
        "cach_chon": ("Ưu tiên tuổi tam hợp / lục hợp với năm và với gia chủ, can ngũ hợp hoặc sinh can gia chủ, mệnh "
                      "nạp âm sinh hoặc cùng hành với gia chủ; bỏ tuổi xung năm, xung gia chủ và tuổi đang Tam tai."),
        **_meta(),
    }


# ---- SEO-L1 (chủ dự án duyệt 2026-10-22): trang trụ theo năm — ghép lại đúng các hàm của từng tuổi ----------------
NAM_SINH_SEO = range(1960, 2006)


def lam_nha_nam(nam_xay: int) -> dict:
    """Bảng "tuổi nào làm nhà, cưới hỏi năm X được": mỗi tuổi 1960–2005 dùng `_danh_gia_nam` như trang con."""
    can_n, chi_n = t.can_chi_nam(nam_xay)
    ds = []
    for ns in NAM_SINH_SEO:
        d = _danh_gia_nam(ns, nam_xay)
        ds.append({"nam_sinh": ns, "can_chi": " ".join(t.can_chi_nam(ns)), "tuoi_mu": d["tuoi"],
                   "kim_lau": KB["kim_lau"][d["kl"]]["ten"] if d["kl"] else None,
                   "hoang_oc": KB["hoang_oc"][d["ho"]]["ten"], "hoang_oc_xau": d["ho"] in t.HOANG_OC_XAU,
                   "tam_tai": d["tt"], "thuan": not d["xau"], "xau": d["xau"]})
    thuan = [x for x in ds if x["thuan"]]
    ten = lambda xs: ", ".join(f"{x['nam_sinh']} ({x['can_chi']})" for x in xs)  # noqa: E731
    tra_loi = (f"Năm {nam_xay} ({can_n} {chi_n}), trong các tuổi sinh 1960–2005 có {len(thuan)} tuổi không phạm Kim lâu, "
               f"Hoang ốc xấu hay Tam tai: {ten(thuan) or 'không có'}. Các tuổi còn lại dân gian thường lùi năm hoặc mượn "
               f"tuổi người nhà để đứng tên. Tuổi tính theo tuổi mụ (năm âm lịch).")
    tt = [x for x in ds if x["tam_tai"]]
    hd = [
        {"hoi": f"Năm {nam_xay} tuổi nào làm nhà được?", "dap": tra_loi},
        {"hoi": f"Năm {nam_xay} tuổi nào phạm Kim lâu?",
         "dap": ten([x for x in ds if x["kim_lau"]]) + ". Kim lâu tính theo tuổi mụ chia 9 dư 1, 3, 6, 8."},
        {"hoi": f"Năm {nam_xay} tuổi nào phạm Tam tai?",
         "dap": (f"Năm {chi_n} là năm Tam tai của các tuổi {', '.join(sorted({x['can_chi'].split()[1] for x in tt}))}."
                 if tt else f"Năm {chi_n} không có tuổi nào trong khoảng này phạm Tam tai.")},
        {"hoi": f"Năm {nam_xay} tuổi nào cưới được?",
         "dap": ("Với cưới hỏi, dân gian xét Kim lâu theo tuổi mụ của cô dâu. Các tuổi không phạm Kim lâu năm "
                 f"{nam_xay}: {ten([x for x in ds if not x['kim_lau']])}.")},
    ]
    return {"nam": nam_xay, "can_chi": f"{can_n} {chi_n}", "ds": ds, "so_thuan": len(thuan),
            "tra_loi_nhanh": tra_loi, "hoi_dap": hd,
            "cach_tinh": ("Tuổi mụ = năm định làm − năm sinh (âm lịch) + 1. Kim lâu: tuổi mụ chia 9 dư 1, 3, 6, 8. Hoang ốc: "
                          "10 tuổi Nhất Cát, 20 Nhì Nghi, 30 Tam Địa Sát, 40 Tứ Tấn Tài, 50 Ngũ Thọ Tử, 60 Lục Hoang Ốc, "
                          "số lẻ đếm tiếp. Tam tai: ba năm theo tam hợp của tuổi. Sinh tháng 1 hoặc đầu tháng 2 (trước Tết) "
                          "thì tính theo năm âm lịch trước đó."),
            "han_nam": han_nam_luan(nam_xay), **_meta()}


def xong_dat_nam(nam: int) -> dict:
    """Bảng "tuổi xông đất Tết năm X" theo từng tuổi gia chủ 1960–2005 (3 tuổi hợp đầu, như trang con)."""
    can_n, chi_n = t.can_chi_nam(nam)
    tet = dt.date(*reversed(lunar.lunar_to_solar(1, 1, nam, 0, CALENDAR_MERIDIAN_TZ)))
    m1 = hl.ngay_xem(tet)
    xung_nam = t.CHI[(t.CHI.index(chi_n) + 6) % 12]
    tam_tai_nam = [c for c in t.CHI if t.pham_tam_tai(c, chi_n)]
    ds = []
    for ns in NAM_SINH_SEO:
        xs = t.xong_dat(nam, ns, range(1960, 2009))
        hop = [{"nam_sinh": x["nam_sinh"], "can_chi": x["can_chi"]}
               for x in xs if x["diem"] >= 2 and not x["tam_tai"] and _ly_do(x)][:3]
        ds.append({"nam_sinh": ns, "can_chi": " ".join(t.can_chi_nam(ns)), "tuoi_hop": hop})
    tra_loi = (f"Tết {can_n} {chi_n} rơi vào ngày {tet.day}/{tet.month}/{tet.year}. Người xông đất nên tránh tuổi {xung_nam} "
               f"(xung năm {chi_n}) và các tuổi {', '.join(tam_tai_nam)} (đang Tam tai). Tuổi hợp còn tuỳ tuổi gia chủ — "
               f"bảng dưới ghi 3 tuổi hợp nhất cho từng năm sinh gia chủ 1960–2005.")
    hd = [
        {"hoi": f"Tết {nam} nên chọn tuổi nào xông đất?", "dap": tra_loi},
        {"hoi": f"Mùng 1 Tết {nam} là ngày nào, giờ nào tốt?",
         "dap": (f"Mùng 1 Tết {can_n} {chi_n} là {tet.day}/{tet.month}/{tet.year}, ngày {m1['can_chi']['ngay']}. Giờ hoàng đạo: "
                 + ", ".join(f"{g['chi']} ({g['khung']})" for g in m1["gio_hoang_dao"]) + ".")},
        {"hoi": f"Tết {nam} tránh tuổi nào xông đất?",
         "dap": f"Tuổi {xung_nam} (xung năm {chi_n}); các tuổi {', '.join(tam_tai_nam)} đang Tam tai; tuổi xung với gia chủ."},
    ]
    return {"nam": {"nam": nam, "can_chi": f"{can_n} {chi_n}"}, "ds": ds, "tra_loi_nhanh": tra_loi, "hoi_dap": hd,
            "nen_tranh": [f"Tuổi {xung_nam} (xung năm {chi_n})", f"Tuổi {', '.join(tam_tai_nam)} (đang trong Tam tai năm {chi_n})"],
            "mung_mot": {"ngay": tet.isoformat(), "can_chi": m1["can_chi"]["ngay"],
                         "gio_hoang_dao": [{"chi": g["chi"], "khung": g["khung"]} for g in m1["gio_hoang_dao"]],
                         "huong": m1["huong"]},
            **_meta()}
