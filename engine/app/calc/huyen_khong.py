# -*- coding: utf-8 -*-
"""PT-HK — Huyền Không phi tinh: hạ quái bàn (vận bàn, sơn bàn, hướng bàn), cục, tổ hợp, lưu niên.

Tính thuần, tất định. Quy tắc phi tinh và nhận diện tổ hợp chuyển thể từ @soul-atelier/xuankong 0.3.0
(MIT, © 2026 Soul Atelier) — đồng thời là ORACLE sinh golden 216 trạch bàn (fixtures/golden/huyen_khong.json).
Thế quái (kiêm hướng, lệch tâm sơn > 3°): khẩu quyết thế tinh của Thẩm thị (Thẩm Thị Huyền Không Học,
quyển 2 — cổ thư công cộng). CHƯA có oracle độc lập cho thế quái (không gói MIT nào lập bàn thế quái) →
kết quả gắn `chua_doi_chieu_oracle`.

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
# Thế quái ca: "Tý Quý tịnh Giáp Thân, Tham Lang nhất lộ hành; Nhâm Mão Ất Mùi Khôn, ngũ vị vi Cự Môn;
# Càn Hợi Thìn Tốn Tỵ, liên Tuất Vũ Khúc danh; Dậu Tân Sửu Cấn Bính, thiên tinh thuyết Phá Quân;
# Dần Ngọ Canh Đinh thượng, Hữu Bật tứ tinh lâm."
THE_TINH = {**dict.fromkeys(["Tý", "Quý", "Giáp", "Thân"], 1), **dict.fromkeys(["Nhâm", "Mão", "Ất", "Mùi", "Khôn"], 2),
            **dict.fromkeys(["Càn", "Hợi", "Thìn", "Tốn", "Tỵ", "Tuất"], 6),
            **dict.fromkeys(["Dậu", "Tân", "Sửu", "Cấn", "Bính"], 7), **dict.fromkeys(["Dần", "Ngọ", "Canh", "Đinh"], 9)}
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
    """Độ la bàn (0 = chính Bắc) → sơn; cờ `kiem_huong` khi lệch tâm sơn > 3° (dùng thế quái), `khong_vong`
    khi sát ranh giới hai sơn (±0.5°)."""
    d = do % 360
    i = int(((d + 7.5) % 360) // 15)
    tam = (i * 15) % 360
    lech = (d - tam + 180) % 360 - 180
    cach_bien = 7.5 - abs(lech)
    cb = "khong_vong" if cach_bien <= 0.5 else "kiem_huong" if abs(lech) > 3 else None
    return {"son": SON_24[i], "do": round(d, 2), "lech": round(lech, 2), "canh_bao": cb}


def _son_goc(tam: int, nguon: dict) -> tuple[str, str]:
    """Sơn cùng nguyên với `nguon` trong quẻ gốc của số `tam` (số 5 mượn chính sơn `nguon`): (tên, âm dương)."""
    return (nguon["son"], nguon["am_duong"]) if tam == 5 else QUAI[SO_QUAI[tam]][2][nguon["nguyen"]]


def _chieu(tam: int, nguon: dict) -> bool:
    return _son_goc(tam, nguon)[1] == "+"


def _nhap_trung(tam: int, nguon: dict, the_quai: bool) -> tuple[int, bool, dict | None]:
    """Sao nhập trung + chiều bay. Thế quái: thay bằng thế tinh của sơn gốc; thuận nghịch VẪN theo âm dương
    của sơn gốc (Thẩm thị)."""
    son, ad = _son_goc(tam, nguon)
    if not the_quai:
        return tam, ad == "+", None
    return THE_TINH[son], ad == "+", {"goc": tam, "the": THE_TINH[son], "thuan": ad == "+"}


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


def trach_ban(nam_xay: int, toa: str, the_quai: bool = False) -> dict:
    """Hạ quái bàn (mặc định) hoặc thế quái bàn (`the_quai=True`, khi kiêm hướng) cho nhà xây/nhập trạch
    năm `nam_xay`, toạ sơn `toa` (một trong 24 sơn)."""
    van = van_cua_nam(nam_xay)
    t = _son(toa)
    hq = DOI[t["quai"]]
    h_ten, h_ad = QUAI[hq][2][t["nguyen"]]
    h = {"son": h_ten, "quai": hq, "phuong": QUAI[hq][1], "nguyen": t["nguyen"], "am_duong": h_ad}
    vb = phi(van, True)
    tam_s, thuan_s, the_s = _nhap_trung(vb[t["quai"]], t, the_quai)
    tam_h, thuan_h, the_h = _nhap_trung(vb[hq], h, the_quai)
    sb, hb = phi(tam_s, thuan_s), phi(tam_h, thuan_h)
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
        "phep": "the_quai" if the_quai else "ha_quai",
        **({"the_tinh": {"son": the_s, "huong": the_h}} if the_quai else {}),
        "cung": [{"cung": c, "phuong": "Trung tâm" if c == "Trung cung" else QUAI[c][1], "luoi": LUOI[c],
                  "goc": GOC[c], "van": vb[c], "son": sb[c], "huong": hb[c]} for c in LO_TRINH],
        "to_hop": _to_hop(van, cuc, hq, cung),
        "trang_thai_sao": [{"sao": n, "ten": SAO[n], "trang_thai": trang_thai(n, van)} for n in range(1, 10)],
    }


# --------------------------------------------------------------------------- PT-V3: lưu nguyệt · tổ hợp sơn–hướng · hai mệnh quái
_CHI = ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"]
_TAM_THANG_DAN = {**dict.fromkeys(["Tý", "Ngọ", "Mão", "Dậu"], 8), **dict.fromkeys(["Thìn", "Tuất", "Sửu", "Mùi"], 5),
                  **dict.fromkeys(["Dần", "Thân", "Tỵ", "Hợi"], 2)}
HANH_SAO = {1: "Thuỷ", 2: "Thổ", 3: "Mộc", 4: "Mộc", 5: "Thổ", 6: "Kim", 7: "Kim", 8: "Thổ", 9: "Hoả"}
HANH_QUAI = {"Khảm": "Thuỷ", "Khôn": "Thổ", "Chấn": "Mộc", "Tốn": "Mộc", "Càn": "Kim", "Đoài": "Kim", "Cấn": "Thổ", "Ly": "Hoả"}
SINH = {"Mộc": "Hoả", "Hoả": "Thổ", "Thổ": "Kim", "Kim": "Thuỷ", "Thuỷ": "Mộc"}
KHAC = {"Mộc": "Thổ", "Thổ": "Thuỷ", "Thuỷ": "Hoả", "Hoả": "Kim", "Kim": "Mộc"}
# Gợi ý dân gian cho hành thông quan (màu / chất liệu ở không gian chung) — ghi rõ là tập quán, không vật phẩm.
GOI_Y_HANH = {"Mộc": "màu xanh lá, đồ gỗ, cây xanh", "Hoả": "màu đỏ, cam, hồng; đèn ấm, ánh sáng", "Thổ": "màu vàng đất, nâu; gốm, đá",
              "Kim": "màu trắng, xám, ánh kim; kim loại tròn", "Thuỷ": "màu xanh dương, đen; kính, mặt nước nhỏ"}
_DONG_TU = {"Khảm", "Ly", "Chấn", "Tốn"}
_NHOM_DIEM = {"thuan": 1, "can_bang": 0, "can_chu_dong": -1}


def luu_nguyet(nam: int, thang: int) -> dict:
    """Sao tháng (lưu nguyệt): `nam` theo Lập xuân, `thang` 1..12 theo tiết (1 = tháng Dần). Năm Tý Ngọ Mão Dậu →
    tháng Dần nhập trung 8; Thìn Tuất Sửu Mùi → 5; Dần Thân Tỵ Hợi → 2; mỗi tháng lùi một (Thẩm thị, quy tắc phổ biến)."""
    if not 1 <= thang <= 12:
        raise ValueError("tháng tiết phải trong 1..12 (1 = tháng Dần)")
    chi_nam = _CHI[(nam - 4) % 12]
    tam = _w(_TAM_THANG_DAN[chi_nam] - (thang - 1))
    return {"nam": nam, "chi_nam": chi_nam, "thang": thang, "chi_thang": _CHI[(thang + 1) % 12], "tam": tam,
            "sao_tam": SAO[tam], "cung": phi(tam, True)}


def luu_nguyet_tai(ngay: dt.date) -> dict:
    """Sao tháng tại một ngày (giờ Việt Nam, lấy 12:00 trưa): tháng theo tiết khí, năm theo Lập xuân."""
    t_utc = dt.datetime(ngay.year, ngay.month, ngay.day, 12) - dt.timedelta(hours=7)
    (_, g), _ = tietkhi.tiet_bao_quanh(t_utc)
    thang = ((g - 315) % 360) // 30 + 1
    return {**luu_nguyet(nam_theo_lap_xuan(t_utc), int(thang)), "ngay": ngay.isoformat()}


def _kb_hk() -> dict:
    from app.kb import phongthuy_kb  # noqa: PLC0415
    return phongthuy_kb.huyen_khong()


def nam_chu_y(cung: str, kich_hoat: dict, tu_nam: int, so_nam: int = 10) -> dict:
    """PT-81: những năm sao lưu niên bay tới `cung` (quái Huyền Không) thuộc nhóm kích hoạt của cặp sao — `chu_dong`
    (năm nên chủ động hơn, không phải dự báo) và `thuan` (năm thuận để làm việc lớn ở phía đó). Tất định theo `luu_nien`."""
    ra = {"chu_dong": [], "thuan": []}
    cd, th = set(kich_hoat.get("chu_dong") or []), set(kich_hoat.get("thuan") or [])
    for n in range(tu_nam, tu_nam + so_nam):
        sao = luu_nien(n)["cung"].get(cung)
        if sao in cd:
            ra["chu_dong"].append(n)
        elif sao in th:
            ra["thuan"].append(n)
    return ra


def to_hop_cung(son: int, huong: int, van: int, cung: str | None = None, nam: int | None = None) -> dict:
    """Cặp sơn tinh – hướng tinh trong một cung: quan hệ ngũ hành (sơn → hướng), hợp thập, trạng thái từng sao theo vận,
    nghĩa từ KB `to_hop_81` (81 tổ hợp CÓ THỨ TỰ: sơn = người ở & sức khoẻ, hướng = tiền bạc & công việc — lĩnh vực,
    chỗ hợp, cách xử lý, sao kích hoạt), rơi về KB 45 cặp không thứ tự khi thiếu; mức thuan · can_bang · can_chu_dong.
    Có `cung` + `nam` → thêm `nam_chu_y` (năm sao lưu niên tới cung thuộc nhóm kích hoạt, 10 năm)."""
    hs, hh = HANH_SAO[son], HANH_SAO[huong]
    if hs == hh:
        qh = "ty_hoa"
    elif SINH[hs] == hh:
        qh = "son_sinh_huong"
    elif SINH[hh] == hs:
        qh = "huong_sinh_son"
    elif KHAC[hs] == hh:
        qh = "son_khac_huong"
    else:
        qh = "huong_khac_son"
    k = _kb_hk()
    m81 = k.get("to_hop_81", {}).get(f"{son}-{huong}")
    m = m81 or k.get("cap_sao", {}).get(f"{min(son, huong)}-{max(son, huong)}", {})
    sd = k.get("sao_doi_thuong", {})
    ts, th = trang_thai(son, van), trang_thai(huong, van)
    diem = _NHOM_DIEM.get(m.get("nhom", "can_bang"), 0) + (1 if th in ("vượng", "sinh") else 0)
    if any(s in (2, 5) and t in ("suy", "tử", "thoái") for s, t in ((son, ts), (huong, th))):
        diem -= 1
    muc = "thuan" if diem >= 1 else "can_chu_dong" if diem <= -1 else "can_bang"
    if m81:
        y = m81["y"]
    else:
        mau = k.get("mau_cap", "{y}")
        y = mau.format(s=son, h=huong, ten_s=sd.get(str(son), {}).get("ten", SAO[son]), ten_h=sd.get(str(huong), {}).get("ten", SAO[huong]),
                       y=m.get("y", ""))
    ra = {"ma": f"{son}-{huong}", "son": son, "huong": huong, "quan_he": qh, "hop_thap": son + huong == 10,
          "trang_thai_son": ts, "trang_thai_huong": th, "ten": m.get("ten", f"{SAO[son]} – {SAO[huong]}"), "y": y,
          "nhom_kb": m.get("nhom"), "hop_cho": m.get("hop_cho"), "luu_y": m.get("luu_y"), "muc": muc}
    if m81:
        ra["linh_vuc"] = dict(m81["linh_vuc"])
        ra["kich_hoat"] = {kk: list(v) for kk, v in m81["kich_hoat"].items()}
        if m81.get("an_toan"):
            ra["an_toan"] = list(m81["an_toan"])          # lời nhắc chăm nhà (lửa điện, nước, vật nhọn…), không doạ
        if cung and nam:
            ra["nam_chu_y"] = nam_chu_y(cung, m81["kich_hoat"], int(nam))
    # Q6 luật nước vận 9 (KB quy_tac_thuc_hanh.nuoc_van_9): chỉ đặt nước nơi HƯỚNG tinh 9; sơn tinh 9 hoặc có 5 / 2 → không.
    if van == 9:
        ra["khong_dat_nuoc"] = son == 9 or 5 in (son, huong) or 2 in (son, huong)
        ra["hop_dat_nuoc"] = huong == 9 and not ra["khong_dat_nuoc"]
    return ra


def thong_quan(quai_a: str, quai_b: str) -> dict:
    """Quan hệ ngũ hành hai mệnh quái; khi khắc nhau → hành thông quan (A khắc B: hành A sinh và sinh B)."""
    a, b = HANH_QUAI[quai_a], HANH_QUAI[quai_b]
    if a == b:
        qh, tq = "cung_hanh", None
    elif SINH[a] == b:
        qh, tq = "a_sinh_b", None
    elif SINH[b] == a:
        qh, tq = "b_sinh_a", None
    elif KHAC[a] == b:
        qh, tq = "a_khac_b", SINH[a]
    else:
        qh, tq = "b_khac_a", SINH[b]
    return {"hanh_a": a, "hanh_b": b, "quan_he": qh, "hanh_thong_quan": tq,
            "goi_y": (f"Ở không gian chung (phòng khách, phòng ngủ chung) thêm nét thuộc hành {tq}: {GOI_Y_HANH[tq]} — "
                      "tập quán dân gian để hai hành bớt chạm nhau, không phải vật phẩm.") if tq else None}


def huong_chung(quai_a: str, quai_b: str) -> list[str]:
    """Các hướng cát chung của hai mệnh quái (Bát trạch); khác nhóm Đông/Tây tứ mệnh → rỗng."""
    from app.calc import phongthuy as pt  # noqa: PLC0415
    ba, bb = pt.bang_huong(quai_a), pt.bang_huong(quai_b)
    return [h for h in pt.HUONG if ba[h] in pt.CAT and bb[h] in pt.CAT]
