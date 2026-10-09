# -*- coding: utf-8 -*-
"""EEAT-1 — chủ biên, tác giả, thẩm định cho trang kiến thức (chủ dự án yêu cầu 2026-10-09).

Nguyên tắc minh bạch: tên chuyên gia chỉ đứng ở vai trò ĐÚNG với việc người đó đã làm.
- `chu_bien`: người chịu trách nhiệm biên tập toàn site — mọi trang.
- `tac_gia`: chỉ trang có nội dung do chính người đó viết (ý nghĩa số — chủ dự án tự viết).
- `tham_dinh`: chỉ trang người đó ĐÃ đọc và duyệt (ghi trong tham_dinh.json) → trang_thai "da_duyet".
Trang chưa thẩm định giữ `bien_soan = "ai_ho_tro"` và trang_thai "nhap_ai".
"""
from __future__ import annotations

import json
import sys

import pytest
from fastapi.testclient import TestClient

from app.kb import tham_dinh as td
from app.kb import trang
from app.main import app

client = TestClient(app)


@pytest.fixture
def so_dang_ky(monkeypatch):
    """Sổ thẩm định giả trong bộ nhớ (không đụng file thật)."""
    so = {"chuyen_gia": ["duc-luan"], "trang": {}}
    monkeypatch.setattr(td, "_doc_so", lambda: so)
    return so


def test_moi_trang_co_chu_bien_va_cach_bien_soan():
    for t in trang.danh_sach():
        assert t["chu_bien"] == "duc-luan"
        assert t["bien_soan"] in ("chuyen_gia", "ai_ho_tro")


def test_trang_so_do_chu_du_an_viet_co_tac_gia():
    t = trang.lay("so", "so-7")
    assert t["tac_gia"] == "duc-luan" and t["bien_soan"] == "chuyen_gia" and t["trang_thai"] == "da_duyet"


def test_trang_nhap_ai_khong_gan_ten_tac_gia(so_dang_ky):
    t = trang.lay("que", "que-1-can")
    assert t["tac_gia"] is None and t["tham_dinh"] is None
    assert t["bien_soan"] == "ai_ho_tro" and t["trang_thai"] == "nhap_ai"


def test_da_tham_dinh_thi_doi_trang_thai(so_dang_ky):
    so_dang_ky["trang"]["que/que-1-can"] = {"nguoi": "duc-luan", "ngay": "2026-10-10"}
    t = trang.lay("que", "que-1-can")
    assert t["tham_dinh"] == {"nguoi": "duc-luan", "ngay": "2026-10-10"}
    assert t["trang_thai"] == "da_duyet"
    assert t["tac_gia"] is None            # thẩm định ≠ viết: vẫn ghi rõ biên soạn có AI hỗ trợ
    assert t["bien_soan"] == "ai_ho_tro"
    assert t["cap_nhat"] == "2026-10-10"   # ngày thẩm định mới hơn → ngày cập nhật trang
    muc = next(x for x in trang.danh_sach() if x["slug"] == "que-1-can")
    assert muc["trang_thai"] == "da_duyet" and muc["tham_dinh"]["nguoi"] == "duc-luan"


def test_so_that_hop_le():
    """File thật: chuyên gia đã khai báo, khoá trỏ đúng trang có thật, ngày ISO."""
    so = td._doc_so()
    co = {(t["loai"], t["slug"]) for t in trang.danh_sach()}
    for k, v in so["trang"].items():
        loai, slug = k.split("/", 1)
        assert (loai, slug) in co, k
        assert v["nguoi"] in so["chuyen_gia"], k
        assert len(v["ngay"]) == 10 and v["ngay"][4] == "-", k


def test_danh_dau_va_bo(so_dang_ky):
    td.danh_dau(so_dang_ky, "sao", "sao-tu-vi", "duc-luan", "2026-10-11")
    assert so_dang_ky["trang"]["sao/sao-tu-vi"]["nguoi"] == "duc-luan"
    with pytest.raises(ValueError):
        td.danh_dau(so_dang_ky, "sao", "khong-co", "duc-luan", "2026-10-11")
    with pytest.raises(ValueError):
        td.danh_dau(so_dang_ky, "sao", "sao-tu-vi", "nguoi-la", "2026-10-11")
    td.bo(so_dang_ky, "sao", "sao-tu-vi")
    assert "sao/sao-tu-vi" not in so_dang_ky["trang"]


def test_hang_doi_uu_tien_trang_tru_cot(so_dang_ky):
    hd = td.hang_doi()
    assert hd and all(x["trang_thai"] != "da_duyet" for x in hd)
    # Trang trụ cột (sao, cung, quẻ) đứng trước cụm trang dài (sao × cung, mệnh theo năm).
    thu_tu = [x["loai"] for x in hd]
    assert thu_tu.index("sao") < thu_tu.index("sao_cung")
    assert thu_tu.index("cung") < thu_tu.index("menh_nam")


def test_api_chuyen_gia():
    r = client.get("/v1/kb/chuyen-gia/duc-luan")
    assert r.status_code == 200
    d = r.json()
    assert d["slug"] == "duc-luan"
    assert d["so_trang"]["tac_gia"] == 12
    assert d["so_trang"]["chu_bien"] == len(trang.danh_sach())
    so_that = sum(1 for v in td._doc_so()["trang"].values() if v["nguoi"] == "duc-luan")
    assert d["so_trang"]["tham_dinh"] == so_that
    assert len(d["tham_dinh_gan_day"]) == min(so_that, 12)
    assert d["so_trang"]["cho_tham_dinh"] == d["so_trang"]["chu_bien"] - d["so_trang"]["tac_gia"] - so_that
    assert client.get("/v1/kb/chuyen-gia/khong-co").status_code == 404


def test_file_tham_dinh_dinh_dang_chuan():
    p = td._FILE
    raw = p.read_text("utf-8")
    assert raw.endswith("\n")
    assert json.loads(raw)["chuyen_gia"] == ["duc-luan"]


# --- GN-1: "Góc nhìn chuyên gia" — lời của chính chuyên gia, chỉ trên trang người đó đã thẩm định ---
GOC_NHIN = ("Người có quẻ này hay hỏi tôi có nên bỏ cuộc không. Tôi thường khuyên giữ việc chính, "
            "nói ít làm nhiều, vì lời quẻ vẫn mở đường hanh thông cho người giữ được chính đạo.")


def test_goc_nhin_gan_vao_trang_da_tham_dinh(so_dang_ky):
    td.danh_dau(so_dang_ky, "que", "que-47-khon", "duc-luan", "2026-10-12", goc_nhin=GOC_NHIN)
    t = trang.lay("que", "que-47-khon")
    assert t["goc_nhin"] == {"noi_dung": GOC_NHIN, "nguoi": "duc-luan", "ngay": "2026-10-12"}
    assert t["trang_thai"] == "da_duyet"
    assert trang.lay("que", "que-1-can")["goc_nhin"] is None


def test_goc_nhin_tren_trang_tac_gia(so_dang_ky):
    td.danh_dau(so_dang_ky, "so", "so-7", "duc-luan", "2026-10-12", goc_nhin=GOC_NHIN)
    t = trang.lay("so", "so-7")
    assert t["tac_gia"] == "duc-luan" and t["goc_nhin"]["nguoi"] == "duc-luan"


@pytest.mark.parametrize("cau", [
    "Ngắn quá.",                                                     # dưới độ dài tối thiểu
    "Người có sao này bạn sẽ gặp may trong năm tới, cứ yên tâm mà làm, mọi việc đều thuận lợi cả.",
    "Đây là định mệnh, ai có quẻ này cũng phải chịu như vậy, không có cách nào khác để thay đổi được.",
    "Muốn hoá giải thì liên hệ tôi qua số 0912345678 để mua vật phẩm phong thuỷ phù hợp với tuổi của mình.",
    "Xem thêm tại https://example.com để biết chi tiết cách luận lá số theo trường phái của tôi nhé.",
    "x" * 801,                                                       # quá dài
])
def test_goc_nhin_vi_pham_bi_chan(so_dang_ky, cau):
    with pytest.raises(ValueError):
        td.danh_dau(so_dang_ky, "que", "que-47-khon", "duc-luan", "2026-10-12", goc_nhin=cau)
    assert "que/que-47-khon" not in so_dang_ky["trang"]


def test_goc_nhin_qua_api(so_dang_ky):
    td.danh_dau(so_dang_ky, "que", "que-47-khon", "duc-luan", "2026-10-12", goc_nhin=GOC_NHIN)
    d = client.get("/v1/kb/trang/que/que-47-khon").json()
    assert d["goc_nhin"]["noi_dung"] == GOC_NHIN
    assert client.get("/v1/kb/trang/que/que-1-can").json()["goc_nhin"] is None


def test_ghi_chu_noi_bo_khong_lo_ra_api(so_dang_ky):
    td.danh_dau(so_dang_ky, "que", "que-47-khon", "duc-luan", "2026-10-12", ghi_chu="sửa câu 3 mục Lời khuyên")
    assert "sửa câu 3" not in client.get("/v1/kb/trang/que/que-47-khon").text


# --- GN-1: hàng đợi theo Search Console (file CSV "Trang" anh tải từ GSC) ---
CSV_GSC = """Trang hàng đầu,Lượt nhấp,Số lần hiển thị,CTR,Vị trí
https://hieuban.com/kien-thuc/kinh-dich/que-47-khon,2,1200,0.17%,9.1
https://hieuban.com/kien-thuc/tu-vi/sao-tu-vi,40,1000,4%,3.2
https://hieuban.com/kien-thuc/than-so/so-7,30,700,4.3%,4
https://hieuban.com/lien-he,1,50,2%,20
"""


def test_hang_doi_theo_gsc(so_dang_ky, tmp_path):
    p = tmp_path / "gsc.csv"
    p.write_text(CSV_GSC, "utf-8")
    hd = td.hang_doi_gsc(p)
    # Bài đã duyệt (so-7) và trang ngoài kho (lien-he) bị bỏ; nhiều hiển thị mà ít nhấp đứng đầu.
    assert [x["slug"] for x in hd] == ["que-47-khon", "sao-tu-vi"]
    assert hd[0]["hien_thi"] == 1200 and hd[0]["nhap"] == 2 and hd[0]["vi_tri"] == 9.1


# --- DX-1: chủ biên duyệt xuất bản toàn kho (không phải thẩm định từng bài) ---
def test_duyet_xuat_ban_moi_trang_nhung_khong_doi_trang_thai():
    so = td._doc_so()
    assert so["duyet_xuat_ban"]["nguoi"] in so["chuyen_gia"]
    for t in trang.danh_sach()[:50]:
        p = trang.lay(t["loai"], t["slug"])
        assert p["duyet_xuat_ban"] == {"nguoi": "duc-luan", "ngay": so["duyet_xuat_ban"]["ngay"]}
    p = trang.lay("que", "que-1-can")
    assert p["tham_dinh"] is None and p["trang_thai"] != "da_duyet"   # duyệt xuất bản ≠ thẩm định


def test_ap_duyet_tu_phong_duyet(so_dang_ky, tmp_path, monkeypatch, capsys):
    import importlib.util
    spec = importlib.util.spec_from_file_location("ap_duyet", td._FILE.parents[3] / "scripts" / "ap_duyet.py")
    m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
    monkeypatch.setattr(td, "ghi", lambda so: None)
    (tmp_path / "a.json").write_text(json.dumps({"k": "que/que-47-khon", "kq": "dat", "luc": "2026-10-12T03:00:00Z",
                                                 "goc_nhin": GOC_NHIN}, ensure_ascii=False), "utf-8")
    (tmp_path / "b.json").write_text(json.dumps({"k": "sao/sao-tu-vi", "kq": "can_sua", "ghi_chu": "sửa câu 2",
                                                 "luc": "2026-10-12T03:00:00Z"}, ensure_ascii=False), "utf-8")
    monkeypatch.setattr(sys, "argv", ["ap_duyet.py", str(tmp_path)])
    m.main()
    assert so_dang_ky["trang"]["que/que-47-khon"]["ngay"] == "2026-10-12"
    assert so_dang_ky["trang"]["que/que-47-khon"]["goc_nhin"] == GOC_NHIN
    assert "sao/sao-tu-vi" not in so_dang_ky["trang"]
    assert "CẦN SỬA  sao/sao-tu-vi: sửa câu 2" in capsys.readouterr().out
