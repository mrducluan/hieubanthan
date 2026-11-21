# -*- coding: utf-8 -*-
"""Dựng engine/fixtures/nguon/duong_trach_tam_yeu.json từ kho cục bộ fengshui-yangzhai-kb.

Quy tắc bản quyền & trung thực (TK-2 Phương án A + CT-1):
- CHỈ trích các đoạn 【原文】 nguyên tác 《陽宅三要》 của Triệu Cửu Phong (đời Thanh, cổ thư công cộng).
- LOẠI BỎ toàn bộ phần 【白话提要】, 【白话图解】, lời bình hiện đại và ảnh minh hoạ có bản quyền của Trần Tử Minh (2010).
- Chuyển chữ phồn thể (OpenCC s2t đã có sẵn trong cột text_zh_hant) và BỎ toàn bộ dấu câu hiện đại (chỉ giữ chữ Hán + xuống dòng).
- Đánh dấu `can_doi_chieu: true` vì nguồn là OCR từ bản in lại hiện đại (chưa đối chiếu bản khắc gỗ đời Thanh).
"""
from __future__ import annotations

import json
import re
import sqlite3
import sys
from pathlib import Path

DEFAULT_OUT = Path(__file__).resolve().parents[1] / "fixtures" / "nguon" / "duong_trach_tam_yeu.json"

# Ranh giới bắt đầu và kết thúc đoạn 【原文】 trong cột text_zh_hant (OpenCC phồn thể)
RE_START = re.compile(r"【\s*原文\s*】")
RE_STOP = re.compile(
    r"(?:【\s*(?:白話提要|白話圖解|圖解|現代|導讀|釋義|注釋|註釋)\s*】"
    r"|白話提要|白話圖解|白話譯文|現代戶型|圖解綜述|對斷訣的解釋如下|（原古圖）|\(原古圖\))"
)
# Chỉ giữ ký tự Hán (CJK Unified Ideographs + Extension A) và dấu xuống dòng
RE_NON_CJK = re.compile(r"[^\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\n]+")

QUYEN_MAP = {
    "导读卷": "導讀卷",
    "卷一": "卷一",
    "卷二": "卷二",
    "卷三": "卷三",
    "卷四": "卷四",
}


# Bảng chuẩn hoá lỗi OCR / OpenCC phổ biến trong văn bản cổ phong thuỷ
OCR_OPENCC_FIXES: list[tuple[str, str]] = [
    ("武麴", "武曲"),
    ("文麴", "文曲"),
    ("武典星", "武曲星"),
    ("夫日", "夫曰"),
    ("斷日", "斷曰"),
    ("故日", "故曰"),
    ("犯坎良", "犯坎艮"),
    ("配良門", "配艮門"),
    ("良竈", "艮竈"),
    ("某官某字", "某宮某字"),
    ("兇", "凶"),
    # Rà soát 2026-11-21: OpenCC / OCR đọc sai chữ thường gặp trong sách phong thuỷ.
    ("已酉醜", "巳酉丑"),
    ("已酉丑", "巳酉丑"),
    ("亥子醜", "亥子丑"),
    ("戊已", "戊己"),
    ("己已", "己巳"),
    ("巽已", "巽巳"),
    ("髮長", "發長"),
    ("長髮", "長發"),
    ("佔", "占"),
    ("天亡", "夭亡"),
]

# 艮 bị OCR đọc thành 良 khi đứng cạnh tên quái / 土 / 命 / 主 (không đụng 賢良, 不良, 忠良…).
_RE_LUONG_CAN = re.compile(r"(?<=[坤兌震乾坎離巽])良|(?<![賢淳循忠馬才不])良(?=[土命主坤])")


def chuan_hoa_co_van(text: str) -> str:
    for bad, good in OCR_OPENCC_FIXES:
        text = text.replace(bad, good)
    return _RE_LUONG_CAN.sub("艮", text)


def tach_nguyen_van(text_hant: str) -> list[str]:
    """Tách mọi khối 【原文】 trong một trang; bỏ hoàn toàn lời bạch thoại hiện đại và dấu câu."""
    spans: list[str] = []
    pos = 0
    while True:
        m = RE_START.search(text_hant, pos)
        if not m:
            break
        start = m.end()
        m_stop = RE_STOP.search(text_hant, start)
        m_next = RE_START.search(text_hant, start)
        ends = [x.start() for x in (m_stop, m_next) if x]
        end = min(ends) if ends else len(text_hant)
        raw = text_hant[start:end].strip()
        pos = end
        # Bỏ các dòng mô tả cấu trúc sách (nếu có) và bỏ toàn bộ dấu câu hiện đại
        lines: list[str] = []
        for ln in raw.splitlines():
            clean = chuan_hoa_co_van(RE_NON_CJK.sub("", ln).strip())
            if len(clean) >= 4:
                lines.append(clean)
        block = "\n".join(lines).strip()
        if len(block) >= 12:
            spans.append(block)
    return spans


def build_fixture(db_path: Path, out_path: Path) -> dict:
    conn = sqlite3.connect(str(db_path))
    rows = conn.execute(
        """
        SELECT pdf_page, book_page, volume, chapter, section_title, text_zh_hant, avg_conf
        FROM yangzhai_sections
        WHERE pdf_page >= 55
        ORDER BY pdf_page
        """
    ).fetchall()
    conn.close()

    thien: list[dict] = []
    low_conf_pages: list[dict] = []
    vol_counts: dict[str, int] = {}
    confs: list[float] = []

    for pdf_page, book_page, volume, chapter, title, text_hant, avg_conf in rows:
        if not text_hant or "原文" not in text_hant:
            continue
        blocks = tach_nguyen_van(text_hant)
        if not blocks:
            continue
        van = "\n".join(blocks)
        for bad, good in (("天\n亡", "夭\n亡"), ("已\n酉", "巳\n酉")):   # lỗi nằm vắt qua hai dòng
            van = van.replace(bad, good)
        q_label = QUYEN_MAP.get(volume or "", volume or "")
        if q_label == "導讀卷":
            # Phần "dẫn đọc" là cách xếp của bản in hiện đại, không phải quyển của Triệu Cửu Phong → không ghi quyển.
            q_label = None
        vol_counts[q_label or "chua_ro"] = vol_counts.get(q_label or "chua_ro", 0) + 1
        if avg_conf is not None:
            confs.append(float(avg_conf))
            if float(avg_conf) < 0.90:
                low_conf_pages.append({"so": len(thien) + 1, "avg_conf": round(float(avg_conf), 4)})
        # Không ghi số trang / cách chia trang của bản in hiện đại (rà soát 2026-11-21).
        ten = f"陽宅三要 · {q_label}" if q_label else "陽宅三要"
        thien.append(
            {
                "so": len(thien) + 1,
                "quyen": q_label,
                "ten": ten,
                "avg_conf": round(float(avg_conf), 4) if avg_conf is not None else None,
                "van": van,
            }
        )

    avg_all = round(sum(confs) / len(confs), 4) if confs else None
    total_chars = sum(len(t["van"].replace("\n", "")) for t in thien)

    payload = {
        "_nguon": (
            "陽宅三要 (Dương Trạch Tam Yếu) — Triệu Cửu Phong (趙九峰, đời Thanh) — "
            "cổ thư công cộng chuyên luận Cửa – Chủ – Bếp (Tam Yếu), Đông Tây Tứ Trạch, Tĩnh/Động/Biến/Hoá Trạch và 64 thế nhà – 64 thế bếp."
        ),
        "ban": (
            "CHỈ trích các khối 【原文】 nguyên tác Triệu Cửu Phong từ bản OCR (RapidOCR) của 《圖解陽宅三要》 "
            "(loại bỏ hoàn toàn lời bạch thoại hiện đại và ảnh minh hoạ có bản quyền của Trần Tử Minh); "
            "chuyển phồn thể qua OpenCC (s2t) và BỎ toàn bộ dấu câu hiện đại theo quy tắc CT-1. "
            f"Độ tin OCR trung bình: {avg_all} trên {len(thien)} đoạn ({total_chars} chữ Hán) — "
            "CHƯA đối chiếu bản khắc gỗ đời Thanh nên giữ cờ can_doi_chieu=true."
        ),
        "can_doi_chieu": True,
        "chuyen_phon_the_opencc": True,
        "source_id": "duong_trach_tam_yeu",
        "school_id": "bat_trach",
        "thong_ke": {
            "so_doan": len(thien),
            "tong_chu_han": total_chars,
            "avg_conf": avg_all,
            "theo_quyen": vol_counts,
            "trang_ocr_thap_duoi_0_90": low_conf_pages,
        },
        "thien": thien,
    }
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(payload, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    return payload


if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit("Cách dùng: python scripts/nap_nguon_duong_trach_tam_yeu.py <tệp sqlite kho riêng> [tệp ra]")
    db = Path(sys.argv[1])
    out = Path(sys.argv[2]) if len(sys.argv) > 2 else DEFAULT_OUT
    data = build_fixture(db, out)
    st = data["thong_ke"]
    print(f"Wrote {out} ({st['so_doan']} đoạn, {st['tong_chu_han']} chữ Hán, avg_conf={st['avg_conf']})")
    print("Theo quyển:", st["theo_quyen"])
    print("Trang OCR < 0.90:", st["trang_ocr_thap_duoi_0_90"])
