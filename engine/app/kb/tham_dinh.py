# -*- coding: utf-8 -*-
"""EEAT-1 — sổ thẩm định trang kiến thức: ai chịu trách nhiệm, ai viết, ai đã duyệt.

Tầng KB: chỉ GHI NHẬN việc người thật đã làm, không sinh nội dung. Ba vai trò, không lẫn nhau:
- chủ biên (`CHU_BIEN`): chịu trách nhiệm biên tập toàn site → mọi trang;
- tác giả: chỉ trang có nội dung do chính chuyên gia viết (ý nghĩa số — `_TAC_GIA_THEO_LOAI`);
- thẩm định: chỉ trang chuyên gia ĐÃ đọc và duyệt, ghi trong `data/tham_dinh.json` → trang chuyển "da_duyet".
Trang chưa thẩm định giữ nhãn biên soạn có AI hỗ trợ (minh bạch theo hướng dẫn "Who/How/Why" của Google).

Hồ sơ hiển thị (tiểu sử, lĩnh vực) nằm ở web `lib/chuyen-gia.ts`; engine chỉ biết mã (slug) chuyên gia.
Đánh dấu: `python scripts/tham_dinh.py danh-dau <loai> <slug>` (xem `--help`).
"""
from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path

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


def gan(t: dict) -> dict:
    """Gắn chu_bien / tac_gia / tham_dinh / bien_soan vào một trang (gọi từ trang._hoan_tat)."""
    tg = _TAC_GIA_THEO_LOAI.get(t["loai"])
    td = _doc_so()["trang"].get(f"{t['loai']}/{t['slug']}")
    t["chu_bien"] = CHU_BIEN
    t["tac_gia"] = tg
    t["tham_dinh"] = {"nguoi": td["nguoi"], "ngay": td["ngay"]} if td else None
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


def danh_dau(so: dict, loai: str, slug: str, nguoi: str, ngay: str, ghi_chu: str = "") -> None:
    _kiem(so, loai, slug, nguoi)
    so["trang"][f"{loai}/{slug}"] = {"nguoi": nguoi, "ngay": ngay, **({"ghi_chu": ghi_chu} if ghi_chu else {})}


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
