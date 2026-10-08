# -*- coding: utf-8 -*-
"""LLM-55 — đường ống chạy bộ câu chuyên gia với AI: chấm giữ dữ kiện + giả lập không tốn tiền."""
from scripts import chay_llm_chuyen_gia as c


def test_thuc_the_va_giu_du_kien():
    assert c.thuc_the("Hoá Kỵ nằm ở cung Quan Lộc\nThiên Đồng hoá Kỵ") == ["hoa ky", "quan loc", "thien dong"]
    diem, thieu = c.giu_du_kien(["Hoá Kỵ nằm ở cung Quan Lộc"], "", "Hóa Kỵ của bạn đóng ở cung Quan lộc.")
    assert diem == 1.0 and not thieu                      # khác dấu "Hóa/Hoá", khác hoa thường vẫn tính
    diem, thieu = c.giu_du_kien(["Thái Âm nằm ở cung Phu Thê, độ sáng Miếu"], "", "Thái Âm ở cung Mệnh.")
    assert diem == 0.5 and thieu == ["phu the"]


def test_giong():
    assert c.giong("Bạn sẽ chắc chắn giàu.")["cum_phan"] == ["bạn sẽ", "chắc chắn"]
    assert c.giong("Đây là góc nhìn tham khảo văn hoá để tự soi.")["co_ket_tham_khao"]


def test_bo_cau_du_55():
    ds = c.bo_cau()
    assert len(ds) >= 55 and len({x["id"] for x in ds}) == len(ds)
    assert {x["mang"] for x in ds} == {"thanso", "tuvi", "battu", "phongthuy", "kinhdich"}


def test_gia_lap_chay_het_duong_ong(tmp_path):
    assert c.main(["--gia-lap", "--gioi-han", "6", "--ra", str(tmp_path)]) == 0
    bc = (tmp_path / "BAO-CAO.md").read_text(encoding="utf-8")
    assert "| tuvi |" in bc and (tmp_path / "ketqua.jsonl").exists()
