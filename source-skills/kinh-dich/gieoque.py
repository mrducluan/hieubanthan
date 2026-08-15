#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
gieoque.py — Khởi quẻ Kinh Dịch bằng ngẫu nhiên thật, xuất JSON.
LLM KHÔNG được tự chọn quẻ. Mọi quẻ phải đi qua script này.
"""
import argparse, json, secrets, datetime, sys

# ---------- Bát quái: bit từ hào 1 (dưới) lên hào 3 ----------
TRI = {(1,1,1):"Càn",(1,1,0):"Đoài",(1,0,1):"Ly",(1,0,0):"Chấn",
       (0,1,1):"Tốn",(0,1,0):"Khảm",(0,0,1):"Cấn",(0,0,0):"Khôn"}
TRI_BITS = {v:k for k,v in TRI.items()}
TRI_NGU_HANH = {"Càn":"Kim","Đoài":"Kim","Ly":"Hỏa","Chấn":"Mộc",
                "Tốn":"Mộc","Khảm":"Thủy","Cấn":"Thổ","Khôn":"Thổ"}
ORDER = ["Càn","Đoài","Ly","Chấn","Tốn","Khảm","Cấn","Khôn"]

# King Wen: [hạ quái][thượng quái]
KW = {
 "Càn": {"Càn":1,"Đoài":43,"Ly":14,"Chấn":34,"Tốn":9,"Khảm":5,"Cấn":26,"Khôn":11},
 "Đoài":{"Càn":10,"Đoài":58,"Ly":38,"Chấn":54,"Tốn":61,"Khảm":60,"Cấn":41,"Khôn":19},
 "Ly":  {"Càn":13,"Đoài":49,"Ly":30,"Chấn":55,"Tốn":37,"Khảm":63,"Cấn":22,"Khôn":36},
 "Chấn":{"Càn":25,"Đoài":17,"Ly":21,"Chấn":51,"Tốn":42,"Khảm":3,"Cấn":27,"Khôn":24},
 "Tốn": {"Càn":44,"Đoài":28,"Ly":50,"Chấn":32,"Tốn":57,"Khảm":48,"Cấn":18,"Khôn":46},
 "Khảm":{"Càn":6,"Đoài":47,"Ly":64,"Chấn":40,"Tốn":59,"Khảm":29,"Cấn":4,"Khôn":7},
 "Cấn": {"Càn":33,"Đoài":31,"Ly":56,"Chấn":62,"Tốn":53,"Khảm":39,"Cấn":52,"Khôn":15},
 "Khôn":{"Càn":12,"Đoài":45,"Ly":35,"Chấn":16,"Tốn":20,"Khảm":8,"Cấn":23,"Khôn":2},
}
TEN = {1:"Càn",2:"Khôn",3:"Truân",4:"Mông",5:"Nhu",6:"Tụng",7:"Sư",8:"Tỷ",
 9:"Tiểu Súc",10:"Lý",11:"Thái",12:"Bĩ",13:"Đồng Nhân",14:"Đại Hữu",15:"Khiêm",
 16:"Dự",17:"Tùy",18:"Cổ",19:"Lâm",20:"Quan",21:"Phệ Hạp",22:"Bí",23:"Bác",
 24:"Phục",25:"Vô Vọng",26:"Đại Súc",27:"Di",28:"Đại Quá",29:"Khảm",30:"Ly",
 31:"Hàm",32:"Hằng",33:"Độn",34:"Đại Tráng",35:"Tấn",36:"Minh Di",37:"Gia Nhân",
 38:"Khuê",39:"Kiển",40:"Giải",41:"Tổn",42:"Ích",43:"Quải",44:"Cấu",45:"Tụy",
 46:"Thăng",47:"Khốn",48:"Tỉnh",49:"Cách",50:"Đỉnh",51:"Chấn",52:"Cấn",53:"Tiệm",
 54:"Quy Muội",55:"Phong",56:"Lữ",57:"Tốn",58:"Đoài",59:"Hoán",60:"Tiết",
 61:"Trung Phu",62:"Tiểu Quá",63:"Ký Tế",64:"Vị Tế"}

# ---------- Nạp giáp: địa chi hào 1→3 (nội) và 4→6 (ngoại) ----------
NAPGIAP = {
 "Càn": (["Tý","Dần","Thìn"], ["Ngọ","Thân","Tuất"]),
 "Khôn":(["Mùi","Tỵ","Mão"],  ["Sửu","Hợi","Dậu"]),
 "Chấn":(["Tý","Dần","Thìn"], ["Ngọ","Thân","Tuất"]),
 "Tốn": (["Sửu","Hợi","Dậu"], ["Mùi","Tỵ","Mão"]),
 "Khảm":(["Dần","Thìn","Ngọ"],["Thân","Tuất","Tý"]),
 "Ly":  (["Mão","Sửu","Hợi"], ["Dậu","Mùi","Tỵ"]),
 "Cấn": (["Thìn","Ngọ","Thân"],["Tuất","Tý","Dần"]),
 "Đoài":(["Tỵ","Mão","Sửu"],  ["Hợi","Dậu","Mùi"]),
}
CHI_NH = {"Tý":"Thủy","Sửu":"Thổ","Dần":"Mộc","Mão":"Mộc","Thìn":"Thổ","Tỵ":"Hỏa",
          "Ngọ":"Hỏa","Mùi":"Thổ","Thân":"Kim","Dậu":"Kim","Tuất":"Thổ","Hợi":"Thủy"}
SINH = {"Mộc":"Hỏa","Hỏa":"Thổ","Thổ":"Kim","Kim":"Thủy","Thủy":"Mộc"}
KHAC = {"Mộc":"Thổ","Thổ":"Thủy","Thủy":"Hỏa","Hỏa":"Kim","Kim":"Mộc"}

def luc_than(hao_nh, cung_nh):
    if hao_nh == cung_nh: return "Huynh Đệ"
    if SINH[cung_nh] == hao_nh: return "Tử Tôn"
    if KHAC[cung_nh] == hao_nh: return "Thê Tài"
    if KHAC[hao_nh] == cung_nh: return "Quan Quỷ"
    if SINH[hao_nh] == cung_nh: return "Phụ Mẫu"
    return "?"

# ---------- Bát cung / thế ứng, dựng bằng quy tắc, tự kiểm ----------
def _flip(bits, idx):
    b = list(bits); b[idx] ^= 1; return tuple(b)

def build_bat_cung():
    table = {}
    for pal in ORDER:
        t = TRI_BITS[pal]; pure = t + t
        seq = [(pure, 6, "Bát thuần")]
        cur = pure
        for i in range(5):
            cur = _flip(cur, i)
            seq.append((cur, i+1, f"{i+1} thế"))
        du_hon = _flip(cur, 3)
        seq.append((du_hon, 4, "Du hồn"))
        quy = du_hon
        for i in range(3): quy = _flip(quy, i)
        seq.append((quy, 3, "Quy hồn"))
        for bits, the, loai in seq:
            table[bits] = {"cung": pal, "cung_ngu_hanh": TRI_NGU_HANH[pal],
                           "the": the, "ung": (the+3-1) % 6 + 1, "loai": loai}
    assert len(table) == 64, f"Bát cung dựng sai: {len(table)} quẻ"
    return table
BAT_CUNG = build_bat_cung()

# ---------- Nhận diện quẻ ----------
def info(bits):
    ha = TRI[tuple(bits[:3])]; thuong = TRI[tuple(bits[3:])]
    n = KW[ha][thuong]; bc = BAT_CUNG[tuple(bits)]
    hao = []
    for i in range(6):
        tri = ha if i < 3 else thuong
        chi = NAPGIAP[tri][0 if i < 3 else 1][i % 3]
        nh = CHI_NH[chi]
        hao.append({"vi_tri": i+1, "am_duong": "Dương" if bits[i] else "Âm",
                    "dia_chi": chi, "ngu_hanh": nh,
                    "luc_than": luc_than(nh, bc["cung_ngu_hanh"]),
                    "the_ung": "Thế" if i+1 == bc["the"] else ("Ứng" if i+1 == bc["ung"] else "")})
    return {"so_king_wen": n, "ten": TEN[n], "ha_quai": ha, "thuong_quai": thuong,
            "bits_hao1_den_hao6": list(bits), "bat_cung": bc, "hao": hao}

def ho_quai(bits):   return tuple(list(bits[1:4]) + list(bits[2:5]))
def thac_quai(bits): return tuple(1-b for b in bits)
def tong_quai(bits): return tuple(reversed(bits))

# ---------- Khởi quẻ ----------
def yarrow_ideal():
    """Thệ pháp theo phân phối kinh điển: lão dương 3/16, thiếu dương 5/16,
    thiếu âm 7/16, lão âm 1/16. Đây là phân phối mà truyền thống mô tả."""
    r = secrets.randbelow(16)
    if r < 3:  return 9
    if r < 8:  return 7
    if r < 15: return 8
    return 6

def yarrow_physical():
    """Mô phỏng thao tác chia bó 49 cọng. LƯU Ý: phân phối thực nghiệm lệch
    khoảng 1% so với phân phối kinh điển, vì số dư mod 4 của bó chia không
    hoàn toàn đều. Giữ lại để đối chiếu, không dùng làm mặc định."""
    rem = 49
    for _ in range(3):
        left = secrets.randbelow(rem - 1) + 1
        right = rem - left - 1          # quải nhất
        rem -= ((left % 4 or 4) + (right % 4 or 4) + 1)
    return rem // 4

def coin_line():
    """Tam tiền pháp: sấp=3(dương), ngửa=2(âm) → 6/7/8/9."""
    return sum(3 if secrets.randbelow(2) else 2 for _ in range(3))

def cast(method):
    f = {"thi": yarrow_ideal, "thi-vatly": yarrow_physical, "tien": coin_line}[method]
    return [f() for _ in range(6)]      # hào 1 → hào 6

# ---------- Quy tắc biến chiếm (Chu Hy, Dịch Học Khải Mông) ----------
def quy_tac_doc(n_dong, ban, bien, vi_tri_dong):
    if n_dong == 0:
        return "0 hào động — đọc QUÁI TỪ quẻ bản. Không có quẻ biến."
    if n_dong == 1:
        return f"1 hào động — đọc HÀO TỪ hào {vi_tri_dong[0]} của quẻ bản."
    if n_dong == 2:
        return (f"2 hào động — đọc hào từ hào {vi_tri_dong[0]} và {vi_tri_dong[1]} "
                f"của quẻ bản, LẤY HÀO TRÊN ({vi_tri_dong[1]}) làm chủ.")
    if n_dong == 3:
        return ("3 hào động — đọc QUÁI TỪ cả quẻ bản và quẻ biến; "
                "quẻ bản là 'trinh' (tình thế hiện tại), quẻ biến là 'hối' (hệ quả).")
    if n_dong == 4:
        tinh = [i for i in range(1,7) if i not in vi_tri_dong]
        return (f"4 hào động — đọc hào từ 2 hào TĨNH ({tinh[0]}, {tinh[1]}) "
                f"của QUẺ BIẾN, lấy hào dưới ({tinh[0]}) làm chủ.")
    if n_dong == 5:
        tinh = [i for i in range(1,7) if i not in vi_tri_dong][0]
        return f"5 hào động — đọc hào từ hào tĩnh ({tinh}) của QUẺ BIẾN."
    if ban == (1,1,1,1,1,1): return "6 hào động, quẻ Càn — dùng 'Dụng Cửu'."
    if ban == (0,0,0,0,0,0): return "6 hào động, quẻ Khôn — dùng 'Dụng Lục'."
    return "6 hào động — đọc QUÁI TỪ quẻ biến."

def main():
    p = argparse.ArgumentParser()
    p.add_argument("--method", choices=["thi","thi-vatly","tien"], default="thi",
                   help="thi = thệ pháp (phân phối kinh điển); thi-vatly = mô phỏng thao tác chia bó; tien = tam tiền pháp")
    p.add_argument("--question", required=True, help="Câu hỏi, chốt TRƯỚC khi gieo")
    p.add_argument("--dung-than", default="", help="Dụng thần, chốt TRƯỚC khi gieo")
    p.add_argument("--tieu-chi-sai", default="", help="Điều gì xảy ra thì luận đoán này SAI")
    p.add_argument("--manual", default="", help="6 số 6/7/8/9 từ hào 1→6 nếu gieo tay, vd 787969")
    a = p.parse_args()

    if a.manual:
        vals = [int(c) for c in a.manual.strip()]
        if len(vals) != 6 or any(v not in (6,7,8,9) for v in vals):
            print(json.dumps({"error":"manual phải là 6 chữ số thuộc {6,7,8,9}"},
                             ensure_ascii=False)); sys.exit(1)
        nguon = "gieo tay (người dùng nhập)"
    else:
        vals = cast(a.method); nguon = f"script, {a.method}, secrets CSPRNG"

    ban  = tuple(1 if v in (7,9) else 0 for v in vals)
    dong = [i+1 for i,v in enumerate(vals) if v in (6,9)]
    bien = tuple((1-b) if (i+1) in dong else b for i,b in enumerate(ban))

    out = {
        "meta": {
            "cau_hoi": a.question,
            "dung_than_chot_truoc": a.dung_than or "CHƯA CHỐT — phải chốt trước khi luận",
            "tieu_chi_sai": a.tieu_chi_sai or "CHƯA CHỐT — luận đoán này không kiểm chứng được",
            "thoi_diem": datetime.datetime.now().astimezone().isoformat(),
            "phuong_phap": a.method, "nguon_ngau_nhien": nguon,
            "gia_tri_hao_1_den_6": vals,
        },
        "quai_ban": info(ban),
        "hao_dong": dong,
        "quai_bien": info(bien) if dong else None,
        "quai_ho": info(ho_quai(ban)),
        "quai_thac": info(thac_quai(ban)),
        "quai_tong": info(tong_quai(ban)),
        "quy_tac_doc": quy_tac_doc(len(dong), ban, bien, dong),
        "canh_bao": [
            "Nạp giáp / lục thân / thế ứng do script này dựng theo quy tắc; hãy đối chiếu "
            "với một engine đã kiểm thử trước khi dùng cho luận đoán nghiêm túc.",
            "Vượng suy theo nguyệt kiến / nhật thần và tuần không CHƯA được tính ở đây.",
        ],
    }
    print(json.dumps(out, ensure_ascii=False, indent=2))

if __name__ == "__main__":
    main()
