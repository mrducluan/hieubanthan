# -*- coding: utf-8 -*-
"""Tầng KB — Chỉ tay theo Thần Tướng Toàn Biên quyển 10 (bảy mươi hai hình vân tay khắc gỗ) + đồ hình tám cung bàn tay.

Chỉ TRA `chi_tay_kb.json` (git là nguồn) và GHÉP lời theo khuôn SX-C (`sach_ghi.loi`): A nói nguyên ý, B "nên chú ý" + việc,
C "Sách xưa có nhắc… Hàm ý theo ghi chép xưa…" (không phiên âm). Không sinh nghĩa, không đoán gì từ ảnh: người dùng tự soi bàn
tay của mình rồi chọn hình vân giống tay mình. Ảnh do web tự phục vụ (`/anh/chi-tay/van/<ma>.webp`, `/anh/do-hinh/<tep>`).
"""
from __future__ import annotations

from app.kb import nap
from app.kb import sach_ghi

TEP = "chi_tay_kb.json"
NGUON_HIEN_THI = "Thần Tướng Toàn Biên, quyển 10, bản khắc đời Minh"   # BM-1: kiểu sách, không nơi lấy ảnh
TUOI_NHOM_C = 18
_KHOA_VAN = ("ma", "ten", "ten_han", "am_ten", "anh", "rong", "cao", "han", "y", "nhom", "chu_de")


@nap.nho
def _d() -> dict:
    try:
        d = nap.doc(TEP)
    except (OSError, ValueError):
        return {}
    return d if isinstance(d, dict) else {}


def meta() -> dict:
    d = _d()
    return {"trang_thai": d.get("trang_thai", "nhap_ban_bien_tap"), "source_id": d.get("source_id", "than_tuong_toan_bien"),
            "school_id": d.get("school_id", "ma_y"), "can_doi_chieu": bool(d.get("can_doi_chieu", True))}


def ds_van() -> list[dict]:
    return _d().get("van") or []


def lay(ma: str) -> dict | None:
    return next((x for x in ds_van() if x["ma"] == ma), None)


def chu_de() -> list[dict]:
    co = {x["chu_de"] for x in ds_van()}
    return [c for c in _d().get("chu_de") or [] if c["ma"] in co]


def _mot(m: dict) -> dict:
    """Một vân cho thư viện: thêm câu hiển thị theo khuôn SX-C. Phiên âm chỉ ở nhóm A (âm câu nặng đọc lên vẫn nặng)."""
    ra = {k: m[k] for k in _KHOA_VAN}
    if m["nhom"] == "A":
        ra["am"] = m["am"]
    for k in ("ham_y", "viec"):
        if m.get(k):
            ra[k] = m[k]
    ra["loi"] = sach_ghi.loi(m, co_am=False)
    return ra


def thu_vien() -> dict:
    """Toàn bộ thư viện vân tay (trang công khai: nhóm C đã nói giảm, có câu kết)."""
    van = [_mot(m) for m in ds_van()]
    return {"nguon_hien_thi": NGUON_HIEN_THI, "trang_thai": meta()["trang_thai"], "chu_de": chu_de(), "van": van,
            "cau_ket": sach_ghi.CAU_KET, "do_hinh": do_hinh()}


def do_hinh() -> dict | None:
    d = _d().get("do_hinh")
    if not d:
        return None
    diem = [{k: v for k, v in p.items() if k != "sach_ghi"} | (
        {"sach_ghi": {k: v for k, v in p["sach_ghi"].items() if k != "han_kho"}} if p.get("sach_ghi") else {}) for p in d["diem"]]
    return {**{k: v for k, v in d.items() if k != "diem"}, "diem": diem, "duong": "/chi-tay", "khac": []}


def _loc_c(chon: list[dict], tuoi: int | None) -> tuple[list[dict], int]:
    """Không biết tuổi / chưa đủ 18 → bỏ nhóm C; sắp A → B → C (giữ thứ tự gốc trong cùng nhóm)."""
    co_c = tuoi is not None and tuoi >= TUOI_NHOM_C
    giu = [m for m in chon if m["nhom"] != "C" or co_c]
    giu.sort(key=lambda m: "ABC".index(m["nhom"]))
    return giu, len(chon) - len(giu)


def _sach(m: dict) -> dict:
    """Một câu sách (theo số đo / theo cung) cho người dùng: không `han_kho`, phiên âm chỉ ở nhóm A (như `_mot`)."""
    ra = {k: m[k] for k in ("ma", "han", "nhom", "chu_de", "y")}
    if m["nhom"] == "A":
        ra["am"] = m["am"]
    for k in ("ham_y", "viec"):
        if m.get(k):
            ra[k] = m[k]
    ra["loi"] = sach_ghi.loi(m, co_am=False)
    return ra


# ---- CT-2: đo bàn tay trên ảnh + tám cung -------------------------------------------------------------------------
def do_tay_cfg() -> dict:
    return _d().get("do_tay") or {}


def cung_tay() -> dict[str, dict]:
    """Tám cung + Minh Đường (thứ tự trong KB), bỏ khoá ghi chú."""
    return {k: v for k, v in (_d().get("cung_tay") or {}).items() if not k.startswith("_")}


def sach_theo_nhan(ma_nhan: str) -> list[dict]:
    return (_d().get("sach_do_tay") or {}).get(ma_nhan) or []


def ket_qua_do_tay(kq: dict, tay: str, tuoi: int | None) -> dict:
    """Ghép kết quả CALC `chi_tay_do.do_tay` với chữ KB: nhãn, câu sách theo số đo (SX-C), tám cung kèm lựa chọn tự soi.
    Ảnh không dùng được → `loi_nhac` (lời nhắc chụp lại). Không trả ngưỡng / trọng số / `han_kho`."""
    cfg = do_tay_cfg()
    if not kq["hop_le"]:
        ten = (cfg.get("ten_tay") or {}).get(tay, "")
        return {"hop_le": False, "loi": kq["loi"], "loi_nhac": cfg["loi"][kq["loi"]].format(tay=ten), "so_do": None,
                "nhan": [], "sach_ghi": [], "cung": [], "bo_nhom_c": 0, "cau_ket": ""}
    nhan = [{"ma": n["ma"], "truc": n["truc"], "vua": n["vua"], "ten": cfg["nhan"][n["ma"]]["ten"],
             "y": cfg["nhan"][n["ma"]]["y"]} for n in kq["nhan"]]
    giu, bo_c = _loc_c([m for n in kq["nhan"] for m in sach_theo_nhan(n["ma"])], tuoi)
    ct = cung_tay()
    cung = [{"ma": c["ma"], "han": ct[c["ma"]]["han"], "am": ct[c["ma"]]["am"], "ten": ct[c["ma"]]["ten"], "vt": c["vt"],
             "y": ct[c["ma"]]["y"], "lua_chon": [{"ma": x["ma"], "ten": x["ten"]} for x in ct[c["ma"]]["lua_chon"]]}
            for c in kq["cung"]]
    return {"hop_le": True, "loi": None, "loi_nhac": None, "so_do": kq["so_do"], "nhan": nhan,
            "sach_ghi": [_sach(m) for m in giu], "cung": cung, "bo_nhom_c": bo_c,
            "cau_ket": sach_ghi.cau_ket(giu) if giu else ""}


def lua_chon_hop_le(cung: dict[str, str]) -> list[str]:
    """Danh sách lỗi (rỗng = đạt) của các lựa chọn cung người dùng gửi."""
    ct = cung_tay()
    loi = []
    for ma, lc in cung.items():
        if ma not in ct:
            loi.append(f"không có cung {ma!r}")
        elif lc not in {x["ma"] for x in ct[ma]["lua_chon"]}:
            loi.append(f"cung {ma!r} không có lựa chọn {lc!r}")
    return loi


def doc(ds_ma: list[str], tuoi: int | None, cung: dict[str, str] | None = None) -> dict:
    """Lời sách xưa cho các vân và lựa chọn từng cung NGƯỜI DÙNG TỰ CHỌN (thứ tự: A → B → C). Không biết tuổi / chưa đủ 18
    → bỏ nhóm C. `muc` = vân (thư viện), `muc_cung` = câu theo cung (thêm `cung`, `lua_chon` để web gắn vào cung)."""
    chon = [m for ma in dict.fromkeys(ds_ma) if (m := lay(ma))]
    giu, bo_c = _loc_c(chon, tuoi)
    ct = cung_tay()
    theo_cung = [(ma, lc, m) for ma in ct if (lc := (cung or {}).get(ma)) for m in (ct[ma].get("sach") or {}).get(lc) or []]
    giu_cung, bo_c2 = _loc_c([m for _, _, m in theo_cung], tuoi)
    cua = {id(m): (ma, lc) for ma, lc, m in theo_cung}
    muc_cung = [{**_sach(m), "cung": cua[id(m)][0], "lua_chon": cua[id(m)][1]} for m in giu_cung]
    tat_ca = giu + giu_cung
    return {"muc": [_mot(m) for m in giu], "muc_cung": muc_cung, "bo_nhom_c": bo_c + bo_c2,
            "cau_ket": sach_ghi.cau_ket(tat_ca) if tat_ca else "", "khong_ro": [ma for ma in ds_ma if not lay(ma)]}
