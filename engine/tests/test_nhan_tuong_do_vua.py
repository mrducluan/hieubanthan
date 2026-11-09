# -*- coding: utf-8 -*-
"""NT-2 — ảnh đo được thì TRẢ LỜI LUÔN, kể cả khi nét "vừa / cân đối" (viết TRƯỚC hàm).

Trước đây phép đo chỉ gợi ý khi số lệch hẳn khỏi ngưỡng → mặt cân đối chụp đủ 3 góc mà các chương vẫn báo "chưa trả lời".
Nay mỗi câu ảnh thẳng đo được đều có câu trả lời: nét lệch → lựa chọn cũ; nằm trong khoảng thường → lựa chọn "vừa"
(`vua` / `can_doi`, cờ `vua: True`). Câu ảnh KHÔNG đo được (độ dày thịt, sắc, nếp, ánh mắt…) vẫn để người dùng trả lời."""
from __future__ import annotations

from app.calc import nhan_tuong as nt
from app.calc import nhan_tuong_do as do
from app.kb import nhan_tuong_kb as kb
from tests.test_nhan_tuong_do import mau

VUA = {"khuon_mat": "can_doi", "an_duong": "vua", "mat_hinh": "vua", "canh_mui": "vua", "mieng": "vua",
       "nhan_trung": "vua", "ham": "vua"}


def _kq(d: dict) -> dict:
    return do.do_mat({k: {"x": v[0], "y": v[1]} for k, v in d.items()}, 1.0)


def test_mat_can_doi_co_tra_loi_moi_cau_do_duoc():
    kq = _kq(mau())
    tl = {g["cau"]: g["lua_chon"] for g in kq["goi_y"]}
    assert tl == {"tam_dinh": "can_doi", **VUA}
    assert all(g.get("vua") is True for g in kq["goi_y"] if g["cau"] in VUA)
    assert all(g["do"] for g in kq["goi_y"])                       # mỗi câu trả lời kèm số đo (người dùng kiểm được)


def test_lua_chon_vua_co_trong_kb_va_co_dac_diem():
    cau = kb.cau_hoi_theo_ma()
    for q, lua in VUA.items():
        assert lua in {l["ma"] for l in cau[q]["lua_chon"]}, q
        assert lua in do.CAU_DO[q], q
        assert nt.khop_dac_diem({q: lua}), f"{q}={lua} chưa có đặc điểm trong KB"


def test_net_lech_van_thang_lua_chon_vua():
    d = mau()
    d["canh_mui_trai"], d["canh_mui_phai"] = (0.44, 0.55), (0.56, 0.55)       # cánh mũi rộng 0,12 / 0,084 ≈ 1,43
    d["ham_trai"], d["ham_phai"] = (0.305, 0.66), (0.695, 0.66)               # hàm ≈ bề ngang gò má
    tl = {g["cau"]: g for g in _kq(d)["goi_y"]}
    assert tl["canh_mui"]["lua_chon"] == "xoe_rong" and not tl["canh_mui"].get("vua")
    assert tl["ham"]["lua_chon"] == "banh"


def test_tran_hep_do_duoc_tu_anh_thang():
    d = mau()
    d["thai_trai"], d["thai_phai"] = (0.34, 0.37), (0.66, 0.37)              # trán 0,32 / gò má 0,40 = 0,8
    tl = {g["cau"]: g["lua_chon"] for g in _kq(d)["goi_y"]}
    assert tl["tran"] == "hep_thap"
    assert "tran" not in {g["cau"] for g in _kq(mau())["goi_y"]}              # trán thường: không đoán "cao rộng đầy" (cần độ sâu)


def test_mui_hep_nhan_trung_dai_khong_doan():
    d = mau()
    d["canh_mui_trai"], d["canh_mui_phai"] = (0.47, 0.55), (0.53, 0.55)       # 0,06 / 0,084 ≈ 0,71: hẹp — không có lựa chọn → bỏ
    d["giua_moi"] = (0.5, 0.64)                                               # nhân trung dài: chưa biết sâu hay nông → bỏ
    d["mep_trai"], d["mep_phai"] = (0.425, 0.645), (0.575, 0.645)
    tl = {g["cau"]: g["lua_chon"] for g in _kq(d)["goi_y"]}
    assert "canh_mui" not in tl and "nhan_trung" not in tl


def test_ghep_nghieng_khong_de_lua_chon_vua_che_anh_nghieng():
    # câu ảnh thẳng chỉ có "vừa" mà ảnh nghiêng đo ra nét rõ → dùng ảnh nghiêng (ảnh nghiêng thấy độ sâu).
    kq = {"goi_y": [{"cau": "tran", "lua_chon": "vua", "do": "x", "nguon": "n", "anh": "thang", "vua": True}], "so_do": {}, "canh_bao": []}
    assert do._uu_tien_nghieng(kq["goi_y"][0])
