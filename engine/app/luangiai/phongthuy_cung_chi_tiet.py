# -*- coding: utf-8 -*-
"""UI-HHT (chủ dự án 2026-11-18) — lớp tri thức thêm cho trang "hướng hợp tuổi" (8 trang cung phi + mục lục).

Tầng RULES: chỉ GHÉP dữ kiện CALC đã có (`pt.bang_huong`, `pt.menh_quai`, `pt.sao_nam`, 24 sơn của Huyền Không) với
lời KB đã có (du niên, du niên đời thường, chín điều sách dặn theo cung, vợ chồng khác nhóm, bố cục phòng, quy tắc thực
hành). Không phép tính mới, không đổi mức, không LLM. CHỈ bản Việt (lời KB chưa có bản Anh) — bản khác trả None.

- Chín điều sách dặn: CHỈ nhóm A/B (trang công khai không biết tuổi người đọc → nhóm C để ở công cụ cá nhân, SX-C).
- Hướng kiêng của năm chồng lên hướng tốt: Bát trạch là nền, sao năm chỉ là THỜI ĐIỂM (Q1 "hình thế là nền, lý khí là
  nhịp") — không đổi thứ hạng hướng, lời nói rõ.
"""
from __future__ import annotations

from app import ngon_ngu
from app.calc import huyen_khong as hk
from app.calc import phongthuy as pt
from app.kb import phongthuy_doi_song_kb as ds_kb
from app.kb import phongthuy_kb as kb
from app.luangiai import sach_ghi_mon

THU_TU_CAT = ("Sinh Khí", "Thiên Y", "Diên Niên", "Phục Vị")
THU_TU_HUNG = ("Tuyệt Mệnh", "Ngũ Quỷ", "Lục Sát", "Hoạ Hại")
# Tâm (độ la bàn, 0 = Bắc) của 8 phương; mỗi phương 45°, gồm 3 sơn × 15°.
TAM_DO = {h: i * 45 for i, h in enumerate(pt.HUONG)}


def _son(huong: str) -> tuple[list[str], dict]:
    c = TAM_DO[huong]
    i = c // 15
    son = [hk.SON_24[(i + k) % 24] for k in (-1, 0, 1)]
    return son, {"tu": (c - 22.5) % 360, "den": (c + 22.5) % 360}


def _sach_dn(d: str) -> dict | None:
    s = (kb._d()["du_nien"].get(d) or {}).get("sach")
    return {k: s[k] for k in ("han", "trich", "y") if k in s} if s else None


def _huong(q: str) -> list[dict]:
    theo = {d: h for h, d in pt.bang_huong(q).items()}
    ra = []
    for i, d in enumerate(THU_TU_CAT + THU_TU_HUNG):
        h = theo[d]
        son, do = _son(h)
        dt = ds_kb.du_nien(d)
        ra.append({"huong": h, "du_nien": d, "cat": d in pt.CAT, "hang": i + 1 if i < 4 else None,
                   "mot_cau": dt["mot_cau"], "dung": dt.get("dung", ""), "sach": _sach_dn(d), "son": son, "do": do})
    return ra


def _phong_khac(q: str) -> list[dict]:
    theo = {d: h for h, d in pt.bang_huong(q).items()}
    vt = kb.bo_cuc()["vi_tri_phong"]
    vs, bt = vt["ve_sinh"], vt["ban_tho"]
    return [
        {"ma": "ve_sinh", "tieu_de": vs["tieu_de"], "huong": [theo[d] for d in THU_TU_HUNG], "du_nien": list(THU_TU_HUNG),
         "noi_dung": vs["noi_dung"], "thuc_te": vs.get("thuc_te", ""), "nguon": vs["nguon"]},
        {"ma": "ban_tho", "tieu_de": bt["tieu_de"], "huong": [theo[d] for d in bt["uu_tien"]], "du_nien": list(bt["uu_tien"]),
         "noi_dung": bt["noi_dung"], "thuc_te": bt.get("thuc_te", ""), "nguon": bt["nguon"]},
    ]


def _nam_nay(q: str, nam: int) -> dict:
    sn = pt.sao_nam(nam)
    theo = {d: h for h, d in pt.bang_huong(q).items()}
    sao = {"Ngũ Hoàng": sn["ngu_hoang"], "Thái Tuế": sn["thai_tue"], "Tuế Phá": sn["tue_pha"], "Tam Sát": sn["tam_sat"]}
    trung = []
    for d in THU_TU_CAT:
        h = theo[d]
        co = [s for s, p in sao.items() if p == h]
        if co:
            trung.append({"huong": h, "du_nien": d, "sao": co})
    if trung:
        loi = ("Năm {nam}, " + "; ".join(f"{t['huong']} ({t['du_nien']}) có {', '.join(t['sao'])}" for t in trung)
               + ". Hướng tốt vẫn là hướng tốt — sao năm chỉ nói thời điểm: năm này nên giữ yên phía đó, tránh đào "
               "sửa, khởi công hay đặt đồ nặng mới. Thứ hạng bốn hướng không đổi.").format(nam=nam)
    else:
        loi = (f"Năm {nam}, các hướng kiêng của năm (Ngũ Hoàng, Thái Tuế, Tuế Phá, Tam Sát) không rơi vào bốn hướng tốt "
               "của cung này. Sao năm chỉ nói thời điểm, không đổi thứ hạng hướng.")
    return {"nam": nam, "ngu_hoang": sn["ngu_hoang"], "thai_tue": sn["thai_tue"], "tue_pha": sn["tue_pha"],
            "tam_sat": sn["tam_sat"], "trung": trung, "loi": loi}


def _nam_nu(q: str) -> dict:
    vi_du = []
    for nam in range(1960, 2006):
        a, b = pt.menh_quai(nam, "nam")["quai"], pt.menh_quai(nam, "nu")["quai"]
        if q in (a, b):
            vi_du.append({"nam": nam, "nam_gioi": a, "nu_gioi": b})
    so5 = ("Cách tính cung phi: lấy năm sinh rút về một số 1–9, nam và nữ tính theo hai chiều ngược nhau, nên cùng "
           "năm sinh mà nam một cung, nữ một cung. Nếu ra số 5 (giữa Lạc thư, không có quẻ) thì nam gửi sang Khôn, "
           "nữ gửi sang Cấn.")
    return {"so_5": so5, "vi_du": vi_du[:4]}


def _vo_chong() -> dict:
    cm = sach_ghi_mon._kb("phongthuy_cung_menh.json")["vo_chong_khac_nhom"]
    gt = kb._d()["giai_thich"]["vo_chong_khac_menh"]
    return {"han": cm["han"], "am": cm.get("am", ""), "y": cm["y"], "cach_lam": gt["noi_dung"]}


def _quy_tac() -> list[dict]:
    q = kb._d()["quy_tac_thuc_hanh"]
    ra = []
    for ma in ("moc_lap_xuan", "hanh_lang_chung_cu"):
        if ma in q:
            ra.append({"ma": ma, "tieu_de": q[ma]["tieu_de"], "noi_dung": q[ma]["noi_dung"]})
    return ra


def chi_tiet(q: str, nam_xem: int) -> dict | None:
    """Lớp tri thức thêm của trang cung phi `q`. Bản không phải tiếng Việt → None."""
    if not ngon_ngu.la_viet():
        return None
    if q not in pt.QUAI:
        raise ValueError("không có cung phi này")
    return {
        "huong": _huong(q),
        "cung_menh": sach_ghi_mon.phongthuy(quai=q, tuoi=None),   # tuoi=None → bỏ nhóm C
        "nam_nu": _nam_nu(q),
        "vo_chong": _vo_chong(),
        "phong_khac": _phong_khac(q),
        "nam_nay": _nam_nay(q, nam_xem),
        "quy_tac": _quy_tac(),
    }


# ---- Hướng chung hai người (vợ chồng, người cùng nhà) — chỉ năm sinh + giới tính, không lưu ------------------------
def hai_cung(nam_a: int, gioi_a: str, nam_b: int, gioi_b: str) -> dict:
    from app.kb import ten as _ten  # noqa: PLC0415
    from app.kb.loi import L  # noqa: PLC0415
    from app.luangiai.phongthuy_tuoi import CUNG_SLUG  # noqa: PLC0415
    qa, qb = pt.menh_quai(nam_a, gioi_a)["quai"], pt.menh_quai(nam_b, gioi_b)["quai"]
    ba, bb = pt.bang_huong(qa), pt.bang_huong(qb)

    def nguoi(nam, gt, q, b):
        theo = {d: h for h, d in b.items()}
        return {"nam": nam, "gioi_tinh": gt, "quai": q, "nhom": pt.nhom(q), "slug": CUNG_SLUG[q],
                "huong_tot": [theo[d] for d in THU_TU_CAT]}

    na, nb = nguoi(nam_a, gioi_a, qa, ba), nguoi(nam_b, gioi_b, qb, bb)
    huong = [{"huong": h, "du_nien_a": ba[h], "du_nien_b": bb[h], "a_cat": ba[h] in pt.CAT, "b_cat": bb[h] in pt.CAT}
             for h in pt.HUONG]
    chung = [h for h in na["huong_tot"] if bb[h] in pt.CAT]
    cung_nhom = pt.nhom(qa) == pt.nhom(qb)
    noi = L("pt.noi", ", ")
    if cung_nhom:
        loi = L("pt.hai_cung.cung_nhom", "Hai người cùng {nhom}: chung cả bốn hướng tốt ({ds}). Cửa chính, phòng khách theo "
                "hướng tốt nhất của người trụ cột; đầu giường đôi chọn hướng tốt của cả hai.",
                nhom=_ten.ten("nhom_trach", pt.nhom(qa)), ds=noi.join(_ten.ten("huong", h) for h in chung))
    else:
        loi = L("pt.hai_cung.khac_nhom", "Hai người khác nhóm ({a} và {b}) nên không có hướng tốt chung. Cách phổ biến: "
                "cửa chính theo người trụ cột (người ở nhà nhiều nhất, đứng tên nhà), phòng riêng, bàn làm việc, "
                "đầu giường đơn theo mệnh từng người. Không có cách hợp tuyệt đối cho cả hai — đó cũng không phải lý "
                "do để lo chuyện hai người hợp hay không hợp nhau.",
                a=_ten.ten("nhom_trach", pt.nhom(qa)), b=_ten.ten("nhom_trach", pt.nhom(qb)))
    return {"nguoi": [na, nb], "cung_nhom": cung_nhom, "huong_chung": chung, "huong": huong, "loi": loi,
            "sach_vo_chong": _vo_chong() if ngon_ngu.la_viet() else None,   # chỉ bản Việt (KHOA_THEO_CHU)
            "luu_y": L("pt.hai_cung.luu_y", "Chỉ dùng năm sinh: ai sinh trước Lập xuân (khoảng 3–5/2) thì nhập năm trước.")}
