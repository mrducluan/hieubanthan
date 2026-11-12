# -*- coding: utf-8 -*-
"""KB-TT1 — "ý chính" cho ảnh tóm tắt (route web `/og/y-chinh`) của trang kiến thức CHƯA có `y_chinh` trong KB bổ sung.

Họ trang có `bo_sung_<loai>.json` (SEO-M) tự viết `y_chinh`. Họ còn lại (mệnh theo năm, sao ở cung, quẻ, sao, cung, bộ vị)
nhận ý chính **rút nguyên từ chính nội dung trang** (tiêu đề, câu trả lời nhanh, mục, danh sách) — không thêm dữ kiện mới,
nên không thể mâu thuẫn với trang. Tất định, không LLM. 3–5 ý, mỗi ý ≤ 90 ký tự; không đủ ý → không có ảnh (trả None).
Chỉ chữ Việt (ảnh `/og/y-chinh` chỉ vẽ chữ Việt).
"""
from __future__ import annotations

import re

TOI_DA = 90


def _cat(s: str, n: int = TOI_DA - 2) -> str:
    """Rút gọn ≤ n ký tự: ưu tiên câu đầu, rồi cắt ở dấu phẩy / chấm phẩy / khoảng trắng gần nhất."""
    s = re.sub(r"\s+", " ", s or "").strip()
    if not s:
        return ""
    dau = re.split(r"(?<=[.!?])\s", s, maxsplit=1)[0].rstrip(".")
    if len(dau) <= n:
        return dau
    for ky_tu in (";", ",", " — ", " "):
        i = dau.rfind(ky_tu, 0, n)
        if i >= n // 2:
            return dau[:i].rstrip(" ,;—") + "…"
    return dau[: n - 1] + "…"


def _muc(t: dict, *dau: str) -> dict | None:
    for m in t["muc"]:
        if m["tieu_de"].lower().startswith(tuple(d.lower() for d in dau)):
            return m
    return None


def _doan(t: dict, *dau: str) -> str:
    m = _muc(t, *dau)
    return (m or {}).get("doan") or ""


def _ds(t: dict, *dau: str) -> list[str]:
    return list((_muc(t, *dau) or {}).get("danh_sach") or [])


def _sau(s: str, moc: str) -> str:
    return s.split(moc, 1)[1].strip() if moc in s else s


def _menh_nam(t: dict) -> list[str]:
    nam = re.search(r"năm (\d{4})", t["tieu_de"])
    ra = []
    if nam and "? " in t["tieu_de"]:
        ra.append(f"Sinh {nam.group(1)}: {t['tieu_de'].split('? ', 1)[1].replace('Tuổi ', 'tuổi ', 1)}")
    if ds := _doan(t, "Mệnh "):
        ra.append(_cat(ds.split(" Nạp âm")[0]))
    hop = [x for x in _ds(t, "Tuổi hợp") if x.startswith(("Tam hợp", "Lục xung"))]
    if len(hop) == 2:
        ra.append(_cat(f"{hop[0].rstrip('.')} · {hop[1].rstrip('.').replace('Lục xung', 'xung')}"))
    phi = []
    for x in _ds(t, "Cung phi"):
        m = re.match(r"(Nam|Nữ) \d{4}: cung ([^(;]+?)(?: \([^)]*\))?, hướng tốt nhất ([^;]+);", x)
        if m:
            phi.append(f"{m.group(1)} cung {m.group(2)} – {m.group(3)}")
    if phi:
        ra.append(_cat(" · ".join(phi)))
    tet = re.search(r"(Sinh trước Tết[^.]*)\.", t["tra_loi_nhanh"])
    if tet:
        ra.append(_cat(tet.group(1)))
    return ra


def _que(t: dict) -> list[str]:
    ra = [_cat(t["tieu_de"].split(" — ")[0])]
    for dau, tien_to in (("Hiểu đơn giản", "Hiểu đơn giản: "), ("Lời khuyên", "Nên: "), ("Mặt tối", "Dễ vấp: ")):
        d = _doan(t, dau)
        if d:
            ra.append(tien_to + _cat(_sau(d, "Hiểu đơn giản:"), TOI_DA - 2 - len(tien_to)))
    if tu := _doan(t, "Câu hỏi tự soi"):
        ra.append(_cat(tu))
    return ra


def _sao(t: dict) -> list[str]:
    ra = []
    nhanh = _sau(t["tra_loi_nhanh"], ". ") if t["tra_loi_nhanh"].count(". ") else t["tra_loi_nhanh"]
    ra.append(_cat(nhanh))
    for dau, tien_to in (("Điểm mạnh", "Mạnh: "), ("Mặt tối", "Dễ vấp: ")):
        d = _doan(t, dau)
        if d:
            ra.append(tien_to + _cat(d, TOI_DA - 2 - len(tien_to)))
    sang = [x.split(" (")[0] for x in _all_ds(t) if re.search(r"\((Miếu|Vượng)\)", x)]
    sang = list(dict.fromkeys(sang))
    if sang:
        ra.append(_cat("Sáng nhất (Miếu/Vượng) khi ở chi: " + ", ".join(sang)))
    if tu := _doan(t, "Câu hỏi tự soi"):
        ra.append(_cat(tu))
    return ra


def _all_ds(t: dict) -> list[str]:
    return [x for m in t["muc"] if "chi" in m["tieu_de"].lower() for x in (m.get("danh_sach") or [])]


def _cung(t: dict) -> list[str]:
    ra = [_cat(t["tieu_de"].split(" — ")[0])]
    for dau, tien_to in (("Cung này cho thấy gì", "Cho thấy: "), ("Cung này không trả lời", "Không trả lời: ")):
        d = _doan(t, dau)
        if d:
            ra.append(tien_to + _cat(d, TOI_DA - 2 - len(tien_to)))
    if y := t["tra_loi_nhanh"].split(": ", 1):
        if len(y) == 2:
            ra.insert(1, _cat(y[1]))
    if tu := _doan(t, "Câu hỏi tự soi"):
        ra.append(_cat(tu))
    return ra


def _sao_cung(t: dict) -> list[str]:
    ra = []
    nghia = re.match(r"Trong Tử vi, (.+? ở cung .+?): (.+)", t["tra_loi_nhanh"])
    if nghia:
        ra.append(_cat(f"{nghia.group(1)}: {nghia.group(2)}"))
    sang = _doan(t, "Khi ")
    m = re.search(r"khi (cung \S+(?: \S+)?) rơi vào ([^.]+)\.", sang)
    if m:
        ra.append(_cat(f"Sáng khi {m.group(1)} ở: {m.group(2)}"))
    cung = _doan(t, "Tử Vi đi cùng", "Tuỳ chi", "Sao đi cùng") or next(
        (m["doan"] for m in t["muc"] if "đi cùng" in m["tieu_de"].lower() and m.get("doan")), "")
    if cung:
        ra.append(_cat(re.sub(r"^Tuỳ chi cung .+? rơi vào, ", "", cung)))
    tam = next((m["doan"] for m in t["muc"] if m["tieu_de"].lower().startswith("tam phương") and m.get("doan")), "")
    if tam and (m := re.search(r"cung xung chiếu (.+?) và hai cung tam hợp (.+?)\.", tam)):
        ra.append(_cat(f"Xét cùng xung chiếu {m.group(1)} và tam hợp {m.group(2)}"))
    if tu := _doan(t, "Câu hỏi tự soi"):
        ra.append(_cat(tu))
    return ra


def _bo_vi(t: dict) -> list[str]:
    cau = [c for c in re.split(r"(?<=[.!?])\s", t["tra_loi_nhanh"]) if c]
    ra = [_cat(c) for c in cau[:2]]
    if (ban := _muc(t, "Tuổi nào")) and (m := re.search(r"ứng với tuổi ([\d, và]+)", ban.get("doan") or "")):
        ra.append(f"Lưu niên: ứng với tuổi {m.group(1).strip(' .,')} (tuổi mụ)")
    if len(cau) > 2:
        ra.append(_cat(cau[2]))
    return ra


_DUNG = {"menh_nam": _menh_nam, "que": _que, "sao": _sao, "cung": _cung, "sao_cung": _sao_cung, "bo_vi": _bo_vi}


def tao(t: dict) -> list[str] | None:
    """3–5 ý chính (≤ 90 ký tự) rút từ nội dung trang; không đủ → None."""
    f = _DUNG.get(t.get("loai"))
    if not f:
        return None
    ra = [y for y in dict.fromkeys(f(t)) if y and len(y) <= TOI_DA]
    return ra[:5] if len(ra) >= 3 else None
