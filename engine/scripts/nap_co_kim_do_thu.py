# -*- coding: utf-8 -*-
"""Nạp sách lấy từ 《欽定古今圖書集成》 (Cổ Kim Đồ Thư Tập Thành, 1725) trên Wikisource tiếng Trung vào kho nguồn.

Vì sao nguồn này: 陽宅十書 (Dương Trạch Thập Thư) và 神相全編 (Thần Tướng Toàn Biên) không có trang riêng trên
Wikisource, không có trong Tứ khố, nhưng được chép trọn trong Cổ Kim Đồ Thư Tập Thành — bộ loại thư khâm định đời
Thanh (Trần Mộng Lôi, Tưởng Đình Tích biên, in đồng 1725). Wikisource gõ lại từ bản chụp (trang `Page:Gujin Tushu
Jicheng, Volume …djvu`), chữ của bộ sách là của công chúng.

Chấm câu trên Wikisource do máy đặt rồi người dùng sửa, phát hành theo CC BY-SA 4.0 — KHÔNG phải của sách. Bộ nạp BỎ
mọi dấu chấm câu thời nay (như bản Tứ khố trong kho: không chấm câu), chỉ giữ chữ sách và chú nhỏ 〈…〉 → 〔…〕.

Dùng (trang đã tải bằng `index.php?title=欽定古今圖書集成/博物彙編/藝術典/第NNN卷&action=render`, lưu `NNN.html`):
    python scripts/nap_co_kim_do_thu.py /thu/muc/render
"""
from __future__ import annotations

import html
import json
import re
import sys
from pathlib import Path

NGUON = Path(__file__).resolve().parent.parent / "fixtures" / "nguon"
NGAY = "2026-11-14"
GOC = "欽定古今圖書集成/博物彙編/藝術典"

# mã kho → (tên Hán, tên Việt, các quyển của bộ loại thư, chữ mở đầu tên sách trong đề mục, school_id, ghi chú)
SACH = {
    "duong_trach_thap_thu": ("陽宅十書", "Dương Trạch Thập Thư", range(675, 679), "陽宅十書", "bat_trach",
                             "Vương Quân Vinh (Minh) biên — sách dương trạch, có các thiên luận hình thế, phương vị, "
                             "phép lập cửa, phép tu tạo"),
    "than_tuong_toan_bien": ("神相全編", "Thần Tướng Toàn Biên", range(631, 645), "神相全編", "nhan_tuong",
                             "Viên Trung Triệt (Minh) đính chính — gom các phép tướng truyền đời trước (Ma Y, Quỷ Cốc, "
                             "Hứa Phụ…)"),
    "chieu_dam_kinh": ("照膽經", "Chiếu Đảm Kinh", range(645, 647), "照膽經", "nhan_tuong", "sách tướng, khuyết danh"),
}

# dấu chấm câu thời nay (của người gõ, CC BY-SA) — bỏ hết
_CHAM = re.compile(r"[，。、；：？！「」『』《》（）“”‘’…—·・,.;:?!()\"'　]")


def _chu(s: str) -> str:
    s = re.sub(r"<span[^>]*class=\"pagenum[^\"]*\"[^>]*>.*?</span></span>", "", s, flags=re.S)
    s = re.sub(r"<(img|figure)[^>]*>", "〔圖〕", s)
    s = re.sub(r"<[^>]+>", "", s)
    s = html.unescape(s).replace("​", "")
    s = s.replace("〈", "〔").replace("〉", "〕")
    return _CHAM.sub("", s)


def doc_quyen(trang: str) -> list[tuple[int, str, str]]:
    """Một quyển → [(cấp, đề mục, chữ)] theo thứ tự; đề mục là mọi h2/h3/h4 trong phần văn bản (h4 = tên sách)."""
    a = trang.find("prp-pages-output")
    b = trang.find("licenseContainer")
    if a < 0:
        raise ValueError("không thấy phần văn bản")
    than = trang[a: b if b > a else len(trang)]
    khoi = re.split(r"<h([234])[^>]*>(.*?)</h[234]>", than, flags=re.S)
    ra: list[tuple[int, str, str]] = [(0, "", khoi[0])]
    for i in range(1, len(khoi), 3):
        ra.append((int(khoi[i]), _chu(khoi[i + 1]).strip(), khoi[i + 2]))
    out = []
    for cap, ten, k in ra:
        doan = [re.sub(r"\s+", "", _chu(p)) for p in re.findall(r"<p[^>]*>(.*?)</p>", k, flags=re.S)]
        out.append((cap, ten, "\n".join(d for d in doan if d)))
    return out


def nap_sach(render: Path, ma: str) -> dict:
    ten_han, ten, quyen, mo_dau, truong, ghi = SACH[ma]
    thien, so = [], 0
    for q in quyen:
        muc = doc_quyen((render / f"{q}.html").read_text("utf-8"))
        # quyển đầu có thể chép sách khác trước — bắt đầu từ đề mục mang tên sách
        dau = next((i for i, (_, t, _v) in enumerate(muc) if t.startswith(mo_dau)), None)
        if dau is None:
            dau = 0 if q != quyen[0] else None
        if dau is None:
            raise ValueError(f"quyển {q}: không thấy đề mục {mo_dau}")
        tap = mo_dau
        for cap, t, van in muc[dau:]:
            # gặp đề mục cấp sách của sách khác → hết phần của sách
            if cap == 4 and t and not t.startswith(mo_dau):
                break
            if t.startswith(mo_dau):
                tap = t
                if not van:
                    continue
                t = ""
            if len(van) < 40:
                continue
            so += 1
            thien.append({"so": so, "quyen": q, "ten": f"{tap} · {t}" if t else tap, "van": van})
    return {"_nguon": f"{ten_han} ({ten}) — {ghi}. Chép trong 《欽定古今圖書集成》 (Cổ Kim Đồ Thư Tập Thành, 1725), "
                      f"博物彙編 · 藝術典 quyển {quyen[0]}–{quyen[-1]}. Cổ thư công cộng.",
            "ban": f"Wikisource tiếng Trung, trang {GOC}/第{quyen[0]:03d}卷 … 第{quyen[-1]:03d}卷 (gõ lại từ bản chụp in đồng "
                   f"1725, lấy {NGAY} qua action=render) — CHƯA đối chiếu bản chụp; đã BỎ chấm câu thời nay của "
                   "Wikisource (CC BY-SA, không phải của sách), chú nhỏ đặt trong 〔…〕, hình thay bằng 〔圖〕",
            "can_doi_chieu": True, "source_id": ma, "school_id": truong, "thien": thien}


if __name__ == "__main__":
    render = Path(sys.argv[1])
    for ma in SACH:
        d = nap_sach(render, ma)
        (NGUON / f"{ma}.json").write_text(json.dumps(d, ensure_ascii=False, indent=1) + "\n", "utf-8")
        print(ma, len(d["thien"]), "thiên,", sum(len(t["van"]) for t in d["thien"]), "chữ")
