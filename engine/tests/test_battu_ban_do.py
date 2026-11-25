# -*- coding: utf-8 -*-
"""BD-1 — "Bản đồ lá số" Bát tự (`luangiai/battu_ban_do.py`): 8 chữ chạm được, mỗi ô bốn lớp nghĩa riêng của lá số.
Viết TRƯỚC hàm.

Hợp đồng:
- 8 ô (4 can, 4 chi), mỗi ô: là ai / việc gì (thập thần + người ứng theo giới + hai cách lấy dụng thần), nằm ở đâu
  (trụ + quãng tuổi QUY RA NĂM của chính người xem), đang nối với ô nào (quan hệ đã tính), năm nào trong 10 năm tới chạm
  tới (lưu niên đã tính), "Vì sao nói vậy" (thuật ngữ chỉ ở đây), chương báo cáo nói kỹ.
- Chỉ ĐỌC phép tính có sẵn (`battu`, `battu_mo_rong`, `battu_doi_song.phan_tich`) — không đổi mức, không lộ mức của
  chương trả phí (bản đồ không mang mức Thuận lợi / Cần lưu ý của năm tương lai).
- Lời không chung chung: mỗi câu lớp 1–3 chứa ít nhất một dữ kiện riêng của lá số (chữ, trụ, năm, %); lời cùng một ô của
  hai lá khác nhau không trùng hẳn.
- Quãng tuổi theo Tam Mệnh Thông Hội «年管十五…時管五十後»: trụ năm tới khoảng 15 tuổi, trụ giờ từ khoảng 50, hai trụ
  giữa chung quãng 16–49; câu sách là chuỗi con của kho nguồn.
- Chưa đủ 18 tuổi: không lớp vợ chồng / người yêu.
- Năm đã qua (lớp thời gian): chỉ năm hai cách đọc KHÁC nhau mới mang mức hai cách (để đối chiếu "Cách nào đúng với bạn");
  năm tới không mang mức.
"""
from __future__ import annotations

import datetime as dt
import json
import re
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.kb import sach_ghi
from app.luangiai import battu_ban_do as bd
from app.main import app

GOC = Path(__file__).resolve().parents[1]
XEM = dt.date(2026, 11, 25)
SINH = {"lich": dt.datetime(1990, 6, 15, 11, 30), "gioi_tinh": "nu"}        # Canh Ngọ · Nhâm Ngọ · Tân Hợi · Giáp Ngọ
THUAT_NGU = re.compile(r"Tỷ Kiên|Kiếp Tài|Thực Thần|Thương Quan|Thiên Tài|Chính Tài|Thất Sát|Chính Quan|Thiên Ấn|Chính Ấn|"
                       r"[Dd]ụng thần|[Nn]hật chủ|[Đđ]ại vận|[Ll]ưu niên|tàng can|[Tt]rường sinh|lục hợp|lục xung|tương hình|"
                       r"tự hình|lục hại|tương phá|ngũ hợp")
TU_DOA = re.compile(r"xui|xấu|tai hoạ|đại kỵ|chết|bệnh|ly hôn|khắc (vợ|chồng|con)|sẽ (bị|mất|gặp)", re.I)
MUC = {"thuan", "can_bang", "can_chu_dong"}


@pytest.fixture(scope="module")
def kq():
    return bd.lap(SINH, XEM)


def _o(kq, ma):
    return next(o for o in kq["o"] if o["ma"] == ma)


def test_hop_dong(kq):
    assert kq["phien_ban"] == "ban_do_1"
    assert [o["ma"] for o in kq["o"]] == ["c0", "c1", "c2", "c3", "z0", "z1", "z2", "z3"]
    assert [(o["can"] if o["hang"] == "can" else o["chi"]) for o in kq["o"]] == \
        ["Canh", "Nhâm", "Tân", "Giáp", "Ngọ", "Ngọ", "Hợi", "Ngọ"]
    for o in kq["o"]:
        assert o["hanh"] in {"Kim", "Mộc", "Thủy", "Hỏa", "Thổ"}
        assert o["la_gi"] and o["o_dau"] and o["vi_sao"]
        assert o["chuong"] in {"tong_quan", "su_nghiep", "tien_bac", "tinh_cam", "gia_dinh", "hoc_tap", "quan_he"}
        assert o["dung"] in {"them", "bot", "mot_them", "mot_bot", "nguoc", None}
    assert len(kq["tru"]) == 4 and 1 <= len(kq["noi_bat"]) <= 3


def test_o_nhat_chu_la_chinh_ban(kq):
    o = _o(kq, "c2")
    assert o["la_ban"] is True and o["chuong"] == "tong_quan"
    assert any("chính bạn" in c for c in o["la_gi"]) and any("36%" in c for c in o["la_gi"])   # thân nhược 36 %


def test_tang_can_va_nguoi(kq):
    o = _o(kq, "z2")                     # Hợi: tàng Nhâm (Thương Quan) + Giáp (Chính Tài)
    chu = " ".join(o["la_gi"])
    assert "Nhâm" in chu and "Giáp" in chu
    assert o["chuong"] == "tinh_cam" and any("bạn đời" in c for c in o["o_dau"])


def test_chi_lap_noi_bat(kq):
    nb = kq["noi_bat"][0]
    assert nb["ma"] == "chi_lap" and set(nb["o"]) == {"z0", "z1", "z3"} and "Ngọ" in nb["cau"]
    assert all(set(n["o"]) <= {o["ma"] for o in kq["o"]} for n in kq["noi_bat"])


def test_quan_he_hai_chieu(kq):
    z0, z1 = _o(kq, "z0"), _o(kq, "z1")
    assert any(n["o"] == "z1" for n in z0["noi_voi"]) and any(n["o"] == "z0" for n in z1["noi_voi"])
    for o in kq["o"]:
        for n in o["noi_voi"]:
            assert n["loai"] in {"hop", "xung", "hinh", "hai", "pha"} and n["cau"]
            assert (n["o"][0] == o["ma"][0])        # can nối can, chi nối chi


def test_tuoi_theo_sach_va_nam_that(kq):
    t = {x["i"]: x for x in kq["tru"]}
    assert (t[0]["tuoi_tu"], t[0]["tuoi_den"]) == (1, 15) and t[3]["tuoi_tu"] == 50 and t[3]["tuoi_den"] is None
    assert (t[1]["tuoi_tu"], t[1]["tuoi_den"]) == (16, 49) == (t[2]["tuoi_tu"], t[2]["tuoi_den"])
    assert t[0]["nam_tu"] == 1991 and t[0]["nam_den"] == 2005 and t[3]["nam_tu"] == 2040
    assert t[1]["dang_o"] and t[2]["dang_o"] and not t[0]["dang_o"] and not t[3]["dang_o"]       # 36 tuổi
    nguon = "".join(sach_ghi._chuoi(json.load(open(GOC / "fixtures/nguon/tam_menh_thong_hoi_du_bo.json", encoding="utf-8"))))
    for tr in kq["trich"]:
        assert sach_ghi.chuan(tr["han"]) in sach_ghi.chuan(nguon), tr["han"]


def test_nam_cham_muoi_nam_toi_khong_mang_muc(kq):
    for o in kq["o"]:
        for n in o["nam"]:
            assert XEM.year <= n["nam"] <= XEM.year + 10 and n["cau"]
            assert not set(n) & {"muc", "muc_cach_1", "muc_cach_2", "dc"}
    z2 = _o(kq, "z2")                               # Hợi: 2031 Hợi (trùng), 2025 Tỵ đã qua → không hiện
    assert any(n["nam"] == 2031 for n in z2["nam"])


def test_khong_thuat_ngu_khong_doa_ngoai_vi_sao(kq):
    for o in kq["o"]:
        for c in o["la_gi"] + o["o_dau"] + [n["cau"] for n in o["noi_voi"]] + [n["cau"] for n in o["nam"]]:
            assert not THUAT_NGU.search(c), c
            assert not TU_DOA.search(c), c
    for n in kq["noi_bat"]:
        assert not THUAT_NGU.search(n["cau"]) and not TU_DOA.search(n["cau"]), n["cau"]


def test_vi_sao_co_thuat_ngu(kq):
    assert any("Thương Quan" in c for c in _o(kq, "c1")["vi_sao"])
    assert any("Thất Sát" in c or "Đinh" in c for c in _o(kq, "z0")["vi_sao"])


def test_tre_em_khong_lop_vo_chong():
    kq = bd.lap({"lich": dt.datetime(2015, 3, 2, 9, 0), "gioi_tinh": "nam"}, XEM)
    for o in kq["o"]:
        chu = " ".join(o["la_gi"] + o["o_dau"] + [n["cau"] for n in o["noi_voi"]])
        assert not re.search(r"bạn đời|vợ|chồng|người yêu", chu), chu
    assert _o(kq, "z2")["chuong"] != "tinh_cam"


def test_loi_rieng_tung_la():
    """Cùng ô của hai lá khác nhau không trùng nguyên lời (luật 'không chung chung')."""
    ds = [bd.lap({"lich": dt.datetime(1960 + 3 * k, 1 + k % 12, 1 + (7 * k) % 27, (5 * k) % 24, 0),
                  "gioi_tinh": "nam" if k % 2 else "nu"}, XEM) for k in range(20)]
    for ma in ("c0", "c1", "c3", "z0", "z1", "z2", "z3"):
        loi = [" ".join(_o(k, ma)["la_gi"] + _o(k, ma)["o_dau"]) for k in ds]
        assert len(set(loi)) >= 18, ma


def test_moi_cau_co_du_kien_rieng(kq):
    """Mỗi câu lớp 1–3 nêu chữ / trụ / năm / % của chính lá số."""
    rieng = re.compile(r"Canh|Nhâm|Tân|Giáp|Ngọ|Hợi|Đinh|Kỷ|trụ (năm|tháng|ngày|giờ)|\d{4}|\d+%|Kim|Mộc|Thủy|Hỏa|Thổ")
    for o in kq["o"]:
        for c in o["la_gi"] + o["o_dau"] + [n["cau"] for n in o["noi_voi"]]:
            assert rieng.search(c), c


def test_thoi_gian_nam_qua_doi_chieu(kq):
    tg = kq["thoi_gian"]
    assert tg["nam_xem"] == 2026 and tg["luat"] == {"toi_thieu": 3, "chenh": 2}
    assert [x["ma"] for x in tg["lua_chon"]] == ["thuan", "can_bang", "can_chu_dong", "khong_nho"]
    nam = {x["nam"]: x for x in tg["nam"]}
    assert min(nam) == 1990 and max(nam) == 2036
    for n, x in nam.items():
        assert x["cau"] and x["dai_van"] is None or isinstance(x["dai_van"], int)
        if "dc" in x:                                     # chỉ năm đã qua, từ 16 tuổi, hai cách khác nhau
            m1, m2 = x["dc"]
            assert n < 2026 and n - 1990 >= 16 and m1 in MUC and m2 in MUC and m1 != m2
            assert x["ma"] == f"nam.{n}" and x["hoi"]
        if n >= 2026:
            assert "dc" not in x
        for ch in x["cham"]:
            assert ch["o"] in {"c0", "c1", "c2", "c3", "z0", "z1", "z2", "z3"} and ch["loai"] in {"hop", "xung", "hinh", "hai", "pha", "trung"}
    assert any("dc" in x for x in nam.values())
    assert len(tg["dai_van"]) == 8 and all(len(d["cham"]) >= 0 for d in tg["dai_van"])


def test_thoi_gian_khop_doi_chieu_cach():
    """Mức hai cách của năm đã qua trùng đúng mức `battu_doi_chieu` (một bộ tính)."""
    from app.luangiai import battu_doi_chieu as dc
    s = {"lich": dt.datetime(1990, 5, 17, 12, 30), "gioi_tinh": "nam"}
    x = dc.lap(s, dt.date(2026, 10, 21))
    nam = {n["ma"]: n for n in bd.lap(s, dt.date(2026, 10, 21))["thoi_gian"]["nam"] if "dc" in n}
    for c in x["cau"]:
        if c["loai"] == "nam":
            assert nam[c["ma"]]["dc"] == [c["cach_1"], c["cach_2"]]


def test_route():
    c = TestClient(app)
    r = c.post("/v1/battu/ban-do", json={"la_so": {"birth_date": "1990-06-15", "birth_time": "11:30", "gender": "nu",
                                                   "calendar_type": "duong"}, "ngay_xem": XEM.isoformat()})
    assert r.status_code == 200, r.text
    j = r.json()
    assert j["phien_ban"] == "ban_do_1" and len(j["o"]) == 8 and "engine_version" in j


def test_ngu_hanh_cho_hinh_nam_hanh(kq):
    nh = kq["ngu_hanh"]
    assert [x["hanh"] for x in nh] == ["Mộc", "Hỏa", "Thổ", "Kim", "Thủy"]
    assert 95 <= sum(x["phan_tram"] for x in nh) <= 105
    assert sum(x["so_chu"] for x in nh) == 8
    assert [x for x in nh if x["nhat_chu"]][0]["hanh"] == "Kim"
    assert [x for x in nh if x["nhieu"]][0]["hanh"] == "Hỏa"
    for x in nh:
        assert x["y"] and "{" not in x["y"]
        assert (x["dung"] is None) == (x["cau_dung"] is None)
    assert kq["suc"] == 36
    n = kq["thoi_gian"]["nam"][0]
    assert {"hanh_can", "hanh_chi"} <= set(n)
