# -*- coding: utf-8 -*-
"""BT-DC — RULES "Cách nào đúng với mình?": đối chiếu HAI cách lấy dụng thần với những năm ĐÃ QUA của người xem.

Bát tự đời sống luôn trình bày hai cách (cách 1 cân sức = phù ức + điều hậu, cách 2 theo tháng sinh = hỷ/kỵ của cách
cục) và không tự chọn. Người dùng biết rõ nhất đời mình đã qua ra sao → hỏi lại vài năm / giai đoạn mà hai cách đọc
KHÁC nhau, người dùng tự kể "khá suôn sẻ / bình thường / khá vất vả"; cách nào khớp nhiều hơn thì người dùng có thể dựa
vào cách ấy khi hai cách nói khác nhau. Hệ thống vẫn không tự chọn (`chon` luôn None).

Luật công khai:
- Năm hỏi: năm Bát tự (tính từ Lập xuân) đã qua, tuổi ≥ `TUOI_NHO_NHAT`, trong `SO_NAM_NHIN_LAI` năm gần nhất; giai
  đoạn mười năm hỏi: đã qua hẳn (`den_ngay` < ngày xem) và bắt đầu từ tuổi ≥ `TUOI_NHO_NHAT`.
- Mức từng cách chấm như đại vận / lưu niên của báo cáo (`battu_doi_song.muc_hai_cach`, can 1 + chi 2 điểm).
- Chỉ giữ chỗ hai cách KHÁC nhau; ngược hẳn (thuận ↔ cần lưu ý) đứng trước, rồi tới năm gần đây; tối đa một câu giai
  đoạn (đứng đầu nếu ngược hẳn) và tổng `SO_CAU_TOI_DA` câu. Dưới 3 câu → không hỏi (`ly_do`).
- So câu trả lời (web làm, chỉ so mã): trả lời trùng mức của cách nào thì cách ấy được một điểm; "không nhớ" bỏ qua.
  Đủ `luat.toi_thieu` câu: chênh ≥ `luat.chenh` → `ket_luan.cach_n`; chênh 1 → `nghieng_n`; bằng nhau → `chua_ro`.
Không gọi LLM, không lưu; lời ở KB `battu_doi_song_kb.json` → `doi_chieu` (nháp AI).
"""
from __future__ import annotations

import datetime as dt

from app import config
from app.calc import battu_mo_rong as mr_calc
from app.kb import battu_doi_song_kb as kb
from app.luangiai import battu_doi_song as bt

PHIEN_BAN = "doi_chieu_cach_1"
TUOI_NHO_NHAT = 16
SO_NAM_NHIN_LAI = 15
SO_CAU_TOI_DA = 5
LUAT = {"toi_thieu": 3, "chenh": 2}
LUA_CHON = ("thuan", "can_bang", "can_chu_dong", "khong_nho")
_LUA_CHON_MAC_DINH = {"thuan": "Khá suôn sẻ", "can_bang": "Bình thường", "can_chu_dong": "Khá vất vả",
                      "khong_nho": "Không nhớ rõ"}
_MAC_DINH = {
    "hoi_nam": "Nhìn lại năm {nam} (khi bạn {tuoi} tuổi), nhìn chung đó là một năm…",
    "hoi_van": "Nhìn lại quãng {tu_tuoi}–{den_tuoi} tuổi (từ {tu} đến {den}), nhìn chung đó là quãng…",
}
_CACH_MAC_DINH = {"cach_1": {"ten": "Cách cân sức", "mo_ta": "Bù chỗ thiếu theo sức tự thân: hợp thêm {hanh}."},
                  "cach_2": {"ten": "Cách theo tháng sinh", "mo_ta": "Nuôi khuôn của tháng sinh: hợp thêm {hanh}."}}
_KET_LUAN_MAC_DINH = {
    "cach_1": "Những năm bạn kể khớp với cách cân sức rõ hơn.",
    "cach_2": "Những năm bạn kể khớp với cách theo tháng sinh rõ hơn.",
    "nghieng_1": "Hơi nghiêng về cách cân sức, nhưng chưa rõ hẳn.",
    "nghieng_2": "Hơi nghiêng về cách theo tháng sinh, nhưng chưa rõ hẳn.",
    "chua_ro": "Hai cách khớp ngang nhau với những năm bạn kể.",
}
_LY_DO_MAC_DINH = {"it_nam_qua": "Bạn còn ít năm đã qua để đối chiếu.",
                   "hai_cach_trung": "Ở những năm đã qua, hai cách đọc gần như nói giống nhau."}
_TEN_CU = {"cach_1": "cách cân sức", "cach_2": "cách theo tháng sinh"}


def _chu(*khoa: str, mac: str) -> str:
    x = kb.doi_chieu(*khoa)
    return x if isinstance(x, str) else mac


def _nguoc(m1: str, m2: str) -> int:
    return 2 if {m1, m2} == {"thuan", "can_chu_dong"} else 1


def _cu(nhan: str, m1: str, m2: str) -> list[str]:
    return [f"{nhan}: {_TEN_CU['cach_1']} → {kb.nhan_muc(m1)}; {_TEN_CU['cach_2']} → {kb.nhan_muc(m2)}"]


def lap(sinh: dict, ngay_xem: dt.date | None = None) -> dict:
    """`sinh` như `battu_doi_song.lap`. → câu hỏi nhìn lại + mức từng cách + luật so + lời kết luận (KB)."""
    ngay_xem = ngay_xem or dt.datetime.now(dt.timezone(dt.timedelta(hours=7))).date()
    ls = bt._la_so(sinh)
    pt = bt.phan_tich(ls)
    tz = dt.timedelta(hours=config.CALENDAR_MERIDIAN_TZ)
    nam0 = bt._nam_bat_tu(dt.datetime(ngay_xem.year, ngay_xem.month, ngay_xem.day, 12) - tz)
    nam_sinh = sinh["lich"].year

    ung_nam = []
    for nam in range(max(nam_sinh + TUOI_NHO_NHAT, nam0 - SO_NAM_NHIN_LAI), nam0):
        ln = mr_calc.luu_nien(ls, nam)
        m1, m2, _ = bt.muc_hai_cach(pt, ln["can"], ln["chi"])
        if m1 == m2:
            continue
        tuoi = nam - nam_sinh
        ung_nam.append({"ma": f"nam.{nam}", "loai": "nam", "nam": nam, "tuoi": tuoi, "nhan": f"Năm {nam}",
                        "hoi": _chu("hoi_nam", mac=_MAC_DINH["hoi_nam"]).format(nam=nam, tuoi=tuoi),
                        "cach_1": m1, "cach_2": m2,
                        "can_cu": _cu(f"Năm {nam} {ln['can']} {ln['chi']} ({ln['thap_than']})", m1, m2)})
    ung_van = []
    for g in bt.thoi_gian_bieu(pt, ngay_xem):
        if g["den_ngay"] >= ngay_xem.isoformat() or g["tu_tuoi"] < TUOI_NHO_NHAT:
            continue
        m1, m2 = g["muc_cach_1"], g["muc_cach_2"]
        if m1 == m2:
            continue
        tu, den = bt._thang_nam(g["tu_ngay"]), bt._thang_nam(g["den_ngay"])
        ung_van.append({"ma": f"van.{g['tu_ngay'][:4]}", "loai": "van", "tu_tuoi": g["tu_tuoi"],
                        "den_tuoi": g["den_tuoi"], "tu_ngay": g["tu_ngay"], "den_ngay": g["den_ngay"],
                        "nhan": f"Quãng {g['tu_tuoi']}–{g['den_tuoi']} tuổi",
                        "hoi": _chu("hoi_van", mac=_MAC_DINH["hoi_van"]).format(
                            tu_tuoi=g["tu_tuoi"], den_tuoi=g["den_tuoi"], tu=tu, den=den),
                        "cach_1": m1, "cach_2": m2,
                        "can_cu": _cu(f"Đại vận {g['cung']} ({g['thap_than']}), {tu}–{den}", m1, m2)})

    ung_nam.sort(key=lambda c: (-_nguoc(c["cach_1"], c["cach_2"]), -c["nam"]))
    ung_van.sort(key=lambda c: (-_nguoc(c["cach_1"], c["cach_2"]), -int(c["tu_ngay"][:4])))
    cau = ung_nam[:SO_CAU_TOI_DA]
    if ung_van:
        cau = sorted([ung_van[0], *ung_nam[:SO_CAU_TOI_DA - 1]],
                     key=lambda c: -_nguoc(c["cach_1"], c["cach_2"]))       # sort ổn định: giai đoạn trước năm cùng hạng
    ly_do = None
    if len(cau) < LUAT["toi_thieu"]:
        so_nam_qua = nam0 - max(nam_sinh + TUOI_NHO_NHAT, nam0 - SO_NAM_NHIN_LAI)
        ly_do = "it_nam_qua" if so_nam_qua < 6 else "hai_cach_trung"
        cau = []

    cach = {}
    for c in ("cach_1", "cach_2"):
        o = kb.doi_chieu(c) or {}
        hanh = ", ".join(pt[c]["hanh"]) or "hành đang thiếu"
        cach[c] = {"ten": o.get("ten") or _CACH_MAC_DINH[c]["ten"],
                   "mo_ta": (o.get("mo_ta") or _CACH_MAC_DINH[c]["mo_ta"]).format(hanh=hanh),
                   "hanh": pt[c]["hanh"]}
    lc = kb.doi_chieu("lua_chon") or {}
    kl = kb.doi_chieu("ket_luan") or {}
    ld = kb.doi_chieu("ly_do") or {}
    return {
        "phien_ban": PHIEN_BAN, "chon": None, "co_cau_hoi": bool(cau), "ly_do": ly_do,
        "loi_ly_do": (ld.get(ly_do) or _LY_DO_MAC_DINH[ly_do]) if ly_do else None,
        "cach": cach, "cau": cau,
        "lua_chon": [{"ma": m, "nhan": lc.get(m) or _LUA_CHON_MAC_DINH[m]} for m in LUA_CHON],
        "luat": dict(LUAT),
        "ket_luan": {k: kl.get(k) or v for k, v in _KET_LUAN_MAC_DINH.items()},
        "cach_cuc": pt["cach_2"]["ma"], "than": pt["than"], "ngay_xem": ngay_xem.isoformat(), **kb.meta(),
    }
