# -*- coding: utf-8 -*-
"""BT-ĐS — RULES "Luận giải Bát tự đời sống" (`docs/LUAN-GIAI-DOI-SONG.md` mục 6). Tất định, không LLM, không DB.

Cùng khung `doi_song_1` với Tử vi (LG-ĐS): đọc tứ trụ ĐÃ TÍNH (`calc.battu`, `calc.battu_mo_rong` — một bộ tính, ở đây
không tính lại can chi, ngũ hành, thân vượng nhược, dụng thần, cách cục, đại vận) → CHẤM từng mảng đời → chọn câu đời
thường từ KB `battu_doi_song_kb` → 12 chương có hộp nổi bật (`hop`), thân bài (`doan`), "Vì sao nói vậy" (`can_cu`, thuật
ngữ chỉ ở đây). Mã kiểm chứng `ds.bt.<chương>.<…>` (đi qua ràng buộc 0017: loại `doi_song`, mã `^ds\\.`).

1. Nhóm thập thần theo ngũ hành (`battu_mo_rong.vai_tro_hanh`): Tỷ Kiếp (cùng hành nhật chủ), Ấn (sinh ta), Thực Thương
   (ta sinh), Tài (ta khắc), Quan Sát (khắc ta). Tỉ lệ nhóm = điểm hành của nhóm / tổng điểm ngũ hành (THANG_DIEM).
   Độ đậm: ≥ 30% `dam` · ≥ 12% `vua` · > 0 `mong` · 0 `vang`. "Có mặt rõ" = dam hoặc vua.
2. Hợp sức (`fit`, chấm RIÊNG cho từng cách dưới đây — QC 2026-10-21, trước chỉ theo cách 1): +1 khi hành của nhóm
   thuộc hành cần thêm theo cách ấy VÀ nhóm có mặt rõ; −1 khi hành ấy thuộc hành nên bớt theo cách ấy VÀ nhóm đậm.
3. Hai cách (dụng thần, KHÔNG tự chọn — `chon` luôn None):
   - Cách 1 — cân sức (phù ức + điều hậu, Trích Thiên Tuỷ): hành cần thêm = `dung_than.phu_uc` + `dieu_hau`; hành nên
     bớt = các hành còn lại khi thân vượng/nhược (trung hoà: không có).
   - Cách 2 — theo tháng sinh (cách cục Tử Bình Chân Thuyên): hỷ/kỵ theo NHÓM của cách (KB `cach.<ma>.hy/ky`, có bản
     riêng khi thân nhược / vượng), đổi ra hành.
4. Mức mảng (mặc định điểm ≥ 2 `thuan` · ≤ −1 `can_chu_dong` — nhãn "Cần lưu ý"; ngưỡng riêng `NGUONG_MANG` ghi cạnh
   từng mảng; điểm không trả cho người dùng). Mảng có phần phụ thuộc dụng thần (tổng quan, ngũ hành, công việc, tiền,
   tình cảm, gia đình) chấm mức theo TỪNG cách (`muc_cach_1`, `muc_cach_2`) rồi gộp bằng `gop_muc_mang` (chỉ giữ mức
   mạnh khi hai cách cùng thấy, khác nhau → Cân bằng); khác nhau → nói rõ trong thân bài + "Vì sao". VH-1 (2026-10-21)
   cân lại để mỗi nhãn chiếm 10–60% trên 300 lá (bảng ở docs mục 8):
   - su_nghiep: Quan Sát rõ +1 (+ hợp sức; Ấn hoặc Tài đỡ +1; Thực Thương đậm gặp Quan −1; Quan Sát đậm mà thân nhược
     −1); không Quan mà Thực Thương rõ 0 (sống bằng tay nghề); không cả hai −1.
   - tien_bac: Tài rõ +1 (+ hợp sức; Thực Thương rõ sinh Tài +1); không Tài: −1 (0 nếu Thực Thương rõ); Tỷ Kiếp đậm −1.
   - tinh_cam (ngưỡng 1 / −1): sao phối ngẫu (nam Tài, nữ Quan Sát) rõ +1 + hợp sức, vắng −1; nữ lộ cả Chính Quan lẫn
     Thất Sát −1; nam Tỷ Kiếp đậm −1; chi ngày bị xung/hình/hại −1, được hợp +1.
   - gia_dinh (ngưỡng 2 / 0): Ấn rõ +1 + hợp sức; Tài đậm phá Ấn −1; trụ năm–tháng xung/hình/hại −1, hợp +1; trụ
     ngày–giờ (con cái) xung/hình/hại −1.
   - hoc_tap (ngưỡng 3 / 1): Ấn rõ +1, Thực Thương rõ +1; Ấn đậm lấn Thực Thương −1; cả hai mỏng −1; Văn Xương / Thái
     Cực / Hoa Cái +1 — hai nhóm "vừa" có ở đa số lá nên Thuận lợi cần thêm một dấu hiệu, chỉ một dấu hiệu là Cần lưu ý.
   - quan_he (ngưỡng 1 / −1): thân yếu có bạn ngang hàng đỡ +1; thân mạnh mà Tỷ Kiếp đậm −1; Quan Sát đậm đè thân yếu
     −1; Thiên Ất Quý Nhân +1; Vong Thần −1; Kiếp Sát −1.
   - tong_quan (ngưỡng 2 / 0): trung hoà +1, thân rất lệch (tỉ lệ trợ lực < 0,30 hoặc > 0,70) −1; hành cần thêm (của
     từng cách) có mặt rõ +1, vắng hẳn −1; ≥ 3 sao cát và ≤ 1 sao hung +1; ≥ 3 sao hung −1.
   - ngu_hanh (ngưỡng 2 / 0): phần chung theo độ lệch — một hành ≥ 45% −1, vắng hẳn một hành −1, đủ năm hành và hành
     lớn nhất < 35% +1; cách 1 = phù ức (không cần bù +1) + điều hậu (không cần bù 0), mỗi phần hành cần bù có mặt rõ
     +1, vắng hẳn −1; cách 2 = hỷ (như phù ức) + kỵ (hành nên bớt đậm −1, đều mỏng +1).
   - suc_khoe (theo độ lệch ngũ hành): thiếu ≥ 2 hành hoặc một hành ≥ 45% → `can_chu_dong`; không thiếu và hành lớn
     nhất < 35% → `thuan`; còn lại `can_bang`.
   - Lời khuyên và Vận hạn không mang mức (chương tổng hợp / dòng 10 năm).
5. Đại vận / lưu niên / lưu nguyệt: điểm theo từng cách = can (1) + chi (2, hành bản khí) — hành cần thêm cộng, hành nên
   bớt trừ; ≥ 1 `thuan`, ≤ −1 `can_chu_dong`. Gộp hai cách: cùng mức → mức đó; ngược nhau → `can_bang` và NÓI RÕ "hai
   cách đọc khác nhau"; một cách cân bằng → theo cách còn lại (vẫn nói rõ). Cùng luật cho dòng 10 năm và 12 tháng tới
   của chương Vận hạn (VH-1, chú thích ở `dong_muoi_nam`).

Tự học (ranh giới LG-ĐS mục 3): `trong_so` chỉ gắn tỉ lệ / hạ hộp ít người thấy đúng, `ca_nhan` xếp cuối hộp người này
bấm "chưa đúng". Không sinh câu mới, không sửa KB.
"""
from __future__ import annotations

import collections
import datetime as dt

from app import config
from app.calc import battu as bt_calc
from app.calc import lunar as lunar_calc
from app.calc import battu_mo_rong as mr_calc
from app.calc import tietkhi as tk
from app.calc.battu import CAN_NH, CHI_NH, THANG_DIEM
from app.calc.lunar import CAN, CHI
from app.kb import battu_doi_song_kb as kb
from app.kb import battu_kb
from app.luangiai import doi_song_chung as dsc
from app.luangiai import doi_song_khuon as kh
from app.luangiai.doi_song_chung import (  # noqa: F401 — dùng chung với Tử vi (LG-ĐS)
    MA_MAU_RE, TOI_DA_HOP, _ap_hoc, _cac_cau, _cau_dau, _hoa_dau, _ma, _sach, _sap, _tieu_de, slug, trong_so_xem_lai)

PHIEN_BAN = "doi_song_1"
TIEN_TO = ("ds", "bt")
NHOM = ("Tỷ Kiếp", "Ấn", "Thực Thương", "Tài", "Quan Sát")
THU_TU_HANH = ("Mộc", "Hỏa", "Thổ", "Kim", "Thủy")
NGUONG_DAM, NGUONG_VUA = 0.30, 0.12
NGUONG_THUAN, NGUONG_CHU_DONG = 2, -1
# VH-1 (2026-10-21): ngưỡng riêng từng mảng (thuận ≥ a, cần lưu ý ≤ b) để mỗi nhãn có nghĩa — đo 300 lá, bảng ở
# docs/LUAN-GIAI-DOI-SONG.md mục 8. Mảng không có ở đây dùng (NGUONG_THUAN, NGUONG_CHU_DONG).
NGUONG_MANG = {"hoc_tap": (3, 1), "quan_he": (1, -1), "tinh_cam": (1, -1), "gia_dinh": (2, 0), "tong_quan": (2, 0),
               "ngu_hanh": (2, 0)}
THAN_LECH_DUOI, THAN_LECH_TREN = 0.30, 0.70     # sức tự thân "rất lệch" (tỉ lệ trợ lực)
HANH_LECH = 0.45                                 # một hành chiếm ≥ 45% điểm ngũ hành = lệch mạnh
HE_SO_CAN, HE_SO_CHI = 1, 2
TUOI_NHO, TUOI_LON = 16, 45     # < 16: chương người lớn nói "xu hướng khi lớn lên"; ≥ 45: con cái đã lớn
THAN_MA = {"vượng": "manh", "nhược": "yeu", "trung hoà": "can_bang"}
TT_NHOM = {"Tỷ Kiên": "Tỷ Kiếp", "Kiếp Tài": "Tỷ Kiếp", "Thực Thần": "Thực Thương", "Thương Quan": "Thực Thương",
           "Thiên Tài": "Tài", "Chính Tài": "Tài", "Thất Sát": "Quan Sát", "Chính Quan": "Quan Sát",
           "Thiên Ấn": "Ấn", "Chính Ấn": "Ấn"}
_XUNG = {"lục xung"}
_HINH = {"tương hình", "tự hình", "lục hại"}
_HOP = {"lục hợp", "bán hợp", "tam hợp"}

# (ma, tiêu đề, câu hỏi chuẩn — giữ cho tương thích SAO-2 / diễn đạt)
CHUONG = [
    ("tong_quan", "Con người bạn", "Rốt cuộc tôi là người thế nào?"),
    ("ngu_hanh", "Năng lượng của bạn: thừa gì, thiếu gì", "Tôi thừa gì, thiếu gì và nên bù thế nào?"),
    ("cuoc_doi", "Các giai đoạn cuộc đời", "Đời tôi đi qua những giai đoạn mười năm nào?"),
    ("su_nghiep", "Công việc & sự nghiệp", "Tôi hợp làm việc thế nào?"),
    ("tien_bac", "Tiền bạc", "Tôi kiếm và giữ tiền ra sao?"),
    ("tinh_cam", "Tình yêu & hôn nhân", "Tôi yêu và sống chung thế nào?"),
    ("gia_dinh", "Gia đình: cha mẹ, anh em, con cái", "Tôi và người nhà hợp nhau ra sao?"),
    ("hoc_tap", "Cách bạn học và nghĩ", "Tôi học và suy nghĩ theo kiểu nào?"),
    ("suc_khoe", "Sức khoẻ & năng lượng", "Tôi nên giữ sức thế nào?"),
    ("quan_he", "Bạn bè, đồng nghiệp, người bên ngoài", "Tôi làm việc với người khác thế nào?"),
    ("nam_nay", "Năm nay & tháng tới", "Năm nay và mấy tháng tới của tôi thế nào?"),
    ("van_han", "Mười năm tới & điều nên tránh (vận hạn)", "Mười năm tới năm nào nên đi chậm, và chậm ở chuyện gì?"),
    ("loi_khuyen", "Lời khuyên dành cho bạn", "Tôi nên làm gì từ đây?"),
]
CHUONG_COT_LOI = ("tong_quan", "su_nghiep", "tien_bac", "tinh_cam", "gia_dinh", "hoc_tap", "quan_he")
CHUONG_UU_TIEN = ("tong_quan", "su_nghiep", "tien_bac", "tinh_cam")
TEN_MANG = {"tong_quan": "con người bạn", "ngu_hanh": "năng lượng", "su_nghiep": "công việc", "tien_bac": "tiền bạc",
            "tinh_cam": "tình cảm", "gia_dinh": "gia đình", "hoc_tap": "học hành", "suc_khoe": "sức khoẻ",
            "quan_he": "quan hệ bên ngoài"}
_TOM_MAC_DINH = {"thuan": "Mảng này có nhiều điều đỡ cho bạn.", "can_bang": "Mảng này có điểm tựa, cũng có chỗ cần để ý.",
                 "can_chu_dong": "Mảng này cần bạn sắp xếp sớm hơn người khác."}
_THAN_SAT_CHUONG = {
    "tong_quan": ("Thiên Đức", "Nguyệt Đức"),
    "tien_bac": ("Lộc Thần", "Kim Dư"),
    "tinh_cam": ("Đào Hoa", "Hồng Diễm"),
    "hoc_tap": ("Văn Xương", "Thái Cực Quý Nhân", "Hoa Cái"),
    "quan_he": ("Thiên Ất Quý Nhân", "Tướng Tinh", "Dịch Mã", "Vong Thần", "Kiếp Sát", "Khôi Cương", "Dương Nhận"),
}
_THAN_SAT_LUU_Y = {"Vong Thần", "Kiếp Sát", "Khôi Cương", "Dương Nhận", "Cô Thần", "Quả Tú"}
_SK_MAC_DINH = "Nên giữ giờ ngủ, ăn uống đều, vận động nhẹ mỗi ngày và khám sức khoẻ định kỳ."
_VAN_XUNG = "Giai đoạn này hay có thay đổi về chỗ ở hoặc chuyện đôi lứa."


# ------------------------------------------------------------------ tiện ích
def _mm(chuong: str, *phan: str) -> str:
    return _ma(*TIEN_TO, chuong, *phan)


def _thuong_dau(s: str) -> str:
    """Chữ thường ở đầu (sau dấu hai chấm)."""
    return s[:1].lower() + s[1:] if s else s


def _pct(x: float) -> str:
    return f"{round(x * 100)}%"


def _muc(diem: float, thuan: float = NGUONG_THUAN, chu_dong: float = NGUONG_CHU_DONG) -> str:
    return "thuan" if diem >= thuan else "can_chu_dong" if diem <= chu_dong else "can_bang"


def _muc_do(r: float) -> str:
    return "dam" if r >= NGUONG_DAM else "vua" if r >= NGUONG_VUA else "mong" if r > 0 else "vang"


def _hop(loai: str, tieu_de: str, noi_dung: str, can_cu: list[str], ma_mau: str, trong: float,
         huong: str | None = None, **them) -> dict:
    h = {"loai": loai, "tieu_de": tieu_de[:60], "noi_dung": noi_dung.strip(), "can_cu": [c for c in can_cu if c],
         "ma_mau": ma_mau, "_w": trong}
    if loai == "luu_y":
        h["huong_xu_ly"] = huong or "Nên làm chậm lại, chuẩn bị sớm và hỏi thêm người có kinh nghiệm."
        if h["huong_xu_ly"] not in h["noi_dung"]:
            h["noi_dung"] = f"{h['noi_dung']} {h['huong_xu_ly']}"
    h.update(them)
    return h


def _hop_kb(chuong: str, o: dict, ma: str, can_cu: list[str], trong: float, mac_dinh: str) -> dict:
    """Hộp từ một mục KB {loai, tieu_de?, y, loi_khuyen}. Điểm mạnh / lời khuyên: lời khuyên nối sau ý; lưu ý: thành
    hướng xử lý. Tiêu đề: của KB, thiếu thì cắt từ câu đầu."""
    loai = o.get("loai") or "diem_manh"
    y, lk = o.get("y") or "", o.get("loi_khuyen") or ""
    duoi = {"diem_manh": "manh", "luu_y": "vap", "loi_khuyen": "khuyen"}[loai]
    tieu = o.get("tieu_de") or _tieu_de(y, mac_dinh)
    if loai == "luu_y":
        return _hop(loai, tieu, y, can_cu, _mm(chuong, ma, duoi), trong, huong=lk or None)
    return _hop(loai, tieu, f"{y} {lk}".strip(), can_cu, _mm(chuong, ma, duoi), trong, loi_khuyen=lk or None)


def _la_so(sinh: dict) -> dict:
    """Tứ trụ đã tính (CALC) + giới tính (chỉ để chọn sao phối ngẫu / con cái, không tính lại gì)."""
    return {**bt_calc.la_so(sinh["lich"], sinh["gioi_tinh"], sinh.get("gio_ty", "da_ty")), "_gioi_tinh": sinh["gioi_tinh"]}


# ------------------------------------------------------------------ phân tích (đọc số đã tính, không tính lại)
def phan_tich(ls: dict) -> dict:
    mr = mr_calc.mo_rong(ls)
    nhom_hanh = {g: h for h, g in mr["vai_tro_hanh"].items()}
    diem = ls["ngu_hanh"]["diem"]
    tong = sum(diem.values()) or 1.0
    ty_le_hanh = {h: diem[h] / tong for h in THU_TU_HANH}
    ty_le = {g: ty_le_hanh[nhom_hanh[g]] for g in NHOM}
    muc_do = {g: _muc_do(ty_le[g]) for g in NHOM}
    than = THAN_MA[ls["than"]["ket_luan"]]
    dt_ = ls["dung_than"]
    phu, dieu = list(dt_["phu_uc"]["hanh"]), list(dt_["dieu_hau"]["hanh"])
    hy1 = list(dict.fromkeys(phu + dieu))
    ky1 = [h for h in THU_TU_HANH if phu and h not in hy1]
    cc = dt_["cach_cuc"]
    k = kb.cach(cc["ma"]) or {}
    rieng = k.get("than_nhuoc") if than == "yeu" else k.get("than_vuong") if than == "manh" else None
    g_hy = (rieng or k).get("hy") or []
    g_ky = (rieng or k).get("ky") or []
    hy2 = [nhom_hanh[g] for g in g_hy if g in nhom_hanh]
    ky2 = [nhom_hanh[g] for g in g_ky if g in nhom_hanh and nhom_hanh[g] not in hy2]
    lo = collections.Counter(ls["thap_than_can"][i] for i in (0, 1, 3))
    dem = collections.Counter([ls["thap_than_can"][i] for i in (0, 1, 3)] + [x[0] for x in ls["thap_than_chi"]])
    ts = {t["ten"]: t for t in mr["than_sat"]}
    return {"ls": ls, "mr": mr, "nhom_hanh": nhom_hanh, "diem": diem, "ty_le_hanh": ty_le_hanh, "ty_le": ty_le,
            "muc_do": muc_do, "than": than, "phu": phu, "dieu": dieu,
            "cach_1": {"hanh": hy1, "ky": ky1}, "cach_2": {"ma": cc["ma"], "ten": cc["ten"], "hanh": hy2, "ky": ky2,
                                                          "nhom_hy": list(g_hy), "nhom_ky": list(g_ky)},
            "lo": lo, "dem": dem, "than_sat": ts, "gioi_tinh": ls.get("_gioi_tinh", "nam")}


def _co(pt: dict, g: str) -> bool:
    return pt["muc_do"][g] in ("dam", "vua")


CACH = ("cach_1", "cach_2")
TEN_CACH_DOC = {"cach_1": "cách cân sức", "cach_2": "theo tháng sinh"}
_TEN_CACH_CU = {"cach_1": "Theo cách cân sức (dụng thần phù ức + điều hậu)",
                "cach_2": "Theo tháng sinh (hỷ / kỵ của cách cục)"}


def _fit(pt: dict, g: str, cach: str = "cach_1") -> int:
    """Hợp sức của nhóm `g` theo MỘT cách lấy dụng thần (`cach_1` cân sức / `cach_2` theo tháng sinh)."""
    h = pt["nhom_hanh"][g]
    if h in pt[cach]["hanh"] and _co(pt, g):
        return 1
    if h in pt[cach]["ky"] and pt["muc_do"][g] == "dam":
        return -1
    return 0


def gop_muc(m1: str, m2: str) -> str:
    """Gộp mức của hai cách — một luật cho mảng đời và đại vận / lưu niên / lưu nguyệt: cùng mức → giữ; ngược nhau
    (thuận ↔ cần lưu ý) → cân bằng; một cách cân bằng → theo cách còn lại. Không chọn thay người dùng: nơi gọi luôn
    NÓI RÕ khi hai cách khác nhau."""
    s = _SO_MUC[m1] + _SO_MUC[m2]
    return "thuan" if s > 0 else "can_chu_dong" if s < 0 else "can_bang"


def gop_muc_mang(m1: str, m2: str) -> str:
    """Gộp mức hai cách cho MẢNG ĐỜI (chặt hơn `gop_muc` của đại vận): chỉ giữ Thuận lợi / Cần lưu ý khi cả hai
    cách cùng thấy; khác nhau → Cân bằng và thân bài nói rõ từng cách. Lý do: nhãn mạnh mà phần lớn lá số đều nhận thì
    không còn nói gì riêng về người xem (đo 300 lá: luật cũ cho 57–73% "Thuận lợi" ở vài mảng)."""
    return m1 if m1 == m2 else "can_bang"


def _cu_nhom(pt: dict, g: str) -> str:
    return f"{g} (hành {pt['nhom_hanh'][g]}) chiếm {_pct(pt['ty_le'][g])} điểm ngũ hành"


def _quan_he(pt: dict, a: int, b: int) -> set[str]:
    """Loại quan hệ (xung / hinh / hop) giữa hai trụ a, b (chỉ số 0–3)."""
    ra = set()
    for q in pt["mr"]["quan_he"]:
        if a in q["tru"] and b in q["tru"]:
            ra |= {"xung"} if q["loai"] in _XUNG else {"hinh"} if q["loai"] in _HINH else \
                {"hop"} if q["loai"] in _HOP else set()
    return ra


def _qh_ngay(pt: dict) -> tuple[set[str], list[str]]:
    loai, mo = set(), []
    for q in pt["mr"]["quan_he"]:
        if 2 in q["tru"] and not q["loai"].startswith("can "):
            x = "xung" if q["loai"] in _XUNG else "hinh" if q["loai"] in _HINH else "hop" if q["loai"] in _HOP else None
            if x:
                loai.add(x)
                mo.append(q["mo_ta"])
    return loai, mo


# ------------------------------------------------------------------ chấm mảng
class _Mang:
    """Bộ gom điểm + căn cứ + tình huống (mã KB, căn cứ riêng của tình huống) cho một mảng.

    `diem` = phần chung cho cả hai cách; `rieng` = phần theo từng cách lấy dụng thần (hợp sức, hành cần thêm…). Mảng có
    phần riêng (`hai_cach`) → chấm mức theo TỪNG cách rồi gộp bằng `gop_muc` (không ngầm theo cách 1)."""

    def __init__(self, pt: dict | None = None) -> None:
        self.diem, self.can_cu, self.tinh_huong = 0, [], []
        self.pt, self.rieng, self.ly = pt, {c: 0 for c in CACH}, {c: [] for c in CACH}

    def cong(self, n: int, cu: str | None = None) -> None:
        self.diem += n
        if cu:
            self.can_cu.append(cu)

    def cong_cach(self, cach: str, n: int, cu: str | None = None) -> None:
        self.rieng[cach] += n
        if cu:
            self.ly[cach].append(cu)

    def hop_suc(self, g: str) -> None:
        """Hợp sức của nhóm `g` theo từng cách (+1 hành cần thêm có mặt rõ, −1 hành nên bớt mà đậm)."""
        for c in CACH:
            f = _fit(self.pt, g, c)
            if f:
                h = self.pt["nhom_hanh"][g]
                self.cong_cach(c, f, f"{g} ({h}) {'là hành cần thêm' if f > 0 else 'là hành nên bớt mà đậm'} "
                                     f"{'+1' if f > 0 else '−1'}")

    def th(self, ma: str, cu: str | None = None) -> None:
        self.tinh_huong.append((ma, cu))
        if cu and cu not in self.can_cu:
            self.can_cu.append(cu)

    def ra(self, muc: str | None = None, hai_cach: bool = False, nguong: tuple = ()) -> dict:
        if not hai_cach:
            return {"diem": self.diem, "muc": muc or _muc(self.diem, *nguong), "can_cu": self.can_cu,
                    "tinh_huong": self.tinh_huong}
        m = {c: _muc(self.diem + self.rieng[c], *nguong) for c in CACH}
        gop = gop_muc_mang(m["cach_1"], m["cach_2"])
        cu = [f"{_TEN_CACH_CU[c]}: {kb.nhan_muc(m[c])}" + (f" — {'; '.join(self.ly[c])}" if self.ly[c] else "")
              for c in CACH]
        if m["cach_1"] != m["cach_2"]:
            cu.append(f"Hai cách cho mức khác nhau → mức chung {kb.nhan_muc(gop)} (chỉ giữ mức mạnh khi cả hai cách cùng thấy)")
        return {"diem": self.diem, "muc": gop, "muc_cach_1": m["cach_1"], "muc_cach_2": m["cach_2"],
                "can_cu": self.can_cu + cu, "tinh_huong": self.tinh_huong}


def cham_mang(pt: dict, tuoi: int | None = None) -> dict[str, dict]:
    """→ {mảng: {diem, muc, can_cu, tinh_huong: [(mã KB, căn cứ)]}} — luật ở docstring mô-đun."""
    lv, than, lo, ts = pt["muc_do"], pt["than"], pt["lo"], pt["than_sat"]
    co = lambda g: _co(pt, g)  # noqa: E731
    cn = lambda g: _cu_nhom(pt, g)  # noqa: E731
    g = pt["gioi_tinh"]
    kl = pt["ls"]["than"]["ket_luan"]
    ra: dict[str, dict] = {}

    # công việc
    m = _Mang(pt)
    if co("Quan Sát"):
        m.cong(1, cn("Quan Sát"))
        m.hop_suc("Quan Sát")
        if co("Ấn"):
            m.th("quan_an", "Quan gặp Ấn (quan ấn tương sinh)")
        if co("Tài"):
            m.th("tai_sinh_quan", "Tài sinh Quan")
        if co("Ấn") or co("Tài"):
            m.cong(1)
        if than != "yeu":
            m.th("quan_ro", f"Quan Sát có mặt rõ, thân {kl} gánh được")
        if lv["Quan Sát"] == "dam" and than == "yeu":
            m.cong(-1)
            m.th("quan_nang", "Quan Sát đậm mà thân nhược: áp lực lớn hơn sức gánh")
        if lv["Thực Thương"] == "dam":
            m.cong(-1)
            m.th("thuong_kien_quan", "Thực Thương đậm gặp Quan (thương quan kiến quan)")
    elif co("Thực Thương"):
        m.th("tu_lam", f"Quan Sát mỏng ({_pct(pt['ty_le']['Quan Sát'])}); {cn('Thực Thương')}: sống bằng tay nghề")
    else:
        m.cong(-1)
        m.th("thieu_khung", f"Quan Sát và Thực Thương đều mỏng ({_pct(pt['ty_le']['Quan Sát'])}, "
                            f"{_pct(pt['ty_le']['Thực Thương'])})")
    if lo["Thất Sát"]:
        m.th("sat_lo", "Thất Sát lộ ra thiên can")
    if lo["Chính Quan"]:
        m.th("chinh_quan_lo", "Chính Quan lộ ra thiên can")
    ra["su_nghiep"] = m.ra(hai_cach=True)

    # tiền bạc
    m = _Mang(pt)
    if co("Tài"):
        m.cong(1)
        m.hop_suc("Tài")
        if than != "yeu":
            m.th("tai_ganh_duoc", f"{cn('Tài')}; thân {kl} gánh được Tài")
        elif lv["Tài"] == "dam":
            m.th("tai_nang_than_yeu", f"{cn('Tài')}; Tài đậm mà thân nhược (tài đa thân nhược)")
        else:
            m.th("tai_vua", f"{cn('Tài')}; thân nhược, Tài vừa phải")
        if co("Thực Thương"):
            m.cong(1)
            m.th("thuc_sinh_tai", f"Thực Thương sinh Tài — {cn('Thực Thương')}")
    else:
        m.cong(0 if co("Thực Thương") else -1)
        m.th("tai_vang", f"Tài mỏng: {_pct(pt['ty_le']['Tài'])} điểm ngũ hành")
    if lv["Tỷ Kiếp"] == "dam":
        m.cong(-1)
        m.th("kiep_tai", f"{cn('Tỷ Kiếp')} (Tỷ Kiếp tranh Tài)")
    if lo["Chính Tài"]:
        m.th("chinh_tai_lo", "Chính Tài lộ ra thiên can")
    if lo["Thiên Tài"]:
        m.th("thien_tai_lo", "Thiên Tài lộ ra thiên can")
    ra["tien_bac"] = m.ra(hai_cach=True)

    # tình cảm
    m = _Mang(pt)
    sao = "Tài" if g == "nam" else "Quan Sát"
    cu_sao = f"Sao phối ngẫu ({'nam: Tài' if g == 'nam' else 'nữ: Quan Sát'}): {cn(sao)}"
    if co(sao):
        m.cong(1)
        m.hop_suc(sao)
        m.th(f"{g}.sao_nang" if lv[sao] == "dam" and than == "yeu" else f"{g}.sao_ro", cu_sao)
    else:
        m.cong(-1 if lv[sao] == "vang" else 0)
        m.th(f"{g}.sao_vang", cu_sao)
    if g == "nu" and lo["Chính Quan"] and lo["Thất Sát"]:
        m.cong(-1)
        m.th("nu.quan_sat_lan", "Chính Quan và Thất Sát cùng lộ (quan sát hỗn tạp)")
    if g == "nam" and lv["Tỷ Kiếp"] == "dam":
        m.cong(-1)
        m.th("nam.tranh", f"{cn('Tỷ Kiếp')}: tranh Tài")
    qh, mo = _qh_ngay(pt)
    cu_qh = ("Chi ngày (cung phối ngẫu): " + "; ".join(mo)) if mo else None
    if "xung" in qh:
        m.th("chi_ngay_xung", cu_qh)
    elif "hinh" in qh:
        m.th("chi_ngay_hinh", cu_qh)
    if qh & {"xung", "hinh"}:
        m.cong(-1)
    if "hop" in qh:
        m.cong(1)
        m.th("chi_ngay_hop", cu_qh)
    ra["tinh_cam"] = m.ra(hai_cach=True, nguong=NGUONG_MANG["tinh_cam"])

    # gia đình
    m = _Mang(pt)
    if co("Ấn"):
        m.cong(1)
        m.hop_suc("Ấn")
        m.th("an_nang" if lv["Ấn"] == "dam" else "an_ro", f"{cn('Ấn')} (mẹ, người che chở)")
        if lv["Tài"] == "dam":
            m.cong(-1)
            m.th("tai_pha_an", f"Tài đậm ({_pct(pt['ty_le']['Tài'])}) phá Ấn")
    else:
        m.th("an_vang", f"Ấn mỏng: {_pct(pt['ty_le']['Ấn'])} điểm ngũ hành (mẹ, người che chở)")
    nt = _quan_he(pt, 0, 1)
    if nt & {"xung", "hinh"}:
        m.cong(-1)
        m.th("nam_thang_xung", "Trụ năm – trụ tháng có xung / hình / hại (gốc gác, cha mẹ)")
    elif "hop" in nt:
        m.cong(1)
        m.th("nam_thang_hop", "Trụ năm – trụ tháng hợp nhau (gốc gác, cha mẹ)")
    if lv["Tỷ Kiếp"] == "dam":
        m.th("anh_em_tranh" if than == "manh" else "anh_em_do", f"{cn('Tỷ Kiếp')} (anh chị em)")
    elif lv["Tỷ Kiếp"] == "vang":
        m.th("anh_em_it", "Tỷ Kiếp vắng (anh chị em)")
    sao_con = "Quan Sát" if g == "nam" else "Thực Thương"
    if tuoi is None or tuoi >= TUOI_NHO:            # trẻ nhỏ: không nói chuyện con cái của chính em
        con = "con_ro" if co(sao_con) else "con_vang_lon" if (tuoi or 0) >= TUOI_LON else "con_vang"
        m.th(con, f"Sao con cái ({'nam: Quan Sát' if g == 'nam' else 'nữ: Thực Thương'}): {cn(sao_con)}")
    ng = _quan_he(pt, 2, 3)
    if ng & {"xung", "hinh"}:
        m.cong(-1)
        m.th("gio_ngay_xung", "Trụ ngày – trụ giờ có xung / hình / hại (trụ giờ: con cái)")
    elif "hop" in ng:
        m.th("gio_ngay_hop", "Trụ ngày – trụ giờ hợp nhau (trụ giờ: con cái)")
    ra["gia_dinh"] = m.ra(hai_cach=True, nguong=NGUONG_MANG["gia_dinh"])

    # học tập
    m = _Mang()
    if co("Ấn"):
        m.cong(1)
        m.th("an_hoc", f"{cn('Ấn')} (học sâu)")
    if co("Thực Thương"):
        m.cong(1)
        m.th("thuong_quan_hoc" if pt["dem"]["Thương Quan"] > pt["dem"]["Thực Thần"] else "thuc_than_hoc",
             f"{cn('Thực Thương')} (học bằng làm, bằng nói)")
    if lo["Thiên Ấn"]:
        m.th("thien_an_hoc", "Thiên Ấn lộ ra thiên can")
    if lv["Ấn"] == "dam" and co("Thực Thương"):
        m.cong(-1)
        m.th("kieu_doat_thuc", "Ấn đậm lấn Thực Thương (kiêu đoạt thực)")
    if not co("Ấn") and not co("Thực Thương"):
        m.cong(-1)
        m.th("hoc_mong", f"Ấn và Thực Thương đều mỏng ({_pct(pt['ty_le']['Ấn'])}, {_pct(pt['ty_le']['Thực Thương'])})")
    elif not co("Ấn") and lv["Thực Thương"] == "dam":
        m.th("nen_mong", f"Ấn mỏng, {cn('Thực Thương')}")
    if any(t in ts for t in _THAN_SAT_CHUONG["hoc_tap"]):
        m.cong(1, "Có Văn Xương / Thái Cực Quý Nhân / Hoa Cái")
    ra["hoc_tap"] = m.ra(nguong=NGUONG_MANG["hoc_tap"])     # Ấn + Thực Thương "vừa" có ở đa số lá → cần thêm một dấu hiệu

    # quan hệ bên ngoài
    m = _Mang()
    cu_tk = f"{cn('Tỷ Kiếp')} (người ngang hàng); thân {kl}"
    if lv["Tỷ Kiếp"] in ("vang", "mong"):
        m.th("ban_it", cu_tk)
    elif than == "yeu":
        m.cong(1)
        m.th("ban_do", cu_tk)
    elif than == "manh" and lv["Tỷ Kiếp"] == "dam":
        m.cong(-1)
        m.th("ban_tranh", cu_tk)
    else:
        m.th("ban_vua", cu_tk)
    if lv["Quan Sát"] == "dam" and than == "yeu":
        m.cong(-1)
        m.th("ap_luc_ngoai", "Quan Sát đậm đè thân nhược")
    m.cong(("Thiên Ất Quý Nhân" in ts) - ("Vong Thần" in ts) - ("Kiếp Sát" in ts))
    ra["quan_he"] = m.ra(nguong=NGUONG_MANG["quan_he"])

    # tổng quan
    m = _Mang(pt)
    ti = pt["ls"]["than"]["ti_le"]
    if than == "can_bang":
        m.cong(1, "Thân trung hoà")
    elif ti < THAN_LECH_DUOI or ti > THAN_LECH_TREN:
        m.cong(-1, f"Thân rất lệch: tỉ lệ trợ lực {ti:g} (ngoài {THAN_LECH_DUOI:g}–{THAN_LECH_TREN:g}) −1")
    for c in CACH:
        hy = pt[c]["hanh"]
        co_hy = [h for h in hy if pt["ty_le_hanh"][h] >= NGUONG_VUA]
        if co_hy:
            m.cong_cach(c, 1, f"hành cần thêm đã có mặt rõ: {', '.join(co_hy)} +1")
        elif hy and all(pt["ty_le_hanh"][h] == 0 for h in hy):
            m.cong_cach(c, -1, f"hành cần thêm vắng hẳn: {', '.join(hy)} −1")
    loai_ts = collections.Counter(t["loai"] for t in ts.values())
    # ≥ 3 sao cát và ít sao hung (≤ 1) +1; ≥ 3 sao hung −1 (sao cát có ở gần hết lá — đếm "≥ 2" không còn phân biệt)
    m.cong((loai_ts["cát"] >= 3 and loai_ts["hung"] <= 1) - (loai_ts["hung"] >= 3),
           f"Thần sát: {loai_ts['cát']} sao cát, {loai_ts['hung']} sao hung")
    ra["tong_quan"] = m.ra(hai_cach=True, nguong=NGUONG_MANG["tong_quan"])

    # ngũ hành — mỗi cách hai phần, cùng thang: cách 1 = phù ức + điều hậu; cách 2 = hỷ (hành cần dựa) + kỵ (hành nên
    # bớt không lấn)
    m = _Mang(pt)

    def _bu(ds_h: list[str], khong_can: int = 1) -> tuple[int, str]:
        if not ds_h:
            return khong_can, f"không cần bù rõ {'+1' if khong_can else '0'}"
        if any(pt["ty_le_hanh"][h] >= NGUONG_VUA for h in ds_h):
            return 1, f"hành cần thêm ({', '.join(ds_h)}) đã có mặt rõ +1"
        if all(pt["ty_le_hanh"][h] == 0 for h in ds_h):
            return -1, f"hành cần thêm ({', '.join(ds_h)}) vắng hẳn −1"
        return 0, f"hành cần thêm ({', '.join(ds_h)}) còn mỏng 0"

    lon_nh = max(pt["ty_le_hanh"].values())
    thieu_nh = [h for h in THU_TU_HANH if pt["diem"][h] == 0]
    if lon_nh >= HANH_LECH:
        m.cong(-1, f"Một hành chiếm {_pct(lon_nh)} điểm ngũ hành (≥ {_pct(HANH_LECH)}) −1")
    if thieu_nh:
        m.cong(-1, f"Vắng hẳn {', '.join(thieu_nh)} −1")
    elif lon_nh < 0.35:
        m.cong(1, f"Năm hành đều có mặt, hành lớn nhất {_pct(lon_nh)} (< 35%) +1")
    for ten, ds_h, kc in (("phù ức", pt["phu"], 1), ("điều hậu", pt["dieu"], 0)):
        n, cu = _bu(ds_h, kc)
        m.cong_cach("cach_1", n, f"{ten}: {cu}")
    n, cu = _bu(pt["cach_2"]["hanh"])
    m.cong_cach("cach_2", n, f"hỷ: {cu}")
    ky2 = pt["cach_2"]["ky"]
    if any(pt["ty_le_hanh"][h] >= NGUONG_DAM for h in ky2):
        m.cong_cach("cach_2", -1, f"kỵ: hành nên bớt ({', '.join(ky2)}) đang đậm −1")
    elif all(pt["ty_le_hanh"][h] < NGUONG_VUA for h in ky2):
        m.cong_cach("cach_2", 1, f"kỵ: hành nên bớt ({', '.join(ky2) or 'không có'}) không nổi +1")
    else:
        m.cong_cach("cach_2", 0, f"kỵ: hành nên bớt ({', '.join(ky2)}) vừa phải 0")
    ra["ngu_hanh"] = m.ra(hai_cach=True, nguong=NGUONG_MANG["ngu_hanh"])

    # sức khoẻ — theo độ lệch, không theo "tốt xấu"
    thieu = [h for h in THU_TU_HANH if pt["diem"][h] == 0]
    lon = max(pt["ty_le_hanh"].values())
    m = _Mang()
    m.cong(0, f"Hành thiếu hẳn: {', '.join(thieu) or 'không'}; hành lớn nhất chiếm {_pct(lon)} điểm ngũ hành")
    ra["suc_khoe"] = m.ra("can_chu_dong" if len(thieu) >= 2 or lon >= 0.45 else
                          "thuan" if not thieu and lon < 0.35 else "can_bang")
    return ra


# ------------------------------------------------------------------ đại vận, lưu niên, lưu nguyệt theo hai cách
_SO_MUC = {"thuan": 1, "can_bang": 0, "can_chu_dong": -1}


def _diem_tru(can: str, chi: str, hy: list[str], ky: list[str]) -> int:
    s = 0
    for h, w in ((CAN_NH[CAN.index(can)], HE_SO_CAN), (CHI_NH[CHI.index(chi)], HE_SO_CHI)):
        s += w if h in hy else -w if h in ky else 0
    return s


def muc_hai_cach(pt: dict, can: str, chi: str) -> tuple[str, str, str]:
    """→ (mức cách 1, mức cách 2, mức gộp)."""
    m1 = _muc(_diem_tru(can, chi, pt["cach_1"]["hanh"], pt["cach_1"]["ky"]), 1, -1)
    m2 = _muc(_diem_tru(can, chi, pt["cach_2"]["hanh"], pt["cach_2"]["ky"]), 1, -1)
    return m1, m2, gop_muc(m1, m2)


def muc_thang(pt: dict, can: str, chi: str) -> tuple[str, str, str]:
    """Mức tháng (lưu nguyệt — lớp ưu tiên thấp nhất): cùng ngưỡng ±1 như đại vận nhưng gộp CHẶT hai cách như mảng
    đời (chỉ Thuận lợi / Cần lưu ý khi cả hai cách cùng thấy). Gộp nới của đại vận làm 34% số tháng "Cần lưu ý", 21% cân
    bằng (nhiều lá 7–8 tháng cam / năm); gộp chặt: 26 · 58 · 16%, trung bình ~2 tháng cần lưu ý / năm (đo 100 lá ×
    12 tháng, 2026-10-21)."""
    m1 = _muc(_diem_tru(can, chi, pt["cach_1"]["hanh"], pt["cach_1"]["ky"]), 1, -1)
    m2 = _muc(_diem_tru(can, chi, pt["cach_2"]["hanh"], pt["cach_2"]["ky"]), 1, -1)
    return m1, m2, gop_muc_mang(m1, m2)


def _cau_hai_cach(m1: str, m2: str, cho: str = "giai đoạn này") -> str:
    """Câu NÓI RÕ khi hai cách đọc khác nhau (không chọn thay người dùng). `cho` gọi tên lớp thời gian."""
    if m1 == m2:
        return ""
    if {m1, m2} == {"thuan", "can_chu_dong"}:
        return f" Hai cách đọc cho kết quả ngược nhau ở {cho}: nên thử nhỏ trước khi làm lớn."
    khac = m1 if m2 == "can_bang" else m2
    return f" Hai cách đọc khác nhau ở {cho}: một cách thấy {kb.nhan_muc(khac).lower()}, cách kia thấy cân bằng."


def _van_kb(tt: str) -> dict:
    return kb.van(tt) or {"chu_de": tt.lower(), "nen_thuan": "Hợp để dồn sức cho việc chính.", "de_vap": "",
                          "nen_chu_dong": "Nên chuẩn bị sớm cho việc lớn."}


def thoi_gian_bieu(pt: dict, ngay_xem: dt.date) -> list[dict]:
    """Tám đại vận + mức hai cách. "Đang đi" theo NGÀY khởi vận thật (`tu_ngay`…`den_ngay`), không theo năm dương."""
    ls = pt["ls"]
    nc = ls["nhat_chu"]["can"]
    chi_ngay = ls["tru"][2]["chi"]
    ra = []
    for d in ls["dai_van"]["ds"]:
        tt = bt_calc.thap_than(nc, d["can"])
        k = _van_kb(tt)
        m1, m2, muc = muc_hai_cach(pt, d["can"], d["chi"])
        if muc == "thuan":
            mot = f"Giai đoạn thuận: {_thuong_dau(k['nen_thuan'])}"
        elif muc == "can_chu_dong":
            mot = f"Giai đoạn cần lưu ý: {_thuong_dau(k['de_vap'])} {k['nen_chu_dong']}".replace(":  ", ": ")
        else:
            mot = f"Giai đoạn cân bằng: {_thuong_dau(k['nen_thuan'])}"
        if bt_calc.quan_he_chi(d["chi"], chi_ngay) == "lục xung":
            mot += f" {_VAN_XUNG}"
        mot += _cau_hai_cach(m1, m2)
        ra.append({"tu_tuoi": d["tu_tuoi_thuc"], "den_tuoi": d["tu_tuoi_thuc"] + 9, "nam_tu": d["tu_nam"],
                   "nam_den": d["den_nam"], "cung": f"{d['can']} {d['chi']}", "nhan": f"vận {d['can']} {d['chi']}",
                   "thap_than": tt, "chu_de": k["chu_de"], "muc": muc, "muc_cach_1": m1, "muc_cach_2": m2,
                   "hai_cach_khac": m1 != m2, "mot_cau": mot.strip(), "de_vap": k["de_vap"],
                   "tu_ngay": d["tu_ngay"], "den_ngay": d["den_ngay"],
                   "hien_tai": d["tu_ngay"] <= ngay_xem.isoformat() <= d["den_ngay"]})
    return ra


def _nam_bat_tu(t_utc: dt.datetime) -> int:
    return t_utc.year if t_utc >= tk.thoi_diem(t_utc.year, 315) else t_utc.year - 1


def ba_thang_tiet(pt: dict, ngay_xem: dt.date, so: int = 3) -> list[dict]:
    """Tháng theo tiết đang đi + `so − 1` tháng sau (lưu nguyệt của `battu_mo_rong.luu_nien`, mốc ngày giao tiết giờ
    VN). Chương Năm nay dùng 3 tháng, chương Vận hạn dùng 12."""
    tz = dt.timedelta(hours=config.CALENDAR_MERIDIAN_TZ)
    t = dt.datetime(ngay_xem.year, ngay_xem.month, ngay_xem.day, 12) - tz
    (t0, g0), (t1, _) = tk.tiet_bao_quanh(t)
    ra = []
    for _ in range(so):
        k = ((g0 - 315) % 360) // 30
        ln = mr_calc.luu_nien(pt["ls"], _nam_bat_tu(t0 + dt.timedelta(seconds=1)))
        lng = ln["luu_nguyet"][k]
        ra.append({"can": lng["can"], "chi": lng["chi"], "thap_than": lng["thap_than"],
                   "tu": (t0 + tz).date(), "den": (t1 + tz).date() - dt.timedelta(days=1)})
        (t0, g0), (t1, _) = tk.tiet_bao_quanh(t1 + dt.timedelta(seconds=1))
    return ra


# ------------------------------------------------------------------ dựng chương
def _chuong(ma: str, muc: str, tom_tat: str, hop: list[dict], doan: list[str], can_cu: list[str],
            cau_tu_soi: str | None, **them) -> dict:
    t = next(x for x in CHUONG if x[0] == ma)
    cau_hop = {c for h in hop for c in _cac_cau(h["noi_dung"])}
    sach, da = [], set()
    for d in (x.strip() for x in doan if x and x.strip()):
        giu = [c for c in _cac_cau(d) if c not in cau_hop and c not in da]
        da.update(giu)
        if giu:
            sach.append(" ".join(giu))
    if not sach or not sach[0].startswith(tom_tat):
        sach.insert(0, tom_tat)
    return {"ma": ma, "tieu_de": t[1], "cau_hoi": t[2], "muc": muc, "nhan_muc": kb.nhan_muc(muc) if muc else None,
            "tom_tat": tom_tat, "hop": hop, "doan": sach[:4], "can_cu": list(dict.fromkeys(c for c in can_cu if c)),
            "cau_tu_soi": cau_tu_soi, **them}


def _thuong(s: str) -> str:
    s = s.rstrip("…. ")
    return s[:1].lower() + s[1:]


# Trục 1 (2026-10-26): bỏ "đoạn nối" liệt kê lại tiêu đề hộp + câu "mỗi điều có cách gỡ ngay trong hộp" — web đã hiện
# hộp ngay trên, đoạn ấy chỉ chép lại.


def _cau_muc_mang(x: dict) -> str:
    """Câu NÓI RÕ khi hai cách lấy dụng thần cho mức mảng khác nhau (thân bài, không thuật ngữ). Cùng mức → rỗng."""
    m1, m2 = x.get("muc_cach_1"), x.get("muc_cach_2")
    if not m1 or m1 == m2:
        return ""
    if {m1, m2} == {"thuan", "can_chu_dong"}:
        duoi = "hai cách ngược nhau nên phần dưới viết ở mức cân bằng — hãy đối chiếu với điều bạn thực sự trải qua."
    else:
        duoi = f"phần dưới viết theo mức chung là {kb.nhan_muc(x['muc']).lower()}."
    return (f"Hai cách đọc khác nhau ở mảng này: theo cách cân sức thì {kb.nhan_muc(m1).lower()}, theo tháng sinh "
            f"thì {kb.nhan_muc(m2).lower()}; {duoi}")


def _hai_cach_muc(x: dict) -> dict:
    return {"hai_cach_muc": {"cach_1": x["muc_cach_1"], "cach_2": x["muc_cach_2"]}} if "muc_cach_1" in x else {}


def _tom(ma: str, muc: str) -> str:
    return kb.tom_tat(ma, muc) or f"{_hoa_dau(TEN_MANG.get(ma, ma))}: {kb.nhan_muc(muc).lower()}. {_TOM_MAC_DINH[muc]}"


def _hop_muc(ma: str, muc: str, can_cu: list[str]) -> dict:
    t = TEN_MANG.get(ma, ma)
    if muc == "can_chu_dong":
        return _hop("luu_y", f"Chuyện {t} cần bạn chủ động", f"Chuyện {t} ít khi tự trôi chảy với bạn.", can_cu,
                    _mm(ma, "muc", muc, "vap"), 0.3, huong="Nên chuẩn bị sớm và hỏi thêm người có kinh nghiệm.")
    return _hop("diem_manh", f"Chuyện {t} có điểm tựa",
                f"Ở chuyện {t}, bạn có sẵn điểm tựa để dựa vào. Nên giữ nhịp đều và chuẩn bị sớm cho việc lớn.",
                can_cu, _mm(ma, "muc", muc, "manh"), 0.3)


def _hop_than_sat(ma: str, ten: str, pt: dict) -> dict | None:
    t = pt["than_sat"].get(ten)
    o = kb.than_sat(ten)
    if not t or not o or not o.get("y"):
        return None
    tru = ", ".join(mr_calc.TEN_TRU[i] for i in t["tru"])
    cu = [f"Thần sát {ten} ({t['loai']}) ở trụ {tru} — {t['y']}"]
    loai = "luu_y" if ten in _THAN_SAT_LUU_Y else "diem_manh"
    return _hop_kb(ma, {"loai": loai, **o}, f"ts.{slug(ten)}", cu, 0.8 if loai == "diem_manh" else 1.0,
                   "Một nét riêng của bạn")


def _chon(ma: str, cand: list[dict], hoc: tuple, da_dung: set[str], muc: str, can_cu_muc: list[str]) -> tuple:
    cand = [h for h in _sap(cand) if h["noi_dung"] not in da_dung]
    hop, xem_lai = _ap_hoc(cand, *hoc)
    if len(hop) < 2:
        fb = _hop_muc(ma, muc, can_cu_muc)
        if fb["ma_mau"] not in {h["ma_mau"] for h in hop} and not trong_so_xem_lai(fb, hoc):
            hop.append(fb)
    da_dung.update(h["noi_dung"] for h in hop)
    return hop, xem_lai


def _chuong_mang(ma: str, cm: dict, pt: dict, hoc: tuple, da_dung: set[str], them: list[dict] | None = None) -> dict:
    """Chương theo mảng đời: hộp từ tình huống KB + thần sát của mảng + `them`."""
    x = cm[ma]
    cand = list(them or [])
    for i, (th, cu) in enumerate(x["tinh_huong"]):
        o = kb.tinh_huong(ma, th)
        if not o or not o.get("y"):
            continue
        w = (2.0 if o["loai"] == "luu_y" else 1.8 if o["loai"] == "diem_manh" else 1.1) - 0.01 * i
        if th.endswith("_lo"):
            w = 1.2 - 0.01 * i
        cand.append(_hop_kb(ma, o, th.replace(".", "_"), [cu] if cu else [], w, f"Điều đáng biết về {TEN_MANG[ma]}"))
    for ten in _THAN_SAT_CHUONG.get(ma, ()):
        h = _hop_than_sat(ma, ten, pt)
        if h:
            cand.append(h)
    hop, xem_lai = _chon(ma, cand, hoc, da_dung, x["muc"], x["can_cu"])
    tom = _tom(ma, x["muc"])
    can_cu = [c for h in hop for c in h["can_cu"]] + x["can_cu"] + xem_lai
    nho = ("Với người còn nhỏ tuổi, chương này nói về xu hướng khi lớn lên, để cha mẹ hiểu con hơn."
           if ma in ("su_nghiep", "tien_bac", "tinh_cam") and pt.get("tuoi") is not None and pt["tuoi"] < TUOI_NHO else "")
    return _chuong(ma, x["muc"], tom, hop, [tom, _cau_muc_mang(x), nho], can_cu, kb.cau_tu_soi(ma),
                   **_hai_cach_muc(x))


# ---- chương 1: con người bạn
# Chủ đề của hộp "dễ vấp" ở chương Con người bạn (theo NỘI DUNG câu KB `noi_bat.<thập thần>.de_vap` và
# `cach.<mã>.de_vap`). Hai hộp cùng chủ đề nói cùng một chuyện — có khi trái nhau ("quá chặt với tiền" vs "tiền vào
# nhanh ra cũng nhanh") — nên chỉ giữ một. Thêm câu KB mới → thêm mã chủ đề ở đây (test QC 6 bắt).
CHU_DE_VAP = {
    "noi_bat": {"Tỷ Kiên": "mot_minh", "Kiếp Tài": "tien", "Thực Thần": "ngai_kho", "Thương Quan": "luat_le",
                "Thiên Tài": "tien", "Chính Tài": "tien", "Thất Sát": "nong_voi", "Chính Quan": "khuon_phep",
                "Thiên Ấn": "bo_do", "Chính Ấn": "dua_dam"},
    "cach": {"chinh_quan": "khuon_phep", "that_sat": "nong_voi", "chinh_tai": "tien", "thien_tai": "tien",
             "chinh_an": "dua_dam", "thien_an": "bo_do", "thuc_than": "ngai_kho", "thuong_quan": "luat_le",
             "kien_loc": "mot_minh", "duong_nhan": "nong_voi", "nguyet_kiep": "tien"},
}


def bo_vap_trung_chu_de(cand: list[dict]) -> list[dict]:
    """Mỗi chủ đề (`_cd`) chỉ giữ MỘT hộp "dễ vấp": hộp trọng số cao nhất — nét nổi nhất trên cả lá (đếm thiên can +
    bản khí, 1,5) thắng nét của tháng sinh (cách cục, 1,2), vì nó đếm trên nhiều trụ hơn. Hộp điểm mạnh không đụng."""
    giu: dict[str, dict] = {}
    for h in cand:
        if h["loai"] == "luu_y" and h.get("_cd") and (h["_cd"] not in giu or h["_w"] > giu[h["_cd"]]["_w"]):
            giu[h["_cd"]] = h
    return [h for h in cand if not (h["loai"] == "luu_y" and h.get("_cd")) or giu[h["_cd"]] is h]

def _chuong_tong_quan(pt: dict, cm: dict, hoc: tuple, da_dung: set[str]) -> dict:
    ls = pt["ls"]
    nc = ls["nhat_chu"]
    n = kb.nhat_chu(nc["can"]) or {}
    nn = n.get(pt["than"]) or {}
    cu_nc = (f"Nhật chủ {nc['can']} ({nc['am_duong']} {nc['ngu_hanh']}), thân {ls['than']['ket_luan']}: "
             f"tỉ lệ trợ lực {ls['than']['ti_le']:g} (thang điểm hệ thống)")
    cand = []
    if nn.get("manh"):
        cand.append(_hop("diem_manh", _tieu_de(nn["manh"], "Điểm mạnh của bạn"), nn["manh"], [cu_nc],
                         _mm("tong_quan", "nc", slug(nc["can"]), pt["than"], "manh"), 2.4,
                         loi_khuyen=nn.get("loi_khuyen")))
    if nn.get("de_vap"):
        cand.append(_hop("luu_y", _tieu_de(nn["de_vap"], "Điều bạn dễ vấp"), nn["de_vap"], [cu_nc],
                         _mm("tong_quan", "nc", slug(nc["can"]), pt["than"], "vap"), 2.0, huong=nn.get("loi_khuyen")))
    noi = pt["dem"].most_common(1)[0][0] if pt["dem"] else None
    o = kb.noi_bat(noi) if noi else None
    if o and o.get("y"):
        cu = f"Thập thần nổi nhất: {noi} ({pt['dem'][noi]} lần ở thiên can và bản khí)"
        cand.append(_hop("diem_manh", _tieu_de(o["y"], "Nét nổi bật của bạn"), o["y"], [cu],
                         _mm("tong_quan", "noi_bat", slug(noi), "manh"), 1.6, loi_khuyen=o.get("loi_khuyen")))
        if o.get("de_vap"):
            cand.append(_hop("luu_y", _tieu_de(o["de_vap"], "Điều nên để ý ở chính mình"), o["de_vap"], [cu],
                             _mm("tong_quan", "noi_bat", slug(noi), "vap"), 1.5, huong=o.get("loi_khuyen"),
                             _cd=CHU_DE_VAP["noi_bat"].get(noi)))
    cc = ls["dung_than"]["cach_cuc"]
    k = kb.cach(cc["ma"]) or {}
    cu_cach = (f"Cách cục Tử Bình Chân Thuyên: {cc['ten']} (can {cc['can']}"
               f"{', lộ ra thiên can' if cc['thau'] else ''}; tháng {cc['chi_thang']})")
    if k.get("y"):
        cand.append(_hop("diem_manh", f"Bạn là {k['ten']}" if k.get("ten") else _tieu_de(k["y"], "Nét của tháng sinh"),
                         k["y"], [cu_cach], _mm("tong_quan", "cach", cc["ma"], "manh"), 1.8))
    if k.get("de_vap"):
        cand.append(_hop("luu_y", _tieu_de(k["de_vap"], "Mặt trái của nét ấy"), k["de_vap"], [cu_cach],
                         _mm("tong_quan", "cach", cc["ma"], "vap"), 1.2, huong=k.get("loi_khuyen"),
                         _cd=CHU_DE_VAP["cach"].get(cc["ma"])))
    duc = next((t for t in _THAN_SAT_CHUONG["tong_quan"] if t in pt["than_sat"]), None)
    if duc:
        h = _hop_than_sat("tong_quan", duc, pt)
        if h:
            h["ma_mau"] = _mm("tong_quan", "ts", "duc", "manh")
            cand.append(h)
    x = cm["tong_quan"]
    hop, xem_lai = _chon("tong_quan", bo_vap_trung_chu_de(cand), hoc, da_dung, x["muc"], x["can_cu"])
    can_cu = [cu_nc, cu_cach, *[c for h in hop for c in h["can_cu"]], *x["can_cu"],
              *[c["chi_tiet"] for c in ls.get("co_canh_bao", []) if c["loai"] in ("da_ty", "gio_ty", "tiet_edge")],
              *xem_lai]
    soi = n.get("cau_tu_soi")
    td = THANG_DIEM
    than_do = {"ti_le": ls["than"]["ti_le"], "vuong_tu": td["vuong_tu"], "nhuoc_duoi": td["nhuoc_duoi"],
               "muc": pt["than"], "nhan": kb.nhan_than(pt["than"])}
    # Trục 1 (2026-10-26): "Con người bạn" không mang chip mức (như Lời khuyên, Vận hạn — VH-1): không câu "mức", không
    # "hai cách khác nhau ở mảng này"; câu thứ hai là lời tóm tắt trung tính của KB (bậc cân bằng). Mức vẫn chấm (cột lõi).
    tom = n.get("chan_dung") or kb.tom_tat("tong_quan", "can_bang") or _tom("tong_quan", "can_bang")
    return _chuong("tong_quan", None, tom, hop, [tom, kb.tom_tat("tong_quan", "can_bang") or ""],
                   can_cu, soi or "Bạn đang dùng điểm mạnh nào nhiều nhất, và điểm nào còn để quên?", than_do=than_do)


# ---- chương 2: năng lượng — thừa gì, thiếu gì, hai cách bù
def _goi_y_hanh(ds: list[str]) -> str:
    phan = []
    for i, h in enumerate(ds[:2]):
        k = kb.hanh(h)
        if not k.get("mau"):
            continue
        phan.append(f"{h}: màu {k['mau']}; hướng {k['huong']}; thói quen {k['thoi_quen']}.")
        if i == 0 and k.get("nghe"):
            phan.append(f"Nghề gần với {h}: {k['nghe']}.")
    return " ".join(phan)


def _chuong_ngu_hanh(pt: dict, cm: dict, hoc: tuple, da_dung: set[str]) -> dict:
    ls = pt["ls"]
    tl = pt["ty_le_hanh"]
    lon = max(THU_TU_HANH, key=lambda h: (tl[h], -THU_TU_HANH.index(h)))
    cand = []
    k = kb.hanh(lon)
    cu_diem = "Điểm ngũ hành (thang điểm hệ thống): " + " · ".join(f"{h} {pt['diem'][h]:g}" for h in THU_TU_HANH)
    if tl[lon] >= NGUONG_DAM and k.get("thua"):
        cand.append(_hop("luu_y", k.get("tieu_de_thua") or f"Phần đang dư: {lon}", k["thua"],
                         [f"{lon} chiếm {_pct(tl[lon])} điểm ngũ hành"], _mm("ngu_hanh", "thua", slug(lon), "vap"), 2.2,
                         huong=k.get("thua_loi_khuyen")))
    else:
        nd = f"Phần nổi nhất trong bạn là {lon}: {k['ten']}." if k.get("ten") else f"Phần nổi nhất trong bạn là {lon}."
        cand.append(_hop("diem_manh", f"Phần nổi nhất: {lon}", nd, [f"{lon} chiếm {_pct(tl[lon])} điểm ngũ hành"],
                         _mm("ngu_hanh", "noi", slug(lon), "manh"), 2.2))
    for i, h in enumerate([h for h in THU_TU_HANH if pt["diem"][h] == 0][:2]):
        kh = kb.hanh(h)
        y = kh.get("thieu") or f"Lá số của bạn vắng hẳn {h}."
        cand.append(_hop("luu_y", kh.get("tieu_de_thieu") or f"Phần đang thiếu: {h}", y, [f"{h}: 0 điểm"],
                         _mm("ngu_hanh", "thieu", slug(h), "vap"), 2.1 - 0.01 * i, huong=kh.get("thieu_loi_khuyen")))
    h1, h2 = pt["cach_1"]["hanh"], pt["cach_2"]["hanh"]
    dt_ = ls["dung_than"]
    cu1 = [f"Dụng thần phù ức (Trích Thiên Tuỷ, {dt_['phu_uc']['giai_thich']}): "
           f"{', '.join(dt_['phu_uc']['hanh']) or 'cân bằng, không cần phù hay ức rõ'}",
           f"Điều hậu ({dt_['dieu_hau']['giai_thich']}): {', '.join(dt_['dieu_hau']['hanh']) or 'không cần'}"]
    nhom_hy = ", ".join(f"{g} ({pt['nhom_hanh'][g]})" for g in pt["cach_2"]["nhom_hy"] if g in pt["nhom_hanh"])
    nhom_ky = ", ".join(f"{g} ({pt['nhom_hanh'][g]})" for g in pt["cach_2"]["nhom_ky"] if g in pt["nhom_hanh"])
    cu2 = [f"Cách cục Tử Bình Chân Thuyên: {pt['cach_2']['ten']} → hỷ {nhom_hy or 'chưa có trong kho'}"
           + (f"; kỵ {nhom_ky}" if nhom_ky else "")]
    ma_h = lambda ds: "+".join(slug(h) for h in ds) or "khong"  # noqa: E731
    if h1 and set(h1) == set(h2):
        cand.append(_hop("loi_khuyen", f"Hai cách cùng gợi ý: {', '.join(h1)}",
                         f"Cả hai cách đọc (cân sức mạnh và theo tháng sinh) cùng gợi ý thêm {', '.join(h1)}. "
                         + _goi_y_hanh(h1), cu1 + cu2, _mm("ngu_hanh", "hai_cach", ma_h(h1), "khuyen"), 2.0))
    else:
        mua = " và mùa sinh" if pt["dieu"] else ""
        nd1 = (f"Cách đọc thứ nhất cân sức mạnh của bạn{mua}: nên bù {', '.join(h1)}. " + _goi_y_hanh(h1) if h1 else
               "Cách đọc thứ nhất thấy sức của bạn đã khá cân, chưa cần bù hành nào rõ.")
        cand.append(_hop("loi_khuyen", f"Cách 1 — cân sức: {', '.join(h1) or 'đã khá cân'}", nd1, cu1,
                         _mm("ngu_hanh", "cach1", ma_h(h1), "khuyen"), 2.0))
        nd2 = (f"Cách đọc thứ hai dựa vào tháng sinh: nên dựa vào {', '.join(h2)}. "
               + _goi_y_hanh([h for h in h2 if h not in h1] or h2) if h2 else
               "Cách đọc thứ hai chưa có gợi ý riêng cho tháng sinh của bạn.")
        cand.append(_hop("loi_khuyen", f"Cách 2 — theo tháng sinh: {', '.join(h2) or 'chưa rõ'}", nd2, cu2,
                         _mm("ngu_hanh", "cach2", ma_h(h2), "khuyen"), 1.9))
    x = cm["ngu_hanh"]
    hop, xem_lai = _chon("ngu_hanh", cand, hoc, da_dung, x["muc"], [cu_diem])
    tom = _tom("ngu_hanh", x["muc"])
    khac = ("" if not h1 or set(h1) == set(h2) else
            " Hai cách ở đây gợi ý khác nhau — hãy thử từng cách trong vài tuần và giữ cách bạn thấy hợp.")
    doan = [tom, _cau_muc_mang(x),
            "Có hai cách đọc phần năng lượng cần thêm, đến từ hai trường phái; hệ thống không chọn thay bạn." + khac,
            battu_kb.luu_y("ung_dung") or "Màu, hướng, nghề theo ngũ hành là cách ứng dụng dân gian, dùng để tham khảo."]
    bd = {"hanh": [{"hanh": h, "diem": pt["diem"][h], "ty_le": round(tl[h], 3), "nhom": kb.nhom(g) or g,
                    "trang_thai": "thieu" if pt["diem"][h] == 0 else "thua" if tl[h] >= NGUONG_DAM else "vua",
                    "cach_1": h in h1, "cach_2": h in h2}
                   for h in THU_TU_HANH for g in [next(g for g in NHOM if pt["nhom_hanh"][g] == h)]],
          "nhat_chu": ls["nhat_chu"]["ngu_hanh"]}
    hai_cach = {"cach_1": {"ten": "Cân sức mạnh của bạn", "hanh": h1}, "cach_2": {"ten": "Theo tháng sinh", "hanh": h2,
                                                                                 "ma": pt["cach_2"]["ma"]},
                "chon": None}
    can_cu = [cu_diem, f"Thân {ls['than']['ket_luan']}: tỉ lệ trợ lực {ls['than']['ti_le']:g} — {THANG_DIEM['mo_ta']}",
              *cu1, *cu2, *x["can_cu"], "Hai cách lấy dụng thần trình bày song song, hệ thống không tự chọn.",
              *xem_lai]
    return _chuong("ngu_hanh", x["muc"], tom, hop, doan, can_cu, kb.cau_tu_soi("ngu_hanh"), bieu_do=bd,
                   hai_cach=hai_cach, **_hai_cach_muc(x))


# ---- chương 3: các giai đoạn cuộc đời
TRANG_THAI_VAN = ("dang_di", "chua_khoi", "da_qua_van_cuoi")
_VAN_TC_MAC_DINH = {
    "dang_di": {"cuoc_doi_tom": "Bạn đang ở giai đoạn {tu_tuoi}–{den_tuoi} tuổi, xoay quanh {chu_de}.",
                "cuoc_doi_dau": "Giai đoạn bạn đang đi", "cuoc_doi_sau": "Giai đoạn kế tiếp",
                "nam_nay_tieu_de": "Mười năm này: {chu_de}",
                "nam_nay_hop": "Mười năm này xoay quanh {chu_de}; năm nay là năm thứ {so_nam} của giai đoạn.",
                "nam_nay_muc": "Cả giai đoạn ở mức {muc} với bạn.", "nam_nay_tom": "Mười năm này xoay quanh {chu_de}"},
    "chua_khoi": {"cuoc_doi_tom": "Giai đoạn mười năm đầu tiên bắt đầu khoảng {tu_tuoi} tuổi, xoay quanh {chu_de}.",
                  "cuoc_doi_dau": "Giai đoạn mười năm đầu tiên", "cuoc_doi_sau": "Giai đoạn kế tiếp",
                  "nam_nay_tieu_de": "Mười năm đầu tiên, từ năm {nam_tu}",
                  "nam_nay_hop": "Giai đoạn mười năm đầu tiên bắt đầu năm {nam_tu}, xoay quanh {chu_de}.",
                  "nam_nay_muc": "Giai đoạn ấy ở mức {muc} với bạn.",
                  "nam_nay_tom": "Giai đoạn mười năm đầu tiên mở từ năm {nam_tu}, xoay quanh {chu_de}"},
    "da_qua_van_cuoi": {
        "cuoc_doi_tom": "Bạn đã đi qua cả {so_van} giai đoạn mười năm trên lá số; giai đoạn gần nhất "
                        "({tu_tuoi}–{den_tuoi} tuổi) xoay quanh {chu_de}.",
        "cuoc_doi_dau": "Giai đoạn mười năm gần nhất", "cuoc_doi_sau": "Giai đoạn trước đó",
        "nam_nay_tieu_de": "Sau {so_van} giai đoạn mười năm",
        "nam_nay_hop": "Bạn đã đi qua cả {so_van} giai đoạn mười năm trên lá số; giai đoạn gần nhất ({nam_tu}–{nam_den}) "
                       "xoay quanh {chu_de}.",
        "nam_nay_muc": "",
        "nam_nay_tom": "Bạn đã đi qua cả {so_van} giai đoạn mười năm trên lá số, nên nhịp bây giờ đọc theo từng năm"},
}


def _ngay_vn(iso: str) -> str:
    d = dt.date.fromisoformat(iso)
    return f"{d.day}/{d.month}/{d.year}"


def _thang_nam(iso: str) -> str:
    d = dt.date.fromisoformat(iso)
    return f"{d.month}/{d.year}"


def _khoang_ngay(g: dict) -> str:
    return f"từ {_ngay_vn(g['tu_ngay'])} đến {_ngay_vn(g['den_ngay'])}"


def _so_nam_tu(tu_ngay: str, ngay_xem: dt.date) -> int:
    """Năm thứ mấy của giai đoạn, đếm từ ngày bắt đầu vận (không theo năm dương)."""
    d = dt.date.fromisoformat(tu_ngay)
    return max(1, ngay_xem.year - d.year - ((ngay_xem.month, ngay_xem.day) < (d.month, d.day)) + 1)


def _sap_doi_van(tgb: list[dict], vt: dict, ngay_xem: dt.date) -> str:
    """Giai đoạn mới bắt đầu trong vòng 12 tháng tới → nói rõ ngày (người dùng hay thắc mắc "đổi vận khi nào")."""
    k = vt["chi_so"] + 1 if vt["trang_thai"] == "dang_di" else 0 if vt["trang_thai"] == "chua_khoi" else None
    if k is None or k >= len(tgb):
        return ""
    bd = dt.date.fromisoformat(tgb[k]["tu_ngay"])
    if not (ngay_xem < bd <= ngay_xem + dt.timedelta(days=366)):
        return ""
    return f"Từ ngày {_ngay_vn(tgb[k]['tu_ngay'])}, bạn sang giai đoạn mười năm mới, xoay quanh {tgb[k]['chu_de']}."


def van_tham_chieu(tgb: list[dict], ngay_xem: dt.date) -> dict:
    """Đại vận THAM CHIẾU lúc xem + trạng thái — MỘT hàm cho chương "Các giai đoạn" và "Năm nay" (hai chương không tự
    chọn riêng): đang đi (vận chứa năm xem) · chưa khởi vận (năm xem trước vận đầu: vận đầu) · đã qua vận cuối (năm xem
    sau vận cuối: vận cuối). "Đang đi" theo ngày khởi vận thật (`calc.battu.dai_van_theo_ngay`)."""
    i = next((k for k, g in enumerate(tgb) if g["hien_tai"]), None)
    if i is not None:
        return {"trang_thai": "dang_di", "chi_so": i}
    if ngay_xem.isoformat() < tgb[0]["tu_ngay"]:
        return {"trang_thai": "chua_khoi", "chi_so": 0}
    return {"trang_thai": "da_qua_van_cuoi", "chi_so": len(tgb) - 1}


def _cau_van(vt: dict, khoa: str, g: dict, **bien) -> str:
    """Câu KB theo trạng thái vận (thiếu → câu mặc định trong mã), điền biến của vận tham chiếu `g`."""
    o = kb.van_tham_chieu(vt["trang_thai"]) or {}
    mau = o.get(khoa) or _VAN_TC_MAC_DINH[vt["trang_thai"]][khoa]
    if not mau:
        return ""
    return mau.format(**{"chu_de": g["chu_de"], "tu_tuoi": g["tu_tuoi"], "den_tuoi": g["den_tuoi"],
                         "nam_tu": g["nam_tu"], "nam_den": g["nam_den"], **bien})


def _chuong_cuoc_doi(tgb: list[dict], nam_xem: int, hoc: tuple, vt: dict) -> dict:
    cand = []

    def cau(g: dict) -> str:
        return f"Từ {g['tu_tuoi']} đến {g['den_tuoi']} tuổi ({_thang_nam(g['tu_ngay'])}–{_thang_nam(g['den_ngay'])}): " \
               f"{g['chu_de']}."

    def cu(g: dict) -> list[str]:
        return [f"Đại vận {g['cung']} ({g['thap_than']}), {_khoang_ngay(g)}; "
                f"cách 1: {kb.nhan_muc(g['muc_cach_1']).lower()}, cách 2: {kb.nhan_muc(g['muc_cach_2']).lower()}"]

    def ma(g: dict, vai: str) -> str:
        return _mm("cuoc_doi", slug(g["thap_than"]), g["muc"], vai)

    dau = vt["chi_so"]
    g0 = tgb[dau]
    so_van = len(tgb)
    ten_dau, ten_sau = (_cau_van(vt, "cuoc_doi_dau", g0, so_van=so_van),
                        _cau_van(vt, "cuoc_doi_sau", g0, so_van=so_van))
    if vt["trang_thai"] == "da_qua_van_cuoi":    # vận cuối rồi vận trước nó — không có "kế tiếp"
        cap = [(dau, "gan_nhat", ten_dau), (dau - 1, "truoc", ten_sau)]
    else:
        cap = [(dau, "hien_tai", ten_dau), (dau + 1, "tiep", ten_sau)]
    for j, (k, vai, ten) in enumerate(cap):
        if 0 <= k < len(tgb):
            g = tgb[k]
            cand.append(_hop("thoi_diem", ten, f"{cau(g)} {g['mot_cau']}", cu(g), ma(g, vai), 3.0 - 0.5 * j,
                             muc=g["muc"], tu_tuoi=g["tu_tuoi"], den_tuoi=g["den_tuoi"]))
    da_noi = {k for k, _, _ in cap}
    sap = [g for k, g in enumerate(tgb) if k not in da_noi and g["nam_den"] >= nam_xem and g["nam_tu"] <= nam_xem + 30]
    thuan = next((g for g in sap if g["muc"] == "thuan"), None)
    chu_dong = next((g for g in sap if g["muc"] == "can_chu_dong"), None)
    if thuan:
        cand.append(_hop("diem_manh", "Giai đoạn nên tận dụng", f"{cau(thuan)} {thuan['mot_cau']}", cu(thuan),
                         ma(thuan, "manh"), 2.0, tu_tuoi=thuan["tu_tuoi"], den_tuoi=thuan["den_tuoi"]))
    if chu_dong:
        k = _van_kb(chu_dong["thap_than"])
        cand.append(_hop("luu_y", "Giai đoạn nên chuẩn bị trước",
                         f"{cau(chu_dong)} {k['de_vap'] or 'Việc thường cần nhiều sức hơn bạn tính.'}", cu(chu_dong),
                         ma(chu_dong, "vap"), 2.0, huong=k["nen_chu_dong"], tu_tuoi=chu_dong["tu_tuoi"],
                         den_tuoi=chu_dong["den_tuoi"]))
    hop, xem_lai = _ap_hoc(cand, *hoc)
    muc = g0["muc"]
    tom = _cau_van(vt, "cuoc_doi_tom", g0, so_van=so_van)
    dem = {m: sum(g["muc"] == m for g in tgb) for m in ("thuan", "can_bang", "can_chu_dong")}
    phan = [f"{n} giai đoạn {kb.nhan_muc(m).lower()}" for m, n in dem.items() if n]
    n_khac = sum(g["hai_cach_khac"] for g in tgb)
    doan = [tom, f"Trên dòng thời gian của bạn có {', '.join(phan)}."
            + (" Giai đoạn cần lưu ý không phải lúc kém may — chỉ là lúc nên chuẩn bị trước nhiều hơn."
               if dem["can_chu_dong"] else ""),
            (f"Có {n_khac} giai đoạn mà hai cách đọc cho kết quả khác nhau; ở những giai đoạn đó, đối chiếu với điều "
             "bạn thực sự trải qua để chọn cách hợp với mình." if n_khac else
             "Ở mọi giai đoạn, hai cách đọc cho cùng một kết quả.")]
    can_cu = [f"{g['tu_tuoi']}–{g['den_tuoi']} tuổi: đại vận {g['cung']} ({g['thap_than']})" for g in tgb]
    can_cu += ["Tuổi tính theo năm khởi vận (tuổi tròn); mỗi đại vận mười năm",
               "Mức mỗi đại vận: can 1 điểm, chi 2 điểm theo hành cần thêm / nên bớt của từng cách", *xem_lai]
    can_cu.append(f"Đại vận tham chiếu lúc xem: {g0['cung']} ({vt['trang_thai']})")
    return _chuong("cuoc_doi", muc, tom, hop, doan, can_cu, kb.cau_tu_soi("cuoc_doi"), van_tham_chieu=dict(vt))


# ---- chương 4–8, 10: mảng đời theo tình huống
def _chuong_tinh_cam(cm: dict, pt: dict, hoc: tuple, da_dung: set[str]) -> dict:
    ls = pt["ls"]
    tt = ls["thap_than_chi"][2][0]
    o = kb.phoi_ngau(tt)
    them = []
    cu = f"Chi ngày {ls['tru'][2]['chi']} (cung phối ngẫu), bản khí {ls['tang_can'][2][0]} là {tt}"
    if o and o.get("y"):
        them.append(_hop_kb("tinh_cam", o, f"phoi.{slug(tt)}", [cu], 1.7, "Kiểu gắn bó của bạn"))
    ten = "Cô Thần" if pt["gioi_tinh"] == "nam" else "Quả Tú"
    h = _hop_than_sat("tinh_cam", ten, pt)
    if h:
        them.append(h)
    return _chuong_mang("tinh_cam", cm, pt, hoc, da_dung, them)


def _chuong_su_nghiep(cm: dict, pt: dict, hoc: tuple, da_dung: set[str]) -> dict:
    cc = pt["ls"]["dung_than"]["cach_cuc"]
    k = kb.cach(cc["ma"]) or {}
    them = []
    if k.get("nghe"):
        them.append(_hop("loi_khuyen", "Kiểu việc hợp với bạn", k["nghe"],
                         [f"Cách cục {cc['ten']} (Tử Bình Chân Thuyên)"], _mm("su_nghiep", "nghe", cc["ma"], "khuyen"),
                         1.0))
    return _chuong_mang("su_nghiep", cm, pt, hoc, da_dung, them)


def _chuong_suc_khoe(pt: dict, cm: dict, hoc: tuple) -> dict:
    tl = pt["ty_le_hanh"]
    x = cm["suc_khoe"]
    cand = []
    lon = max(THU_TU_HANH, key=lambda h: (tl[h], -THU_TU_HANH.index(h)))
    if tl[lon] >= NGUONG_DAM:
        k = kb.hanh(lon)
        nd = (f"Sách xưa gắn {lon} với {k['co_the']} — nên chăm sóc phòng ngừa." if k.get("co_the") else "")
        nd = f"{nd} {k.get('nhip_thua') or ''}".strip() or "Bạn nên để ý nhịp nghỉ của mình."
        cand.append(_hop("luu_y", "Phần cơ thể nên chăm sóc", nd, [f"{lon} chiếm {_pct(tl[lon])} điểm ngũ hành (thừa)"],
                         _mm("suc_khoe", "thua", slug(lon), "vap"), 2.0, huong=k.get("loi_khuyen_sk") or _SK_MAC_DINH))
    for i, h in enumerate([h for h in THU_TU_HANH if pt["diem"][h] == 0][:2]):
        k = kb.hanh(h)
        nd = (f"Phần sách xưa gắn với {h} là {k['co_the']} — nên chăm sóc phòng ngừa." if k.get("co_the") else "")
        nd = f"{nd} {k.get('nhip_thieu') or ''} {k.get('loi_khuyen_sk') or _SK_MAC_DINH}".strip()
        cand.append(_hop("loi_khuyen", f"Phần nên bù thêm: {h}", nd, [f"{h}: 0 điểm (thiếu)"],
                         _mm("suc_khoe", "thieu", slug(h), "khuyen"), 1.8 - 0.01 * i))
    o = kb.suc_khoe_than(pt["than"]) or {}
    cand.append(_hop("loi_khuyen", "Nhịp sức của riêng bạn",
                     f"{o.get('y') or 'Bạn nên để ý nhịp nghỉ của mình.'} {o.get('loi_khuyen') or _SK_MAC_DINH}",
                     [f"Thân {pt['ls']['than']['ket_luan']} (tỉ lệ trợ lực {pt['ls']['than']['ti_le']:g})"],
                     _mm("suc_khoe", "than", pt["than"], "khuyen"), 1.5))
    if len(cand) < 2:
        cand.append(_hop("loi_khuyen", "Nếp sinh hoạt nên giữ",
                         f"{kb.suc_khoe_can_doi() or 'Năm hành của bạn khá cân.'} {_SK_MAC_DINH}",
                         ["Không hành nào thiếu hẳn hay vượt 30%"], _mm("suc_khoe", "can_doi", "khuyen"), 1.0))
    hop, xem_lai = _ap_hoc(cand, *hoc)
    chung = kb.suc_khoe_chung()
    tom = _tom("suc_khoe", x["muc"])
    doan = [tom, "Các gợi ý dưới đây xoay quanh nếp ăn ngủ, vận động và khám định kỳ — làm đều mỗi ngày quan "
                 "trọng hơn làm nhiều một lúc.", chung]
    can_cu = [*(c for h in hop for c in h["can_cu"]),
              "Mức chương này theo độ lệch ngũ hành: thiếu ≥ 2 hành hoặc một hành ≥ 45% là cần lưu ý",
              battu_kb.luu_y("suc_khoe"), *xem_lai]
    return _chuong("suc_khoe", x["muc"], tom, hop, doan, can_cu, kb.cau_tu_soi("suc_khoe"), mien_tru=chung)


# ---- chương 11: năm nay & tháng tới (đại vận > lưu niên > lưu nguyệt)
def _chuong_nam_nay(pt: dict, tgb: list[dict], ngay_xem: dt.date, hoc: tuple, vt: dict) -> dict:
    ls = pt["ls"]
    nc = ls["nhat_chu"]["can"]
    tz = dt.timedelta(hours=config.CALENDAR_MERIDIAN_TZ)
    nam = _nam_bat_tu(dt.datetime(ngay_xem.year, ngay_xem.month, ngay_xem.day, 12) - tz)
    ln = mr_calc.luu_nien(ls, nam)
    cand, can_cu = [], []
    tt_van = vt["trang_thai"]
    g = tgb[vt["chi_so"]]
    bien = {"so_nam": _so_nam_tu(g["tu_ngay"], ngay_xem), "so_van": len(tgb), "muc": kb.nhan_muc(g["muc"]).lower()}
    cau_muc = _cau_van(vt, "nam_nay_muc", g, **bien)
    nd = _cau_van(vt, "nam_nay_hop", g, **bien)
    if cau_muc:                                  # vận đã qua: không nói mức, không so hai cách
        nd += f" {cau_muc}" + _cau_hai_cach(g["muc_cach_1"], g["muc_cach_2"], "cả mười năm")
    sap_doi = _sap_doi_van(tgb, vt, ngay_xem)
    if sap_doi:
        nd += f" {sap_doi}"
    tieu = _cau_van(vt, "nam_nay_tieu_de", g, **bien)
    can_cu.append(f"Đại vận {g['cung']} ({g['thap_than']}), {_khoang_ngay(g)} — {tt_van}")
    ma_van = (_mm("nam_nay", "van", slug(g["thap_than"]), "da_qua") if tt_van == "da_qua_van_cuoi" else
              _mm("nam_nay", "van", slug(g["thap_than"]), g["muc"]))
    cand.append(_hop("thoi_diem", tieu if len(tieu) <= 60 else _VAN_TC_MAC_DINH[tt_van]["cuoc_doi_dau"], nd,
                     can_cu[-1:], ma_van, 3.0, **({"muc": g["muc"]} if cau_muc else {})))
    m1, m2, muc_n = muc_hai_cach(pt, ln["can"], ln["chi"])
    k = _van_kb(ln["thap_than"])
    # Câu của năm dùng câu ngắn theo tháng/năm (KB `thang`), KHÔNG chép câu "nên làm" của giai đoạn mười năm (chương
    # Các giai đoạn đã dùng) — hai chương không lặp câu.
    goi_nam = kb.thang(ln["thap_than"]) or "hợp dồn sức cho việc chính"
    cu_n = f"Lưu niên {nam} {ln['can']} {ln['chi']} ({ln['thap_than']}); cách 1: {kb.nhan_muc(m1).lower()}, cách 2: " \
           f"{kb.nhan_muc(m2).lower()}"
    can_cu.append(cu_n)
    cand.append(_hop("thoi_diem", "Năm nay",
                     f"Năm nay việc hay xoay quanh {k['chu_de']}; với bạn, năm ở mức {kb.nhan_muc(muc_n).lower()}. "
                     f"Cả năm {goi_nam}.{_cau_hai_cach(m1, m2, 'năm nay')}",
                     [cu_n], _mm("nam_nay", "nam", slug(ln["thap_than"]), muc_n), 2.9, muc=muc_n))
    qh = [q for q in ln["quan_he"] if 2 in q["tru"] and not q["loai"].startswith("can ")]
    can_cu += [q["mo_ta"] for q in ln["quan_he"]]
    loai_qh = ("xung" if any(q["loai"] in _XUNG for q in qh) else "hinh" if any(q["loai"] in _HINH for q in qh)
               else "hop" if any(q["loai"] in _HOP for q in qh) else None)
    if loai_qh:
        o = kb.nam_quan_he(loai_qh) or {}
        if o.get("y"):
            cand.append(_hop("diem_manh" if loai_qh == "hop" else "luu_y",
                             o.get("tieu_de") or _tieu_de(o["y"], "Điều riêng của năm nay"),
                             o["y"] if loai_qh != "hop" else f"{o['y']} {o.get('loi_khuyen') or ''}".strip(),
                             [q["mo_ta"] for q in qh], _mm("nam_nay", "nam", loai_qh), 2.5, huong=o.get("loi_khuyen")))
    thang_cau = []
    for i, t in enumerate(ba_thang_tiet(pt, ngay_xem), 1):
        a, b, m = muc_thang(pt, t["can"], t["chi"])
        goi = (f"tháng xoay quanh {_van_kb(t['thap_than'])['chu_de']}" if t["thap_than"] == ln["thap_than"]
               else kb.thang(t["thap_than"]) or "hợp làm việc chính, giữ nhịp đều")
        ten = f"Từ {t['tu'].day}/{t['tu'].month} đến {t['den'].day}/{t['den'].month}"
        cu_t = f"Lưu nguyệt (tháng theo tiết) {t['can']} {t['chi']} ({t['thap_than']}), từ {t['tu'].isoformat()}"
        can_cu.append(cu_t)
        cand.append(_hop("thoi_diem", ten, f"{_hoa_dau(goi)}.{_cau_hai_cach(a, b, 'tháng này')}", [cu_t],
                         _mm("nam_nay", f"thang{i}", slug(t["thap_than"]), m), 2.0 - 0.1 * i, muc=m,
                         tu=t["tu"].isoformat(), den=t["den"].isoformat()))
        thang_cau.append(f"{ten[0].lower()}{ten[1:]} {kb.nhan_muc(m).lower()}")
    hop, xem_lai = _ap_hoc(_sap(cand), *hoc)
    tom = _cau_van(vt, "nam_nay_tom", g, **bien)
    if tt_van == "dang_di":
        tom += (f"; năm nay thêm chuyện {k['chu_de']}" if k["chu_de"] != g["chu_de"] else "") + "."
    else:
        tom += f"; năm nay xoay quanh {k['chu_de']}."
    doan = [tom, (f"Ba tháng tới (tính theo tiết): {'; '.join(thang_cau)}." if thang_cau else ""),
            ("Khi các lớp nói khác nhau, ưu tiên mười năm trước, rồi đến năm, rồi mới đến tháng." if tt_van == "dang_di"
             else "Khi năm và tháng nói khác nhau, ưu tiên năm trước, rồi mới đến tháng.")]
    can_cu += ["Ưu tiên: đại vận > lưu niên > lưu nguyệt", "Năm tính từ Lập xuân, tháng tính từ ngày giao tiết",
               *xem_lai]
    # Ưu tiên đại vận > lưu niên: chưa khởi vận / đã qua vận cuối thì lớp cao nhất đang có là năm.
    muc_ch = g["muc"] if tt_van == "dang_di" else muc_n
    return _chuong("nam_nay", muc_ch, tom, hop, doan, can_cu, kb.cau_tu_soi("nam_nay"), nam_xem=nam,
                   van_tham_chieu=dict(vt))


# ---- VH-1: vận hạn 10 năm & điều nên tránh (`docs/LUAN-GIAI-DOI-SONG.md` mục 8)
# Mười năm từ năm đang đi (năm tính từ Lập xuân, như mọi lớp thời gian của Bát tự): mỗi năm chỉ ĐỌC
# `battu_mo_rong.luu_nien` (can chi, thập thần, quan hệ với bốn trụ) và chấm như đại vận — từng cách lấy dụng thần
# (can 1 điểm + chi 2 điểm theo hành cần thêm / nên bớt) rồi gộp bằng `gop_muc`; hai cách khác nhau → NÓI RÕ. Mảng chịu
# tác động theo thập thần của can năm (Tài → tiền, Quan Sát → công việc, Ấn → giấy tờ / người che chở, Thực Thương →
# lời nói / việc tự làm, Tỷ Kiếp → bạn bè / tiền chung). Thêm (không đổi mức): năm xung / hình chi ngày (chỗ ở, người
# gần — trụ ngày) và cờ tập quán dân gian theo chi trụ năm (năm tuổi, xung tuổi, va tuổi, tam tai). 12 tháng tới theo
# tiết chấm cùng luật → tháng nên đi chậm / tháng thuận để bắt đầu. Ưu tiên đại vận > lưu niên > lưu nguyệt.
def _loi_bt(tt: str, loai: str, gd: str) -> dict:
    """Lời KB `van_han.thap_than.<tt>` (mang) + `.<loai>` (nhan; thuan có y, lam) + `.<loai>.<tre|lon>` (y, tranh, lam).
    Dưới 18 tuổi: lời cho cha mẹ (`van_han.nho.<loai>.<nhóm thập thần>`)."""
    if gd == "nho":                          # lời cho cha mẹ, theo nhóm của thập thần năm (bạn, học, lời nói, tiền, áp lực)
        return {**{k: v for k, v in (kb.van_han_loi("nho", loai) or {}).items() if v},
                **{k: v for k, v in (kb.van_han_loi("nho", loai, TT_NHOM[tt]) or {}).items() if v}}
    ra = {}
    for khoa in (("thap_than", tt), ("thap_than", tt, loai)):
        ra.update({k: v for k, v in (kb.van_han_loi(*khoa) or {}).items() if v})
    tuoi = (kb.van_han_loi("thap_than", tt, loai, gd)
            or kb.van_han_loi("thap_than", tt, loai, "lon" if gd == "tre" else "tre") or {})
    ra.update({k: v for k, v in tuoi.items() if v})
    return ra


def dong_muoi_nam(pt: dict, tgb: list[dict], nam0: int, nam_sinh: int, vt: dict | None = None,
                  nam_sinh_am: int | None = None) -> list[dict]:
    """Mười năm tới (năm Lập xuân `nam0` …), luật ở chú thích trên. Khoá `_…` là nội bộ (hộp ứng viên)."""
    ls = pt["ls"]
    chi_sinh, chi_ngay = ls["tru"][0]["chi"], ls["tru"][2]["chi"]
    ra = []
    for k in range(dsc.SO_NAM_VAN_HAN):
        nam = nam0 + k
        ln = mr_calc.luu_nien(ls, nam)
        tt = ln["thap_than"]
        tuoi = nam - nam_sinh
        gd = dsc.giai_doan_tuoi(tuoi)
        m1, m2, muc = muc_hai_cach(pt, ln["can"], ln["chi"])
        q_ngay = [q for q in ln["quan_he"] if 2 in q["tru"] and not q["loai"].startswith("can ")]
        co = dsc.co_dan_gian(chi_sinh, ln["chi"])
        if any(q["loai"] in _XUNG for q in q_ngay):
            co.append("xung_ngay")
        elif any(q["loai"] in _HINH for q in q_ngay):
            co.append("hinh_ngay")
        # Năm đang xem: đúng vận đang đi hôm nay (như chương Năm nay); năm khác: theo bảng đại vận (năm bắt đầu vận).
        if k == 0 and vt and vt["trang_thai"] == "dang_di":
            g_dv = tgb[vt["chi_so"]]
        else:
            g_dv = next((g for g in tgb if g["nam_tu"] <= nam <= g["nam_den"]), None)
        doi = next((g for g in tgb if g["tu_ngay"][:4] == str(nam)), None)      # năm này có ngày đổi vận
        nen_tranh = nen_lam = mang = None
        if muc == "can_chu_dong":
            o = _loi_bt(tt, "can", gd)
            mang = o.get("mang")
            y = o.get("y") or f"việc quanh {_van_kb(tt)['chu_de']} dễ vướng hơn thường lệ."
            nen_tranh, nen_lam = o.get("tranh"), o.get("lam")
        elif muc == "thuan":
            o = _loi_bt(tt, "thuan", gd)
            mang = o.get("mang")
            y = o.get("y") or f"việc quanh {_van_kb(tt)['chu_de']} dễ thuận."
            nen_lam = o.get("lam")
        else:
            y = f"nhịp khá đều; việc hay xoay quanh {_van_kb(tt)['chu_de']}."
        nhan = o.get("nhan") if muc != "can_bang" else None
        y = f"Năm {nam}, {_thuong_dau(y)}" + _cau_hai_cach(m1, m2, f"năm {nam}")
        cu = [f"Năm {nam} {ln['can']} {ln['chi']} (tính từ Lập xuân, {ln['thap_than']}); cách 1: "
              f"{kb.nhan_muc(m1).lower()}, cách 2: {kb.nhan_muc(m2).lower()} → {kb.nhan_muc(muc)}"]
        if g_dv:
            cu.append(f"Năm {nam} nằm trong đại vận {g_dv['cung']} ({kb.nhan_muc(g_dv['muc']).lower()})")
        if doi:
            cu.append(f"Ngày {_ngay_vn(doi['tu_ngay'])} sang đại vận {doi['cung']}")
        cu += [f"Năm {nam}: {q['mo_ta']}" for q in q_ngay]
        dg = [x for x in co if x in dsc.CO_DAN_GIAN]
        if dg:
            cu.append(f"Chi trụ năm {chi_sinh}, chi năm {ln['chi']}: " + ", ".join(dsc.NHAN_CO[x] for x in dg)
                      + " (tập quán dân gian, không đổi mức)")
        ra.append({"nam": nam, "tuoi": tuoi, "muc": muc, "nhan_muc": kb.nhan_muc(muc), "muc_cach_1": m1, "muc_cach_2": m2,
                   "hai_cach_khac": m1 != m2, "hien_tai": k == 0,
                   "co": [dsc.co_ra(x, kb.van_han_loi("co", x)) for x in co],
                   # MT-ĐS B3: tuổi mụ theo NĂM ÂM LỊCH VIỆT (như /xem-sao-han và Tử vi), không theo năm dương
                   "sao_han": dsc.sao_han_nam(nam - (nam_sinh_am or nam_sinh) + 1, ls.get("_gioi_tinh")),
                   "mang": mang, "y": y, "nen_tranh": nen_tranh, "nen_lam": nen_lam, "can_cu": cu,
                   "_tt": tt, "_gd": gd, "_k": k, "_diem": _SO_MUC[m1] + _SO_MUC[m2], "_nhan": nhan})
    for g in ra:
        g["_hop"] = _hop_nam(g)
    return ra


def _hop_nam(g: dict) -> list[dict]:
    nam, k, ra = g["nam"], g["_k"], []
    tt = slug(g["_tt"])
    gd = "nho" if g["_gd"] == "nho" else g["_gd"]
    if g["muc"] == "can_chu_dong":
        o = _loi_bt(g["_tt"], "can", g["_gd"])
        nd = g["y"] + (f" Nên tránh: {_thuong_dau(g['nen_tranh'])}." if g["nen_tranh"] else "")
        ra.append(_hop("luu_y", f"Năm {nam}: {o.get('nhan') or 'nên đi chậm'}", nd, g["can_cu"][:2],
                       _mm("van_han", slug(TT_NHOM[g["_tt"]]) if gd == "nho" else tt, "can", gd), 3.0 - 0.01 * k,
                       huong=f"Nên làm: {_thuong_dau(g['nen_lam'])}." if g["nen_lam"] else None, _vai="can", nam=nam,
                       muc=g["muc"]))
    elif g["muc"] == "thuan":
        o = _loi_bt(g["_tt"], "thuan", g["_gd"])
        nd = g["y"] + (f" Nên làm: {_thuong_dau(g['nen_lam'])}." if g["nen_lam"] else "")
        ra.append(_hop("diem_manh", f"Năm {nam}: {o.get('nhan') or 'năm thuận'}", nd, g["can_cu"][:2],
                       _mm("van_han", slug(TT_NHOM[g["_tt"]]) if gd == "nho" else tt, "thuan", "nho" if gd == "nho" else ""),
                       2.5 - 0.01 * k, _vai="thuan",
                       nam=nam, muc=g["muc"]))
    return ra


_THANG_TEN = ("tháng Giêng", "tháng Hai", "tháng Ba", "tháng Tư", "tháng Năm", "tháng Sáu", "tháng Bảy", "tháng Tám",
              "tháng Chín", "tháng Mười", "tháng Mười một", "tháng Chạp")


def muoi_hai_thang(pt: dict, ngay_xem: dt.date) -> list[dict]:
    """12 tháng tới theo tiết, mỗi tháng chấm hai cách như năm (gộp `gop_muc`)."""
    ra = []
    for t in ba_thang_tiet(pt, ngay_xem, 12):
        a, b, m = muc_thang(pt, t["can"], t["chi"])
        o = (kb.van_han_loi("nho", "can", TT_NHOM[t["thap_than"]]) if (pt.get("tuoi") or 99) < dsc.TUOI_VH_NHO
             else kb.van_han_loi("thap_than", t["thap_than"])) or {}
        ra.append({"tu": t["tu"].isoformat(), "den": t["den"].isoformat(), "muc": m, "nhan_muc": kb.nhan_muc(m),
                   "hai_cach_khac": a != b, "mang": o.get("mang") or _van_kb(t["thap_than"])["chu_de"],
                   "_cu": f"Tháng tiết {t['can']} {t['chi']} ({t['thap_than']}) từ {t['tu'].isoformat()}: cách 1 "
                          f"{kb.nhan_muc(a).lower()}, cách 2 {kb.nhan_muc(b).lower()}"})
    return ra


def _ngay(iso: str) -> str:
    d = dt.date.fromisoformat(iso)
    return f"{d.day}/{d.month}"


def _hop_du_phong(dong: list[dict], hop: list[dict]) -> list[dict]:
    """Chương còn < 2 hộp: năm nên giữ nhịp hơn cả (hai cách cộng lại thấp nhất) + năm đáng dồn sức nhất, chưa có hộp."""
    ra, da = [], {h.get("nam") for h in hop}
    if len(hop) >= 2:
        return ra
    con = [g for g in dong if g["nam"] not in da]
    if con:
        g = min(con, key=lambda x: (x["_diem"], x["nam"]))
        o = _loi_bt(g["_tt"], "can", g["_gd"])
        ra.append(_hop("luu_y", f"Năm {g['nam']}: năm nên giữ nhịp hơn cả", g["y"], g["can_cu"][:1],
                       _mm("van_han", "giu_nhip", slug(g["_tt"])), 1.1, nam=g["nam"], muc=g["muc"],
                       huong=f"Nên làm: {_thuong_dau(o['lam'])}." if o.get("lam") else None))
        da.add(g["nam"])
    con = [g for g in dong if g["nam"] not in da]
    if con and len(hop) + len(ra) < 2:
        g = max(con, key=lambda x: (x["_diem"], -x["nam"]))
        o = _loi_bt(g["_tt"], "thuan", g["_gd"])
        ra.append(_hop("diem_manh", f"Năm {g['nam']}: năm đáng dồn sức nhất",
                       g["y"] + (f" Nên làm: {_thuong_dau(o['lam'])}." if o.get("lam") else ""), g["can_cu"][:1],
                       _mm("van_han", "don_suc", slug(g["_tt"])), 1.0, nam=g["nam"], muc=g["muc"]))
    return ra


def _chuong_van_han(dong: list[dict], thang: list[dict], hoc: tuple) -> dict:
    them = []
    cham = [t for t in thang if t["muc"] == "can_chu_dong"]
    thuan_t = [t for t in thang if t["muc"] == "thuan"]
    if cham or thuan_t:
        nd = []
        if cham:
            nd.append("Tháng nên đi chậm: " + "; ".join(f"từ {_ngay(t['tu'])} đến {_ngay(t['den'])} ({t['mang']})"
                                                        for t in cham[:4]) + ".")
        if thuan_t:
            nd.append("Tháng thuận để bắt đầu việc mới: " + "; ".join(
                f"từ {_ngay(t['tu'])} đến {_ngay(t['den'])}" for t in thuan_t[:3]) + ".")
        them.append(_hop("thoi_diem", "Mười hai tháng tới", " ".join(nd), [t["_cu"] for t in thang],
                         _mm("van_han", "thang", "cham" if cham else "thuan"), 2.25))
    hop, xem_lai = dsc.chon_hop_van_han(dong, hoc, them)
    hop += _hop_du_phong(dong, hop)
    thuan = [g for g in dong if g["muc"] == "thuan"]
    can = [g for g in dong if g["muc"] == "can_chu_dong"]
    if thuan:
        g = thuan[0]
        tom = f"Trong mười năm tới, năm thuận gần nhất là {g['nam']}: {g['_nhan'] or 'hợp để dồn sức'}."
    else:
        g = max(dong, key=lambda x: (x["_diem"], -x["nam"]))
        tom = f"Mười năm tới của bạn không có năm nào vượt hẳn; năm đáng dồn sức nhất là {g['nam']}."
    if can:
        cau_cham = "Những năm nên đi chậm: " + ", ".join(f"{g['nam']} ({g['mang'] or 'việc chính'})" for g in can[:4]) + "."
    else:
        g = min(dong, key=lambda x: (x["_diem"], x["nam"]))
        cau_cham = f"Không có năm nào phải đi chậm hẳn; năm nên giữ nhịp hơn cả là {g['nam']}."
    co = [(g["nam"], c["nhan"]) for g in dong for c in g["co"] if c["ma"] in ("nam_tuoi", "xung_tuoi")]
    dg = (f"Theo tập quán dân gian, {' và '.join(f'{n} là {t}' for n, t in co)} của bạn; xem như lời nhắc giữ nếp, "
          "không phải điềm báo." if co else "")
    xn = [g["nam"] for g in dong if any(c["ma"] == "xung_ngay" for c in g["co"])]
    if xn:
        dg += (f" {' và '.join(map(str, xn))} dễ có xáo trộn về chỗ ở hoặc chuyện của người gần nhất; thay đổi nào cũng "
               "nên bàn trước với người trong nhà.")
    n_khac = sum(g["hai_cach_khac"] for g in dong)
    khac = (f"Có {n_khac} năm hai cách đọc cho kết quả khác nhau; ở những năm đó, thử nhỏ trước khi làm lớn."
            if n_khac else "")
    can_cu = ["Ưu tiên: đại vận > lưu niên > lưu nguyệt",
              "Mức mỗi năm / tháng: can 1 điểm, chi 2 điểm theo hành cần thêm (+) / nên bớt (−) của từng cách; ≥ 1 thuận, "
              "≤ −1 cần lưu ý; hai cách gộp như đại vận (ngược nhau → cân bằng, nói rõ)",
              *(c for g in dong for c in g["can_cu"]), *xem_lai,
              "Năm tuổi, xung tuổi, va tuổi, tam tai: tập quán dân gian theo chi trụ năm, không đổi mức của năm",
              "Năm tính từ Lập xuân, tháng tính từ ngày giao tiết (giờ Việt Nam)"]
    dong_ra = [{k: v for k, v in g.items() if not k.startswith("_")} for g in dong]
    thang_ra = [{k: v for k, v in t.items() if not k.startswith("_")} for t in thang]
    return _chuong("van_han", None, tom, hop, [tom, cau_cham, dg, khac], can_cu,
                   "Năm nào trong mười năm tới bạn muốn dành cho việc lớn nhất, và năm nào nên giữ sức?",
                   dong_nam=dong_ra, thang_toi=thang_ra)


# ---- chương 12: lời khuyên
def _chuong_loi_khuyen(ds_chuong: list[dict], muc: str, hoc: tuple) -> dict:
    nguon = _sap([h for c in ds_chuong if c["ma"] in CHUONG_COT_LOI for h in c["hop"] if not h.get("_chua_dung")])

    def ba(loai: str) -> list[dict]:
        ra, mang = [], set()
        for vong in (0, 1):
            for h in nguon:
                if len(ra) >= 3:
                    break
                if h["loai"] != loai or h in ra or (vong == 0 and h["_ch"] in mang):
                    continue
                if h.get("huong_xu_ly") and h["huong_xu_ly"] in {x.get("huong_xu_ly") for x in ra}:
                    continue
                ra.append(h)
                mang.add(h["_ch"])
        return ra

    manh, vap = ba("diem_manh"), ba("luu_y")
    viec = list(dict.fromkeys([h["huong_xu_ly"] for h in vap] or
                              [h.get("loi_khuyen") for h in manh if h.get("loi_khuyen")]))[:3]
    cand = []
    if manh:
        cand.append(_hop("diem_manh", "Ba điểm mạnh nên dùng", " ".join(_cau_dau(h["noi_dung"]) for h in manh),
                         [c for h in manh for c in h["can_cu"][:1]], _mm("loi_khuyen", "ba", "manh"), 3.0))
    if vap:
        cand.append(_hop("luu_y", "Ba điều nên để ý", " ".join(_cau_dau(h["noi_dung"]) for h in vap),
                         [c for h in vap for c in h["can_cu"][:1]], _mm("loi_khuyen", "ba", "vap"), 2.9,
                         huong="Nên gỡ từng điều theo ba việc ngay dưới." if viec else None))
    if viec:
        cand.append(_hop("loi_khuyen", "Ba việc nên làm", " ".join(viec), [], _mm("loi_khuyen", "ba", "khuyen"), 2.8))
    if len(cand) < 2:
        cand.append(_hop("loi_khuyen", "Một việc nhỏ mỗi ngày",
                         "Nên chọn một thói quen nhỏ hợp với điểm mạnh của bạn và làm đều trong ba mươi ngày.", [],
                         _mm("loi_khuyen", "mot_viec", "khuyen"), 1.0))
    hop, xem_lai = _ap_hoc(cand, *hoc)
    tom = "Gom lại từ các chương trên: đây là điều bạn nên dùng, nên để ý và nên làm."
    dau = ("chính thói quen của bạn" if vap[0]["_ch"] == "tong_quan" else f"chuyện {TEN_MANG.get(vap[0]['_ch'], '')}") \
        if vap else ""
    doan = [tom, (f"Nếu tuần này chỉ làm được một việc, hãy bắt đầu từ {dau} — việc nhỏ làm đều có ích hơn kế hoạch "
                  "lớn bỏ dở." if dau else "")]
    return _chuong("loi_khuyen", muc, tom, hop, doan, [c for h in hop for c in h["can_cu"]] + xem_lai,
                   kb.cau_tu_soi("loi_khuyen"))


def chon_cot_loi(ds_chuong: list[dict]) -> list[dict]:
    """3–5 hộp quan trọng nhất: trọng số lớn nhất, ưu tiên con người / công việc / tiền / tình cảm; luôn có ít nhất một
    điểm mạnh và một lưu ý; ≤ 2 hộp một chương. Bỏ hộp đang xem lại và hộp người này đã bấm "chưa đúng"."""
    nguon = [h for c in ds_chuong if c["ma"] in CHUONG_COT_LOI for h in c["hop"]
             if h["loai"] in ("diem_manh", "luu_y") and not h.get("_chua_dung") and not h.get("dang_xem_lai")]

    def diem(h: dict) -> float:
        return h["_w"] + (0.6 if h["_ch"] in CHUONG_UU_TIEN else 0)

    nguon.sort(key=lambda h: -diem(h))
    chon: list[dict] = []

    def con_cho(h: dict, toi_da_loai: int = 3) -> bool:
        return (h not in chon and sum(x["loai"] == h["loai"] for x in chon) < toi_da_loai
                and sum(x["_ch"] == h["_ch"] for x in chon) < 2)

    for loai in ("diem_manh", "luu_y"):
        h = next((h for h in nguon if h["loai"] == loai), None)
        if h:
            chon.append(h)
    for h in nguon:
        if len(chon) >= 5:
            break
        if diem(h) >= 1.0 and con_cho(h):
            chon.append(h)
    for h in nguon:
        if len(chon) >= 3:
            break
        if con_cho(h, 5):
            chon.append(h)
    chon.sort(key=lambda h: -diem(h))
    return [{**h, "loai": "cot_loi", "loai_goc": h["loai"], "tu_chuong": h["_ch"]} for h in chon]


# ------------------------------------------------------------------ điểm vào
def lap(sinh: dict, ngay_xem: dt.date | None = None, trong_so: dict | None = None,
        ca_nhan: dict | None = None, ls: dict | None = None) -> dict:
    """`sinh` = {"lich": datetime giờ lịch UTC+7, "gioi_tinh": "nam"|"nu", "gio_ty"?}. → báo cáo `doi_song_1` (chưa có
    moi_xem / phí — `toan_bo.battu` gắn)."""
    ngay_xem = ngay_xem or dt.datetime.now(dt.timezone(dt.timedelta(hours=7))).date()
    ls = {**ls, "_gioi_tinh": sinh["gioi_tinh"]} if ls else _la_so(sinh)
    pt = phan_tich(ls)
    tuoi = ngay_xem.year - sinh["lich"].year
    pt["tuoi"] = tuoi
    cm = cham_mang(pt, tuoi)
    hoc = (trong_so, ca_nhan)
    da_dung: set[str] = set()
    tgb = thoi_gian_bieu(pt, ngay_xem)
    vt = van_tham_chieu(tgb, ngay_xem)
    tz = dt.timedelta(hours=config.CALENDAR_MERIDIAN_TZ)
    nam0 = _nam_bat_tu(dt.datetime(ngay_xem.year, ngay_xem.month, ngay_xem.day, 12) - tz)
    d_sinh = sinh["lich"]
    nam_sinh_am = lunar_calc.solar_to_lunar(d_sinh.day, d_sinh.month, d_sinh.year, config.CALENDAR_MERIDIAN_TZ)[2]
    dong = dong_muoi_nam(pt, tgb, nam0, sinh["lich"].year, vt, nam_sinh_am)
    ds: list[dict] = []
    for ma, _, _ in CHUONG:
        if ma == "tong_quan":
            c = _chuong_tong_quan(pt, cm, hoc, da_dung)
        elif ma == "ngu_hanh":
            c = _chuong_ngu_hanh(pt, cm, hoc, da_dung)
        elif ma == "cuoc_doi":
            c = _chuong_cuoc_doi(tgb, ngay_xem.year, hoc, vt)
        elif ma == "su_nghiep":
            c = _chuong_su_nghiep(cm, pt, hoc, da_dung)
        elif ma == "tinh_cam":
            c = _chuong_tinh_cam(cm, pt, hoc, da_dung)
        elif ma == "suc_khoe":
            c = _chuong_suc_khoe(pt, cm, hoc)
        elif ma == "nam_nay":
            c = _chuong_nam_nay(pt, tgb, ngay_xem, hoc, vt)
        elif ma == "van_han":
            c = _chuong_van_han(dong, muoi_hai_thang(pt, ngay_xem), hoc)
        elif ma == "loi_khuyen":
            c = _chuong_loi_khuyen(ds, None, hoc)     # VH-1: chương tổng hợp không mang mức riêng
        else:
            c = _chuong_mang(ma, cm, pt, hoc, da_dung)
        for h in c["hop"]:
            h["_ch"] = ma
        ds.append(c)
    cot_loi = dsc.them_cot_loi_van_han(chon_cot_loi(ds), ds, nam0)
    # Trục 1: thân hộp không lặp tiêu đề · một mã một hộp đầy đủ · đoạn thân không chép hộp (chỉ cắt câu đã có).
    kh.gon_bao_cao({"cot_loi": cot_loi, "chuong": ds})
    tgb_ra = [{k: v for k, v in g.items() if k != "thap_than"} for g in tgb]
    from app.luangiai import luu_y_mang as lym  # noqa: PLC0415
    luu_y_mang = lym.dung(ds, "battu", muc_mang={k: v.get("muc") for k, v in cm.items() if isinstance(v, dict)})
    return _sach({"phien_ban": PHIEN_BAN, "phai": "tu_binh", "cot_loi": cot_loi, "thoi_gian_bieu": tgb_ra, "chuong": ds,
                  "luu_y_mang": luu_y_mang, "ngay_xem": ngay_xem.isoformat(), **kb.meta()})
