# -*- coding: utf-8 -*-
"""Lịch Quyết Định 12 Tháng cho Chủ DN / Quản lý — Bát Tự Lưu Nguyệt + Thần Số Tháng cá nhân + Hoàng Lịch.

100% tất định, không lưu dữ liệu (khong_luu_du_lieu=True), luận 2 chiều (nên làm + nên chú ý), song ngữ VI/EN.
"""
from __future__ import annotations

import calendar
import datetime as dt

from app import ngon_ngu
from app.calc import battu
from app.calc import doanh_chu as dc
from app.calc import thanso_mo_rong as tsmr
from app.luangiai import hoang_lich as hl

_CAN_HANH: dict[str, str] = {
    "Giáp": "Mộc", "Ất": "Mộc",
    "Bính": "Hỏa", "Đinh": "Hỏa",
    "Mậu": "Thổ", "Kỷ": "Thổ",
    "Canh": "Kim", "Tân": "Kim",
    "Nhâm": "Thủy", "Quý": "Thủy",
}

_SINH: dict[str, str] = {"Mộc": "Hỏa", "Hỏa": "Thổ", "Thổ": "Kim", "Kim": "Thủy", "Thủy": "Mộc"}
_KHAC: dict[str, str] = {"Mộc": "Thổ", "Thổ": "Thủy", "Thủy": "Hỏa", "Hỏa": "Kim", "Kim": "Mộc"}

_HANH_EN: dict[str, str] = {"Kim": "Metal", "Mộc": "Wood", "Thủy": "Water", "Hỏa": "Fire", "Thổ": "Earth"}

_MUC_TIEU: dict[str, dict[str, tuple[str, str]]] = {
    "tang_truong": {
        "vi": ("Mở rộng & Tăng trưởng", "Ưu tiên mở kênh bán hàng, tăng sản lượng và chốt hợp tác mới"),
        "en": ("Growth & Expansion", "Focus on expanding sales channels, scaling output, and new partnerships"),
    },
    "ky_ket": {
        "vi": ("Ký kết & Hợp tác", "Ưu tiên đàm phán hợp đồng lớn, liên minh đối tác và chốt điều khoản"),
        "en": ("Signing & Partnerships", "Focus on major contract negotiations, alliances, and closing key terms"),
    },
    "giu_tien": {
        "vi": ("Giữ dòng tiền & Tối ưu", "Ưu tiên kiểm soát chi phí, thu hồi công nợ và chuẩn hoá quy trình"),
        "en": ("Cashflow & Efficiency", "Focus on cost control, receivables collection, and operational discipline"),
    },
    "ra_mat": {
        "vi": ("Ra mắt sản phẩm / Chi nhánh", "Ưu tiên lịch công bố sản phẩm, mở điểm bán mới và truyền thông"),
        "en": ("Product / Branch Launch", "Focus on product launches, opening new locations, and go-to-market"),
    },
}

_TCN_NHAN: dict[int, tuple[str, str]] = {
    1: ("Khởi phát — mở đầu việc mới", "Initiation — launch new initiatives"),
    2: ("Liên kết — đàm phán, hợp tác", "Alliance — negotiate and align partners"),
    3: ("Truyền thông — lan toả, bán hàng", "Visibility — market and communicate"),
    4: ("Nền tảng — chuẩn hoá quy trình", "Foundation — build systems and discipline"),
    5: ("Xoay trục — linh hoạt, thử nghiệm", "Agility — adapt and test new channels"),
    6: ("Chăm sóc — giữ khách, gắn kết đội", "Stewardship — retain clients and team"),
    7: ("Rà soát — kiểm toán, nhìn lại dữ liệu", "Review — audit metrics and refine strategy"),
    8: ("Thu hoạch — chốt doanh số, tài chính", "Harvest — close deals and manage capital"),
    9: ("Khép vòng — dọn việc cũ, chuẩn bị mới", "Completion — close legacy items cleanly"),
}


def _luu_nguyet_hanh(nam_xem: int, thang: int, gioi_tinh: str) -> tuple[str, str, str]:
    """Lấy Can, Chi và Ngũ hành của Lưu Nguyệt (lấy ngày 15 giữa tháng để qua tiết khí chính)."""
    ls = battu.la_so(dt.datetime(nam_xem, thang, 15, 12, 0), gioi_tinh)
    tru_thang = ls["tru"][1]
    can = tru_thang["can"]
    chi = tru_thang["chi"]
    return can, chi, _CAN_HANH.get(can, "Thổ")


def _top_ngay_dep(nam_xem: int, thang: int, viec: str, nam_sinh: int, thang_sinh: int, ngay_sinh: int) -> list[dict]:
    """Lấy tối đa 3 ngày thuận lợi nhất trong tháng từ Hoàng Lịch (ưu tiên ngày sạch nhan_tap_quan)."""
    cuoi = calendar.monthrange(nam_xem, thang)[1]
    kq = hl.chon_ngay(viec, dt.date(nam_xem, thang, 1), dt.date(nam_xem, thang, cuoi), nam_sinh, thang_sinh, ngay_sinh)
    ds = sorted(
        kq.get("ngay") or [],
        key=lambda x: (len(x.get("nhan_tap_quan") or []), not bool(x.get("dep")), not bool(x.get("hoang_dao"))),
    )
    out: list[dict] = []
    for item in ds[:3]:
        out.append({
            "ngay": item["ngay"],
            "am": item.get("am", ""),
            "can_chi": item.get("can_chi", ""),
            "truc": item.get("truc", ""),
            "dep": bool(item.get("dep")),
            "hoang_dao": bool(item.get("hoang_dao")),
            "luu_y_ngay": list(item.get("nhan_tap_quan") or []),
        })
    return out


def _loi_thang(
    nhip: str,
    hanh_thang: str,
    tcn: int,
    muc_tieu: str,
    cap_ql: str,
    vi: bool,
) -> tuple[str, str]:
    """Sinh lời khuyên 2 chiều (nên làm + nên chú ý) cụ thể, đời thường, không phán định."""
    h_en = _HANH_EN.get(hanh_thang, hanh_thang)
    tcn_vi, tcn_en = _TCN_NHAN.get(tcn, _TCN_NHAN[4])
    if vi:
        if nhip == "day_manh":
            if muc_tieu == "ra_mat":
                nen = f"Tháng hành {hanh_thang} trợ lực kết hợp nhịp {tcn_vi.lower()}: phù hợp chốt lịch ra mắt, đẩy chiến dịch mở bán và chốt đơn lớn."
            elif muc_tieu == "ky_ket":
                nen = f"Tháng hành {hanh_thang} thuận nhịp ({tcn_vi.lower()}): nên chủ động đàm phán điều khoản, gặp đối tác trọng yếu và ký hợp đồng."
            elif muc_tieu == "giu_tien":
                nen = f"Tháng hành {hanh_thang} sáng nhịp ({tcn_vi.lower()}): tận dụng đà thuận để thu hồi công nợ, đàm phán lại giá vốn và tăng biên lợi nhuận."
            else:
                nen = f"Tháng hành {hanh_thang} trợ lực ({tcn_vi.lower()}): thích hợp đẩy chỉ tiêu bán hàng, mở rộng kênh mới và giao mục tiêu rõ cho đội."
            chu_y = (
                "Khi nhịp đang thuận rất dễ mở quá nhiều đầu việc cùng lúc; "
                "cần chốt giới hạn ngân sách và người chịu trách nhiệm cuối trước khi giải ngân."
            )
        elif nhip == "phong_thu":
            nen = (
                f"Tháng hành {hanh_thang} mang nhịp {tcn_vi.lower()}: ưu tiên giữ dòng tiền an toàn, "
                "rà lại hợp đồng đang chạy, chuẩn hoá quy trình nội bộ và chăm sóc khách cũ."
            )
            chu_y = (
                "Hạn chế cam kết chi phí cố định dài hạn hoặc quyết định vội khi chưa đủ số liệu; "
                "với việc bắt buộc ký kết, hãy chọn ngày đẹp trong tháng và đọc kỹ điều khoản thoát."
            )
        else:
            nen = (
                f"Tháng hành {hanh_thang} giữ nhịp ổn định ({tcn_vi.lower()}): phù hợp triển khai đều tay kế hoạch đã chốt, "
                "đo hiệu quả từng tuần và điều chỉnh nhẹ theo phản hồi thực tế."
            )
            chu_y = (
                "Tránh dàn trải nguồn lực vào thử nghiệm ngoài trọng tâm; "
                "giữ nhịp họp ngắn giữa các bộ phận để phát hiện sớm điểm nghẽn."
            )
        if cap_ql == "truong_nhom":
            nen += " Tập trung bám sát tiến độ từng tuần cùng các thành viên trực tiếp."
        elif cap_ql == "giam_doc":
            nen += " Đồng bộ lại chỉ tiêu bộ phận với Ban Giám đốc trước tuần thứ 2."
        return nen, chu_y

    # English version (strictly zero Vietnamese diacritics)
    if nhip == "day_manh":
        nen = f"Supportive {h_en} month aligned with {tcn_en.lower()}: strong window to push revenue targets, close key agreements, and move major initiatives forward."
        chu_y = "Favorable momentum can invite over-commitment; cap budget exposure and assign one clear owner before approving spend."
    elif nhip == "phong_thu":
        nen = f"Defensive {h_en} month ({tcn_en.lower()}): prioritize cashflow protection, review active commitments, tighten internal workflows, and retain core accounts."
        chu_y = "Avoid locking in heavy fixed costs or rushing major changes without verified numbers; use the listed favorable dates for unavoidable signings."
    else:
        nen = f"Balanced {h_en} month ({tcn_en.lower()}): execute your established roadmap steadily, track weekly metrics, and make measured adjustments."
        chu_y = "Avoid scattering team bandwidth across side experiments; keep short cross-team check-ins to catch bottlenecks early."
    if cap_ql == "truong_nhom":
        nen += " Keep weekly execution checkpoints tight with your direct team."
    elif cap_ql == "giam_doc":
        nen += " Re-align departmental KPIs with senior leadership early in the month."
    return nen, chu_y


def lich_quyet_dinh_12_thang(
    ngay: int,
    thang: int,
    nam: int,
    gioi_tinh: str = "nam",
    nam_xem: int = 2026,
    cap_quan_ly: str = "chu_dn",
    muc_tieu: str = "tang_truong",
) -> dict:
    """Tính Lịch Quyết Định 12 Tháng tất định cho Chủ DN / Quản lý (Bát Tự + Thần Số + Hoàng Lịch)."""
    vi = ngon_ngu.la_viet()
    hs = dc._ho_so_co_ban(ngay, thang, nam, gioi_tinh, nam_xem)
    hanh_can_bu = set(hs["hanh_can_bu"])
    chi_nam = hs["chi_nam"]
    viec_lich = "khai_truong" if muc_tieu == "ra_mat" else "ky_ket"

    ds_thang: list[dict] = []
    thang_day_manh: list[int] = []
    thang_phong_thu: list[int] = []

    for m in range(1, 13):
        can_t, chi_t, hanh_t = _luu_nguyet_hanh(nam_xem, m, gioi_tinh)
        qh_chi = dc._quan_he_dia_chi(chi_nam, chi_t)
        tcn = tsmr.thang_ca_nhan(ngay, thang, nam_xem, m)

        diem = 0
        if hanh_t in hanh_can_bu:
            diem += 2
        elif _SINH.get(hanh_t) in hanh_can_bu:
            diem += 1
        elif _KHAC.get(hanh_t) == hs["nhat_chu_hanh"] and hanh_t not in hanh_can_bu:
            diem -= 1

        if qh_chi in ("luc_hop", "tam_hop"):
            diem += 1
        elif qh_chi in ("luc_xung", "tuong_hinh"):
            diem -= 2

        if tcn in (1, 3, 5, 8):
            diem += 1
        elif tcn in (4, 7, 9):
            diem -= 1

        if diem >= 2:
            nhip = "day_manh"
            nhan_nhip = "Đẩy mạnh & Mở rộng" if vi else "Expand & Push"
            thang_day_manh.append(m)
        elif diem <= -1:
            nhip = "phong_thu"
            nhan_nhip = "Phòng thủ & Giữ tiền" if vi else "Defend & Preserve Cash"
            thang_phong_thu.append(m)
        else:
            nhip = "can_bang"
            nhan_nhip = "Cân bằng & Chuẩn hoá" if vi else "Steady & Consolidate"

        nen_lam, nen_chu_y = _loi_thang(nhip, hanh_t, tcn, muc_tieu, cap_quan_ly, vi)
        tcn_vi, tcn_en = _TCN_NHAN.get(tcn, _TCN_NHAN[4])
        ngay_dep = _top_ngay_dep(nam_xem, m, viec_lich, nam, thang, ngay)

        ds_thang.append({
            "thang": m,
            "can_chi_thang": f"{can_t} {chi_t}",
            "hanh_thang": hanh_t if vi else _HANH_EN.get(hanh_t, hanh_t),
            "thang_ca_nhan": tcn,
            "chu_de_thang": tcn_vi if vi else tcn_en,
            "nhip_thang": nhip,
            "nhan_nhip": nhan_nhip,
            "nen_lam": nen_lam,
            "nen_chu_y": nen_chu_y,
            "ngay_dep": ngay_dep,
        })

    mt_ten, mt_mo_ta = _MUC_TIEU.get(muc_tieu, _MUC_TIEU["tang_truong"])["vi" if vi else "en"]
    dm_str = ", ".join(f"T{x}" for x in thang_day_manh) if thang_day_manh else ("chưa nổi trội" if vi else "steady pace")
    pt_str = ", ".join(f"T{x}" for x in thang_phong_thu) if thang_phong_thu else ("không có tháng xung mạnh" if vi else "no heavy clash months")

    if vi:
        nhan_dinh_nam = (
            f"Năm {nam_xem} (Năm cá nhân {hs['nam_ca_nhan']}, Nhật chủ hành {hs['nhat_chu_hanh']}) theo mục tiêu {mt_ten.lower()}: "
            f"các cửa sổ thuận lợi để đẩy mạnh rơi vào {dm_str}; các tháng nên siết dòng tiền và rà soát kỹ là {pt_str}."
        )
        canh_bao_chung = (
            "Lịch này dùng để sắp xếp nhịp ưu tiên và chọn thời điểm chuẩn bị — mọi quyết định tài chính, "
            "ký kết hay đầu tư vẫn cần dựa trên số liệu kinh doanh, dòng tiền thực tế và tư vấn chuyên môn."
        )
        ranh_gioi = (
            "Thông tin tham khảo điều hành theo Bát Tự, Thần Số và Hoàng Lịch cổ điển; không thay thế tư vấn tài chính, "
            "pháp lý hay kiểm toán. Dữ liệu ngày sinh chỉ dùng cho lượt tính này và không lưu lại trên máy chủ."
        )
    else:
        nc_en = _HANH_EN.get(hs["nhat_chu_hanh"], hs["nhat_chu_hanh"])
        nhan_dinh_nam = (
            f"Year {nam_xem} (Personal Year {hs['nam_ca_nhan']}, Day Master {nc_en}) for {mt_ten.lower()}: "
            f"stronger expansion windows fall in {dm_str}; defensive cashflow and audit months fall in {pt_str}."
        )
        canh_bao_chung = (
            "Use this calendar to pace preparation and prioritization; every financial, signing, or investment decision "
            "must still rely on verified business metrics, real cashflow, and professional advice."
        )
        ranh_gioi = (
            "Cultural decision-pacing reference derived from BaZi, Numerology, and traditional almanac rules; not financial, "
            "legal, or accounting advice. Birth dates are used only for this calculation and are never stored."
        )

    return {
        "nam_xem": nam_xem,
        "muc_tieu": {"ma": muc_tieu, "ten": mt_ten, "mo_ta": mt_mo_ta},
        "ho_so_nguoi_xem": {
            "nhat_chu_hanh": hs["nhat_chu_hanh"] if vi else _HANH_EN.get(hs["nhat_chu_hanh"], hs["nhat_chu_hanh"]),
            "hanh_can_bu": [h if vi else _HANH_EN.get(h, h) for h in hs["hanh_can_bu"]],
            "duong_doi": hs["duong_doi"],
            "nam_ca_nhan": hs["nam_ca_nhan"],
        },
        "tong_quan_nam": {
            "thang_day_manh": thang_day_manh,
            "thang_phong_thu": thang_phong_thu,
            "nhan_dinh_nam": nhan_dinh_nam,
            "canh_bao_chung": canh_bao_chung,
        },
        "muoi_hai_thang": ds_thang,
        "ranh_gioi_phap_ly": ranh_gioi,
    }
