"""Link cuối bài ("Đọc tiếp", trang con, "Xem thêm") của MỌI trang kiến thức — cả bản Việt lẫn Anh:
tiêu đề không trống, không phải mã thô (vd `thien_dinh`), trỏ tới trang có thật, không tự trỏ về chính mình."""
import re

import pytest

from app import ngon_ngu
from app.kb import trang


@pytest.mark.parametrize("nn", ["vi", "en"])
def test_link_cuoi_bai_hop_le(nn):
    with ngon_ngu.dung(nn):
        ml = trang.danh_sach()
        co = {(x["loai"], x["slug"]) for x in ml}
        loi = []
        for x in ml:
            t = trang.lay(x["loai"], x["slug"])
            assert t, (nn, x)
            ds = (t["lien_quan"] + (t.get("trang_con") or {}).get("ds", []) + (t.get("trang_con_hoa") or {}).get("ds", [])
                  + [y for m in t["muc"] for y in m.get("xem_them", [])])
            for l in ds:
                tt = l.get("tieu_de") or ""
                if not tt or re.fullmatch(r"[a-z0-9]+(_[a-z0-9]+)+", tt):
                    loi.append((x["slug"], "tieu_de", l))
                elif (l["loai"], l["slug"]) not in co:
                    loi.append((x["slug"], "dich_khong_co", l))
                elif (l["loai"], l["slug"]) == (t["loai"], t["slug"]):
                    loi.append((x["slug"], "tu_tro", l))
        assert not loi, loi[:5]
