# -*- coding: utf-8 -*-
"""TK-1 — nạp sách tiếng Anh thuộc phạm vi công cộng (in trước 1929, tác giả mất trên 70 năm) vào kho nguồn.

Nguồn chữ: lớp chữ nhận dạng tự động (OCR) của bản quét trên Internet Archive:
    https://archive.org/stream/<id>/<tệp>_djvu.txt   (trang HTML, chữ nằm trong <pre>)
    python scripts/nap_archive_en.py            # tải + ghi cả bộ
    python scripts/nap_archive_en.py <thư mục>  # đọc tệp <id>.txt đã tải sẵn (không cần mạng)
Chỉ dọn vỏ: bỏ số trang / dòng chạy đầu trang, nối chữ ngắt dòng, gộp khoảng trắng — KHÔNG sửa chữ sách. Chữ OCR còn lỗi
(vd "mshed" = "rushed") nên mọi tệp `can_doi_chieu: true`: trước khi trích câu nào ra lời phải soát câu ấy với ảnh quét.
Kho nguồn trước, lời sau: tệp này chưa đổi KB, phép tính hay lời hiển thị.
"""
from __future__ import annotations

import html
import json
import re
import sys
import urllib.parse
import urllib.request
from pathlib import Path

NGUON = Path(__file__).resolve().parent.parent / "fixtures" / "nguon"

# khoá tệp → (id archive.org, tệp djvu, sách, tác giả, năm mất, năm in bản này, mảng, ghi chú dùng để làm gì)
SACH: dict[str, dict] = {
    "thanso_balliett_philosophy_1908": dict(
        id="philosophyofnum00ball", tep="philosophyofnum00ball", sach="The Philosophy of Numbers: Their Tone and Colors",
        tac_gia="Mrs. L. Dow Balliett", mat=1929, nam=1908, ban="bản in lại 1917", mang="thanso",
        dung="gốc của thần số học Pythagoras hiện đại: bảng chữ 1–9, số tên, số ngày sinh, 11 và 22"),
    "thanso_balliett_success_1905": dict(
        id="howtoattainsucce00ball", tep="howtoattainsucce00ball", sach="How to Attain Success Through the Strength of Vibration",
        tac_gia="Mrs. L. Dow Balliett", mat=1929, nam=1905, ban="bản in lại 1917", mang="thanso",
        dung="sách đầu tiên của Balliett: cách tính số tên + số ngày sinh, ví dụ tính (11 và 22 không cộng) → ca đối chiếu"),
    "chi_tay_saint_germain_1897": dict(
        id="practicalpalmist00sain", tep="practicalpalmist00sain", sach="Practical Palmistry",
        tac_gia="Comte C. de Saint-Germain", mat=1910, nam=1897, ban="bản in 1897", mang="chi_tay",
        dung="kho tình huống minh hoạ từng dấu trên đường chỉ — đối chiếu Benham, Cheiro"),
    "thanso_balliett_day_of_wisdom_1917": dict(
        id="dayofwisdomaccor00ball", tep="dayofwisdomaccor00ball", sach="The Day of Wisdom According to Number Vibration",
        tac_gia="Mrs. L. Dow Balliett", mat=1929, nam=1917, ban="bản in 1917", mang="thanso",
        dung="nghĩa từng con số theo ngày sinh và tên — đối chiếu lời KB nghĩa số"),
    "thanso_sepharial_kabala": dict(
        id="TheKabalaOfNumbers", tep="Sepharial-the-Kabala-of-Numbers", sach="The Kabala of Numbers: A Handbook of Interpretation",
        tac_gia="Sepharial (Walter Gorn Old)", mat=1929, nam=1911, ban="bản in lại (không ghi năm)", mang="thanso",
        dung="nghĩa số 1–9, số kép, chu kỳ — nguồn thứ hai cạnh Cheiro cho phái Chaldea"),
    "thanso_cheiro_book_of_numbers_1926": dict(
        id="in.ernet.dli.2015.70770", tep="2015.70770.Cheiros-Book-Of-Numbers", sach="Cheiro's Book of Numbers",
        tac_gia="Cheiro (William John Warner, Count Louis Hamon)", mat=1936, nam=1926, ban="bản in lại (Thư viện số Ấn Độ)", mang="thanso",
        dung="NGUỒN GỐC phái Chaldea engine đang dùng: bảng chữ 1–8, số kép 10–52 — đối chiếu bảng và nghĩa số kép"),
    "thanso_westcott_numbers_1911": dict(
        id="numberstheiroccu1911west", tep="numberstheiroccu1911west", sach="Numbers: Their Occult Power and Mystic Virtues",
        tac_gia="W. Wynn Westcott", mat=1925, nam=1890, ban="bản in lần ba 1911", mang="thanso",
        dung="ghi chép cổ điển về từng con số (Pythagoras, Kabbalah) — phần 'sách xưa nói gì' cho trang Ý nghĩa số"),
    "chi_tay_cheiro_language_of_the_hand": dict(
        id="cheiroslanguageo00hamo", tep="cheiroslanguageo00hamo", sach="Cheiro's Language of the Hand",
        tac_gia="Cheiro (William John Warner, Count Louis Hamon)", mat=1936, nam=1894, ban="bản in 1900", mang="chi_tay",
        dung="chỉ tay phương Tây: bảy dáng bàn tay, các gò, đường Sinh – Trí – Tâm – Vận mệnh — phái thứ hai cạnh sách tướng xưa"),
    "chi_tay_benham_laws_1900": dict(
        id="lawsscientifich00benhgoog", tep="lawsscientifich00benhgoog", sach="The Laws of Scientific Hand Reading",
        tac_gia="William G. Benham", mat=1944, nam=1900, ban="bản in 1912", mang="chi_tay",
        dung="sách chỉ tay phương Tây hệ thống nhất: bảy kiểu gò, ngón, móng, từng đường chỉ kèm tuổi trên đường"),
    "kinhdich_legge_1899": dict(
        id="iching00jame", tep="iching00jame", sach="The Yî King (The Sacred Books of China, part II; Sacred Books of the East vol. XVI)",
        tac_gia="James Legge (dịch)", mat=1897, nam=1882, ban="bản in lần hai 1899", mang="kinhdich",
        dung="bản dịch Anh thuộc phạm vi công cộng của kinh văn + Thập dực — nguyên văn tiếng Anh cho bản /en"),
}

_DAU_CHUONG = re.compile(r"^\s*(CHAPTER|PART|APPENDIX|SECTION|HEXAGRAM)\s+([IVXLC1l]{1,7}|\d{1,3})\s*[.,:—-]*\s*(.*)$")
_SO_TRANG = re.compile(r"^\s*(\d{1,4}|[ivxlc]{1,7})\s*$")


def tai(ma: str) -> str:
    s = SACH[ma]
    u = f"https://archive.org/stream/{s['id']}/{urllib.parse.quote(s['tep'])}_djvu.txt"
    with urllib.request.urlopen(urllib.request.Request(u, headers={"User-Agent": "Mozilla/5.0"}), timeout=180) as r:
        t = r.read().decode("utf-8", "replace")
    m = re.search(r"<pre>(.*?)</pre>", t, re.S)
    if not m:
        raise SystemExit(f"{ma}: không thấy <pre> ở {u}")
    return html.unescape(m.group(1))


def don(tho: str) -> list[str]:
    """Chữ OCR → danh sách đoạn. Chỉ giữ ký tự Latin (chữ Hán / ký hiệu lạ do máy nhận nhầm bị bỏ)."""
    tho = tho.replace("\r", "")
    tho = re.sub(r"[^\x09\x0a\x20-\x7e -ɏ‐-‧]", "", tho)
    doan: list[str] = []
    for khoi in re.split(r"\n\s*\n", tho):
        dong = [d.strip() for d in khoi.split("\n") if d.strip() and not _SO_TRANG.match(d)]
        if not dong:
            continue
        if len(dong) == 1 and _DAU_CHUONG.match(dong[0]):
            doan.append(re.sub(r"\s+", " ", dong[0]))
            continue
        x = ""
        for d in dong:
            d = re.sub(r"\s+", " ", d)
            x = x[:-1] + d if x.endswith("-") and d[:1].islower() else (x + " " + d if x else d)
        doan.append(x)
    return doan


def chia_chuong(doan: list[str]) -> list[dict]:
    """Cắt theo dòng 'CHAPTER I' / 'PART II'… Phần trước dòng đầu tiên là 'dau_sach' (bìa, lời tựa, mục lục)."""
    ra = [{"so": "", "ten": "dau_sach", "doan": []}]
    for d in doan:
        m = _DAU_CHUONG.match(d) if len(d) < 90 and d.upper() == d else None
        if m:
            ra.append({"so": f"{m.group(1).title()} {m.group(2)}", "ten": m.group(3).strip(" .—-"), "doan": []})
        else:
            ra[-1]["doan"].append(d)
    for i, c in enumerate(ra):                       # tên chương thường nằm ở đoạn ngay dưới dòng "CHAPTER I"
        if i and not c["ten"] and c["doan"] and len(c["doan"][0]) < 110 and c["doan"][0].upper() == c["doan"][0]:
            c["ten"] = c["doan"].pop(0).strip(" .")
    return [c for c in ra if c["doan"]]


def dung(ma: str, tho: str) -> dict:
    s = SACH[ma]
    chuong = chia_chuong(don(tho))
    return {
        "_nguon": f"{s['tac_gia']}, {s['sach']} ({s['nam']}; {s['ban']}). Phạm vi công cộng: in trước 1929, tác giả mất {s['mat']}.",
        "ban": f"Lớp chữ nhận dạng tự động của bản quét Internet Archive `{s['id']}` — chưa hiệu đính.",
        "ngon_ngu": "en", "mang": s["mang"], "source_id": ma, "can_doi_chieu": True, "dung_de": s["dung"],
        "so_chu": sum(len(d.split()) for c in chuong for d in c["doan"]), "chuong": chuong,
    }


def main() -> None:
    thu_muc = Path(sys.argv[1]) if len(sys.argv) > 1 else None
    for ma, s in SACH.items():
        tho = (thu_muc / f"{s['id']}.txt").read_text("utf-8") if thu_muc else tai(ma)
        d = dung(ma, tho)
        (NGUON / f"{ma}.json").write_text(json.dumps(d, ensure_ascii=False, indent=1) + "\n", "utf-8")
        print(f"{ma}: {len(d['chuong'])} chương, {d['so_chu']} chữ")


if __name__ == "__main__":
    main()
