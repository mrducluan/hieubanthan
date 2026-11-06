# -*- coding: utf-8 -*-
"""Tầng CALC — Nhân tướng học (NT-1): hàm thuần, tất định, cùng đầu vào ra cùng kết quả. Không LLM, không DB.

Đầu vào duy nhất của mảng là ĐIỀU NGƯỜI DÙNG TỰ QUAN SÁT (`tra_loi` = {mã câu: mã lựa chọn} — khảo sát trong KB), cộng
tuỳ chọn các điểm người dùng tự chấm trên ảnh của họ (ảnh không rời máy; web chỉ gửi toạ độ đã chuẩn hoá). Ở đây:
  * `khop_dac_diem`: ghép luật (đặc điểm KB) theo điều kiện VÀ trên các câu trả lời;
  * `ngu_hinh`: xếp dáng mặt theo năm hành bằng bảng điểm công khai trong KB (trội ≥ 2 và hơn hành nhì ≥ 1, không thì "pha");
  * `luu_nien`: 100 vị trí theo tuổi mụ, nam tả nữ hữu (cặp trái/phải đổi bên cho nữ);
  * `tam_dinh_tu_diem`: tỉ lệ ba đình từ 4 điểm (chân tóc, ấn đường, đầu mũi, cằm) → mã lựa chọn của câu `tam_dinh`;
  * `gop_muc`: mức chung của một nhóm đặc điểm (không điểm số: đếm thuận / cần lưu ý).
"""
from __future__ import annotations

from app.kb import nhan_tuong_kb as kb

MUC = ("thuan", "can_bang", "can_chu_dong")
NGUONG_LECH_TAM_DINH = 0.04       # lệch quá 4 điểm phần trăm so với 1/3 mới gọi là "dài / ngắn rõ"


def tra_loi_sach(tra_loi: dict | None) -> dict[str, str]:
    """Chỉ giữ cặp (câu có thật, lựa chọn có thật); bỏ "khong_chac"."""
    ch = kb.cau_hoi_theo_ma()
    ra: dict[str, str] = {}
    for q, a in (tra_loi or {}).items():
        c = ch.get(str(q))
        if not c or not isinstance(a, str) or a == "khong_chac":
            continue
        if any(l["ma"] == a for l in c["lua_chon"]):
            ra[str(q)] = a
    return ra


def khop_dac_diem(tra_loi: dict | None) -> list[str]:
    """Mã đặc điểm khớp — xếp theo `uu_tien` giảm dần rồi theo thứ tự KB (tất định). Điều kiện: MỌI câu phải có trả lời
    thuộc danh sách lựa chọn; thiếu câu = không khớp (bảo thủ)."""
    tl = tra_loi_sach(tra_loi)
    ra = []
    for i, (ma, dd) in enumerate(kb.dac_diem().items()):
        dk = dd.get("dieu_kien") or {}
        if dk and all(tl.get(q) in opts for q, opts in dk.items()):
            ra.append((-(dd.get("uu_tien") or 1), i, ma))
    return [m for _, _, m in sorted(ra)]


def ngu_hinh(tra_loi: dict | None) -> dict:
    """{hinh, diem: {kim..tho}, troi: [hành trội theo thứ tự], can_cu: [câu đã tính]}. Điểm theo KB `ngu_hinh_luat`."""
    tl = tra_loi_sach(tra_loi)
    diem = {h: 0 for h in ("kim", "moc", "thuy", "hoa", "tho")}
    can_cu = []
    for q, bang in kb.ngu_hinh_luat().items():
        h = bang.get(tl.get(q, ""))
        if h in diem:
            diem[h] += 1
            can_cu.append(q)
    xep = sorted(diem.items(), key=lambda kv: (-kv[1], ("kim", "moc", "thuy", "hoa", "tho").index(kv[0])))
    nhat, nhi = xep[0], xep[1]
    hinh = nhat[0] if nhat[1] >= 2 and nhat[1] - nhi[1] >= 1 else "pha"
    return {"hinh": hinh, "diem": diem, "troi": [h for h, d in xep if d > 0][:2], "can_cu": can_cu}


def luu_nien(tuoi_mu: int, gioi_tinh: str | None) -> dict | None:
    """Vị trí lưu niên của một tuổi mụ (1..100; > 100 lặp chu kỳ 100). Nữ: cặp trái/phải đổi bên ("nam tả nữ hữu")."""
    if tuoi_mu < 1:
        return None
    t = ((tuoi_mu - 1) % 100) + 1
    for x in kb.luu_nien():
        if x["tuoi"] == t:
            ben = x["ben"]
            if gioi_tinh == "nu" and ben in ("trai", "phai"):
                ben = "phai" if ben == "trai" else "trai"
            return {"tuoi": tuoi_mu, "vi": t, "ten": x["ten"], "bo_vi": x["bo_vi"], "ben": ben}
    return None


def tam_dinh_tu_diem(diem: dict) -> dict | None:
    """`diem` = {chan_toc, an_duong, chuan_dau, cam: {x, y}} toạ độ chuẩn hoá 0..1 trên ảnh người dùng (ảnh KHÔNG gửi).
    Trả {thuong, trung, ha (tỉ lệ), lech_max, lua_chon} — `lua_chon` là mã của câu `tam_dinh` để điền sẵn khảo sát.
    Thứ tự điểm phải đi từ trên xuống (y tăng); sai thứ tự → None."""
    try:
        y = [float(diem[k]["y"]) for k in ("chan_toc", "an_duong", "chuan_dau", "cam")]
    except (KeyError, TypeError, ValueError):
        return None
    if not (y[0] < y[1] < y[2] < y[3]):
        return None
    d = [y[1] - y[0], y[2] - y[1], y[3] - y[2]]
    tong = sum(d)
    if tong <= 0:
        return None
    r = [round(v / tong, 4) for v in d]
    lech = [v - 1 / 3 for v in r]
    i_max = max(range(3), key=lambda i: lech[i])
    i_min = min(range(3), key=lambda i: lech[i])
    lech_max = round(max(abs(v) for v in lech), 4)
    if lech_max <= NGUONG_LECH_TAM_DINH:
        lua = "can_doi"
    elif lech[i_max] >= -lech[i_min] or i_min == 1:
        # Phần giữa ngắn nhất: khảo sát không có "mũi ngắn" → gọi tên phần ngoài dài hơn (trán / cằm), không bao giờ "mui_dai".
        lua = ("tran_dai", "mui_dai", "cam_dai")[i_max]
    else:
        lua = ("tran_ngan", "mui_dai", "cam_ngan")[i_min]
    return {"thuong": r[0], "trung": r[1], "ha": r[2], "lech_max": lech_max, "lua_chon": lua}


def gop_muc(ds: list[str | None]) -> str | None:
    """Mức chung của một nhóm đặc điểm (bỏ None): toàn thuận → thuận; có cần lưu ý nhiều hơn thuận → cần lưu ý; còn lại
    cân bằng. Không điểm số."""
    ds2 = [m for m in ds if m in MUC]
    if not ds2:
        return None
    thuan = sum(1 for m in ds2 if m == "thuan")
    chu_dong = sum(1 for m in ds2 if m == "can_chu_dong")
    if chu_dong == 0 and thuan == len(ds2):
        return "thuan"
    if chu_dong > thuan:
        return "can_chu_dong"
    return "can_bang"
