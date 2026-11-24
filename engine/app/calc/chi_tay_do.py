# -*- coding: utf-8 -*-
"""CT-2 — Tầng CALC: đo bàn tay từ 21 điểm mốc. Hàm thuần, tất định, không LLM, không DB, không nhận ảnh.

Đầu vào: 21 điểm mốc theo thứ tự MediaPipe Hand (0 cổ tay; 1–4 ngón cái: khớp cổ tay–bàn, khớp bàn–ngón, khớp liên đốt, đầu
ngón; 5–8 trỏ, 9–12 giữa, 13–16 áp út, 17–20 út: gốc ngón, khớp 1, khớp 2, đầu ngón) do máy NGƯỜI DÙNG tìm trên ảnh của chính
họ (ảnh không rời máy), toạ độ chuẩn hoá 0..1 theo khung ảnh + `ty_le` = rộng / cao của ảnh + tay người dùng chọn.

Các bước:
  1. đổi về cùng đơn vị (x × ty_le) — không thì mọi tỉ lệ ngang / dọc lệch theo khung ảnh;
  2. xoay + co giãn về khung riêng của bàn tay: gốc ở cổ tay, trục dọc cổ tay → gốc ngón giữa hướng LÊN, đơn vị = dài lòng
     bàn tay (điểm 0 → điểm 9); trục ngang hướng sang phải ảnh (sau khi xoay);
  3. kiểm theo thứ tự: `khong_du_diem` (thiếu điểm / điểm trùng / tay quá nhỏ) → `nghieng_qua` (lòng bàn tay quá hẹp hoặc quá
     rộng so với dài, hoặc ba điểm cổ tay – gốc trỏ – gốc út gần thẳng hàng: tay quay cạnh / chĩa vào máy) → `mu_ban_tay` →
     `tay_nam` (một ngón có đầu ngón gần cổ tay hơn khớp giữa ngón) → `nghieng_qua` (ngón giữa dài / ngắn bất thường: ngón
     chĩa vào máy hoặc ảnh méo);
  4. đo: rộng lòng bàn tay (gốc trỏ 5 → gốc út 17), dài từng ngón theo đường gấp khúc gốc ngón → đầu ngón (ngón cái từ điểm 1),
     tỉ lệ ngón trỏ / ngón áp út; gắn nhãn ba trục theo ngưỡng KB `do_tay.nguong` (có dải "vừa");
  5. chiếu tám cung + Minh Đường lên ẢNH GỐC bằng trọng số điểm mốc trong KB `cung_tay[*].trong_so` (tổng = 1: tổ hợp
     affine, nên bất biến với khung, xoay, co giãn; trục ngang dựng từ gốc trỏ → gốc út nên đúng cho cả hai tay).

QUY ƯỚC MẶT TAY (đã chọn, test cả hai tay): ảnh KHÔNG lật gương (camera sau / ảnh tải lên). Trong khung riêng (trục dọc hướng
lên), `huong` = tích có hướng chuẩn hoá của (gốc trỏ − cổ tay) × (gốc út − cổ tay):
  - lòng bàn tay PHẢI nhìn thẳng → ngón cái bên phải ảnh → gốc trỏ bên phải gốc út → huong > 0;
  - lòng bàn tay TRÁI → huong < 0;
  - mu bàn tay phải nhìn giống lòng bàn tay trái (lật gương) → huong < 0 → khi người dùng chọn tay phải: `mu_ban_tay`.
Ảnh camera trước bị lật gương sẽ bị đọc ngược tay — web phải gửi toạ độ của ảnh không lật.

Không đo độ dày, màu, đường chỉ, gò: những thứ đó người dùng tự nhìn trên ảnh đã có lưới cung rồi tự chọn.
"""
from __future__ import annotations

import math

from app.kb import chi_tay_kb as kb

SO_DIEM = 21
LOI = ("khong_du_diem", "mu_ban_tay", "tay_nam", "nghieng_qua")
TAY = ("trai", "phai")
NGON = {"cai": (1, 2, 3, 4), "tro": (5, 6, 7, 8), "giua": (9, 10, 11, 12), "ap_ut": (13, 14, 15, 16), "ut": (17, 18, 19, 20)}
# Trục nhãn → (thấp, vừa, cao) theo số đo tăng dần.
TRUC = {"ngon": ("ngon_ngan", "ngon_vua", "ngon_dai"),
        "long": ("long_dai", "long_vua", "long_rong"),
        "tro_ap_ut": ("ap_ut_dai", "tro_ap_ut_vua", "tro_dai")}
_NGUONG_TRUC = {"ngon": ("ngon_ngan", "ngon_dai"), "long": ("long_dai", "long_rong"), "tro_ap_ut": ("ap_ut_dai", "tro_dai")}
# (khớp giữa ngón, đầu ngón) để nhận ra tay nắm; ngón cái: (khớp liên đốt, đầu ngón).
_GAP = ((3, 4), (6, 8), (10, 12), (14, 16), (18, 20))


def _r(v: float) -> float:
    return round(v, 3)


def _loi(ma: str) -> dict:
    return {"hop_le": False, "loi": ma, "so_do": None, "nhan": [], "cung": []}


def _diem(diem, ty_le: float) -> list[tuple[float, float]] | None:
    """Kiểm 21 điểm hữu hạn trong [0, 1]; đổi x sang cùng đơn vị với y. Sai → None."""
    if not isinstance(diem, (list, tuple)) or len(diem) != SO_DIEM:
        return None
    p = []
    for v in diem:
        try:
            if len(v) != 2:
                return None
            x, y = float(v[0]), float(v[1])
        except (TypeError, ValueError):
            return None
        if not (math.isfinite(x) and math.isfinite(y) and 0 <= x <= 1 and 0 <= y <= 1):
            return None
        p.append((x * ty_le, y))
    return p


def _khung(p: list[tuple[float, float]]) -> tuple[list[tuple[float, float]], float]:
    """Khung riêng: gốc cổ tay, trục dọc (cổ tay → gốc ngón giữa) hướng lên, đơn vị = dài lòng bàn tay. → (điểm, độ dài)."""
    (x0, y0), (x9, y9) = p[0], p[9]
    dx, dy = x9 - x0, y9 - y0
    L = math.hypot(dx, dy)
    ux, uy = dx / L, dy / L                       # hướng "lên" trong ảnh (y ảnh hướng xuống)
    rx, ry = -uy, ux                              # hướng "phải": với lên = (0, −1) → phải = (1, 0)
    return [(((x - x0) * rx + (y - y0) * ry) / L, ((x - x0) * ux + (y - y0) * uy) / L) for x, y in p], L


def _d(a: tuple[float, float], b: tuple[float, float]) -> float:
    return math.hypot(a[0] - b[0], a[1] - b[1])


def _dai(q: list[tuple[float, float]], idx: tuple[int, ...]) -> float:
    return sum(_d(q[i], q[j]) for i, j in zip(idx, idx[1:]))


def _nhan(gia_tri: float, truc: str, ng: dict) -> dict:
    thap, cao = (ng[k] for k in _NGUONG_TRUC[truc])
    ma = TRUC[truc][0] if gia_tri <= thap else TRUC[truc][2] if gia_tri >= cao else TRUC[truc][1]
    return {"truc": truc, "ma": ma, "vua": ma == TRUC[truc][1]}


def chieu_cung(diem: list) -> list[dict]:
    """Toạ độ 0..1 TRÊN ẢNH GỐC của tám cung + Minh Đường: tổ hợp affine của điểm mốc (trọng số KB)."""
    ra = []
    for ma, c in kb.cung_tay().items():
        x = sum(w * float(diem[int(i)][0]) for i, w in c["trong_so"].items())
        y = sum(w * float(diem[int(i)][1]) for i, w in c["trong_so"].items())
        ra.append({"ma": ma, "vt": [round(min(max(x, 0.0), 1.0), 4), round(min(max(y, 0.0), 1.0), 4)]})
    return ra


def do_tay(diem: list, ty_le: float, tay: str) -> dict:
    """→ {hop_le, loi, so_do, nhan: [{truc, ma, vua}], cung: [{ma, vt}]}. Ảnh không dùng được → hop_le False + mã `loi`
    (lời nhắc ở KB). Tham số sai kiểu (tay, ty_le) → ValueError."""
    if tay not in TAY:
        raise ValueError("tay phải là 'trai' hoặc 'phai'")
    if not (isinstance(ty_le, (int, float)) and 0.2 <= ty_le <= 5):
        raise ValueError("Tỉ lệ khung ảnh không hợp lệ")
    ng = kb.do_tay_cfg()["nguong"]
    p = _diem(diem, ty_le)
    if p is None:
        return _loi("khong_du_diem")
    L = _d(p[0], p[9])
    if L < ng["nho_nhat"]:                        # dài lòng bàn tay < x% chiều cao ảnh: tay quá nhỏ / máy dò sai
        return _loi("khong_du_diem")
    q, _ = _khung(p)

    rong = _d(q[5], q[17])
    (x5, y5), (x17, y17) = q[5], q[17]
    huong = (x5 * y17 - y5 * x17) / max(math.hypot(x5, y5) * math.hypot(x17, y17), 1e-9)
    if not ng["long_min"] <= _r(rong) <= ng["long_max"] or abs(huong) < ng["huong_min"]:
        return _loi("nghieng_qua")
    if (huong > 0) != (tay == "phai"):
        return _loi("mu_ban_tay")
    if any(_d(q[dau], q[0]) < _d(q[khop], q[0]) for khop, dau in _GAP):
        return _loi("tay_nam")
    ngon = {f: _r(_dai(q, idx)) for f, idx in NGON.items()}
    if not ng["ngon_min"] <= ngon["giua"] <= ng["ngon_max"]:
        return _loi("nghieng_qua")

    so_do = {"dai_long": 1.0, "rong_long": _r(rong), "ngon": ngon, "tro_ap_ut": _r(ngon["tro"] / ngon["ap_ut"])}
    nhan = [_nhan(ngon["giua"], "ngon", ng), _nhan(so_do["rong_long"], "long", ng), _nhan(so_do["tro_ap_ut"], "tro_ap_ut", ng)]
    from app.calc import tuong_fuzzy  # noqa: PLC0415
    return {"hop_le": True, "loi": None, "so_do": so_do, "nhan": nhan, "cung": chieu_cung(diem),
            "fuzzy_bridge": tuong_fuzzy.cau_noi_chi_tay(so_do)}


def nhan_tay(so_do: dict) -> dict:
    """TK-2 — phái Tây: ba nhãn từ số đo đã có (`do_tay`), ngưỡng KB `chi_tay_tay_kb.do_tay.nguong` (dải "vừa", can_doi_chieu).
    Trục: ngón giữa / dài lòng bàn tay (Benham: ngón dài / ngắn) · rộng / dài lòng bàn tay (Cheiro: tay vuông / dài) · ngón trỏ /
    ngón áp út (Benham: Jupiter / Apollo). `to_hop` = "long_x.ngon_y" khi cả hai trục lòng và ngón đều ra khỏi dải vừa —
    chỉ gọi tên hình dáng, không gắn nguyên tố. Thiếu khoá → KeyError."""
    from app.kb import chi_tay_tay_kb

    ng = chi_tay_tay_kb.do_tay_cfg()["nguong"]
    nhan = [_nhan(float(so_do["ngon"]["giua"]), "ngon", ng), _nhan(float(so_do["rong_long"]), "long", ng),
            _nhan(float(so_do["tro_ap_ut"]), "tro_ap_ut", ng)]
    n_ngon, n_long = nhan[0], nhan[1]
    to_hop = None if n_ngon["vua"] or n_long["vua"] else f"{n_long['ma']}.{n_ngon['ma']}"
    return {"nhan": nhan, "to_hop": to_hop}


def _d3(a: tuple[float, float, float], b: tuple[float, float, float]) -> float:
    return math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2)


def _diem_3d_hop_le(diem_3d) -> list[tuple[float, float, float]] | None:
    if not isinstance(diem_3d, (list, tuple)) or len(diem_3d) != SO_DIEM:
        return None
    ra: list[tuple[float, float, float]] = []
    for v in diem_3d:
        try:
            if len(v) != 3:
                return None
            x, y, z = float(v[0]), float(v[1]), float(v[2])
        except (TypeError, ValueError):
            return None
        if not (math.isfinite(x) and math.isfinite(y) and math.isfinite(z)):
            return None
        ra.append((x, y, z))
    return ra


def _tinh_chi_so_3d(p3: list[tuple[float, float, float]]) -> dict | None:
    """Tính độ khum lòng bàn tay (3D cupping) và tỉ lệ ngón giữa 3D từ 21 điểm worldLandmarks."""
    rong_3d = _d3(p3[5], p3[17])
    dai_long_3d = _d3(p3[0], p3[9])
    if rong_3d < 1e-6 or dai_long_3d < 1e-6:
        return None
    # Mặt phẳng (0, 5, 17): pháp tuyến n = (p5 - p0) x (p17 - p0)
    u = (p3[5][0] - p3[0][0], p3[5][1] - p3[0][1], p3[5][2] - p3[0][2])
    v = (p3[17][0] - p3[0][0], p3[17][1] - p3[0][1], p3[17][2] - p3[0][2])
    nx = u[1] * v[2] - u[2] * v[1]
    ny = u[2] * v[0] - u[0] * v[2]
    nz = u[0] * v[1] - u[1] * v[0]
    n_len = math.sqrt(nx * nx + ny * ny + nz * nz)
    if n_len < 1e-9:
        return None
    # Khoảng cách từ gốc ngón giữa (9) và gốc ngón áp út (13) tới mặt phẳng lòng bàn tay
    dist9 = abs((p3[9][0] - p3[0][0]) * nx + (p3[9][1] - p3[0][1]) * ny + (p3[9][2] - p3[0][2]) * nz) / n_len
    dist13 = abs((p3[13][0] - p3[0][0]) * nx + (p3[13][1] - p3[0][1]) * ny + (p3[13][2] - p3[0][2]) * nz) / n_len
    do_khum = _r(((dist9 + dist13) * 0.5) / rong_3d)
    ngon_giua_3d = sum(_d3(p3[i], p3[j]) for i, j in zip(NGON["giua"], NGON["giua"][1:]))
    return {
        "do_khum_long": do_khum,
        "ty_le_ngon_giua_3d": _r(ngon_giua_3d / dai_long_3d),
    }


def _lam_sach_duong_chi(raw: dict | None) -> dict | None:
    if not isinstance(raw, dict):
        return None
    ra: dict = {"do_tin": "goi_y_tham_khao"}
    if isinstance(raw.get("do_ro_tong"), (int, float)) and math.isfinite(raw["do_ro_tong"]):
        ra["do_ro_tong"] = _r(min(1.0, max(0.0, float(raw["do_ro_tong"]))))
    for ten in ("tam_dao", "tri_dao", "sinh_dao"):
        muc = raw.get(ten)
        if isinstance(muc, dict):
            s = {}
            for k in ("do_ro", "chieu_dai_uoc_luong", "do_cong"):
                v = muc.get(k)
                if isinstance(v, (int, float)) and math.isfinite(v):
                    s[k] = _r(min(1.0, max(0.0, float(v))))
            if s:
                ra[ten] = s
    return ra if len(ra) > 1 else None


def do_tay_mo_rong(
    diem: list,
    ty_le: float,
    tay: str,
    diem_3d: list | None = None,
    duong_chi_goi_y: dict | None = None,
) -> dict:
    """Mở rộng `do_tay` với góc mở ngón cái, tỉ lệ 3 đốt ngón giữa, độ khum 3D (worldLandmarks) và tín hiệu đường chỉ CV."""
    kq = do_tay(diem, ty_le, tay)
    if not kq["hop_le"]:
        return kq

    p = _diem(diem, ty_le)
    assert p is not None
    q, _ = _khung(p)

    # Góc mở ngón cái: góc giữa vector (1→2) và trục (0→5)
    v12 = (q[2][0] - q[1][0], q[2][1] - q[1][1])
    v05 = (q[5][0] - q[0][0], q[5][1] - q[0][1])
    n12 = math.hypot(v12[0], v12[1])
    n05 = math.hypot(v05[0], v05[1])
    goc_ngon_cai = 0.0
    if n12 > 1e-6 and n05 > 1e-6:
        cos_a = max(-1.0, min(1.0, (v12[0] * v05[0] + v12[1] * v05[1]) / (n12 * n05)))
        goc_ngon_cai = round(math.degrees(math.acos(cos_a)), 1)

    # Tỉ lệ 3 đốt ngón giữa (9→10 gốc, 10→11 giữa, 11→12 đầu)
    d_goc, d_giua, d_dau = _d(q[9], q[10]), _d(q[10], q[11]), _d(q[11], q[12])
    tong_giua = max(d_goc + d_giua + d_dau, 1e-6)
    dot_ngon_giua = {
        "dot_goc": _r(d_goc / tong_giua),
        "dot_giua": _r(d_giua / tong_giua),
        "dot_dau": _r(d_dau / tong_giua),
    }

    so_do = {
        **kq["so_do"],
        "goc_ngon_cai": goc_ngon_cai,
        "dot_ngon_giua": dot_ngon_giua,
    }

    p3 = _diem_3d_hop_le(diem_3d)
    if p3 is not None:
        chi_so_3d = _tinh_chi_so_3d(p3)
        if chi_so_3d is not None:
            so_do["chi_so_3d"] = chi_so_3d

    duong_sach = _lam_sach_duong_chi(duong_chi_goi_y)
    return {
        **kq,
        "so_do": so_do,
        **({"duong_chi_goi_y": duong_sach} if duong_sach is not None else {}),
    }


def chenh_hai_tay(kq_trai: dict | None, kq_phai: dict | None) -> dict | None:
    """Số chênh giữa tay trái và tay phải (chỉ SỐ + mã nhóm; lời ở `luangiai.chi_tay_hop_nhat.so_sanh_hai_tay`)."""
    if not kq_trai or not kq_phai or not kq_trai.get("hop_le") or not kq_phai.get("hop_le"):
        return None
    sd_t, sd_p = kq_trai["so_do"], kq_phai["so_do"]
    chenh_rong = _r(float(sd_p["rong_long"]) - float(sd_t["rong_long"]))
    chenh_ngon = _r(float(sd_p["ngon"]["giua"]) - float(sd_t["ngon"]["giua"]))
    chenh_2d4d = _r(float(sd_p["tro_ap_ut"]) - float(sd_t["tro_ap_ut"]))
    dt_t = (kq_trai.get("fuzzy_bridge") or {}).get("dang_ban_tay") or {}
    dt_p = (kq_phai.get("fuzzy_bridge") or {}).get("dang_ban_tay") or {}
    hanh_t, hanh_p = dt_t.get("ma"), dt_p.get("ma")
    return {
        "chenh_rong_long": chenh_rong, "chenh_ngon_giua": chenh_ngon, "chenh_tro_ap_ut": chenh_2d4d,
        "hanh_trai": hanh_t, "hanh_phai": hanh_p,
        "ten_hanh_trai": dt_t.get("ten", ""), "ten_hanh_phai": dt_p.get("ten", ""),
        "chuyen_dich_hanh": bool(hanh_t and hanh_p and hanh_t != hanh_p),
        "tong_chenh": abs(chenh_rong) + abs(chenh_ngon) + abs(chenh_2d4d),
    }
