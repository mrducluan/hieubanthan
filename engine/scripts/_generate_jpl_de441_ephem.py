# -*- coding: utf-8 -*-
"""Tạo lại lưới lịch hành tinh `app/calc/data/jpl_de441_ephem.json` và golden `fixtures/golden/jpl_horizons_chiem_tinh.json`
từ dịch vụ công cộng NASA JPL Horizons (phạm vi công cộng, 17 U.S.C. § 105). Chỉ dùng thư viện chuẩn (urllib).

Máy phiên phát triển không tới được ssd.jpl.nasa.gov (proxy chặn) — chủ dự án chạy trên máy có mạng:

    cd engine
    python scripts/_generate_jpl_de441_ephem.py luoi   --ra /tmp/jpl_de441_ephem.json
    python scripts/_generate_jpl_de441_ephem.py golden --ra /tmp/jpl_horizons_chiem_tinh.json
    python scripts/_generate_jpl_de441_ephem.py so-sanh /tmp/jpl_de441_ephem.json app/calc/data/jpl_de441_ephem.json

Truy vấn Horizons (API https://ssd.jpl.nasa.gov/api/horizons.api, `format=json`):
  - EPHEM_TYPE='OBSERVER', CENTER='500@399' (tâm Trái Đất), QUANTITIES='31' = kinh độ / vĩ độ hoàng đạo BIỂU KIẾN
    (có thời gian truyền sáng, quang sai) theo xuân phân thật và hoàng đạo của ngày (true equinox & ecliptic of date).
  - TIME_TYPE='UT' — bảng đánh chỉ mục theo giờ UT (Horizons: UTC từ 1962, UT1 trước 1962). Đã kiểm trên phần dư so
    golden: đọc lưới theo UT thì Thuỷ / Kim tinh lệch trung bình 0,3″ / 0,2″, đọc theo TT thì 2,2″ / 2,7″ (lệch có hệ thống
    đúng bằng tốc độ × ΔT) → lưới hiện có là lưới UT; engine nội suy bằng `jd_ut`.
  - ANG_FORMAT='DEG', CSV_FORMAT='YES', EXTRA_PREC='YES', CAL_FORMAT='JD'.
  - START_TIME='JD 2424151.5' (1925-01-01 00:00 UT), STOP_TIME='JD 2470171.5' (2051-01-01 00:00 UT),
    STEP_SIZE theo thiên thể (ngày): Thuỷ 2 · Kim 4 · Hoả 5 · Mộc 10 · Thổ 15 · Thiên Vương / Hải Vương / Diêm Vương 20 ·
    Chiron 15 (COMMAND: 199, 299, 499, 599, 699, 799, 899, 999, 'DES=2060;').
Lưu trữ: kinh độ mở liên tục (unwrap) × 1000, làm tròn số nguyên (0,001° = 3,6″), mã hoá hiệu số (phần tử đầu là giá
trị tuyệt đối, sau là hiệu với nút trước) — đúng định dạng `chiem_tinh_lich._nap_jpl` đọc.

Golden: 36 mốc giờ lẻ (danh sách `MOC` dưới, giữ nguyên như tệp đang có) × Mặt Trời (10), Mặt Trăng (301) và 9 thiên thể
trên; TLIST theo JD UT. Bốn trạm giờ sao: QUANTITIES='7' (giờ sao biểu kiến địa phương), CENTER='coord@399',
COORD_TYPE='GEODETIC', SITE_COORD='<kinh độ đông>,<vĩ độ>,0'.
"""
from __future__ import annotations

import argparse
import datetime as dt
import json
import sys
import time
import urllib.parse
import urllib.request

API = "https://ssd.jpl.nasa.gov/api/horizons.api"
JD0, JD1 = 2424151.5, 2470171.5
THIEN_THE = {  # mã engine: (COMMAND Horizons, bước ngày)
    "thuy_tinh": ("199", 2), "kim_tinh": ("299", 4), "hoa_tinh": ("499", 5), "moc_tinh": ("599", 10),
    "tho_tinh": ("699", 15), "thien_vuong": ("799", 20), "hai_vuong": ("899", 20), "diem_vuong": ("999", 20),
    "chiron": ("DES=2060;", 15),
}
GOLDEN_THEM = {"mat_troi": "10", "mat_trang": "301"}
TRAM = (  # (mã, kinh độ đông, vĩ độ, giờ UTC)
    ("hanoi", 105.85, 21.0285, "1990-05-15T01:30:00Z"),
    ("hcmc", 106.7, 10.7769, "2026-11-27T03:35:00Z"),
    ("san_jose", -121.8863, 37.3382, "2000-01-01T12:00:00Z"),
    ("sydney", 151.2093, -33.8688, "2012-12-21T11:12:00Z"),
)


def _goi(tham_so: dict) -> str:
    q = {"format": "json", "MAKE_EPHEM": "YES", "OBJ_DATA": "NO", "EPHEM_TYPE": "OBSERVER", "TIME_TYPE": "UT",
         "ANG_FORMAT": "DEG", "CSV_FORMAT": "YES", "EXTRA_PREC": "YES", "CAL_FORMAT": "JD", **tham_so}
    url = API + "?" + urllib.parse.urlencode({k: f"'{v}'" for k, v in q.items()})
    for lan in range(5):
        try:
            with urllib.request.urlopen(url, timeout=120) as r:
                return json.loads(r.read().decode("utf-8"))["result"]
        except Exception:  # noqa: BLE001 — thử lại khi mạng chập chờn
            if lan == 4:
                raise
            time.sleep(3 * (lan + 1))
    raise RuntimeError("unreachable")


def _dong(ket_qua: str) -> list[list[str]]:
    a, b = ket_qua.index("$$SOE"), ket_qua.index("$$EOE")
    return [[x.strip() for x in d.split(",")] for d in ket_qua[a + 5:b].strip().splitlines() if d.strip()]


def _kinh_do(command: str, start: float, stop: float, buoc: int) -> list[tuple[float, float]]:
    """[(jd_ut, kinh độ 0–360)] — cột 0 = JD, hai cột số cuối của QUANTITIES 31 = ObsEcLon, ObsEcLat."""
    kq = _goi({"COMMAND": command, "CENTER": "500@399", "QUANTITIES": "31",
               "START_TIME": f"JD {start}", "STOP_TIME": f"JD {stop}", "STEP_SIZE": f"{buoc} d"})
    ra = []
    for c in _dong(kq):
        so = [x for x in c if x not in ("", "*", "C", "N", "A", "m")]
        ra.append((float(so[0]), float(so[-2])))
    return ra


def luoi(ra_tep: str) -> None:
    bodies = {}
    for ma, (cmd, buoc) in THIEN_THE.items():
        diem = []
        # Horizons giới hạn ~90.000 dòng mỗi lượt — chia theo khúc 20 năm
        s = JD0
        while s <= JD1:
            e = min(JD1, s + 7305 - (7305 % buoc))
            phan = _kinh_do(cmd, s, e, buoc)
            diem.extend(phan if not diem else [p for p in phan if p[0] > diem[-1][0]])
            s = e + buoc
        assert abs(diem[0][0] - JD0) < 1e-6 and abs(diem[-1][0] - JD1) < 1e-6, ma
        mo, truoc = [], None
        for _, lon in diem:
            if truoc is None:
                x = lon
            else:
                x = truoc + ((lon - truoc % 360.0 + 180.0) % 360.0) - 180.0
            mo.append(x)
            truoc = x
        md = [round(x * 1000.0) for x in mo]
        d_md = [md[0]] + [md[i] - md[i - 1] for i in range(1, len(md))]
        bodies[ma] = {"jd0": JD0, "step": buoc, "n": len(d_md), "d_mdeg": d_md}
        print(ma, len(d_md), file=sys.stderr)
    out = {
        "_nguon": NGUON_LUOI,
        "jd_min": JD0,
        "jd_max": JD1,
        "bodies": bodies,
    }
    with open(ra_tep, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, separators=(",", ":"))


NGUON_LUOI = (
    "NASA JPL Horizons System (DE441 & 2060 Chiron, Public Domain US Gov), EPHEM_TYPE='OBSERVER', CENTER='500@399', "
    "QUANTITIES='31' (geocentric apparent ecliptic longitude, true equinox & ecliptic of date), TIME_TYPE='UT' "
    "(grid indexed by UT: UTC from 1962, UT1 before). Nodes 1925-01-01 00:00 UT .. 2051-01-01 00:00 UT. Stored as "
    "unwrapped integer milli-degrees (0.001 deg = 3.6 arcsec), delta-encoded. Generator: "
    "engine/scripts/_generate_jpl_de441_ephem.py"
)


def _jd(iso: str) -> float:
    t = dt.datetime.strptime(iso, "%Y-%m-%dT%H:%M:%SZ")
    return 2451545.0 + (t - dt.datetime(2000, 1, 1, 12)).total_seconds() / 86400.0


def golden(ra_tep: str, moc_tu: str) -> None:
    cu = json.load(open(moc_tu, encoding="utf-8"))
    moc = cu["moc_thoi_gian"]
    tlist = " ".join(f"{_jd(m):.8f}" for m in moc)
    thien_the = {}
    for ma, cmd in {**GOLDEN_THEM, **{k: v[0] for k, v in THIEN_THE.items()}}.items():
        kq = _goi({"COMMAND": cmd, "CENTER": "500@399", "QUANTITIES": "31", "TLIST": tlist, "TLIST_TYPE": "JD"})
        dong = _dong(kq)
        assert len(dong) == len(moc), ma
        thien_the[ma] = {}
        for m, c in zip(moc, dong):
            so = [x for x in c if x not in ("", "*", "C", "N", "A", "m")]
            thien_the[ma][m] = {"lon": round(float(so[-2]), 5), "lat": round(float(so[-1]), 5)}
    tram = []
    for ten, kd, vd, iso in TRAM:
        kq = _goi({"COMMAND": "10", "CENTER": "coord@399", "COORD_TYPE": "GEODETIC", "SITE_COORD": f"{kd},{vd},0",
                   "QUANTITIES": "7", "TLIST": f"{_jd(iso):.8f}", "TLIST_TYPE": "JD"})
        c = [x for x in _dong(kq)[0] if x not in ("", "*", "C", "N", "A", "m")]
        h, mi, se = (float(x) for x in c[-1].split())
        tram.append({"tram": ten, "kinh_do": kd, "vi_do": vd, "utc": iso,
                     "last_deg_jpl": round((h + mi / 60 + se / 3600) * 15.0, 5)})
    out = {"_nguon": cu["_nguon"], "moc_thoi_gian": moc, "thien_the": thien_the, "sidereal_tram_quan_sat": tram}
    with open(ra_tep, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=2)


def so_sanh(moi: str, cu: str) -> None:
    a, b = json.load(open(moi)), json.load(open(cu))
    for ma in THIEN_THE:
        x, y = a["bodies"][ma]["d_mdeg"], b["bodies"][ma]["d_mdeg"]
        sx = sy = 0
        lech = 0
        for p, q in zip(x, y):
            sx += p
            sy += q
            lech = max(lech, abs(sx - sy))
        print(f"{ma}: {len(x)} / {len(y)} nút, lệch tối đa {lech} milli-độ")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("viec", choices=("luoi", "golden", "so-sanh"))
    ap.add_argument("tep", nargs="*")
    ap.add_argument("--ra")
    ap.add_argument("--moc", default="fixtures/golden/jpl_horizons_chiem_tinh.json")
    a = ap.parse_args()
    if a.viec == "luoi":
        luoi(a.ra)
    elif a.viec == "golden":
        golden(a.ra, a.moc)
    else:
        so_sanh(*a.tep)
