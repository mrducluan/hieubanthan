"""Rà soát đợt 1 (2026-11-20): Cửu Độn theo bài ca chính + hợp đồng mã mức "Bản đồ đội ngũ" giữa engine và web."""
import json
import re
from pathlib import Path

from app.calc import doanh_chu
from app.kb import sach_ghi as sg
from app.kb import tuong_hoc_dot4_kb as d4

_GOC = Path(__file__).resolve().parents[2]


def _ma(ra: list[dict]) -> set[str]:
    return {x["ma"] for x in ra}


def test_ho_don_theo_bai_ca_chinh():
    # 歌曰 天上六乙合六辛臨休到艮虎遁門: Ất trên, Tân dưới, cửa Hưu, cung Cấn (8).
    assert "ho_don" in _ma(d4.tra_cuu_don_cung("Ất", "Tân", "Hưu", "Trực Phù", 8))
    # Hai cách «又曰 / 一云» chỉ ghi chú, không nhận: cửa Sinh, hoặc thiếu Tân, hoặc ngoài cung Cấn.
    assert "ho_don" not in _ma(d4.tra_cuu_don_cung("Ất", "Tân", "Sinh", "Trực Phù", 3))
    assert "ho_don" not in _ma(d4.tra_cuu_don_cung("Ất", "Kỷ", "Sinh", "Trực Phù", 8))
    assert "ho_don" not in _ma(d4.tra_cuu_don_cung("Ất", "Tân", "Hưu", "Trực Phù", 3))


def test_van_phong_long_don_theo_bai_ca_chinh():
    assert "van_don" in _ma(d4.tra_cuu_don_cung("Ất", "Tân", "Sinh", "Trực Phù", 3))
    assert "van_don" not in _ma(d4.tra_cuu_don_cung("Ất", "Kỷ", "Khai", "Trực Phù", 2))      # cung Khôn chỉ là cách khác
    assert "phong_don" in _ma(d4.tra_cuu_don_cung("Ất", "Mậu", "Khai", "Trực Phù", 4))
    assert "phong_don" not in _ma(d4.tra_cuu_don_cung("Bính", "Mậu", "Khai", "Trực Phù", 4))  # Bính chỉ là cách khác
    assert "long_don" in _ma(d4.tra_cuu_don_cung("Ất", "Mậu", "Hưu", "Trực Phù", 1))
    assert "long_don" not in _ma(d4.tra_cuu_don_cung("Ất", "Quý", "Sinh", "Trực Phù", 3))


def test_cau_sach_khac_khop_kho_nguon_va_khong_lo_ten_noi_bo():
    nguon = sg.chuan((_GOC / "engine/fixtures/nguon/don_giap_dien_nghia.json").read_text(encoding="utf-8").replace("\\n", ""))
    for ma, muc in d4.kymon_cuu_don()["cuu_don"].items():
        assert sg.chuan(muc["sach_ghi"]["han"]) in nguon, ma
        khac = muc.get("sach_ghi_khac")
        if khac:
            assert sg.chuan(khac["han"]) in nguon, ma
    ra = d4.tra_cuu_don_cung("Ất", "Tân", "Hưu", "Trực Phù", 8)
    ho = next(x for x in ra if x["ma"] == "ho_don")
    assert ho["sach_ghi_khac"]["nguon"].startswith("Độn Giáp Diễn Nghĩa")
    assert "don_giap" not in json.dumps(ho, ensure_ascii=False)


def test_ky_mon_khong_hien_hai_lan_cung_mot_don():
    from datetime import datetime, timedelta

    from app.calc import ky_mon as km
    from app.luangiai import ky_mon

    goc = datetime(2026, 1, 1, 1, 0)
    for i in range(240):
        kq = ky_mon.doc_gio(km.lap_ban(goc + timedelta(hours=2 * i * 7)))
        for h in kq["huong"]:
            cach = {c["ma"] for c in h["cach"]}
            cd = {c["ma"] for c in h.get("cuu_don", [])}
            assert not (cach & cd), (h["phuong"], cach & cd)


def test_ma_muc_phoi_hop_engine_khop_kieu_web():
    """Engine trả `muc_phoi_hop` — web lọc / tô màu theo kiểu `MucPhoiHop`. Lệch là chip lọc rỗng (lỗi 2026-11-20)."""
    src = (_GOC / "engine/app/calc/doanh_chu.py").read_text(encoding="utf-8")
    engine = set(re.findall(r'muc_phoi_hop = "([a-z_]+)"', src))
    web = (_GOC / "web/lib/doanh-chu.ts").read_text(encoding="utf-8")
    kieu = re.search(r"export type MucPhoiHop = ([^;]+);", web)
    assert kieu, "không thấy kiểu MucPhoiHop"
    assert engine and engine == set(re.findall(r'"([a-z_]+)"', kieu.group(1)))
    assert doanh_chu  # module nạp được
