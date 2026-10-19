# -*- coding: utf-8 -*-
"""Tầng NARRATIVE (4) cho Q&A v2 — diễn đạt GÓI BẰNG CHỨNG thành câu trả lời.

Hai chế độ:
  - template (mặc định, tất định): ghép câu từ các mục KB trong gói. Không cần
    mạng, không tốn tiền, test được từng chữ.
  - llm (khi có OPENROUTER_API_KEY): LLM chỉ nhận gói bằng chứng và câu hỏi,
    viết lại cho mượt. `kiem_tra_dau_ra()` chặn con số lạ và cụm từ tiên đoán;
    vi phạm → rơi về template (che_do = template_fallback).

Câu khủng hoảng / ngoài phạm vi / thiếu dữ liệu: luôn dùng mẫu cố định, KHÔNG
qua LLM.
"""
from __future__ import annotations

import datetime as dt
import json
import os
import re

import httpx

from app.luangiai import hoi, noi_dau
from app.luangiai import thanso_chaldean as _chaldea
from app.narrative import llm as _llm
from app.narrative import ngan_sach as _ngan_sach

KET = ("Đây là góc nhìn tham khảo văn hoá để bạn tự soi, không phải lời tiên đoán "
       "về đời bạn.")
CAM = ["chắc chắn sẽ", "bạn sẽ", "định mệnh", "số phận đã", "không thể tránh", "bẩm sinh",
       "vốn dĩ", "100%", "tiền định"]
TEN_VAI = {"ban": "bạn", "nguoi_kia": "người ấy", "con": "bé", "so_a": "người thứ nhất", "so_b": "người thứ hai"}


# --------------------------------------------------------------------------- #
# Template
# --------------------------------------------------------------------------- #
def _doan(m: dict) -> tuple[str, str | None]:
    """→ (đoạn văn, câu tự soi nếu có)."""
    l = m["loai"]
    if l == "linh_vuc":
        vt = hoi.TEN_VI_TRI.get(m["vi_tri"] or "", "con số")
        ai = TEN_VAI.get(m["vai"], "bạn")
        dau = f"{m['ten_linh_vuc']} — {vt} {m['so']} của {ai}"
        return (f"{dau}: {m['xu_huong']} Mặt tối cần để ý: {m['mat_toi']} "
                f"Gợi ý: {m['goi_y']}", m["cau_tu_soi"])
    if l == "chan_dung":
        ai = TEN_VAI.get(m["vai"], "bạn")
        dau = f"Chân dung theo số chủ đạo {m['so']} của {ai}"
        if m["mat"] == "cong_viec":
            return (f"{dau} — công việc: thế mạnh là {m['the_manh'][0].lower() + m['the_manh'][1:]} "
                    f"Môi trường hợp: {m['moi_truong']} Hướng nghề hay được gợi ý: {' · '.join(m['nghe'])}. "
                    f"Cái bẫy cần tránh: {m['cai_bay']} Với tiền bạc: {m['tien_bac']}", None)
        if m["mat"] == "tinh_cam":
            return (f"{dau} — tình cảm: {m['cach_yeu']} Điều cần được: {m['can_duoc']} "
                    f"Hợp với: {m['hop_kieu_nguoi']} Dấu hiệu lệch nhịp: {m['dau_hieu_lech']}", None)
        return (f"{dau}: {m['chan_dung']} Điểm mạnh: {'; '.join(m['diem_manh'])}. "
                f"Điểm mù: {'; '.join(m['diem_mu'])}. Khi căng thẳng: {m['khi_cang_thang']}", None)
    if l == "trong_vai":
        ai = TEN_VAI.get(m["vai"], "người ấy")
        return (f"Với {m['ten_quan_he'].lower()}, {ai} (số chủ đạo {m['so']}) thường: {m['vai_mo_ta']} "
                f"Cần: {m['can']} Nên tránh: {m['tranh']} Cách nói chuyện hợp: {m['cach_noi']}", None)
    if l == "cap_so":
        return (f"Cặp {m['ten_vi_tri']} {m['so_a']} và {m['so_b']} (tra theo cặp {m['cap']}): "
                f"điểm hoà — {m['hoa']} Điểm dễ va — {m['va']} Hai người có thể: {m['cung_lam']}", None)
    if l == "nam_ca_nhan":
        nam = f"Năm {m['nam']} là năm cá nhân {m['so']} của bạn" if m.get("nam") else \
            f"Năm cá nhân {m['so']}"
        return (f"{nam} — {m['chu_de']}: {m['y_nghia']} Nên: {m['nen']} Tránh: {m['tranh']}", None)
    if l == "thang_ca_nhan":
        th = f"Tháng {m['thang']} là tháng cá nhân {m['so']}" if m.get("thang") else \
            f"Tháng cá nhân {m['so']}"
        return f"{th} ({m['chu_de']}): {m['nen']} Tránh: {m['tranh']}", None
    if l == "thang_mo_dau":   # TS-NOIDAU: tháng cá nhân 1 trong 12 tháng tới (nhịp mở đầu, không phải ngày "tốt")
        if not m["cac_thang"]:
            return "Trong 12 tháng tới chưa có tháng cá nhân 1 — nhịp mở đầu theo thần số.", None
        return (f"Tháng cá nhân 1 ({m['chu_de']}) của bạn trong 12 tháng tới: {', '.join(m['cac_thang'])}. "
                f"{m['nen']} Tránh: {m['tranh']}", None)
    if l == "ngay_ca_nhan":
        if m.get("ngay"):
            y, mo, d = m["ngay"].split("-")
            return f"Ngày {int(d)}/{int(mo)}/{y} — {m['y_nghia']}", None
        return m["y_nghia"], None
    if l == "dinh_cao":
        den = f"{m['tu_tuoi']}–{m['den_tuoi']} tuổi" if m["den_tuoi"] else f"từ {m['tu_tuoi']} tuổi"
        hien = " (giai đoạn hiện tại)" if m["hien_tai"] else ""
        return (f"Đỉnh cao {m['dinh']}, số {m['so']}, {den}{hien} — {m['chu_de']}: {m['y_nghia']} "
                f"Bóng tối: {m['bong_toi']}", m.get("phan_chung"))
    if l == "thu_thach":
        return (f"Thử thách chính số {m['so']} — {m['mo_ta']}: {m['y_nghia']} Cách vượt: {m['cach_vuot']}",
                None)
    if l == "mui_ten":
        if m["trong"]:
            return f"{m['ten']} ({m['ma']}): {m['y_nghia']} Gợi ý: {m['goi_y']}", None
        return f"{m['ten']} ({m['ma']}): {m['y_nghia']} Mặt tối: {m['mat_toi']}", None
    if l == "o_so":
        lan = "không có" if m["so_lan"] == 0 else f"có {m['so_lan']} lần"
        return f"Ô số {m['so']} ({m['y_nghia_o']}) — ngày sinh {lan}: {m['mo_ta']}", None
    if l == "no_nghiep":
        return f"{m['ten']}: {m['y_nghia']} Gợi ý: {m['goi_y']}", None
    if l in ("khong_no_nghiep", "bai_hoc_nghiep", "ngay_sinh", "truong_thanh", "thai_do"):
        return m["noi_dung"], None
    if l == "giai_thich":
        return f"{m['tieu_de']}: {m['noi_dung']}", None
    if l == "chaldea":
        g, k = m.get("nghia_goc") or {}, m.get("nghia_kep") or {}
        dau = f"{m['ten']} theo phái Chaldea: "
        dau += (f"số kép {m['kep']} ({k['bieu_tuong']}), rút về số gốc {m['goc']}" if k
                else f"số gốc {m['goc']}")
        if g:
            dau += f" — {g['ten']} ({g['hanh_tinh']})"
        than = k.get("xu_huong") or g.get("xu_huong", "")
        toi = k.get("mat_toi") or g.get("mat_toi")
        return (f"{dau}. {than}" + (f" Mặt tối cần để ý: {toi}" if toi else ""),
                k.get("cau_tu_soi") or g.get("cau_tu_soi"))
    return "", None


def van_template(goi: dict) -> str:
    if goi["mau"] and not goi["muc"]:
        return goi["mau"]
    if not goi["muc"]:
        return hoi.kb.mau("khong_ro")
    doan, soi = [], []
    for m in goi["muc"][:6]:
        d, s = _doan(m)
        if d:
            doan.append(d)
        if s and len(soi) < 2:
            soi.append(s)
    if soi:
        doan.append("Câu hỏi để tự soi: " + " ".join(soi))
    if goi.get("luu_y"):
        doan.append(goi["luu_y"])
    doan.append(KET)
    return "\n\n".join(doan)


# --------------------------------------------------------------------------- #
# Kiểm tra đầu ra (dùng cho cả template và LLM)
# --------------------------------------------------------------------------- #
def kiem_tra_dau_ra(van: str, goi: dict) -> list[str]:
    loi = []
    duoc = set(goi.get("so_trong_goi", []))
    for n in re.findall(r"\d+", van):
        if int(n) not in duoc:
            loi.append(f"số lạ: {n}")
    goc = json.dumps(goi, ensure_ascii=False).lower()
    thap = van.lower()
    for c in CAM:
        if c in thap and c not in goc:
            loi.append(f"cụm cấm: {c}")
    return loi


# --------------------------------------------------------------------------- #
# LLM
# --------------------------------------------------------------------------- #
_SYSTEM_GOI = """Bạn là biên tập viên, không phải thầy bói. Bạn nhận một câu hỏi và \
một GÓI BẰNG CHỨNG (JSON) đã được hệ thống chọn sẵn từ kho tri thức. Viết câu \
trả lời tiếng Việt ấm áp, rõ ràng, 4–8 câu.

RÀNG BUỘC TUYỆT ĐỐI:
- CHỈ dùng thông tin trong gói. Không thêm con số, năm, ngày, sự kiện, tên, dự \
đoán hay lời khuyên nào không có trong gói.
- Giữ ít nhất một ý MẶT TỐI và một CÂU TỰ SOI nếu gói có.
- Nếu gói có 'luu_y', đưa lời lưu ý đó vào cuối.
- Không dùng giọng phán quyết: cấm "bạn sẽ", "chắc chắn", "định mệnh".
- Kết bằng: đây là góc nhìn tham khảo văn hoá để tự soi, không phải lời tiên đoán."""


def _goi_llm(goi: dict, cau_hoi: str) -> str:
    _ngan_sach.kiem_luot()   # RL-1: hết lượt → HetLuot, nơi gọi rơi về template
    key = os.environ.get("OPENROUTER_API_KEY")
    model = os.environ.get("OPENROUTER_MODEL", _llm.DEFAULT_MODEL)
    gon = {"cau_hoi": cau_hoi, "muc": goi["muc"], "luu_y": goi.get("luu_y")}
    with httpx.Client(timeout=45) as c:
        r = c.post(_llm.OPENROUTER_URL,
                   headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
                   json={"model": model, "temperature": 0.5, "messages": [
                       {"role": "system", "content": _SYSTEM_GOI},
                       {"role": "user", "content": json.dumps(gon, ensure_ascii=False)}]})
        r.raise_for_status()
        return r.json()["choices"][0]["message"]["content"]


# --------------------------------------------------------------------------- #
# Điểm vào
# --------------------------------------------------------------------------- #
# TS-PHAI-2: mục Pitago "mô tả con người" → thay bằng số Chaldea; chủ đề khác (năm/tháng/ngày cá nhân, đỉnh cao,
# biểu đồ, nợ nghiệp, hợp đôi…) phái Chaldea không có → giữ Pythagoras và ghi rõ.
_LOAI_THAY_CHALDEA = {"linh_vuc", "chan_dung"}
LUU_Y_CHALDEA = ("Phái Chaldea không có phần này (năm/tháng/ngày cá nhân, đỉnh cao, biểu đồ ngày sinh, nợ nghiệp, "
                 "hợp đôi theo cặp số), nên câu trả lời trên theo phái Pythagoras.")


def _goi_chaldea(goi: dict, pl: dict, nguoi: dict) -> dict:
    muc = goi["muc"]
    if not muc or goi["can_them"] or pl.get("doi_tuong") != "ban_than":
        return goi
    # Câu "mô tả con người" (mục đầu là nghĩa số/chân dung của chính bạn) → Chaldea; còn lại → Pythagoras + ghi rõ.
    if not (muc[0]["loai"] in _LOAI_THAY_CHALDEA and all(m.get("vai", "ban") == "ban" for m in muc)):
        luu = " ".join(x for x in (goi.get("luu_y"), LUU_Y_CHALDEA) if x)
        return {**goi, "luu_y": luu}
    ten = nguoi["ho_ten"] if isinstance(nguoi["ho_ten"], list) else [nguoi["ho_ten"]]
    doc = _chaldea.luan_chaldea(ten, nguoi["ngay"], nguoi["thang"], nguoi["nam"])
    theo = {m["ma"]: m for m in doc["cac_so"]}
    thu_tu = (["ten_goi", "so_ten", "duong_doi"] if re.search(r"\bten\b", pl.get("cau_chuan_hoa", ""))
              else ["duong_doi", "ngay_sinh", "ten_goi"])
    moi = [{"loai": "chaldea", **{k: theo[ma][k] for k in ("ma", "ten", "kep", "goc", "nghia_goc", "nghia_kep")},
            "source_id": doc["source_id"], "school_id": doc["school_id"], "trang_thai": doc["trang_thai"]}
           for ma in thu_tu]
    return {**goi, "muc": moi, "so_trong_goi": sorted({x["goc"] for x in moi} | {x["kep"] for x in moi if x["kep"]})}


def tra_loi(cau_hoi: str, nguoi: dict, nguoi_kia: dict | None = None,
            ngay_xem: dt.date | None = None, dung_llm: bool = True, phai: str = "pitago") -> dict:
    ngay_xem = ngay_xem or dt.date.today()
    pl = hoi.phan_loai(cau_hoi)
    goi = hoi.goi_bang_chung(pl, nguoi, nguoi_kia, ngay_xem)
    if phai == "chaldea":
        goi = _goi_chaldea(goi, pl, nguoi)
    else:
        # TS-NOIDAU: câu bấm từ bảng → đúng chỉ số của thẻ (thẻ tính theo Pitago; phái Chaldea giữ lời đáp số Chaldea).
        goi = noi_dau.bo_sung_goi(goi, cau_hoi, nguoi, ngay_xem)
    template = van_template(goi)
    co_key = bool(os.environ.get("OPENROUTER_API_KEY"))
    che_do, van, loi = "template", template, []
    if dung_llm and co_key and goi["muc"] and not goi["can_them"]:
        try:
            van_llm = _goi_llm(goi, cau_hoi)
            loi = kiem_tra_dau_ra(van_llm, goi)
            che_do, van = ("llm", van_llm) if not loi else ("template_fallback", template)
        except Exception as e:  # noqa: BLE001 — LLM lỗi không được làm sập Q&A
            che_do, loi = "template_fallback", [f"llm lỗi: {str(e)[:120]}"]
    dac_biet = pl["xu_ly"] in ("an_toan", "tu_choi_nhe") or bool(goi["can_them"])
    return {
        "phai": phai,
        "phan_loai": goi["phan_loai"],
        "bang_chung": goi,
        "cau_tra_loi": van,
        "che_do": che_do,
        "da_bat_llm": che_do == "llm",
        "loi_kiem_tra": loi,
        "can_them": goi["can_them"],
        "do_phu": "day_du" if (goi["muc"] or dac_biet) else "khong",
    }
