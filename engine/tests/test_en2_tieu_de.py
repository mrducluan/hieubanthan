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


@pytest.mark.parametrize("td, nd", [
    ("Bạn biết tự làm mình dịu lại bằng những thứ nhỏ như nhạc",
     "Bạn biết tự làm mình dịu lại bằng những thứ nhỏ như nhạc, cây cỏ, một buổi đi dạo một mình sau giờ làm, "
     "hay một cuốn sách đọc dở từ lâu."),
    ("Bạn hợp việc dịch vụ", "Bạn hợp việc dịch vụ, chăm sóc, giáo dục, môi trường ổn định và có người cùng làm lâu "
                             "dài với mình, không phải đổi chỗ liên tục."),
    ("Ra ngoài", "Ra ngoài, bạn lúc đầu dè dặt nhưng quen rồi thì rất được việc."),
    ("Có người giúp", "Có người giúp, nhất là khi mới đến một nơi lạ; nên chủ động hỏi đường."),
])
def test_khong_cat_sau_dau_phay(td, nd):
    """Review EN-2: sau tiêu đề là dấu phẩy → không cắt (thân sẽ là mẩu câu). Trọn câu ≤ 130 làm tiêu đề; dài hơn thì
    giữ trọn câu trong thân."""
    from app.luangiai.doi_song_khuon import tach_tieu_de
    t, n = tach_tieu_de(td, nd)
    cau = nd.split(". ")[0].rstrip(".")
    assert t == cau or n.startswith(td), (t, n)


def test_cat_tai_ranh_gioi_ve():
    from app.luangiai.doi_song_khuon import tach_tieu_de
    nd = ("Tiền vào đều tay: lương ổn, thêm một khoản phụ nếu bạn chịu giữ thói quen ghi chép thu chi hằng tuần và "
          "không vay nóng.")
    t, n = tach_tieu_de("Tiền vào đều tay", nd)
    assert t == "Tiền vào đều tay" and n.startswith("Lương ổn")


def test_tren_la_that_khong_cat_sau_dau_phay(monkeypatch):
    from app.luangiai import doi_song_khuon as kh, toan_bo
    goc, rec = kh.tach_tieu_de, []

    def spy(t, n):
        r = goc(t, n)
        rec.append((t, " ".join((n or "").split()), r))
        return r
    monkeypatch.setattr(kh, "tach_tieu_de", spy)
    for d, ti, g in ((dt.date(1990, 5, 15), 4, "nam"), (dt.date(1998, 3, 14), 5, "nu"), (dt.date(1975, 11, 2), 9, "nam")):
        toan_bo.tuvi({"ngay": d, "ti": ti, "gioi_tinh": g}, ngay_xem=dt.date(2026, 10, 21))
        toan_bo.battu({"lich": dt.datetime(d.year, d.month, d.day, ti * 2), "gioi_tinh": g}, ngay_xem=dt.date(2026, 10, 21))
    loi = []
    for t, n, (t2, n2) in rec:
        tt = t.strip().rstrip(".!?…:; ")
        if len(tt) >= 4 and n.lower().startswith(tt.lower()) and t2.rstrip(".") == tt and n2 != n \
                and n[len(tt):].lstrip()[:1] == ",":
            loi.append((t2, n2[:60]))
    assert rec and not loi, loi[:5]
