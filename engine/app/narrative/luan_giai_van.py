# -*- coding: utf-8 -*-
"""LG2 — Tầng NARRATIVE (4) cho "Luận giải toàn bộ": LLM viết lại TỪNG CHƯƠNG thành bài liền mạch.

Đầu vào của LLM chỉ là tiêu đề chương + các đoạn RULES đã ghép từ KB (không có ngày sinh, không có lá số
thô). Mỗi chương qua `kiem_tra_chuong`: con số, tên sao / cung / thập thần / tứ hoá phải có trong đoạn
gốc; cấm giọng phán quyết. Vi phạm hoặc LLM lỗi → chương đó giữ bản mẫu (`template_fallback`).
Bản gốc (`doan`) luôn đi kèm để người dùng đối chiếu. Không lưu gì.
LG-ĐS: LLM chỉ viết lại `doan` (thân bài); `hop`, `can_cu`, `cot_loi` giữ nguyên bản RULES. Cụm cấm KB `cum_cam`
(giọng AI, doạ) chặn ở `kiem_tra_chuong` → chương đó rơi về bản mẫu.
"""
from __future__ import annotations

import contextvars
import json
import os
import re
from concurrent.futures import ThreadPoolExecutor

import httpx

from app.kb import tuvi_kb
from app.narrative import hoi_van
from app.narrative.ngan_sach import mo_ta_loi
from app.narrative import llm as _llm
from app.narrative import ngan_sach as _ngan_sach

THAP_THAN = ["Tỷ Kiên", "Kiếp Tài", "Thực Thần", "Thương Quan", "Thiên Tài", "Chính Tài", "Thất Sát",
             "Chính Quan", "Thiên Ấn", "Chính Ấn"]
TU_HOA = ["Hoá Lộc", "Hoá Quyền", "Hoá Khoa", "Hoá Kỵ"]


def _thuat_ngu() -> list[str]:
    kb = tuvi_kb._d()
    ds = set(kb["chinh_tinh"]) | set(kb["phu_tinh"]) | {c for c in kb["cung"] if c != "Mệnh"}
    return sorted(ds | set(THAP_THAN) | set(TU_HOA), key=len, reverse=True)


_SYSTEM = """Bạn là biên tập viên, KHÔNG phải thầy bói. Bạn nhận MỘT CHƯƠNG của bản luận giải {mo_dun}: \
tiêu đề và các đoạn thân bài (`doan`) đã được hệ thống chọn từ kho tri thức. Chỉ viết lại PHẦN THÂN BÀI đó thành \
bài liền mạch, 6–12 câu, chia 2–4 đoạn. Các hộp nổi bật và phần "Vì sao nói vậy" do hệ thống giữ riêng — bạn không \
viết, không nhắc tới chúng.

GIỌNG VĂN: nói chuyện đời thường như một người bạn hiểu chuyện; câu ngắn; xưng "bạn"; ví dụ đời thường nếu đoạn gốc \
có. Không dùng thuật ngữ chuyên môn nếu đoạn gốc không có.

RÀNG BUỘC TUYỆT ĐỐI:
- CHỈ dùng ý có trong các đoạn được cho. Không thêm con số, năm, tuổi, tên sao, tên cung, thập thần, sự \
kiện, dự đoán hay lời khuyên nào không có trong đó.
- Giữ cả mặt sáng lẫn MẶT TỐI / lưu ý nếu đoạn gốc có; mỗi lưu ý giữ kèm hướng xử lý của nó; giữ câu tự soi nếu có.
- Không giọng phán quyết: cấm "bạn sẽ", "chắc chắn", "định mệnh", "số phận đã".
- KHÔNG dùng các cụm sau (giọng sáo rỗng / doạ): {cum_cam}.
- Không chào hỏi, không tiêu đề, không kết luận chung chung ngoài đoạn gốc."""


def _cum_cam() -> list[str]:
    from app.kb import tuvi_doi_song_kb
    return tuvi_doi_song_kb.cum_cam()


def kiem_tra_chuong(van: str, nguon: str) -> list[str]:
    """Danh sách vi phạm của bản LLM so với văn bản nguồn của chương."""
    loi: list[str] = []
    so_nguon = set(re.findall(r"\d+", nguon))
    for n in re.findall(r"\d+", van):
        if n not in so_nguon:
            loi.append(f"số lạ: {n}")
    con_lai = van
    for t in _thuat_ngu():                       # dài trước để "Thiên Phủ" không bị đếm thành "Thiên"
        if t in con_lai:
            if t not in nguon:
                loi.append(f"thuật ngữ lạ: {t}")
            con_lai = con_lai.replace(t, " ")
    thap, goc = van.lower(), nguon.lower()
    for c in hoi_van.CAM:
        if c in thap and c not in goc:
            loi.append(f"cụm cấm: {c}")
    # LG-ĐS: cụm "giọng AI" / doạ của KB — so theo ranh giới âm tiết ("khắc" không bắt "khắc phục").
    from app.kb import tuvi_doi_song_kb
    ds = [c for c in _cum_cam() if f"cụm cấm: {c}" not in loi]
    co_goc = set(tuvi_doi_song_kb.tim_cum_cam(nguon, ds))
    for c in tuvi_doi_song_kb.tim_cum_cam(van, ds):
        if c not in co_goc:
            loi.append(f"cụm cấm: {c}")
    return loi


def _goi_llm(tieu_de: str, doan: list[str], mo_dun: str) -> str:
    _ngan_sach.kiem_luot()   # RL-1: mỗi chương một lượt
    key = os.environ.get("OPENROUTER_API_KEY")
    model = os.environ.get("OPENROUTER_MODEL", _llm.DEFAULT_MODEL)
    ten = {"tuvi": "Tử vi", "battu": "Bát tự"}.get(mo_dun, mo_dun)
    with httpx.Client(timeout=40) as c:
        r = c.post(_llm.OPENROUTER_URL,
                   headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
                   json={"model": model, "temperature": 0.4, "messages": [
                       {"role": "system", "content": _SYSTEM.format(mo_dun=ten, cum_cam="; ".join(f'"{c}"' for c in _cum_cam()))},
                       {"role": "user", "content": json.dumps({"chuong": tieu_de, "doan": doan}, ensure_ascii=False)}]})
        r.raise_for_status()
        return r.json()["choices"][0]["message"]["content"].strip()


def _mot_chuong(c: dict, mo_dun: str) -> dict:
    if not c["doan"]:
        return {**c, "che_do": "template"}
    try:
        van = _goi_llm(c["tieu_de"], c["doan"], mo_dun)
        loi = kiem_tra_chuong(van, "\n".join([c["tieu_de"], *c["doan"]]))
    except Exception as e:  # noqa: BLE001 — LLM lỗi không được làm sập báo cáo
        return {**c, "che_do": "template_fallback", "loi_kiem_tra": [f"llm lỗi: {mo_ta_loi(e)}"]}
    if loi:
        return {**c, "che_do": "template_fallback", "loi_kiem_tra": loi}
    return {**c, "che_do": "llm", "van_ai": van}


def gan_thuat_ngu(bc: dict) -> dict:
    """GN: mỗi chương kèm thuật ngữ (tra từ điển KB) có trong đoạn gốc + bản AI — để web giải nghĩa."""
    from app.kb import tu_dien
    # LG-ĐS: thuật ngữ nằm ở "Vì sao nói vậy" (`can_cu`) → nhận diện cả ở đó để web giải nghĩa.
    return {**bc, "chuong": [{**c, "thuat_ngu": tu_dien.nhan_dien("\n".join([*c["doan"], *c.get("can_cu", []),
                                                                             c.get("van_ai", "")]), bc["mo_dun"])}
                             for c in bc["chuong"]]}


def dien_dat(bc: dict, dung_llm: bool = True, toi_da: int | None = None) -> dict:
    """Thêm `van_ai` cho từng chương khi có khoá LLM; `dien_dat` = "ai" | "tron" | "mau".

    `toi_da` (SAO-2): chỉ diễn đạt N chương đầu — bản xem trước khi đang thu Sao, chương bị khoá không tốn lượt AI
    (đánh dấu `che_do = "chua_dien_dat"`, giữ nguyên đoạn gốc)."""
    if not (dung_llm and os.environ.get("OPENROUTER_API_KEY")):
        return {**bc, "dien_dat": "mau"}
    n = len(bc["chuong"]) if toi_da is None else max(0, min(toi_da, len(bc["chuong"])))
    dau, sau = bc["chuong"][:n], bc["chuong"][n:]
    with ThreadPoolExecutor(max_workers=8) as ex:
        # Luồng phụ không tự mang ngữ cảnh (người gọi cho hạn mức RL-1) → chép ngữ cảnh của request sang.
        ctx = [contextvars.copy_context() for _ in dau]
        chuong = list(ex.map(lambda p: p[0].run(_mot_chuong, p[1], bc["mo_dun"]), zip(ctx, dau)))
    so_ai = sum(c["che_do"] == "llm" for c in chuong)
    return {**bc, "chuong": chuong + [{**c, "che_do": "chua_dien_dat"} for c in sau],
            "dien_dat": "ai" if chuong and so_ai == len(chuong) else "tron" if so_ai else "mau"}
