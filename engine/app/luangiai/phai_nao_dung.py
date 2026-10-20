"""TS-V3b — "Phái nào nói đúng về bạn?": dưới mỗi câu trả lời thần số, mỗi phái (Pitago · Chaldea) một câu ngắn để
người dùng bấm chọn. Phiếu đếm trên máy người dùng (web), engine không lưu. Template từ KB, không LLM.
"""
from __future__ import annotations

from app.calc import thanso as tinh
from app.kb import thanso_v2 as kb
from app.luangiai import thanso_chaldean as lch


def _cau_dau(s: str | None) -> str:
    s = (s or "").strip()
    i = s.find(". ")
    return s[: i + 1] if i > 0 else s


# "Phái nào nói đúng về bạn?" — mỗi phái một câu ngắn để người dùng bấm chọn sau mỗi câu trả lời.
MAT_THEO_LINH_VUC = {"tinh_yeu": "tinh_cam", "gia_dinh": "tinh_cam", "ban_be_xa_hoi": "tinh_cam",
                     "su_nghiep": "cong_viec", "tai_chinh": "cong_viec", "hoc_tap": "cong_viec"}
_O_DAU = {"tong_quan": "chan_dung", "tinh_cam": "cach_yeu", "cong_viec": "the_manh", "bien_co": "bai_hoc"}


def ba_goc_nhin(ho_ten: list[str], ngay: int, thang: int, nam: int, linh_vuc: str | None,
                quy_uoc: str = "tong_het") -> dict:
    ten = kb.do_thi()["ten_phai"]
    mat = MAT_THEO_LINH_VUC.get(linh_vuc or "", "tong_quan")
    dd = tinh.duong_doi(ngay, thang, nam, quy_uoc)
    cd = (kb.chan_dung(dd) or {}).get(mat) or {}
    y_pt = cd.get(_O_DAU[mat])
    if isinstance(y_pt, list):
        y_pt = "; ".join(y_pt)
    c = next((s for s in lch.luan_chaldea(ho_ten, ngay, thang, nam, quy_uoc)["cac_so"] if s["ma"] == "ten_goi"), None)
    goc_nhin = [{"phai": "pitago", "ten_phai": ten["pitago"], "nhan": f"Đường đời {dd}", "y": _cau_dau(y_pt)}]
    # Tên không có chữ cái → số theo tên = 0, KB không có nghĩa → phái đó không góp câu (không hiện "None").
    if c and c["goc"] and c.get("nghia_goc"):
        goc_nhin.append({"phai": "chaldea", "ten_phai": ten["chaldea"],
                         "nhan": f"Số tên gọi {c['kep']}/{c['goc']}" if c["kep"] else f"Số tên gọi {c['goc']}",
                         "y": _cau_dau(c["nghia_goc"].get("xu_huong"))})
    return {
        "mat": mat,
        "goc_nhin": [g for g in goc_nhin if g["y"]],
        "luu_y": "Hai phái tính từ cùng họ tên và ngày sinh bằng hai bảng chữ khác nhau — chọn câu nghe đúng với bạn hơn.",
    }
