# -*- coding: utf-8 -*-
"""SPEC-005 — an sao tử vi đầy đủ bằng iztro (MIT) qua Node subprocess.

Quyết định đã chốt (CLAUDE.md, 2026-08-15): KHÔNG viết lại logic an sao; engine
Python gọi `ziwei_node/an_sao.mjs` (iztro ghim bản `config.IZTRO_VERSION`),
JSON vào / JSON ra. Ngày giờ sinh không rời máy chủ (NĐ 13/2023).

Tầng CALC: mỗi lần gọi là một tiến trình mới — không trạng thái, có timeout,
env tối thiểu (không proxy, không biến môi trường của engine). iztro là thuần
tính toán, không có mã mạng.

Kết quả iztro là Tử Vi Đẩu Số **Trung Quốc**, không phải Nam phái — xem
docs/NHAT-KY-DU-AN.md mục SPEC-005. Không "sửa" kết quả cho khớp Nam phái.
"""
from __future__ import annotations

import json
import os
import shutil
import subprocess
from datetime import date
from pathlib import Path
from typing import Literal

from app import config

NODE_DIR = Path(__file__).parent / "ziwei_node"
SCRIPT = NODE_DIR / "an_sao.mjs"
NODE_BIN_ENV = "ZIWEI_NODE_BIN"      # đường dẫn node tuỳ chọn; mặc định tìm trong PATH
TIMEOUT_S = 10.0


class ZiweiUnavailable(RuntimeError):
    """Máy không chạy được iztro (thiếu node / chưa `npm ci` / lệch phiên bản)."""


class ZiweiError(RuntimeError):
    """iztro chạy nhưng trả lỗi hoặc output hỏng."""


def time_index(gio: int) -> int:
    """Giờ (0–23, theo kinh tuyến lịch UTC+7) → timeIndex của iztro.

    0 = Tý sớm (00:00–00:59), 1 = Sửu (01–02), …, 11 = Hợi (21–22),
    12 = Tý muộn (23:00–23:59) — iztro tính trụ ngày sang HÔM SAU.
    """
    if not 0 <= gio <= 23:
        raise ValueError(f"Giờ không hợp lệ: {gio}")
    if gio == 23:
        return 12
    return (gio + 1) // 2


def _node_bin() -> str | None:
    custom = os.environ.get(NODE_BIN_ENV)
    if custom:
        return custom if Path(custom).is_file() else None
    return shutil.which("node")


def _iztro_da_cai() -> str | None:
    pkg = NODE_DIR / "node_modules" / "iztro" / "package.json"
    if not pkg.is_file():
        return None
    return json.loads(pkg.read_text("utf-8")).get("version")


def san_sang() -> tuple[bool, str]:
    """(được/không, lý do) — cho test skip và cho endpoint trả 503 rõ ràng."""
    if _node_bin() is None:
        return False, "không tìm thấy `node` (cài Node >= 18 hoặc đặt ZIWEI_NODE_BIN)"
    ver = _iztro_da_cai()
    if ver is None:
        return False, f"chưa cài iztro — chạy `npm ci` trong {NODE_DIR}"
    if ver != config.IZTRO_VERSION:
        return False, (f"iztro đã cài {ver} ≠ bản ghim {config.IZTRO_VERSION} "
                       f"(golden sinh bằng bản ghim) — chạy lại `npm ci`")
    return True, "ok"


def an_sao(solar: date, ti: int, gender: Literal["nam", "nu"]) -> dict:
    """An sao một lá số. `solar` là ngày dương theo kinh tuyến lịch UTC+7
    (đã quy đổi múi giờ lịch sử), `ti` là timeIndex iztro (0–12)."""
    ok, ly_do = san_sang()
    if not ok:
        raise ZiweiUnavailable(ly_do)
    if not 0 <= ti <= 12:
        raise ValueError(f"timeIndex không hợp lệ: {ti}")

    payload = json.dumps({
        "solar_date": f"{solar.year}-{solar.month}-{solar.day}",
        "time_index": ti,
        "gender": "male" if gender == "nam" else "female",
    })
    try:
        proc = subprocess.run(
            [_node_bin(), str(SCRIPT)],
            input=payload, capture_output=True, text=True, encoding="utf-8",
            timeout=TIMEOUT_S, cwd=NODE_DIR,
            env={"PATH": os.environ.get("PATH", ""), "NODE_ENV": "production"},
            check=False,
        )
    except subprocess.TimeoutExpired as e:
        raise ZiweiError(f"iztro quá thời gian {TIMEOUT_S:g}s") from e
    except OSError as e:
        raise ZiweiUnavailable(f"không chạy được node: {e}") from e

    try:
        out = json.loads(proc.stdout)
    except json.JSONDecodeError as e:
        raise ZiweiError(
            f"iztro trả output không phải JSON (exit {proc.returncode}): "
            f"{proc.stderr.strip()[:300]}") from e
    if proc.returncode != 0 or "error" in out:
        raise ZiweiError(f"iztro lỗi: {out.get('error', proc.stderr.strip()[:300])}")
    if out.get("iztro_version") != config.IZTRO_VERSION:
        raise ZiweiUnavailable(
            f"iztro chạy bản {out.get('iztro_version')} ≠ bản ghim {config.IZTRO_VERSION}")
    return out
