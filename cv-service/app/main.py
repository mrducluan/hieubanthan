# -*- coding: utf-8 -*-
"""FastAPI CV Microservice (ONNX Runtime) cho hieuban.com — RAM-only, 0 lưu ảnh."""
from __future__ import annotations

import os
from pathlib import Path

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from app.geometry import classify_curvature, detect_breaks, detect_end_mount, normalize_depth_delta

MODELS_DIR = Path(os.environ.get("CV_MODELS_DIR", "/app/models"))

app = FastAPI(title="hieuban-cv-service", version="0.1.0")


class PalmVectorIn(BaseModel):
    line_name: str = Field(..., pattern="^(life|head|heart|fate)$")
    segments: list[list[tuple[float, float]]]
    mount_polygons: dict[str, list[tuple[float, float]]] = Field(default_factory=dict)


class FaceDepthIn(BaseModel):
    z_son_can: float
    z_reference: float
    ipd: float = Field(..., gt=0)


@app.get("/health")
def health() -> dict:
    depth_ok = (MODELS_DIR / "depth_anything_v2_vits.onnx").exists()
    palm_ok = (MODELS_DIR / "palm_segformer.onnx").exists()
    hair_ok = (MODELS_DIR / "bisenet_hair.onnx").exists()
    return {
        "ok": True,
        "privacy": "ram_only_zero_disk",
        "models_loaded": {"depth_anything_v2": depth_ok, "palm_segformer": palm_ok, "bisenet_hair": hair_ok},
    }


@app.post("/v1/cv/palm-geometry")
def palm_geometry(inp: PalmVectorIn) -> dict:
    """Phân tích hình học tất định từ các đoạn đường chỉ tay đã tách (độ cong, đứt gãy, điểm kết thúc tại Gò)."""
    flat = [pt for seg in inp.segments for pt in seg]
    if len(flat) < 2:
        raise HTTPException(422, detail="Cần ít nhất 2 điểm tọa độ trên đường chỉ tay.")
    curv = classify_curvature(flat)
    breaks = detect_breaks(inp.segments)
    end_zone = detect_end_mount(flat[-1], inp.mount_polygons) if inp.mount_polygons else None
    tag = f"{inp.line_name}_{curv['curvature']}" + (f"_to_{end_zone}" if end_zone else "")
    return {
        "line_name": inp.line_name,
        **curv,
        "has_break": len(breaks) > 0,
        "breaks": breaks,
        "end_zone": end_zone,
        "semantic_tag": tag,
    }


@app.post("/v1/cv/face-depth-norm")
def face_depth_norm(inp: FaceDepthIn) -> dict:
    """Chuẩn hóa hiệu số độ sâu trục Z theo IPD để đưa vào Layer 2 Rule Engine."""
    return normalize_depth_delta(inp.z_son_can, inp.z_reference, inp.ipd)
