# -*- coding: utf-8 -*-
"""LG — Luận giải toàn bộ (RULES): bọc báo cáo theo chương + lời mời xem tiếp (SAO-2) + phí.

Tử vi (LG-ĐS) và Bát tự (BT-ĐS) đều là bản "đời sống" `doi_song_1` (`luangiai.tuvi_doi_song`,
`luangiai.battu_doi_song`); lời kết (hoi_van.KET) chỉ đặt một lần. Engine không lưu báo cáo (lưu chỉ khi người dùng
bấm, ở tầng web — `luan_giai_luu`). Phí: miễn phí thử nghiệm — tầng web trừ Sao, engine chỉ báo mức phí.
"""
from __future__ import annotations

import datetime as dt
import re

from app.luangiai import battu_doi_song as ds_battu
from app.luangiai import tuvi_doi_song as ds_tuvi
from app.narrative import hoi_van

PHI = {"sao": 0, "ly_do": "mien_phi_thu_nghiem"}

# LG-ĐS (2026-10-21): Tử vi dùng bản "đời sống" (`luangiai.tuvi_doi_song`) — 13 chương (VH-1 thêm Vận hạn), chấm cung, hộp nổi bật.
# Giữ dạng (ma, tiêu đề, câu hỏi) để nơi khác đọc danh sách chương như cũ.
CHUONG_TUVI = [(ma, tieu_de, cau) for ma, tieu_de, cau, _ in ds_tuvi.CHUONG]
# BT-ĐS (2026-10-21): Bát tự cùng khung "đời sống" (`luangiai.battu_doi_song`) — 13 chương (VH-1 thêm Vận hạn), chấm mảng, hộp nổi bật.
CHUONG_BATTU = list(ds_battu.CHUONG)


# SAO-2 — câu hỏi mở cho từng chương (tò mò về chính mình, KHÔNG doạ, không phán): web hiện cùng "điểm nhấn" (dữ kiện
# đã tính, cắt từ chính chương đó) khi chương bị khoá chờ mở bằng Sao. Không thêm dữ kiện nào ngoài báo cáo.
CAU_HOI_MO = {
    ("tuvi", "tong_quan"): "Điểm mạnh nào bạn đang dùng chưa hết, và điểm dễ vấp nào hay lặp lại trong các quyết định lớn?",
    ("tuvi", "cuoc_doi"): "Bạn đang đứng ở giai đoạn nào của đời mình, và giai đoạn kế tiếp xoay quanh điều gì?",
    ("tuvi", "suc_khoe"): "Thói quen nào đang âm thầm lấy sức của bạn, và nếp nhỏ nào giúp bạn giữ sức lâu?",
    ("tuvi", "quan_he"): "Kiểu người nào giúp bạn đi xa hơn, và bạn hay mất sức vì ai, vì việc gì bên ngoài?",
    ("tuvi", "nha_cua"): "Bạn cần một nơi ở thế nào để thấy yên, và chuyện nhà cửa nên tính theo nhịp nào?",
    ("tuvi", "nam_nay"): "Năm nay nên dồn sức vào đâu, và tháng nào trong 3 tháng tới hợp để bắt đầu việc mới?",
    ("tuvi", "van_han"): "Những năm nào nên đi chậm lại, và chậm ở chuyện gì?",
    ("tuvi", "loi_khuyen"): "Ba điểm mạnh nào bạn nên dùng nhiều hơn, và ba việc nhỏ nào nên bắt đầu ngay?",
    ("tuvi", "su_nghiep"): "Môi trường và vai trò nào giúp bạn bứt lên, kiểu việc nào khiến bạn mau cạn năng lượng?",
    ("tuvi", "tien_bac"): "Bạn kiếm tiền hợp nhất theo cách nào, và thói quen chi tiêu nào đang âm thầm làm hao hụt?",
    ("tuvi", "tinh_cam"): "Bạn thật sự tìm gì ở người bạn đời, và vì sao va chạm hay bắt đầu từ cùng một chỗ?",
    ("tuvi", "gia_dinh"): "Vì sao bạn phản ứng mạnh với một kiểu góp ý từ người lớn, và cách nào để gần nhau hơn?",
    ("tuvi", "duong_bay"): "Mảng đời nào đang âm thầm tác động lên mảng nào, và đâu là chỗ bạn hay tự ôm việc về mình?",
    ("battu", "tong_quan"): "Bạn phản ứng thế nào khi bị áp lực, và điểm mạnh nào bạn hay bỏ quên?",
    ("battu", "ngu_hanh"): "Phần năng lượng nào bạn đang thiếu, và hai cách đọc gợi ý bạn bù lại thế nào?",
    ("battu", "cuoc_doi"): "Mười năm bạn đang đi xoay quanh điều gì, và giai đoạn nào sắp tới nên chuẩn bị trước?",
    ("battu", "su_nghiep"): "Bạn hợp làm việc trong môi trường nào, và kiểu việc nào khiến bạn mau cạn sức?",
    ("battu", "tien_bac"): "Tiền đến với bạn theo đường nào, và thói quen nào làm tiền ra nhanh hơn bạn nghĩ?",
    ("battu", "tinh_cam"): "Bạn gắn bó theo kiểu nào, và va chạm trong tình cảm hay bắt đầu từ đâu?",
    ("battu", "gia_dinh"): "Bạn nhận được gì từ gia đình, và nếp nào bạn muốn làm khác cho thế hệ sau?",
    ("battu", "hoc_tap"): "Bạn học nhanh nhất theo cách nào, và vì sao có lúc ý hay bị bỏ dở?",
    ("battu", "suc_khoe"): "Nhịp sức của bạn lệch về phía nào, và nếp nhỏ nào giúp bạn giữ sức lâu?",
    ("battu", "quan_he"): "Người ngang hàng giúp bạn hay làm bạn mệt, và ai là người giúp đúng lúc?",
    ("battu", "nam_nay"): "Năm nay nên dồn sức vào đâu, và tháng nào sắp tới hợp để bắt đầu việc mới?",
    ("battu", "van_han"): "Những năm nào nên đi chậm lại, và chậm ở chuyện gì? Tháng nào hợp để bắt đầu việc mới?",
    ("battu", "loi_khuyen"): "Ba điểm mạnh nào bạn nên dùng nhiều hơn, và việc nhỏ nào nên bắt đầu ngay?",
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


def tuvi(sinh: dict, ngay_xem: dt.date | None = None, trong_so: dict | None = None,
         ca_nhan: dict | None = None) -> dict:
    """LG-ĐS: báo cáo `doi_song_1` (cot_loi, thoi_gian_bieu, 13 chương có hop/doan/can_cu) + các trường cũ
    (mo_dun, chuong[].ma/tieu_de/cau_hoi/doan/moi_xem, ket, trang_thai, phi) cho SAO-2 và tầng diễn đạt."""
    bc = ds_tuvi.lap(sinh, ngay_xem, trong_so=trong_so, ca_nhan=ca_nhan)
    chuong = [{**c, "moi_xem": _moi_xem("tuvi", c["ma"], c["doan"])} for c in bc["chuong"]]
    return {"mo_dun": "tuvi", **bc, "chuong": chuong, "ket": hoi_van.KET, "trang_thai": bc.get("trang_thai", "nhap_ai"),
            "phi": PHI}


def battu(sinh: dict, ngay_xem: dt.date | None = None, trong_so: dict | None = None,
          ca_nhan: dict | None = None) -> dict:
    """BT-ĐS: báo cáo `doi_song_1` cùng khung Tử vi (cot_loi, thoi_gian_bieu đại vận, 13 chương có hop/doan/can_cu) +
    các trường cũ (mo_dun, chuong[].ma/tieu_de/cau_hoi/doan/moi_xem, ket, trang_thai, phi) cho SAO-2 và diễn đạt."""
    bc = ds_battu.lap(sinh, ngay_xem, trong_so=trong_so, ca_nhan=ca_nhan)
    chuong = [{**c, "moi_xem": _moi_xem("battu", c["ma"], c["doan"])} for c in bc["chuong"]]
    return {"mo_dun": "battu", **bc, "chuong": chuong, "ket": hoi_van.KET,
            "trang_thai": bc.get("trang_thai", "nhap_ai"), "phi": PHI}
