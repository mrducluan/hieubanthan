# -*- coding: utf-8 -*-
"""Kiểm tra Mặt Bằng & Khai Trương cho Chủ DN / Cửa hàng — ghép mỏng Huyền Không + Mệnh Quái + Hoàng Lịch.

100% tất định, tái sử dụng huyen_khong.trach_ban/luu_nien, phongthuy.menh_quai/bang_huong và hoang_lich.chon_ngay.
Không lưu dữ liệu (khong_luu_du_lieu=True), luận 2 chiều (thuận lợi + nên chú ý), song ngữ VI/EN.
"""
from __future__ import annotations

import datetime as dt

from app import ngon_ngu
from app.calc import huyen_khong as hk
from app.calc import phongthuy as pt
from app.luangiai import hoang_lich as hl

_PHUONG_EN: dict[str, str] = {
    "Bắc": "North", "Đông Bắc": "Northeast", "Đông": "East", "Đông Nam": "Southeast",
    "Nam": "South", "Tây Nam": "Southwest", "Tây": "West", "Tây Bắc": "Northwest",
    "Trung tâm": "Center",
}

_SAO_VUONG = {9, 1, 8}
_SAO_TINH = {5, 2}
_DU_NIEN_TOT = {"Sinh Khí", "Thiên Y", "Diên Niên", "Phục Vị"}

_LOAI_HINH: dict[str, tuple[str, str]] = {
    "van_phong": ("Văn phòng / Công ty", "Office / Company"),
    "cua_hang": ("Cửa hàng / Bán lẻ", "Retail Shop"),
    "quan_ca_phe": ("Quán cà phê / F&B", "Cafe / F&B"),
    "xuong_kho": ("Xưởng sản xuất / Kho", "Workshop / Warehouse"),
}


def _chon_cung_tot(cungs: list[dict], ln_map: dict[str, int], key_sao: str, uu_tien_sao: tuple[int, ...], huong_tot: set[str] | None = None) -> dict:
    """Chọn cung tốt nhất (trừ Trung cung) dựa trên sao hướng/sơn và né sao lưu niên 5/2."""
    ngoai = [c for c in cungs if c["phuong"] != "Trung tâm"]

    def _diem(c: dict) -> tuple[int, int, int]:
        s = c[key_sao]
        ln = ln_map.get(c["cung"], 0)
        vuong = 2 if s in uu_tien_sao else (1 if s in _SAO_VUONG else 0)
        ne_hung = 0 if ln in _SAO_TINH else 1
        hop_menh = 1 if (huong_tot and c["phuong"] in huong_tot) else 0
        return (vuong, ne_hung, hop_menh)

    return max(ngoai, key=_diem)


def kiem_tra_mat_bang(
    do_huong: float,
    nam_xay: int,
    ngay_sinh: int,
    thang_sinh: int,
    nam_sinh: int,
    gioi_tinh: str = "nam",
    loai_hinh: str = "van_phong",
    ngay_bat_dau: dt.date | None = None,
) -> dict:
    """Tổng hợp checklist bố trí mặt bằng (Huyền Không + Mệnh Quái) & 5 ngày Khai Trương thuận lợi trong 60 ngày tới."""
    vi = ngon_ngu.la_viet()
    tu = ngay_bat_dau or dt.date.today()
    den = tu + dt.timedelta(days=60)
    nam_xem = tu.year

    toa_info = hk.son_tu_do((do_huong + 180.0) % 360.0)
    huong_info = hk.son_tu_do(do_huong % 360.0)
    tb = hk.trach_ban(nam_xay, toa_info["son"])
    ln = hk.luu_nien(nam_xem)
    ln_map: dict[str, int] = ln["cung"]

    mq = pt.menh_quai(nam_sinh, gioi_tinh)
    bh = pt.bang_huong(mq["quai"])
    huong_tot_menh = {h for h, dn in bh.items() if dn in _DU_NIEN_TOT}

    cungs: list[dict] = tb["cung"]
    cung_thu_ngan = _chon_cung_tot(cungs, ln_map, "huong", (9, 1, 8), huong_tot_menh)
    cung_giam_doc = _chon_cung_tot(cungs, ln_map, "son", (9, 1, 8), huong_tot_menh)
    cung_hop = _chon_cung_tot(cungs, ln_map, "huong", (4, 1, 9))
    cung_tinh = [c for c in cungs if c["phuong"] != "Trung tâm" and ln_map.get(c["cung"]) in _SAO_TINH]
    phuong_cua = pt.huong_tu_do(do_huong % 360.0)
    cung_cua = next((c for c in cungs if c["phuong"] == phuong_cua), cungs[1])
    dn_cua = bh.get(phuong_cua, "")

    def _p(phuong: str) -> str:
        return phuong if vi else _PHUONG_EN.get(phuong, phuong)

    lh_vi, lh_en = _LOAI_HINH.get(loai_hinh, _LOAI_HINH["van_phong"])
    cung_tinh_str = ", ".join(_p(c["phuong"]) for c in cung_tinh) or _p("Trung tâm")

    if vi:
        khu_vuc = [
            {
                "ma": "thu_ngan",
                "ten": "Quầy thu ngân / Khu chốt đơn",
                "phuong_goi_y": cung_thu_ngan["phuong"],
                "can_cu": f"Hướng tinh {cung_thu_ngan['huong']} (Vận {tb['van']}), Lưu niên {nam_xem} sao {ln_map.get(cung_thu_ngan['cung'])}",
                "thuan_loi": f"Đặt quầy thu ngân hoặc bàn giao dịch ở khu {cung_thu_ngan['phuong']} giúp giữ dòng sinh khí chủ động, sáng sủa và dễ đón khách.",
                "nen_chu_y": "Giữ lối đi trước quầy thông thoáng, lưng quầy có điểm tựa chắc chắn; tránh đặt ngay dưới xà ngang hoặc đối diện trực tiếp cửa nhà vệ sinh.",
            },
            {
                "ma": "giam_doc",
                "ten": "Bàn Giám đốc / Chủ cơ sở",
                "phuong_goi_y": cung_giam_doc["phuong"],
                "can_cu": f"Sơn tinh {cung_giam_doc['son']}, Mệnh quái {mq['quai']} ({mq['nhom']})",
                "thuan_loi": f"Khu {cung_giam_doc['phuong']} có Sơn tinh ổn định, phù hợp làm nơi ra quyết định, giữ sự tập trung và điều hành đội ngũ.",
                "nen_chu_y": "Ưu tiên ngồi lưng tựa tường vững, tầm nhìn bao quát được cửa ra vào nhưng không ngồi thẳng trục đâm từ cửa chính.",
            },
            {
                "ma": "cua_chinh",
                "ten": "Cửa chính / Khu đón tiếp",
                "phuong_goi_y": phuong_cua,
                "can_cu": f"Hướng {round(do_huong % 360, 1)}° ({huong_info['son']}), Bát Trạch: {dn_cua}, Lưu niên sao {ln_map.get(cung_cua['cung'])}",
                "thuan_loi": f"Mặt tiền hướng {phuong_cua} là cửa nạp khí chính của {lh_vi.lower()}: giữ bảng hiệu sáng, sạch và ánh sáng tự nhiên đều.",
                "nen_chu_y": (
                    f"Năm {nam_xem} sao lưu niên {ln_map.get(cung_cua['cung'])} đến cửa chính — "
                    + ("nên giữ khu vực cửa gọn gàng, tránh đục phá ồn ào và thêm thảm/cây xanh dịu mắt."
                       if ln_map.get(cung_cua["cung"]) in _SAO_TINH
                       else "tránh bày đồ chắn lối ra vào làm cản tầm nhìn của khách từ ngoài phố.")
                ),
            },
            {
                "ma": "phong_hop",
                "ten": "Phòng họp / Bàn tiếp đối tác",
                "phuong_goi_y": cung_hop["phuong"],
                "can_cu": f"Hướng tinh {cung_hop['huong']}, Lưu niên sao {ln_map.get(cung_hop['cung'])}",
                "thuan_loi": f"Khu {cung_hop['phuong']} thuận cho trao đổi, thương lượng và lên kế hoạch nhóm.",
                "nen_chu_y": "Bảo đảm ánh sáng trung tính, thông gió tốt và bố trí ghế cân đối để giảm cảm giác đối đầu khi đàm phán.",
            },
            {
                "ma": "khu_tinh",
                "ten": "Kho hàng / Khu vực nên giữ tĩnh năm " + str(nam_xem),
                "phuong_goi_y": cung_tinh_str,
                "can_cu": f"Lưu niên {nam_xem} có sao Ngũ Hoàng (5) & Nhị Hắc (2) đóng tại {cung_tinh_str}",
                "thuan_loi": f"Phù hợp bố trí kho gọn gàng, tủ hồ sơ hoặc khu ít di chuyển tại {cung_tinh_str} để tiết kiệm không gian đẹp cho khu tiếp khách.",
                "nen_chu_y": "Hạn chế sửa chữa lớn, khoan đục hoặc để đồ ẩm mốc, lộn xộn tại hai phương này trong năm nay.",
            },
        ]
    else:
        khu_vuc = [
            {
                "ma": "thu_ngan",
                "ten": "Cashier / Sales Counter",
                "phuong_goi_y": _p(cung_thu_ngan["phuong"]),
                "can_cu": f"Facing star {cung_thu_ngan['huong']} (Period {tb['van']}), Annual {nam_xem} star {ln_map.get(cung_thu_ngan['cung'])}",
                "thuan_loi": f"Placing the cashier or client checkout in the {_p(cung_thu_ngan['phuong'])} zone supports active flow and clear visibility.",
                "nen_chu_y": "Keep the front path unobstructed with solid backing behind the counter; avoid sitting directly under heavy beams.",
            },
            {
                "ma": "giam_doc",
                "ten": "Executive / Owner Desk",
                "phuong_goi_y": _p(cung_giam_doc["phuong"]),
                "can_cu": f"Mountain star {cung_giam_doc['son']}, Life Gua {mq['so']}",
                "thuan_loi": f"The {_p(cung_giam_doc['phuong'])} sector offers steadier backing for strategic focus and team leadership.",
                "nen_chu_y": "Keep a solid wall behind the chair with a clear view of the entrance, without aligning straight into the door axis.",
            },
            {
                "ma": "cua_chinh",
                "ten": "Main Entrance / Reception",
                "phuong_goi_y": _p(phuong_cua),
                "can_cu": f"Facing {round(do_huong % 360, 1)} deg, Annual star {ln_map.get(cung_cua['cung'])}",
                "thuan_loi": f"The {_p(phuong_cua)} facade is the primary arrival point for your {lh_en.lower()}: keep signage bright and entry inviting.",
                "nen_chu_y": (
                    f"Annual star {ln_map.get(cung_cua['cung'])} visits the entrance in {nam_xem} — "
                    + ("keep the doorway uncluttered and avoid noisy renovation works here."
                       if ln_map.get(cung_cua["cung"]) in _SAO_TINH
                       else "avoid display racks that block sightlines from outside.")
                ),
            },
            {
                "ma": "phong_hop",
                "ten": "Meeting Room / Partner Table",
                "phuong_goi_y": _p(cung_hop["phuong"]),
                "can_cu": f"Facing star {cung_hop['huong']}, Annual star {ln_map.get(cung_hop['cung'])}",
                "thuan_loi": f"The {_p(cung_hop['phuong'])} zone supports clear discussion, alignment, and partnership talks.",
                "nen_chu_y": "Maintain balanced seating, comfortable lighting, and fresh airflow to keep negotiations constructive.",
            },
            {
                "ma": "khu_tinh",
                "ten": f"Storage / Quiet Zones ({nam_xem})",
                "phuong_goi_y": cung_tinh_str,
                "can_cu": f"Annual stars 5 and 2 occupy {cung_tinh_str} in {nam_xem}",
                "thuan_loi": f"Use {cung_tinh_str} for tidy storage or archives so prime zones stay open for clients and staff.",
                "nen_chu_y": "Avoid heavy drilling, noisy construction, or clutter accumulation in these sectors this year.",
            },
        ]

    # Top 5 ngày khai trương thuận lợi trong 60 ngày tới (ưu tiên sạch nhan_tap_quan)
    hl_kq = hl.chon_ngay("khai_truong", tu, den, nam_sinh, thang_sinh, ngay_sinh)
    ds_ngay = sorted(
        hl_kq.get("ngay") or [],
        key=lambda x: (len(x.get("nhan_tap_quan") or []), not bool(x.get("dep")), not bool(x.get("hoang_dao"))),
    )
    ngay_khai_truong = [
        {
            "ngay": item["ngay"],
            "am": item.get("am", ""),
            "can_chi": item.get("can_chi", ""),
            "truc": item.get("truc", ""),
            "dep": bool(item.get("dep")),
            "hoang_dao": bool(item.get("hoang_dao")),
            "luu_y_ngay": list(item.get("nhan_tap_quan") or []),
        }
        for item in ds_ngay[:5]
    ]

    if vi:
        tong_quan = (
            f"Mặt bằng {lh_vi.lower()} xây năm {nam_xay} (Vận {tb['van']}), tọa {toa_info['son']} hướng {huong_info['son']} "
            f"({round(do_huong % 360, 1)}° · {phuong_cua}), cục thế {tb['cuc_ten']}. "
            f"Ưu tiên đặt quầy thu ngân ở {cung_thu_ngan['phuong']}, bàn điều hành ở {cung_giam_doc['phuong']} và giữ yên tĩnh tại {cung_tinh_str}."
        )
        ranh_gioi = (
            "Gợi ý bố trí mặt bằng và chọn ngày khai trương theo Huyền Không Phi Tinh, Bát Trạch và Hoàng Lịch cổ điển; "
            "chỉ mang tính tham khảo sắp xếp không gian, không thay thế tiêu chuẩn thiết kế kiến trúc, PCCC hay tư vấn pháp lý. "
            "Dữ liệu không lưu trên máy chủ."
        )
    else:
        tong_quan = (
            f"Period {tb['van']} {lh_en.lower()} built in {nam_xay}, facing {round(do_huong % 360, 1)} deg ({_p(phuong_cua)}). "
            f"Prioritize cashier/sales flow in {_p(cung_thu_ngan['phuong'])}, executive desk in {_p(cung_giam_doc['phuong'])}, and keep {cung_tinh_str} quiet in {nam_xem}."
        )
        ranh_gioi = (
            "Layout and opening-date reference compiled from Flying Star Xuan Kong, Eight Mansions, and traditional almanac rules; "
            "for workspace arrangement reference only, not architectural, fire-safety, or legal advice. No data is stored."
        )

    canh_bao_ma = huong_info.get("canh_bao") or toa_info.get("canh_bao")
    if canh_bao_ma:
        canh_bao_kiem_huong = (
            f"Góc {round(do_huong % 360.0, 1)}° nằm sát ranh giới giữa hai sơn (Kiêm hướng / Không Vong). "
            "Nên đứng cách cửa sắt, khung kim loại 1–2 m và đo lại la bàn 2–3 lần để lấy góc chính xác nhất trước khi chốt bố trí cố định."
            if vi
            else f"Heading {round(do_huong % 360.0, 1)} deg sits close to a 24-Mountain boundary (void line). "
            "Step 1–2 m away from metal doors or frames and re-measure 2–3 times before locking fixed layout placements."
        )
    else:
        canh_bao_kiem_huong = None

    return {
        "loai_hinh": {"ma": loai_hinh, "ten": lh_vi if vi else lh_en},
        "mat_bang": {
            "do_huong": round(do_huong % 360.0, 1),
            "phuong_huong": _p(phuong_cua),
            "son_toa": toa_info["son"],
            "son_huong": huong_info["son"],
            "canh_bao_kiem_huong": canh_bao_kiem_huong,
            "nam_xay": nam_xay,
            "van": tb["van"],
            "cuc_ma": tb["cuc"],
            "cuc_ten": tb["cuc_ten"] if vi else tb["cuc"].replace("_", " ").title(),
            "menh_quai": mq["quai"] if vi else f"Gua {mq['so']}",
            "nhom_menh": mq["nhom"] if vi else ("East Group" if mq["nhom"] == "Đông tứ mệnh" else "West Group"),
        },
        "tong_quan": tong_quan,
        "danh_sach_khu_vuc": khu_vuc,
        "ngay_khai_truong": ngay_khai_truong,
        "ranh_gioi_phap_ly": ranh_gioi,
    }
