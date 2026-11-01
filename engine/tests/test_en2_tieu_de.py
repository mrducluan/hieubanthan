# -*- coding: utf-8 -*-
"""EN-2 (ND-3) — hộp không bị "cắt đôi câu": tiêu đề dừng giữa câu thì thân bắt đầu bằng mẩu câu ("Giáo dục, y tế…",
"Rồi tranh cãi khi…"). Luật mới: câu đầu của thân đủ ngắn (≤ 90 ký tự) → tiêu đề = trọn câu đầu, thân = các câu sau;
câu đầu dài mới cắt theo luật cũ. Không sinh chữ mới, mã kiểm chứng giữ nguyên."""
import datetime as dt
import re

import pytest

from app.calc import tuvi_an_sao as az
from app.luangiai import doi_song_khuon as kh, toan_bo


def test_cau_ngan_tieu_de_tron_cau():
    t, n = kh.tach_tieu_de("Bạn hợp những việc cần uy tín",
                           "Bạn hợp những việc cần uy tín, giáo dục, y tế, hành chính. Nên giữ chữ tín từ việc nhỏ.")
    assert t == "Bạn hợp những việc cần uy tín, giáo dục, y tế, hành chính"
    assert n == "Nên giữ chữ tín từ việc nhỏ."


def test_cau_trung_tieu_de():
    assert kh.tach_tieu_de("Bạn điềm tĩnh", "Bạn điềm tĩnh. Ít khi nóng vội.") == ("Bạn điềm tĩnh", "Ít khi nóng vội.")


def test_tieu_de_khong_phai_dau_than_giu_nguyen():
    assert kh.tach_tieu_de("Điểm mạnh về tiền", "Bạn biết giữ của.") == ("Điểm mạnh về tiền", "Bạn biết giữ của.")


SINH = [(dt.date(1979, 2, 14), 20, "nu"), (dt.date(1990, 5, 15), 8, "nam"), (dt.date(2001, 6, 5), 17, "nam"),
        (dt.date(1965, 3, 12), 9, "nam"), (dt.date(1998, 4, 4), 11, "nu")]
TU_NOI_DAU = re.compile(r"^(và|nhưng|hay|rồi|mà|hoặc)\b", re.I)   # "Khi…", "Để…" mở câu mới hợp lệ


@pytest.mark.parametrize("d,h,g", SINH)
def test_than_hop_khong_mo_dau_bang_manh_cau(d, h, g):
    bc = toan_bo.tuvi({"ngay": d, "ti": az.time_index(h, 0), "gioi_tinh": g, "tz_lich": 7.0, "hoa_linh": "viet",
                       "thang_nhuan": "thang_sau", "lich": "viet"}, ngay_xem=dt.date(2026, 11, 1))
    sai = []
    for c in bc["chuong"]:
        for x in c.get("hop") or []:
            n = (x.get("noi_dung") or "").strip()
            dau = re.split(r"(?<=[.!?])\s", n, maxsplit=1)[0] if n else ""
            # mảnh câu: mở bằng từ nối, hoặc câu đầu không có dấu chấm câu riêng mà ngắn dưới 4 từ
            if TU_NOI_DAU.match(n) or (dau and len(dau.split()) < 3 and dau.endswith(".")):
                sai.append((x["tieu_de"], n[:80]))
    assert not sai, sai
