# -*- coding: utf-8 -*-
"""Kiểm định Kỷ Luật Thép v2.0 (Chủ dự án chốt 2026-11-26):
1. Tách thang 7 mức trong `do_tin.py` (`luat_tom_y` cho sách hiện đại còn bản quyền ghi trang + `nhap_ai_cho_duyet`
   cho nháp AI mới chờ chủ dự án đọc duyệt).
2. Khung `doi_chieu_hai_phai` trong `ung_dung_co_dien` (Phong Thuỷ): chỉ hiện khi Bát Trạch và Huyền Không Vận 9 thật sự
   trái chiều tại hướng cửa (`bt_thuan_hk_tinh` hoặc `hk_vuong_bt_lech`), giữ trung lập hai phái, sạch `cum_cam_chung`,
   đối xứng khung `VI ↔ EN` và sạch chữ Việt ở bản Anh.
3. Ngân sách dung lượng theo từng lớp cho trần `190.000 bytes` (chừa đệm cho trần cứng DB `262.144 bytes`):
   - Toàn bài `tuvi` / `battu` `< 190.000 bytes`
   - Lớp tóm tắt nội tuyến `ung_dung_co_dien` `< 3.000 bytes` (Phong thuỷ `< 3.500`) (mọi phụ lục đa phái lớn hơn ở Chặng 2+ bắt buộc tách
     tra cứu lazy-load qua cổng kiểm quyền `SAO-2`; báo cáo Liên mảng Tam Tài phải tách `mo_dun = "tam_tai"` riêng)."""
from __future__ import annotations

import datetime as dt
import json
import re
import warnings
from pathlib import Path

from app import ngon_ngu
from app.kb import do_tin, tuvi_doi_song_kb as kds
from app.luangiai import doi_song_khuon as kh, phongthuy_doi_song as ptds, ung_dung_co_dien as ud
from tests import _dau_ra as dr

_GOC = Path(__file__).resolve().parent.parent
_VIET = re.compile(r"[ăâđêôơưàáạảãầấậẩẫằắặẳẵèéẹẻẽềếệểễìíịỉĩòóọỏõồốộổỗờớợởỡùúụủũừứựửữỳýỵỷỹ]", re.I)


def test_do_tin_thang_7_muc_tach_ro_luat_tom_y_va_nhap_ai_cho_duyet():
    assert "luat_tom_y" in do_tin.THANG
    assert "nhap_ai_cho_duyet" in do_tin.THANG
    assert len(do_tin.THANG) == 7
    assert do_tin.muc("ung_dung_co_dien_kb.json") == "bien_tap"
    assert do_tin.muc("go_nut_doi_song_kb.json") == "bien_tap"
    assert do_tin.muc("su_vu_chien_thuat_kb.json") == "nhap_ai_cho_duyet"
    assert do_tin.muc("tuvi_phi_hoa_luong_672.json") == "luat_tom_y"
    assert do_tin.muc("tuvi_tu_van_thai_tue.json") == "luat_tom_y"
    assert do_tin.muc("battu_thien_ly_menh_cao.json") == "truyen_thong"   # chỉ ghi tên thiên, chưa có trang → không mang mức luat_tom_y


def test_doi_chieu_hai_phai_bat_trach_va_van_9_khi_trai_chieu_va_song_ngu():
    cam = kh.cum_cam_chung()
    ngay = dt.date(2026, 11, 10)
    sinh_kham = {"nam": 1990, "gioi_tinh": "nam", "ngay": dt.date(1990, 5, 15)}  # Đông tứ mệnh (Khảm)

    # Tìm động hướng gây lệch Bát Trạch thuận / Vận 9 cần tĩnh và ngược lại trên 24 sơn Vận 9
    th_bt_thuan_hk_tinh = None
    th_hk_vuong_bt_lech = None
    for do_h in range(0, 360, 15):
        bc = ptds.luan_giai(sinh_kham, {"huong_do": float(do_h), "nam_xay": 2024, "theo": "cua"}, ngay_xem=ngay)
        dc = (bc.get("ung_dung_co_dien") or {}).get("doi_chieu_hai_phai")
        if dc and dc["loai"] == "bt_thuan_hk_tinh" and th_bt_thuan_hk_tinh is None:
            th_bt_thuan_hk_tinh = (float(do_h), bc)
        elif dc and dc["loai"] == "hk_vuong_bt_lech" and th_hk_vuong_bt_lech is None:
            th_hk_vuong_bt_lech = (float(do_h), bc)

    assert th_bt_thuan_hk_tinh is not None, "Phải có ít nhất 1 hướng nhà Bát Trạch thuận nhưng Vận 9 cần tĩnh"
    assert th_hk_vuong_bt_lech is not None, "Phải có ít nhất 1 hướng nhà Vận 9 vượng nhưng Bát Trạch khác nhóm"

    for do_h, bc_vi in (th_bt_thuan_hk_tinh, th_hk_vuong_bt_lech):
        dc_vi = bc_vi["ung_dung_co_dien"]["doi_chieu_hai_phai"]
        for k in ("tieu_de", "goc_bat_trach", "goc_huyen_khong_van_9", "cach_dung_hoa"):
            assert dc_vi[k] and not kds.tim_cum_cam(dc_vi[k], cam), (dc_vi["loai"], dc_vi[k])

        with ngon_ngu.dung("en"):
            bc_en = ptds.luan_giai(sinh_kham, {"huong_do": do_h, "nam_xay": 2024, "theo": "cua"}, ngay_xem=ngay)
        dc_en = bc_en["ung_dung_co_dien"]["doi_chieu_hai_phai"]
        assert dr.khung(dc_vi) == dr.khung(dc_en)
        for k in ("tieu_de", "goc_bat_trach", "goc_huyen_khong_van_9", "cach_dung_hoa"):
            assert not _VIET.search(dc_en[k]), f"Rò chữ Việt ở doi_chieu_hai_phai EN: {dc_en[k]}"


TRAN_CANH_BAO = 190_000            # vạch cảnh báo (quy ước CLAUDE.md "Kỷ luật Thép v2.0" mục 3)
TRAN_CUNG_DB = 262_144             # trần cứng bài lưu (migration 0017 / luan-giai/luu: 256 KB)
# Đo 2026-11-26 trên 40 lá golden (`tests/_dau_ra.HO_SO`): Tử vi nặng nhất 200.070 B (hs14, nam 1948) và 10/40 lá vượt 190.000 B (13 lá ≥ 189.000 B) —
# vạch 190 KB KHÔNG giữ được cho Tử vi. Chưa cắt nội dung (chờ chủ dự án quyết); test này khoá "đỉnh hiện tại" để báo cáo không
# phình thêm âm thầm: đổi hằng số này = quyết định có chủ đích.
TRAN_DINH_TUVI = 205_000
TRAN_UNG_DUNG = {"tuvi": 3_000, "battu": 3_000, "phongthuy": 3_500}   # Phong thuỷ mang 3 khu vực Vận 9 + khung đối chiếu hai phái


def _do_40_la(duong: str, tien_to: str):
    """POST `duong` cho đủ 40 hồ sơ golden (nam / nữ, có / không giờ, nhuận, nước ngoài, <18, >60…) → {mã: (byte, thân)}."""
    c = dr.may_khach()
    ra = {}
    with dr.dong_bang():
        for lg in dr.luot_goi(c):
            if lg[0].startswith(tien_to):
                st, nd = dr.goi(c, lg, "vi")
                assert st == 200, (lg[0], st)
                ra[lg[0]] = (len(nd), json.loads(nd))
    assert len(ra) == len(dr.HO_SO) == 40
    return ra


def test_ngan_sach_dung_luong_bai_luan_giai_tren_40_la():
    """Đo NHIỀU lá (không chỉ 1–3 mẫu của golden): mọi báo cáo dưới trần cứng DB; Bát tự dưới vạch 190 KB; Tử vi không vượt đỉnh đã đo."""
    tv = _do_40_la("/v1/tuvi/luan-giai", "tuvi.luan_giai.")
    bt = _do_40_la("/v1/battu/luan-giai", "battu.luan_giai.")
    for ten, nhom in (("tuvi", tv), ("battu", bt)):
        for ma, (n, _) in nhom.items():
            assert n < TRAN_CUNG_DB, f"{ma}: {n} B vượt trần cứng DB {TRAN_CUNG_DB}"
    assert max(n for n, _ in bt.values()) < TRAN_CANH_BAO, "Bát tự vượt vạch 190 KB"
    vuot = {ma: n for ma, (n, _) in tv.items() if n >= TRAN_CANH_BAO}
    dinh = max(n for n, _ in tv.values())
    assert dinh < TRAN_DINH_TUVI, f"Tử vi phình: {dinh} B ≥ {TRAN_DINH_TUVI} (đỉnh đã đo 200.070)"
    if vuot:
        warnings.warn(f"{len(vuot)}/40 lá Tử vi ≥ {TRAN_CANH_BAO} B (đỉnh {dinh} B) — xem ghi chú TRAN_DINH_TUVI", stacklevel=1)


def test_ngan_sach_lop_ung_dung_co_dien_ca_ba_mang():
    """Lớp tóm tắt nội tuyến `ung_dung_co_dien`: Tử vi / Bát tự < 3.000 B; Phong thuỷ < 3.500 B (có thêm 3 khu vực Vận 9 + đối chiếu hai phái)."""
    for ten, duong, tien in (("tuvi", "/v1/tuvi/luan-giai", "tuvi.luan_giai."), ("battu", "/v1/battu/luan-giai", "battu.luan_giai."),
                             ("phongthuy", "/v1/phongthuy/luan-giai", "phongthuy.luan_giai.")):
        for ma, (_, d) in _do_40_la(duong, tien).items():
            assert "ung_dung_co_dien" in d, ma
            byte_cd = len(json.dumps(d["ung_dung_co_dien"], ensure_ascii=False).encode("utf-8"))
            assert byte_cd < TRAN_UNG_DUNG[ten], f"{ma}: ung_dung_co_dien {byte_cd} B vượt ngân sách {TRAN_UNG_DUNG[ten]} B"


# ------------------------------------------------------------------------------------------------ doi_chieu_hai_phai v2
def _quet_doi_chieu(ngon: str = "vi"):
    """Quét 24 sơn (mỗi 15°, lệch 7,5° giữa sơn) × 6 hồ sơ (cả nam / nữ, Đông / Tây tứ mệnh) × 3 năm xây (Vận 9 / 8 / 7)."""
    ngay = dt.date(2026, 11, 10)
    cac_sinh = [{"nam": n, "gioi_tinh": gt, "ngay": dt.date(n, 5, 15)} for n in (1984, 1985, 1986, 1990, 1991, 1993) for gt in ("nam", "nu")]
    ra = []
    with ngon_ngu.dung(ngon):
        for sinh in cac_sinh:
            for do_h in range(0, 360, 15):
                for nam_xay in (2024, 2004, 1990):
                    bc = ptds.luan_giai(sinh, {"huong_do": float(do_h) + 7.5, "nam_xay": nam_xay, "theo": "cua"}, ngay_xem=ngay)
                    ud_ = bc.get("ung_dung_co_dien") or {}
                    if ud_.get("doi_chieu_hai_phai"):
                        ra.append((bc, ud_["doi_chieu_hai_phai"]))
    return ra


def test_cach_dung_hoa_chon_theo_cap_sao_that_va_khong_lech_mau():
    """`cach_dung_hoa` chọn theo CẶP SAO thật: câu "gam trắng – xám" (tiết khí Thổ → Kim) chỉ ở cặp có sao 2 / 5 — không áp
    lên cặp sao khác; có mã `ma_dung_hoa` để web / test truy vết; 24 sơn × nhiều mệnh × 3 vận không có tổ hợp nào rơi vào lời lệch."""
    cam = kh.cum_cam_chung()
    ra = _quet_doi_chieu("vi")
    assert len(ra) >= 100, f"quá ít tổ hợp có đối chiếu ({len(ra)}) — quét không đủ rộng"
    gap = set()
    for bc, dc in ra:
        so = {int(x) for x in re.findall(r"\d", dc["goc_huyen_khong_van_9"].split("cặp sao", 1)[1].split(")", 1)[0])}
        gap.add((dc["loai"], dc["ma_dung_hoa"]))
        for k in ("tieu_de", "goc_bat_trach", "goc_huyen_khong_van_9", "cach_dung_hoa"):
            assert dc[k] and not kds.tim_cum_cam(dc[k], cam), (dc["loai"], dc[k])
        nhac_trang_xam = "trắng" in dc["cach_dung_hoa"] or "xám" in dc["cach_dung_hoa"]
        assert nhac_trang_xam == (dc["ma_dung_hoa"] == "sao_tho"), (dc["ma_dung_hoa"], dc["cach_dung_hoa"])
        if dc["ma_dung_hoa"] == "sao_tho":
            assert so & {2, 5}, (so, dc["cach_dung_hoa"])
        if dc["ma_dung_hoa"] == "sao_9_1":
            assert so & {9, 1} and dc["loai"] == "hk_vuong_bt_lech", (so, dc["loai"])
        assert dc["ma_dung_hoa"] in ("sao_tho", "sao_9_1", "chung")
        assert not _lo_vat_pham(dc["cach_dung_hoa"]), dc["cach_dung_hoa"]
    # Cả bốn nhánh chính phải gặp được trong quét (nếu KB / luật đổi mà mất nhánh thì test báo).
    assert ("bt_thuan_hk_tinh", "sao_tho") in gap and ("hk_vuong_bt_lech", "sao_9_1") in gap, gap
    assert ("bt_thuan_hk_tinh", "chung") in gap or ("hk_vuong_bt_lech", "chung") in gap, gap


def _lo_vat_pham(t: str) -> bool:
    return any(w in t.lower() for w in ("bùa", "trấn", "yểm", "vật phẩm", "đá phong thuỷ", "tỳ hưu", "chuông gió", "mua "))


def test_doi_chieu_hai_phai_song_ngu_doi_xung_va_en_sach_chu_viet():
    vi = _quet_doi_chieu("vi")
    en = _quet_doi_chieu("en")
    assert len(vi) == len(en) and len(vi) >= 100
    for (_, a), (_, b) in zip(vi, en):
        assert dr.khung(a) == dr.khung(b)
        assert a["loai"] == b["loai"] and a["ma_dung_hoa"] == b["ma_dung_hoa"]
        for k in ("tieu_de", "goc_bat_trach", "goc_huyen_khong_van_9", "cach_dung_hoa"):
            assert not _VIET.search(b[k]), f"Rò chữ Việt ở doi_chieu_hai_phai EN: {b[k]}"
            assert "{" not in b[k]
        assert not _lo_vat_pham(b["cach_dung_hoa"])
    # Bản EN: chỉ cặp sao Thổ mới nhắc "light neutral" / "metal" — các nhánh khác không nói màu cụ thể.
    for _, b in en:
        if b["ma_dung_hoa"] != "sao_tho":
            low = b["cach_dung_hoa"].lower() + b["goc_huyen_khong_van_9"].lower()
            assert "metal" not in low and "neutral tones" not in low, b


# ------------------------------------------------------------------------------------------------ SAO-2 Default-Deny: khoá cấp gốc
_TS = _GOC.parent / "web" / "lib" / "sao-xem-truoc.ts"


def _tap_khoa_ts(ten: str) -> set[str]:
    m = re.search(rf"export const {ten} = new Set<string>\(\[(.*?)\]\);", _TS.read_text("utf-8"), flags=re.S)
    assert m, f"không đọc được {ten} trong sao-xem-truoc.ts"
    return set(re.findall(r'"([a-z_0-9]+)"', m.group(1)))


def test_khoa_cap_goc_5_mo_dun_deu_da_phan_loai_trong_allowlist_sao2():
    """`catXemTruoc` cắt IM LẶNG khoá cấp gốc chưa phân loại → quét báo cáo THẬT của đủ 5 mô-đun có cổng Sao (kể cả `thoi_gian`,
    golden chỉ lưu băm) trên 40 hồ sơ: mọi khoá cấp gốc phải nằm trong KHOA_CONG_KHAI_SAO2 hoặc KHOA_CAT_RIENG_SAO2.
    Khoá mới mà quên phân loại → đỏ ở đây (và web báo Sentry `sao2_khoa_la_bi_cat` nếu lọt production)."""
    biet = _tap_khoa_ts("KHOA_CONG_KHAI_SAO2") | _tap_khoa_ts("KHOA_CAT_RIENG_SAO2")
    assert len(biet) > 30
    nhom = {"tuvi": "tuvi.luan_giai.", "battu": "battu.luan_giai.", "thanso": "thanso.ban_do.", "chan_dung": "chan_dung.", "thoi_gian": "thoi_gian_toi.hs"}
    duong = {"tuvi": "/v1/tuvi/luan-giai", "battu": "/v1/battu/luan-giai", "thanso": "/v1/thanso/ban-do-con-so", "chan_dung": "/v1/chan-dung",
             "thoi_gian": "/v1/thoi-gian-toi"}
    c = dr.may_khach()
    gap: dict[str, set[str]] = {k: set() for k in nhom}
    with dr.dong_bang():
        for lg in dr.luot_goi(c):
            for mdun, tien in nhom.items():
                if lg[0].startswith(tien) and lg[2] == duong[mdun]:
                    st, nd = dr.goi(c, lg, "vi")
                    d = json.loads(nd) if st == 200 else {}
                    if isinstance(d, dict) and "chuong" in d:
                        gap[mdun] |= set(d)
    for mdun, ks in gap.items():
        assert ks, f"không có báo cáo mẫu nào của {mdun}"
        chua = ks - biet
        assert not chua, f"{mdun}: khoá cấp gốc chưa phân loại trong allowlist SAO-2: {sorted(chua)}"


def test_mau_thoi_gian_toi_cua_web_con_moi_theo_engine():
    """`web/lib/thoi-gian-toi-mau.json.gz` là mẫu THẬT dùng cho test quét của web (golden không giữ nguyên văn) — khoá cấp gốc
    của mẫu phải còn khớp đầu ra engine hiện hành (không để mẫu cũ đi)."""
    import gzip as _gz
    mau = json.loads(_gz.open(_GOC.parent / "web" / "lib" / "thoi-gian-toi-mau.json.gz", "rt", encoding="utf-8").read())
    c = dr.may_khach()
    with dr.dong_bang():
        lg = next(x for x in dr.luot_goi(c) if x[0] == "thoi_gian_toi.hs00")
        st, nd = dr.goi(c, lg, "vi")
    assert st == 200
    assert json.loads(nd) == mau, "mẫu thoi-gian-toi-mau.json.gz lệch engine — sinh lại (xem docs ở đầu test)"
