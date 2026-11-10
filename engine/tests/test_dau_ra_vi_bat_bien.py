# -*- coding: utf-8 -*-
"""EN-ALL — bản tiếng Việt KHÔNG ĐỔI MỘT BYTE: 10.425 lượt gọi cố định (40 hồ sơ × mọi route + toàn bộ kho câu hỏi) so băm
với `fixtures/golden/dau_ra_vi/` chụp TRƯỚC đợt chuyển thể tiếng Anh (`scripts/chup_dau_ra.py`).

Chạy trong tiến trình con với PYTHONHASHSEED=0 (vài danh sách của engine dựng từ `set`, thứ tự theo hạt băm tiến trình) —
~3 phút. Lệch = hồi quy bản Việt → sửa MÃ, không sinh lại golden (chỉ sinh lại khi cố ý đổi lời tiếng Việt, ghi lý do
trong PR). Xem khác chỗ nào: `PYTHONPATH=. python scripts/chup_dau_ra.py --xem <mã>` rồi so với `mau.json.gz`.
Bỏ qua nhanh khi lặp test khác: `DAU_RA_BO_QUA=1`."""
import os
import subprocess
import sys
from pathlib import Path

import pytest

GOC = Path(__file__).resolve().parents[1]


@pytest.mark.skipif(os.environ.get("DAU_RA_BO_QUA") == "1", reason="DAU_RA_BO_QUA=1")
def test_dau_ra_tieng_viet_khong_doi():
    env = {**os.environ, "PYTHONHASHSEED": "0", "PYTHONPATH": str(GOC)}
    env.pop("OPENROUTER_API_KEY", None)
    r = subprocess.run([sys.executable, str(GOC / "scripts" / "chup_dau_ra.py"), "--so"], cwd=GOC, env=env,
                       capture_output=True, text=True, timeout=1500)
    assert r.returncode == 0, "Đầu ra tiếng Việt đã đổi so với golden:\n" + r.stdout[-4000:] + r.stderr[-1500:]
