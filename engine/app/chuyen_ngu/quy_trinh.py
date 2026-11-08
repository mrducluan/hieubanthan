"""Quy trình chuyển ngữ Việt → Anh cho tệp KB / bảng chữ (QT-0, KE-HOACH-QUOC-TE mục 11).

Hai lượt AI (lúc SOẠN, không bao giờ lúc người dùng đọc): (1) chuyển ngữ cho người bản xứ theo bảng thuật ngữ + quy tắc
giọng; (2) "biên tập viên bản xứ" đọc lại cho tự nhiên, giữ nguyên dữ kiện. Sau đó bộ kiểm luật cố định (`kiem.kiem`):
chuỗi nào lỗi thì KHÔNG ghi (để trống, liệt kê trong `loi`) → người duyệt xử lý. Đầu ra là bản phủ `*.en.json` cùng khung
khoá với tệp gốc, chỉ chứa chuỗi đã dịch, gắn `_trang_thai: nhap_may` (người bản xứ duyệt → `da_duyet`).
"""
from __future__ import annotations

import json
from collections.abc import Callable, Iterator

from app.chuyen_ngu import kiem as _kiem
from app.chuyen_ngu import thuat_ngu

# Khoá hệ thống / mã: không dịch.
KHOA_BO = {"source_id", "school_id", "trang_thai", "can_doi_chieu", "ma", "slug", "mo_dun", "nhom", "mang", "han", "id",
           "loai", "phai", "ma_mau", "tu_dong", "nguon", "trich"}
LO = 40

QUY_TAC = """You are a senior English editor localising a Vietnamese self-reflection site (BaZi, Zi Wei Dou Shu, Feng Shui,
I Ching) for native English readers in the US, UK, Australia, Canada, Singapore and Malaysia.
Rules:
- Transcreate, do not translate word by word: short sentences, second person "you", plain everyday English.
- Keep every fact exactly: numbers, years, months, element names, star and palace names, levels. Do not add facts, examples,
  advice or claims that are not in the source.
- Keep placeholders like {{viec}} unchanged.
- Use EXACTLY these English terms for these Vietnamese terms:
{bang}
- Tone: suggestive, never fatalistic. Prefer "may", "tends to", "worth paying attention to". Never say "guaranteed",
  "accurate", "doomed", "cursed", "you will die", never name diseases, never give investment advice or promise cures.
- If the source says it does not replace a doctor, keep that meaning ("this is not medical advice; see a doctor").
- Output ONLY a JSON object with the same keys as INPUT and the English text as values."""

QUY_TAC_BIEN_TAP = """You are a native English copy editor. Make each value read naturally to a native speaker while keeping
every fact, number, placeholder and the listed terms unchanged. Do not add content.
Terms:
{bang}
Output ONLY a JSON object with the same keys as INPUT."""


def la_chuoi(d, duong: str = "") -> Iterator[tuple[str, str]]:
    """Mọi lá chuỗi cần dịch: (đường dẫn "a.0.b", giá trị). Bỏ khoá hệ thống và khoá bắt đầu bằng "_"."""
    if isinstance(d, dict):
        for k, v in d.items():
            if k.startswith("_") or k in KHOA_BO:
                continue
            yield from la_chuoi(v, f"{duong}.{k}" if duong else k)
    elif isinstance(d, list):
        for i, v in enumerate(d):
            yield from la_chuoi(v, f"{duong}.{i}" if duong else str(i))
    elif isinstance(d, str) and d.strip():
        yield duong, d


def _dat(goc: dict, duong: str, gia_tri: str) -> None:
    phan = duong.split(".")
    o = goc
    for i, p in enumerate(phan[:-1]):
        nhanh_sau = phan[i + 1]
        if isinstance(o, list):
            p = int(p)
            while len(o) <= p:
                o.append({})
            if not isinstance(o[p], (dict, list)):
                o[p] = [] if nhanh_sau.isdigit() else {}
            o = o[p]
        else:
            o = o.setdefault(p, [] if nhanh_sau.isdigit() else {})
    cuoi = phan[-1]
    if isinstance(o, list):
        while len(o) <= int(cuoi):
            o.append({})
        o[int(cuoi)] = gia_tri
    else:
        o[cuoi] = gia_tri


def loi_nhac(lo: dict[str, str], *, mang: list[str] | None, luot: int) -> list[dict]:
    mau = QUY_TAC if luot == 1 else QUY_TAC_BIEN_TAP
    return [{"role": "system", "content": mau.format(bang=thuat_ngu.cho_loi_nhac(mang))},
            {"role": "user", "content": "INPUT:\n" + json.dumps(lo, ensure_ascii=False)}]


def _goi_lo(goi: Callable, lo: dict[str, str], mang, luot: int) -> dict[str, str]:
    tra = goi(loi_nhac(lo, mang=mang, luot=luot), nhiet_do=0.3, max_tokens=8000)
    tra = tra.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
    o = json.loads(tra)
    return {k: v for k, v in o.items() if k in lo and isinstance(v, str)}


def chuyen(d: dict, *, goi: Callable, mang: list[str] | None = None) -> dict:
    """→ {ban_en: bản phủ tiếng Anh, loi: {đường dẫn: [lỗi]}, so: {tong, qua}}. `goi` = hàm gọi AI (messages, **kw) → chuỗi."""
    la = dict(la_chuoi(d))
    # Mã định danh ngắn trong lời nhắc (không lộ đường dẫn nội bộ dài) — đổi lại khi ghi.
    ids = {f"t{i}": k for i, k in enumerate(la)}
    ban: dict[str, str] = {}
    khoa = list(ids)
    for i in range(0, len(khoa), LO):
        lo = {k: la[ids[k]] for k in khoa[i:i + LO]}
        lan1 = _goi_lo(goi, lo, mang, 1)
        lan2 = _goi_lo(goi, {k: v for k, v in lan1.items()}, mang, 2) if lan1 else {}
        ban.update({k: lan2.get(k) or lan1[k] for k in lan1})
    ra: dict = {"source_id": d.get("source_id"), "school_id": d.get("school_id"), "_trang_thai": "nhap_may"}
    loi: dict[str, list] = {}
    for k, duong in ids.items():
        en = ban.get(k)
        if not en:
            loi[duong] = [{"ma": "thieu", "chi_tiet": "AI không trả"}]
            continue
        l = _kiem.kiem(la[duong], en, mang=mang)
        if l:
            loi[duong] = l
        else:
            _dat(ra, duong, en)
    return {"ban_en": ra, "loi": loi, "so": {"tong": len(la), "qua": len(la) - len(loi)}}
