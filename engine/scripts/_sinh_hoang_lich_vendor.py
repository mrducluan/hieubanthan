"""Sinh engine/app/calc/hoang_lich_vendor.py từ lunar_python (MIT) — chạy một lần, giữ nguyên văn bảng mã hoá."""
import sys
from lunar_python.util.LunarUtil import LunarUtil as U
out = sys.argv[1]
def r(x): return repr(x)
lines = [
"# -*- coding: utf-8 -*-",
'"""Bảng hoàng lịch (nghi/kỵ theo Hiệp kỷ biện phương thư, thần sát ngày, nhị thập bát tú, Bành Tổ bách kỵ).',
"",
"Chép NGUYÊN VĂN từ lunar-python 1.4.8 (https://github.com/6tail/lunar-python), giấy phép MIT:",
"",
"    MIT License — Copyright (c) 2020 6tail",
"    Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated",
"    documentation files (the \"Software\"), to deal in the Software without restriction, including without limitation",
"    the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to",
"    permit persons to whom the Software is furnished to do so, subject to the following conditions:",
"    The above copyright notice and this permission notice shall be included in all copies or substantial portions of",
"    the Software.",
"    THE SOFTWARE IS PROVIDED \"AS IS\", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE",
"    WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR",
"    COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR",
"    OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.",
"",
"KHÔNG sửa tay: sinh lại bằng engine/scripts/_sinh_hoang_lich_vendor.py. Tên Việt + nghĩa ở kb/data/hoang_lich_kb.json.",
"(Không dùng mã/dữ liệu AGPL — horosa, mingyu-core — xem CLAUDE.md.)",
'"""',
"",
f"JIA_ZI = {r(U.JIA_ZI)}",
f"YI_JI = {r(U._LunarUtil__YI_JI)}",
f"DAY_YI_JI = {r(U._LunarUtil__DAY_YI_JI)}",
f"SHEN_SHA = {r(U._LunarUtil__SHEN_SHA)}",
"DAY_SHEN_SHA = (",
*[f"    {r(x)}," for x in U._LunarUtil__DAY_SHEN_SHA],
")",
f"XIU = {r(U.XIU)}",
f"XIU_LUCK = {r(U.XIU_LUCK)}",
f"PENG_ZU_GAN = {r(U.PENG_ZU_GAN)}",
f"PENG_ZU_ZHI = {r(U.PENG_ZU_ZHI)}",
f"POSITION_XI = {r(U.POSITION_XI)}",
f"POSITION_CAI = {r(U.POSITION_CAI)}",
f"POSITION_YANG_GUI = {r(U.POSITION_YANG_GUI)}",
f"POSITION_YIN_GUI = {r(U.POSITION_YIN_GUI)}",
f"POSITION_FU_2 = {r(U.POSITION_FU_2)}",
f"POSITION_TAI_DAY = {r(U.POSITION_TAI_DAY)}",
"",
]
open(out, "w", encoding="utf-8").write("\n".join(lines))
print("ok", out)
