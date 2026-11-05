# -*- coding: utf-8 -*-
"""TV-DC — đối chiếu phép tính Tử vi của engine với ĐẶC TẢ đọc từ repo `Renhuai123/ziwei-doushu` (MIT — chỉ đọc làm tài
liệu, không chạy mã của họ) và với khẩu quyết cổ điển. Tài liệu: docs/DOI-CHIEU-ZIWEI-DOUSHU.md.

- Golden tính tay `fixtures/golden/tuvi_doi_chieu_dac_ta.json` (sinh bằng khẩu quyết viết tay, KHÔNG gọi iztro —
  `_sinh_tuvi_doi_chieu_dac_ta.py`): Mệnh, Thân, Lai nhân, Cục, 18 sao, 12 đại hạn (tuổi + can), tiểu hạn, Hồng Loan /
  Thiên Hỷ, và tại ngày xem: tuổi mụ, đại hạn (chi, can, tứ hoá → sao → cung), tiểu hạn, lưu niên (Tết Việt).
- Bất biến trên 1.000 lá (tests/_tuvi_1000.py): thứ tự 12 cung, đồng cung chỉ ở chi cố định, Hồng Loan theo chi năm,
  vòng Tuế tiền / Tướng tiền lá gốc, tứ hoá đại hạn theo Ngũ Hổ Độn.
- Cách cục: chỗ điều kiện của họ khác cổ thư (Minh châu xuất hải, Phủ Tướng triều viên) → khoá cách của ta; chỗ hai bên
  tương đương về logic → khoá bằng mệnh đề "khi và chỉ khi".
- Lỗi của ta chưa sửa (sửa = đổi kết quả mặc định, chờ chủ dự án): `xfail(strict=True)`.
"""
from __future__ import annotations

import datetime as dt
import json
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.calc import lunar, tuvi_an_sao as az, tuvi_cach_cuc as cc, tuvi_luu_nguyet as ln, tuvi_phi_hoa as ph
from app.calc import tuvi_vong_han as vh
from app.main import app
from tests._tuvi_1000 import DAU_VAO, la_1000

G = json.loads((Path(__file__).resolve().parents[1] / "fixtures" / "golden" / "tuvi_doi_chieu_dac_ta.json")
               .read_text(encoding="utf-8"))["cases"]
CHI_DAN = ["Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi", "Tý", "Sửu"]   # chỉ số iztro 0 = Dần
CUC_SO = {"Nhị": 2, "Tam": 3, "Tứ": 4, "Ngũ": 5, "Lục": 6}
TEN_THEO_THU_TU = ["Mệnh", "Huynh Đệ", "Phu Thê", "Tử Nữ", "Tài Bạch", "Tật Ách", "Thiên Di", "Nô Bộc", "Quan Lộc",
                   "Điền Trạch", "Phúc Đức", "Phụ Mẫu"]
client = TestClient(app)


def _d(s: str) -> dt.date:
    return dt.date.fromisoformat(s)


def _la(c: dict) -> dict:
    return az.an_sao_tho(_d(c["duong"]), c["ti"], c["gioi_tinh"], thang_nhuan=c["thang_nhuan"])


def _vh(c: dict, x: dict) -> dict:
    return az.van_han(_d(c["duong"]), c["ti"], c["gioi_tinh"], _d(x["ngay_xem"]), chi_tiet=True,
                      thang_nhuan=c["thang_nhuan"])


def _vi_tri(la: dict) -> dict[str, str]:
    return {s["name"]: p["earthlyBranch"] for p in la["palaces"]
            for s in p["majorStars"] + p["minorStars"] + p["adjectiveStars"]}


# ----------------------------------------------------------------------------------------- 1. lá gốc theo khẩu quyết
@pytest.mark.parametrize("c", G, ids=lambda c: c["id"])
def test_la_goc_khop_khau_quyet(c):
    la = _la(c)
    p = la["palaces"]
    assert next(x["earthlyBranch"] for x in p if x["name"] == "Mệnh") == c["menh"]
    assert next(x["earthlyBranch"] for x in p if x["isBodyPalace"]) == c["than"]
    assert [x["earthlyBranch"] for x in p if x["isOriginalPalace"]] == [c["lai_nhan"]]
    assert ph.lai_nhan(c["can_nam"]) == c["lai_nhan"]
    assert CUC_SO[la["fiveElementsClass"].split()[1]] == c["cuc"]
    vt = _vi_tri(la)
    assert {s: vt[s] for s in c["sao"]} == c["sao"]
    assert (vt["Hồng Loan"], vt["Thiên Hỷ"]) == (c["hong_loan"], c["thien_hy"])
    dh = {x["earthlyBranch"]: x["decadal"] for x in p}
    for h in c["dai_han"]:
        assert dh[h["chi"]]["range"] == [h["tu_tuoi"], h["den_tuoi"]], h
        assert dh[h["chi"]]["heavenlyStem"] == h["can"], h
        assert ph.ngu_ho_don(c["can_nam"], h["chi"]) == h["can"]
    # tiểu hạn: tuổi 1 ở cung khởi, tuổi 2 đi thuận (nam) / nghịch (nữ)
    tuoi = {a: x["earthlyBranch"] for x in p for a in x["ages"]}
    assert tuoi[1] == c["tieu_han_tuoi_1"]
    buoc = 1 if c["chieu_tieu_han"] == "thuan" else -1
    assert tuoi[2] == CHI_DAN[(CHI_DAN.index(c["tieu_han_tuoi_1"]) + buoc) % 12]


@pytest.mark.parametrize("c", [c for c in G if c["xem"]], ids=lambda c: c["id"])
def test_van_han_khop_khau_quyet(c):
    for x in c["xem"]:
        v = _vh(c, x)
        assert v["tuoi_mu"] == x["tuoi_mu"], x["ngay_xem"]
        for lop, ky in (("dai_han", x["dai_han"]), ("luu_nien", x["luu_nien"])):
            assert (v[lop]["chi"], v[lop]["can"], v[lop]["cung_goc"]) == (ky["chi"], ky["can"], ky["cung"]), (lop, x)
            assert [(h["hoa"], h["sao"], h["chi"]) for h in v[lop]["tu_hoa_sao"]] == \
                [(h["hoa"], h["sao"], h["chi"]) for h in ky["tu_hoa"]], (lop, x["ngay_xem"])
        assert (v["tieu_han"]["chi"], v["tieu_han"]["cung_goc"]) == (x["tieu_han"]["chi"], x["tieu_han"]["cung"])
        if not x["dong_han"]:
            assert (v["dai_han"]["tu_tuoi"], v["dai_han"]["den_tuoi"]) == \
                (x["dai_han"]["tu_tuoi"], x["dai_han"]["den_tuoi"])
        # Tuế Kiện lưu niên đứng đúng cung lưu niên; Tuế Kiện đại hạn đứng đúng cung đại hạn
        assert v["luu_nien"]["vong_thai_tue"][CHI_DAN.index(x["luu_nien"]["chi"])] == "Tuế Kiện"
        assert v["dai_han"]["vong_thai_tue"][CHI_DAN.index(x["dai_han"]["chi"])] == "Tuế Kiện"


def test_dong_han_khoang_tuoi():
    """Đã sửa (ENGINE_VERSION 0.1.7): tuổi mụ < số cục → khoảng 1 … cục − 1 + cờ `dong_han` (trước: khoảng của chính cung)."""
    c = next(c for c in G if c["id"] == "dong_han_2_tuoi")
    x = next(x for x in c["xem"] if x["dong_han"])
    v = _vh(c, x)
    assert (v["dai_han"]["tu_tuoi"], v["dai_han"]["den_tuoi"]) == (1, c["cuc"] - 1)
    assert v["dai_han"].get("dong_han") is True


def test_dong_han_cung_va_can_dung():
    """Phần đúng của đồng hạn (đã khoá): cung + can + tứ hoá theo khẩu quyết 一命二財三疾厄 四歲夫妻五福德."""
    c = next(c for c in G if c["id"] == "dong_han_2_tuoi")
    x = next(x for x in c["xem"] if x["dong_han"])
    v = _vh(c, x)
    assert (v["dai_han"]["cung_goc"], v["dai_han"]["can"]) == ("Tài Bạch", x["dai_han"]["can"])


@pytest.mark.xfail(strict=True, reason="LỖI CỦA TA (biên, chưa sửa): iztro chỉ an tiểu hạn tuổi 1–120 (10 vòng) → tuổi "
                   "mụ ≥ 121 trả chi_so −1, can 'jia', chi 'zi' (chuỗi thô) và cung_goc = cung cuối mảng.")
def test_tieu_han_tuoi_121():
    v = az.van_han(dt.date(1930, 6, 15), 4, "nam", dt.date(2050, 6, 1))
    assert v["tuoi_mu"] == 121
    assert v["tieu_han"]["chi_so"] >= 0 and v["tieu_han"]["chi"] in lunar.CHI


# ------------------------------------------------------------------------- 2. ranh giới năm: Tết Việt, không Lập xuân
@pytest.mark.parametrize("ngay, can, chi, tuoi", [
    ("2027-02-04", "Bính", "Ngọ", 37),   # Lập xuân 2027 (4/2) — chưa đổi năm
    ("2027-02-05", "Bính", "Ngọ", 37),   # sau Lập xuân, trước Tết
    ("2027-02-06", "Đinh", "Mùi", 38),   # Tết Đinh Mùi
])
def test_luu_nien_doi_o_tet_khong_o_lap_xuan(ngay, can, chi, tuoi):
    v = az.van_han(dt.date(1990, 5, 17), 6, "nu", _d(ngay))
    assert (v["luu_nien"]["can"], v["luu_nien"]["chi"], v["tuoi_mu"]) == (can, chi, tuoi)
    assert v["luu_nien"]["tu_hoa"] == ln.TU_HOA[can]


@pytest.mark.parametrize("ngay, viet, trung", [
    ("1985-02-01", ("Ất", "Sửu"), ("Giáp", "Tý")),     # Tết Việt 21/1/1985, Tết Trung Quốc 20/2/1985
    ("2007-02-17", ("Đinh", "Hợi"), ("Bính", "Tuất")),  # Tết Việt 17/2/2007, Trung Quốc 18/2/2007
])
def test_luu_nien_theo_lich_nguoi_dung_chon(ngay, viet, trung):
    for lich, ky in (("viet", viet), ("trung", trung)):
        v = az.van_han(dt.date(1977, 4, 20), 3, "nam", _d(ngay), chi_tiet=True, lich=lich)
        assert (v["luu_nien"]["can"], v["luu_nien"]["chi"]) == ky, lich
        assert v["luu_nien"]["vong_thai_tue"][CHI_DAN.index(ky[1])] == "Tuế Kiện", lich
        assert v["luu_nien"]["vong_tuong_tien"] == vh.vong_tuong_tien(ky[1]), lich


def test_vong_la_goc_theo_nam_sinh_tet_viet():
    """Sinh 1985-02-01: lịch Việt Ất Sửu (lịch Trung Quốc còn Giáp Tý) → Tuế Kiện lá gốc ở Sửu, Tướng Tinh ở Dậu."""
    la = az.an_sao_tho(dt.date(1985, 2, 1), 5, "nam")
    assert la["chineseDate"].startswith("Ất Sửu")
    assert [p["suiqian12"] for p in la["palaces"]] == vh.vong_tue_tien("Sửu")
    assert [p["jiangqian12"] for p in la["palaces"]] == vh.vong_tuong_tien("Sửu")
    assert la["palaces"][CHI_DAN.index("Dậu")]["jiangqian12"] == "Tướng Tinh"


def test_can_chi_thang_13_bang_thang_gieng_nam_sau():
    """Nửa sau / cả tháng Chạp nhuận (đặc tả của họ dùng can năm SAU cho tháng Giêng): công thức của ta
    can_chi_thang(13, Y) liền mạch = can chi tháng Giêng năm Y + 1 — hai cách tương đương."""
    for y in range(1900, 2101):
        assert lunar.can_chi_thang(13, y) == lunar.can_chi_thang(1, y + 1), y


# ------------------------------------------------------------------------------------ 3. bất biến trên 1.000 lá số
def _chi_nam(la: dict) -> str:
    return la["chineseDate"].split(" - ")[0].split()[1]


def test_bat_bien_1000_la():
    co_luong = 0
    for (d, ti, gt), la in zip(DAU_VAO, la_1000()):
        p = la["palaces"]
        m = next(i for i, x in enumerate(p) if x["name"] == "Mệnh")
        # 12 cung xếp NGHỊCH từ Mệnh: cung thứ k ở chi Mệnh − k
        assert [p[(m - k) % 12]["name"] for k in range(12)] == TEN_THEO_THU_TU, (d, ti)
        vt = _vi_tri(la)
        yb = lunar.CHI.index(_chi_nam(la))
        assert vt["Hồng Loan"] == lunar.CHI[(3 - yb) % 12] and vt["Thiên Hỷ"] == lunar.CHI[(9 - yb) % 12], (d, ti)
        # vòng Tuế tiền / Tướng tiền lá gốc khởi từ chi năm sinh
        assert [x["suiqian12"] for x in p] == vh.vong_tue_tien(_chi_nam(la)), (d, ti)
        assert [x["jiangqian12"] for x in p] == vh.vong_tuong_tien(_chi_nam(la)), (d, ti)
        # can cung = Ngũ Hổ Độn theo can năm (cũng là can đại hạn)
        can_nam = la["chineseDate"].split()[0]
        assert all(x["heavenlyStem"] == ph.ngu_ho_don(can_nam, x["earthlyBranch"]) == x["decadal"]["heavenlyStem"]
                   for x in p), (d, ti)
        # đồng cung chỉ ở chi cố định → điều kiện chi trong vài cách của ta là thừa nhưng vô hại
        for cap, chi in ((("Vũ Khúc", "Thất Sát"), {"Mão", "Dậu"}), (("Liêm Trinh", "Thiên Tướng"), {"Tý", "Ngọ"}),
                         (("Thiên Đồng", "Thiên Lương"), {"Dần", "Thân"}), (("Cự Môn", "Thái Dương"), {"Dần", "Thân"}),
                         (("Thái Dương", "Thái Âm"), {"Sửu", "Mùi"}), (("Thiên Cơ", "Thiên Lương"), {"Thìn", "Tuất"}),
                         (("Tử Vi", "Thiên Phủ"), {"Dần", "Thân"})):
            if vt[cap[0]] == vt[cap[1]]:
                assert vt[cap[0]] in chi, (d, ti, cap)
                co_luong += cap == ("Thiên Cơ", "Thiên Lương")
    assert co_luong > 0


def test_tu_hoa_dai_han_ngu_ho_don_40_la():
    """Tứ hoá đại hạn = bảng tứ hoá theo can cung đại hạn (Ngũ Hổ Độn từ can năm sinh), sao → cung trên chính lá đó."""
    for (d, ti, gt), la in list(zip(DAU_VAO, la_1000()))[:40]:
        v = az.van_han(d, ti, gt, dt.date(d.year + 37, 7, 1), chi_tiet=True)["dai_han"]
        can_nam = la["chineseDate"].split()[0]
        assert v["can"] == ph.ngu_ho_don(can_nam, v["chi"]), (d, ti)
        vt = _vi_tri(la)
        assert [(h["sao"], h["chi"]) for h in v["tu_hoa_sao"]] == [(s, vt[s]) for s in ln.TU_HOA[v["can"]]], (d, ti)


def test_hai_hoa_sinh_nien_cung_cung_hop_le():
    """'natal-dual-sihua': Mậu Thìn 1988-10-08 giờ Mùi nam — Mệnh có Cơ Kỵ + Âm Quyền, Phụ Mẫu có Tham Lộc + Hữu Bật
    Khoa (tính tay: docs/DOI-CHIEU-ZIWEI-DOUSHU.md). Hai hoá cùng một cung là hợp lệ, không phải lỗi hiển thị."""
    la = az.an_sao_tho(dt.date(1988, 10, 8), 7, "nam")
    hoa = {p["name"]: {s["name"]: s["mutagen"] for s in p["majorStars"] + p["minorStars"] if s.get("mutagen")}
           for p in la["palaces"]}
    assert hoa["Mệnh"] == {"Thiên Cơ": "Kỵ", "Thái Âm": "Quyền"}
    assert hoa["Phụ Mẫu"] == {"Tham Lang": "Lộc", "Hữu Bật": "Khoa"}


# ------------------------------------------------------------------------------ 4. đầu vào: giờ, giới tính, ngày
@pytest.mark.parametrize("gio, ti", [(0, 0), (0, 59), (1, 0), (2, 59), (3, 0), (12, 59), (21, 0), (22, 59), (23, 0),
                                     (23, 59)])
def test_ranh_gioi_canh_gio(gio, ti):
    ky = {(0, 0): 0, (0, 59): 0, (1, 0): 1, (2, 59): 1, (3, 0): 2, (12, 59): 6, (21, 0): 11, (22, 59): 11,
          (23, 0): 12, (23, 59): 12}[(gio, ti)]
    assert az.time_index(gio, ti) == ky


def test_ty_muon_la_ngay_sau_gio_ty():
    a = az.an_sao_tho(dt.date(2000, 1, 31), 12, "nam")
    b = az.an_sao_tho(dt.date(2000, 2, 1), 0, "nam")
    assert a["palaces"] == b["palaces"]


@pytest.mark.parametrize("kw", [{"gioi_tinh": "male"}, {"gioi_tinh": ""}, {"gioi_tinh": "Nam"}, {"ti": 13},
                                {"ti": -1}, {"thang_nhuan": "next-month"}, {"thang_nhuan": "split"}, {"lich": "cn"}])
def test_dau_vao_la_bi_tu_choi(kw):
    v = {"ngay_duong": dt.date(1990, 5, 17), "ti": 6, "gioi_tinh": "nu", **kw}
    with pytest.raises(ValueError):
        az.an_sao_tho(**v)


@pytest.mark.parametrize("ngay, ma", [("1925-02-29", 422), ("1980-02-30", 422), ("1990-04-31", 422),
                                      ("1990-13-01", 422), ("1980-02-29", 200)])
def test_api_ngay_duong_khong_ton_tai(ngay, ma):
    r = client.post("/v1/tuvi/an-sao", json={"birth_date": ngay, "birth_time": "11:00", "gender": "nam"})
    assert r.status_code == ma, r.text


@pytest.mark.parametrize("gt", ["male", "", "NAM", "nữ", "0"])
def test_api_gioi_tinh_la(gt):
    r = client.post("/v1/tuvi/an-sao", json={"birth_date": "1990-05-17", "birth_time": "11:00", "gender": gt})
    assert r.status_code == 422


# --------------------------------------------------------------------------------------------- 5. cách cục
def _ma(la: dict) -> set[str]:
    return {x["ma"] for x in cc.nhan_dien(la)}


def _ctx(la: dict):
    p = la["palaces"]
    m = next(i for i, x in enumerate(p) if x["name"] == "Mệnh")
    tp = [m, (m + 4) % 12, (m + 8) % 12, (m + 6) % 12]
    chinh = {s["name"]: i for i, x in enumerate(p) for s in x["majorStars"]}
    tat = {s["name"]: i for i, x in enumerate(p) for s in x["majorStars"] + x["minorStars"] + x["adjectiveStars"]}
    return p, m, tp, chinh, tat


def test_minh_chau_xuat_hai_theo_co_thu():
    """明珠出海 cổ thư: Mệnh Mùi vô chính diệu, Thái Dương ở Mão + Thái Âm ở Hợi (hội chiếu). Bản kia lấy 'đối cung Sửu
    có Nhật Nguyệt đồng cung' — sai cổ thư → ta KHÔNG nhận cách ở cấu hình đó."""
    dung = ho = 0
    for la in la_1000():
        p, m, tp, chinh, _ = _ctx(la)
        if p[m]["earthlyBranch"] != "Mùi" or p[m]["majorStars"]:
            continue
        ma = _ma(la)
        if p[chinh["Thái Dương"]]["earthlyBranch"] == "Mão" and p[chinh["Thái Âm"]]["earthlyBranch"] == "Hợi":
            assert "minh_chau_xuat_hai" in ma
            dung += 1
        if chinh["Thái Dương"] == chinh["Thái Âm"] == (m + 6) % 12:
            assert "minh_chau_xuat_hai" not in ma
            ho += 1
    assert dung and ho


def test_phu_tuong_trieu_vien_khong_tinh_khi_mot_sao_o_menh():
    """府相朝垣: Phủ + Tướng ở tam phương CHIẾU VỀ Mệnh, Mệnh không chứa sao nào trong hai sao. Bản kia nhận cả khi một
    sao ngồi Mệnh — ta không."""
    ca = 0
    for la in la_1000():
        p, m, tp, chinh, _ = _ctx(la)
        ma = _ma(la)
        if m in (chinh["Thiên Phủ"], chinh["Thiên Tướng"]):
            assert "phu_tuong_trieu_vien" not in ma
            ca += {chinh["Thiên Phủ"], chinh["Thiên Tướng"]} <= set(tp)
        else:
            assert ("phu_tuong_trieu_vien" in ma) == ({chinh["Thiên Phủ"], chinh["Thiên Tướng"]} <= set(tp[1:]))
    assert ca > 0


def test_cach_tuong_duong_dac_ta():
    """Những cách mà điều kiện của ta và bản kia viết khác nhau nhưng tương đương về logic (khi và chỉ khi)."""
    so = dict.fromkeys(("spt", "loc", "song_loc", "kq", "cndl3", "ma", "lt_than"), 0)
    for la in la_1000():
        p, m, tp, chinh, tat = _ctx(la)
        ma = _ma(la)
        hoa_tp = [(s["mutagen"], s["name"] in chinh) for i in tp for s in p[i]["majorStars"] + p[i]["minorStars"]
                  if s.get("mutagen")]
        # 杀破狼: Mệnh có Sát/Phá/Tham ⟺ cả ba ở tam phương tứ chính (ba sao luôn cùng một tam hợp)
        assert ("sat_pha_tham" in ma) == ({chinh[s] for s in ("Thất Sát", "Phá Quân", "Tham Lang")} <= set(tp))
        so["spt"] += "sat_pha_tham" in ma
        # Kình Đà giáp Mệnh ⟺ Lộc Tồn thủ Mệnh (Kình = Lộc Tồn + 1, Đà = Lộc Tồn − 1)
        assert ("kinh_da_giap_menh" in ma) == ("loc_ton_thu_menh" in ma)
        so["loc"] += "loc_ton_thu_menh" in ma
        # 双禄朝垣 = song_loc: Lộc Tồn + Hoá Lộc cùng ở tam phương tứ chính
        assert ("song_loc" in ma) == (tat["Lộc Tồn"] in tp and any(h == "Lộc" for h, _ in hoa_tp))
        so["song_loc"] += "song_loc" in ma
        # 科权双会 của họ (Khoa + Quyền trên chính tinh) — ta thêm "không có Lộc" để khỏi trùng Tam Kỳ / Quyền Lộc
        kq = {h for h, chinh_ in hoa_tp if chinh_} >= {"Khoa", "Quyền"}
        assert ("khoa_quyen_hoi_menh" in ma) == (kq and not any(h == "Lộc" for h, _ in hoa_tp))
        so["kq"] += "khoa_quyen_hoi_menh" in ma
        # 机月同梁三星会: đúng 3/4 sao Cơ Nguyệt Đồng Lương ở tam phương tứ chính
        n = sum(chinh[s] in tp for s in cc.CNDL)
        assert ("co_nguyet_dong_luong_ba" in ma) == (n == 3) and ("co_nguyet_dong_luong" in ma) == (n == 4)
        so["cndl3"] += n == 3
        # 天马入命 / 在迁
        assert ("thien_ma_menh_di" in ma) == (tat["Thiên Mã"] in (m, (m + 6) % 12))
        so["ma"] += "thien_ma_menh_di" in ma
        # 禄存守身 khi Thân ≠ Mệnh (Thân = Mệnh thì là 禄存守命)
        than = next(i for i, x in enumerate(p) if x["isBodyPalace"])
        assert ("loc_ton_thu_than" in ma) == (than != m and tat["Lộc Tồn"] == than)
        so["lt_than"] += "loc_ton_thu_than" in ma
    assert all(so.values()), so
