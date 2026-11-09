# -*- coding: utf-8 -*-
"""HTT-2 H6 — "Soạn lại nháp → PR" cho mã lệch theo ngôn ngữ (chuyen_ngu/soan_lai.py + POST /v1/quan-tri/soan-lai-lech).
Máy chỉ suy cụm KB từ MÃ, chạy lại máy chuyển ngữ ba lượt trên cụm đó và trả NHÁP; không ghi KB. Viết trước hàm."""
from __future__ import annotations

import json

from fastapi.testclient import TestClient

from app.chuyen_ngu import soan_lai
from app.main import app

client = TestClient(app)


def test_nguon_cua_ma():
    assert soan_lai.nguon_cua_ma("ds.tarot.tung_la.ba_la.hien_tai.dai_0.x") == {"tep": "tarot_kb.json", "cum": ["la.dai_0"], "mo_ta": "lá bài dai_0"}
    assert soan_lai.nguon_cua_ma("ds.tarot.viec.gay_3.n.cong_viec")["cum"] == ["la.gay_3"]
    assert soan_lai.nguon_cua_ma("ds.tarot.tra_loi.co.x")["cum"] == ["chuong.tra_loi"]
    assert soan_lai.nguon_cua_ma("ds.giao_thoa.cong_viec.mon.thuan.2")["cum"] == ["mau.cung_mang.thuan", "mang.cong_viec"]
    assert soan_lai.nguon_cua_ma("ds.giao_thoa.tuvi.mang.can_chu_dong.2")["cum"] == ["mau.cung_mon.can_chu_dong", "mon.tuvi"]
    assert soan_lai.nguon_cua_ma("ds.giao_thoa.tien_bac.lech")["cum"] == ["mau.lech", "mang.tien_bac"]
    assert soan_lai.nguon_cua_ma("ds.su_nghiep.thien_co.sang.manh") is None       # Tử vi: chưa hỗ trợ
    assert soan_lai.nguon_cua_ma("hn.x.y") is None and soan_lai.nguon_cua_ma("ds.tarot.la_la") is None


def _ai_gia(ban_cu: dict[str, str]):
    """Máy AI giả: lượt 1–2 trả đúng bản Anh đang dùng (đã qua kiểm thật), lượt kiểm định chấm đạt + dịch ngược = nguồn."""
    def goi(messages, **_):
        nhan = json.loads(messages[-1]["content"].split("INPUT:\n", 1)[1])
        if nhan and all(isinstance(v, dict) for v in nhan.values()):
            return json.dumps({k: {"trung_thanh": 1, "tu_nhien": 1, "an_toan": True, "dich_nguoc": v["vi"]} for k, v in nhan.items()}, ensure_ascii=False)
        return json.dumps({k: ban_cu.get(v, "") for k, v in nhan.items()}, ensure_ascii=False)
    return goi


def test_soan_lai_la_tarot_tra_nhap_theo_duong_dan():
    vi = json.loads((soan_lai._DATA / "tarot_kb.json").read_text(encoding="utf-8"))["la"]["dai_0"]
    en = json.loads((soan_lai._DATA / "en" / "tarot_kb.json").read_text(encoding="utf-8"))["la"]["dai_0"]
    ban = {vi[k]: en[k] for k in ("y_xuoi", "y_nguoc", "hinh_anh", "cau_tu_soi") if isinstance(vi.get(k), str) and isinstance(en.get(k), str)}
    kq = soan_lai.soan_lai("ds.tarot.tung_la.ba_la.hien_tai.dai_0.x", "en", goi=_ai_gia(ban))
    assert kq["tep"] == "en/tarot_kb.json" and kq["cum"] == ["la.dai_0"] and kq["so"]["tong"] >= 4
    muc = {m["duong"]: m for m in kq["muc"]}
    assert "la.dai_0.ten" not in muc                                    # tên lá giữ nguyên, không soạn lại
    m = muc["la.dai_0.y_xuoi"]
    assert m["vi"] == vi["y_xuoi"] and m["hien_tai"] == en["y_xuoi"] and m["moi"] == en["y_xuoi"] and m["loi"] == []
    # Chuỗi máy không trả → moi = None + lỗi "thieu", hien_tai vẫn có để người duyệt sửa tay.
    thieu = [x for x in kq["muc"] if x["moi"] is None]
    assert thieu and all(x["loi"] and x["loi"][0]["ma"] == "thieu" for x in thieu)
    assert kq["so"]["kiem_dinh"] == "dat"


def test_soan_lai_giao_thoa_giu_bien():
    vi = json.loads((soan_lai._DATA / "giao_thoa_kb.json").read_text(encoding="utf-8"))
    en = json.loads((soan_lai._DATA / "en" / "giao_thoa_kb.json").read_text(encoding="utf-8"))
    ban = {vi["mau"]["lech"][k]: en["mau"]["lech"][k] for k in vi["mau"]["lech"]}
    ban.update({vi["mang"]["tien_bac"][k]: en["mang"]["tien_bac"][k] for k in vi["mang"]["tien_bac"]})
    kq = soan_lai.soan_lai("ds.giao_thoa.tien_bac.lech", "en", goi=_ai_gia(ban))
    assert kq["tep"] == "en/giao_thoa_kb.json" and {m["duong"] for m in kq["muc"]} >= {"mau.lech.tieu_de", "mau.lech.noi_dung", "mang.tien_bac.ten"}
    assert all(m["moi"] == m["hien_tai"] for m in kq["muc"])                 # biến {mang} {ngan}… giữ → qua kiểm


def test_soan_lai_ma_khong_ho_tro():
    kq = soan_lai.soan_lai("ds.su_nghiep.thien_co.sang.manh", "en", goi=lambda *a, **k: "{}")
    assert kq["tep"] is None and kq["muc"] == [] and "sửa tay" in kq["mo_ta"]


def test_route_can_khoa_ai(monkeypatch):
    monkeypatch.delenv("OPENROUTER_API_KEY", raising=False)
    r = client.post("/v1/quan-tri/soan-lai-lech", json={"ma": "ds.giao_thoa.tien_bac.lech", "ngon_ngu": "en"})
    assert r.status_code == 503
    r = client.post("/v1/quan-tri/soan-lai-lech", json={"ma": "x y", "ngon_ngu": "en"})
    assert r.status_code == 422
