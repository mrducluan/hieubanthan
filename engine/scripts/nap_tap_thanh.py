# -*- coding: utf-8 -*-
"""KT-NT3 / KT-PT1 — nạp hai sách chép trong «欽定古今圖書集成 · 博物彙編 · 藝術典» (Cổ Kim Đồ Thư Tập Thành, in 1726)
từ Wikisource tiếng Trung vào kho nguồn:

  • 神相全編 (Thần Tướng Toàn Biên) — 相術部彙考 1–14, quyển 631–644  → fixtures/nguon/than_tuong_toan_bien.json
  • 陽宅十書 (Dương Trạch Thập Thư, Vương Quân Vinh — Minh) — 堪輿部彙考 25–27, quyển 675–677
                                                                      → fixtures/nguon/duong_trach_thap_thu.json
    (quyển 678 = «論符鎮第十», toàn bùa trấn — KHÔNG nạp: dự án không khuyên bùa / vật phẩm.)

Wikisource gõ lại theo từng trang bản in (Gujin Tushu Jicheng .djvu); mọi trang đang ở mức «chưa hiệu đính»
→ `can_doi_chieu: true`. Bản OCR archive.org của bản khắc Minh hỏng chữ, không dùng (KT-NT2).

DẤU CÂU: chính văn thuộc công chúng, nhưng dấu chấm câu trên Wikisource do máy (古詩文斷句) + người dùng thêm và phát hành
theo CC BY-SA 4.0 → kho nguồn BỎ dấu câu, chỉ giữ chữ (như các sách Tứ khố). Dấu 〈…〉 đánh phần chú chữ nhỏ của bản in
(thuộc bố cục bản gốc) được giữ.

Sách tướng có nhiều thiên đoán nghèo / yểu / hình khắc / tướng đàn bà; sách nhà có nhiều câu đoán hoạ — kho nguồn chép đủ
để đối chiếu, nhưng LỜI LUẬN chỉ trích câu trung tính.

Dùng:  python scripts/nap_tap_thanh.py /thu/muc
  (thư mục chứa <quyển>.json = kết quả `action=parse&prop=text|revid&page=欽定古今圖書集成/博物彙編/藝術典/第N卷`)
"""
from __future__ import annotations

import html
import json
import re
import sys
from pathlib import Path

NGUON = Path(__file__).resolve().parent.parent / "fixtures" / "nguon"
SO = "一二三四五六七八九十"
_DAU_CAU = re.compile(r"[，。、；：？！「」『』《》“”‘’·,.;:?!\"']")
_DUOI = "此作品在全世界都属于公有领域"          # khối giấy phép cuối trang Wikisource
BAN = ("Wikisource tiếng Trung, gõ lại theo trang bản in Cổ Kim Đồ Thư Tập Thành (mọi trang ở mức «chưa hiệu đính»; "
       "lấy 2026-11-14); đã bỏ dấu chấm câu của Wikisource — CHƯA đối chiếu bản khắc")


def _so(n: int) -> str:
    return SO[n - 1] if n <= 10 else "十" + SO[n - 11]


def _van(h: str) -> str:
    h = re.sub(r"<style.*?</style>|<figure.*?</figure>|<table.*?</table>", "", h, flags=re.S)
    h = re.sub(r'<span class="mw-editsection">.*?</span></span>', "", h, flags=re.S)
    t = html.unescape(re.sub(r"<[^>]+>", "", h))
    t = re.sub(r"<[^>]+>", "", t)                   # thẻ viết dạng chữ trong wikitext
    if _DUOI in t:
        t = t[:t.index(_DUOI)]
    t = t.replace("​", "").replace("　", "").replace("\xa0", "")
    return _DAU_CAU.sub("", re.sub(r"\s+", "", t))


def tach(h: str, ten_sach: str, n: int, gop: tuple[str, ...] = (), dung: str = "124") -> list[dict]:
    """Các mục (tiêu đề h3 / h5) dưới tiêu đề «<ten_sach><n>». Tiêu đề thuộc `gop` (vd «圖») không mở mục mới —
    chữ của nó nhập vào mục đang mở."""
    dau = re.search(r'<h[24] id="《?' + ten_sach + _so(n) + '》?"', h)    # có quyển Wikisource đặt nhầm cấp tiêu đề
    assert dau, f"không thấy {ten_sach}{_so(n)}"
    than = h[dau.end():]
    ket = re.search(r"<h[" + dung + r"]\b[^>]*id=", than)      # hết sách: gặp tiêu đề cấp sách kế tiếp
    if ket:
        than = than[:ket.start()]
    moc = list(re.finditer(r"<h([345])\b[^>]*>(.*?)</h\1>", than, flags=re.S))
    ra: list[dict] = []
    for i, m in enumerate(moc):
        ten = _van(m.group(2))
        van = _van(than[m.end():moc[i + 1].start() if i + 1 < len(moc) else len(than)])
        hong = "{" in ten                          # tiêu đề hỏng do mẫu Wikisource
        if (hong or ten in gop or len(ten) > 24) and ra:
            ra[-1]["van"] += ("" if hong or ten in gop else ten) + van
            continue
        if van or ten:
            ra.append({"ten": "（無題）" if hong else ten, "van": van})
    return [x for x in ra if x["van"]]


def _doc(thu_muc: Path, gj: int) -> dict:
    return json.loads((thu_muc / f"{gj}.json").read_text("utf-8"))["parse"]


def than_tuong(thu_muc: Path) -> dict:
    quyen = []
    for i, gj in enumerate(range(631, 645), 1):
        d = _doc(thu_muc, gj)
        quyen.append({"so": i, "ten": f"神相全編{_so(i)}", "tap_thanh": gj, "revid": d.get("revid"),
                      "muc": tach(d["text"]["*"], "神相全編", i)})
    return {
        "_nguon": "神相全編 (Thần Tướng Toàn Biên; tương truyền Trần Đoàn soạn, Viên Trung Triệt đính — Minh), bản chép trong "
                  "欽定古今圖書集成 · 博物彙編 · 藝術典 · 相術部彙考一至十四 (quyển 631–644, in 1726).",
        "ban": BAN, "can_doi_chieu": True, "source_id": "than_tuong_toan_bien", "school_id": "nhan_tuong", "quyen": quyen}


def duong_trach(thu_muc: Path) -> dict:
    quyen = []
    for i, gj in enumerate(range(675, 678), 1):
        d = _doc(thu_muc, gj)
        quyen.append({"so": i, "ten": f"陽宅十書{_so(i)}", "tap_thanh": gj, "revid": d.get("revid"),
                      "muc": tach(d["text"]["*"], "陽宅十書", i, gop=("圖", "圖說"), dung="12")})
    return {
        "_nguon": "陽宅十書 (Dương Trạch Thập Thư; Vương Quân Vinh soạn — Minh), bản chép trong 欽定古今圖書集成 · 博物彙編 · "
                  "藝術典 · 堪輿部彙考二十五至二十七 (quyển 675–677, in 1726). Quyển 678 (論符鎮第十, bùa trấn) không nạp.",
        "ban": BAN, "can_doi_chieu": True, "source_id": "duong_trach_thap_thu", "school_id": "bat_trach", "quyen": quyen}


def main(thu_muc: Path) -> None:
    NGUON.mkdir(parents=True, exist_ok=True)
    for ten, ham in (("than_tuong_toan_bien", than_tuong), ("duong_trach_thap_thu", duong_trach)):
        if not (thu_muc / ("631.json" if ham is than_tuong else "675.json")).exists():
            print("bỏ qua", ten, "(thiếu tệp)")
            continue
        kho = ham(thu_muc)
        (NGUON / f"{ten}.json").write_text(json.dumps(kho, ensure_ascii=False, indent=1) + "\n", "utf-8")
        print(ten, "· quyển:", len(kho["quyen"]), "· mục:", sum(len(q["muc"]) for q in kho["quyen"]),
              "· chữ:", sum(len(m["van"]) for q in kho["quyen"] for m in q["muc"]))


if __name__ == "__main__":
    main(Path(sys.argv[1]))
