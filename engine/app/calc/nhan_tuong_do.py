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
# NT-2: nét nằm trong khoảng thường → lựa chọn "vừa" (`vua` / `can_doi`, cờ `vua: True`) — ảnh đo được thì trả lời luôn,
# không bỏ trống chỉ vì mặt cân đối. Câu cần độ sâu / sắc / nếp (cao rộng đầy, dày kín…) KHÔNG đoán từ ảnh thẳng.
CAU_DO: dict[str, tuple[str, ...]] = {
    "khuon_mat": ("vuong", "dai", "tron", "tren_hep_duoi_rong", "tren_rong_duoi_nhon", "can_doi"),
    "tam_dinh": ("can_doi", "tran_dai", "mui_dai", "cam_dai", "tran_ngan", "cam_ngan"),
    "tran": ("hep_thap",),
    "long_may": ("giao_nhau",),
    "an_duong": ("hep", "rong_sang", "vua"),
    "mat_hinh": ("xech_len", "cup_xuong", "nho", "vua"),
    "canh_mui": ("xoe_rong", "vua"),
    "mieng": ("rong_khoe_len", "khoe_cup", "nho_mong", "lech", "vua"),
    "nhan_trung": ("ngan", "vua"),
    "ham": ("banh", "hep_gay", "vua"),
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


def do_mat(diem: dict, ti_le: float, nghieng: list[dict] | None = None) -> dict:
    """→ {goi_y: [{cau, lua_chon, do, nguon, anh}], so_do: {...}, canh_bao: [...]}. Sai / thiếu điểm → ValueError (lời tiếng
    Việt). `nghieng` (ANH-4, tuỳ chọn, ≤ 2): [{goc: nghieng_trai|nghieng_phai, diem, ti_le}] — xem `_ghep_nghieng`."""
    kq = _do_thang(diem, ti_le)
    return _ghep_nghieng(kq, nghieng or [])


def _do_thang(diem: dict, ti_le: float) -> dict:
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
    them("khuon_mat", km or "can_doi", "khuon_mat", cao_rong=cr, tran_ma=tm, ham_ma=hm)
    if td:
        them("tam_dinh", td["lua_chon"], "tam_dinh", **sd["tam_dinh"])
    if tm < ng["tran_hep"] or (td and td["thuong"] < 0.29):
        them("tran", "hep_thap", "tran_thang", tran_ma=tm, thuong=round(td["thuong"] * 100) if td else "?")
    mk = sd["may_khoe"]
    if mk < ng["may_giao"]:
        them("long_may", "giao_nhau", "long_may", may_khoe=mk)
    if mk < ng["may_hep"]:
        them("an_duong", "hep", "an_duong", may_khoe=mk)
    elif mk >= ng["may_rong"]:
        them("an_duong", "rong_sang", "an_duong", may_khoe=mk)
    else:
        them("an_duong", "vua", "an_duong", may_khoe=mk)
    nm, mm = sd["nghieng_mat"], sd["mat_mat"]
    if nm >= ng["mat_xech"]:
        them("mat_hinh", "xech_len", "mat_hinh_nghieng", nghieng_mat=nm)
    elif nm <= ng["mat_cup"]:
        them("mat_hinh", "cup_xuong", "mat_hinh_nghieng", nghieng_mat=nm)
    elif mm < ng["mat_nho"]:
        them("mat_hinh", "nho", "mat_hinh_nho", mat_mat=mm)
    else:
        them("mat_hinh", "vua", "mat_hinh_nho", mat_mat=mm)
    if sd["mui_khoe"] >= ng["mui_xoe"]:
        them("canh_mui", "xoe_rong", "canh_mui", mui_khoe=sd["mui_khoe"])
    elif sd["mui_khoe"] >= ng["mui_hep"]:                    # hẹp hơn: khảo sát không có lựa chọn "hẹp" → không đoán
        them("canh_mui", "vua", "canh_mui", mui_khoe=sd["mui_khoe"])
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
    else:
        them("mieng", "vua", "mieng", mieng_mui=mn, khoe_mieng=km_)
    if sd["nhan_trung"] < ng["nhan_trung_ngan"]:
        them("nhan_trung", "ngan", "nhan_trung", nhan_trung=sd["nhan_trung"])
    elif sd["nhan_trung"] < ng["nhan_trung_dai"]:            # dài hơn: sâu hay nông ảnh thẳng không thấy → không đoán
        them("nhan_trung", "vua", "nhan_trung", nhan_trung=sd["nhan_trung"])
    if hm >= ng["ham_banh"]:
        them("ham", "banh", "ham", ham_ma=hm)
    elif hm <= ng["ham_hep"]:
        them("ham", "hep_gay", "ham", ham_ma=hm)
    else:
        them("ham", "vua", "ham", ham_ma=hm)
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
    vua = lambda c, l: l in _VUA and c != "tam_dinh"  # noqa: E731
    # Mặt quay ngang: bề ngang hai bên co giãn khác nhau → không kết luận "vừa" (chỉ giữ nét lệch rõ như trước).
    return {"goi_y": [{"cau": c, "lua_chon": l, "do": t, "nguon": nguon, "anh": "thang", **({"vua": True} if vua(c, l) else {})}
                      for c, l, t in goi if not (quay_ngang and vua(c, l))], "so_do": sd, "canh_bao": canh_bao}


_VUA = ("vua", "can_doi")


def _uu_tien_nghieng(g: dict) -> bool:
    """Câu ảnh thẳng chỉ ra "vừa" (hoặc trán hẹp đo theo bề ngang) → ảnh nghiêng (thấy độ sâu) được thay nếu đo ra nét rõ."""
    return bool(g.get("vua")) or g["cau"] == "tran"


# ------------------------------------------------------------------ ANH-4: ảnh nghiêng
CAU_DO_NGHIENG: dict[str, tuple[str, ...]] = {
    "tran": ("go_loi", "lom_giua"),
    "son_can": ("cao_lien", "thap_gay"),
    "song_mui": ("go", "thap", "thang_cao"),
    "cam": ("nhon_lem",),
    "tai": ("cao_day", "nho_thap"),
}
# Thứ tự từ trên xuống theo trục mặt (đầu mũi xét riêng: nằm giữa gốc mũi và cằm).
_DOC_NGHIENG = ("chan_toc", "giua_tran", "an_duong", "son_can", "song_mui", "chan_mui", "cam_truoc", "cam")
_TEN_GOC = {"nghieng_trai": "Ảnh nghiêng trái", "nghieng_phai": "Ảnh nghiêng phải"}

P = tuple[float, float]


def _tru(a: P, b: P) -> P:
    return (a[0] - b[0], a[1] - b[1])


def _cham(a: P, b: P) -> float:
    return a[0] * b[0] + a[1] * b[1]


def _goc(a: P, o: P, b: P) -> float:
    v1, v2 = _tru(a, o), _tru(b, o)
    c = _cham(v1, v2) / (math.hypot(*v1) * math.hypot(*v2))
    return math.degrees(math.acos(max(-1.0, min(1.0, c))))


def _ten_ng(ma: str) -> str:
    return next((p["ten"] for p in kb.do_anh().get("diem_nghieng", []) if p["ma"] == ma), ma)


def do_nghieng(diem: dict, ti_le: float) -> dict:
    """Ảnh nghiêng (≈ 90°): điểm người dùng chấm trên ĐƯỜNG VIỀN mặt → {goi_y, so_do, canh_bao}. Chỉ dùng góc và tỉ lệ
    khoảng cách theo trục mặt (chân tóc → đáy cằm) → không phụ thuộc mặt quay trái / phải, đầu ngửa / cúi, khung ảnh."""
    cfg = kb.do_anh()
    ng, loi = cfg["nguong_nghieng"], cfg["loi"]
    ds = cfg["diem_nghieng"]
    la = sorted(set(diem) - {p["ma"] for p in ds})
    if la:
        raise ValueError(f"Điểm không có trong danh sách ảnh nghiêng: {', '.join(la)}")
    thieu = [p for p in ds if p["bat_buoc"] and p["ma"] not in diem]
    if thieu:
        raise ValueError("Thiếu điểm: " + ", ".join(f"{p['ten']} ({p['ma']})" for p in thieu))
    if not 0.2 <= ti_le <= 5:
        raise ValueError("Tỉ lệ khung ảnh không hợp lệ")
    p: dict[str, P] = {}
    for ma, v in diem.items():
        try:
            x, y = float(v["x"]), float(v["y"])
        except (KeyError, TypeError, ValueError) as e:
            raise ValueError(f"Toạ độ điểm {ma} không hợp lệ") from e
        if not (0 <= x <= 1 and 0 <= y <= 1):
            raise ValueError(f"Toạ độ điểm {ma} nằm ngoài ảnh")
        p[ma] = (x * ti_le, y)
    r = lambda v: round(v, 3)  # noqa: E731

    truc = _tru(p["chan_toc"], p["cam"])
    H = math.hypot(*truc)
    if H <= 0:
        raise ValueError("Chân tóc và đáy cằm trùng nhau — chấm lại giúp mình.")
    u = (truc[0] / H, truc[1] / H)                                    # hướng lên trên của mặt
    f = (-u[1], u[0])

    def ngang(q: P) -> float:                                        # khoảng ra trước so với trục chân tóc – cằm
        return _cham(_tru(q, p["cam"]), f)

    if sum(ngang(p[k]) for k in ("an_duong", "son_can", "dau_mui", "chan_mui", "cam_truoc")) < 0:
        f = (-f[0], -f[1])
    huong = "phai" if f[0] > 0 else "trai"

    def cao(q: P) -> float:                                          # độ sâu từ chân tóc xuống, theo trục mặt
        return -_cham(_tru(q, p["chan_toc"]), u)

    for tren, duoi in zip(_DOC_NGHIENG, _DOC_NGHIENG[1:]):
        if not cao(p[tren]) < cao(p[duoi]):
            raise ValueError(f"Điểm “{_ten_ng(tren)}” phải nằm trên “{_ten_ng(duoi)}” — chấm lại giúp mình.")
    if not cao(p["son_can"]) < cao(p["dau_mui"]) < cao(p["cam_truoc"]):
        raise ValueError("Điểm “Đầu mũi” phải nằm giữa gốc mũi và cằm — chấm lại giúp mình.")

    def lech(q: P, a: P, b: P) -> float:                             # q nhô ra trước khỏi đường a–b, theo chiều dài a–b
        ab = _tru(b, a)
        L2 = _cham(ab, ab)
        t = _cham(_tru(q, a), ab) / L2
        chieu = (a[0] + ab[0] * t, a[1] + ab[1] * t)
        return _cham(_tru(q, chieu), f) / math.sqrt(L2)

    nho = lech(p["dau_mui"], p["son_can"], p["chan_mui"])
    if nho <= 0 or not all(ngang(p["dau_mui"]) > ngang(p[k]) for k in ("an_duong", "chan_mui", "cam_truoc", "song_mui")):
        raise ValueError("Điểm “Đầu mũi” phải là chỗ nhô ra xa nhất phía trước mặt — kiểm lại ảnh có đúng là ảnh nghiêng không.")
    co_tai = "dinh_tai" in p and "dai_tai" in p
    if co_tai and not (ngang(p["dinh_tai"]) < ngang(p["son_can"]) and ngang(p["dai_tai"]) < ngang(p["son_can"])):
        raise ValueError("Tai phải nằm phía sau gốc mũi trong ảnh nghiêng — chấm lại giúp mình.")

    goc_lom = _goc(p["an_duong"], p["chan_mui"], p["cam_truoc"])
    loi_mat = (180 - goc_lom) * (1 if lech(p["cam_truoc"], p["an_duong"], p["chan_mui"]) < 0 else -1)
    sd = {"tran_cong": r(lech(p["giua_tran"], p["chan_toc"], p["an_duong"])),
          "goc_son_can": round(_goc(p["an_duong"], p["son_can"], p["dau_mui"]), 1),
          "gu_mui": r(lech(p["song_mui"], p["son_can"], p["dau_mui"])), "nho_mui": r(nho),
          "loi_mat": round(loi_mat, 1), "huong": huong}
    td = nt.tam_dinh_tu_diem({k: {"y": cao(p[m])} for k, m in
                              (("chan_toc", "chan_toc"), ("an_duong", "an_duong"), ("chuan_dau", "chan_mui"), ("cam", "cam"))})
    if td:
        sd["tam_dinh"] = {k: round(td[k] * 100) for k in ("thuong", "trung", "ha")}

    goi: list[tuple[str, str, str]] = []

    def them(cau: str, lua: str, mau: str, **so):
        goi.append((cau, lua, loi[mau].format(**{k: _so(v) if isinstance(v, float) else v for k, v in so.items()})))

    if sd["tran_cong"] >= ng["tran_go"]:
        them("tran", "go_loi", "tran", tran_cong=sd["tran_cong"])
    elif sd["tran_cong"] <= ng["tran_det"]:
        them("tran", "lom_giua", "tran", tran_cong=sd["tran_cong"])
    gs = sd["goc_son_can"]
    if gs >= ng["son_can_cao"]:
        them("son_can", "cao_lien", "son_can", goc_son_can=str(round(gs)))
    elif gs <= ng["son_can_thap"]:
        them("son_can", "thap_gay", "son_can", goc_son_can=str(round(gs)))
    gu, nm = sd["gu_mui"], sd["nho_mui"]
    lua_mui = ("go" if gu >= ng["mui_gu"] else "thap" if nm <= ng["mui_thap"] else
               "thang_cao" if nm >= ng["mui_cao"] and abs(gu) < ng["mui_thang"] else None)
    if lua_mui:
        them("song_mui", lua_mui, "song_mui_nghieng", gu_mui=gu, nho_mui=nm)
    if sd["loi_mat"] >= ng["cam_lem"]:
        them("cam", "nhon_lem", "cam_nghieng", loi_mat=str(round(sd["loi_mat"])))
    if co_tai:
        bien = ng["tai_lech_cao"] * H
        may_y, mat_y = cao(p["an_duong"]), cao(p["son_can"]) + ng["mat_duoi_son_can"] * H
        dinh, dai = cao(p["dinh_tai"]), cao(p["dai_tai"])
        tren = "ngang hoặc cao hơn" if dinh <= may_y + bien else "thấp hơn"
        duoi = "ngang hoặc thấp hơn" if dai >= cao(p["chan_mui"]) - bien else "cao hơn"
        if dinh > mat_y:
            them("tai", "nho_thap", "tai_nghieng", dinh_tai=tren, dai_tai=duoi)
        elif dinh <= may_y + bien and dai >= cao(p["chan_mui"]) - bien:
            them("tai", "cao_day", "tai_nghieng", dinh_tai=tren, dai_tai=duoi)
    nguon = kb.ten_nguon(cfg.get("nguon"))
    return {"goi_y": [{"cau": c, "lua_chon": l, "do": t, "nguon": nguon} for c, l, t in goi], "so_do": sd, "canh_bao": []}


def _ghep_nghieng(kq: dict, nghieng: list[dict]) -> dict:
    """Ghép ảnh nghiêng vào kết quả ảnh thẳng. Câu ảnh thẳng đã gợi ý → giữ ảnh thẳng (tai, …). Câu chỉ ảnh nghiêng đo được:
    có hai ảnh nghiêng thì hai ảnh phải cùng gợi ý một lựa chọn mới dùng (một ảnh gợi ý, ảnh kia không / khác → bỏ, báo)."""
    if not nghieng:
        return kq
    if len(nghieng) > 2 or len({n.get("goc") for n in nghieng}) != len(nghieng):
        raise ValueError("Tối đa hai ảnh nghiêng, mỗi bên một ảnh")
    ket = []
    for n in nghieng:
        goc = n.get("goc")
        if goc not in _TEN_GOC:
            raise ValueError("Góc ảnh nghiêng không hợp lệ")
        try:
            k = do_nghieng(n.get("diem") or {}, float(n.get("ti_le") or 0))
        except ValueError as e:
            raise ValueError(f"{_TEN_GOC[goc]}: {e}") from e
        ket.append((goc, k))
    co = {g["cau"] for g in kq["goi_y"] if not _uu_tien_nghieng(g)}
    theo_cau: dict[str, list[tuple[str, dict]]] = {}
    for goc, k in ket:
        for g in k["goi_y"]:
            theo_cau.setdefault(g["cau"], []).append((goc, g))
    lech = []
    for cau, ds in theo_cau.items():
        if cau in co:
            continue
        if len(ds) != len(ket) or len({g["lua_chon"] for _, g in ds}) > 1:
            lech.append(cau)
            continue
        goc, g = ds[0]
        kq["goi_y"] = [x for x in kq["goi_y"] if x["cau"] != cau]
        kq["goi_y"].append({**g, "anh": goc})
    kq["so_do"]["nghieng"] = [{"goc": goc, **k["so_do"]} for goc, k in ket]
    if lech:
        ten = {m: c["hoi"].rstrip("?") for m, c in kb.cau_hoi_theo_ma().items()}
        kq["canh_bao"].append(kb.do_anh()["loi"]["canh_bao_hai_nghieng"].format(cau=", ".join(ten.get(c, c) for c in sorted(lech))))
    return kq
