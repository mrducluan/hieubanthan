# -*- coding: utf-8 -*-
"""Tầng RULES — đọc một bàn Kỳ Môn theo giờ thành lời dùng được: giờ này hướng nào thuận, hợp việc gì, nên chậm ở đâu.

Tất định, không LLM, không điểm số. Chỉ ĐỌC bàn của `calc.ky_mon` + cách cục của `calc.ky_mon_cach` rồi tra KB.

Luật mức của một hướng (công khai, `ky_mon_1`):
  cửa Khai / Hưu / Sinh, hướng không vướng cách nào      → thuan   (có thêm «kỳ» hoặc thế tốt → nổi bật)
  cửa Khai / Hưu / Sinh mà hướng vướng                    → binh
  cửa Đỗ / Cảnh, không vướng                              → binh    (vướng → cham)
  cửa Thương / Kinh / Tử                                  → cham
  giờ có thế «bàn đứng yên», «bàn lật ngược», «giờ can khắc ngày» → cả giờ tối đa "binh" (sách: dù có kỳ, có cửa tốt
  cũng chưa nên làm việc lớn).
Sao và thần chỉ là lời tả thêm — không đổi mức (sách xét cửa trước, rồi kỳ; «得門不得奇亦可用»)."""
from __future__ import annotations

import datetime as dt

from app.calc import ky_mon as km
from app.calc import ky_mon_cach as kc
from app.kb import chuyen_nghia as cn
from app.kb import ky_mon_kb as kb

LUAT = "ky_mon_1"
THU_TU_HUONG = (1, 8, 3, 4, 9, 2, 7, 6)          # Bắc → Đông Bắc → … theo chiều kim đồng hồ
GIO_CHAM = ("ngu_bat_ngo", "phuc_ngam", "phan_ngam")
HIEM = ("thien_don", "dia_don", "nhan_don")
_XEP = {"thuan": 0, "binh": 1, "cham": 2}


def khung_gio(chi: int) -> str:
    """Khung giờ đồng hồ của một canh (0 = Tý)."""
    dau = (chi * 2 - 1) % 24
    return f"{dau:02d}:00–{(dau + 2) % 24:02d}:00"


def _muc_huong(loai_cua: str, vuong: bool) -> str:
    if loai_cua == "cat":
        return "binh" if vuong else "thuan"
    if loai_cua == "binh":
        return "cham" if vuong else "binh"
    return "cham"


def _cach_ra(c: dict) -> dict:
    m = kb.phan("cach")[c["ma"]]
    return {"ma": c["ma"], "ten": m["ten"], "loai": c["loai"], "dieu_kien": m["dieu_kien"], "loi": m["loi"], "nen": m["nen"],
            **({"ky": c["ky"]} if c.get("ky") else {}), "sach": kb.loi_sach(m.get("sach")), "han": m.get("han")}


PHUONG = tuple(km.QUE[k][1] for k in THU_TU_HUONG)


def _kiem_huong_hop(huong_hop: list[str] | None) -> set[str]:
    hop = set(huong_hop or [])
    if hop - set(PHUONG):
        raise ValueError("huong_hop chỉ nhận tên tám hướng")
    return hop


def doc_gio(ban: dict, viec: str | None = None, huong_hop: list[str] | None = None) -> dict:
    """Bài đọc của MỘT giờ. `ban` = kết quả `ky_mon.lap_ban` (hoặc `ban_gio` kèm `can_chi`).

    `huong_hop` (KM-3): các hướng hợp mệnh của người xem theo Bát trạch (web lấy từ trang Phong thuỷ, chỉ TÊN hướng —
    không năm sinh). Chỉ đánh dấu + nói hướng nào vừa hợp mệnh vừa thuận giờ này; không đổi mức nào."""
    hop = _kiem_huong_hop(huong_hop)
    can_ngay = (ban.get("can_chi") or {}).get("ngay", "").split(" ")[0] or None
    cach = kc.nhan_dien(ban, can_ngay=can_ngay)
    cach_gio = [c for c in cach if c["pham_vi"] == "gio"]
    tran = any(c["ma"] in GIO_CHAM for c in cach_gio)
    chi_gio = ban["gio"] % 12
    ten_gio, khung = km.CHI[chi_gio], khung_gio(chi_gio)
    cua_so, sao_so, than_kb, muc_kb = kb.cua_theo_so(), kb.sao_theo_so(), kb.phan("than"), kb.phan("muc")

    huong = []
    for k in THU_TU_HUONG:
        o = ban["cung"][k]
        ma_cua, cua = cua_so[o["cua_so"]]
        ma_sao, sao = sao_so[o["sao_so"]]
        than = than_kb[o["than_ma"]]
        tai = [c for c in cach if c.get("cung") == k]
        cat, hung = [c for c in tai if c["loai"] == "cat"], [c for c in tai if c["loai"] == "hung"]
        muc = _muc_huong(cua["loai"], bool(hung))
        if tran and muc == "thuan":
            muc = "binh"
        noi_bat = muc == "thuan" and bool(cat)
        can_cu = [f"Cửa {cua['ten']} ({cua['han']}, hành {cua['hanh']}) · sao {sao['ten']} ({sao['han']}) · thần {than['ten']} ({than['han']})",
                  f"Can trên {o['thien_ban']}" + (f" (kèm {o['thien_ban_ky']})" if o.get("thien_ban_ky") else "") + f", can dưới {o['dia_ban']}"]
        if than.get("ten_khac"):
            can_cu.append(f"Có sách gọi thần này là {than['ten_khac']} khi âm độn.")
        muc_huong = {
            "cung": k, "que": o["que"], "phuong": o["phuong"], "muc": muc, "muc_nhan": muc_kb[muc], "noi_bat": noi_bat,
            "cua": {"ma": ma_cua, "ten": cua["ten"], "tom": cua["tom"], "loai": cua["loai"], "loi": cua["loi"], "nen": cua["nen"],
                    "tranh": cua["tranh"], "sach": kb.loi_sach(cua.get("sach"))},
            "sao": {"ma": ma_sao, "ten": sao["ten"], "tom": sao["tom"], "loi": sao["loi"], "bac": kb.phan("bac_sao")[sao["bac"]],
                    "kem_cam": bool(o.get("kem_cam")), "sach": kb.loi_sach(sao.get("sach"))},
            "than": {"ma": o["than_ma"], "ten": than["ten"], "tom": than["tom"], "loi": than["loi"], "sach": kb.loi_sach(than.get("sach"))},
            "ky": [x for x in (o["thien_ban"], o.get("thien_ban_ky")) if x in kc.KY],
            "cach": [_cach_ra(c) for c in cat + hung],
            "hop_viec": [] if muc == "cham" else [ma for ma, v in kb.phan("viec").items() if ma_cua in v["cua"]],
            "tom": kb.mau("huong_thuan").format(phuong=o["phuong"], cua=cua["ten"], tom=cua["tom"].lower()),
            "can_cu": can_cu,
        }
        from app.ngon_ngu import la_viet  # noqa: PLC0415
        if la_viet():
            from app.kb import tuong_hoc_dot4_kb  # noqa: PLC0415
            cd = tuong_hoc_dot4_kb.tra_cuu_don_cung(
                o["thien_ban"], o["dia_ban"], cua["ten"].replace(" Môn", ""), than["ten"], k
            )
            # Vân / Phong Độn đã nằm trong danh sách cách của hướng (calc/ky_mon_cach, cùng điều kiện) → không hiện hai lần.
            da_co = {c["ma"] for c in muc_huong["cach"]}
            cd = [x for x in cd if x["ma"] not in da_co]
            if cd:
                muc_huong["cuu_don"] = cd
        huong.append(muc_huong)

    thuan = sorted((h for h in huong if h["muc"] == "thuan"), key=lambda h: not h["noi_bat"])
    hiem = [{"ma": c["ma"], "ten": kb.phan("cach")[c["ma"]]["ten"], "phuong": km.QUE[c["cung"]][1],
             "loi": kb.mau("hiem").format(cach=kb.phan("cach")[c["ma"]]["ten"], phuong=km.QUE[c["cung"]][1])}
            for c in cach if c["ma"] in HIEM]
    if thuan:
        tom = kb.mau("tom_thuan").format(gio=ten_gio, ds=", ".join(h["phuong"] for h in thuan))
    else:
        tom = kb.mau("tom_khong").format(gio=ten_gio)
    luu_y = [kb.mau("gio_cham").format(gio=ten_gio, cach=kb.phan("cach")[c["ma"]]["ten"], loi=kb.phan("cach")[c["ma"]]["loi"])
             for c in cach_gio if c["ma"] in GIO_CHAM]
    kq = {
        "luat": LUAT,
        "gio": {"chi": ten_gio, "khung": khung, "can_chi": (ban.get("can_chi") or {}).get("gio"),
                "muc": "cham" if tran else ("thuan" if thuan else "binh")},
        "tom_tat": tom, "luu_y_gio": luu_y, "cach_gio": [_cach_ra(c) for c in cach_gio],
        "huong": huong, "huong_thuan": [h["phuong"] for h in thuan], "hiem": hiem,
        "cach_dung": kb.mau("cach_dung"), "ranh_gioi": kb.mau("ranh_gioi"),
    }
    kq["gio"]["muc_nhan"] = kb.phan("muc_gio")[kq["gio"]["muc"]]
    if huong_hop is not None:
        for h in huong:
            h["hop_menh"] = h["phuong"] in hop
        chung = [h["phuong"] for h in huong if h["hop_menh"] and h["muc"] == "thuan"]
        kq["hop_menh"] = {"chung": chung, "loi": kb.mau("hop_co").format(gio=ten_gio, ds=", ".join(chung)) if chung
                          else kb.mau("hop_khong").format(gio=ten_gio)}
    if viec:
        kq["viec"] = _doc_viec(kq, viec)
    return kq


def _chon_huong(doc: dict, viec: str) -> dict | None:
    """Hướng hợp nhất cho một việc trong bài đọc một giờ: theo thứ tự cửa ưu tiên của việc, rồi mức, rồi nổi bật."""
    uu_tien = kb.phan("viec")[viec]["cua"]
    ung = [h for h in doc["huong"] if h["cua"]["ma"] in uu_tien and h["muc"] != "cham"]
    if not ung:
        return None
    return min(ung, key=lambda h: (_XEP[h["muc"]], not h["noi_bat"], uu_tien.index(h["cua"]["ma"])))


def _chuyen_nghia(v: dict) -> dict:
    """Lời sách xưa của việc đọc cho ngày nay (kho chuyển nghĩa dùng chung): khái niệm cổ → việc đời nay của lĩnh vực."""
    lv = v.get("linh_vuc")
    ra: dict = {"chuyen_nghia": [cn.doc(ma, lv) for ma in v.get("khai_niem") or []]}
    if v.get("nguyen_tac"):
        ra["nguyen_tac"] = cn.nguyen_tac()
    return ra


def _doc_viec(doc: dict, viec: str) -> dict:
    v = kb.phan("viec")[viec]
    h = _chon_huong(doc, viec)
    g = doc["gio"]
    ra = {"ma": viec, "ten": v["ten"], "mo_ta": v["mo_ta"], "ranh_gioi": v.get("ranh_gioi"), **_chuyen_nghia(v)}
    if h is None:
        return {**ra, "co": False, "loi": kb.mau("viec_khong").format(gio=g["chi"], khung=g["khung"])}
    kem = kb.mau("kem_ky").format(ky=", ".join(h["ky"])) if h["ky"] and h["noi_bat"] else ""
    if h["muc"] == "thuan":
        loi = kb.mau("viec_co").format(dong_tu=v["dong_tu"], gio=g["chi"], khung=g["khung"], phuong=h["phuong"], cua=h["cua"]["ten"], kem=kem)
    else:
        vuong = next((c["ten"] for c in h["cach"] if c["loai"] == "hung"), None) or next((c["ten"] for c in doc["cach_gio"]), "giờ chậm")
        loi = kb.mau("viec_binh").format(gio=g["chi"], khung=g["khung"], cua=h["cua"]["ten"], phuong=h["phuong"], vuong=vuong)
    return {**ra, "co": h["muc"] == "thuan", "phuong": h["phuong"], "cung": h["cung"], "muc": h["muc"], "loi": loi}


def moc_gio(ngay: dt.date) -> list[tuple[dt.datetime, str]]:
    """13 khung giờ của một ngày đồng hồ kèm thời điểm đại diện: Tý sớm (00:00–01:00), Sửu … Hợi, Tý muộn (23:00–24:00)."""
    moc = [(dt.time(0, 30), "00:00–01:00")] + [(dt.time(h, 30), f"{h:02d}:00–{h + 2:02d}:00") for h in range(1, 23, 2)] \
        + [(dt.time(23, 30), "23:00–24:00")]
    return [(dt.datetime.combine(ngay, t), khung) for t, khung in moc]


def doc_ngay(ngay: dt.date, utc: float = 7, phep: str = "sach_bo", gio_ty: str = "da_ty", viec: str | None = None,
             huong_hop: list[str] | None = None) -> dict:
    """Mười ba khung giờ của một ngày: mức của giờ, hướng thuận, thế hiếm; có `viec` thì thêm các giờ hợp việc ấy."""
    hop = _kiem_huong_hop(huong_hop)
    gio, tot = [], []
    for t, khung in moc_gio(ngay):
        ban = km.lap_ban(t, utc=utc, phep=phep, gio_ty=gio_ty)
        d = doc_gio(ban)
        muc = {"luc": f"{t.hour:02d}:{t.minute:02d}", "chi": d["gio"]["chi"], "khung": khung,
               "can_chi": d["gio"]["can_chi"], "muc": d["gio"]["muc"], "muc_nhan": d["gio"]["muc_nhan"],
               "huong_thuan": d["huong_thuan"], "noi_bat": [h["phuong"] for h in d["huong"] if h["noi_bat"]],
               "hiem": d["hiem"], "luu_y": [c["ten"] for c in d["cach_gio"] if c["ma"] in GIO_CHAM],
               "cuc": {"am_duong": ban["am_duong"], "cuc": ban["cuc"]}}
        if viec:
            h = _chon_huong(d, viec)
            if h is not None and h["muc"] == "thuan":
                muc["viec"] = {"phuong": h["phuong"], "cua": h["cua"]["ten"], "noi_bat": h["noi_bat"], "ky": h["ky"]}
                tot.append(muc)
        if huong_hop is not None:
            muc["hop_menh"] = [p for p in d["huong_thuan"] if p in hop]
        gio.append(muc)
    kq = {"luat": LUAT, "ngay": ngay.isoformat(), "gio": gio, "cach_dung": kb.mau("cach_dung"), "ranh_gioi": kb.mau("ranh_gioi")}
    if huong_hop is not None:
        co = [g for g in gio if g["hop_menh"]]
        kq["hop_menh"] = {"gio": [g["chi"] for g in co], "loi": kb.mau("hop_ngay_co" if co else "hop_ngay_khong")}
    if viec:
        v = kb.phan("viec")[viec]
        # giờ thức (05:00–23:00) trước, trong đó giờ có «kỳ» đi cùng cửa đứng đầu; giờ đêm xếp sau
        tot.sort(key=lambda m: (not "05" <= m["luc"][:2] < "23", not m["viec"]["noi_bat"], m["luc"]))
        kq["viec"] = {"ma": viec, "ten": v["ten"], "mo_ta": v["mo_ta"], "ranh_gioi": v.get("ranh_gioi"),
                      "gio_tot": [{"chi": m["chi"], "khung": m["khung"], "luc": m["luc"], **m["viec"],
                                   "ban_dem": not "05" <= m["luc"][:2] < "23",
                                   "loi": kb.mau("viec_gio").format(
                                       gio=m["chi"], khung=m["khung"], phuong=m["viec"]["phuong"], cua=m["viec"]["cua"],
                                       kem=kb.mau("kem_ky").format(ky=", ".join(m["viec"]["ky"])) if m["viec"]["noi_bat"] and m["viec"]["ky"] else "")}
                                  for m in tot[:4]]}
        if not tot:
            kq["viec"]["loi"] = kb.mau("viec_ngay_khong")
    return kq


def danh_muc() -> dict:
    """Danh mục cho trang giải nghĩa: cửa, sao, thần, cách cục, việc — kèm câu sách theo khuôn SX-C."""
    def _ra(d: dict, khoa: tuple[str, ...]) -> list[dict]:
        return [{"ma": ma, **{k: m[k] for k in khoa if k in m}, "sach": kb.loi_sach(m.get("sach"))} for ma, m in d.items()]
    return {
        "cua": _ra(kb.phan("cua"), ("ten", "han", "hanh", "loai", "tom", "loi", "nen", "tranh")),
        "sao": _ra(kb.phan("sao"), ("ten", "han", "hanh", "tom", "loi")),
        "than": _ra(kb.phan("than"), ("ten", "han", "ten_khac", "tom", "loi")),
        "cach": [{**x, "loai": kc.CACH[x["ma"]]["loai"]} for x in _ra(kb.phan("cach"), ("ten", "han", "dieu_kien", "loi", "nen"))],
        "viec": [{"ma": ma, "ten": v["ten"], "mo_ta": v["mo_ta"], "linh_vuc": v.get("linh_vuc")} for ma, v in kb.phan("viec").items()],
        # Lời sách xưa (ra quân, giữ thành, săn bắt, dâng thư…) đọc cho đời sống ngày nay — trang giải nghĩa dựng ở máy chủ.
        "chuyen_nghia": [cn.doc(ma) for ma in cn.khai_niem()], "linh_vuc": cn.linh_vuc(),
        "sao_chung": kb.loi_sach(kb.phan("sao_chung")), "cach_dung": kb.mau("cach_dung"), "ranh_gioi": kb.mau("ranh_gioi"),
    }
