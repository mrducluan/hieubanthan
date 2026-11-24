# -*- coding: utf-8 -*-
"""GD-1 đợt 1 (2026-11-16, chủ dự án duyệt) — "Bảng nhà mình": tối đa 8 người nhà theo một năm âm lịch.

RULES tất định, chỉ GHÉP phép tính sẵn có (không công thức mới):
  - từng người: can chi năm sinh (năm âm Việt), tuổi mụ, quan hệ con giáp với năm (`tuoi_dan_gian.quan_he_chi`), Tam tai,
    sao hạn Cửu Diệu (cần giới tính), cung phi Bát trạch (cần giới tính) → MỘT việc nên làm (KB `gia_dinh_kb.nguoi`);
  - từng cặp: quan hệ con giáp hai năm sinh → điểm sáng (tam hợp / lục hợp / cùng con giáp) hoặc nên để ý (xung / hại /
    hình), lời theo nhóm quan hệ suy từ vai (vợ chồng, cha mẹ – con, ông bà – cháu, anh em, người cùng nhà);
  - cả nhà: hướng tốt chung theo cung phi (`phongthuy.bang_huong`), lối sang công cụ đã có (chọn ngày cả nhà, tuổi làm
    nhà, tuổi xông đất).
Không chấm điểm, không xếp hạng người, không ghép Bát tự chéo (không có nguồn). Người dưới 18 tuổi nhận lời cho cha mẹ.
Engine KHÔNG nhận tên người: web gửi mã ngắn `id` + vai + năm sinh (+ giới tính, ngày sinh tuỳ chọn), không lưu gì."""
from __future__ import annotations

import datetime as dt
from itertools import combinations

from app.calc import can_chi as cc
from app.calc import lunar, phongthuy as pt
from app.calc import tuoi_dan_gian as t
from app.config import CALENDAR_MERIDIAN_TZ as TZ
from app.kb import nap

TOI_DA = 8
VAI = ("ban_than", "vo_chong", "con", "bo", "me", "anh_chi", "em", "ong_ba", "chau", "bo_me_ben_kia", "con_dau_re",
       "nguoi_cung_nha")
# Thế hệ nhìn từ người dùng: để suy nhóm quan hệ của một cặp bất kỳ.
_DOI = {"ong_ba": 2, "bo": 1, "me": 1, "bo_me_ben_kia": 1, "ban_than": 0, "vo_chong": 0, "anh_chi": 0, "em": 0,
        "con": -1, "con_dau_re": -1, "chau": -2}
_THUAN = ("tam_hop", "luc_hop", "trung")
_CAN_Y = ("xung", "hai", "hinh")
_THU_TU_CAP = {"xung": 0, "tam_hop": 1, "luc_hop": 2, "hai": 3, "hinh": 4, "trung": 5}


def _kb() -> dict:
    return nap.doc("gia_dinh_kb.json")


def _nam_am(d: dt.date) -> int:
    return lunar.solar_to_lunar(d.day, d.month, d.year, TZ)[2]


def nam_am_hien_tai(hom_nay: dt.date | None = None) -> int:
    from app import config  # noqa: PLC0415
    return _nam_am(hom_nay or config.hom_nay_vn())


def nhom_cap(va: str, vb: str) -> str:
    if "nguoi_cung_nha" in (va, vb):
        return "gia_dinh"
    da, db = _DOI[va], _DOI[vb]
    if {va, vb} == {"ban_than", "vo_chong"}:
        return "vo_chong"
    if abs(da - db) == 1:
        return "cha_me_con"
    if abs(da - db) == 2:
        return "ong_chau"
    return "anh_em" if da == db else "gia_dinh"


_LON = __import__("app.config", fromlist=["x"]).TUOI_NGUOI_LON   # TUOI-16


def _duoi_18(ngay_sinh: str | None, nam_am: int, nam: int) -> bool:
    if ngay_sinh:
        from app.config import hom_nay_vn  # noqa: PLC0415
        ns, hn = dt.date.fromisoformat(ngay_sinh), hom_nay_vn()
        moc = hn if hn.year == nam else dt.date(nam, 1, 1)
        return moc.year - ns.year - ((moc.month, moc.day) < (ns.month, ns.day)) < _LON
    return (nam - nam_am) <= _LON


def _mot(p: dict, nam: int) -> dict:
    uoc = True
    nam_am = p["nam_sinh"]
    if p.get("ngay_sinh"):
        nam_am, uoc = _nam_am(dt.date.fromisoformat(p["ngay_sinh"])), False
    can, chi = t.can_chi_nam(nam_am)
    can_n, chi_n = t.can_chi_nam(nam)
    tuoi = t.tuoi_mu(nam_am, nam)
    qh = t.quan_he_chi(chi, chi_n)
    tt = t.pham_tam_tai(chi, chi_n)
    gt = p.get("gioi_tinh")
    # TUOI-1: dưới 18 tuổi TRÒN → lời cho cha mẹ. Có ngày sinh: tuổi tròn hôm nay (năm đang xem) hoặc tại 1/1 năm xem.
    # Không có ngày sinh: hiệu năm ≤ 18 vẫn tính là trẻ (chưa biết đã qua sinh nhật thứ 18 chưa — nghiêng về "trẻ").
    duoi_18 = _duoi_18(p.get("ngay_sinh"), nam_am, nam)
    cung = None
    if gt in ("nam", "nu"):
        mq = pt.menh_quai(nam_am, gt, dt.date.fromisoformat(p["ngay_sinh"]) if p.get("ngay_sinh") else None)
        cung = {"quai": mq["quai"], "nhom": mq["nhom"],
                "huong_tot": [h for h, dn in pt.bang_huong(mq["quai"]).items() if dn in pt.CAT]}
    k = _kb()["nguoi"]
    ma = "tam_tai" if tt else qh if qh in ("trung", "xung", "hinh", "hai") else "hop" if qh in ("tam_hop", "luc_hop") else "binh"
    loi = k[ma]["tre_em" if duoi_18 else "nguoi_lon"].format(n=tt or "")
    nhan = [k[ma]["ten"].format(n=tt or "")]
    if tt and qh in ("trung", "xung"):
        nhan.append(k[qh]["ten"])
    na = cc.nap_am(can, chi)
    nam_cn = nhat_chu = None
    if p.get("ngay_sinh"):
        from app.luangiai import nhip_ca_nhan  # noqa: PLC0415
        d = dt.date.fromisoformat(p["ngay_sinh"])
        nam_cn = nhip_ca_nhan._nam(d.day, d.month, nam)          # mốc 1/1 dương như trang Hôm nay (một nguồn)
        cn, chn = lunar.can_chi_ngay(d)
        nhat_chu = {"can": cn, "chi": chn, "hanh": t.HANH_CAN[cn]}
    return {"id": p["id"], "vai": p["vai"], "nam_sinh": p["nam_sinh"], "nam_am": nam_am, "chi_nam_sinh_uoc_luong": uoc,
            "can": can, "nap_am": {"ten": na["ten"], "hanh": na["hanh"]}, "nam_ca_nhan": nam_cn, "nhat_chu": nhat_chu,
            "can_chi": f"{can} {chi}", "con_giap": chi, "tuoi_mu": tuoi, "duoi_18": duoi_18,
            "quan_he_nam": qh or "binh", "tam_tai": tt, "ma": ma, "nhan": nhan, "viec": loi,
            "sao_han": t.sao_han(tuoi, gt) if gt in ("nam", "nu") else None, "cung_phi": cung,
            "can_cu": f"Tuổi {can} {chi} – năm {can_n} {chi_n}; tuổi mụ {tuoi}" + (f"; Tam tai năm thứ {tt}" if tt else "")}


_QH_HN = {"vo_chong": "vo_chong", "cha_me_con": "cha_me_con", "ong_chau": "gia_dinh", "anh_em": "gia_dinh",
          "gia_dinh": "gia_dinh"}
_MUC_HN = {"hop": "thuan", "binh_hoa": "binh", "can_dung_hoa": "de_y"}
_THU_TU_NHIP = {"de_y": 0, "hai_mat": 1, "thuan": 2, "binh": 3}


def _lop_hn(ma: str, ty: int, qh_hn: str, can_cu: str) -> dict:
    """Một lớp năm sinh: mức theo đúng ngưỡng của Xem lá số 2 người, lời lấy ở kho của nó (một nguồn) — KHÔNG lấy điểm."""
    from app.luangiai import tuvi_hai_nguoi as hn  # noqa: PLC0415
    ket = hn._ket_luan(ty)
    y, nen = hn._loi(ma, ket, qh_hn)
    return {"ma": ma, "ten": _kb()["lop"]["ten"][ma], "muc": _MUC_HN[ket], "y": y, "nen": nen, "can_cu": can_cu}


def _lop_tru_ngay(a: dict, b: dict) -> dict:
    k = _kb()["lop"]
    ca, cb = a["nhat_chu"], b["nhat_chu"]
    can_hop = frozenset((ca["can"], cb["can"])) in t.NGU_HOP_CAN
    qh = t.quan_he_chi(ca["chi"], cb["chi"])
    thuan, trai = can_hop or qh in ("tam_hop", "luc_hop"), qh in _CAN_Y
    muc = "hai_mat" if thuan and trai else "thuan" if thuan else "de_y" if trai else "binh"
    return {"ma": "tru_ngay", "ten": k["ten"]["tru_ngay"], "muc": muc, **{x: k["tru_ngay"][muc][x] for x in ("y", "nen")},
            "can_cu": f"Trụ ngày {ca['can']} {ca['chi']} – {cb['can']} {cb['chi']}. {k['tru_ngay']['ghi_chu']}"}


def _lop_than_so(a: dict, b: dict) -> dict:
    from app.luangiai.tuan_hai_nguoi import kieu_cap  # noqa: PLC0415
    k = _kb()["lop"]
    sa, sb = a["nam_ca_nhan"]["so"], b["nam_ca_nhan"]["so"]
    kieu = kieu_cap(sa, sb)
    c = k["than_so"][kieu]
    return {"ma": "than_so", "ten": k["ten"]["than_so"], "muc": "binh", "kieu": kieu, "y": c["y"].format(a=sa, b=sb),
            "nen": c["nen"], "can_cu": f"Năm cá nhân {sa} – {sb} (thần số học, mốc 1/1 dương lịch)"}


def _lop(a: dict, b: dict, nhom: str) -> list[dict]:
    from app.luangiai import tuvi_hai_nguoi as hn  # noqa: PLC0415
    qh_hn = _QH_HN[nhom]
    can_a, chi_a, can_b, chi_b = a["can"], a["con_giap"], b["can"], b["con_giap"]
    ra = [_lop_hn("chi", hn._chi(chi_a, chi_b)["ty"], qh_hn, f"Con giáp {chi_a} – {chi_b}"),
          _lop_hn("menh", hn._menh(can_a, chi_a, can_b, chi_b)["ty"], qh_hn,
                  f"Nạp âm {a['nap_am']['ten']} ({a['nap_am']['hanh']}) – {b['nap_am']['ten']} ({b['nap_am']['hanh']})"),
          _lop_hn("can", hn._can(can_a, can_b)["ty"], qh_hn, f"Can năm {can_a} – {can_b}")]
    if a["cung_phi"] and b["cung_phi"]:
        qa, qb = a["cung_phi"]["quai"], b["cung_phi"]["quai"]
        dn = pt.bang_huong(qa)[pt.QUAI[qb][1]]
        ra.append(_lop_hn("cung_phi", hn._ty4(hn.TY_CUNG_PHI[dn]), qh_hn, f"Cung phi {qa} – {qb}: {dn}"))
    if a["nhat_chu"] and b["nhat_chu"]:
        ra.append(_lop_tru_ngay(a, b))
    if a["nam_ca_nhan"] and b["nam_ca_nhan"]:
        ra.append(_lop_than_so(a, b))
    return ra


def _cap(ds: list[dict]) -> list[dict]:
    """GD-2: mỗi cặp xem theo NHIỀU lớp (con giáp, bản mệnh nạp âm, can năm, cung phi; đủ ngày sinh thêm trụ ngày + nhịp
    năm thần số). Nhịp chung = đếm lớp thuận / lớp báo trái nhịp (không điểm số). Hiện: mọi cặp có người dùng + cặp khác
    có ít nhất một lớp không bình thường."""
    k = _kb()
    ra = []
    for a, b in combinations(ds, 2):
        nhom = nhom_cap(a["vai"], b["vai"])
        lop = _lop(a, b, nhom)
        xet = [x for x in lop if x["ma"] != "than_so"]
        th = sum(x["muc"] == "thuan" for x in xet)
        dy = sum(x["muc"] == "de_y" for x in xet)
        hm = sum(x["muc"] == "hai_mat" for x in xet)
        # Luật gộp (đo 2.500 cặp năm sinh: thuận ~21 %, hai mặt ~48 %, dễ trái nhịp ~30 % — không nhãn nào quá 60 %):
        # thuận = không lớp nào trái, hoặc ≥ 2 lớp thuận và chỉ 1 lớp trái; dễ trái nhịp = ≥ 3 lớp trái, hoặc ≥ 2 lớp trái
        # mà không lớp nào thuận; còn lại là hai mặt.
        if not (th or dy or hm):
            nhip = "binh"
        elif dy == 0 and th and not hm or (th >= 2 and th > dy and dy <= 1 and not hm):
            nhip = "thuan"
        elif dy >= 3 or (th == 0 and dy >= 2):
            nhip = "de_y"
        else:
            nhip = "hai_mat"
        co_ban = "ban_than" in (a["vai"], b["vai"])
        if nhip == "binh" and not co_ban:
            continue
        qh = t.quan_he_chi(a["con_giap"], b["con_giap"])
        loai = {"thuan": "diem_sang", "de_y": "nen_de_y"}.get(nhip, nhip)
        # con giáp vẫn là lớp người đọc quen nhất: xung / hại / hình luôn được nhắc, tam hợp / lục hợp là điểm sáng
        if qh in _CAN_Y and nhip == "thuan":
            nhip, loai = "hai_mat", "hai_mat"
        nk = k["nhip_cap"]["thuan_1" if nhip == "thuan" and dy else nhip]
        viec_lop = next((x["nen"] for x in lop if x["muc"] == "de_y"), None) or next((x["nen"] for x in lop if x["muc"] == "thuan"), None)
        # QC: cặp có trẻ dưới 18 không nhận lời "làm ăn chung"; hai trẻ với nhau thì việc nên làm là lời cho cha mẹ.
        co_tre, hai_tre = a["duoi_18"] or b["duoi_18"], a["duoi_18"] and b["duoi_18"]
        mang = [m for m in k["mang_cap"][nhom].get(nhip, []) if not (co_tre and m["mang"] == "Làm ăn chung")]
        if hai_tre:
            viec_lop = k["viec"]["hai_tre"]["nen_de_y" if nhip in ("de_y", "hai_mat") else "diem_sang"]
            mang = []
        ra.append({"a": a["id"], "b": b["id"], "quan_he": qh, "loai": loai, "nhip": nhip, "nhom": nhom,
                   "tieu_de": k["cap"][qh]["tieu_de"] if (qh in _THUAN and nhip == "thuan") or (qh in _CAN_Y and nhip == "de_y") else nk["tieu_de"],
                   "noi_dung": nk["noi_dung"].format(t=th, d=dy + hm, n=len(xet)),
                   "viec": viec_lop or k["viec"][nhom]["nen_de_y" if nhip in ("de_y", "hai_mat") else "diem_sang"],
                   "lop": lop, "mang": mang,
                   "so_lop": {"thuan": th, "de_y": dy + hm, "tong": len(xet)},
                   "can_cu": "; ".join(x["can_cu"] for x in lop)})
    ra.sort(key=lambda c: (0 if "ban_than" in (_vai(ds, c["a"]), _vai(ds, c["b"])) else 1, _THU_TU_NHIP[c["nhip"]]))
    return ra


def _vai(ds: list[dict], i: str) -> str:
    return next(x["vai"] for x in ds if x["id"] == i)


def _huong(ds: list[dict]) -> dict:
    k = _kb()["huong"]
    co = [x for x in ds if x["cung_phi"]]
    nhom: dict[str, list[str]] = {}
    for x in co:
        nhom.setdefault(x["cung_phi"]["nhom"], []).append(x["id"])
    if not co:
        return {"chung": [], "nhom": nhom, "loi": k["thieu"]}
    chung = [h for h in pt.HUONG if all(h in x["cung_phi"]["huong_tot"] for x in co)]
    loi = k["chung"].format(ds=", ".join(chung)) if chung else k["hai_nhom"]
    if len(co) < len(ds):
        loi += " " + k["thieu"]
    return {"chung": chung, "nhom": nhom, "loi": loi}


def _tom_tat(ds: list[dict]) -> dict:
    k = _kb()["tom_tat"]
    muc = []
    for ma, loc in (("tam_tai", lambda x: x["tam_tai"]), ("trung", lambda x: x["quan_he_nam"] == "trung"),
                    ("xung", lambda x: x["quan_he_nam"] == "xung"), ("hop", lambda x: x["quan_he_nam"] in ("tam_hop", "luc_hop"))):
        ids = [x["id"] for x in ds if loc(x)]
        if ids:
            muc.append({"ma": ma, "so": len(ids), "ids": ids, "chu": k[ma].format(so=len(ids))})
    return {"muc": muc}


def _viec_chung(ds: list[dict], nam: int) -> list[dict]:
    k = _kb()["viec_chung"]
    ra = [{"ma": "chon_ngay", "ten": k["chon_ngay"]["ten"], "mo_ta": k["chon_ngay"]["mo_ta"], "duong": "/xem-ngay-tot#chon-ngay-nhieu"}]
    nguoi_lon = sorted((x for x in ds if not x["duoi_18"]), key=lambda x: (x["vai"] not in ("ban_than", "vo_chong"), x["vai"] != "ban_than"))
    for x in nguoi_lon[:2]:
        ra.append({"ma": "lam_nha", "id": x["id"], "ten": k["lam_nha"]["ten"].format(nam=nam), "mo_ta": k["lam_nha"]["mo_ta"],
                   "duong": f"/xem-tuoi-lam-nha/{nam}/tuoi-{x['nam_am']}"})
    chu = next((x for x in ds if x["vai"] == "ban_than"), nguoi_lon[0] if nguoi_lon else None)
    if chu and not chu["duoi_18"]:
        ra.append({"ma": "xong_dat", "id": chu["id"], "ten": k["xong_dat"]["ten"].format(nam=nam), "mo_ta": k["xong_dat"]["mo_ta"],
                   "duong": f"/tuoi-xong-dat/{nam}/tuoi-{chu['nam_am']}"})
    return ra


def _lich_nha(ds: list[dict], nam: int) -> dict:
    """Năm năm tới của cả nhà: ai Tam tai, ai năm tuổi, ai xung với năm (tập quán) — để xếp việc lớn."""
    k = _kb()["lich_nha"]
    hang = []
    for y in range(nam, nam + 5):
        can_y, chi_y = t.can_chi_nam(y)
        muc = []
        for x in ds:
            tt = t.pham_tam_tai(x["con_giap"], chi_y)
            qh = t.quan_he_chi(x["con_giap"], chi_y)
            lon = (y - x["nam_am"]) > _LON   # TUOI-1: không biết đã qua sinh nhật 18 chưa → chưa tính là người lớn
            if tt:
                muc.append({"id": x["id"], "ma": "tam_tai", "nhan": k["nhan"]["tam_tai"].format(n=tt), "nguoi_lon": lon})
            if qh in ("trung", "xung"):
                muc.append({"id": x["id"], "ma": qh, "nhan": k["nhan"][qh], "nguoi_lon": lon})
        hang.append({"nam": y, "can_chi": f"{can_y} {chi_y}", "muc": muc,
                     "so_nguoi_lon": len({m["id"] for m in muc if m["nguoi_lon"]})})
    it = min(r["so_nguoi_lon"] for r in hang)
    co_lon = any((nam - x["nam_am"]) > _LON for x in ds)
    nhe = next((r for r in hang if r["so_nguoi_lon"] == it), None) if co_lon and it == 0 else None
    return {"nam": hang, "nam_nhe": nhe["nam"] if nhe else None,
            "goi_y": k["nhe"].format(nam=nhe["nam"], cc=nhe["can_chi"]) if nhe else k["deu"], "ghi_chu": k["ghi_chu"]}


_CHUONG_NHA = ("gia_dinh", "tinh_cam", "su_nghiep", "tien_bac")
_QH_VAI = {"vo_chong": "vo_chong", "con": "cha_me_con", "bo": "cha_me_con", "me": "cha_me_con", "bo_me_ben_kia": "cha_me_con",
           "con_dau_re": "cha_me_con", "ong_ba": "cha_me_con", "chau": "cha_me_con"}


def la_so_cua_ban(tv_sinh: dict, bt_sinh: dict, ds: list[dict], ngay_xem: dt.date) -> dict:
    """GD-2: lá số theo ngày giờ sinh của NGƯỜI DÙNG nhìn về nhà mình — chỉ ĐỌC báo cáo đời sống đã chấm (một bộ tính,
    mượn mức + tóm tắt + ≤ 2 hộp như hỏi đáp) và đường tứ hoá theo can năm sinh từng người nhà vào lá của bạn (đúng hàm
    của Xem lá số 2 người). Không điểm số."""
    from app.calc import tuvi_an_sao  # noqa: PLC0415
    from app.hoidap import doi_song_muc as dsm  # noqa: PLC0415
    from app.hoidap.tuvi import tom_tat  # noqa: PLC0415
    from app.luangiai import battu_doi_song as bds  # noqa: PLC0415
    from app.luangiai import tuvi_doi_song as tds  # noqa: PLC0415
    from app.luangiai import tuvi_hai_nguoi as hn  # noqa: PLC0415
    from app.luangiai import tuvi_hop_tham as ht  # noqa: PLC0415

    def mang(bc: dict) -> list[dict]:
        ra = []
        for ch in _CHUONG_NHA:
            m = dsm.muc_doi_song(bc, ch)
            if m:
                ra.append({"chuong": ch, "ten_mang": m["ten_mang"], "muc": m["muc"], "nhan_muc": m["nhan_muc"],
                           "tom_tat": m["tom_tat"],
                           "hop": [{x: h[x] for x in ("loai", "tieu_de", "noi_dung", "huong_xu_ly") if h.get(x)} for h in m["hop"]]})
        return ra

    tv = tds.lap(tv_sinh, ngay_xem)
    bt = bds.lap(bt_sinh, ngay_xem)
    la = tuvi_an_sao.an_sao_tho(tv_sinh["ngay"], tv_sinh["ti"], tv_sinh["gioi_tinh"], "vi-VN", tz_lich=tv_sinh["tz_lich"],
                                hoa_linh=tv_sinh["hoa_linh"], thang_nhuan=tv_sinh["thang_nhuan"], lich=tv_sinh["lich"])
    cung = tom_tat(la)["cung"]
    nguoi_nha = []
    for x in ds:
        if x["vai"] == "ban_than":
            continue
        trong = hn.CUNG_TRONG_TAM[_QH_VAI.get(x["vai"], "gia_dinh")]
        duong = ht._duong(x["can"], cung, "người kia", True)
        chon = sorted((d for d in duong if d["den_cung"] in trong), key=lambda d: -trong[d["den_cung"]])
        if not chon:
            chon = [d for d in duong if d["hoa"] in ("Lộc", "Kỵ")]
        nguoi_nha.append({"id": x["id"], "dong": [{"hoa": d["hoa"], "cung": d["den_cung"], "nghia": d["nghia"],
                                                   "trong_tam": d["den_cung"] in trong} for d in chon[:3]]})
    k = _kb()["la_so"]
    return {"dan": k["dan"], "tieu_de_nguoi_nha": k["nguoi_nha"], "tuvi": {"mang": mang(tv)}, "battu": {"mang": mang(bt)},
            "nguoi_nha": nguoi_nha}


def bang(nam: int, nguoi: list[dict], la_so: dict | None = None) -> dict:
    """`la_so` = {"tv_sinh", "bt_sinh", "ngay_xem"} của người dùng (vai `ban_than`) — có thì thêm `la_so_cua_ban`."""
    if not 1 <= len(nguoi) <= TOI_DA:
        raise ValueError(f"Cần từ 1 đến {TOI_DA} người")
    if sum(p["vai"] == "ban_than" for p in nguoi) > 1 or sum(p["vai"] == "vo_chong" for p in nguoi) > 1:
        raise ValueError("Chỉ một người cho vai bạn / vợ chồng")
    if len({p["id"] for p in nguoi}) != len(nguoi):
        raise ValueError("Mã người bị trùng")
    if any(p["vai"] not in VAI for p in nguoi):
        raise ValueError("Vai không có trong danh mục")
    if la_so and not any(p["vai"] == "ban_than" for p in nguoi):
        raise ValueError("Cần có người dùng (vai bạn) khi gửi lá số")
    ds = [_mot(p, nam) for p in nguoi]
    rieng = la_so_cua_ban(la_so["tv_sinh"], la_so["bt_sinh"], ds, la_so["ngay_xem"]) if la_so else None
    can, chi = t.can_chi_nam(nam)
    return {"nam": {"nam": nam, "can_chi": f"{can} {chi}"}, "nguoi": ds, "cap": _cap(ds), "huong": _huong(ds),
            "tom_tat": _tom_tat(ds), "lich_nha": _lich_nha(ds, nam), "la_so_cua_ban": rieng,
            "la_so_goi_y": None if la_so else _kb()["la_so"]["thieu_gio"], "viec_chung": _viec_chung(ds, nam), "luu_y": _kb()["luu_y"]}
