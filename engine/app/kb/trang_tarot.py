# -*- coding: utf-8 -*-
"""TR-1 — cụm trang kiến thức "78 lá bài Tarot" `/tarot/la-bai/{slug}`, dựng từ KB (chỉ ĐỌC + GHÉP), loại `la_bai`.

Một trang cho mỗi lá: lá nói về gì (trả lời nhanh), hình trên lá (Waite), xuôi và ngược, theo từng chuyện (tình cảm, công
việc, tiền bạc, sức khoẻ + miễn trừ), bốn trường phái (một bảng thật), chiêm tinh và nhịp thời gian (decan / cung / hành
tinh, Sephirah, Hebrew — bảng thật cho lá số 2–10), trích sách (Waite 1910, phạm vi công cộng), việc nên làm và câu tự soi.
Không điểm số, không sinh nghĩa mới.

EN-ALL GĐ 7: chữ khuôn qua `L()` (data/en/loi/trang_tarot.json); nghĩa lá qua bản phủ `data/en/tarot_kb.json`. Bản Việt
giữ nguyên từng byte."""
from __future__ import annotations

from app import ngon_ngu

import re

from app.calc import tarot as calc
from app.kb import tarot_kb as kb
from app.kb.loi import L

DUONG_CONG_CU = "/tarot"
DUONG_CUM = "/tarot/la-bai"        # = web lib/chuyen-huong.json chu_de["la-bai"]
TEN_PHAI = {"rws": "Rider–Waite–Smith", "thoth": "Thoth · Golden Dawn", "tdm": "Tarot de Marseille", "bota": "B.O.T.A."}
TEN_LV = {"tinh_cam": "Tình cảm", "cong_viec": "Công việc", "tien_bac": "Tiền bạc", "suc_khoe": "Sức khoẻ và nhịp sống"}


def _t():
    from app.kb import trang
    return trang


def _ascii(s: str) -> str:
    """Tên Marseille (tiếng Pháp) bỏ dấu cho câu tiếng Anh ("L'Impératrice" → "L'Imperatrice") — bản Việt không dùng."""
    import unicodedata  # noqa: PLC0415
    return "".join(c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn")


def _lv(k: str) -> str:
    return L(f"trang_tr.lv.{k}", TEN_LV[k])


@ngon_ngu.theo_viet
def ds_la_bai() -> list[tuple[str, str]]:
    t = _t()
    return [(ma, t._slug(kb.la()[ma]["ten"])) for ma in calc.BO_BAI]


def _tieu_de(l: dict) -> str:
    ung = [L("trang_tr.td.1", "{ten} ({en}): ý nghĩa xuôi, ngược, tình cảm, công việc", ten=l["ten"], en=l["en"]),
           L("trang_tr.td.2", "{ten} ({en}): ý nghĩa xuôi và ngược", ten=l["ten"], en=l["en"]),
           L("trang_tr.td.3", "Lá {ten} ({en}) trong tarot", ten=l["ten"], en=l["en"]),
           L("trang_tr.td.4", "Lá {ten} trong tarot", ten=l["ten"], en=l["en"])]
    return next((x for x in ung if len(x) <= 70), ung[-1][:70])


def _ngay(tu: list[int], den: list[int]) -> str:
    return f"{tu[1]}/{tu[0]}–{den[1]}/{den[0]}"


def slug_en(en: str) -> str:
    """Slug URL bản tiếng Anh của lá ("The Fool" → "the-fool") — cùng luật với `web/lib/en/engine.ts slugLa`."""
    return re.sub(r"^-|-$", "", re.sub(r"[^a-z0-9]+", "-", en.lower()))


def trang_la_bai(ma: str, slug: str) -> dict:
    t = _t()
    l = kb.la()[ma]
    ten = l["ten"]
    bo = kb.bo().get(l["bo"] or "") or {}
    nt = kb.nguyen_to()[l["nguyen_to"]]
    thuoc = (L("trang_tr.thuoc.an_chinh", "ẩn chính số {so}", so=l["so"]) if l["loai"] == "an_chinh"
             else L("trang_tr.thuoc.bo", "bộ {bo} ({bo_en}), nguyên tố {nt}", bo=bo["ten"], bo_en=bo["en"], nt=nt["ten"]))
    # AUD-P0: câu đầu tự đứng.
    tra_loi_nhanh = L("trang_tr.tra_loi", "{ten} ({en}) là lá {thuoc} trong tarot; từ khoá: {tk}. {y}.",
                      ten=ten, en=l["en"], thuoc=thuoc, tk=", ".join(l["tu_khoa"]), y=l["y_xuoi"].split(". ")[0])
    muc = [{"tieu_de": L("trang_tr.noi_ve", "{ten} nói về gì", ten=ten),
            "doan": L("trang_tr.noi_ve_doan", "{tl} Lá ngược: {ng}.", tl=tra_loi_nhanh, ng=", ".join(l["tu_khoa_nguoc"]))},
           {"tieu_de": L("trang_tr.hinh", "Hình trên lá (bộ Waite 1909)"), "doan": l["hinh_anh"]},
           {"tieu_de": L("trang_tr.xuoi_nguoc", "Xuôi và ngược"),
            "danh_sach": [L("trang_tr.xuoi", "Xuôi: {x}", x=l["y_xuoi"]), L("trang_tr.nguoc", "Ngược: {x}", x=l["y_nguoc"])]},
           {"tieu_de": L("trang_tr.tung_chuyen", "Theo từng chuyện"),
            "danh_sach": [f"{_lv(k)}: {l['linh_vuc'][k]}"
                          + (L("trang_tr.mien_tru_sk", " Lời nhắc nhịp sống, không thay lời bác sĩ.") if k == "suc_khoe" else "") for k in TEN_LV]},
           # EN-ALL: bản phủ ngôn ngữ có thể tắt `truong_phai` (null, QTE-3) → bỏ mục này thay vì ném KeyError (mục lục KB
           # gọi bằng tiếng Anh từng trả 500). Bản Việt luôn có trường này → đầu ra không đổi.
           *([{"tieu_de": "Bốn trường phái đọc lá này thế nào",
               "doan": "Cùng một lá, bốn trường phái hỏi bốn câu khác nhau — ở Hiểu Bản Thân cả bốn cùng góp vào một bài đọc.",
               "bang": {"cot": ["Trường phái", "Câu hỏi của phái", "Cách đọc lá này"],
                        "dong": [[TEN_PHAI[k], kb.truong_phai()[k]["hoi"], l["truong_phai"][k]["loi"]] for k in ("rws", "thoth", "tdm", "bota")]}}]
             if l.get("truong_phai") else [])]
    # chiêm tinh & nhịp
    if l["loai"] == "an_chinh":
        ct = l["chiem_tinh"]
        muc.append({"tieu_de": L("trang_tr.ct.tieu_de", "Chiêm tinh, chữ Hebrew và nhịp thời gian"),
                    "doan": L("trang_tr.ct.doan",
                              "Golden Dawn gắn {ten} với {ct}, chữ Hebrew {chu} (con đường {duong} trên Cây Sự sống); Thoth gọi là {thoth}, "
                              "Marseille gọi là {tdm}. Nhịp gợi ý: {nhip}. Nhịp là cách Golden Dawn gắn lá với mùa và hành tinh — để chọn lúc làm, "
                              "không phải ngày dự báo.",
                              ten=ten, ct=ct["ten"], chu=l["chu_cai"], duong=l["duong"], thoth=l["thoth_ten"], tdm=l["tdm_ten"], tdm_a=_ascii(l["tdm_ten"]), nhip=_nhip(ma))})
    elif l["loai"] == "so":
        d = calc.decan(ma)
        if d:
            c = kb.cung_hoang_dao()[d["cung"]]
            h = kb.hanh_tinh()[d["hanh_tinh"]]
            muc.append({"tieu_de": L("trang_tr.decan.tieu_de", "Decan hoàng đạo và nhịp thời gian"),
                        "doan": L("trang_tr.decan.doan",
                                  "Book T (Golden Dawn) gắn {ten} với decan {so} của cung {cung} ({ngay}), hành tinh {ht}; "
                                  "Sephirah {seph}; tên Golden Dawn: {thoth}. Nhịp của bộ {bo}: {nhip}. "
                                  "Decan là nhịp gợi ý (mỗi decan khoảng 10 ngày, mốc ngày phổ biến lệch ±1 ngày tuỳ năm), không phải ngày dự báo.",
                                  ten=ten, so=d["so"], cung=c["ten"], ngay=_ngay(d["tu"], d["den"]), ht=h["ten"], seph=kb.sephirah(l["so"]),
                                  thoth=l["thoth_ten"], bo=bo["ten"], nhip=bo["nhip"]),
                        "bang": {"cot": [L("trang_tr.decan.cot.la", "Lá"), L("trang_tr.decan.cot.cung", "Cung"), L("trang_tr.decan.cot.decan", "Decan"),
                                         L("trang_tr.decan.cot.ht", "Hành tinh"), L("trang_tr.decan.cot.ngay", "Khoảng ngày")],
                                 "dong": [[kb.la()[f"{l['bo']}_{s}"]["ten"], kb.cung_hoang_dao()[calc.decan(f"{l['bo']}_{s}")["cung"]]["ten"], str(calc.decan(f"{l['bo']}_{s}")["so"]),
                                           kb.hanh_tinh()[calc.decan(f"{l['bo']}_{s}")["hanh_tinh"]]["ten"], _ngay(calc.decan(f"{l['bo']}_{s}")["tu"], calc.decan(f"{l['bo']}_{s}")["den"])]
                                          for s in range(2, 11)]}})
        else:
            muc.append({"tieu_de": L("trang_tr.goc.tieu_de", "Gốc của bộ và nhịp thời gian"),
                        "doan": L("trang_tr.goc.doan",
                                  "{ten} là {thoth} — gốc của mọi lá {bo}; Sephirah {seph}. Át không có decan riêng; nhịp theo bộ {bo}: {nhip} "
                                  "(gợi ý, không phải dự báo).",
                                  ten=ten, thoth=l["thoth_ten"], bo=bo["ten"], seph=kb.sephirah(1), nhip=bo["nhip"])})
    else:
        muc.append({"tieu_de": L("trang_tr.hg.tieu_de", "Lá hoàng gia: nguyên tố kép và nhịp"),
                    "doan": L("trang_tr.hg.doan",
                              "Golden Dawn đọc {ten} là {ntp} ({thoth}); Marseille gọi là {tdm}. Là người: {nv} "
                              "Là tình huống: {th}. Nhịp theo bộ {bo}: {nhip}.",
                              ten=ten, ntp=l["ten_nguyen_to_phu"], thoth=l["thoth_ten"], tdm=l["tdm_ten"], tdm_a=_ascii(l["tdm_ten"]), nv=l.get("nhan_vat") or "",
                              th=l["y_xuoi"].split(". ")[0], bo=bo["ten"], nhip=bo["nhip"])})
    # TR-1b: trích dẫn đã đối chiếu nguyên văn (Waite 1910 qua Gutenberg #43548; Book T) — xem kb["doi_chieu"], test_tarot_nguon.py.
    # EN-ALL GĐ 7: nguyên văn đã là tiếng Anh → bản Anh không kèm lời diễn giải tiếng Việt (`nghia` rỗng).
    viet = ngon_ngu.la_viet()
    trich_dan = []
    for tr in l.get("trich") or []:
        nv = tr["nguyen_van"] + (f" Reversed: {tr['nguyen_van_nguoc']}" if tr.get("nguyen_van_nguoc") else "")
        if tr.get("ten"):
            nv = f"{tr['ten']}. {nv}"
        trich_dan.append({"sach": kb.ten_nguon(tr["sach"]), "nguyen_van": nv, "nghia": tr["nghia"] if viet else ""})
    if l.get("truong_phai") or trich_dan:
        tp = l.get("truong_phai")
        muc.append({"tieu_de": L("trang.sach_xua", "Sách xưa nói gì"),
                    **({"doan": f"Waite (1910): {tp['rws']['loi']} Book T: {tp['thoth']['loi']}"} if tp else {}),
                    **({"trich_dan": trich_dan} if trich_dan else {})})
    muc.append({"tieu_de": L("trang_tr.viec", "Việc nên làm khi rút được lá này"),
                "danh_sach": [L("trang_tr.viec_0", "Việc 0 đồng: {x}", x=l["viec"]), L("trang_tr.tu_soi", "Câu tự soi: {x}", x=l["cau_tu_soi"])]})
    hoi_dap = [{"hoi": L("trang_tr.hd.nguoc", "{ten} ngược nghĩa là gì?", ten=ten), "dap": l["y_nguoc"]},
               {"hoi": L("trang_tr.hd.tinh_cam", "{ten} trong tình cảm nói gì?", ten=ten), "dap": l["linh_vuc"]["tinh_cam"]},
               {"hoi": L("trang_tr.hd.bo", "{ten} thuộc bộ nào, nguyên tố gì?", ten=ten),
                "dap": L("trang_tr.hd.bo_dap", "{ten} là lá {thuoc}. {loi}", ten=ten, thuoc=thuoc, loi=nt["loi"])},
               {"hoi": L("trang_tr.hd.diem", "Rút được lá này có phải là điềm không?"),
                "dap": L("trang_tr.hd.diem_dap", "Không. Tarot ở đây là cách nhìn lại một việc qua hình ảnh và bốn trường phái có sách; lá bài gọi tên "
                         "điều đang có để bạn nhìn rõ, không nói trước tương lai.")}]
    lien_quan = _lien_quan(ma)
    mo_ta = t._cat(L("trang_tr.mo_ta", "{ten} ({en}): {tk}; ngược: {ng}. Ý nghĩa trong tình cảm, công việc, tiền bạc theo Waite, Golden Dawn, "
                     "Marseille, B.O.T.A.", ten=ten, en=l["en"], tk=", ".join(l["tu_khoa"]), ng=", ".join(l["tu_khoa_nguoc"][:2])))
    return {"loai": "la_bai", "slug": slug, "tieu_de": _tieu_de(l), "mo_ta": mo_ta, "tra_loi_nhanh": tra_loi_nhanh, "muc": muc, "hoi_dap": hoi_dap,
            "ban_en": f"/en/tarot/cards/{slug_en(l['en'])}",
            "lien_quan": lien_quan,
            "y_chinh": [f"{ten}: {', '.join(l['tu_khoa'][:3])}", L("trang_tr.yc.nguoc", "Ngược: {x}", x=", ".join(l["tu_khoa_nguoc"][:2])),
                        L("trang_tr.yc.viec", "Việc nên làm: {x}", x=l["viec"][:90] if viet else t._cat(l["viec"], 76))],
            "minh_hoa": {"kieu": "la_bai", "id": ma, "ten": ten, "en": l["en"], "so": l["so"], "bo": l["bo"], "loai": l["loai"], "nguyen_to": l["nguyen_to"]},
            "trang_thai": kb.meta()["trang_thai"], "nguon": [kb.ten_nguon(k) for k in ("waite_1910", "book_t", "tdm_conver")]}


def _nhip(ma: str) -> str:
    import datetime as dt  # noqa: PLC0415
    k = calc.khoang_thoi_gian(ma, dt.date(2026, 1, 1))
    if k["loai"] == "cung":
        c = kb.cung_hoang_dao()[k["cung"]]
        return L("trang_tr.nhip.mua", "mùa {cung} ({ngay}), {nhip}", cung=c["ten"], ngay=_ngay(c["tu"], c["den"]), nhip=k["nhip"])
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
