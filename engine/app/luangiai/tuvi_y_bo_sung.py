# -*- coding: utf-8 -*-
"""TV-YBS — bộ khớp điều kiện TẤT ĐỊNH cho KB `tuvi_y_bo_sung.json` (RULES, không LLM, không tính lại lá số).

Giao diện:
  - `ngu_canh(ls, vh=None, gioi_tinh=None)` — dựng ngữ cảnh từ lá số gọn (`hoidap.tuvi.tom_tat`, cùng dạng báo cáo đời
    sống dùng) + vận hạn iztro (`tuvi_an_sao.van_han`). Chỉ ĐỌC số đã tính.
  - `khop(m, ngu_canh) -> bool` — mục KB `m` có đúng với lá số không.
  - `noi_khop(m, ngu_canh) -> list[str]` — tên các cung "gốc" nơi điều kiện đúng (để chọn mục đúng mảng được hỏi).
  - `tim(ngu_canh, loai=…, hien_thi=…, cung=…) -> list[dict]` — mục khớp (bản sao, thêm `cung_khop`), xếp mục cụ thể
    hơn lên trước, hoà thì giữ thứ tự KB.

Quy ước (từ vựng `_tu_vung_dieu_kien` của KB), BẢO THỦ — điều gì không kiểm được thì KHÔNG khớp:
  - Cung gốc B: `cung` (tên / danh sách) hoặc mọi cung (`bat_ky` / không ghi). Vùng xét R(B) theo `vi_tri`: toa (mặc
    định) = B · xung_chieu = cung đối · tam_phuong = B + hai cung tam hợp · giap = hai cung kẹp · hai_cung_doi (đặc biệt).
  - `sao` = mọi sao phải có trong R(B) · `sao_mot_trong` = ít nhất một · "Hoá X" trong danh sách sao = hoá X nằm trong R(B).
  - `do_sang` áp cho các sao đã nêu có mặt (chính tinh: bảng Nam phái của lá số; phụ tinh: bảng lối Việt); sách không
    luận độ sáng ở chỗ đó → không khớp. Danh sách có cả "sang" và "ham" = luật nói cả hai đầu → không ràng buộc.
  - `lop` (goc | dai_han | luu_nien | tieu_han, danh sách = một trong; ghi chú "cùng gặp/cùng rơi" = tất cả): lớp ≠ goc
    lấy tứ hoá của lớp đó; cung gốc bị buộc là cung của lớp khi luật không nêu cung và không nêu sao mang hoá — hoặc khi
    luật nêu cung mà không xét hoá ("đại hạn đi vào Điền Trạch có Vũ Khúc"). Không có vận hạn → lớp ≠ goc không khớp.
  - `ghi_chu` mà không có điều kiện cụ thể nào, `co_the_tinh = false`, `so_sanh`, `tuoi`, `hai_nguoi`, sao không theo dõi
    (vd Tam Thai) trong `khong_co` → không khớp (không đoán).
"""
from __future__ import annotations

from app.calc import tuvi_do_sang_vn
from app.kb import tuvi_kb as kb
from app.kb import tuvi_y_bo_sung as kyb

HOA = ("Lộc", "Quyền", "Khoa", "Kỵ")
LUC_SAT = ("Kình Dương", "Đà La", "Hỏa Tinh", "Linh Tinh", "Địa Không", "Địa Kiếp")
LUC_CAT = ("Tả Phù", "Hữu Bật", "Văn Xương", "Văn Khúc", "Thiên Khôi", "Thiên Việt")
CHINH_TINH = ("Tử Vi", "Thiên Cơ", "Thái Dương", "Vũ Khúc", "Thiên Đồng", "Liêm Trinh", "Thiên Phủ", "Thái Âm",
              "Tham Lang", "Cự Môn", "Thiên Tướng", "Thiên Lương", "Thất Sát", "Phá Quân")
# Khoá điều kiện "cụ thể" — một mục chỉ có cung / lớp / ghi chú (lời phương pháp, điều kiện chưa cơ học hoá) không khớp lá số.
_CU_THE = ("sao", "sao_mot_trong", "sao_cap_mot_trong", "hoa", "hoa_tat_ca", "hoa_tren_sao", "hoa_tren_sao_mot_trong",
           "khong_chinh_tinh", "khong_co_cat_tinh", "khong_co", "khong_co_hoa", "gap", "chi", "do_sang", "cung_than",
           "nhom", "can_them")
_KHONG_KIEM = ("so_sanh", "tuoi", "hai_nguoi", "nhom_ca_hai")
# Ghi chú mang điều kiện CHƯA cơ học hoá → không khớp lá số; ghi chú cơ học hoá được → điều kiện bổ sung trong code.
_CHUA_DU = {"yb.hoa.khoa_nguoi_kinh_doanh", "yb.hoa.khoa_den_muon"}
_THEM = {"yb.cung.menh_khong_loc_tu_lap": {"can_them": [{"cung": "Phụ Mẫu", "hoa_hoac_sao": ["Lộc", "Lộc Tồn"]},
                                                         {"cung": "Điền Trạch", "hoa_hoac_sao": ["Lộc", "Lộc Tồn"]}]}}
_BO_QUA = ("co_the_tinh", "ghi_chu", "vi_tri", "vi_tri_hoa", "sao_them_tuy_chon", "hoac", "lop", "cung", "gioi_tinh")


# ------------------------------------------------------------------ ngữ cảnh
def _ten_hoa(s: str) -> str | None:
    """"Hoá Lộc" / "Hóa Lộc" → "Lộc"; tên sao thường → None."""
    for p in ("Hoá ", "Hóa "):
        if s.startswith(p) and s[len(p):] in HOA:
            return s[len(p):]
    return None


def ngu_canh(ls: dict, vh: dict | None = None, gioi_tinh: str | None = None) -> dict:
    cung = []
    for c in ls["cung"]:
        do = {s["ten"]: s.get("do_sang") for s in c["chinh_tinh"]}
        for p in c["phu_tinh"]:
            do[p] = tuvi_do_sang_vn.do_sang_phu(p, c["chi"])
        cung.append({"ten": c["ten"], "chi": c["chi"], "chi_so": c["chi_so"], "la_than": bool(c.get("la_than")),
                     "chinh": [s["ten"] for s in c["chinh_tinh"]], "sao": set(do), "do_sang": do})
    cung.sort(key=lambda c: c["chi_so"])
    theo_ten = {c["ten"]: c["chi_so"] for c in cung}
    noi_sao = {s: c["chi_so"] for c in cung for s in c["sao"]}
    hoa = {"goc": [{"hoa": x["hoa"], "sao": x["sao"], "chi_so": theo_ten[x["cung"]]} for x in ls.get("tu_hoa", [])
                   if x["cung"] in theo_ten]}
    lop = {}
    for ten in ("dai_han", "luu_nien", "tieu_han"):
        o = (vh or {}).get(ten)
        if not o:
            continue
        lop[ten] = o["chi_so"]
        if o.get("tu_hoa"):
            hoa[ten] = [{"hoa": h, "sao": s, "chi_so": noi_sao[s]} for h, s in zip(HOA, o["tu_hoa"]) if s in noi_sao]
    return {"cung": cung, "hoa": hoa, "lop": lop, "gioi_tinh": gioi_tinh,
            "theo_doi": set(CHINH_TINH) | set(kb.ten_phu_tinh()) | {"Hoá " + h for h in HOA}}


# ------------------------------------------------------------------ vùng, sao, hoá
def _ds(x) -> list:
    return [] if x is None else list(x) if isinstance(x, (list, tuple)) else [x]


def _vung(i: int, vi_tri) -> set[int]:
    ra: set[int] = set()
    for v in _ds(vi_tri) or ["toa"]:
        ra |= {"toa": {i}, "xung_chieu": {(i + 6) % 12}, "tam_phuong": {i, (i + 4) % 12, (i + 8) % 12},
               "giap": {(i + 1) % 12, (i - 1) % 12}}.get(v, set())
    return ra


def _hoa_trong(nc: dict, lop: str, vung: set[int]) -> list[dict]:
    return [h for h in nc["hoa"].get(lop, []) if h["chi_so"] in vung]


def _co_sao(nc: dict, s: str, vung: set[int], lop: str) -> list[int]:
    """Các cung trong `vung` có sao `s` ("Hoá X" = hoá X của lớp `lop`)."""
    h = _ten_hoa(s)
    if h:
        return [x["chi_so"] for x in _hoa_trong(nc, lop, vung) if x["hoa"] == h]
    return [i for i in vung if s in nc["cung"][i]["sao"]]


def _sang_dung(nc: dict, s: str, vung: set[int], muc: list[str]) -> bool:
    """Sao `s` có mặt trong vùng ở độ sáng thuộc nhóm `muc` (rỗng = không ràng buộc)."""
    if not muc or _ten_hoa(s):
        return True
    return any(kb.nhom_do_sang(nc["cung"][i]["do_sang"].get(s)) in muc for i in vung if s in nc["cung"][i]["sao"])


def _cac_lop(dk: dict) -> tuple[list[str], bool]:
    lop = _ds(dk.get("lop")) or ["goc"]
    tat_ca = any(k in (dk.get("ghi_chu") or "") for k in ("cùng gặp", "cùng rơi"))
    return lop, tat_ca


def _buoc_cung_lop(dk: dict) -> bool:
    co_cung = dk.get("cung") not in (None, "bat_ky")
    co_sao_hoa = bool(dk.get("hoa_tren_sao") or dk.get("hoa_tren_sao_mot_trong"))
    co_hoa = bool(dk.get("hoa") or dk.get("hoa_tat_ca") or co_sao_hoa)
    return (not co_cung and not co_sao_hoa) or (co_cung and not co_hoa)


# ------------------------------------------------------------------ một cung gốc
def _dung_tai(dk: dict, nc: dict, i: int, lop: str) -> bool:
    c = nc["cung"][i]
    vung = _vung(i, dk.get("vi_tri"))
    muc = [x for x in _ds(dk.get("do_sang"))]
    muc = [] if {"sang", "ham"} <= set(muc) else muc
    if dk.get("chi") and c["chi"] not in _ds(dk["chi"]):
        return False
    if "cung_than" in dk:
        ct = dk["cung_than"]
        if ct is True and not c["la_than"]:
            return False
        if isinstance(ct, str) and not (c["la_than"] and c["ten"] == ct):
            return False
    if dk.get("khong_chinh_tinh") and c["chinh"]:
        return False
    if dk.get("vi_tri") == "giap" and dk.get("sao"):
        a, b = (i + 1) % 12, (i - 1) % 12
        sao = _ds(dk["sao"])
        if len(sao) != 2:
            return False
        o_a, o_b = nc["cung"][a]["sao"], nc["cung"][b]["sao"]
        if not ((sao[0] in o_a and sao[1] in o_b) or (sao[0] in o_b and sao[1] in o_a)):
            return False
    elif dk.get("vi_tri") == "hai_cung_doi" and dk.get("sao"):
        sao = _ds(dk["sao"])
        doi = nc["cung"][(i + 6) % 12]["sao"]
        if not (len(sao) == 2 and sao[0] in c["sao"] and sao[1] in doi):
            return False
    else:
        for s in _ds(dk.get("sao")):
            if not _co_sao(nc, s, vung, lop) or not _sang_dung(nc, s, vung, muc):
                return False
    if dk.get("sao_mot_trong"):
        if not any(_co_sao(nc, s, vung, lop) and _sang_dung(nc, s, vung, muc if not dk.get("sao") else [])
                   for s in dk["sao_mot_trong"]):
            return False
    if dk.get("sao_cap_mot_trong") and not any(all(_co_sao(nc, s, vung, lop) for s in cap)
                                               for cap in dk["sao_cap_mot_trong"]):
        return False
    vung_hoa = _vung(i, dk["vi_tri_hoa"]) if dk.get("vi_tri_hoa") else vung
    if dk.get("hoa"):
        sao_hoa = _ds(dk.get("hoa_tren_sao")) + _ds(dk.get("hoa_tren_sao_mot_trong"))
        ung = [h for h in nc["hoa"].get(lop, []) if h["hoa"] == dk["hoa"]]
        if sao_hoa:
            ung = [h for h in ung if h["sao"] in sao_hoa]
            # luật nêu sao mang hoá mà không nêu cung → hoá ở đâu cũng được (cung gốc chỉ là nơi sao đó đứng)
            if dk.get("cung") not in (None, "bat_ky") or dk.get("vi_tri_hoa"):
                ung = [h for h in ung if h["chi_so"] in vung_hoa]
            else:
                ung = [h for h in ung if h["chi_so"] == i]
        else:
            ung = [h for h in ung if h["chi_so"] in vung_hoa]
        if not ung:
            return False
        if muc and sao_hoa and not dk.get("sao") and not any(_sang_dung(nc, h["sao"], {h["chi_so"]}, muc) for h in ung):
            return False
    for h in _ds(dk.get("hoa_tat_ca")):
        if not any(x["hoa"] == h for x in _hoa_trong(nc, lop, vung_hoa)):
            return False
    for h in _ds(dk.get("khong_co_hoa")):
        if any(x["hoa"] == h for x in _hoa_trong(nc, lop, vung)):
            return False
    for s in _ds(dk.get("khong_co")):
        if s.startswith("cung_than"):
            if c["la_than"]:
                return False
            continue
        if s not in nc["theo_doi"]:
            return False                         # sao không theo dõi → không biết vắng hay có
        if _co_sao(nc, s, vung, lop):
            return False
    if dk.get("khong_co_cat_tinh") and any(_co_sao(nc, s, vung, lop) for s in LUC_CAT):
        return False
    gap = dk.get("gap")
    if gap == "sat_tinh" and not any(_co_sao(nc, s, vung, lop) for s in LUC_SAT):
        return False
    if gap == "cat_tinh" and not any(_co_sao(nc, s, vung, lop) for s in LUC_CAT):
        return False
    if gap == "nhieu_sat_hoac_ky":
        n = sum(bool(_co_sao(nc, s, vung, lop)) for s in LUC_SAT) + len(
            [x for x in _hoa_trong(nc, lop, vung) if x["hoa"] == "Kỵ"])
        if n < 2:
            return False
    if dk.get("can_them") and not any(_co_o(nc, ct) for ct in _ds(dk["can_them"])):
        return False         # danh sách = một trong các điều kiện ở cung khác
    return True


def _co_o(nc: dict, ct: dict) -> bool:
    """Điều kiện ở cung khác (`can_them`): cung `ct.cung` có một trong `hoa_hoac_sao` ("Lộc" = Hoá Lộc gốc)."""
    j = next((x["chi_so"] for x in nc["cung"] if x["ten"] == ct.get("cung")), None)
    return j is not None and any(_co_sao(nc, ("Hoá " + s) if s in HOA else s, {j}, "goc")
                                 for s in _ds(ct.get("hoa_hoac_sao")))


def _phan_boi(dk: dict, nc: dict) -> bool:
    """Nhật nguyệt phản bối: Thái Dương và Thái Âm cùng hãm, mỗi sao ở cung của mình (không đòi đồng cung)."""
    muc = _ds(dk.get("do_sang")) or ["ham"]
    return all(any(s in c["sao"] and kb.nhom_do_sang(c["do_sang"].get(s)) in muc for c in nc["cung"])
               for s in _ds(dk.get("sao")))


# ------------------------------------------------------------------ điểm vào
def _noi(dk: dict, nc: dict) -> list[int]:
    if not dk.get("co_the_tinh", False) or any(k in dk for k in _KHONG_KIEM):
        return []
    if not any(k in dk for k in _CU_THE) and not (dk.get("cung") not in (None, "bat_ky") and dk.get("lop")):
        return []                                # chỉ cung / ghi chú: lời phương pháp, không khớp lá số
    if any(k not in _CU_THE + _BO_QUA for k in dk):
        return []                                # khoá lạ chưa hiểu → không đoán
    if dk.get("gioi_tinh") and dk["gioi_tinh"] != nc.get("gioi_tinh"):
        return []
    if dk.get("nhom"):
        menh = next(c for c in nc["cung"] if c["ten"] == "Mệnh")
        chinh = menh["chinh"] or nc["cung"][(menh["chi_so"] + 6) % 12]["chinh"]
        if not any((kb.chinh_tinh(s) or {}).get("nhom") in _ds(dk["nhom"]) for s in chinh):
            return []
        if not any(k in dk for k in _CU_THE if k != "nhom"):
            return [menh["chi_so"]]
    if "phản bối" in (dk.get("ghi_chu") or ""):
        # nét của cả lá số (nói về con người) → cung gốc là Mệnh; luật phản bối kèm cung khác chưa cơ học hoá
        menh = next(c["chi_so"] for c in nc["cung"] if c["ten"] == "Mệnh")
        return [] if dk.get("cung") else ([menh] if _phan_boi(dk, nc) else [])
    goc = [i for i, c in enumerate(nc["cung"])
           if dk.get("cung") in (None, "bat_ky") or c["ten"] in _ds(dk.get("cung"))]
    lop_ds, tat_ca = _cac_lop(dk)
    theo_lop = []
    for lop in lop_ds:
        if lop != "goc" and lop not in nc["lop"]:
            theo_lop.append(set())
            continue
        ung = goc
        if lop != "goc" and _buoc_cung_lop(dk):
            ung = [i for i in goc if i == nc["lop"][lop]]
        lop_hoa = lop if lop in nc["hoa"] else "goc"
        theo_lop.append({i for i in ung if _dung_tai(dk, nc, i, lop_hoa)})
    # "cùng gặp": mỗi lớp đều phải có (cung mỗi lớp khác nhau nên không lấy giao)
    ra = set().union(*theo_lop) if (not tat_ca or all(theo_lop)) else set()
    if not ra and dk.get("hoac"):
        alt = {"co_the_tinh": True, **{k: dk[k] for k in ("cung", "gioi_tinh") if k in dk}, **dk["hoac"]}
        return _noi(alt, nc)
    return sorted(ra)


def _dk(m: dict) -> dict | None:
    if m.get("id") in _CHUA_DU:
        return None
    return {**m["dieu_kien"], **_THEM.get(m.get("id"), {})}


def noi_khop(m: dict, nc: dict) -> list[str]:
    dk = _dk(m)
    return [nc["cung"][i]["ten"] for i in _noi(dk, nc)] if dk else []


def khop(m: dict, ngu_canh: dict) -> bool:
    return bool(noi_khop(m, ngu_canh))


def do_cu_the(m: dict) -> int:
    """Độ cụ thể của luật (để xếp): số điều kiện cụ thể + 2 khi nêu đích danh cung."""
    dk = m["dieu_kien"]
    return sum(k in dk for k in _CU_THE) + len(_ds(dk.get("sao"))) + (2 if dk.get("cung") not in (None, "bat_ky") else 0)


def tim(ngu_canh: dict, loai: str | tuple | list | None = None, hien_thi: str | tuple | list | None = None,
        cung: list[str] | None = None) -> list[dict]:
    """Mục KB khớp lá số. `loai` / `hien_thi` lọc (một giá trị hoặc danh sách); `cung` = chỉ giữ mục có cung gốc thuộc
    danh sách. Mỗi mục trả về là bản sao, thêm `cung_khop` (tên cung gốc)."""
    loai_ds, ht_ds = _ds(loai), _ds(hien_thi)
    ra = []
    for thu_tu, m in enumerate(kyb.tat_ca()):
        if (loai_ds and m["loai"] not in loai_ds) or (ht_ds and m["hien_thi"] not in ht_ds):
            continue
        noi = noi_khop(m, ngu_canh)
        if cung is not None:
            noi = [c for c in noi if c in cung]
        if noi:
            ra.append((-do_cu_the(m), thu_tu, {**m, "cung_khop": noi}))
    return [x[2] for x in sorted(ra, key=lambda x: (x[0], x[1]))]
