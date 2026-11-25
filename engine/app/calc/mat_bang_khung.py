# -*- coding: utf-8 -*-
"""SD-1 — hình học THUẦN cho "sơ đồ nhà theo tỉ lệ" (khung rộng × sâu mét, vật = hộp có tâm `diem` 0..1).

Từ các hộp người dùng TỰ ĐẶT (và hướng cửa / kích thước người dùng TỰ CHỈNH) suy ra dấu hiệu bố cục CÓ THỂ có — chỉ là
GỢI Ý: web hỏi lại, người dùng xác nhận rồi mới vào `bo_cuc.dau_hieu` (luật `_nhan` của RULES không đổi).
Không bao giờ suy từ giá trị máy tự điền: hướng cửa mặc định, kích thước mặc định KHÔNG phải dữ kiện.

Quy ước toạ độ như `vi_tri_vat.do_tu_khung`: x trái → phải, y trước → sau (y = 0 là mặt trước nhà).
Một bộ tính với `calc/mat_bang.py`: tâm nhà, vùng Trung cung, khuyết góc đều gọi hàm ở đó.
"""
from __future__ import annotations

import math

from app.calc import mat_bang
from app.calc import phongthuy as pt
from app.calc import vi_tri_vat as vt

HUONG_CUA = ("truoc", "phai", "sau", "trai")
PHONG_CO_CUA = ("phong_ngu_chinh", "bep", "ve_sinh")     # bàn thờ, cầu thang không có "cửa phòng"
KC_XUYEN = 2.0              # mét — cửa và ban công cách nhau ít hơn thì không xét "xuyên thẳng"
KHE_CHUNG_VACH = 0.35        # mét — hai hộp cách nhau không quá mức này coi là chung vách
PHU_CHUNG_VACH = 0.5         # mét — đoạn vách chung tối thiểu


def tam_khung(luoi: list[str] | None) -> tuple[float, float]:
    """Tâm nhà chuẩn hoá (x, y) trong 0..1 — trọng tâm phần có xây (`mat_bang.tam`); không lưới → giữa khung."""
    if not luoi:
        return 0.5, 0.5
    o = mat_bang.doc_luoi(luoi)
    tr, tc = mat_bang.tam(o)
    return round(tc / len(o[0]), 4), round(tr / len(o), 4)


def hop(diem: tuple[float, float], kich_thuoc: tuple[float, float], rong: float, sau: float) -> dict:
    """Hộp (mét) của vật: tâm tại `diem`, kẹp gọn trong khung nhà."""
    w, h = min(rong, max(0.1, kich_thuoc[0])), min(sau, max(0.1, kich_thuoc[1]))
    x0 = min(max(0.0, diem[0] * rong - w / 2), rong - w)
    y0 = min(max(0.0, diem[1] * sau - h / 2), sau - h)
    return {"x0": x0, "y0": y0, "w": w, "h": h, "cx": x0 + w / 2, "cy": y0 + h / 2}


def _cua(hp: dict, huong: str) -> tuple[float, float]:
    """Điểm giữa cánh cửa trên cạnh hộp."""
    x = hp["x0"] if huong == "trai" else hp["x0"] + hp["w"] if huong == "phai" else hp["cx"]
    y = hp["y0"] if huong == "truoc" else hp["y0"] + hp["h"] if huong == "sau" else hp["cy"]
    return x, y


def doi_cua(a: dict, ha: str, b: dict, hb: str, dung_sai: float) -> bool:
    """Hai cửa nhìn thẳng vào nhau: mở ngược chiều, cửa này ở trước mặt cửa kia, lệch ngang không quá `dung_sai`."""
    (ax, ay), (bx, by) = _cua(a, ha), _cua(b, hb)
    if (ha, hb) == ("phai", "trai"):
        return ax <= bx and abs(ay - by) <= dung_sai
    if (ha, hb) == ("trai", "phai"):
        return bx <= ax and abs(ay - by) <= dung_sai
    if (ha, hb) == ("sau", "truoc"):
        return ay <= by and abs(ax - bx) <= dung_sai
    if (ha, hb) == ("truoc", "sau"):
        return by <= ay and abs(ax - bx) <= dung_sai
    return False


def chung_vach(a: dict, b: dict) -> bool:
    """Hai hộp kề nhau qua một vách: khe ≤ KHE_CHUNG_VACH theo một chiều và phủ nhau ≥ PHU_CHUNG_VACH theo chiều kia."""
    khe_x = max(a["x0"] - (b["x0"] + b["w"]), b["x0"] - (a["x0"] + a["w"]))
    khe_y = max(a["y0"] - (b["y0"] + b["h"]), b["y0"] - (a["y0"] + a["h"]))
    phu_x = min(a["x0"] + a["w"], b["x0"] + b["w"]) - max(a["x0"], b["x0"])
    phu_y = min(a["y0"] + a["h"], b["y0"] + b["h"]) - max(a["y0"], b["y0"])
    return (khe_x <= KHE_CHUNG_VACH and phu_y >= PHU_CHUNG_VACH) or (khe_y <= KHE_CHUNG_VACH and phu_x >= PHU_CHUNG_VACH)


def trong_trung_cung(diem: tuple[float, float], luoi: list[str] | None) -> bool:
    """Điểm nằm trong 1/3 giữa của khung bao phần có xây (cùng định nghĩa với mặt bằng vẽ tay)."""
    if not luoi:
        return 1 / 3 <= diem[0] < 2 / 3 and 1 / 3 <= diem[1] < 2 / 3
    o = mat_bang.doc_luoi(luoi)
    return mat_bang.trong_trung_cung(o, diem[1] * len(o), diem[0] * len(o[0]))


def cua_thong_ban_cong(cua: tuple[float, float], ban_cong: tuple[float, float], rong: float, sau: float,
                       luoi: list[str] | None = None) -> dict | None:
    """TY-2 đợt 2 — luật "cửa – tâm – ban công thẳng hàng" của mặt bằng vẽ tay (`mat_bang.phan_tich`) đặt trên sơ đồ mét:
    hướng cửa → ban công lệch hướng cửa → tâm nhà ≤ `mat_bang.GOC_THANG_HANG`, cách nhau ≥ `KC_XUYEN`, và đoạn thẳng nối hai
    điểm không đi qua phần không xây của lưới. Hai điểm trùng → None."""
    cx, cy = cua[0] * rong, cua[1] * sau
    bx, by = ban_cong[0] * rong, ban_cong[1] * sau
    tx, ty = tam_khung(luoi)
    tx, ty = tx * rong, ty * sau
    kc = math.hypot(bx - cx, by - cy)
    if kc < 0.01:
        return None
    goc = lambda x, y: math.degrees(math.atan2(x - cx, cy - y)) % 360  # noqa: E731 — 0 = về phía trước, theo chiều kim đồng hồ
    lech = abs((goc(bx, by) - goc(tx, ty) + 180) % 360 - 180)
    thong = True
    if luoi:
        o = mat_bang.doc_luoi(luoi)
        n = max(2, int(kc * 4))
        for k in range(n + 1):
            x, y = cua[0] + (ban_cong[0] - cua[0]) * k / n, cua[1] + (ban_cong[1] - cua[1]) * k / n
            if not o[min(len(o) - 1, int(y * len(o)))][min(len(o[0]) - 1, int(x * len(o[0])))]:
                thong = False
                break
    return {"lech_do": round(lech, 1), "thang_hang": lech <= mat_bang.GOC_THANG_HANG and kc >= KC_XUYEN and thong}


def phan_tich_so_do(rong: float, sau: float, vat: dict[str, tuple[float, float]], huong_do: float | None = None,
                    luoi: list[str] | None = None) -> dict:
    """TY-2 đợt 2 — Khảo sát nhà đọc thẳng sơ đồ tỉ lệ (thay lưới vẽ tay). Một bộ tính:
    * phương từng chỗ = `vi_tri_vat.do_tu_khung` (đúng phép của "Đứng giữa nhà"); điểm sát tâm → Trung cung;
    * vùng Trung cung, khuyết góc, tâm ngoài nhà = `mat_bang` trên lưới bỏ phần không xây (không lưới → nhà kín hình chữ nhật);
    * cửa thông ban công = `cua_thong_ban_cong`.
    Trả cùng hình dạng chính với `mat_bang.phan_tich` (`o_9`, `khuyet_goc`, `phuong_phong`, `wc_trung_cung`,
    `cua_thong_ban_cong`, `canh_bao`) + `nguon: "so_do"`, `tam` = (x, y) 0..1."""
    if not (0 < rong <= 200 and 0 < sau <= 200):
        raise ValueError("Kích thước khung nhà không hợp lệ")
    for ma, (x, y) in vat.items():
        if not (0 <= x <= 1 and 0 <= y <= 1):
            raise ValueError(f"Điểm của {ma} nằm ngoài khung nhà")
    r = mat_bang.phan_tich(luoi or ["111"] * 3, huong_do)
    pp: dict[str, dict] = {}
    for ma, (x, y) in vat.items():
        tc = trong_trung_cung((x, y), luoi)
        phuong = None
        if not tc and huong_do is not None:
            try:
                phuong = pt.huong_tu_do(vt.do_tu_khung(rong, sau, x, y, huong_do, luoi))
            except ValueError:                           # sát tâm nhà → không có phía, coi là giữa nhà
                tc = True
        pp[ma] = {"diem": [round(x, 4), round(y, 4)], "phuong": "Trung cung" if tc else phuong, "trung_cung": tc}
    xuyen = cua_thong_ban_cong(vat["cua_chinh"], vat["ban_cong"], rong, sau, luoi) if "cua_chinh" in vat and "ban_cong" in vat else None
    return {"nguon": "so_do", "rong": rong, "sau": sau, "tam": list(tam_khung(luoi)), "tam_ngoai_nha": r["tam_ngoai_nha"],
            "o_9": r["o_9"], "khuyet_goc": r["khuyet_goc"], "phuong_phong": pp,
            "wc_trung_cung": bool(pp.get("ve_sinh", {}).get("trung_cung")),
            "cau_thang_trung_cung": bool(pp.get("cau_thang", {}).get("trung_cung")),
            "cua_thong_ban_cong": xuyen, "canh_bao": r["canh_bao"]}


def goi_y_dau_hieu(vat: list[dict], rong: float, sau: float, luoi: list[str] | None = None) -> list[dict]:
    """`vat` = [{loai, diem, kich_thuoc?, huong_cua?}] của MỘT tầng (chỉ vật có `diem`).
    `kich_thuoc` / `huong_cua` chỉ được gửi khi người dùng tự chỉnh — thiếu thì luật cần nó không chạy.
    Trả [{ma, can: [loại vật làm căn cứ]}], thứ tự cố định."""
    v = {x["loai"]: x for x in vat if x.get("diem")}
    kq: list[dict] = []

    def them(ma: str, *can: str) -> None:
        if not any(k["ma"] == ma for k in kq):
            kq.append({"ma": ma, "can": list(can)})

    wc = v.get("ve_sinh")
    if wc and trong_trung_cung(tuple(wc["diem"]), luoi):
        them("wc_giua_nha", "ve_sinh")
    thang = v.get("cau_thang")
    if thang and trong_trung_cung(tuple(thang["diem"]), luoi):
        them("cau_thang_giua_nha", "cau_thang")
    if luoi and mat_bang.phan_tich(luoi)["khuyet_goc"]:
        them("nha_chu_l")
    if v.get("cua_chinh") and v.get("ban_cong"):
        x = cua_thong_ban_cong(tuple(v["cua_chinh"]["diem"]), tuple(v["ban_cong"]["diem"]), rong, sau, luoi)
        if x and x["thang_hang"]:
            them("cua_thong_ban_cong", "cua_chinh", "ban_cong")

    co_hop = {k: hop(tuple(x["diem"]), tuple(x["kich_thuoc"]), rong, sau) for k, x in v.items() if x.get("kich_thuoc")}
    # Luật về CỬA chỉ cần phía cửa người dùng đã đặt; chưa chỉnh kích thước thì coi cửa nằm ngay tại điểm đặt phòng
    # (không mượn kích thước máy tự điền). Luật chung vách thì bắt buộc có kích thước người dùng chỉnh.
    hop_cua = {k: co_hop.get(k) or hop(tuple(x["diem"]), (0.1, 0.1), rong, sau) for k, x in v.items()}
    dung_sai = max(0.6, min(rong, sau) * 0.15)
    co_cua = [k for k in PHONG_CO_CUA if k in v and v[k].get("huong_cua")]
    for i, a in enumerate(co_cua):
        for b in co_cua[i + 1:]:
            if doi_cua(hop_cua[a], v[a]["huong_cua"], hop_cua[b], v[b]["huong_cua"], dung_sai):
                them("bep_wc" if {a, b} == {"bep", "ve_sinh"} else "cua_doi_nhau", a, b)
    # bếp nhìn thẳng ra cửa chính: cửa bếp mở về phía cửa chính và cửa chính nằm trước mặt cửa bếp
    if "bep" in v and v["bep"].get("huong_cua") and v.get("cua_chinh"):
        bx, by = _cua(hop_cua["bep"], v["bep"]["huong_cua"])
        cx, cy = v["cua_chinh"]["diem"][0] * rong, v["cua_chinh"]["diem"][1] * sau
        h = v["bep"]["huong_cua"]
        truoc_mat = ((h == "truoc" and cy <= by and abs(cx - bx) <= dung_sai) or (h == "sau" and cy >= by and abs(cx - bx) <= dung_sai)
                     or (h == "trai" and cx <= bx and abs(cy - by) <= dung_sai) or (h == "phai" and cx >= bx and abs(cy - by) <= dung_sai))
        if truoc_mat:
            them("bep_doi_cua", "bep", "cua_chinh")
    if "bep" in co_hop and "ve_sinh" in co_hop and chung_vach(co_hop["bep"], co_hop["ve_sinh"]):
        them("bep_wc", "bep", "ve_sinh")
    return kq


# ------------------------------------------------------------------ TY-2 gói 2: sân / giếng trời chia nhà thành lớp
TOI_DA_SAN = 14                 # 15 lớp là trần của sách (hoá trạch)


def khoi_lop(san: list[tuple[float, float]]) -> list[tuple[float, float]]:
    """Các dải sân / giếng trời (y0, y1 theo chiều sâu, 0..1, nằm trọn bên trong nhà) chia nhà thành các dãy (lớp) từ
    mặt trước vào. Trả các dãy (y0, y1). Dải chồng nhau, chạm mép nhà hoặc quá 14 dải → ValueError."""
    if len(san) > TOI_DA_SAN:
        raise ValueError("Tối đa 14 sân / giếng trời")
    ds = sorted((float(a), float(b)) for a, b in san)
    truoc = 0.0
    khoi = []
    for a, b in ds:
        if not (0 < a < b < 1):
            raise ValueError("Sân / giếng trời phải nằm trong nhà (không chạm mặt trước, mặt sau)")
        if a <= truoc and khoi:
            raise ValueError("Các sân / giếng trời chồng lên nhau")
        khoi.append((truoc, a))
        truoc = b
    khoi.append((truoc, 1.0))
    return khoi


def lop_cua(diem: tuple[float, float], san: list[tuple[float, float]]) -> int | None:
    """Lớp (1 = dãy trước) chứa điểm; điểm nằm trong một sân → None."""
    for i, (a, b) in enumerate(khoi_lop(san), 1):
        if a <= diem[1] <= b:
            return i
    return None


def san_gan(diem: tuple[float, float], san: list[tuple[float, float]]) -> int:
    """Chỉ số (0-based, theo thứ tự từ trước vào) của sân gần điểm nhất theo chiều sâu."""
    ds = sorted(san)
    return min(range(len(ds)), key=lambda i: abs((ds[i][0] + ds[i][1]) / 2 - diem[1]))
