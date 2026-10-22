# -*- coding: utf-8 -*-
"""PT-V2 (Q2/Q3, 2026-10-22) — hình học mặt bằng THUẦN PYTHON (không PostGIS, không dependency) + hướng từ hai điểm bản đồ.

Mặt bằng người dùng VẼ TAY trên lưới N×N: hàng trên cùng = mặt trước nhà (phía hướng nhà nhìn ra), phải của hình = tay
phải khi đứng trong nhà nhìn ra. Từ đó tính:
  * tâm nhà (trọng tâm diện tích các ô đã tô) và ô chứa tâm;
  * lưới Cửu cung 3×3 trên khung bao (như Lạc thư đặt lên mặt bằng), tỉ lệ diện tích từng ô được phủ → khuyết góc khi
    một ô ngoài biên phủ < 40 % (ngưỡng của tài liệu Drive; chỉnh ở `NGUONG_KHUYET`);
  * phương (8 hướng + Trung cung) của một ô theo góc từ tâm, quay theo độ hướng nhà: góc 0 = phía trước, tăng theo chiều
    kim đồng hồ → phương la bàn = (độ hướng nhà + góc) mod 360. Vùng Trung cung = 1/3 giữa của khung bao;
  * cửa – tâm – ban công thẳng hàng (± `GOC_THANG_HANG` độ) và không có ô trống chắn giữa → "xuyên đường sát";
  * nhà vệ sinh có ô nào rơi vào vùng Trung cung hoặc chứa tâm nhà → "WC giữa nhà".
`bearing()` = góc phương vị ban đầu giữa hai toạ độ (công thức trắc địa trên mặt cầu) — đủ chính xác (≈ 1°) để lấy
hướng nhà từ hai điểm chọn trên bản đồ (tâm nhà → điểm ngay trước mặt nhà) khi không đo được la bàn ở cửa.
Tất định, không giữ trạng thái; mọi hàm nhận ô (hàng, cột) đánh số từ 0.
"""
from __future__ import annotations

import math

HUONG8 = ["Bắc", "Đông Bắc", "Đông", "Đông Nam", "Nam", "Tây Nam", "Tây", "Tây Bắc"]
DO_HUONG8 = {h: i * 45.0 for i, h in enumerate(HUONG8)}
NGUONG_KHUYET = 0.40          # ô Cửu cung ngoài biên phủ dưới 40 % diện tích → khuyết
GOC_THANG_HANG = 12.0         # cửa – tâm – ban công lệch nhau ≤ 12° → thẳng hàng
KICH_THUOC = (3, 12)          # lưới N×N, N từ 3 đến 12
_O_9 = [(0, 0), (0, 1), (0, 2), (1, 0), (1, 1), (1, 2), (2, 0), (2, 1), (2, 2)]


def doc_luoi(luoi: list[str]) -> list[list[bool]]:
    """Mỗi hàng là chuỗi cùng độ dài; ô tô = '1' hoặc '#' hoặc 'x'. Lỗi hình dạng → ValueError."""
    if not KICH_THUOC[0] <= len(luoi) <= KICH_THUOC[1]:
        raise ValueError(f"Lưới cần từ {KICH_THUOC[0]} đến {KICH_THUOC[1]} hàng")
    n = len(luoi[0])
    if not KICH_THUOC[0] <= n <= KICH_THUOC[1] or any(len(r) != n for r in luoi):
        raise ValueError("Các hàng của lưới phải cùng độ dài 3–12 ô")
    o = [[c in "1#xX" for c in r] for r in luoi]
    if sum(map(sum, o)) < 2:
        raise ValueError("Cần tô ít nhất 2 ô cho mặt bằng")
    return o


def tam(o: list[list[bool]]) -> tuple[float, float]:
    """Trọng tâm diện tích (hàng, cột) — tâm ô (r, c) là (r + 0,5, c + 0,5)."""
    cells = [(r + 0.5, c + 0.5) for r, row in enumerate(o) for c, v in enumerate(row) if v]
    return (sum(x for x, _ in cells) / len(cells), sum(y for _, y in cells) / len(cells))


def khung_bao(o: list[list[bool]]) -> tuple[int, int, int, int]:
    """(hàng đầu, cột đầu, hàng cuối + 1, cột cuối + 1) của phần đã tô."""
    rs = [r for r, row in enumerate(o) if any(row)]
    cs = [c for c in range(len(o[0])) if any(row[c] for row in o)]
    return rs[0], cs[0], rs[-1] + 1, cs[-1] + 1


def _phu(o: list[list[bool]], r0: float, c0: float, r1: float, c1: float) -> float:
    """Diện tích đã tô nằm trong hình chữ nhật [r0, r1) × [c0, c1) (đơn vị ô)."""
    s = 0.0
    for r, row in enumerate(o):
        for c, v in enumerate(row):
            if v:
                s += max(0.0, min(r + 1, r1) - max(r, r0)) * max(0.0, min(c + 1, c1) - max(c, c0))
    return s


def goc_tu_tam(t: tuple[float, float], r: float, c: float) -> float:
    """Góc (độ, 0 = phía trước, theo chiều kim đồng hồ) của điểm (r, c) nhìn từ tâm. Trùng tâm → 0."""
    dy, dx = t[0] - r, c - t[1]          # dy > 0: về phía trước (hàng nhỏ hơn)
    if abs(dx) < 1e-9 and abs(dy) < 1e-9:
        return 0.0
    return math.degrees(math.atan2(dx, dy)) % 360


def phuong(goc_cuc_bo: float, huong_do: float | None) -> str | None:
    """Phương la bàn của một góc cục bộ khi biết độ hướng nhà; None khi chưa có hướng."""
    if huong_do is None:
        return None
    return HUONG8[int((((huong_do + goc_cuc_bo) % 360) + 22.5) % 360 // 45)]


def trong_trung_cung(o: list[list[bool]], r: float, c: float) -> bool:
    """Điểm nằm trong 1/3 giữa của khung bao (vùng Trung cung của lưới Cửu cung)."""
    r0, c0, r1, c1 = khung_bao(o)
    h, w = r1 - r0, c1 - c0
    return r0 + h / 3 <= r < r0 + 2 * h / 3 and c0 + w / 3 <= c < c0 + 2 * w / 3


def phan_tich(luoi: list[str], huong_do: float | None = None, phong: dict[str, tuple[int, int]] | None = None,
              ban_cong: tuple[int, int] | None = None) -> dict:
    """Phân tích mặt bằng vẽ tay. `phong` = {mã phòng: (hàng, cột)} (ô đại diện), `ban_cong` = ô ban công / cửa sổ lớn.
    Trả về: tam, tam_o, tam_ngoai_nha, o_9 (9 ô Cửu cung: ti_le phủ, khuyết, phương), khuyet_goc, phuong_phong,
    wc_trung_cung, cua_thong_ban_cong, canh_bao."""
    o = doc_luoi(luoi)
    t = tam(o)
    r0, c0, r1, c1 = khung_bao(o)
    h, w = (r1 - r0) / 3, (c1 - c0) / 3
    o_9 = []
    khuyet = []
    for i, (a, b) in enumerate(_O_9):
        y0, x0 = r0 + a * h, c0 + b * w
        ti_le = _phu(o, y0, x0, y0 + h, x0 + w) / (h * w)
        goc = goc_tu_tam((r0 + 1.5 * h, c0 + 1.5 * w), y0 + h / 2, x0 + w / 2)
        ten = "Trung cung" if (a, b) == (1, 1) else phuong(goc, huong_do)
        kh = (a, b) != (1, 1) and ti_le < NGUONG_KHUYET
        o_9.append({"hang": a, "cot": b, "ti_le": round(ti_le, 3), "goc": round(goc, 1), "phuong": ten, "khuyet": kh})
        if kh:
            khuyet.append(ten or f"góc hàng {a} cột {b}")
    tam_o = (int(t[0]), int(t[1]))
    tam_ngoai_nha = not o[tam_o[0]][tam_o[1]]
    phuong_phong: dict[str, dict] = {}
    for ma, (r, c) in (phong or {}).items():
        if not (0 <= r < len(o) and 0 <= c < len(o[0])):
            raise ValueError(f"Ô của {ma} nằm ngoài lưới")
        tc = trong_trung_cung(o, r + 0.5, c + 0.5) or (r, c) == tam_o
        goc = goc_tu_tam(t, r + 0.5, c + 0.5)
        phuong_phong[ma] = {"o": [r, c], "goc": round(goc, 1), "phuong": "Trung cung" if tc else phuong(goc, huong_do), "trung_cung": tc}
    wc = phuong_phong.get("ve_sinh")
    cua = phuong_phong.get("cua_chinh")
    thang = None
    if cua and ban_cong:
        rc, cc = cua["o"]
        rb, cb = ban_cong
        if (rb, cb) != (rc, cc):
            g1 = goc_tu_tam((rc + 0.5, cc + 0.5), rb + 0.5, cb + 0.5)       # cửa → ban công
            g2 = goc_tu_tam((rc + 0.5, cc + 0.5), t[0], t[1])                # cửa → tâm
            lech = abs((g1 - g2 + 180) % 360 - 180)
            xa = math.hypot(rb - rc, cb - cc) >= 2
            # không có ô trống chắn giữa (đi theo đoạn thẳng, lấy mẫu mỗi nửa ô)
            n = int(math.hypot(rb - rc, cb - cc) * 2) + 1
            thong = all(o[int(rc + 0.5 + (rb - rc) * k / n)][int(cc + 0.5 + (cb - cc) * k / n)] for k in range(n + 1))
            thang = {"lech_do": round(lech, 1), "thang_hang": lech <= GOC_THANG_HANG and xa and thong}
    canh_bao = []
    if tam_ngoai_nha:
        canh_bao.append("Tâm nhà rơi ra ngoài phần đã tô (nhà chữ L / chữ U sâu): các phương tính từ tâm chỉ là gần đúng.")
    if huong_do is None:
        canh_bao.append("Chưa có độ hướng nhà nên chỉ ra được hình dáng, tâm và khuyết góc; thêm hướng để biết góc khuyết ở phía nào.")
    return {"tam": [round(t[0], 2), round(t[1], 2)], "tam_o": list(tam_o), "tam_ngoai_nha": tam_ngoai_nha,
            "khung_bao": [r0, c0, r1, c1], "so_o": int(sum(map(sum, o))), "o_9": o_9, "khuyet_goc": khuyet,
            "phuong_phong": phuong_phong, "wc_trung_cung": bool(wc and wc["trung_cung"]),
            "cua_thong_ban_cong": thang, "canh_bao": canh_bao}


def bearing(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Góc phương vị ban đầu (độ, 0 = Bắc thật, theo chiều kim đồng hồ) từ điểm 1 tới điểm 2 trên mặt cầu."""
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dl = math.radians(lon2 - lon1)
    x = math.sin(dl) * math.cos(p2)
    y = math.cos(p1) * math.sin(p2) - math.sin(p1) * math.cos(p2) * math.cos(dl)
    return round(math.degrees(math.atan2(x, y)) % 360, 2)


def khoang_cach_m(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Khoảng cách haversine (mét) — để cảnh báo hai điểm quá gần (dưới 5 m thì sai số góc lớn)."""
    p1, p2 = math.radians(lat1), math.radians(lat2)
    a = math.sin((p2 - p1) / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(math.radians(lon2 - lon1) / 2) ** 2
    return round(2 * 6_371_000 * math.asin(math.sqrt(a)), 1)
