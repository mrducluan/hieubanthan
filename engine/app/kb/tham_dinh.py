# -*- coding: utf-8 -*-
"""EEAT-1 — sổ thẩm định trang kiến thức: ai chịu trách nhiệm, ai viết, ai đã duyệt.

Tầng KB: chỉ GHI NHẬN việc người thật đã làm, không sinh nội dung. Ba vai trò, không lẫn nhau:
- chủ biên (`CHU_BIEN`): chịu trách nhiệm biên tập toàn site → mọi trang;
- tác giả: chỉ trang có nội dung do chính chuyên gia viết (ý nghĩa số — `_TAC_GIA_THEO_LOAI`);
- thẩm định: chỉ trang chuyên gia ĐÃ đọc và duyệt, ghi trong `data/tham_dinh.json` → trang chuyển "da_duyet".
Trang chưa thẩm định: web ghi "Ban biên tập + Chủ biên" (BM-1). Trang đã thẩm định có thể kèm "Góc nhìn chuyên gia" (GN-1).

Hồ sơ hiển thị (tiểu sử, lĩnh vực) nằm ở web `lib/chuyen-gia.ts`; engine chỉ biết mã (slug) chuyên gia.
Đánh dấu: `python scripts/tham_dinh.py danh-dau <loai> <slug>` (xem `--help`).
"""
from __future__ import annotations

import json
import re
from functools import lru_cache
from pathlib import Path

from app.narrative import hoi_van

_FILE = Path(__file__).parent / "data" / "tham_dinh.json"

CHU_BIEN = "duc-luan"
_TAC_GIA_THEO_LOAI = {"so": "duc-luan"}     # thanso_meanings: chủ dự án tự viết (pythagoras_vn)

# Thứ tự thẩm định gợi ý: trang trụ cột trước (nhiều trang khác trỏ vào), cụm trang dài sau.
_UU_TIEN = ("sao", "cung", "que", "nhat_chu", "thap_than", "cap_so", "nghe", "tinh_yeu", "nam_ca_nhan",
            "no_nghiep", "hoa_cung", "menh_nam", "sao_cung", "so")


@lru_cache(maxsize=1)
def _doc_file() -> dict:
    return json.loads(_FILE.read_text("utf-8"))


def _doc_so() -> dict:
    return _doc_file()


# GN-1 — "Góc nhìn chuyên gia": 2–4 câu kinh nghiệm thật, do CHÍNH chuyên gia viết, chỉ đi kèm trang người đó đã thẩm
# định (hoặc tự viết). Hệ thống chỉ sửa chính tả, không thêm ý. Luật nội dung như KB: không phán, không bệnh tật/sống
# chết, không bán vật phẩm/giải hạn, không dẫn liên hệ ra ngoài. `ghi_chu` là ghi chú NỘI BỘ (đã sửa gì) — không lộ.
GOC_NHIN_TOI_THIEU, GOC_NHIN_TOI_DA = 60, 800
_CAM_GOC_NHIN = [*hoi_van.CAM, "lời nguyền", "khắc chết", "chết yểu", "phá sản", "ly hôn chắc", "hoá giải",
                 "giải hạn", "vật phẩm", "bùa", "cúng sao", "dâng sao", "chữa bệnh", "trúng số", "lô đề"]
_LIEN_HE = re.compile(r"https?://|www\.|\b\d[\d .]{8,}\d\b|@\w+\.\w+|zalo", re.I)
# Chuẩn hoá bỏ dấu kiểu cũ/mới (hóa ↔ hoá) trước khi so cụm cấm.
_DAU = str.maketrans({"ó": "o", "ò": "o", "ỏ": "o", "õ": "o", "ọ": "o", "á": "a", "à": "a", "ả": "a", "ã": "a",
                      "ạ": "a", "ú": "u", "ù": "u", "ủ": "u", "ũ": "u", "ụ": "u", "ý": "y", "ỳ": "y", "ỷ": "y",
                      "ỹ": "y", "ỵ": "y", "é": "e", "è": "e", "ẻ": "e", "ẽ": "e", "ẹ": "e"})


def kiem_goc_nhin(van: str) -> list[str]:
    """Lỗi của một đoạn Góc nhìn chuyên gia (rỗng = hợp lệ)."""
    loi = []
    n = len(van.strip())
    if not GOC_NHIN_TOI_THIEU <= n <= GOC_NHIN_TOI_DA:
        loi.append(f"độ dài {n} ký tự (cần {GOC_NHIN_TOI_THIEU}–{GOC_NHIN_TOI_DA}, khoảng 2–4 câu)")
    thuong = van.lower().translate(_DAU)
    for c in _CAM_GOC_NHIN:
        if c.lower().translate(_DAU) in thuong:
            loi.append(f"có cụm \"{c}\" (giọng phán / ngoài ranh giới nội dung)")
    if _LIEN_HE.search(van):
        loi.append("có liên kết, số điện thoại hoặc thông tin liên hệ")
    return loi


def gan(t: dict) -> dict:
    """Gắn chu_bien / tac_gia / tham_dinh / bien_soan vào một trang (gọi từ trang._hoan_tat)."""
    tg = _TAC_GIA_THEO_LOAI.get(t["loai"])
    td = _doc_so()["trang"].get(f"{t['loai']}/{t['slug']}")
    t["chu_bien"] = CHU_BIEN
    dx = _doc_so().get("duyet_xuat_ban")
    # DX-1: chủ biên duyệt xuất bản toàn kho (quyết định biên tập) — khác thẩm định từng bài.
    t["duyet_xuat_ban"] = {"nguoi": dx["nguoi"], "ngay": dx["ngay"]} if dx else None
    t["tac_gia"] = tg
    t["tham_dinh"] = {"nguoi": td["nguoi"], "ngay": td["ngay"]} if td else None
    t["goc_nhin"] = ({"noi_dung": td["goc_nhin"], "nguoi": td["nguoi"], "ngay": td["ngay"]}
                     if td and td.get("goc_nhin") else None)
    t["bien_soan"] = "chuyen_gia" if tg else "ai_ho_tro"
    if td:
        t["trang_thai"] = "da_duyet"
    return t


def _kiem(so: dict, loai: str, slug: str, nguoi: str) -> None:
    from app.kb import trang
    if nguoi not in so["chuyen_gia"]:
        raise ValueError(f"Chưa khai báo chuyên gia '{nguoi}' trong tham_dinh.json")
    if loai not in trang.LOAI or trang.lay(loai, slug) is None:
        raise ValueError(f"Không có trang {loai}/{slug}")


def danh_dau(so: dict, loai: str, slug: str, nguoi: str, ngay: str, ghi_chu: str = "", goc_nhin: str = "") -> None:
    _kiem(so, loai, slug, nguoi)
    goc_nhin = " ".join(goc_nhin.split())
    if goc_nhin and (loi := kiem_goc_nhin(goc_nhin)):
        raise ValueError("Góc nhìn chuyên gia chưa đạt: " + "; ".join(loi))
    so["trang"][f"{loai}/{slug}"] = {"nguoi": nguoi, "ngay": ngay, **({"ghi_chu": ghi_chu} if ghi_chu else {}),
                                     **({"goc_nhin": goc_nhin} if goc_nhin else {})}


def bo(so: dict, loai: str, slug: str) -> None:
    so["trang"].pop(f"{loai}/{slug}", None)


def ghi(so: dict) -> None:
    so["trang"] = dict(sorted(so["trang"].items()))
    _FILE.write_text(json.dumps(so, ensure_ascii=False, indent=1) + "\n", "utf-8")
    _doc_file.cache_clear()


def hang_doi() -> list[dict]:
    """Trang chưa duyệt, theo thứ tự ưu tiên thẩm định."""
    from app.kb import trang
    ds = [t for t in trang.danh_sach() if t["trang_thai"] != "da_duyet"]
    return sorted(ds, key=lambda t: _UU_TIEN.index(t["loai"]) if t["loai"] in _UU_TIEN else len(_UU_TIEN))


def hang_doi_gsc(duong_csv) -> list[dict]:
    """Hàng đợi theo số liệu thật: file CSV tab "Trang" xuất từ Search Console (tiếng Việt hay Anh đều được — đọc theo
    vị trí cột: URL, lượt nhấp, lượt hiển thị, CTR, vị trí). Chỉ trang chưa thẩm định, xếp theo lượt hiển thị bị bỏ lỡ
    (hiển thị − nhấp): trang Google đã cho lên nhưng ít người bấm là chỗ thẩm định + viết lại "Trả lời nhanh" lợi nhất."""
    import csv
    from app.kb import trang
    theo_slug = {}
    for t in trang.danh_sach():
        theo_slug.setdefault(t["slug"], []).append(t)
    gop = {}   # (loai, slug) → một dòng: tuần chuyển URL GSC báo cả URL cũ lẫn mới cho cùng trang
    with open(duong_csv, encoding="utf-8-sig", newline="") as f:
        dong = list(csv.reader(f))
    for d in dong[1:]:
        # Trang KB: URL cũ /kien-thuc/{cụm}/{trang} hoặc silo mới /{mảng}/{cụm}/{trang} (QH-URL) — khớp theo slug duy nhất.
        if len(d) < 5 or not any(x in d[0] for x in ("/kien-thuc/", "/than-so/", "/hop-doi/cap-so/", "/tu-vi/", "/bat-tu/", "/kinh-dich/que/")):
            continue
        slug = d[0].rstrip("/").split("/")[-1].removesuffix(".md")
        khop = theo_slug.get(slug, [])
        if len(khop) != 1 or khop[0]["trang_thai"] == "da_duyet":
            continue
        so = lambda x: float(x.replace("%", "").replace(",", ".") or 0)
        g = gop.setdefault((khop[0]["loai"], slug), {**khop[0], "nhap": 0, "hien_thi": 0, "_vt": 0.0, "_vt_dau": so(d[4])})
        g["nhap"] += int(so(d[1]))
        g["hien_thi"] += int(so(d[2]))
        g["_vt"] += so(d[4]) * int(so(d[2]))
    ra = []
    for g in gop.values():
        vt, dau = g.pop("_vt"), g.pop("_vt_dau")
        g["vi_tri"] = round(vt / g["hien_thi"], 1) if g["hien_thi"] else dau   # vị trí bình quân theo hiển thị
        g["bo_lo"] = g["hien_thi"] - g["nhap"]
        ra.append(g)
    return sorted(ra, key=lambda x: -x["bo_lo"])


def ho_so(slug: str) -> dict | None:
    """Số liệu trang theo chuyên gia — cho trang hồ sơ /tac-gia/{slug}."""
    from app.kb import trang
    if slug not in _doc_so()["chuyen_gia"]:
        return None
    ds = trang.danh_sach()
    tg = [t for t in ds if t["tac_gia"] == slug]
    td = sorted((t for t in ds if (t["tham_dinh"] or {}).get("nguoi") == slug),
                key=lambda t: t["tham_dinh"]["ngay"], reverse=True)
    cb = [t for t in ds if t["chu_bien"] == slug]
    gon = lambda t: {k: t[k] for k in ("loai", "slug", "tieu_de", "tham_dinh")}
    return {
        "slug": slug,
        "so_trang": {"chu_bien": len(cb), "tac_gia": len(tg), "tham_dinh": len(td),
                     "cho_tham_dinh": sum(1 for t in cb if t["trang_thai"] != "da_duyet")},
        "tac_gia": [gon(t) for t in tg],
        "tham_dinh_gan_day": [gon(t) for t in td[:12]],
    }
