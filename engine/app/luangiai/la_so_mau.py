# -*- coding: utf-8 -*-
"""MAU6 — 6 lá số minh hoạ đọc từng bước (RULES, không LLM, tất định).

Nhân vật HƯ CẤU (không phải người thật, không phải người nổi tiếng); ngày giờ sinh được chọn sao cho lá
số mang đúng một kiểu tiêu biểu. Mỗi bước ghép từ CALC (iztro + âm lịch Việt) và KB — dùng chính các
khối bằng chứng của hỏi đáp Tử vi, nên lá mẫu và lá của người dùng nói cùng một giọng. Ngày xem cố
định (NGAY_XEM) để trang SEO không đổi theo ngày.
"""
from __future__ import annotations

import copy
import datetime as dt
from functools import lru_cache

from app.calc import tuvi_an_sao as az
from app.hoidap import tuvi as tv
from app.kb import tu_dien, tuvi_kb as kb

NGAY_XEM = dt.date(2026, 6, 1)

MAU = [
    {"slug": "tu-phu-dong-cung", "ten": "Minh An", "gioi_tinh": "nu", "ngay": "1978-08-06", "gio": "12:00",
     "tieu_de": "Tử Phủ đồng cung — người trụ cột điềm tĩnh",
     "mo_ta": "Hai sao 'vua' và 'kho' cùng ngồi cung Mệnh: kiểu người vững vàng, giỏi giữ gìn và tổ chức."},
    {"slug": "that-sat-trieu-dau", "ten": "Quốc Bảo", "gioi_tinh": "nam", "ngay": "1978-02-21", "gio": "00:30",
     "tieu_de": "Thất Sát triều Đẩu — người dám ra trận",
     "mo_ta": "Thất Sát ở Mệnh trong bộ Sát Phá Tham: gan dạ, đời nhiều thay đổi, cần học kiên nhẫn."},
    {"slug": "co-nguyet-dong-luong", "ten": "Thu Hà", "gioi_tinh": "nu", "ngay": "1978-08-06", "gio": "04:00",
     "tieu_de": "Cơ Nguyệt Đồng Lương — người làm việc bằng trí óc",
     "mo_ta": "Bốn sao Cơ, Nguyệt, Đồng, Lương hội về Mệnh: chu đáo, thích ổn định, hợp nghề chuyên môn."},
    {"slug": "cu-nhat-dong-cung", "ten": "Đức Huy", "gioi_tinh": "nam", "ngay": "1978-05-06", "gio": "16:00",
     "tieu_de": "Cự Nhật đồng cung — người dùng lời nói làm nghề",
     "mo_ta": "Cự Môn và Thái Dương cùng cung Mệnh: ăn nói có sức nặng, hợp giảng dạy, tư vấn, truyền thông."},
    {"slug": "menh-vo-chinh-dieu", "ten": "Ngọc Lan", "gioi_tinh": "nu", "ngay": "1981-11-06", "gio": "08:00",
     "tieu_de": "Mệnh vô chính diệu — Minh Châu Xuất Hải",
     "mo_ta": "Cung Mệnh không có chính tinh, mượn sao đối diện; Nhật Nguyệt sáng chiếu về như ngọc sáng ra biển."},
    {"slug": "nhat-le-trung-thien", "ten": "Hải Yến", "gioi_tinh": "nu", "ngay": "1981-08-21", "gio": "04:00",
     "tieu_de": "Nhật Lệ Trung Thiên — mặt trời giữa trưa",
     "mo_ta": "Thái Dương miếu tại Ngọ thủ Mệnh, lại có đủ Lộc Quyền Khoa: rộng rãi, có tiếng, nhiều việc vì người."},
]
_THEO_SLUG = {m["slug"]: m for m in MAU}
_NOI_SINH = "ha-noi"
# Ngày đăng / sửa lời đọc lá số mẫu (schema Article) — sửa lời đọc thì đổi CAP_NHAT.
NGAY_DANG, CAP_NHAT = "2026-10-08", "2026-10-08"


def danh_sach() -> list[dict]:
    return [{**{k: m[k] for k in ("slug", "ten", "tieu_de", "mo_ta")}, "hu_cau": True} for m in MAU]


def _doan(m: dict | None, da_co: set[str]) -> str | None:
    if not m:
        return None
    van, _ = tv._doan(m, da_co)
    if m.get("loai") == "sao_cung":
        da_co.add(m["sao"])
    return van or None


def _buoc(ma: str, doan: list[str | None], ten: str) -> dict:
    k = kb.doc_tung_buoc(ma)
    ds = [d.replace("của chính bạn", f"của chính {ten}").replace("của bạn", f"của {ten}") for d in doan if d]
    return {"ma": ma, "tieu_de": k["tieu_de"], "cach_doc": k["cach_doc"], "doan": ds,
            "thuat_ngu": tu_dien.nhan_dien("\n".join([k["cach_doc"], *ds]), "tuvi")}


def _sao_cung(ls: dict, ten_cung: str, da_co: set[str]) -> list[str | None]:
    c = tv._cung_ten(ls, ten_cung)
    if c["chinh_tinh"]:
        return [_doan(tv._m_sao_cung(s["ten"], ten_cung, s["do_sang"], "la_so"), da_co) for s in c["chinh_tinh"]]
    doi = tv._cung_doi(ls, c)
    out = [_doan({"loai": "vo_chinh_dieu", "cung": ten_cung, "muon_cung": doi["ten"],
                  "sao_muon": [s["ten"] for s in doi["chinh_tinh"]]}, da_co)]
    return out + [_doan(tv._m_sao_cung(s["ten"], ten_cung, None, "muon"), da_co) for s in doi["chinh_tinh"][:2]]


@lru_cache(maxsize=None)
def _doc(slug: str) -> dict:
    from app.tuvi_api import TuanTrietInput, _DauVao, api_an_sao
    m = _THEO_SLUG[slug]
    inp = TuanTrietInput(birth_date=dt.date.fromisoformat(m["ngay"]), birth_time=m["gio"],
                         gender=m["gioi_tinh"], noi_sinh=_NOI_SINH)
    la_so = api_an_sao(inp)
    dv = _DauVao(inp)
    cal = dv.tb.calendar_dt
    ti = az.time_index(cal.hour, cal.minute)
    ls = tv.tom_tat(az.an_sao_tho(cal.date(), ti, m["gioi_tinh"], "vi-VN", tz_lich=dv.tz_lich, **dv.tuy_chon))
    vh = az.van_han(cal.date(), ti, m["gioi_tinh"], NGAY_XEM, tz_lich=dv.tz_lich,
                    thang_nhuan=dv.tuy_chon["thang_nhuan"])
    ten, da_co = m["ten"], set()

    than = next(c for c in ls["cung"] if c["la_than"])
    b1 = [_doan(tv._m_cung("Mệnh"), da_co),
          _doan({"loai": "than_cu", "cung": than["ten"], "menh_chu": ls["menh_chu"], "than_chu": ls["than_chu"],
                 "cuc": ls["cuc"]}, da_co)]
    b2 = _sao_cung(ls, "Mệnh", da_co)
    b3 = [d for t in ("Quan Lộc", "Tài Bạch", "Thiên Di") for d in _sao_cung(ls, t, da_co)]
    b4 = [_doan({"loai": "cach_cuc", **kb.cach_cuc(c["ma"]), "cung_lien_quan": c["cung"], "sat_hoi": c["sat_hoi"]}, da_co)
          for c in ls["cach_cuc"] if c["ma"] != "than_menh_dong_cung"][:6]
    if not b4:
        b4 = ["Quanh cung Mệnh không hình thành cách cục có tên trong danh mục — điều này bình thường; "
              "lá số được đọc qua từng sao và từng cung như các bước trên."]
    b5 = [_doan(tv._m_tu_hoa(x["hoa"], x["cung"], x["sao"]), da_co) for x in ls["tu_hoa"]]
    cac = {"loai": "cac_dai_han", "ds": [{"cung_goc": c["ten"], "tu_tuoi": c["dai_han"][0], "den_tuoi": c["dai_han"][1]}
                                         for c in sorted(ls["cung"], key=lambda c: c["dai_han"][0])]}
    b6 = [_doan(cac, da_co), f"Tại ngày xem {NGAY_XEM.strftime('%d/%m/%Y')}, {ten} {vh['tuoi_mu']} tuổi mụ.",
          _doan(tv._lop_han(ls, "dai_han", vh, "tham_khao"), da_co)]
    b7 = [_doan(tv._lop_han(ls, lop, vh, "tham_khao"), da_co) for lop in ("luu_nien", "tieu_han")]
    b7.append(kb.luu_y("tham_khao"))

    buoc = [_buoc(ma, d, ten) for ma, d in (("menh_than", b1), ("chinh_tinh", b2), ("tam_phuong", b3),
                                              ("cach_cuc", b4), ("tu_hoa", b5), ("dai_han", b6), ("luu_nien", b7))]
    return {**{k: m[k] for k in ("slug", "ten", "gioi_tinh", "ngay", "gio", "tieu_de", "mo_ta")},
            "noi_sinh": _NOI_SINH, "hu_cau": True, "ngay_xem": NGAY_XEM.isoformat(),
            "la_so": la_so, "buoc": buoc, "trang_thai": "nhap_ai",
            # Ngày đăng / sửa nội dung (schema Article) — đổi CAP_NHAT khi sửa lời đọc của lá số mẫu.
            "ngay_dang": NGAY_DANG, "cap_nhat": CAP_NHAT}


def doc(slug: str) -> dict:
    """KeyError nếu slug không có."""
    return copy.deepcopy(_doc(slug))
