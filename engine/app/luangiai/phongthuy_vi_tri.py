# -*- coding: utf-8 -*-
"""RULES — VT-1 "Đứng giữa nhà, chĩa điện thoại" (+ khung nhà theo tỉ lệ khi không có la bàn), nhiều tầng.

Một lần đo nuôi ba phép, đều là hàm có sẵn (một bộ tính):
* vị trí từng vật: `calc.vi_tri_vat.vi_tri` (phương 8 quái, sơn, sát ranh);
* Cửa – Chủ – Bếp từng tầng: `luangiai.phongthuy_tam_yeu.so_do` (khuôn SX-C, cổng 18 tuổi, lời tham khảo);
* du niên với mệnh người xem: `calc.phongthuy.du_nien`; sao Huyền Không của đúng phương: `calc.huyen_khong.trach_ban`.
Tầng trệt: "cửa" = cửa chính. Tầng trên: "cửa" = đầu cầu thang dẫn lên tầng — quy ước hiện đại, sách xưa chưa nói (ghi rõ).
Nhiễu từ: số đo trong nhà trừ phần lệch giữa trục đo dọc tường và trục nhà (hướng nhà + k·90°); lệch quá lớn → không tự sửa.
"""
from __future__ import annotations

from app import ngon_ngu
from app.calc import huyen_khong as hk
from app.calc import phongthuy as pt
from app.calc import vi_tri_vat as vt
from app.kb import nap
from app.kb import ten as _ten
from app.luangiai import phongthuy_tam_yeu as ty

LOAI = ("cua_chinh", "phong_ngu_chinh", "bep", "ve_sinh", "ban_tho", "cau_thang")


def _kb() -> dict:
    return nap.doc("phongthuy_tam_yeu.json")["vi_tri"]


def _lech(huong_nha_do: float | None, truc_do: float | None) -> dict:
    k = _kb()["lech"]
    if huong_nha_do is None:
        return {"do": None, "ap_dung": False, "nhieu_manh": False, "loi": k["chua_huong"]}
    if truc_do is None:
        return {"do": None, "ap_dung": False, "nhieu_manh": False, "loi": k["chua_truc"]}
    d = vt.lech_truc(truc_do, huong_nha_do)
    manh = abs(d) > vt.NGUONG_LECH_TRUC
    return {"do": round(d, 2), "ap_dung": not manh, "nhieu_manh": manh,
            "loi": (k["nhieu"] if manh else k["ap_dung"]).format(do=f"{round(abs(d), 1):g}")}


def _vat(v: dict, lech: dict, huong_nha_do: float | None, khung: dict | None, mq: str | None, ban: dict | None) -> dict:
    kb = _kb()
    cb: list[str] = []
    if v.get("diem") is not None:
        do_do = vt.do_tu_khung(khung["rong"], khung["sau"], v["diem"][0], v["diem"][1], huong_nha_do, khung.get("luoi"))
        do, nguon, lech_mau = do_do, "khung", 0.0
    else:
        do_do, lech_mau = vt.trung_binh_goc(v["mau"])
        do = vt.sua_do(do_do, lech["do"]) if lech["ap_dung"] else do_do
        nguon = "la_ban"
        if lech_mau > vt.NGUONG_DAO_DONG or (v.get("sai_so") or 0) > 20:
            cb.append(kb["canh_bao"]["chua_on_dinh"])
    vi = vt.vi_tri(do)
    if vi["sat_ranh_8"]:
        cb.append(kb["canh_bao"]["sat_ranh_8"].format(a=_ten.ten("huong", vi["phuong"]), b=_ten.ten("huong", vi["sat_ranh_8"])))
    if vi["sat_ranh_son"]:
        cb.append(kb["canh_bao"]["sat_ranh_son"])
    ra = {"loai": v["loai"], "ten": kb["ten"][v["loai"]], "nguon": nguon, "do_do": round(do_do, 2), **vi,
          "lech_mau": round(lech_mau, 2), "chua_on_dinh": nguon == "la_ban" and (lech_mau > vt.NGUONG_DAO_DONG or (v.get("sai_so") or 0) > 20),
          "canh_bao": cb}
    if mq:
        ra["du_nien_menh"] = pt.du_nien(mq, vi["phuong"])
    if ban:
        o = next(c for c in ban["cung"] if c["phuong"] == vi["phuong"])
        ra["sao"] = {"van": o["van"], "son": o["son"], "huong": o["huong"]}
    return ra


def phan_tich(tang: list[dict], huong_nha_do: float | None = None, truc_do: float | None = None,
              khung: dict | None = None, menh_quai: str | None = None, nam_xay: int | None = None,
              tuoi: int | None = None) -> dict:
    if khung is not None and huong_nha_do is None:
        raise ValueError("Khung nhà theo tỉ lệ cần hướng nhà để biết mặt trước quay về đâu")
    lech = _lech(huong_nha_do, truc_do)
    ban = None
    if nam_xay and huong_nha_do is not None:
        d = pt.do_huong(huong_nha_do)
        ban = hk.trach_ban(nam_xay, d["son_toa"], the_quai=d["canh_bao"] == "kiem_huong")
    kb = _kb()
    ra_tang = []
    for t in sorted(tang, key=lambda x: x["so"]):
        vat = [_vat(v, lech, huong_nha_do, khung, menh_quai, ban) for v in t["vat"]]
        theo = {v["loai"]: v for v in vat}
        cua_loai = "cua_chinh" if t["so"] == 1 else "cau_thang"
        cua, chu, bep = theo.get(cua_loai), theo.get("phong_ngu_chinh"), theo.get("bep")
        o = {"so": t["so"], "cua_tang": cua_loai, "vat": vat}
        if t["so"] > 1:
            o["ghi_chu_cua"] = kb["cua_tang"]
        if cua and (chu or bep):
            q = lambda k: theo[k]["quai"] if k in theo and theo[k]["phuong"] != "Trung cung" else None  # noqa: E731
            o["tam_yeu"] = ty.so_do(cua["quai"], chu["quai"] if chu else None, bep["quai"] if bep else None, tuoi,
                                    ve_sinh=q("ve_sinh"), ban_tho=q("ban_tho"), menh=menh_quai, nhieu_tang=len(tang) > 1,
                                    cua_sat_ranh=cua.get("sat_ranh_8") if t["so"] == 1 else None)
            if t["so"] > 1:                     # tầng trên: "cửa" là đầu cầu thang — gọi đúng tên
                for c in o["tam_yeu"]["cap"]:
                    c["ten"] = kb["ten_cap_tren"].get(c["cap"], c["ten"])
        else:
            o["chua_du"] = kb["chua_du"]
        ra_tang.append(o)
    ra = {"lech": lech, "tang": ra_tang, "luu_y_tham_khao": ty._cc()["luu_y_tham_khao"]}
    if ban:
        ra["huyen_khong"] = {"van": ban["van"], "cuc": ban["cuc"], "cuc_ten": ban["cuc_ten"], "phep": ban["phep"]}
    if not ngon_ngu.la_viet():
        ra.get("huyen_khong", {}).pop("cuc_ten", None)
    return ra
