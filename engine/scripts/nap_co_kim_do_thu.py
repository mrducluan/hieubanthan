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
NGAY = "2026-11-15"
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
    s = re.sub(r"\{\{\{[^}]*\}\}\}", "", s)          # đề mục bản mẫu wiki chưa điền
    s = re.sub(r"\{\{[A-Za-z]+\|", "", s).replace("}}", "")   # bản mẫu wiki không mở được (vd {{Annotation|…)
    s = s.replace("〈", "〔").replace("〉", "〕")
    return _CHAM.sub("", s)


_KHOI = re.compile(r"<(div|table|style|ul|ol|dl|figure)\b[^>]*>(?:(?!<(?:div|table|style|ul|ol|dl|figure)\b)[\s\S])*?</\1>")


def _doan(k: str) -> list[str]:
    """Các đoạn chữ của một khối, ĐÚNG THỨ TỰ: mọi <p>…</p> (kể cả nằm trong khối khác) + chữ trần nằm ngoài mọi thẻ khối.

    Chữ trần: chỗ ngắt trang (`pagenum`) kèm biểu tượng «考證» (khảo chứng, div tuyệt đối) làm MediaWiki không bọc đoạn trong
    <p> — vd bài «猴口», «八方坑坎歌». Đọc riêng <p> thì rơi mất những đoạn ấy (lỗi WS-2, phải vá tay ở KT-NT3 / KT-PT1).
    Chú thích hình, bảng, CSS bản mẫu nằm TRONG thẻ khối → không lấy (như trước)."""
    k = re.sub(r"<span[^>]*class=\"pagenum[^\"]*\"[^>]*>.*?</span></span>", "", k, flags=re.S)
    # đề mục wiki gõ hỏng dạng «===<div><div style="float:left;">《呂純陽相賦》</div>…</div>===» → đề mục thật, xuống dòng riêng
    k = re.sub(r"={2,}\s*<div>\s*<div style=\"float:\s*left;?\">(.*?)</div>.*?<div style=\"clear:\s*both;?\"></div>\s*</div>\s*={2,}",
               lambda m: f"<p>==={m.group(1)}===</p>", k, flags=re.S)
    k = re.sub(r"<div style=\"position: ?absolute[^\"]*\">.*?</div>", "", k, flags=re.S)
    k = re.sub(r"<style\b[^>]*>.*?(?:</style>|$)", "", k, flags=re.S)     # CSS bản mẫu (có thể bị cắt ở licenseContainer)
    k = re.sub(r"<[^>]*$", "", k)                    # mẩu thẻ dở ở chỗ cắt trang (trước «licenseContainer»)
    k = re.sub(r"&lt;h[2-6]\b[^\n]*", "", k)        # đề mục wiki gõ hỏng, hiện ra thành chữ «<h3 …>» (vd «金花印紋»)
    doan: list[str] = []
    k = re.sub(r"<p[^>]*>(.*?)</p>", lambda m: (doan.append(m.group(1)), f"\x00{len(doan) - 1}\x00")[1], k, flags=re.S)
    while True:                                    # bỏ khối trong cùng trước, giữ dấu chỗ của <p> nằm bên trong
        moi = _KHOI.sub(lambda m: "".join(re.findall(r"\x00\d+\x00", m.group(0))), k)
        if moi == k:
            break
        k = moi
    ra = []
    for i, phan in enumerate(re.split(r"\x00(\d+)\x00", k)):
        ra.append(doan[int(phan)] if i % 2 else phan)
    return [x for x in ra if re.sub(r"\s+", "", _chu(x))]


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
        doan = [re.sub(r"\s+", "", _chu(p)) for p in _doan(k)]
        # người gõ đôi khi viết đề mục wiki liền trong đoạn («===剋父母===左偏損父…», «===論選擇第九〔〕») —
        # tách thành mục riêng để đề mục không lẫn vào chữ sách
        hien, dong = ten, []
        for d in (x for x in doan if x):
            for i, phan in enumerate(re.split(r"(={2,}[^=\n]+?={2,}|={2,}[^=\n]{1,24}?〔〕)", d)):
                if i % 2:
                    if dong or hien != ten:
                        out.append((cap, hien, "\n".join(dong)))
                    hien, dong = re.sub(r"=|〔〕", "", phan).strip(), []
                    cap = 3
                elif phan:
                    dong.append(phan)
        out.append((cap, hien, "\n".join(dong)))
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
        # mục lục đầu quyển: mỗi dòng «tên sách〔các mục〕»
        sach_khac = [k for k in re.findall(r"^([^〔〕\n]{2,16})〔", muc[0][2], flags=re.M) if not k.startswith(mo_dau)]
        tap, treo = mo_dau, ""
        for cap, t, van in muc[dau:]:
            # gặp đề mục mang tên một sách KHÁC trong mục lục đầu quyển → hết phần của sách (chú thích hình
            # cũng là đề mục cấp 4 nên không dừng theo cấp đề mục)
            if t and any(t.startswith(k) for k in sach_khac):
                break
            if t.startswith(mo_dau):
                tap = t
                if not van:
                    continue
                t = ""
            # giữ mọi mục có chữ: câu ca, khẩu quyết của sách thường chỉ một hai dòng; đề mục không có chữ
            # riêng (tên thiên, chữ ở mục con) thì gắn vào tên mục ngay sau để không mất tên thiên
            if not van:
                treo = t or treo
                continue
            if treo:
                t, treo = f"{treo} / {t}" if t else treo, ""
            so += 1
            thien.append({"so": so, "quyen": q, "ten": f"{tap} · {t}" if t else tap, "van": van})
    return {"_nguon": f"{ten_han} ({ten}) — {ghi}. Chép trong 《欽定古今圖書集成》 (Cổ Kim Đồ Thư Tập Thành, 1725), "
                      f"博物彙編 · 藝術典 quyển {quyen[0]}–{quyen[-1]}. Cổ thư công cộng.",
            "ban": f"Wikisource tiếng Trung, trang {GOC}/第{quyen[0]:03d}卷 … 第{quyen[-1]:03d}卷 (gõ lại từ bản chụp in đồng "
                   f"1725, lấy {NGAY} qua action=render) — CHƯA đối chiếu bản chụp; đã BỎ chấm câu thời nay của "
                   "Wikisource (CC BY-SA, không phải của sách), chú nhỏ đặt trong 〔…〕, hình thay bằng 〔圖〕; bộ nạp đọc cả "
                   "chữ trần ngoài <p> (bản WS-2 làm rơi ~25 đoạn, sửa 2026-11-15)",
            "can_doi_chieu": True, "source_id": ma, "school_id": truong, "thien": thien}


if __name__ == "__main__":
    render = Path(sys.argv[1])
    for ma in SACH:
        d = nap_sach(render, ma)
        (NGUON / f"{ma}.json").write_text(json.dumps(d, ensure_ascii=False, indent=1) + "\n", "utf-8")
        print(ma, len(d["thien"]), "thiên,", sum(len(t["van"]) for t in d["thien"]), "chữ")
