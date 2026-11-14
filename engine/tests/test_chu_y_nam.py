# -*- coding: utf-8 -*-
"""CY-1 (2026-11-04, chủ dự án giao) — "năm nên chú ý {mảng} hơn" cho mọi mảng đời (tiền bạc, công việc, tình cảm, gia
đạo, nhà cửa, đi lại, giấy tờ, bạn bè, vận hạn) — mở rộng SK-1 (sức khoẻ là một mảng của cùng cơ chế).

Khoá: (1) KB đủ trường + source_id/school_id, lời không có cụm cấm / giọng AI; (2) SK-1 là trường hợp riêng của hàm chung
(kết quả y nguyên); (3) hộp báo cáo: loại thời điểm, không chip mức, không đổi mức chương, mã `.chu_y.` qua mẫu SQL,
≤ 1 hộp / chương, trần hộp giữ nguyên, dưới 18 tuổi không có; (4) hỏi đáp 5 mảng trả lời câu lo (tai nạn, kiện, phá
sản, đầu tư, mất việc, vận hạn, đổ vỡ) bằng năm + việc + ranh giới — không bao giờ có / không; câu may rủi, tai nạn chết,
tuyển dụng vẫn từ chối nhưng kèm lời nhắc đúng mảng; (5) "ấm cúng" không bị bắt là "cúng"."""
from __future__ import annotations

import datetime as dt
import json
import re
from pathlib import Path

import pytest

from app.hoidap import battu as hd_bt, chung, kinhdich as hd_kd, phongthuy as hd_pt, tuvi as hd_tv
from app.kb import chu_y_kb as kb
from app.kb.tuvi_doi_song_kb import tim_cum_cam
from app.luangiai import chu_y_nam as cyn
from app.luangiai import doi_song_khuon as kh
from app.luangiai import hoi
from app.luangiai import suc_khoe_nam as skn
from app.narrative import hoi_van

GOLDEN = Path(__file__).resolve().parents[1] / "fixtures" / "golden"
XEM = dt.date(2026, 11, 2)
NGUOI = {"ho_ten": ["Nguyễn Thị Mai Anh"], "ngay": 17, "thang": 5, "nam": 1990, "quy_uoc": "tung_phan"}
SV = {"ngay": dt.date(1990, 5, 17), "ti": 6, "gioi_tinh": "nu"}
SB = {"lich": dt.datetime(1990, 5, 17, 12, 0), "gioi_tinh": "nu", "gio_ty": "da_ty"}
SP = {"nam": 1990, "gioi_tinh": "nu", "ngay": dt.date(1990, 5, 17), "moc_nam": "lap_xuan"}
MA_SQL = re.compile(r"^ds\.[a-z0-9_]+(\.[a-z0-9_+-]+)+$")          # 0017 kiem_chung_mau_hop_le, loại doi_song
DOA = ["sẽ mất tiền", "sẽ phá sản", "sẽ ly hôn", "sẽ chia tay", "sẽ bị kiện", "sẽ gặp tai nạn", "sẽ mất việc", "phá sản",
       "tai hoạ", "tai họa", "đại hung", "xui xẻo", "mất mạng", "giải hạn", "vật phẩm", "cúng sao", "chắc chắn sẽ"]


def _hoi(md: str, c: str) -> dict:
    if md == "thanso":
        return hoi_van.tra_loi(c, NGUOI, None, XEM, dung_llm=False)
    if md == "tuvi":
        return hd_tv.tra_loi(c, "tham_khao", sinh=SV, ngay_xem=XEM)
    if md == "battu":
        return hd_bt.tra_loi(c, sinh=SB, ngay_xem=XEM)
    if md == "phongthuy":
        return hd_pt.tra_loi(c, sinh=SP, ngay_xem=XEM)
    return hd_kd.tra_loi(c, "tu_dong", gia_tri_hao=[7, 8, 9, 7, 6, 8], thoi_diem=dt.datetime(2026, 11, 1, 9, 0),
                         cach_ra_que="gieo_tay")


# ------------------------------------------------------------------ KB
def test_kb_du_truong_va_nguon():
    d = kb._d()
    assert d["source_id"] and d["school_id"] and d["trang_thai"] == "nhap_ai"
    assert set(kb.cac_mang()) == {"tien_bac", "cong_viec", "tinh_cam", "gia_dao", "nha_cua", "di_lai", "giay_to", "ban_be",
                                  # CY-2 (2026-11-14): mảng mới cho lời "nên chú ý" đầy đủ chủ đề
                                  "hop_tac", "tieu_nhan", "hoc_hanh", "con_cai", "cong_danh", "xuat_ngoai", "mua_xe",
                                  # CY-3 (2026-11-14): tình huống cụ thể (vay mượn, chăm bố mẹ già, nhà chồng)
                                  "doi_no", "cho_vay", "di_vay", "cham_cha_me", "nha_chong"}
    for m in kb.cac_mang():
        o = kb.mang(m)
        assert o["ten"] and o["viec"] and o["viec_nay"] and o["ranh_gioi"], m
        assert o.get("tuvi", {}).get("cung"), m
        for mon in ("tuvi", "battu", "thanso", "phongthuy"):
            if mon in o:
                assert o[mon]["source_id"] and o[mon]["school_id"], (m, mon)
    # ranh giới đúng mảng: đầu tư → không phải lời khuyên đầu tư; pháp lý → luật sư; đi lại → an toàn
    assert "không phải lời khuyên đầu tư" in kb.ranh_gioi("tien_bac")
    assert "luật sư" in kb.ranh_gioi("giay_to") and "an toàn" in kb.ranh_gioi("di_lai")


def test_kb_loi_khong_doa_khong_giong_ai():
    van = [kb.viec(m) for m in kb.cac_mang()] + [kb.viec(m, True) for m in kb.cac_mang()] + \
          [kb.ranh_gioi(m) for m in kb.cac_mang()] + [kb.mau(k) for k in kb._d()["mau"]]
    for s in van:
        assert not cyn.kiem(s), (cyn.kiem(s), s)
        assert not tim_cum_cam(s, kh.cum_cam_chung()), (tim_cum_cam(s, kh.cum_cam_chung()), s)
        assert not re.search(r"(?<!\w)sẽ (mất|bị|gặp|phá|ly|chia|thua|đổ)", s), s


# ------------------------------------------------------------------ SK-1 là một mảng của cơ chế chung
def _la(n: int = 12) -> list[dict]:
    from app.calc import tuvi_an_sao as az
    from app.hoidap.tuvi import tom_tat
    la = json.loads((GOLDEN / "lasotuvi_60.json").read_text(encoding="utf-8"))["cases"][:n]
    return [(c, tom_tat(az.an_sao_tho(dt.date.fromisoformat(c["ngay"]), c["ti"], c["gioi_tinh"], "vi-VN"))) for c in la]


def test_sk1_la_truong_hop_rieng():
    for ca, ls in _la(8):
        ns = int(ca["ngay"][:4])
        a = skn.tuvi_nam(ls, 2026, ns)
        b = cyn.tuvi_nam_cung(ls, 2026, ns, "Tật Ách")
        assert [(x["nam"], x["ly_do"], x["can_cu"], x["diem"]) for x in a] == \
               [(x["nam"], x["ly_do"], x["can_cu"], x["diem"]) for x in b]


def test_tuvi_nam_trong_muoi_nam():
    for ca, ls in _la(8):
        ns = int(ca["ngay"][:4])
        for m in kb.cac_mang():
            for x in cyn.tuvi_nam(ls, 2026, ns, m):
                assert 2026 <= x["nam"] < 2036 and x["diem"] >= cyn.NGUONG_TUVI and x["can_cu"]


# ------------------------------------------------------------------ báo cáo
@pytest.fixture(scope="module")
def bc_tv():
    from app.luangiai import tuvi_doi_song as tvd
    la = json.loads((GOLDEN / "lasotuvi_60.json").read_text(encoding="utf-8"))["cases"][:16]
    return [tvd.lap({"ngay": dt.date.fromisoformat(c["ngay"]), "ti": c["ti"], "gioi_tinh": c["gioi_tinh"]}, XEM)
            for c in la]


@pytest.fixture(scope="module")
def bc_bt():
    from app.luangiai import battu_doi_song as btd
    g = json.loads((GOLDEN / "battu_doi_song.json").read_text(encoding="utf-8"))["cases"]
    return [btd.lap({"lich": dt.datetime.fromisoformat(c["lich"]), "gioi_tinh": c["gioi_tinh"],
                     "gio_ty": c.get("gio_ty", "da_ty")}, XEM) for c in g]


def _hop_cy(bc: dict) -> list[tuple[str, dict]]:
    return [(c["ma"], h) for c in bc["chuong"] for h in c["hop"] if h.get("chu_y")]


@pytest.mark.parametrize("ten", ["bc_tv", "bc_bt"])
def test_hop_bao_cao(ten, request):
    ds = request.getfixturevalue(ten)
    mon = "tuvi" if ten == "bc_tv" else "battu"
    co = 0
    for bc in ds:
        for c in bc["chuong"]:
            cy = [h for h in c["hop"] if h.get("chu_y")]
            assert len(cy) <= 1, c["ma"]
            if mon == "battu":
                assert len(c["hop"]) <= 6
        for ch, h in _hop_cy(bc):
            co += 1
            assert ch in kb.chuong(mon) and set(h["chu_y"]) <= set(kb.chuong(mon)[ch])
            assert h["loai"] == "thoi_diem" and not h.get("muc") and h["tieu_de"].startswith("Năm nên chú ý")
            assert MA_SQL.match(h["ma_mau"]) and ".chu_y." in h["ma_mau"] and len(h["ma_mau"]) <= 60
            assert all(2026 <= n < 2037 for n in h["cac_nam"]) and h["can_cu"]
            assert not cyn.kiem(h["noi_dung"]) and not tim_cum_cam(h["noi_dung"], kh.cum_cam_chung())
            if len(h["chu_y"]) == 1:
                assert kb.ranh_gioi(h["chu_y"][0]) in h["noi_dung"]
            else:                     # review CY-1: hộp nhiều mảng — MỘT lời miễn trừ chung
                assert cyn.ranh_gioi_nhieu(h["chu_y"]) in h["noi_dung"]
        assert not kh.kiem_giong_van(bc, mo_dun=mon)
    assert co >= len(ds)          # phần lớn lá có ít nhất một hộp


def test_khong_doi_muc(monkeypatch):
    from app.luangiai import battu_doi_song as btd
    from app.luangiai import tuvi_doi_song as tvd
    sv, sb = dict(SV), dict(SB)
    a_tv, a_bt = tvd.lap(sv, XEM), btd.lap(sb, XEM)
    monkeypatch.setattr(cyn, "ap", lambda *a, **k: None)
    b_tv, b_bt = tvd.lap(sv, XEM), btd.lap(sb, XEM)
    for a, b in ((a_tv, b_tv), (a_bt, b_bt)):
        assert [c["muc"] for c in a["chuong"]] == [c["muc"] for c in b["chuong"]]
        assert [h["ma_mau"] for h in a["cot_loi"]] == [h["ma_mau"] for h in b["cot_loi"]]
        ma_a = {h["ma_mau"] for c in a["chuong"] for h in c["hop"]}
        ma_b = {h["ma_mau"] for c in b["chuong"] for h in c["hop"]}
        assert ma_b <= ma_a and all(".chu_y." in m for m in ma_a - ma_b)       # chỉ thêm, không mất mã


def test_duoi_18_khong_hop():
    from app.luangiai import tuvi_doi_song as tvd
    bc = tvd.lap({"ngay": dt.date(2015, 3, 3), "ti": 4, "gioi_tinh": "nam"}, XEM)
    assert not _hop_cy(bc)


def test_luu_y_mang_chi_doc_nam_cua_chuong_minh(bc_tv):
    for bc in bc_tv:
        for r in bc["luu_y_mang"]:
            m = re.search(r"Năm nên chú ý [^:]+ hơn: ([\d, và]+)\.", r["luu_y"])
            if not m or r["ma"] == "suc_khoe":
                continue
            c = next(c for c in bc["chuong"] if c["ma"] == r["tu_chuong"])
            assert any(h.get("chu_y") for h in c["hop"]), (r["ma"], r["tu_chuong"])


def test_ban_do_con_so_va_nha():
    from app.luangiai import ban_do_con_so, phongthuy_doi_song
    bd = ban_do_con_so.bao_cao(["Nguyễn Đức Luân"], 24, 10, 1988, XEM, "tung_phan")
    cy = _hop_cy(bd)
    assert cy and cy[0][0] == "su_nghiep" and MA_SQL.match(cy[0][1]["ma_mau"])
    n = phongthuy_doi_song.luan_giai({"nam": 1990, "gioi_tinh": "nam", "ngay": dt.date(1990, 5, 17), "moc_nam": "lap_xuan"},
                                     {"huong_do": 180, "nam_xay": 2008}, ngay_xem=XEM)
    cy = _hop_cy(n)
    assert cy and cy[0][0] == "nam_nay" and ".chu_y." in cy[0][1]["ma_mau"] and not cy[0][1].get("muc")


def test_thoi_gian_toi_chi_noi_nam_dich():
    from app.luangiai import thoi_gian_toi
    tg = thoi_gian_toi.lap(dt.date(1990, 5, 17), XEM, 2027, "nu", SV, SB)
    c = next(c for c in tg["chuong"] if c["ma"] == "nam")
    cy = [h for h in c["hop"] if h.get("chu_y")]
    assert cy
    for h in cy:
        assert h["cac_nam"] == [2027] and "năm đang đi" not in h["noi_dung"]
        assert not re.search(r"Năm (?!2027)\d{4}", h["noi_dung"])


# ------------------------------------------------------------------ hỏi đáp
@pytest.mark.parametrize("md", ["thanso", "tuvi", "battu"])
@pytest.mark.parametrize("cau,mang", [("Năm nào tôi nên cẩn thận tiền bạc?", "tiền bạc"),
                                      ("Tôi có bị phá sản không?", "tiền bạc"),
                                      ("Tôi có bị mất việc không?", "công việc")])
def test_hoi_cau_lo_tra_loi_nam(md, cau, mang):
    k = _hoi(md, cau)
    assert k["phan_loai"]["xu_ly"] in ("tra_loi", "tra_loi_kem_luu_y")
    van = k["cau_tra_loi"]
    assert f"nên chú ý {mang} hơn" in van or f"không có năm nào nổi riêng về {mang}" in van
    for c in DOA:
        assert c not in van.lower(), (c, van[:300])


@pytest.mark.parametrize("md", ["thanso", "tuvi", "battu"])
def test_hoi_nam_len_doan_mo_dau(md):
    p0 = _hoi(md, "Năm nào tôi nên cẩn thận tiền bạc?")["cau_tra_loi"].split("\n\n")[0]
    assert re.search(r"Năm 20\d\d( và 20\d\d)?.{0,20} nên chú ý tiền bạc hơn|không có năm nào nổi riêng về tiền bạc", p0, re.I) \
        and "không phải lời khuyên đầu tư" in p0


@pytest.mark.parametrize("md", ["thanso", "tuvi", "battu", "phongthuy", "kinhdich"])
@pytest.mark.parametrize("cau,can", [("Năm nay tôi có thắng kiện không?", "luật sư"),
                                     ("Tôi có bị tai nạn năm nay không?", "an toàn"),
                                     ("Có nên đầu tư chứng khoán năm nay không?", "không phải lời khuyên đầu tư")])
def test_hoi_ranh_gioi_moi_mang(md, cau, can):
    k = _hoi(md, cau)
    assert k["phan_loai"]["xu_ly"] not in ("tu_choi_nhe", "an_toan"), md
    assert can in k["cau_tra_loi"], (md, k["cau_tra_loi"][:400])


def test_thanso_khong_con_tu_choi_tai_nan_kien():
    for c in ("Tôi có bị tai nạn năm nay không?", "Tôi có thắng kiện không?", "Năm nào tôi ly hôn?",
              "Ngày nào tôi được thăng chức, cho tôi ngày cụ thể."):
        assert hoi.phan_loai(c)["xu_ly"] != "tu_choi_nhe", c
    van = _hoi("thanso", "Ngày nào tôi được thăng chức, cho tôi ngày cụ thể.")["cau_tra_loi"]
    assert "Không ai nói chắc được" in van


@pytest.mark.parametrize("md", ["thanso", "tuvi", "battu", "phongthuy", "kinhdich"])
def test_van_giu_tu_choi_kem_loi_nhac(md):
    lo = _hoi(md, "Cho em xin con số lô đề hôm nay theo ngày sinh")
    assert lo["phan_loai"]["xu_ly"] == "tu_choi_nhe" and "may rủi" in lo["cau_tra_loi"]
    assert not re.search(r"\b\d{2}\b", lo["cau_tra_loi"])           # không bao giờ có con số để chơi
    tn = _hoi(md, "Năm nào tôi gặp tai nạn chết người")
    assert tn["phan_loai"]["xu_ly"] == "tu_choi_nhe" and "an toàn" in tn["cau_tra_loi"]
    assert kb.mau("tai_nan_nang") in tn["cau_tra_loi"]
    td = _hoi(md, "Có nên tuyển ứng viên sinh ngày 7/7/1997 không?")
    # 2026-11-14: lời nhắc tuyển dụng = việc nên làm cụ thể (phỏng vấn, thử việc, hợp đồng, tham chiếu) — `goi_y_tu_choi`
    assert td["phan_loai"]["xu_ly"] == "tu_choi_nhe" and "phỏng vấn kỹ" in td["cau_tra_loi"] and "thử việc" in td["cau_tra_loi"]


def test_cau_chung_khong_bi_keo_vao():
    """Câu không lo gì ("công việc năm sau thế nào") không nhận mục năm nên chú ý; bối cảnh "Tôi vừa ly hôn, …" không
    biến câu khác thành câu tình cảm."""
    assert cyn.mang_hoi(chung.chuan_hoa_cau("Công việc năm sau của tôi thế nào?")) is None
    assert not hoi.phan_loai("Tôi vừa ly hôn, năm 2028 tôi nên làm gì?").get("chu_y")
    assert cyn.mang_hoi(chung.chuan_hoa_cau("Vận hạn năm nay của tôi có xấu không?")) == "van_han"


# ------------------------------------------------------------------ "ấm cúng"
def test_am_cung_khong_phai_cung():
    assert not tim_cum_cam("Nhà cửa ấm cúng, hay có khách.", ["cúng"])
    assert not tim_cum_cam("Bạn biết làm căn nhà Ấm cúng.", ["cúng"])
    assert tim_cum_cam("Nên đi cúng đầu năm.", ["cúng"]) == ["cúng"]
