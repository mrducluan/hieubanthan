# -*- coding: utf-8 -*-
"""Kiểm thử Chặng 5 — Tự động hoá Vòng tự học `DB → KB` (`scripts/tong_hop_vong_tu_hoc.py` & workflow)."""
from __future__ import annotations

import importlib.util
import json
from pathlib import Path
import sys

import httpx
import yaml

ROOT = Path(__file__).resolve().parents[2]
SCRIPT_PATH = ROOT / "engine" / "scripts" / "tong_hop_vong_tu_hoc.py"
WORKFLOW_PATH = ROOT / "docs" / "mau-workflow" / "vong-tu-hoc-hang-tuan.yml"


def _nap_script():
    spec = importlib.util.spec_from_file_location("tong_hop_vong_tu_hoc", SCRIPT_PATH)
    assert spec and spec.loader
    mod = importlib.util.module_from_spec(spec)
    sys.modules["tong_hop_vong_tu_hoc"] = mod
    spec.loader.exec_module(mod)
    return mod


def test_suy_mo_dun_tu_ma_chinh_xac():
    mod = _nap_script()
    assert mod.suy_mo_dun_tu_ma("mau.quan_loc.ky.menh", "phi_hoa") == "tuvi"
    assert mod.suy_mo_dun_tu_ma("ds.battu.tai_chinh.thuan") == "battu"
    assert mod.suy_mo_dun_tu_ma("ds.phong_thuy.cua_chinh") == "phongthuy"
    assert mod.suy_mo_dun_tu_ma("ds.giao_thoa.cong_viec.mon") == "tam_tai"
    assert mod.suy_mo_dun_tu_ma("ds.chiem_tinh.tho_tinh") == "chiem_tinh"


def test_tai_du_lieu_supabase_khong_doc_pii_va_phan_loai_5_nhom(tmp_path: Path):
    mod = _nap_script()
    yeu_cau_ghi_nhan: list[httpx.Request] = []

    def handler(request: httpx.Request) -> httpx.Response:
        yeu_cau_ghi_nhan.append(request)
        p = request.url.path
        if p.endswith("/rpc/ty_le_kiem_chung_ngon_ngu"):
            return httpx.Response(200, json=[
                {"mau": "ds.battu.cong_viec.ap_luc", "ngon_ngu": "vi", "dung": 8, "chua_dung": 26},
                {"mau": "ds.battu.cong_viec.ap_luc", "ngon_ngu": "en", "dung": 2, "chua_dung": 14},
                {"mau": "ds.tuvi.tai_bach.loc", "ngon_ngu": "vi", "dung": 32, "chua_dung": 6},
                {"mau": "ds.tuvi.tai_bach.loc", "ngon_ngu": "en", "dung": 8, "chua_dung": 12},
            ])
        if p.endswith("/rpc/ty_le_kiem_chung_sau"):
            return httpx.Response(200, json=[
                {"loai": "doi_song", "mau": "ds.phongthuy.bep_cua", "so_phieu": 20, "da_lam": 12, "tot_hon": 5, "nhu_cu": 13},
            ])
        if p.endswith("/nhat_ky_hoi"):
            # Đảm bảo query select KHÔNG BAO GIỜ yêu cầu cột cau_hoi, user_id hay khoa
            sel = request.url.params.get("select", "")
            assert "cau_hoi" not in sel
            assert "user_id" not in sel
            assert "khoa" not in sel
            return httpx.Response(200, json=[
                {"mo_dun": "chiem_tinh", "chu_de": "composite_doi_tac", "y_dinh": "hop_doi", "do_phu": "khong_phu", "huu_ich": False}
                for _ in range(6)
            ])
        return httpx.Response(404, json={})

    client = httpx.Client(transport=httpx.MockTransport(handler))
    du_lieu = mod.tai_du_lieu_supabase("https://example.supabase.co", "test-service-key", client=client)
    kq = mod.tong_hop_ung_vien(du_lieu)
    md = mod.xuat_markdown(kq)

    assert len(yeu_cau_ghi_nhan) == 3
    assert len(kq["can_viet_lai"]) == 1
    assert kq["can_viet_lai"][0]["tep_kb_goi_y"] == "battu_doi_song_kb.json"
    assert kq["can_viet_lai"][0]["duong_quan_tri"] == "/quan-tri/tri-thuc/battu_doi_song_kb"
    assert len(kq["can_doi_hanh_dong_30_ngay"]) == 1
    assert kq["can_doi_hanh_dong_30_ngay"][0]["tep_kb_goi_y"] == "phongthuy_doi_song.json"
    assert len(kq["lech_song_ngu"]) == 1
    assert kq["lech_song_ngu"][0]["tep_en_can_ra"] == "en/tuvi_doi_song_kb.json"
    assert len(kq["cum_to_mo_moi"]) == 1
    assert kq["cum_to_mo_moi"][0]["tep_kb_goi_y"] == "chiem_tinh_hanh_tinh_cung_kb.json"
    assert len(kq["thuc_chung_cao"]) == 0  # tổng 40/58 = 69.0% (< 75%)
    assert kq["tong_can_xu_ly"] == 4
    assert "## 1. Ưu tiên biên tập lại trong tuần" in md
    assert "## 3. Độ vênh bản phủ Song ngữ VI ↔ EN" in md
    assert "## 4. Cụm chủ đề người dùng hỏi nhiều nhưng KB chưa phủ sâu" in md


def test_cli_cho_phep_thieu_env_va_workflow_hop_le(tmp_path: Path, monkeypatch):
    mod = _nap_script()
    monkeypatch.delenv("SUPABASE_URL", raising=False)
    monkeypatch.delenv("SUPABASE_SERVICE_ROLE_KEY", raising=False)
    out_json = tmp_path / "out.json"
    rc = mod.main(["--tu-supabase", "--cho-phep-thieu-env", "--out-json", str(out_json)])
    assert rc == 0
    assert not out_json.exists()

    wf = yaml.safe_load(WORKFLOW_PATH.read_text(encoding="utf-8"))
    assert wf["permissions"] == {"contents": "write", "pull-requests": "write"}
    steps = wf["jobs"]["tong-hop-tu-hoc"]["steps"]
    assert steps[0]["with"]["persist-credentials"] is False
