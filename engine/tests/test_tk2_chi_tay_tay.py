# -*- coding: utf-8 -*-
"""TK-2 việc 2 — phái "Chỉ tay phương Tây" trên /chi-tay (KB `chi_tay_tay_kb.json`, CALC `chi_tay_do.nhan_tay`, route `phai`).

Khoá:
  - mọi câu trích tiếng Anh là chuỗi con (đã chuẩn hoá chữ thường + khoảng trắng) của đúng kho nguồn nó ghi; ≤ 2 câu;
    chữ sạch (không ký tự rác của lớp nhận dạng chữ);
  - lớp phương Tây KHÔNG có nhóm C: không câu nào về sống lâu / chết / bệnh; lời Việt qua bộ kiểm nói giảm SX-C + cụm "giọng AI";
  - mọi lựa chọn có lời Việt; nhóm B có "Nên chú ý" + việc cụ thể;
  - số đo: chỉ ba điều sách nói mà điểm mốc đo được; dải "vừa" không gợi câu nào;
  - `phai` mặc định "dong" → đầu ra y hệt hôm nay; nhãn nguồn công khai đúng hai tên sách, không tên nội bộ (BM-1).
"""
from __future__ import annotations

import json
import re
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.calc import chi_tay_do
from app.kb import chi_tay_kb as kb_dong
from app.kb import chi_tay_tay_kb as kb
from app.kb import sach_ghi
from app.kb import tuvi_doi_song_kb as kb_tv
from app.main import app
from tests import test_chi_tay_do as _mau

GOC = Path(__file__).resolve().parents[2]
NGUON = GOC / "engine" / "fixtures" / "nguon"
NHAN_NGUON = {"cheiro": "Cheiro, Language of the Hand (1894)",
              "benham": "William G. Benham, The Laws of Scientific Hand Reading (1900)"}
# Lớp phương Tây không nhận câu về sống lâu / chết / bệnh / phẩm hạnh (nhóm C bị loại hẳn).
CAM_EN = re.compile(r"\b(death|dead|die[sd]?|dying|long life|short life|length of life|illness(es)?|disease[sd]?|sickly|sick|"
                    r"health|insan\w*|suicid\w*|murder\w*|fatal\w*|apoplexy|fever|liver|barren\w*|steril\w*|criminal|vice|"
                    r"immoral\w*|sensual\w*)\b", re.I)
CAM_VI = ("sống lâu", "sống thọ", "chết", "qua đời", "bệnh", "ốm", "yểu", "thọ", "tuổi thọ", "mắc", "tai nạn", "định mệnh",
          "số phận an bài", "vận hạn", "xui")


def _chuan(t: str) -> str:
    return re.sub(r"\s+", " ", t).strip().lower()


@pytest.fixture(scope="module")
def van() -> dict[str, str]:
    ra = {}
    for ma, n in kb.nguon().items():
        d = json.loads((NGUON / f"{n['tep']}.json").read_text(encoding="utf-8"))
        ra[ma] = _chuan(" ".join(p for c in d["chuong"] for p in c["doan"]))
    return ra


@pytest.fixture(scope="module")
def client():
    return TestClient(app)


def test_nguon_cong_khai_dung_hai_ten_sach():
    assert {k: v["hien_thi"] for k, v in kb.nguon().items()} == NHAN_NGUON


def test_moi_cau_trich_la_chuoi_con_kho_nguon(van):
    muc = kb.moi_muc()
    co_trich = [m for m in muc if m.get("trich")]
    assert len(co_trich) >= 40
    for m in co_trich:
        assert m["nguon"] in van, m["ma"]
        assert _chuan(m["trich"]) in van[m["nguon"]], (m["ma"], m["trich"])


def test_cau_trich_ngan_va_chu_sach():
    for m in kb.moi_muc():
        t = m.get("trich")
        if not t:
            continue
        assert 20 <= len(t) <= 260, (m["ma"], len(t))
        assert len(re.findall(r"[.;!?](?=\s)", t)) <= 1, m["ma"]          # ≤ 2 câu
        assert re.fullmatch(r"[A-Za-z ,.;:'’\-—]+", t), (m["ma"], t)      # không ký tự rác, không số hình, không ngoặc
        assert not re.search(r"(?<!['’])\b[b-hj-z]\b", t, flags=re.I), (m["ma"], t)  # không chữ cái lẻ (rác nhận dạng)
        assert t[0].isalpha() and "  " not in t, m["ma"]


def test_khong_co_nhom_c_khong_noi_song_chet_benh():
    for m in kb.moi_muc():
        assert m.get("nhom") in (None, "A", "B"), m["ma"]
        if m.get("trich"):
            assert not CAM_EN.search(m["trich"]), (m["ma"], CAM_EN.search(m["trich"]).group())
        for k in ("y", "ham_y", "viec", "ten", "mo_ta", "vi_tri"):
            v = (m.get(k) or "").lower()
            assert not [c for c in CAM_VI if re.search(rf"(?<![\wà-ỹ]){c}(?![\wà-ỹ])", v)], (m["ma"], k, v)


def test_loi_viet_qua_bo_kiem_noi_giam_va_giong_ai():
    cum = kb_tv.cum_cam()
    for s in kb.moi_chuoi_viet():
        assert sach_ghi.kiem_loi(s) == [], (s, sach_ghi.kiem_loi(s))
        assert not kb_tv.tim_cum_cam(s, cum), (kb_tv.tim_cum_cam(s, cum), s)
        assert not re.search(r"internet archive|ocr|archive\.org|nhận dạng", s, flags=re.I), s   # BM-1


def test_moi_lua_chon_co_loi_viet_nhom_b_co_viec():
    ma = [m["ma"] for m in kb.moi_muc()]
    assert len(ma) == len(set(ma))
    for m in kb.moi_muc():
        assert re.fullmatch(r"[a-z0-9_]{2,30}", m["ma"]), m["ma"]
        assert (m.get("y") or "").strip(), m["ma"]
        if m.get("khong_doc"):
            assert not m.get("trich") and not m.get("nhom"), m["ma"]
            continue
        assert m["nhom"] in ("A", "B") and m.get("trich") and m.get("nguon"), m["ma"]
        if m["nhom"] == "B":
            assert m["ham_y"].startswith("Nên chú ý") and m["viec"].strip(), m["ma"]


def test_du_bay_dang_tay_bay_go_va_cac_duong():
    tv = kb.thu_vien()
    assert [x["ma"] for x in tv["dang_tay"]["lua_chon"]] == ["so_khai", "vuong", "be", "triet", "non", "thon", "pha"]
    assert all(x["mo_ta"] for x in tv["dang_tay"]["lua_chon"])
    assert {g["ma"] for g in tv["go"]["muc"]} == {"jupiter", "saturn", "apollo", "mercury", "mars", "luna", "venus"}
    assert all(g["vi_tri"] for g in tv["go"]["muc"])
    assert [x["ma"] for x in tv["go"]["lua_chon"]] == ["day", "phang", "trung"]
    duong = {d["ma"]: d for d in tv["duong"]}
    assert {"sinh", "tri", "tam", "van_menh", "thai_duong", "hon_nhan"} <= set(duong)
    for d in tv["duong"]:
        assert d["vi_tri"]
        for c in d["cau"]:
            assert 2 <= len(c["lua_chon"]) <= 4, c["ma"]
    # Đường "sức khoẻ" (Hepatica) sách chỉ đọc về bệnh → không có mục chọn, nêu rõ là không đọc.
    assert "suc_khoe" not in duong and any("sức khoẻ" in x["ten"].lower() for x in tv["khong_dua_vao"])
    # Đường Sinh: nói rõ độ dài KHÔNG phải chuyện sống bao lâu, kèm lời chính Benham.
    assert "không" in tv["luu_y_do_dai"]["y"] and tv["luu_y_do_dai"]["trich"]


def test_doc_ghep_dung_muc_va_tu_choi_ma_la():
    kq = kb.doc("vuong", {"jupiter": "day", "luna": "trung", "saturn": "phang"}, {"tri_huong": "thang", "tam_dang": "moc_xich"})
    loai = [(m["loai"], m["ma"]) for m in kq["muc"]]
    assert ("dang_tay", "vuong") in loai and ("go", "jupiter_day") in loai and ("go", "luna_trung") in loai
    assert ("duong", "tri_huong_thang") in loai and ("duong", "tam_dang_moc_xich") in loai
    assert [m["nhom"] for m in kq["muc"] if m.get("nhom")] == sorted(m["nhom"] for m in kq["muc"] if m.get("nhom"))  # A trước B
    for m in kq["muc"]:
        assert m["loi"] and m["ten"]
        if m.get("trich"):
            assert m["nguon_hien_thi"] in NHAN_NGUON.values()
        assert "nguon" not in m and "tep" not in json.dumps(m)
    assert kq["cau_ket"]
    assert kb.hop_le("khong_co", None, None) and kb.hop_le(None, {"jupiter": "cao"}, None) and kb.hop_le(None, None, {"x": "y"})
    assert kb.hop_le("vuong", {"jupiter": "day"}, {"tri_huong": "thang"}) == []


# ---- CALC: số đo → nhãn sách phương Tây ---------------------------------------------------------------------------
def _so_do(giua: float, rong: float, tro: float, ap_ut: float) -> dict:
    return {"dai_long": 1.0, "rong_long": rong, "ngon": {"cai": 0.6, "tro": tro, "giua": giua, "ap_ut": ap_ut, "ut": 0.6},
            "tro_ap_ut": round(tro / ap_ut, 3)}


def test_nhan_tay_ba_truc_co_dai_vua():
    ng = kb.do_tay_cfg()["nguong"]
    assert kb.do_tay_cfg()["can_doi_chieu"] is True
    assert ng["ngon_ngan"] < ng["ngon_dai"] and ng["long_dai"] < ng["long_rong"] and ng["ap_ut_dai"] < ng["tro_dai"]
    giua_vua = (ng["ngon_ngan"] + ng["ngon_dai"]) / 2
    rong_vua = (ng["long_dai"] + ng["long_rong"]) / 2
    r = chi_tay_do.nhan_tay(_so_do(giua_vua, rong_vua, 0.92, 1.0))
    assert [n["ma"] for n in r["nhan"]] == ["ngon_vua", "long_vua", "tro_ap_ut_vua"] and all(n["vua"] for n in r["nhan"])
    assert r["to_hop"] is None
    r = chi_tay_do.nhan_tay(_so_do(ng["ngon_dai"] + 0.05, ng["long_rong"] + 0.05, 0.99, 1.0))
    assert [n["ma"] for n in r["nhan"]] == ["ngon_dai", "long_rong", "tro_dai"] and not any(n["vua"] for n in r["nhan"])
    assert r["to_hop"] == "long_rong.ngon_dai"
    r = chi_tay_do.nhan_tay(_so_do(ng["ngon_ngan"] - 0.05, ng["long_dai"] - 0.05, 0.8, 1.0))
    assert [n["ma"] for n in r["nhan"]] == ["ngon_ngan", "long_dai", "ap_ut_dai"]
    assert r["to_hop"] == "long_dai.ngon_ngan"
    # đúng biên = đã ra khỏi dải vừa (cùng quy ước với `do_tay`)
    assert chi_tay_do.nhan_tay(_so_do(ng["ngon_dai"], rong_vua, 0.92, 1.0))["nhan"][0]["ma"] == "ngon_dai"


def test_nhan_tay_tat_dinh_va_khong_sua_dau_vao():
    sd = _so_do(1.2, 0.8, 0.9, 1.0)
    truoc = json.dumps(sd, sort_keys=True)
    assert chi_tay_do.nhan_tay(sd) == chi_tay_do.nhan_tay(sd)
    assert json.dumps(sd, sort_keys=True) == truoc
    with pytest.raises((KeyError, TypeError, ValueError)):
        chi_tay_do.nhan_tay({"ngon": {}})


def test_nhan_vua_khong_goi_cau_nao_nhan_lech_co_cau_sach():
    kq = kb.ket_qua_do_tay({"hop_le": True, "loi": None, "so_do": _so_do(1.0, 0.7, 0.92, 1.0), "nhan": [], "cung": []}, "phai")
    assert kq["hop_le"] and kq["muc"] == [] and all(n["vua"] for n in kq["nhan"]) and kq["to_hop"] is None
    kq = kb.ket_qua_do_tay({"hop_le": True, "loi": None, "so_do": _so_do(1.2, 0.85, 0.8, 1.0), "nhan": [], "cung": []}, "phai")
    ma = [m["ma"] for m in kq["muc"]]
    assert "ngon_dai" in ma and "ap_ut_dai" in ma
    assert kq["to_hop"]["ten"] and "vuong" in kq["goi_y_dang"]
    assert "nguong" not in json.dumps(kq)
    # không gọi tên bốn nguyên tố (đất / khí / lửa / nước) — hệ ấy không có trong hai sách này
    assert not re.search(r"tay (đất|khí|lửa|nước)|nguyên tố", json.dumps(kq, ensure_ascii=False).lower())


# ---- Route ----------------------------------------------------------------------------------------------------------
def _tay_gia() -> list[list[float]]:
    """Lòng bàn tay PHẢI nhìn thẳng — mẫu tổng hợp của test CT-2."""
    return _mau._anh(_mau._tay())


def test_mac_dinh_phai_dong_khong_doi(client):
    a = client.get("/v1/chi-tay").json()
    b = client.get("/v1/chi-tay", params={"phai": "dong"}).json()
    assert a == b and "van" in a and "dang_tay" not in a
    body = {"van": [kb_dong.ds_van()[0]["ma"]]}
    assert client.post("/v1/chi-tay/doc", json=body).json() == client.post("/v1/chi-tay/doc", json={**body, "phai": "dong"}).json()
    d = {"dong_y": True, "tay": "phai", "ty_le": 0.75, "diem": _tay_gia()}
    x, y = client.post("/v1/chi-tay/do-tay", json=d), client.post("/v1/chi-tay/do-tay", json={**d, "phai": "dong"})
    assert x.status_code == 200 and x.json() == y.json() and "cung" in x.json()


def test_route_phai_tay(client):
    tv = client.get("/v1/chi-tay", params={"phai": "tay"})
    assert tv.status_code == 200
    j = tv.json()
    assert j["phai"] == "tay" and len(j["dang_tay"]["lua_chon"]) == 7 and len(j["go"]["muc"]) == 7 and "van" not in j
    chu = json.dumps(j, ensure_ascii=False)
    assert not re.search(r"internet archive|ocr|archive\.org|chi_tay_cheiro|chi_tay_benham|nguong", chu, flags=re.I)
    r = client.post("/v1/chi-tay/doc", json={"phai": "tay", "dang_tay": "non", "go": {"venus": "day"}, "duong": {"sinh_cong": "rong"}})
    assert r.status_code == 200 and {m["loai"] for m in r.json()["muc"]} == {"dang_tay", "go", "duong"}
    assert client.post("/v1/chi-tay/doc", json={"phai": "tay"}).status_code == 422
    assert client.post("/v1/chi-tay/doc", json={"phai": "tay", "dang_tay": "la"}).status_code == 422
    assert client.post("/v1/chi-tay/doc", json={"phai": "tay", "van": ["x-y"], "dang_tay": "non"}).status_code == 422
    assert client.post("/v1/chi-tay/doc", json={"dang_tay": "non"}).status_code == 422          # phái Đông không có dáng tay
    assert client.post("/v1/chi-tay/doc", json={"phai": "nam"}).status_code == 422
    d = {"dong_y": True, "tay": "phai", "ty_le": 0.75, "diem": _tay_gia(), "phai": "tay"}
    k = client.post("/v1/chi-tay/do-tay", json=d)
    assert k.status_code == 200
    kj = k.json()
    assert kj["hop_le"] and kj["phai"] == "tay" and len(kj["nhan"]) == 3 and "cung" not in kj and "sach_ghi" not in kj
    xau = client.post("/v1/chi-tay/do-tay", json={**d, "tay": "trai"}).json()
    assert xau["hop_le"] is False and xau["loi"] == "mu_ban_tay" and xau["loi_nhac"]
    assert client.post("/v1/chi-tay/do-tay", json={**d, "dong_y": False}).status_code == 422
