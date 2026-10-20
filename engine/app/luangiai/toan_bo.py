# -*- coding: utf-8 -*-
"""LG — Luận giải toàn bộ (RULES): ghép báo cáo theo chương từ CHÍNH các đường hỏi đáp đã có.

Mỗi chương = một câu hỏi chuẩn chạy qua hoidap (cùng phân loại, cùng KB, cùng bộ lọc khủng hoảng /
ngày chết / bệnh / xổ số). Đoạn trùng giữa các chương bị bỏ; lời kết (hoi_van.KET) chỉ đặt một lần.
Không lưu báo cáo (quy tắc: không lưu luận giải gắn user_id). Phí: miễn phí 2 tháng thử nghiệm
(chủ dự án chốt 2026-10-01) — sau đó tầng web trừ Sao, engine chỉ báo mức phí.
"""
from __future__ import annotations

import datetime as dt
import re

from app.hoidap import battu as hd_battu, tuvi as hd_tuvi
from app.narrative import hoi_van

PHI = {"sao": 0, "ly_do": "mien_phi_thu_nghiem"}

CHUONG_TUVI = [
    ("tong_quan", "Tổng quan bản mệnh", "Cung Mệnh của tôi nói gì về tính cách?"),
    ("su_nghiep", "Sự nghiệp", "Cung Quan Lộc của tôi nói gì về sự nghiệp?"),
    ("tien_bac", "Tiền bạc", "Cung Tài Bạch của tôi nói gì về tiền bạc?"),
    ("tinh_cam", "Tình cảm, hôn nhân", "Cung Phu Thê của tôi thế nào?"),
    ("gia_dinh", "Cha mẹ, con cái", "Cung Phụ Mẫu của tôi thế nào?"),
    ("con_cai", "Con cái, người kế tiếp", "Cung Tử Nữ của tôi thế nào?"),
    ("tinh_than", "Đời sống tinh thần, phúc đức", "Cung Phúc Đức của tôi thế nào?"),
    # TV-V2: phi tinh tứ hoá (lớp nền của lá gốc) đọc trước vận hạn; nhịp 3 tháng (lưu nguyệt) đọc SAU vận hạn —
    # đúng thứ tự ưu tiên đại hạn > lưu niên > tiểu hạn > lưu nguyệt.
    ("duong_bay", "Đường bay tứ hoá", "Đường bay tứ hoá trong lá số của tôi nói gì?"),
    ("van_han", "Vận hạn hiện tại", "Đại hạn hiện tại của tôi là chủ đề gì?"),
    ("ba_thang_toi", "3 tháng tới", "Ba tháng tới của tôi thế nào?"),
]
CHUONG_BATTU = [
    ("tong_quan", "Nhật chủ và tính cách", "Nhật chủ của tôi là người thế nào?"),
    ("ngu_hanh", "Ngũ hành, thân vượng nhược, dụng thần", "Dụng thần của tôi là gì?"),
    ("su_nghiep", "Sự nghiệp, tiền bạc qua thập thần", "Thập thần trong lá số của tôi nói gì về sự nghiệp?"),
    ("van", "Đại vận và năm nay", "Đại vận hiện tại của tôi là gì?"),
]


# SAO-2 — câu hỏi mở cho từng chương (tò mò về chính mình, KHÔNG doạ, không phán): web hiện cùng "điểm nhấn" (dữ kiện
# đã tính, cắt từ chính chương đó) khi chương bị khoá chờ mở bằng Sao. Không thêm dữ kiện nào ngoài báo cáo.
CAU_HOI_MO = {
    ("tuvi", "tong_quan"): "Điểm mạnh nào bạn đang dùng chưa hết, và điểm dễ vấp nào hay lặp lại trong các quyết định lớn?",
    ("tuvi", "su_nghiep"): "Môi trường và vai trò nào giúp bạn bứt lên, kiểu việc nào khiến bạn mau cạn năng lượng?",
    ("tuvi", "tien_bac"): "Bạn kiếm tiền hợp nhất theo cách nào, và thói quen chi tiêu nào đang âm thầm làm hao hụt?",
    ("tuvi", "tinh_cam"): "Bạn thật sự tìm gì ở người bạn đời, và vì sao va chạm hay bắt đầu từ cùng một chỗ?",
    ("tuvi", "gia_dinh"): "Vì sao bạn phản ứng mạnh với một kiểu góp ý từ người lớn, và cách nào để gần nhau hơn?",
    ("tuvi", "con_cai"): "Bạn nuôi dưỡng con cái và những điều mình tạo ra theo cách nào, điểm nào nên nới lỏng?",
    ("tuvi", "tinh_than"): "Điều gì thật sự cho bạn bình an, và điều gì khiến tâm trí bạn khó tĩnh?",
    ("tuvi", "van_han"): "Mười năm này xoay quanh chủ đề gì, và năm nay nên dồn sức vào đâu?",
    ("tuvi", "duong_bay"): "Mảng đời nào đang âm thầm tác động lên mảng nào, và đâu là chỗ bạn hay tự ôm việc về mình?",
    ("tuvi", "ba_thang_toi"): "Tháng nào hợp để bắt đầu việc mới, tháng nào nên giữ nhịp và chăm việc đang dở?",
    ("battu", "tong_quan"): "Nhật chủ nói gì về cách bạn phản ứng khi áp lực, và điểm mạnh nào bạn hay bỏ quên?",
    ("battu", "ngu_hanh"): "Hành nào bạn đang thiếu, và hai cách chọn dụng thần gợi ý bạn cân bằng thế nào?",
    ("battu", "su_nghiep"): "Thập thần trong lá số cho thấy bạn hợp kiếm tiền và làm việc theo kiểu nào?",
    ("battu", "van"): "Đại vận mười năm này và năm nay đặt trọng tâm vào đâu trong đời bạn?",
    ("thanso", "tong_quan"): "Bộ số của bạn hiếm cỡ nào, và con số nào đậm nhất ở bạn?",
    ("thanso", "nghich_ly"): "Vì sao người khác đôi khi hiểu bạn khác với con người thật bên trong — và nói sao cho họ hiểu?",
    ("thanso", "muoi_hai_thang"): "Tháng nào trong 12 tháng tới hợp để khởi sự, đổi việc, lo quan hệ hay bàn chuyện tiền?",
    ("thanso", "su_nghiep"): "Bạn hợp kiểu việc và vai trò nào, bẫy nào hay lặp lại, và giai đoạn nào trong đời thuận cho nghề?",
}
_DINH_NGHIA = re.compile(r"^(Cung [^:]{2,24}: |Tuổi mụ|Màu sắc|Câu hỏi để tự soi)")


def diem_nhan(doan: list[str]) -> str:
    """Một dữ kiện đã tính của chương (câu đầu có số liệu riêng của người xem), cắt từ chính đoạn trong chương."""
    ung = [d for d in doan if not _DINH_NGHIA.match(d)] or doan
    rieng = next((d for d in ung if d.startswith("Trong lá số của bạn")), None)
    if rieng and "): " in rieng:
        return rieng[: rieng.index("): ") + 1]
    d = ung[0] if ung else ""
    i = d.find(". ")
    cau = d[: i + 1] if i > 0 else d
    return cau if len(cau) <= 200 else cau[:199].rstrip() + "…"


def _moi_xem(mo_dun: str, ma: str, doan: list[str]) -> dict:
    chu = sum(len(d.split()) for d in doan)
    return {"diem_nhan": diem_nhan(doan), "cau_hoi": CAU_HOI_MO.get((mo_dun, ma), "Chương này nói gì về chính bạn?"),
            "so_doan": len(doan), "phut_doc": max(1, round(chu / 200))}


def _ghep(mo_dun: str, chuong: list[tuple[str, str, str]], hoi) -> dict:
    da_co: set[str] = {hoi_van.KET}
    ds = []
    for ma, tieu_de, cau in chuong:
        kq = hoi(cau)
        doan = []
        for d in (x.strip() for x in kq["cau_tra_loi"].split("\n\n")):
            if d and d not in da_co:
                da_co.add(d)
                doan.append(d)
        ds.append({"ma": ma, "tieu_de": tieu_de, "cau_hoi": cau, "doan": doan, "moi_xem": _moi_xem(mo_dun, ma, doan)})
    return {"mo_dun": mo_dun, "chuong": ds, "ket": hoi_van.KET, "trang_thai": "nhap_ai", "phi": PHI}


def tuvi(sinh: dict, ngay_xem: dt.date | None = None) -> dict:
    return _ghep("tuvi", CHUONG_TUVI, lambda c: hd_tuvi.tra_loi(c, "chi_tiet", sinh=sinh, ngay_xem=ngay_xem))


def battu(sinh: dict, ngay_xem: dt.date | None = None) -> dict:
    return _ghep("battu", CHUONG_BATTU, lambda c: hd_battu.tra_loi(c, sinh=sinh, ngay_xem=ngay_xem))
