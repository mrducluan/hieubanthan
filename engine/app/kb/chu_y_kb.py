# -*- coding: utf-8 -*-
"""Tầng KB — CY-1 (2026-11-04): MỘT nguồn cho lời "năm nên chú ý {mảng} hơn" của mọi mảng đời (tiền bạc, công việc,
tình cảm, gia đạo, nhà cửa, đi lại, giấy tờ, bạn bè) — mở rộng cách làm SK-1 (`suc_khoe_kb`). Nguồn:
app/kb/data/chu_y_kb.json (nháp ban biên tập, `source_id` + `school_id` ở gốc tệp và từng mục). Chỉ TRA, không sinh nghĩa."""
from __future__ import annotations

from pathlib import Path
from app.kb import nap

_F = Path(__file__).parent / "data" / "chu_y_kb.json"


@nap.nho
def _d() -> dict:
    try:
        d = nap.doc(_F.name)
    except (OSError, ValueError):
        return {}
    return d if isinstance(d, dict) else {}


def meta() -> dict:
    d = _d()
    return {"trang_thai": d.get("trang_thai", "nhap_ai"), "source_id": d.get("source_id", "tvds_toan_thu"),
            "school_id": d.get("school_id", "doi_song_chu_y")}


def cac_mang() -> list[str]:
    return [k for k in (_d().get("mang") or {}) if not k.startswith("_")]


def mang(ma: str) -> dict:
    m = (_d().get("mang") or {}).get(ma)
    return m if isinstance(m, dict) else {}


def ten(ma: str) -> str:
    return mang(ma).get("ten") or ma.replace("_", " ")


def viec(ma: str, hien_tai: bool = False) -> str:
    m = mang(ma)
    return (m.get("viec_nay") if hien_tai else None) or m.get("viec") or ""


def de_y(ma: str, theo: str | None = None) -> str:
    """CY-2: điều nên để ý của mảng (một vế, không dấu chấm cuối) — lời hai mặt của hỏi đáp. `theo`: tình huống cụ thể
    trong mảng (`de_y_theo`: mở quán / kinh doanh trong mảng công việc, nhân viên trong mảng người cùng làm ăn)."""
    m = mang(ma)
    return ((m.get("de_y_theo") or {}).get(theo) if theo else None) or m.get("de_y") or ""


def pt_bo_tri(ma: str) -> str:
    """CY-2: một gợi ý bố trí trong nhà cho câu hỏi Phong thuỷ không về nhà (bàn làm việc, góc học, cửa…)."""
    return mang(ma).get("pt_bo_tri") or ""


def viec_ds(ma: str, con: bool = False, theo: str | None = None) -> list[str]:
    """CY-2: danh sách việc cụ thể (người cùng làm ăn, kỳ thi…) — chọn vài việc cho đoạn trả lời. `con`: bản việc cha mẹ
    làm cùng con (`viec_ds_con`), không có thì bản thường; `theo`: tình huống cụ thể (`viec_ds_theo`)."""
    m = mang(ma)
    ds = ((m.get("viec_ds_theo") or {}).get(theo) if theo else None) or (m.get("viec_ds_con") if con else None) \
        or m.get("viec_ds") or []
    return [x for x in ds if isinstance(x, str)]


def sang_chung(ma: str, con: bool = False) -> str:
    """CY-3: điểm sáng chung của mảng (lời không đoán, không nêu dữ kiện) — chỉ dùng khi gói bằng chứng không có điểm sáng."""
    m = mang(ma)
    return (m.get("sang_chung_con") if con else None) or m.get("sang_chung") or ""


def ten_con(ma: str) -> str:
    """CY-3: tên mảng khi điều được hỏi là của con ("chuyện học hành, thi cử của con")."""
    return mang(ma).get("ten_con") or ten(ma)


def ranh_gioi(ma: str, theo: str | None = None) -> str:
    m = mang(ma)
    return ((m.get("ranh_gioi_theo") or {}).get(theo) if theo else None) or m.get("ranh_gioi") or ""


def theo_mon(ma: str, mon: str) -> dict:
    """Phần dữ kiện của mảng theo môn (`tuvi` / `battu` / `thanso` / `phongthuy`); không có → {}."""
    m = mang(ma).get(mon)
    return m if isinstance(m, dict) else {}


def chuong(mon: str) -> dict[str, list[str]]:
    """Chương báo cáo đời sống của môn → các mảng chú ý (mảng đầu đứng trước)."""
    m = (_d().get("chuong") or {}).get(mon)
    return {k: list(v) for k, v in (m or {}).items() if not k.startswith("_") and isinstance(v, list)}


def mau(ma: str) -> str:
    m = (_d().get("mau") or {}).get(ma)
    return m.strip() if isinstance(m, str) else ""


def hoi_tu_khoa() -> dict[str, list[str]]:
    return {k: v for k, v in (_d().get("hoi") or {}).items() if not k.startswith("_") and isinstance(v, list)}


def hoi_lo() -> list[str]:
    return [x for x in (_d().get("hoi_lo") or []) if isinstance(x, str)]


def van_han() -> list[str]:
    return [x for x in (_d().get("van_han") or []) if isinstance(x, str)]


def cum_cam() -> list[str]:
    return [c for c in (_d().get("cum_cam") or []) if isinstance(c, str)]
