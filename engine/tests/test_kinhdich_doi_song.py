# -*- coding: utf-8 -*-
"""KD-ĐS: đọc quẻ đời thường — chủ đề/chip, làm rõ câu hỏi (tất định), mức theo lời kinh / Mai Hoa / Lục Hào,
hộp nổi bật, ba nhóm việc, góc nhìn ba phái từ CÙNG một quẻ, lớp đời thường không có giọng AI / từ doạ."""
from __future__ import annotations

import datetime as dt

import pytest
from fastapi.testclient import TestClient

from app.hoidap import kinhdich as kd
from app.kb import kinhdich_doi_song_kb as kb
from app.luangiai import kinhdich_doi_song as ds
from app.main import app
from app.narrative import hoi_van

client = TestClient(app)
QUE_LY = [7, 7, 8, 7, 7, 9]          # Lý (10), động hào 6 → Đoài (58)
THOI = dt.datetime(2026, 5, 20, 10, 0)   # ngày Giáp Ngọ, tháng Tỵ


def _chuan(c: str) -> str:
    from app.hoidap import chung
    return chung.chuan_hoa(c)


# ----------------------------------------------------------------------------- chủ đề
@pytest.mark.parametrize("cau,ma", [
    ("Tôi có nên chuyển việc sang công ty mới không?", "chuyen_viec"),
    ("Có đòi được món nợ này không?", "tien_no"),
    ("Nên mua căn hộ này không?", "mua_nha"),
    ("Người ấy có quay lại với tôi không?", "tinh_cam"),
    ("Con tôi có đậu kỳ thi này không?", "con_cai"),
    ("Tôi có nên mở quán cà phê không?", "kinh_doanh"),
    ("Hôm nay trời đẹp quá.", "khac"),
])
def test_chu_de_tu_cau(cau, ma):
    assert ds.chu_de_tu_cau(_chuan(cau)) == ma


def test_moi_chu_de_du_truong_va_sach_cum_cam():
    tat = kb.chu_de_tat_ca()
    assert len(tat) >= 20
    for ma, m in tat.items():
        assert m["dung_than"] in ("Phụ Mẫu", "Huynh Đệ", "Tử Tôn", "Thê Tài", "Quan Quỷ", "Ứng", "Thế"), ma
        assert set(m["hanh_dong"]) == {"thuan", "can_bang", "can_chu_dong"}
        for nhom in m["hanh_dong"].values():
            assert len(nhom) == 3
            for v in nhom:
                assert not kb.tim_cum_cam(v), (ma, v)
        for c in m["cau_tiep"]:
            assert not kb.tim_cum_cam(c), (ma, c)
    for ma in kb.MUC:
        assert not kb.tim_cum_cam(kb.muc(ma)["ket_luan"])


# ----------------------------------------------------------------------------- làm rõ (tất định)
def test_lam_ro_mua_hay_ban():
    lr = ds.can_lam_ro(_chuan("Tôi nên mua hay bán căn nhà này?"), None, "nghia_ly")
    assert lr and lr["ma"] == "mua_ban" and [x["ma"] for x in lr["lua_chon"]] == ["mua_nha", "ban_nha"]


def test_lam_ro_tinh_cam_chi_khi_luc_hao():
    t = _chuan("Người ấy có quay lại với tôi không?")
    lr = ds.can_lam_ro(t, None, "luc_hao")
    assert lr and lr["ma"] == "tinh_cam"
    assert [x["ma"] for x in lr["lua_chon"]] == ["tinh_cam_nu", "tinh_cam_nam", "tinh_cam"]
    assert ds.can_lam_ro(t, None, "nghia_ly") is None
    assert ds.can_lam_ro(t, "tinh_cam_nu", "luc_hao") is None      # đã chọn → không hỏi lại


def test_lam_ro_hai_viec_khac_dung_than():
    lr = ds.can_lam_ro(_chuan("Tôi nên chuyển việc hay mua nhà trước?"), None, "nghia_ly")
    assert lr and lr["ma"] == "hai_viec" and {x["ma"] for x in lr["lua_chon"]} == {"chuyen_viec", "mua_nha"}
    # một quyết định hai vế cùng việc → không hỏi
    assert ds.can_lam_ro(_chuan("Tôi nên ở lại công ty hay chuyển việc?"), None, "nghia_ly") is None
    assert ds.can_lam_ro(_chuan("Có nên vay tiền mua nhà không?"), None, "nghia_ly") is None


# ----------------------------------------------------------------------------- mức
@pytest.mark.parametrize("han,muc", [
    ("素履，往无咎。", "thuan"), ("征凶。", "can_chu_dong"), ("无咎，悔亡。", "thuan"),
    ("利见大人，凶。", "can_bang"), ("", "can_bang"), ("无不利。", "thuan"), ("不利有攸往。", "can_chu_dong"),
    ("貞吝。", "can_chu_dong"), ("元亨利貞。", "thuan"),
])
def test_muc_loi_kinh(han, muc):
    assert ds.muc_loi_kinh(han) == muc


def _hao(tong="bình", dong=False, hoa=None, **k):
    return {"vi_tri": 2, "dia_chi": "Dần", "ngu_hanh": "Mộc", "tong": tong, "dong": dong, "hoa": hoa,
            "tuan_khong": False, "nguyet_pha": False, "nhap_mo": False, **k}


def test_muc_luc_hao():
    assert ds.muc_luc_hao({"dung_than": None})[0] == "can_bang"
    assert ds.muc_luc_hao({"dung_than": {"phuc": True, "vi_tri": []}})[0] == "can_bang"
    assert ds.muc_luc_hao({"dung_than": {"phuc": False, "vi_tri": [_hao("vượng")]}})[0] == "thuan"
    assert ds.muc_luc_hao({"dung_than": {"phuc": False, "vi_tri": [_hao("suy")],
                                         "ky_than": {"dong": [5]}}})[0] == "can_chu_dong"
    # vượng nhưng động hoá hồi đầu khắc → hạ một bậc
    m, ly = ds.muc_luc_hao({"dung_than": {"phuc": False, "vi_tri": [_hao("vượng", True, {"loai": "hồi đầu khắc",
                                                                                           "dia_chi": "Dậu", "ngu_hanh": "Kim"})]}})
    assert m == "can_bang" and any("hồi đầu khắc" in s for s in ly)
    # tuần không kéo về không hơn cân bằng
    assert ds.muc_luc_hao({"dung_than": {"phuc": False, "vi_tri": [_hao("vượng", tuan_khong=True)]}})[0] == "can_bang"


# ----------------------------------------------------------------------------- doc_que trọn gói
def _lop_doi_thuong(dq: dict) -> str:
    phan = [dq["ket_luan"], *dq["doan"], *(h["noi_dung"] for h in dq["hop"]), *(h.get("huong_xu_ly") or "" for h in dq["hop"])]
    for n in dq["hanh_dong"]:
        phan += n["viec"]
    phan += dq["cau_lien_quan"]
    return "\n".join(phan)


def test_doc_que_nghia_ly_du_lop():
    out = kd.tra_loi("Tôi có nên chuyển việc sang công ty mới không?", "tu_dong", gia_tri_hao=QUE_LY, thoi_diem=THOI)
    dq = out["doc_que"]
    assert dq and out["chu_de"]["ma"] == "chuyen_viec" and out["can_lam_ro"] is None
    assert dq["muc"] in kb.MUC and dq["nhan_muc"] == kb.nhan_muc(dq["muc"])
    assert dq["ket_luan"] and dq["cau_tu_soi"] and dq["doan"]
    loai = [h["loai"] for h in dq["hop"]]
    assert "cot_loi" in loai and "loi_khuyen" in loai and "luu_y" in loai and "thoi_diem" in loai
    assert all(h.get("huong_xu_ly") for h in dq["hop"] if h["loai"] == "luu_y")
    assert [n["muc"] for n in dq["hanh_dong"]][0] == dq["muc"] and len(dq["hanh_dong"]) == 3
    assert dq["can_cu"] and all(c["tieu_de"] and c["noi_dung"] for c in dq["can_cu"])
    assert dq["loi_kinh"] and dq["loi_kinh"][0]["han"]
    gn = dq["goc_nhin"]
    assert gn["chinh"] == "nghia_ly" and gn["nghia_ly"]["muc"] == dq["muc"]
    assert gn["mai_hoa"] and gn["mai_hoa"]["the"] and gn["mai_hoa"]["muc"] in kb.MUC      # 1 hào động → có thể–dụng
    assert gn["luc_hao"] and gn["luc_hao"]["dung_than"] == "Quan Quỷ" and gn["luc_hao"]["muc"] in kb.MUC
    assert 1 <= len(dq["cau_lien_quan"]) <= 3
    van = _lop_doi_thuong(dq)
    assert not kb.tim_cum_cam(van), kb.tim_cum_cam(van)
    assert not [c for c in hoi_van.CAM if c in van.lower()]
    # lời đọc cũ vẫn còn cho LLM / bản đầy đủ
    assert "Lý" in out["cau_tra_loi"]


def test_doc_que_luc_hao_co_ung_ky_va_thoi_diem():
    out = kd.tra_loi("Buổi phỏng vấn tuần sau có đậu không?", "tu_dong", gia_tri_hao=QUE_LY, thoi_diem=THOI)
    dq = out["doc_que"]
    assert dq["goc_nhin"]["chinh"] == "luc_hao" and out["phan_loai"]["dung_than"] == "Quan Quỷ"
    td = [h for h in dq["hop"] if h["loai"] == "thoi_diem"]
    assert td and dq["ung_ky"] and all(u["ngay_gan_nhat"] > THOI.date().isoformat() for u in dq["ung_ky"])
    lh = dq["goc_nhin"]["luc_hao"]
    assert lh["luc_thu"] and len(lh["hao"]) == 6 and lh["hao"][5]["dong"]


def test_doc_que_dung_than_tu_chu_de_khi_phan_loai_roi_ve_ung():
    out = kd.tra_loi("Việc này có thành không?", "tu_dong", gia_tri_hao=QUE_LY, thoi_diem=THOI, chu_de="kinh_doanh")
    assert out["phan_loai"]["dung_than"] == "Thê Tài" and out["chu_de"]["ma"] == "kinh_doanh"


def test_doc_que_suc_khoe_co_cau_khong_thay_bac_si():
    out = kd.tra_loi("Dạo này tôi mất ngủ, có nên đi khám không?", "tu_dong", gia_tri_hao=QUE_LY, thoi_diem=THOI)
    assert out["chu_de"]["ma"] == "suc_khoe"
    assert any("bác sĩ" in (h["noi_dung"] + (h.get("huong_xu_ly") or "")) for h in out["doc_que"]["hop"])


def test_tra_loi_dung_lai_khi_can_lam_ro():
    out = kd.tra_loi("Tôi nên mua hay bán căn nhà này?", "tu_dong", thoi_diem=THOI)
    assert out["que"] is None and out["can_them"] == ["lam_ro"] and out["can_lam_ro"]["ma"] == "mua_ban"
    assert out["cau_tra_loi"] == out["can_lam_ro"]["cau_hoi"] and out["doc_que"] is None
    # đã chọn → đọc bình thường
    out2 = kd.tra_loi("Tôi nên mua hay bán căn nhà này?", "tu_dong", gia_tri_hao=QUE_LY, thoi_diem=THOI, chu_de="ban_nha")
    assert out2["que"] and out2["chu_de"]["ma"] == "ban_nha" and out2["can_lam_ro"] is None


def test_mai_hoa_theo_so_va_phuong_vi():
    out = kd.tra_loi("Việc tôi định làm chiều nay có thuận không?", "tu_dong", thoi_diem=THOI, cach_ra_que="mai_hoa_so",
                     so_mai_hoa=[3, 5])
    assert out["phan_loai"]["truong_phai"] == "mai_hoa" and out["mai_hoa"]["dau_vao"]["cach"] == "so"
    assert out["mai_hoa"]["toan_cuc"]["muc"] in kb.MUC and out["mai_hoa"]["ung_ky_so"]["so"] > 0
    assert out["doc_que"]["goc_nhin"]["chinh"] == "mai_hoa" and out["doc_que"]["goc_nhin"]["mai_hoa"]["ho"]
    out = kd.tra_loi("Việc tôi định làm chiều nay có thuận không?", "tu_dong", thoi_diem=THOI, cach_ra_que="mai_hoa_phuong",
                     phuong_mai_hoa="Đông")
    assert out["mai_hoa"]["dau_vao"]["cach"] == "phuong_vi" and out["que"]
    # cùng đầu vào → cùng quẻ (tất định)
    out2 = kd.tra_loi("Việc tôi định làm chiều nay có thuận không?", "tu_dong", thoi_diem=THOI, cach_ra_que="mai_hoa_phuong",
                      phuong_mai_hoa="Đông")
    assert out2["que"]["gia_tri_hao_1_den_6"] == out["que"]["gia_tri_hao_1_den_6"]


def test_mai_hoa_theo_gio_cung_co_toan_cuc():
    out = kd.tra_loi("Xem nhanh việc đi xa hôm nay", "tu_dong", thoi_diem=THOI, cach_ra_que="mai_hoa")
    assert out["mai_hoa"]["toan_cuc"]["the"] and out["doc_que"]["goc_nhin"]["mai_hoa"]["ung_ky_so"]


def test_ky_thuat_khong_co_doc_que():
    out = kd.tra_loi("Quẻ Càn nghĩa là gì?", "tu_dong")
    assert out["doc_que"] is None and out["que"] is None


# ----------------------------------------------------------------------------- API
def test_api_chu_de_va_mai_hoa_phuong():
    r = client.post("/v1/kinhdich/hoi", json={"cau_hoi": "Có nên nhận chức quản lý không?", "gia_tri_hao": QUE_LY,
                                              "chu_de": "thang_tien", "thoi_diem": "2026-05-20T10:00:00"})
    assert r.status_code == 200
    d = r.json()
    assert d["doc_que"]["muc"] in kb.MUC and d["chu_de"]["ma"] == "thang_tien" and d["chu_de"]["ten"]
    r = client.post("/v1/kinhdich/hoi", json={"cau_hoi": "Chiều nay đi gặp đối tác có thuận không?",
                                              "cach_ra_que": "mai_hoa_phuong", "phuong_mai_hoa": "Tây Nam",
                                              "thoi_diem": "2026-05-20T10:00:00"})
    assert r.status_code == 200 and r.json()["mai_hoa"]["dau_vao"]["huong"] == "Tây Nam"
    r = client.post("/v1/kinhdich/hoi", json={"cau_hoi": "Chiều nay đi gặp đối tác có thuận không?",
                                              "cach_ra_que": "mai_hoa_so"})
    assert r.status_code == 422
    r = client.post("/v1/kinhdich/hoi", json={"cau_hoi": "Việc này có thành không?", "chu_de": "khong_co"})
    assert r.status_code == 422
    r = client.get("/v1/kinhdich/chu-de")
    assert r.status_code == 200 and len(r.json()["chu_de"]) >= 20 and r.json()["chu_de"][0]["ma"]


@pytest.mark.parametrize("hao", [QUE_LY, [7, 7, 7, 7, 7, 7], [8, 8, 8, 8, 8, 8], [9, 6, 7, 8, 9, 6]])
def test_doan_dau_co_ten_han_khong_ngoac_rong(hao):
    """Chữ Hán của quẻ lấy từ KB (kết quả gieo không mang `ten_han`) — trước đây mọi quẻ hiện "Quẻ Lý ()."."""
    kq = kd.tra_loi("Tôi có nên nhận lời làm quản lý không?", "tu_dong", gia_tri_hao=hao)
    dau = kq["doc_que"]["doan"][0]
    assert "()" not in dau and "( )" not in dau
    ban = kq["que"]["quai_ban"]
    assert dau.startswith(f"Quẻ {ban['ten']} (")
    assert all("()" not in c for c in kq["doc_que"].get("can_cu", []))
