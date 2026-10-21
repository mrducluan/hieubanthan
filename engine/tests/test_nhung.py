# -*- coding: utf-8 -*-
"""LG-ĐS mục 4 — vectơ nhúng tất định `bam512_v1` + kho ý định + gợi ý ý định cho hỏi đáp Tử vi.

Kiểm: tất định (kể cả khác PYTHONHASHSEED), chuẩn L2, câu sai dấu / đồng nghĩa gần hơn câu khác chủ đề, độ chính xác
láng giềng gần nhất leave-one-out trên kho Tử vi có nhãn, route /v1/nhung lọc câu + cần khoá, gợi ý ý định không vượt
bộ chặn khủng hoảng / ngoài phạm vi, danh mục ý định trong SQL 0017 khớp engine."""
from __future__ import annotations

import os
import re
import subprocess
import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app import nhung
from app.hoidap import tuvi as hoidap_tv
from app.main import app
from app.nhung_api import kho_co_nhan

client = TestClient(app)
GOC = Path(__file__).resolve().parent.parent


def test_so_chieu_va_chuan_l2():
    v = nhung.nhung("Năm nay tôi có nên nghỉ việc không?")
    assert len(v) == 512
    assert abs(sum(x * x for x in v) - 1) < 1e-4
    assert nhung.nhung("") == [0.0] * 512
    assert nhung.nhung("???") == [0.0] * 512


def test_cos_chinh_no_bang_1():
    v = nhung.nhung("Tiền bạc của tôi năm nay ra sao?")
    assert nhung.cos(v, v) == pytest.approx(1.0, abs=1e-6)


def test_tat_dinh_qua_tien_trinh_khac_hash_seed():
    cau = "Có nên chuyển công ty trong năm nay không?"
    ma = ("import json,sys; sys.path.insert(0,'.'); from app import nhung; "
          f"print(json.dumps(nhung.nhung({cau!r})))")
    ra = set()
    for seed in ("0", "1", "12345"):
        r = subprocess.run([sys.executable, "-c", ma], cwd=GOC, capture_output=True, text=True, check=True,
                           env={**os.environ, "PYTHONHASHSEED": seed})
        ra.add(r.stdout.strip())
    assert len(ra) == 1
    assert ra.pop() == __import__("json").dumps(nhung.nhung(cau))


def test_sai_dau_trung_khit():
    assert nhung.nhung("Năm nay có nên nghỉ việc không") == nhung.nhung("nam nay co nen nghi viec khong")
    assert nhung.nhung("Đổi việc") == nhung.nhung("doi viec")


def test_dong_nghia_gan_hon_khac_chu_de():
    goc = nhung.nhung("Năm nay tôi có nên nghỉ việc không?")
    gan = nhung.nhung("nam nay minh co nen bo viec ko")              # khác chữ + không dấu
    xa = nhung.nhung("Sao Thái Âm ở cung Phu Thê nghĩa là gì?")
    assert nhung.cos(goc, gan) > nhung.cos(goc, xa) + 0.2
    tien = nhung.nhung("Chuyện tiền bạc của tôi thế nào?")
    tien2 = nhung.nhung("tien bac cua minh ra sao")
    assert nhung.cos(tien, tien2) > nhung.cos(tien, goc)


def test_giu_cho_cua_bo_loc_khong_thanh_dac_trung():
    # "[năm]" (bộ lọc thay năm sinh) không được trùng âm tiết "năm".
    assert nhung.am_tiet("Sinh [năm] thì sao") == ["sinh", "thi", "sao"]


def _loo(ds: list[dict]) -> tuple[float, float, float]:
    """Độ chính xác láng giềng gần nhất (bỏ chính nó); tỉ lệ có láng giềng ≥ 0,82; độ chính xác trong nhóm đó."""
    dung = tren = dung_tren = 0
    for i, a in enumerate(ds):
        do, yd = max((sum(x * y for x, y in zip(a["vec"], b["vec"])), b["y_dinh"]) for j, b in enumerate(ds) if j != i)
        dung += yd == a["y_dinh"]
        if do >= 0.82:
            tren += 1
            dung_tren += yd == a["y_dinh"]
    n = len(ds)
    return dung / n, tren / n, (dung_tren / tren if tren else 1.0)


def test_leave_one_out_kho_tuvi(capsys):
    ds = list(kho_co_nhan("tuvi"))
    assert len(ds) >= 200
    assert {d["y_dinh"] for d in ds} == set(hoidap_tv.Y_DINH_CAU_HINH)
    acc, phu, acc_tren = _loo(ds)
    with capsys.disabled():
        print(f"\n[nhung] LOO kho Tử vi: {len(ds)} câu · đúng {acc:.1%} · có láng giềng ≥ 0,82: {phu:.1%}"
              f" · đúng trong nhóm đó {acc_tren:.1%}")
    assert acc >= 0.9
    assert acc_tren >= 0.97        # ngưỡng 0,82 của web: gợi ý sai rất hiếm
    # Kho có bản không dấu của nhiều câu (cos = 1 với bản gốc) → đo lại sau khi bỏ trùng theo âm tiết bỏ dấu.
    gon, da = [], set()
    for d in ds:
        k = " ".join(nhung.am_tiet(d["cau"]))
        if k not in da:
            da.add(k)
            gon.append(d)
    acc2, phu2, acc_tren2 = _loo(gon)
    with capsys.disabled():
        print(f"[nhung] LOO bỏ trùng không dấu: {len(gon)} câu · đúng {acc2:.1%} · ≥ 0,82: {phu2:.1%}"
              f" · đúng trong nhóm đó {acc_tren2:.1%}")
    assert acc2 >= 0.9 and acc_tren2 >= 0.97


def test_kho_chi_cau_co_nhan_va_da_loc():
    ds = kho_co_nhan("tuvi")
    assert all(re.fullmatch(r"[a-z_]+", d["y_dinh"]) for d in ds)
    assert len({d["cau"] for d in ds}) == len(ds)
    assert not any(re.search(r"(18|19|20)\d\d", d["cau"]) for d in ds)


def test_route_nhung_loc_cau_truoc_khi_nhung():
    r = client.post("/v1/nhung", json={"cau": ["Tôi sinh 12/03/1990, gọi 0912345678, có nên nghỉ việc?", "tiền bạc"]})
    assert r.status_code == 200
    b = r.json()
    assert b["mo_hinh"] == "bam512_v1" and len(b["vec"]) == 2 and len(b["vec"][0]) == 512
    assert "1990" not in b["cau_da_loc"][0] and "0912345678" not in b["cau_da_loc"][0]
    assert b["vec"][0] == nhung.nhung(b["cau_da_loc"][0])


def test_route_nhung_gioi_han():
    assert client.post("/v1/nhung", json={"cau": ["a"] * 33}).status_code == 422
    assert client.post("/v1/nhung", json={"cau": ["a" * 301]}).status_code == 422
    assert client.post("/v1/nhung", json={"cau": []}).status_code == 422
    assert client.post("/v1/nhung", json={"cau": ["x"], "them": 1}).status_code == 422


def test_route_kho_phan_trang():
    r1 = client.get("/v1/nhung/kho", params={"mo_dun": "tuvi", "trang": 1, "co": 50}).json()
    r2 = client.get("/v1/nhung/kho", params={"mo_dun": "tuvi", "trang": 2, "co": 50}).json()
    assert r1["tong"] == len(kho_co_nhan("tuvi")) and len(r1["ds"]) == 50 and r1["so_trang"] == -(-r1["tong"] // 50)
    assert not {d["ma"] for d in r1["ds"]} & {d["ma"] for d in r2["ds"]}
    assert client.get("/v1/nhung/kho", params={"mo_dun": "battu"}).status_code == 422
    assert client.get("/v1/nhung/kho", params={"co": 500}).status_code == 422


def test_route_can_khoa_engine(monkeypatch):
    monkeypatch.setenv("ENGINE_API_KEY", "khoa-bi-mat-dai-hon-16")
    assert client.post("/v1/nhung", json={"cau": ["x"]}).status_code == 401
    assert client.get("/v1/nhung/kho").status_code == 401
    ok = client.post("/v1/nhung", json={"cau": ["x"]}, headers={"x-engine-key": "khoa-bi-mat-dai-hon-16"})
    assert ok.status_code == 200


# ------------------------------------------------------------------ hỏi đáp Tử vi + y_dinh_goi_y
CAU_MO = "Mình hơi rối, chẳng biết làm gì với đời mình"      # từ khoá không nhận ra ý định, loại la_so


def test_nhan_ra_y_dinh_tu_khoa():
    kq = hoidap_tv.tra_loi("Năm nay tôi có nên nghỉ việc không?")
    assert kq["nhan_ra_y_dinh"] and not kq["co_the_goi_y"] and kq["phan_loai"]["y_dinh"] == "di_hay_o"


def test_goi_y_ap_khi_tu_khoa_khong_nhan_ra():
    goc = hoidap_tv.tra_loi(CAU_MO)
    assert not goc["nhan_ra_y_dinh"] and goc["co_the_goi_y"] and goc["phan_loai"]["y_dinh"] is None
    kq = hoidap_tv.tra_loi(CAU_MO, y_dinh_goi_y="phan_van")
    assert kq["phan_loai"]["y_dinh"] == "phan_van" and kq["y_dinh_tu_goi_y"] and not kq["nhan_ra_y_dinh"]


def test_goi_y_khong_de_tu_khoa():
    kq = hoidap_tv.tra_loi("Năm nay tôi có nên nghỉ việc không?", y_dinh_goi_y="tai_van")
    assert kq["phan_loai"]["y_dinh"] == "di_hay_o" and not kq["y_dinh_tu_goi_y"]


def test_goi_y_ma_la_bi_bo_qua():
    kq = hoidap_tv.tra_loi(CAU_MO, y_dinh_goi_y="xo_so")
    assert kq["phan_loai"]["y_dinh"] is None and not kq["y_dinh_tu_goi_y"]


def test_goi_y_khong_ap_cho_cau_ky_thuat():
    kq = hoidap_tv.tra_loi("Hoá Kỵ là gì?", y_dinh_goi_y="tai_van")
    assert kq["phan_loai"]["y_dinh"] is None and not kq["co_the_goi_y"]


@pytest.mark.parametrize("cau", ["Lá số tôi xấu quá, tôi không muốn sống nữa.", "Lá số tôi năm nào chết?",
                                 "Tôi có bị ung thư không theo cung Tật Ách?", "Xem tử vi để chọn số lô."])
@pytest.mark.parametrize("yd", ["phan_van", "tai_van", "hieu_ban_than"])
def test_goi_y_khong_vuot_bo_chan(cau, yd):
    goc = hoidap_tv.tra_loi(cau)
    kq = hoidap_tv.tra_loi(cau, y_dinh_goi_y=yd)
    assert kq["phan_loai"]["xu_ly"] in ("an_toan", "tu_choi_nhe")
    assert kq["phan_loai"]["xu_ly"] == goc["phan_loai"]["xu_ly"] and kq["cau_tra_loi"] == goc["cau_tra_loi"]
    assert kq["phan_loai"]["y_dinh"] is None and not kq["co_the_goi_y"] and not kq["y_dinh_tu_goi_y"]


def test_route_hoi_nhan_y_dinh_goi_y():
    r = client.post("/v1/tuvi/hoi", json={"cau_hoi": CAU_MO, "y_dinh_goi_y": "phan_van"})
    assert r.status_code == 200 and r.json()["phan_loai"]["y_dinh"] == "phan_van"
    r = client.post("/v1/tuvi/hoi", json={"cau_hoi": "Lá số tôi xấu quá, tôi không muốn sống nữa.", "y_dinh_goi_y": "phan_van"})
    assert r.json()["phan_loai"]["xu_ly"] == "an_toan"
    assert client.post("/v1/tuvi/hoi", json={"cau_hoi": CAU_MO, "y_dinh_goi_y": "Phan Van!"}).status_code == 422


def test_danh_muc_y_dinh_sql_khop_engine():
    sql = (GOC.parent / "supabase" / "migrations" / "0017_tuvi_hoc.sql").read_text(encoding="utf-8")
    khoi = re.search(r"function y_dinh_hop_le.*?array\[(.*?)\]", sql, re.S).group(1)
    assert set(re.findall(r"'([a-z_]+)'", khoi)) == set(hoidap_tv.Y_DINH_CAU_HINH)


def test_cau_khong_y_dinh_it_khi_vuot_nguong(capsys):
    """Câu Tử vi KHÔNG có nhãn ý định (sao × cung, kỹ thuật…) hiếm khi có láng giềng ≥ 0,82 trong kho ý định."""
    import json
    from app import nhat_ky
    ds = kho_co_nhan("tuvi")
    khac = [json.loads(d)["cau_hoi"] for d in (GOC / "fixtures/cau_hoi/huyenhoc_cau_hoi.jsonl").open(encoding="utf-8")
            if '"mo_dun": "tuvi"' in d and '"chu_de": "yd_' not in d]
    vuot = 0
    for c in khac:
        v = nhung.nhung(nhat_ky.loc_cau_hoi_huyenhoc(c))
        vuot += max(sum(x * y for x, y in zip(v, d["vec"])) for d in ds) >= 0.82
    with capsys.disabled():
        print(f"\n[nhung] câu không ý định vượt 0,82: {vuot}/{len(khac)}")
    assert vuot / len(khac) <= 0.02


def test_loc_them_ten_lien_ket():
    """QC hồi quy: bộ lọc nhật ký để lọt "tôi tên Lan", "Mình là Hùng", liên kết mạng xã hội — câu vào kho vectơ
    (`cau_hoi_vec`, mục (e) CLAUDE.md: bỏ tên, số liên lạc) phải sạch."""
    from app import nhung as nh
    assert nh.loc_them("Tôi tên Lan, năm nay đổi việc được không?") == "Tôi tên [tên], năm nay đổi việc được không?"
    assert nh.loc_them("Mình là Hùng, 34 tuổi, có nên cưới?").startswith("Mình là [tên],")
    assert nh.loc_them("Chồng tôi tên Minh Anh có hợp không") == "Chồng tôi tên [tên] có hợp không"
    assert nh.loc_them("xem fb.com/abc hoặc @lan_99") == "xem [liên kết] hoặc [liên kết]"
    assert nh.loc_them("Tôi là Thiên Cơ ở Mệnh à?") == "Tôi là Thiên Cơ ở Mệnh à?"     # tên sao không phải tên người
    assert nh.loc_them("Năm nay tôi có nên đổi việc") == "Năm nay tôi có nên đổi việc"


def test_api_nhung_loc_ten():
    from fastapi.testclient import TestClient
    from app.main import app
    r = TestClient(app).post("/v1/nhung", json={"cau": ["Tôi tên Lan sinh 12/3/1990, sđt 0912345678, đổi việc?"]})
    assert r.status_code == 200
    cau = r.json()["cau_da_loc"][0]
    assert "Lan" not in cau and "0912345678" not in cau and "1990" not in cau
