# -*- coding: utf-8 -*-
"""TG-V2 — các lớp của mỗi tháng trong "Thời gian tới của bạn" (RULES, tất định, không LLM).

Chỉ ghép CALC đã có (một bộ tính):
- con giáp: chi tháng theo tiết chứa ngày 15 (`huyen_khong.luu_nguyet_tai`) ↔ chi năm sinh âm lịch (`quan_he_chi`);
- phong thuỷ: sao bay của tháng × bốn hướng cát của mệnh quái (Bát trạch `bang_huong`) — góc hợp mệnh có sao tốt
  (vận 9: Cửu Tử vượng, Nhất Bạch sinh khí, Bát Bạch còn khá) và góc có Ngũ Hoàng / Nhị Hắc nên giữ yên;
- ngày đẹp: `hoang_lich.chon_ngay("khai_truong")` trong tháng dương, không xung tuổi, bỏ ngày kiêng dân gian;
- tháng nổi bật: ĐẾM lớp cùng thuận / cùng nhắc chậm (không điểm số).
Lời ở KB `thoi_gian_lop_kb.json` (nháp). Lớp tập quán / phong thuỷ KHÔNG đổi mức của tháng (mức chỉ từ Tử vi + Bát tự)."""
from __future__ import annotations

import datetime as dt
import json
from pathlib import Path

from app import ngon_ngu
from app.calc import huyen_khong as HK
from app.kb import nap
from app.kb import ten as _tn
from app.kb.loi import L
from app.calc import phongthuy as P
from app.calc import tuoi_dan_gian as t
from app.luangiai.doi_song_chung import slug  # noqa: F401  (dùng lại ở thoi_gian_toi)

KB = json.loads((Path(__file__).parents[1] / "kb" / "data" / "thoi_gian_lop_kb.json").read_text(encoding="utf-8"))
SAO_TOT = (9, 1, 8)            # thứ tự ưu tiên ở vận 9
SAO_YEN = (5, 2)
PHUONG = {k: v[1] for k, v in HK.QUAI.items()}
TEN_LOP = KB["ten_lop"]          # bản Việt (giữ cho mã cũ); chữ theo ngôn ngữ: `ten_lop()`


def _kb() -> dict:
    """EN-ALL GĐ 8: KB theo ngôn ngữ lượt gọi (bản phủ `kb/data/<nn>/thoi_gian_lop_kb.json`); bản Việt = `KB`."""
    return KB if ngon_ngu.la_viet() else nap.doc("thoi_gian_lop_kb.json")


def ten_lop(ma: str) -> str:
    return _kb()["ten_lop"][ma]


def _h(ph: str) -> str:
    return _tn.ten("huong", ph)


def _c(chi: str) -> str:
    return _tn.ten("chi", chi)


def _s(ten_sao: str) -> str:
    return _tn.ten("sao_bay", ten_sao)


def con_giap_thang(chi_tuoi: str, chi_thang: str) -> dict:
    q = t.quan_he_chi(chi_tuoi, chi_thang) or "binh"
    o = _kb()["con_giap"][q]
    return {"quan_he": q, "loai": o["loai"], "nhan": o["nhan"].format(chi_thang=_c(chi_thang), chi_tuoi=_c(chi_tuoi)),
            "loi": o["loi"]}


def _goc(cung: dict, quai: str | None) -> tuple[dict | None, dict | None, list[str]]:
    """(góc hợp mệnh có sao tốt, góc sao tốt nhất bất kể mệnh, các phương nên giữ yên)."""
    o = {PHUONG[k]: s for k, s in cung.items() if k != "Trung cung"}
    yen = [ph for ph, s in o.items() if s in SAO_YEN]
    bang = P.bang_huong(quai) if quai else {}
    hop = tot = None
    for s in SAO_TOT:
        ph = next((p for p, x in o.items() if x == s), None)
        if ph is None:
            continue
        tot = tot or {"phuong": ph, "sao": s, "ten_sao": HK.SAO[s]}
        if quai and hop is None and P.du_nien(quai, ph)["cat"]:
            hop = {"phuong": ph, "sao": s, "ten_sao": HK.SAO[s], "du_nien": bang[ph]}
    return hop, tot, yen


def _loi_goc(hop, tot, khoa_hop="goc_hop", khoa_tot="goc_tot", **them) -> str:
    pt = _kb()["phong_thuy"]
    if hop:
        cau = pt[khoa_hop].format(phuong=_h(hop["phuong"]), y=pt["sao_tot"][str(hop["sao"])], **them)
    elif tot:
        cau = pt[khoa_tot].format(phuong=_h(tot["phuong"]), y=pt["sao_tot"][str(tot["sao"])], **them)
    else:
        cau = ""
    return cau


def phong_thuy_thang(giua: dt.date, quai: str | None) -> dict:
    ln = HK.luu_nguyet_tai(giua)
    hop, tot, yen = _goc(ln["cung"], quai)
    pt = _kb()["phong_thuy"]
    chinh = _loi_goc(hop, tot)
    ten_yen = {PHUONG[k]: HK.SAO[s] for k, s in ln["cung"].items() if k != "Trung cung" and s in SAO_YEN}
    loi_yen = (pt["goc_yen"].format(phuong=_h(yen[0])) if len(yen) == 1 else
               pt["goc_yen_hai"].format(a=_h(yen[0]), b=_h(yen[1])) if len(yen) >= 2 else "")
    thieu = "" if quai else pt["thieu_gioi"]
    return {"chi_thang": ln["chi_thang"], "goc_hop": hop, "goc_tot": tot, "yen": yen,
            "loi_chinh": chinh, "loi_yen": loi_yen, "loi_thieu": thieu,
            "loi": " ".join(x for x in (chinh, loi_yen, thieu) if x),
            "can_cu": L("tgl.can_cu_thang", "Sao tháng {chi} (Huyền Không, trung cung {tam})", chi=_c(ln['chi_thang']), tam=_s(HK.SAO[ln['tam']]))
                      + _chi_tiet(hop, tot, ten_yen) + (L("tgl.quai", "; mệnh quái {quai} (Bát trạch)", quai=_tn.ten("quai", quai)) if quai else "")}


def _chi_tiet(hop, tot, ten_yen: dict) -> str:
    g = hop or tot
    ra = [L("tgl.toi", "{sao} tới {phuong}", sao=_s(g['ten_sao']), phuong=_h(g['phuong']))
          + (L("tgl.du_nien", " — {du_nien} của mệnh", du_nien=_tn.ten("du_nien", hop['du_nien'])) if hop else "")] if g else []
    ra += [L("tgl.toi", "{sao} tới {phuong}", sao=_s(s), phuong=_h(ph)) for ph, s in ten_yen.items()]
    return ": " + ", ".join(ra) if ra else ""


def phong_thuy_nam(nam: int, quai: str | None) -> dict | None:
    if not quai:
        return None
    ln = HK.luu_nien(nam)
    hop, tot, yen = _goc(ln["cung"], quai)
    loi = _loi_goc(hop, tot, "nam_goc_hop", "nam_goc_tot", nam=nam)
    if not loi:
        return None
    ten_yen = {PHUONG[k]: HK.SAO[s] for k, s in ln["cung"].items() if k != "Trung cung" and s in SAO_YEN}
    return {"goc_hop": hop, "goc_tot": tot, "yen": yen, "loi": loi,
            "can_cu": _kb()["phong_thuy"]["nam_can_cu"].format(nam=nam, tam=_s(HK.SAO[ln["tam"]]), quai=_tn.ten("quai", quai),
                                                            chi_tiet=_chi_tiet(hop, tot, ten_yen))}


def ngay_dep_thang(nam: int, thang: int, ngay_sinh: dt.date, so: int = 3, tu_ngay: dt.date | None = None) -> list[dict]:
    from app.luangiai import hoang_lich as hl  # noqa: PLC0415

    tu = max(dt.date(nam, thang, 1), tu_ngay or dt.date.min)          # tháng đang đi: bỏ ngày đã qua
    den = dt.date(nam + (thang == 12), thang % 12 + 1, 1) - dt.timedelta(days=1)
    if tu > den:
        return []
    kq = hl.chon_ngay("khai_truong", tu, den, ngay_sinh.year, ngay_sinh.month, ngay_sinh.day)
    tot = [x for x in kq["ngay"] if not x.get("ky_dan_gian") and x.get("quan_he_tuoi") != "xung"
           and (x.get("hoang_dao") or len(x.get("diem_cong", [])) >= 2)]
    if len(tot) < so:                          # tháng ít ngày hoàng đạo → bổ sung ngày đủ điều kiện còn lại
        tot += [x for x in kq["ngay"] if x not in tot and not x.get("ky_dan_gian") and x.get("quan_he_tuoi") != "xung"]
    return sorted(tot[:so], key=lambda x: x["ngay"])


def _dm(iso: str) -> str:
    if not ngon_ngu.la_viet():
        from app.luangiai import lich_hien  # noqa: PLC0415
        return lich_hien.dm(dt.date.fromisoformat(iso))
    y, m, d = iso.split("-")
    return f"{int(d)}/{int(m)}"


def lop_thang(thang: int, nam: int, ngay_sinh: dt.date, quai: str | None, tu_ngay: dt.date | None = None) -> dict:
    from app.luangiai import tuoi_dan_gian as tdg  # noqa: PLC0415

    giua = dt.date(nam, thang, 15)
    chi_tuoi = t.can_chi_nam(tdg.nam_am_sinh(ngay_sinh.year, ngay_sinh.month, ngay_sinh.day))[1]
    pt = phong_thuy_thang(giua, quai)
    return {"thang": f"{thang}/{nam}", "chi_thang": pt["chi_thang"], "chi_tuoi": chi_tuoi,
            "con_giap": con_giap_thang(chi_tuoi, pt["chi_thang"]), "phong_thuy": pt,
            "ngay_dep": ngay_dep_thang(nam, thang, ngay_sinh, tu_ngay=tu_ngay)}


def hang_lop(o: dict, truoc: dict | None = None) -> list[dict]:
    """Ba hàng lớp (con giáp · phong thuỷ · ngày đẹp) cho hộp tháng; mỗi hàng {ma, nhan, loi, loai?}. `truoc` = lớp
    của tháng trước — EN-2 (ND-8): câu "góc … nên giữ yên" chỉ nói khi khác tháng trước (trước lặp 150 lần/10 hồ sơ);
    thiếu giới tính thì lời mời bổ sung chỉ nói ở tháng đầu."""
    cg, pt, nd = o["con_giap"], o["phong_thuy"], o["ngay_dep"]
    kn = _kb()["ngay_dep"]
    ds = ", ".join(L("tgl.ngay_am", "{ngay} (âm {am})", ngay=_dm(x['ngay']), am=x['am']) for x in nd)
    yen = pt.get("yen") or []
    if not truoc:
        cau_yen = pt.get("loi_yen") or ""
    elif set(yen) == set(((truoc or {}).get("phong_thuy") or {}).get("yen") or []):
        cau_yen = L("tgl.yen_nhu_truoc", "Các góc nên giữ yên như tháng trước.") if yen else ""
    else:                     # đã giải thích "giữ yên" ở tháng đầu → các tháng sau chỉ nêu góc
        cau_yen = L("tgl.yen", "Góc nên giữ yên: {ds}.", ds=L("tgl.va", " và ").join(_h(x) for x in yen)) if yen else ""
    loi_pt = " ".join(x for x in (pt.get("loi_chinh", pt["loi"]), cau_yen,
                                   pt.get("loi_thieu") if not truoc else "") if x)
    return [
        {"ma": "con_giap", "nhan": ten_lop("con_giap"), "tieu": cg["nhan"], "loi": cg["loi"], "loai": cg["loai"]},
        {"ma": "phong_thuy", "nhan": ten_lop("phong_thuy"), "loi": loi_pt or pt["loi"],
         "loai": "thuan" if pt["goc_hop"] else "trung"},
        {"ma": "ngay_dep", "nhan": ten_lop("ngay_dep"), "loi": kn["loi"].format(ds=ds) if nd else kn["khong_co"],
         "loai": "trung"},
    ]


def can_cu_lop(o: dict) -> list[str]:
    return [L("tgl.can_cu_cg", "Con giáp: tháng {chi} (tháng theo tiết chứa ngày 15) – tuổi {tuoi}", chi=_c(o['chi_thang']), tuoi=_c(o['chi_tuoi'])),
            o["phong_thuy"]["can_cu"], _kb()["ngay_dep"]["can_cu"]]


def tin_hieu(o: dict, muc_tv: str | None, muc_bt: str | None) -> dict:
    """Lớp nói thuận / lớp nhắc chậm của một tháng (để đếm, không chấm điểm)."""
    dau, cham = [], []
    if o["con_giap"]["loai"] == "thuan":
        dau.append(L("tgl.th.cg_hop", "con giáp hợp tuổi"))
    elif o["con_giap"]["quan_he"] == "xung":
        cham.append(L("tgl.th.xung", "tháng xung tuổi"))
    if o["phong_thuy"]["goc_hop"] and o["phong_thuy"]["goc_hop"]["sao"] == 9:
        dau.append(L("tgl.th.goc", "góc nhà hợp bạn đón sao tốt"))
    for ma, m in (("tuvi", muc_tv), ("battu", muc_bt)):
        if m == "thuan":
            dau.append(L(f"tgl.th.{ma}.thuan", {"tuvi": "Tử vi", "battu": "Bát tự"}[ma] + " thuận"))
        elif m == "can_chu_dong":
            cham.append(L(f"tgl.th.{ma}.cham", {"tuvi": "Tử vi", "battu": "Bát tự"}[ma] + " cần lưu ý"))
    return {"thang": o["thang"], "dau": dau, "cham": cham}


def viec_chinh(o: dict, hop_de: str | None = None) -> str:
    """MỘT việc nên làm của tháng (EN-2 ND-8): tháng xung tuổi → giấy tờ, chưa vội ký; có ngày đẹp → việc quan trọng đặt
    vào ngày ấy; không thì việc tháng cá nhân gợi ý. Chỉ ghép dữ kiện đã tính."""
    if o["con_giap"]["quan_he"] == "xung":
        return L("tgl.viec.xung", "Việc lớn trong tháng: đọc kỹ giấy tờ, chưa vội ký, hẹn thêm một ngày suy nghĩ.")
    if o["ngay_dep"]:
        x = o["ngay_dep"][0]
        return (L("tgl.viec.ngay_de", "Việc quan trọng nhất tháng ({de}) nên đặt vào ngày {ngay}.", de=hop_de, ngay=_dm(x['ngay'])) if hop_de
                else L("tgl.viec.ngay", "Việc quan trọng nhất tháng nên đặt vào ngày {ngay}.", ngay=_dm(x['ngay'])))
    return L("tgl.viec.danh", "Dành tháng này cho: {de}.", de=hop_de) if hop_de else ""


def tom_lai(th: dict) -> str:
    """Một câu tóm các lớp của tháng (chỉ nêu lớp đã tính, không chấm điểm). EN-2: "tháng thuận" / "nên đi chậm" chỉ khi
    ≥ 2 lớp cùng chiều và không lớp nào ngược — một lớp thì nói đúng là một điểm."""
    dau, cham = th["dau"], th["cham"]
    if len(dau) >= 2 and not cham:
        return L("tgl.tom.thuan", "Tóm lại: tháng thuận — {ds}.", ds=', '.join(dau))
    if len(cham) >= 2 and not dau:
        return L("tgl.tom.cham", "Tóm lại: tháng nên đi chậm một nhịp — {ds}.", ds=', '.join(cham))
    if dau and not cham:
        return L("tgl.tom.mot_thuan", "Tóm lại: tháng đều nhịp, có một điểm thuận ({x}).", x=dau[0])
    if cham and not dau:
        return L("tgl.tom.mot_cham", "Tóm lại: tháng đều nhịp, có một điều nên để ý ({x}).", x=cham[0])
    if dau and cham:
        return L("tgl.tom.ca_hai", "Tóm lại: có điểm thuận ({a}) lẫn điều nhắc chậm ({b}) — việc lớn nên chuẩn bị kỹ.",
                 a=', '.join(dau), b=', '.join(cham))
    return L("tgl.tom.deu", "Tóm lại: tháng đều nhịp, không cách xem nào lệch hẳn — cứ theo việc tháng cá nhân gợi ý.")


def xep_thang(ds: list[dict], toi_da: int = 3) -> tuple[list[dict], list[dict]]:
    """Tháng hội ≥ 2 lớp thuận và không lớp nào nhắc chậm; tháng ≥ 2 lớp nhắc chậm và không lớp nào thuận."""
    thuan = sorted((x for x in ds if len(x["dau"]) >= 2 and not x["cham"]), key=lambda x: -len(x["dau"]))
    cham = sorted((x for x in ds if len(x["cham"]) >= 2 and not x["dau"]), key=lambda x: -len(x["cham"]))
    return thuan[:toi_da], cham[:toi_da]
