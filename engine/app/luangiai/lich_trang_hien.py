# -*- coding: utf-8 -*-
"""EN-ALL GĐ 8 — lớp HIỂN THỊ theo ngôn ngữ cho các route lịch (`/v1/lich/*`: thẻ một ngày, lịch tháng, chọn ngày theo
việc, ngày tốt theo việc trong tháng, danh sách việc, đổi lịch).

`luangiai.hoang_lich` tính và trả TÊN Việt (trực, thần, việc nên / kiêng…), và các module khác (Hôm nay, Tuần này, tuổi
dân gian, Thời gian tới) đọc thẳng các tên / câu đó — nên module tính giữ nguyên. Ở đây, sau khi tính xong, phản hồi bản
ngôn ngữ khác được dựng lại chữ: tên tra qua mã KB (bản phủ `kb/data/<ngôn ngữ>/hoang_lich_kb.json`, lớp `lich_hien`),
câu dựng lại từ ĐÚNG dữ kiện đã tính (ngày, âm lịch, can chi, trực, thần, việc nên / kiêng), mẫu câu ở `loi/lich.json`.
Số, mã, bool, độ dài danh sách giữ nguyên (khung dữ kiện trùng bản Việt). Tiếng Việt: mọi hàm trả nguyên đầu vào.
"""
from __future__ import annotations

import copy
import datetime as dt

from app.calc import lunar
from app.config import CALENDAR_MERIDIAN_TZ
from app.kb import nap
from app.kb import ten as _ten
from app.kb.loi import L, danh_sach
from app.luangiai import hoang_lich as hl
from app.luangiai import lich_hien as lh


def la_viet() -> bool:
    return lh.la_viet()


def _kb() -> dict:
    return nap.doc(lh.TEP)


# ------------------------------------------------------------------ ngày tháng tiếng Anh tự nhiên
def thang_ten(m: int) -> str:
    return L(f"lich.thang_dai.{m}", str(m))


def ngay_dai(d: dt.date) -> str:
    """"10 November 2026"."""
    return L("lich.ngay_dai", "{d}/{m}/{y}", d=d.day, m=thang_ten(d.month), y=d.year)


def ngay_thu(d: dt.date) -> str:
    """"Tuesday 10 November 2026"."""
    return L("lich.ngay_thu", "{thu}, {ngay}", thu=lh.thu(d.weekday()), ngay=ngay_dai(d))


def _iso(s: str) -> dt.date:
    return dt.date.fromisoformat(s)


def am(ngay: int, thang: int, nhuan: bool = False) -> str:
    """Ngày âm "2/10" (+ " (leap)")."""
    return f"{ngay}/{thang}" + (L("lich.nhuan", " nhuận") if nhuan else "")


def thang_nam(thang: int, nam: int) -> str:
    """"November 2026"."""
    return L("lich.thang_nam", "tháng {t}/{n}", t=thang_ten(thang), n=nam)


def thang_am_hien(nam: int, thang_: int) -> str:
    """Tháng dương ứng với khoảng âm lịch nào (cùng phép tính `hoang_lich._thang_am`)."""
    den = dt.date(nam + (thang_ == 12), thang_ % 12 + 1, 1) - dt.timedelta(days=1)
    l0 = lunar.solar_to_lunar(1, thang_, nam, CALENDAR_MERIDIAN_TZ)
    l1 = lunar.solar_to_lunar(den.day, thang_, nam, CALENDAR_MERIDIAN_TZ)
    return L("lich.thang_am", "từ {a} đến {b} âm lịch", a=am(l0[0], l0[1], bool(l0[3])), b=am(l1[0], l1[1], bool(l1[3])))


def con_giap(chi: str) -> str:
    """Tên chi → "Zi (Rat)"."""
    if la_viet():
        return chi
    n, t = _ten.nghia("chi", chi), _ten.ten("chi", chi)
    return f"{t} ({n})" if n and "(" not in t else t


# ------------------------------------------------------------------ mục KB theo mã
def _muc(muc: str, x: dict, truong=("ten", "nghia")) -> dict:
    m = (_kb().get(muc) or {}).get(x.get("ma")) or {}
    return {**x, **{k: m[k] for k in truong if k in x and m.get(k)}}


def _ten_viec(vi: str) -> str:
    return lh.ten("viec", vi)


def _thuong(s: str) -> str:
    return s[:1].lower() + s[1:] if s else s


def _ten_nk(ds) -> str:
    kb = _kb()["nghi_ky"]
    return _noi([(kb.get(x) or {}).get("ten") or hl.KB["nghi_ky"].get(x, {}).get("ten", x) for x in ds])


def _noi(ds: list[str]) -> str:
    """Nối tên việc: tên tiếng Anh có thể chứa dấu phẩy ("Setting out, travelling") nên nối bằng "; "."""
    return danh_sach(ds) if not any("," in x for x in ds) else "; ".join(ds)


def diem_cong(x: str) -> str:
    """Một "điểm cộng" của ngày tốt (`hoang_lich.chon_ngay`): hoàng đạo / trực … / tam hợp, lục hợp."""
    if x == "hoàng đạo":
        return L("lich.diem.hoang_dao", x)
    if x.startswith("trực "):
        return L("lich.diem.truc", x, truc=lh.ten("truc", x[5:]))
    for ma, m in hl.KB["quan_he_tuoi"].items():
        if m["ten"].lower() == x:
            return L(f"lich.diem.qh.{ma}", x)
    return x


def ngay_chon(n: dict) -> dict:
    """Một ngày trong kết quả chọn ngày (`tom_tat` + quan hệ tuổi + điểm cộng)."""
    n = lh.tom_tat_ngay(n)
    if "diem_cong" in n:
        n["diem_cong"] = [diem_cong(x) for x in n["diem_cong"]]
    return n


def _tuoi(t: dict | None) -> dict | None:
    if not t:
        return t
    t = dict(t)
    t["can_chi"] = lh.can_chi(t.get("can_chi"))
    if "quan_he" in t:
        t["quan_he"] = lh.quan_he(t["quan_he"])
    return t


def luu_y() -> str:
    return L("lich.luu_y", hl.LUU_Y)


# ------------------------------------------------------------------ thẻ một ngày (`hoang_lich.ngay_xem`)
_VI_TRI = (("房内", "lich.thai.buong", "trong buồng, phía"), ("外", "lich.thai.ngoai", "phía ngoài"),
           ("内", "lich.thai.trong", "trong nhà, phía"))


def thai_than(s: str) -> str:
    """Cùng cách tách của `hoang_lich._thai`, tên chỗ / phương theo ngôn ngữ."""
    kb = _kb()
    tc, ph = kb.get("thai_chu") or hl.KB["thai_chu"], kb.get("phuong") or hl.KB["phuong"]
    vi, huong = (s.split(" ") + [""])[:2]
    vi = vi.replace("占", "")
    cho, i = [], 0
    while i < len(vi):
        for n in (2, 1):
            t = vi[i:i + n]
            if t in tc:
                if tc[t] and tc[t] not in cho:
                    cho.append(tc[t])
                i += n
                break
        else:
            i += 1
    for tien, ma, vi_chu in _VI_TRI:
        if huong.startswith(tien):
            p = huong[len(tien):]
            p = ph.get(p, p) if p else ""
            chu = L(ma, vi_chu)
            vi_tri = L("lich.thai.vi_tri", "{chu} {p}", chu=chu, p=p) if p else chu
            return ", ".join(cho) + f" · {vi_tri}"
    return ", ".join(cho)


def _hoang_dao(hd: bool) -> str:
    return L("lich.hd.hoang", "hoàng đạo") if hd else L("lich.hd.hac", "hắc đạo")


def viec_lon(c: dict) -> list[dict]:
    """Cùng luật `hoang_lich._viec_lon`; chỉ câu `chu` dựng theo ngôn ngữ."""
    ra = []
    for x in hl._viec_lon(c):  # noqa: SLF001 — đúng luật của trang ngày
        v = hl._VIEC[x["ma"]]  # noqa: SLF001
        nen = [y for y in v["nghi"] if y in c["nghi"]]
        ky = [y for y in v["nghi"] if y in c["ky"]]
        if x["danh_gia"] == "tot":
            chu = L("lich.vl.tot", "sách lịch ghi nên {nen}, không vướng mục Kiêng", nen=_ten_nk(nen))
        elif x["danh_gia"] == "binh":
            chu = L("lich.vl.binh", "sách lịch không ghi riêng việc này")
        else:
            ly = []
            if ky:
                ly.append(L("lich.vl.nen_kieng", "sách ghi nên {nen} nhưng kiêng {ky}", nen=_ten_nk(nen), ky=_ten_nk(ky))
                          if nen else L("lich.vl.kieng", "sách ghi kiêng {ky}", ky=_ten_nk(ky)))
            if c["truc"] in v["tranh_truc"]:
                ly.append(L("lich.vl.truc", "trực {truc} sách khuyên tránh việc này", truc=lh.ten("truc", hl.KB["truc"][c["truc"]]["ten"])))
            ly += [L("lich.vl.dan_gian", "ngày {ten}", ten=lh.ten("ky_dan_gian", hl.KB["ky_dan_gian"][k]["ten"]))
                   for k in c["ky_dan_gian"] if k in v["tranh_dan_gian"]]
            if "诸事不宜" in c["ky"]:
                ly.append(L("lich.vl.hoan", "sách khuyên hoãn mọi việc lớn"))
            elif not ly and "馀事勿取" in c["nghi"]:
                ly.append(L("lich.vl.chi_nen", "sách chỉ khuyên làm các việc ghi ở mục Nên"))
            chu = "; ".join(ly)
        ra.append({**x, "ten": _ten_viec(x["ten"]), "chu": chu})
    return ra


def _cau_viec_lon(ds: list[dict]) -> str:
    tot = [_thuong(x["ten"]) for x in ds if x["danh_gia"] == "tot"]
    tr = [L("lich.vl.tr_muc", "{ten} ({chu})", ten=_thuong(x["ten"]), chu=x["chu"]) for x in ds if x["danh_gia"] == "tranh"]
    if not tot and not tr:
        return ""
    return (L("lich.vl.mo", " Theo cách chọn ngày của trang (việc có trong mục Nên, không vướng mục Kiêng, trực và ngày "
                            "kiêng dân gian): ")
            + (L("lich.vl.hop", "hợp {ds}", ds=_noi(tot)) if tot else L("lich.vl.chua_co", "chưa có việc lớn nào đủ điều kiện"))
            + (L("lich.vl.chua_xep", "; chưa xếp vào ngày tốt {ds}", ds="; ".join(tr)) if tr else "") + ".")


def _cau_hop(cg: list[dict]) -> str:
    """Câu "Tuổi hợp ngày" của `hoang_lich.ngay_xem` theo ngôn ngữ."""
    th = [x["chi"] for x in cg if x["ma"] == "tam_hop"]
    lh_ = [x["chi"] for x in cg if x["ma"] == "luc_hop"]
    if not th and not lh_:
        return ""
    phan = ([L("lich.tl.hop_tam", "{ds} (tam hợp)", ds="; ".join(th))] if th else []) + \
        ([L("lich.tl.hop_luc", "{ds} (lục hợp)", ds="; ".join(lh_))] if lh_ else [])
    return L("lich.tl.hop", " Tuổi hợp ngày: {ds}.", ds="; ".join(phan))


def ngay_xem(kq: dict) -> dict:
    if la_viet():
        return kq
    kq = copy.deepcopy(kq)
    d = _iso(kq["ngay"])
    c = hl._calc(d)  # noqa: SLF001 — cùng bộ tính (có nhớ)
    kb = _kb()
    truc_vi = kq["truc"]["ten"]
    for k in ("ten", "y", "hop", "tranh"):
        kq["truc"][k] = lh.truc(truc_vi, k)
    kq["thu"] = lh.thu(d.weekday())
    kq["am"]["chu"] = am(c["am"]["ngay"], c["am"]["thang"], bool(c["am"]["nhuan"]))
    kq["can_chi"] = {k: lh.can_chi(v) for k, v in kq["can_chi"].items()}
    kq["than"]["ten"] = lh.ten("than", kq["than"]["ten"])
    kq["tu"]["ten"] = (kb.get("tu") or {}).get(kq["tu"]["han"]) or kq["tu"]["ten"]
    kq["nghi"] = [_muc("nghi_ky", x, ("ten", "nghia", "ten_goc", "luu_y")) for x in kq["nghi"]]
    kq["ky"] = [_muc("nghi_ky", x, ("ten", "nghia", "ten_goc", "luu_y")) for x in kq["ky"]]
    kq["cat_than"] = [_muc("than_sat", x) for x in kq["cat_than"]]
    kq["hung_sat"] = [_muc("than_sat", x) for x in kq["hung_sat"]]
    kq["xung_tuoi"]["ten"] = lh.can_chi(kq["xung_tuoi"]["ten"])
    if kq.get("con_giap"):  # SEO-P: 12 con giáp trong ngày — mã giữ, chữ theo ngôn ngữ
        kq["con_giap"] = [{**lh.quan_he({k: x[k] for k in ("ma", "ten", "nghia")}), "chi": con_giap(x["chi"])}
                          for x in kq["con_giap"]]
    ph = kb.get("phuong") or {}
    kq["sat"] = ph.get(c["sat_phuong"], kq["sat"])
    kq["huong"] = {k: ph.get(c["huong"][k], v) for k, v in kq["huong"].items()}
    bt = kb.get("banh_to") or {}
    kq["banh_to"] = [bt.get(c["ngay_gz"][0], kq["banh_to"][0]), bt.get(c["ngay_gz"][1], kq["banh_to"][1])]
    kq["thai_than"] = thai_than(c["thai_than"])
    gio = []
    for g in kq["gio"]:
        g = dict(g)
        g["can_chi"] = lh.can_chi(g["can_chi"])
        g["than"] = lh.ten("than", g["than"])
        g["xuat_hanh"] = lh.xuat_hanh(g["xuat_hanh"])
        gio.append(g)
    kq["gio"] = gio
    kq["gio_hoang_dao"] = [g for g in gio if g["hoang_dao"]]
    kq["ghi_chu_gio_ty"] = L("lich.ghi_chu_gio_ty", hl.GHI_CHU_GIO_TY)
    kq["ky_dan_gian"] = [_muc("ky_dan_gian", x) for x in kq["ky_dan_gian"]]
    kq["nhan_tap_quan"] = [_muc("nhan_tap_quan", x, ("ten", "nghia", "nguon", "luu_y")) for x in kq["nhan_tap_quan"]]
    kq["tuoi"] = _tuoi(kq["tuoi"])
    if kq.get("viec"):
        v = kq["viec"]
        v["ten"] = _ten_viec(v["ten"])
        v["ly_do"] = [lh.ly_do(x) for x in v["ly_do"]]
        v["ngay_tot_gan"] = lh.tom_tat_ngay(v.get("ngay_tot_gan"))
    kq["viec_lon"] = viec_lon(c)
    kq["ngay_mai"] = lh.tom_tat_ngay(kq["ngay_mai"])
    kq["ngay_tot_gan"] = lh.tom_tat_ngay(kq["ngay_tot_gan"])
    kq["danh_sach_viec"] = [{**v, "ten": _ten_viec(v["ten"])} for v in kq["danh_sach_viec"]]
    kq["nguon"] = (kb.get("source") or {}).get("ten") or kq["nguon"]
    kq["luu_y"] = luu_y()
    # trả lời trước — cùng các trường đã tính ở trên
    nghi3 = [_thuong(x["ten"]) for x in kq["nghi"] if x["ma"] in hl.KB["nghi_ky"]][:3]
    ky_dg = [x["ten"] for x in kq["ky_dan_gian"]]
    gio_hd = [L("lich.tl.gio_muc", "{chi} ({khung})", chi=con_giap(g["chi"]), khung=g["khung"]) for g in kq["gio_hoang_dao"]]
    kq["tra_loi_nhanh"] = (
        L("lich.tl.mo", "{thu}, {ngay} (âm lịch {am}, ngày {gz}) là ngày {hd} ({than}), trực {truc} — hợp {hop}.",
          thu=kq["thu"], ngay=ngay_dai(d), am=kq["am"]["chu"], gz=kq["can_chi"]["ngay"], hd=_hoang_dao(c["hoang_dao"]),
          than=kq["than"]["ten"], truc=kq["truc"]["ten"], hop=kq["truc"]["hop"])
        + (L("lich.tl.nghi", " Sách lịch ghi nên: {ds}.", ds=_noi(nghi3)) if nghi3 else "")
        + _cau_viec_lon(kq["viec_lon"])
        + (L("lich.tl.ky_dg", " Dân gian thường tránh việc lớn vì là ngày {ds}.", ds=danh_sach(ky_dg)) if ky_dg else "")
        + L("lich.tl.xung", " Xung tuổi {xung}.", xung=kq["xung_tuoi"]["ten"])
        + _cau_hop(kq.get("con_giap") or [])
        + L("lich.tl.gio", " Giờ hoàng đạo: {ds}.", ds=", ".join(gio_hd)))
    return kq


# ------------------------------------------------------------------ lịch tháng (`hoang_lich.thang`)
def _dmy(iso: str) -> str:
    return lh.dm(_iso(iso))


def thang(kq: dict) -> dict:
    if la_viet():
        return kq
    kq = copy.deepcopy(kq)
    nam, th = kq["nam"], kq["thang"]
    ra = [lh.tom_tat_ngay(n) for n in kq["ngay"]]
    kq["ngay"] = ra
    kq["thang_am"] = thang_am_hien(nam, th)
    for v in kq["theo_viec"]:
        v["viec"]["ten"] = _ten_viec(v["viec"]["ten"])
        if v["dep_nhat"]:
            v["dep_nhat"] = ngay_chon(v["dep_nhat"])
    ky = kq["tom_tat"]["ky_dan_gian"]
    for k in ky:
        k["ten"] = lh.ten("ky_dan_gian", k["ten"])
    dep = [n for n in ra if n["dep"]]
    so_hd = kq["tom_tat"]["so_hoang_dao"]
    tn = thang_nam(th, nam)
    tra_loi = (L("lich.th.tl", "Tháng {tn} ({am}) có {hd} ngày hoàng đạo, trong đó {dep} ngày hoàng đạo có trực tốt và không "
                             "vướng kiêng dân gian", tn=tn, am=kq["thang_am"], hd=so_hd, dep=len(dep))
               + (L("lich.th.tl_ds", ": {ds}{them}.", ds=", ".join(_dmy(n["ngay"]) for n in dep[:8]),
                    them="…" if len(dep) > 8 else "") if dep else ".")
               + (L("lich.th.tl_ky", " Ngày dân gian thường tránh việc lớn: {ds}.", ds="; ".join(
                   L("lich.th.tl_ky_muc", "{ten} {ngay}", ten=k["ten"], ngay=", ".join(str(int(x[8:])) for x in k["ngay"]))
                   for k in ky)) if ky else ""))
    kq["tra_loi_nhanh"] = tra_loi
    kq["hoi_dap"] = [
        {"hoi": L("lich.th.h1", "Tháng {tn} có những ngày nào đẹp?", tn=tn), "dap": tra_loi},
        {"hoi": L("lich.th.h2", "Tháng {tn} ứng với tháng mấy âm lịch?", tn=tn),
         "dap": L("lich.th.d2", "Tháng {tn} dương lịch kéo dài {am}.", tn=tn, am=kq["thang_am"])},
        {"hoi": L("lich.th.h3", "Tháng {tn} nên chọn ngày nào cho việc lớn?", tn=tn),
         "dap": " ".join(L("lich.th.d3_muc", "{viec}: {so} ngày", viec=v["viec"]["ten"], so=v["so_ngay"])
                         + (L("lich.th.d3_dep", ", đẹp nhất {ngay}.", ngay=_dmy(v["dep_nhat"]["ngay"])) if v["dep_nhat"] else ".")
                         for v in kq["theo_viec"])},
        {"hoi": L("lich.th.h4", "Ngày đẹp trong bảng này đã xét tuổi chưa?"),
         "dap": L("lich.th.d4", "Chưa. Bảng chọn theo hoàng đạo, trực và kiêng dân gian chung cho mọi người. Mở một ngày hoặc "
                                "nhập năm sinh ở công cụ Xem ngày tốt để bỏ các ngày xung tuổi bạn.")},
    ]
    return kq


# ------------------------------------------------------------------ chọn ngày (`hoang_lich.chon_ngay`)
def cach_chon(co_tuoi: bool) -> str:
    return L("lich.cach_chon", "Ngày có việc này trong mục Nên của sách lịch, không nằm trong mục Kiêng, trực không thuộc "
                               "nhóm sách khuyên tránh cho việc này{tuoi}.",
             tuoi=L("lich.cach_chon_tuoi", ", không xung tuổi bạn") if co_tuoi else "")


def chon_ngay(kq: dict) -> dict:
    if la_viet():
        return kq
    kq = copy.deepcopy(kq)
    kq["viec"]["ten"] = _ten_viec(kq["viec"]["ten"])
    kq["tuoi"] = _tuoi(kq["tuoi"])
    kq["ngay"] = [ngay_chon(n) for n in kq["ngay"]]
    kq["luu_y"] = luu_y()
    kq["cach_chon"] = cach_chon(bool(kq["tuoi"]))
    return kq


def ds_viec(kq: dict) -> dict:
    if la_viet():
        return kq
    return {**kq, "viec": [{**v, "ten": _ten_viec(v["ten"])} for v in kq["viec"]]}


# ------------------------------------------------------------------ ngày tốt theo việc trong tháng (`hoang_lich.viec_thang`)
def viec_thang(kq: dict) -> dict:
    if la_viet():
        return kq
    kq = copy.deepcopy(kq)
    nam, th = kq["nam"], kq["thang"]
    kq["viec"]["ten"] = _ten_viec(kq["viec"]["ten"])
    ten = _thuong(kq["viec"]["ten"])
    ds = [ngay_chon(n) for n in kq["ngay"]]
    kq["ngay"] = ds
    dep = ngay_chon(kq["dep_nhat"]) if kq["dep_nhat"] else None
    kq["dep_nhat"] = dep
    kq["thang_am"] = thang_am_hien(nam, th)
    tn = thang_nam(th, nam)
    am_ = lambda x: L("lich.vt.ngay", "{ngay} (âm {am}, {gz})", ngay=_dmy(x["ngay"]), am=x["am"], gz=x["can_chi"])  # noqa: E731
    so_hd = sum(x["hoang_dao"] for x in ds)
    kq["tieu_de"] = L("lich.vt.tieu_de", "Ngày tốt {viec} tháng {tn}", viec=ten, tn=tn)
    tra_loi = ((L("lich.vt.tl", "Tháng {tn} ({am}) có {so} ngày tốt cho {viec} theo hoàng lịch", tn=tn, am=kq["thang_am"],
                  so=len(ds), viec=ten)
                + (L("lich.vt.tl_hd", ", trong đó {so} ngày hoàng đạo", so=so_hd) if so_hd else L("lich.vt.tl_hac", ", đều là ngày hắc đạo"))
                + ": " + "; ".join(am_(x) for x in ds) + "."
                + (L("lich.vt.tl_dep", " Đẹp nhất: {ngay} — {ly}.", ngay=am_(dep), ly=danh_sach(dep["diem_cong"]))
                   if dep and dep["diem_cong"] else ""))
               if ds else
               L("lich.vt.tl_khong", "Tháng {tn} ({am}) chưa có ngày nào đủ điều kiện tốt cho {viec} theo hoàng lịch — nên xem "
                                     "tháng kế tiếp.", tn=tn, am=kq["thang_am"], viec=ten))
    kq["tra_loi_nhanh"] = tra_loi
    kq["cach_chon"] = cach_chon(False)
    kq["hoi_dap"] = [
        {"hoi": L("lich.vt.h1", "Tháng {tn} ngày nào tốt để {viec}?", tn=tn, viec=ten), "dap": tra_loi},
        {"hoi": L("lich.vt.h2", "Chọn ngày {viec} dựa vào đâu?", viec=ten),
         "dap": kq["cach_chon"] + L("lich.vt.d2", " Ngày nào cũng nên xem thêm có xung tuổi người chủ việc không.")},
        {"hoi": L("lich.vt.h3", "Ngày tốt {viec} tháng {tn} có hợp với tuổi tôi không?", viec=ten, tn=tn),
         "dap": L("lich.vt.d3", "Bảng này chưa xét tuổi. Nhập năm sinh trong công cụ Xem ngày tốt để bỏ các ngày xung tuổi bạn.")},
    ]
    kq["luu_y"] = luu_y()
    return kq


# ------------------------------------------------------------------ đổi lịch (`/v1/lich/doi`)
def doi(kq: dict) -> dict:
    if la_viet():
        return kq
    return {**kq, **{k: lh.can_chi(kq[k]) for k in ("can_chi_nam", "can_chi_ngay", "can_chi_thang")}}

