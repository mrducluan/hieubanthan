# -*- coding: utf-8 -*-
"""Golden độ sáng sao lối Việt — ORACLE `lasotuvi` 0.1.2 (MIT, doanguyen; PyPI). Chỉ sinh golden, không chạy
runtime. Dùng:  pip download --no-deps lasotuvi==0.1.2 && giải nén wheel, rồi
    python fixtures/_generate_do_sang_golden.py <thư mục chứa gói lasotuvi> > fixtures/golden/do_sang_lasotuvi.json
"""
import ast
import json
import sys
from pathlib import Path

CHI = ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"]
MUC = {"M": "Miếu", "V": "Vượng", "Đ": "Đắc", "B": "Bình", "H": "Hãm"}
# tên lasotuvi (chữ thường) → tên trong engine (iztro vi-VN / vòng Bác sĩ)
TEN = {"tử vi": "Tử Vi", "liêm trinh": "Liêm Trinh", "thiên đồng": "Thiên Đồng", "vũ khúc": "Vũ Khúc",
       "thái dương": "Thái Dương", "thiên cơ": "Thiên Cơ", "thái âm": "Thái Âm", "tham lang": "Tham Lang",
       "cự môn": "Cự Môn", "thiên tướng": "Thiên Tướng", "thiên lương": "Thiên Lương", "thất sát": "Thất Sát",
       "phá quân": "Phá Quân", "đà la": "Đà La", "kình dương": "Kình Dương", "linh tinh": "Linh Tinh",
       "hỏa tinh": "Hỏa Tinh", "văn xương": "Văn Xương", "văn khúc": "Văn Khúc", "địa không": "Địa Không",
       "địa kiếp": "Địa Kiếp", "hóa kỵ": "Hóa Kỵ", "đại hao": "Đại Hao", "tiểu hao": "Tiểu Hao",
       "thiên khốc": "Thiên Khốc", "thiên hư": "Thiên Hư", "thiên mã": "Thiên Mã", "thiên hình": "Thiên Hình",
       "thiên riêu": "Thiên Diêu"}

src = (Path(sys.argv[1]) / "lasotuvi" / "DiaBan.py").read_text("utf-8")
i = src.index("maTranDacTinh = {") + len("maTranDacTinh = ")
j = src.index("}", src.index('"Thiên riêu"')) + 1
bang = ast.literal_eval(src[i:j])
out = {TEN[r[0].lower()]: {c: MUC.get(r[k + 1]) for k, c in enumerate(CHI)} for r in bang.values()}
print(json.dumps({"_oracle": "lasotuvi 0.1.2 (MIT, github.com/doanguyen/lasotuvi) — DiaBan.maTranDacTinh",
                  "bang": out}, ensure_ascii=False, indent=1))
