# -*- coding: utf-8 -*-
"""Chặng 4.1 — Lập Bản đồ sao gốc (Natal Chart — `engine/app/calc/chiem_tinh_natal.py`).

Xử lý trọn vẹn:
  - Quy đổi giờ đồng hồ lúc sinh → UTC chính xác cho cả 63 tỉnh/thành Việt Nam (kể cả miền Nam UTC+8 giai đoạn 1960–1975
    qua `calc.timebase`) lẫn 33.902 thành phố quốc tế GeoNames (`gn-*` / mã vùng IANA qua `calc.mui_gio`).
  - Khuyết giờ sinh (`gio_sinh=None`): lập bản đồ Mặt Trời giữa trưa địa phương, KHÔNG an nhà/Cung Mọc giả tạo, đồng thời
    tính biên độ Mặt Trăng từ 00:00 đến 23:59 ngày sinh (`mat_trang_bien_do_ngay`) để báo rõ nếu Mặt Trăng đổi cung trong ngày.
  - Đủ giờ sinh: tính Cung Mọc (`Ascendant`), Thiên Đỉnh (`MC`), 12 nhà (`Whole Sign` hoặc `Placidus`, tự lùi an toàn về
    `Whole Sign` khi |vĩ độ| ≥ 66°), gắn nhà cho cả 13 điểm thiên văn và tính 5 góc chiếu Ptolemaic chính (0°, 60°, 90°,
    120°, 180°) kèm sai số góc (`orb`) và chiều Hội vào / Tách ra (`applying` / `separating`).
"""
from __future__ import annotations

import datetime as dt

from app.calc import chiem_tinh_lich as ctl, dia_ly, mui_gio, timebase
from app.config import Region

# Vĩ độ tỉnh lỵ 63 tỉnh/thành Việt Nam (độ Bắc) — bổ trợ cho `calc.dia_ly` vốn chỉ giữ kinh độ.
_VI_DO_VN: dict[str, float] = {
    "ha-noi": 21.03, "hai-phong": 20.86, "ha-giang": 22.82, "cao-bang": 22.67, "bac-kan": 22.15,
    "tuyen-quang": 21.82, "lao-cai": 22.48, "dien-bien": 21.39, "lai-chau": 22.40, "son-la": 21.33,
    "yen-bai": 21.71, "hoa-binh": 20.81, "thai-nguyen": 21.59, "lang-son": 21.85, "quang-ninh": 20.95,
    "bac-giang": 21.27, "phu-tho": 21.32, "vinh-phuc": 21.31, "bac-ninh": 21.19, "hai-duong": 20.94,
    "hung-yen": 20.65, "thai-binh": 20.45, "ha-nam": 20.54, "nam-dinh": 20.43, "ninh-binh": 20.25,
    "thanh-hoa": 19.81, "nghe-an": 18.67, "ha-tinh": 18.34, "quang-binh": 17.47, "quang-tri": 16.82,
    "thua-thien-hue": 16.46, "da-nang": 16.07, "quang-nam": 15.57, "quang-ngai": 15.12, "binh-dinh": 13.78,
    "phu-yen": 13.09, "khanh-hoa": 12.24, "ninh-thuan": 11.56, "binh-thuan": 10.93, "kon-tum": 14.35,
    "gia-lai": 13.98, "dak-lak": 12.67, "dak-nong": 12.00, "lam-dong": 11.94, "binh-phuoc": 11.53,
    "tay-ninh": 11.31, "binh-duong": 10.98, "dong-nai": 10.95, "ba-ria-vung-tau": 10.54,
    "tp-ho-chi-minh": 10.78, "long-an": 10.54, "tien-giang": 10.36, "ben-tre": 10.24, "tra-vinh": 9.93,
    "vinh-long": 10.25, "dong-thap": 10.46, "an-giang": 10.39, "kien-giang": 10.01, "can-tho": 10.03,
    "hau-giang": 9.78, "soc-trang": 9.60, "bac-lieu": 9.29, "ca-mau": 9.18,
}

_NGUYEN_TO_CUNG = {
    "bach_duong": "lua", "su_tu": "lua", "nhan_ma": "lua",
    "kim_nguu": "dat", "xu_nu": "dat", "ma_ket": "dat",
    "song_tu": "khi", "thien_binh": "khi", "bao_binh": "khi",
    "cu_giai": "nuoc", "bo_cap": "nuoc", "song_ngu": "nuoc",
}
_PHAM_CHAT_CUNG = {
    "bach_duong": "thong_linh", "cu_giai": "thong_linh", "thien_binh": "thong_linh", "ma_ket": "thong_linh",
    "kim_nguu": "kien_dinh", "su_tu": "kien_dinh", "bo_cap": "kien_dinh", "bao_binh": "kien_dinh",
    "song_tu": "linh_hoat", "xu_nu": "linh_hoat", "nhan_ma": "linh_hoat", "song_ngu": "linh_hoat",
}

# Bảng Phẩm giá hành tinh cổ điển (Essential Dignities — Claudius Ptolemy, Tetrabiblos I.17–19).
# CHỈ áp cho 7 thiên thể cổ điển; các thiên thể ngoài Thổ tinh, La Hầu/Kế Đô và Chiron luôn trả None.
PHAM_GIA_PTOLEMY: dict[str, dict[str, tuple[str, ...]]] = {
    "mat_troi": {"vuong_dia": ("su_tu",), "vuong_ton": ("bach_duong",), "tu_dia": ("bao_binh",), "suy_dia": ("thien_binh",)},
    "mat_trang": {"vuong_dia": ("cu_giai",), "vuong_ton": ("kim_nguu",), "tu_dia": ("ma_ket",), "suy_dia": ("bo_cap",)},
    "thuy_tinh": {"vuong_dia": ("song_tu", "xu_nu"), "vuong_ton": ("xu_nu",), "tu_dia": ("nhan_ma", "song_ngu"), "suy_dia": ("song_ngu",)},
    "kim_tinh": {"vuong_dia": ("kim_nguu", "thien_binh"), "vuong_ton": ("song_ngu",), "tu_dia": ("bo_cap", "bach_duong"), "suy_dia": ("xu_nu",)},
    "hoa_tinh": {"vuong_dia": ("bach_duong", "bo_cap"), "vuong_ton": ("ma_ket",), "tu_dia": ("thien_binh", "kim_nguu"), "suy_dia": ("cu_giai",)},
    "moc_tinh": {"vuong_dia": ("nhan_ma", "song_ngu"), "vuong_ton": ("cu_giai",), "tu_dia": ("song_tu", "xu_nu"), "suy_dia": ("ma_ket",)},
    "tho_tinh": {"vuong_dia": ("ma_ket", "bao_binh"), "vuong_ton": ("thien_binh",), "tu_dia": ("cu_giai", "su_tu"), "suy_dia": ("bach_duong",)},
}

_CUNG_THEO_NT_PC: dict[tuple[str, str], str] = {
    (_NGUYEN_TO_CUNG[c], _PHAM_CHAT_CUNG[c]): c for c in _NGUYEN_TO_CUNG
}


def tra_pham_gia_ptolemy(ma_hanh_tinh: str, ma_cung: str) -> str | None:
    """Trả mã phẩm giá cổ điển theo Ptolemy cho 7 thiên thể cổ điển; hành tinh hiện đại / nút / Chiron trả `None`."""
    bang = PHAM_GIA_PTOLEMY.get(ma_hanh_tinh)
    if not bang:
        return None
    vd = ma_cung in bang["vuong_dia"]
    vt = ma_cung in bang["vuong_ton"]
    td = ma_cung in bang["tu_dia"]
    sd = ma_cung in bang["suy_dia"]
    if vd and vt:
        return "vuong_dia_kiem_vuong_ton"
    if td and sd:
        return "tu_dia_kiem_suy_dia"
    if vd:
        return "vuong_dia"
    if vt:
        return "vuong_ton"
    if td:
        return "tu_dia"
    if sd:
        return "suy_dia"
    return None

# 5 góc chiếu Ptolemaic chính: (mã, góc chuẩn, sai số tối đa khi có Nhật/Nguyệt, sai số chuẩn hành tinh khác)
GOC_CHIEU_CHINH: tuple[tuple[str, float, float, float], ...] = (
    ("trung_hop", 0.0, 8.0, 6.0),
    ("luc_hop", 60.0, 5.5, 4.5),
    ("vuong_goc", 90.0, 7.5, 6.0),
    ("tam_hop", 120.0, 7.5, 6.0),
    ("doi_xung", 180.0, 8.0, 6.0),
)

_DIEM_TINH_GOC = (
    "mat_troi", "mat_trang", "thuy_tinh", "kim_tinh", "hoa_tinh",
    "moc_tinh", "tho_tinh", "thien_vuong", "hai_vuong", "diem_vuong",
    "la_hau", "chiron",
)


class LoiNoiSinh(ValueError):
    """Nơi sinh không tra được (mã lạ, mã GeoNames không có, múi giờ không kèm toạ độ). `ma` là mã lỗi để tầng API
    chọn lời theo ngôn ngữ; KHÔNG bao giờ lặng lẽ đổi sang Hà Nội."""

    def __init__(self, ma: str):
        super().__init__(ma)
        self.ma = ma


# Nơi mặc định khi không truyền nơi sinh và không truyền toạ độ: theo miền (giờ đồng hồ lịch sử của miền đó).
_NOI_MAC_DINH = {"north": "ha-noi", "south": "tp-ho-chi-minh"}


def _ket_qua(ngay_sinh: dt.date, hh: int, mm: int, off: float, lat: float, lon: float, ten: str, mo_ho: bool) -> dict:
    clock_dt = dt.datetime(ngay_sinh.year, ngay_sinh.month, ngay_sinh.day, hh, mm)
    return {
        "t_utc": clock_dt - dt.timedelta(hours=off),
        "vi_do": round(lat, 4),
        "kinh_do": round(lon, 4),
        "utc_offset": off,
        "ten_noi": ten,
        "tz_disputed": bool(mo_ho),
    }


def giai_toa_do_va_utc(
    ngay_sinh: dt.date,
    gio_sinh: str | None = None,
    *,
    noi_sinh: str | None = None,
    vung_vn: str = "north",
    vi_do: float | None = None,
    kinh_do: float | None = None,
    utc_lech: float | None = None,
) -> dict:
    """Quy đổi địa điểm + ngày giờ đồng hồ lúc sinh ra `(t_utc, vi_do, kinh_do, utc_offset, ten_noi, tz_disputed)`.

    Thứ tự:
      1. `noi_sinh` là mã thành phố nước ngoài (`us-san_jose`) hoặc GeoNames (`gn-5392171`): múi giờ lịch sử của
         tzdata tại đúng ngày giờ sinh (`mui_gio.tai(...)["lech_chinh_xac"]`, không làm tròn 15 phút) + toạ độ của nơi đó.
      2. `noi_sinh` là mã vùng IANA (`Europe/Paris`): múi giờ như trên, toạ độ BẮT BUỘC truyền kèm.
      3. `noi_sinh` là tỉnh/thành Việt Nam: giờ đồng hồ lịch sử theo miền (`timebase.clock_offset`, miền Nam UTC+8 …).
      4. Không có `noi_sinh` mà có toạ độ: dùng toạ độ; múi giờ = `utc_lech` nếu có, không thì giờ đồng hồ Việt Nam
         theo `vung_vn`.
      5. Không có gì: nơi mặc định theo miền (`vung_vn`: Hà Nội / TP Hồ Chí Minh).
    `vi_do` / `kinh_do` truyền kèm luôn thắng toạ độ tra được; `utc_lech` truyền kèm thắng múi giờ tra được.
    Mã nơi sinh không tra được → `LoiNoiSinh` (tầng API trả 422), không lặng lẽ đổi về Hà Nội.
    """
    hh, mm = (int(x) for x in gio_sinh.split(":")) if gio_sinh else (12, 0)
    ma = (noi_sinh or "").strip()
    co_toa_do = vi_do is not None and kinh_do is not None
    if (vi_do is None) != (kinh_do is None):
        raise LoiNoiSinh("thieu_toa_do")

    if ma:
        # 1–2. Nước ngoài: mã thành phố / GeoNames / mã vùng IANA
        tp_qt = mui_gio.thanh_pho(ma)
        zone = tp_qt["zone"] if tp_qt else (ma if mui_gio.hop_le(ma) else None)
        if zone is None and ma.startswith("gn-"):
            raise LoiNoiSinh("khong_ro_noi_sinh")
        if zone is not None:
            if tp_qt is None and not co_toa_do:
                raise LoiNoiSinh("mui_gio_can_toa_do")
            info_tz = mui_gio.tai(zone, ngay_sinh.year, ngay_sinh.month, ngay_sinh.day, hh, mm)
            off = float(utc_lech if utc_lech is not None else info_tz["lech_chinh_xac"])
            lat = float(vi_do if co_toa_do else tp_qt["vi_do"])
            lon = float(kinh_do if co_toa_do else tp_qt["kinh_do"])
            ten = tp_qt["ten"] if tp_qt else zone
            return _ket_qua(ngay_sinh, hh, mm, off, lat, lon, ten,
                            bool(info_tz.get("gio_mo_ho")) and utc_lech is None)
        # 3. Tỉnh/thành Việt Nam (mã slug hoặc tên có dấu)
        ma_vn = dia_ly._ma(ma)
        tinh = dia_ly.tra(ma_vn)
        if tinh is None:
            raise LoiNoiSinh("khong_ro_noi_sinh")
        return _theo_tinh(ngay_sinh, gio_sinh, hh, mm, tinh, ma_vn, vung_vn, vi_do, kinh_do, utc_lech)

    if co_toa_do:
        # 4. Toạ độ truyền thẳng (vd người dùng tự nhập), múi giờ truyền kèm hoặc giờ đồng hồ Việt Nam theo miền
        reg = Region.SOUTH if vung_vn == "south" else Region.NORTH
        if utc_lech is not None:
            off, mo_ho = float(utc_lech), False
        else:
            off, mo_ho = timebase.clock_offset(ngay_sinh, reg, hh if gio_sinh else None)
        return _ket_qua(ngay_sinh, hh, mm, float(off), float(vi_do), float(kinh_do), "", mo_ho)

    # 5. Nơi mặc định theo miền
    ma_vn = _NOI_MAC_DINH["south" if vung_vn == "south" else "north"]
    tinh = dia_ly.tra(ma_vn)
    return _theo_tinh(ngay_sinh, gio_sinh, hh, mm, tinh, ma_vn, vung_vn, None, None, utc_lech)


def _theo_tinh(ngay_sinh, gio_sinh, hh, mm, tinh, ma_vn, vung_vn, vi_do, kinh_do, utc_lech) -> dict:
    vung_eff = tinh["vung"] or vung_vn
    reg = Region.SOUTH if vung_eff == "south" else Region.NORTH
    if utc_lech is not None:
        off, mo_ho = float(utc_lech), False
    else:
        off, mo_ho = timebase.clock_offset(ngay_sinh, reg, hh if gio_sinh else None)
    lat = float(vi_do if vi_do is not None else _VI_DO_VN[ma_vn])
    lon = float(kinh_do if kinh_do is not None else tinh["kinh_do"])
    return _ket_qua(ngay_sinh, hh, mm, float(off), lat, lon, tinh["ten"], mo_ho)


def _khoang_goc(a: float, b: float) -> float:
    d = abs((a - b) % 360.0)
    return 360.0 - d if d > 180.0 else d


def goc_giu_ca_khoang(lon_a: tuple[float, ...], lon_b: tuple[float, ...], goc_chuan: float, orb_max: float) -> bool:
    """Góc chiếu giữ nguyên SUỐT một khoảng thời gian chưa rõ (vd ngày sinh không biết giờ)?

    `lon_a`, `lon_b` là kinh độ hai điểm ở HAI ĐẦU khoảng (1 phần tử = điểm đứng yên). Trong một ngày mỗi điểm đi gần
    như thẳng đều, nên độ lệch |khoảng cách góc − góc chuẩn| là hàm lồi theo thời gian: đủ kiểm ở các góc của khoảng."""
    return all(abs(_khoang_goc(a, b) - goc_chuan) <= orb_max for a in lon_a for b in lon_b)


def tinh_goc_chieu(
    thien_the: dict[str, dict],
    diem_them: dict[str, dict] | None = None,
    *,
    khoang_ngay: dict[str, tuple[float, ...]] | None = None,
) -> list[dict]:
    """`khoang_ngay` (khi không biết giờ sinh): {mã điểm: (kinh độ 00:00, kinh độ 23:59)} — góc chiếu dính tới các điểm
    này chỉ được giữ khi đúng SUỐT cả ngày (cùng loại góc, trong sai số cho phép ở cả hai đầu ngày)."""
    """Tính 5 góc chiếu Ptolemaic chính giữa các hành tinh (và Asc/MC nếu có giờ sinh)."""
    tap: list[tuple[str, float, float]] = [
        (ma, thien_the[ma]["kinh_do"], thien_the[ma]["toc_do_ngay"])
        for ma in _DIEM_TINH_GOC
        if ma in thien_the
    ]
    if diem_them:
        for ma_truc in ("asc", "mc"):
            if ma_truc in diem_them:
                tap.append((ma_truc, diem_them[ma_truc]["kinh_do"], 0.0))

    ket_qua: list[dict] = []
    for i in range(len(tap)):
        m1, lon1, v1 = tap[i]
        for j in range(i + 1, len(tap)):
            m2, lon2, v2 = tap[j]
            if {m1, m2} == {"asc", "mc"}:
                continue
            sep_now = _khoang_goc(lon1, lon2)
            co_nhat_nguyet = m1 in ("mat_troi", "mat_trang") or m2 in ("mat_troi", "mat_trang")
            for loai, goc_chuan, orb_nn, orb_thuong in GOC_CHIEU_CHINH:
                orb_max = orb_nn if co_nhat_nguyet else orb_thuong
                sai_so = abs(sep_now - goc_chuan)
                if sai_so <= orb_max:
                    if khoang_ngay and (m1 in khoang_ngay or m2 in khoang_ngay):
                        if not goc_giu_ca_khoang(khoang_ngay.get(m1, (lon1,)), khoang_ngay.get(m2, (lon2,)),
                                                 goc_chuan, orb_max):
                            break
                    # Kiểm chiều hội vào (applying) sau +0.1 ngày: sai số giảm → đang hội vào
                    sep_next = _khoang_goc(lon1 + v1 * 0.1, lon2 + v2 * 0.1)
                    dang_hoi_vao = abs(sep_next - goc_chuan) < sai_so
                    ket_qua.append({
                        "diem_1": m1,
                        "diem_2": m2,
                        "loai": loai,
                        "goc_chuan": int(goc_chuan),
                        "sai_so": round(sai_so, 2),
                        "dang_hoi_vao": dang_hoi_vao,
                    })
                    break
    ket_qua.sort(key=lambda x: x["sai_so"])
    return ket_qua


def lap_ban_do_natal(
    *,
    ngay_sinh: dt.date,
    gio_sinh: str | None = None,
    noi_sinh: str | None = None,
    vung_vn: str = "north",
    vi_do: float | None = None,
    kinh_do: float | None = None,
    utc_lech: float | None = None,
    he_nha: str = "whole_sign",
) -> dict:
    co_gio = bool(gio_sinh)
    td = giai_toa_do_va_utc(
        ngay_sinh,
        gio_sinh,
        noi_sinh=noi_sinh,
        vung_vn=vung_vn,
        vi_do=vi_do,
        kinh_do=kinh_do,
        utc_lech=utc_lech,
    )
    t_utc = td["t_utc"]
    thien_the = ctl.tat_ca_thien_the(t_utc)

    nha_info = None
    bien_do_trang = None
    if co_gio:
        nha_info = ctl.tinh_nha_va_truc(t_utc, td["vi_do"], td["kinh_do"], he_nha=he_nha)
        dinh_12 = [n["kinh_do"] for n in nha_info["nha"]]
        for item in thien_the.values():
            item["nha"] = ctl.nha_cua_kinh_do(item["kinh_do"], dinh_12)
        goc_chieu = tinh_goc_chieu(thien_the, {"asc": nha_info["asc"], "mc": nha_info["mc"]})
    else:
        for item in thien_the.values():
            item["nha"] = None
        # Biên độ Mặt Trăng từ 00:00 đến 23:59 giờ địa phương ngày sinh (Mặt Trăng đi ~12–15°/ngày): góc chiếu của Mặt
        # Trăng chỉ giữ khi đúng suốt cả ngày — không lấy vị trí giữa trưa (có thể lệch ±6,5°) rồi so sai số 8°.
        off = td["utc_offset"]
        t_dau = dt.datetime(ngay_sinh.year, ngay_sinh.month, ngay_sinh.day, 0, 0) - dt.timedelta(hours=off)
        t_cuoi = dt.datetime(ngay_sinh.year, ngay_sinh.month, ngay_sinh.day, 23, 59) - dt.timedelta(hours=off)
        lon_dau = ctl.kinh_do_mat_trang(t_dau)
        lon_cuoi = ctl.kinh_do_mat_trang(t_cuoi)
        goc_chieu = tinh_goc_chieu(thien_the, None, khoang_ngay={"mat_trang": (lon_dau, lon_cuoi)})
        cung_dau = ctl.CUNG_HOANG_DAO[int(lon_dau // 30.0) % 12]
        cung_cuoi = ctl.CUNG_HOANG_DAO[int(lon_cuoi // 30.0) % 12]
        bien_do_trang = {
            "kinh_do_00h": round(lon_dau, 2),
            "kinh_do_24h": round(lon_cuoi, 2),
            "cung_00h": cung_dau,
            "cung_24h": cung_cuoi,
            "doi_cung_trong_ngay": cung_dau != cung_cuoi,
        }

    # Cân bằng 4 Nguyên tố (Lửa/Đất/Khí/Nước) & 3 Phẩm chất trên 10 hành tinh chính + Ma trận 4×3 ô
    dem_nt = {"lua": 0, "dat": 0, "khi": 0, "nuoc": 0}
    dem_pc = {"thong_linh": 0, "kien_dinh": 0, "linh_hoat": 0}
    ma_tran_nt_pc: dict[str, dict[str, dict]] = {
        nt: {
            pc: {"cung": _CUNG_THEO_NT_PC[(nt, pc)], "hanh_tinh": []}
            for pc in ("thong_linh", "kien_dinh", "linh_hoat")
        }
        for nt in ("lua", "dat", "khi", "nuoc")
    }
    for ma_10 in ctl.HANH_TINH_THU_TU[:10]:
        c = thien_the[ma_10]["cung"]
        nt = _NGUYEN_TO_CUNG[c]
        pc = _PHAM_CHAT_CUNG[c]
        dem_nt[nt] += 1
        dem_pc[pc] += 1
        ma_tran_nt_pc[nt][pc]["hanh_tinh"].append(ma_10)

    for ma_ht, item in thien_the.items():
        item["pham_gia_ma"] = tra_pham_gia_ptolemy(ma_ht, item["cung"])

    return {
        "co_gio_sinh": co_gio,
        "dau_vao_da_chuan": {
            "ngay_sinh": ngay_sinh.isoformat(),
            "gio_sinh": gio_sinh,
            "ten_noi": td["ten_noi"],
            "vi_do": td["vi_do"],
            "kinh_do": td["kinh_do"],
            "utc_offset": td["utc_offset"],
            "utc_iso": t_utc.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "tz_disputed": td["tz_disputed"],
        },
        "he_nha": nha_info["he_nha_thuc_te"] if nha_info else "khong_gio_solar",
        "canh_bao_vi_do_cao": bool(nha_info["canh_bao_vi_do_cao"]) if nha_info else False,
        "truc": (
            {"asc": nha_info["asc"], "mc": nha_info["mc"], "dsc": nha_info["dsc"], "ic": nha_info["ic"]}
            if nha_info
            else None
        ),
        "nha": nha_info["nha"] if nha_info else None,
        "thien_the": thien_the,
        "mat_trang_bien_do_ngay": bien_do_trang,
        "goc_chieu": goc_chieu,
        "phan_bo_nguyen_to": dem_nt,
        "phan_bo_pham_chat": dem_pc,
        "ma_tran_nguyen_to_pham_chat": ma_tran_nt_pc,
    }
