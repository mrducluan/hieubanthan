# -*- coding: utf-8 -*-
"""HD-CS — khối trực quan kèm câu trả lời hỏi đáp (RULES, tất định).

Mỗi khối dựng từ CHÍNH gói bằng chứng của câu trả lời (`bang_chung`), nên hình và lời luôn nói cùng một điều; web chỉ vẽ
theo `kieu`, không tự tính. Tối đa 3 khối; câu khủng hoảng / ngoài phạm vi / cần người kia → không có hình.

Kiểu khối (web/components/hoi/TrucQuan.tsx):
  thang   — thang nấc `nac`, mỗi mục một vị trí (độ sáng sao Tử vi, sức tự thân Bát tự)
  nhip    — chuỗi tháng có mức (Tử vi nhịp 3 tháng)
  cot     — cột tỉ lệ % (năm hành Bát tự)
  o       — ô nhãn / giá trị / chú thích (giai đoạn 10 năm, năm nay)
  so      — con số lớn (Thần số)
  chu_ky  — vòng `so_nac` nấc, sáng nấc hiện tại (năm cá nhân)
  hai_cot — hai danh sách đối nhau (điểm mạnh / dễ vấp, nên / nên tránh)
  la_ban  — 8 hướng, hướng hợp sáng (Phong thuỷ)
  cung    — bàn 12 cung theo chi: cung được hỏi sáng, tam hợp tô nhạt, xung chiếu viền (Tử vi, đợt 2 — hướng C);
            có `bay` thì vẽ mũi tên đường bay tứ hoá (đợt 4)
  minh_hoa — hình minh hoạ CỦA TRANG KIẾN THỨC tương ứng (câu hỏi kiến thức chung) + link sang trang đó (đợt 4)
Sắc thái: chinh (nổi bật) · hop (hợp) · trung (bình thường) · nhat (mờ) — không có màu đỏ. Thuật ngữ (miếu, hãm…) không
nằm trong nhãn: chúng ở "Vì sao nói vậy"."""
from __future__ import annotations

import functools
import re

from app.calc import phongthuy as pt
from app.calc.lunar import CHI
from app.kb import battu_kb, phongthuy_kb, tuvi_kb

TOI_DA = 3
NAC_DO_SANG = ("Kém sáng", "Bình", "Khá sáng", "Sáng", "Rất sáng")
_VI_TRI_SANG = {"Hãm": 0, "Bất": 0, "Bình": 1, "Lợi": 2, "Đắc": 2, "Vượng": 3, "Miếu": 4}
NAC_SUC_THAN = ("Nhẹ", "Cân bằng", "Mạnh")
_SUC_THAN = {"nhược": (0, "Bạn dễ chịu ảnh hưởng của hoàn cảnh; có người và nếp quen đỡ thì đi xa hơn."),
             "trung hoà": (1, "Bạn đứng được bằng sức mình mà không lấn át người khác."),
             "vượng": (2, "Bạn có sức tự thân lớn; cần chỗ để dồn sức, nếu không dễ thành cứng đầu.")}
_SAC_NHIP = {"thuan": "hop", "binh": "trung", "can_than": "chinh"}
_TEN_SO = {"duong_doi": "Đường đời", "su_menh": "Sứ mệnh", "linh_hon": "Linh hồn", "nhan_cach": "Nhân cách",
           "ngay_sinh": "Ngày sinh", "thai_do": "Thái độ"}
TAM_HUONG = ("Bắc", "Đông Bắc", "Đông", "Đông Nam", "Nam", "Tây Nam", "Tây", "Tây Bắc")
_HANH = ("Kim", "Mộc", "Thủy", "Hỏa", "Thổ")
NAC_MUC = ("Cần lưu ý", "Cân bằng", "Thuận lợi")          # mức của một mảng đời (chương đời sống) — không điểm số
_VT_MUC = {"can_chu_dong": 0, "can_bang": 1, "thuan": 2}


def _dac_biet(goi: dict) -> bool:
    return goi["phan_loai"].get("xu_ly") in ("an_toan", "tu_choi_nhe") or bool(goi.get("can_them"))


def _cat(ds: list[dict]) -> list[dict]:
    return [gan_khop(k) for k in ds if k and k.get("muc", True)][:TOI_DA]


# ---- HD-CS đợt 3 (ý 3): chữ trong câu trả lời ↔ hình. Mỗi mục hình mang `khop` = những cụm chữ (đúng chữ hoa/thường)
# mà lời trả lời dùng để nói về nó; web gạch chân cụm đó, bấm thì mục hình sáng lên. Cụm chung chung ("tiền", "Nam")
# không đưa vào để khỏi gạch nhầm.
_TU_CUNG = {
    "Mệnh": ["tính cách"], "Huynh Đệ": ["anh chị em"], "Phu Thê": ["tình duyên", "hôn nhân", "vợ chồng"],
    "Tử Nữ": ["con cái"], "Tài Bạch": ["tiền bạc"], "Tật Ách": ["sức khoẻ", "sức khỏe"], "Thiên Di": ["đi xa"],
    "Nô Bộc": ["bạn bè", "đồng nghiệp"], "Quan Lộc": ["công việc", "sự nghiệp"], "Điền Trạch": ["nhà cửa"],
    "Phúc Đức": ["tinh thần"], "Phụ Mẫu": ["cha mẹ"],
}
_HANH_KHAC = {"Hỏa": "Hoả", "Thủy": "Thuỷ"}


def _hai_kieu(*cum: str) -> list[str]:
    """Cụm + bản viết hoa chữ đầu (đầu câu), không trùng."""
    ra: list[str] = []
    for c in cum:
        for x in (c, c[:1].upper() + c[1:]):
            if x not in ra:
                ra.append(x)
    return ra


def gan_khop(k: dict) -> dict:
    kieu = k["kieu"]
    for m in k.get("muc", []):
        khop: list[str] = []
        if kieu == "cung":
            if m.get("vai"):
                khop = [m["nhan"], *_hai_kieu(*_TU_CUNG.get(m["nhan"], []))]
            xem = (tuvi_kb.cung(m["nhan"]) or {}).get("xem_duoc")
            if xem:
                m["giai_thich"] = f"Cung {m['nhan']} nói về: {xem}."
        elif kieu == "thang" and m["nhan"] != "Bạn":
            khop = [m["nhan"]]
        elif kieu == "cot":   # "hành Kim" thay "Kim" trần — tránh khớp tên nạp âm / thần sát ("Kim Dư", "Phúc Đăng Hỏa")
            khop = _hai_kieu(*(f"hành {h}" for h in [m["nhan"], *([_HANH_KHAC[m["nhan"]]] if m["nhan"] in _HANH_KHAC else [])]))
        elif kieu == "so":
            khop = _hai_kieu(f"số {m['gia_tri']}")
        elif kieu == "la_ban" and m.get("sac") == "hop":
            # Hướng một chữ (Đông, Tây…) chỉ khớp dạng "(Đông)": "hướng Đông" sẽ dính vào "hướng Đông Nam".
            khop = [f"({m['huong']})", *(_hai_kieu(f"hướng {m['huong']}") if " " in m["huong"] else [])]
        elif kieu == "nhip":
            khop = _hai_kieu(f"tháng {m['nhan'].split()[1]}")
        if khop:
            m["khop"] = khop
    return k


def _bo_dau_de(s: str | None) -> str:
    """'Giai đoạn chủ đề Điền Trạch: nhà cửa…' → 'nhà cửa…' (bỏ phần nhắc lại tên cung)."""
    return (s or "").split(": ", 1)[-1]


# ---------------------------------------------------------------- dùng chung (đợt 4)

def _muc_mang(goi: dict) -> dict | None:
    """Mức của mảng đời mà câu hỏi mượn từ chương đời sống (MT-ĐS B2) — cùng mức chương báo cáo đã chấm."""
    m = next((x for x in goi["muc"] if x["loai"] == "doi_song" and x.get("muc") in _VT_MUC), None)
    if not m:
        return None
    ten = m.get("ten_mang") or "mảng này"
    return {"kieu": "thang", "tieu_de": f"Mảng {ten} của bạn đang ở mức nào", "nac": list(NAC_MUC),
            "ghi_chu": "Mức đọc từ cả lá số, cùng mức với chương này trong bài luận giải; đây là gợi ý để tự soi, không phải lời phán.",
            "muc": [{"nhan": ten[:1].upper() + ten[1:], "vi_tri": _VT_MUC[m["muc"]], "giai_thich": m.get("tom_tat") or ""}]}


@functools.lru_cache(maxsize=512)
def _hinh_trang(loai: str, slug: str) -> dict | None:
    from app.kb import trang      # noqa: PLC0415 — trang.py nạp nhiều KB; chỉ cần khi câu hỏi là kiến thức chung
    t = trang.lay(loai, slug)
    return t.get("minh_hoa") if t else None


def _khoi_trang(loai: str, slug: str, nhan: str) -> dict | None:
    """Câu hỏi kiến thức chung → hình minh hoạ của chính trang kiến thức đó (web vẽ bằng cùng component với trang)."""
    hinh = _hinh_trang(loai, slug)
    if not hinh:
        return None
    return {"kieu": "minh_hoa", "tieu_de": nhan, "hinh": dict(hinh),
            "trang": {"loai": loai, "slug": slug, "nhan": nhan}}


def _slug(s: str) -> str:
    from app.kb import trang      # noqa: PLC0415
    return trang._slug(s)


# ---------------------------------------------------------------- Tử vi

# Câu hỏi chuẩn cho từng cung (đã kiểm định tuyến đúng cung — tests/test_truc_quan.py) — dùng cho "Hỏi tiếp".
HOI_CUNG = {
    "Mệnh": "Cung Mệnh nói gì về tính cách của tôi?", "Huynh Đệ": "Anh chị em của tôi thế nào?",
    "Phu Thê": "Tình duyên của tôi thế nào?", "Tử Nữ": "Chuyện con cái của tôi thế nào?",
    "Tài Bạch": "Tiền bạc của tôi thế nào?", "Tật Ách": "Sức khoẻ của tôi nên chăm sóc gì?",
    "Thiên Di": "Ra ngoài, đi xa thì tôi thế nào?", "Nô Bộc": "Bạn bè, đồng nghiệp của tôi thế nào?",
    "Quan Lộc": "Công việc của tôi có tốt không?", "Điền Trạch": "Nhà cửa của tôi thế nào?",
    "Phúc Đức": "Phúc đức, đời sống tinh thần của tôi ra sao?", "Phụ Mẫu": "Quan hệ với cha mẹ của tôi thế nào?",
}


def _tam_phuong(ls: dict, ten: str) -> tuple[dict | None, list[str], str | None]:
    """(cung được hỏi, tên hai cung tam hợp, tên cung xung chiếu) — đọc theo chi trên chính lá số."""
    theo_chi = {c["chi"]: c for c in ls.get("cung", [])}
    goc = next((c for c in ls.get("cung", []) if c["ten"] == ten), None)
    if not goc or goc["chi"] not in CHI:
        return None, [], None
    i = CHI.index(goc["chi"])
    hop = [theo_chi[CHI[(i + d) % 12]]["ten"] for d in (4, 8) if CHI[(i + d) % 12] in theo_chi]
    xung = theo_chi.get(CHI[(i + 6) % 12])
    return goc, hop, xung["ten"] if xung else None


def _ban_cung(goi: dict, ls: dict | None, cung: str | None = None) -> dict | None:
    cung_hoi = cung or (goi["phan_loai"].get("cung") or [None])[0]
    if not ls or not cung_hoi:
        return None
    goc, hop, xung = _tam_phuong(ls, cung_hoi)
    if not goc or len(ls["cung"]) != 12:
        return None
    muc = []
    for c in ls["cung"]:
        vai = "hoi" if c["ten"] == cung_hoi else "tam_hop" if c["ten"] in hop else "xung" if c["ten"] == xung else ""
        muc.append({"chi": c["chi"], "nhan": c["ten"], "vai": vai,
                    "sao": [s["ten"] for s in c.get("chinh_tinh", [])][:2],
                    "sac": {"hoi": "chinh", "tam_hop": "hop", "xung": "trung"}.get(vai, "nhat")})
    return {"kieu": "cung", "tieu_de": f"Cung {cung_hoi} trên lá số của bạn", "chi_hoi": goc["chi"], "muc": muc,
            "cau_chuan": HOI_CUNG.get(cung_hoi),
            "ghi_chu": f"Cung sáng là cung câu hỏi nhắc tới. {' và '.join(hop)} cùng một tam giác đỡ cho nó; "
                       f"{xung} nằm đối diện, chiếu sang." if hop and xung else None}


def hoi_tiep_tuvi(goi: dict, ls: dict | None) -> list[str]:
    """≤ 3 câu hỏi tiếp: hai cung tam hợp rồi cung xung chiếu của cung vừa hỏi (đúng lá số người hỏi)."""
    cung_hoi = (goi["phan_loai"].get("cung") or [None])[0]
    if _dac_biet(goi) or not ls or not cung_hoi:
        return []
    _, hop, xung = _tam_phuong(ls, cung_hoi)
    return [HOI_CUNG[c] for c in [*hop, xung] if c in HOI_CUNG and c != cung_hoi][:3]


def tuvi(goi: dict, ls: dict | None = None) -> list[dict]:
    if _dac_biet(goi):
        return []
    muc = goi["muc"]
    ds: list[dict] = [b] if (b := _ban_cung(goi, ls)) else []
    if not ds and (bay := _ban_bay(goi, ls)):
        ds.append(bay)
    cc = [m for m in muc if m["loai"] == "cach_cuc"]
    if cc and not ds and (b := _ban_cung(goi, ls, "Mệnh")):
        b["tieu_de"] = "Cung Mệnh và tam phương — nơi cách cục hình thành"
        b["cau_chuan"] = None
        ds.append(b)
    sao = [m for m in muc if m["loai"] == "sao_cung" and m.get("vai") == "la_so" and m.get("do_sang") in _VI_TRI_SANG]
    if sao:
        ds.append({"kieu": "thang", "tieu_de": f"Sao chính ở cung {sao[0]['cung']} sáng tới đâu", "nac": list(NAC_DO_SANG),
                   "cau_chuan": HOI_CUNG.get(sao[0]["cung"]),
                   "ghi_chu": "Sao càng sáng, nét tốt của nó càng dễ lộ ra; kém sáng thì cần chủ động hơn.",
                   "muc": [{"nhan": m["sao"], "vi_tri": _VI_TRI_SANG[m["do_sang"]],
                            "giai_thich": m.get("doi_thuong") or m.get("noi_dung") or ""} for m in sao[:3]]})
    nhip = next((m for m in muc if m["loai"] == "nhip_3_thang"), None)
    if nhip and nhip.get("thang"):
        ds.append({"kieu": "nhip", "tieu_de": "Nhịp các tháng tới",
                   "cau_chuan": HOI_TV_THEM["ba_thang"] if goi["phan_loai"].get("y_dinh") == "ba_thang_toi" else None, "muc": [
            {"nhan": f"Tháng {t['thang']}{' nhuận' if t.get('nhuan') else ''}", "phu": f"{t['tu'][8:10]}/{t['tu'][5:7]}",
             "gia_tri": t["nhan_muc"], "muc_ma": t["muc"], "sac": _SAC_NHIP.get(t["muc"], "trung"),
             "giai_thich": " ".join(x for x in (t.get("tieu_de_thang"), t.get("goi_y")) if x)} for t in nhip["thang"]]})
    han = {m["lop"]: m for m in muc if m["loai"] == "han"}
    tuoi = next((m for m in muc if m["loai"] == "tuoi"), None)
    o = []
    if "dai_han" in han and han["dai_han"].get("tu_tuoi") is not None:
        h = han["dai_han"]
        o.append({"nhan": f"10 năm ({h['tu_tuoi']}–{h['den_tuoi']} tuổi)", "gia_tri": h["cung_goc"],
                  "chu_thich": _bo_dau_de(h.get("chu_de")), "sac": "chinh"})
    if "luu_nien" in han:
        h = han["luu_nien"]
        nam = f"Năm {tuoi['ngay_xem'][:4]}" if tuoi else "Năm nay"
        o.append({"nhan": nam, "gia_tri": h["cung_goc"], "chu_thich": _bo_dau_de(h.get("chu_de")), "sac": "hop"})
    if o:
        ds.append({"kieu": "o", "tieu_de": "Bạn đang ở giai đoạn nào", "muc": o})
    if cc:
        ds.append({"kieu": "o", "tieu_de": "Cách cục trên lá số của bạn",
                   "muc": [{"nhan": "Cách cục", "gia_tri": m["ten"], "chu_thich": (m.get("y") or "").split(":")[0],
                            "sac": "chinh" if i == 0 else "trung"} for i, m in enumerate(cc[:3])]})
    if (mm := _muc_mang(goi)):
        ds.append(mm)
    if not ds:
        ds = [k for k in [_kien_thuc_tuvi(muc)] if k]
    return _cat(ds)


_HOA_TV = ("Lộc", "Quyền", "Khoa", "Kỵ")


def _ban_bay(goi: dict, ls: dict | None) -> dict | None:
    """Đường bay tứ hoá (phi hoá) trên bàn 12 cung: mũi tên từ cung phát hoá tới cung nhận (vào Mệnh), vòng ở cung tự
    hoá. Chỉ đọc `phi_hoa_tong` đã tính trong gói bằng chứng; ≤ 8 đường để hình còn đọc được."""
    tong = next((m for m in goi["muc"] if m["loai"] == "phi_hoa_tong"), None)
    if not tong or not ls or len(ls.get("cung", [])) != 12:
        return None
    chi = {c["ten"]: c["chi"] for c in ls["cung"]}
    if "Mệnh" not in chi:
        return None
    duong: dict[tuple[str, str], list[str]] = {}
    loi: dict[str, list[str]] = {}
    for x in [*(tong.get("vao_menh") or []), *(tong.get("tu_hoa") or [])]:
        if x.get("tu_cung") not in chi or x.get("den_cung") not in chi or x.get("hoa") not in _HOA_TV:
            continue
        k = (chi[x["tu_cung"]], chi[x["den_cung"]])
        if k not in duong and len(duong) >= 8:
            continue
        duong.setdefault(k, [])
        if x["hoa"] not in duong[k]:
            duong[k].append(x["hoa"])
        if x.get("nghia"):
            loi.setdefault(x["tu_cung"], []).append(x["nghia"])
    if not duong:
        return None
    nguon = {t for t, d in duong}
    muc = []
    for c in ls["cung"]:
        vai = "hoi" if c["ten"] == "Mệnh" else "nguon" if c["chi"] in nguon else ""
        m = {"chi": c["chi"], "nhan": c["ten"], "vai": vai, "sao": [s["ten"] for s in c.get("chinh_tinh", [])][:2],
             "sac": {"hoi": "chinh", "nguon": "hop"}.get(vai, "nhat")}
        muc.append(m)
    k = {"kieu": "cung", "tieu_de": "Đường bay tứ hoá trên lá số của bạn", "chi_hoi": chi["Mệnh"], "muc": muc,
         "bay": [{"tu": t, "den": d, "hoa": h} for (t, d), h in duong.items()],
         "ghi_chu": "Mũi tên: cung nào gửi Lộc, Quyền, Khoa hay Kỵ vào Mệnh; vòng tròn: cung tự hoá (tự gửi cho chính nó)."}
    gan_khop(k)
    for m in muc:                    # bấm ô: nói luôn đường bay đi từ cung đó
        if m["vai"] == "nguon" and loi.get(m["nhan"]):
            m["giai_thich"] = f"{m.get('giai_thich', '')} {loi[m['nhan']][0]}".strip()
    return k


def _kien_thuc_tuvi(muc: list[dict]) -> dict | None:
    from app.kb import trang_tuvi   # noqa: PLC0415
    sc = next((m for m in muc if m["loai"] == "sao_cung" and m.get("sao") and m.get("cung")), None)
    if sc:
        return _khoi_trang("sao_cung", f"{_slug(sc['sao'])}-cung-{_slug(sc['cung'])}", f"{sc['sao']} ở cung {sc['cung']}")
    th = next((m for m in muc if m["loai"] == "tu_hoa_cung" and m.get("hoa") and m.get("cung")), None)
    if th:
        return _khoi_trang("hoa_cung", f"{trang_tuvi._slug_hoa(th['hoa'])}-cung-{_slug(th['cung'])}",
                           f"Hoá {th['hoa']} ở cung {th['cung']}")
    ct = next((m for m in muc if m["loai"] == "chinh_tinh" and m.get("ten")), None)
    if ct:
        return _khoi_trang("sao", f"sao-{_slug(ct['ten'])}", f"Sao {ct['ten']}")
    cg = next((m for m in muc if m["loai"] == "cung" and m.get("ten")), None)
    if cg:
        return _khoi_trang("cung", f"cung-{_slug(cg['ten'])}", f"Cung {cg['ten']}")
    return None


# ---------------------------------------------------------------- Bát tự

def _phan_tram(diem: dict[str, float]) -> dict[str, int]:
    """Tỉ lệ % nguyên, tổng đúng 100 (chia dư lớn nhất)."""
    tong = sum(diem.values()) or 1
    tho = {h: diem.get(h, 0) * 100 / tong for h in _HANH}
    nguyen = {h: int(v) for h, v in tho.items()}
    for h in sorted(_HANH, key=lambda h: tho[h] - nguyen[h], reverse=True)[:100 - sum(nguyen.values())]:
        nguyen[h] += 1
    return nguyen


_VAI_TRU = {"năm": "gốc gác, thơ ấu", "tháng": "cha mẹ, anh em", "ngày": "bản thân, vợ chồng", "giờ": "con cái, về sau"}


def battu(goi: dict, ls: dict | None = None) -> list[dict]:
    """`ls` (lá Bát tự đã tính, tuỳ chọn): câu hỏi về một mảng đời / cách cục không đưa ngũ hành vào lời trả lời, nhưng
    hình vẫn vẽ năm hành từ chính lá số đó (đợt 4) — không tính lại gì."""
    if _dac_biet(goi):
        return []
    muc = goi["muc"]
    ds: list[dict] = []
    nh = next((m for m in muc if m["loai"] == "ngu_hanh"), None)
    mm = _muc_mang(goi)
    hoi_tru = next((m["ten"] for m in muc if m["loai"] == "tru"), None)
    ve_tru = hoi_tru and goi["phan_loai"].get("chu_de") == "tru"
    if mm and not nh and not ve_tru:       # câu về một mảng đời: mức của mảng là câu trả lời chính → đứng đầu
        ds.append(mm)
    if not nh and ls and ls.get("ngu_hanh") and any(m["loai"] in ("tu_tru", "doi_song") for m in muc):
        nh = {**ls["ngu_hanh"], "than": ls.get("than")}
    tt = next((m for m in muc if m["loai"] == "tu_tru" and m.get("tru")), None)
    if tt and hoi_tru:
        tru = tt["tru"].split(" · ")
        if len(tru) == 4:
            ds.append({"kieu": "o", "tieu_de": "Bốn trụ của bạn", "muc": [
                {"nhan": f"Trụ {t}", "gia_tri": cc, "chu_thich": _VAI_TRU[t], "sac": "chinh" if t == hoi_tru else "trung"}
                for t, cc in zip(_VAI_TRU, tru)]})
    if nh:
        pt = _phan_tram(nh["diem"])
        thieu = set(nh.get("thieu") or [])
        cot = []
        for h in _HANH:
            k = battu_kb.ngu_hanh(h) or {}
            sac = "chinh" if h == nh.get("nhieu_nhat") else "nhat" if h in thieu or pt[h] < 5 else "trung"
            them = k.get("khi_thua") if sac == "chinh" else k.get("khi_thieu") if sac == "nhat" else None
            cot.append({"nhan": h, "gia_tri": pt[h], "sac": sac,
                        "giai_thich": "; ".join(x for x in (k.get("tinh_chat"), them) if x)})
        ds.append({"kieu": "cot", "tieu_de": "Năm hành trong ngày giờ sinh", "don_vi": "%", "muc": cot,
                   "cau_chuan": HOI_BT["ngu_hanh"] if goi["phan_loai"].get("chu_de") == "ngu_hanh" else None,
                   "ghi_chu": "Cột cho biết hành nào nhiều, hành nào ít; nhiều chưa hẳn là hay, ít chưa hẳn là dở."})
        st = _SUC_THAN.get((nh.get("than") or {}).get("ket_luan", ""))
        if st:
            ds.append({"kieu": "thang", "tieu_de": "Sức tự thân", "nac": list(NAC_SUC_THAN),
                       "cau_chuan": HOI_BT["loi_song"] if goi["phan_loai"].get("chu_de") == "loi_song" else None,
                       "muc": [{"nhan": "Bạn", "vi_tri": st[0], "giai_thich": st[1]}]})
    dv = next((m for m in muc if m["loai"] == "dai_van" and m.get("vai") == "hien_tai"), None)
    ln = next((m for m in muc if m["loai"] == "luu_nien"), None)
    o = []
    if dv:
        o.append({"nhan": f"10 năm ({dv['tu_nam']}–{dv['den_nam']})", "gia_tri": f"{dv['can']} {dv['chi']}",
                  "chu_thich": dv.get("y_tt") or "", "sac": "chinh"})
    if ln:
        o.append({"nhan": f"Năm {ln['nam']}", "gia_tri": f"{ln['can']} {ln['chi']}", "chu_thich": ln.get("y_tt") or "",
                  "sac": "hop"})
    if o:
        ds.append({"kieu": "o", "tieu_de": "Bạn đang ở giai đoạn nào", "muc": o})
    if mm and mm not in ds:
        ds.append(mm)
    if not ds:
        nc = next((m for m in muc if m["loai"] == "nhat_chu" and m.get("can")), None)
        th = next((m for m in muc if m["loai"] == "thap_than" and m.get("ten") and m.get("so_lan") is None), None)
        if nc:
            ds = [k for k in [_khoi_trang("nhat_chu", f"nhat-chu-{_slug(nc['can'])}", f"Nhật chủ {nc['can']}")] if k]
        elif th:
            ds = [k for k in [_khoi_trang("thap_than", _slug(th["ten"]), th["ten"])] if k]
    return _cat(ds)


# ---------------------------------------------------------------- Thần số

def thanso(goi: dict) -> list[dict]:
    if _dac_biet(goi):
        return []
    muc = goi["muc"]
    ds: list[dict] = []
    so, da = [], set()
    for m in muc:
        if m["loai"] == "linh_vuc" and m.get("vai") == "ban" and m.get("vi_tri") in _TEN_SO and m["vi_tri"] not in da:
            da.add(m["vi_tri"])
            so.append({"nhan": _TEN_SO[m["vi_tri"]], "gia_tri": m["so"], "chu_thich": m.get("ten_linh_vuc") or ""})
        elif m["loai"] == "thang_ca_nhan":
            so.append({"nhan": f"Tháng {m['thang']}", "gia_tri": m["so"], "chu_thich": m.get("chu_de") or ""})
        elif m["loai"] == "dinh_cao" and m.get("hien_tai"):
            so.append({"nhan": f"Chặng {m['tu_tuoi']}–{m['den_tuoi']} tuổi", "gia_tri": m["so"],
                       "chu_thich": m.get("chu_de") or ""})
    so.sort(key=lambda s: 0 if s["nhan"] in _TEN_SO.values() else 1)   # số gốc của người hỏi đứng trước nhịp thời gian
    for i, s in enumerate(so):
        s["sac"] = "chinh" if i == 0 else "trung"
    if so:
        ds.append({"kieu": "so", "tieu_de": "Các con số trả lời câu này", "muc": so[:4], "cau_chuan": _cau_ts(goi)})
    nam = next((m for m in muc if m["loai"] == "nam_ca_nhan"), None)
    if nam and 1 <= nam["so"] <= 9:
        ds.append({"kieu": "chu_ky", "tieu_de": f"Năm {nam['nam']} trong vòng 9 năm", "so_nac": 9, "hien_tai": nam["so"],
                   "cau_chuan": HOI_TS["nam"] if _cau_ts(goi) == HOI_TS["nam"] else None,
                   "nhan_hien_tai": nam.get("chu_de") or "", "giai_thich": nam.get("y_nghia") or ""})
        if nam.get("nen") or nam.get("tranh"):
            ds.append({"kieu": "hai_cot", "tieu_de": "Năm nay nên và nên tránh",
                       "trai": {"tieu_de": "Nên", "ds": [nam["nen"]] if nam.get("nen") else []},
                       "phai": {"tieu_de": "Nên tránh", "ds": [nam["tranh"]] if nam.get("tranh") else []}})
    cd = next((m for m in muc if m["loai"] == "chan_dung" and m.get("diem_manh")), None)
    if cd:
        ds.append({"kieu": "hai_cot", "tieu_de": f"Số {cd['so']}: mặt mạnh và chỗ dễ vấp",
                   "trai": {"tieu_de": "Điểm mạnh", "ds": list(cd["diem_manh"])[:3]},
                   "phai": {"tieu_de": "Dễ vấp", "ds": list(cd.get("diem_mu") or [])[:3]}})
    return _cat(ds)


def _cau_ts(goi: dict) -> str | None:
    """Câu chuẩn ĐÚNG tuyến câu vừa hỏi (thẻ chia sẻ không được mang một câu khác câu người dùng hỏi)."""
    pl = goi["phan_loai"]
    if pl.get("y_dinh") == "thoi_diem":
        return HOI_TS["nam"]
    if pl.get("y_dinh") == "mo_ta":
        return {"ban_than": HOI_TS["ban_than"], "su_nghiep": HOI_TS["nghe"]}.get(pl.get("linh_vuc"))
    return None


# ---------------------------------------------------------------- Phong thuỷ

_HUONG_RE = re.compile(r"^(.+?) \((.+)\)$")


def phongthuy(goi: dict, quai: str | None = None, menh_rieng: dict | None = None) -> list[dict]:
    """`quai`: mệnh quái câu hỏi kiến thức nêu ("người mệnh Khảm…"); `menh_rieng`: mệnh quái của CHÍNH người hỏi khi lời
    trả lời là kiến thức chung (vd vợ chồng khác mệnh) — chỉ để vẽ, không đưa vào lời."""
    if _dac_biet(goi):
        return []
    mq = next((m for m in goi["muc"] if m["loai"] == "menh_quai"), None) or menh_rieng
    if not mq:
        return _cat(_pt_chung(goi, quai))
    theo: dict[str, dict] = {}
    for nhom, sac in (("tot", "hop"), ("xau", "nhat")):
        for s in mq.get(nhom) or []:
            k = _HUONG_RE.match(s)
            if not k:
                continue
            dn = phongthuy_kb.du_nien(k.group(1)) or {}
            theo[k.group(2)] = {"huong": k.group(2), "sac": sac,
                                "nhan": k.group(1) if sac == "hop" else "Ít hợp",
                                "giai_thich": f"Hợp dùng cho: {dn['dung_cho']}." if dn.get("dung_cho") else ""}
    if len(theo) != 8:
        return []
    ghi = ("Đây là hướng hợp với bạn. Muốn so với người ấy, hỏi kèm năm sinh, ví dụ: \"Vợ tôi sinh năm 1992 hợp hướng "
           "nào?\"" if mq is menh_rieng else "Hướng tính theo năm sinh của bạn; bấm một hướng để xem hợp đặt gì.")
    return _cat([{"kieu": "la_ban", "tieu_de": "Bốn hướng hợp với bạn", "muc": [theo[h] for h in TAM_HUONG], "ghi_chu": ghi}])


def _la_ban_quai(quai: str, hoi: list[str]) -> dict | None:
    bang = pt.bang_huong(quai)
    if set(bang) != set(TAM_HUONG):
        return None
    muc = []
    for h in TAM_HUONG:
        d = bang[h]
        dn = phongthuy_kb.du_nien(d) or {}
        cat = d in pt.CAT
        muc.append({"huong": h, "sac": "hop" if cat else "nhat", "nhan": d if cat else "Ít hợp",
                    "giai_thich": (f"{d}. " if h in hoi else "") + (f"Hợp dùng cho: {dn['dung_cho']}." if cat and dn.get("dung_cho")
                                                                   else "Nên dùng cho phòng phụ, kho, nhà vệ sinh.")})
    return {"kieu": "la_ban", "tieu_de": f"Bốn hướng hợp người mệnh {quai}", "muc": muc,
            "ghi_chu": f"Hướng bạn hỏi: {', '.join(hoi)}. Bấm một hướng để xem hợp đặt gì." if hoi else None}


def _pt_chung(goi: dict, quai: str | None) -> list[dict]:
    """Câu kiến thức Phong thuỷ (không có năm sinh người hỏi): la bàn của mệnh quái được hỏi, tám du niên, cặp cửa–bếp."""
    pl, muc = goi["phan_loai"], goi["muc"]
    if pl.get("loai") == "menh_quai_chung" and quai:
        return [k for k in [_la_ban_quai(quai, list(pl.get("huong") or [])[:2])] if k]
    if pl.get("loai") == "du_nien_chung":
        hoi = [m["ten"] for m in muc if m["loai"] == "du_nien" and m.get("ten")]

        def dong(ten: str) -> str:
            d = phongthuy_kb.du_nien(ten) or {}
            return f"{ten}: {d['dung_cho']}" if d.get("dung_cho") else ten
        nhom = ("bốn hướng hợp" if hoi[0] in pt.CAT else "bốn hướng ít hợp") if hoi else None
        return [{"kieu": "hai_cot", "tieu_de": f"{hoi[0]} nằm trong {nhom}" if nhom else "Tám hướng trong Bát trạch",
                 "trai": {"tieu_de": "Bốn hướng hợp", "ds": [dong(t) for t in pt.CAT]},
                 "phai": {"tieu_de": "Bốn hướng ít hợp", "ds": [dong(t) for t in ("Hoạ Hại", "Lục Sát", "Ngũ Quỷ", "Tuyệt Mệnh")]}}]
    if pl.get("loai") == "cua_bep":
        o = [{"nhan": m["vai"], "gia_tri": m["ten"], "chu_thich": "Hợp" if m.get("cat_hung") == "cát" else "Ít hợp",
              "sac": "hop" if m.get("cat_hung") == "cát" else "nhat"}
             for m in muc if m["loai"] == "du_nien" and m.get("vai")]
        return [{"kieu": "o", "tieu_de": "Cửa, chủ, bếp hợp nhau tới đâu", "muc": o}] if o else []
    return []


# ---------------------------------------------------------------- Hỏi tiếp Bát tự / Phong thuỷ (HD-CS đợt 3)
# Câu chuẩn đã kiểm định tuyến đúng chủ đề (tests/test_truc_quan.py); mỗi chủ đề gợi ba chủ đề gần nó nhất.

HOI_BT = {
    "ngu_hanh": "Tôi thiếu hành gì?", "loi_song": "Bát tự tôi mạnh hay yếu?",
    "tinh_cach": "Tính cách của tôi thế nào?", "nghe_tien": "Tôi hợp nghề gì?",
    "hon_nhan": "Tình duyên của tôi thế nào?", "van": "Năm nay của tôi thế nào?",
}
_BT_GAN = {
    "ngu_hanh": ("loi_song", "nghe_tien", "van"), "loi_song": ("ngu_hanh", "tinh_cach", "van"),
    "tinh_cach": ("nghe_tien", "hon_nhan", "ngu_hanh"), "nghe_tien": ("van", "tinh_cach", "ngu_hanh"),
    "hon_nhan": ("tinh_cach", "van", "loi_song"), "van": ("nghe_tien", "hon_nhan", "ngu_hanh"),
}

HOI_PT = {
    "huong": "Hướng nhà hợp tuổi tôi?", "phong_lam_viec": "Kê bàn làm việc hướng nào?",
    "ban_tho": "Bàn thờ nên đặt ở đâu?", "bep_doi_cua": "Bếp đối diện cửa chính có sao không?",
}
_PT_GAN = {
    "huong": ("phong_lam_viec", "ban_tho", "bep_doi_cua"), "phong_lam_viec": ("huong", "ban_tho", "bep_doi_cua"),
    "ban_tho": ("huong", "bep_doi_cua", "phong_lam_viec"), "bep_doi_cua": ("huong", "ban_tho", "phong_lam_viec"),
}


def _khoa_bt(pl: dict) -> str | None:
    return "van" if pl.get("loai") == "van" else pl.get("chu_de") if pl.get("chu_de") in HOI_BT else None


def _khoa_pt(pl: dict) -> str | None:
    if pl.get("bo_tri"):
        return pl["bo_tri"][0] if pl["bo_tri"][0] in HOI_PT else None
    return "huong" if pl.get("loai") == "huong_ca_nhan" else None


def _hoi_tiep(pl: dict, khoa: str | None, cau: dict, gan: dict, mac_dinh: tuple) -> list[str]:
    if pl.get("xu_ly") in ("an_toan", "tu_choi_nhe"):
        return []
    return [cau[k] for k in gan.get(khoa, mac_dinh) if k != khoa][:3]


def hoi_tiep_battu(pl: dict) -> list[str]:
    return _hoi_tiep(pl, _khoa_bt(pl), HOI_BT, _BT_GAN, ("tinh_cach", "ngu_hanh", "van"))


def hoi_tiep_phongthuy(pl: dict) -> list[str]:
    return _hoi_tiep(pl, _khoa_pt(pl), HOI_PT, _PT_GAN, ("huong", "phong_lam_viec", "ban_tho"))


# ---------------------------------------------------------------- Kinh Dịch: quẻ bấm từng hào (HD-CS đợt 3, ý 4)

_THU_HAO = {"Sơ": 1, "Nhị": 2, "Tam": 3, "Tứ": 4, "Ngũ": 5, "Thượng": 6}
_TEN_HAO_RE = re.compile(r"^(Hào (?:Sơ|Thượng) (?:Cửu|Lục)|Hào (?:Cửu|Lục) (?:Nhị|Tam|Tứ|Ngũ)) \(")


def kinhdich(goi: dict, que: dict | None) -> list[dict]:
    """Sáu hào của quẻ bản (hào 1 dưới cùng): hào động sáng, hào chủ nổi bật; bấm hào động → "nói nôm na" của chính lời
    hào đó (KB, đã có trong gói bằng chứng); chữ "Hào Cửu Nhị…" trong lời đọc trỏ về đúng hào."""
    if _dac_biet(goi):
        return []
    if not que or not que.get("quai_ban"):
        q = next((m for m in goi["muc"] if m.get("loai") == "que" and m.get("so")), None)
        if not q:
            return []
        from app.kb import trang      # noqa: PLC0415
        slug = next((s for k, s in trang._ds_que() if str(k) == str(q["so"])), None)
        return [k for k in [slug and _khoi_trang("que", slug, f"Quẻ {q['ten']}")] if k]
    qb = que["quai_ban"]
    bits = qb.get("bits_hao1_den_hao6") or []
    if len(bits) != 6:
        return []
    dong = set(que.get("hao_dong") or [])
    theo_vt: dict[int, dict] = {}
    for m in goi["muc"]:
        if m.get("loai") != "loi_kinh" or not str(m.get("tieu_de", "")).endswith(f"quẻ {qb['ten']}"):
            continue
        k = _TEN_HAO_RE.match(m["tieu_de"])
        if not k:
            continue
        vt = next((v for w, v in _THU_HAO.items() if w in k.group(1).split()), None)
        if vt:
            theo_vt[vt] = {"ten": k.group(1), "nom_na": m.get("nom_na") or m.get("y") or "", "chu": bool(m.get("chu"))}
    muc = []
    for i, b in enumerate(bits, start=1):
        lk = theo_vt.get(i) if i in dong else None
        x = {"nhan": f"Hào {i}", "vi_tri": i, "duong": bool(b), "dong": i in dong, "chu": bool(lk and lk["chu"]),
             "sac": "chinh" if lk and lk["chu"] else "hop" if i in dong else "nhat",
             "giai_thich": lk["nom_na"] if lk else ("Hào động ở lượt này." if i in dong
                                                    else "Hào đứng yên ở lượt này — đọc theo lời chung của quẻ.")}
        if lk:
            x["nhan"] = f"Hào {i} · {lk['ten'].removeprefix('Hào ')}"
            x["khop"] = [lk["ten"]]
        muc.append(x)
    return [{"kieu": "hao", "tieu_de": f"Quẻ {qb['ten']}: bấm từng hào", "muc": muc,
             "ghi_chu": "Hào 1 ở dưới cùng. Hào sáng là hào động — phần quẻ đang chuyển; hào vàng là hào chủ."}]


# ---------------------------------------------------------------- Câu chuẩn (thẻ chia sẻ + hỏi tiếp)

HOI_TV_THEM = {"ba_thang": "3 tháng tới của tôi thế nào?"}
HOI_TS = {"ban_than": "Tôi là người thế nào?", "nam": "Năm nay của tôi thế nào?", "nghe": "Tôi hợp nghề gì?"}


def cau_chuan_tat_ca() -> dict[str, list[str]]:
    """Danh mục câu chuẩn theo mảng — thẻ chia sẻ chỉ được mang câu trong danh mục này (web máy chủ đối chiếu)."""
    return {"tuvi": [*HOI_CUNG.values(), *HOI_TV_THEM.values()], "battu": list(HOI_BT.values()),
            "phongthuy": list(HOI_PT.values()), "thanso": list(HOI_TS.values())}
