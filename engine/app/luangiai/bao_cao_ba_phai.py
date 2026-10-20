"""TS-V3b — Báo cáo ba phái (Pitago · Chaldea · Qabalah) theo chương, cùng khuôn "Luận giải toàn bộ" (`toan_bo`).

Chương 1 (điểm chung giữa các phái) là chương đọc miễn phí; tầng web cắt các chương sau thành lời mời và mở bằng Sao
(`web/lib/luan-giai-sao.ts`). Chương cuối dùng PHIẾU bình chọn "Phái nào nói đúng về bạn?" — web đếm trên máy người
dùng và gửi kèm từng lượt (chỉ 3 con số đếm), engine không lưu. Không có tên, ngày sinh trong lời văn. Template, không
LLM (dien_dat = "mau").
"""
from __future__ import annotations

import datetime as dt

from app.calc import thanso as tinh
from app.kb import thanso_v2 as kb
from app.luangiai import thanso, thanso_chaldean as lch, thanso_kabbalah as lkb, tong_hop
from app.luangiai.toan_bo import _moi_xem
from app.narrative import hoi_van

PHAI = ("pitago", "chaldea", "kabbalah")
DIEM_RIENG = {
    "pitago": ("Pitago đọc từ họ tên khai sinh và ngày sinh, mạnh ở bức tranh cấu trúc: đường đời, sứ mệnh, linh hồn, "
               "nhân cách — hợp với người muốn một khung rõ ràng để tự soát."),
    "chaldea": ("Chaldea coi trọng tên thường gọi và âm của chữ, có số kép mang sắc thái riêng — hợp với người thấy "
                "mình được định hình bởi cách người khác gọi mình hằng ngày."),
    "kabbalah": ("Qabalah đọc tên thành chữ Hebrew và đặt lên Cây Sự sống — thiên về biểu tượng và hành trình nội tâm "
                 "hơn là tính cách bề mặt."),
}
TIEU_DE = {
    "diem_chung": "Ba phái cùng thấy gì ở bạn",
    "pitago": "Theo Pitago",
    "chaldea": "Theo Chaldea",
    "kabbalah": "Theo Qabalah",
    "khac_nhau": "Ba phái nói khác nhau ở đâu",
    "phai_hop": "Phái nói đúng về bạn nhất",
}
_KHAC_NHAU = ("khac_nhip", "bo_sung")


def _cau_dau(s: str | None) -> str:
    s = (s or "").strip()
    i = s.find(". ")
    return s[: i + 1] if i > 0 else s


def _diem_chung(th: dict) -> list[str]:
    doan = []
    for s in th["so_noi_bat"][:3]:
        doan.append(f"Số {s['goc']} gặp ở {s['lan']} nguồn tính độc lập ({', '.join(s['vi_tri'])}): "
                    f"{(s['tu_khoa'] or '').lower()}." + (f" Mặt cần để ý: {s['mat_toi'].lower()}." if s["mat_toi"] else ""))
    if not th["so_noi_bat"]:
        doan.append("Ba phái chưa cùng chỉ ra số nào lặp lại ở hai nguồn độc lập — mỗi phái là một góc nhìn riêng về bạn.")
    for t in th["tuong_tac"]:
        if t["quan_he"] in ("cong_huong", "nhip_thoi_gian"):
            doan.append(f"{t['ten_quan_he']} · {t['ten_nhom']}: {t['cach_doc']} {t['goi_y']}".strip())
    doan += [th["cach_doc"], th["ghi_chu_duong_doi"]]
    if th["so_noi_bat"] and th["so_noi_bat"][0]["phan_chung"]:
        doan.append(f"Câu hỏi để tự soi: {th['so_noi_bat'][0]['phan_chung']}")
    return doan


def _pitago(lg: dict) -> list[str]:
    doan = []
    for v in lg["cac_vi_tri"][:4]:
        n = v.get("nghia") or {}
        doan.append(f"{v['ten']} {v['gia_tri']} — {v['khung']}: {(n.get('tu_khoa') or '').lower()}."
                    + (f" Mặt tối: {n['mat_toi'].lower()}." if n.get("mat_toi") else ""))
    hoi = next(((v.get("nghia") or {}).get("phan_chung") for v in lg["cac_vi_tri"] if (v.get("nghia") or {}).get("phan_chung")), None)
    if hoi:
        doan.append(f"Câu hỏi để tự soi: {hoi}")
    return doan


def _chaldea(c: dict) -> list[str]:
    doan = []
    da_noi: set[int] = set()
    for s in c["cac_so"]:
        g, k = s.get("nghia_goc") or {}, s.get("nghia_kep") or {}
        so = f"{s['kep']}/{s['goc']}" if s["kep"] else str(s["goc"])
        # Số gốc lặp lại (thường gặp ở Chaldea) chỉ giải nghĩa lần đầu, các lần sau chỉ thêm sắc thái số kép.
        cau = (f"{s['ten']} {so} — {g.get('ten', '')}: {_cau_dau(g.get('xu_huong'))}" if s["goc"] not in da_noi
               else f"{s['ten']} {so} — cũng là {g.get('ten', '').lower()} (gốc {s['goc']}).")
        da_noi.add(s["goc"])
        if k.get("bieu_tuong"):
            cau += f" Số kép {s['kep']}: {k['bieu_tuong'].lower()}."
        doan.append(cau)
    doan.extend(f"{gd['ten']}: {gd['cach_dung']}" for gd in c.get("giao_diem", []) if gd.get("cung_so") and gd.get("cach_dung"))
    doan.append(c["gioi_thieu"].get("cach_doc") or c["gioi_thieu"].get("tom_tat", ""))
    return [d for d in doan if d]


def _kabbalah(k: dict) -> list[str]:
    doan = []
    for s in k["cac_so"]:
        n = s.get("nghia") or {}
        if s["ma"] == "con_duong_ten":
            doan.append(f"{s['ten']} {s['so']} — chữ {n.get('ten')} ({n.get('nghia_chu', '')}), con đường số "
                        f"{s['so_duong_cay']} trên Cây: {_cau_dau(n.get('xu_huong'))}")
        else:
            doan.append(f"{s['ten']} {s['so']} — {n.get('ten')} ({(n.get('nghia') or '').lower()}): {_cau_dau(n.get('xu_huong'))}")
    doan.append(k["gioi_thieu"].get("cach_doc", ""))
    hoi = next(((s.get("nghia") or {}).get("cau_tu_soi") for s in k["cac_so"] if (s.get("nghia") or {}).get("cau_tu_soi")), None)
    if hoi:
        doan.append(f"Câu hỏi để tự soi: {hoi}")
    return [d for d in doan if d]


def _khac_nhau(th: dict) -> list[str]:
    doan = [f"{t['ten_quan_he']} · {t['ten_nhom']}: {t['cach_doc']} {t['goi_y']}".strip()
            for t in th["tuong_tac"] if t["quan_he"] in _KHAC_NHAU]
    return doan or ["Ở các nhóm so được, ba phái không vênh nhau — các con số khác nhau chủ yếu vì mỗi phái đọc một phần "
                    "khác của tên."]


def _phai_hop(phieu: dict[str, int] | None) -> list[str]:
    ten = kb.do_thi()["ten_phai"]
    tong = sum((phieu or {}).values())
    if not tong:
        return ["Bạn chưa bình chọn phái nào. Sau mỗi câu trả lời ở mục hỏi đáp, bấm chọn phái nói đúng về bạn hơn — "
                "sau 7 lần, chương này cho biết phái hợp với bạn nhất."]
    xep = sorted(PHAI, key=lambda p: (-(phieu or {}).get(p, 0), PHAI.index(p)))
    dau = [p for p in xep if phieu.get(p, 0) == phieu.get(xep[0], 0)]
    so = phieu.get(xep[0], 0)
    if len(dau) > 1:
        doan = [f"Sau {tong} lần bình chọn, {' và '.join(ten[p] for p in dau)} ngang nhau ({so}/{tong} mỗi phái). "
                "Hai cách đọc này cùng chạm vào bạn — đọc song song sẽ thấy rõ hơn chỗ chúng bổ sung cho nhau."]
    else:
        doan = [f"Sau {tong} lần bình chọn, bạn thấy {ten[xep[0]]} nói đúng về mình nhiều nhất ({so}/{tong})."]
    doan += [DIEM_RIENG[p] for p in dau]
    doan.append(f"Gợi ý: dùng {' hoặc '.join(ten[p] for p in dau)} làm góc nhìn chính, phái còn lại để đối chiếu ở chỗ "
                "bạn còn băn khoăn. Phiếu chỉ đếm trên máy của bạn.")
    doan.append("Câu hỏi để tự soi: Điều gì ở cách đọc này khiến bạn thấy đúng — con số, hay cách nó gọi tên điều bạn "
                "vốn đã biết về mình?")
    return doan


def bao_cao(ho_ten: list[str], ngay: int, thang: int, nam: int, ngay_xem: dt.date, quy_uoc: str = "tong_het",
            phieu: dict[str, int] | None = None) -> dict:
    th = tong_hop.tong_hop(ho_ten, ngay, thang, nam, ngay_xem, quy_uoc)
    noi_dung = {
        "diem_chung": _diem_chung(th),
        "pitago": _pitago(thanso.luan_giai(ho_ten, ngay, thang, nam, quy_uoc)),
        "chaldea": _chaldea(lch.luan_chaldea(ho_ten, ngay, thang, nam, quy_uoc)),
        "kabbalah": _kabbalah(lkb.luan_kabbalah(ho_ten, ngay, thang, nam, quy_uoc)),
        "khac_nhau": _khac_nhau(th),
        "phai_hop": _phai_hop(phieu),
    }
    chuong = [{"ma": ma, "tieu_de": TIEU_DE[ma], "doan": doan, "moi_xem": _moi_xem("thanso3", ma, doan)}
              for ma, doan in noi_dung.items()]
    return {"mo_dun": "thanso3", "chuong": chuong, "ket": hoi_van.KET, "dien_dat": "mau",
            "nguon": th["nguon"], "source_id": th["source_id"], "school_id": th["school_id"],
            "trang_thai": th["trang_thai"]}


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
    c = next(s for s in lch.luan_chaldea(ho_ten, ngay, thang, nam, quy_uoc)["cac_so"] if s["ma"] == "ten_goi")
    k = next(s for s in lkb.luan_kabbalah(ho_ten, ngay, thang, nam, quy_uoc)["cac_so"] if s["ma"] == "con_duong_ten")
    kn = k.get("nghia") or {}
    return {
        "mat": mat,
        "goc_nhin": [
            {"phai": "pitago", "ten_phai": ten["pitago"], "nhan": f"Đường đời {dd}", "y": _cau_dau(y_pt)},
            {"phai": "chaldea", "ten_phai": ten["chaldea"], "nhan": f"Số tên gọi {c['kep']}/{c['goc']}" if c["kep"] else f"Số tên gọi {c['goc']}",
             "y": _cau_dau((c.get("nghia_goc") or {}).get("xu_huong"))},
            {"phai": "kabbalah", "ten_phai": ten["kabbalah"], "nhan": f"Con đường của tên {k['so']} · {kn.get('ten')}",
             "y": _cau_dau(kn.get("xu_huong"))},
        ],
        "luu_y": "Ba phái tính từ cùng họ tên và ngày sinh bằng ba bảng khác nhau — chọn câu nghe đúng với bạn hơn.",
    }
