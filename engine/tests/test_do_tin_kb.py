# -*- coding: utf-8 -*-
"""KT-TT6 — sổ độ tin của kho tri thức: tệp nào cũng phải vào sổ; mức `nguyen_van` phải có kho nguồn + test thật."""
import json
import re
from pathlib import Path

from app.kb import do_tin

GOC = Path(__file__).parent.parent
DATA = GOC / "app" / "kb" / "data"


def test_moi_tep_kb_deu_vao_so_va_so_khong_thua():
    tep = {p.name for p in DATA.glob("*.json")}
    assert tep - set(do_tin.SO) == set(), "tệp KB mới chưa ghi mức độ tin trong app/kb/do_tin.py"
    assert set(do_tin.SO) - tep == set(), "sổ độ tin còn tệp đã xoá"


def test_muc_hop_le_va_phan_co_that():
    for d in do_tin.bang():
        assert d["muc"] in do_tin.THANG, d
        if d["phan"]:
            kb = json.loads((DATA / d["tep"]).read_text("utf-8"))
            assert d["phan"] in kb, (d["tep"], d["phan"])


def test_nguyen_van_phai_co_kho_nguon_va_test_that():
    co = 0
    for d in do_tin.bang():
        if d["muc"] != "nguyen_van":
            assert not d["kho"] and not d["test"], d
            continue
        co += 1
        assert (GOC / "fixtures" / "nguon" / d["kho"]).is_file(), d
        tep_test, ham = d["test"].split("::")
        ma = (GOC / tep_test).read_text("utf-8")
        assert re.search(rf"^def {re.escape(ham)}\(", ma, flags=re.M), d
    assert co >= 9


def test_bao_cao_trong_docs_khop_so():
    from scripts import do_tin_kb
    doc = (GOC.parent / "docs" / "DO-TIN-KHO-TRI-THUC.md").read_text("utf-8")
    assert doc == do_tin_kb.dung(), "chạy: PYTHONPATH=. python scripts/do_tin_kb.py"


def test_so_khong_lo_ra_api():
    from app.main import app
    for r in app.routes:
        assert "do-tin" not in getattr(r, "path", "") and "do_tin_kb" not in getattr(r, "path", "")


# ---- KY-LUAT-V2 (sửa review PR #373): mức `luat_tom_y` phải thật sự là "tóm ý có trang", không chứa nguyên văn Hán
_TRANG = re.compile(r"\btr\.\s*\d")
_HAN = re.compile(r"[㐀-鿿]+")
# Tên sách / tác giả được phép viết bằng chữ Hán (nơi dẫn nguồn, KHÔNG phải câu sách). Câu sách dài ngoài danh sách này → test đỏ.
_TEN_HAN_CHO_PHEP = {"紫雲", "斗數論命", "韋千里", "千里命稿", "王虎應", "增刪卜易評釋", "六爻分類預測斷語", "邵偉華", "周易預測學"}
# Quy tắc TỔNG HỢP cấp tệp (rút từ cả cuốn, không ứng một trang) — được miễn dòng trang; mọi mục cụ thể khác bắt buộc có trang.
_TONG_HOP_CAP_TEP = {"tuvi_phi_hoa_luong_672.json": {"quy_tac_hai_chieu"}, "tuvi_trung_chau_60_tinh_he.json": {"nguyen_tac_luan"}}
_KHOA_NOI_DUNG = ("y_chinh", "mat_tich_cuc", "huong_chuyen_hoa", "mat_tieu_cuc_can_chu_y")


def _tep_luat_tom_y() -> list[str]:
    return sorted(d["tep"] for d in do_tin.bang() if not d["phan"] and d["muc"] == "luat_tom_y")


def _muc_noi_dung(x, duong=()):
    """Mọi dict là một MỤC nội dung (có y_chinh / mat_tich_cuc…), kèm đường dẫn khoá."""
    if isinstance(x, dict):
        if any(k in x for k in _KHOA_NOI_DUNG):
            yield duong, x
        for k, v in x.items():
            yield from _muc_noi_dung(v, duong + (k,))
    elif isinstance(x, list):
        for i, v in enumerate(x):
            yield from _muc_noi_dung(v, duong + (str(i),))


def test_luat_tom_y_moi_muc_co_trang_doi_chieu():
    teps = _tep_luat_tom_y()
    assert len(teps) >= 4, teps
    for tep in teps:
        kb = json.loads((DATA / tep).read_text("utf-8"))
        n = 0
        for duong, m in _muc_noi_dung(kb):
            if duong[0] in _TONG_HOP_CAP_TEP.get(tep, ()):
                continue
            sg = m.get("sach_ghi") or {}
            tham_chieu = " ".join(str(v) for v in (m.get("trang"), sg.get("trang"), sg.get("nguon")) if v)
            assert _TRANG.search(tham_chieu), f"{tep} {'/'.join(duong)}: mức luat_tom_y mà không ghi số trang đối chiếu ('tr. N')"
            n += 1
        assert n >= 6, (tep, n)


def test_luat_tom_y_khong_chua_nguyen_van_han():
    for tep in _tep_luat_tom_y():
        raw = (DATA / tep).read_text("utf-8")
        for run in _HAN.findall(raw):
            assert run in _TEN_HAN_CHO_PHEP, f"{tep}: chuỗi Hán '{run}' không phải tên sách / tác giả — sách còn bản quyền chỉ được tóm ý"


def test_nhap_ai_cho_duyet_la_tep_ai_chua_duyet_moi_va_khong_lan_vao_luat_tom_y():
    ai = {d["tep"] for d in do_tin.bang() if not d["phan"] and d["muc"] == "nhap_ai_cho_duyet"}
    assert ai == {
        "su_vu_chien_thuat_kb.json",
        "tuong_menh_doi_chieu_kb.json",
        "thanso_da_phai_kb.json",
        "tarot_an_phu_nguoc_kb.json",
        "chiem_tinh_hanh_tinh_cung_kb.json", "chiem_tinh_cung_hoang_dao_kb.json",
        "chiem_tinh_nha_kb.json",
        "chiem_tinh_goc_chieu_kb.json",
        "chiem_tinh_van_han_kb.json",
        "chiem_tinh_hop_doi_kb.json",
        "astro_east_west_bridge_kb.json",
        "trach_nhat_hiep_ky_kb.json",
    }, ai   # thêm / bớt tệp = quyết định có chủ đích
    assert not ai & set(_tep_luat_tom_y())
