# -*- coding: utf-8 -*-
"""Hỏi đáp Kinh Dịch (HH-1) — RULES: phân loại, chọn phái, chốt dụng thần TRƯỚC khi
gieo, ra quẻ, gói bằng chứng chỉ từ KB; NARRATIVE: template (+ LLM có kiểm tra).

Kỷ luật từ skill `kinh-dich` (source-skills/kinh-dich/SKILL.md):
  - LLM không chọn quẻ: quẻ do engine gieo (CSPRNG), người dùng gieo tay, hoặc Mai Hoa
    theo thời điểm; API cấm mọi trường chọn quẻ theo số.
  - Một trường phái mỗi lượt; chọn TRƯỚC khi ra quẻ.
  - Lục Hào: dụng thần chốt theo loại việc TRƯỚC khi ra quẻ.
Chế độ (quyết định 2026-09-30): tu_dong | nghia_ly | day_du.
"""
from __future__ import annotations

import datetime as dt
import re
import unicodedata

from app.calc import kinhdich, kinhdich_maihoa as mh, luc_hao as lh, vuong_suy as vs
from app.calc.kinhdich_vendor import CHI_NH, KHAC, SINH
from app.hoidap import chung
from app.kb import kinhdich_kb as kb
from app.luangiai import kinhdich_doi_song as kd_ds
from app.narrative import hoi_van

MAI_HOA_CACH = ("mai_hoa", "mai_hoa_so", "mai_hoa_phuong")
_VN = dt.timezone(dt.timedelta(hours=7))

CHE_DO = ("tu_dong", "nghia_ly", "day_du")
LV_TEN = {"cong_viec": "Công việc", "tinh_cam": "Tình cảm", "gia_dinh": "Gia đình",
          "tien_bac": "Tiền bạc", "hoc_hanh": "Học hành"}

DOC_NHANH = [r"mai hoa", r"xem nhanh", r"doc nhanh", r"hom nay di", r"the va dung", r"the dung",
             r"lap que theo gio", r"nghe tieng"]
DU_DOAN = [r"co dau", r"co do", r"dau khong", r"do khong", r"thanh cong khong", r"co duoc", r"duoc khong",
           r"thang hay thua", r"co thang", r"ky duoc", r"doi duoc", r"xin duoc", r"ban duoc",
           r"co ben", r"quay lai khong", r"co thich", r"di den hon nhan", r"co loi", r"bao gio",
           r"khi nao", r"co gap", r"co len chuc", r"co tro ve",
           r"co thanh khong", r"thanh hay khong", r"tim lai duoc"]                      # HH-CT2
QUYET_DINH = [r"co nen", r"nen .* hay", r"nen lam gi", r"nen ung xu", r"nen xu ly", r"nen phan ung",
              r"xin mot que", r"dinh huong", r"nen the nao", r"nen chon", r"nen tra", r"nen noi",
              r"nen hieu the nao"]
KY_THUAT = [r"la gi", r"nghia la gi", r"co y nghia gi", r"khac .* the nao", r"tai sao", r"vi sao",
            r"doc the nao", r"the nao cho dung", r"khac gi"]

# (dụng thần, mẫu) — thứ tự ưu tiên: người cụ thể → tiền → giấy tờ → công danh → khác.
DUNG_THAN = [
    ("Phụ Mẫu", [r"bo toi", r"me toi", r"cha me", r"bo me", r"ong ba"]),
    ("Tử Tôn", [r"con toi", r"con cai", r"dua con", r"binh an", r"thuoc"]),
    ("Thê Tài", [r"tien", r"no nay", r"mon no", r"doi no", r"loi khong", r"co loi", r"lam an",
                 r"ban duoc", r"luong", r"thuong", r"vo toi", r"co ay", r"ban gai", r"hang hoa",
                 r"mat (vi|do|tien|xe|dien thoai|trom)", r"tai san"]),        # HH-CT2: mất của → Thê Tài
    ("Phụ Mẫu", [r"hop dong", r"giay to", r"visa", r"ho so", r"nha", r"tin tuc", r"thu tu"]),
    ("Quan Quỷ", [r"phong van", r"thang chuc", r"len chuc", r"cong viec", r"viec moi", r"tim duoc viec",
                  r"cong danh", r"thi", r"dau", r"do khong", r"kien", r"chong toi", r"anh ay",
                  r"ban trai", r"du an", r"xet tuyen", r"thanh cong"]),
    ("Huynh Đệ", [r"anh em", r"ban be", r"ban than", r"doi thu", r"canh tranh"]),
]


def _khong_dau(s: str) -> str:
    s = s.replace("Đ", "D").replace("đ", "d")
    return "".join(c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn").lower()


TUONG = {"Càn": "Thiên", "Đoài": "Trạch", "Ly": "Hỏa", "Chấn": "Lôi", "Tốn": "Phong", "Khảm": "Thủy",
         "Cấn": "Sơn", "Khôn": "Địa"}


def _ten_day_du() -> list[tuple[int, str]]:
    """Tên đầy đủ 64 quẻ (thượng tượng + hạ tượng + tên ngắn; quẻ thuần: 'Thuần X' / 'Bát Thuần X')."""
    from app.calc import kinhdich_vendor as v  # noqa: PLC0415
    ds: list[tuple[int, str]] = []
    for ha, hang in v.KW.items():
        for thuong, so in hang.items():
            ngan = v.TEN[so]
            if ha == thuong:
                ds += [(so, f"Bát Thuần {ngan}"), (so, f"Thuần {ngan}"), (so, f"{TUONG[ha]} Vi {TUONG[ha]}")]
            else:
                ds.append((so, f"{TUONG[thuong]} {TUONG[ha]} {ngan}"))
    return ds


def _que_nhac(cau: str) -> int | None:
    """Quẻ được nhắc trong câu: tên đầy đủ ('Thuỷ Hoả Ký Tế', không cần chữ 'quẻ'), 'quẻ <tên ngắn>',
    hoặc 'quẻ (số) N' (1–64). Có dấu ưu tiên."""
    thap = cau.lower()
    kd = _khong_dau(cau)
    for so, t in sorted(_ten_day_du(), key=lambda kv: -len(kv[1])):
        if re.search(r"(?<!\w)" + re.escape(_khong_dau(t)) + r"(?!\w)", kd):
            return so
    ten = sorted(kb.ten_que().items(), key=lambda kv: -len(kv[1]))
    for so, t in ten:
        if re.search(r"quẻ\s+" + re.escape(t.lower()) + r"(?!\w)", thap):
            return so
    ung = [so for so, t in ten if re.search(r"que\s+" + re.escape(_khong_dau(t)) + r"(?!\w)", kd)]
    if ung:
        return ung[0]
    m = re.search(r"que\s+(?:so|thu)\s+(\d{1,2})(?!\d)", kd)
    return int(m.group(1)) if m and 1 <= int(m.group(1)) <= 64 else None


HAO_TEN = {"so": 1, "nhi": 2, "tam": 3, "tu": 4, "ngu": 5, "thuong": 6}


def _hao_nhac(cau: str) -> int | None:
    """'hào 5', 'hào thứ 5', 'hào ngũ', 'cửu ngũ', 'lục nhị'… → vị trí hào 1..6."""
    kd = _khong_dau(cau)
    m = re.search(r"hao\s+(?:thu\s+)?([1-6])(?!\d)", kd)
    if m:
        return int(m.group(1))
    m = re.search(r"(?:hao|cuu|luc)\s+(so|nhi|tam|tu|ngu|thuong)(?!\w)", kd)
    return HAO_TEN[m.group(1)] if m else None


def _giai_thich_khop(t: str) -> list[str]:
    return [ma for ma, m in kb.giai_thich_tat_ca().items() if any(k in t for k in m["tu_khoa"])]


def phan_loai(cau_hoi: str, che_do: str = "tu_dong") -> dict:
    t = chung.chuan_hoa(cau_hoi)
    kq = {"cau_chuan_hoa": t, "che_do": che_do, "que_nhac": _que_nhac(cau_hoi), "hao_nhac": _hao_nhac(cau_hoi),
          "giai_thich": _giai_thich_khop(t), "linh_vuc": chung.linh_vuc_doi_song(t),
          "truong_phai": None, "dung_than": None, "xu_ly": "tra_loi", "loai": None}
    db = chung.dac_biet(t)
    if db:
        kq.update(xu_ly=db, loai="dac_biet")
        return kq
    # Đã nêu tên quẻ + hỏi chuyện cần quyết → đọc chính quẻ đó (người hỏi đã có quẻ), không gieo quẻ khác.
    if kq["que_nhac"] and (re.search(r"gieo duoc|duoc que|ra que", t) or chung.co(t, QUYET_DINH + DU_DOAN)):
        kq.update(loai="doc_que_da_co", truong_phai="nghia_ly")
        return kq
    # Hỏi về một quẻ đã nêu tên/số (nghĩa, hào, "là quẻ gì") mà không nhờ quyết định → TRA quẻ đó,
    # không gieo quẻ mới.
    tra = kq["que_nhac"] and (chung.co(t, KY_THUAT) or kq["hao_nhac"] or not chung.co(t, QUYET_DINH + DU_DOAN)
                              or re.search(r"noi gi|que gi|y nghia", t))
    if kq["giai_thich"] or tra:
        kq["loai"] = "ky_thuat"
        return kq
    if chung.co(t, DOC_NHANH):
        loai, phai = "doc_nhanh", "mai_hoa"
    elif chung.co(t, QUYET_DINH):
        loai, phai = "quyet_dinh", "nghia_ly"
    elif chung.co(t, DU_DOAN):
        loai, phai = "du_doan", "luc_hao"
    else:
        loai, phai = "quyet_dinh", "nghia_ly"
    if che_do == "nghia_ly":
        phai = "nghia_ly"
    kq.update(loai=loai, truong_phai=phai)
    if phai == "luc_hao":
        kq["dung_than"] = next((dt_ for dt_, mau in DUNG_THAN if chung.co(t, mau)), "Ứng")
    return kq


# --------------------------------------------------------------------------- #
def _muc_que(so: int, vai: str, lv: str | None) -> dict | None:
    q = kb.que(so)
    if not q:
        return None
    m = {"loai": "que", "vai": vai, "so": so, "ten": q["ten"], "ten_han": q["ten_han"],
         "y_chinh": q["y_chinh"], "loi_khuyen": q["loi_khuyen"], "mat_toi": q["mat_toi"],
         "cau_tu_soi": q["cau_tu_soi"], "trich_dan": q["trich_dan"], "source_id": q["source_id"],
         "school_id": q["school_id"], "trang_thai": q["trang_thai"]}
    if lv:
        m["linh_vuc"], m["y_linh_vuc"] = LV_TEN[lv], q["linh_vuc"][lv]
    v = kb.que_van(so)
    if v and v.get("nom_na"):                    # KD-NN: hình ảnh đời thường cho người mới
        m["nom_na"] = v["nom_na"]
    return m


def _quan_he_nh(a: str, b: str) -> str:
    if a == b:
        return "cùng hành"
    if SINH[a] == b:
        return f"{a} sinh {b}"
    if KHAC[a] == b:
        return f"{a} khắc {b}"
    if SINH[b] == a:
        return f"{b} sinh {a}"
    return f"{b} khắc {a}"


def _muc_dung_than(que: dict, ten: str, tg: dict | None = None) -> dict:
    hao = que["quai_ban"]["hao"]
    the = next(h for h in hao if h["the_ung"] == "Thế")
    if ten == "Ứng":
        dt_ = [h for h in hao if h["the_ung"] == "Ứng"]
        ghi = "Câu hỏi về người/việc phía bên kia: dùng hào Ứng làm đại diện."
    elif ten == "Thế":
        dt_ = [the]
        ghi = "Câu hỏi về chính bạn (sức khoẻ, đi xa, bản thân): dùng hào Thế làm đại diện."
    else:
        dt_ = [h for h in hao if h["luc_than"] == ten]
        n = kb.dung_than(ten)
        ghi = n["ghi_chu"] if n else ""
    vi_tri = [{"hao": h["vi_tri"], "dia_chi": h["dia_chi"], "ngu_hanh": h["ngu_hanh"],
               "dong": h["vi_tri"] in que["hao_dong"], "the_ung": h["the_ung"] or None,
               "voi_the": _quan_he_nh(h["ngu_hanh"], the["ngu_hanh"]),
               **({"vuong_suy": vs.danh_gia(h["dia_chi"], h["ngu_hanh"], tg)} if tg else {})}
              for h in dt_]
    return {"loai": "dung_than", "dung_than": ten, "ghi_chu": ghi, "vi_tri": vi_tri, "thoi_gian": tg,
            "hao_the": the["vi_tri"], "phuc": not dt_, "source_id": "tang_san_boc_dich",
            "school_id": "luc_hao", **kb.meta()}


def goi_bang_chung(pl: dict, que: dict | None, mai_hoa: dict | None, tg: dict | None = None) -> dict:
    goi = {"phan_loai": {k: pl[k] for k in ("loai", "truong_phai", "dung_than", "che_do", "xu_ly",
                                          "linh_vuc")},
           "muc": [], "can_them": [], "mau": None, "luu_y": None}
    if pl["xu_ly"] == "an_toan":
        goi["mau"] = kb.mau("an_toan")
        return chung.ket(goi)
    if pl["xu_ly"] == "tu_choi_nhe":
        goi["mau"] = kb.mau("tu_choi")
        return chung.ket(goi)
    muc = goi["muc"]
    for ma in pl["giai_thich"][:2]:
        g = kb.giai_thich(ma)
        if g:
            muc.append({"loai": "giai_thich", "ma": ma, **g})
    if pl["loai"] in ("ky_thuat", "doc_que_da_co"):
        if pl["que_nhac"]:
            m = _muc_que(pl["que_nhac"], "nhac", pl["linh_vuc"])
            if m:
                muc.append(m)
            vi = pl.get("hao_nhac")
            lk = _muc_loi_kinh({"que": pl["que_nhac"], "loai": "hao" if vi else "que_tu", "vi_tri": vi,
                                "chu": True})
            if lk:
                muc.append(lk)
        if pl["loai"] == "doc_que_da_co":
            goi["luu_y"] = kb.luu_y("nghia_ly")
        return chung.ket(goi)
    if que is None:
        goi["can_them"] = ["que"]
        goi["mau"] = kb.mau("can_que")
        return chung.ket(goi)

    ban, bien = que["quai_ban"], que["quai_bien"]
    m = _muc_que(ban["so_king_wen"], "ban", pl["linh_vuc"])
    if m:
        muc.append(m)
    muc.append({"loai": "quy_tac_doc", "noi_dung": que["quy_tac_doc"], "hao_dong": que["hao_dong"],
                "source_id": "dich_hoc_khai_mong", "school_id": "chu_hy"})
    for x in chon_loi_doc(ban["so_king_wen"], bien["so_king_wen"] if bien else None, que["hao_dong"]):
        lk = _muc_loi_kinh(x)
        if lk:
            muc.append(lk)
    if bien:
        m = _muc_que(bien["so_king_wen"], "bien", pl["linh_vuc"])
        if m:
            muc.append(m)
    if pl["truong_phai"] == "mai_hoa" and mai_hoa:
        td = mai_hoa["the_dung"]
        n = kb.the_dung(td["quan_he"])
        if n:
            muc.append({"loai": "the_dung", **td, **n, "dau_vao": mai_hoa["dau_vao"]})
    if pl["truong_phai"] == "luc_hao" and pl["dung_than"]:
        muc.append(_muc_dung_than(que, pl["dung_than"], tg))
    if que["hao_dong"]:
        muc.append({"loai": "ghi_chu", "noi_dung": kb.luu_y("hao_tu")})
    goi["luu_y"] = kb.luu_y({"luc_hao": "du_doan", "mai_hoa": "mai_hoa"}.get(pl["truong_phai"],
                                                                            "nghia_ly"))
    return chung.ket(goi)


# --------------------------------------------------------------------------- #
def chon_loi_doc(ban: int, bien: int | None, dong: list[int]) -> list[dict]:
    """Lời kinh cần đọc theo số hào động (Chu Hy, Dịch Học Khải Mông). `chu` = lời làm chủ.

    0 → quái từ quẻ bản · 1 → hào động · 2 → hai hào động, hào trên làm chủ · 3 → quái từ bản (chủ)
    và biến · 4 → hai hào tĩnh của quẻ biến, hào dưới làm chủ · 5 → hào tĩnh của quẻ biến ·
    6 → Càn dùng Dụng Cửu, Khôn dùng Dụng Lục, quẻ khác đọc quái từ quẻ biến.
    """
    n = len(dong)
    m = lambda loai, que, vt=None, chu=False: {"loai": loai, "que": que, "vi_tri": vt, "chu": chu}  # noqa: E731
    tinh = [i for i in range(1, 7) if i not in dong]
    if n == 0 or bien is None:
        return [m("que_tu", ban, chu=True)]
    if n == 1:
        return [m("hao", ban, dong[0], True)]
    if n == 2:
        return [m("hao", ban, dong[0]), m("hao", ban, dong[1], True)]
    if n == 3:
        return [m("que_tu", ban, chu=True), m("que_tu", bien)]
    if n == 4:
        return [m("hao", bien, tinh[0], True), m("hao", bien, tinh[1])]
    if n == 5:
        return [m("hao", bien, tinh[0], True)]
    if ban in (1, 2):
        return [m("dung", ban, chu=True)]
    return [m("que_tu", bien, chu=True)]


def _muc_loi_kinh(x: dict) -> dict | None:
    q = kb.que_van(x["que"])
    if not q:
        return None
    ten = kb.que(x["que"])["ten"] if kb.que(x["que"]) else str(x["que"])
    if x["loai"] == "hao":
        h = q["hao"][x["vi_tri"] - 1]
        noi = {"tieu_de": f"Hào {h['ten']} ({h['ten_han']}) quẻ {ten}", "han": h["han"], "dich": h["dich"], "y": h["y"],
               "nom_na": h.get("nom_na")}
    elif x["loai"] == "dung":
        noi = {"tieu_de": f"{'Dụng Cửu' if x['que'] == 1 else 'Dụng Lục'} quẻ {ten}", **q["dung"]}
    else:
        noi = {"tieu_de": f"Quái từ quẻ {ten}", "han": q["que_tu"]["han"], "dich": q["que_tu"]["dich"],
               "y": f"Đại tượng: {q['dai_tuong']['dich']}", "nom_na": None,
               "thoan": q["thoan"].get("dich") if x["chu"] else None}
    return {"loai": "loi_kinh", "chu": x["chu"], **noi, "source_id": q["source_id"],
            "school_id": q["school_id"], "trang_thai": q["trang_thai"]}


VAI = {"ban": "Quẻ bản", "bien": "Quẻ biến (xu hướng chuyển tới)", "nhac": "Quẻ"}


def _doan(m: dict) -> tuple[str, str | None]:
    l = m["loai"]
    if l == "que":
        s = (f"{VAI[m['vai']]}: {m['ten']} {m['ten_han']} (quẻ {m['so']}) — {m['y_chinh']} "
             f"Lời khuyên theo Nghĩa Lý: {m['loi_khuyen']} Mặt tối cần tránh: {m['mat_toi']}")
        if m.get("y_linh_vuc"):
            s += f" Riêng về {m['linh_vuc'].lower()}: {m['y_linh_vuc']}"
        if m.get("nom_na"):
            s += f"\n{m['nom_na'].replace('Nôm na: ', 'Nói nôm na: ')}"
        return s, m["cau_tu_soi"]
    if l == "quy_tac_doc":
        return f"Cách đọc (quy tắc Chu Hy): {m['noi_dung']}", None
    if l == "loi_kinh":
        return (f"{'【Lời chủ】 ' if m['chu'] else ''}{m['tieu_de']}: 「{m['han']}」 — {m['dich']} "
                f"Ý: {m['y']}" + (f"\nThoán truyện giảng: {m['thoan']}" if m.get("thoan") else "")
                + (f"\nNói nôm na: {m['nom_na']}" if m.get("nom_na") else "")), None
    if l == "the_dung":
        return (f"Mai Hoa — Thể là {m['the']} ({m['the_ngu_hanh']}), Dụng là {m['dung']} "
                f"({m['dung_ngu_hanh']}): {m['ten']}. {m['y_nghia']} {m['luu_y']}", None)
    if l == "dung_than":
        if m["phuc"]:
            return (f"Lục Hào — dụng thần {m['dung_than']} không hiện trong quẻ bản (phục thần): "
                    "việc được hỏi chưa lộ rõ. " + m["ghi_chu"], None)
        def _vs(v: dict) -> str:
            x = v.get("vuong_suy")
            if not x:
                return ""
            return (f"; tháng {m['thoi_gian']['chi_thang']}: {x['nguyet_lenh']}, ngày "
                    f"{m['thoi_gian']['can_ngay']} {m['thoi_gian']['chi_ngay']}: {x['nhat_than']}"
                    f"{', gặp tuần không' if x['tuan_khong'] else ''} → {x['tong']}")
        ds = "; ".join(f"hào {v['hao']} ({v['dia_chi']} {v['ngu_hanh']}"
                       f"{', đang động' if v['dong'] else ''}{', ở Thế' if v['the_ung'] == 'Thế' else ''}"
                       f"{', ở Ứng' if v['the_ung'] == 'Ứng' else ''}) — với hào Thế: {v['voi_the']}{_vs(v)}"
                       for v in m["vi_tri"])
        return f"Lục Hào — dụng thần {m['dung_than']}: {ds}. {m['ghi_chu']}", None
    if l == "giai_thich":
        return f"{m['tieu_de']}: {m['noi_dung']}", None
    if l == "ghi_chu":
        return m["noi_dung"], None
    return "", None


def van_template(goi: dict) -> str:
    if goi["mau"] and not goi["muc"]:
        return goi["mau"]
    doan, soi = [], []
    for m in goi["muc"]:
        d, s = _doan(m)
        if d:
            doan.append(d)
        if s and len(soi) < 1:
            soi.append(s)
    if soi:
        doan.append("Câu hỏi để tự soi: " + soi[0])
    if goi.get("luu_y"):
        doan.append(goi["luu_y"])
    doan.append(hoi_van.KET)
    return "\n\n".join(doan)


def _ket_som(pl: dict, goi: dict, van: str, **them) -> dict:
    return {"phan_loai": goi["phan_loai"], "que": None, "mai_hoa": None, "bang_chung": goi, "cau_tra_loi": van,
            "che_do_van": "template", "loi_kiem_tra": [], "can_them": goi["can_them"], "co_canh_bao": [],
            "do_phu": "day_du", "doc_que": None, "chu_de": None, "can_lam_ro": None, **them}


def tra_loi(cau_hoi: str, che_do: str = "tu_dong", gia_tri_hao: list[int] | None = None,
            thoi_diem: dt.datetime | None = None, gieo: bool = True, phuong_phap: str = "thi",
            cach_ra_que: str | None = None, dung_llm: bool = False, lich: str = "viet",
            chu_de: str | None = None, so_mai_hoa: list[int] | None = None,
            phuong_mai_hoa: str | None = None) -> dict:
    """KD-ĐS thêm: `chu_de` (mã chủ đề/chip, chốt dụng thần + nhóm việc), `so_mai_hoa` (hai số người dùng chọn),
    `phuong_mai_hoa` (phương vị) cho `cach_ra_que` = mai_hoa_so / mai_hoa_phuong; trả thêm `doc_que`, `chu_de`,
    `can_lam_ro` (câu mơ hồ về dụng thần → hỏi lại trước khi gieo, `can_them` = ["lam_ro"])."""
    if che_do not in CHE_DO:
        raise ValueError(f"che_do phải là một trong {CHE_DO}")
    if chu_de and not kd_ds.kb.chu_de(chu_de):
        raise ValueError("chu_de không có trong danh mục")
    pl = phan_loai(cau_hoi, che_do)
    if cach_ra_que in MAI_HOA_CACH and pl["loai"] not in ("dac_biet", "ky_thuat", "doc_que_da_co"):
        pl["truong_phai"], pl["dung_than"] = "mai_hoa", None
    que, mai_hoa, nguon = None, None, None
    can_que = pl["loai"] not in ("dac_biet", "ky_thuat", "doc_que_da_co")
    luc = (thoi_diem or dt.datetime.now(_VN).replace(tzinfo=None))
    ma_cd = chu_de or kd_ds.chu_de_tu_cau(pl["cau_chuan_hoa"])
    cd = kd_ds.kb.chu_de(ma_cd) or {}
    if can_que:
        lr = kd_ds.can_lam_ro(pl["cau_chuan_hoa"], chu_de, pl["truong_phai"])
        if lr:
            goi = chung.ket({"phan_loai": {k: pl[k] for k in ("loai", "truong_phai", "dung_than", "che_do", "xu_ly",
                                                              "linh_vuc")}, "muc": [], "can_them": ["lam_ro"],
                             "mau": lr["cau_hoi"], "luu_y": None})
            return _ket_som(pl, goi, lr["cau_hoi"], can_lam_ro=lr, lich=lich)
        # dụng thần theo chủ đề khi phân loại chỉ rơi về hào Ứng, hoặc khi người dùng chọn chủ đề rõ
        if pl["truong_phai"] == "luc_hao" and cd.get("dung_than") and (chu_de or pl["dung_than"] in (None, "Ứng")):
            pl["dung_than"] = cd["dung_than"]
        if gia_tri_hao is not None:
            vals, nguon = list(gia_tri_hao), "gieo tay (người dùng nhập)"
        elif pl["truong_phai"] == "mai_hoa" and cach_ra_que == "mai_hoa_so":
            if not so_mai_hoa or len(so_mai_hoa) != 2:
                raise ValueError("Mai Hoa theo số: cần đúng hai số nguyên dương")
            mai_hoa = mh.khoi_que_tu_so(int(so_mai_hoa[0]), int(so_mai_hoa[1]), mh.chi_gio(luc.hour))
            vals, nguon = mai_hoa["gia_tri_hao"], "Mai Hoa theo số"
        elif pl["truong_phai"] == "mai_hoa" and cach_ra_que == "mai_hoa_phuong":
            if not phuong_mai_hoa:
                raise ValueError("Mai Hoa theo phương vị: cần phương vị")
            mai_hoa = mh.khoi_que_phuong_vi(phuong_mai_hoa, mh.chi_gio(luc.hour))
            vals, nguon = mai_hoa["gia_tri_hao"], "Mai Hoa theo phương vị"
        elif pl["truong_phai"] == "mai_hoa":
            mai_hoa = mh.khoi_que_tu_thoi_diem(luc, lich=lich)
            vals, nguon = mai_hoa["gia_tri_hao"], "Mai Hoa theo thời điểm"
        elif gieo:
            vals, nguon = kinhdich.gieo(phuong_phap), f"engine gieo ({phuong_phap}, CSPRNG)"
        else:
            vals = None
        if vals is not None:
            que = kinhdich.khoi_que(vals)
            que["gia_tri_hao_1_den_6"], que["nguon_ngau_nhien"] = vals, nguon
            if pl["truong_phai"] == "mai_hoa" and mai_hoa is None:
                ha, thuong = que["quai_ban"]["ha_quai"], que["quai_ban"]["thuong_quai"]
                if len(que["hao_dong"]) == 1:
                    mai_hoa = {"the_dung": mh.the_dung(thuong, ha, que["hao_dong"][0]),
                               "dau_vao": {"nguon": nguon}}
            if mai_hoa is not None and len(que["hao_dong"]) == 1:          # KD-V2: toàn cục + ứng kỳ số
                ha, thuong = que["quai_ban"]["ha_quai"], que["quai_ban"]["thuong_quai"]
                mai_hoa["toan_cuc"] = mh.toan_cuc(thuong, ha, que["hao_dong"][0])
                cg = (mai_hoa.get("dau_vao") or {}).get("chi_gio")
                if cg:
                    mai_hoa["ung_ky_so"] = mh.ung_ky_so(thuong, ha, cg)
    tg = None
    if que is not None:
        tg = vs.thoi_gian(luc)
    # UI-KD: thời điểm gieo có cấu trúc (web chỉ hiển thị; "Xem lại" gửi lại `thoi_diem` → đọc theo ngày gieo).
    thoi_diem_gieo = ({"thoi_diem": luc.isoformat(timespec="seconds"), "chi_gio": mh.chi_gio(luc.hour), **tg}
                      if tg is not None else None)
    goi = goi_bang_chung(pl, que, mai_hoa, tg if pl["truong_phai"] == "luc_hao" else None)
    van = van_template(goi)
    che_do_van, loi = "template", []
    if dung_llm and goi["muc"] and not goi["can_them"]:
        try:
            v = hoi_van._goi_llm(goi, cau_hoi)
            loi = hoi_van.kiem_tra_dau_ra(v, goi)
            che_do_van, van = ("llm", v) if not loi else ("template_fallback", van)
        except Exception as e:  # noqa: BLE001
            che_do_van, loi = "template_fallback", [f"llm lỗi: {str(e)[:120]}"]
    co = []
    if pl["truong_phai"] == "luc_hao":
        co.append({"loai": "vuong_suy_rut_gon", "chi_tiet": kb.luu_y("vuong_suy")})
    if pl["truong_phai"] and pl["loai"] != "doc_que_da_co":
        co.append({"loai": "khong_gieo_lai", "chi_tiet": kb.mau("gieo_lai")})
    dac_biet = pl["xu_ly"] in ("an_toan", "tu_choi_nhe") or bool(goi["can_them"])
    doc_que = None
    if que is not None and can_que:
        pt = None
        try:
            pt = lh.phan_tich(que, tg, pl["dung_than"] or cd.get("dung_than") or "Ứng", luc)
        except Exception:  # noqa: BLE001 — góc nhìn phụ, không làm vỡ câu trả lời
            pt = None
        doc_que = kd_ds.doc_que(que, pl, goi, mai_hoa=mai_hoa, luc_hao=pt, thoi_diem=luc, chu_de=ma_cd)
    return {"phan_loai": goi["phan_loai"], "que": que, "mai_hoa": mai_hoa, "bang_chung": goi,
            "cau_tra_loi": van, "che_do_van": che_do_van, "loi_kiem_tra": loi,
            "can_them": goi["can_them"], "co_canh_bao": co,
            "do_phu": "day_du" if (goi["muc"] or dac_biet) else "khong", "lich": lich,
            "doc_que": doc_que, "chu_de": ({"ma": ma_cd, "ten": cd.get("ten", "Việc khác")} if can_que else None),
            "thoi_diem_gieo": thoi_diem_gieo, "can_lam_ro": None}
