# -*- coding: utf-8 -*-
"""MAU6 — 6 lá số minh hoạ đọc từng bước (RULES, không LLM, tất định).

Nhân vật HƯ CẤU (không phải người thật, không phải người nổi tiếng); ngày giờ sinh được chọn sao cho lá
số mang đúng một kiểu tiêu biểu. Mỗi bước ghép từ CALC (iztro + âm lịch Việt) và KB — dùng chính các
khối bằng chứng của hỏi đáp Tử vi, nên lá mẫu và lá của người dùng nói cùng một giọng. Ngày xem cố
định (NGAY_XEM) để trang SEO không đổi theo ngày.
"""
from __future__ import annotations

from app import ngon_ngu

import copy
import datetime as dt
from functools import lru_cache

from app.calc import tuvi_an_sao as az
from app.hoidap import tuvi as tv
from app.kb import ten as _ten
from app.kb import tu_dien, tuvi_kb as kb
from app.kb.loi import L

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


def _hien(m: dict) -> dict:
    """EN-ALL GĐ 4: tên / tiêu đề / mô tả của nhân vật mẫu theo ngôn ngữ (bản Việt: nguyên văn)."""
    if ngon_ngu.la_viet():
        return m
    k = m["slug"].replace("-", "_")
    return {**m, "ten": L(f"tuvi_ls.mau.{k}.ten", m["ten"]), "tieu_de": L(f"tuvi_ls.mau.{k}.tieu_de", m["tieu_de"]),
            "mo_ta": L(f"tuvi_ls.mau.{k}.mo_ta", m["mo_ta"])}


def danh_sach() -> list[dict]:
    return [{**{k: _hien(m)[k] for k in ("slug", "ten", "tieu_de", "mo_ta")}, "hu_cau": True} for m in MAU]


def _doan(m: dict | None, da_co: set[str], ten: str = "") -> str | None:
    if not m:
        return None
    if ngon_ngu.la_viet():
        van, _ = tv._doan(m, da_co)
    else:
        van = _doan_dich(m, da_co, ten)
    if m.get("loai") == "sao_cung":
        da_co.add(m["sao"])
    return van or None


# ------------------------------------------------------------------ EN-ALL GĐ 4: đoạn đọc theo ngôn ngữ
# Cùng quyết định cấu trúc như `hoidap.tuvi._doan` (da_co theo TÊN Việt) — chỉ chữ khác. Chỉ các loại lá số mẫu dùng.
def _s(x: str) -> str:
    return _ten.ten("sao", x)


def _c(x: str) -> str:
    return _ten.ten("cung", x)


def _ds(xs: list[str]) -> str:
    return ", ".join(_s(x) for x in xs)


def _han_ngan(cung: str) -> str:
    return kb.chu_de_han_ngan(cung) or kb.chu_de_han(cung) or _c(cung)


def _doan_dich(m: dict, da_co: set[str], ten: str) -> str:
    l = m["loai"]
    if l == "cung":
        return L("tuvi_ls.mau.d.cung", "", cung=_c(m["ten"]), y_nghia=m["y_nghia"], xem_duoc=m["xem_duoc"],
                 khong_tra_loi=m["khong_tra_loi"])
    if l == "sao_cung":
        s, c = _s(m["sao"]), _c(m["cung"])
        dau = {"la_so": L("tuvi_ls.mau.d.sao_cung.la_so", "", ten=ten, sao=s, cung=c),
               "muon": L("tuvi_ls.mau.d.sao_cung.muon", "", sao=s, cung=c),
               "kb": L("tuvi_ls.mau.d.sao_cung.kb", "", sao=s, cung=c)}[m["vai"]]
        if m.get("do_sang"):
            dau += f" ({_ten.ten('do_sang', m['do_sang'])} — {m['do_sang_y']})"
        dau += f": {m['noi_dung']}"
        if m.get("sac_thai"):
            dau += f" {m['sac_thai']}"
        if m["sao"] not in da_co:
            dau += " " + L("tuvi_ls.mau.d.net_chung", "", sao=s, tinh_chat=m["tinh_chat"], mat_toi=m["mat_toi"].rstrip("."))
        return dau
    if l == "cach_cuc":
        out = L("tuvi_ls.mau.d.cach_cuc", "", ten=m["ten"], han=m["ten_han"], dieu_kien=m["dieu_kien"], y=m["y"],
                mat_toi=m["mat_toi"], loi_khuyen=m["loi_khuyen"])
        if m["sat_hoi"]:
            if "__pha_cach__" in da_co:
                out += " " + L("tuvi_ls.mau.d.pha_cach_lai", "", sao=_ds(m["sat_hoi"]))
            else:
                out += " " + L("tuvi_ls.mau.d.pha_cach", "", sao=_ds(m["sat_hoi"]), luu_y=L("tuvi_ls.cach_cuc_luu_y", kb.luu_y_pha_cach()))
                da_co.add("__pha_cach__")
        return out
    if l == "than_cu":
        return L("tuvi_ls.mau.d.than_cu", "", cung=_c(m["cung"]), menh_chu=_s(m["menh_chu"]), than_chu=_s(m["than_chu"]),
                 cuc=_ten.ten("cuc", m["cuc"]))
    if l == "vo_chinh_dieu":
        mu = _ds(m["sao_muon"]) or L("tuvi_ls.mau.d.khong_chinh_tinh", "")
        return L("tuvi_ls.mau.d.vo_chinh_dieu", "", cung=_c(m["cung"]), muon=_c(m["muon_cung"]), sao=mu)
    if l == "tu_hoa_cung":
        h = _ten.ten("hoa", m["hoa"])
        sao = " " + L("tuvi_ls.mau.d.sao_hoa", "", sao=_s(m["sao"]), hoa=h) if m.get("sao") else ""
        return L("tuvi_ls.mau.d.tu_hoa_cung", "", hoa=h, cung=_c(m["cung"]), sao=sao, noi_dung=m["noi_dung"],
                 y_nghia=m["y_nghia"], luu_y=m["luu_y_hoa"])
    if l == "han":
        cc = f"{_ten.ten('can', m['can'])} {_ten.ten('chi', m['chi'])}"
        if m["lop"] == "dai_han":
            out = L("tuvi_ls.mau.d.han.dai_han", "", tu=m["tu_tuoi"], den=m["den_tuoi"], chu_de=_han_ngan(m["cung_goc"]),
                    cung=_c(m["cung_goc"]), can_chi=cc)
        else:
            out = L(f"tuvi_ls.mau.d.han.{m['lop']}", "", chu_de=_han_ngan(m["cung_goc"]), cung=_c(m["cung_goc"]), can_chi=cc)
        out += (L("tuvi_ls.mau.d.han.chinh_tinh", "", sao=_ds(m["chinh_tinh"])) if m["chinh_tinh"]
                else L("tuvi_ls.mau.d.han.khong_chinh_tinh", ""))
        for x in m.get("tu_hoa_lop", []):
            out += " " + L(f"tuvi_ls.mau.d.han.hoa.{'giai_doan' if m['lop'] == 'dai_han' else 'nam'}."
                           f"{'loc' if x['hoa'] == 'Lộc' else 'ky'}", "", hoa=_ten.ten("hoa", x["hoa"]), sao=_s(x["sao"]),
                           cung=_c(x["cung_goc"]), chu_de=_han_ngan(x["cung_goc"]))
        return out
    if l == "cac_dai_han":
        ds = "; ".join(f"{x['tu_tuoi']}–{x['den_tuoi']}: {_c(x['cung_goc'])}" for x in m["ds"])
        return L("tuvi_ls.mau.d.cac_dai_han", "", ds=ds)
    van, _ = tv._doan(m, da_co)            # loại khác: chưa có bản dịch (lá số mẫu không dùng)
    return van


def _buoc(ma: str, doan: list[str | None], ten: str) -> dict:
    k = kb.doc_tung_buoc(ma)
    ds = [d.replace("của chính bạn", f"của chính {ten}").replace("của bạn", f"của {ten}") for d in doan if d] \
        if ngon_ngu.la_viet() else [d for d in doan if d]
    return {"ma": ma, "tieu_de": k["tieu_de"], "cach_doc": k["cach_doc"], "doan": ds,
            "thuat_ngu": tu_dien.nhan_dien("\n".join([k["cach_doc"], *ds]), "tuvi")}


def _sao_cung(ls: dict, ten_cung: str, da_co: set[str], ten: str = "") -> list[str | None]:
    c = tv._cung_ten(ls, ten_cung)
    if c["chinh_tinh"]:
        return [_doan(tv._m_sao_cung(s["ten"], ten_cung, s["do_sang"], "la_so"), da_co, ten) for s in c["chinh_tinh"]]
    doi = tv._cung_doi(ls, c)
    out = [_doan({"loai": "vo_chinh_dieu", "cung": ten_cung, "muon_cung": doi["ten"],
                  "sao_muon": [s["ten"] for s in doi["chinh_tinh"]]}, da_co, ten)]
    return out + [_doan(tv._m_sao_cung(s["ten"], ten_cung, None, "muon"), da_co, ten) for s in doi["chinh_tinh"][:2]]


@ngon_ngu.lru(maxsize=None)
def _doc(slug: str) -> dict:
    from app.tuvi_api import TuanTrietInput, _DauVao, api_an_sao
    m = _hien(_THEO_SLUG[slug])
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
    b1 = [_doan(tv._m_cung("Mệnh"), da_co, ten),
          _doan({"loai": "than_cu", "cung": than["ten"], "menh_chu": ls["menh_chu"], "than_chu": ls["than_chu"],
                 "cuc": ls["cuc"]}, da_co, ten)]
    b2 = _sao_cung(ls, "Mệnh", da_co, ten)
    b3 = [d for t in ("Quan Lộc", "Tài Bạch", "Thiên Di") for d in _sao_cung(ls, t, da_co, ten)]
    b4 = [_doan({"loai": "cach_cuc", **kb.cach_cuc(c["ma"]), "cung_lien_quan": c["cung"], "sat_hoi": c["sat_hoi"]}, da_co, ten)
          for c in ls["cach_cuc"] if c["ma"] != "than_menh_dong_cung"][:6]
    if not b4:
        b4 = [L("tuvi_ls.mau.khong_cach", "Quanh cung Mệnh không hình thành cách cục có tên trong danh mục — điều này bình "
                "thường; lá số được đọc qua từng sao và từng cung như các bước trên.")]
    b5 = [_doan(tv._m_tu_hoa(x["hoa"], x["cung"], x["sao"]), da_co, ten) for x in ls["tu_hoa"]]
    cac = {"loai": "cac_dai_han", "ds": [{"cung_goc": c["ten"], "tu_tuoi": c["dai_han"][0], "den_tuoi": c["dai_han"][1]}
                                         for c in sorted(ls["cung"], key=lambda c: c["dai_han"][0])]}
    b6 = [_doan(cac, da_co, ten), L("tuvi_ls.mau.tuoi_mu", f"Tại ngày xem {NGAY_XEM.strftime('%d/%m/%Y')}, {ten} "
                                    f"{vh['tuoi_mu']} tuổi mụ.", ngay=NGAY_XEM.strftime('%d/%m/%Y'), ten=ten,
                                    tuoi=vh["tuoi_mu"]),
          _doan(tv._lop_han(ls, "dai_han", vh, "tham_khao"), da_co, ten)]
    b7 = [_doan(tv._lop_han(ls, lop, vh, "tham_khao"), da_co, ten) for lop in ("luu_nien", "tieu_han")]
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
