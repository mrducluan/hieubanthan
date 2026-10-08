# -*- coding: utf-8 -*-
"""SEO-B — trang kiến thức công khai dựng từ KB (số · quẻ · sao).

Tầng KB: chỉ ĐỌC và GHÉP các trường có sẵn thành cấu trúc trang — không sinh nghĩa mới.
Chính sách index (chủ dự án chốt lại 2026-09-30): index CẢ nháp AI; trang nháp luôn mang nhãn
"bản nháp đang duyệt" (trang_thai) để minh bạch. Tắt bằng INDEX_NHAP_AI = False.

- Ý nghĩa số (thanso_meanings.json, thanso_depth.json): chủ dự án tự viết → "da_duyet".
- Quẻ (kinhdich_kb.json), sao (tuvi_kb.json): theo trường `trang_thai` của file (hiện "nhap_ai").
"""
from __future__ import annotations

import json
import unicodedata
from functools import lru_cache
from pathlib import Path

_DATA = Path(__file__).parent / "data"

# Đổi khi nội dung KB của các trang này thay đổi (hiển thị "Cập nhật" + sitemap lastmod).
CAP_NHAT = "2026-10-07"

# Quyết định chủ dự án: index cả nội dung nháp AI (vẫn hiển thị nhãn nháp).
INDEX_NHAP_AI = True

LOAI = ("so", "que", "sao", "cung", "thap_than", "nhat_chu", "cap_so", "nghe", "tinh_yeu", "nam_ca_nhan", "no_nghiep")
_SO = ("1", "2", "3", "4", "5", "6", "7", "8", "9", "11", "22", "33")
_SO_GOC = {"11": "2", "22": "4", "33": "6"}
_LINH_VUC_QUE = {"cong_viec": "Công việc", "tinh_cam": "Tình cảm", "gia_dinh": "Gia đình",
                 "tien_bac": "Tiền bạc", "hoc_hanh": "Học hành"}


def _slug(s: str) -> str:
    s = unicodedata.normalize("NFD", s.replace("Đ", "D").replace("đ", "d"))
    s = "".join(c for c in s if unicodedata.category(c) != "Mn").lower()
    return "-".join("".join(c if c.isalnum() else " " for c in s).split())


def _cat(s: str, n: int = 158) -> str:
    s = " ".join(s.split())
    if len(s) <= n:
        return s
    return s[: s.rfind(" ", 0, n - 1)].rstrip(",;:—-") + "…"


@lru_cache(maxsize=None)
def _doc(ten: str) -> dict:
    return json.loads((_DATA / ten).read_text("utf-8"))


def _cau(s: str) -> str:
    s = s.strip()
    return s if s.endswith((".", "?", "!", "…")) else s + "."


# ---- MH-1: dữ liệu hình minh hoạ (web chỉ vẽ theo đây, không tự suy ra) ----------
def _mh_que(k: str) -> dict:
    from app.calc import kinhdich_vendor as kv
    ha, thuong = next((h, t) for h, row in kv.KW.items() for t, so in row.items() if so == int(k))
    return {"kieu": "que", "so": int(k), "hao": list(kv.TRI_BITS[ha]) + list(kv.TRI_BITS[thuong])}


def _mh_thap_than(ten: str) -> dict:
    from app.calc import battu as bt
    from app.calc.kinhdich_vendor import KHAC, SINH
    from app.calc.lunar import CAN
    can = next(c for c in CAN if bt.thap_than("Giáp", c) == ten)      # quan hệ không phụ thuộc nhật chủ chọn làm mốc
    ta, no = bt.CAN_NH[0], bt.CAN_NH[CAN.index(can)]
    quan_he = ("dong_hanh" if ta == no else "ta_sinh" if SINH[ta] == no else "ta_khac" if KHAC[ta] == no
               else "khac_ta" if KHAC[no] == ta else "sinh_ta")
    return {"kieu": "thap_than", "ten": ten, "quan_he": quan_he, "cung_am_duong": CAN.index(can) % 2 == 0}


def _mh_nhat_chu(can: str) -> dict:
    from app.calc import battu as bt
    from app.calc.lunar import CAN
    i = CAN.index(can)
    return {"kieu": "nhat_chu", "can": can, "hanh": bt.CAN_NH[i], "duong": i % 2 == 0}


# ---- Số ------------------------------------------------------------------------
def _trang_so(so: str) -> dict:
    kb, sau = _doc("thanso_meanings.json"), _doc("thanso_depth.json")
    m = kb["so_meanings"][so]
    so_cai = bool(m.get("so_cai"))
    tra_loi = (f"Trong thần số học Pythagoras, số {so} gắn với: {m['tu_khoa']}. "
               f"Mặt tối cần để ý: {m['mat_toi']}.")
    if so_cai:
        tra_loi += (f" Số {so} là số cái — giữ nguyên, không rút gọn về {_SO_GOC[so]} khi là con số đường đời, "
                    f"nhưng vẫn mang nền của số {_SO_GOC[so]}.")
    muc = [{"tieu_de": f"Số {so} xuất hiện ở đâu trong hồ sơ",
            "danh_sach": [f"{v['ten']}: {v['khung']}." for v in kb["vi_tri"].values()]}]
    if (dc := sau["dinh_cao"].get(so)):
        muc.append({"tieu_de": f"Đỉnh cao số {so}: {dc['chu_de'].lower()}",
                    "danh_sach": [_cau(dc["y_nghia"]), "Bóng tối: " + _cau(dc["bong_toi"]), "Tự soi: " + dc["phan_chung"]]})
    if (nm := sau["nam_ca_nhan"].get(so)):
        muc.append({"tieu_de": f"Năm cá nhân số {so}: {nm['chu_de'].lower()}",
                    "danh_sach": [_cau(nm["y_nghia"]), "Nên: " + _cau(nm["nen"]), "Tránh: " + _cau(nm["tranh"])]})
    if (tt := sau["thu_thach"].get(so)):
        muc.append({"tieu_de": f"Thử thách số {so}: {tt['mo_ta'].lower()}",
                    "danh_sach": [_cau(tt["y_nghia"]), "Cách vượt: " + _cau(tt["cach_vuot"])]})
    muc.append({"tieu_de": "Cách tính số đường đời",
                "doan": ("Rút gọn riêng ngày, tháng, năm sinh dương lịch về một chữ số (giữ 11, 22, 33 nếu gặp), cộng "
                         "ba kết quả rồi rút gọn tiếp; tổng 11, 22, 33 giữ nguyên là số cái. Hiểu Bản Thân hiển thị "
                         "từng bước cộng để bạn tự kiểm.")})
    hoi_dap = [
        {"hoi": f"Số {so} trong thần số học nghĩa là gì?", "dap": tra_loi},
        {"hoi": f"Mặt tối của số {so} là gì?", "dap": _cau(m["mat_toi"])},
        {"hoi": f"Người mang số {so} nên tự hỏi điều gì?", "dap": m["phan_chung"]},
    ]
    if nm:
        hoi_dap.append({"hoi": f"Năm cá nhân số {so} nên làm gì?", "dap": f"Nên: {_cau(nm['nen'])} Tránh: {_cau(nm['tranh'])}"})
    i = _SO.index(so)
    lien = [f"so-{x}" for x in (_SO[i - 1] if i else None, _SO[i + 1] if i + 1 < len(_SO) else None, _SO_GOC.get(so)) if x]
    return {
        "loai": "so", "slug": f"so-{so}",
        "tieu_de": f"Số {so} trong thần số học: {m['tu_khoa'].lower()}",
        "mo_ta": _cat(f"Số {so} thần số học: {m['tu_khoa'].lower()}. Mặt tối: {m['mat_toi'].lower()}. "
                      "Kèm câu hỏi tự soi, năm cá nhân và cách tính."),
        "tra_loi_nhanh": tra_loi, "muc": muc, "hoi_dap": hoi_dap,
        "nguon": [f"{s['ten']} — {s['mo_ta']}" for s in kb["sources"]] + [sau["_nguon"]],
        "trang_thai": "da_duyet",
        "lien_quan": [{"loai": "so", "slug": s} for s in dict.fromkeys(lien)],
        "minh_hoa": {"kieu": "so", "so": int(so), "so_cai": so in _SO_GOC, "so_goc": int(_SO_GOC.get(so, so))},
    }


# ---- Quẻ -----------------------------------------------------------------------
def _ds_que() -> list[tuple[str, str]]:
    return [(k, f"que-{k}-{_slug(v['ten'])}") for k, v in _doc("kinhdich_kb.json")["que"].items()]


def _trang_que(k: str, slug: str) -> dict:
    kb = _doc("kinhdich_kb.json")
    q = kb["que"][k]
    kv = _doc("kinhdich_hao.json")["que"].get(k)
    muc = []
    if kv:
        if kv.get("nom_na"):
            muc.append({"tieu_de": "Nói nôm na", "doan": kv["nom_na"]})
        muc.append({"tieu_de": "Quái từ và Đại tượng",
                    "danh_sach": [f"Quái từ 「{kv['que_tu']['han']}」 — {kv['que_tu']['dich']}",
                                  f"Đại tượng 「{kv['dai_tuong']['han']}」 — {kv['dai_tuong']['dich']}"]
                    + ([f"Thoán truyện 「{kv['thoan']['han']}」 — {kv['thoan']['dich']}"] if kv["thoan"].get("dich") else [])})
        muc.append({"tieu_de": "Sáu hào (hào từ)",
                    "danh_sach": [f"{h['ten']} 「{h['han']}」 — {h['dich']} Ý: {h['y']}"
                                  + (f" Nôm na: {h['nom_na']}" if h.get("nom_na") else "") for h in kv["hao"]]
                    + ([f"{'Dụng Cửu' if k == '1' else 'Dụng Lục'} 「{kv['dung']['han']}」 — {kv['dung']['dich']}"]
                       if kv.get("dung") else [])})
    muc += [
        {"tieu_de": "Lời khuyên", "doan": q["loi_khuyen"]},
        {"tieu_de": "Mặt tối", "doan": q["mat_toi"]},
        {"tieu_de": "Theo từng lĩnh vực", "danh_sach": [f"{_LINH_VUC_QUE.get(lv, lv)}: {v}" for lv, v in q["linh_vuc"].items()]},
        {"tieu_de": "Câu hỏi tự soi", "doan": q["cau_tu_soi"]},
        {"tieu_de": "Trích dẫn", "doan": q["trich_dan"]},
    ]
    hoi_dap = [
        {"hoi": f"Quẻ {q['ten']} trong Kinh Dịch nghĩa là gì?", "dap": q["y_chinh"]},
        {"hoi": f"Gieo được quẻ {q['ten']} nên làm gì?", "dap": q["loi_khuyen"]},
    ] + ([{"hoi": f"Quái từ quẻ {q['ten']} nói gì?", "dap": f"「{kv['que_tu']['han']}」 — {kv['que_tu']['dich']}"}] if kv else []) + [{"hoi": f"Quẻ {q['ten']} nói gì về {ten.lower()}?", "dap": q["linh_vuc"][lv]}
         for lv, ten in _LINH_VUC_QUE.items() if lv in q["linh_vuc"]][:2]
    ds = _ds_que()
    i = [s for _, s in ds].index(slug)
    return {
        "loai": "que", "slug": slug,
        "tieu_de": f"Quẻ {k} {q['ten']} ({q['ten_han']}) — ý nghĩa Kinh Dịch",
        "mo_ta": _cat(f"Quẻ {q['ten']} ({q['ten_han']}): {q['y_chinh']}"),
        "tra_loi_nhanh": q["y_chinh"], "muc": muc, "hoi_dap": hoi_dap,
        "nguon": list(kb["source"].values()),
        "trang_thai": kb.get("trang_thai", "nhap_ai"),
        "lien_quan": [{"loai": "que", "slug": ds[j][1]} for j in (i - 1, i + 1) if 0 <= j < len(ds)],
        "minh_hoa": _mh_que(k),
    }


# ---- Sao -----------------------------------------------------------------------
def _ds_sao() -> list[tuple[str, str]]:
    return [(ten, f"sao-{_slug(ten)}") for ten in _doc("tuvi_kb.json")["chinh_tinh"]]


def _trang_sao(ten: str, slug: str) -> dict:
    kb = _doc("tuvi_kb.json")
    s = kb["chinh_tinh"][ten]
    tra_loi = f"{ten} là chính tinh hành {s['ngu_hanh']}, nhóm {s['nhom']}. {_cau(s['tinh_chat'])}"
    o_cung = kb["sao_cung"].get(ten, {})
    muc = [
        {"tieu_de": "Điểm mạnh", "doan": _cau(s["diem_manh"][:1].upper() + s["diem_manh"][1:])},
        {"tieu_de": "Mặt tối", "doan": _cau(s["mat_toi"][:1].upper() + s["mat_toi"][1:])},
        {"tieu_de": "Biểu hiện thường gặp", "doan": _cau(s["bieu_hien"][:1].upper() + s["bieu_hien"][1:])},
    ]
    if o_cung:
        muc.append({"tieu_de": f"{ten} ở 12 cung", "danh_sach": [f"{c}: {v}" for c, v in o_cung.items()]})
    muc.append({"tieu_de": "Câu hỏi tự soi", "doan": s["cau_tu_soi"]})
    hoi_dap = [{"hoi": f"Sao {ten} trong Tử vi là gì?", "dap": tra_loi},
               {"hoi": f"Mặt tối của sao {ten}?", "dap": _cau(s["mat_toi"])}]
    if "Mệnh" in o_cung:
        hoi_dap.insert(1, {"hoi": f"Sao {ten} thủ cung Mệnh nói gì?", "dap": o_cung["Mệnh"]})
    ds = _ds_sao()
    i = [x for _, x in ds].index(slug)
    return {
        "loai": "sao", "slug": slug,
        "tieu_de": f"Sao {ten} ({s['ten_han']}) trong Tử vi — tính chất và 12 cung",
        "mo_ta": _cat(f"Sao {ten} ({s['ten_han']}), hành {s['ngu_hanh']}: {s['tinh_chat']} Điểm mạnh, mặt tối và ý nghĩa ở 12 cung."),
        "tra_loi_nhanh": tra_loi, "muc": muc, "hoi_dap": hoi_dap,
        "nguon": list(kb["source"].values()),
        "trang_thai": kb.get("trang_thai", "nhap_ai"),
        "lien_quan": [{"loai": "sao", "slug": ds[j][1]} for j in (i - 1, i + 1) if 0 <= j < len(ds)],
        "minh_hoa": {"kieu": "sao", "ten": ten, "ten_han": s["ten_han"], "ngu_hanh": s["ngu_hanh"]},
    }


# ---- SEO-C: 12 cung Tử vi ---------------------------------------------------------
def _ds_cung() -> list[tuple[str, str]]:
    return [(ten, f"cung-{_slug(ten)}") for ten in _doc("tuvi_kb.json")["cung"]]


def _trang_cung(ten: str, slug: str) -> dict:
    kb = _doc("tuvi_kb.json")
    c = kb["cung"][ten]
    tra_loi = f"Cung {ten} trong Tử vi: {c['y_nghia']} Cung này cho thấy {c['xem_duoc']}; nó {c['khong_tra_loi']}."
    muc = [{"tieu_de": "Cung này cho thấy gì", "doan": _cau(c["xem_duoc"][:1].upper() + c["xem_duoc"][1:])},
           {"tieu_de": "Cung này không trả lời được gì", "doan": _cau(c["khong_tra_loi"][:1].upper() + c["khong_tra_loi"][1:])},
           {"tieu_de": f"14 chính tinh ở cung {ten}",
            "danh_sach": [f"{sao}: {o[ten]}" for sao, o in kb["sao_cung"].items() if ten in o]},
           {"tieu_de": f"Tứ hoá rơi vào cung {ten}",
            "danh_sach": [f"Hoá {h}: {o[ten]}" for h, o in kb["tu_hoa_cung"].items() if ten in o]}]
    if ten in kb.get("chu_de_han", {}):
        muc.append({"tieu_de": f"Khi đại hạn, lưu niên đi qua cung {ten}", "doan": kb["chu_de_han"][ten]})
    muc.append({"tieu_de": "Câu hỏi tự soi", "doan": c["cau_tu_soi"]})
    hoi_dap = [{"hoi": f"Cung {ten} trong Tử vi nói về điều gì?", "dap": _cau(c["y_nghia"])},
               {"hoi": f"Cung {ten} có đoán được chuyện cụ thể không?",
                "dap": _cau(f"Không — cung {ten} {c['khong_tra_loi']}; nó cho thấy {c['xem_duoc']}")}]
    ds = _ds_cung()
    i = [x for _, x in ds].index(slug)
    return {
        "loai": "cung", "slug": slug,
        "tieu_de": f"Cung {ten} trong Tử vi — ý nghĩa và 14 chính tinh",
        "mo_ta": _cat(f"Cung {ten} Tử vi: {c['y_nghia']} 14 chính tinh và tứ hoá ở cung {ten}, kèm câu hỏi tự soi."),
        "tra_loi_nhanh": tra_loi, "muc": muc, "hoi_dap": hoi_dap,
        "nguon": list(kb["source"].values()),
        "trang_thai": kb.get("trang_thai", "nhap_ai"),
        "lien_quan": [{"loai": "cung", "slug": ds[j % len(ds)][1]} for j in (i - 1, i + 1)],
        "minh_hoa": {"kieu": "cung", "chi_so": list(kb["cung"]).index(ten), "vong": list(kb["cung"])},
    }


# ---- SEO-C: 10 thập thần · 10 nhật chủ Bát tự --------------------------------------
def _ds_thap_than() -> list[tuple[str, str]]:
    return [(ten, _slug(ten)) for ten in _doc("battu_kb.json")["thap_than"]]


def _trang_thap_than(ten: str, slug: str) -> dict:
    kb = _doc("battu_kb.json")
    t = kb["thap_than"][ten]
    tra_loi = f"{ten} (nhóm {t['nhom']}) trong Bát tự: {t['y_nghia']} Tính cách thường gặp: {t['tinh_cach']}."
    muc = [{"tieu_de": "Tính cách", "doan": _cau(t["tinh_cach"][:1].upper() + t["tinh_cach"][1:])},
           {"tieu_de": f"Khi {ten} quá nhiều", "doan": _cau(t["khi_nhieu"][:1].upper() + t["khi_nhieu"][1:])},
           {"tieu_de": f"Khi thiếu {ten}", "doan": _cau(t["khi_thieu"][:1].upper() + t["khi_thieu"][1:])},
           {"tieu_de": "Với nam, với nữ", "danh_sach": [f"Với nam: {t['nam']}.", f"Với nữ: {t['nu']}."]},
           {"tieu_de": "Câu hỏi tự soi", "doan": t["cau_tu_soi"]}]
    hoi_dap = [{"hoi": f"{ten} trong Bát tự là gì?", "dap": tra_loi},
               {"hoi": f"Lá số nhiều {ten} thì sao?", "dap": _cau(t["khi_nhieu"][:1].upper() + t["khi_nhieu"][1:])}]
    ds = _ds_thap_than()
    i = [x for _, x in ds].index(slug)
    return {
        "loai": "thap_than", "slug": slug,
        "tieu_de": f"{ten} trong Bát tự (thập thần) — ý nghĩa, khi nhiều, khi thiếu",
        "mo_ta": _cat(f"{ten} — thập thần nhóm {t['nhom']}: {t['y_nghia']} Tính cách, khi quá nhiều, khi thiếu và câu hỏi tự soi."),
        "tra_loi_nhanh": tra_loi, "muc": muc, "hoi_dap": hoi_dap,
        "nguon": list(kb["source"].values()),
        "trang_thai": kb.get("trang_thai", "nhap_ai"),
        "lien_quan": [{"loai": "thap_than", "slug": ds[j % len(ds)][1]} for j in (i - 1, i + 1)],
        "minh_hoa": _mh_thap_than(ten),
    }


_MUA = {"xuan": "Sinh mùa xuân", "ha": "Sinh mùa hạ", "thu": "Sinh mùa thu", "dong": "Sinh mùa đông"}


def _ds_nhat_chu() -> list[tuple[str, str]]:
    return [(can, f"nhat-chu-{_slug(can)}") for can in _doc("battu_kb.json")["nhat_chu"]]


def _trang_nhat_chu(can: str, slug: str) -> dict:
    kb = _doc("battu_kb.json")
    n = kb["nhat_chu"][can]
    nh = kb["ngu_hanh"].get(n["ngu_hanh"], {})
    tra_loi = (f"Nhật chủ {can} (hành {n['ngu_hanh']}) mang hình tượng {n['hinh_tuong']}: {n['tinh_chat']}. "
               f"Điểm mạnh: {n['diem_manh']}. Mặt tối: {n['mat_toi']}.")
    muc = [{"tieu_de": "Điểm mạnh", "doan": _cau(n["diem_manh"][:1].upper() + n["diem_manh"][1:])},
           {"tieu_de": "Mặt tối", "doan": _cau(n["mat_toi"][:1].upper() + n["mat_toi"][1:])},
           {"tieu_de": "Theo mùa sinh", "danh_sach": [f"{_MUA[k]}: {v}" for k, v in n["mua"].items() if k in _MUA]}]
    if nh:
        muc.append({"tieu_de": f"Hành {n['ngu_hanh']}", "danh_sach": [
            f"Tính chất: {nh['tinh_chat']}.", _cau(nh["khi_thieu"][:1].upper() + nh["khi_thieu"][1:]),
            _cau(nh["khi_thua"][:1].upper() + nh["khi_thua"][1:]), f"Ứng dụng dân gian: {nh['ung_dung']}."]})
    muc.append({"tieu_de": "Câu hỏi tự soi", "doan": n["cau_tu_soi"]})
    hoi_dap = [{"hoi": f"Nhật chủ {can} là người thế nào?", "dap": tra_loi},
               {"hoi": f"Nhật chủ {can} sinh mùa đông thì sao?", "dap": n["mua"].get("dong", "")}]
    ds = _ds_nhat_chu()
    i = [x for _, x in ds].index(slug)
    return {
        "loai": "nhat_chu", "slug": slug,
        "tieu_de": f"Nhật chủ {can} ({n['ngu_hanh']}) trong Bát tự — tính cách và mùa sinh",
        "mo_ta": _cat(f"Nhật chủ {can}, hình tượng {n['hinh_tuong']}: {n['tinh_chat']}. Điểm mạnh, mặt tối, ảnh hưởng mùa sinh."),
        "tra_loi_nhanh": tra_loi, "muc": muc, "hoi_dap": [h for h in hoi_dap if h["dap"]],
        "nguon": list(kb["source"].values()),
        "trang_thai": kb.get("trang_thai", "nhap_ai"),
        "lien_quan": [{"loai": "nhat_chu", "slug": ds[j % len(ds)][1]} for j in (i - 1, i + 1)],
        "minh_hoa": _mh_nhat_chu(can),
    }


_TRANG = {"cung": (_ds_cung, _trang_cung), "thap_than": (_ds_thap_than, _trang_thap_than),
          "nhat_chu": (_ds_nhat_chu, _trang_nhat_chu)}
from app.kb import trang_thanso as _tts  # noqa: E402 — SEO-G: cụm trang thần số theo nhu cầu tìm kiếm
_TRANG.update(_tts.TRANG)


# ---- API công khai của module -------------------------------------------------
def _ten_ngan(loai: str, slug: str) -> str:
    if loai == "so":
        return f"Số {slug[3:]}"
    if loai == "que":
        k = slug.split("-")[1]
        return f"Quẻ {_doc('kinhdich_kb.json')['que'][k]['ten']}"
    if loai in _TRANG:
        ten = dict((s, t) for t, s in _TRANG[loai][0]())[slug]
        if loai in _tts.TEN_NGAN:
            return _tts.TEN_NGAN[loai](ten)
        return {"cung": f"Cung {ten}", "thap_than": ten, "nhat_chu": f"Nhật chủ {ten}"}[loai]
    return f"Sao {dict((s, t) for t, s in _ds_sao())[slug]}"


def _hoan_tat(t: dict) -> dict:
    t["index"] = t["trang_thai"] == "da_duyet" or INDEX_NHAP_AI
    for l in t["lien_quan"]:
        l["tieu_de"] = _ten_ngan(l["loai"], l["slug"])
    t["cap_nhat"] = CAP_NHAT
    return t


def lay(loai: str, slug: str) -> dict | None:
    if loai == "so" and slug.startswith("so-") and slug[3:] in _SO:
        return _hoan_tat(_trang_so(slug[3:]))
    if loai == "que":
        for k, s in _ds_que():
            if s == slug:
                return _hoan_tat(_trang_que(k, s))
    if loai == "sao":
        for ten, s in _ds_sao():
            if s == slug:
                return _hoan_tat(_trang_sao(ten, s))
    if loai in _TRANG:
        ds, dung = _TRANG[loai]
        for ten, s in ds():
            if s == slug:
                return _hoan_tat(dung(ten, s))
    return None


def danh_sach() -> list[dict]:
    """Mục lục gọn cho sitemap / trang chủ đề (không kèm nội dung)."""
    ra = []
    for loai, slugs in (("so", [f"so-{s}" for s in _SO]), ("que", [s for _, s in _ds_que()]),
                        ("sao", [s for _, s in _ds_sao()]),
                        *((l, [s for _, s in ds()]) for l, (ds, _) in _TRANG.items())):
        for slug in slugs:
            t = lay(loai, slug)
            assert t is not None
            ra.append({k: t[k] for k in ("loai", "slug", "tieu_de", "mo_ta", "trang_thai", "index", "cap_nhat")})
    return ra
