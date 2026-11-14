# -*- coding: utf-8 -*-
"""WS-2 — sách không có trang riêng trên Wikisource, lấy từ nơi chép trọn và có kiểm chứng:
- Cổ Kim Đồ Thư Tập Thành (1725) trên Wikisource: 陽宅十書, 神相全編, 照膽經;
- bản Văn Uyên Các Tứ khố toàn thư (Kanseki): 靈城精義, 催官篇, 發微論.
Đúng khuôn, đủ chữ, sạch vỏ wiki và KHÔNG mang chấm câu thời nay (CC BY-SA, không phải của sách)."""
import json
import re
from pathlib import Path

import pytest

NGUON = Path(__file__).parent.parent / "fixtures" / "nguon"
# mã → (số thiên tối thiểu, số chữ tối thiểu, chữ phải có — mốc nội dung đúng sách)
SACH = {
    "than_tuong_toan_bien": (650, 150_000, ["十二宮", "流年運氣", "五行", "氣色"]),
    "chieu_dam_kinh": (60, 24_000, ["五行正形"]),
    "duong_trach_thap_thu": (120, 33_000, ["宅"]),
    "kham_du_tu_kho": (5, 40_000, ["形氣章正訣", "評龍篇", "剛柔篇"]),
}
_CHAM = re.compile(r"[，。、；：？！「」『』《》“”‘’]")


def _doc(ma):
    return json.loads((NGUON / f"{ma}.json").read_text("utf-8"))


@pytest.mark.parametrize("ma", sorted(SACH))
def test_dung_khuon_du_chu_sach_vo(ma):
    d = _doc(ma)
    so_thien, so_chu, moc = SACH[ma]
    assert d["can_doi_chieu"] is True and d["source_id"] == ma and d["school_id"]
    assert "Cổ thư công cộng" in d["_nguon"] and "CHƯA đối chiếu" in d["ban"]
    assert len(d["thien"]) >= so_thien
    van = "".join(t["van"] for t in d["thien"])
    assert len(van) >= so_chu
    for m in moc:
        assert m in van or any(m in t["ten"] for t in d["thien"]), (ma, m)
    for t in d["thien"]:
        # câu ca / khẩu quyết của sách có khi chỉ một dòng ngắn — không được bỏ, chỉ cấm mục rỗng
        assert t["ten"] and t["van"].strip(), (ma, t["ten"])
        assert not re.search(r"\{\{|\}\}|\[\[|<[a-z/]|&[a-z]+;|¶|pb:|==", t["van"] + t["ten"]), (ma, t["ten"])
        assert not _CHAM.search(t["van"]), (ma, t["ten"])   # chấm câu của người gõ đã bỏ


def test_co_kim_do_thu_ghi_nguon_va_khong_lan_sach_khac():
    for ma in ("than_tuong_toan_bien", "chieu_dam_kinh", "duong_trach_thap_thu"):
        d = _doc(ma)
        assert "古今圖書集成" in d["_nguon"] and "Wikisource" in d["ban"]
        ten_sach = {"than_tuong_toan_bien": "神相全編", "chieu_dam_kinh": "照膽經", "duong_trach_thap_thu": "陽宅十書"}[ma]
        assert all(t["ten"].startswith(ten_sach) for t in d["thien"]), ma
    # quyển 631 chép 相兒經, 人相篇 trước Thần Tướng Toàn Biên — không được lọt vào
    tt = _doc("than_tuong_toan_bien")["thien"]
    assert "兒初生" not in tt[0]["van"]
    assert {t["quyen"] for t in tt} == set(range(631, 645))


def test_kham_du_tu_kho_ba_sach_bo_de_yeu():
    d = _doc("kham_du_tu_kho")
    assert set(d["sach"]) == {"linh_thanh", "thoi_quan", "phat_vi"}
    assert {t["sach"] for t in d["thien"]} == set(d["sach"])
    van = "".join(t["van"] for t in d["thien"])
    assert "提要" not in "".join(t["ten"] for t in d["thien"])   # đề yếu của quán Tứ khố không phải chữ sách
    assert "宇宙有大闗合氣運為主" in van                       # câu mở đầu Linh Thành Tinh Nghĩa


def test_duong_trach_du_muoi_thien():
    """Đủ 10 thiên của Dương Trạch Thập Thư — bắt lỗi dừng nhầm ở chú thích hình (đề mục cấp 4)."""
    ten = " | ".join(t["ten"] for t in _doc("duong_trach_thap_thu")["thien"])
    for so in "一二三四五六七八九十":
        assert re.search(rf"論[^|·]*第{so}", ten), so


def test_than_tuong_du_mười_ba_bo_vi():
    """Câu ca 13 bộ vị ngắn (một dòng) vẫn phải có — bộ nạp cũ bỏ mục dưới 40 chữ."""
    tt = _doc("than_tuong_toan_bien")["thien"]
    ten = {t["ten"].split(" / ")[-1].split(" · ")[-1] for t in tt}
    for bv in ("天中", "天庭", "司空", "中正", "印堂", "山根", "年上", "壽上", "準頭", "人中", "水星", "承漿", "地閣"):
        assert bv in ten, bv


def test_dai_du_nien_duong_trach_thap_thu_khop_bang_huong_engine():
    """Nguồn độc lập thứ ba cho bảng du niên Bát trạch (sau Hiệp Kỷ và Bát Trạch Minh Kính): bài ca Đại du niên ở
    «論大遊年第三» — 8 dòng × 7 sao = 56 ô, mỗi dòng đọc theo vòng Càn → Khảm → Cấn → Chấn → Tốn → Ly → Khôn → Đoài
    bắt đầu từ cung ngay sau cung của dòng."""
    from app.calc import phongthuy as pt

    vong = "乾坎艮震巽離坤兌"
    quai = dict(zip(vong, ["Càn", "Khảm", "Cấn", "Chấn", "Tốn", "Ly", "Khôn", "Đoài"]))
    tat = {"生": "Sinh Khí", "天": "Thiên Y", "延": "Diên Niên", "六": "Lục Sát", "禍": "Hoạ Hại", "五": "Ngũ Quỷ",
           "絕": "Tuyệt Mệnh"}
    van = next(t["van"] for t in _doc("duong_trach_thap_thu")["thien"] if t["ten"].endswith("論大遊年第三"))
    dong = re.findall(rf"^([{vong}])([生天延六禍五絕]{{7}})$", van, flags=re.M)
    assert [g for g, _ in dong] == list(vong)
    for goc, sao in dong:
        bang = pt.bang_huong(quai[goc])
        i = vong.index(goc)
        assert bang[pt.QUAI[quai[goc]][1]] == "Phục Vị"
        for k, c in enumerate(sao, start=1):
            dich = quai[vong[(i + k) % 8]]
            assert bang[pt.QUAI[dich][1]] == tat[c], (goc, k, c)


def test_dong_tay_tu_vi_duong_trach_thap_thu_khop_engine():
    """«福元在震巽坎離宮為東四位生人» / «福元在乾坤艮兌宮為西四位生人» khớp cách engine chia Đông / Tây tứ mệnh."""
    from app.calc import phongthuy as pt

    van = "".join(t["van"] for t in _doc("duong_trach_thap_thu")["thien"])
    quai = dict(zip("乾坎艮震巽離坤兌", ["Càn", "Khảm", "Cấn", "Chấn", "Tốn", "Ly", "Khôn", "Đoài"]))
    for nhom, ten in (("東", "Đông tứ mệnh"), ("西", "Tây tứ mệnh")):
        m = re.search(rf"福元在([乾坎艮震巽離坤兌]{{4}})宮為{nhom}四位生人", van)
        assert m, nhom
        assert {pt.nhom(quai[c]) for c in m.group(1)} == {ten}


def test_luu_nien_nhan_tuong_khop_bai_ca_than_tuong_toan_bien():
    """Bảng 100 vị lưu niên của KB Nhân tướng ↔ «流年運氣部位歌» (Thần Tướng Toàn Biên): 20 tuổi mốc có tên bộ vị
    đúng chữ sách, và trong bài ca các bộ vị đứng theo đúng thứ tự tuổi."""
    moc = [(15, "火星", "Hoả Tinh"), (16, "天中", "Thiên Trung"), (19, "天庭", "Thiên Đình"), (22, "司空", "Tư Không"),
           (25, "中正", "Trung Chính"), (28, "印堂", "Ấn Đường"), (35, "太陽", "Thái Dương"), (36, "太陰", "Thái Âm"),
           (41, "山根", "Sơn Căn"), (43, "光殿", "Quang Điện"), (44, "年上", "Niên Thượng"), (45, "壽上", "Thọ Thượng"),
           (48, "準頭", "Chuẩn Đầu"), (49, "蘭臺", "Lan Đài"), (50, "廷尉", "Đình Uý"), (51, "人中", "Nhân Trung"),
           (60, "水星", "Thuỷ Tinh"), (61, "承漿", "Thừa Tương"), (71, "地閣", "Địa Các"), (74, "腮骨", "Tai Cốt")]
    van = next(t["van"] for t in _doc("than_tuong_toan_bien")["thien"] if t["ten"].endswith("流年運氣部位歌"))
    kb = json.loads((NGUON.parent.parent / "app" / "kb" / "data" / "nhan_tuong_kb.json").read_text("utf-8"))["luu_nien"]
    ten = {}
    for x in kb:
        ten.setdefault(x["tuoi"], set()).add(x["ten"])
    vi_tri = []
    for tuoi, han, viet in moc:
        assert han in van, han
        assert viet in ten.get(tuoi, set()), (tuoi, viet, ten.get(tuoi))
        vi_tri.append(van.index(han))
    assert vi_tri == sorted(vi_tri)
