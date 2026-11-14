# -*- coding: utf-8 -*-
"""SX-C (2026-11-14) — khối "Sách xưa ghi gì" của từng môn.

RULES, tất định: chỉ CHỌN các mục đã có trong KB `*_sach_ghi*.json` (mỗi mục đã qua bộ kiểm `kb/sach_ghi.py`: câu Hán là
chuỗi con kho nguồn, lời Việt đã nói giảm) ứng với đúng dữ kiện ĐÃ TÍNH của lá số / ngôi nhà. Không sinh câu mới, không đổi
mức nào, không vào tiêu đề hộp / tóm tắt chương / thẻ chia sẻ / lời nhắc AI.

Ba nhóm (chủ dự án chốt): A nói nguyên ý · B "nên chú ý…" + một việc · C "hàm ý theo ghi chép xưa…" (nói giảm) + việc giữ
gìn. Người chưa đủ 18 tuổi không nhận mục nhóm C. Chỉ bản tiếng Việt (lời Việt chưa dịch).

Đầu ra chung của mọi hàm: `None` hoặc
    {"nhom": [{"ma", "ten", "muc": [{"ve", "sach", "han"?, "am"?, "loi", "nhom", "chu_de", "viec"?, "ngay_nay"?}]}], "cau_ket", "so_muc"}
"""
from __future__ import annotations

from app import ngon_ngu
from app.kb import nap, sach_ghi as sg

SACH = {"tu_vi_dau_so_toan_thu": "Tử Vi Đẩu Số Toàn Thư", "tam_menh_thong_hoi": "Tam Mệnh Thông Hội",
        "uyen_hai_tu_binh": "Uyên Hải Tử Bình", "than_tuong_toan_bien": "Thần Tướng Toàn Biên",
        "lieu_trang_tuong_phap": "Liễu Trang tướng pháp", "duong_trach_thap_thu": "Dương Trạch Thập Thư",
        "nhan_tuong_co_thu": "sách tướng xưa", **sg.TEN_SACH_TOM_Y}
TUOI_NHOM_C = 18
_SANG = {"Miếu", "Vượng", "Đắc"}
_CUNG_TV = ("Mệnh", "Phu Thê", "Tài Bạch", "Quan Lộc", "Tật Ách", "Phúc Đức", "Thiên Di", "Điền Trạch", "Nô Bộc", "Tử Nữ",
            "Huynh Đệ", "Phụ Mẫu")
_KHI_TV = {"sang": "khi sao sáng hoặc có sao tốt đi cùng", "ham": "khi sao yếu hoặc gặp sao khó"}


def _kb(ten: str) -> dict:
    return nap.doc(ten)


def muc(m: dict, ve: str) -> dict:
    """Một mục hiển thị. Phiên âm chỉ kèm nhóm A (âm Hán Việt của câu nặng đọc lên vẫn nặng)."""
    if m["nhom"] == "A":
        loi = m["y"]
    elif m["nhom"] == "B":
        loi = f"{m['y']} {m['ham_y']}"
    else:
        loi = f"Hàm ý theo ghi chép xưa: {m['y']} {m['ham_y']}"
    ra = {"ve": ve, "sach": SACH.get(m["nguon"], "sách xưa"), "loi": loi, "nhom": m["nhom"], "chu_de": m["chu_de"]}
    if m.get("tom_y"):
        ra["tom_y"] = True
    else:
        ra["han"] = m["han"]
        if m["nhom"] == "A":
            ra["am"] = m["am"]
    if m.get("viec"):
        ra["viec"] = m["viec"]
    if m.get("ngay_nay"):                                    # điều sách dặn áp vào nhà ngày nay thế nào (Phong thuỷ)
        ra["ngay_nay"] = m["ngay_nay"]
    return ra


def _loc(cac: list[tuple[dict, str]], tuoi: int | None) -> list[tuple[dict, str]]:
    tre = tuoi is not None and tuoi < TUOI_NHOM_C
    return [(m, ve) for m, ve in cac if not (tre and m["nhom"] == "C")]


def khoi(nhom: list[tuple[str, str, list[tuple[dict, str]]]], tuoi: int | None = None) -> dict | None:
    """`nhom` = [(mã, tên nhóm, [(mục KB, "về điều gì")])] → khối hiển thị (bỏ nhóm rỗng)."""
    if not ngon_ngu.la_viet():
        return None
    ra, tat_ca = [], []
    for ma, ten, cac in nhom:
        cac = _loc(cac, tuoi)
        if cac:
            ra.append({"ma": ma, "ten": ten, "muc": [muc(m, ve) for m, ve in cac]})
            tat_ca += [m for m, _ in cac]
    if not ra:
        return None
    return {"nhom": ra, "cau_ket": sg.cau_ket(tat_ca) or sg.CAU_KET, "so_muc": len(tat_ca)}


# ───────────────────────── Tử vi ─────────────────────────

def _trang_thai(do_sang: str | None) -> str | None:
    return "sang" if do_sang in _SANG else "ham" if do_sang == "Hãm" else None


def tuvi(cung: list[dict], tuoi: int | None = None) -> dict | None:
    """`cung` = 12 cung đầu ra của lá số (`ten`, `chinh_tinh[{ten, do_sang_nam_phai}]`, `phu_tinh[{ten, …}]`).
    Mục `khi = chung` luôn lấy; `sang` / `ham` lấy theo độ sáng Nam phái của chính sao đó (sao "Bình" chỉ lấy mục chung)."""
    kb = _kb("tuvi_sach_ghi.json")["muc"]
    theo_ten = {c["ten"]: c for c in cung}
    nhom = []
    for ten in _CUNG_TV:
        c = theo_ten.get(ten)
        if not c:
            continue
        cac: list[tuple[dict, str]] = []
        for s in [*c.get("chinh_tinh", []), *c.get("phu_tinh", [])]:
            tt = _trang_thai(s.get("do_sang_nam_phai"))
            for m in (kb.get(s["ten"]) or {}).get(ten) or []:
                k = m.get("khi", "chung")
                if k == "chung" or k == tt:
                    ve = f"Sao {s['ten']} ở cung {ten}" + (f" · {_KHI_TV[k]}" if k in _KHI_TV else "")
                    cac.append((m, ve))
        nhom.append((ten, f"Cung {ten}", cac))
    return khoi(nhom, tuoi)


# ───────────────────────── Bát tự ─────────────────────────

_KHAC = {"Mộc": "Kim", "Hỏa": "Thủy", "Thổ": "Mộc", "Kim": "Hỏa", "Thủy": "Thổ"}     # hành khắc mình


def battu(ls: dict, mo_rong: dict, tuoi: int | None = None) -> dict | None:
    """Thần sát có trong lá số · bốn thập thần sách bàn riêng (khi lộ ở can) · nét hành của ngày sinh · phần cơ thể theo hành."""
    kb = _kb("battu_sach_ghi.json")
    hanh = ls["nhat_chu"]["ngu_hanh"]

    def kem(m: dict, goc: str) -> str:
        k = (m.get("khi") or "").strip()
        return goc if not k or k.startswith("nói chung") else f"{goc} · {k}"

    sao = [t["ten"] for t in mo_rong.get("than_sat") or []]
    sao += [t["ten"] for t in mo_rong.get("than_sat_tham_khao") or [] if t.get("co")]
    ts = [(m, kem(m, f"Lá số có sao {ten}")) for ten in dict.fromkeys(sao) for m in kb["than_sat"].get(ten) or []]
    lo = {x for x in (ls.get("thap_than_can") or []) if x}
    tt = [(m, kem(m, f"Lá số có {ten} lộ ở hàng can")) for ten in kb["thap_than"] if ten in lo for m in kb["thap_than"][ten]]
    net = [(m, f"Ngày sinh thuộc hành {hanh}") for m in (kb["tinh_net"].get(hanh) or [])[:1]]
    diem = (ls.get("ngu_hanh") or {}).get("diem") or {}
    the = []
    for m in kb["than_the"].get(hanh) or []:
        chung = (m.get("khi") or "").startswith("nói chung")
        # câu có điều kiện "gặp hành khắc đang mạnh" chỉ lấy khi hành khắc ngày sinh đúng là hành nhiều điểm nhất
        if chung or (diem and max(diem, key=diem.get) == _KHAC[hanh]):
            the.append((m, kem(m, f"Ngày sinh thuộc hành {hanh}")))
    return khoi([("than_sat", "Các sao trong lá số", ts), ("thap_than", "Vai nổi ở hàng can", tt),
                 ("tinh_net", "Nét của hành ngày sinh", net), ("than_the", "Phần cơ thể sách gắn với hành này", the)], tuoi)


# ───────────────────────── Phong thuỷ ─────────────────────────

def phongthuy(quai: str | None = None, dau_hieu: list[str] | None = None, cua: str | None = None, chu: str | None = None,
              bep: str | None = None, tuoi: int | None = None) -> dict | None:
    """Điều sách dặn theo cung mệnh · theo dấu hiệu ĐÃ XÁC NHẬN của nhà · theo cặp cửa – chủ, bếp – cửa (khi KB có)."""
    nhom = []
    if quai:
        cm = _kb("phongthuy_cung_menh.json")
        cac = [(m, m["ten"]) for m in cm["cung"].get(quai) or []]
        nhom.append(("cung_menh", f"Sách dặn người cung {quai}", cac))
    if dau_hieu:
        co = set(dau_hieu)
        ds = _kb("phongthuy_sach_ghi.json")["dieu"]
        cac = [(m, m["tieu_de"]) for m in ds if m.get("dau_hieu") in co and m.get("con_ap_dung", True)]
        nhom.append(("dau_hieu", "Về những điều nhà bạn đang có", cac))
    if cua and (chu or bep):
        try:
            ty = _kb("phongthuy_tam_yeu.json")
        except FileNotFoundError:
            ty = None
        if ty:
            cac = []
            if chu and (m := ty["nha"].get(f"{cua}_{chu}")):
                cac.append((m, f"Cửa {cua}, phòng chính {chu} · {m['du_nien']}"))
            if bep and (m := ty["bep"].get(f"{bep}_{cua}")):
                cac.append((m, f"Bếp {bep}, cửa {cua} · {m['du_nien']}"))
            nhom.append(("cua_chu_bep", "Cửa, phòng chính và bếp", cac))
    return khoi(nhom, tuoi)


# ───────────────────────── Nhân tướng ─────────────────────────

def nhan_tuong(dac_diem: list[str], tuoi: int | None = None) -> dict | None:
    """Câu sách gắn với các nét người dùng đã chọn (`dac_diem` = mã đặc điểm) và 12 cung trên mặt mà nét ấy thuộc về."""
    try:
        kb = _kb("nhan_tuong_sach_ghi.json")
    except FileNotFoundError:
        return None
    cac = [(m, m.get("ten") or "Nét bạn đã chọn") for ma in dac_diem for m in kb["dac_diem"].get(ma) or []]
    return khoi([("net", "Về các nét bạn đã chọn", cac)], tuoi)
