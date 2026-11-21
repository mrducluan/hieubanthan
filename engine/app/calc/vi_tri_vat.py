# -*- coding: utf-8 -*-
"""VT-1 — "Đứng giữa nhà, chĩa điện thoại": số độ la bàn → vị trí của vật trong nhà (CALC thuần, tất định).

* `trung_binh_goc`: trung bình góc vòng (qua 0/360) + độ lệch chuẩn vòng — web gửi các mẫu la bàn thô, engine tính.
* `lech_truc` / `sua_do`: người dùng áp máy dọc một bức tường để lấy "trục nhà"; trục nhà thật = hướng nhà đo ở cửa
  + k·90°. Phần lệch (−45°, 45°] là nhiễu từ tại chỗ đứng (sắt thép, thiết bị điện) → trừ vào mọi số đo trong nhà.
* `do_tu_khung`: máy tính không có la bàn → khung nhà đúng tỉ lệ (rộng × sâu, mét), điểm chạm chuẩn hoá 0..1
  (x: trái → phải khi đứng trong nhà nhìn ra mặt trước; y: mặt trước → mặt sau). Tâm = trọng tâm phần đã xây (lưới
  `mat_bang` nếu có, không thì giữa khung).
* `vi_tri`: số độ → phương (8 quái), sơn (24 sơn), cảnh báo sát ranh — dùng đúng `pt.huong_tu_do`, `hk.son_tu_do`.
"""
from __future__ import annotations

import math

from app.calc import huyen_khong as hk
from app.calc import mat_bang
from app.calc import phongthuy as pt

NGUONG_DAO_DONG = 6.0        # độ lệch chuẩn vòng (°) quá mức này → "chưa ổn định, đo lại" (σ ≤ 3° ổn, 3–6° nên giữ yên)
NGUONG_LECH_TRUC = 25.0      # nhiễu từ lớn hơn → không tự sửa, báo đo lại / dùng khung tỉ lệ
NGUONG_RANH_8 = 5.0          # cách ranh hai trong 8 phương ≤ 5° → cảnh báo sát ranh


def _chuan(d: float) -> float:
    return d % 360.0


def trung_binh_goc(mau: list[float]) -> tuple[float, float]:
    """(trung bình vòng, độ lệch chuẩn vòng — độ). Một mẫu → lệch 0."""
    if not mau:
        raise ValueError("Cần ít nhất một số đo")
    s = sum(math.sin(math.radians(x)) for x in mau) / len(mau)
    c = sum(math.cos(math.radians(x)) for x in mau) / len(mau)
    r = min(1.0, math.hypot(s, c))
    m = _chuan(math.degrees(math.atan2(s, c)))
    if abs(m - 360.0) < 1e-9:
        m = 0.0
    lech = 0.0 if len(mau) == 1 or r >= 1.0 else math.degrees(math.sqrt(-2.0 * math.log(r))) if r > 0 else 180.0
    return round(m, 4) if abs(m) > 1e-9 else 0.0, round(lech, 4)


def lech_truc(truc_do: float, huong_nha_do: float) -> float:
    """Lệch (−45°, 45°] giữa trục đo trong nhà và trục gần nhất của nhà (hướng nhà + k·90°)."""
    d = (truc_do - huong_nha_do) % 90.0
    return d - 90.0 if d > 45.0 else d


def sua_do(do_do: float, lech: float) -> float:
    return _chuan(do_do - lech)


def do_tu_khung(rong: float, sau: float, x: float, y: float, huong_nha_do: float, luoi: list[str] | None = None) -> float:
    """Số độ la bàn của điểm (x, y) (chuẩn hoá 0..1) nhìn từ tâm nhà. Nhà rộng `rong` × sâu `sau` (mét)."""
    if not (rong > 0 and sau > 0) or not (0 <= x <= 1 and 0 <= y <= 1):
        raise ValueError("Khung nhà hoặc điểm không hợp lệ")
    if luoi:
        o = mat_bang.doc_luoi(luoi)
        tr, tc = mat_bang.tam(o)                          # (hàng, cột) theo ô
        cy, cx = tr / len(o), tc / len(o[0])
    else:
        cx, cy = 0.5, 0.5
    dx, dy = (x - cx) * rong, (cy - y) * sau              # dy > 0: về phía trước
    if math.hypot(dx, dy) < 0.05:
        raise ValueError("Điểm trùng tâm nhà — không biết phía nào")
    return round(_chuan(huong_nha_do + math.degrees(math.atan2(dx, dy))), 4)


def vi_tri(do: float) -> dict:
    """Phương (8 quái), sơn, cảnh báo sát ranh của một số độ (nhìn từ tâm nhà)."""
    d = _chuan(do)
    phuong = pt.huong_tu_do(d)
    goc_trong = (d + 22.5) % 45.0                         # 0 ở ranh trái, 45 ở ranh phải của phương
    sat = None
    if goc_trong <= NGUONG_RANH_8:
        sat = pt.huong_tu_do(d - 22.5)
    elif 45.0 - goc_trong <= NGUONG_RANH_8:
        sat = pt.huong_tu_do(d + 22.5)
    s = hk.son_tu_do(d)
    return {"do": round(d, 2), "phuong": phuong, "quai": pt.HUONG_QUAI[phuong], "son": s["son"],
            "sat_ranh_8": sat, "sat_ranh_son": s["canh_bao"] == "khong_vong"}
