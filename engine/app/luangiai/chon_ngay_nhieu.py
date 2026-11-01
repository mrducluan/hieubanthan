# -*- coding: utf-8 -*-
"""EN-5.1 — chọn ngày theo NHIỀU người (cưới hỏi: cô dâu, chú rể, bố mẹ hai bên; khai trương: chủ + đối tác…).

RULES tất định, chỉ ghép CALC/KB có sẵn (một bộ tính):
- ngày "tốt" cho việc theo sách lịch = đúng `hoang_lich._danh_gia_viec` (mục Nên / Kiêng, trực, kiêng dân gian);
- loại ngày xung tuổi BẤT KỲ ai trong danh sách (như `hoang_lich.chon_ngay` cho một người);
- người CHÍNH (cô dâu, chú rể, chủ): tháng tiết xung tuổi → lưu ý; năm âm phạm Kim lâu (cưới: tuổi mụ cô dâu — chủ dự
  án chốt 2026-10-30), tuổi làm nhà (động thổ / nhập trạch / sửa nhà: Kim lâu · Hoang ốc · Tam tai của chủ — đúng hàm
  trang "Xem tuổi làm nhà"), Tam tai (khai trương, cầu tài, ký kết của chủ) → lưu ý. Lưu ý KHÔNG loại ngày: gia đình tự
  sắp, nhiều nhà mượn tuổi — chỉ xếp ngày có lưu ý ra sau.
- Không điểm số. Bảng "tháng đại lợi / tiểu lợi" theo tuổi cô dâu CHƯA đưa vào: chưa đối chiếu được nguồn (2026-11-01).
Không lưu gì: năm sinh chỉ đi qua lượt gọi."""
from __future__ import annotations

import datetime as dt
from functools import lru_cache

from app.calc import hoang_lich as hl
from app.calc import lunar
from app.calc import tuoi_dan_gian as t
from app.luangiai import hoang_lich as L
from app.luangiai import tuoi_dan_gian as tdg

VAI = {
    "co_dau": ("cô dâu", True), "chu_re": ("chú rể", True),
    "bo_co_dau": ("bố cô dâu", False), "me_co_dau": ("mẹ cô dâu", False),
    "bo_chu_re": ("bố chú rể", False), "me_chu_re": ("mẹ chú rể", False),
    "chu": ("người đứng tên", True), "vo_chong_chu": ("vợ / chồng người đứng tên", False),
    "doi_tac": ("đối tác", False), "nguoi_khac": ("người cùng làm", False),
}
TOI_DA_NGUOI = 8
TOI_DA_NGAY = 400
_LAM_NHA = {"dong_tho", "nhap_trach"}
_TAM_TAI = {"khai_truong", "cau_tai", "ky_ket"}


def _ten_chi(z: str) -> str:
    return lunar.CHI[hl.ZHI.index(z)]


@lru_cache(maxsize=1024)
def _nam_am(d: dt.date) -> int:
    return L._calc(d)["am"]["nam"]


def _luu_y_nam(viec: str, p: dict, nam_am: int) -> list[tuple[str, str]]:
    """Lưu ý theo NĂM âm của một người chính (không loại ngày): (nhãn ngắn, lời giải thích)."""
    ten = p["ten_vai"]
    if viec == "cuoi_hoi" and p["vai"] == "co_dau":
        tuoi = t.tuoi_mu(p["nam_am"], nam_am)
        kl = t.kim_lau(tuoi)
        if kl:
            return [(f"Kim lâu {ten} (năm âm {nam_am})",
                     f"Năm âm {nam_am} {ten} {tuoi} tuổi mụ, phạm {tdg.KB['kim_lau'][kl]['ten']} — dân gian thường tránh "
                     "cưới, nhiều nhà mượn tuổi hoặc dời sang năm sau.")]
        return []
    if viec in _LAM_NHA and p["vai"] == "chu":
        x = tdg._danh_gia_nam(p["nam_am"], nam_am)
        return [(f"tuổi làm nhà {ten} (năm âm {nam_am})",
                 f"Năm âm {nam_am} {ten} {x['tuoi']} tuổi mụ, phạm {', '.join(x['xau'])} — dân gian thường mượn tuổi "
                 "người khác đứng tên khi động thổ / về nhà mới.")] if x["xau"] else []
    if viec in _TAM_TAI and p["vai"] == "chu":
        tt = t.pham_tam_tai(t.can_chi_nam(p["nam_am"])[1], t.can_chi_nam(nam_am)[1])
        return [(f"Tam tai {ten} (năm âm {nam_am})",
                 f"Năm âm {nam_am} là năm thứ {tt} Tam tai của {ten} — dân gian hay nhắc làm chậm, chuẩn bị kỹ hơn.")] \
            if tt else []
    return []


def _nguoi(ds: list[dict]) -> list[dict]:
    if not ds:
        raise ValueError("cần ít nhất một người")
    if len(ds) > TOI_DA_NGUOI:
        raise ValueError(f"tối đa {TOI_DA_NGUOI} người")
    ra = []
    for x in ds:
        if x.get("vai") not in VAI:
            raise ValueError(f"vai không hợp lệ: {x.get('vai')}")
        tu = L.tuoi(x["nam_sinh"], x.get("thang_sinh"), x.get("ngay_sinh"))
        ten, chinh = VAI[x["vai"]]
        ra.append({"vai": x["vai"], "ten_vai": ten, "chinh": chinh, "nam_sinh": x["nam_sinh"], "nam_am": tu["nam_am"],
                   "can_chi": tu["can_chi"], "han": tu["han"], "con_giap": _ten_chi(tu["han"]),
                   "uoc_luong": tu["uoc_luong"]})
    return ra


def chon(viec: str, tu: dt.date, den: dt.date, nguoi: list[dict]) -> dict:
    if viec not in L._VIEC:
        raise ValueError(f"việc không hợp lệ: {viec}")
    if den < tu or (den - tu).days > TOI_DA_NGAY:
        raise ValueError(f"khoảng ngày tối đa {TOI_DA_NGAY} ngày")
    v = L._VIEC[viec]
    ps = _nguoi(nguoi)
    nam_luu_y: dict[tuple[str, int], list[tuple[str, str]]] = {}
    giai_thich: dict[str, str] = {}             # nhãn ngắn → lời giải thích (hiện một lần, không lặp ở từng tháng)
    ngay: list[dict] = []
    d = tu
    while d <= den:
        c = L._calc(d)
        chi_ngay, chi_thang = c["ngay_gz"][1], c["thang_gz"][1]
        if L._danh_gia_viec(c, v) == "tot" and all(hl.quan_he_tuoi(chi_ngay, p["han"]) != "xung" for p in ps):
            hop, luu_y = [], []
            for p in ps:
                q = hl.quan_he_tuoi(chi_ngay, p["han"])
                if q in ("tam_hop", "luc_hop"):
                    hop.append({"vai": p["vai"], "ten_vai": p["ten_vai"], "quan_he": q,
                                "ten": L.KB["quan_he_tuoi"][q]["ten"]})
                if not p["chinh"]:
                    continue
                if hl.quan_he_tuoi(chi_thang, p["han"]) == "xung":
                    nhan = f"tháng {_ten_chi(chi_thang)} xung tuổi {p['ten_vai']}"
                    giai_thich[nhan] = (f"Tháng {_ten_chi(chi_thang)} (tính theo tiết khí) xung tuổi {p['con_giap']} của "
                                        f"{p['ten_vai']} — dân gian thường tránh việc lớn trong tháng xung tuổi.")
                    luu_y.append(nhan)
                na = _nam_am(d)
                key = (p["vai"], na)
                if key not in nam_luu_y:
                    nam_luu_y[key] = _luu_y_nam(viec, p, na)
                for nhan, dai in nam_luu_y[key]:
                    giai_thich[nhan] = dai
                    luu_y.append(nhan)
            ngay.append({**L.tom_tat(d), "hop": hop, "luu_y": luu_y,
                         "diem_cong": [x for x in ("hoàng đạo" if c["hoang_dao"] else None,
                                                   f"trực {L.KB['truc'][c['truc']]['ten']}" if c["truc"] in L.TRUC_TOT
                                                   else None) if x]})
        d += dt.timedelta(days=1)

    def khoa(n: dict) -> tuple:
        return (bool(n["luu_y"]), -len(n["hop"]) - len(n["diem_cong"]), n["ngay"])

    thang = []
    m = dt.date(tu.year, tu.month, 1)
    while m <= den:
        ma = f"{m.year}-{m.month:02d}"
        trong = [n for n in ngay if n["ngay"].startswith(ma)]
        thang.append({"thang": ma, "so_ngay": len(trong),
                      "ngay": sorted(sorted(trong, key=khoa)[:3], key=lambda n: n["ngay"]),
                      "luu_y": sorted({y for n in trong for y in n["luu_y"]})})
        m = dt.date(m.year + (m.month == 12), m.month % 12 + 1, 1)

    nguoi_ra = []
    for p in ps:
        nam = sorted({na for (vai, na) in nam_luu_y if vai == p["vai"]})
        nam_ra = [{"nam_am": na, "tuoi_mu": t.tuoi_mu(p["nam_am"], na), "luu_y": [d for _, d in nam_luu_y[(p["vai"], na)]]}
                  for na in nam if nam_luu_y[(p["vai"], na)] or viec in _LAM_NHA]
        nguoi_ra.append({k: p[k] for k in ("vai", "ten_vai", "chinh", "nam_sinh", "nam_am", "can_chi", "con_giap",
                                           "uoc_luong")} | {"nam": nam_ra})
    # gợi ý theo năm âm: người chính vướng năm này mà khoảng đã chọn có năm âm khác không vướng → nói rõ mốc Tết
    goi_y = []
    cac_nam = sorted({_nam_am(tu + dt.timedelta(days=i)) for i in range((den - tu).days + 1)})
    for p in nguoi_ra:
        vuong = [x["nam_am"] for x in p["nam"] if x["luu_y"]]
        sach_nam = [na for na in cac_nam if na not in vuong]
        if vuong and sach_nam:
            moc = [n for n in ngay if _nam_am(dt.date.fromisoformat(n["ngay"])) in sach_nam]
            goi_y.append(f"Năm âm {', '.join(map(str, vuong))} {p['ten_vai']} vướng lưu ý theo tuổi; năm âm "
                         f"{', '.join(map(str, sach_nam))} thì không — trong khoảng đã chọn có {len(moc)} ngày hợp việc "
                         "thuộc năm không vướng (năm âm đổi từ mùng 1 Tết).")
    noi_bat = sorted(ngay, key=khoa)[:6]
    sach = [n for n in ngay if not n["luu_y"]]
    ten_viec = v["ten"][:1].lower() + v["ten"][1:]
    tom_tat = (f"Từ {tu.strftime('%d/%m/%Y')} đến {den.strftime('%d/%m/%Y')} có {len(ngay)} ngày sách lịch ghi hợp "
               f"{ten_viec} và không xung tuổi ai trong {len(ps)} người"
               + (f"; {len(sach)} ngày trong số đó không vướng lưu ý theo tuổi." if len(sach) != len(ngay) else ".")
               if ngay else f"Trong khoảng này chưa có ngày nào vừa hợp {ten_viec} vừa không xung tuổi cả {len(ps)} "
                            "người — thử nới khoảng ngày hoặc bớt người chỉ cần không xung.")
    return {"viec": {"ma": viec, "ten": v["ten"]}, "tu": tu.isoformat(), "den": den.isoformat(), "nguoi": nguoi_ra,
            "ngay": ngay, "ngay_noi_bat": noi_bat, "thang": thang, "tom_tat": tom_tat, "goi_y": goi_y,
            "giai_thich": [{"nhan": k, "loi": v} for k, v in sorted(giai_thich.items())],
            "cach_chon": ("Ngày có việc này trong mục Nên của sách lịch, không nằm trong mục Kiêng, trực không thuộc nhóm "
                          "sách khuyên tránh, và không xung tuổi ai trong danh sách. Tháng xung tuổi và năm phạm tuổi chỉ "
                          "xét cho người chính (cô dâu, chú rể, người đứng tên); ngày vướng các lưu ý này vẫn hiện, xếp sau."),
            "chua_xet": "Bảng tháng đại lợi / tiểu lợi theo tuổi cô dâu chưa đưa vào vì chưa đối chiếu được nguồn sách.",
            "luu_y": L.LUU_Y}
