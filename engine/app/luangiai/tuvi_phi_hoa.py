# -*- coding: utf-8 -*-
"""TV-V2 — RULES phi tinh tứ hoá: ghép 48 đường bay (CALC `calc.tuvi_phi_hoa`) với nghĩa KB
(`kb.tuvi_phi_hoa_kb`), chọn ≤ 8 đường nổi bật theo luật công khai. Không gọi LLM, không lưu.

Luật nổi bật (theo thứ tự, mỗi đường bay chỉ một lần):
1. `mau`      — khớp mẫu đường bay trong KB (`mau_duong_bay`: tu_cung / hoa / den_cung, "*" = bất kỳ, "tu" = tự hoá);
                 mẫu cụ thể trước, mỗi mẫu một lần, tối đa 5.
2. `ky_xung`  — Hoá Kỵ (không tự hoá) có cung bị xung là Mệnh, Tài Bạch hoặc Quan Lộc.
3. `loc_nhap` — Hoá Lộc (không tự hoá) bay vào Mệnh, Tài Bạch, Quan Lộc hoặc Điền Trạch.
4. `tu_hoa`   — cung tự hoá.
Lời văn: thuận / cần để ý, kèm việc nên làm + câu tự soi; không con số rủi ro, không mệnh lệnh.
"""
from __future__ import annotations

from app.calc import lunar
from app.calc import tuvi_phi_hoa as ph
from app.kb import tuvi_phi_hoa_kb as kb

CUNG_CHINH = ("Mệnh", "Tài Bạch", "Quan Lộc")
CUNG_LOC = ("Mệnh", "Tài Bạch", "Quan Lộc", "Điền Trạch")
TOI_DA_NOI_BAT = 8
TOI_DA_MAU = 5
# Mảng đời sống của 12 cung — nhãn ngắn để ghép câu mặc định (KB chưa có câu riêng).
MANG = {
    "Mệnh": "bản thân", "Huynh Đệ": "anh chị em, bạn thân", "Phu Thê": "quan hệ đôi lứa",
    "Tử Nữ": "con cái, điều mình tạo ra", "Tài Bạch": "tiền bạc, thu nhập", "Tật Ách": "nhịp sinh hoạt, cách chịu áp lực",
    "Thiên Di": "ra ngoài, môi trường mới", "Nô Bộc": "mạng lưới, đồng nghiệp", "Quan Lộc": "công việc, vai trò",
    "Điền Trạch": "nhà cửa, nơi ở", "Phúc Đức": "đời sống tinh thần", "Phụ Mẫu": "cha mẹ, giấy tờ, học hành",
}
_Y_HOA = {
    "Lộc": "thêm thuận lợi, nguồn lực",
    "Quyền": "thêm chủ động, trách nhiệm",
    "Khoa": "thêm uy tín, sự rõ ràng",
    "Kỵ": "thêm bận tâm, cần chăm chút",
}
_MAC_DINH = {
    "ky_xung": {
        "tieu_de": "Hoá Kỵ từ {tu_cung} chiếu sang {xung_cung}",
        "nghia": "Chuyện {mang_tu} dễ kéo theo bận tâm cho {mang_xung}; đây là chỗ nên làm chậm, rõ ràng hơn.",
        "viec_nen_lam": "Tách bạch việc của cung {tu_cung} với việc của cung {xung_cung}; quyết định lớn nên có thời gian cân nhắc.",
        "cau_tu_soi": "Điều gì thuộc {mang_tu} đang chiếm nhiều tâm trí của mình nhất lúc này?",
    },
    "loc_nhap": {
        "tieu_de": "Hoá Lộc từ {tu_cung} vào {den_cung}",
        "nghia": "Chuyện {mang_tu} có xu hướng mang thuận lợi tới {mang_den}.",
        "viec_nen_lam": "Để ý những cơ hội đến từ {mang_tu} và dùng chúng cho {mang_den}.",
        "cau_tu_soi": "Mình đã tận dụng điều tốt đến từ {mang_tu} chưa?",
    },
    "tu_hoa": {
        "tieu_de": "Cung {tu_cung} tự hoá {hoa}",
        "nghia": "Cung {tu_cung} tự hoá {hoa}: {y_hoa} xuất phát và quay về ngay trong {mang_tu}.",
        "viec_nen_lam": "Quan sát chuyện {mang_tu} có xu hướng tự lên xuống theo nhịp riêng.",
        "cau_tu_soi": "Trong {mang_tu}, điều gì mình tự tạo ra rồi tự nhận lại?",
    },
}
_GHI_CHU_TT = ("Cung đích có Tuần/Triệt (Nam phái): tác dụng của hoá thường được xem là giảm hoặc đến chậm, "
               "không mất hẳn.")
PHAI = {"ten": "Phi tinh tứ hoá",
        "ghi_chu": ("Lớp phi tinh (can cung hoá sao bay sang cung khác) là cách xem của Trung Châu / Khâm Thiên; "
                    "Nam phái lối Việt chủ yếu xem tứ hoá theo can năm sinh, Tuần/Triệt và tam hợp. "
                    "Hai cách trình bày song song, bạn tự đối chiếu.")}
LUU_Y = ["Đường bay tứ hoá cho biết các mảng đời sống tác động lẫn nhau thế nào, không phải lời đoán sự kiện.",
         "Ưu tiên khi đọc: đại hạn > lưu niên > tiểu hạn; đường bay của lá gốc là nền.",
         "Không lưu lá số hay kết quả này."]


def _bien(d: dict) -> dict:
    return {"tu_cung": d["tu_cung"], "den_cung": d["den_cung"] or "", "xung_cung": d["xung_cung"] or "",
            "hoa": d["hoa"], "sao": d["sao"], "can": d["can"], "cung": d["tu_cung"],
            "mang_tu": MANG.get(d["tu_cung"], d["tu_cung"]), "mang_den": MANG.get(d["den_cung"] or "", ""),
            "mang_xung": MANG.get(d["xung_cung"] or "", ""), "y_hoa": _Y_HOA[d["hoa"]]}


def nghia_duong(d: dict) -> str:
    """Câu nghĩa của một đường bay: KB (`tu_hoa_cung` khi tự hoá, `phi_vao_cung` khi bay) → câu mặc định."""
    b = _bien(d)
    if d["tu_hoa"]:
        m = kb.tu_hoa_cung(d["hoa"])
        s = kb.dien(m.get("y") if m else None, **b)
        if s:
            return s
        return kb.dien(_MAC_DINH["tu_hoa"]["nghia"], **b)
    s = kb.dien(kb.phi_vao_cung(d["hoa"], d["den_cung"] or ""), **b)
    if s:
        return s
    return (f"Can {d['can']} của cung {d['tu_cung']} hoá {d['sao']} {d['hoa']}, bay vào cung {d['den_cung']}: "
            f"chuyện {b['mang_tu']} {_Y_HOA[d['hoa']]} cho {b['mang_den']}.")


def _khop(m: dict, d: dict) -> bool:
    def ok(k: str, v) -> bool:
        x = m.get(k, "*")
        return x in ("*", None, "") or x == v
    if m.get("hoa") not in ("*", None, "", d["hoa"]):
        return False
    if not ok("tu_cung", d["tu_cung"]):
        return False
    den = m.get("den_cung", "*")
    if den == "tu":
        return d["tu_hoa"]
    return den in ("*", None, "") or (den == d["den_cung"] and not d["tu_hoa"])


def _noi_bat(loai: str, d: dict, mau: dict | None = None) -> dict:
    b = _bien(d)
    goc = _MAC_DINH.get(loai) or _MAC_DINH["ky_xung" if d["hoa"] == "Kỵ" else "loc_nhap"]
    th = None
    if loai == "tu_hoa":
        th = kb.tu_hoa_cung(d["hoa"])

    def lay(k: str) -> str:
        for nguon in (mau, th):
            s = kb.dien(nguon.get(k) if nguon else None, **b) if nguon else None
            if s and isinstance(s, str):
                return s
        if k == "nghia":
            return nghia_duong(d)
        return kb.dien(goc[k], **b)

    tt = None
    if d["den_tuan_triet"]:
        tt = kb.tuan_triet_ghi_chu() or _GHI_CHU_TT
    return {"loai": loai, "duong": d, "tieu_de": lay("tieu_de"), "nghia": lay("nghia"),
            "viec_nen_lam": lay("viec_nen_lam"), "cau_tu_soi": lay("cau_tu_soi"), "ghi_chu_tuan_triet": tt}


def chon_noi_bat(duong: list[dict]) -> list[dict]:
    ra, da = [], set()

    def them(loai: str, d: dict, mau: dict | None = None) -> None:
        k = (d["tu_cung"], d["hoa"])
        if k in da or len(ra) >= TOI_DA_NOI_BAT or d["den_cung"] is None:
            return
        da.add(k)
        ra.append(_noi_bat(loai, d, mau))

    # Mẫu KB: cụ thể trước ("*" sau), mỗi mẫu dùng một lần, tối đa TOI_DA_MAU để còn chỗ cho luật chung.
    so_mau = 0
    def rong(m: dict) -> int:
        return sum(m.get(k) in ("*", None, "") for k in ("tu_cung", "den_cung"))

    for m in sorted(kb.mau_duong_bay(), key=rong):
        d = next((d for d in duong if _khop(m, d) and (d["tu_cung"], d["hoa"]) not in da), None)
        if d is not None and so_mau < TOI_DA_MAU:
            them("mau", d, m)
            so_mau += 1
    for d in duong:
        if d["hoa"] == "Kỵ" and not d["tu_hoa"] and d["xung_cung"] in CUNG_CHINH:
            them("ky_xung", d)
    for d in duong:
        if d["hoa"] == "Lộc" and not d["tu_hoa"] and d["den_cung"] in CUNG_LOC:
            them("loc_nhap", d)
    for d in duong:
        if d["tu_hoa"]:
            them("tu_hoa", d)
    return ra


def lap(ls: dict, can_nam: str, nam_xem: int | None = None) -> dict:
    """`ls` = hoidap.tuvi.tom_tat(lá số); `can_nam` = can năm sinh (âm lịch dùng để an lá); `nam_xem` = năm âm
    lịch muốn xem tứ hoá lưu niên (tuỳ chọn)."""
    cung = ls["cung"]
    chi_lai = ph.lai_nhan(can_nam)
    c_lai = next((c for c in cung if c["chi"] == chi_lai), None)
    duong = [{**d, "nghia": nghia_duong(d)} for d in ph.phi_hoa(cung)]
    ra = {
        "can_nam_sinh": can_nam,
        "lai_nhan": {"cung": c_lai["ten"] if c_lai else None, "chi": chi_lai,
                     "can": c_lai["can"] if c_lai else ph.ngu_ho_don(can_nam, chi_lai)},
        "cung": [{"ten": c["ten"], "chi": c["chi"], "can": c["can"], "la_menh": c["ten"] == "Mệnh",
                  "la_lai_nhan": c["chi"] == chi_lai} for c in cung],
        "duong_bay": duong,
        "tu_hoa": [d for d in duong if d["tu_hoa"]],
        "vao_menh": [d for d in duong if d["den_cung"] == "Mệnh"],
        "noi_bat": chon_noi_bat(duong),
        "luu_nien": None,
        "phai": PHAI,
        "luu_y": list(LUU_Y),
        "trang_thai": kb.meta()["trang_thai"],
    }
    if nam_xem is not None:
        can, chi = lunar.can_chi_nam(nam_xem)
        ra["luu_nien"] = {"nam": nam_xem, "can_chi": f"{can} {chi}",
                          "hoa": [{"hoa": h["hoa"], "sao": h["sao"], "den_cung": h["den_cung"],
                                   "xung_cung": h["xung_cung"]} for h in ph.phi_tu_can(can, cung)]}
    return ra
