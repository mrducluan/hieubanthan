# -*- coding: utf-8 -*-
"""EN-4 (mục 3) — MỘT bộ kiểm đầu ra AI cho mọi lời gọi: liên kết, số (cả viết bằng chữ), thuật ngữ lạ (từ điển 5 mảng),
cụm cấm, từ y tế, câu "ý mới" (câu dài gần như không trùng từ với nguồn), độ dài ≤ 1,5 lần nguồn."""
from app.narrative import kiem_ai

NGUON = ("Năm 2027 với bạn ở mức cân bằng. Cung Quan Lộc có Thái Dương, công việc cần làm đều tay, giữ kế hoạch "
         "theo quý. Câu hỏi tự soi: việc nào bạn đang trì hoãn?")


def test_ban_sach_qua():
    van = ("Năm 2027 với bạn ở mức cân bằng. Ở cung Quan Lộc có Thái Dương, nên công việc cần làm đều tay và giữ kế "
           "hoạch theo quý. Hãy tự hỏi: việc nào bạn đang trì hoãn?")
    assert kiem_ai.kiem(van, NGUON) == []


def test_so_la_ke_ca_viet_bang_chu():
    assert any("số lạ" in x for x in kiem_ai.kiem("Năm 2029 bạn sẽ khá hơn.", NGUON))
    assert any("số lạ" in x for x in kiem_ai.kiem("Khoảng hai mươi lăm tuổi bạn đổi việc.", NGUON))


def test_thuat_ngu_la_y_te_lien_ket():
    assert any("thuật ngữ lạ" in x for x in kiem_ai.kiem("Cung Tài Bạch có Vũ Khúc nên công việc đều tay.", NGUON))
    assert any("y tế" in x for x in kiem_ai.kiem("Công việc đều tay, nhưng nên đi khám tim mạch sớm.", NGUON))
    assert any("liên kết" in x for x in kiem_ai.kiem("Xem thêm tại https://abc.xyz nhé.", NGUON))


def test_cau_y_moi():
    van = NGUON + " Ngoài ra bạn nên đầu tư bất động sản ở vùng ven vì giá đất đang lên rất nhanh trong thời gian tới."
    assert any("ý mới" in x for x in kiem_ai.kiem(van, NGUON))


def test_qua_dai():
    assert any("dài" in x for x in kiem_ai.kiem(" ".join([NGUON] * 3), NGUON))


def test_muoi_nam_la_10_nam():
    assert kiem_ai._so_chu("mười năm tới") == {10} and kiem_ai._so_chu("hai mươi lăm tuổi") == {25}
