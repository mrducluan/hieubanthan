# -*- coding: utf-8 -*-
"""KM-2 — lớp ghép lời Kỳ Môn (RULES) + route `/v1/ky-mon/*` + KB."""
import datetime as dt
import json
import re
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.calc import ky_mon as km
from app.calc import ky_mon_cach as kc
from app.kb import ky_mon_kb as kb
from app.kb import sach_ghi as sg
from app.luangiai import ky_mon as doc
from app.main import app

client = TestClient(app)
KB = json.loads((Path(__file__).parent.parent / "app" / "kb" / "data" / "ky_mon_kb.json").read_text("utf-8"))


def _moi_ban():
    for cuc in range(1, 10):
        for duong in (True, False):
            for g in range(60):
                b = km.ban_gio(cuc, duong, g)
                b["can_chi"] = {"ngay": f"{km.CAN[(g * 3 + cuc) % 10]} Tý", "gio": "x"}
                yield b


def test_kb_du_bo_va_khop_calc():
    assert {m["so"] for m in KB["cua"].values()} == set(km.CUA) and {m["so"] for m in KB["sao"].values()} == set(km.SAO)
    for m in KB["cua"].values():
        assert km.CUA[m["so"]] == m["ten"]
    for m in KB["sao"].values():
        assert km.SAO[m["so"]] == m["ten"]
    assert {ma: m["ten"] for ma, m in KB["than"].items()} == dict(km.THAN)
    assert {ma: m["ten_khac"] for ma, m in KB["than"].items() if "ten_khac" in m} == km.THAN_TEN_KHAC
    assert set(KB["cach"]) == set(kc.CACH) and set(KB["can"]) == set(km.CAN) - {"Giáp"}
    assert KB["source_id"] and KB["school_id"] == "ky_mon"
    for v in KB["viec"].values():
        assert v["cua"] and set(v["cua"]) <= set(KB["cua"])
    # ba cửa sách gọi là tốt: «開休生三門宜出其下»
    assert {ma for ma, m in KB["cua"].items() if m["loai"] == "cat"} == {"khai", "huu", "sinh"}
    assert {m["so"] for m in KB["cua"].values() if m["loai"] == "cat"} == set(kc.CUA_CAT)


def test_bac_sao_theo_cau_sach():
    """«時下得天輔天禽天心為上吉天任天衝為次吉天蓬天芮為大凶天柱天英為次凶»."""
    van = sg.van_nguon("ky_mon_co_kim_do_thu")
    assert "時下得天輔天禽天心為上吉天任天衝為次吉天蓬天芮為大凶天柱天英為次凶" in van
    bac = {m["han"][1]: m["bac"] for m in KB["sao"].values()}
    assert bac == {"輔": "thuong_cat", "禽": "thuong_cat", "心": "thuong_cat", "任": "thu_cat", "衝": "thu_cat",
                   "蓬": "dai_hung", "芮": "dai_hung", "柱": "thu_hung", "英": "thu_hung"}


def test_cau_trich_dung_cua_dung_sao():
    """Câu trích của cửa / sao nào phải mở đầu hoặc chứa đúng tên chữ Hán của cửa / sao ấy (trừ ba câu thơ không nêu tên)."""
    for m in KB["cua"].values():
        assert m["sach"]["han"].startswith(m["han"])
    khong_ten = {"bong", "cam", "tam"}
    for ma, m in KB["sao"].items():
        if ma not in khong_ten:
            assert m["han"] in m["sach"]["han"], ma
    # ba câu không nêu tên: phải nằm ngay sau dòng tên sao ấy trong thiên «釋九星所主»
    thien = next(t["van"] for t in json.loads((Path(__file__).parent.parent / "fixtures" / "nguon" / "ky_mon_co_kim_do_thu.json")
                                               .read_text("utf-8"))["thien"] if t["ten"].endswith("釋九星所主"))
    for ma in khong_ten:
        m = KB["sao"][ma]
        doan = sg.chuan(thien)[sg.chuan(thien).index(m["han"] + "星名"):]
        assert doan.index(m["sach"]["han"]) < 60, ma


def test_loi_viet_khong_tho_khong_phan():
    cam = re.compile(r"đại hung|đại cát|chắc chắn|sẽ (bị|gặp|mất|thành)|tai hoạ|xui|vận đen|bùa|cúng|hoá giải", re.I)
    def chu(x, bo=("han", "am", "_nguon")):
        if isinstance(x, dict):
            for k, v in x.items():
                if k not in bo:
                    yield from chu(v, bo)
        elif isinstance(x, str):
            yield x
    from app.kb import tuvi_doi_song_kb as kds
    cum = kds.cum_cam() + kds.cum_chung_chung()
    for t in chu(KB):
        assert not cam.search(t), t
        assert not [e for e in sg.kiem_loi(t)], t
    for t in chu(KB, bo=("han", "am", "_nguon", "dieu_kien")):          # điều kiện của cách = phần "Vì sao", được dùng thuật ngữ
        assert not kds.tim_cum_cam(t, cum), t


def test_luat_muc_tren_moi_ban():
    dem = {"thuan": 0, "binh": 0, "cham": 0}
    for b in _moi_ban():
        d = doc.doc_gio(b)
        tran = any(c["ma"] in doc.GIO_CHAM for c in d["cach_gio"])
        assert (d["gio"]["muc"] == "cham") == tran
        assert len(d["huong"]) == 8 and [h["cung"] for h in d["huong"]] == list(doc.THU_TU_HUONG)
        for h in d["huong"]:
            vuong = any(c["loai"] == "hung" for c in h["cach"])
            if h["muc"] == "thuan":
                assert h["cua"]["loai"] == "cat" and not vuong and not tran
            if h["cua"]["loai"] == "hung":
                assert h["muc"] == "cham" and not h["hop_viec"]
            if h["noi_bat"]:
                assert h["muc"] == "thuan" and any(c["loai"] == "cat" for c in h["cach"])
            assert not re.search(r"\d", h["tom"])                       # không điểm số
        assert d["huong_thuan"] == [h["phuong"] for h in sorted((h for h in d["huong"] if h["muc"] == "thuan"), key=lambda h: not h["noi_bat"])]
        dem[d["gio"]["muc"]] += 1
    assert dem["thuan"] > 300 and dem["cham"] > 300 and dem["binh"] > 5, dem      # ba mức đều có thật


def test_viec_chon_dung_cua_va_khong_chon_huong_cham():
    for i, b in enumerate(_moi_ban()):
        if i % 7:
            continue
        for viec, v in KB["viec"].items():
            d = doc.doc_gio(b, viec)
            x = d["viec"]
            assert x["ma"] == viec and x["loi"]
            if "cung" in x:
                h = next(h for h in d["huong"] if h["cung"] == x["cung"])
                assert h["cua"]["ma"] in v["cua"] and h["muc"] != "cham" and x["co"] == (h["muc"] == "thuan")
                assert h["phuong"] in x["loi"]
            else:
                assert not [h for h in d["huong"] if h["cua"]["ma"] in v["cua"] and h["muc"] != "cham"]


def test_tat_dinh():
    b = km.lap_ban(dt.datetime(2026, 11, 18, 10, 30))
    assert json.dumps(doc.doc_gio(b, "ky_ket"), ensure_ascii=False) == json.dumps(doc.doc_gio(b, "ky_ket"), ensure_ascii=False)
    assert doc.doc_ngay(dt.date(2026, 11, 18), viec="gap_go") == doc.doc_ngay(dt.date(2026, 11, 18), viec="gap_go")


def test_ngay_13_khung_va_gio_tot():
    n = doc.doc_ngay(dt.date(2026, 11, 18), viec="gap_go")
    assert [g["chi"] for g in n["gio"]] == ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi", "Tý"]
    assert n["gio"][0]["khung"] == "00:00–01:00" and n["gio"][5]["khung"] == "09:00–11:00" and n["gio"][-1]["khung"] == "23:00–24:00"
    tot = n["viec"]["gio_tot"]
    assert 1 <= len(tot) <= 4
    assert [g["ban_dem"] for g in tot] == sorted(g["ban_dem"] for g in tot)          # giờ thức đứng trước giờ đêm
    for g in tot:
        khung = next(x for x in n["gio"] if x["luc"] == g["luc"])
        assert khung["muc"] == "thuan" and g["phuong"] in khung["huong_thuan"] and g["phuong"] in g["loi"]


@pytest.mark.parametrize("viec", [None, "ky_ket"])
def test_route_ban(viec):
    r = client.post("/v1/ky-mon/ban", json={"thoi_diem": "2026-11-18T10:30", **({"viec": viec} if viec else {})})
    assert r.status_code == 200, r.text
    j = r.json()
    assert j["ban"]["cuc"] == 6 and j["ban"]["am_duong"] == "am" and j["ban"]["can_chi"] == {"ngay": "Bính Thân", "gio": "Quý Tỵ"}
    assert j["doc"]["gio"]["chi"] == "Tỵ" and len(j["doc"]["huong"]) == 8
    assert ("viec" in j["doc"]) == bool(viec)
    assert j["meta"]["school_id"] == "ky_mon" and j["tuy_chon"]["phep"] == "sach_bo"
    assert "kinqimen" not in r.text and "Wikisource" not in r.text and "wikisource" not in r.text      # BM-1


def test_route_mac_dinh_bay_gio_va_tri_nhuan_co_ghi_chu():
    j = client.post("/v1/ky-mon/ban", json={"phep": "tri_nhuan"}).json()
    assert j["tuy_chon"]["phep_ghi_chu"] and len(j["doc"]["huong"]) == 8


def test_route_ngay_va_danh_muc():
    j = client.post("/v1/ky-mon/ngay", json={"ngay": "2026-11-18", "viec": "di_xa"}).json()
    assert len(j["gio"]) == 13 and j["viec"]["ma"] == "di_xa" and j["viec"]["ranh_gioi"]
    d = client.get("/v1/ky-mon/danh-muc").json()
    assert (len(d["cua"]), len(d["sao"]), len(d["than"]), len(d["cach"]), len(d["viec"])) == (8, 9, 8, 21, 7)
    assert all(x["sach"] for x in d["cua"]) and all(x["sach"] for x in d["cach"])


@pytest.mark.parametrize("than", [{"thoi_diem": "1850-01-01T10:00"}, {"viec": "xo_so"}, {"utc": 7.1}, {"ten": "A"}])
def test_route_tu_choi_dau_vao_sai(than):
    assert client.post("/v1/ky-mon/ban", json=than).status_code == 422


def test_do_tin_co_ky_mon():
    from app.kb import do_tin
    assert do_tin.SO[kb.TEP]["mang"] == "kymon"


# ── KM-3: hướng hợp mệnh (Bát trạch) × hướng thuận của giờ ──────────────────────────────────────────────────
def test_huong_hop_menh_chi_danh_dau_va_tom_lai_khong_doi_muc():
    b = km.lap_ban(dt.datetime(2026, 11, 18, 10, 30))
    goc = doc.doc_gio(b)
    hop = ["Bắc", "Đông", "Nam", "Đông Nam"]
    d = doc.doc_gio(b, huong_hop=hop)
    assert [h["muc"] for h in d["huong"]] == [h["muc"] for h in goc["huong"]]          # không đổi mức nào
    assert {h["phuong"] for h in d["huong"] if h["hop_menh"]} == set(hop)
    x = d["hop_menh"]
    assert x["chung"] == [h["phuong"] for h in d["huong"] if h["hop_menh"] and h["muc"] == "thuan"] == ["Bắc"]
    assert "Bắc" in x["loi"] and not re.search(r"\d", x["loi"])
    assert "hop_menh" not in goc and all("hop_menh" not in h for h in goc["huong"])   # không gửi thì đầu ra như cũ


def test_huong_hop_menh_khong_co_huong_chung_va_dau_vao_la():
    b = km.lap_ban(dt.datetime(2026, 11, 18, 10, 30))
    d = doc.doc_gio(b, huong_hop=["Nam", "Đông"])
    assert d["hop_menh"]["chung"] == [] and d["hop_menh"]["loi"]
    with pytest.raises(ValueError):
        doc.doc_gio(b, huong_hop=["Trên"])


def test_ngay_co_huong_hop_menh_va_route():
    n = doc.doc_ngay(dt.date(2026, 11, 18), huong_hop=["Bắc", "Tây"])
    assert all("hop_menh" in g for g in n["gio"])
    for g in n["gio"]:
        assert set(g["hop_menh"]) <= set(g["huong_thuan"]) & {"Bắc", "Tây"}
    assert n["hop_menh"]["gio"] == [g["chi"] for g in n["gio"] if g["hop_menh"]][:len(n["hop_menh"]["gio"])]
    r = client.post("/v1/ky-mon/ban", json={"thoi_diem": "2026-11-18T10:30", "huong_hop": ["Bắc", "Đông"]})
    assert r.status_code == 200 and r.json()["doc"]["hop_menh"]["chung"] == ["Bắc"]
    assert client.post("/v1/ky-mon/ban", json={"huong_hop": ["Bắc"] * 9}).status_code == 422
    assert client.post("/v1/ky-mon/ngay", json={"ngay": "2026-11-18", "huong_hop": ["Lên"]}).status_code == 422
