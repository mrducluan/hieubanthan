"""Sinh golden "đối chiếu đặc tả" Tử vi bằng KHẨU QUYẾT viết tay — KHÔNG gọi iztro, không gọi engine an sao.

    cd engine && .venv/bin/python fixtures/golden/_sinh_tuvi_doi_chieu_dac_ta.py > fixtures/golden/tuvi_doi_chieu_dac_ta.json

Chỉ dùng `app.calc.lunar` (âm lịch Hồ Ngọc Đức, golden riêng) để đổi ngày dương → âm Việt Nam (UTC+7). Mọi phép còn lại
là khẩu quyết sách (Đẩu Số Toàn Thư), chép thẳng ở đây để test so với kết quả iztro mà engine chạy:
  • Tý muộn (time_index 12): an như ngày hôm sau, giờ Tý (quyết định 2026-08-15, EN-6 BI-2).
  • Tháng tính M: tháng nhuận — thang_sau: ngày ≥ 16 → tháng + 1; ca_thang_sau: cả tháng → tháng + 1; thang_chinh: giữ.
  • Mệnh = Dần + (M − 1) − giờ; Thân = Dần + (M − 1) + giờ (chi, Tý = 0, giờ Tý = 0).
  • Can cung (Ngũ Hổ Độn): can Dần = Giáp/Kỷ→Bính, Ất/Canh→Mậu, Bính/Tân→Canh, Đinh/Nhâm→Nhâm, Mậu/Quý→Giáp; Dần…Sửu tăng
    dần. Lai nhân = cung Dần…Hợi có can trùng can năm (Tý, Sửu không xét).
  • Cục: bảng định ngũ hành cục theo can năm × cặp chi cung Mệnh (= nạp âm can chi cung Mệnh).
  • Tử Vi: tìm x ≥ 0 nhỏ nhất để (ngày + x) chia hết cho cục, q = (ngày + x)/cục; đếm từ Dần = 1 tới q, x lẻ lùi x,
    x chẵn tiến x. NGÀY KHÔNG KẸP (ngày 30 tháng nhuận giữ 30).
  • Thiên Phủ = Dần + Thân − Tử Vi (đối xứng trục Dần–Thân); hai vòng chính tinh như tests/test_tuvi_bat_bien.py.
  • Tả Phù = Thìn + (M − 1), Hữu Bật = Tuất − (M − 1); Văn Khúc = Thìn + giờ, Văn Xương = Tuất − giờ.
  • Hồng Loan = Mão − chi năm (Tý = 0 khởi Mão, đếm nghịch); Thiên Hỷ đối cung.
  • Đại hạn: cung Mệnh khởi tuổi = số cục, mỗi hạn 10 năm; dương nam / âm nữ đi thuận (chi tăng), âm nam / dương nữ
    nghịch. Can đại hạn = can cung (Ngũ Hổ Độn). Đồng hạn (tuổi mụ < số cục): tuổi 1…5 lần lượt ở Mệnh, Tài Bạch,
    Tật Ách, Phu Thê, Phúc Đức (khẩu quyết 一命二財三疾厄 四歲夫妻五福德), khoảng tuổi = 1 … cục − 1.
  • Tiểu hạn: Dần Ngọ Tuất khởi Thìn · Thân Tý Thìn khởi Tuất · Tỵ Dậu Sửu khởi Mùi · Hợi Mão Mùi khởi Sửu (tuổi 1);
    nam đi thuận, nữ đi nghịch.
  • Tuổi mụ = năm âm xem − năm âm sinh + 1 (đổi ở TẾT VIỆT NAM, không ở Lập xuân); lưu niên = can chi năm âm xem.
  • Tứ hoá [Lộc, Quyền, Khoa, Kỵ] theo can (bảng iztro, quyết định 2026-10-02 giữ Canh/Nhâm của iztro).
Ca 1 (1988-10-08 giờ Mùi nam) và ca 2 (1990-05-17 giờ Ngọ nữ) đã soát lại bằng tay từng bước (docs/DOI-CHIEU-ZIWEI-DOUSHU.md).
"""
import datetime as dt
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
from app.calc import lunar  # noqa: E402

CAN, CHI = lunar.CAN, lunar.CHI
TU_HOA = {"Giáp": ["Liêm Trinh", "Phá Quân", "Vũ Khúc", "Thái Dương"], "Ất": ["Thiên Cơ", "Thiên Lương", "Tử Vi", "Thái Âm"],
          "Bính": ["Thiên Đồng", "Thiên Cơ", "Văn Xương", "Liêm Trinh"], "Đinh": ["Thái Âm", "Thiên Đồng", "Thiên Cơ", "Cự Môn"],
          "Mậu": ["Tham Lang", "Thái Âm", "Hữu Bật", "Thiên Cơ"], "Kỷ": ["Vũ Khúc", "Tham Lang", "Thiên Lương", "Văn Khúc"],
          "Canh": ["Thái Dương", "Vũ Khúc", "Thái Âm", "Thiên Đồng"], "Tân": ["Cự Môn", "Thái Dương", "Văn Khúc", "Văn Xương"],
          "Nhâm": ["Thiên Lương", "Tử Vi", "Tả Phù", "Vũ Khúc"], "Quý": ["Phá Quân", "Cự Môn", "Thái Âm", "Tham Lang"]}
# hàng: can năm % 5 (Giáp Kỷ, Ất Canh, Bính Tân, Đinh Nhâm, Mậu Quý); cột: chi Mệnh // 2 (Tý Sửu, Dần Mão … Tuất Hợi)
CUC = {0: [2, 6, 3, 5, 4, 6], 1: [6, 5, 4, 3, 2, 5], 2: [5, 3, 2, 4, 6, 3], 3: [3, 4, 6, 2, 5, 4], 4: [4, 2, 5, 6, 3, 2]}
TEN = ["Mệnh", "Huynh Đệ", "Phu Thê", "Tử Nữ", "Tài Bạch", "Tật Ách", "Thiên Di", "Nô Bộc", "Quan Lộc", "Điền Trạch",
       "Phúc Đức", "Phụ Mẫu"]
DONG_HAN = [0, -4, -5, -2, 2]           # Mệnh, Tài Bạch, Tật Ách, Phu Thê, Phúc Đức (so với chi Mệnh)
TIEU_KHOI = {2: 4, 6: 4, 10: 4, 8: 10, 0: 10, 4: 10, 5: 7, 9: 7, 1: 7, 11: 1, 3: 1, 7: 1}


def can_cung(ys: int, c: int) -> int:
    return (((ys % 5) * 2 + 2) % 10 + (c - 2) % 12) % 10


def am(d: dt.date):
    ng, th, na, nh = lunar.solar_to_lunar(d.day, d.month, d.year, 7.0)
    return ng, th, na, bool(nh)


def la(d: dt.date, ti: int, gt: str, thang_nhuan: str) -> dict:
    if ti == 12:
        d, ti = d + dt.timedelta(days=1), 0
    ng, th, na, nh = am(d)
    m = th + (1 if nh and (thang_nhuan == "ca_thang_sau" or (thang_nhuan == "thang_sau" and ng > 15)) else 0)
    ys, yb = (na - 4) % 10, (na - 4) % 12
    menh, than = (2 + m - 1 - ti) % 12, (2 + m - 1 + ti) % 12
    cuc = CUC[ys % 5][menh // 2]
    x = 0
    while (ng + x) % cuc:
        x += 1
    q = (ng + x) // cuc
    tv = (2 + (q - x if x % 2 else q + x) - 1) % 12
    tp = (4 - tv) % 12
    sao = {"Tử Vi": tv, "Thiên Cơ": tv - 1, "Thái Dương": tv - 3, "Vũ Khúc": tv - 4, "Thiên Đồng": tv - 5,
           "Liêm Trinh": tv - 8, "Thiên Phủ": tp, "Thái Âm": tp + 1, "Tham Lang": tp + 2, "Cự Môn": tp + 3,
           "Thiên Tướng": tp + 4, "Thiên Lương": tp + 5, "Thất Sát": tp + 6, "Phá Quân": tp + 10,
           "Tả Phù": 4 + m - 1, "Hữu Bật": 10 - (m - 1), "Văn Khúc": 4 + ti, "Văn Xương": 10 - ti}
    thuan = (ys % 2 == 0) == (gt == "nam")
    return {"nam_am": na, "can_nam": CAN[ys], "chi_nam": CHI[yb], "thang_tinh": m, "ngay_am": ng,
            "menh": CHI[menh], "than": CHI[than], "lai_nhan": next(CHI[c] for c in range(2, 12) if can_cung(ys, c) == ys),
            "cuc": cuc, "sao": {k: CHI[v % 12] for k, v in sao.items()},
            "hong_loan": CHI[(3 - yb) % 12], "thien_hy": CHI[(9 - yb) % 12],
            "chieu_dai_han": "thuan" if thuan else "nghich",
            "dai_han": [{"chi": CHI[c], "can": CAN[can_cung(ys, c)], "tu_tuoi": cuc + 10 * k, "den_tuoi": cuc + 10 * k + 9}
                        for k in range(12) for c in [(menh + (k if thuan else -k)) % 12]],
            "tieu_han_tuoi_1": CHI[TIEU_KHOI[yb]], "chieu_tieu_han": "thuan" if gt == "nam" else "nghich",
            "_menh": menh, "_ys": ys, "_tieu": TIEU_KHOI[yb], "_gt": gt}


def xem(L: dict, x: dt.date) -> dict:
    na = am(x)[2]
    tuoi = na - L["nam_am"] + 1
    ten = {CHI[(L["_menh"] - k) % 12]: TEN[k] for k in range(12)}
    dh = next((h for h in L["dai_han"] if h["tu_tuoi"] <= tuoi <= h["den_tuoi"]), None)
    dong = dh is None
    if dong:
        c = (L["_menh"] + DONG_HAN[tuoi - 1]) % 12
        dh = {"chi": CHI[c], "can": CAN[can_cung(L["_ys"], c)], "tu_tuoi": 1, "den_tuoi": L["cuc"] - 1}
    tieu = CHI[(L["_tieu"] + (tuoi - 1 if L["_gt"] == "nam" else 1 - tuoi)) % 12]
    cn, chn = CAN[(na - 4) % 10], CHI[(na - 4) % 12]

    def hoa(can: str) -> list:
        return [{"hoa": h, "sao": s, "chi": L["sao"].get(s)} for h, s in zip(("loc", "quyen", "khoa", "ky"), TU_HOA[can])]
    return {"ngay_xem": x.isoformat(), "nam_am_xem": na, "tuoi_mu": tuoi, "dong_han": dong,
            "dai_han": {**dh, "cung": ten[dh["chi"]], "tu_hoa": hoa(dh["can"])},
            "tieu_han": {"chi": tieu, "cung": ten[tieu]},
            "luu_nien": {"can": cn, "chi": chn, "cung": ten[chn], "tu_hoa": hoa(cn)}}


CASES = [
    ("mau_thin_nam_thuan", "1988-10-08", 7, "nam", "thang_sau", ["2007-02-16", "2007-02-17"],
     "Dương nam đi thuận. 2007-02-17 = Tết Việt (lịch Trung Quốc còn 30/12 Bính Tuất) → lưu niên Đinh Hợi."),
    ("canh_ngo_nu_nghich", "1990-05-17", 6, "nu", "thang_sau", ["2027-02-05", "2027-02-06"],
     "Dương nữ đi nghịch, Thân Mệnh đồng cung. 2027-02-05 đã qua Lập xuân (4/2) nhưng chưa Tết (6/2) → vẫn Bính Ngọ."),
    ("dinh_ty_nam_nghich", "1977-04-20", 3, "nam", "thang_sau", ["1985-02-01", "2026-08-01"],
     "Âm nam đi nghịch. 1985-02-01: lịch Việt đã sang Ất Sửu (Tết 21/1), lịch Trung Quốc còn Giáp Tý (Tết 20/2)."),
    ("quy_hoi_nu_thuan", "1983-09-09", 9, "nu", "thang_sau", ["2030-03-01"], "Âm nữ đi thuận."),
    ("ty_muon_cuoi_thang", "1985-02-19", 12, "nu", "thang_sau", ["2026-08-01"],
     "23:xx ngày 30/1 âm → an như 1/2 âm giờ Tý (tháng đổi)."),
    ("dong_han_2_tuoi", "2024-03-10", 4, "nam", "thang_sau", ["2025-06-01", "2029-06-01"],
     "Hoả lục cục: tuổi mụ 1–5 là đồng hạn; tuổi 2 ở Tài Bạch, khoảng tuổi 1–5."),
    ("nhuan6_ngay30_thang_sau", "2017-08-21", 4, "nam", "thang_sau", [],
     "30/6 nhuận Đinh Dậu (tháng nhuận 30 ngày, tháng 7 chỉ 29 ngày): ngày 30 không kẹp về 29."),
    ("nhuan6_ngay30_ca_thang_sau", "2017-08-21", 4, "nam", "ca_thang_sau", [], "Như trên, cả tháng nhuận tính tháng 7."),
    ("nhuan6_ngay30_thang_chinh", "2017-08-21", 4, "nam", "thang_chinh", [], "Như trên, tính như tháng 6."),
]


def main() -> None:
    ra = []
    for ma, d, ti, gt, tn, ds, ghi in CASES:
        L = la(dt.date.fromisoformat(d), ti, gt, tn)
        ra.append({"id": ma, "ghi_chu": ghi, "duong": d, "ti": ti, "gioi_tinh": gt, "thang_nhuan": tn,
                   **{k: v for k, v in L.items() if not k.startswith("_")},
                   "xem": [xem(L, dt.date.fromisoformat(x)) for x in ds]})
    print(json.dumps({"_ghi_chu": "Sinh bằng _sinh_tuvi_doi_chieu_dac_ta.py — khẩu quyết viết tay, KHÔNG gọi iztro. "
                                  "Chỉ số chi Tý = 0. Xem docstring tệp sinh.", "cases": ra},
                     ensure_ascii=False, indent=1))


if __name__ == "__main__":
    main()
