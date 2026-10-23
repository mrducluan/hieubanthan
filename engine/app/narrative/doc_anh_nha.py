# -*- coding: utf-8 -*-
"""PT-V2 — "máy đọc ảnh nhà": lớp TRI NHẬN ở tầng NARRATIVE (chủ dự án duyệt gửi ảnh ra dịch vụ AI bên thứ ba, 2026-10-23).

Mô hình thị giác (OpenRouter) CHỈ gắn nhãn điều NHÌN THẤY trong ảnh theo đúng danh mục dấu hiệu khảo sát
(`phongthuy_bo_cuc.DAU_HIEU`) và phòng (`TEN_PHONG`) — KHÔNG luận tốt xấu, KHÔNG nói phong thuỷ. Mọi nhãn trả về đều
`can_xac_nhan`: người dùng bấm Đúng / Không rồi web mới gửi vào bố cục dạng `nguon: anh, xac_nhan: true`; dấu hiệu nguồn
ảnh chưa xác nhận không bao giờ được luận (luật `_nhan` ở tầng RULES).

Riêng tư: ảnh chỉ đi qua lượt gọi — không ghi đĩa, không log, không vào Sentry; log chỉ ghi LOẠI lỗi. Hậu xử lý tất định
(bỏ mã lạ, kẹp độ tin, lọc lý do). Không trả tên mô hình / nhà cung cấp ra ngoài (BM-1).
Env: OPENROUTER_API_KEY (chung với lớp AI) · DOC_ANH_MODEL (mặc định `DEFAULT_MODEL`).
"""
from __future__ import annotations

import json
import logging
import os
import re

import httpx

from app.luangiai.phongthuy_bo_cuc import DAU_HIEU, TEN_PHONG
from app.narrative import ngan_sach as _ngan_sach
from app.narrative.llm import OPENROUTER_URL

DEFAULT_MODEL = "google/gemini-2.5-flash"
LOAI_ANH = ("image/jpeg", "image/png", "image/webp")
TOI_DA_DAU_HIEU, TOI_DA_PHONG, TOI_DA_LUU_Y = 8, 3, 3
NGUONG_DO_TIN = 0.35
DAI_LY_DO, DAI_LUU_Y = 200, 160

_log = logging.getLogger("hbt.doc_anh")

_URL = re.compile(r"(?:https?://|www\.)\S+", re.I)
_SO_DIEN_THOAI = re.compile(r"(?<!\d)(?:\+?84|0)\d{8,10}(?!\d)")
_KHOI_JSON = re.compile(r"```(?:json)?\s*(\{.*\})\s*```", re.S)

_HE_THONG = """Bạn là người ghi nhận hình ảnh. Nhiệm vụ DUY NHẤT: nhìn ảnh chụp bên trong hoặc bên ngoài một ngôi nhà \
và cho biết dấu hiệu nào trong DANH MỤC dưới đây NHÌN THẤY ĐƯỢC trong ảnh, cùng loại phòng đang chụp.

QUY TẮC:
- CHỈ dùng đúng mã trong danh mục. Không tự đặt mã mới.
- CHỈ ghi điều nhìn thấy. Không suy đoán phần ngoài khung ảnh. Không phán tốt / xấu, không nhắc phong thuỷ, không khuyên.
- Mỗi dấu hiệu: "co" = true nếu thấy có, false nếu thấy RÕ là không có; không rõ thì bỏ qua. "do_tin" 0–1. \
"ly_do" là một câu ngắn tiếng Việt mô tả điều thấy trong ảnh (không link, không số điện thoại).
- Trả về JSON THUẦN theo đúng mẫu, không thêm chữ ngoài JSON:
{"dau_hieu":[{"ma":"...","co":true,"do_tin":0.0,"ly_do":"..."}],"phong":[{"phong":"...","do_tin":0.0}],"luu_y":["..."]}
- "luu_y": tối đa 3 câu ngắn về chất lượng ảnh (tối, mờ, chỉ thấy một phần) nếu cần, không thì để [].

DANH MỤC DẤU HIỆU (mã — câu hỏi tương ứng):
{dau_hieu}

DANH MỤC PHÒNG (mã — tên):
{phong}"""


def _he_thong() -> str:
    dh = "\n".join(f"- {ma} — {v['hoi']}" for ma, v in DAU_HIEU.items())
    ph = "\n".join(f"- {ma} — {ten}" for ma, ten in TEN_PHONG.items())
    return _HE_THONG.replace("{dau_hieu}", dh).replace("{phong}", ph)


def dung_prompt(yc: dict) -> list[dict]:
    """Messages dạng OpenAI vision: text gợi ý góc chụp / loại nhà / điều đang băn khoăn + từng ảnh dạng data URL."""
    goi_y = []
    if yc.get("goc"):
        goi_y.append(f"Góc chụp theo người gửi: {str(yc['goc'])[:60]}.")
    if yc.get("loai_nha"):
        goi_y.append(f"Loại nhà: {str(yc['loai_nha'])[:30]}.")
    if yc.get("y_dinh"):
        goi_y.append(f"Người gửi đang quan tâm chuyện: {str(yc['y_dinh'])[:30]} (chỉ để biết nên nhìn kỹ chỗ nào).")
    noi_dung: list[dict] = [{"type": "text", "text": " ".join(goi_y) + " Hãy ghi nhận dấu hiệu nhìn thấy trong các ảnh sau."}]
    for a in yc["anh"]:
        noi_dung.append({"type": "image_url", "image_url": {"url": f"data:{a['loai']};base64,{a['du_lieu']}"}})
    return [{"role": "system", "content": _he_thong()}, {"role": "user", "content": noi_dung}]


def _tat(ly_do: str | None) -> dict:
    return {"da_bat": ly_do is None, "ly_do_tat": ly_do, "dau_hieu": [], "phong_doan": [], "luu_y": [], "can_xac_nhan": True}


def _boc_json(van: str) -> dict:
    """JSON thuần → dict; nếu mô hình bọc trong ```json``` hay thêm chữ quanh thì bóc khối { … } ngoài cùng."""
    van = (van or "").strip()
    try:
        d = json.loads(van)
    except ValueError:
        m = _KHOI_JSON.search(van)
        if not m:
            dau, cuoi = van.find("{"), van.rfind("}")
            if dau < 0 or cuoi <= dau:
                raise ValueError("khong_co_json")
            van = van[dau:cuoi + 1]
        else:
            van = m.group(1)
        d = json.loads(van)
    if not isinstance(d, dict):
        raise ValueError("json_khong_phai_doi_tuong")
    return d


def _do_tin(x) -> float | None:
    try:
        v = float(x)
    except (TypeError, ValueError):
        return None
    if v != v:          # NaN
        return None
    return round(min(1.0, max(0.0, v)), 3)


def _co(x) -> bool:
    if isinstance(x, bool):
        return x
    if isinstance(x, (int, float)):
        return x > 0
    return str(x).strip().lower() in ("true", "yes", "co", "có", "1", "đúng", "dung")


def _loc_cau(x, dai: int) -> str:
    s = " ".join(str(x or "").split())
    s = _URL.sub("", s)
    s = _SO_DIEN_THOAI.sub("", s)
    s = " ".join(s.split())
    return s[:dai].rstrip()


def hau_xu_ly(tho: dict) -> dict:
    """Tất định: chỉ giữ mã / phòng có trong danh mục, kẹp độ tin 0..1, bỏ < NGUONG_DO_TIN, lọc lý do, sắp giảm, cắt số lượng.
    Mã trùng → giữ bản độ tin cao nhất. Khoá có mặt nhưng sai kiểu (không phải danh sách) → ValueError (mô hình không theo mẫu)."""
    for k in ("dau_hieu", "phong", "luu_y"):
        if tho.get(k) is not None and not isinstance(tho[k], list):
            raise ValueError(f"{k}_khong_phai_danh_sach")
    dh: dict[str, dict] = {}
    for x in tho.get("dau_hieu") or []:
        if not isinstance(x, dict) or x.get("ma") not in DAU_HIEU:
            continue
        tin = _do_tin(x.get("do_tin"))
        if tin is None or tin < NGUONG_DO_TIN:
            continue
        muc = {"ma": x["ma"], "co": _co(x.get("co")), "do_tin": tin, "ly_do": _loc_cau(x.get("ly_do"), DAI_LY_DO)}
        if x["ma"] not in dh or tin > dh[x["ma"]]["do_tin"]:
            dh[x["ma"]] = muc
    dau_hieu = sorted(dh.values(), key=lambda m: -m["do_tin"])[:TOI_DA_DAU_HIEU]

    ph: dict[str, float] = {}
    for x in tho.get("phong") or []:
        if not isinstance(x, dict) or x.get("phong") not in TEN_PHONG:
            continue
        tin = _do_tin(x.get("do_tin"))
        if tin is None or tin < NGUONG_DO_TIN:
            continue
        ph[x["phong"]] = max(tin, ph.get(x["phong"], 0.0))
    phong = [{"phong": p, "do_tin": t} for p, t in sorted(ph.items(), key=lambda kv: -kv[1])[:TOI_DA_PHONG]]

    luu_y = []
    for x in tho.get("luu_y") or []:
        s = _loc_cau(x, DAI_LUU_Y)
        if s:
            luu_y.append(s)
        if len(luu_y) >= TOI_DA_LUU_Y:
            break
    return {"da_bat": True, "ly_do_tat": None, "dau_hieu": dau_hieu, "phong_doan": phong, "luu_y": luu_y, "can_xac_nhan": True}


def doc_anh(yc: dict) -> dict:
    """`yc` = {"anh": [{"du_lieu": base64, "loai": image/...}], "goc"?, "loai_nha"?, "y_dinh"?} (đã kiểm ở route).
    Không khoá → tắt (chua_dat_khoa); hết lượt RL-1 → het_luot; lỗi mạng / JSON hỏng → loi_dich_vu. Không bao giờ ném."""
    key = os.environ.get("OPENROUTER_API_KEY")
    if not key:
        return _tat("chua_dat_khoa")
    try:
        _ngan_sach.kiem_luot()
    except _ngan_sach.HetLuot:
        return _tat("het_luot")
    model = os.environ.get("DOC_ANH_MODEL", DEFAULT_MODEL)
    try:
        with httpx.Client(timeout=45) as c:
            r = c.post(OPENROUTER_URL,
                       headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
                       json={"model": model, "temperature": 0.1, "response_format": {"type": "json_object"},
                             "messages": dung_prompt(yc)})
            r.raise_for_status()
            van = r.json()["choices"][0]["message"]["content"]
        return hau_xu_ly(_boc_json(van))
    except Exception as e:  # noqa: BLE001 — chỉ ghi LOẠI lỗi; không log body, không log ảnh, không đẩy Sentry
        _log.warning("doc_anh_nha: loi_dich_vu (%s)", type(e).__name__)
        return _tat("loi_dich_vu")
