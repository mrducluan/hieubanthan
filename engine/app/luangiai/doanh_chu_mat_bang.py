# -*- coding: utf-8 -*-
"""Mặt bằng & Khai trương cho chủ cơ sở (RULES, tất định, không lưu dữ liệu) — ghép bàn Huyền Không + Bát trạch + sao năm
+ bộ chọn ngày Hoàng lịch + giờ Kỳ Môn. MỘT bộ tính: mọi phép tính lấy từ hàm có sẵn (`huyen_khong.trach_ban`,
`phongthuy.menh_quai/bang_huong`, `hoang_lich.chon_ngay`, `ky_mon.doc_ngay`); lời ở KB `doanh_chu_mat_bang_kb.json`
(+ bản phủ tiếng Anh), tên riêng qua `kb.ten`.

Quy tắc (rà soát PR #329, 2026-11-21):
- Kiêm hướng (lệch tâm sơn > 3°) → lập THẾ QUÁI như `/v1/phongthuy/huyen-khong` (một căn nhà, một bàn ở mọi trang);
  sát ranh giới hai sơn → cảnh báo không vong riêng.
- Mệnh quái theo Lập xuân (truyền ngày sinh); năm của sao lưu niên đổi ở Lập xuân; "hôm nay" theo giờ Việt Nam.
- Không rõ năm xây → KHÔNG lập bàn (không đoán vận); gợi ý theo Bát trạch + sao năm.
- Sao thuận theo vận HIỆN TẠI (`trang_thai`: vượng / sinh trước), không coi sao 8 là vượng ở Vận 9.
- Ba khu (thu ngân, chủ cơ sở, phòng họp) không trùng một phía; cửa rơi vào phía kém của mệnh chủ có lời bù (không đục sửa).
- Ngày khai trương: thứ tự của `chon_ngay` (điểm cộng), ngày vướng kiêng dân gian / nhãn tập quán xếp sau, hiện theo thời gian.
"""
from __future__ import annotations

import datetime as dt

from app import ngon_ngu
from app.calc import huyen_khong as hk
from app.calc import phongthuy as pt
from app.config import hom_nay_vn
from app.kb import ten as ten_kb
from app.kb.nap import doc, nho
from app.luangiai import hoang_lich as hl

LOAI_HINH = ("van_phong", "cua_hang", "quan_ca_phe", "xuong_kho")
DU_NIEN_TOT = ("Sinh Khí", "Thiên Y", "Diên Niên", "Phục Vị")       # thứ tự = mức hợp giảm dần
_HANG_DN = {d: 4 - i for i, d in enumerate(DU_NIEN_TOT)}
_HANG_SAO = {"vượng": 3, "sinh": 2, "thoái": 1, "suy": 0, "tử": 0}
SAO_TINH = (5, 2)                                                    # sao năm nên giữ yên
VIEC_KY_MON = "ra_mat"                                               # khai trương ≈ ra mắt, quảng bá (KB Kỳ Môn)
NGAY_TOI = 60


@nho
def kb() -> dict:
    return doc("doanh_chu_mat_bang_kb.json")


def _h(p: str) -> str:
    return ten_kb.ten("huong", p)


def _ngoai_cung(tb: dict | None) -> list[dict]:
    """Tám cung ngoài (bỏ Trung cung) theo thứ tự lộ trình — có sao sơn / hướng khi có bàn."""
    if tb:
        return [c for c in tb["cung"] if c["cung"] != "Trung cung"]
    return [{"cung": c, "phuong": hk.QUAI[c][1]} for c in hk.LO_TRINH if c != "Trung cung"]


def _chon(ngoai: list[dict], da_dung: set[str], khoa, ) -> dict:
    """Cung điểm cao nhất chưa dùng; hoà thì giữ thứ tự lộ trình (tất định)."""
    con = [c for c in ngoai if c["phuong"] not in da_dung] or ngoai
    return max(enumerate(con), key=lambda ic: (khoa(ic[1]), -ic[0]))[1]


def kiem_tra_mat_bang(do_huong: float, nam_xay: int | None, ngay_sinh: int, thang_sinh: int, nam_sinh: int,
                      gioi_tinh: str = "nam", loai_hinh: str = "van_phong", ngay_bat_dau: dt.date | None = None) -> dict:
    k = kb()
    vi = ngon_ngu.la_viet()
    tu = ngay_bat_dau or hom_nay_vn()
    nam_xem = hk.nam_theo_lap_xuan(dt.datetime(tu.year, tu.month, tu.day, 5))   # 12:00 giờ VN
    do = round(do_huong % 360.0, 1)
    s_huong = hk.son_tu_do(do)
    s_toa = hk.son_tu_do((do + 180.0) % 360.0)
    cb = s_toa["canh_bao"]
    the_quai = cb == "kiem_huong"
    tb = hk.trach_ban(nam_xay, s_toa["son"], the_quai=the_quai) if nam_xay else None
    van_nay = hk.van_cua_nam(nam_xem)
    ln = hk.luu_nien(nam_xem)["cung"]
    mq = pt.menh_quai(nam_sinh, gioi_tinh, dt.date(nam_sinh, thang_sinh, ngay_sinh))
    bh = pt.bang_huong(mq["quai"])
    huong_tot = sorted((p for p, d in bh.items() if d in _HANG_DN), key=lambda p: -_HANG_DN[bh[p]])

    ngoai = _ngoai_cung(tb)

    def hang_sao(c: dict, truc: str) -> int:
        return _HANG_SAO[hk.trang_thai(c[truc], van_nay)] if tb else 0

    def khoa(truc: str):
        # né phía sao năm 5 / 2 TRƯỚC (khu ấy được khuyên giữ yên cả năm), rồi mới tới sao của nhà, rồi hợp mệnh chủ.
        return lambda c: (ln[c["cung"]] not in SAO_TINH, hang_sao(c, truc), _HANG_DN.get(bh[c["phuong"]], 0))

    da: set[str] = set()
    chon = {}
    for ma, truc in (("thu_ngan", "huong"), ("giam_doc", "son"), ("phong_hop", "huong")):
        chon[ma] = _chon(ngoai, da, khoa(truc))
        da.add(chon[ma]["phuong"])
    tinh = [c for c in ngoai if ln[c["cung"]] in SAO_TINH]
    tinh_str = ", ".join(_h(c["phuong"]) for c in tinh) or _h("Trung tâm")

    def can_cu(c: dict) -> str:
        if tb:
            return k["can_cu"]["phi_tinh"].format(phep=k["phep"][tb["phep"]], van=tb["van"], nam_xay=nam_xay,
                                                  huong=c["huong"], son=c["son"], cung=ten_kb.ten("cung_hk", c["cung"]),
                                                  nam=nam_xem, ln=ln[c["cung"]])
        return k["can_cu"]["bat_trach"].format(phuong=_h(c["phuong"]), du_nien=ten_kb.ten("du_nien", bh[c["phuong"]]),
                                               quai=ten_kb.ten("quai", mq["quai"]), nam=nam_xem, ln=ln[c["cung"]])

    khu_vuc = []
    for ma in ("thu_ngan", "giam_doc", "phong_hop"):
        c, m = chon[ma], k["khu"][ma]
        tl = (m["thuan_loi"] if tb else m["thuan_loi_bt"]).format(
            phuong=_h(c["phuong"]), van_ten=k["van_ten"].format(van=van_nay),
            du_nien=ten_kb.ten("du_nien", bh[c["phuong"]]))
        khu_vuc.append({"ma": ma, "ten": m["ten"], "phuong_goi_y": _h(c["phuong"]), "phuong_ma": c["phuong"],
                        "muc": "thuan" if ln[c["cung"]] not in SAO_TINH else "can_bang",
                        "can_cu": can_cu(c), "thuan_loi": tl, "nen_chu_y": m["nen_chu_y"]})

    # Cửa chính — phía của độ hướng; du niên theo mệnh chủ cơ sở; sao năm tới khu cửa.
    phuong_cua = pt.huong_tu_do(do)
    c_cua = next(c for c in ngoai if c["phuong"] == phuong_cua)
    dn_cua = bh[phuong_cua]
    sao_cua = ln[c_cua["cung"]]
    kc = k["cua"]
    tot = dn_cua in _HANG_DN
    loi_sao = (kc["sao_tinh"].format(nam=nam_xem, sao=sao_cua) if sao_cua in SAO_TINH else kc["sao_thuong"])
    dn_ten = ten_kb.ten("du_nien", dn_cua)
    khu_vuc.insert(2, {
        "ma": "cua_chinh", "ten": kc["ten"], "phuong_goi_y": _h(phuong_cua), "phuong_ma": phuong_cua,
        "muc": "thuan" if tot and sao_cua not in SAO_TINH else "can_bang" if tot or sao_cua not in SAO_TINH else "can_chu_y",
        "can_cu": k["can_cu"]["cua"].format(do=do, son=ten_kb.ten("son", s_huong["son"]), du_nien=dn_ten, nam=nam_xem, ln=sao_cua),
        "thuan_loi": kc["tot"].format(phuong=_h(phuong_cua), du_nien=dn_ten) if tot else kc["bu_thuan"],
        "nen_chu_y": loi_sao if tot else " ".join((
            kc["xau"].format(phuong=_h(phuong_cua), du_nien=dn_ten),
            kc["xau_bu"].format(huong_tot=", ".join(_h(p) for p in huong_tot[:2])), loi_sao)),
    })
    mk = k["khu"]["khu_tinh"]
    khu_vuc.append({"ma": "khu_tinh", "ten": mk["ten"].format(nam=nam_xem), "phuong_goi_y": tinh_str,
                    "phuong_ma": ", ".join(c["phuong"] for c in tinh), "muc": "can_bang",
                    "can_cu": k["can_cu"]["khu_tinh"].format(nam=nam_xem, phuong=tinh_str),
                    "thuan_loi": mk["thuan_loi"].format(phuong=tinh_str, nam=nam_xem),
                    "nen_chu_y": mk["nen_chu_y"].format(phuong=tinh_str, nam=nam_xem)})

    ngay = _ngay_khai_truong(tu, nam_sinh, thang_sinh, ngay_sinh, huong_tot)

    lh = k["loai_hinh"].get(loai_hinh, k["loai_hinh"]["van_phong"])
    phan_nha = (k["phan_nha"]["co"].format(nam_xay=nam_xay, van=tb["van"], cuc=ten_kb.ten("cuc_hk", tb["cuc_ten"]))
                if tb else k["phan_nha"]["khong"])
    tong_quan = k["tong_quan"].format(
        loai=lh.lower() if vi else lh, phan_nha=phan_nha, toa=ten_kb.ten("son", s_toa["son"]),
        huong=ten_kb.ten("son", s_huong["son"]), do=do, phuong=_h(phuong_cua),
        thu_ngan=_h(chon["thu_ngan"]["phuong"]), giam_doc=_h(chon["giam_doc"]["phuong"]), tinh=tinh_str, nam=nam_xem)

    canh_bao = None
    if cb == "khong_vong":
        canh_bao = k["canh_bao"]["khong_vong"].format(do=do)
    elif cb == "kiem_huong":
        canh_bao = k["canh_bao"]["kiem_huong"].format(do=do, lech=abs(s_toa["lech"]))

    return {
        "loai_hinh": {"ma": loai_hinh, "ten": lh},
        "mat_bang": {
            "do_huong": do, "phuong_huong": _h(phuong_cua), "son_toa": s_toa["son"], "son_huong": s_huong["son"],
            "canh_bao_ma": cb, "canh_bao_kiem_huong": canh_bao,
            "co_phi_tinh": tb is not None, "khong_ro_nam_xay": None if tb else k["khong_ro_nam_xay"],
            "nam_xay": nam_xay, "van": tb["van"] if tb else None, "van_hien_tai": van_nay,
            "phep": tb["phep"] if tb else None,
            **({"the_quai_trang_thai": "chua_doi_chieu_nguyen_van"} if the_quai and tb else {}),
            "cuc_ma": tb["cuc"] if tb else None, "cuc_ten": ten_kb.ten("cuc_hk", tb["cuc_ten"]) if tb else None,
            "menh_quai": ten_kb.ten("quai", mq["quai"]), "nhom_menh": ten_kb.ten("nhom_trach", mq["nhom"]),
            "huong_tot": [_h(p) for p in huong_tot], "nam_xem": nam_xem,
        },
        "tong_quan": tong_quan,
        "danh_sach_khu_vuc": khu_vuc,
        "ngay_khai_truong": ngay["ds"],
        "ngay_cach_chon": ngay["cach_chon"],
        "ranh_gioi_phap_ly": k["ranh_gioi"],
    }


def _ngay_khai_truong(tu: dt.date, nam_sinh: int, thang_sinh: int, ngay_sinh: int, huong_tot: list[str]) -> dict:
    from app.luangiai import ky_mon  # noqa: PLC0415 — nặng (lập 13 bàn mỗi ngày), chỉ nạp khi cần

    k = kb()["ngay"]
    ra = hl.chon_ngay("khai_truong", tu, tu + dt.timedelta(days=NGAY_TOI), nam_sinh, thang_sinh, ngay_sinh)["ngay"]
    # `chon_ngay` đã xếp theo điểm cộng (hoàng đạo, trực tốt, hợp tuổi); ngày vướng kiêng dân gian / nhãn tập quán xuống sau.
    xep = sorted(enumerate(ra), key=lambda ix: (bool(ix[1].get("ky_dan_gian")), bool(ix[1].get("nhan_tap_quan")), ix[0]))
    nam = sorted((x for _, x in xep[:5]), key=lambda x: x["ngay"])
    ds = []
    for x in nam:
        d = dt.date.fromisoformat(x["ngay"])
        km = ky_mon.doc_ngay(d, viec=VIEC_KY_MON, huong_hop=huong_tot).get("viec") or {}
        gio = [g for g in km.get("gio_tot") or [] if not g.get("ban_dem")][:2]
        ds.append({
            "ngay": x["ngay"], "am": x.get("am", ""), "can_chi": x.get("can_chi", ""), "truc": x.get("truc", ""),
            "dep": bool(x.get("dep")), "hoang_dao": bool(x.get("hoang_dao")),
            "diem_cong": list(x.get("diem_cong") or []), "quan_he_tuoi": x.get("quan_he_tuoi"),
            "ky_dan_gian": list(x.get("ky_dan_gian") or []), "luu_y_ngay": list(x.get("nhan_tap_quan") or []),
            "gio_ky_mon": [{"khung": g["khung"], "chi": ten_kb.ten("chi", g["chi"]), "phuong": _h(g["phuong"])} for g in gio],
        })
    return {"ds": ds, "cach_chon": k["cach_chon"] if ds else k["khong_co"]}
