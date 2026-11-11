# -*- coding: utf-8 -*-
"""HTT-1 — lớp "Điểm giao thoa từ điều bạn đã xác nhận" (luangiai/giao_thoa.py): tất định từ MÃ hộp, ba luật A/B/C, không lặp
nét đã phủ nhận, tiếng Anh không sót chữ Việt, mã hộp qua regex SQL `doi_song`. Viết trước hàm."""
from __future__ import annotations

import json
import re

from fastapi.testclient import TestClient

from app import ngon_ngu
from app.luangiai import doi_song_khuon as kh
from app.luangiai import giao_thoa
from app.main import app

client = TestClient(app)
_SQL_DOI_SONG = re.compile(r"^ds\.[a-z0-9_]+(\.[a-z0-9_+-]+)+$")
_VI = re.compile(r"[ăâđêôơưĂÂĐÊÔƠƯàáảãạằắẳẵặầấẩẫậèéẻẽẹềếểễệìíỉĩịòóỏõọồốổỗộờớởỡợùúủũụừứửữựỳýỷỹỵ]")

D = lambda ma: {"ma": ma, "ket_qua": "dung"}          # noqa: E731
C = lambda ma: {"ma": ma, "ket_qua": "chua_dung"}     # noqa: E731


def test_phan_tich_ma_cac_mon():
    assert giao_thoa.phan_tich_ma("ds.su_nghiep.thien_co.sang.manh") == {"ma": "ds.su_nghiep.thien_co.sang.manh", "mon": "tuvi", "chuong": "su_nghiep", "mang": "cong_viec", "muc": None}
    assert giao_thoa.phan_tich_ma("ds.bt.tien_bac.chinh_tai.can_chu_dong.hien_tai")["mon"] == "battu"
    assert giao_thoa.phan_tich_ma("ds.bt.tien_bac.chinh_tai.can_chu_dong.hien_tai")["muc"] == "can_chu_dong"
    assert giao_thoa.phan_tich_ma("ds.nhantuong.cong_viec_tien.x")["mang"] == "cong_viec"
    assert giao_thoa.phan_tich_ma("ds.chan_dung.suc_khoe.cung.thuan.3") == {"ma": "ds.chan_dung.suc_khoe.cung.thuan.3", "mon": "chan_dung", "chuong": "suc_khoe", "mang": "suc_khoe", "muc": "thuan"}
    assert giao_thoa.phan_tich_ma("ds.tarot.tra_loi.co.x")["mang"] == "cau_hoi"
    assert giao_thoa.phan_tich_ma("ds.kinhdich.chuyen_viec.cot_loi.q1.can_bang")["mang"] == "cau_hoi"
    assert giao_thoa.phan_tich_ma("ds.tuvi_la.chuong_la.x")["mang"] is None          # chương lạ → không gán mảng, vẫn có môn
    assert giao_thoa.phan_tich_ma("ds.giao_thoa.cong_viec.mon.thuan.2") is None       # không ăn mã của chính mình
    assert giao_thoa.phan_tich_ma("hn.chi.tam_hop.nguoi_yeu") is None and giao_thoa.phan_tich_ma("ds") is None


def test_chua_du_hai_hop():
    kq = giao_thoa.lap([D("ds.su_nghiep.thien_co.sang.manh")])
    assert kq["du"] is False and kq["hop"] == [] and "ít nhất hai" in kq["tom_tat"] and kq["so_dung"] == 1


def test_luat_a_cung_mang_hai_mon_cung_muc():
    kq = giao_thoa.lap([D("ds.su_nghiep.thien_co.sang.thuan"), D("ds.bt.su_nghiep.chinh_quan.thuan.hien_tai")])
    assert kq["du"] and len(kq["hop"]) == 1
    h = kq["hop"][0]
    assert h["ma_mau"] == "ds.giao_thoa.cong_viec.mon.thuan.2" and h["loai"] == "diem_manh" and h["muc"] == "thuan"
    assert "Tử vi và Bát tự" in h["tieu_de"] and "Công việc" in h["tieu_de"] and h["phai"] == "giao_thoa_1"
    assert "ds.su_nghiep.thien_co.sang.thuan" in h["can_cu"][0]
    assert "Công việc" in kq["tom_tat"] and kq["mang"][0]["mon"] == ["tuvi", "battu"]


def test_luat_a_khac_muc_la_moi_cach_mot_mat():
    kq = giao_thoa.lap([D("ds.tien_bac.vu_khuc.thuan"), D("ds.bt.tien_bac.chinh_tai.can_chu_dong.hien_tai")])
    h = kq["hop"][0]
    assert h["ma_mau"] == "ds.giao_thoa.tien_bac.mon.hon_hop.2" and "mỗi cách một mặt" in h["tieu_de"] and "muc" not in h
    assert "Tử vi thuận" in h["noi_dung"] and "Bát tự cần chủ động" in h["noi_dung"]


def test_luat_a_khong_ro_muc():
    kq = giao_thoa.lap([D("ds.suc_khoe.tat_ach.x"), D("ds.nhantuong.suc_khoe.sac_tong")])
    assert kq["hop"][0]["ma_mau"] == "ds.giao_thoa.suc_khoe.mon.khong_ro.2"


def test_luat_b_cung_mon_nhieu_mang_cung_muc():
    kq = giao_thoa.lap([D("ds.su_nghiep.a.thuan"), D("ds.tien_bac.b.thuan"), D("ds.gia_dinh.c.can_chu_dong")])
    ma = {h["ma_mau"] for h in kq["hop"]}
    assert "ds.giao_thoa.tuvi.mang.thuan.2" in ma and len(ma) == 1          # cần chủ động chỉ một mảng → không có hộp
    h = kq["hop"][0]
    assert "việc và tiền" in h["noi_dung"] and h["loai"] == "diem_manh"
    assert "trong cùng một cách xem chúng nghiêng về một hướng" in kq["tom_tat"]      # tóm tắt riêng cho luật B
    kq2 = giao_thoa.lap([D("ds.su_nghiep.a.thuan"), D("ds.gia_dinh.c.can_chu_dong")])
    assert kq2["hop"] == [] and "chưa có mảng nào được hai cách xem cùng nói" in kq2["tom_tat"]


def test_luat_c_mang_vua_dung_vua_chua_dung():
    kq = giao_thoa.lap([D("ds.tinh_cam.a.thuan"), D("ds.su_nghiep.b.thuan"), C("ds.bt.tinh_cam.x.vap"), C("ds.tinh_cam.c.sang")])
    lech = [h for h in kq["hop"] if h["ma_mau"].endswith(".lech")]
    assert len(lech) == 1 and lech[0]["ma_mau"] == "ds.giao_thoa.tinh_cam.lech"
    assert "Tử vi (1 hộp)" in lech[0]["noi_dung"] and "Bát tự (1 hộp)" in lech[0]["noi_dung"] and "Tử vi (1 hộp)" in lech[0]["noi_dung"]
    # Hộp chưa đúng KHÔNG được tính vào luật A/B.
    assert all(not h["ma_mau"].startswith("ds.giao_thoa.tinh_cam.mon") for h in kq["hop"])


def test_ca_nhan_gop_vao_phien_thang():
    kq = giao_thoa.lap([D("ds.su_nghiep.a.thuan")], ca_nhan={"ds.bt.su_nghiep.b.thuan": "dung", "ds.su_nghiep.a.thuan": "chua_dung"})
    assert kq["so_dung"] == 2 and kq["hop"][0]["ma_mau"] == "ds.giao_thoa.cong_viec.mon.thuan.2"


def test_ma_hop_qua_regex_sql_va_khong_cum_cam():
    kq = giao_thoa.lap([D("ds.su_nghiep.a.thuan"), D("ds.bt.su_nghiep.b.thuan"), D("ds.tien_bac.c.thuan"), D("ds.bt.tinh_cam.d.can_chu_dong"),
                        D("ds.tinh_cam.e.can_chu_dong"), C("ds.nhantuong.tinh_cam_gia_dinh.f")])
    from app.kb.tuvi_doi_song_kb import tim_cum_cam  # noqa: PLC0415 — so trọn từ như kiem_giong_van ("khung" ≠ "hung")
    cam = kh.cum_cam_chung()
    for h in kq["hop"]:
        assert _SQL_DOI_SONG.match(h["ma_mau"]) and len(h["ma_mau"]) <= 60, h["ma_mau"]
        van = " ".join([h["tieu_de"], h["noi_dung"], h.get("huong_xu_ly", "")])
        assert tim_cum_cam(van, cam) == [], (tim_cum_cam(van, cam), van)
    assert len(kq["hop"]) >= 3


def test_tieng_anh_khong_sot_chu_viet():
    with ngon_ngu.dung("en"):
        kq = giao_thoa.lap([D("ds.su_nghiep.a.thuan"), D("ds.bt.su_nghiep.b.thuan"), D("ds.tien_bac.c.thuan"),
                            D("ds.tarot.tra_loi.x"), C("ds.tarot.tung_la.y"), D("ds.suc_khoe.z"), D("ds.nhantuong.suc_khoe.k")])
    s = json.dumps({k: v for k, v in kq.items() if k != "hop"} | {"hop": [{k: v for k, v in h.items() if k != "ma_mau" and k != "can_cu"} for h in kq["hop"]]}, ensure_ascii=False)
    assert not _VI.search(s), s
    assert "Zi Wei and BaZi" in kq["hop"][0]["tieu_de"] and "Work" in kq["hop"][0]["tieu_de"]
    assert kq["hop"][0]["ma_mau"] == "ds.giao_thoa.cong_viec.mon.thuan.2"     # mã không theo ngôn ngữ
    # Hộp lưu ý của tiếng Anh không rơi về hướng xử lý mặc định tiếng Việt.
    assert all(not _VI.search(h.get("huong_xu_ly", "")) for h in kq["hop"])


def test_route_giao_thoa():
    r = client.post("/v1/giao-thoa", json={"phieu": [D("ds.su_nghiep.a.thuan"), D("ds.bt.su_nghiep.b.thuan")]})
    assert r.status_code == 200, r.text
    d = r.json()
    assert d["du"] and d["hop"][0]["ma_mau"] == "ds.giao_thoa.cong_viec.mon.thuan.2" and d["mo_dun"] == "giao_thoa"
    r = client.post("/v1/giao-thoa", json={"phieu": [D("ds.su_nghiep.a.thuan"), D("ds.bt.su_nghiep.b.thuan")]}, headers={"x-ngon-ngu": "en"})
    assert r.status_code == 200 and "Zi Wei and BaZi" in r.json()["hop"][0]["tieu_de"]
    assert client.post("/v1/giao-thoa", json={"phieu": [{"ma": "ds.a.b", "ket_qua": "co"}]}).status_code == 422
    assert client.post("/v1/giao-thoa", json={"phieu": [D("ds.a.b")] * 201}).status_code == 422
    assert client.post("/v1/giao-thoa", json={"phieu": [{"ma": "Ds.A", "ket_qua": "dung"}]}).status_code == 422
