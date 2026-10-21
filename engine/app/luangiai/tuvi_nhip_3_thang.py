# -*- coding: utf-8 -*-
"""TV-V2 — RULES "Nhịp 3 tháng tới": tháng âm hiện tại + 2 tháng sau (có thể vắt sang năm âm sau).

Dùng lại lưu nguyệt (`luangiai.tuvi_luu_nguyet.lap_nam`, theo phái người dùng chọn — không tính lại cung tháng)
và tứ hoá lưu niên (`calc.tuvi_an_sao.van_han`). Không gọi LLM, không lưu.

Luật công khai (mỗi tháng):
- chong_ky            Kỵ tháng cùng trục (đích hoặc xung) với Kỵ năm                    → cần thận trọng
- ky_xung_cung_chinh  Kỵ tháng xung Mệnh / Tài Bạch / Quan Lộc                          → cần thận trọng
- loc_nhap_cung_chinh Lộc tháng vào Mệnh / Tài Bạch / Quan Lộc / Điền Trạch            → thuận
- song_loc            Lộc tháng và Lộc năm cùng cung                                    → thuận
- khoa_giai           Khoa tháng vào cung đang chồng Kỵ                                 → thêm lý do, không đổi mức
Có lý do "cần thận trọng" → can_than; không thì có lý do "thuận" → thuan; còn lại binh.
Ưu tiên khi mâu thuẫn: đại hạn > lưu niên > tiểu hạn > lưu nguyệt (tháng chỉ tô thêm màu).

NHIP-2 (2026-10-21) — lời từng tháng dựng từ dữ kiện RIÊNG của tháng (trước đây chỉ theo 3 mức → ba tháng "Bình"
ra cùng một câu). KB `tuvi_phi_hoa_kb.json` → `nhip_3_thang`:
- tiêu đề kết luận (`tieu_de_thang`) = `cung_thang[tiêu điểm].muc[mức].ket_luan`; tiêu điểm: thuận → cung Lộc tháng,
  cần thận trọng → cung bị Kỵ tháng chiếu (Mệnh/Tài/Quan) hoặc cung Kỵ tháng, bình → cung tháng;
- hộp "Điểm sáng" = `loc_dich[cung Lộc]` (+ song Lộc, Lộc vào cung tháng, Quyền/Khoa chạm cung tháng / cung chính);
- hộp "Nên để ý" = `ky_dich[cung Kỵ]` + hướng xử lý (+ `ky_xung`, chồng Kỵ, Khoa giải);
- hộp "Nên làm" = `cung_thang[cung tháng].muc[mức]` (+ câu ưu tiên khi cung tháng trùng cung đại hạn / lưu niên /
  tiểu hạn của năm); tự soi theo cung tháng (2 câu, câu thứ hai khi cung lặp lại trong khung).
- Tháng liền sau có cùng cung + cùng can chi (tháng nhuận) → lời "nối dài nhịp tháng trước" (`noi_tiep`).
Thuật ngữ (tên sao, cung, tứ hoá, luật) chỉ ở `can_cu` ("Vì sao nói vậy"). Mã kiểm chứng (`muc` + `ly_do`) giữ nguyên.
"""
from __future__ import annotations

import datetime as dt

from app import config
from app.calc import lunar, tuvi_an_sao as az, tuvi_luu_nguyet as ln
from app.kb import tuvi_phi_hoa_kb as kb
from app.luangiai import tuvi_luu_nguyet as luan_ln
from app.luangiai.tuvi_phi_hoa import CUNG_CHINH, CUNG_LOC, MANG

HOA = ("Lộc", "Quyền", "Khoa", "Kỵ")
NHAN_MUC = {"thuan": "Thuận", "binh": "Bình", "can_than": "Cần thận trọng"}
_LY_DO = {
    "chong_ky": "Hoá Kỵ của tháng ({sao}) rơi vào trục cung {cung}, nơi Hoá Kỵ của năm đã ở hoặc chiếu tới: "
                "chuyện thuộc cung này dễ dồn lại, nên làm chậm và rõ ràng.",
    "ky_xung_cung_chinh": "Hoá Kỵ của tháng ({sao}) chiếu sang cung {cung}: chuyện {mang} cần chăm chút hơn.",
    "loc_nhap_cung_chinh": "Hoá Lộc của tháng ({sao}) vào cung {cung}: {mang} có thêm thuận lợi.",
    "song_loc": "Lộc của tháng và Lộc của năm cùng ở cung {cung}: thuận lợi cộng hưởng cho {mang}.",
    "khoa_giai": "Hoá Khoa của tháng ({sao}) cũng vào cung {cung}: có thêm sự rõ ràng, người hỗ trợ để gỡ dần.",
}
THU_TU_UU_TIEN = ["dai_han", "luu_nien", "tieu_han", "luu_nguyet"]
LUU_Y = ["Mức Thuận / Bình / Cần thận trọng là xu hướng theo luật tứ hoá công khai, không phải lời đoán sự kiện.",
         "Lưu nguyệt có nhiều phái; kết quả theo phái bạn đang chọn trong khung Trường phái.",
         "Không lưu lá số hay kết quả này."]

# ---------------------------------------------------------------- NHIP-2: lời từng tháng
HOP_NHAN = {"diem_manh": "Điểm sáng", "luu_y": "Nên để ý", "loi_khuyen": "Nên làm"}
_TEN_LOP = {"dai_han": "đại hạn", "luu_nien": "lưu niên", "tieu_han": "tiểu hạn"}
# Mặc định khi KB thiếu khoá — ghép từ nhãn mảng đời sống (MANG), vẫn khác nhau theo cung.
_MAC = {
    "ket_luan": {"thuan": "Tháng thuận cho chuyện {mang}", "binh": "Tháng đều nhịp, hợp lo chuyện {mang}",
                 "can_than": "Tháng nên đi chậm ở chuyện {mang}"},
    "viec": {"thuan": "Chủ động với chuyện {mang}", "binh": "Giữ nhịp đều với chuyện {mang}",
             "can_than": "Làm chậm, rõ ràng với chuyện {mang}"},
    "nen_lam": {"thuan": "Hợp bắt đầu việc đã chuẩn bị ở chuyện {mang}, chủ động gặp người cần gặp.",
                "binh": "Làm đều tay việc đang có ở chuyện {mang}, dọn bớt việc tồn.",
                "can_than": "Rà soát kỹ chuyện {mang}, để dư thời gian, hỏi thêm ý kiến trước việc lớn."},
    "tu_soi": ["Điều gì về chuyện {mang} bạn muốn chăm hơn trong tháng này?",
               "Với chuyện {mang}, việc nhỏ nào làm xong là bạn nhẹ người?"],
    "chu_de": "Tháng này bạn hay để tâm tới chuyện {mang}.",
    "loc": {"tieu_de": "Thuận cho chuyện {mang}", "noi_dung": "Chuyện {mang} có thêm thuận lợi, dễ gặp người giúp."},
    "ky": {"tieu_de": "Chuyện {mang} cần chăm chút", "noi_dung": "Chuyện {mang} dễ cần nhiều công sức hơn dự tính.",
           "huong_xu_ly": "Làm từng bước, để dư thời gian, hỏi thêm ý kiến trước việc lớn."},
    "ky_xung": "Việc này dễ kéo theo bận tâm cho chuyện {mang}.",
    "quyen": "bạn có tiếng nói hơn ở chuyện {mang}",
    "khoa": "chuyện {mang} dễ rõ ràng, có người giúp",
}
_BO_SUNG_MAC_DINH = {
    "song_loc": "Năm nay chuyện này vốn đã thuận, tháng này thuận thêm một lớp.",
    "loc_vao_thang": "Điều tốt rơi đúng vào chuyện chính của tháng nên dễ thấy rõ.",
    "chong_ky": "Chuyện này năm nay vốn đã cần để ý, tháng này dồn thêm một lớp.",
    "ky_vao_thang": "Đây cũng là chuyện chính của tháng nên sức ép dễ thấy rõ hơn.",
    "khoa_giai": "Có người hiểu chuyện sẵn lòng giúp nếu bạn mở lời hỏi.",
    "loc_ky_cung": "Điều vui và điều lo cùng đến từ một chuyện: được thêm thì cũng phải lo thêm.",
    "lap_lai_loc": "Điều thuận này nối tiếp từ tháng trước.",
    "lap_lai_ky": "Chuyện này đã cần để ý từ tháng trước; tháng này nên làm cho xong phần còn dở.",
    "trung_dai_han": "Đây cũng là chuyện chính của cả chặng mười năm bạn đang đi, nên việc làm tháng này có sức "
                     "nặng hơn.",
    "trung_luu_nien": "Đây cũng là chuyện chính của năm nay, nên việc làm tháng này có sức nặng hơn.",
    "trung_tieu_han": "Đây cũng là một chuyện riêng của năm nay, nên làm kỹ hơn thường lệ.",
    "cung_lap": "Chuyện chính vẫn như tháng trước, nên làm tiếp cho trọn thay vì mở việc mới.",
    "chon_thang": "Cần chọn một tháng để bắt đầu việc mới thì ưu tiên {thang}.",
    "khong_thuan": "Chưa có tháng nào nổi bật thuận; cần bắt đầu việc gì thì {thang} nhẹ nhàng hơn, nhất là chuyện "
                   "{mang}.",
    "ca_ba_can_than": "Cả ba tháng đều nên đi chậm; {thang} đỡ vướng hơn cả, chỗ có thể nhích lên là chuyện {mang}.",
    "khong_diem_sang": "Chưa có tháng nào nổi bật thuận; {thang} ít vướng nhất, hợp làm nốt việc đang dở.",
    "tieu_de_tiep": "{ket_luan}, nối tiếp tháng trước",
    "them": "Thêm nữa, {cau}.",
}
_NOI_TIEP_MAC_DINH = {
    "ket_luan": "Tháng nối dài nhịp của tháng trước",
    "viec": "Làm nốt việc của tháng trước",
    "nen_lam": "Khoảng thời gian này đi lại đúng nhịp của tháng liền trước. Dùng nó để làm cho xong việc đang dở, "
               "chưa cần mở việc mới.",
    "tu_soi": "Việc gì từ tháng trước bạn muốn làm cho xong trong khoảng thời gian thêm này?",
}
_GIAI_MUC = {
    "thuan": "Mức Thuận: Lộc tháng vào Mệnh / Tài Bạch / Quan Lộc / Điền Trạch hoặc trùng cung Lộc năm, "
             "và không có luật cần thận trọng nào.",
    "can_than": "Mức Cần thận trọng: Kỵ tháng cùng trục với Kỵ năm hoặc chiếu Mệnh / Tài Bạch / Quan Lộc "
                "(luật cần thận trọng thắng luật thuận).",
    "binh": "Mức Bình: Lộc tháng không vào Mệnh / Tài Bạch / Quan Lộc / Điền Trạch và không trùng Lộc năm; Kỵ tháng "
            "không chiếu Mệnh / Tài Bạch / Quan Lộc và không cùng trục Kỵ năm.",
}


def _chuoi(x) -> str | None:
    return x if isinstance(x, str) and x.strip() else None


def _bo_sung(ma: str, **bien) -> str:
    return kb.dien(_chuoi(kb.nhip_lay("bo_sung", ma)) or _BO_SUNG_MAC_DINH[ma], **bien)


def _noi_tiep(ma: str) -> str:
    return _chuoi(kb.nhip_lay("noi_tiep", ma)) or _NOI_TIEP_MAC_DINH[ma]


def _cung_muc(cung: str, muc: str, khoa: str) -> str:
    return (_chuoi(kb.nhip_lay("cung_thang", cung, "muc", muc, khoa))
            or _MAC[khoa][muc].replace("{mang}", MANG.get(cung, cung)))


def _nhan_ngan(cung: str) -> str:
    return (_chuoi(kb.nhip_lay("cung_thang", cung, "nhan_ngan"))
            or MANG.get(cung, cung).split(",")[0].strip().capitalize())


def _chu_de(cung: str) -> str:
    return _chuoi(kb.nhip_lay("cung_thang", cung, "chu_de")) or _MAC["chu_de"].replace("{mang}", MANG.get(cung, cung))


def _tu_soi(cung: str, lan: int) -> str:
    ds = kb.nhip_lay("cung_thang", cung, "tu_soi")
    ds = [s for s in ds if _chuoi(s)] if isinstance(ds, list) else []
    ds = ds or [s.replace("{mang}", MANG.get(cung, cung)) for s in _MAC["tu_soi"]]
    return ds[lan % len(ds)]


def _theo_cung(nhom: str, cung: str, mac: str) -> dict:
    """loc_dich / ky_dich: {tieu_de, noi_dung, huong_xu_ly?} — trường thiếu lấy mặc định ghép từ MANG."""
    x = kb.nhip_lay(nhom, cung)
    x = x if isinstance(x, dict) else {}
    return {k: _chuoi(x.get(k)) or v.replace("{mang}", MANG.get(cung, cung)) for k, v in _MAC[mac].items()}


def _cau(nhom: str, cung: str, mac: str) -> str:
    return _chuoi(kb.nhip_lay(nhom, cung)) or _MAC[mac].replace("{mang}", MANG.get(cung, cung))


def nhan_thang(t: dict) -> str:
    """"tháng 9" · "tháng 6 nhuận" · "nửa đầu tháng 6 nhuận" — chữ thường, để ghép giữa câu."""
    s = f"tháng {t['thang']}" + (" nhuận" if t["nhuan"] else "")
    return {"nua_dau": "nửa đầu ", "nua_sau": "nửa sau "}.get(t["phan"], "") + s


def _hoa_chuoi(ds: list[dict]) -> str:
    return " · ".join(f"{x['hoa']} {x['sao']} ({x['cung_goc'] or 'sao không có trên lá'})" for x in ds)


def dien_giai_thang(t: dict, th: list[dict], nam: dict, muc: str, ly: list[dict], ly_do: list[dict],
                    ten_phai: str, truoc: list[dict]) -> dict:
    """Lời một tháng từ dữ kiện riêng của tháng. `t` = tháng của `lap_nam` (cung_goc, chi, chinh_tinh, trung,
    can_chi, thang_tinh…); `th` = tứ hoá tháng; `nam` = tứ hoá lưu niên của năm chứa tháng; `ly` = lý do thô của
    `xep_muc`, `ly_do` = lý do đã thành câu; `truoc` = các tháng đứng trước trong khung (đã dựng)."""
    cung = t["cung_goc"]
    hoa = {x["hoa"]: x for x in th}
    loc, quyen, khoa, ky = (hoa[h]["cung_goc"] if h in hoa else None for h in HOA)
    ma = {x["ma"] for x in ly}
    ky_x = next((x["cung"] for x in ly if x["ma"] == "ky_xung_cung_chinh"), None)
    tieu_diem = loc if muc == "thuan" else (ky_x or ky) if muc == "can_than" else cung
    tieu_diem = tieu_diem or cung
    sau = truoc[-1] if truoc else None
    noi_tiep = bool(sau) and (sau["cung_goc"], sau["can_chi"]) == (cung, t["can_chi"])
    lan_cung = sum(1 for p in truoc if p["cung_goc"] == cung)
    ly_cau = {x["ma"]: x["noi_dung"] for x in ly_do}

    hop: list[dict] = []
    if loc:
        v = _theo_cung("loc_dich", loc, "loc")
        nd = [v["noi_dung"]]
        cu = [f"Hoá Lộc tháng {t['can_chi']}: {hoa['Lộc']['sao']} ở cung {loc}."]
        if "song_loc" in ma:
            nd.append(_bo_sung("song_loc"))
            cu.append(ly_cau["song_loc"])
        if loc == cung:
            nd.append(_bo_sung("loc_vao_thang"))
            cu.append(f"Lộc tháng rơi đúng cung tháng ({cung}).")
        if "loc_nhap_cung_chinh" in ma:
            cu.append(ly_cau["loc_nhap_cung_chinh"])
        gan = (cung, *CUNG_CHINH)
        for h, c, mac in (("Quyền", quyen, "quyen"), ("Khoa", khoa, "khoa")):
            if c and c in gan:
                nd.append(_bo_sung("them", cau=_cau(f"{mac}_dich", c, mac)))
                cu.append(f"Hoá {h} tháng: {hoa[h]['sao']} ở cung {c}.")
                break
        if sau and sau.get("diem_sang") == loc and not noi_tiep:
            nd.insert(0, _bo_sung("lap_lai_loc"))
        hop.append({"loai": "diem_manh", "nhan": HOP_NHAN["diem_manh"], "tieu_de": v["tieu_de"],
                    "noi_dung": " ".join(nd), "can_cu": cu, "cung": loc})
    if ky:
        v = _theo_cung("ky_dich", ky, "ky")
        nd = [v["noi_dung"]]
        cu = [f"Hoá Kỵ tháng {t['can_chi']}: {hoa['Kỵ']['sao']} ở cung {ky}"
              + (f", chiếu sang {ky_x}." if ky_x else ".")]
        if ky_x:
            nd.append(_cau("ky_xung", ky_x, "ky_xung"))
            cu.append(ly_cau["ky_xung_cung_chinh"])
        if "chong_ky" in ma:
            nd.append(_bo_sung("chong_ky"))
            cu.append(ly_cau["chong_ky"])
        if ky == cung:
            nd.append(_bo_sung("ky_vao_thang"))
            cu.append(f"Kỵ tháng rơi đúng cung tháng ({cung}).")
        if ky == loc:
            nd.append(_bo_sung("loc_ky_cung"))
            cu.append(f"Lộc và Kỵ của tháng cùng ở cung {ky}.")
        huong = v["huong_xu_ly"]
        if "khoa_giai" in ma:
            huong = f"{huong} {_bo_sung('khoa_giai')}"
            cu.append(ly_cau["khoa_giai"])
        if sau and sau.get("de_y") == ky and not noi_tiep:
            nd.insert(0, _bo_sung("lap_lai_ky"))
        hop.append({"loai": "luu_y", "nhan": HOP_NHAN["luu_y"], "tieu_de": v["tieu_de"], "noi_dung": " ".join(nd),
                    "huong_xu_ly": huong, "can_cu": cu, "cung": ky})

    lop = next((l for l in ("dai_han", "luu_nien", "tieu_han") if l in (t.get("trung") or [])), None)
    cu_lk = [f"Cung tháng {cung} ({t['chi']}), mức {NHAN_MUC[muc]}."]
    if noi_tiep:
        viec, nen = _noi_tiep("viec"), _noi_tiep("nen_lam")
        cu_lk.append("Cùng cung tháng và cùng can chi với tháng liền trước → tứ hoá như nhau, đọc như phần nối dài.")
    else:
        viec, nen = _cung_muc(cung, muc, "viec"), _cung_muc(cung, muc, "nen_lam")
        if lan_cung:
            nen = f"{nen} {_bo_sung('cung_lap')}"
            cu_lk.append("Cung tháng lặp lại cung của tháng trước trong khung ba tháng.")
        if lop:
            nen = f"{nen} {_bo_sung('trung_' + lop)}"
            cu_lk.append(f"Cung tháng trùng cung {_TEN_LOP[lop]} của năm — ưu tiên: đại hạn > lưu niên > tiểu hạn "
                         "> lưu nguyệt.")
    hop.append({"loai": "loi_khuyen", "nhan": HOP_NHAN["loi_khuyen"], "tieu_de": viec, "noi_dung": nen,
                "can_cu": cu_lk, "cung": cung})

    da_co = {p["tieu_de_thang"] for p in truoc}
    tieu_de = _noi_tiep("ket_luan") if noi_tiep else _cung_muc(tieu_diem, muc, "ket_luan")
    if tieu_de in da_co:
        tieu_de = _cung_muc(cung, muc, "ket_luan")
    if tieu_de in da_co:
        tieu_de = _bo_sung("tieu_de_tiep", ket_luan=tieu_de)
    tu_soi = _noi_tiep("tu_soi") if noi_tiep else _tu_soi(cung, lan_cung)
    if tu_soi in {p["cau_tu_soi"] for p in truoc}:
        tu_soi = _tu_soi(cung, lan_cung + 1)

    can_cu = [f"Cung tháng (lưu nguyệt, phái {ten_phai}): {cung} ({t['chi']}).",
              ("Chính tinh ở cung tháng: " + ", ".join(
                  f"{s['ten']} ({s['do_sang']})" if s.get("do_sang") else s["ten"] for s in t["chinh_tinh"]) + "."
               if t.get("chinh_tinh") else "Cung tháng không có chính tinh (vô chính diệu)."),
              f"Tứ hoá tháng {t['can_chi']}: {_hoa_chuoi(th)}.",
              f"Tứ hoá năm {nam['can_chi']}: {_hoa_chuoi(nam['tu_hoa'])}."]
    if t["phan"] == "nua_sau":
        so = t["thang_tinh"] % 12 or 12
        can_cu.append(f"Nửa sau tháng nhuận tính như tháng {so}: cả cung tháng lẫn can chi tháng (lựa chọn "
                      "\"tính tháng sau\" trong khung Trường phái).")
    can_cu += [x["noi_dung"] for x in ly_do]
    can_cu.append(_GIAI_MUC[muc])
    can_cu += cu_lk[1:]
    return {"nhan_thang": nhan_thang(t)[:1].upper() + nhan_thang(t)[1:], "tieu_de_thang": tieu_de,
            "chu_de_thang": _chu_de(cung), "tieu_diem": tieu_diem, "diem_sang": loc, "de_y": ky,
            "noi_tiep": noi_tiep, "hop": hop, "goi_y": nen, "cau_tu_soi": tu_soi, "can_cu": can_cu}


def tom_tat_ba_thang(ds: list[dict]) -> str:
    """Một câu so ba tháng: "Tháng 9 thuận cho công việc; tháng 10 …; tháng 11 …." + tháng nên chọn để bắt đầu."""
    phan = []
    for t in ds:
        kl = t["tieu_de_thang"]
        than = kl[len("Tháng "):] if kl.startswith("Tháng ") else kl[:1].lower() + kl[1:]
        phan.append(f"{nhan_thang(t)} {than}")
    s = "; ".join(phan)
    s = s[:1].upper() + s[1:] + "."
    thuan = [t for t in ds if t["muc"] == "thuan"]
    if thuan:
        return f"{s} {_bo_sung('chon_thang', thang=nhan_thang(thuan[0]))}"
    # Không tháng nào thuận: chỉ ra tháng nhẹ nhất (Bình trước Cần thận trọng, rồi tháng sớm hơn) + mảng có Lộc tháng.
    hang = sorted(ds, key=lambda t: (t["muc"] != "binh", t.get("diem_sang") is None))
    t = hang[0]
    if not t.get("diem_sang"):
        return f"{s} {_bo_sung('khong_diem_sang', thang=nhan_thang(t))}"
    ma = "khong_thuan" if t["muc"] == "binh" else "ca_ba_can_than"
    return f"{s} {_bo_sung(ma, thang=nhan_thang(t), mang=MANG.get(t['diem_sang'], t['diem_sang']))}"


def xep_muc(thang: dict, nam: dict, xung: dict) -> tuple[str, list[dict]]:
    """`thang`, `nam`: {hoa: cung_goc} của tứ hoá tháng / năm; `xung`: {cung: cung đối diện}.
    → (muc, [{"ma", "sao"?, "cung"}]) theo luật công khai ở đầu module."""
    ly: list[dict] = []
    ky_t, ky_n = thang.get("Kỵ"), nam.get("Kỵ")
    loc_t, loc_n, khoa_t = thang.get("Lộc"), nam.get("Lộc"), thang.get("Khoa")
    chong = bool(ky_t and ky_n and ky_t in (ky_n, xung.get(ky_n)))
    if chong:
        ly.append({"ma": "chong_ky", "hoa": "Kỵ", "cung": ky_t})
    if ky_t and xung.get(ky_t) in CUNG_CHINH:
        ly.append({"ma": "ky_xung_cung_chinh", "hoa": "Kỵ", "cung": xung[ky_t]})
    if chong and khoa_t and khoa_t in (ky_t, ky_n):
        ly.append({"ma": "khoa_giai", "hoa": "Khoa", "cung": khoa_t})
    if loc_t and loc_t in CUNG_LOC:
        ly.append({"ma": "loc_nhap_cung_chinh", "hoa": "Lộc", "cung": loc_t})
    if loc_t and loc_t == loc_n:
        ly.append({"ma": "song_loc", "hoa": "Lộc", "cung": loc_t})
    ma = {x["ma"] for x in ly}
    if ma & {"chong_ky", "ky_xung_cung_chinh"}:
        return "can_than", ly
    if ma & {"loc_nhap_cung_chinh", "song_loc"}:
        return "thuan", ly
    return "binh", ly


def _tz_xem(sinh: dict) -> float:
    return az.TZ_TRUNG if sinh.get("lich", "viet") == "trung" else config.CALENDAR_MERIDIAN_TZ


def _tu_hoa_nam(sinh: dict, nam_am: int, ls: dict) -> dict:
    """Tứ hoá lưu niên (iztro horoscope.yearly.mutagen, qua van_han) đặt lên cung gốc."""
    d, m, y = lunar.lunar_to_solar(1, 7, nam_am, 0, _tz_xem(sinh))        # giữa năm âm, như lap_nam
    vh = az.van_han(sinh["ngay"], sinh["ti"], sinh["gioi_tinh"], dt.date(y, m, d),
                    tz_lich=sinh.get("tz_lich", config.CALENDAR_MERIDIAN_TZ),
                    thang_nhuan=sinh.get("thang_nhuan", "thang_sau"), lich=sinh.get("lich", "viet"))
    can, chi = lunar.can_chi_nam(nam_am)
    ra = []
    for hoa, sao in zip(HOA, vh["luu_nien"]["tu_hoa"]):
        noi = next((c for c in ls["cung"] if sao in [s["ten"] for s in c["chinh_tinh"]] or sao in c["phu_tinh"]),
                   None)
        ra.append({"hoa": hoa, "sao": sao, "cung_goc": noi["ten"] if noi else None})
    return {"nam_am": nam_am, "can_chi": f"{can} {chi}", "tu_hoa": ra}


def _van(nhom: str, ma: str, mac_dinh: dict, **bien) -> str:
    s = kb.nhip(nhom, ma)
    if isinstance(s, dict):
        s = s.get("mo_ta") or s.get("nhan")
    return kb.dien(s if isinstance(s, str) and s.strip() else mac_dinh[ma], **bien)


def lap(sinh: dict, ngay_xem: dt.date, phai: str = ln.MAC_DINH, ls: dict | None = None) -> dict:
    """`sinh` như `luangiai.tuvi_luu_nguyet.lap_nam`. → tháng âm chứa `ngay_xem` + 2 tháng sau."""
    if phai not in ln.PHAI:
        raise ValueError(f"Phái lưu nguyệt không hợp lệ: {phai}")
    from app.hoidap.tuvi import tom_tat          # tránh vòng import

    if ls is None:
        ls = tom_tat(az.an_sao_tho(sinh["ngay"], sinh["ti"], sinh["gioi_tinh"], "vi-VN",
                                   tz_lich=sinh.get("tz_lich", config.CALENDAR_MERIDIAN_TZ),
                                   hoa_linh=sinh.get("hoa_linh", "viet"),
                                   thang_nhuan=sinh.get("thang_nhuan", "thang_sau"), lich=sinh.get("lich", "viet")))
    nam_am = lunar.solar_to_lunar(ngay_xem.day, ngay_xem.month, ngay_xem.year, _tz_xem(sinh))[2]
    chi = {c["ten"]: lunar.CHI.index(c["chi"]) for c in ls["cung"]}
    xung = {a: next(b for b in chi if chi[b] == (chi[a] + 6) % 12) for a in chi}

    nam = {nam_am: luan_ln.lap_nam(sinh, nam_am, phai, ls=ls)}
    ds = [(nam_am, t) for t in nam[nam_am]["thang"]]
    i = next(k for k, (_, t) in enumerate(ds) if t["tu"] <= ngay_xem <= t["den"])
    if i + 3 > len(ds):
        nam[nam_am + 1] = luan_ln.lap_nam(sinh, nam_am + 1, phai, ls=ls)
        ds += [(nam_am + 1, t) for t in nam[nam_am + 1]["thang"]]
    luu_nien = {n: _tu_hoa_nam(sinh, n, ls) for n in nam}

    def _thang(n: int, t: dict, truoc: list[dict]) -> dict:
        th = [{"hoa": x["hoa"], "sao": x["sao"], "cung_goc": x["cung_goc"]} for x in t["tu_hoa_thang"]]
        muc, ly = xep_muc({x["hoa"]: x["cung_goc"] for x in th},
                          {x["hoa"]: x["cung_goc"] for x in luu_nien[n]["tu_hoa"]}, xung)
        sao_t = {x["hoa"]: x["sao"] for x in th}
        ly_do = [{"ma": x["ma"], "noi_dung": _van("ly_do", x["ma"], _LY_DO, sao=sao_t.get(x["hoa"], ""),
                                                   cung=x["cung"], mang=MANG.get(x["cung"], x["cung"]))}
                 for x in ly]
        dg = dien_giai_thang(t, th, luu_nien[n], muc, ly, ly_do, ln.PHAI[phai]["ten"], truoc)
        return {"thang": t["thang"], "nhuan": t["nhuan"], "phan": t["phan"], "nam_am": n, "can_chi": t["can_chi"],
                "tu": t["tu"].isoformat(), "den": t["den"].isoformat(), "cung_goc": t["cung_goc"],
                "chu_de": t["chu_de"], "muc": muc, "nhan_muc": NHAN_MUC[muc], "ly_do": ly_do, "tu_hoa_thang": th,
                **dg}

    thang: list[dict] = []
    for n, t in ds[i:i + 3]:
        thang.append(_thang(n, t, thang))
    ra = {
        "ngay_xem": ngay_xem.isoformat(), "phai_luu_nguyet": phai,
        "ten_phai_luu_nguyet": ln.PHAI[phai]["ten"],
        "luu_nien": luu_nien[nam_am],
        "tom_tat_3_thang": tom_tat_ba_thang(thang),
        "thang": thang,
        "cung": [{"ten": c["ten"], "chi": c["chi"], "nhan_ngan": _nhan_ngan(c["ten"])} for c in ls["cung"]],
        "uu_tien": {"thu_tu": THU_TU_UU_TIEN, "ghi_chu": luan_ln.UU_TIEN, "han_nam": nam[nam_am]["han_nam"]},
        "luu_y": list(LUU_Y),
    }
    if nam_am + 1 in nam:
        ra["luu_nien_sau"] = luu_nien[nam_am + 1]
    return ra
