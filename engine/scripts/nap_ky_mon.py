# -*- coding: utf-8 -*-
"""KM-0 — nạp phần 奇門遁甲 (Kỳ Môn Độn Giáp) của 《欽定古今圖書集成》 (1725), 博物彙編 · 藝術典 · 術數部 quyển 703–714
(+ hai mục tổng luận ở quyển 745) vào kho nguồn `ky_mon_co_kim_do_thu.json`.

Trong 12 quyển ấy bộ loại thư chép: 煙波釣叟歌句解 (703–704), 景祐遁甲符應經纂 (705 — sách đời Tống của Dương Duy Đức),
遁甲穿壬 (706), các bài đoán theo cửa / sao / kỳ nghi và các mục «占…» (707), 凡例 · 口訣 · 閏奇超神接氣直指 · 諸格 (708),
BẢNG ĐỦ 18 cục × 60 giờ (709–712: trực phù, trực sử, cửa, cách cục từng giờ) và 日家奇門 (713–714).

Dùng lại bộ đọc `nap_co_kim_do_thu.doc_quyen` (bỏ chấm câu thời nay của Wikisource — CC BY-SA, không phải của sách).
Trang tải bằng `index.php?title=欽定古今圖書集成/博物彙編/藝術典/第NNN卷&action=render`, lưu `NNN.html`:
    python scripts/nap_ky_mon.py /thu/muc/render
Sách Tứ khố 遁甲演義 (KR3g0048) nạp bằng `nap_menh_ly_tu_kho.py don_giap_dien_nghia`.
Kho nguồn trước, lời sau: chưa có KB / phép tính nào dùng. Phần bùa chú, phép trận chỉ để đối chiếu, KHÔNG ra lời.
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

from nap_co_kim_do_thu import GOC, doc_quyen

NGUON = Path(__file__).resolve().parent.parent / "fixtures" / "nguon"
NGAY = "2026-11-18"
MA = "ky_mon_co_kim_do_thu"
QUYEN = range(703, 715)
TONG_LUAN = (745, ("奇門遁甲總敘", "奇門布局法"))   # 《圖書編》 (Chương Hoàng, Minh) chép ở phần 總論


def _quyen(render: Path, q: int) -> tuple[str, list[tuple[str, str]]]:
    muc = doc_quyen((render / f"{q}.html").read_text("utf-8"))
    ml = "".join(muc[0][2].split("\n")[3:-1])                 # dòng «奇門遁甲〔…〕» của mục lục đầu quyển
    tap = "日家奇門" if "日家奇門" in ml else "奇門遁甲"
    ra, treo = [], ""
    for _cap, t, van in muc[1:]:
        if not van:
            if t and t != tap:
                treo = t
            continue
        if treo:
            t, treo = (f"{treo} / {t}" if t and t != treo else treo), ""
        # bản mẫu wiki thụt dòng «{{padding-left|1em|…» còn sót ở bảng 18 cục (bộ đọc chung chỉ mở bản mẫu tên chữ cái)
        van = re.sub(r"\{\{padding-left\|[0-9.]+em\|", "", van)
        ra.append((f"{tap} · {t}" if t else tap, van))
    return ml, ra


def nap(render: Path) -> dict:
    thien, muc_luc = [], {}
    for q in QUYEN:
        ml, ds = _quyen(render, q)
        muc_luc[str(q)] = ml
        for ten, van in ds:
            thien.append({"so": len(thien) + 1, "quyen": q, "ten": ten, "van": van})
    q, ten_muc = TONG_LUAN
    for cap, t, van in doc_quyen((render / f"{q}.html").read_text("utf-8")):
        if t in ten_muc and van:
            thien.append({"so": len(thien) + 1, "quyen": q, "ten": f"圖書編 · {t}", "van": van})
    return {"_nguon": "奇門遁甲 (Kỳ Môn Độn Giáp) — phần Kỳ Môn của 《欽定古今圖書集成》 (Cổ Kim Đồ Thư Tập Thành, 1725), "
                      f"博物彙編 · 藝術典 · 術數部 quyển {QUYEN[0]}–{QUYEN[-1]}: 煙波釣叟歌句解, 景祐遁甲符應經纂, 遁甲穿壬, bảng 18 cục, "
                      "日家奇門; kèm hai mục tổng luận quyển 745. Cổ thư công cộng.",
            "ban": f"Wikisource tiếng Trung, trang {GOC}/第{QUYEN[0]}卷 … 第{QUYEN[-1]}卷 (gõ lại từ bản chụp in đồng 1725, lấy {NGAY} "
                   "qua action=render) — CHƯA đối chiếu bản chụp; đã BỎ chấm câu thời nay của Wikisource (CC BY-SA, không phải "
                   "của sách), chú nhỏ đặt trong 〔…〕, hình thay bằng 〔圖〕 (chữ trong hình bàn không có)",
            "can_doi_chieu": True, "source_id": MA, "school_id": "ky_mon", "muc_luc": muc_luc, "thien": thien}


if __name__ == "__main__":
    d = nap(Path(sys.argv[1]))
    (NGUON / f"{MA}.json").write_text(json.dumps(d, ensure_ascii=False, indent=1) + "\n", "utf-8")
    print(MA, len(d["thien"]), "mục,", sum(len(t["van"]) for t in d["thien"]), "chữ")
