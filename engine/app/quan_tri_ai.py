# -*- coding: utf-8 -*-
"""QT-3 — trợ lý AI cho trang quản trị (docs/KIEN-TRUC-QUAN-TRI.md, "Luật cho lớp AI trong quản trị").

AI là CÔNG CỤ BIÊN TẬP, không phải tầng sinh dữ kiện:
  - chỉ soạn NHÁP cho MỘT giá trị chuỗi đã có trong kho tri thức; người quản trị đọc, sửa, rồi mới Xuất bản (= mở PR,
    CI kiểm, chủ dự án merge). Không chạm CALC, không tự ghi file, không tự xuất bản.
  - nháp luôn đi kèm KIỂM ĐỊNH bằng luật cố định (không cần AI): giọng phán, vùng cấm (bệnh tật/sống chết, vật phẩm,
    giải hạn, lô đề), liên hệ ra ngoài, con số không có trong bản gốc (nghi bịa dữ kiện), độ dài đổi mạnh.
  - hạn mức lượt AI quản trị RIÊNG (env LLM_QT_LUOT_NGAY, mặc định 200/ngày) — không ăn lượt của người dùng.
  - model: OPENROUTER_MODEL_QUAN_TRI → OPENROUTER_MODEL → mặc định lớp narrative.
Engine không lưu gì: không nhật ký nội dung, không biết ai gọi (web ghi nhật ký quản trị ở Supabase).
"""
from __future__ import annotations

import json
import os
import re

import httpx

from app.kb.tham_dinh import _CAM_GOC_NHIN, _DAU, _LIEN_HE
from app.narrative import llm as _llm
from app.narrative import ngan_sach
from app.narrative.hoi_van import CAM as _CAM_PHAN

HANH_DONG = {
    "viet_lai": "Viết lại cho mạch lạc, tự nhiên hơn, GIỮ NGUYÊN mọi ý và thuật ngữ.",
    "mo_rong": "Viết sâu hơn (tối đa gấp đôi độ dài), chỉ triển khai những ý đã có hoặc hiển nhiên từ ngữ cảnh; "
               "nếu đoạn nói về tính cách/vận thì có cả mặt sáng và mặt tối.",
    "rut_gon": "Rút gọn còn khoảng một nửa, giữ ý chính và thuật ngữ.",
    "soat_loi": "Chỉ sửa chính tả, dấu câu, lặp từ. KHÔNG đổi ý, không thêm câu.",
    "doi_thuong": "Diễn đạt lại bằng lời đời thường cho người không biết thuật ngữ, giữ thuật ngữ gốc một lần trong ngoặc.",
}

_SYSTEM = """Bạn là biên tập viên kho tri thức của trang văn hoá tham khảo Hiểu Bản Thân (thần số học, Tử vi, \
Kinh Dịch, Bát tự, Phong thuỷ). Bạn KHÔNG phải thầy bói.

Bạn nhận MỘT đoạn văn đang có trong kho (kèm vị trí và vài trường lân cận làm ngữ cảnh) và một yêu cầu biên tập.
Trả về DUY NHẤT đoạn văn mới (tiếng Việt), không lời dẫn, không markdown, không ngoặc kép bao quanh.

RÀNG BUỘC TUYỆT ĐỐI:
- Không thêm dữ kiện mới: không con số, năm, tên sách, trích dẫn cổ thư, tên người, nguồn nào không có trong \
đoạn gốc hoặc ngữ cảnh. Không chắc thì bỏ, không bịa.
- Giọng tham khảo ("thường được mô tả là", "theo cổ thư"), không phán ("bạn sẽ", "chắc chắn", "định mệnh").
- Không nói về bệnh tật, sống chết, tai nạn; không khuyên mua vật phẩm, cúng, giải hạn, hoá giải; không lô đề, \
xổ số; không link, số điện thoại.
- Giữ thuật ngữ chuyên môn đúng như gốc (tên sao, cung, quẻ, can chi, số).
- Nếu đoạn gốc có mặt tối hoặc câu tự soi thì giữ lại."""

_SO = re.compile(r"\d+")
_CAM_VUNG = [c for c in _CAM_GOC_NHIN if c not in _CAM_PHAN] + ["sẽ chết", "chết sớm", "tai nạn", "xổ số"]


def _bo_dau(s: str) -> str:
    return s.lower().translate(_DAU)


def kiem_dinh(van: str, goc: str | None = None) -> list[dict]:
    """Cảnh báo cho một đoạn văn (rỗng = không thấy vấn đề). Luật cố định, không gọi AI."""
    ra: list[dict] = []
    s = (van or "").strip()
    if not s:
        return [{"ma": "rong", "noi_dung": "Đoạn văn trống."}]
    thap = _bo_dau(s)
    goc_thap = _bo_dau(goc or "")
    phan = [c for c in _CAM_PHAN if _bo_dau(c) in thap and _bo_dau(c) not in goc_thap]
    if phan:
        ra.append({"ma": "giong_phan", "noi_dung": "Giọng phán quyết: " + ", ".join(f'"{c}"' for c in phan)})
    vung = [c for c in _CAM_VUNG if _bo_dau(c) in thap and _bo_dau(c) not in goc_thap]
    if vung:
        ra.append({"ma": "vung_cam", "noi_dung": "Ngoài ranh giới nội dung: " + ", ".join(f'"{c}"' for c in vung)})
    if _LIEN_HE.search(s):
        ra.append({"ma": "lien_he", "noi_dung": "Có link, số điện thoại hoặc thông tin liên hệ."})
    if goc is not None:
        la = sorted(set(_SO.findall(s)) - set(_SO.findall(goc)), key=lambda x: (len(x), x))
        if la:
            ra.append({"ma": "so_la", "noi_dung": "Con số không có trong bản gốc (kiểm có bịa dữ kiện không): "
                                                  + ", ".join(la[:8])})
        n0, n1 = len(goc.strip()), len(s)
        if n0 >= 40 and (n1 > 2.5 * n0 or n1 < 0.3 * n0):
            ra.append({"ma": "do_dai", "noi_dung": f"Độ dài đổi mạnh: {n0} → {n1} ký tự."})
    return ra


def _so_env(ten: str, mac_dinh: int) -> int:
    try:
        return int(os.environ.get(ten, "") or mac_dinh)
    except ValueError:
        return mac_dinh


_ngan_sach = ngan_sach.NganSach(gio_nguoi=10**6, gio_tong=_so_env("LLM_QT_LUOT_GIO", 60),
                                ngay_tong=_so_env("LLM_QT_LUOT_NGAY", 200))


def _goi_llm(messages: list[dict], nhiet_do: float) -> str:
    key = os.environ["OPENROUTER_API_KEY"]
    model = os.environ.get("OPENROUTER_MODEL_QUAN_TRI") or os.environ.get("OPENROUTER_MODEL", _llm.DEFAULT_MODEL)
    with httpx.Client(timeout=60) as c:
        r = c.post(_llm.OPENROUTER_URL,
                   headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
                   json={"model": model, "temperature": nhiet_do, "messages": messages})
        r.raise_for_status()
        return r.json()["choices"][0]["message"]["content"]


def _gon(s: str) -> str:
    s = s.strip()
    if len(s) >= 2 and s[0] == s[-1] and s[0] in "\"'“”":
        s = s[1:-1].strip()
    return s


def soan_nhap(*, tep: str, duong: list, hien_tai: str, hanh_dong: str, yeu_cau: str = "",
              ngu_canh: dict | None = None) -> dict:
    """Soạn nháp cho một giá trị chuỗi. Không key / hết lượt / lỗi mạng → nhap=None kèm lý do (không bịa)."""
    if hanh_dong not in HANH_DONG:
        raise ValueError(f"hanh_dong không hợp lệ: {hanh_dong}")
    if not os.environ.get("OPENROUTER_API_KEY"):
        return {"da_bat_llm": False, "nhap": None, "kiem_dinh": [],
                "loi": "Chưa bật lớp AI trên engine (thiếu OPENROUTER_API_KEY)."}
    ly_do = _ngan_sach.xin(None)
    if ly_do:
        return {"da_bat_llm": True, "nhap": None, "kiem_dinh": [], "loi": f"Đã hết lượt AI quản trị ({ly_do})."}
    vao = {
        "tep": tep, "vi_tri": ".".join(str(x) for x in duong), "doan_hien_tai": hien_tai,
        "ngu_canh_lan_can": ngu_canh or {},
    }
    noi = f"Yêu cầu: {HANH_DONG[hanh_dong]}"
    if yeu_cau.strip():
        noi += f"\nGhi chú thêm của biên tập viên: {yeu_cau.strip()}"
    messages = [{"role": "system", "content": _SYSTEM},
                {"role": "user", "content": noi + "\n\nDữ liệu (JSON):\n" + json.dumps(vao, ensure_ascii=False)}]
    try:
        nhap = _gon(_goi_llm(messages, 0.2 if hanh_dong == "soat_loi" else 0.5))
    except Exception as e:  # noqa: BLE001 — lỗi mạng/model: báo ngắn, không lộ khoá
        return {"da_bat_llm": True, "nhap": None, "kiem_dinh": [], "loi": "AI chưa trả lời được: " + type(e).__name__}
    return {"da_bat_llm": True, "nhap": nhap, "kiem_dinh": kiem_dinh(nhap, hien_tai)}
