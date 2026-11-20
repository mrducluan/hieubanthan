# -*- coding: utf-8 -*-
"""Thuật toán hình học tất định cho Layer 1B (Chỉ Tay & Độ Sâu 3D Nhân Tướng).

Không phụ thuộc GPU hay trọng số ONNX — chạy thuần Python toán học trên tập điểm đường cong (polyline)
hoặc lưới skeleton 1px để trích xuất: độ cong, phân nhánh (degree >= 3), đứt gãy (Euclidean gap),
điểm cuối rơi vào đa giác Gò nào (ray-casting point-in-polygon), và độ sâu Sơn Căn chuẩn hóa theo IPD.
"""
from __future__ import annotations

import math
from typing import Sequence

Point = tuple[float, float]


def point_in_polygon(pt: Point, poly: Sequence[Point]) -> bool:
    """Thuật toán Ray-Casting kiểm tra điểm (x, y) có nằm trong đa giác Gò bàn tay hay không."""
    x, y = pt
    n = len(poly)
    if n < 3:
        return False
    inside = False
    j = n - 1
    for i in range(n):
        xi, yi = poly[i]
        xj, yj = poly[j]
        if ((yi > y) != (yj > y)) and (x < (xj - xi) * (y - yi) / ((yj - yi) or 1e-12) + xi):
            inside = not inside
        j = i
    return inside


def detect_end_mount(end_pt: Point, mount_polygons: dict[str, Sequence[Point]]) -> str | None:
    """Xác định điểm kết thúc của đường chỉ tay rơi vào vùng Gò nào."""
    for mount_name, poly in mount_polygons.items():
        if point_in_polygon(end_pt, poly):
            return mount_name
    return None


def classify_curvature(polyline: Sequence[Point], straight_threshold: float = 0.04) -> dict:
    """Đo độ cong có dấu của 1 đường chỉ tay (chuẩn hóa theo khoảng cách dây cung đầu→cuối).
    Quy ước ảnh 2D (y tăng xuống dưới): lệch dương xuống dưới = curved_down, lên trên = curved_up."""
    if len(polyline) < 3:
        return {"curvature": "straight", "sagitta_ratio": 0.0, "length": 0.0}
    x0, y0 = polyline[0]
    x1, y1 = polyline[-1]
    chord = math.hypot(x1 - x0, y1 - y0)
    length = sum(math.hypot(polyline[i + 1][0] - polyline[i][0], polyline[i + 1][1] - polyline[i][1]) for i in range(len(polyline) - 1))
    if chord < 1e-6:
        return {"curvature": "loop", "sagitta_ratio": 1.0, "length": round(length, 4)}

    # Khoảng cách có dấu từ từng điểm tới đường thẳng nối đầu→cuối (dương = cong xuống dưới khi đi trái→phải)
    ux, uy = (x1 - x0) / chord, (y1 - y0) / chord
    signed = [((px - x0) * uy - (py - y0) * ux) for px, py in polyline[1:-1]]
    # Đảo dấu để dương = y lớn hơn dây cung (curved_down về phía cổ tay / Gò Thái Âm)
    avg_signed = -sum(signed) / len(signed)
    ratio = avg_signed / chord
    if abs(ratio) < straight_threshold:
        label = "straight"
    elif ratio > 0:
        label = "curved_down"
    else:
        label = "curved_up"
    return {"curvature": label, "sagitta_ratio": round(ratio, 4), "length": round(length, 4)}


def detect_breaks(segments: Sequence[Sequence[Point]], gap_threshold: float = 0.025) -> list[dict]:
    """Phát hiện đứt gãy giữa các đoạn cùng 1 đường chỉ tay bằng khoảng cách Euclid."""
    breaks: list[dict] = []
    for i in range(len(segments) - 1):
        if not segments[i] or not segments[i + 1]:
            continue
        p_end = segments[i][-1]
        p_start = segments[i + 1][0]
        dist = math.hypot(p_start[0] - p_end[0], p_start[1] - p_end[1])
        if dist >= gap_threshold:
            breaks.append({"after_segment": i, "gap": round(dist, 4), "from": p_end, "to": p_start})
    return breaks


def detect_skeleton_forks(skeleton_pixels: set[tuple[int, int]]) -> list[tuple[int, int]]:
    """Phát hiện các điểm phân nhánh (branch points bậc >= 3) trên khung xương 1px (8-connected)."""
    forks: list[tuple[int, int]] = []
    for x, y in sorted(skeleton_pixels):
        deg = sum(
            1
            for dx in (-1, 0, 1)
            for dy in (-1, 0, 1)
            if (dx != 0 or dy != 0) and (x + dx, y + dy) in skeleton_pixels
        )
        if deg >= 3:
            forks.append((x, y))
    return forks


def normalize_depth_delta(z_point: float, z_reference: float, ipd: float) -> dict:
    """Chuẩn hóa hiệu số chiều sâu trục Z theo khoảng cách 2 tâm đồng tử (IPD) cho Sơn Căn / Chuẩn Đầu."""
    if ipd <= 1e-6:
        raise ValueError("IPD phải lớn hơn 0")
    norm = (z_point - z_reference) / ipd
    tag = "son_can_cao_lien" if norm >= 0.06 else ("son_can_thap_trung" if norm <= -0.02 else "son_can_vua")
    return {"depth_z_norm": round(norm, 4), "semantic_tag": tag}
