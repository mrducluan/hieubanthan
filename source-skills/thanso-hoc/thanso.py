#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
thanso.py — Tính các chỉ số thần số học Pythagoras VÀ đo độ nhạy của chúng.
Điểm khác biệt: script này không chỉ ra một con số, nó ra CẢ KHOẢNG con số
mà các quy ước hợp lý đều có thể cho, để người dùng thấy con số của mình
phụ thuộc vào quy ước phiên âm và quy ước cộng gộp tới mức nào.
"""
import argparse, json, unicodedata, itertools, collections, datetime

MASTER = {11, 22, 33}

def bo_dau(s, d_thanh_d=True):
    """Bỏ dấu tiếng Việt. Đ/đ không phải là D + dấu nên phải xử lý riêng."""
    s = s.replace("Đ", "D" if d_thanh_d else "").replace("đ", "d" if d_thanh_d else "")
    return "".join(c for c in unicodedata.normalize("NFD", s)
                   if unicodedata.category(c) != "Mn")

def gia_tri(ch):
    return (ord(ch.upper()) - 65) % 9 + 1 if ch.isalpha() and ch.isascii() else 0

def rut_gon(n, giu_master=True):
    while n > 9 and not (giu_master and n in MASTER):
        n = sum(int(d) for d in str(n))
    return n

NGUYEN_AM = set("AEIOU")   # Y là điểm tranh cãi, xem tuy_chon_y

def chi_so_ten(ten, che_do, d_thanh_d=True, y_la_nguyen_am=False, giu_master=True):
    t = bo_dau(ten, d_thanh_d).upper()
    na = NGUYEN_AM | ({"Y"} if y_la_nguyen_am else set())
    if che_do == "su_menh":   chon = [c for c in t if c.isalpha()]
    elif che_do == "linh_hon": chon = [c for c in t if c in na]
    else:                      chon = [c for c in t if c.isalpha() and c not in na]
    return rut_gon(sum(gia_tri(c) for c in chon), giu_master)

def duong_doi(d, m, y, quy_uoc="tong_het", giu_master=True):
    if quy_uoc == "tong_het":
        return rut_gon(sum(int(c) for c in f"{d}{m}{y}"), giu_master)
    return rut_gon(rut_gon(d, giu_master) + rut_gon(m, giu_master)
                   + rut_gon(y, giu_master), giu_master)

def do_nhay(ten_bien_the, d, m, y):
    """Quét mọi tổ hợp quy ước hợp lý → tập kết quả có thể có."""
    kq = collections.defaultdict(set)
    for ten in ten_bien_the:
        for dd, yy, gm in itertools.product([True, False], [True, False], [True, False]):
            kq["su_menh"].add(chi_so_ten(ten, "su_menh", dd, yy, gm))
            kq["linh_hon"].add(chi_so_ten(ten, "linh_hon", dd, yy, gm))
            kq["nhan_cach"].add(chi_so_ten(ten, "nhan_cach", dd, yy, gm))
    for qu, gm in itertools.product(["tong_het", "tung_phan"], [True, False]):
        kq["duong_doi"].add(duong_doi(d, m, y, qu, gm))
    return {k: sorted(v) for k, v in kq.items()}

# ---------------- CHU KỲ ----------------
def _nhan_nam_ca_nhan(d, m, nam, giu_master=False):
    """Nhân của công thức: rút gọn(ngày) + rút gọn(tháng) + rút gọn(năm)."""
    return rut_gon(rut_gon(d, False) + rut_gon(m, False)
                   + rut_gon(nam, False), giu_master)

def nam_ca_nhan(d, m, nam_xem, moc="sinh_nhat", giu_master=False):
    """Năm cá nhân cho MỘT năm dương lịch.

    moc='duong_lich' (đổi 1/1)  → trả về MỘT int, dùng cho cả năm.
    moc='sinh_nhat'  (đổi vào sinh nhật) → trả về TUPLE
        (truoc_sinh_nhat, tu_sinh_nhat), vì quãng từ 1/1 tới sinh nhật vẫn
        thuộc năm cá nhân của năm trước.

    Hai quy ước LUÔN lệch nhau ở quãng đầu năm: hai năm dương lịch liền kề
    có căn số chữ số lệch đúng 1, nên không bao giờ trùng. Chọn mốc sinh nhật
    nghĩa là mỗi năm dương lịch có HAI con số — tức lý thuyết có hai cơ hội
    để khớp với cùng một sự kiện. Đó là một nhánh độ nhạy, không phải chi tiết
    kỹ thuật vô hại."""
    if moc == "duong_lich":
        return _nhan_nam_ca_nhan(d, m, nam_xem, giu_master)
    if moc != "sinh_nhat":
        raise ValueError(f"moc khong hop le: {moc!r} "
                         "(chi nhan 'sinh_nhat' hoac 'duong_lich')")
    return (_nhan_nam_ca_nhan(d, m, nam_xem - 1, giu_master),
            _nhan_nam_ca_nhan(d, m, nam_xem, giu_master))

def dinh_cao(d, m, y, dd):
    """4 Đỉnh cao (Pinnacles) + mốc tuổi. Mốc 1 kết thúc ở 36 - số Đường đời."""
    M, D, Y = rut_gon(m, False), rut_gon(d, False), rut_gon(y, False)
    p1, p2 = rut_gon(M + D, False), rut_gon(D + Y, False)
    p3, p4 = rut_gon(p1 + p2, False), rut_gon(M + Y, False)
    het1 = 36 - rut_gon(dd, False)
    return [{"dinh": 1, "so": p1, "tu_tuoi": 0,        "den_tuoi": het1},
            {"dinh": 2, "so": p2, "tu_tuoi": het1 + 1, "den_tuoi": het1 + 9},
            {"dinh": 3, "so": p3, "tu_tuoi": het1 + 10,"den_tuoi": het1 + 18},
            {"dinh": 4, "so": p4, "tu_tuoi": het1 + 19,"den_tuoi": None}]

def thu_thach(d, m, y):
    """4 Thử thách (Challenges) — rút gọn về 0..8, KHÔNG có số cái."""
    M, D, Y = rut_gon(m, False), rut_gon(d, False), rut_gon(y, False)
    c1, c2 = abs(M - D), abs(D - Y)
    return {"thu_thach_1": c1, "thu_thach_2": c2,
            "thu_thach_chinh": abs(c1 - c2), "thu_thach_4": abs(M - Y)}

def chu_ky_9_nam(d, m, nam_sinh, tu_nam, den_nam, moc="sinh_nhat"):
    """Bảng năm cá nhân để ĐỐI CHIẾU HỒI TỐ với đời thực.

    Xuất CẢ HAI quy ước mốc cho từng năm, vì chúng không trùng nhau — che một
    trong hai là che mất một nhánh độ nhạy. `moc` chỉ quyết định trường
    `nam_ca_nhan` (giá trị dùng để đối chiếu); hai trường kia luôn có mặt."""
    bang = []
    for n in range(tu_nam, den_nam + 1):
        dl = nam_ca_nhan(d, m, n, "duong_lich")
        truoc, tu_sn = nam_ca_nhan(d, m, n, "sinh_nhat")
        bang.append({
            "nam": n,
            "tuoi_that": n - nam_sinh,          # tuổi tròn đạt được trong năm
            "tuoi_mu": n - nam_sinh + 1,
            "moc_duong_lich": dl,
            "moc_sinh_nhat": {"truoc_sinh_nhat": truoc, "tu_sinh_nhat": tu_sn},
            "hai_moc_lech": truoc != dl,
            "nam_ca_nhan": dl if moc == "duong_lich" else tu_sn,
        })
    return bang

def so_nguoi_trung_chu_ky():
    """Chu kỳ chỉ phụ thuộc ngày+tháng sinh → 1/366 dân số có chuỗi y hệt."""
    return {"ty_le": "1/366", "uoc_tinh_toan_cau": "~22 triệu người",
            "y_nghia": "Chuỗi năm cá nhân của anh trùng khít với ~22 triệu người khác, "
                       "suốt đời, không lệch một năm nào."}

def phan_bo_duong_doi(tu_nam=1950, den_nam=2010):
    c = collections.Counter()
    d0, d1 = datetime.date(tu_nam,1,1), datetime.date(den_nam,12,31)
    ngay = d0
    while ngay <= d1:
        c[duong_doi(ngay.day, ngay.month, ngay.year)] += 1
        ngay += datetime.timedelta(days=1)
    tong = sum(c.values())
    return {str(k): f"{v/tong*100:.1f}%" for k, v in sorted(c.items())}, tong

if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--ten", action="append", default=[],
                   help="Biến thể tên; lặp lại nhiều lần (khai sinh, thường gọi, bỏ đệm...)")
    p.add_argument("--ngay", type=int); p.add_argument("--thang", type=int); p.add_argument("--nam", type=int)
    p.add_argument("--phan-bo", action="store_true", help="Phân bố số Đường đời trong dân số")
    p.add_argument("--chu-ky", nargs=2, type=int, metavar=("TU_NAM","DEN_NAM"),
                   help="Xuất bảng năm cá nhân để đối chiếu hồi tố")
    a = p.parse_args()
    if a.phan_bo:
        pb, n = phan_bo_duong_doi()
        print(json.dumps({"phan_bo_duong_doi_1950_2010": pb, "so_ngay_khao_sat": n},
                         ensure_ascii=False, indent=2)); raise SystemExit
    if a.chu_ky and not (a.ngay and a.thang and a.nam):
        p.error("--chu-ky cần --ngay --thang --nam")
    if a.chu_ky:
        dd = duong_doi(a.ngay, a.thang, a.nam)
        bang = chu_ky_9_nam(a.ngay, a.thang, a.nam, a.chu_ky[0], a.chu_ky[1])
        out = {"ngay_sinh": f"{a.ngay:02d}/{a.thang:02d}/{a.nam}", "duong_doi": dd,
               "dinh_cao": dinh_cao(a.ngay, a.thang, a.nam, dd),
               "thu_thach": thu_thach(a.ngay, a.thang, a.nam),
               "bang_nam_ca_nhan": bang,
               "do_nhay_moc_doi_nam": {
                   "giai_thich": "Mốc 1/1 cho một con số cho cả năm dương lịch. Mốc sinh nhật "
                                 "CHIA năm dương lịch làm hai: quãng 1/1→sinh nhật vẫn thuộc "
                                 "năm cá nhân của năm trước.",
                   "so_nam_hai_moc_lech": sum(1 for r in bang if r["hai_moc_lech"]),
                   "tong_so_nam": len(bang),
                   "canh_bao": "Hai quy ước LUÔN lệch nhau ở quãng đầu năm (căn số chữ số của "
                               "hai năm liền kề lệch đúng 1). Chọn mốc sinh nhật nghĩa là mỗi "
                               "năm dương lịch có HAI con số, tức lý thuyết có hai cơ hội để "
                               "khớp với cùng một sự kiện. Khi kiểm chứng, mốc 1/1 khắt khe hơn."},
               "trung_chu_ky": so_nguoi_trung_chu_ky(),
               "canh_bao": ["Chu kỳ 9 năm là TIỀN ĐỊNH từ ngày+tháng sinh — nó không phải "
                            "dự báo, mà là một mẫu hình lặp có thể ĐỐI CHIẾU HỒI TỐ. "
                            "Hãy dùng bảng này để kiểm tra xem đời anh có khớp không, "
                            "TRƯỚC khi dùng nó để trông đợi bất cứ điều gì."]}
        print(json.dumps(out, ensure_ascii=False, indent=2)); raise SystemExit
    if not (a.ten and a.ngay and a.thang and a.nam):
        p.error("cần --ten (>=1 lần) và --ngay --thang --nam, hoặc --phan-bo")
    dn = do_nhay(a.ten, a.ngay, a.thang, a.nam)
    out = {
        "ten_bien_the_da_quet": a.ten,
        "ngay_sinh": f"{a.ngay:02d}/{a.thang:02d}/{a.nam}",
        "khoang_ket_qua_co_the": dn,
        "so_ket_qua_khac_nhau": {k: len(v) for k, v in dn.items()},
        "canh_bao": [],
    }
    for k, v in dn.items():
        if len(v) > 1:
            out["canh_bao"].append(
                f"Chỉ số '{k}' KHÔNG xác định: ra {len(v)} giá trị khác nhau ({v}) "
                f"tuỳ quy ước phiên âm / cộng gộp. Phải chốt quy ước rồi mới luận.")
    if not out["canh_bao"]:
        out["canh_bao"].append("Mọi quy ước cho cùng kết quả — trường hợp ổn định, hiếm.")
    print(json.dumps(out, ensure_ascii=False, indent=2))
