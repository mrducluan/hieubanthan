# -*- coding: utf-8 -*-
"""Đo lời luận giải Tử vi "chung chung" (rà định kỳ — `docs/LUAN-GIAI-DOI-SONG.md` mục "Rà chung chung 2026-10-21").

Chạy:  cd engine && .venv/bin/python scripts/do_chung_chung_tuvi.py [--tat-ca] [--chi-tiet] [--json ra.json]

Mặc định đo trên 8 lá mẫu (chọn tất định từ golden `lasotuvi_60.json`: người lớn, Mệnh chính tinh khác nhau);
`--tat-ca` đo cả 60 lá. Chương `nam_nay` (nhịp tháng — phạm vi khác) đo riêng, không tính vào số chính.

Chỉ số (đều càng THẤP càng tốt):
  trung_giua_la    — trung bình |câu chung| / min(|câu A|, |câu B|) giữa mọi cặp lá "khác hẳn" (≤ 3 trong 12 cung có
                     cùng bộ chính tinh); câu cố định có chủ ý (miễn trừ sức khoẻ…) không tính. `max` = cặp tệ nhất.
  cau_barnum       — số câu khác nhau xuất hiện nguyên văn ở ≥ 50% số lá (câu "ai đọc cũng đúng").
  lap_trong_bai    — trung bình số câu lặp nguyên văn ≥ 2 lần trong MỘT bài (tóm tắt, đoạn, hộp — trừ chương
                     "Lời khuyên" và "Điều quan trọng nhất" vốn gom lại có chủ ý).
  mo_ho            — số câu chứa cụm chung chung (KB `cum_chung_chung`) / bài.
  thuat_ngu        — số câu (ngoài "Vì sao nói vậy") lộ tên sao, tên cung kỹ thuật, độ sáng, tứ hoá / bài.
  dinh_nghia_cung  — số câu định nghĩa cung ("Cung X là…", "Mảng này nói về…") thay vì nói về người xem / bài.
  luu_y_huong_chung— số hộp lưu ý có hướng xử lý chung (dùng nguyên văn cho ≥ 2 mảng đời khác nhau trong kho lá,
                     hoặc là câu dự phòng trong mã) / bài.
  kb_*             — soát KB: số mục KB (tuvi_doi_song_kb, tuvi_kb, tuvi_cach_cuc) chứa cụm chung chung / cụm cấm.

`--be-mat` (đợt 2): đo ba bề mặt NGOÀI bài luận giải, mỗi lá một "tập câu" người dùng đọc:
  phi_hoa   — thẻ "đường bay nổi bật" (`/v1/tuvi/phi-hoa` → noi_bat: tiêu đề, nghĩa, việc nên làm);
  the_cung  — lời giải nghĩa chính tinh trên thẻ chi tiết 12 cung (`/v1/tuvi/an-sao` → chinh_tinh[].giai_nghia,
              mọi trường chữ trừ `can_cu`);
  hoi_dap   — câu trả lời template cho 12 câu "Cung X của tôi nói gì?" (bỏ câu tự soi, câu kết cố định).
Chỉ số mỗi bề mặt: barnum (câu có ở ≥ 50% số lá), trung_tb / trung_max (giữa hai lá khác hẳn), thuat_ngu, mo_ho,
cum_cam (câu / lá).
"""
from __future__ import annotations

import argparse
import datetime as dt
import itertools
import json
import re
import sys
from collections import Counter, defaultdict
from pathlib import Path

GOC = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(GOC))

from app.kb import tuvi_doi_song_kb as kb  # noqa: E402
from app.luangiai import toan_bo  # noqa: E402
from app.luangiai import tuvi_doi_song as ds  # noqa: E402

XEM = dt.date(2026, 10, 21)
_G = json.loads((GOC / "fixtures" / "golden" / "lasotuvi_60.json").read_text("utf-8"))["cases"]

CHINH_TINH = ("Tử Vi", "Thiên Cơ", "Thái Dương", "Vũ Khúc", "Thiên Đồng", "Liêm Trinh", "Thiên Phủ", "Thái Âm",
              "Tham Lang", "Cự Môn", "Thiên Tướng", "Thiên Lương", "Thất Sát", "Phá Quân")
PHU_TINH = ("Tả Phù", "Hữu Bật", "Văn Xương", "Văn Khúc", "Thiên Khôi", "Thiên Việt", "Lộc Tồn", "Kình Dương",
            "Đà La", "Hỏa Tinh", "Hoả Tinh", "Linh Tinh", "Địa Không", "Địa Kiếp", "Hồng Loan", "Thiên Hỷ",
            "Đào Hoa", "Thiên Diêu", "Hàm Trì", "Tuần Không", "Triệt Lộ")
CUNG_KT = ("Quan Lộc", "Tài Bạch", "Tật Ách", "Thiên Di", "Nô Bộc", "Điền Trạch", "Phúc Đức", "Phụ Mẫu", "Huynh Đệ",
           "Tử Nữ", "Phu Thê")
THUAT_NGU = re.compile(r"Miếu|Hãm|(?<!\w)[Hh]o[áa] (?:Lộc|Quyền|Khoa|Kỵ)|(?<!\w)tự ho[áa]|tam phương|tam hợp|"
                       r"xung chiếu|(?<!\w)cung (?=[A-ZĐ])|đại hạn|lưu niên|tiểu hạn|"
                       + "|".join(re.escape(x) for x in CHINH_TINH + PHU_TINH + CUNG_KT))
DINH_NGHIA = re.compile(r"^(?:Cung [A-ZĐ][^ ]* ?[^ ]* (?:là|nói về|cho biết|chỉ)|Mảng này (?:là|nói về|cho biết)|"
                        r"Chương này|Đây là (?:cung|mảng))")
# Câu cố định CÓ CHỦ Ý (miễn trừ, câu nối giải thích cách đọc) — không tính là Barnum.
CO_DINH = {
    kb.suc_khoe_chung(),
    "Đây là cách các mảng đời tác động lẫn nhau, không phải lời đoán sự kiện.",
    "Khi các lớp nói khác nhau, ưu tiên mười năm trước, rồi đến năm, rồi mới đến tháng.",
    # hỏi đáp về sức khoẻ: câu miễn trừ cố định (tách câu theo dấu chấm)
    *(c.strip() for c in re.split(r"(?<=[.!?])\s+", __import__("app.kb.tuvi_kb", fromlist=["x"]).luu_y("tat_ach"))),
}


def cac_cau(s: str) -> list[str]:
    return [c.strip() for c in re.split(r"(?<=[.!?])\s+", s or "") if len(c.strip()) > 3]


def chon_la(tat_ca: bool) -> list[dict]:
    """8 lá mẫu: người sinh 1946–2005, mỗi kiểu Mệnh chính tinh một lá (tất định theo thứ tự golden)."""
    ra, da = [], set()
    for ca in _G:
        sinh = {"ngay": dt.date.fromisoformat(ca["ngay"]), "ti": ca["ti"], "gioi_tinh": ca["gioi_tinh"]}
        if tat_ca:
            ra.append(sinh)
            continue
        if not 1946 <= sinh["ngay"].year <= 2005:
            continue
        menh = tuple(ca["menh"]) if isinstance(ca.get("menh"), list) else ca.get("menh")
        if menh in da:
            continue
        da.add(menh)
        ra.append(sinh)
        if len(ra) == 8:
            break
    return ra


def chu_bai(b: dict, gom_nam_nay: bool = False) -> list[tuple[str, str, str]]:
    """[(vị trí, loại, câu)] mọi câu người dùng đọc ở thân bài (không gồm can_cu, câu tự soi, cột lõi)."""
    ra = []
    for c in b["chuong"]:
        if (c["ma"] == "nam_nay") != gom_nam_nay:
            continue
        for x in cac_cau(c["tom_tat"]):
            ra.append((c["ma"], "tom_tat", x))
        for i, d in enumerate(c["doan"]):
            for x in cac_cau(d):
                if x not in cac_cau(c["tom_tat"]):
                    ra.append((c["ma"], f"doan{i}", x))
        for h in c["hop"]:
            for x in cac_cau(h["noi_dung"]):
                ra.append((c["ma"], f"hop:{h['ma_mau']}", x))
    if not gom_nam_nay:
        for g in b["thoi_gian_bieu"]:
            for x in cac_cau(g["mot_cau"]):
                ra.append(("thoi_gian_bieu", g["cung"], x))
    return ra


def _bo_sao(sinh: dict) -> dict[str, tuple]:
    from app.calc import tuvi_an_sao as az
    from app.hoidap.tuvi import tom_tat
    ls = tom_tat(az.an_sao_tho(sinh["ngay"], sinh["ti"], sinh["gioi_tinh"], "vi-VN"))
    return {c["ten"]: tuple(sorted(s["ten"] for s in c["chinh_tinh"])) for c in ls["cung"]}


def khac_han(a: dict, b: dict) -> bool:
    """Hai lá "khác hẳn": ≤ 3 trong 12 cung có cùng bộ chính tinh."""
    return sum(a[k] == b[k] for k in a) <= 3


_CUNG_RE = re.compile(r"cung ([A-ZĐ]\w* [A-ZĐ]\w*|Mệnh)")


def _khoa_huong(h: dict, ch: str) -> str:
    """Mảng đời của một hộp lưu ý: cung trong "Vì sao nói vậy" (không có thì theo chương)."""
    if ch == "suc_khoe":                 # lời sức khoẻ theo SAO (cùng sao ở Tật Ách hay Mệnh là cùng lời) — đúng ý
        return ch
    cu = h["can_cu"][0] if h["can_cu"] else ""
    m = re.search(r"chiếu sang ([A-ZĐ]\w*(?: [A-ZĐ]\w*)?)", cu) or _CUNG_RE.search(cu)
    return m.group(1) if m else ch


def do(la: list[dict], chi_tiet: bool = False) -> dict:
    cum = kb.cum_chung_chung()
    bai = [toan_bo.tuvi(s, ngay_xem=XEM) for s in la]
    bo = [_bo_sao(s) for s in la]
    chu = [chu_bai(b) for b in bai]
    tap = [{x for _, _, x in c} - CO_DINH for c in chu]

    # 1. Barnum giữa lá
    ty = []
    for i, j in itertools.combinations(range(len(bai)), 2):
        if not khac_han(bo[i], bo[j]):
            continue
        n = min(len(tap[i]), len(tap[j])) or 1
        ty.append((len(tap[i] & tap[j]) / n, i, j))
    dem = Counter(x for t in tap for x in t)
    barnum = sorted([(n, x) for x, n in dem.items() if n >= max(2, len(bai) / 2)], reverse=True)

    # 2. lặp trong bài
    lap = []
    for c in chu:
        k = Counter(x for ch, loai, x in c if ch != "loi_khuyen" and x not in CO_DINH)
        lap.append({x: n for x, n in k.items() if n >= 2})

    # 3–5. mơ hồ, thuật ngữ, định nghĩa
    mo_ho, tn, dn = [], [], []
    for c in chu:
        mo_ho.append([x for _, _, x in c if kb.tim_cum_cam(x, cum)])
        tn.append([x for ch, loai, x in c if THUAT_NGU.search(x)])
        dn.append([x for _, _, x in c if DINH_NGHIA.search(x)])

    # 6. lưu ý có hướng xử lý chung
    huong_mang = defaultdict(set)
    for b in bai:
        for c in b["chuong"]:
            if c["ma"] in ("nam_nay", "loi_khuyen"):
                continue
            for h in c["hop"]:
                if h["loai"] == "luu_y":
                    huong_mang[h["huong_xu_ly"]].add(_khoa_huong(h, c["ma"]))
    chung = {x for x, m in huong_mang.items() if len(m) >= 2} | set(ds.HUONG_DU_PHONG)
    lu = []
    for b in bai:
        lu.append([h["huong_xu_ly"] for c in b["chuong"] if c["ma"] not in ("nam_nay", "loi_khuyen")
                   for h in c["hop"] if h["loai"] == "luu_y" and (h["huong_xu_ly"] in chung
                                                                 or kb.tim_cum_cam(h["huong_xu_ly"], cum))])

    # nam_nay (đo riêng — phạm vi agent khác)
    tap_nn = [{x for _, _, x in chu_bai(b, True)} - CO_DINH for b in bai]
    ty_nn = [len(tap_nn[i] & tap_nn[j]) / (min(len(tap_nn[i]), len(tap_nn[j])) or 1)
             for i, j in itertools.combinations(range(len(bai)), 2)]

    n = len(bai)
    so = {
        "so_la": n, "so_cap_khac_han": len(ty),
        "cau_moi_bai": round(sum(len(c) for c in chu) / n, 1),
        "trung_giua_la": round(sum(t for t, _, _ in ty) / max(1, len(ty)), 3),
        "trung_giua_la_max": round(max((t for t, _, _ in ty), default=0), 3),
        "cau_barnum": len(barnum),
        "lap_trong_bai": round(sum(len(x) for x in lap) / n, 2),
        "mo_ho": round(sum(len(x) for x in mo_ho) / n, 2),
        "thuat_ngu": round(sum(len(x) for x in tn) / n, 2),
        "dinh_nghia_cung": round(sum(len(x) for x in dn) / n, 2),
        "luu_y_huong_chung": round(sum(len(x) for x in lu) / n, 2),
        "nam_nay_trung_giua_la": round(sum(ty_nn) / max(1, len(ty_nn)), 3),
        "nam_nay_mo_ho": round(sum(len([x for x in t if kb.tim_cum_cam(x, cum)]) for t in tap_nn) / n, 2),
        **kb_soat(cum),
    }
    if chi_tiet:
        so["_barnum"] = [f"{n}× {x}" for n, x in barnum[:40]]
        so["_lap"] = sorted({x for d in lap for x in d})[:40]
        so["_mo_ho"] = sorted({x for d in mo_ho for x in d})[:60]
        so["_thuat_ngu"] = sorted({x for d in tn for x in d})[:30]
        so["_dinh_nghia"] = sorted({x for d in dn for x in d})[:20]
        so["_huong_chung"] = Counter(x for d in lu for x in d).most_common(20)
        tot = max(ty, default=(0, 0, 0))
        if tot[0]:
            so["_cap_toi"] = {"la": [str(la[tot[1]]["ngay"]), str(la[tot[2]]["ngay"])],
                              "chung": sorted(tap[tot[1]] & tap[tot[2]])}
    return so


def _chuoi(x, bo=("cum_cam", "cum_chung_chung", "_nguon", "source", "_mo_ta")):
    if isinstance(x, str):
        yield x
    elif isinstance(x, dict):
        for k, v in x.items():
            if k not in bo:
                yield from _chuoi(v, bo)
    elif isinstance(x, list):
        for v in x:
            yield from _chuoi(v, bo)


# Phần LỜI LUẬN của từng KB (bỏ phần giải thích / miễn trừ — ở đó "không phán 'khắc'" là câu phủ định hợp lệ).
LOI_LUAN = {"tuvi_doi_song_kb": ("sao_linh_vuc", "hoa_linh_vuc", "nhom_sao_linh_vuc", "suc_khoe", "dai_han",
                                 "cach_cuc_doi_thuong", "tuan_triet", "than_cu", "muc_mo_ta", "muc_mo_ta_bien_the"),
            "tuvi_kb": ("chinh_tinh", "sao_cung", "tu_hoa_cung", "chu_de_han", "nhom_cach"),
            "tuvi_cach_cuc": ("cach",)}


def kb_soat(cum: list[str]) -> dict:
    """Số mục lời luận trong KB chứa cụm chung chung / cụm cấm giọng AI (tên cách cục không tính)."""
    d = GOC / "app" / "kb" / "data"
    cam = kb.cum_cam()
    ra = {}
    for ten, khoa in LOI_LUAN.items():
        goc = json.loads((d / f"{ten}.json").read_text("utf-8"))
        cs = list(_chuoi({k: goc[k] for k in khoa if k in goc}, bo=("ten", "ten_han", "_ghi_chu")))
        ra[f"kb_{ten}_chung_chung"] = sum(bool(kb.tim_cum_cam(s, cum)) for s in cs)
        ra[f"kb_{ten}_cum_cam"] = sum(bool(kb.tim_cum_cam(s, cam)) for s in cs)
    return ra


# ------------------------------------------------------------------ bề mặt ngoài bài (đợt 2)
def _ls(sinh: dict) -> dict:
    from app.calc import tuvi_an_sao as az
    from app.hoidap.tuvi import tom_tat
    return tom_tat(az.an_sao_tho(sinh["ngay"], sinh["ti"], sinh["gioi_tinh"], "vi-VN"))


def cau_phi_hoa(sinh: dict, ls: dict | None = None) -> list[str]:
    """Câu trên thẻ đường bay nổi bật (tiêu đề + nghĩa + việc nên làm; không gồm căn cứ, câu tự soi)."""
    from app.luangiai import tuvi_phi_hoa as phl
    ls = ls or _ls(sinh)
    ra = []
    for n in phl.lap(ls, ls["can_nam"])["noi_bat"]:
        ra.append(n["tieu_de"].strip())
        for k in ("nghia", "viec_nen_lam"):
            ra += cac_cau(n[k])
    return ra


def cau_the_cung(sinh: dict, ls: dict | None = None) -> list[str]:
    """Lời giải nghĩa chính tinh trên thẻ 12 cung — mọi trường chữ của `giai_nghia` trừ `can_cu`."""
    import inspect
    from app import tuvi_api
    ls = ls or _ls(sinh)
    f = tuvi_api._giai_nghia_sao
    ba = len(inspect.signature(f).parameters) >= 3
    ra = []
    for c in ls["cung"]:
        for s in c["chinh_tinh"]:
            g = (f(s["ten"], s["do_sang"], c["ten"]) if ba else f(s["ten"], s["do_sang"])) or {}
            for k, v in g.items():
                if k != "can_cu" and isinstance(v, str):
                    ra += cac_cau(v)
    return ra


_TU_SOI = ("Câu hỏi để tự soi:",)


def cau_hoi_dap(sinh: dict) -> list[str]:
    """Thân câu trả lời template cho 12 câu "Cung X của tôi nói gì?" (bỏ câu tự soi + câu kết cố định)."""
    from app.hoidap import tuvi as tv
    from app.narrative import hoi_van
    ra = []
    for ten in tv.THU_TU_CUNG:
        r = tv.tra_loi(f"Cung {ten} của tôi nói gì?", "tham_khao", sinh, XEM)
        for d in r["cau_tra_loi"].split("\n\n"):
            if d.startswith(_TU_SOI) or d.strip() == hoi_van.KET.strip():
                continue
            ra += cac_cau(d)
    return ra


def do_be_mat(la: list[dict], chi_tiet: bool = False) -> dict:
    cum, cam = kb.cum_chung_chung(), kb.cum_cam()
    ls = [_ls(s) for s in la]
    bo = [{c["ten"]: tuple(sorted(x["ten"] for x in c["chinh_tinh"])) for c in l["cung"]} for l in ls]
    mat = {"phi_hoa": [cau_phi_hoa(s, l) for s, l in zip(la, ls)],
           "the_cung": [cau_the_cung(s, l) for s, l in zip(la, ls)],
           "hoi_dap": [cau_hoi_dap(s) for s in la]}
    so: dict = {"so_la": len(la)}
    for ten, chu in mat.items():
        tap = [set(c) - CO_DINH for c in chu]
        ty = [len(tap[i] & tap[j]) / (min(len(tap[i]), len(tap[j])) or 1)
              for i, j in itertools.combinations(range(len(la)), 2) if khac_han(bo[i], bo[j])]
        dem = Counter(x for t in tap for x in t)
        barnum = sorted([(n, x) for x, n in dem.items() if n >= max(2, len(la) / 2)], reverse=True)
        n = len(la)
        so[f"{ten}_cau_moi_la"] = round(sum(len(c) for c in chu) / n, 1)
        so[f"{ten}_barnum"] = len(barnum)
        so[f"{ten}_trung_tb"] = round(sum(ty) / max(1, len(ty)), 3)
        so[f"{ten}_trung_max"] = round(max(ty, default=0), 3)
        so[f"{ten}_thuat_ngu"] = round(sum(sum(bool(THUAT_NGU.search(x)) for x in c) for c in chu) / n, 2)
        so[f"{ten}_mo_ho"] = round(sum(sum(bool(kb.tim_cum_cam(x, cum)) for x in c) for c in chu) / n, 2)
        so[f"{ten}_cum_cam"] = round(sum(sum(bool(kb.tim_cum_cam(x, cam)) for x in c) for c in chu) / n, 2)
        if chi_tiet:
            so[f"_{ten}_barnum"] = [f"{k}× {x}" for k, x in barnum[:25]]
            so[f"_{ten}_thuat_ngu"] = sorted({x for c in chu for x in c if THUAT_NGU.search(x)})[:15]
    return so


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--tat-ca", action="store_true")
    ap.add_argument("--chi-tiet", action="store_true")
    ap.add_argument("--be-mat", action="store_true", help="đo phi hoá + thẻ 12 cung + hỏi đáp cung (đợt 2)")
    ap.add_argument("--json")
    a = ap.parse_args()
    so = (do_be_mat if a.be_mat else do)(chon_la(a.tat_ca), a.chi_tiet)
    for k, v in so.items():
        if k.startswith("_"):
            print(f"\n## {k[1:]}")
            if isinstance(v, dict):
                print("  lá:", v["la"])
                v = v["chung"]
            for x in v:
                print("  -", x)
        else:
            print(f"{k:28s} {v}")
    if a.json:
        Path(a.json).write_text(json.dumps(so, ensure_ascii=False, indent=1), "utf-8")


if __name__ == "__main__":
    main()
