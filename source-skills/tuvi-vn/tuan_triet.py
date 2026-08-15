#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
tuan_triet.py — Chốt phạm vi và cường độ Tuần/Triệt TRƯỚC khi luận.
Mục đích: lấy quyền quyết định "cung nào bị ảnh hưởng, nặng nhẹ ra sao" ra khỏi
tay người luận, để không thể điều chỉnh giữa chừng cho khớp điều mình muốn thấy.
"""
import argparse, json, statistics

CHI = ["Tý","Sửu","Dần","Mão","Thìn","Tỵ","Ngọ","Mùi","Thân","Dậu","Tuất","Hợi"]
CAN = ["Giáp","Ất","Bính","Đinh","Mậu","Kỷ","Canh","Tân","Nhâm","Quý"]
TAM_HOP = [{8,0,4},{2,6,10},{5,9,1},{11,3,7}]
TRIET = {0:(8,9),5:(8,9), 1:(6,7),6:(6,7), 2:(4,5),7:(4,5), 3:(2,3),8:(2,3), 4:(0,1),9:(0,1)}
TUAN  = {0:(10,11), 1:(8,9), 2:(6,7), 3:(4,5), 4:(2,3), 5:(0,1)}

PHAI = {
    "npl": {"ten": "Nguyễn Phát Lộc", "che_do": "hep",
            "ghi_chu": "Bác bỏ dứt khoát quan điểm lan sang cung hợp chiếu."},
    "vvt": {"ten": "Việt Viêm Tử", "che_do": "tam_hop",
            "ghi_chu": "Lan sang cung hợp chiếu, cường độ phụ thuộc âm/dương tuổi."},
}

def la_cung_duong(c): return c % 2 == 0
def la_tuoi_duong(chi_nam): return CHI.index(chi_nam) % 2 == 0

def tam_hop_cua(c):
    for g in TAM_HOP:
        if c in g: return set(g)

def pham_vi(cap, che_do):
    s = set()
    for c in cap:
        s.add(c)
        if che_do in ("tam_hop", "tptc"): s |= tam_hop_cua(c)
        if che_do == "tptc": s.add((c+6) % 12)
    return s

def cuong_do(cung, tuoi_duong):
    """Cổ thư: dương nam/dương nữ → cung dương chịu 70%, cung âm 30%.
    Chiều cho tuổi âm là SUY RA THEO ĐỐI XỨNG, chưa kiểm chứng nguồn."""
    manh = la_cung_duong(cung) if tuoi_duong else (not la_cung_duong(cung))
    return 70 if manh else 30

def chi_so_hoa_giap(can, chi):
    i_can, i_chi = CAN.index(can), CHI.index(chi)
    for i in range(60):
        if i % 10 == i_can and i % 12 == i_chi: return i
    raise ValueError(f"{can} {chi} khong hop le")

# Ranh giới phân kỳ: đại hạn đầu tiên bắt đầu từ tuổi 30 trở lên (theo cục).
# Thủy nhị cục → 32, khớp đúng con số cổ thư nêu.
RANH_GIOI_CUC = {2: 32, 3: 33, 4: 34, 5: 35, 6: 36}

def phan_tich(can, chi, che_do, truong_phai=None, giai_doan=None, cuc=None):
    i = chi_so_hoa_giap(can, chi)
    tuan, triet = TUAN[i//10], TRIET[i%10]
    s_tuan, s_triet = pham_vi(tuan, che_do), pham_vi(triet, che_do)
    if giai_doan == "tien_van":  s_tuan = set()      # phân kỳ: tiền vận chỉ Triệt
    elif giai_doan == "hau_van": s_triet = set()     # hậu vận chỉ Tuần
    tong = s_tuan | s_triet
    td = la_tuoi_duong(chi)
    chi_tiet = []
    for c in sorted(tong):
        nguon = ([ "Tuần" ] if c in s_tuan else []) + ([ "Triệt" ] if c in s_triet else [])
        row = {"cung": CHI[c], "nguon": nguon,
               "kieu": "đóng trực tiếp" if (c in tuan or c in triet) else "lan qua tam hợp"}
        if che_do != "hep": row["cuong_do_phan_tram"] = cuong_do(c, td)
        chi_tiet.append(row)
    out = {
        "nam_sinh": f"{can} {chi}", "tuoi": "dương" if td else "âm",
        "truong_phai": PHAI[truong_phai]["ten"] if truong_phai else "(không khai báo)",
        "che_do_pham_vi": che_do,
        "giai_doan": giai_doan or "không phân kỳ",
        "ranh_gioi_tuoi_mu": RANH_GIOI_CUC.get(cuc) if cuc else None,
        "tuan_dong_tai": [CHI[c] for c in tuan],
        "triet_dong_tai": [CHI[c] for c in triet],
        "chi_tiet_tung_cung": chi_tiet,
        "tong_so_cung_bi_anh_huong": len(tong), "ty_le": f"{len(tong)}/12",
        "cung_KHONG_bi_anh_huong": [CHI[c] for c in sorted(set(range(12)) - tong)],
        "canh_bao": [],
    }
    if truong_phai and che_do != PHAI[truong_phai]["che_do"]:
        out["canh_bao"].append(
            f"XUNG ĐỘT CẤU HÌNH: trường phái {PHAI[truong_phai]['ten']} dùng chế độ "
            f"'{PHAI[truong_phai]['che_do']}', nhưng đang chạy '{che_do}'. "
            f"{PHAI[truong_phai]['ghi_chu']} Phải giải quyết trước khi luận.")
    if len(tong) >= 10:
        out["canh_bao"].append(
            f"{len(tong)}/12 cung nằm trong phạm vi Tuần/Triệt — ở mức này quy tắc gần như "
            "không còn khả năng phân biệt. Hạ mạnh độ tin cậy mọi kết luận dựa vào Tuần Triệt.")
    if che_do != "hep":
        out["canh_bao"].append(
            "Con số 70/30 là tỷ lệ tương đối. Cổ thư không định nghĩa '100% cường độ' là gì, "
            "nên tỷ lệ này KHÔNG kiểm chứng được — dùng để xếp thứ tự ưu tiên, không như đại lượng đo được.")
    return out

def thong_ke():
    out = {}
    for che_do in ("hep","tam_hop","tptc"):
        vals=[len(pham_vi(TUAN[i//10],che_do)|pham_vi(TRIET[i%10],che_do)) for i in range(60)]
        out[che_do]={"trung_binh":round(statistics.mean(vals),2),"min":min(vals),
                     "max":max(vals),"so_nam_phu_toan_bo_12_cung":sum(1 for v in vals if v==12)}
    return out

if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--can"); p.add_argument("--chi")
    p.add_argument("--truong-phai", choices=["npl","vvt"])
    p.add_argument("--che-do", choices=["hep","tam_hop","tptc"])
    p.add_argument("--giai-doan", choices=["tien_van","hau_van"],
                   help="phân kỳ: tiền vận chỉ tính Triệt, hậu vận chỉ tính Tuần")
    p.add_argument("--cuc", type=int, choices=[2,3,4,5,6], help="số cục, để tính ranh giới")
    p.add_argument("--ab", action="store_true")
    p.add_argument("--thong-ke", action="store_true")
    a = p.parse_args()
    if a.thong_ke:
        print(json.dumps(thong_ke(), ensure_ascii=False, indent=2)); raise SystemExit
    if not (a.can and a.chi): p.error("can --can va --chi, hoac --thong-ke")
    if a.ab:
        print(json.dumps({"A_hep": phan_tich(a.can,a.chi,"hep",a.truong_phai),
                          "B_rong": phan_tich(a.can,a.chi,"tam_hop",a.truong_phai)},
                         ensure_ascii=False, indent=2)); raise SystemExit
    che_do = a.che_do or (PHAI[a.truong_phai]["che_do"] if a.truong_phai else "hep")
    print(json.dumps(phan_tich(a.can,a.chi,che_do,a.truong_phai,a.giai_doan,a.cuc), ensure_ascii=False, indent=2))
