# -*- coding: utf-8 -*-
"""PT-V0 — công cụ chấm "ảnh → bố cục": nhãn mẫu đúng schema; chấm đúng/sai dấu hiệu, vị trí, lệch hướng."""
import json

from scripts import danh_gia_bo_cuc as dg


def test_nhan_mau_dung_schema():
    assert dg.kiem() == []


def test_cham_mot():
    nhan = json.loads((dg.GOC / "vi_du_001" / "nhan.json").read_text(encoding="utf-8"))
    du = {"huong_nha_do": 350, "vi_tri": {"cua_chinh": "Nam", "bep": "Tây Nam"},
          "dau_hieu": {"guong_giuong": {"co": True, "nguon": "anh", "do_tin": 0.9},
                       "xa_ngang": {"co": True, "nguon": "anh", "do_tin": 0.6},
                       "duong_dam": {"co": True, "nguon": "anh", "do_tin": 0.5}}}
    r = dg.cham_mot(nhan, du)
    # gương đúng (tp); xà ngang báo nhầm (fp); đường đâm báo thêm (fp); cầu thang + minh đường bỏ sót (fn); bếp-cửa đúng (tn)
    assert (r["tp"], r["fp"], r["fn"], r["tn"]) == (1, 2, 2, 1)
    assert (r["vi_tri_dung"], r["vi_tri_tong"]) == (1, 4)
    assert r["lech_huong"] == 170


def test_cham_thu_muc(tmp_path):
    d = tmp_path / "bo_1"
    d.mkdir()
    nhan = {"vi_tri": {"bep": "Tây"}, "dau_hieu": {"guong_giuong": {"co": True}}}
    (d / "nhan.json").write_text(json.dumps(nhan), encoding="utf-8")
    (d / "du_doan.json").write_text(json.dumps(nhan), encoding="utf-8")
    r = dg.cham(tmp_path)
    assert r["so_bo"] == 1 and r["ti_le_dung"] == 1.0 and r["dat_pt_v2"]
