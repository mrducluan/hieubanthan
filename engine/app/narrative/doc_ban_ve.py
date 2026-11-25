# -*- coding: utf-8 -*-
"""TY-2 đợt 4 — "máy đọc bản vẽ mặt bằng": lớp TRI NHẬN ở tầng NARRATIVE (cùng đường với PT-V2 `doc_anh_nha`).

Người dùng đặt ảnh bản vẽ làm nền sơ đồ "Đứng giữa nhà" rồi tự tích đồng ý gửi. Mô hình thị giác CHỈ chỉ ra CHỖ của các
mục trên bản vẽ (cửa chính, phòng ngủ chính, bếp, WC, bàn thờ, cầu thang, ban công) và đường bao ngôi nhà — toạ độ 0..1
theo ẢNH đã gửi. KHÔNG luận, KHÔNG nói phong thuỷ, KHÔNG suy hướng. Mọi chỗ đều `can_xac_nhan`: web vẽ thành chấm gợi ý,
người dùng bấm "Đúng" từng chỗ mới thành điểm trên sơ đồ; phép tính phương / Cửa – Chủ – Bếp vẫn là engine như cũ.

Riêng tư: như `doc_anh_nha` — ảnh chỉ đi qua lượt gọi, không ghi đĩa, không log, không Sentry; log chỉ LOẠI lỗi.
Hậu xử lý tất định (bỏ loại lạ, kẹp toạ độ, ngưỡng độ tin, mỗi loại một chỗ). Không trả tên mô hình (BM-1).
Env: OPENROUTER_API_KEY · DOC_BAN_VE_MODEL (→ DOC_ANH_MODEL → mặc định của `doc_anh_nha`).
"""
from __future__ import annotations

import logging
import os

import httpx

from app.narrative import doc_anh_nha as _da
from app.narrative import ngan_sach as _ngan_sach
from app.narrative.llm import OPENROUTER_URL

# Cùng danh mục chỗ của sơ đồ (`phongthuy_vi_tri.LOAI`) — test khoá hai bên khớp nhau.
LOAI = ("cua_chinh", "phong_ngu_chinh", "bep", "ve_sinh", "ban_tho", "cau_thang", "ban_cong")
_MO_TA = {
    "cua_chinh": "cửa chính đi vào nhà (cửa ngoài cùng ở mặt tiền, không phải cửa phòng)",
    "phong_ngu_chinh": "phòng ngủ chính (phòng ngủ lớn nhất) — lấy điểm giữa phòng",
    "bep": "bếp nấu (chỗ đặt bếp / bàn bếp) — lấy chỗ bếp, không phải bàn ăn",
    "ve_sinh": "nhà vệ sinh / phòng tắm — nếu nhiều, lấy cái lớn nhất hoặc gần giữa nhà nhất",
    "ban_tho": "bàn thờ / phòng thờ nếu bản vẽ có ghi",
    "cau_thang": "cầu thang",
    "ban_cong": "ban công, lô gia, hoặc sân / cửa sổ lớn ở mặt sau",
}
NGUONG_DO_TIN = 0.4
CO_KHUNG_TOI_THIEU = 0.15         # đường bao nhỏ hơn 15 % mỗi chiều coi như đọc sai, bỏ
TOKEN = 700

_log = logging.getLogger("hbt.doc_ban_ve")

_HE_THONG = """Bạn đọc bản vẽ mặt bằng một tầng nhà. Nhiệm vụ DUY NHẤT: chỉ ra VỊ TRÍ trên ảnh của các mục trong \
DANH MỤC, và hình chữ nhật bao quanh phần nhà (tường ngoài).

QUY TẮC:
- Toạ độ là phần của ẢNH: x từ 0 (mép trái) tới 1 (mép phải), y từ 0 (mép trên) tới 1 (mép dưới).
- CHỈ dùng đúng mã trong danh mục, mỗi mã nhiều nhất một chỗ. Không thấy rõ thì bỏ mã đó. Không đoán.
- "do_tin" 0–1. "ly_do": một câu ngắn tiếng Việt về điều thấy trên bản vẽ (vd "chữ BẾP trên bản vẽ"), không link, \
không số điện thoại.
- "khung": hình chữ nhật bao tường ngoài của nhà {"x0","y0","x1","y1"}; không rõ thì null.
- "la_ban_ve": false nếu ảnh không phải bản vẽ mặt bằng (ảnh chụp phòng, ảnh người…) — khi đó "cho" để [].
- Không phán tốt / xấu, không nhắc phong thuỷ, không khuyên.
- Trả về JSON THUẦN, không thêm chữ ngoài JSON:
{"la_ban_ve":true,"khung":{"x0":0.0,"y0":0.0,"x1":1.0,"y1":1.0},\
"cho":[{"ma":"...","x":0.0,"y":0.0,"do_tin":0.0,"ly_do":"..."}],"luu_y":["..."]}
- "luu_y": tối đa 3 câu ngắn về chất lượng ảnh (mờ, nghiêng, thiếu phần) nếu cần, không thì [].

DANH MỤC (mã — là gì):
{danh_muc}"""


def _he_thong() -> str:
    return _HE_THONG.replace("{danh_muc}", "\n".join(f"- {m} — {_MO_TA[m]}" for m in LOAI))


def dung_prompt(yc: dict) -> list[dict]:
    goi_y = []
    if yc.get("loai_nha"):
        goi_y.append(f"Loại nhà: {str(yc['loai_nha'])[:30]}.")
    if yc.get("tang"):
        goi_y.append(f"Đây là tầng {int(yc['tang'])} (tầng 1 = tầng trệt).")
    a = yc["anh"]
    return [{"role": "system", "content": _he_thong()},
            {"role": "user", "content": [
                {"type": "text", "text": (" ".join(goi_y) + " Bản vẽ ngay bên dưới:").strip()},
                {"type": "image_url", "image_url": {"url": f"data:{a['loai']};base64,{a['du_lieu']}"}}]}]


def _tat(ly_do: str | None) -> dict:
    return {"da_bat": ly_do is None, "ly_do_tat": ly_do, "la_ban_ve": None, "khung": None, "cho": [], "luu_y": [],
            "can_xac_nhan": True}


def _so01(x) -> float | None:
    if isinstance(x, bool):
        return None
    try:
        v = float(x)
    except (TypeError, ValueError):
        return None
    if v != v or v < -0.05 or v > 1.05:       # NaN / ngoài ảnh hẳn → bỏ (sai số mép nhỏ thì kẹp)
        return None
    return round(min(1.0, max(0.0, v)), 4)


def _khung(x) -> dict | None:
    if not isinstance(x, dict):
        return None
    v = [_so01(x.get(k)) for k in ("x0", "y0", "x1", "y1")]
    if any(t is None for t in v):
        return None
    x0, y0, x1, y1 = v
    x0, x1 = min(x0, x1), max(x0, x1)
    y0, y1 = min(y0, y1), max(y0, y1)
    if x1 - x0 < CO_KHUNG_TOI_THIEU or y1 - y0 < CO_KHUNG_TOI_THIEU:
        return None
    return {"x0": x0, "y0": y0, "x1": x1, "y1": y1}


def hau_xu_ly(tho: dict) -> dict:
    """Tất định: chỉ giữ mã trong LOAI, toạ độ trong ảnh, độ tin ≥ ngưỡng; mỗi mã giữ chỗ tin nhất; sắp theo thứ tự LOAI.
    Mô hình nói không phải bản vẽ → không trả chỗ nào. Khoá sai kiểu → ValueError."""
    for k in ("cho", "luu_y"):
        if tho.get(k) is not None and not isinstance(tho[k], list):
            raise ValueError(f"{k}_khong_phai_danh_sach")
    la_ban_ve = tho.get("la_ban_ve")
    la_ban_ve = None if la_ban_ve is None else _da._co(la_ban_ve)
    cho: dict[str, dict] = {}
    if la_ban_ve is not False:
        for x in tho.get("cho") or []:
            if not isinstance(x, dict) or x.get("ma") not in LOAI:
                continue
            tin, px, py = _da._do_tin(x.get("do_tin")), _so01(x.get("x")), _so01(x.get("y"))
            if tin is None or tin < NGUONG_DO_TIN or px is None or py is None:
                continue
            if x["ma"] not in cho or tin > cho[x["ma"]]["do_tin"]:
                cho[x["ma"]] = {"ma": x["ma"], "x": px, "y": py, "do_tin": tin,
                                "ly_do": _da._loc_cau(x.get("ly_do"), _da.DAI_LY_DO)}
    luu_y = [s for s in (_da._loc_cau(x, _da.DAI_LUU_Y) for x in tho.get("luu_y") or []) if s][:_da.TOI_DA_LUU_Y]
    return {"da_bat": True, "ly_do_tat": None, "la_ban_ve": la_ban_ve,
            "khung": _khung(tho.get("khung")) if la_ban_ve is not False else None,
            "cho": [cho[m] for m in LOAI if m in cho], "luu_y": luu_y, "can_xac_nhan": True}


def doc_ban_ve(yc: dict) -> dict:
    """`yc` = {"anh": {"du_lieu", "loai"}, "loai_nha"?, "tang"?} (đã kiểm ở route). Không bao giờ ném."""
    key = os.environ.get("OPENROUTER_API_KEY")
    if not key:
        return _tat("chua_dat_khoa")
    try:
        _ngan_sach.kiem_luot()
    except _ngan_sach.HetLuot:
        return _tat("het_luot")
    model = os.environ.get("DOC_BAN_VE_MODEL") or os.environ.get("DOC_ANH_MODEL") or _da.DEFAULT_MODEL
    try:
        with httpx.Client(timeout=45) as c:
            r = c.post(OPENROUTER_URL,
                       headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
                       json={"model": model, "temperature": 0.1, "max_tokens": TOKEN,
                             "response_format": {"type": "json_object"}, "messages": dung_prompt(yc)})
            r.raise_for_status()
            van = r.json()["choices"][0]["message"]["content"]
        return hau_xu_ly(_da._boc_json(van))
    except Exception as e:  # noqa: BLE001 — chỉ ghi LOẠI lỗi; không log body / ảnh, không Sentry
        _log.warning("doc_ban_ve: loi_dich_vu (%s)", type(e).__name__)
        return _tat("loi_dich_vu")
