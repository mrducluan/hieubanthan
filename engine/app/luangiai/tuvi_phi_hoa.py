# -*- coding: utf-8 -*-
"""TV-V2 — RULES phi tinh tứ hoá: ghép 48 đường bay (CALC `calc.tuvi_phi_hoa`) với nghĩa KB
(`kb.tuvi_phi_hoa_kb`), chọn ≤ 8 đường nổi bật theo luật công khai. Không gọi LLM, không lưu.

Luật nổi bật (theo thứ tự, mỗi đường bay chỉ một lần):
1. `mau`      — khớp mẫu đường bay trong KB (`mau_duong_bay`: tu_cung / hoa / den_cung, "*" = bất kỳ, "tu" = tự hoá);
                 mẫu cụ thể trước, mỗi mẫu một lần, tối đa 5.
2. `ky_xung`  — Hoá Kỵ (không tự hoá) có cung bị xung là Mệnh, Tài Bạch hoặc Quan Lộc.
3. `loc_nhap` — Hoá Lộc (không tự hoá) bay vào Mệnh, Tài Bạch, Quan Lộc hoặc Điền Trạch.
4. `tu_hoa`   — cung tự hoá.
Lời văn: thuận / cần để ý, kèm việc nên làm + câu tự soi; không con số rủi ro, không mệnh lệnh. Lời người dùng đọc
(tiêu đề, nghĩa, việc nên làm, tự soi) nói bằng tên mảng đời ("chuyện tiền bạc"), theo đúng cặp mảng phát → mảng đích;
tên cung, sao, hoá, can chỉ ở `can_cu` ("Vì sao nói vậy").
"""
from __future__ import annotations

from app.calc import lunar
from app.calc import tuvi_phi_hoa as ph
from app.kb import tuvi_doi_song_kb as kb_ds
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
# Lời mặc định khi KB thiếu ô — đời thường, theo đúng hai mảng của đường bay (không tên cung/sao; thuật ngữ ở căn cứ).
_MAC_DINH = {
    "ky_xung": {
        "tieu_de": "{A_tu} kéo bận tâm sang {ten_xung}",
        "nghia": "{Chu_tu} hay dồn bận tâm vào {chu_den}.",
        "viec_nen_lam": "Khi {chu_tu} đang căng, hoãn quyết định lớn về {chu_xung} vài ngày và nói rõ với người liên quan.",
        "cau_tu_soi": "Điều gì ở {chu_tu} đang chiếm nhiều tâm trí của mình nhất lúc này?",
    },
    # Kỵ bay vào cung đối diện nên chiếu NGƯỢC về chính cung phát (cung phát = cung bị xung).
    "ky_xung_ve": {
        "tieu_de": "{A_tu} vòng qua {ten_den} rồi quay về",
        "nghia": "Bận tâm về {chu_tu} hay lan sang {chu_den}, rồi quay lại làm {chu_tu} thêm rối.",
        "viec_nen_lam": "Với việc thuộc {chu_tu}, làm từng bước và chờ một ngày trước quyết định lớn.",
        "cau_tu_soi": "Điều gì ở {chu_tu} đang chiếm nhiều tâm trí của mình nhất lúc này?",
    },
    "loc_nhap": {
        "tieu_de": "{A_tu} đỡ cho {ten_den}",
        "nghia": "{Chu_tu} có xu hướng mang thuận lợi tới {chu_den}.",
        "viec_nen_lam": "Khi {chu_tu} đang thuận, dành một phần kết quả ấy cho {chu_den}.",
        "cau_tu_soi": "Lần gần nhất {chu_tu} đem điều tốt tới, bạn đã dùng nó vào việc gì?",
    },
    "Quyền": {"tieu_de": "{A_tu} thêm sức cho {ten_den}", "nghia": "{Chu_tu} thêm chủ động, trách nhiệm cho {chu_den}."},
    "Khoa": {"tieu_de": "{A_tu} làm rõ {ten_den}", "nghia": "{Chu_tu} thêm uy tín, sự rõ ràng cho {chu_den}."},
    "tu_hoa": {
        "tieu_de": "{A_tu} tự tác động lên chính mình",
        "nghia": "{O_tu}, điều {y_hoa_ngan} xuất phát rồi quay về ngay trong chính chuyện ấy.",
        "viec_nen_lam": "Ghi lại vài lần {chu_tu} tự tốt lên hay tự rối đi, để thấy phần nào do chính mình tạo ra.",
        "cau_tu_soi": "Ở {chu_tu}, điều gì mình tự tạo ra rồi tự nhận lại?",
    },
}
_Y_HOA_NGAN = {"Lộc": "thuận lợi", "Quyền": "chủ động", "Khoa": "rõ ràng", "Kỵ": "bận tâm"}
_GHI_CHU_TT = ("Cung đích có Tuần/Triệt (Nam phái): tác dụng của hoá thường được xem là giảm hoặc đến chậm, "
               "không mất hẳn.")
PHAI = {"ten": "Phi tinh tứ hoá",
        "ghi_chu": ("Lớp phi tinh (can cung hoá sao bay sang cung khác) là cách xem của Trung Châu / Khâm Thiên; "
                    "Nam phái lối Việt chủ yếu xem tứ hoá theo can năm sinh, Tuần/Triệt và tam hợp. "
                    "Hai cách trình bày song song, bạn tự đối chiếu.")}
LUU_Y = ["Đường bay tứ hoá cho biết các mảng đời sống tác động lẫn nhau thế nào, không phải lời đoán sự kiện.",
         "Ưu tiên khi đọc: đại hạn > lưu niên > tiểu hạn; đường bay của lá gốc là nền.",
         "Không lưu lá số hay kết quả này."]


def ten_mang(cung: str) -> str:
    """Tên đời thường của mảng (KB đời sống: "tiền bạc", "ra ngoài, đi xa"…) — dùng chung với luận giải đời sống."""
    return kb_ds.ten_doi_thuong(cung) or MANG.get(cung, cung.lower())


def _hoa_dau(s: str) -> str:
    return s[:1].upper() + s[1:]


def bien_mang(tu: str, den: str | None = None, xung: str | None = None) -> dict:
    """Biến lời thường của ba mảng một đường bay: {Chu_tu} chủ ngữ ("Chuyện tiền bạc" / "Bản thân bạn"), {chu_tu}
    bổ ngữ ("chuyện tiền bạc" / "việc của chính bạn"), {A_tu} tên ngắn ("Tiền bạc"), {O_tu} mở câu ("Ở chuyện tiền
    bạc" / "Với chính mình"); cung đích / bị chiếu: {chu_den}, {ten_den} ("chính bạn" khi là Mệnh)…"""
    def chu(c: str, phat: bool) -> str:
        if c == "Mệnh":
            return "việc của chính bạn" if phat else "chính bạn"
        return f"chuyện {ten_mang(c)}"

    def ngan(c: str) -> str:            # tên ngắn cho tiêu đề: "ra ngoài, đi xa" → "ra ngoài"
        return ten_mang(c).split(",")[0].strip()

    b = {"Chu_tu": "Bản thân bạn" if tu == "Mệnh" else f"Chuyện {ten_mang(tu)}", "chu_tu": chu(tu, True),
         "A_tu": "Bản thân bạn" if tu == "Mệnh" else _hoa_dau(ngan(tu)),
         "O_tu": "Với chính mình" if tu == "Mệnh" else f"Ở chuyện {ten_mang(tu)}"}
    for k, c in (("den", den), ("xung", xung)):
        if c:
            b[f"chu_{k}"] = chu(c, False)
            b[f"ten_{k}"] = "chính bạn" if c == "Mệnh" else ngan(c)
            b[f"Chu_{k}"] = _hoa_dau(b[f"chu_{k}"])
    return b


def _bien(d: dict) -> dict:
    return {"tu_cung": d["tu_cung"], "den_cung": d["den_cung"] or "", "xung_cung": d["xung_cung"] or "",
            "hoa": d["hoa"], "sao": d["sao"], "can": d["can"], "cung": d["tu_cung"],
            "mang_tu": MANG.get(d["tu_cung"], d["tu_cung"]), "mang_den": MANG.get(d["den_cung"] or "", ""),
            "mang_xung": MANG.get(d["xung_cung"] or "", ""), "y_hoa": _Y_HOA[d["hoa"]],
            "y_hoa_ngan": _Y_HOA_NGAN[d["hoa"]], **bien_mang(d["tu_cung"], d["den_cung"], d["xung_cung"])}


def can_cu_duong(d: dict) -> str:
    """Căn cứ kỹ thuật của một đường bay (chỉ hiện ở "Vì sao nói vậy")."""
    if d["tu_hoa"]:
        return f"Cung {d['tu_cung']} tự hoá {d['hoa']} ({d['sao']}, can {d['can']})"
    return (f"Hoá {d['hoa']} ({d['sao']}, can {d['can']}) từ cung {d['tu_cung']} vào {d['den_cung']}"
            + (f", chiếu {d['xung_cung']}" if d["hoa"] == "Kỵ" and d["xung_cung"] else ""))


def _loi_dich(d: dict, b: dict) -> dict:
    """Lời theo cung đích (KB `phi_vao_cung`), đã điền mảng phát; Kỵ thêm câu cung bị chiếu (KB `ky_chieu`)."""
    m = kb.phi_vao_cung(d["hoa"], d["den_cung"] or "") or {}
    y = kb.dien(m.get("y"), **b)
    if y and d["hoa"] == "Kỵ" and d["xung_cung"]:
        kc = (f"Vướng ở đó rồi quay lại làm {b['chu_tu']} thêm rối." if d["xung_cung"] == d["tu_cung"]
              else kb.dien(kb.ky_chieu(d["xung_cung"]), **b))
        y = f"{y} {kc}" if kc else y
    return {"y": y, "viec_nen_lam": kb.dien(m.get("viec_nen_lam"), **b), "can_cu": m.get("can_cu")}


def nghia_duong(d: dict) -> str:
    """Câu nghĩa đời thường của một đường bay: KB (`tu_hoa_cung` khi tự hoá, `phi_vao_cung` khi bay) → câu mặc định.
    Không chứa tên cung / sao (căn cứ kỹ thuật ở `can_cu_duong`)."""
    b = _bien(d)
    if d["tu_hoa"]:
        m = kb.tu_hoa_cung(d["hoa"])
        s = kb.dien(m.get("y") if m else None, **b)
        return s or kb.dien(_MAC_DINH["tu_hoa"]["nghia"], **b)
    s = _loi_dich(d, b)["y"]
    if s:
        return s
    goc = _MAC_DINH.get(d["hoa"]) or _MAC_DINH["ky_xung" if d["hoa"] == "Kỵ" else "loc_nhap"]
    return kb.dien(goc["nghia"], **b)


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
    """Thẻ đường bay nổi bật: tiêu đề, nghĩa, việc nên làm, câu tự soi bằng lời thường theo đúng HAI mảng của đường
    bay; tên cung, sao, hoá chỉ ở `can_cu`. Mẫu KB có "*" ở cung phát (`theo_cung_phat`) lấy lời theo cung phát."""
    b = _bien(d)
    if mau and isinstance(mau.get("theo_cung_phat"), dict):
        rieng = mau["theo_cung_phat"].get(d["tu_cung"])
        mau = {**mau, **rieng} if isinstance(rieng, dict) else mau
    if loai == "tu_hoa":
        goc = _MAC_DINH["tu_hoa"]
    elif d["hoa"] == "Kỵ":
        goc = _MAC_DINH["ky_xung_ve" if d["xung_cung"] == d["tu_cung"] else "ky_xung"]
    else:
        goc = {**_MAC_DINH["loc_nhap"], **_MAC_DINH.get(d["hoa"], {})}
    th = kb.tu_hoa_cung(d["hoa"]) if d["tu_hoa"] else None
    dich = _loi_dich(d, b) if not d["tu_hoa"] else {}
    th_ = {**(th or {}), "nghia": (th or {}).get("y")}

    def lay(k: str) -> str:
        nguon = [mau, th_ if th else None, {"nghia": dich.get("y"), "viec_nen_lam": dich.get("viec_nen_lam")}]
        for n in nguon:
            s = kb.dien(n.get(k), **b) if n else None
            if s and isinstance(s, str):
                return s
        return kb.dien(goc[k], **b) or ""

    tt = None
    if d["den_tuan_triet"]:
        tt = kb.tuan_triet_ghi_chu() or _GHI_CHU_TT
    cu = [can_cu_duong(d)] + [x for x in ((mau or {}).get("can_cu"), dich.get("can_cu")) if isinstance(x, str) and x]
    return {"loai": loai, "duong": d, "ma_mau": (mau or {}).get("ma") or None,
            "tieu_de": lay("tieu_de"), "nghia": lay("nghia"),
            "viec_nen_lam": lay("viec_nen_lam"), "cau_tu_soi": lay("cau_tu_soi"), "ghi_chu_tuan_triet": tt,
            "can_cu": list(dict.fromkeys(cu))}


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
