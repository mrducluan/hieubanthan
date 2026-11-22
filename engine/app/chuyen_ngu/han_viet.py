# -*- coding: utf-8 -*-
"""Pipeline chuyển thể Hán/Trung → Tiếng Việt tự nhiên ("Nature Meaning") lúc SOẠN (offline, không chạy lúc user đọc).

Tái sử dụng đúng kiến trúc 3 lượt của `chuyen_ngu/quy_trinh.py` + bộ kiểm luật cố định (`cum_cam`, `sach_ghi`, `kiem_ai`):
  - Lượt 1: Phiên âm Hán-Việt + Dịch sát nghĩa + Nature Meaning (bản chất tâm lý/đời sống) + Lưỡng cực (manh / de_vap / loi_khuyen).
  - Lượt 2: Biên tập viên tiếng Việt đời thường — câu ngắn, dễ hiểu, bỏ sáo rỗng, giữ nguyên dữ kiện nguồn.
  - Lượt 3: Biên tập trưởng kiểm định (`trung_thanh`, `tu_nhien`, `an_toan`, `luong_cuc`; ngưỡng >= 0.9).
  - Hậu kiểm tất định (`kiem_han_viet`): chặn từ cấm, từ y tế, vật phẩm giải hạn, câu trung tính/thiếu lưỡng cực.

Đầu ra luôn gắn `_trang_thai: "nhap_may"` để người có chuyên môn duyệt trước khi đổi sang `da_duyet`.
"""
from __future__ import annotations

import json
import re
import sqlite3
import unicodedata
from collections.abc import Callable
from pathlib import Path

from app.kb import sach_ghi as sg
from app.kb import tuvi_doi_song_kb as kb_tv
from app.narrative import kiem_ai

LO = 20
DIEM_DAT = 0.9
DOA = ("đoản mệnh", "chết", "ung thư", "tai nạn", "phá sản", "ly hôn", "tự tử", "bệnh nặng")

# Allowlist cổ thư đã xác minh trong các kho `projects/*-kb/data/*.sqlite`.
NGUON_CO_THU_MAC_DINH: frozenset[str] = frozenset({
    "BAZI_QLMG_HANS",
    "CLASSICAL_FXD", "CLASSICAL_FXF", "CLASSICAL_XKMZ", "CLASSICAL_ZBD",
    "SHENSHI_XUANKONG_SHANG_BAIHEMING", "YOU_ZHAIYUN_XINAN_1928",
    "YANGZHAI_SANYAO_CHENZIMING",
    "SWH_ZYYCX_SHANG", "SWH_ZYYCX_XIA",
    "WHY_FLYCDY", "WHY_FLZYYF", "WHY_JFFYY", "WHY_LXSW", "WHY_ZSBYS",
    "LRY_127_V_HANT", "LRY_672_HANS", "LRY_672_HANT_SCAN",
    "WTZ_SHENZAO_HANS", "WTZ_ANXING_HANS",
})

# Blocklist nguồn ghi chú hiện đại / skill markdown / case study — tuyệt đối không đưa vào pipeline cổ thư.
NGUON_HIEN_DAI_LOAI: frozenset[str] = frozenset({
    "BAZI_SKILL_MD", "BAZI_CASES_JSON", "VOIDFORALL_FS_SKILL", "FXF_NOTES_NEWTON",
})

QUY_TAC_1 = """Bạn là chuyên gia Hán Nôm và biên tập viên chuyển thể ngôn ngữ tự nhiên cho website chiêm nghiệm văn hoá hieuban.com.
Với mỗi mục trong INPUT ({id: {"han": nguyên văn chữ Hán, "nguon": tên sách, "linh_vuc": lĩnh vực}}), hãy trả về JSON {id: {...}} gồm ĐÚNG 6 trường:
- "am": phiên âm Hán-Việt chuẩn xác của nguyên văn "han".
- "nghia_sat": dịch sát nghĩa từng vế của nguyên văn sang tiếng Việt (không thêm bớt).
- "nature_meaning": giải thích bản chất cơ chế tâm lý, hành vi hoặc hoàn cảnh đời sống đằng sau câu chữ đó bằng tiếng Việt tự nhiên, đời thường, không dùng thuật ngữ Hán-Việt khó hiểu.
- "manh": mặt TÍCH CỰC (điểm sáng / lợi thế cụ thể khi dùng đúng hoặc gặp thuận lợi), có căn cứ từ nguyên văn.
- "de_vap": mặt TIÊU CỰC / cần lưu ý (rủi ro / điểm mù cụ thể khi quá đà hoặc gặp áp lực), có căn cứ từ nguyên văn; nói giảm nếu nguyên văn nặng.
- "loi_khuyen": 1 hành động nhỏ, cụ thể, làm được ngay trong đời sống.

RÀNG BUỘC TUYỆT ĐỐI:
- Không giọng phán quyết: cấm "bạn sẽ", "chắc chắn", "định mệnh", "số phận đã", "100%".
- Không đoán bệnh hiểm nghèo, không đoán tuổi thọ/ngày mất, không khuyên mua vật phẩm giải hạn hay cờ bạc/đầu tư.
- Không viết câu trung tính ba phải ("tuỳ bạn", "không có gì nổi bật"). Cả "manh" và "de_vap" phải rõ nét và dựa trên nguyên văn.
- Chỉ trả về JSON object hợp lệ."""

QUY_TAC_2 = """Bạn là biên tập viên tiếng Việt đời thường. Hãy đọc lại các bản chuyển thể trong INPUT và chuốt lại "nature_meaning", "manh", "de_vap", "loi_khuyen" sao cho:
- Câu ngắn, tự nhiên như người bạn hiểu chuyện đang giải thích (xưng "bạn").
- Giữ nguyên "am" và "nghia_sat", không thêm dữ kiện, con số hay lời khuyên không có trong bản gốc.
- Giữ rõ cả 2 mặt Tích cực ("manh") và Tiêu cực/Lưu ý ("de_vap"); không làm mờ thành câu trung tính.
- Chỉ trả về JSON object giữ nguyên cấu trúc 6 trường cho mỗi id."""

QUY_TAC_KIEM_DINH = """Bạn là biên tập trưởng kiểm định bản chuyển thể Hán → Việt của hieuban.com.
Với mỗi id trong INPUT ({"goc": ..., "ban_dich": ...}), KHÔNG viết lại; chỉ chấm điểm và trả về JSON {id: {"trung_thanh": 0..1, "tu_nhien": 0..1, "an_toan": true|false, "luong_cuc": true|false, "ghi_chu": "..."}}:
- trung_thanh: nghia_sat và nature_meaning bám sát nguyên văn Hán, không bịa ý.
- tu_nhien: tiếng Việt đời thường trôi chảy, không dịch word-by-word kiểu Hán-Việt cứng nhắc.
- an_toan: false nếu phán số phận, đoán bệnh/tuổi thọ, nhắc vật phẩm/giải hạn, hoặc bịa mặt tiêu cực không có gốc từ nguyên văn.
- luong_cuc: true nếu cả "manh" và "de_vap" đều cụ thể, rõ nét, không chung chung trung tính."""


def doc_sqlite(db_path: str | Path, table: str, *, limit: int = 20, offset: int = 0,
               allow_sources: tuple[str, ...] | None = None,
               only_classical: bool = True) -> dict[str, dict]:
    """Đọc các mục chưa dịch từ kho `*-kb/*.sqlite` (read-only) thành đầu vào chuẩn cho `chuyen_han_viet`.

    Mặc định (`only_classical=True`):
    - Luôn loại trừ `NGUON_HIEN_DAI_LOAI` (skill markdown, case study, ghi chú hiện đại).
    - Nếu bảng có mã nguồn khớp `NGUON_CO_THU_MAC_DINH`, chỉ lấy các mã thuộc allowlist cổ thư đó.
    - Có thể truyền `allow_sources=("...",)` để khoá chặt đúng một hoặc vài bộ cổ thư.
    """
    p = Path(db_path)
    con = sqlite3.connect(f"file:{p}?mode=ro", uri=True)
    con.row_factory = sqlite3.Row
    try:
        cols = {r[1] for r in con.execute(f'PRAGMA table_info("{table}")').fetchall()}
        id_col = "section_id" if "section_id" in cols else "rule_id" if "rule_id" in cols else "entry_id"
        han_col = "text_zh_hant" if "text_zh_hant" in cols else "text_trad"
        src_col = "book_code" if "book_code" in cols else "source_code" if "source_code" in cols else None
        clauses = []
        if "translation_vi" in cols:
            clauses.append("(translation_vi IS NULL OR trim(translation_vi) = '')")
        params: list = []
        if src_col:
            if allow_sources:
                ph = ",".join("?" for _ in allow_sources)
                clauses.append(f'"{src_col}" IN ({ph})')
                params.extend(allow_sources)
            elif only_classical:
                distinct_srcs = {
                    str(r[0]) for r in con.execute(f'SELECT DISTINCT "{src_col}" FROM "{table}"').fetchall()
                    if r[0] is not None
                }
                if distinct_srcs & NGUON_CO_THU_MAC_DINH:
                    allowed = sorted(distinct_srcs & NGUON_CO_THU_MAC_DINH)
                    ph = ",".join("?" for _ in allowed)
                    clauses.append(f'"{src_col}" IN ({ph})')
                    params.extend(allowed)
                elif NGUON_HIEN_DAI_LOAI:
                    blocked = sorted(NGUON_HIEN_DAI_LOAI)
                    ph = ",".join("?" for _ in blocked)
                    clauses.append(f'"{src_col}" NOT IN ({ph})')
                    params.extend(blocked)
        where = ("WHERE " + " AND ".join(clauses)) if clauses else ""
        sel_src = f'"{src_col}"' if src_col else "'co_thu' as src"
        rows = con.execute(
            f'SELECT "{id_col}" as id, "{han_col}" as han, {sel_src} as nguon FROM "{table}" {where} LIMIT ? OFFSET ?',
            (*params, limit, offset),
        ).fetchall()
        return {str(r["id"]): {"han": (r["han"] or "").strip(), "nguon": str(r["nguon"] or "co_thu"), "linh_vuc": "chung"}
                for r in rows if (r["han"] or "").strip()}
    finally:
        con.close()


def uoc_luong_chi_phi(muc_goc: dict[str, dict], *, kiem_dinh: bool = True,
                      gia_vao_1m: float = 0.5, gia_ra_1m: float = 1.5) -> dict:
    """Ước lượng số lô, token đầu vào/đầu ra và chi phí USD (tham khảo) trước khi chạy LLM thật."""
    so_muc = len(muc_goc)
    so_lo = (so_muc + LO - 1) // LO if so_muc else 0
    ky_tu_han = sum(len((v.get("han") or "")) for v in muc_goc.values())
    # Ước lượng bảo thủ: 1 chữ Hán ~ 1.5 token; prompt hệ thống ~ 650 token/lô; đầu ra ~ 220 token/mục.
    tok_vao_1 = int(ky_tu_han * 1.5 + so_lo * 650)
    tok_ra_1 = so_muc * 220
    tok_vao_2 = tok_ra_1 + so_lo * 450
    tok_ra_2 = so_muc * 220
    tok_vao_3 = (tok_vao_1 + tok_ra_2 + so_lo * 450) if kiem_dinh else 0
    tok_ra_3 = (so_muc * 70) if kiem_dinh else 0
    tong_vao = tok_vao_1 + tok_vao_2 + tok_vao_3
    tong_ra = tok_ra_1 + tok_ra_2 + tok_ra_3
    usd = round((tong_vao / 1_000_000) * gia_vao_1m + (tong_ra / 1_000_000) * gia_ra_1m, 4)
    return {
        "so_muc": so_muc,
        "so_lo": so_lo,
        "so_luot": 3 if kiem_dinh else 2,
        "token_vao_uoc_luong": tong_vao,
        "token_ra_uoc_luong": tong_ra,
        "chi_phi_usd_uoc_luong": usd,
    }


def _parse_json(raw: str) -> dict:
    s = (raw or "").strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
    o = json.loads(s)
    return o if isinstance(o, dict) else {}


# Lỗi dấu thanh tiếng Việt phổ biến (lẫn hỏi/ngã/nặng/sắc) & rác OCR dễ làm lệch nghĩa.
_LOI_DAU_VIET = re.compile(
    r"\b(cũa|nghỉa|củng|mổi|vẩn|chử|giử|giửa|hõi|đả|lổi|chạng|dậm)\b|\(\?\)|\s[,.;:!?]",
    re.IGNORECASE,
)


def kiem_han_viet(item: dict, *, han_goc: str = "") -> list[dict]:
    """Bộ kiểm luật cố định cho một mục đã chuyển thể (không cần LLM).
    Kết hợp `cum_cam`, `DOA`, `cum_chung_chung`, `sach_ghi._CAM_TU`, `kiem_ai`,
    kiểm chuẩn Unicode NFC + dấu thanh tiếng Việt, và kiểm chữ Hán nặng `sach_ghi._HAN_NANG`.
    """
    loi: list[dict] = []
    thieu = [k for k in ("am", "nghia_sat", "nature_meaning", "manh", "de_vap", "loi_khuyen")
             if not isinstance(item.get(k), str) or not item[k].strip()]
    if thieu:
        return [{"ma": "thieu_truong", "chi_tiet": ", ".join(thieu)}]

    cum_cam = kb_tv.cum_cam()
    chung_chung = kb_tv.cum_chung_chung()
    for fld in ("am", "nghia_sat", "nature_meaning", "manh", "de_vap", "loi_khuyen"):
        txt = item[fld]
        if txt != unicodedata.normalize("NFC", txt):
            loi.append({"ma": "unicode_nfd", "chi_tiet": f"{fld}: chứa dấu tổ hợp NFD (cần chuẩn hoá NFC)"})
        m_dau = _LOI_DAU_VIET.search(txt)
        if m_dau:
            loi.append({"ma": "loi_dau_viet", "chi_tiet": f"{fld}: nghi sai dấu/chính tả ({m_dau.group(0)!r})"})
    for fld in ("nature_meaning", "manh", "de_vap", "loi_khuyen"):
        txt = item[fld]
        hits = kb_tv.tim_cum_cam(txt, cum_cam) + kb_tv.tim_cum_cam(txt, DOA)
        if hits:
            loi.append({"ma": "cum_cam", "chi_tiet": f"{fld}: {', '.join(dict.fromkeys(hits))}"})
        cc = kb_tv.tim_cum_cam(txt, chung_chung)
        if cc:
            loi.append({"ma": "chung_chung", "chi_tiet": f"{fld}: {', '.join(dict.fromkeys(cc))}"})
        if sg._CAM_TU.search(txt):
            loi.append({"ma": "cam_tu_sach_ghi", "chi_tiet": f"{fld}: từ nhạy cảm chưa nói giảm"})
        thap = txt.lower()
        for c in kiem_ai.CAM + kiem_ai.VAT_PHAM:
            if re.search(r"(?<!\w)" + re.escape(c.lower()) + r"(?!\w)", thap):
                loi.append({"ma": "kiem_ai", "chi_tiet": f"{fld}: {c}"})
    # Nếu nguyên văn có chữ Hán nặng (SX-C _HAN_NANG), không được gắn nhãn nhom="A" (khen nguyên ý).
    if han_goc and sg._HAN_NANG.search(han_goc) and item.get("nhom") == "A":
        loi.append({"ma": "han_nang_sai_nhom", "chi_tiet": "nguyên văn chứa chữ Hán nặng (_HAN_NANG), cần xem xét nhóm B/C"})
    return loi


def _kiem_dinh_lo(goi: Callable, lo_goc: dict[str, dict], lo_dich: dict[str, dict]) -> tuple[dict[str, list[dict]], bool]:
    cap = {k: {"goc": lo_goc[k], "ban_dich": lo_dich[k]} for k in lo_dich}
    if not cap:
        return {}, True
    try:
        tra = goi([{"role": "system", "content": QUY_TAC_KIEM_DINH},
                   {"role": "user", "content": "INPUT:\n" + json.dumps(cap, ensure_ascii=False)}],
                  nhiet_do=0.1, max_tokens=8000)
        o = _parse_json(tra)
    except Exception:  # noqa: BLE001
        return {}, False
    if not o or not any(isinstance(v, dict) for v in o.values()):
        return {}, False
    loi: dict[str, list[dict]] = {}
    for k in cap:
        v = o.get(k)
        if not isinstance(v, dict):
            loi[k] = [{"ma": "kiem_dinh", "chi_tiet": "lượt kiểm định không chấm mục này"}]
            continue
        try:
            tt, tn = float(v.get("trung_thanh", 0)), float(v.get("tu_nhien", 0))
        except (TypeError, ValueError):
            tt = tn = 0.0
        ly: list[str] = []
        if v.get("an_toan") is not True:
            ly.append("an toàn: không đạt")
        if v.get("luong_cuc") is not True:
            ly.append("lưỡng cực: chưa rõ")
        if (tt + tn) / 2 < DIEM_DAT:
            ly.append(f"điểm {tt:.2f}/{tn:.2f} < {DIEM_DAT}")
        if ly:
            ghi = str(v.get("ghi_chu") or "").strip()
            loi[k] = [{"ma": "kiem_dinh", "chi_tiet": "; ".join(ly) + (f" — {ghi}" if ghi else "")}]
    return loi, True


def chuyen_han_viet(muc_goc: dict[str, dict], *, goi: Callable, kiem_dinh: bool = True) -> dict:
    """Chuyển thể lô mục chữ Hán sang cấu trúc Việt tự nhiên + lưỡng cực + trích dẫn.
    `goi` = hàm gọi LLM `(messages, nhiet_do=..., max_tokens=...) -> str`.
    Trả về `{ket_qua, loi, so}` với `_trang_thai: "nhap_may"`."""
    khoa = list(muc_goc)
    ban_dich: dict[str, dict] = {}
    loi_kd: dict[str, list[dict]] = {}
    kd_doc_duoc = True

    for i in range(0, len(khoa), LO):
        lo = {k: muc_goc[k] for k in khoa[i:i + LO]}
        raw1 = goi([{"role": "system", "content": QUY_TAC_1},
                    {"role": "user", "content": "INPUT:\n" + json.dumps(lo, ensure_ascii=False)}],
                   nhiet_do=0.3, max_tokens=8000)
        lan1 = {k: v for k, v in _parse_json(raw1).items() if k in lo and isinstance(v, dict)}
        lan2: dict[str, dict] = {}
        if lan1:
            raw2 = goi([{"role": "system", "content": QUY_TAC_2},
                        {"role": "user", "content": "INPUT:\n" + json.dumps(lan1, ensure_ascii=False)}],
                       nhiet_do=0.3, max_tokens=8000)
            lan2 = {k: v for k, v in _parse_json(raw2).items() if k in lan1 and isinstance(v, dict)}
        lo_kq = {k: lan2.get(k) or lan1[k] for k in lan1}
        ban_dich.update(lo_kq)
        if kiem_dinh and lo_kq:
            l_kd, ok = _kiem_dinh_lo(goi, lo, lo_kq)
            loi_kd.update(l_kd)
            kd_doc_duoc = kd_doc_duoc and ok

    ket_qua: dict[str, dict] = {}
    loi: dict[str, list[dict]] = {}
    for k in khoa:
        item = ban_dich.get(k)
        if not item:
            loi[k] = [{"ma": "thieu", "chi_tiet": "AI không trả kết quả"}]
            continue
        han_goc = muc_goc[k].get("han", "")
        l = kiem_han_viet(item, han_goc=han_goc) + loi_kd.get(k, [])
        if l:
            loi[k] = l
        else:
            can_duyet_c = bool(han_goc and sg._HAN_NANG.search(han_goc))
            ket_qua[k] = {
                "_trang_thai": "nhap_may",
                "han": han_goc,
                "nguon": muc_goc[k].get("nguon", ""),
                **({"_can_duyet_nhom_c": True} if can_duyet_c else {}),
                **item,
            }
    so = {"tong": len(khoa), "qua": len(ket_qua),
          "kiem_dinh": "tat" if not kiem_dinh else ("dat" if kd_doc_duoc else "khong_doc_duoc")}
    return {"ket_qua": ket_qua, "loi": loi, "so": so}
