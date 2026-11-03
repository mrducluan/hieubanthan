"""AUD-12: câu "trùng chu kỳ" chỉ nói điều suy ra từ phép tính (chu kỳ chỉ phụ thuộc ngày + tháng sinh),
không ước tính số người trên thế giới (TS-V3c: không trình bày như thống kê dân số)."""
from app.calc import thanso


def test_trung_chu_ky_khong_uoc_tinh_dan_so():
    d = thanso.so_nguoi_trung_chu_ky()
    chu = " ".join(str(v) for v in d.values())
    assert "triệu" not in chu and "dân số" not in chu
    assert "uoc_tinh_toan_cau" not in d
    assert "ngày" in d["y_nghia"] and "tháng sinh" in d["y_nghia"]
    assert " anh " not in f" {d['y_nghia']} "
