# -*- coding: utf-8 -*-
"""TR-1 — Tarot, tầng CALC. Hàm thuần, tất định (trừ `xao(None)` dùng CSPRNG như gieo quẻ Kinh Dịch):

- bộ bài 78 lá (`BO_BAI`), xáo theo hạt giống (blake2b → Fisher–Yates) hoặc `secrets`;
- phẩm giá nguyên tố theo Book T (Golden Dawn, nguyên văn "Of the Dignities"): cùng nguyên tố mạnh thêm, Lửa–Nước / Khí–Đất xung, các cặp còn lại hợp,
  (lá thiếu nguyên tố → trung tính); hai lá hai bên xung NHAU → lá giữa không bị ảnh hưởng;
- phân tích một trải bài (kề cận theo KB, sức từng lá, nguyên tố trội / thiếu, tỉ lệ ẩn chính, nhịp số 1–10, hướng nhìn);
- decan Book T → khoảng ngày dương lịch (mốc phổ biến), nhịp theo bộ / hành tinh — NHỊP GỢI Ý, không phải dự báo;
- lá ngày (băm ngày [+ ngày sinh]), lá đại diện (ngũ hình Nhân tướng × tuổi × giới tính).
Không LLM, không DB, không điểm số hiển thị (số chỉ ở "Vì sao nói vậy")."""
from __future__ import annotations

import datetime as dt
import hashlib
import secrets

from app.kb import tarot_kb as kb

_BO = ("gay", "coc", "kiem", "tien")
_CAP = ("tieu_dong", "hiep_si", "hoang_hau", "vua")
BO_BAI: tuple[str, ...] = tuple([f"dai_{i}" for i in range(22)] + [f"{b}_{n}" for b in _BO for n in [*range(1, 11), *_CAP]])
_DIEM = {"manh": 2, "hop": 1, "trung": 0, "xung": -2}
SUC = ("tiep_suc", "binh", "bi_kim")


# ------------------------------------------------------------------ xáo bài
def xao(hat_giong: str | None, nguoc: bool = True) -> dict:
    """Thứ tự 78 lá + cờ ngược từng lá. `hat_giong` (chuỗi web tạo từ cử chỉ người dùng) → tất định; None → CSPRNG."""
    thu_tu = list(BO_BAI)
    if hat_giong:
        h = hashlib.blake2b(hat_giong.encode("utf-8"), digest_size=32).digest()
        # Fisher–Yates với dòng bit lấy từ băm nối tiếp (tất định, đủ 78 bước).
        dong = bytearray()
        k = 0
        while len(dong) < 78 * 4 + 78:
            dong += hashlib.blake2b(h + k.to_bytes(2, "big"), digest_size=32).digest()
            k += 1
        for i in range(77, 0, -1):
            r = int.from_bytes(dong[i * 4:i * 4 + 4], "big") % (i + 1)
            thu_tu[i], thu_tu[r] = thu_tu[r], thu_tu[i]
        co = [bool(dong[78 * 4 + i] & 1) for i in range(78)]
        nguon = "hat_giong"
    else:
        rng = secrets.SystemRandom()
        rng.shuffle(thu_tu)
        co = [rng.random() < 0.5 for _ in range(78)]
        nguon = "csprng"
    return {"thu_tu": thu_tu, "nguoc": co if nguoc else [False] * 78, "nguon": nguon}


# ------------------------------------------------------------------ phẩm giá nguyên tố
def pham_gia(a: str, b: str) -> str:
    """manh | hop | trung | xung giữa hai nguyên tố (Book T)."""
    if a == b:
        return "manh"
    pg = kb.pham_gia()
    for x, y in pg.get("hop", []):
        if {a, b} == {x, y}:
            return "hop"
    for x, y in pg.get("xung", []):
        if {a, b} == {x, y}:
            return "xung"
    return "trung"


def _suc(diem: int) -> str:
    """Book T: một lá kề hợp / cùng nguyên tố đã tiếp sức; một lá kề xung đã kìm; cộng dồn khi nhiều lá kề."""
    return "tiep_suc" if diem >= 1 else "bi_kim" if diem <= -1 else "binh"


def suc_ke(giua: str, ke: list[tuple[str, str]]) -> dict:
    """Sức của một lá theo các lá kề [(nhãn, nguyên tố)]: {suc, diem, triet_tieu, chi_tiet[(nhãn, quan hệ)]}.
    Book T: lá giữa một HÀNG ba lá có hai lá kề xung NHAU → chúng triệt tiêu, lá giữa đọc nguyên nghĩa; vị trí có nhiều lá kề
    (Celtic Cross) thì cộng dồn quan hệ với từng lá kề. MỘT nơi giữ luật — `suc_la` và `phan_tich` đều gọi qua đây."""
    chi_tiet = [(t, pham_gia(giua, n)) for t, n in ke]
    triet = len(ke) == 2 and pham_gia(ke[0][1], ke[1][1]) == "xung"
    diem = 0 if triet else sum(_DIEM[q] for _, q in chi_tiet)
    return {"suc": _suc(diem), "diem": diem, "triet_tieu": triet, "chi_tiet": chi_tiet}


def suc_la(giua: str, trai: str | None, phai: str | None) -> dict:
    """Sức của lá giữa theo hai lá kề trái / phải (hàng ba lá)."""
    return suc_ke(giua, [(t, n) for t, n in (("trai", trai), ("phai", phai)) if n])


# ------------------------------------------------------------------ trải bài
def _la(ma: str) -> dict:
    x = kb.mot_la(ma)
    if not x:
        raise ValueError(f"Không có lá {ma}")
    return x


def chuan_la(la: list[dict], so_la: int) -> list[dict]:
    """Chuẩn hoá danh sách lá người dùng gửi: đúng số lá, mỗi lá có thật, không trùng."""
    if len(la) != so_la:
        raise ValueError(f"Trải bài cần đúng {so_la} lá")
    ra = []
    for x in la:
        ma = str(x.get("id") if isinstance(x, dict) else x)
        _la(ma)
        ra.append({"id": ma, "nguoc": bool(x.get("nguoc")) if isinstance(x, dict) else False})
    if len({x["id"] for x in ra}) != len(ra):
        raise ValueError("Một lá không thể xuất hiện hai lần trong một trải bài")
    return ra


def _nhip_so(day: list[int]) -> str:
    if len(day) < 2:
        return "mot"
    if len(set(day)) < len(day):
        return "lap"
    if all(b > a for a, b in zip(day, day[1:])):
        return "tien"
    if all(b < a for a, b in zip(day, day[1:])):
        return "lui"
    return "hon_hop"


def phan_tich(trai_bai: str, la: list[dict]) -> dict:
    """Mọi con số của một trải bài (web chỉ vẽ; RULES ghép lời)."""
    tb = kb.trai_bai().get(trai_bai)
    if not tb:
        raise ValueError(f"Không có trải bài {trai_bai}")
    ds = chuan_la(la, len(tb["vi_tri"]))
    ke = [tuple(c) for c in tb.get("ke_can", [])]
    hang_xom: dict[int, list[int]] = {i: [] for i in range(len(ds))}
    for a, b in ke:
        hang_xom[a].append(b)
        hang_xom[b].append(a)
    vi_tri = []
    for i, x in enumerate(ds):
        l = _la(x["id"])
        nt = l["nguyen_to"]
        s = suc_ke(nt, [(f"vi_tri_{j}", _la(ds[j]["id"])["nguyen_to"]) for j in hang_xom[i]])
        vi_tri.append({"vi_tri": i, "ma": tb["vi_tri"][i]["ma"], "ten": tb["vi_tri"][i]["ten"], "id": x["id"], "nguoc": x["nguoc"],
                       "nguyen_to": nt, "loai": l["loai"], "so": l["so"], "suc": s, "ke": hang_xom[i]})
    ke_can = [{"a": a, "b": b, "quan_he": pham_gia(_la(ds[a]["id"])["nguyen_to"], _la(ds[b]["id"])["nguyen_to"])} for a, b in ke]
    dem = {k: 0 for k in ("hoa", "thuy", "khi", "dat")}
    for v in vi_tri:
        dem[v["nguyen_to"]] += 1
    tong = len(ds)
    troi = max(dem, key=lambda k: (dem[k], -list(dem).index(k)))
    troi = troi if dem[troi] >= max(2, (tong + 2) // 3) and list(dem.values()).count(dem[troi]) == 1 else None
    thieu = [k for k, v in dem.items() if v == 0] if tong >= 5 else []
    so_an = sum(1 for v in vi_tri if v["loai"] == "an_chinh")
    ti_le = so_an / tong
    muc_an = "nhieu" if ti_le >= 0.5 else "vua" if ti_le >= 0.2 else "it"
    day = [v["so"] for v in vi_tri if v["loai"] == "so"]
    huong_nhin = []
    for v in vi_tri:
        h = _la(v["id"])["huong_nhin"]
        if h is None:
            continue
        if v["nguoc"]:
            h = -h          # lá ngược: hình xoay 180°, nhân vật quay mặt về phía ngược lại so với hình gốc
        truc = list(tb.get("truc_nhin") or [])
        tren_truc = v["vi_tri"] in truc
        toi = None
        if h != 0 and tren_truc:
            # Trục nhìn (Marseille) = trục thời gian của trải bài: quay trái = về lá đứng trước (quá khứ), nhìn phải = tới lá sau.
            j = truc.index(v["vi_tri"]) + h
            toi = truc[j] if 0 <= j < len(truc) else None
        huong_nhin.append({"vi_tri": v["vi_tri"], "huong": h, "toi": toi, "tren_truc": tren_truc, "lat": v["nguoc"] and h != 0})
    return {"trai_bai": trai_bai, "vi_tri": vi_tri, "ke_can": ke_can,
            "nguyen_to": {"dem": dem, "troi": troi, "thieu": thieu},
            "an_chinh": {"so": so_an, "tong": tong, "ti_le": round(ti_le, 2), "muc": muc_an},
            "so_hoc": {"day": day, "xu_huong": _nhip_so(day)}, "huong_nhin": huong_nhin}


# ------------------------------------------------------------------ decan, nhịp thời gian
def decan(ma: str) -> dict | None:
    l = _la(ma)
    d = l.get("decan")
    if not d:
        return None
    c = kb.cung_hoang_dao()[d["cung"]]
    tu, den, ht = c["decan"][d["so"] - 1]
    return {"cung": d["cung"], "so": d["so"], "hanh_tinh": ht, "tu": list(tu), "den": list(den)}


def _cua_so(tu: list[int], den: list[int], ngay: dt.date) -> tuple[dt.date, dt.date, bool]:
    """Cửa sổ [từ, đến] kế tiếp (hoặc đang trong) kể từ `ngay`; cửa sổ vắt năm (Ma Kết) xử lý đúng."""
    for nam in (ngay.year - 1, ngay.year, ngay.year + 1):
        a = dt.date(nam, tu[0], tu[1])
        b = dt.date(nam + (1 if (den[0], den[1]) < (tu[0], tu[1]) else 0), den[0], den[1])
        if a <= ngay <= b:
            return a, b, True
        if a > ngay:
            return a, b, False
    a = dt.date(ngay.year + 1, tu[0], tu[1])
    return a, dt.date(ngay.year + 1 + (1 if (den[0], den[1]) < (tu[0], tu[1]) else 0), den[0], den[1]), False


def khoang_thoi_gian(ma: str, ngay_xem: dt.date) -> dict:
    """Nhịp gợi ý của một lá: decan (lá 2–10) → cửa sổ ~10 ngày; Hiệp sĩ / Hoàng hậu / Vua → vùng 30° Book T (20° cung này
    tới 20° cung sau, ~1 tháng); ẩn chính theo cung → cả cung; theo hành tinh → chỉ nhịp; Át / Tiểu đồng → nhịp của bộ."""
    l = _la(ma)
    d = decan(ma)
    bo = kb.bo().get(l["bo"] or "") or {}
    if d:
        a, b, trong = _cua_so(d["tu"], d["den"], ngay_xem)
        return {"loai": "decan", "cung": d["cung"], "so": d["so"], "hanh_tinh": d["hanh_tinh"], "tu": a, "den": b, "dang_trong": trong,
                "nhip": bo.get("nhip", ""), "sau_ngay": (a - ngay_xem).days if not trong else 0}
    vg = l.get("vung_book_t")
    if vg:
        # Book T: lá hoàng gia cai từ 20° cung này tới 20° cung sau = decan 3 của cung này + decan 1–2 của cung sau.
        ds = list(kb.cung_hoang_dao())
        c1 = kb.cung_hoang_dao()[vg["tu_cung"]]
        c2 = kb.cung_hoang_dao()[ds[(ds.index(vg["tu_cung"]) + 1) % 12]]
        a, b, trong = _cua_so(list(c1["decan"][2][0]), list(c2["decan"][1][1]), ngay_xem)
        return {"loai": "hoang_gia", "cung": vg["tu_cung"], "cung_sau": ds[(ds.index(vg["tu_cung"]) + 1) % 12], "tu": a, "den": b, "dang_trong": trong,
                "nhip": bo.get("nhip", ""), "sau_ngay": (a - ngay_xem).days if not trong else 0}
    ct = l.get("chiem_tinh") or {}
    if ct.get("loai") == "cung":
        c = kb.cung_hoang_dao()[ct["ma"]]
        a, b, trong = _cua_so(c["tu"], c["den"], ngay_xem)
        return {"loai": "cung", "cung": ct["ma"], "tu": a, "den": b, "dang_trong": trong, "nhip": "vài tuần tới một tháng", "sau_ngay": (a - ngay_xem).days if not trong else 0}
    if ct.get("loai") == "hanh_tinh":
        h = kb.hanh_tinh().get(ct["ma"]) or {}
        return {"loai": "hanh_tinh", "hanh_tinh": ct["ma"], "tu": None, "den": None, "dang_trong": None, "nhip": h.get("nhip", ""), "sau_ngay": None}
    if l["bo"]:
        return {"loai": "bo", "bo": l["bo"], "tu": None, "den": None, "dang_trong": None, "nhip": bo.get("nhip", ""), "sau_ngay": None}
    return {"loai": "nguyen_to", "tu": None, "den": None, "dang_trong": None, "nhip": "không có nhịp riêng — theo nhịp của các lá bên cạnh", "sau_ngay": None}


# ------------------------------------------------------------------ nghiêng của câu trả lời
_NGHIENG = {"tien": 1, "dieu_kien": 0, "cho": -1}
NGUONG_NGHIENG = 0.34


def nghieng_la(ma: str, nguoc: bool) -> str:
    """tien | dieu_kien | cho — lá (xuôi / ngược) nghiêng về đâu với câu 'có nên / có thành không' (KB `nghieng`, theo lối
    đọc có / không phổ biến của Waite)."""
    return _la(ma)["nghieng"]["n" if nguoc else "x"]


def nghieng_tong(ds: list[tuple[str, float, str]]) -> dict:
    """[(nghiêng của lá, trọng số vị trí, sức của lá)] → {nghieng, diem}. Lá được tiếp sức nặng thêm 1/4, bị kìm nhẹ đi 1/4
    (Book T: phẩm giá làm lá mạnh / yếu lên, không đổi chiều). Trung bình có trọng số ≥ +0,34 → tien, ≤ −0,34 → cho."""
    tong_w = sum(w for _, w, _ in ds) or 1
    diem = sum(_NGHIENG[n] * w * (1.25 if s == "tiep_suc" else 0.75 if s == "bi_kim" else 1) for n, w, s in ds) / tong_w
    diem = round(diem, 3)
    return {"nghieng": "tien" if diem >= NGUONG_NGHIENG else "cho" if diem <= -NGUONG_NGHIENG else "dieu_kien", "diem": diem}


# ------------------------------------------------------------------ lá ngày, lá đại diện
def la_ngay(ngay: dt.date, ngay_sinh: dt.date | None = None) -> dict:
    """Lá của ngày: băm ngày (chung mọi người) hoặc ngày + ngày sinh (riêng). Luôn xuôi (không doạ đầu ngày)."""
    khoa = f"tarot|{ngay.isoformat()}" + (f"|{ngay_sinh.isoformat()}" if ngay_sinh else "")
    h = hashlib.blake2b(khoa.encode("utf-8"), digest_size=8).digest()
    return {"id": BO_BAI[int.from_bytes(h, "big") % 78], "nguoc": False, "rieng": ngay_sinh is not None}


def dai_dien(tuoi: int | None, gioi_tinh: str | None, ngu_hinh: str | None = None, bo: str | None = None, dang: str | None = None) -> dict | None:
    """Lá hoàng gia 'đóng vai' người hỏi. Bộ: ngũ hình gương mặt (Nhân tướng) → bộ; không có → `bo` người chọn; không suy
    được bộ → None (tuổi một mình không đủ). Cấp: tuổi × giới tính (< 30 hoặc chưa biết tuổi: Hiệp sĩ / Tiểu đồng; ≥ 30: Vua /
    Hoàng hậu); không giới tính → theo dáng nhanh (Hiệp sĩ / Vua) hay chậm, không rõ (Tiểu đồng / Hoàng hậu)."""
    dd = kb.dai_dien()
    bo_chon = dd.get("hinh_bo", {}).get(ngu_hinh or "") or (bo if bo in _BO else None)
    if bo_chon is None:
        return None
    lon = tuoi is not None and tuoi >= int(dd.get("cap", {}).get("tuoi_lon", 30))
    if gioi_tinh == "nam":
        cap = "vua" if lon else "hiep_si"
    elif gioi_tinh == "nu":
        cap = "hoang_hau" if lon else "tieu_dong"
    else:
        cap = ("hoang_hau" if lon else "tieu_dong") if dang != "nhanh_hap_tap" else ("vua" if lon else "hiep_si")
    ly_do = [dd.get("loi_hinh", {}).get(ngu_hinh or "", "") if ngu_hinh else f"Bộ {kb.bo()[bo_chon]['ten']} do bạn chọn",
             dd.get("loi_cap", {}).get(cap, "")]
    return {"id": f"{bo_chon}_{cap}", "bo": bo_chon, "cap": cap, "ly_do": " · ".join(x for x in ly_do if x)}
