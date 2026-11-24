# -*- coding: utf-8 -*-
"""SD-1 — hình học THUẦN cho "sơ đồ nhà theo tỉ lệ" (khung rộng × sâu mét, vật = hộp có tâm `diem` 0..1).

Từ các hộp người dùng TỰ ĐẶT (và hướng cửa / kích thước người dùng TỰ CHỈNH) suy ra dấu hiệu bố cục CÓ THỂ có — chỉ là
GỢI Ý: web hỏi lại, người dùng xác nhận rồi mới vào `bo_cuc.dau_hieu` (luật `_nhan` của RULES không đổi).
Không bao giờ suy từ giá trị máy tự điền: hướng cửa mặc định, kích thước mặc định KHÔNG phải dữ kiện.

Quy ước toạ độ như `vi_tri_vat.do_tu_khung`: x trái → phải, y trước → sau (y = 0 là mặt trước nhà).
Một bộ tính với `calc/mat_bang.py`: tâm nhà, vùng Trung cung, khuyết góc đều gọi hàm ở đó.
"""
from __future__ import annotations

from app.calc import mat_bang

HUONG_CUA = ("truoc", "phai", "sau", "trai")
PHONG_CO_CUA = ("phong_ngu_chinh", "bep", "ve_sinh")     # bàn thờ, cầu thang không có "cửa phòng"
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

    co_hop = {k: hop(tuple(x["diem"]), tuple(x["kich_thuoc"]), rong, sau) for k, x in v.items() if x.get("kich_thuoc")}
    dung_sai = max(0.6, min(rong, sau) * 0.15)
    co_cua = [k for k in PHONG_CO_CUA if k in co_hop and v[k].get("huong_cua")]
    for i, a in enumerate(co_cua):
        for b in co_cua[i + 1:]:
            if doi_cua(co_hop[a], v[a]["huong_cua"], co_hop[b], v[b]["huong_cua"], dung_sai):
                them("bep_wc" if {a, b} == {"bep", "ve_sinh"} else "cua_doi_nhau", a, b)
    # bếp nhìn thẳng ra cửa chính: cửa bếp mở về phía cửa chính và cửa chính nằm trước mặt cửa bếp
    if "bep" in co_hop and v["bep"].get("huong_cua") and v.get("cua_chinh"):
        bx, by = _cua(co_hop["bep"], v["bep"]["huong_cua"])
        cx, cy = v["cua_chinh"]["diem"][0] * rong, v["cua_chinh"]["diem"][1] * sau
        h = v["bep"]["huong_cua"]
        truoc_mat = ((h == "truoc" and cy <= by and abs(cx - bx) <= dung_sai) or (h == "sau" and cy >= by and abs(cx - bx) <= dung_sai)
                     or (h == "trai" and cx <= bx and abs(cy - by) <= dung_sai) or (h == "phai" and cx >= bx and abs(cy - by) <= dung_sai))
        if truoc_mat:
            them("bep_doi_cua", "bep", "cua_chinh")
    if "bep" in co_hop and "ve_sinh" in co_hop and chung_vach(co_hop["bep"], co_hop["ve_sinh"]):
        them("bep_wc", "bep", "ve_sinh")
    return kq
