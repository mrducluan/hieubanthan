# -*- coding: utf-8 -*-
"""TR-1 — cụm trang kiến thức "78 lá bài Tarot" `/tarot/la-bai/{slug}`, dựng từ KB (chỉ ĐỌC + GHÉP), loại `la_bai`.

Một trang cho mỗi lá: lá nói về gì (trả lời nhanh), hình trên lá (Waite), xuôi và ngược, theo từng chuyện (tình cảm, công
việc, tiền bạc, sức khoẻ + miễn trừ), bốn trường phái (một bảng thật), chiêm tinh và nhịp thời gian (decan / cung / hành
tinh, Sephirah, Hebrew — bảng thật cho lá số 2–10), trích sách (Waite 1910, phạm vi công cộng), việc nên làm và câu tự soi.
Không điểm số, không sinh nghĩa mới."""
from __future__ import annotations

from app.calc import tarot as calc
from app.kb import tarot_kb as kb

DUONG_CONG_CU = "/tarot"
DUONG_CUM = "/tarot/la-bai"        # = web lib/chuyen-huong.json chu_de["la-bai"]
TEN_PHAI = {"rws": "Rider–Waite–Smith", "thoth": "Thoth · Golden Dawn", "tdm": "Tarot de Marseille", "bota": "B.O.T.A."}
TEN_LV = {"tinh_cam": "Tình cảm", "cong_viec": "Công việc", "tien_bac": "Tiền bạc", "suc_khoe": "Sức khoẻ và nhịp sống"}


def _t():
    from app.kb import trang
    return trang


def ds_la_bai() -> list[tuple[str, str]]:
    t = _t()
    return [(ma, t._slug(kb.la()[ma]["ten"])) for ma in calc.BO_BAI]


def _tieu_de(l: dict) -> str:
    ung = [f"{l['ten']} ({l['en']}): ý nghĩa xuôi, ngược, tình cảm, công việc", f"{l['ten']} ({l['en']}): ý nghĩa xuôi và ngược",
           f"Lá {l['ten']} ({l['en']}) trong tarot", f"Lá {l['ten']} trong tarot"]
    return next((x for x in ung if len(x) <= 70), ung[-1][:70])


def _ngay(tu: list[int], den: list[int]) -> str:
    return f"{tu[1]}/{tu[0]}–{den[1]}/{den[0]}"


def trang_la_bai(ma: str, slug: str) -> dict:
    t = _t()
    l = kb.la()[ma]
    ten = l["ten"]
    bo = kb.bo().get(l["bo"] or "") or {}
    nt = kb.nguyen_to()[l["nguyen_to"]]
    thuoc = f"ẩn chính số {l['so']}" if l["loai"] == "an_chinh" else f"bộ {bo['ten']} ({bo['en']}), nguyên tố {nt['ten']}"
    # AUD-P0: câu đầu tự đứng.
    tra_loi_nhanh = f"{ten} ({l['en']}) là lá {thuoc} trong tarot; từ khoá: {', '.join(l['tu_khoa'])}. {l['y_xuoi'].split('. ')[0]}."
    muc = [{"tieu_de": f"{ten} nói về gì", "doan": f"{tra_loi_nhanh} Lá ngược: {', '.join(l['tu_khoa_nguoc'])}."},
           {"tieu_de": "Hình trên lá (bộ Waite 1909)", "doan": l["hinh_anh"]},
           {"tieu_de": "Xuôi và ngược", "danh_sach": [f"Xuôi: {l['y_xuoi']}", f"Ngược: {l['y_nguoc']}"]},
           {"tieu_de": "Theo từng chuyện", "danh_sach": [f"{TEN_LV[k]}: {l['linh_vuc'][k]}" + (" Lời nhắc nhịp sống, không thay lời bác sĩ." if k == "suc_khoe" else "") for k in TEN_LV]},
           {"tieu_de": "Bốn trường phái đọc lá này thế nào",
            "doan": "Cùng một lá, bốn trường phái hỏi bốn câu khác nhau — ở Hiểu Bản Thân cả bốn cùng góp vào một bài đọc.",
            "bang": {"cot": ["Trường phái", "Câu hỏi của phái", "Cách đọc lá này"],
                     "dong": [[TEN_PHAI[k], kb.truong_phai()[k]["hoi"], l["truong_phai"][k]["loi"]] for k in ("rws", "thoth", "tdm", "bota")]}}]
    # chiêm tinh & nhịp
    if l["loai"] == "an_chinh":
        ct = l["chiem_tinh"]
        muc.append({"tieu_de": "Chiêm tinh, chữ Hebrew và nhịp thời gian",
                    "doan": f"Golden Dawn gắn {ten} với {ct['ten']}, chữ Hebrew {l['chu_cai']} (con đường {l['duong']} trên Cây Sự sống); Thoth gọi là {l['thoth_ten']}, Marseille gọi là {l['tdm_ten']}. "
                            f"Nhịp gợi ý: {_nhip(ma)}. Nhịp là cách Golden Dawn gắn lá với mùa và hành tinh — để chọn lúc làm, không phải ngày dự báo."})
    elif l["loai"] == "so":
        d = calc.decan(ma)
        if d:
            c = kb.cung_hoang_dao()[d["cung"]]
            h = kb.hanh_tinh()[d["hanh_tinh"]]
            muc.append({"tieu_de": "Decan hoàng đạo và nhịp thời gian",
                        "doan": f"Book T (Golden Dawn) gắn {ten} với decan {d['so']} của cung {c['ten']} ({_ngay(d['tu'], d['den'])}), hành tinh {h['ten']}; "
                                f"Sephirah {kb.sephirah(l['so'])}; tên Golden Dawn: {l['thoth_ten']}. Nhịp của bộ {bo['ten']}: {bo['nhip']}. "
                                "Decan là nhịp gợi ý (mỗi decan khoảng 10 ngày, mốc ngày phổ biến lệch ±1 ngày tuỳ năm), không phải ngày dự báo.",
                        "bang": {"cot": ["Lá", "Cung", "Decan", "Hành tinh", "Khoảng ngày"],
                                 "dong": [[kb.la()[f"{l['bo']}_{s}"]["ten"], kb.cung_hoang_dao()[calc.decan(f"{l['bo']}_{s}")["cung"]]["ten"], str(calc.decan(f"{l['bo']}_{s}")["so"]),
                                           kb.hanh_tinh()[calc.decan(f"{l['bo']}_{s}")["hanh_tinh"]]["ten"], _ngay(calc.decan(f"{l['bo']}_{s}")["tu"], calc.decan(f"{l['bo']}_{s}")["den"])]
                                          for s in range(2, 11)]}})
        else:
            muc.append({"tieu_de": "Gốc của bộ và nhịp thời gian",
                        "doan": f"{ten} là {l['thoth_ten']} — gốc của mọi lá {bo['ten']}; Sephirah {kb.sephirah(1)}. Át không có decan riêng; nhịp theo bộ {bo['ten']}: {bo['nhip']} (gợi ý, không phải dự báo)."})
    else:
        muc.append({"tieu_de": "Lá hoàng gia: nguyên tố kép và nhịp",
                    "doan": f"Golden Dawn đọc {ten} là {l['ten_nguyen_to_phu']} ({l['thoth_ten']}); Marseille gọi là {l['tdm_ten']}. Là người: {l.get('nhan_vat') or ''} "
                            f"Là tình huống: {l['y_xuoi'].split('. ')[0]}. Nhịp theo bộ {bo['ten']}: {bo['nhip']}."})
    # TR-1b: trích dẫn đã đối chiếu nguyên văn (Waite 1910 qua Gutenberg #43548; Book T) — xem kb["doi_chieu"], test_tarot_nguon.py.
    trich_dan = []
    for tr in l.get("trich") or []:
        nv = tr["nguyen_van"] + (f" Reversed: {tr['nguyen_van_nguoc']}" if tr.get("nguyen_van_nguoc") else "")
        if tr.get("ten"):
            nv = f"{tr['ten']}. {nv}"
        trich_dan.append({"sach": kb.ten_nguon(tr["sach"]), "nguyen_van": nv, "nghia": tr["nghia"]})
    muc.append({"tieu_de": "Sách xưa nói gì", "doan": f"Waite (1910): {l['truong_phai']['rws']['loi']} Book T: {l['truong_phai']['thoth']['loi']}",
                **({"trich_dan": trich_dan} if trich_dan else {})})
    muc.append({"tieu_de": "Việc nên làm khi rút được lá này", "danh_sach": [f"Việc 0 đồng: {l['viec']}", f"Câu tự soi: {l['cau_tu_soi']}"]})
    hoi_dap = [{"hoi": f"{ten} ngược nghĩa là gì?", "dap": l["y_nguoc"]},
               {"hoi": f"{ten} trong tình cảm nói gì?", "dap": l["linh_vuc"]["tinh_cam"]},
               {"hoi": f"{ten} thuộc bộ nào, nguyên tố gì?", "dap": f"{ten} là lá {thuoc}. {nt['loi']}"},
               {"hoi": "Rút được lá này có phải là điềm không?", "dap": "Không. Tarot ở đây là cách nhìn lại một việc qua hình ảnh và bốn trường phái có sách; lá bài gọi tên điều đang có để bạn nhìn rõ, không nói trước tương lai."}]
    lien_quan = _lien_quan(ma)
    mo_ta = t._cat(f"{ten} ({l['en']}): {', '.join(l['tu_khoa'])}; ngược: {', '.join(l['tu_khoa_nguoc'][:2])}. Ý nghĩa trong tình cảm, công việc, tiền bạc theo Waite, Golden Dawn, Marseille, B.O.T.A.")
    return {"loai": "la_bai", "slug": slug, "tieu_de": _tieu_de(l), "mo_ta": mo_ta, "tra_loi_nhanh": tra_loi_nhanh, "muc": muc, "hoi_dap": hoi_dap,
            "lien_quan": lien_quan, "y_chinh": [f"{ten}: {', '.join(l['tu_khoa'][:3])}", f"Ngược: {', '.join(l['tu_khoa_nguoc'][:2])}", f"Việc nên làm: {l['viec'][:90]}"],
            "minh_hoa": {"kieu": "la_bai", "id": ma, "ten": ten, "en": l["en"], "so": l["so"], "bo": l["bo"], "loai": l["loai"], "nguyen_to": l["nguyen_to"]},
            "trang_thai": kb.meta()["trang_thai"], "nguon": [kb.ten_nguon(k) for k in ("waite_1910", "book_t", "tdm_conver")]}


def _nhip(ma: str) -> str:
    import datetime as dt  # noqa: PLC0415
    k = calc.khoang_thoi_gian(ma, dt.date(2026, 1, 1))
    if k["loai"] == "cung":
        c = kb.cung_hoang_dao()[k["cung"]]
        return f"mùa {c['ten']} ({_ngay(c['tu'], c['den'])}), {k['nhip']}"
    return k["nhip"]


def _lien_quan(ma: str) -> list[dict]:
    la = kb.la()
    ds = dict(ds_la_bai())
    l = la[ma]
    ra = []
    if l["loai"] == "an_chinh":
        for s in (l["so"] - 1, l["so"] + 1):
            if 0 <= s <= 21:
                ra.append(f"dai_{s}")
    else:
        cap = {11: "tieu_dong", 12: "hiep_si", 13: "hoang_hau", 14: "vua"}
        for s in (l["so"] - 1, l["so"] + 1):
            if 1 <= s <= 14:
                ra.append(f"{l['bo']}_{s if s <= 10 else cap[s]}")
        for b in ("gay", "coc", "kiem", "tien"):
            if b != l["bo"] and len(ra) < 4:
                ra.append(f"{b}_{l['so'] if l['so'] <= 10 else cap[l['so']]}")
    return [{"loai": "la_bai", "slug": ds[x]} for x in ra[:4] if x in ds]


TRANG = {"la_bai": (ds_la_bai, trang_la_bai)}
TEN_NGAN = {"la_bai": lambda ten: kb.la()[ten]["ten"] if ten in kb.la() else ten}
