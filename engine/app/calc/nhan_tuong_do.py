# -*- coding: utf-8 -*-
"""ANH-2 — Tầng CALC: đo gương mặt trên ảnh KHÔNG dùng AI. Hàm thuần, tất định, không LLM, không DB, không nhận ảnh.

Đầu vào: toạ độ chuẩn hoá 0..1 của các điểm mốc NGƯỜI DÙNG TỰ CHẤM trên ảnh của chính mình (ảnh không rời máy) + tỉ lệ
rộng/cao của ảnh. Các bước:
  1. đổi về cùng đơn vị (x × tỉ lệ khung) — không thì mọi tỉ lệ ngang/dọc lệch theo khung ảnh;
  2. xoay quanh trung điểm hai đuôi mắt để đường hai đuôi mắt nằm ngang (đầu nghiêng không làm lệch số đo);
  3. kiểm thứ tự điểm (trên → dưới, trái → phải) — sai thì báo đúng điểm, không đoán;
  4. tính tỉ lệ theo phép "tam đình ngũ nhãn" (三庭五眼) và gợi ý mã lựa chọn của khảo sát theo ngưỡng trong KB `do_anh`.
Kết quả chỉ là GỢI Ý (`can_xac_nhan`): người dùng xác nhận mới vào khảo sát; bài đọc vẫn do RULES `luangiai/nhan_tuong.py`.
Không đo sắc da, nếp nhăn, độ dày thịt, ánh mắt (ảnh không đủ tin). Mặt quay ngang → bỏ các phép đo hai bên (lệch).
"""
from __future__ import annotations

import math

from app.calc import nhan_tuong as nt
from app.kb import nhan_tuong_kb as kb

# Câu khảo sát đo được từ hình học + các lựa chọn hàm này có thể gợi ý.
CAU_DO: dict[str, tuple[str, ...]] = {
    "khuon_mat": ("vuong", "dai", "tron", "tren_hep_duoi_rong", "tren_rong_duoi_nhon"),
    "tam_dinh": ("can_doi", "tran_dai", "mui_dai", "cam_dai", "tran_ngan", "cam_ngan"),
    "long_may": ("giao_nhau",),
    "an_duong": ("hep", "rong_sang"),
    "mat_hinh": ("xech_len", "cup_xuong", "nho"),
    "canh_mui": ("xoe_rong",),
    "mieng": ("rong_khoe_len", "khoe_cup", "nho_mong", "lech"),
    "nhan_trung": ("ngan",),
    "ham": ("banh", "hep_gay"),
    "song_mui": ("lech",),
    "tai": ("cao_day", "nho_thap"),
}
# (trên, dưới) theo chiều dọc và (trái, phải) theo chiều ngang của ẢNH — kiểm sau khi xoay.
_DOC = (("chan_toc", "may"), ("may", "chan_mui"), ("chan_mui", "giua_moi"), ("giua_moi", "cam"), ("chan_toc", "cam"))
_NGANG = (("thai_trai", "thai_phai"), ("ma_trai", "ma_phai"), ("ham_trai", "ham_phai"), ("may_trai", "may_phai"),
          ("mat_ngoai_trai", "mat_trong_trai"), ("mat_trong_trai", "mat_trong_phai"), ("mat_trong_phai", "mat_ngoai_phai"),
          ("canh_mui_trai", "canh_mui_phai"), ("mep_trai", "mep_phai"))
GOC_CANH_BAO = 3.0


def _so(v: float) -> str:
    return f"{v:.2f}".replace(".", ",")


def _ten(ma: str) -> str:
    return next((p["ten"] for p in kb.do_anh().get("diem", []) if p["ma"] == ma), ma)


def _chuan(diem: dict, ti_le: float) -> tuple[dict[str, tuple[float, float]], float]:
    """Kiểm đủ điểm bắt buộc, đổi đơn vị, xoay theo đường hai đuôi mắt. → (điểm đã xoay, góc nghiêng độ)."""
    ds = kb.do_anh()["diem"]
    hop_le = {p["ma"] for p in ds}
    la = sorted(set(diem) - hop_le)
    if la:
        raise ValueError(f"Điểm không có trong danh sách: {', '.join(la)}")
    thieu = [p for p in ds if p["bat_buoc"] and p["ma"] not in diem]
    if thieu:
        raise ValueError("Thiếu điểm: " + ", ".join(f"{p['ten']} ({p['ma']})" for p in thieu))
    if not 0.2 <= ti_le <= 5:
        raise ValueError("Tỉ lệ khung ảnh không hợp lệ")
    p = {}
    for ma, v in diem.items():
        try:
            x, y = float(v["x"]), float(v["y"])
        except (KeyError, TypeError, ValueError) as e:
            raise ValueError(f"Toạ độ điểm {ma} không hợp lệ") from e
        if not (0 <= x <= 1 and 0 <= y <= 1):
            raise ValueError(f"Toạ độ điểm {ma} nằm ngoài ảnh")
        p[ma] = (x * ti_le, y)
    (xl, yl), (xr, yr) = p["mat_ngoai_trai"], p["mat_ngoai_phai"]
    goc = math.atan2(yr - yl, xr - xl)
    cx, cy = (xl + xr) / 2, (yl + yr) / 2
    c, s = math.cos(-goc), math.sin(-goc)
    xoay = {k: (cx + (x - cx) * c - (y - cy) * s, cy + (x - cx) * s + (y - cy) * c) for k, (x, y) in p.items()}
    return xoay, math.degrees(goc)


def _kiem_thu_tu(p: dict[str, tuple[float, float]]) -> None:
    y = {k: v[1] for k, v in p.items()}
    y["may"] = (y["may_trai"] + y["may_phai"]) / 2
    ten = {"may": "Đầu lông mày"}
    for tren, duoi in _DOC:
        if not y[tren] < y[duoi]:
            raise ValueError(f"Điểm “{ten.get(tren) or _ten(tren)}” phải nằm trên “{ten.get(duoi) or _ten(duoi)}” — chấm lại giúp mình.")
    for trai, phai in _NGANG:
        if not p[trai][0] < p[phai][0]:
            raise ValueError(f"Điểm “{_ten(trai)}” phải nằm bên trái “{_ten(phai)}” trong ảnh — chấm lại giúp mình.")


def _d(a: tuple[float, float], b: tuple[float, float]) -> float:
    return math.hypot(a[0] - b[0], a[1] - b[1])


def do_mat(diem: dict, ti_le: float) -> dict:
    """→ {goi_y: [{cau, lua_chon, do, nguon}], so_do: {...}, canh_bao: [...]}. Sai / thiếu điểm → ValueError (lời tiếng Việt)."""
    cfg = kb.do_anh()
    ng, loi = cfg["nguong"], cfg["loi"]
    p, goc = _chuan(diem, ti_le)
    _kiem_thu_tu(p)
    r = lambda v: round(v, 3)  # noqa: E731 — so sánh trên số đã làm tròn: không lệch ngưỡng vì sai số dấu phẩy động

    W = r(p["ma_phai"][0] - p["ma_trai"][0])
    Wt = p["thai_phai"][0] - p["thai_trai"][0]
    Wj = p["ham_phai"][0] - p["ham_trai"][0]
    may_y = (p["may_trai"][1] + p["may_phai"][1]) / 2
    H = p["cam"][1] - p["chan_toc"][1]
    mat_tr = _d(p["mat_ngoai_trai"], p["mat_trong_trai"])
    mat_ph = _d(p["mat_trong_phai"], p["mat_ngoai_phai"])
    mat = (mat_tr + mat_ph) / 2
    khoe = p["mat_trong_phai"][0] - p["mat_trong_trai"][0]
    nghieng = ((p["mat_trong_trai"][1] - p["mat_ngoai_trai"][1]) / mat_tr + (p["mat_trong_phai"][1] - p["mat_ngoai_phai"][1]) / mat_ph) / 2
    mui = p["canh_mui_phai"][0] - p["canh_mui_trai"][0]
    Wm = _d(p["mep_trai"], p["mep_phai"])
    khoe_mieng = (p["giua_moi"][1] - (p["mep_trai"][1] + p["mep_phai"][1]) / 2) / Wm
    lech_mieng = abs(p["mep_trai"][1] - p["mep_phai"][1]) / Wm
    ha = p["cam"][1] - p["chan_mui"][1]
    giua_mat = (p["mat_trong_trai"][0] + p["mat_trong_phai"][0]) / 2
    quay = abs(giua_mat - (p["ma_trai"][0] + p["ma_phai"][0]) / 2) / W
    lech_mui = abs(p["chan_mui"][0] - giua_mat) / khoe

    td = nt.tam_dinh_tu_diem({"chan_toc": {"y": p["chan_toc"][1]}, "an_duong": {"y": may_y},
                              "chuan_dau": {"y": p["chan_mui"][1]}, "cam": {"y": p["cam"][1]}})
    sd = {"tam_dinh": {k: round(td[k] * 100) for k in ("thuong", "trung", "ha")} if td else None,
          "cao_rong": r(H / W), "tran_ma": r(Wt / W), "ham_ma": r(Wj / W), "may_khoe": r((p["may_phai"][0] - p["may_trai"][0]) / khoe),
          "mat_mat": r(mat / W), "nghieng_mat": r(nghieng), "mui_khoe": r(mui / khoe), "mieng_mui": r(Wm / mui),
          "khoe_mieng": r(khoe_mieng), "lech_mieng": r(lech_mieng), "nhan_trung": r((p["giua_moi"][1] - p["chan_mui"][1]) / ha),
          "lech_mui": r(lech_mui), "quay": r(quay), "goc_nghieng": round(goc, 1)}

    goi: list[tuple[str, str, str]] = []
    nguon = kb.ten_nguon(cfg.get("nguon"))

    def them(cau: str, lua: str, mau: str, **so):
        goi.append((cau, lua, loi[mau].format(**{k: _so(v) if isinstance(v, float) else v for k, v in so.items()})))

    # khuôn mặt (một lựa chọn; theo thứ tự rõ nhất trước)
    cr, tm, hm = sd["cao_rong"], sd["tran_ma"], sd["ham_ma"]
    km = ("tren_rong_duoi_nhon" if r(tm - hm) >= ng["tren_rong_duoi_nhon"] else
          "tren_hep_duoi_rong" if r(hm - tm) >= ng["tren_hep_duoi_rong"] else
          "dai" if cr >= ng["dai_cao_rong"] else
          "vuong" if hm >= ng["vuong_ham_ma"] else
          "tron" if cr <= ng["tron_cao_rong"] else None)
    if km:
        them("khuon_mat", km, "khuon_mat", cao_rong=cr, tran_ma=tm, ham_ma=hm)
    if td:
        them("tam_dinh", td["lua_chon"], "tam_dinh", **sd["tam_dinh"])
    mk = sd["may_khoe"]
    if mk < ng["may_giao"]:
        them("long_may", "giao_nhau", "long_may", may_khoe=mk)
    if mk < ng["may_hep"]:
        them("an_duong", "hep", "an_duong", may_khoe=mk)
    elif mk >= ng["may_rong"]:
        them("an_duong", "rong_sang", "an_duong", may_khoe=mk)
    nm, mm = sd["nghieng_mat"], sd["mat_mat"]
    if nm >= ng["mat_xech"]:
        them("mat_hinh", "xech_len", "mat_hinh_nghieng", nghieng_mat=nm)
    elif nm <= ng["mat_cup"]:
        them("mat_hinh", "cup_xuong", "mat_hinh_nghieng", nghieng_mat=nm)
    elif mm < ng["mat_nho"]:
        them("mat_hinh", "nho", "mat_hinh_nho", mat_mat=mm)
    if sd["mui_khoe"] >= ng["mui_xoe"]:
        them("canh_mui", "xoe_rong", "canh_mui", mui_khoe=sd["mui_khoe"])
    quay_ngang = sd["quay"] > ng["quay_toi_da"]
    km_, mn = sd["khoe_mieng"], sd["mieng_mui"]
    if not quay_ngang and sd["lech_mieng"] >= ng["mieng_lech"]:
        them("mieng", "lech", "mieng_lech", lech_mieng=sd["lech_mieng"])
    elif km_ <= ng["khoe_cup"]:
        them("mieng", "khoe_cup", "mieng", mieng_mui=mn, khoe_mieng=km_)
    elif km_ >= ng["khoe_len"] and mn >= ng["mieng_nho"]:
        them("mieng", "rong_khoe_len", "mieng", mieng_mui=mn, khoe_mieng=km_)
    elif mn < ng["mieng_nho"]:
        them("mieng", "nho_mong", "mieng", mieng_mui=mn, khoe_mieng=km_)
    if sd["nhan_trung"] < ng["nhan_trung_ngan"]:
        them("nhan_trung", "ngan", "nhan_trung", nhan_trung=sd["nhan_trung"])
    if hm >= ng["ham_banh"]:
        them("ham", "banh", "ham", ham_ma=hm)
    elif hm <= ng["ham_hep"]:
        them("ham", "hep_gay", "ham", ham_ma=hm)
    if not quay_ngang and sd["lech_mui"] >= ng["mui_lech"]:
        them("song_mui", "lech", "song_mui", lech_mui=sd["lech_mui"])
    if "dinh_tai" in p and "dai_tai" in p:
        bien = ng["tai_lech_cao"] * H
        mat_y = (p["mat_ngoai_trai"][1] + p["mat_ngoai_phai"][1]) / 2
        dinh, dai = p["dinh_tai"][1], p["dai_tai"][1]
        tren = "ngang hoặc cao hơn" if dinh <= may_y + bien else "thấp hơn"
        duoi = "ngang hoặc thấp hơn" if dai >= p["chan_mui"][1] - bien else "cao hơn"
        sd["tai"] = {"dinh_so_may": r((dinh - may_y) / H), "dai_so_chan_mui": r((dai - p["chan_mui"][1]) / H)}
        if dinh > mat_y:
            them("tai", "nho_thap", "tai", dinh_tai=tren, dai_tai=duoi)
        elif dinh <= may_y + bien and dai >= p["chan_mui"][1] - bien:
            them("tai", "cao_day", "tai", dinh_tai=tren, dai_tai=duoi)

    canh_bao = []
    if abs(goc) > GOC_CANH_BAO:
        canh_bao.append(loi["canh_bao_nghieng"].format(goc=_so(abs(goc)).rstrip("0").rstrip(",")))
    if sd["quay"] > ng["quay_canh_bao"] or quay_ngang:
        canh_bao.append(loi["canh_bao_quay"])
    return {"goi_y": [{"cau": c, "lua_chon": l, "do": t, "nguon": nguon} for c, l, t in goi], "so_do": sd, "canh_bao": canh_bao}
