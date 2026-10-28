# -*- coding: utf-8 -*-
"""MT-ĐS B6 — khung "Cần lưu ý ở từng mảng hay hỏi" cho báo cáo đời sống (Tử vi, Bát tự).

Bảy mảng người dùng hỏi nhiều nhất (tiền bạc · công việc & công danh · tình cảm · con cái · đi lại & an toàn · giấy tờ
& pháp lý · sức khoẻ). Mỗi mảng: MỨC lấy từ chương / cung đã chấm (RULES, không chấm lại), ĐIỀU NÊN ĐỂ Ý + VIỆC NÊN LÀM
lấy lại từ hộp "nên để ý" của chương (cùng `ma_mau` kiểm chứng) — không có hộp hợp thì dùng lời KB theo mức
(`luu_y_mang` trong *_doi_song_kb.json, nháp ban biên tập) — và RANH GIỚI cố định (bác sĩ / luật sư / không phải lời
khuyên đầu tư / không đoán giới tính, số con / không ai nói được có tai nạn hay không). Không biến cố, không điểm số.
Web khoá dòng của chương chưa mở (SAO-2) như hộp "Điều quan trọng nhất".
"""
from __future__ import annotations

import re

MANG = [
    # (mã, tên, chương Tử vi, cung Tử vi lấy mức, chương Bát tự, từ khoá chọn hộp)
    ("tien_bac", "Tiền bạc", "tien_bac", ["Tài Bạch"], "tien_bac", [r"tiền", r"nợ", r"vay", r"chi tiêu", r"thu nhập"]),
    ("cong_viec", "Công việc & công danh", "su_nghiep", ["Quan Lộc"], "su_nghiep",
     [r"công việc", r"việc", r"cấp trên", r"sếp", r"nghề", r"thăng", r"ghi nhận"]),
    ("tinh_cam", "Tình cảm & hôn nhân", "tinh_cam", ["Phu Thê"], "tinh_cam",
     [r"người ấy", r"hai người", r"tình cảm", r"vợ", r"chồng", r"bạn đời"]),
    ("con_cai", "Con cái", "gia_dinh", ["Tử Nữ"], "gia_dinh", [r"(?<!\w)con(?!\s*người)", r"với con", r"trẻ"]),
    ("di_lai", "Đi lại & an toàn", "quan_he", ["Thiên Di", "Tật Ách"], "quan_he",
     [r"ra ngoài", r"đi xa", r"đi lại", r"(?<!\w)xe(?!\w)", r"đi đường", r"chân tay", r"thể thao", r"đường xa"]),
    ("giay_to", "Giấy tờ & pháp lý", "quan_he", ["Nô Bộc", "Quan Lộc"], "quan_he",
     [r"giấy tờ", r"hợp đồng", r"tranh chấp", r"ký", r"đứng tên", r"thị phi", r"giấy"]),
    ("suc_khoe", "Sức khoẻ & năng lượng", "suc_khoe", ["Tật Ách"], "suc_khoe",
     [r"sức", r"ngủ", r"khám", r"cơ thể", r"vận động", r"ăn"]),
]
_THU_TU_MUC = {"can_chu_dong": 0, "can_bang": 1, "thuan": 2}


def kb_mang(mo_dun: str) -> dict:
    if mo_dun == "battu":
        from app.kb import battu_doi_song_kb as kb  # noqa: PLC0415
    else:
        from app.kb import tuvi_doi_song_kb as kb  # noqa: PLC0415
    return kb._d().get("luu_y_mang") or {}


_MAC_DINH = {"luu_y": "Mảng này đang ở mức như trên; xem chương tương ứng để biết chỗ nên để ý.",
             "viec": "Chọn một việc nhỏ trong chương tương ứng và làm trong tuần này."}


def _nhan_muc(mo_dun: str, muc: str) -> str:
    if mo_dun == "battu":
        from app.kb import battu_doi_song_kb as kb  # noqa: PLC0415
    else:
        from app.kb import tuvi_doi_song_kb as kb  # noqa: PLC0415
    return kb.nhan_muc(muc)


def _muc_thap(ds: list[str | None]) -> str:
    """Mức thấp nhất trong các mức (Cần lưu ý < Cân bằng < Thuận lợi) — mảng gộp nhiều cung lấy mức dè dặt hơn."""
    co = [m for m in ds if m in _THU_TU_MUC]
    return min(co, key=lambda m: _THU_TU_MUC[m]) if co else "can_bang"


def _cau_dau(s: str, toi_da: int = 320) -> str:
    """Một–hai câu đầu của một đoạn (≤ `toi_da` ký tự), kết thúc bằng dấu chấm."""
    cau = [c.strip() for c in re.split(r"(?<=[.!?])\s+", s.strip()) if c.strip()]
    ra = ""
    for c in cau:
        if ra and len(ra) + len(c) + 1 > toi_da:
            break
        ra = f"{ra} {c}".strip()
        if len(ra) >= 120:
            break
    ra = ra or s.strip()[:toi_da]
    return ra if ra.endswith((".", "!", "?")) else ra + "."


def _chon_hop(chuong: dict | None, tu_khoa: list[str], da_dung: set[str]) -> dict | None:
    """Hộp "nên để ý" của chương khớp từ khoá mảng (ưu tiên hộp cốt lõi), mỗi hộp chỉ dùng cho MỘT mảng; không có → None."""
    if not chuong:
        return None
    hop = [h for h in chuong.get("hop") or [] if h.get("loai") == "luu_y" and h.get("noi_dung")
           and (h.get("ma_mau") or h.get("tieu_de")) not in da_dung]
    khop = [h for h in hop if any(re.search(k, (h["tieu_de"] + " " + h["noi_dung"]).lower()) for k in tu_khoa)]
    khop.sort(key=lambda h: 0 if h.get("tham_chieu") == "cot_loi" else 1)
    return khop[0] if khop else None


def dung(bc_chuong: list[dict], mo_dun: str, muc_cung: dict[str, str] | None = None,
         muc_mang: dict[str, str] | None = None) -> list[dict]:
    """→ 7 dòng {ma, ten, muc, nhan_muc, luu_y, viec, ranh_gioi, tu_chuong, ma_mau?, can_cu}.
    `muc_cung` (Tử vi): {tên cung: mức}; `muc_mang` (Bát tự): {mảng: mức} — chỉ ĐỌC mức đã chấm."""
    kb = kb_mang(mo_dun)
    theo_ma = {c["ma"]: c for c in bc_chuong}
    ra = []
    da_dung: set[str] = set()
    for ma, ten, ch_tv, cung, ch_bt, tu_khoa in MANG:
        ch = ch_tv if mo_dun == "tuvi" else ch_bt
        c = theo_ma.get(ch)
        if mo_dun == "tuvi":
            muc = _muc_thap([(muc_cung or {}).get(x) for x in cung]) if muc_cung else (c or {}).get("muc") or "can_bang"
            if ma in ("tien_bac", "cong_viec", "tinh_cam", "suc_khoe") and c and c.get("muc"):
                muc = c["muc"]                      # mảng trùng chương → mức của chương (đã gộp đúng luật)
        else:
            muc = (muc_mang or {}).get(ch) or (c or {}).get("muc") or "can_bang"
            if ma == "di_lai":
                muc = _muc_thap([(muc_mang or {}).get("suc_khoe"), (muc_mang or {}).get("quan_he")])
            if ma == "giay_to":
                muc = _muc_thap([(muc_mang or {}).get("quan_he"), (muc_mang or {}).get("su_nghiep")])
            if ma == "con_cai":
                muc = (muc_mang or {}).get("gia_dinh") or muc
        h = _chon_hop(c, tu_khoa, da_dung)
        o = (kb.get(ma) or {}).get(muc) or _MAC_DINH          # KB thiếu ô vẫn chạy (test_kb_thieu_o_van_chay)
        if h:
            da_dung.add(h.get("ma_mau") or h.get("tieu_de"))
            viec = h.get("huong_xu_ly") or h.get("loi_khuyen") or o["viec"]
            viec = viec if viec.endswith(".") else viec + "."
            # thân hộp đã nối sẵn "hướng xử lý" ở cuối → bỏ để không lặp với dòng "Nên làm"
            than = h["noi_dung"].replace(viec, "").replace(viec.rstrip("."), "").strip()
            td = h["tieu_de"].rstrip(".")
            # tiêu đề hộp chỉ thêm khi câu đầu của thân chưa nói cùng ý (tránh "Dễ gánh nhiều. Trong tình cảm, bạn dễ gánh nhiều")
            tu_td = set(re.findall(r"\w+", td.lower()))
            tu_than = set(re.findall(r"\w+", _cau_dau(than, 200).lower())) if than else set()
            lap = bool(tu_td) and len(tu_td & tu_than) / len(tu_td) >= 0.6
            luu_y = (_cau_dau(than) if lap else f"{td}. {_cau_dau(than, 320 - len(td) - 2)}") if than else f"{td}."
            dong = {"luu_y": luu_y, "viec": viec, "ma_mau": h.get("ma_mau"), "can_cu": list(h.get("can_cu") or [])}
        else:
            dong = {"luu_y": o["luu_y"], "viec": o["viec"], "ma_mau": None,
                    "can_cu": [f"Mức của mảng lấy từ chương {c['tieu_de']}" if c else "Mức của mảng theo cung đã chấm"]}
        ra.append({"ma": ma, "ten": ten, "muc": muc, "nhan_muc": _nhan_muc(mo_dun, muc), "tu_chuong": ch,
                   "ranh_gioi": (kb.get("_ranh_gioi") or {}).get(ma), **dong})
    return ra
