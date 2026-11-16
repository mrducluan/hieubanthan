"""SEO-P — trả lời đúng câu người ta tìm (số liệu Search Console 11/2026), viết TRƯỚC khi sửa hàm.

* "năm 2027 có nhuận không" → trang lịch âm năm trả lời câu nhuận NGAY câu đầu + hỏi đáp đứng đầu.
* "1998 năm 2026 bao nhiêu tuổi" → trang Tử vi năm theo tuổi nêu tuổi tròn + tuổi mụ ngay câu đầu.
* "tử vi ngày … của 12 con giáp" → trang ngày có bảng 12 con giáp (quan hệ chi ngày ↔ tuổi, đúng hàm của hồ sơ tuổi).
"""
import datetime as dt

from app.calc import hoang_lich as hl
from app.luangiai import hoang_lich as L
from app.luangiai import lich_nam, nam_tong_quan


def test_lich_nam_tra_loi_nhuan_truoc():
    k = lich_nam.lich_nam(2027)
    assert k["tra_loi_nhanh"].startswith("Năm 2027 không có tháng nhuận âm lịch")
    assert k["hoi_dap"][0]["hoi"] == "Năm 2027 có nhuận không?"
    assert k["hoi_dap"][0]["dap"].startswith("Không.")
    n = lich_nam.lich_nam(2028)
    assert n["tra_loi_nhanh"].startswith("Năm 2028 có tháng nhuận: nhuận tháng 5 âm lịch")
    assert n["hoi_dap"][0]["hoi"] == "Năm 2028 có nhuận không?"
    assert "tháng 5 nhuận" in n["hoi_dap"][0]["dap"]
    # câu Tết vẫn còn trong hỏi đáp (không mất nội dung cũ)
    assert any(h["hoi"] == "Tết âm lịch 2028 là ngày nào?" for h in n["hoi_dap"])


def test_theo_tuoi_bao_nhieu_tuoi():
    t = nam_tong_quan.theo_tuoi(2026, 1998)
    assert t["tuoi_tron"] == 28
    assert t["tra_loi_nhanh"].startswith("Năm 2026, người sinh năm 1998 (tuổi Mậu Dần) bước sang 28 tuổi, tuổi mụ 29.")
    assert t["hoi_dap"][0]["hoi"] == "Sinh năm 1998, năm 2026 bao nhiêu tuổi?"
    assert "28 tuổi" in t["hoi_dap"][0]["dap"] and "29" in t["hoi_dap"][0]["dap"]


def test_ngay_12_con_giap():
    d = dt.date(2026, 11, 11)                       # ngày Kỷ Sửu
    n = L.ngay_xem(d)
    cg = n["con_giap"]
    assert [x["chi"] for x in cg] == ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"]
    by = {x["chi"]: x for x in cg}
    assert by["Mùi"]["ma"] == "xung"               # Sửu xung Mùi
    assert by["Tỵ"]["ma"] == "tam_hop" and by["Dậu"]["ma"] == "tam_hop"
    assert by["Tý"]["ma"] == "luc_hop"
    assert by["Sửu"]["ma"] == "trung"
    # một nguồn: đúng hàm quan hệ tuổi của hồ sơ
    chi_ngay = L._calc(d)["ngay_gz"][1]
    for i, x in enumerate(cg):
        assert x["ma"] == hl.quan_he_tuoi(chi_ngay, hl.ZHI[i])
        assert x["ten"] and x["nghia"]
    assert "Tuổi hợp ngày" not in n["tra_loi_nhanh"]   # câu trả lời nhanh giữ trần 90 từ; bảng đã trả lời



# ---- H2 tự đứng được (AEO): heading chung của cụm mang tên chủ thể của trang ----
GOC_CHUNG = {"Sách xưa nói gì", "Câu hỏi tự soi", "Mặt tối", "Điểm mạnh", "Lời khuyên", "Tính cách", "Dễ hoà ở đâu",
             "Dễ va ở đâu", "Cách yêu", "Hôn nhân", "Nên làm", "Nên tránh", "Gợi ý", "Ý nghĩa", "Xuôi và ngược",
             "Theo từng chuyện", "Dân gian nói gì", "Việc nên làm theo chi phí", "Cung này cho thấy gì"}


def test_h2_kien_thuc_mang_chu_the():
    from app.kb import trang as T
    sai, trung = [], []
    for x in T.danh_sach():
        t = T.lay(x["loai"], x["slug"])
        hs = [m["tieu_de"] for m in t["muc"]]
        sai += [(x["loai"], x["slug"], h) for h in hs if h in GOC_CHUNG]
        trung += [(x["loai"], x["slug"], h) for h in set(hs) if hs.count(h) > 1]
    assert not sai, sai[:10]
    assert not trung, trung[:10]


def test_h2_vi_du():
    from app.kb import trang as T
    hs = [m["tieu_de"] for m in T.lay("que", "que-1-can")["muc"]]
    assert "Mặt tối của quẻ Càn" in hs and "Sách xưa nói gì về quẻ Càn" in hs
    tt = [m["tieu_de"] for m in T.lay("thap_than", "thuc-than")["muc"]]
    assert "Tính cách người có Thực Thần" in tt and "Sách xưa nói gì về Thực Thần" in tt
    cs = [m["tieu_de"] for m in T.lay("cap_so", "so-chu-dao-3-va-5")["muc"]]
    assert "Số 3 và số 5 dễ hoà ở đâu" in cs
