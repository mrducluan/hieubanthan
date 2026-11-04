# -*- coding: utf-8 -*-
"""Review độc lập CY-1 + TV-YBS (2026-11-04) — 14 phát hiện, mỗi phát hiện một khoá.

CAO: (1) "Năm nên chú ý {mảng}" không được nói ngược chương Vận hạn (năm thuận / Lộc năm vào cung của mảng) · lớp mười
năm không cộng điểm · ít hộp hơn · Bát tự / SK-1 cùng kiểm. (2) hỏi "năm nào / khi nào … bị <bệnh>" không có năm.
(3) tuổi thọ / sống chết bị chặn ở CẢ 5 mảng (bộ chung `an_toan`).
VỪA: (4) không lộ `y_goc_tom_tat` ra đầu ra · (5) ý "chung chung" (> 60 % lá) không vào báo cáo; ý thi cử theo năm cần
điều kiện riêng, lời không đoán · (6) không "nét này" trơ trọi, tiêu đề ≠ thân · (7) căn cứ Tử vi ghi năm, lọc theo năm
có cấu trúc · (8) câu tai nạn đi đúng mảng đi lại, đoạn đầu là năm; Kinh Dịch mở bằng "không trả lời có / không".
THẤP: (9) tuyển dụng trá hình · (10) Phong thuỷ đồng cảm câu khủng hoảng quan hệ · (11) hộp nhiều mảng ngắn, một lời
miễn trừ, mã ổn định · (12) lời sát tinh sáng / hãm không thuật ngữ, căn cứ đúng cung · (13) Xem 2 người nói ngôi thứ ba
· (14) lời sức khoẻ người thân chỉ đúng chỗ trên web."""
from __future__ import annotations

import datetime as dt
import json
import re
from pathlib import Path

import pytest

from app.calc import lunar
from app.calc import tuvi_phi_hoa as phi
from app.hoidap import battu as hd_bt, kinhdich as hd_kd, phongthuy as hd_pt, tuvi as hd_tv
from app.kb import chu_y_kb as cykb
from app.kb import tuvi_y_bo_sung as kyb
from app.luangiai import an_toan
from app.luangiai import battu_doi_song as btd
from app.luangiai import chu_y_nam as cyn
from app.luangiai import tuvi_doi_song as tvd
from app.luangiai import tuvi_y_bo_sung as yb
from app.narrative import hoi_van

GOLDEN = Path(__file__).resolve().parents[1] / "fixtures" / "golden"
XEM = dt.date(2026, 11, 4)
_LA = json.loads((GOLDEN / "lasotuvi_60.json").read_text(encoding="utf-8"))["cases"]
NGUOI = {"ho_ten": ["Nguyễn Thị Mai Anh"], "ngay": 17, "thang": 5, "nam": 1990, "quy_uoc": "tung_phan"}
LUAN = {"ho_ten": ["Nguyễn Đức Luân"], "ngay": 24, "thang": 10, "nam": 1988, "quy_uoc": "tong_het"}
SV = {"ngay": dt.date(1990, 5, 17), "ti": 6, "gioi_tinh": "nu"}
SB = {"lich": dt.datetime(1990, 5, 17, 12, 0), "gioi_tinh": "nu", "gio_ty": "da_ty"}
SP = {"nam": 1990, "gioi_tinh": "nu", "ngay": dt.date(1990, 5, 17), "moc_nam": "lap_xuan"}
REVIEW = {"ngay": dt.date(2000, 6, 18), "ti": 10, "gioi_tinh": "nu"}          # 19:20 nữ — lá review nêu
MON = ("thanso", "tuvi", "battu", "phongthuy", "kinhdich")


def _hoi(md: str, c: str, nguoi: dict = NGUOI) -> dict:
    if md == "thanso":
        return hoi_van.tra_loi(c, nguoi, None, XEM, dung_llm=False)
    if md == "tuvi":
        return hd_tv.tra_loi(c, "tham_khao", sinh=SV, ngay_xem=XEM)
    if md == "battu":
        return hd_bt.tra_loi(c, sinh=SB, ngay_xem=XEM)
    if md == "phongthuy":
        return hd_pt.tra_loi(c, sinh=SP, ngay_xem=XEM)
    return hd_kd.tra_loi(c, "tu_dong", gia_tri_hao=[7, 8, 9, 7, 6, 8], thoi_diem=dt.datetime(2026, 11, 1, 9, 0),
                         cach_ra_que="gieo_tay")


def _sinh(ca: dict) -> dict:
    return {"ngay": dt.date.fromisoformat(ca["ngay"]), "ti": ca["ti"], "gioi_tinh": ca["gioi_tinh"]}


@pytest.fixture(scope="module")
def bc_tv() -> list[dict]:
    return [tvd.lap(_sinh(c), XEM) for c in _LA[:30]] + [tvd.lap(REVIEW, XEM)]


@pytest.fixture(scope="module")
def bc_bt() -> list[dict]:
    g = json.loads((GOLDEN / "battu_doi_song.json").read_text(encoding="utf-8"))["cases"]
    return [btd.lap({"lich": dt.datetime.fromisoformat(c["lich"]), "gioi_tinh": c["gioi_tinh"],
                     "gio_ty": c.get("gio_ty", "da_ty")}, XEM) for c in g]


def _chuong(bc: dict, ma: str) -> dict:
    return next(c for c in bc["chuong"] if c["ma"] == ma)


def _hop_cy(bc: dict) -> list[tuple[str, dict]]:
    return [(c["ma"], h) for c in bc["chuong"] for h in c["hop"] if h.get("chu_y")]


def _ls(bc: dict) -> dict:
    return bc["_ls"] if "_ls" in bc else None


# ------------------------------------------------------------------ (1) CY không nói ngược Vận hạn
def test_cy_tuvi_khong_nam_thuan_khong_loc_vao_cung(bc_tv):
    for bc in bc_tv:
        dong = {g["nam"]: g for g in _chuong(bc, "van_han")["dong_nam"]}
        for _, h in _hop_cy(bc):
            for m, ns in h["nam_theo_mang"].items():
                for n in ns:
                    assert dong[n]["muc"] != "thuan", (m, n, h["noi_dung"][:120])


def test_cy_tuvi_lo_c_nam_vao_cung_khong_tinh():
    from app.calc import tuvi_an_sao as az
    from app.hoidap.tuvi import tom_tat
    for ca in _LA[:20]:
        ls = tom_tat(az.an_sao_tho(dt.date.fromisoformat(ca["ngay"]), ca["ti"], ca["gioi_tinh"], "vi-VN"))
        ns = int(ca["ngay"][:4])
        for m in cykb.cac_mang():
            cung = cykb.theo_mon(m, "tuvi")["cung"]
            for x in cyn.tuvi_nam(ls, 2026, ns, m):
                can, _ = lunar.can_chi_nam(x["nam"])
                loc = next(y for y in phi.phi_tu_can(can, ls["cung"]) if y["hoa"] == "Lộc")
                assert loc["den_cung"] != cung, (m, x["nam"])
                # lớp mười năm (đại hạn) chỉ là bối cảnh: không thành lý do tính điểm
                assert not set(x["ly_do"]) & {"dai_han", "ky_dai_han"}, x["ly_do"]
                assert x["diem"] >= cyn.NGUONG_MANG


def test_cy_tuvi_lá_review_khong_tien_bac_nam_tang_thu(bc_tv):
    bc = bc_tv[-1]
    dong = {g["nam"]: g for g in _chuong(bc, "van_han")["dong_nam"]}
    thuan = {n for n, g in dong.items() if g["muc"] == "thuan"}
    for _, h in _hop_cy(bc):
        assert not set(h["cac_nam"]) & thuan, (h["tieu_de"], h["cac_nam"], thuan)


def test_cy_tuvi_it_hop_hon(bc_tv):
    tb = sum(len(_hop_cy(bc)) for bc in bc_tv) / len(bc_tv)
    assert tb <= 3.0, tb


def test_cy_battu_khong_nam_thuan(bc_bt):
    for bc in bc_bt:
        dong = {g["nam"]: g for g in _chuong(bc, "van_han").get("dong_nam") or []}
        for _, h in _hop_cy(bc):
            for ns in h["nam_theo_mang"].values():
                for n in ns:
                    g = dong.get(n) or {}
                    assert "thuan" not in (g.get("muc_cach_1"), g.get("muc_cach_2")), (n, g)


def test_sk1_khong_nam_loc_vao_tat_ach():
    from app.calc import tuvi_an_sao as az
    from app.hoidap.tuvi import tom_tat
    from app.luangiai import suc_khoe_nam as skn
    for ca in _LA[:20]:
        ls = tom_tat(az.an_sao_tho(dt.date.fromisoformat(ca["ngay"]), ca["ti"], ca["gioi_tinh"], "vi-VN"))
        for x in skn.tuvi_nam(ls, 2026, int(ca["ngay"][:4])):
            can, _ = lunar.can_chi_nam(x["nam"])
            loc = next(y for y in phi.phi_tu_can(can, ls["cung"]) if y["hoa"] == "Lộc")
            # năm Lộc vào Tật Ách không thành năm nên chú ý sức khoẻ — trừ khi Kỵ năm CŨNG nhập (bất biến SK-1)
            assert loc["den_cung"] != "Tật Ách" or "ky_nhap" in x["ly_do"], x


# ------------------------------------------------------------------ (2) hỏi "năm nào bị <bệnh>" — không năm
@pytest.mark.parametrize("cau", ["Năm nào tôi bị ung thư?", "Khi nào tôi mắc bệnh tiểu đường?",
                                 "Bao giờ tôi bị đột quỵ?", "Tôi bị ung thư năm nào?", "Năm nao toi bi ung thu"])
def test_hoi_benh_theo_thoi_diem(cau):
    assert an_toan.hoi_benh(cau)
    for md in MON:
        k = _hoi(md, cau)
        assert k["phan_loai"]["xu_ly"] == "tu_choi_nhe", md
        assert not re.search(r"20\d\d", k["cau_tra_loi"]), (md, k["cau_tra_loi"][:300])


# ------------------------------------------------------------------ (3) tuổi thọ — một bộ chặn chung
@pytest.mark.parametrize("cau", ["Tôi sống được bao lâu?", "Tôi thọ bao nhiêu tuổi?", "Tôi có chết sớm không?",
                                 "Năm nào tôi chết?", "Bố tôi còn sống được mấy năm?", "Toi song duoc bao lau"])
def test_tuoi_tho_moi_mang_tu_choi(cau):
    assert an_toan.tu_choi(cau) == "du_doan_cu_the"
    for md in MON:
        assert _hoi(md, cau)["phan_loai"]["xu_ly"] == "tu_choi_nhe", md


@pytest.mark.parametrize("cau", ["Tôi sống ở Hà Nội lâu rồi, có nên chuyển vào Nam không?", "Sống bao lâu thì nên mua nhà?",
                                 "Ông tôi mất năm 2010, giỗ ông nên làm ngày nào?"])
def test_tuoi_tho_khong_chan_nham(cau):
    assert an_toan.tu_choi(cau) is None


# ------------------------------------------------------------------ (4) không lộ y_goc_tom_tat
def _goc_ds() -> list[str]:
    return [m["y_goc_tom_tat"].strip().rstrip(".") for m in kyb.tat_ca() if len(m.get("y_goc_tom_tat") or "") >= 20]


def test_khong_lo_y_goc_tom_tat(bc_tv):
    from app.kb import trang
    from app.luangiai import tuvi_hai_nguoi as hn
    from app.calc import tuvi_an_sao as az
    from app.hoidap.tuvi import tom_tat
    goc = _goc_ds()
    van = [json.dumps(bc, ensure_ascii=False) for bc in bc_tv[:12]]
    for cau, s in [("Tình duyên của tôi thế nào?", {"ngay": dt.date(1990, 5, 12), "ti": 4, "gioi_tinh": "nu"}),
                   ("Sự nghiệp của tôi ra sao?", {"ngay": dt.date(1978, 1, 22), "ti": 2, "gioi_tinh": "nam"}),
                   ("Năm 2027 sức khoẻ của tôi thế nào?", {"ngay": dt.date(1990, 5, 12), "ti": 4, "gioi_tinh": "nu"}),
                   ("Mười năm tới sự nghiệp tôi ra sao?", {"ngay": dt.date(1985, 9, 3), "ti": 7, "gioi_tinh": "nam"})]:
        van.append(json.dumps(hd_tv.tra_loi(cau, sinh=s, ngay_xem=XEM), ensure_ascii=False))
    for loai, slug in [("sao_cung", "thien-dong-cung-phu-the"), ("sao_cung", "cu-mon-cung-menh"),
                       ("chinh_tinh", "that-sat")]:
        t = trang.lay(loai, slug)
        if t:
            van.append(json.dumps(t, ensure_ascii=False))
    a = tom_tat(az.an_sao_tho(dt.date(1990, 5, 15), 1, "nam", "vi-VN"))
    b = tom_tat(az.an_sao_tho(dt.date(1992, 8, 21), 4, "nu", "vi-VN"))
    van.append(json.dumps(hn.cach_doc_them(a, b, "vo_chong", "nam", "nu"), ensure_ascii=False))
    for v in van:
        for g in goc:
            assert g not in v, g


# ------------------------------------------------------------------ (5) ý chung chung / thi cử theo năm
def test_y_bo_sung_khong_chung_chung(bc_tv):
    from collections import Counter
    dem = Counter()
    for bc in bc_tv:
        ma = {h.get("ma_mau", "") for c in bc["chuong"] for h in c["hop"]}
        ma |= {y.get("ma_mau", "") for c in bc["chuong"] for y in (c.get("goc_nhin_khac") or {}).get("y", [])}
        ma |= {f"yb_lg.{h['y_bo_sung'].get('ma')}" for c in bc["chuong"] for h in c["hop"] if h.get("y_bo_sung")}
        for i in {m.split(".yb.", 1)[1] for m in ma if ".yb." in m} | {m[6:] for m in ma if m.startswith("yb_lg.")}:
            dem[i] += 1
    qua = {i: k / len(bc_tv) for i, k in dem.items() if k / len(bc_tv) > 0.6}
    assert not qua, qua


def test_xuong_ky_nam_thi_khong_doan():
    m = kyb.lay("yb.hoa.xuong_ky_nam_thi")
    for s in (m["loi_doi_thuong"], m.get("loi_ro") or ""):
        assert not re.search(r"chưa như mong muốn|không đỗ|trượt|thi hỏng", s), s
    assert "Văn Xương" not in m["y_goc_tom_tat"] or "Văn Khúc" in m["y_goc_tom_tat"]


def test_xuong_ky_chi_khi_vao_cung_hoc_va_dung_tuoi(bc_tv):
    for bc in bc_tv:
        for c in bc["chuong"]:
            for h in c["hop"]:
                if h.get("ma_mau", "").endswith("xuong_ky_nam_thi"):
                    assert h["noi_dung"].strip(), h
                    assert h["tieu_de"].strip().rstrip(".") != h["noi_dung"].strip().rstrip(".")


# ------------------------------------------------------------------ (6) không "nét này" trơ trọi
_NET = re.compile(r"(?i)(có|gặp|của) nét này|nét này (sáng|nói|ở|là|hợp)|^nét này|^ở mảng này|mảng có nét|nhà có nét"
                  r"|điểm hao này|gắn nét này")


def _cac_van(bc: dict) -> list[str]:
    ra = []
    for c in bc["chuong"]:
        for h in c["hop"]:
            if ".yb." in h.get("ma_mau", ""):           # chữ của ý bổ sung (hộp luận cũ có tiêu đề làm chủ ngữ)
                ra += [h.get("tieu_de") or "", h.get("noi_dung") or "", h.get("huong_xu_ly") or ""]
            if h.get("y_bo_sung"):
                ra += [h["y_bo_sung"].get("noi_dung") or "", h["y_bo_sung"].get("viec") or ""]
        for y in (c.get("goc_nhin_khac") or {}).get("y", []):
            ra += [y.get("tieu_de") or "", y.get("noi_dung") or "", y.get("huong_xu_ly") or ""]
    return ra


def test_khong_net_nay_tro_troi(bc_tv):
    for bc in bc_tv:
        for s in _cac_van(bc):
            assert not _NET.search(s), s


def test_hoi_dap_khong_net_nay():
    for cau, s in [("Tình duyên của tôi thế nào?", {"ngay": dt.date(1990, 5, 12), "ti": 4, "gioi_tinh": "nu"}),
                   ("Sự nghiệp của tôi ra sao?", {"ngay": dt.date(1990, 5, 12), "ti": 4, "gioi_tinh": "nu"}),
                   ("Năm 2027 sức khoẻ của tôi thế nào?", {"ngay": dt.date(1990, 5, 12), "ti": 4, "gioi_tinh": "nu"})]:
        v = hd_tv.tra_loi(cau, sinh=s, ngay_xem=XEM)["cau_tra_loi"]
        assert not _NET.search(v), v


def test_tieu_de_khac_than_hop_y_bo_sung(bc_tv):
    for bc in bc_tv:
        for c in bc["chuong"]:
            for h in c["hop"] + (c.get("goc_nhin_khac") or {}).get("y", []):
                if ".yb." in h.get("ma_mau", ""):
                    t = h["tieu_de"].strip().rstrip(".").lower()
                    n = (h.get("noi_dung") or "").strip().rstrip(".").lower()
                    assert n and t != n, h


# ------------------------------------------------------------------ (7) căn cứ Tử vi ghi năm
def test_can_cu_cy_tuvi_ghi_nam(bc_tv):
    for bc in bc_tv:
        for _, h in _hop_cy(bc):
            cu = [c for c in h["can_cu"] if not c.startswith("Bối cảnh")]
            assert len(cu) == len(set(cu)), cu
            assert all(re.match(r"Năm 20\d\d \(", c) for c in cu), cu
            for m, ds in h["can_cu_theo_nam"].items():
                assert m in h["chu_y"]
                for x in ds:
                    assert x["can_cu"] and all(c.startswith(f"Năm {x['nam']} (") for c in x["can_cu"])


def test_nam_dich_giu_ly_do_tuvi(bc_tv):
    for bc in bc_tv[:10]:
        for _, h in _hop_cy(bc):
            for n in h["cac_nam"]:
                x = cyn.hop_nam_dich(h, n)
                assert x and x["can_cu"] and all(f"Năm {n} (" in c for c in x["can_cu"] if not c.startswith("Bối cảnh"))
            for m in h["chu_y"]:
                for y in cyn.tu_bao_cao([{"hop": [h]}], m, 2026) or []:
                    assert y["can_cu"], (m, y)


# ------------------------------------------------------------------ (8) tai nạn → đi lại
def test_battu_tai_nan_giao_thong_la_di_lai():
    k = _hoi("battu", "Năm nào tôi gặp tai nạn giao thông?")
    p0 = k["cau_tra_loi"].split("\n\n")[0]
    assert "đi lại" in p0 and "sức khoẻ" not in p0.split(":")[0], p0
    ds = [m for m in k["bang_chung"]["muc"] if m.get("loai") == "doi_song"]
    assert not ds or ds[0]["chuong"] == "quan_he"


@pytest.mark.parametrize("nguoi", [NGUOI, LUAN])
def test_thanso_tai_nan_mo_bang_di_lai(nguoi):
    v = _hoi("thanso", "Tôi có bị tai nạn không?", nguoi)["cau_tra_loi"]
    p = v.split("\n\n")
    assert p[0].startswith("Về chuyện đi lại") and "nên chú ý đi lại hơn" in p[0], p[0]
    assert re.search(r"Năm 20\d\d", p[0])
    assert not any(re.fullmatch(r"Năm nên chú ý [^:]+:[^.]+\.", x.strip()) for x in p), p


@pytest.mark.parametrize("cau", ["Tôi có bị mất tiền không?", "Tôi có bị tai nạn không?", "Năm nay tôi có thắng kiện không?"])
def test_kinhdich_lo_mo_bang_khung(cau):
    p0 = _hoi("kinhdich", cau)["cau_tra_loi"].split("\n\n")[0]
    i = p0.find("không trả lời có hay không")
    assert i >= 0, p0
    j = p0.find("Quẻ ")
    assert j < 0 or i < p0.find("Quẻ ", i - 5) + 5 or i < j or p0.startswith("Về"), p0


# ------------------------------------------------------------------ (9) tuyển dụng trá hình
@pytest.mark.parametrize("cau", ["Tuổi nào hợp làm nhân viên kế toán cho tôi?", "Nên tuyển người tuổi gì làm thư ký?",
                                 "Tuoi nao hop lam nhan vien ban hang cho cong ty toi"])
def test_tuyen_dung_tra_hinh(cau):
    assert an_toan.tu_choi(cau) == "tuyen_dung"
    for md in MON:
        assert _hoi(md, cau)["phan_loai"]["xu_ly"] == "tu_choi_nhe", md


@pytest.mark.parametrize("cau", ["Tôi có hợp làm kế toán không?", "Tuổi nào hợp làm ăn với tôi?",
                                 "Tôi có nên làm nhân viên văn phòng không?"])
def test_tuyen_dung_khong_chan_nham(cau):
    assert an_toan.tu_choi(cau) != "tuyen_dung"


# ------------------------------------------------------------------ (10) Phong thuỷ đồng cảm
@pytest.mark.parametrize("cau", ["Chồng tôi có ngoại tình không", "Tôi có ly hôn không?"])
def test_phongthuy_dong_cam(cau):
    p0 = _hoi("phongthuy", cau)["cau_tra_loi"].split("\n\n")[0]
    assert "nặng lòng" in p0, p0


# ------------------------------------------------------------------ (11) hộp nhiều mảng gọn
def test_hop_nhieu_mang_gon(bc_tv):
    co = 0
    for bc in bc_tv:
        for ch, h in _hop_cy(bc):
            if len(h["chu_y"]) < 2:
                continue
            co += 1
            assert len(h["noi_dung"].split()) <= 80, (len(h["noi_dung"].split()), h["noi_dung"])
            assert sum(cykb.ranh_gioi(m) in h["noi_dung"] for m in cykb.cac_mang()) == 0
            assert h["noi_dung"].count(cykb.mau("ranh_gioi_nhieu").split(";")[0]) == 1
            assert h["ma_mau"] == f"ds.{ch}.chu_y.{'+'.join(h['chu_y'])}", h["ma_mau"]
    assert co


# ------------------------------------------------------------------ (12) sát tinh sáng / hãm
def test_sat_sang_ham_khong_thuat_ngu(bc_tv):
    for bc in bc_tv:
        for c in bc["chuong"]:
            for h in c["hop"]:
                if h.get("ma_mau", "").endswith("sat_sang_ham"):
                    v = h["tieu_de"] + " " + h.get("noi_dung", "")
                    assert not re.search(r"chỗ sáng|chỗ tối", v), v
                    if c["ma"] == "tong_quan":
                        assert any(re.search(r"cung (Mệnh|an Thân)", x) for x in h["can_cu"]), h["can_cu"]


# ------------------------------------------------------------------ (13) Xem 2 người — ngôi thứ ba
def test_hai_nguoi_phia_nguoi_ay_ngoi_thu_ba():
    from app.luangiai import tuvi_hai_nguoi as hn
    from tests.test_tuvi_hai_nguoi_cach_doc import _ls
    ds = hn.cach_doc_them(_ls(["Tử Vi"], ["Thiên Tướng"]), _ls(["Tham Lang"], ["Thất Sát"]), "vo_chong")
    kia = [h for h in ds if h["ma_mau"].split(".")[3] == "kia"]
    assert kia
    for h in kia:
        assert "chữ “bạn” ở đây" not in h["noi_dung"] and "chữ \"bạn\"" not in h["noi_dung"]
        assert not re.match(r"Bạn\b", h["noi_dung"]) and "người ấy" in h["noi_dung"].lower(), h["noi_dung"]
        assert not re.search(r"dễ nguội nhanh|dễ thích nhanh", h["noi_dung"]), h["noi_dung"]
    for m in kyb.theo_loai("hon_nhan", hien_thi="hop"):
        dk = m["dieu_kien"]
        if "Phu Thê" in (dk.get("cung") if isinstance(dk.get("cung"), list) else [dk.get("cung")]) \
                and not dk.get("hai_nguoi") and not dk.get("nhom_ca_hai"):
            assert m.get("loi_nguoi_ay"), m["id"]


# ------------------------------------------------------------------ (14) người thân — chỉ đúng chỗ trên web
def test_suc_khoe_nguoi_than_chi_dung_cho():
    for md in MON:
        v = _hoi(md, "Mẹ tôi bị bệnh gì?")["cau_tra_loi"]
        assert "Đang xem: Bạn" in v and "Thêm người thân" in v, (md, v)
        assert "lời nhắc phòng ngừa theo sách xưa" not in v, (md, v)
