# -*- coding: utf-8 -*-
"""Rà vòng HỌC (2026-10-22): MỌI mã kiểm chứng engine thực sự sinh ra (hoặc web dựng từ dữ kiện engine) phải được hàm SQL
`kiem_chung_ma_hop_le` nhận — nếu không, `ghi_kiem_chung` trả false và phiếu mất âm thầm (người dùng vẫn thấy "Cảm ơn").

Nguồn sự thật phía DB = định nghĩa `kiem_chung_ma_hop_le` MỚI NHẤT trong supabase/migrations (đọc thẳng tệp SQL: các hằng
`c_* constant text[]`, mảng nội dòng, regex `doi_song` / phái `hai_nguoi`). Test dựng lại hàm đó bằng Python (`_hop_le`) rồi:
  * liệt kê mã của: Tử vi đời sống (60 lá golden), Bát tự đời sống (golden), Thần số "Bản đồ con số", "Xem lá số 2 người"
    (`hn.*`), phi hoá (mã web `maPhiHoa` dựng từ `noi_bat`), nhịp 3 tháng (mã web `maNhip`) — mọi phái lưu nguyệt;
  * so danh mục SQL với hằng số engine HAI CHIỀU (phái lưu nguyệt, 12 cung, loại `hn.*` có thể thành hộp);
  * so regex web (`web/lib/kiem-chung.ts`, route `/api/kiem-chung`) với SQL.
Có Postgres đã chạy migration (job CI `sao-that`, hoặc cục bộ) → đặt `KIEM_CHUNG_PGDB=<tên DB>` (+ biến libpq PGHOST…)
để chạy CHÍNH hàm SQL trên mọi mã (`test_sql_that_nhan_moi_ma`)."""
from __future__ import annotations

import datetime as dt
import itertools
import json
import os
import random
import re
import shutil
import subprocess
import unicodedata
from pathlib import Path

import pytest

from app.calc import tuvi_an_sao as az
from app.calc import tuvi_luu_nguyet as ln
from app.hoidap.tuvi import tom_tat
from app.luangiai import ban_do_con_so as bd
from app.luangiai import toan_bo
from app.luangiai import tuvi_hai_nguoi as hn
from app.luangiai import tuvi_nhip_3_thang as nhip
from app.luangiai import tuvi_phi_hoa

GOC = Path(__file__).resolve().parents[2]
MIG = GOC / "supabase" / "migrations"
GOLDEN = Path(__file__).resolve().parents[1] / "fixtures" / "golden"
XEM = dt.date(2026, 10, 21)
CUNG = ("Mệnh", "Huynh Đệ", "Phu Thê", "Tử Nữ", "Tài Bạch", "Tật Ách", "Thiên Di", "Nô Bộc", "Quan Lộc",
        "Điền Trạch", "Phúc Đức", "Phụ Mẫu")


# ------------------------------------------------------------------ đọc SQL
def _sql_moi_nhat() -> tuple[str, str]:
    """(tên tệp, thân hàm) — định nghĩa `kiem_chung_ma_hop_le` của migration số lớn nhất (bỏ .down)."""
    tep = sorted(p for p in MIG.glob("*.sql") if not p.name.endswith(".down.sql")
                 and "function kiem_chung_ma_hop_le" in p.read_text("utf-8"))
    assert tep, "Không thấy kiem_chung_ma_hop_le trong supabase/migrations"
    s = tep[-1].read_text("utf-8")
    than = s[s.index("function kiem_chung_ma_hop_le"):]
    return tep[-1].name, than[: than.index("\n$$;")]


def _loai_sql() -> set[str]:
    """Ràng buộc `loai` mới nhất (inline 0017 hoặc `kiem_chung_phieu_loai_check` ở migration sau)."""
    ra = None
    for p in sorted(MIG.glob("*.sql")):
        if p.name.endswith(".down.sql"):
            continue
        for m in re.finditer(r"check \(loai in \(([^)]*)\)\)", p.read_text("utf-8")):
            ra = set(re.findall(r"'([a-z0-9_]+)'", m.group(1)))
    assert ra
    return ra


TEN_TEP, THAN = _sql_moi_nhat()
HANG = {k: re.findall(r"'([^']*)'", v) for k, v in
        re.findall(r"(c_\w+) constant text\[\] := array\[(.*?)\];", THAN, re.S)}
NHANH = {m.group(1): m.group(2) for m in
         re.finditer(r"p_loai = '([a-z_0-9]+)' then(.*?)(?=elsif p_loai|end if;)", THAN, re.S)}
LOAI_SQL = _loai_sql()


def _mang(nhanh: str, chi_so: int) -> list[str]:
    m = re.search(rf"v\[{chi_so}\] = any \(array\[(.*?)\]\)", NHANH[nhanh])
    return re.findall(r"'([^']*)'", m.group(1))


def _re(nhanh: str, bien: str) -> re.Pattern:
    return re.compile(re.search(rf"{bien} ~ '([^']*)'", NHANH[nhanh]).group(1))


def _hop_le(loai: str, mau: str, phai: str) -> bool:
    """Dựng lại `kiem_chung_ma_hop_le` (Python) từ đúng các hằng / regex trong tệp SQL."""
    if loai not in LOAI_SQL or not re.fullmatch(r"[a-z0-9_.+-]{3,60}", mau) or not re.fullmatch(r"[a-z0-9_]{2,32}", phai):
        return False
    v = mau.split(".")
    if loai == "phi_hoa":
        return (phai == "phi_tinh" and len(v) == 4 and v[0] in _mang("phi_hoa", 1) and v[1] in HANG["c_cung"]
                and v[2] in _mang("phi_hoa", 3) and v[3] in HANG["c_cung"] + ["tu"])
    if loai == "nhip_3_thang":
        return (phai in HANG["c_phai_nhip"] and len(v) == 2 and v[0] in _mang("nhip_3_thang", 1)
                and (v[1] == "-" or set(v[1].split("+")) <= set(re.findall(
                    r"'([a-z]+)'", re.search(r"<@ array\[(.*?)\]", NHANH["nhip_3_thang"]).group(1)))))
    if loai == "doi_song":
        return bool(_re("doi_song", "p_mau").search(mau))
    if loai == "hai_nguoi":
        return (bool(_re("hai_nguoi", "p_phai").search(phai)) and len(v) == 4 and v[0] == "hn"
                and v[3] in HANG["c_hn_quan_he"] and f"c_hn_{v[1]}" in HANG and v[2] in HANG[f"c_hn_{v[1]}"])
    return False


# ------------------------------------------------------------------ mã web dựng (chép web/lib/kiem-chung.ts — test so khớp)
def ma_chu(s: str) -> str:
    """= `maChu` (web): bỏ dấu, đ → d, thường, cụm khác [a-z0-9] → "_"."""
    s = unicodedata.normalize("NFD", s)
    s = "".join(c for c in s if not 0x300 <= ord(c) <= 0x36F).replace("đ", "d").replace("Đ", "d").lower()
    return re.sub(r"[^a-z0-9]+", "_", s).strip("_")


LY_DO_NGAN = {"chong_ky": "ck", "ky_xung_cung_chinh": "kx", "khoa_giai": "kg", "loc_nhap_cung_chinh": "ln",
              "song_loc": "sl", "ky_nhap_cung_chinh": "kn"}


def ma_phi_hoa(n: dict) -> str:
    d = n["duong"]
    den = "tu" if d["tu_hoa"] else ma_chu(d["den_cung"] or "khong")
    return ".".join([ma_chu(n["loai"]), ma_chu(d["tu_cung"]), ma_chu(d["hoa"]), den])


def ma_nhip(t: dict) -> str:
    ly = sorted({LY_DO_NGAN.get(x["ma"], "x") for x in t["ly_do"]})
    return f"{ma_chu(t['muc'])}.{'+'.join(ly) if ly else '-'}"


def test_web_chep_dung():
    ts = (GOC / "web" / "lib" / "kiem-chung.ts").read_text("utf-8")
    for k, v in LY_DO_NGAN.items():
        assert f"{k}: \"{v}\"" in ts, k
    assert ma_chu("Điền Trạch") == "dien_trach" and ma_chu("Quan Lộc") == "quan_loc" and ma_chu("Kỵ") == "ky"


# ------------------------------------------------------------------ liệt kê mã engine
def _ma_trong(x, ra: set[str]) -> set[str]:
    """Mọi `ma_mau` ở bất kỳ độ sâu nào (hộp chương, cốt lõi, dòng vận hạn…)."""
    if isinstance(x, dict):
        if isinstance(x.get("ma_mau"), str):
            ra.add(x["ma_mau"])
        for v in x.values():
            _ma_trong(v, ra)
    elif isinstance(x, list):
        for v in x:
            _ma_trong(v, ra)
    return ra


_G60 = json.loads((GOLDEN / "lasotuvi_60.json").read_text("utf-8"))["cases"]
_GBT = json.loads((GOLDEN / "battu_doi_song.json").read_text("utf-8"))["cases"]


def _sinh_tv(ca: dict) -> dict:
    return {"ngay": dt.date.fromisoformat(ca["ngay"]), "ti": ca["ti"], "gioi_tinh": ca["gioi_tinh"]}


@pytest.fixture(scope="module")
def phieu() -> dict[str, set[tuple[str, str]]]:
    """loai → {(mã, phái)} đúng như web gửi lên /api/kiem-chung."""
    ra: dict[str, set[tuple[str, str]]] = {"doi_song": set(), "phi_hoa": set(), "nhip_3_thang": set(),
                                           "hai_nguoi": set()}
    for ca in _G60:                                   # Tử vi đời sống: web lấy bc.phai, thiếu → nam_phai_viet
        b = toan_bo.tuvi(_sinh_tv(ca), ngay_xem=XEM)
        ra["doi_song"] |= {(m, b.get("phai") or "nam_phai_viet") for m in _ma_trong(b, set())}
    for ca in _GBT:
        b = toan_bo.battu({"lich": dt.datetime.fromisoformat(ca["lich"]), "gioi_tinh": ca["gioi_tinh"],
                           "gio_ty": ca.get("gio_ty", "da_ty")}, ngay_xem=XEM)
        ra["doi_song"] |= {(m, b.get("phai") or "tu_binh") for m in _ma_trong(b, set())}
    rd = random.Random(20261022)
    for _ in range(40):
        y = rd.randint(1940, 2015)
        b = bd.bao_cao([rd.choice(["Nguyễn Văn An", "Trần Thị Bích Ngọc", "Lê Minh", "Phạm Quốc Huy"])],
                       rd.randint(1, 28), rd.randint(1, 12), y, XEM, rd.choice(["tong_het", "tung_phan"]))
        ra["doi_song"] |= {(m, b.get("phai") or "pitago") for m in _ma_trong(b, set())}
    for ca in _G60[::2]:                              # phi hoá: mã web maPhiHoa(noi_bat), phái cố định phi_tinh
        la = az.an_sao_tho(dt.date.fromisoformat(ca["ngay"]), ca["ti"], ca["gioi_tinh"], "vi-VN")
        can = str(la.get("chineseDate", "")).split(" ")[0]
        kq = tuvi_phi_hoa.lap(tom_tat(la), can)
        ra["phi_hoa"] |= {(ma_phi_hoa(n), "phi_tinh") for n in kq["noi_bat"]}
    for ca, phai in zip(_G60[:20], itertools.cycle(ln.PHAI)):   # nhịp: maNhip(tháng), phái = phai_luu_nguyet
        for ngay in (XEM, dt.date(2025, 3, 1), dt.date(2023, 7, 15)):
            kq = nhip.lap(_sinh_tv(ca), ngay, phai)
            ra["nhip_3_thang"] |= {(ma_nhip(t), kq["phai_luu_nguyet"]) for t in kq["thang"]}
    for _ in range(1500):                             # Xem lá số 2 người: phái = phien_ban của điểm
        ban = {"nam_am": rd.randint(1930, 2015), "gioi_tinh": rd.choice(["nam", "nu", None])}
        kia = {"nam_am": rd.randint(1930, 2015), "gioi_tinh": rd.choice(["nam", "nu", None])}
        duong = [{"hoa": h, "sao": "", "den_cung": rd.choice(CUNG), "xung_cung": rd.choice(CUNG)}
                 for h in ("Lộc", "Quyền", "Khoa", "Kỵ")]
        r = hn.cham_diem(ban, kia, rd.choice(list(hn.CUNG_TRONG_TAM)), duong)
        ra["hai_nguoi"] |= {(h["ma_mau"], r["phien_ban"]) for h in r["diem_manh"] + r["can_dung_hoa"]}
    return ra


def test_moi_ma_engine_duoc_sql_nhan(phieu):
    for loai, ds in phieu.items():
        assert ds, loai
        sai = sorted((m, p) for m, p in ds if not _hop_le(loai, m, p))
        assert not sai, f"{TEN_TEP}: {loai} từ chối {len(sai)} mã, vd {sai[:5]}"


def test_du_loai_ma(phieu):
    """Mỗi tiền tố mảng đều có mặt (thiếu = một mảng ngừng sinh mã mà không ai biết)."""
    ds = {m for m, _ in phieu["doi_song"]}
    for tien_to in ("ds.tong_quan.", "ds.van_han.", "ds.bt.", "ds.bt.van_han.", "ds.thanso."):
        assert any(m.startswith(tien_to) for m in ds), tien_to
    assert {p for _, p in phieu["doi_song"]} == {"nam_phai_viet", "tu_binh", "pitago"}
    assert {p for _, p in phieu["nhip_3_thang"]} == set(ln.PHAI)
    assert {p for _, p in phieu["hai_nguoi"]} == {hn.PHIEN_BAN_DIEM}


def test_hai_nguoi_moi_ma_co_the_co_deu_xuat_hien(phieu):
    """Danh mục SQL `c_hn_*` không thừa: mọi (tiêu chí, loại) cho phép đều gặp trong 1.500 cặp ngẫu nhiên."""
    gap = {tuple(m.split(".")[1:3]) for m, _ in phieu["hai_nguoi"]}
    cho = {(k[len("c_hn_"):], x) for k, v in HANG.items() if k.startswith("c_hn_") and k != "c_hn_quan_he" for x in v}
    assert gap == cho


# ------------------------------------------------------------------ danh mục SQL ↔ hằng số engine (hai chiều)
def test_hai_nguoi_danh_muc_khop_engine():
    """Loại có thể thành HỘP = loại có tỉ lệ cho kết luận "hop" hoặc "can_dung_hoa" (luật `hai_nguoi_1`)."""
    def co_hop(ty: float) -> bool:
        return hn._ket_luan(hn._ty4(ty)) in ("hop", "can_dung_hoa")

    ky_vong = {
        "menh": {k for k, v in hn.TY_MENH.items() if co_hop(v)},
        "can": {k for k, v in hn.TY_CAN.items() if co_hop(v)},
        "chi": {k for k, v in hn.TY_CHI.items() if co_hop(v)},
        "cung_phi": {hn._slug(k) for k, v in hn.TY_CUNG_PHI.items() if co_hop(v)},
        "tu_vi": {"hop", "can_dung_hoa"},
    }
    assert set(ky_vong) == set(hn.TRONG_SO)
    for tc, ds in ky_vong.items():
        assert set(HANG[f"c_hn_{tc}"]) == ds, tc
    assert set(HANG["c_hn_quan_he"]) == set(hn.CUNG_TRONG_TAM)
    assert _re("hai_nguoi", "p_phai").fullmatch(hn.PHIEN_BAN_DIEM)


def test_phai_nhip_va_cung_khop_engine():
    assert set(HANG["c_phai_nhip"]) == set(ln.PHAI)
    assert set(HANG["c_cung"]) == {ma_chu(c) for c in CUNG}
    assert set(_mang("nhip_3_thang", 1)) == {"thuan", "binh", "can_than"}


def test_web_regex_va_loai_khop_sql():
    ts = (GOC / "web" / "lib" / "kiem-chung.ts").read_text("utf-8")
    web_ds = re.search(r"export const MA_DOI_SONG = /(.*?)/;", ts).group(1)
    assert web_ds == _re("doi_song", "p_mau").pattern
    route = (GOC / "web" / "app" / "api" / "kiem-chung" / "route.ts").read_text("utf-8")
    loai_web = set(re.findall(r'"([a-z_0-9]+)"', re.search(r"loai: z\.enum\(\[(.*?)\]\)", route).group(1)))
    assert loai_web == LOAI_SQL
    assert set(NHANH) == LOAI_SQL


# ------------------------------------------------------------------ chạy CHÍNH hàm SQL (khi có Postgres đã migrate)
@pytest.mark.skipif(not os.environ.get("KIEM_CHUNG_PGDB") or not shutil.which("psql"),
                    reason="cần KIEM_CHUNG_PGDB + psql (job CI sao-that đặt sẵn)")
def test_sql_that_nhan_moi_ma(phieu):
    hang = [(loai, m, p) for loai, ds in phieu.items() for m, p in ds]
    hang += [("doi_song", "ds.thanso", "pitago"), ("hai_nguoi", "hn.menh.binh_hoa.nguoi_yeu", "hai_nguoi_1"),
             ("hai_nguoi", "hn.menh.tuong_sinh.nguoi_yeu.1990", "hai_nguoi_1"), ("hai_nguoi", "hn.can.tuong_sinh.ke_thu",
                                                                                 "hai_nguoi_1")]
    gia_tri = ",\n".join(f"('{a}', '{b}', '{c}')" for a, b, c in hang)
    sql = (f"select l || ' ' || m || ' ' || p || ' ' || public.kiem_chung_ma_hop_le(l, m, p)::text "
           f"from (values {gia_tri}) v(l, m, p);")
    out = subprocess.run(["psql", "-d", os.environ["KIEM_CHUNG_PGDB"], "-At", "-v", "ON_ERROR_STOP=1", "-f", "-"],
                         input=sql, capture_output=True, text=True, timeout=120, check=True).stdout.split("\n")
    kq = {tuple(x.split(" ")[:3]): x.endswith("true") for x in out if x.strip()}
    assert len(kq) == len(set(hang))
    sai = [k for k, v in kq.items() if v != _hop_le(*k)]
    assert not sai, f"SQL thật khác bản dựng lại: {sai[:5]}"
    assert not kq[("doi_song", "ds.thanso", "pitago")]
    assert not kq[("hai_nguoi", "hn.menh.binh_hoa.nguoi_yeu", "hai_nguoi_1")]
