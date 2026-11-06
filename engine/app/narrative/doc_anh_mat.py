# -*- coding: utf-8 -*-
"""NT-1 — "máy đọc ảnh gương mặt" (tuỳ chọn, MẶC ĐỊNH TẮT): lớp TRI NHẬN ở tầng NARRATIVE, cùng khuôn với `doc_anh_nha`.

Ảnh gương mặt là dữ liệu sinh trắc (nhạy cảm — Luật BVDLCN 91/2025). Vì vậy:
  * chỉ chạy khi người vận hành bật `NHAN_TUONG_DOC_ANH=1` (ngoài khoá OpenRouter) VÀ người dùng tự tích đồng ý ở từng lượt;
  * mô hình CHỈ chọn lựa chọn trong đúng bộ câu khảo sát của KB (không mô tả tự do, không luận, không nói đẹp xấu, không đoán
    tuổi / giới / sức khoẻ); mọi nhãn là GỢI Ý `can_xac_nhan` — người dùng bấm Đúng mới vào `tra_loi`;
  * ảnh không ghi đĩa, không log, không Sentry, không trả tên mô hình (BM-1). Hậu xử lý tất định.
"""
from __future__ import annotations

import json
import logging
import os

import httpx

from app.kb import nhan_tuong_kb as kb
from app.narrative import ngan_sach as _ngan_sach
from app.narrative.doc_anh_nha import _boc_json, _do_tin, _loc_cau
from app.narrative.llm import OPENROUTER_URL

DEFAULT_MODEL = "google/gemini-2.5-flash"
NGUONG_DO_TIN = 0.45
TOI_DA_LUU_Y = 3
_log = logging.getLogger("hbt.doc_anh_mat")

# Câu chỉ nhìn ảnh KHÔNG trả lời được (sờ, giọng, dáng, nhận xét người khác) — không đưa vào danh mục cho mô hình.
KHONG_TU_ANH = {"cot_nhuc", "cham_cot", "giong", "net_mat", "dang", "ham"}

_HE_THONG = """Bạn là người ghi nhận hình ảnh. Nhiệm vụ DUY NHẤT: nhìn ảnh chân dung MỘT người (người đó tự gửi ảnh của chính mình) \
và với mỗi câu trong DANH MỤC, chọn MỘT mã lựa chọn mô tả đúng nhất điều nhìn thấy, kèm độ tin 0–1. Câu không thấy rõ thì bỏ qua.

QUY TẮC:
- CHỈ dùng đúng mã câu và mã lựa chọn trong danh mục. Không mô tả tự do, không nhận xét đẹp / xấu, không đoán tuổi, giới tính, \
cảm xúc, sức khoẻ, không nói tướng số, không khuyên.
- Trả về JSON THUẦN: {"tra_loi":[{"cau":"<mã câu>","lua_chon":"<mã lựa chọn>","do_tin":0.0}],"luu_y":["..."]}
- "luu_y": tối đa 3 câu ngắn về chất lượng ảnh (tối, nghiêng, che mặt, có nhiều người) nếu cần, không thì [].

DANH MỤC (mã câu — câu hỏi — các mã lựa chọn: nhãn):
{danh_muc}"""


def danh_muc() -> list[dict]:
    return [c for c in kb.cau_hoi() if c["ma"] not in KHONG_TU_ANH]


def _he_thong() -> str:
    dong = []
    for c in danh_muc():
        lc = "; ".join(f"{l['ma']}: {l['nhan']}" for l in c["lua_chon"] if l["ma"] != "khong_chac")
        dong.append(f"- {c['ma']} — {c['hoi']} — {lc}")
    return _HE_THONG.replace("{danh_muc}", "\n".join(dong))


def dung_prompt(yc: dict) -> list[dict]:
    noi_dung: list[dict] = [{"type": "text", "text": "Ảnh chân dung người gửi (chính họ). Hãy chọn lựa chọn cho các câu nhìn thấy được."}]
    for a in yc["anh"]:
        noi_dung.append({"type": "image_url", "image_url": {"url": f"data:{a['loai']};base64,{a['du_lieu']}"}})
    return [{"role": "system", "content": _he_thong()}, {"role": "user", "content": noi_dung}]


def _tat(ly_do: str | None) -> dict:
    return {"da_bat": ly_do is None, "ly_do_tat": ly_do, "tra_loi": [], "luu_y": [], "can_xac_nhan": True}


def da_bat() -> bool:
    return os.environ.get("NHAN_TUONG_DOC_ANH") == "1" and bool(os.environ.get("OPENROUTER_API_KEY"))


def hau_xu_ly(tho: dict) -> dict:
    """Tất định: chỉ giữ (câu, lựa chọn) có trong danh mục cho ảnh, bỏ `khong_chac`, kẹp độ tin, mỗi câu giữ bản tin nhất."""
    if tho.get("tra_loi") is not None and not isinstance(tho["tra_loi"], list):
        raise ValueError("tra_loi_khong_phai_danh_sach")
    dm = {c["ma"]: {l["ma"] for l in c["lua_chon"] if l["ma"] != "khong_chac"} for c in danh_muc()}
    ra: dict[str, dict] = {}
    for x in tho.get("tra_loi") or []:
        if not isinstance(x, dict):
            continue
        q, a = x.get("cau"), x.get("lua_chon")
        if q not in dm or a not in dm[q]:
            continue
        tin = _do_tin(x.get("do_tin"))
        if tin is None or tin < NGUONG_DO_TIN:
            continue
        if q not in ra or tin > ra[q]["do_tin"]:
            ra[q] = {"cau": q, "lua_chon": a, "do_tin": tin}
    luu_y = []
    for x in tho.get("luu_y") or []:
        s = _loc_cau(x, 160)
        if s:
            luu_y.append(s)
        if len(luu_y) >= TOI_DA_LUU_Y:
            break
    return {"da_bat": True, "ly_do_tat": None, "tra_loi": sorted(ra.values(), key=lambda m: -m["do_tin"]), "luu_y": luu_y, "can_xac_nhan": True}


def doc_anh(yc: dict) -> dict:
    """`yc` = {"anh": [{"du_lieu": base64, "loai": image/...}]}. Chưa bật / chưa khoá → `chua_bat`; hết lượt → `het_luot`;
    lỗi → `loi_dich_vu`. Không bao giờ ném; không log nội dung."""
    if not da_bat():
        return _tat("chua_bat")
    try:
        _ngan_sach.kiem_luot()
    except _ngan_sach.HetLuot:
        return _tat("het_luot")
    model = os.environ.get("DOC_ANH_MODEL", DEFAULT_MODEL)
    try:
        with httpx.Client(timeout=45) as c:
            r = c.post(OPENROUTER_URL, headers={"Authorization": f"Bearer {os.environ['OPENROUTER_API_KEY']}", "Content-Type": "application/json"},
                       json={"model": model, "temperature": 0.1, "max_tokens": 900, "response_format": {"type": "json_object"},
                             "messages": dung_prompt(yc)})
            r.raise_for_status()
            van = r.json()["choices"][0]["message"]["content"]
        return hau_xu_ly(_boc_json(van))
    except Exception as e:  # noqa: BLE001 — chỉ ghi LOẠI lỗi
        _log.warning("doc_anh_mat: loi_dich_vu (%s)", type(e).__name__)
        return _tat("loi_dich_vu")
