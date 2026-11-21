# -*- coding: utf-8 -*-
"""Kho nguồn + công cụ Dương Trạch Tam Yếu (Triệu Cửu Phong, đời Thanh) — rà soát 2026-11-21.

- fixtures/nguon/duong_trach_tam_yeu.json: chỉ khối 【原文】 phồn thể, không dấu câu hiện đại, không số trang / quyển
  "dẫn đọc" của bản in hiện đại, chặn các lỗi máy nhận dạng chữ đã biết (良/艮, 醜/丑, 髮/發, 佔/占, 天亡/夭亡).
- phongthuy_tam_yeu.json["nguyen_van_doi_chieu"]: câu `han` là chuỗi con kho nguồn.
- /v1/phongthuy/tam-yeu/so-do: một bộ tính với calc.phongthuy.cua_chu_bep (đủ ba cặp), mức thang chung, nhóm C SX-C
  chỉ khi người đọc đủ 18 tuổi, luôn có câu tham khảo; bản tiếng Anh không lộ chữ Việt.
"""
from __future__ import annotations

import json
import re
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.calc import phongthuy as pt
from app.main import app

GOC = Path(__file__).resolve().parents[1]
NGUON = json.loads((GOC / "fixtures" / "nguon" / "duong_trach_tam_yeu.json").read_text("utf-8"))
TAM_YEU = json.loads((GOC / "app" / "kb" / "data" / "phongthuy_tam_yeu.json").read_text("utf-8"))

RE_DAU_CAU = re.compile(r"[。，、；：！？「」『』（）《》【】“”‘’—…·,.!?;:()\[\]]")
FLAT_BY_SO = {t["so"]: t["van"].replace("\n", "") for t in NGUON["thien"]}
TOAN_VAN = "".join(FLAT_BY_SO.values())
client = TestClient(app)


def test_fixture_duong_trach_tam_yeu_sach_se_khong_dau_cau():
    assert NGUON["source_id"] == "duong_trach_tam_yeu"
    assert NGUON["can_doi_chieu"] is True
    assert NGUON["chuyen_phon_the_opencc"] is True
    assert len(NGUON["thien"]) >= 200
    quyens = {t["quyen"] for t in NGUON["thien"] if t["quyen"]}
    assert {"卷一", "卷二", "卷三", "卷四"} <= quyens
    bad_ocr = ("武麴", "文麴", "武典星", "夫日", "斷日", "故日", "犯坎良", "配良門", "良竈", "某官某字", "兇")
    for t in NGUON["thien"]:
        van = t["van"]
        assert not RE_DAU_CAU.search(van), f"Thiên {t['so']} còn dấu câu hiện đại"
        assert "白話提要" not in van and "白話圖解" not in van, f"Thiên {t['so']} lọt bạch thoại"
        assert "白话" not in t["ten"] and "对断" not in t["ten"], f"Tiêu đề thiên {t['so']} lọt chữ hiện đại"
        for b in bad_ocr:
            assert b not in van, f"Thiên {t['so']} còn lỗi OCR/OpenCC: {b}"
        assert len(van.replace("\n", "")) >= 12


def test_tam_yeu_nguyen_van_doi_chieu_khop_kho_nguon():
    muc = TAM_YEU["nguyen_van_doi_chieu"]
    assert len(muc) == 10
    for m in muc:
        so = m["nguon_thien"]
        assert so in FLAT_BY_SO, m["ma"]
        assert m["han"] in FLAT_BY_SO[so], (m["ma"], m["han"])
        assert not RE_DAU_CAU.search(m["han"]), m["ma"]


def test_tam_yeu_nguyen_van_doi_chieu_khop_kho_nguon():
    muc = TAM_YEU["nguyen_van_doi_chieu"]
    assert len(muc) == 10
    for m in muc:
        so = m["nguon_thien"]
        assert so in FLAT_BY_SO, m["ma"]
        assert m["han"] in FLAT_BY_SO[so], (m["ma"], m["han"])
        assert not RE_DAU_CAU.search(m["han"]), m["ma"]


def test_fixture_khong_mang_cau_truc_ban_in_hien_dai():
    for t in NGUON["thien"]:
        assert "trang_pdf" not in t and "trang_sach" not in t, t["so"]
        assert "頁" not in t["ten"] and t["quyen"] != "導讀卷", t["so"]
    assert "/Users/" not in (GOC / "scripts" / "nap_nguon_duong_trach_tam_yeu.py").read_text("utf-8")


@pytest.mark.parametrize("sai", [
    r"(?<=[坤兌震乾坎離巽])良", r"(?<![賢淳循忠馬才不])良(?=[土命主坤])", "醜", "已酉", "亥子丑", "天亡", "佔", "髮長", "長髮",
    "戊已", "己已",
])
def test_khong_con_loi_nhan_dang_chu(sai):
    if sai == "亥子丑":
        assert "亥子醜" not in TOAN_VAN
        return
    if sai == "醜":   # 醜 đúng nghĩa "xấu" (醜聲, 可醜) giữ; chỉ cấm khi đứng trong bộ tam hợp địa chi
        assert not re.search(r"[巳酉亥子]醜", TOAN_VAN)
        return
    assert not re.search(sai, TOAN_VAN), re.findall(r".{0,4}" + sai + r".{0,4}", TOAN_VAN)[:5]


# ───────── API /v1/phongthuy/tam-yeu/* ─────────
_CAM_KHOA = {"chart_id", "trang_pdf", "trang_sach", "nguon_thien", "avg_conf", "can_doi_chieu", "luoi_3x3", "mermaid"}
_CAM_CHUOI = ("fengshui-yangzhai-kb", ".sqlite", "rapidocr", "opencc", "白話", "/users/")


def _sach(obj, path="$"):
    if isinstance(obj, dict):
        for k, v in obj.items():
            assert k not in _CAM_KHOA, f"lộ khoá nội bộ {path}.{k}"
            _sach(v, f"{path}.{k}")
    elif isinstance(obj, list):
        for i, x in enumerate(obj):
            _sach(x, f"{path}[{i}]")
    elif isinstance(obj, str):
        for bad in _CAM_CHUOI:
            assert bad not in obj.lower(), f"lộ {bad!r} tại {path}"


def test_route_cu_da_go():
    assert client.get("/v1/phongthuy/tam-yeu/do-hinh").status_code == 404
    assert client.get("/v1/phongthuy/tam-yeu/bieu-do").status_code == 404


@pytest.mark.parametrize("cua", list(pt.QUAI))
@pytest.mark.parametrize("chu", list(pt.QUAI))
def test_so_do_mot_bo_tinh_du_ba_cap(cua, chu):
    bep = "Ly"
    d = client.get("/v1/phongthuy/tam-yeu/so-do", params={"cua": cua, "chu": chu, "bep": bep}).json()
    goc = pt.cua_chu_bep(pt.QUAI[cua][1], pt.QUAI[chu][1], pt.QUAI[bep][1])
    assert [c["du_nien"] for c in d["cap"]] == [c["du_nien"] for c in goc["cap"]]
    assert [c["cap"] for c in d["cap"]] == ["cua_chu", "cua_bep", "chu_bep"]
    assert all(c["muc"] in ("thuan", "can_bang", "can_chu_dong") for c in d["cap"])
    assert d["ket_luan"]["muc"] in ("thuan", "can_bang", "can_chu_dong")
    assert d["cung_nhom"] == goc["cung_nhom"]
    assert len(d["bep_goi_y"]) == 8 and d["luu_y_tham_khao"]
    assert any(v["chi_phi"] == "0" for v in d["viec"])
    _sach(d)


def test_bep_goi_y_hop_la_cat_voi_ca_cua_va_chu():
    d = client.get("/v1/phongthuy/tam-yeu/so-do", params={"cua": "Càn", "chu": "Đoài"}).json()
    for g in d["bep_goi_y"]:
        cat = (g["du_nien_cua"] in pt.CAT) + (g["du_nien_chu"] in pt.CAT)
        assert g["loai"] == {2: "hop", 1: "tam", 0: "tranh"}[cat]


def _nhom_c(d):
    return [m for n in (d.get("sach_ghi") or {}).get("nhom", []) for m in n["muc"] if m["nhom"] == "C"]


def test_nhom_c_chi_hien_khi_du_18_tuoi_va_theo_khuon_sx_c():
    q = {"cua": "Khảm", "chu": "Ly", "bep": "Khôn"}
    khach = client.get("/v1/phongthuy/tam-yeu/so-do", params=q).json()
    assert not _nhom_c(khach)
    if khach.get("nhom_c_an"):
        assert khach["nhom_c_an"]["so"] > 0
    nho = client.get("/v1/phongthuy/tam-yeu/so-do", params={**q, "nam_sinh": 2015}).json()
    assert not _nhom_c(nho) and "nhom_c_an" not in nho          # dưới 18: không mời mở
    lon = client.get("/v1/phongthuy/tam-yeu/so-do", params={**q, "du_18": "true"}).json()
    lon2 = client.get("/v1/phongthuy/tam-yeu/so-do", params={**q, "nam_sinh": 1980}).json()
    assert _nhom_c(lon) == _nhom_c(lon2)
    for m in _nhom_c(lon):
        assert m["loi"].startswith("Hàm ý theo ghi chép xưa"), m
        assert m["sach"]
    if _nhom_c(lon):
        assert lon["sach_ghi"]["cau_ket"] and lon["luu_y_tham_khao"]


def test_co_it_nhat_mot_to_hop_co_nhom_c_de_kiem_cong_18():
    co = 0
    for c in pt.QUAI:
        for ch in pt.QUAI:
            d = client.get("/v1/phongthuy/tam-yeu/so-do", params={"cua": c, "chu": ch, "du_18": "true"}).json()
            co += bool(_nhom_c(d))
    assert co > 0


_VIET = re.compile(r"[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]", re.I)


def test_ban_tieng_anh_khong_lo_chu_viet():
    d = client.get("/v1/phongthuy/tam-yeu/so-do", params={"cua": "Càn", "chu": "Khảm", "bep": "Ly"},
                   headers={"x-ngon-ngu": "en"}).json()
    chu = [d["ket_luan"]["loi"], d["luu_y_tham_khao"], *d["can_cu"]] + [c["loi"] for c in d["cap"]] + \
        [c["ten"] for c in d["cap"]] + [v["lam"] for v in d["viec"]] + [g["nhan"] for g in d["bep_goi_y"]]
    for t in chu:
        assert not _VIET.search(t), t
    assert d["sach_ghi"] is None


def test_la_ban_24_son():
    from app.calc import huyen_khong as hk
    d = client.get("/v1/phongthuy/tam-yeu/la-ban-24-son").json()
    assert [x["son"] for x in d["son_24"]] == hk.SON_24
    assert d["son_24"][0]["do_tam"] == 0.0 and d["son_24"][0]["do_tu"] == 352.5 and d["son_24"][12]["do_tam"] == 180.0
    assert d["nguong"] == {"kiem_huong": 3.0, "khong_vong": 0.5, "ranh_8_huong": 1.0}
    for x in d["son_24"]:
        assert hk.son_tu_do(x["do_tam"])["son"] == x["son"]
        assert pt.do_huong(x["do_tam"])["son_huong"] == x["son"]
    _sach(d)
