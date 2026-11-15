# -*- coding: utf-8 -*-
"""TR-6 — xuất 78 lá Tarot "sạch bản quyền" từ kho tri thức của dự án ra MỘT tệp JSON.

Dùng để thay phần văn chép từ sách còn bản quyền (Bunning 1998, Pollack 1980) trong database riêng của chủ dự án:
mỗi lá gồm chữ do ban biên tập Hiểu Bản Thân tự viết (tên, từ khoá, hình, nghĩa xuôi / ngược, 4 lĩnh vực, việc nên làm, câu tự
soi), các tương ứng là DỮ KIỆN (nguyên tố, hành tinh / cung, chữ Hebrew, con đường, Sephirah, decan Book T) và các câu NGUYÊN VĂN
của sách đã thuộc phạm vi công cộng kèm tên sách (Waite 1910, Book T, Mathers 1888, Papus 1892, Case 1920, Ouspensky 1913).
Không có câu nào của Bunning / Pollack / Crowley 1944 / Case 1947 / Jodorowsky.

Dùng:  python scripts/xuat_tarot_pd.py <duong_dan_ra.json>

Chỉ ĐỌC `app/kb/data/tarot_kb.json` + `fixtures/nguon/tarot_*.json`; không tính gì, không gọi mạng.
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

GOC = Path(__file__).resolve().parent.parent
KB = GOC / "app" / "kb" / "data" / "tarot_kb.json"
NGUON = GOC / "fixtures" / "nguon"

# mã lá của database ngoài (MAJOR_00_FOOL, WANDS_05_FIVE, CUPS_13_QUEEN…) để ghép theo khoá
_BO = {"gay": "WANDS", "coc": "CUPS", "kiem": "SWORDS", "tien": "PENTACLES"}
_CAP = {"tieu_dong": (11, "PAGE"), "hiep_si": (12, "KNIGHT"), "hoang_hau": (13, "QUEEN"), "vua": (14, "KING")}
_SO = ["", "ACE", "TWO", "THREE", "FOUR", "FIVE", "SIX", "SEVEN", "EIGHT", "NINE", "TEN"]
# tình trạng phạm vi công cộng của từng sách (fixture mới có sẵn trong `_nguon.pd`; ba fixture cũ ghi tại đây)
_PD = {"waite_1910": "A. E. Waite mất 1942; xuất bản 1910 — phạm vi công cộng",
       "book_t": "tài liệu nội bộ Golden Dawn khoảng 1888–1896 (Mathers mất 1918, Felkin mất 1926) — phạm vi công cộng",
       "mathers_1888": "S. L. MacGregor Mathers mất 1918; xuất bản 1888 — phạm vi công cộng"}


def _card_id(ma: str, la: dict) -> str:
    if la["loai"] == "an_chinh":
        ten = re.sub(r"^THE_", "", re.sub(r"[^A-Z]+", "_", la["en"].upper()).strip("_"))
        return f"MAJOR_{la['so']:02d}_{ten}"
    bo, cap = ma.split("_", 1)
    so, ten = _CAP[cap] if cap in _CAP else (int(cap), _SO[int(cap)])
    return f"{_BO[bo]}_{so:02d}_{ten}"


def xuat() -> dict:
    kb = json.loads(KB.read_text("utf-8"))
    ten_sach, bo, nt, cung, ht = kb["nguon"], kb["bo"], kb["nguyen_to"], kb["cung_hoang_dao"], kb["hanh_tinh"]
    sach: dict[str, dict] = {}
    for ma_sach, dc in kb["doi_chieu"].items():
        n = json.loads((NGUON / Path(dc["tep"]).name).read_text("utf-8")).get("_nguon")
        n = n if isinstance(n, dict) else {}
        sach[ma_sach] = {"ten": ten_sach.get(ma_sach, ma_sach), "ban": dc["ban"], "pham_vi_cong_cong": n.get("pd") or _PD[ma_sach],
                         **({"url": n["url"]} if n.get("url") else {})}
    la_ra = []
    for ma, l in kb["la"].items():
        ct, dec = l.get("chiem_tinh"), l.get("decan")
        tuong_ung = {
            "nguyen_to": {"ma": l["nguyen_to"], "ten": nt[l["nguyen_to"]]["ten"], "en": nt[l["nguyen_to"]]["en"]},
            **({"chiem_tinh": {"loai": ct["loai"], "ten": ct["ten"],
                               "en": cung[ct["ma"]]["en"] if ct["loai"] == "cung" else ht[ct["ma"]]["en"] if ct["loai"] == "hanh_tinh"
                               else nt[ct["ma"]]["en"]}} if ct else {}),
            **({"chu_hebrew": l["chu_cai"], "con_duong": l["duong"]} if l.get("chu_cai") else {}),
            **({"sephirah": {"so": l["sephirah"], "ten": kb["sephirah"][str(l["sephirah"])]}} if l.get("sephirah") else {}),
            **({"decan": {"cung": cung[dec["cung"]]["ten"], "cung_en": cung[dec["cung"]]["en"], "thu": dec["so"],
                          "hanh_tinh": ht[dec["hanh_tinh"]]["ten"], "hanh_tinh_en": ht[dec["hanh_tinh"]]["en"],
                          "tu": cung[dec["cung"]]["decan"][dec["so"] - 1][0], "den": cung[dec["cung"]]["decan"][dec["so"] - 1][1]}} if dec else {}),
            **({"nguyen_to_phu": l["ten_nguyen_to_phu"]} if l.get("ten_nguyen_to_phu") else {}),
            **({"ten_book_t": l["thoth_ten"]} if l.get("thoth_ten") else {}),
            **({"ten_marseille": l["tdm_ten"]} if l.get("tdm_ten") else {}),
        }
        nguyen_van = []
        for tr in l.get("trich") or []:
            assert tr["sach"] in sach, (ma, tr["sach"])            # chỉ sách có kho nguồn nguyên văn phạm vi công cộng
            nguyen_van.append({"ma_sach": tr["sach"], "sach": sach[tr["sach"]]["ten"],
                               **({"ten_trong_sach": tr["ten"]} if tr.get("ten") else {}),
                               "nguyen_van": tr["nguyen_van"],
                               **({"nguyen_van_nguoc": tr["nguyen_van_nguoc"]} if tr.get("nguyen_van_nguoc") else {}),
                               **({"bieu_tuong": tr["bieu_tuong"]} if tr.get("bieu_tuong") else {}),
                               "tom_y_vi": tr["nghia"]})
        la_ra.append({
            "id": ma, "card_id": _card_id(ma, l), "ten_vi": l["ten"], "ten_en": l["en"], "loai": l["loai"], "so": l["so"],
            **({"bo": {"ma": l["bo"], "ten": bo[l["bo"]]["ten"], "en": bo[l["bo"]]["en"]}} if l.get("bo") else {}),
            "tu_khoa": l["tu_khoa"], "tu_khoa_nguoc": l["tu_khoa_nguoc"], "hinh_anh": l["hinh_anh"],
            "y_xuoi": l["y_xuoi"], "y_nguoc": l["y_nguoc"], "linh_vuc": l["linh_vuc"], "linh_vuc_nguoc": l.get("linh_vuc_nguoc"),
            "viec_nen_lam": l["viec"], "cau_tu_soi": l["cau_tu_soi"], **({"nhan_vat": l["nhan_vat"]} if l.get("nhan_vat") else {}),
            "tuong_ung": tuong_ung,
            "cach_doc_ban_bien_tap": {k: v["loi"] for k, v in l["truong_phai"].items() if v.get("loi")},
            "nguyen_van_pham_vi_cong_cong": nguyen_van,
        })
    return {
        "mo_ta": "78 lá Tarot — chữ do ban biên tập Hiểu Bản Thân viết (nháp, chờ chuyên gia duyệt) + tương ứng + câu nguyên văn của sách "
                 "phạm vi công cộng. Không chứa câu nào của sách còn bản quyền.",
        "luu_y": ["`cach_doc_ban_bien_tap` là lời tóm ý của ban biên tập cho bốn lối đọc (rws, thoth, tdm, bota); lối thoth và bota của ẩn phụ "
                  "chưa có nguyên văn đối chiếu.",
                  "Decan theo Book T; mốc ngày [tháng, ngày] là mốc phổ biến, lệch ±1 ngày tuỳ năm.",
                  "Chữ Hebrew, con đường, hành tinh / cung của 22 ẩn chính theo lối Golden Dawn (trùng Case 1920); Papus dùng lối Pháp khác."],
        "tong_so_la": len(la_ra), "sach": sach, "la": la_ra,
    }


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit("Dùng: python scripts/xuat_tarot_pd.py <duong_dan_ra.json>")
    d = xuat()
    Path(sys.argv[1]).write_text(json.dumps(d, ensure_ascii=False, indent=1) + "\n", "utf-8")
    print(d["tong_so_la"], "lá;", sum(len(x["nguyen_van_pham_vi_cong_cong"]) for x in d["la"]), "câu nguyên văn;", len(d["sach"]), "sách →", sys.argv[1])
