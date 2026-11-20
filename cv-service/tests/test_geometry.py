# -*- coding: utf-8 -*-
"""Kiểm định thuật toán hình học tất định cho cv-service (độ cong, đứt gãy, phân nhánh, Gò, chuẩn hóa độ sâu IPD)."""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.geometry import (
    classify_curvature,
    detect_breaks,
    detect_end_mount,
    detect_skeleton_forks,
    normalize_depth_delta,
)


def test_curvature_straight_vs_curved_down():
    straight = [(0.1, 0.5), (0.3, 0.502), (0.5, 0.5), (0.7, 0.499)]
    curved_down = [(0.1, 0.4), (0.3, 0.48), (0.5, 0.54), (0.7, 0.56)]
    assert classify_curvature(straight)["curvature"] == "straight"
    c = classify_curvature(curved_down)
    assert c["curvature"] == "curved_down" and c["sagitta_ratio"] > 0.04


def test_detect_end_mount_luna():
    mounts = {
        "mount_luna": [(0.6, 0.5), (0.95, 0.5), (0.95, 0.9), (0.6, 0.9)],
        "mount_jupiter": [(0.1, 0.1), (0.35, 0.1), (0.35, 0.35), (0.1, 0.35)],
    }
    assert detect_end_mount((0.75, 0.7), mounts) == "mount_luna"
    assert detect_end_mount((0.2, 0.2), mounts) == "mount_jupiter"
    assert detect_end_mount((0.5, 0.2), mounts) is None


def test_detect_breaks_and_skeleton_forks():
    segs = [[(0.1, 0.5), (0.3, 0.5)], [(0.4, 0.5), (0.6, 0.5)]]
    br = detect_breaks(segs, gap_threshold=0.05)
    assert len(br) == 1 and br[0]["gap"] == 0.1

    # Chữ Y đơn giản trên lưới 1px: tâm (5, 5) nối 3 nhánh (4,5), (6,4), (6,6)
    skel = {(3, 5), (4, 5), (5, 5), (6, 4), (7, 3), (6, 6), (7, 7)}
    forks = detect_skeleton_forks(skel)
    assert (5, 5) in forks


def test_normalize_depth_delta():
    cao = normalize_depth_delta(0.18, 0.10, 1.0)
    thap = normalize_depth_delta(0.06, 0.10, 1.0)
    assert cao["semantic_tag"] == "son_can_cao_lien"
    assert thap["semantic_tag"] == "son_can_thap_trung"
