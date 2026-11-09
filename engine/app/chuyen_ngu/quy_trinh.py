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


# HTT-1 — lượt 3 "biên tập trưởng" (ý Agent 4 của tài liệu Drive): chấm từng chuỗi, KHÔNG sửa. Ngưỡng: an toàn phải
# tuyệt đối, điểm trung thành + tự nhiên trung bình ≥ DIEM_DAT; kèm dịch ngược về tiếng Việt để bộ kiểm luật cố định so con số.
DIEM_DAT = 0.9
QUY_TAC_KIEM_DINH = """You are the chief editor auditing English transcreations of a Vietnamese self-reflection site (BaZi, Zi Wei Dou
Shu, Feng Shui, I Ching). For EACH id in INPUT you get {{"vi": source, "en": candidate}}. Do not rewrite anything. Return
ONLY a JSON object: {{id: {{"trung_thanh": 0..1, "tu_nhien": 0..1, "an_toan": true|false, "dich_nguoc": "<back-translation of en into
Vietnamese>", "ghi_chu": "<one short reason if any score < 0.9>"}}}}.
- trung_thanh: every fact, number, term, hedge and limitation of the source is kept; nothing added.
- tu_nhien: reads like a native editor wrote it; no translationese, no AI clichés (delve, tapestry, testament, beacon).
- an_toan: false if it predicts fate, promises outcomes, names diseases, gives investment or medical advice, or drops a
  "not medical advice / see a doctor" caveat that the source has.
Terms that must appear exactly when the source uses them:
{bang}"""


def loi_nhac_kiem_dinh(cap: dict[str, dict[str, str]], *, mang: list[str] | None) -> list[dict]:
    return [{"role": "system", "content": QUY_TAC_KIEM_DINH.format(bang=thuat_ngu.cho_loi_nhac(mang))},
            {"role": "user", "content": "INPUT:\n" + json.dumps(cap, ensure_ascii=False)}]


def _kiem_dinh_lo(goi: Callable, lo_vi: dict[str, str], lo_en: dict[str, str], mang) -> tuple[dict[str, list[dict]], bool]:
    """→ ({id: [lỗi kiem_dinh]}, đọc được?). Máy không trả JSON đúng khuôn → không chặn (bộ kiểm luật cố định vẫn chạy),
    nhưng báo `doc_duoc = False` để người duyệt biết lượt kiểm định không có hiệu lực."""
    cap = {k: {"vi": lo_vi[k], "en": lo_en[k]} for k in lo_en}
    if not cap:
        return {}, True
    try:
        tra = goi(loi_nhac_kiem_dinh(cap, mang=mang), nhiet_do=0.1, max_tokens=8000)
        tra = tra.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
        o = json.loads(tra)
    except Exception:  # noqa: BLE001 — lỗi mạng / JSON hỏng: không chặn, chỉ báo
        return {}, False
    if not isinstance(o, dict) or not any(isinstance(v, dict) for v in o.values()):
        return {}, False
    loi: dict[str, list[dict]] = {}
    for k in cap:
        v = o.get(k)
        if not isinstance(v, dict):
            loi[k] = [{"ma": "kiem_dinh", "chi_tiet": "lượt kiểm định không chấm chuỗi này"}]
            continue
        try:
            tt, tn = float(v.get("trung_thanh", 0)), float(v.get("tu_nhien", 0))
        except (TypeError, ValueError):
            tt = tn = 0.0
        ly: list[str] = []
        if v.get("an_toan") is not True:
            ly.append("an toàn: không đạt")
        if (tt + tn) / 2 < DIEM_DAT:
            ly.append(f"điểm {tt:.2f}/{tn:.2f} < {DIEM_DAT}")
        dn = v.get("dich_nguoc")
        # Chỉ so khi nguồn có chữ số (nguồn viết "ba tháng" mà dịch ngược ghi "3 tháng" không phải lỗi).
        if isinstance(dn, str) and dn.strip() and _kiem._so(lo_vi[k]) and _kiem._so(dn) != _kiem._so(lo_vi[k]):
            ly.append(f"dịch ngược lệch số: {_kiem._so(dn)} ≠ {_kiem._so(lo_vi[k])}")
        if ly:
            ghi = str(v.get("ghi_chu") or "").strip()
            loi[k] = [{"ma": "kiem_dinh", "chi_tiet": "; ".join(ly) + (f" — {ghi}" if ghi else "")}]
    return loi, True


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


def chuyen(d: dict, *, goi: Callable, mang: list[str] | None = None, kiem_dinh: bool = True) -> dict:
    """→ {ban_en: bản phủ tiếng Anh, loi: {đường dẫn: [lỗi]}, so: {tong, qua, kiem_dinh}}. `goi` = hàm gọi AI (messages, **kw) → chuỗi.
    HTT-1: `kiem_dinh=True` chạy thêm lượt 3 chấm điểm (không sửa) — chuỗi không đạt vào `loi` với mã `kiem_dinh`;
    `so.kiem_dinh` = "dat" / "khong_doc_duoc" (máy không trả JSON đúng khuôn, bộ kiểm luật cố định vẫn áp) / "tat"."""
    la = dict(la_chuoi(d))
    # Mã định danh ngắn trong lời nhắc (không lộ đường dẫn nội bộ dài) — đổi lại khi ghi.
    ids = {f"t{i}": k for i, k in enumerate(la)}
    ban: dict[str, str] = {}
    loi_kd: dict[str, list[dict]] = {}
    kd_doc_duoc = True
    khoa = list(ids)
    for i in range(0, len(khoa), LO):
        lo = {k: la[ids[k]] for k in khoa[i:i + LO]}
        lan1 = _goi_lo(goi, lo, mang, 1)
        lan2 = _goi_lo(goi, {k: v for k, v in lan1.items()}, mang, 2) if lan1 else {}
        lo_en = {k: lan2.get(k) or lan1[k] for k in lan1}
        ban.update(lo_en)
        if kiem_dinh and lo_en:
            l_kd, ok = _kiem_dinh_lo(goi, lo, lo_en, mang)
            loi_kd.update(l_kd)
            kd_doc_duoc = kd_doc_duoc and ok
    ra: dict = {"source_id": d.get("source_id"), "school_id": d.get("school_id"), "_trang_thai": "nhap_may"}
    loi: dict[str, list] = {}
    for k, duong in ids.items():
        en = ban.get(k)
        if not en:
            loi[duong] = [{"ma": "thieu", "chi_tiet": "AI không trả"}]
            continue
        l = _kiem.kiem(la[duong], en, mang=mang) + loi_kd.get(k, [])
        if l:
            loi[duong] = l
        else:
            _dat(ra, duong, en)
    so = {"tong": len(la), "qua": len(la) - len(loi), "kiem_dinh": "tat" if not kiem_dinh else ("dat" if kd_doc_duoc else "khong_doc_duoc")}
    return {"ban_en": ra, "loi": loi, "so": so}
