# -*- coding: utf-8 -*-
"""Chính sách bất biến của tầng CALC.

Mọi hằng trong file này là QUYẾT ĐỊNH CỦA CON NGƯỜI, không phải giá trị mặc
định hợp lý do máy chọn. Chúng thay đổi kết quả của mọi lá số sinh ra sau đó,
và thay đổi một cách âm thầm — không có thông báo lỗi tự nhiên nào.

Quy tắc: đổi bất kỳ hằng nào ở đây thì phải tăng ENGINE_VERSION và chạy lại
toàn bộ golden dataset. Nếu golden đổi mà không có chủ ý, tức là vừa làm hỏng
mọi bản luận đã giao trước đó.
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import date
from enum import Enum

# Tăng khi bất kỳ hằng chính sách hoặc hàm tính nào thay đổi.
# Ghi vào mọi bản ghi readings để tái lập được kết quả cũ.
# 0.1.6 (EN-6, 2026-11-01): BI-1 đồng hồ miền Nam UTC+8 01/04/1947–01/07/1955 · BI-2 giờ Tý muộn Tử vi = ngày sau giờ Tý ·
# BI-3 Bát tự sinh ở nước ngoài so mốc tiết theo múi giờ nơi sinh (khi khai).
# 0.1.7 (TV-DT, 2026-11-04): đồng hạn Tử vi (tuổi mụ < số cục) báo khoảng đại hạn 1 … cục − 1 + cờ `dong_han`
# (trước lấy khoảng của chính cung đồng hạn, vd bé 2 tuổi ra "86–95"); cung, can, tứ hoá không đổi.
# 0.1.8 (Q5, 2026-11-12): bảng hỷ / kỵ cách cục Bát tự (dụng thần cách 2) sửa theo nguyên văn Tử Bình Chân Thuyên — Thất Sát,
# Chính Ấn, Thiên Ấn; đổi mức chương / đại vận ở khoảng 3 % lá số. Tứ trụ không đổi.
ENGINE_VERSION = "0.1.9"


# ---------------------------------------------------------------------------
# 1. RANH GIỚI GIỜ TÝ — CHƯA CHỐT
# ---------------------------------------------------------------------------
class TyBoundary(str, Enum):
    """Hai trường phái về việc ngày can chi đổi lúc mấy giờ.

    Chỉ ảnh hưởng người sinh trong khoảng 23:00–23:59, nhưng với nhóm đó thì
    nó đổi TRỤ NGÀY — tức đổi nền tảng của toàn bộ lá số, không phải chi tiết nhỏ.
    """

    # Ngày can chi đổi lúc 23:00. Người sinh 23:00–23:59 tính sang ngày HÔM SAU
    # (phân biệt tảo Tý / vãn Tý). Phổ biến trong Tử Bình.
    SWITCH_AT_2300 = "switch_at_2300"

    # Ngày can chi đổi lúc 00:00. Người sinh 23:00–23:59 vẫn thuộc ngày HÔM ĐÓ,
    # giờ là Tý. Phổ biến trong nhiều sách Tử Vi Việt Nam.
    SWITCH_AT_0000 = "switch_at_0000"


# ĐÃ CHỐT bởi người vận hành (phiên 2026-08-15): ngày can chi đổi lúc 00:00 —
# người sinh 23:00–23:59 vẫn thuộc ngày hôm đó, giờ Tý. Nhất quán với hướng
# trường phái Nguyễn Phát Lộc mà tầng RULES sẽ dùng.
# Đổi giá trị này = đổi trụ ngày của mọi người sinh 23:00–23:59 → phải tăng
# ENGINE_VERSION và chạy lại toàn bộ golden.
TY_BOUNDARY_POLICY: TyBoundary | None = TyBoundary.SWITCH_AT_0000


def require_ty_boundary() -> TyBoundary:
    """Fail-fast. Engine từ chối phục vụ khi chính sách chưa được chốt."""
    if TY_BOUNDARY_POLICY is None:
        raise RuntimeError(
            "TY_BOUNDARY_POLICY chua duoc chot trong engine/app/config.py.\n"
            "Chon TyBoundary.SWITCH_AT_2300 hoac TyBoundary.SWITCH_AT_0000.\n"
            "Day la quyet dinh cua nguoi van hanh, khong phai gia tri mac dinh."
        )
    return TY_BOUNDARY_POLICY


# ---------------------------------------------------------------------------
# 2. KINH TUYẾN LỊCH — cố định
# ---------------------------------------------------------------------------
# Thuật toán Hồ Ngọc Đức nhận timeZone làm tham số; bản thân nó không quy định
# múi giờ nào. Lịch âm Việt Nam tính theo kinh tuyến 105° đông = UTC+7.
# Hằng này KHÁC với múi giờ đồng hồ lúc sinh ở mục 3 bên dưới. Lẫn hai thứ này
# là lỗi phổ biến nhất khi lập lá số cho người sinh trước 1975.
CALENDAR_MERIDIAN_TZ = 7.0

# TP-LICH (chủ dự án yêu cầu 2026-10-08): người dùng chọn âm lịch Việt Nam (mặc định) hoặc Trung Quốc ở mọi mảng.
# Hai lịch cùng thuật toán, khác kinh tuyến tính sóc/trung khí: Việt Nam UTC+7, Trung Quốc UTC+8.
TZ_LICH_AM = {"viet": CALENDAR_MERIDIAN_TZ, "trung": 8.0}


# ---------------------------------------------------------------------------
# 3. MÚI GIỜ ĐỒNG HỒ THEO LỊCH SỬ
# ---------------------------------------------------------------------------
@dataclass(frozen=True)
class TzPeriod:
    start: date          # áp dụng từ ngày này (bao gồm)
    offset: float        # lệch so với UTC, đơn vị giờ
    note: str
    disputed: bool = False
    start_gio: int = 0   # giờ đồng hồ bắt đầu trong ngày `start` (tzdata: 1955-07-01 01:00)


class Region(str, Enum):
    """Vùng theo NƠI SINH, không theo hộ khẩu hiện tại."""
    NORTH = "north"      # từ vĩ tuyến 17 trở ra
    SOUTH = "south"      # từ vĩ tuyến 17 trở vào
    ABROAD = "abroad"    # sinh ở nước ngoài — người dùng tự khai offset


# Giai đoạn dùng chung cho cả nước trước khi chia cắt.
_SHARED: tuple[TzPeriod, ...] = (
    TzPeriod(date(1911, 5, 1), 7.0, "Toan Dong Duong ve UTC+7"),
    TzPeriod(date(1942, 12, 31), 8.0, "Nhat chiem dong, doi UTC+8"),
    TzPeriod(date(1945, 3, 14), 9.0, "UTC+9"),
    TzPeriod(date(1945, 9, 2), 7.0, "Ve UTC+7"),
)

TZ_TABLE: dict[Region, tuple[TzPeriod, ...]] = {
    Region.SOUTH: _SHARED + (
        # EN-6 BI-1 (2026-11-01): tzdata IANA Asia/Ho_Chi_Minh — Nam Bộ chạy UTC+8 từ 01/04/1947 tới 01/07/1955.
        # Chỉ GIỜ ĐỒNG HỒ; lịch âm miền Nam vẫn UTC+7 trong đoạn này (xem tz_lich_am).
        TzPeriod(date(1947, 4, 1), 8.0, "Nam Bo doi UTC+8 (tzdata Asia/Ho_Chi_Minh)"),
        TzPeriod(date(1955, 7, 1), 7.0, "Ve UTC+7 luc 01:00 dong ho", start_gio=1),
        TzPeriod(date(1960, 1, 1), 8.0,
                 "VNCH doi UTC+8, hieu luc tu 23:00 ngay 31/12/1959"),
        TzPeriod(date(1975, 6, 13), 7.0,
                 "Thong nhat mui gio ve UTC+7"),
    ),
    Region.NORTH: _SHARED + (
        # Ngày chuyển tranh cãi (08/08/1967 vs 01/01/1968) — nhưng bản thân
        # offset sau 01/01/1968 thì mọi nguồn thống nhất. Vùng tranh cãi được
        # đánh dấu bằng DISPUTED_NORTH_WINDOW bên dưới, không gắn vào period.
        TzPeriod(date(1967, 8, 8), 7.0, "VNDCCH ve UTC+7"),
    ),
}


# ⚠️ HAI ĐIỂM NGUỒN MÂU THUẪN — cần người vận hành chốt trước khi phục vụ
#    người sinh ở miền Bắc trong các khoảng dưới đây:
#
#  (a) Ngày miền Bắc chuyển về UTC+7: nguồn ghi 08/08/1967, nguồn khác ghi
#      01/01/1968. Chênh 5 tháng. Ảnh hưởng mọi lá số sinh trong khoảng đó.
#      Đây chính là gốc của việc Tết 1968 lệch ngày giữa hai miền.
#
#  (b) Miền Bắc giai đoạn 1954–1967 thực sự ở UTC+7 hay UTC+8: các nguồn phổ
#      thông mâu thuẫn trực tiếp. Bảng trên đang giả định UTC+7 liên tục từ
#      02/09/1945 (tức không có mốc UTC+8 riêng cho miền Bắc).
#
# Trong khi chưa chốt, engine trả cờ cảnh báo `tz_disputed` cho các ca này
# thay vì im lặng đưa ra một con số.
DISPUTED_NORTH_WINDOW = (date(1954, 7, 21), date(1968, 1, 1))


def clock_offset(d: date, region: Region, gio: int | None = None) -> tuple[float, bool]:
    """Múi giờ đồng hồ tại nơi sinh vào ngày sinh.

    Trả về (offset, disputed). `disputed=True` nghĩa là kết quả nằm trong vùng
    các nguồn không thống nhất — phải hiển thị cảnh báo, không được giấu.
    """
    if region is Region.ABROAD:
        raise ValueError("Region.ABROAD: nguoi dung phai tu khai offset dong ho")

    periods = TZ_TABLE[region]
    chosen = periods[0]
    for p in periods:
        if d > p.start or (d == p.start and (gio is None or gio >= p.start_gio)):
            chosen = p
        else:
            break

    disputed = chosen.disputed
    if region is Region.NORTH and DISPUTED_NORTH_WINDOW[0] <= d < DISPUTED_NORTH_WINDOW[1]:
        disputed = True
    return chosen.offset, disputed


# Kinh tuyến LỊCH ÂM đang lưu hành tại nơi sinh — tách khỏi giờ đồng hồ (EN-6 BI-1): miền Nam chỉ dùng lịch âm tính
# theo UTC+8 từ 01/01/1960 tới 13/06/1975 (quyết định đã chốt, Tết Mậu Thân Nam 30/01/1968); đoạn đồng hồ UTC+8
# 1947–1955 KHÔNG đổi lịch âm.
LICH_AM_MIEN_NAM_UTC8 = (date(1960, 1, 1), date(1975, 6, 13))


def tz_lich_am(d: date, region: "Region | None") -> float:
    if region is Region.SOUTH and LICH_AM_MIEN_NAM_UTC8[0] <= d < LICH_AM_MIEN_NAM_UTC8[1]:
        return 8.0
    return CALENDAR_MERIDIAN_TZ


# Sinh ở NƯỚC NGOÀI (chủ dự án chốt 2026-09-30): lập lá số theo GIỜ ĐỊA PHƯƠNG
# nơi sinh — giữ nguyên ngày giờ đồng hồ, KHÔNG quy đổi về kinh tuyến 105°Đ;
# đang giờ mùa hè (DST) thì trừ 1 giờ để về giờ chuẩn địa phương.
# Đổi chính sách này = đổi lá số mọi người sinh ở nước ngoài → tăng ENGINE_VERSION.
ABROAD_LOCAL_TIME = True

# Giờ mặt trời thực theo kinh độ nơi sinh (chủ dự án chốt 2026-09-30): KHÔNG
# hiệu chỉnh lá số, chỉ cảnh báo khi giờ mặt trời rơi sang canh giờ khác.
SOLAR_TIME_ADJUST = False


# ---------------------------------------------------------------------------
# 4. CỜ ĐỘ CHÍNH XÁC GIỜ SINH
# ---------------------------------------------------------------------------
class HourConfidence(str, Enum):
    EXACT = "exact"            # có giấy tờ ghi giờ
    APPROX = "approx"          # nhớ áng chừng
    UNKNOWN = "unknown"        # không biết


# Sinh trong các khoảng này thì lá số nhạy với sai số vài phút → luôn gắn cờ.
TY_EDGE_WINDOW = (23, 1)       # 23:00–00:59


def hom_nay_vn() -> date:
    """Ngày hiện tại theo giờ Việt Nam (UTC+7). EN-1: máy chủ chạy UTC — `date.today()` lệch một ngày từ 0 giờ tới
    7 giờ sáng giờ VN (ngày/năm cá nhân, quẻ, nhịp sai một ngày). Mọi ngày mặc định của engine dùng hàm này."""
    from datetime import datetime, timedelta, timezone  # noqa: PLC0415
    return datetime.now(timezone(timedelta(hours=7))).date()


# BT-UI — muối bí mật cho "lá Tarot riêng của ngày" (calc.tarot.la_ngay khi có ngày sinh). Công thức băm là công khai, nên
# không có muối thì ai biết lá + ngày xem có thể quét ra ngày sinh (2–3 lá là đủ). Có muối (env LA_NGAY_MUOI ≥ 16 ký tự,
# đặt trên máy chủ engine) → lá riêng mới được phép lên thẻ chia sẻ (`ba_la.chia_se_tarot`). Không đặt → lá vẫn chạy như
# cũ nhưng chỉ hiện cho chính người xem. Đổi muối = mọi người đổi lá của ngày (không ảnh hưởng phép tính nào khác).
def doc_muoi_la_ngay() -> str | None:
    import os  # noqa: PLC0415
    m = (os.environ.get("LA_NGAY_MUOI") or "").strip()
    return m if len(m) >= 16 else None


LA_NGAY_MUOI: str | None = doc_muoi_la_ngay()
