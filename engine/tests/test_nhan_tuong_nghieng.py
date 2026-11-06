# -*- coding: utf-8 -*-
"""ANH-4 — đo ẢNH NGHIÊNG (calc/nhan_tuong_do.do_nghieng). Viết TRƯỚC hàm.

Ảnh thẳng không thấy độ "nổi" của mặt; ảnh nghiêng (≈ 90°) đo được trên ĐƯỜNG VIỀN: trán gồ / lõm, gốc mũi (Sơn Căn)
cao liền / thấp gãy, sống mũi gồ / thấp / thẳng cao, cằm lẹm, vị trí tai. Người dùng chấm 9 điểm trên đường viền (+ 2 điểm
tai tuỳ chọn). Chỉ dùng GÓC và tỉ lệ khoảng cách → không phụ thuộc mặt quay trái hay phải, đầu ngửa / cúi, khung ảnh.
Gương mặt mẫu dựng tay (quay sang phải, ảnh vuông): trán cong nhẹ, góc trán–mũi ~131°, sống mũi thẳng, cằm bình thường."""
from __future__ import annotations

import math

import pytest
from fastapi.testclient import TestClient

from app.calc import nhan_tuong_do as do
from app.kb import nhan_tuong_kb as kb
from app.main import app

client = TestClient(app)


def mau() -> dict[str, tuple[float, float]]:
    return {
        "chan_toc": (0.50, 0.15), "giua_tran": (0.538, 0.24), "an_duong": (0.55, 0.33), "son_can": (0.538, 0.37),
        "song_mui": (0.575, 0.43), "dau_mui": (0.62, 0.50), "chan_mui": (0.575, 0.53), "cam_truoc": (0.565, 0.68), "cam": (0.53, 0.72),
    }


def _dict(d: dict) -> dict:
    return {k: {"x": v[0], "y": v[1]} for k, v in d.items()}


def goi(d: dict, ti_le: float = 1.0) -> dict[str, str]:
    return {g["cau"]: g["lua_chon"] for g in do.do_nghieng(_dict(d), ti_le)["goi_y"]}


def test_kb_diem_nghieng_khop():
    ds = kb.do_anh()["diem_nghieng"]
    assert [p["ma"] for p in ds if p["bat_buoc"]] == list(mau())
    assert {p["ma"] for p in ds if not p["bat_buoc"]} == {"dinh_tai", "dai_tai"}
    for cau, lua in do.CAU_DO_NGHIENG.items():
        ma = {l["ma"] for l in kb.cau_hoi_theo_ma()[cau]["lua_chon"]}
        assert set(lua) <= ma, cau


def test_mat_mau_khong_goi_y():
    kq = do.do_nghieng(_dict(mau()), 1.0)
    assert kq["goi_y"] == []
    sd = kq["so_do"]
    assert sd["tran_cong"] == pytest.approx(0.065, abs=0.005)
    assert sd["goc_son_can"] == pytest.approx(131.1, abs=0.5)
    assert sd["gu_mui"] == pytest.approx(0.0, abs=0.01) and sd["nho_mui"] == pytest.approx(0.303, abs=0.005)
    assert sd["loi_mat"] == pytest.approx(10.9, abs=0.5)
    assert sd["huong"] == "phai"


@pytest.mark.parametrize("sua, mong", [
    ({"giua_tran": (0.56, 0.24)}, {"tran": "go_loi"}),
    ({"giua_tran": (0.522, 0.24)}, {"tran": "lom_giua"}),
    ({"son_can": (0.548, 0.37)}, {"son_can": "cao_lien"}),
    ({"son_can": (0.52, 0.375)}, {"son_can": "thap_gay"}),
    ({"song_mui": (0.592, 0.43)}, {"song_mui": "go"}),
    ({"dau_mui": (0.60, 0.50)}, {"song_mui": "thap"}),
    ({"dau_mui": (0.64, 0.50), "song_mui": (0.589, 0.435)}, {"song_mui": "thang_cao"}),
    ({"cam_truoc": (0.53, 0.68), "cam": (0.505, 0.72)}, {"cam": "nhon_lem"}),
    ({"dinh_tai": (0.36, 0.32), "dai_tai": (0.37, 0.55)}, {"tai": "cao_day"}),
    ({"dinh_tai": (0.36, 0.40), "dai_tai": (0.37, 0.52)}, {"tai": "nho_thap"}),
])
def test_tung_nguong(sua, mong):
    assert goi({**mau(), **sua}) == mong


def _lat(d: dict) -> dict:
    return {k: (1 - x, y) for k, (x, y) in d.items()}


def _xoay(d: dict, goc_do: float, tam=(0.5, 0.5)) -> dict:
    a = math.radians(goc_do)
    c, s = math.cos(a), math.sin(a)
    return {k: (tam[0] + (x - tam[0]) * c - (y - tam[1]) * s, tam[1] + (x - tam[0]) * s + (y - tam[1]) * c) for k, (x, y) in d.items()}


@pytest.mark.parametrize("sua", [{}, {"song_mui": (0.592, 0.43)}, {"cam_truoc": (0.53, 0.68), "cam": (0.505, 0.72)}, {"son_can": (0.548, 0.37)}])
def test_bat_bien_lat_xoay_khung(sua):
    d = {**mau(), **sua}
    goc = goi(d)
    assert goi(_lat(d)) == goc                                                 # quay sang trái
    assert do.do_nghieng(_dict(_lat(d)), 1.0)["so_do"]["huong"] == "trai"
    assert goi(_xoay(d, 12)) == goc and goi(_xoay(d, -12)) == goc              # ngửa / cúi
    hep = {k: ((x - 0.125) / 0.75, y) for k, (x, y) in d.items()}            # khung 3:4
    assert goi(hep, 0.75) == goc


@pytest.mark.parametrize("hong", [
    {"chan_toc": (0.50, 0.80)},                      # chân tóc dưới cằm
    {"son_can": (0.538, 0.31)},                      # gốc mũi trên Ấn Đường
    {"dau_mui": (0.45, 0.50)},                       # đầu mũi nằm phía sau mặt
    {"dinh_tai": (0.70, 0.33), "dai_tai": (0.70, 0.52)},   # tai ở phía trước mặt
])
def test_sai_bao_loi(hong):
    with pytest.raises(ValueError):
        do.do_nghieng(_dict({**mau(), **hong}), 1.0)


def test_thieu_diem():
    with pytest.raises(ValueError, match="dau_mui"):
        do.do_nghieng(_dict({k: v for k, v in mau().items() if k != "dau_mui"}), 1.0)


# ------------------------------------------------------------------ ghép với ảnh thẳng
from tests.test_nhan_tuong_do import mau as mau_thang  # noqa: E402


def test_ghep_thang_va_nghieng():
    thang = _dict(mau_thang())
    ng = [{"goc": "nghieng_phai", "diem": _dict({**mau(), "song_mui": (0.592, 0.43)}), "ti_le": 1.0}]
    kq = do.do_mat(thang, 1.0, ng)
    gy = {g["cau"]: g for g in kq["goi_y"]}
    assert gy["song_mui"]["lua_chon"] == "go" and gy["song_mui"]["anh"] == "nghieng_phai"
    assert gy["tam_dinh"]["anh"] == "thang"
    assert kq["so_do"]["nghieng"][0]["goc"] == "nghieng_phai"
    # hai ảnh nghiêng nói khác nhau → không gợi ý câu đó (chấm chưa nhất quán)
    hai = ng + [{"goc": "nghieng_trai", "diem": _dict(_lat(mau())), "ti_le": 1.0}]
    kq2 = do.do_mat(thang, 1.0, hai)
    assert "song_mui" not in {g["cau"] for g in kq2["goi_y"]}
    assert any("hai ảnh nghiêng" in c.lower() for c in kq2["canh_bao"])
    # hai ảnh cùng nói → giữ
    hai_dung = ng + [{"goc": "nghieng_trai", "diem": _dict(_lat({**mau(), "song_mui": (0.592, 0.43)})), "ti_le": 1.0}]
    assert {g["cau"]: g["lua_chon"] for g in do.do_mat(thang, 1.0, hai_dung)["goi_y"]}["song_mui"] == "go"


def test_anh_thang_uu_tien_cau_trung():
    """Câu cả hai ảnh đều đo được (tai, tam đình): ảnh thẳng thắng, ảnh nghiêng chỉ bù khi ảnh thẳng không có."""
    thang = _dict({**mau_thang(), "dinh_tai": (0.27, 0.36), "dai_tai": (0.27, 0.57)})            # thẳng: tai cao_day
    ng = [{"goc": "nghieng_trai", "diem": _dict(_lat({**mau(), "dinh_tai": (0.36, 0.40), "dai_tai": (0.37, 0.52)})), "ti_le": 1.0}]
    gy = {g["cau"]: g for g in do.do_mat(thang, 1.0, ng)["goi_y"]}
    assert gy["tai"]["lua_chon"] == "cao_day" and gy["tai"]["anh"] == "thang"
    gy2 = {g["cau"]: g for g in do.do_mat(_dict(mau_thang()), 1.0, ng)["goi_y"]}                 # thẳng không chấm tai
    assert gy2["tai"]["lua_chon"] == "nho_thap" and gy2["tai"]["anh"] == "nghieng_trai"


def test_api_nghieng():
    diem = _dict(mau_thang())
    ng = [{"goc": "nghieng_phai", "diem": _dict({**mau(), "giua_tran": (0.56, 0.24)}), "ti_le": 1.0}]
    r = client.post("/v1/nhan-tuong/do-mat", json={"diem": diem, "ti_le": 1.0, "dong_y": True, "nghieng": ng})
    assert r.status_code == 200, r.text
    assert {g["cau"]: g["lua_chon"] for g in r.json()["goi_y"]}["tran"] == "go_loi"
    assert client.post("/v1/nhan-tuong/do-mat", json={"diem": diem, "ti_le": 1.0, "dong_y": True}).status_code == 200    # không bắt buộc
    hai_trung = ng + ng
    assert client.post("/v1/nhan-tuong/do-mat", json={"diem": diem, "ti_le": 1.0, "dong_y": True, "nghieng": hai_trung}).status_code == 422
    xau = [{"goc": "nghieng_phai", "diem": _dict({**mau(), "dau_mui": (0.45, 0.50)}), "ti_le": 1.0}]
    r = client.post("/v1/nhan-tuong/do-mat", json={"diem": diem, "ti_le": 1.0, "dong_y": True, "nghieng": xau})
    assert r.status_code == 422 and "nghiêng" in r.json()["detail"].lower()
    ks = client.get("/v1/nhan-tuong/khao-sat").json()
    assert [p["ma"] for p in ks["diem_do"]["diem_nghieng"]][:3] == ["chan_toc", "giua_tran", "an_duong"]
