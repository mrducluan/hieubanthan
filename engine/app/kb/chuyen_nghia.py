# -*- coding: utf-8 -*-
"""Tầng KB — kho chuyển nghĩa: khái niệm trong sách xưa (ra quân, giữ thành, săn bắt, dâng thư…) → nghĩa tương đồng đời nay
theo từng lĩnh vực (kinh doanh, đời sống cá nhân, gia đình, tiền bạc, công danh, sức khoẻ, con cái, nghề nghiệp, học hành,
kế hoạch). Dùng chung mọi mảng (chủ dự án chốt 2026-11-18): bắt đầu từ Kỳ Môn, sau đó Kinh Dịch, Bát tự, Tử vi.

Chỉ TRA `chuyen_nghia_kb.json` (git là nguồn). Câu trích nguyên văn đi qua khuôn SX-C (`sach_ghi`); lời đời nay do ban biên
tập viết (nháp). Không sinh nghĩa; nhận diện cụm từ đời nay chỉ là so khớp chuỗi tất định."""
from __future__ import annotations

from app.kb import nap

TEP = "chuyen_nghia_kb.json"


@nap.nho
def _d() -> dict:
    d = nap.doc(TEP)
    return d if isinstance(d, dict) else {}


def linh_vuc() -> dict[str, str]:
    return dict(_d().get("linh_vuc") or {})


def khai_niem() -> dict[str, dict]:
    return dict(_d().get("khai_niem") or {})


def ranh_gioi(lv: str | None = None) -> str:
    rg = _d().get("ranh_gioi") or {}
    return rg.get(lv or "", "") or rg.get("chung", "")


def doc(ma: str, lv: str | None = None) -> dict:
    """Một khái niệm đọc theo một lĩnh vực: tên cổ, nghĩa, câu sách, việc đời nay của lĩnh vực ấy (thiếu → None)."""
    k = khai_niem()[ma]
    s = k["sach"]
    sach = {x: s[x] for x in ("han", "am", "y", "nhom", "ham_y", "viec") if s.get(x)}
    ra = {"ma": ma, "ten_co": k["ten_co"], "nghia": k["nghia"], "sach": sach,
          "ung_dung": dict(k.get("ung_dung") or {}), "ranh_gioi": ranh_gioi(lv)}
    if lv:
        ra |= {"linh_vuc": lv, "linh_vuc_ten": linh_vuc().get(lv, lv), "hom_nay": (k.get("ung_dung") or {}).get(lv)}
    return ra


def nguyen_tac() -> dict:
    return dict(_d().get("nguyen_tac") or {})


@nap.nho
def _cum() -> list[tuple[str, str]]:
    """(cụm, mã) xếp cụm dài trước — "giành lại thị phần" thắng "thị phần"."""
    ds = [(c.lower(), ma) for ma, k in khai_niem().items() for c in k.get("tu_hien_dai") or []]
    return sorted(ds, key=lambda x: -len(x[0]))


def nhan_dien(cau: str) -> list[dict]:
    """Các khái niệm có cụm từ đời nay xuất hiện trong câu (giữ thứ tự gặp, mỗi mã một lần, không chồng chữ)."""
    t = " ".join((cau or "").lower().split())
    ra, da, phu = [], set(), []
    for cum, ma in _cum():
        i = t.find(cum)
        if i < 0 or ma in da or any(a <= i < b or a < i + len(cum) <= b for a, b in phu):
            continue
        da.add(ma)
        phu.append((i, i + len(cum)))
        ra.append({"ma": ma, "cum": cum, "vi_tri": i})
    return [{"ma": x["ma"], "cum": x["cum"]} for x in sorted(ra, key=lambda x: x["vi_tri"])]
