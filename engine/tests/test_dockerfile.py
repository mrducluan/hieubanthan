# -*- coding: utf-8 -*-
"""Sự cố 2026-11-02: ảnh Docker của engine chỉ chép ziwei/an_sao.mjs, thiếu an_sao_lib.mjs + may_chu.mjs (EN-4 tách
ra) → trên production MỌI lượt an sao lỗi 503 "Máy an sao Tử vi đang bận" (Tử vi, Thời gian tới, Xem 2 người…), trong
khi pytest trên máy dev vẫn xanh vì đọc thẳng thư mục ziwei/. Hai lớp chặn:
  1. kiểm TĨNH: mọi tệp Node mà Python gọi + mọi tệp chúng import tương đối đều được Dockerfile chép vào ảnh;
  2. `tuvi_an_sao.tu_kiem()` (chạy ở bước build ảnh) hỏng khi thiếu tệp.
"""
from __future__ import annotations

import re
from pathlib import Path

import pytest

from app.calc import tuvi_an_sao

ENGINE = Path(__file__).resolve().parents[1]
DOCKERFILE = ENGINE / "Dockerfile"
ZIWEI = ENGINE / "ziwei"


def _tep_duoc_chep() -> set[str]:
    """Tên tệp trong ziwei/ mà Dockerfile COPY (dòng `COPY ziwei/a ziwei/b ./`)."""
    ra: set[str] = set()
    for dong in DOCKERFILE.read_text(encoding="utf-8").splitlines():
        if dong.strip().startswith("COPY ") and "--from" not in dong:
            ra |= {Path(x).name for x in dong.split()[1:-1] if x.startswith("ziwei/")}
    return ra


def _bao_dong(goc: Path) -> set[str]:
    """Tệp gốc + mọi tệp .mjs/.js nó import tương đối (đệ quy)."""
    can, cho = set(), [goc]
    while cho:
        tep = cho.pop()
        if tep.name in can:
            continue
        can.add(tep.name)
        for duong in re.findall(r"""(?:from|import)\s*\(?\s*['"](\.{1,2}/[^'"]+)['"]""", tep.read_text(encoding="utf-8")):
            cho.append((tep.parent / duong).resolve())
    return can


def test_dockerfile_chep_du_tep_node_python_goi():
    can = _bao_dong(tuvi_an_sao.SCRIPT) | _bao_dong(tuvi_an_sao.MAY_CHU)
    assert {"an_sao.mjs", "may_chu.mjs", "an_sao_lib.mjs"} <= can     # bộ dò import tự kiểm
    thieu = can - _tep_duoc_chep()
    assert not thieu, f"Dockerfile chưa chép vào ảnh: {sorted(thieu)}"


def test_dockerfile_build_chay_tu_kiem():
    assert "tuvi_an_sao.tu_kiem()" in DOCKERFILE.read_text(encoding="utf-8")


def test_dockerignore_khong_chan_tep_node_can():
    bo = (ENGINE / ".dockerignore").read_text(encoding="utf-8").split()
    for ten in _tep_duoc_chep():
        assert not any(Path("ziwei", ten).match(m) or ten == m for m in bo), ten


def test_tu_kiem_chay_duoc():
    tuvi_an_sao.tu_kiem()


@pytest.mark.parametrize("bo", ["an_sao_lib.mjs", "may_chu.mjs", "an_sao.mjs"])
def test_tu_kiem_hong_khi_thieu_tep(tmp_path, monkeypatch, bo):
    """Dựng lại đúng cảnh ảnh lỗi: thư mục ziwei thiếu một tệp."""
    for tep in ZIWEI.glob("*.mjs"):
        if tep.name != bo:
            (tmp_path / tep.name).write_bytes(tep.read_bytes())
    for ten in ("package.json", "node_modules"):
        (tmp_path / ten).symlink_to(ZIWEI / ten)
    monkeypatch.setattr(tuvi_an_sao, "THU_MUC", tmp_path)
    monkeypatch.setattr(tuvi_an_sao, "SCRIPT", tmp_path / "an_sao.mjs")
    monkeypatch.setattr(tuvi_an_sao, "MAY_CHU", tmp_path / "may_chu.mjs")
    with pytest.raises(tuvi_an_sao.AnSaoLoi):
        tuvi_an_sao.tu_kiem()


def test_tu_kiem_bat_loi_import_du_tep_ton_tai(tmp_path, monkeypatch):
    """Tệp có mặt nhưng import hỏng (vd lib lỗi cú pháp) → vẫn bắt được, không dừng ở bước kiểm tên tệp."""
    for tep in ZIWEI.glob("*.mjs"):
        (tmp_path / tep.name).write_bytes(tep.read_bytes())
    (tmp_path / "an_sao_lib.mjs").write_text("export const anSao = () => { throw new Error('hong'); };\n")
    for ten in ("package.json", "node_modules"):
        (tmp_path / ten).symlink_to(ZIWEI / ten)
    monkeypatch.setattr(tuvi_an_sao, "THU_MUC", tmp_path)
    monkeypatch.setattr(tuvi_an_sao, "SCRIPT", tmp_path / "an_sao.mjs")
    monkeypatch.setattr(tuvi_an_sao, "MAY_CHU", tmp_path / "may_chu.mjs")
    with pytest.raises(tuvi_an_sao.AnSaoLoi):
        tuvi_an_sao.tu_kiem()


# ---- EN-6: khoá bản dependency + một bản Python giữa máy dev, CI và ảnh Docker ------------------------------------------
def _ghim() -> dict[str, str]:
    ra = {}
    for dong in (ENGINE / "constraints.txt").read_text(encoding="utf-8").splitlines():
        dong = dong.strip()
        if dong and not dong.startswith("#"):
            ten, _, ban = dong.partition("==")
            assert ban, f"constraints.txt phải ghim '==': {dong}"
            ra[re.sub(r"[-_.]+", "-", ten).lower()] = ban
    return ra


def test_constraints_ghim_moi_goi_trong_requirements_va_thoa_dieu_kien():
    from packaging.requirements import Requirement
    ghim = _ghim()
    for dong in (ENGINE / "requirements.txt").read_text(encoding="utf-8").splitlines():
        dong = dong.split("#")[0].strip()
        if not dong:
            continue
        r = Requirement(dong)
        ten = re.sub(r"[-_.]+", "-", r.name).lower()
        assert ten in ghim, f"{r.name} chưa có trong constraints.txt — sinh lại bằng pip freeze trong ảnh Docker"
        assert r.specifier.contains(ghim[ten], prereleases=True), f"{r.name}=={ghim[ten]} không thoả '{r.specifier}'"


def test_mot_ban_python_dockerfile_ci_python_version():
    ban = (ENGINE / ".python-version").read_text(encoding="utf-8").strip()
    assert f"FROM python:{ban}-slim" in DOCKERFILE.read_text(encoding="utf-8")
    wf = ENGINE.parent / ".github" / "workflows"
    for tep in wf.glob("*.yml"):
        for m in re.findall(r'python-version:\s*"?([0-9.]+)"?', tep.read_text(encoding="utf-8")):
            assert m == ban, f"{tep.name}: python-version {m} khác {ban}"
        if "pip install -r engine/requirements.txt" in tep.read_text(encoding="utf-8"):
            assert "-c engine/constraints.txt" in tep.read_text(encoding="utf-8"), tep.name
