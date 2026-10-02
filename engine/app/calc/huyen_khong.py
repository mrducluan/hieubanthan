# -*- coding: utf-8 -*-
"""PT-HK — Huyền Không phi tinh: hạ quái bàn (vận bàn, sơn bàn, hướng bàn), cục, tổ hợp, lưu niên.

Tính thuần, tất định. Quy tắc phi tinh và nhận diện tổ hợp chuyển thể từ @soul-atelier/xuankong 0.3.0
(MIT, © 2026 Soul Atelier) — đồng thời là ORACLE sinh golden 216 trạch bàn (fixtures/golden/huyen_khong.json).
Chưa xử lý thế quái (kiêm hướng > 3°): khi hướng sát ranh giới sơn → gắn cờ, không tự đổi bàn.

Quy ước:
- Vận tam nguyên cửu vận, mỗi vận 20 năm, Vận 1 bắt đầu 1864 (Vận 9: 2024–2043). Năm xây theo dương lịch
  (sát Lập xuân thì người dùng tự chọn năm theo tiết). Năm xem lưu niên mặc định đổi tại Lập xuân.
- Lạc thư phi thuận: Trung → Càn → Đoài → Cấn → Ly → Khảm → Khôn → Chấn → Tốn; phi nghịch: cùng lộ
  trình, số giảm dần.
- Sao nhập trung của sơn/hướng bàn: thuận/nghịch theo âm dương của sơn cùng "nguyên" trong quẻ gốc của
  số đó; số 5 mượn âm dương của chính toạ sơn / hướng sơn.
"""
from __future__ import annotations

import datetime as dt

from app.calc import tietkhi

# 8 quẻ: (số Lạc thư, phương) và 3 sơn theo thứ tự địa nguyên – thiên nguyên – nhân nguyên, kèm âm dương.
QUAI = {
    "Khảm": (1, "Bắc", [("Nhâm", "+"), ("Tý", "-"), ("Quý", "-")]),
    "Khôn": (2, "Tây Nam", [("Mùi", "-"), ("Khôn", "+"), ("Thân", "+")]),
    "Chấn": (3, "Đông", [("Giáp", "+"), ("Mão", "-"), ("Ất", "-")]),
    "Tốn": (4, "Đông Nam", [("Thìn", "-"), ("Tốn", "+"), ("Tỵ", "+")]),
    "Càn": (6, "Tây Bắc", [("Tuất", "-"), ("Càn", "+"), ("Hợi", "+")]),
    "Đoài": (7, "Tây", [("Canh", "+"), ("Dậu", "-"), ("Tân", "-")]),
    "Cấn": (8, "Đông Bắc", [("Sửu", "-"), ("Cấn", "+"), ("Dần", "+")]),
    "Ly": (9, "Nam", [("Bính", "+"), ("Ngọ", "-"), ("Đinh", "-")]),
}
SO_QUAI = {v[0]: k for k, v in QUAI.items()}
DOI = {"Khảm": "Ly", "Ly": "Khảm", "Chấn": "Đoài", "Đoài": "Chấn", "Tốn": "Càn", "Càn": "Tốn",
       "Cấn": "Khôn", "Khôn": "Cấn"}
LO_TRINH = ["Trung cung", "Càn", "Đoài", "Cấn", "Ly", "Khảm", "Khôn", "Chấn", "Tốn"]
GOC = {"Trung cung": 5, **{k: v[0] for k, v in QUAI.items()}}           # nguyên đán bàn (địa bàn)
# Vị trí 3×3 (hàng, cột) — Nam ở trên như la bàn phong thuỷ truyền thống.
LUOI = {"Tốn": (0, 0), "Ly": (0, 1), "Khôn": (0, 2), "Chấn": (1, 0), "Trung cung": (1, 1), "Đoài": (1, 2),
        "Cấn": (2, 0), "Khảm": (2, 1), "Càn": (2, 2)}

SON_24 = ["Tý", "Quý", "Sửu", "Cấn", "Dần", "Giáp", "Mão", "Ất", "Thìn", "Tốn", "Tỵ", "Bính",
          "Ngọ", "Đinh", "Mùi", "Khôn", "Thân", "Canh", "Dậu", "Tân", "Tuất", "Càn", "Hợi", "Nhâm"]
SAO = {1: "Nhất Bạch", 2: "Nhị Hắc", 3: "Tam Bích", 4: "Tứ Lục", 5: "Ngũ Hoàng", 6: "Lục Bạch",
       7: "Thất Xích", 8: "Bát Bạch", 9: "Cửu Tử"}
CUC_TEN = {"vuong_son_vuong_huong": "Vượng sơn vượng hướng", "thuong_son_ha_thuy": "Thượng sơn hạ thuỷ",
           "song_tinh_dao_huong": "Song tinh đáo hướng", "song_tinh_dao_toa": "Song tinh đáo toạ"}


def _w(n: int) -> int:
    return (n - 1) % 9 + 1


def _son(ten: str) -> dict:
    for q, (_, phuong, ds) in QUAI.items():
        for nguyen, (s, ad) in enumerate(ds):
            if s == ten:
                return {"son": s, "quai": q, "phuong": phuong, "nguyen": nguyen, "am_duong": ad}
    raise ValueError(f"Không có sơn '{ten}' trong 24 sơn")


def phi(tam: int, thuan: bool) -> dict[str, int]:
    return {c: _w(tam + i if thuan else tam - i) for i, c in enumerate(LO_TRINH)}


def van_cua_nam(nam: int) -> int:
    return (nam - 1864) // 20 % 9 + 1


def son_tu_do(do: float) -> dict:
    """Độ la bàn (0 = chính Bắc) → sơn; cờ `kiem_huong` khi cách ranh giới sơn < 3°, `khong_vong` khi
    đúng ranh giới hai sơn (±0.5°)."""
    d = do % 360
    i = int(((d + 7.5) % 360) // 15)
    tam = (i * 15) % 360
    lech = (d - tam + 180) % 360 - 180
    cach_bien = 7.5 - abs(lech)
    cb = "khong_vong" if cach_bien <= 0.5 else "kiem_huong" if cach_bien < 3 else None
    return {"son": SON_24[i], "do": round(d, 2), "lech": round(lech, 2), "canh_bao": cb}


def _chieu(tam: int, nguon: dict) -> bool:
    ad = nguon["am_duong"] if tam == 5 else QUAI[SO_QUAI[tam]][2][nguon["nguyen"]][1]
    return ad == "+"


_TB = [(1, 4, 7), (2, 5, 8), (3, 6, 9)]


def _phu_mau(ns) -> bool:
    return tuple(sorted(ns)) in _TB


def _lien_chau(ns) -> bool:
    s = set(ns)
    return len(s) == 3 and any(_w(a + 1) in s and _w(a + 2) in s for a in s)


def _to_hop(van: int, cuc: str, huong_quai: str, cung: dict) -> list[dict]:
    out: list[dict] = []
    ds = [(c, *cung[c]) for c in LO_TRINH]       # (cung, van, son, huong)
    if all(_phu_mau((v, s, h)) for _, v, s, h in ds):
        out.append({"ma": "phu_mau_tam_ban"})
    elif all(_lien_chau((v, s, h)) for _, v, s, h in ds):
        out.append({"ma": "lien_chau_tam_ban"})
    if all(s + v == 10 for _, v, s, _h in ds):
        out.append({"ma": "son_tinh_hop_thap"})
    if all(h + v == 10 for _, v, _s, h in ds):
        out.append({"ma": "huong_tinh_hop_thap"})
    for nhan, idx in (("son", 2), ("huong", 3)):
        gia = {x[0]: x[idx] for x in ds}
        if all(gia[c] == GOC[c] for c in LO_TRINH):
            out.append({"ma": f"toan_ban_phuc_ngam_{nhan}"})
        elif all(gia[c] + GOC[c] == 10 for c in LO_TRINH):
            out.append({"ma": f"toan_ban_phan_ngam_{nhan}"})
        else:
            fu = [c for c in LO_TRINH if gia[c] == GOC[c]]
            fan = [c for c in LO_TRINH if gia[c] + GOC[c] == 10]
            if fu:
                out.append({"ma": f"don_cung_phuc_ngam_{nhan}", "cung": fu})
            if fan:
                out.append({"ma": f"don_cung_phan_ngam_{nhan}", "cung": fan})
    if cung["Trung cung"][1] == van:
        out.append({"ma": "son_tinh_nhap_tu"})
    if cung["Trung cung"][2] == van:
        out.append({"ma": "huong_tinh_nhap_tu"})
    if cuc == "song_tinh_dao_huong":
        chan, gia = ["Càn", "Chấn", "Ly"], ["Khảm", "Tốn", "Đoài"]
        if huong_quai in chan and _phu_mau([cung[c][2] for c in chan]):
            out.append({"ma": "that_tinh_chan_da_kiep", "cung": chan})
        elif huong_quai in gia and _phu_mau([cung[c][2] for c in gia]):
            out.append({"ma": "that_tinh_gia_da_kiep", "cung": gia})
    return out


def trang_thai(sao: int, van: int) -> str:
    """Vượng (đương vận) · sinh (hai vận tới) · thoái (vận vừa qua) · suy (hai vận trước) · tử (còn lại)."""
    d = (sao - van) % 9
    return {0: "vượng", 1: "sinh", 2: "sinh", 8: "thoái", 7: "suy"}.get(d, "tử")


def nam_theo_lap_xuan(t_utc: dt.datetime) -> int:
    """Năm phi tinh lưu niên tại thời điểm `t_utc` (UTC, naive): đổi năm tại Lập xuân, không tại 1/1."""
    return t_utc.year if t_utc >= tietkhi.thoi_diem(t_utc.year, 315) else t_utc.year - 1


def luu_nien(nam: int) -> dict:
    tam = _w(2027 - nam)
    return {"nam": nam, "tam": tam, "sao_tam": SAO[tam], "cung": phi(tam, True)}


def trach_ban(nam_xay: int, toa: str) -> dict:
    """Hạ quái bàn cho nhà xây/nhập trạch năm `nam_xay`, toạ sơn `toa` (một trong 24 sơn)."""
    van = van_cua_nam(nam_xay)
    t = _son(toa)
    hq = DOI[t["quai"]]
    h_ten, h_ad = QUAI[hq][2][t["nguyen"]]
    h = {"son": h_ten, "quai": hq, "phuong": QUAI[hq][1], "nguyen": t["nguyen"], "am_duong": h_ad}
    vb = phi(van, True)
    sb = phi(vb[t["quai"]], _chieu(vb[t["quai"]], t))
    hb = phi(vb[hq], _chieu(vb[hq], h))
    son_toa, son_huong, huong_toa, huong_huong = sb[t["quai"]] == van, sb[hq] == van, hb[t["quai"]] == van, hb[hq] == van
    if son_toa and huong_huong:
        cuc = "vuong_son_vuong_huong"
    elif son_huong and huong_toa:
        cuc = "thuong_son_ha_thuy"
    elif son_huong and huong_huong:
        cuc = "song_tinh_dao_huong"
    else:
        cuc = "song_tinh_dao_toa"
    cung = {c: (vb[c], sb[c], hb[c]) for c in LO_TRINH}
    return {
        "nam_xay": nam_xay, "van": van, "toa": t, "huong": h, "cuc": cuc, "cuc_ten": CUC_TEN[cuc],
        "cung": [{"cung": c, "phuong": "Trung tâm" if c == "Trung cung" else QUAI[c][1], "luoi": LUOI[c],
                  "goc": GOC[c], "van": vb[c], "son": sb[c], "huong": hb[c]} for c in LO_TRINH],
        "to_hop": _to_hop(van, cuc, hq, cung),
        "trang_thai_sao": [{"sao": n, "ten": SAO[n], "trang_thai": trang_thai(n, van)} for n in range(1, 10)],
    }
