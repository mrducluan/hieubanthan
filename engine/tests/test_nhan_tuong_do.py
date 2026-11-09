# -*- coding: utf-8 -*-
"""ANH-2 — đo gương mặt trên ảnh KHÔNG dùng AI (calc/nhan_tuong_do.py). Viết TRƯỚC hàm.

Người dùng tự chấm 20 điểm mốc (+ 2 điểm tai tuỳ chọn) trên ảnh của chính mình; web chỉ gửi toạ độ chuẩn hoá 0..1 và tỉ lệ
rộng/cao của ảnh. CALC xoay theo đường hai đuôi mắt, đổi về cùng đơn vị, tính tỉ lệ "tam đình ngũ nhãn" rồi gợi ý mã lựa
chọn khảo sát theo ngưỡng trong KB. Gương mặt mẫu dựng tay (ảnh vuông, đơn vị = chiều cao ảnh): gò má rộng 0,40; mắt dài
0,084 (= 0,21 bề ngang); ba đình 0,19 – 0,19 – 0,19 → chỉ gợi ý "ba phần cân nhau"."""
from __future__ import annotations

import math

import pytest
from fastapi.testclient import TestClient

from app.calc import nhan_tuong_do as do
from app.kb import nhan_tuong_kb as kb
from app.main import app

client = TestClient(app)


def mau() -> dict[str, tuple[float, float]]:
    rise = 0.09 * 0.084                      # đuôi mắt cao hơn khoé trong một chút (bình thường)
    return {
        "chan_toc": (0.5, 0.18), "thai_trai": (0.32, 0.37), "thai_phai": (0.68, 0.37),
        "ma_trai": (0.30, 0.47), "ma_phai": (0.70, 0.47), "ham_trai": (0.34, 0.66), "ham_phai": (0.66, 0.66), "cam": (0.5, 0.75),
        "may_trai": (0.45, 0.37), "may_phai": (0.55, 0.37),
        "mat_ngoai_trai": (0.374, 0.42 - rise), "mat_trong_trai": (0.458, 0.42), "mat_trong_phai": (0.542, 0.42), "mat_ngoai_phai": (0.626, 0.42 - rise),
        "chan_mui": (0.5, 0.56), "canh_mui_trai": (0.454, 0.55), "canh_mui_phai": (0.546, 0.55),
        "mep_trai": (0.425, 0.63), "giua_moi": (0.5, 0.625), "mep_phai": (0.575, 0.63),
    }


def lech(goi_y: list[dict]) -> dict[str, str]:
    """Chỉ các nét LỆCH khỏi khoảng thường (NT-2: nét "vừa" cũng có câu trả lời, cờ `vua` — xem test_nhan_tuong_do_vua)."""
    return {g["cau"]: g["lua_chon"] for g in goi_y if not g.get("vua")}


def goi(d: dict, ti_le: float = 1.0) -> dict[str, str]:
    kq = do.do_mat({k: {"x": v[0], "y": v[1]} for k, v in d.items()}, ti_le)
    return lech(kq["goi_y"])


def test_kb_diem_khop():
    ds = kb.do_anh()["diem"]
    assert [p["ma"] for p in ds if p["bat_buoc"]] == list(mau())
    assert {p["ma"] for p in ds if not p["bat_buoc"]} == {"dinh_tai", "dai_tai"}
    assert set(do.CAU_DO) <= set(kb.cau_hoi_theo_ma())                    # mọi câu đo được là câu thật của khảo sát
    for cau, lua in do.CAU_DO.items():
        ma = {l["ma"] for l in kb.cau_hoi_theo_ma()[cau]["lua_chon"]}
        assert set(lua) <= ma, cau


def test_mat_mau_chi_ba_dinh_can_doi():
    kq = do.do_mat({k: {"x": v[0], "y": v[1]} for k, v in mau().items()}, 1.0)
    assert lech(kq["goi_y"]) == {"tam_dinh": "can_doi"}
    sd = kq["so_do"]
    assert sd["tam_dinh"] == {"thuong": 33, "trung": 33, "ha": 33}
    assert sd["cao_rong"] == pytest.approx(1.425, abs=0.01) and sd["mat_mat"] == pytest.approx(0.21, abs=0.005)
    assert sd["may_khoe"] == pytest.approx(1.19, abs=0.01) and kq["canh_bao"] == []
    g = next(x for x in kq["goi_y"] if x["cau"] == "tam_dinh")
    assert "33%" in g["do"] and g["nguon"]


@pytest.mark.parametrize("sua, mong", [
    ({"chan_toc": (0.5, 0.10)}, {"tam_dinh": "tran_dai", "khuon_mat": "dai"}),
    ({"ham_trai": (0.31, 0.66), "ham_phai": (0.69, 0.66)}, {"khuon_mat": "vuong", "ham": "banh"}),
    ({"thai_trai": (0.30, 0.37), "thai_phai": (0.70, 0.37), "ham_trai": (0.36, 0.66), "ham_phai": (0.64, 0.66)},
     {"khuon_mat": "tren_rong_duoi_nhon", "ham": "hep_gay"}),
    ({"may_trai": (0.475, 0.37), "may_phai": (0.525, 0.37)}, {"an_duong": "hep"}),
    ({"may_trai": (0.48, 0.37), "may_phai": (0.52, 0.37)}, {"an_duong": "hep", "long_may": "giao_nhau"}),
    ({"may_trai": (0.44, 0.37), "may_phai": (0.56, 0.37)}, {"an_duong": "rong_sang"}),
    ({"mat_ngoai_trai": (0.374, 0.42 - 0.2 * 0.084), "mat_ngoai_phai": (0.626, 0.42 - 0.2 * 0.084)}, {"mat_hinh": "xech_len"}),
    ({"mat_ngoai_trai": (0.374, 0.42 + 0.05 * 0.084), "mat_ngoai_phai": (0.626, 0.42 + 0.05 * 0.084)}, {"mat_hinh": "cup_xuong"}),
    ({"mat_ngoai_trai": (0.388, 0.42 - 0.09 * 0.07), "mat_ngoai_phai": (0.612, 0.42 - 0.09 * 0.07)}, {"mat_hinh": "nho"}),
    ({"canh_mui_trai": (0.445, 0.55), "canh_mui_phai": (0.555, 0.55)}, {"canh_mui": "xoe_rong"}),
    ({"mep_trai": (0.425, 0.64), "mep_phai": (0.575, 0.64)}, {"mieng": "khoe_cup"}),
    ({"mep_trai": (0.425, 0.615), "mep_phai": (0.575, 0.615)}, {"mieng": "rong_khoe_len"}),
    ({"mep_trai": (0.445, 0.627), "mep_phai": (0.555, 0.627)}, {"mieng": "nho_mong"}),
    ({"mep_trai": (0.425, 0.62), "mep_phai": (0.575, 0.64)}, {"mieng": "lech"}),
    ({"giua_moi": (0.5, 0.60), "mep_trai": (0.425, 0.605), "mep_phai": (0.575, 0.605)}, {"nhan_trung": "ngan"}),
    ({"chan_mui": (0.52, 0.56)}, {"song_mui": "lech"}),
    ({"dinh_tai": (0.27, 0.36), "dai_tai": (0.27, 0.57)}, {"tai": "cao_day"}),
    ({"dinh_tai": (0.27, 0.44), "dai_tai": (0.27, 0.60)}, {"tai": "nho_thap"}),
])
def test_tung_nguong(sua, mong):
    d = {**mau(), **sua}
    kq = goi(d)
    kq.pop("tam_dinh", None) if "tam_dinh" not in mong else None
    assert kq == mong


def _xoay(d: dict, goc_do: float, tam=(0.5, 0.5)) -> dict:
    a = math.radians(goc_do)
    c, s = math.cos(a), math.sin(a)
    return {k: (tam[0] + (x - tam[0]) * c - (y - tam[1]) * s, tam[1] + (x - tam[0]) * s + (y - tam[1]) * c) for k, (x, y) in d.items()}


def test_bat_bien_khi_xoay_va_doi_khung():
    """Đầu nghiêng 10° → xoay lại theo hai đuôi mắt, kết quả như ảnh thẳng (có cảnh báo nghiêng). Ảnh 3:4 → đổi về cùng đơn vị."""
    d = {**mau(), "chan_toc": (0.5, 0.10)}
    goc = goi(d)
    xoay = do.do_mat({k: {"x": v[0], "y": v[1]} for k, v in _xoay(d, 10).items()}, 1.0)
    assert lech(xoay["goi_y"]) == goc
    assert any("nghiêng" in c for c in xoay["canh_bao"])
    # khung 3:4 (rộng = 0,75 cao): toạ độ thật dời vào giữa rồi chia cho bề rộng
    hep = {k: ((x - 0.125) / 0.75, y) for k, (x, y) in d.items()}
    assert goi(hep, 0.75) == goc
    assert do.do_mat({k: {"x": v[0], "y": v[1]} for k, v in hep.items()}, 0.75)["so_do"]["cao_rong"] == pytest.approx(1.625, abs=0.01)


def test_quay_ngang_bo_phep_do_hai_ben():
    d = mau()
    lech = {k: ((x + 0.04, y) if k.startswith(("mat_", "may_", "chan_mui", "canh_mui", "mep", "giua_moi")) else (x, y)) for k, (x, y) in d.items()}
    lech["chan_mui"] = (0.57, 0.56)                                           # mũi lệch nhiều nhưng do mặt quay → không kết luận lệch
    kq = do.do_mat({k: {"x": v[0], "y": v[1]} for k, v in lech.items()}, 1.0)
    assert "song_mui" not in {g["cau"] for g in kq["goi_y"]} and "mieng" not in {g["cau"] for g in kq["goi_y"]}
    assert any("quay" in c for c in kq["canh_bao"])


@pytest.mark.parametrize("hong", [
    {"chan_toc": (0.5, 0.80)},                                                # chân tóc dưới cằm
    {"ma_trai": (0.72, 0.47)},                                                # trái / phải đảo
    {"mat_trong_trai": (0.60, 0.42)},
])
def test_sai_thu_tu_bao_loi(hong):
    with pytest.raises(ValueError):
        do.do_mat({k: {"x": v[0], "y": v[1]} for k, v in {**mau(), **hong}.items()}, 1.0)


def test_thieu_diem_bao_loi():
    d = {k: {"x": v[0], "y": v[1]} for k, v in mau().items() if k != "cam"}
    with pytest.raises(ValueError, match="cam"):
        do.do_mat(d, 1.0)


def test_tat_dinh():
    d = {k: {"x": v[0], "y": v[1]} for k, v in mau().items()}
    assert do.do_mat(d, 1.0) == do.do_mat(dict(reversed(list(d.items()))), 1.0)


# ------------------------------------------------------------------ API
def test_api_do_mat():
    diem = {k: {"x": v[0], "y": v[1]} for k, v in {**mau(), "chan_toc": (0.5, 0.10)}.items()}
    r = client.post("/v1/nhan-tuong/do-mat", json={"diem": diem, "ti_le": 1.0, "dong_y": True})
    assert r.status_code == 200, r.text
    d = r.json()
    assert lech(d["goi_y"]) == {"tam_dinh": "tran_dai", "khuon_mat": "dai"}
    assert d["can_xac_nhan"] is True and d["pham_vi"] == "nhan_tuong_do_mat"
    assert client.post("/v1/nhan-tuong/do-mat", json={"diem": diem, "ti_le": 1.0}).status_code == 422      # thiếu đồng ý
    assert client.post("/v1/nhan-tuong/do-mat", json={"diem": diem, "ti_le": 9, "dong_y": True}).status_code == 422
    xau = {**diem, "chan_toc": {"x": 0.5, "y": 0.9}}
    r = client.post("/v1/nhan-tuong/do-mat", json={"diem": xau, "ti_le": 1.0, "dong_y": True})
    assert r.status_code == 422 and "chân tóc" in r.json()["detail"].lower()
    assert client.post("/v1/nhan-tuong/do-mat", json={"diem": {**diem, "la": {"x": 0.1, "y": 0.1}}, "ti_le": 1.0, "dong_y": True}).status_code == 422
    # khảo sát trả danh sách điểm cho web vẽ
    ks = client.get("/v1/nhan-tuong/khao-sat").json()
    assert [p["ma"] for p in ks["diem_do"]["diem"]][:3] == ["chan_toc", "thai_trai", "thai_phai"] and ks["diem_do"]["nhom"]


def test_mat_trung_binh_theo_vien_khong_bat_nham_tren_rong():
    """ANH-3: mép trán đo theo viền mặt (máy tự tìm) ≈ 0,97 gò má, hàm ≈ 0,78 — mặt trung bình, không phải "trên rộng dưới nhọn"."""
    d = {**mau(), "thai_trai": (0.306, 0.37), "thai_phai": (0.694, 0.37), "ham_trai": (0.344, 0.66), "ham_phai": (0.656, 0.66)}
    kq = goi(d)
    assert "khuon_mat" not in kq or kq["khuon_mat"] != "tren_rong_duoi_nhon"
