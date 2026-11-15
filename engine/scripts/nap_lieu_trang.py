# -*- coding: utf-8 -*-
"""KT-NT4 (2026-11-14) — nạp «柳莊相法» (Liễu Trang tướng pháp, Viên Trung Triệt, đời Minh) vào kho nguồn.

Nguồn chữ: bản gõ của người dùng trên Chinese Text Project (wiki res=648356), chủ dự án đã tải về trong database
"physiognomy-kb" (bảng text_sections, book_code = YLZ_QING, source_method = digital_edition).

    cd engine && PYTHONPATH=. .venv/bin/python scripts/nap_lieu_trang.py <đường dẫn physiognomy_kb.sqlite>

Quy tắc kho nguồn (như Thần Tướng Toàn Biên): chỉ giữ CHỮ, bỏ dấu câu (dấu câu do người gõ thêm). Bản gõ lẫn một ít chữ
giản thể (准, 克…) — giữ nguyên như nguồn, đếm vào `chu_gian` từng mục. Đối chiếu với 27 trang máy đọc từ bản khắc
Quang Tự 15 (1889) trong cùng database: cùng một sách, khoảng 44 % cụm 6 chữ trùng từng chữ (dị bản + lỗi đọc) → cả kho
mang cờ `can_doi_chieu`.
"""
from __future__ import annotations

import json
import re
import sqlite3
import sys
from pathlib import Path

from app.kb import sach_ghi as sg

RA = Path(__file__).resolve().parents[1] / "fixtures" / "nguon" / "lieu_trang_tuong_phap.json"
_SO = re.compile(r"^[一二三四五六七八九十百零〇0-9]+[、．.]\s*")
_GIAN = "为这们说话过还后来对时会发现样经开关问题见门东车马长风云电爱万与专业两严个丰临举义乌乐习乡书买乱争亏产亲仅从众优传伤伦体余儿党兰兴养兽内册写军农冲决况净凤击划则刚创别剂剑剧劝办务动劳势区医华协单卖卫厂厅历厉压厌县参双变叙号叹听吴员团园围图圆圣场坏块坚处备复够头夸夹夺奋奖妇妈孙学宁宝实审宪宫宽宾寻导寿将尔尘尝层岁岂岛岭币帅师帐带帮库应庙废广庆准"
_QUYEN = (("上冊", "thuong", "Quyển thượng"), ("中冊", "trung", "Quyển trung — Vĩnh Lạc bách vấn"), ("下冊", "ha", "Quyển hạ"))


def main(db: str) -> None:
    c = sqlite3.connect(f"file:{db}?mode=ro", uri=True)
    rows = c.execute(
        "select juan, title_zh, classical_zh_text from text_sections "
        "where book_code='YLZ_QING' and source_method='digital_edition' order by rowid").fetchall()
    quyen = []
    for khoa, ma, ten in _QUYEN:
        muc = []
        for juan, tieu_de, van in rows:
            if not (juan or "").startswith(khoa):
                continue
            v = sg.chuan(van)
            t = sg.chuan(_SO.sub("", tieu_de or ""))
            if len(v) < 8:
                continue
            muc.append({"ten": t, "van": v, **({"chu_gian": n} if (n := sum(v.count(ch) for ch in _GIAN)) else {})})
        quyen.append({"ma": ma, "ten": ten, "han": khoa, "muc": muc})
    d = {
        "_mo_ta": "柳莊相法 — Liễu Trang tướng pháp (Viên Trung Triệt, đời Minh). Chỉ giữ chữ, không dấu câu.",
        "ban": "Bản gõ trên Chinese Text Project (wiki res=648356), đối chiếu sơ bộ với bản khắc Quang Tự 15 (1889)",
        "can_doi_chieu": True,
        "ghi_chu": "Bản gõ lẫn một ít chữ giản thể (đếm ở `chu_gian`). Khoảng 44 % cụm 6 chữ trùng từng chữ với 27 trang "
                   "đọc từ bản khắc 1889 — cùng một sách, chưa hiệu đính từng chữ.",
        "quyen": quyen,
    }
    RA.write_text(json.dumps(d, ensure_ascii=False, indent=1) + "\n", "utf-8")
    print(RA.name, [(q["ma"], len(q["muc"]), sum(len(m["van"]) for m in q["muc"])) for q in quyen])


if __name__ == "__main__":
    main(sys.argv[1])
