# -*- coding: utf-8 -*-
"""Q1–Q6 + an toàn 81 tổ hợp + đồ thị tri thức theo ý định (2026-10-22). Test viết trước / cùng hàm.
Q1 trần mức theo dấu hiệu veto · Q2 mặt bằng vẽ tay vào bố cục · Q4 hai lối giải thích · Q5 việc theo chi phí ·
Q6 bảy luật Drive thành KB + luật RULES (căn hộ, nước vận 9) · lưu ý lửa điện không doạ · đồ thị thay Apache AGE."""
from __future__ import annotations

import datetime as dt

from fastapi.testclient import TestClient

from app.calc import huyen_khong as hk
from app.kb import phongthuy_do_thi as do_thi
from app.kb import phongthuy_kb as kbp
from app.kb import y_dinh_chung
from app.kb.tuvi_doi_song_kb import tim_cum_cam
from app.luangiai import doi_song_khuon as kh
from app.luangiai import phongthuy_bo_cuc as bc
from app.luangiai import phongthuy_doi_song as ds
from app.main import app
from tests.test_to_hop_81 import CAM_THEM

client = TestClient(app)
SINH = {"nam": 1990, "gioi_tinh": "nam", "ngay": dt.date(1990, 5, 17), "moc_nam": "lap_xuan"}
NGAY = dt.date(2026, 5, 20)
BO_CUC_VETO = {"huong_nha_do": 180, "loai_nha": "can_ho", "vi_tri": {"cua_chinh": "Nam", "phong_ngu_chinh": "Đông Nam", "bep": "Đông"},
               "dau_hieu": {"xa_ngang": {"co": True}}}


# ----------------------------------------------------------------------------- KB
def test_kb_bo_tri_du_truong_cho_moi_dau_hieu_khao_sat():
    cam = kh.cum_cam_chung()
    for ma in bc.DAU_HIEU:
        m = kbp.bo_tri(ma)
        assert m and len(m.get("giai_thich_hien_dai", "")) >= 40, ma            # Q4
        viec = m.get("viec") or []
        assert viec and any(v["chi_phi"] == "khong_ton" for v in viec), ma     # Q5: luôn có việc 0 đồng
        assert all(v["chi_phi"] in bc.CHI_PHI and len(v["lam"]) >= 15 for v in viec), ma
        for van in [m["noi_dung"], m["giai_thich_hien_dai"], m["goi_y"], *(v["lam"] for v in viec)]:
            van = van.replace("không cần mua vật phẩm", "")       # câu "không cần mua vật phẩm hoá giải" là lời từ chối, không phải gợi ý
            assert not tim_cum_cam(van, cam), (ma, tim_cum_cam(van, cam))
            assert "vật phẩm" not in van.lower()
    assert bc.dau_hieu_veto() == {"duong_dam", "xa_ngang", "wc_giua_nha", "cua_thong_ban_cong"}          # Q1
    q = kbp.quy_tac_thuc_hanh()
    assert {"moc_lap_xuan", "hanh_lang_chung_cu", "khong_dap_ket_cau", "dao_bep_khong_phai_bep", "ban_tho_gio", "nuoc_van_9",
            "sua_nha_sua_thoi_quen"} <= set(q)                                                          # Q6: đủ 7 luật
    for ma, x in q.items():
        if not ma.startswith("_"):
            assert x["tieu_de"] and len(x["noi_dung"]) >= 40 and "ap_dung" in x
            assert not tim_cum_cam(x["noi_dung"], cam), ma


def test_an_toan_81_khong_doa_va_dung_cho_cap_lua_dien():
    t = kbp.huyen_khong()["to_hop_81"]
    cam = kh.cum_cam_chung()
    co = 0
    for s in range(1, 10):
        for h in range(1, 10):
            at = t[f"{s}-{h}"].get("an_toan") or []
            if 9 in (s, h) and (2 in (s, h) or 5 in (s, h) or 7 in (s, h)) or (s, h) == (9, 9):
                assert at and any("lửa" in x and "điện" in x for x in at), (s, h)   # lửa điện → có lời nhắc, không tên bệnh
            for x in at:
                co += 1
                assert len(x) >= 30 and not tim_cum_cam(x, cam) and not tim_cum_cam(x, CAM_THEM), (s, h, x)
                assert "cháy nổ" not in x and "chết" not in x
    assert co >= 40
    ch = hk.to_hop_cung(9, 5, 9)
    assert ch["an_toan"] and ch["khong_dat_nuoc"] is True and ch["hop_dat_nuoc"] is False        # Q6 luật nước vận 9
    assert hk.to_hop_cung(8, 9, 9)["hop_dat_nuoc"] is True and hk.to_hop_cung(9, 8, 9)["khong_dat_nuoc"] is True
    assert "khong_dat_nuoc" not in hk.to_hop_cung(9, 5, 8)                                          # chỉ vận 9
    assert "cẩn thận" in kbp.mau_an_toan("lửa và điện").lower() or "lời nhắc" in kbp.mau_an_toan("lửa và điện").lower()


# ----------------------------------------------------------------------------- bố cục: Q2 / Q4 / Q6
def test_bo_cuc_mat_bang_suy_vi_tri_va_dau_hieu():
    r = bc.luan({"huong_nha_do": 180, "mat_bang": {"luoi": ["11111", "11111", "11111", "11111", "11111"],
                                                     "phong": {"ve_sinh": [2, 2], "cua_chinh": [0, 2], "bep": [4, 0]}, "ban_cong": [4, 2]}}, SINH)
    vt = {v["phong"]: v["cung"] for v in r["da_tinh"]["vi_tri"]}
    assert vt == {"ve_sinh": "Trung cung", "cua_chinh": "Nam", "bep": "Đông Bắc"}
    assert set(r["mat_bang"]["dau_hieu_suy_ra"]) == {"cua_thong_ban_cong", "wc_giua_nha"}
    ma = {d["ma"]: d for d in r["dien_giai"]["dau_hieu"]}
    assert ma["wc_giua_nha"]["veto"] and ma["wc_giua_nha"]["tu_mat_bang"] and ma["cua_thong_ban_cong"]["veto"]
    assert r["veto_da_xac_nhan"] == ["wc_giua_nha", "cua_thong_ban_cong"]
    # người khai tay thắng ô vẽ
    r2 = bc.luan({"huong_nha_do": 180, "vi_tri": {"bep": "Tây"}, "mat_bang": {"luoi": ["111", "111", "111"], "phong": {"bep": [2, 0]}}}, None)
    assert {v["phong"]: v["cung"] for v in r2["da_tinh"]["vi_tri"]}["bep"] == "Tây"
    # chữ L → khuyết góc → dấu hiệu nha_chu_l
    r3 = bc.luan({"huong_nha_do": 0, "mat_bang": {"luoi": ["1100", "1100", "1111", "1111"]}}, None)
    assert r3["mat_bang"]["khuyet_goc"] == ["Đông Bắc"] and "nha_chu_l" in r3["mat_bang"]["dau_hieu_suy_ra"]


def test_bo_cuc_hai_loi_giai_thich_va_viec_theo_chi_phi():
    xua = bc.luan(BO_CUC_VETO, SINH, "sach_xua")["dien_giai"]["dau_hieu"][0]
    r_nay = bc.luan(BO_CUC_VETO, SINH, "doi_song")
    nay = r_nay["dien_giai"]["dau_hieu"][0]
    assert xua["ma"] == nay["ma"] == "xa_ngang" and xua["noi_dung"] != nay["noi_dung"]
    assert xua["noi_dung"] == xua["giai_thich"]["sach_xua"] and nay["noi_dung"] == nay["giai_thich"]["doi_song"]
    assert {v["chi_phi"] for v in nay["viec"]} >= {"khong_ton", "it_tien"}
    # căn hộ + xà ngang: luật "không đập kết cấu" — việc sửa chữa chỉ còn trần thạch cao
    assert all("thạch cao" in v["lam"] for v in nay["viec"] if v["chi_phi"] == "sua_chua")
    assert [q["ma"] for q in r_nay["quy_tac"]] == ["khong_dap_ket_cau"]
    # nhà phố: không áp luật căn hộ, việc sửa chữa đầy đủ
    pho = bc.luan({**BO_CUC_VETO, "loai_nha": "nha_pho"}, SINH)
    assert pho["quy_tac"] == []
    r = client.post("/v1/phongthuy/bo-cuc", json={"bo_cuc": BO_CUC_VETO, "goc_nhin": "doi_song"})
    assert r.status_code == 200 and r.json()["goc_nhin"] == "doi_song" and r.json()["chi_phi"]
    assert client.post("/v1/phongthuy/bo-cuc", json={"bo_cuc": BO_CUC_VETO, "goc_nhin": "khac"}).status_code == 422
    assert client.post("/v1/phongthuy/bo-cuc", json={"bo_cuc": {"mat_bang": {"luoi": ["11", "11"]}}}).status_code == 422


# ----------------------------------------------------------------------------- báo cáo: Q1 / Q5 / an toàn / ý định
def test_tran_muc_theo_dau_hieu_veto():
    # không dấu hiệu: hướng Nam với Khảm là Diên Niên → chương 2 Thuận lợi
    bc0 = ds.luan_giai(SINH, {"bo_cuc": {**BO_CUC_VETO, "dau_hieu": {}}}, ngay_xem=NGAY)
    assert bc0["chuong"][1]["muc"] == "thuan" and "tran_muc" not in bc0["chuong"][1]
    # có xà ngang đã xác nhận → trần Cân bằng ở chương 2 và 3, hộp "Trước hết" đứng đầu Điều quan trọng nhất
    bc1 = ds.luan_giai(SINH, {"bo_cuc": BO_CUC_VETO}, ngay_xem=NGAY)
    c2, c3 = bc1["chuong"][1], bc1["chuong"][2]
    assert c2["muc"] == "can_bang" and c2["tran_muc"]["ly_do"] == ["Giường, bàn dưới xà ngang"]
    assert c3["muc"] in ("can_bang", "can_chu_dong") and c3["tran_muc"]
    assert bc1["cot_loi"][0]["tieu_de"].startswith("Trước hết") and bc1["cot_loi"][0].get("veto")
    assert bc1["da_tinh"]["veto_da_xac_nhan"] == [{"ma": "xa_ngang", "tieu_de": "Giường, bàn dưới xà ngang"}]
    assert "Hình thế là nền" in bc1["nguyen_tac"]
    # dấu hiệu không veto (gương đối giường) → không trần
    bc2 = ds.luan_giai(SINH, {"bo_cuc": {**BO_CUC_VETO, "dau_hieu": {"guong_giuong": {"co": True}}}}, ngay_xem=NGAY)
    assert bc2["chuong"][1]["muc"] == "thuan" and "tran_muc" not in bc2["chuong"][1]
    # lớp đời thường vẫn sạch giọng AI / từ doạ
    loi = kh.kiem_giong_van(bc1, mo_dun="phongthuy")
    assert not loi, loi


def test_viec_theo_chi_phi_va_luat_can_ho_trong_bao_cao():
    bc1 = ds.luan_giai(SINH, {"bo_cuc": BO_CUC_VETO, "nam_xay": 2008}, ngay_xem=NGAY, goc_nhin="doi_song")
    c3, c5 = bc1["chuong"][2], bc1["chuong"][4]
    assert [x["ma"] for x in c5["hanh_dong_chi_phi"]] == ["khong_ton", "it_tien", "sua_chua"]
    assert all(1 <= len(x["viec"]) <= 5 for x in c5["hanh_dong_chi_phi"])
    assert any("dầm" in v for v in c5["hanh_dong_chi_phi"][0]["viec"])          # việc 0 đồng của xà ngang có mặt
    assert any(h["tieu_de"].startswith("Căn hộ") for h in c3["hop"])             # Q6 luật căn hộ thành hộp lời khuyên
    xa = next(h for h in c3["hop"] if "xà ngang" in h["tieu_de"].lower())
    assert xa.get("veto") and xa["viec"] and "dầm" in xa["noi_dung"].lower()      # góc nhìn đời sống: nói về dầm, giấc ngủ
    assert any("thói quen" in d for d in c5["doan"])


def test_an_toan_trong_bao_cao_khi_cap_sao_lua_dien():
    # Tìm một năm xây + hướng mà cặp sao phía cửa có an_toan → đoạn + hộp "cẩn thận hơn" xuất hiện, không từ doạ.
    tim = None
    for nam_xay in range(1984, 2024):
        for do in range(0, 360, 45):
            bcx = ds.luan_giai(None, {"huong_do": do, "nam_xay": nam_xay}, ngay_xem=NGAY)
            ch = bcx["da_tinh"]["huyen_khong"]["cap_huong"]
            if ch.get("an_toan") and "lửa" in ch["an_toan"][0]:
                tim = bcx
                break
        if tim:
            break
    assert tim, "phải có ít nhất một nhà có cặp sao lửa điện ở phía cửa"
    c2 = tim["chuong"][1]
    assert any("Sách xưa gắn" in d for d in c2["doan"])
    h = next(x for x in c2["hop"] if x["tieu_de"].startswith("Phía cửa: cẩn thận hơn"))
    assert h["loai"] == "luu_y" and h["an_toan"] and "điện" in h["huong_xu_ly"]
    assert not kh.kiem_giong_van(tim, mo_dun="phongthuy")


def test_do_thi_tri_thuc_theo_y_dinh():
    nut = do_thi.nut()
    for a, _, b in do_thi.canh():
        assert a.split(":")[0] in do_thi.LOAI_NUT and b.split(":")[0] in do_thi.LOAI_NUT
    # mọi ý định chung đều có trong đồ thị; mọi dấu hiệu / phòng trong đồ thị đều có thật
    for ma in y_dinh_chung.tat_ca():
        g = do_thi.theo_y_dinh(ma)
        assert g and g["phong"] and all(p in bc.TEN_PHONG for p in g["phong"]), ma
        assert all(x in bc.DAU_HIEU for x in g["dau_hieu"]), ma
        assert all(1 <= s <= 9 for s in g["sao"]), ma
    thieu = [x for x in bc.DAU_HIEU if f"dau_hieu:{x}" not in nut]
    assert thieu == [], thieu
    # một "truy vấn Cypher" của Drive: sao 5 kích hoạt dấu hiệu nào ở phòng nào
    assert do_thi.duong_di("sao:5", "phong:ve_sinh") == [("sao:5", "KICH_HOAT", "dau_hieu:wc_giua_nha"), ("dau_hieu:wc_giua_nha", "O_PHONG", "phong:ve_sinh")]
    assert do_thi.duong_di("y_dinh:tinh_cam", "sao:9", toi_da=1) is None     # không có cạnh trực tiếp; qua sao 1 khắc 9 mới tới
    assert ("SINH", "sao:2") in do_thi.lang_gieng("sao:9") and ("KHAC", "sao:6") in do_thi.lang_gieng("sao:9")
    # trong báo cáo: ý định "sức khoẻ" → phòng ngủ, bếp, nhà vệ sinh; năm sao 2/5 tới phía phòng; hộp liên quan
    r = ds.luan_giai(SINH, {"bo_cuc": BO_CUC_VETO, "nam_xay": 2008}, ngay_xem=NGAY, y_dinh="suc_khoe")
    t = r["theo_y_dinh"]
    assert t["ten"] and [p["ma"] for p in t["phong"]] == ["phong_ngu_chinh", "bep", "ve_sinh"]
    assert any(d["ma"] == "xa_ngang" and d["co"] and d["veto"] for d in t["dau_hieu"])
    assert all(set(x["sao"]) <= {2, 5} and x["nam"] == sorted(x["nam"]) for x in t["nam_sao_toi"])
    assert t["hop"] and all(h.get("tu_chuong") for h in t["hop"])
    assert ds.luan_giai(SINH, {"huong_do": 180}, ngay_xem=NGAY, y_dinh="khong_co")["theo_y_dinh"] is None
    r2 = client.get("/v1/phongthuy/do-thi/cong_viec")
    assert r2.status_code == 200 and r2.json()["phong"] == ["phong_lam_viec", "cua_chinh"] and r2.json()["dau_hieu_hoi"]
    assert client.get("/v1/phongthuy/do-thi/khong_co").status_code == 404


def test_api_huong_ban_do_va_luan_giai_y_dinh():
    r = client.post("/v1/phongthuy/huong-ban-do", json={"tam": [10.7769, 106.7009], "truoc": [10.7769, 106.7019]})
    assert r.status_code == 200
    d = r.json()
    assert d["huong"] == "Đông" and abs(d["do_huong"] - 90) < 0.5 and d["khoang_cach_m"] > 100 and "bắc thật" in d["luu_y"]
    assert client.post("/v1/phongthuy/huong-ban-do", json={"tam": [10.7769, 106.7009], "truoc": [10.7769, 106.7009]}).status_code == 422
    assert client.post("/v1/phongthuy/huong-ban-do", json={"tam": [95, 0], "truoc": [0, 0]}).status_code == 422
    r = client.post("/v1/phongthuy/luan-giai", json={"nha": {"huong_do": 180, "bo_cuc": BO_CUC_VETO}, "y_dinh": "nha_cua", "goc_nhin": "doi_song", "ngay_xem": "2026-05-20"})
    assert r.status_code == 200 and r.json()["theo_y_dinh"]["ma"] == "nha_cua" and r.json()["da_tinh"]["goc_nhin"] == "doi_song"
    assert client.post("/v1/phongthuy/luan-giai", json={"nha": {"huong_do": 180}, "y_dinh": "Nhà cửa!"}).status_code == 422


def test_da_xu_ly_co_false_thang_dau_hieu_suy_tu_mat_bang():
    # UI-PT 4: người dùng bấm "Tôi đã xử lý" → web gửi {co: false, nguon: nguoi_dung}; dấu hiệu máy suy từ vị trí / mặt bằng
    # không còn được luận, trần mức Q1 gỡ; nguồn ảnh không ghi đè.
    bo = {**BO_CUC_VETO, "vi_tri": {**BO_CUC_VETO["vi_tri"], "ve_sinh": "Trung cung"},
          "dau_hieu": {"xa_ngang": {"co": False, "nguon": "nguoi_dung"}, "wc_giua_nha": {"co": False, "nguon": "nguoi_dung"}}}
    r = bc.luan(bc.BoCuc(**bo), SINH)
    assert {d["ma"] for d in r["dien_giai"]["dau_hieu"]} == set() and r["veto_da_xac_nhan"] == []
    bao = ds.luan_giai(SINH, {"bo_cuc": bo}, ngay_xem=NGAY)
    assert "tran_muc" not in bao["chuong"][1] and bao["da_tinh"]["veto_da_xac_nhan"] == []
    # nguồn ảnh khai "không có" không ghi đè suy luận từ vị trí
    bo2 = {**bo, "dau_hieu": {"wc_giua_nha": {"co": False, "nguon": "anh"}}}
    r2 = bc.luan(bc.BoCuc(**bo2), SINH)
    assert "wc_giua_nha" in {d["ma"] for d in r2["dien_giai"]["dau_hieu"]}
