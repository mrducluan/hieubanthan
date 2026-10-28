# -*- coding: utf-8 -*-
"""HD-CS — khối trực quan kèm câu trả lời hỏi đáp (RULES, tất định).

Mỗi khối dựng từ CHÍNH gói bằng chứng của câu trả lời (`bang_chung`), nên hình và lời luôn nói cùng một điều; web chỉ vẽ
theo `kieu`, không tự tính. Tối đa 3 khối; câu khủng hoảng / ngoài phạm vi / cần người kia → không có hình.

Kiểu khối (web/components/hoi/TrucQuan.tsx):
  thang   — thang nấc `nac`, mỗi mục một vị trí (độ sáng sao Tử vi, sức tự thân Bát tự)
  nhip    — chuỗi tháng có mức (Tử vi nhịp 3 tháng)
  cot     — cột tỉ lệ % (năm hành Bát tự)
  o       — ô nhãn / giá trị / chú thích (giai đoạn 10 năm, năm nay)
  so      — con số lớn (Thần số)
  chu_ky  — vòng `so_nac` nấc, sáng nấc hiện tại (năm cá nhân)
  hai_cot — hai danh sách đối nhau (điểm mạnh / dễ vấp, nên / nên tránh)
  la_ban  — 8 hướng, hướng hợp sáng (Phong thuỷ)
Sắc thái: chinh (nổi bật) · hop (hợp) · trung (bình thường) · nhat (mờ) — không có màu đỏ. Thuật ngữ (miếu, hãm…) không
nằm trong nhãn: chúng ở "Vì sao nói vậy"."""
from __future__ import annotations

import re

from app.kb import battu_kb, phongthuy_kb

TOI_DA = 3
NAC_DO_SANG = ("Kém sáng", "Bình", "Khá sáng", "Sáng", "Rất sáng")
_VI_TRI_SANG = {"Hãm": 0, "Bất": 0, "Bình": 1, "Lợi": 2, "Đắc": 2, "Vượng": 3, "Miếu": 4}
NAC_SUC_THAN = ("Nhẹ", "Cân bằng", "Mạnh")
_SUC_THAN = {"nhược": (0, "Bạn dễ chịu ảnh hưởng của hoàn cảnh; có người và nếp quen đỡ thì đi xa hơn."),
             "trung hoà": (1, "Bạn đứng được bằng sức mình mà không lấn át người khác."),
             "vượng": (2, "Bạn có sức tự thân lớn; cần chỗ để dồn sức, nếu không dễ thành cứng đầu.")}
_SAC_NHIP = {"thuan": "hop", "binh": "trung", "can_than": "chinh"}
_TEN_SO = {"duong_doi": "Đường đời", "su_menh": "Sứ mệnh", "linh_hon": "Linh hồn", "nhan_cach": "Nhân cách",
           "ngay_sinh": "Ngày sinh", "thai_do": "Thái độ"}
TAM_HUONG = ("Bắc", "Đông Bắc", "Đông", "Đông Nam", "Nam", "Tây Nam", "Tây", "Tây Bắc")
_HANH = ("Kim", "Mộc", "Thủy", "Hỏa", "Thổ")


def _dac_biet(goi: dict) -> bool:
    return goi["phan_loai"].get("xu_ly") in ("an_toan", "tu_choi_nhe") or bool(goi.get("can_them"))


def _cat(ds: list[dict]) -> list[dict]:
    return [k for k in ds if k and k.get("muc", True)][:TOI_DA]


def _bo_dau_de(s: str | None) -> str:
    """'Giai đoạn chủ đề Điền Trạch: nhà cửa…' → 'nhà cửa…' (bỏ phần nhắc lại tên cung)."""
    return (s or "").split(": ", 1)[-1]


# ---------------------------------------------------------------- Tử vi

def tuvi(goi: dict) -> list[dict]:
    if _dac_biet(goi):
        return []
    muc = goi["muc"]
    ds: list[dict] = []
    sao = [m for m in muc if m["loai"] == "sao_cung" and m.get("vai") == "la_so" and m.get("do_sang") in _VI_TRI_SANG]
    if sao:
        ds.append({"kieu": "thang", "tieu_de": f"Sao chính ở cung {sao[0]['cung']} sáng tới đâu", "nac": list(NAC_DO_SANG),
                   "ghi_chu": "Sao càng sáng, nét tốt của nó càng dễ lộ ra; kém sáng thì cần chủ động hơn.",
                   "muc": [{"nhan": m["sao"], "vi_tri": _VI_TRI_SANG[m["do_sang"]],
                            "giai_thich": m.get("doi_thuong") or m.get("noi_dung") or ""} for m in sao[:3]]})
    nhip = next((m for m in muc if m["loai"] == "nhip_3_thang"), None)
    if nhip and nhip.get("thang"):
        ds.append({"kieu": "nhip", "tieu_de": "Nhịp các tháng tới", "muc": [
            {"nhan": f"Tháng {t['thang']}{' nhuận' if t.get('nhuan') else ''}", "phu": f"{t['tu'][8:10]}/{t['tu'][5:7]}",
             "gia_tri": t["nhan_muc"], "muc_ma": t["muc"], "sac": _SAC_NHIP.get(t["muc"], "trung"),
             "giai_thich": " ".join(x for x in (t.get("tieu_de_thang"), t.get("goi_y")) if x)} for t in nhip["thang"]]})
    han = {m["lop"]: m for m in muc if m["loai"] == "han"}
    tuoi = next((m for m in muc if m["loai"] == "tuoi"), None)
    o = []
    if "dai_han" in han and han["dai_han"].get("tu_tuoi") is not None:
        h = han["dai_han"]
        o.append({"nhan": f"10 năm ({h['tu_tuoi']}–{h['den_tuoi']} tuổi)", "gia_tri": h["cung_goc"],
                  "chu_thich": _bo_dau_de(h.get("chu_de")), "sac": "chinh"})
    if "luu_nien" in han:
        h = han["luu_nien"]
        nam = f"Năm {tuoi['ngay_xem'][:4]}" if tuoi else "Năm nay"
        o.append({"nhan": nam, "gia_tri": h["cung_goc"], "chu_thich": _bo_dau_de(h.get("chu_de")), "sac": "hop"})
    if o:
        ds.append({"kieu": "o", "tieu_de": "Bạn đang ở giai đoạn nào", "muc": o})
    return _cat(ds)


# ---------------------------------------------------------------- Bát tự

def _phan_tram(diem: dict[str, float]) -> dict[str, int]:
    """Tỉ lệ % nguyên, tổng đúng 100 (chia dư lớn nhất)."""
    tong = sum(diem.values()) or 1
    tho = {h: diem.get(h, 0) * 100 / tong for h in _HANH}
    nguyen = {h: int(v) for h, v in tho.items()}
    for h in sorted(_HANH, key=lambda h: tho[h] - nguyen[h], reverse=True)[:100 - sum(nguyen.values())]:
        nguyen[h] += 1
    return nguyen


def battu(goi: dict) -> list[dict]:
    if _dac_biet(goi):
        return []
    muc = goi["muc"]
    ds: list[dict] = []
    nh = next((m for m in muc if m["loai"] == "ngu_hanh"), None)
    if nh:
        pt = _phan_tram(nh["diem"])
        thieu = set(nh.get("thieu") or [])
        cot = []
        for h in _HANH:
            k = battu_kb.ngu_hanh(h) or {}
            sac = "chinh" if h == nh.get("nhieu_nhat") else "nhat" if h in thieu or pt[h] < 5 else "trung"
            them = k.get("khi_thua") if sac == "chinh" else k.get("khi_thieu") if sac == "nhat" else None
            cot.append({"nhan": h, "gia_tri": pt[h], "sac": sac,
                        "giai_thich": "; ".join(x for x in (k.get("tinh_chat"), them) if x)})
        ds.append({"kieu": "cot", "tieu_de": "Năm hành trong ngày giờ sinh", "don_vi": "%", "muc": cot,
                   "ghi_chu": "Cột cho biết hành nào nhiều, hành nào ít; nhiều chưa hẳn là hay, ít chưa hẳn là dở."})
        st = _SUC_THAN.get((nh.get("than") or {}).get("ket_luan", ""))
        if st:
            ds.append({"kieu": "thang", "tieu_de": "Sức tự thân", "nac": list(NAC_SUC_THAN),
                       "muc": [{"nhan": "Bạn", "vi_tri": st[0], "giai_thich": st[1]}]})
    dv = next((m for m in muc if m["loai"] == "dai_van" and m.get("vai") == "hien_tai"), None)
    ln = next((m for m in muc if m["loai"] == "luu_nien"), None)
    o = []
    if dv:
        o.append({"nhan": f"10 năm ({dv['tu_nam']}–{dv['den_nam']})", "gia_tri": f"{dv['can']} {dv['chi']}",
                  "chu_thich": dv.get("y_tt") or "", "sac": "chinh"})
    if ln:
        o.append({"nhan": f"Năm {ln['nam']}", "gia_tri": f"{ln['can']} {ln['chi']}", "chu_thich": ln.get("y_tt") or "",
                  "sac": "hop"})
    if o:
        ds.append({"kieu": "o", "tieu_de": "Bạn đang ở giai đoạn nào", "muc": o})
    return _cat(ds)


# ---------------------------------------------------------------- Thần số

def thanso(goi: dict) -> list[dict]:
    if _dac_biet(goi):
        return []
    muc = goi["muc"]
    ds: list[dict] = []
    so, da = [], set()
    for m in muc:
        if m["loai"] == "linh_vuc" and m.get("vai") == "ban" and m.get("vi_tri") in _TEN_SO and m["vi_tri"] not in da:
            da.add(m["vi_tri"])
            so.append({"nhan": _TEN_SO[m["vi_tri"]], "gia_tri": m["so"], "chu_thich": m.get("ten_linh_vuc") or ""})
        elif m["loai"] == "thang_ca_nhan":
            so.append({"nhan": f"Tháng {m['thang']}", "gia_tri": m["so"], "chu_thich": m.get("chu_de") or ""})
        elif m["loai"] == "dinh_cao" and m.get("hien_tai"):
            so.append({"nhan": f"Chặng {m['tu_tuoi']}–{m['den_tuoi']} tuổi", "gia_tri": m["so"],
                       "chu_thich": m.get("chu_de") or ""})
    so.sort(key=lambda s: 0 if s["nhan"] in _TEN_SO.values() else 1)   # số gốc của người hỏi đứng trước nhịp thời gian
    for i, s in enumerate(so):
        s["sac"] = "chinh" if i == 0 else "trung"
    if so:
        ds.append({"kieu": "so", "tieu_de": "Các con số trả lời câu này", "muc": so[:4]})
    nam = next((m for m in muc if m["loai"] == "nam_ca_nhan"), None)
    if nam and 1 <= nam["so"] <= 9:
        ds.append({"kieu": "chu_ky", "tieu_de": f"Năm {nam['nam']} trong vòng 9 năm", "so_nac": 9, "hien_tai": nam["so"],
                   "nhan_hien_tai": nam.get("chu_de") or "", "giai_thich": nam.get("y_nghia") or ""})
        if nam.get("nen") or nam.get("tranh"):
            ds.append({"kieu": "hai_cot", "tieu_de": "Năm nay nên và nên tránh",
                       "trai": {"tieu_de": "Nên", "ds": [nam["nen"]] if nam.get("nen") else []},
                       "phai": {"tieu_de": "Nên tránh", "ds": [nam["tranh"]] if nam.get("tranh") else []}})
    cd = next((m for m in muc if m["loai"] == "chan_dung" and m.get("diem_manh")), None)
    if cd:
        ds.append({"kieu": "hai_cot", "tieu_de": f"Số {cd['so']}: mặt mạnh và chỗ dễ vấp",
                   "trai": {"tieu_de": "Điểm mạnh", "ds": list(cd["diem_manh"])[:3]},
                   "phai": {"tieu_de": "Dễ vấp", "ds": list(cd.get("diem_mu") or [])[:3]}})
    return _cat(ds)


# ---------------------------------------------------------------- Phong thuỷ

_HUONG_RE = re.compile(r"^(.+?) \((.+)\)$")


def phongthuy(goi: dict) -> list[dict]:
    if _dac_biet(goi):
        return []
    mq = next((m for m in goi["muc"] if m["loai"] == "menh_quai"), None)
    if not mq:
        return []
    theo: dict[str, dict] = {}
    for nhom, sac in (("tot", "hop"), ("xau", "nhat")):
        for s in mq.get(nhom) or []:
            k = _HUONG_RE.match(s)
            if not k:
                continue
            dn = phongthuy_kb.du_nien(k.group(1)) or {}
            theo[k.group(2)] = {"huong": k.group(2), "sac": sac,
                                "nhan": k.group(1) if sac == "hop" else "Ít hợp",
                                "giai_thich": f"Hợp dùng cho: {dn['dung_cho']}." if dn.get("dung_cho") else ""}
    if len(theo) != 8:
        return []
    return [{"kieu": "la_ban", "tieu_de": "Bốn hướng hợp với bạn", "muc": [theo[h] for h in TAM_HUONG],
             "ghi_chu": "Hướng tính theo năm sinh của bạn; bấm một hướng để xem hợp đặt gì."}]
